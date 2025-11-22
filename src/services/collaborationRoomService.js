// 협업방 관리 서비스
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  updateDoc, deleteDoc, addDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  validateAndSanitize,
  isValidUserId,
  roomCreationLimiter,
  invitationLimiter,
  validateContentSize
} from '../utils/securityUtils';
import { getWorkspaceByUserId, updateWorkspaceStats } from './workspaceService';

/**
 * 독립적인 방 초대 코드 생성 (워크스페이스 코드와 분리)
 * - 개방형: PU-XXXX-XX-XXXXXX (Public/Open - 초대 코드를 아는 누구나 참여 가능)
 * - 제한형: PR-XXXX-XX-XXXXXX (Private/Restricted - 지정된 사람만 참여 가능)
 * - 12자리 = 36^12 = 약 4.7경 개 가능 (무차별 대입 공격 방지)
 * - 워크스페이스 코드 노출 없음 (보안)
 * @param {string} roomType - 'open' | 'restricted'
 * @returns {string} 초대 코드
 */
const generateRoomInviteCode = (roomType) => {
  const prefix = roomType === 'open' ? 'PU' : 'PR'; // Public(개방형) / Private(제한형)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // PU-XXXX-XX-XXXXXX 형식 생성
  let code = prefix + '-';

  // 첫 번째 블록: 4자리
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';

  // 두 번째 블록: 2자리
  for (let i = 0; i < 2; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';

  // 세 번째 블록: 6자리
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code; // 예: PU-A3B7-X9-K2M8P1, PR-F5H2-N4-Q9W7E3
};

/**
 * 방 초대 코드 중복 확인
 */
const isRoomInviteCodeUnique = async (code) => {
  try {
    const q = query(
      collection(db, 'collaborationRooms'),
      where('inviteCode', '==', code)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('방 초대 코드 중복 확인 오류:', error);
    return false;
  }
};

/**
 * 고유한 방 초대 코드 생성 (중복 체크 포함)
 * @param {string} roomType - 'open' | 'restricted'
 * @returns {Promise<string>} 고유한 초대 코드
 */
const generateUniqueRoomInviteCode = async (roomType) => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    code = generateRoomInviteCode(roomType); // 독립적인 코드 생성
    isUnique = await isRoomInviteCodeUnique(code);
    attempts++;
  }

  if (!isUnique) {
    throw new Error('고유한 방 초대 코드 생성 실패');
  }

  return code;
};

/**
 * 협업방 생성
 * @param {string} memoId - 공유할 메모 ID
 * @param {string} memoTitle - 메모 제목
 * @param {string} memoContent - 메모 내용
 * @param {string} roomType - 'open' (개방형: 초대 코드로 누구나 참여) | 'restricted' (제한형: 지정된 사람만 참여)
 * @param {boolean} allCanEdit - 모두 편집 가능 여부
 * @returns {string} roomId
 */
