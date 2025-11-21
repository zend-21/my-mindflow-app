// 워크스페이스 관리 서비스
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { sanitizeInput } from '../utils/securityUtils';

/**
 * 고유한 워크스페이스 코드 생성 (형식: WS-XXXXXX)
 * 6자리 = 36^6 = 21억 개 가능
 */
const generateWorkspaceCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WS-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * 워크스페이스 코드 중복 확인
 */
const isWorkspaceCodeUnique = async (code) => {
  try {
    const q = query(
      collection(db, 'workspaces'),
      where('workspaceCode', '==', code)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('워크스페이스 코드 중복 확인 오류:', error);
    return false;
  }
};

/**
 * 고유한 워크스페이스 코드 생성 (중복 체크 포함)
 */
const generateUniqueWorkspaceCode = async () => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateWorkspaceCode();
    isUnique = await isWorkspaceCodeUnique(code);
    attempts++;
  }

  if (!isUnique) {
    throw new Error('고유한 워크스페이스 코드 생성 실패');
  }

  return code;
};

/**
 * 사용자의 워크스페이스 생성 (회원가입 시 자동 생성)
 */
export const createWorkspace = async (userId, userName, userEmail) => {
  try {
    // 입력값 검증
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 이미 워크스페이스가 있는지 확인
    const workspaceId = `workspace_${userId}`;
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const existingWorkspace = await getDoc(workspaceRef);

    if (existingWorkspace.exists()) {
      console.log('워크스페이스가 이미 존재합니다.');
      return { success: true, workspaceId, data: existingWorkspace.data() };
    }

    // 고유 워크스페이스 코드 생성
    const workspaceCode = await generateUniqueWorkspaceCode();

    // 사용자명 sanitize
    const sanitizedName = sanitizeInput(userName || '사용자');

    // 워크스페이스 데이터 생성
    const workspaceData = {
      workspaceId,
      ownerId: userId,
      ownerName: sanitizedName,
      ownerEmail: userEmail || '',
      workspaceCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      settings: {
        allowGuestView: true, // 워크스페이스 코드로 접근한 사람이 공개방 볼 수 있는지
        description: '', // 워크스페이스 설명
      },
      stats: {
        totalRooms: 0,
        publicRooms: 0,
        privateRooms: 0,
      }
    };

    // Firestore에 저장
    await setDoc(workspaceRef, workspaceData);

    console.log('워크스페이스 생성 완료:', workspaceId);
    return { success: true, workspaceId, data: workspaceData };

  } catch (error) {
    console.error('워크스페이스 생성 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 정보 가져오기 (ID로 조회)
 */
export const getWorkspaceById = async (workspaceId) => {
  try {
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceSnap = await getDoc(workspaceRef);

    if (!workspaceSnap.exists()) {
      throw new Error('워크스페이스를 찾을 수 없습니다.');
    }

    return { success: true, data: workspaceSnap.data() };
  } catch (error) {
    console.error('워크스페이스 조회 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 정보 가져오기 (코드로 조회)
 */
export const getWorkspaceByCode = async (workspaceCode) => {
  try {
    const q = query(
      collection(db, 'workspaces'),
      where('workspaceCode', '==', workspaceCode.toUpperCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('워크스페이스를 찾을 수 없습니다.');
    }

    const workspaceDoc = snapshot.docs[0];
    return { success: true, data: workspaceDoc.data() };
  } catch (error) {
    console.error('워크스페이스 코드 조회 오류:', error);
    throw error;
  }
};

/**
 * 사용자 ID로 워크스페이스 가져오기
 */
export const getWorkspaceByUserId = async (userId) => {
  try {
    const workspaceId = `workspace_${userId}`;
    return await getWorkspaceById(workspaceId);
  } catch (error) {
    console.error('사용자 워크스페이스 조회 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 코드 변경 (이사 효과)
 * - 워크스페이스 코드를 새로 생성
 * - 모든 방의 초대 코드를 자동으로 재생성하여 기존 코드 무효화
 * - "이사"를 가면 기존 주소로는 찾을 수 없게 되는 효과
 */
export const changeWorkspaceCode = async (workspaceId, userId) => {
  try {
    // 워크스페이스 존재 및 소유권 확인
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceSnap = await getDoc(workspaceRef);

    if (!workspaceSnap.exists()) {
      throw new Error('워크스페이스를 찾을 수 없습니다.');
    }

    const workspaceData = workspaceSnap.data();
    if (workspaceData.ownerId !== userId) {
      throw new Error('워크스페이스 소유자만 코드를 변경할 수 있습니다.');
    }

    // 새 코드 생성
    const newCode = await generateUniqueWorkspaceCode();

    // 워크스페이스 코드 업데이트
    await updateDoc(workspaceRef, {
      workspaceCode: newCode,
      updatedAt: Timestamp.now(),
    });

    console.log('워크스페이스 코드 변경 완료:', newCode);

    // 🚚 이사 효과: 모든 방의 초대 코드 재생성
    // 순환 참조 방지를 위해 동적 import 사용
    try {
      const { regenerateAllRoomCodesInWorkspace } = await import('./collaborationRoomService.js');
      const regenerateResult = await regenerateAllRoomCodesInWorkspace(workspaceId);
      console.log(`이사 완료: ${regenerateResult.regeneratedCount}개 방의 코드가 재생성되었습니다.`);

      return {
        success: true,
        newCode,
        regeneratedRoomCount: regenerateResult.regeneratedCount
      };
    } catch (regenerateError) {
      console.error('방 코드 재생성 오류 (워크스페이스 코드는 변경됨):', regenerateError);
      // 워크스페이스 코드는 이미 변경되었으므로 성공 반환, 경고 포함
      return {
        success: true,
        newCode,
        regeneratedRoomCount: 0,
        warning: '방 코드 재생성 중 오류가 발생했습니다.'
      };
    }

  } catch (error) {
    console.error('워크스페이스 코드 변경 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 설정 업데이트
 */
export const updateWorkspaceSettings = async (workspaceId, userId, settings) => {
  try {
    // 워크스페이스 존재 및 소유권 확인
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceSnap = await getDoc(workspaceRef);

    if (!workspaceSnap.exists()) {
      throw new Error('워크스페이스를 찾을 수 없습니다.');
    }

    const workspaceData = workspaceSnap.data();
    if (workspaceData.ownerId !== userId) {
      throw new Error('워크스페이스 소유자만 설정을 변경할 수 있습니다.');
    }

    // 설명 sanitize
    const sanitizedDesc = sanitizeInput(settings.description || '');

    // 업데이트
    await updateDoc(workspaceRef, {
      'settings.allowGuestView': settings.allowGuestView ?? true,
      'settings.description': sanitizedDesc,
      updatedAt: Timestamp.now(),
    });

    console.log('워크스페이스 설정 업데이트 완료');
    return { success: true };

  } catch (error) {
    console.error('워크스페이스 설정 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스의 공개 방 목록 가져오기
 */
export const getPublicRoomsInWorkspace = async (workspaceId) => {
  try {
    const q = query(
      collection(db, 'collaborationRooms'),
      where('workspaceId', '==', workspaceId),
      where('isPublic', '==', true),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, rooms };
  } catch (error) {
    console.error('공개 방 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 통계 업데이트 (방 생성/삭제 시 호출)
 */
export const updateWorkspaceStats = async (workspaceId) => {
  try {
    // 모든 방 조회
    const q = query(
      collection(db, 'collaborationRooms'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const rooms = snapshot.docs.map(doc => doc.data());

    const totalRooms = rooms.length;
    const publicRooms = rooms.filter(r => r.isPublic === true).length;
    const privateRooms = rooms.filter(r => r.isPublic === false).length;

    // 워크스페이스 통계 업데이트
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    await updateDoc(workspaceRef, {
      'stats.totalRooms': totalRooms,
      'stats.publicRooms': publicRooms,
      'stats.privateRooms': privateRooms,
      updatedAt: Timestamp.now(),
    });

    console.log('워크스페이스 통계 업데이트 완료');
    return { success: true };

  } catch (error) {
    console.error('워크스페이스 통계 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 워크스페이스 존재 여부 확인
 */
export const checkWorkspaceExists = async (userId) => {
  try {
    const workspaceId = `workspace_${userId}`;
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceSnap = await getDoc(workspaceRef);

    return workspaceSnap.exists();
  } catch (error) {
    console.error('워크스페이스 존재 확인 오류:', error);
    return false;
  }
};