export const createCollaborationRoom = async (memoId, memoTitle, memoContent, roomType = 'restricted', allCanEdit = false) => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: Rate Limiting (도배 방지)
  if (!roomCreationLimiter.allowRequest(userId)) {
    throw new Error('너무 많은 방을 생성했습니다. 잠시 후 다시 시도해주세요.');
  }

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 메모 제목 살균
  const titleValidation = validateAndSanitize(memoTitle, 'message');
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || '유효하지 않은 제목입니다.');
  }

  // 🛡️ 보안: 메모 내용 살균 및 검증
  const contentValidation = validateAndSanitize(memoContent, 'memo');
  if (!contentValidation.isValid) {
    throw new Error(contentValidation.error || '유효하지 않은 메모 내용입니다.');
  }

  // 🛡️ 보안: 사용자 이름 살균
  const nameValidation = validateAndSanitize(userProfile.name || '알 수 없음', 'username');
  if (!nameValidation.isValid) {
    throw new Error('유효하지 않은 사용자 이름입니다.');
  }

  // 워크스페이스 ID 가져오기
  let workspaceId = `workspace_${userId}`;
  try {
    const workspaceResult = await getWorkspaceByUserId(userId);
    if (workspaceResult.success) {
      workspaceId = workspaceResult.data.workspaceId;
    }
  } catch (error) {
    console.warn('워크스페이스 조회 실패, 기본값 사용:', error);
    // 기본 워크스페이스 ID 사용
  }

  // 모든 방에 초대 코드 생성 (개방형: PU-XXXX-XX-XXXXXX, 제한형: PR-XXXX-XX-XXXXXX)
  const inviteCode = await generateUniqueRoomInviteCode(roomType);

  const roomData = {
    // 방 기본 정보
    memoId,
    memoTitle: titleValidation.sanitized || '제목 없음',
    ownerId: userId,
    ownerName: nameValidation.sanitized,
    workspaceId, // 워크스페이스 ID 추가
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // 메모 내용 (실시간 동기화) - 살균된 콘텐츠
    memoContent: contentValidation.sanitized,

    // 참여자 정보
    participants: [{
      userId,
      displayName: nameValidation.sanitized,
      photoURL: userProfile.picture || null,
      role: 'owner',
      joinedAt: new Date().toISOString()
    }],

    // 권한 설정
    permissions: {
      allCanEdit: allCanEdit, // 모두 편집 가능 여부 (설정값 반영)
      editableUsers: [], // 편집 권한 있는 사용자 ID 배열
    },

    // 방 상태
    status: 'active', // 'active' | 'archived' | 'locked'
    isLocked: false,
    roomType: roomType, // 'open' (개방형: 초대 코드로 누구나) | 'restricted' (제한형: 지정된 사람만)

    // 하위 호환성: 기존 isPublic 필드 유지 (추후 제거 예정)
    isPublic: roomType === 'open',

    // 초대 코드 (모든 방)
    inviteCode: inviteCode, // 'PU-XXXX-XX-XXXXXX' (개방형) 또는 'PR-XXXX-XX-XXXXXX' (제한형)

    // 제한형 방의 허용된 사용자 목록
    allowedUsers: roomType === 'restricted' ? [userId] : [], // 제한형: 방장은 기본 포함, 개방형: 빈 배열

    // 차단된 사용자 목록
    blockedUsers: [], // 방 접근이 차단된 사용자 ID 배열

    // 통계
    messageCount: 0,
    lastMessageAt: null,
  };

  const roomRef = await addDoc(collection(db, 'collaborationRooms'), roomData);

  // 워크스페이스 통계 업데이트
  try {
    await updateWorkspaceStats(workspaceId);
  } catch (error) {
    console.warn('워크스페이스 통계 업데이트 실패:', error);
  }

  return roomRef.id;
};

/**
 * 협업방에 친구 초대
 * @param {string} roomId - 방 ID
 * @param {Array} friendIds - 초대할 친구 ID 배열
 */
export const inviteToRoom = async (roomId, friendIds) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: Rate Limiting (초대 도배 방지)
  if (!invitationLimiter.allowRequest(userId)) {
    throw new Error('너무 많은 초대를 보냈습니다. 잠시 후 다시 시도해주세요.');
  }

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 초대할 친구 수 제한 (대량 스팸 방지)
  if (!Array.isArray(friendIds) || friendIds.length === 0) {
    throw new Error('초대할 친구를 선택해주세요.');
  }
  if (friendIds.length > 50) {
    throw new Error('한 번에 최대 50명까지만 초대할 수 있습니다.');
  }

  // 🛡️ 보안: 각 친구 ID 검증
  for (const friendId of friendIds) {
    if (!isValidUserId(friendId)) {
      throw new Error(`유효하지 않은 친구 ID가 포함되어 있습니다: ${friendId}`);
    }
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 초대할 수 있습니다');

  // 초대 알림 생성
  const batch = friendIds.map(async (friendId) => {
    // 친구 정보 조회
    const friendRef = doc(db, 'users', friendId);
    const friendDoc = await getDoc(friendRef);

    if (friendDoc.exists()) {
      const friendData = friendDoc.data();

      // 🛡️ 보안: 친구 이름 살균
      const nameValidation = validateAndSanitize(friendData.displayName || '알 수 없음', 'username');

      // 초대 알림 생성
      await addDoc(collection(db, 'roomInvitations'), {
        roomId,
        inviterId: userId,
        inviteeId: friendId,
        inviteeName: nameValidation.sanitized,
        roomTitle: roomDoc.data().memoTitle,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }
  });

  await Promise.all(batch);
  return true;
};

/**
 * 초대 수락
 * @param {string} invitationId - 초대 ID
 */
export const acceptInvitation = async (invitationId) => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  const invitationRef = doc(db, 'roomInvitations', invitationId);
  const invitationDoc = await getDoc(invitationRef);

  if (!invitationDoc.exists()) throw new Error('초대를 찾을 수 없습니다');

  const invitation = invitationDoc.data();
  const roomRef = doc(db, 'collaborationRooms', invitation.roomId);

  // 방에 참여자 추가
  const roomDoc = await getDoc(roomRef);
  const participants = roomDoc.data().participants || [];

  participants.push({
    userId,
    displayName: userProfile.name || '알 수 없음',
    photoURL: userProfile.picture || null,
    role: 'participant',
    joinedAt: new Date().toISOString()
  });

  await updateDoc(roomRef, {
    participants,
    updatedAt: new Date().toISOString()
  });

  // 초대 상태 업데이트
  await updateDoc(invitationRef, {
    status: 'accepted',
    acceptedAt: new Date().toISOString()
  });

  return invitation.roomId;
};

/**
 * 방 나가기
 * @param {string} roomId - 방 ID
 */
export const leaveRoom = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();
  const workspaceId = room.workspaceId;
  const participants = room.participants.filter(p => p.userId !== userId);

  // 참여자 목록에서만 제거, 방장 정보는 유지 (방장이 나가도 ownerId는 변경 안 됨)
  await updateDoc(roomRef, {
    participants,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 방 삭제 (방장만 가능)
 * @param {string} roomId - 방 ID
 */
export const deleteRoom = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 삭제 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 방을 삭제할 수 있습니다');
  }

  const workspaceId = room.workspaceId;

  // 방 삭제
  await deleteDoc(roomRef);

  // 워크스페이스 통계 업데이트
  if (workspaceId) {
    try {
      await updateWorkspaceStats(workspaceId);
    } catch (error) {
      console.warn('워크스페이스 통계 업데이트 실패:', error);
    }
  }

  return true;
};

/**
 * 방 폐쇄 (아카이브)
 * @param {string} roomId - 방 ID
 */
export const closeRoom = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 폐쇄 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 방을 폐쇄할 수 있습니다');
  }

  const workspaceId = room.workspaceId;

  // 방 상태를 archived로 변경
  await updateDoc(roomRef, {
    status: 'archived',
    updatedAt: new Date().toISOString()
  });

  // 워크스페이스 통계 업데이트
  if (workspaceId) {
    try {
      await updateWorkspaceStats(workspaceId);
    } catch (error) {
      console.warn('워크스페이스 통계 업데이트 실패:', error);
    }
  }

  return true;
};

/**
 * 방 재개방 (archived -> active)
 * @param {string} roomId - 방 ID
 */
export const reopenRoom = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 재개방 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 방을 재개방할 수 있습니다');
  }

  const workspaceId = room.workspaceId;

  // 방 상태를 active로 변경
  await updateDoc(roomRef, {
    status: 'active',
    updatedAt: new Date().toISOString()
  });

  // 워크스페이스 통계 업데이트
  if (workspaceId) {
    try {
      await updateWorkspaceStats(workspaceId);
    } catch (error) {
      console.warn('워크스페이스 통계 업데이트 실패:', error);
    }
  }

  return true;
};

/**
 * 메모 내용 업데이트 (실시간 동기화)
 * @param {string} roomId - 방 ID
 * @param {string} content - 메모 내용
 */
export const updateRoomMemo = async (roomId, content) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 메모 내용 살균 및 검증
  const contentValidation = validateAndSanitize(content, 'memo');
  if (!contentValidation.isValid) {
    throw new Error(contentValidation.error || '유효하지 않은 메모 내용입니다.');
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 편집 권한 확인
  const canEdit = room.ownerId === userId ||
                  room.permissions.allCanEdit ||
                  room.permissions.editableUsers.includes(userId);

  if (!canEdit) throw new Error('편집 권한이 없습니다');

  await updateDoc(roomRef, {
    memoContent: contentValidation.sanitized, // 🛡️ 살균된 콘텐츠 저장
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 편집 권한 부여/해제
 * @param {string} roomId - 방 ID
 * @param {string} userId - 대상 사용자 ID
 * @param {boolean} canEdit - 편집 가능 여부
 */
export const setEditPermission = async (roomId, targetUserId, canEdit) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 권한을 부여할 수 있습니다');

  const editableUsers = roomDoc.data().permissions.editableUsers || [];

  if (canEdit) {
    if (!editableUsers.includes(targetUserId)) {
      editableUsers.push(targetUserId);
    }
  } else {
    const index = editableUsers.indexOf(targetUserId);
    if (index > -1) {
      editableUsers.splice(index, 1);
    }
  }

  await updateDoc(roomRef, {
    'permissions.editableUsers': editableUsers,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 모두에게 편집 권한 부여/해제
 * @param {string} roomId - 방 ID
 * @param {boolean} allCanEdit - 모두 편집 가능 여부
 */
export const setAllEditPermission = async (roomId, allCanEdit) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 권한을 부여할 수 있습니다');

  await updateDoc(roomRef, {
    'permissions.allCanEdit': allCanEdit,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 방 잠그기/열기
 * @param {string} roomId - 방 ID
 * @param {boolean} isLocked - 잠금 여부
 */
export const lockRoom = async (roomId, isLocked) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 방을 잠글 수 있습니다');

  await updateDoc(roomRef, {
    isLocked,
    status: isLocked ? 'locked' : 'active',
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 방 개방형/제한형 설정 변경 (방장만 가능)
 * @param {string} roomId - 방 ID
 * @param {string} newRoomType - 'open' (개방형) | 'restricted' (제한형)
 */
export const toggleRoomType = async (roomId, newRoomType) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();
  if (room.ownerId !== userId) throw new Error('방장만 방 타입을 변경할 수 있습니다');

  // 제한형으로 변경 시, allowedUsers에 현재 참여자 모두 추가
  let allowedUsers = room.allowedUsers || [];
  if (newRoomType === 'restricted') {
    const participantIds = room.participants.map(p => p.userId);
    allowedUsers = [...new Set([...allowedUsers, ...participantIds])]; // 중복 제거
  } else {
    // 개방형으로 변경 시, allowedUsers 초기화
    allowedUsers = [];
  }

  await updateDoc(roomRef, {
    roomType: newRoomType,
    isPublic: newRoomType === 'open', // 하위 호환성
    allowedUsers,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 하위 호환성: 기존 toggleRoomPublicity를 toggleRoomType으로 리디렉션
 * @deprecated Use toggleRoomType instead
 */
export const toggleRoomPublicity = async (roomId, isPublic) => {
  const newRoomType = isPublic ? 'open' : 'restricted';
  return toggleRoomType(roomId, newRoomType);
};

/**
 * 내 협업방 목록 가져오기
 */
export const getMyRooms = async () => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomsRef = collection(db, 'collaborationRooms');
  const snapshot = await getDocs(roomsRef);

  const myRooms = [];
  snapshot.forEach(doc => {
    const room = doc.data();
    const isParticipant = room.participants?.some(p => p.userId === userId);

    if (isParticipant) {
      myRooms.push({
        id: doc.id,
        ...room
      });
    }
  });

  return myRooms.sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
};

/**
 * 방 정보 실시간 구독
 * @param {string} roomId - 방 ID
 * @param {function} callback - 업데이트 콜백
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = doc(db, 'collaborationRooms', roomId);
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

/**
 * 방 초대 코드 재생성 (방장만 가능)
 * @param {string} roomId - 방 ID
 * @returns {string} 새로운 초대 코드
 */
export const regenerateRoomInviteCode = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 초대 코드 재생성 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 초대 코드를 재생성할 수 있습니다');
  }

  // roomType 우선 사용, 없으면 isPublic으로 판단 (하위 호환성)
  const roomType = room.roomType || (room.isPublic ? 'open' : 'restricted');

  // 새로운 초대 코드 생성 (개방형: PU-XXXX-XX-XXXXXX, 제한형: PR-XXXX-XX-XXXXXX)
  const newInviteCode = await generateUniqueRoomInviteCode(roomType);

  // 초대 코드 업데이트
  await updateDoc(roomRef, {
    inviteCode: newInviteCode,
    updatedAt: new Date().toISOString()
  });

  console.log('방 초대 코드 재생성 완료:', newInviteCode);
  return newInviteCode;
};

/**
 * 사용자를 방에서 차단
 * @param {string} roomId - 방 ID
 * @param {string} targetUserId - 차단할 사용자 ID
 */
export const blockUserFromRoom = async (roomId, targetUserId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(targetUserId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 차단 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 사용자를 차단할 수 있습니다');
  }

  // 자기 자신은 차단 불가
  if (targetUserId === userId) {
    throw new Error('자기 자신은 차단할 수 없습니다');
  }

  const blockedUsers = room.blockedUsers || [];

  // 이미 차단된 사용자인지 확인
  if (blockedUsers.includes(targetUserId)) {
    throw new Error('이미 차단된 사용자입니다');
  }

  // 차단 목록에 추가
  blockedUsers.push(targetUserId);

  // 참여자 목록에서 제거
  const participants = room.participants.filter(p => p.userId !== targetUserId);

  // 업데이트
  await updateDoc(roomRef, {
    blockedUsers,
    participants,
    updatedAt: new Date().toISOString()
  });

  console.log('사용자 차단 완료:', targetUserId);
  return true;
};

/**
 * 사용자 차단 해제
 * @param {string} roomId - 방 ID
 * @param {string} targetUserId - 차단 해제할 사용자 ID
 */
export const unblockUserFromRoom = async (roomId, targetUserId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(targetUserId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 방장만 차단 해제 가능
  if (room.ownerId !== userId) {
    throw new Error('방장만 차단을 해제할 수 있습니다');
  }

  const blockedUsers = room.blockedUsers || [];

  // 차단된 사용자가 아닌 경우
  if (!blockedUsers.includes(targetUserId)) {
    throw new Error('차단되지 않은 사용자입니다');
  }

  // 차단 목록에서 제거
  const updatedBlockedUsers = blockedUsers.filter(id => id !== targetUserId);

  // 업데이트
  await updateDoc(roomRef, {
    blockedUsers: updatedBlockedUsers,
    updatedAt: new Date().toISOString()
  });

  console.log('사용자 차단 해제 완료:', targetUserId);
  return true;
};

/**
 * 방 초대 코드로 방 찾기
 * @param {string} inviteCode - 초대 코드
 * @returns {Object} 방 정보
 */
export const getRoomByInviteCode = async (inviteCode) => {
  try {
    const q = query(
      collection(db, 'collaborationRooms'),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('유효하지 않은 초대 코드입니다');
    }

    const roomDoc = snapshot.docs[0];
    const room = roomDoc.data();

    // 방이 활성 상태인지 확인
    if (room.status !== 'active') {
      throw new Error('폐쇄된 방입니다');
    }

    return { success: true, roomId: roomDoc.id, data: room };
  } catch (error) {
    console.error('초대 코드로 방 찾기 오류:', error);
    throw error;
  }
};

/**
 * 초대 코드로 방 참여 (차단 확인 포함)
 * @param {string} inviteCode - 초대 코드
 */
export const joinRoomByInviteCode = async (inviteCode) => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  // 초대 코드로 방 찾기
  const result = await getRoomByInviteCode(inviteCode);
  const roomId = result.roomId;
  const room = result.data;

  // 방이 잠겨있는지 확인 (이미 참여 중인 사용자는 제외)
  const isAlreadyParticipant = room.participants.some(p => p.userId === userId);
  if (room.isLocked && !isAlreadyParticipant) {
    throw new Error('방이 잠겨있어 새로운 참여자를 받지 않습니다');
  }

  // 차단된 사용자인지 확인
  const blockedUsers = room.blockedUsers || [];
  if (blockedUsers.includes(userId)) {
    throw new Error('이 방에 접근할 수 없습니다');
  }

  // roomType 우선 사용, 없으면 isPublic으로 판단 (하위 호환성)
  const roomType = room.roomType || (room.isPublic ? 'open' : 'restricted');

  // 제한형 방인 경우, allowedUsers 확인
  if (roomType === 'restricted') {
    const allowedUsers = room.allowedUsers || [];
    const isOwner = room.ownerId === userId;

    if (!isOwner && !isAlreadyParticipant && !allowedUsers.includes(userId)) {
      throw new Error('이 방은 제한형 방으로, 초대된 사용자만 참여할 수 있습니다');
    }
  }

  // 이미 참여 중인지 확인
  if (isAlreadyParticipant) {
    return { success: true, roomId, message: '이미 참여 중인 방입니다' };
  }

  // 참여자 추가
  const participants = room.participants || [];
  participants.push({
    userId,
    displayName: userProfile.name || '알 수 없음',
    photoURL: userProfile.picture || null,
    role: 'participant',
    joinedAt: new Date().toISOString()
  });

  const roomRef = doc(db, 'collaborationRooms', roomId);
  await updateDoc(roomRef, {
    participants,
    updatedAt: new Date().toISOString()
  });

  return { success: true, roomId };
};

/**
 * 워크스페이스의 모든 방 초대 코드 재생성 (이사 효과)
 * - 워크스페이스 코드 변경 시 호출
 * - 모든 방의 초대 코드를 새로 생성하여 기존 코드 무효화
 * - 개방형, 제한형 모두 재생성
 * @param {string} workspaceId - 워크스페이스 ID
 * @returns {Promise<{success: boolean, regeneratedCount: number}>}
 */
export const regenerateAllRoomCodesInWorkspace = async (workspaceId) => {
  try {
    console.log('워크스페이스의 모든 방 코드 재생성 시작:', workspaceId);

    // 워크스페이스의 모든 활성 방 조회
    const q = query(
      collection(db, 'collaborationRooms'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('재생성할 방이 없습니다.');
      return { success: true, regeneratedCount: 0 };
    }

    let regeneratedCount = 0;

    // 각 방의 초대 코드 재생성
    for (const roomDoc of snapshot.docs) {
      const room = roomDoc.data();

      // roomType 우선 사용, 없으면 isPublic으로 판단 (하위 호환성)
      const roomType = room.roomType || (room.isPublic ? 'open' : 'restricted');
      const newInviteCode = await generateUniqueRoomInviteCode(roomType);

      await updateDoc(doc(db, 'collaborationRooms', roomDoc.id), {
        inviteCode: newInviteCode,
        updatedAt: new Date().toISOString()
      });

      regeneratedCount++;
      console.log(`방 ${roomDoc.id} 코드 재생성: ${room.inviteCode} → ${newInviteCode}`);
    }

    console.log(`총 ${regeneratedCount}개 방의 초대 코드 재생성 완료`);
    return { success: true, regeneratedCount };

  } catch (error) {
    console.error('방 코드 재생성 오류:', error);
    throw error;
  }
};

/**
 * 메모 ID로 활성 협업방이 있는지 확인
 * @param {string} memoId - 메모 ID
 * @returns {Promise<{isShared: boolean, room: Object|null}>}
 */
export const checkMemoSharedStatus = async (memoId) => {
  try {
    if (!memoId || !db) return { isShared: false, room: null };

    const q = query(
      collection(db, 'collaborationRooms'),
      where('memoId', '==', memoId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { isShared: false, room: null };
    }

    const roomDoc = snapshot.docs[0];
    return {
      isShared: true,
      room: { id: roomDoc.id, ...roomDoc.data() }
    };
  } catch (error) {
    console.error('메모 공유 상태 확인 오류:', error);
    return { isShared: false, room: null };
  }
};

/**
 * 메모 ID로 협업방 가져오기 (공유 해제용)
 * @param {string} memoId - 메모 ID
 * @returns {Promise<{success: boolean, room: Object|null}>}
 */
export const getRoomByMemoId = async (memoId) => {
  try {
    if (!memoId) {
      throw new Error('메모 ID가 필요합니다');
    }

    if (!db) {
      return { success: false, room: null };
    }

    const q = query(
      collection(db, 'collaborationRooms'),
      where('memoId', '==', memoId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, room: null };
    }

    const roomDoc = snapshot.docs[0];
    return {
      success: true,
      room: { id: roomDoc.id, ...roomDoc.data() }
    };
  } catch (error) {
    console.error('메모 ID로 방 조회 오류:', error);
    throw error;
  }
};
