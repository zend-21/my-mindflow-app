// src/services/adminManagementService.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 최고 관리자 Firebase UID (직접 지정)
export const SUPER_ADMIN_UID = 'PrFoplbIWVabgdfZdlN6ehmBcE73';

// 최고 관리자 ShareNote 아이디 (ws- 접두사 없이 입력, 자동으로 추가됨)
// 예: 'WSAAZ3' -> 내부적으로 'ws-WSAAZ3'로 변환
export const SUPER_ADMIN_SHARENOTE_ID = 'A9Z21L';

// ShareNote 아이디로 Firebase UID 찾기 (캐싱)
let sharenoteIdToUidCache = {};

/**
 * ShareNote 아이디로 Firebase UID 찾기
 * @param {string} sharenoteId - ShareNote 아이디 (예: XD44R0)
 * @returns {Promise<string|null>} - Firebase UID 또는 null
 */
const getUidByShareNoteId = async (sharenoteId) => {
  // 입력값 정규화: ws- 제거 후 대문자 변환
  const cleanId = sharenoteId.toUpperCase().replace(/^WS-/, '');
  // 검색용: ws- 접두사 추가
  const workspaceCode = `ws-${cleanId}`;

  // 캐시 확인
  if (sharenoteIdToUidCache[cleanId]) {
    return sharenoteIdToUidCache[cleanId];
  }

  try {
    // workspaces 컬렉션에서 workspaceCode로 검색 (ws- 포함)
    const workspacesRef = collection(db, 'workspaces');
    const q = query(workspacesRef, where('workspaceCode', '==', workspaceCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const workspaceData = querySnapshot.docs[0].data();
      const uid = workspaceData.userId;

      // 캐시에 저장
      sharenoteIdToUidCache[cleanId] = uid;
      return uid;
    }

    return null;
  } catch (error) {
    console.error('ShareNote ID 조회 실패');
    return null;
  }
};

/**
 * 최고 관리자의 Firebase UID 가져오기
 * @returns {Promise<string|null>}
 */
const getSuperAdminUid = async () => {
  // UID가 직접 설정되어 있으면 그것을 사용
  if (SUPER_ADMIN_UID) {
    return SUPER_ADMIN_UID;
  }

  // 그렇지 않으면 ShareNote ID로 찾기
  return await getUidByShareNoteId(SUPER_ADMIN_SHARENOTE_ID);
};

// 권한 타입
export const PERMISSIONS = {
  REPLY: 'reply',     // 문의 답변하기
  EDIT: 'edit',       // 답변 수정하기
  DELETE: 'delete',   // 문의 삭제하기
};

/**
 * 사용자가 최고 관리자인지 확인 (Firebase UID 기준)
 * @param {string} userId - Firebase UID
 * @returns {Promise<boolean>}
 */
export const isSuperAdmin = async (userId) => {
  const superAdminUid = await getSuperAdminUid();
  return userId === superAdminUid;
};

/**
 * 관리자 설정 문서 조회
 * @returns {Promise<Object>}
 */
const getAdminConfig = async () => {
  try {
    const configRef = doc(db, 'systemConfig', 'adminSettings');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      return configDoc.data();
    }

    // 문서가 없으면 초기화
    const superAdminUid = await getSuperAdminUid();
    if (!superAdminUid) {
      return { superAdmin: null, subAdmins: {} };
    }

    const initialConfig = {
      superAdmin: superAdminUid,
      superAdminShareNoteId: SUPER_ADMIN_SHARENOTE_ID,
      subAdmins: {},
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(configRef, initialConfig);
    } catch (setError) {
      // 권한 오류 무시 (처음 로그인 시 발생 가능)
    }

    return initialConfig;
  } catch (error) {
    // 권한 오류는 무시하고 기본값 반환
    if (error.code === 'permission-denied') {
      return { superAdmin: null, subAdmins: {} };
    }
    throw error;
  }
};

/**
 * 최고 관리자 변경 시 Firestore의 adminSettings 문서 동기화
 * 코드의 SUPER_ADMIN_UID와 Firestore 문서가 다르면 자동 업데이트
 */
const syncAdminSettingsIfNeeded = async (currentSuperAdminUid) => {
  try {
    const configRef = doc(db, 'systemConfig', 'adminSettings');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      const data = configDoc.data();
      // Firestore의 superAdmin과 코드의 SUPER_ADMIN_UID가 다르면 업데이트
      if (data.superAdmin !== currentSuperAdminUid) {
        console.log('🔄 최고 관리자 변경 감지, Firestore 동기화 중...');
        await setDoc(configRef, {
          ...data,
          superAdmin: currentSuperAdminUid,
          superAdminShareNoteId: SUPER_ADMIN_SHARENOTE_ID,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Firestore adminSettings 동기화 완료');
      }
    } else {
      // 문서가 없으면 새로 생성
      console.log('📝 adminSettings 문서 생성 중...');
      await setDoc(configRef, {
        superAdmin: currentSuperAdminUid,
        superAdminShareNoteId: SUPER_ADMIN_SHARENOTE_ID,
        subAdmins: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ adminSettings 문서 생성 완료');
    }
  } catch (error) {
    // 권한 오류는 무시 (아직 관리자가 아닌 상태에서 접근 시)
    if (error.code !== 'permission-denied') {
      console.error('adminSettings 동기화 오류:', error);
    }
  }
};

/**
 * 관리자 설정 강제 초기화 (최고 관리자만 사용)
 * Firebase Console에서 수동 삭제 후 이 함수로 재생성
 */
export const forceInitializeAdminConfig = async () => {
  try {
    const configRef = doc(db, 'systemConfig', 'adminSettings');

    const initialConfig = {
      superAdmin: SUPER_ADMIN_UID,
      superAdminShareNoteId: SUPER_ADMIN_SHARENOTE_ID,
      subAdmins: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(configRef, initialConfig);
    console.log('✅ 관리자 설정 강제 초기화 완료!', {
      superAdmin: SUPER_ADMIN_UID,
      shareNoteId: SUPER_ADMIN_SHARENOTE_ID
    });

    return { success: true, config: initialConfig };
  } catch (error) {
    console.error('❌ 관리자 설정 초기화 실패:', error);
    throw error;
  }
};

/**
 * 부관리자 추가 (ShareNote ID 사용)
 * @param {string} shareNoteId - ShareNote ID (예: WSHGZ3 또는 ws-WSHGZ3)
 * @param {Array<string>} permissions - 부여할 권한 배열
 * @returns {Promise<void>}
 */
export const addSubAdmin = async (shareNoteId, permissions = []) => {
  try {
    // ShareNote ID를 UID로 변환
    const userId = await getUidByShareNoteId(shareNoteId);
    if (!userId) {
      throw new Error('해당 ShareNote ID를 가진 사용자를 찾을 수 없습니다.');
    }

    // UID로 추가
    await addSubAdminByUid(userId, permissions);
  } catch (error) {
    console.error('부관리자 추가 오류:', error);
    throw error;
  }
};

/**
 * 부관리자 추가 (UID 직접 사용)
 * @param {string} userId - Firebase UID
 * @param {Array<string>} permissions - 부여할 권한 배열
 * @returns {Promise<void>}
 */
export const addSubAdminByUid = async (userId, permissions = []) => {
  try {
    const config = await getAdminConfig();

    // 최대 3명 체크
    const currentSubAdmins = Object.keys(config.subAdmins || {});
    if (currentSubAdmins.length >= 3) {
      throw new Error('부관리자는 최대 3명까지만 지정할 수 있습니다.');
    }

    // 이미 부관리자인지 체크
    if (config.subAdmins && config.subAdmins[userId]) {
      throw new Error('이미 부관리자로 지정된 사용자입니다.');
    }

    // 최고 관리자는 부관리자가 될 수 없음
    const superAdminUid = await getSuperAdminUid();
    if (userId === superAdminUid) {
      throw new Error('최고 관리자는 부관리자로 지정할 수 없습니다.');
    }

    // 권한 설정
    let finalPermissions = [...permissions];

    const configRef = doc(db, 'systemConfig', 'adminSettings');
    await updateDoc(configRef, {
      [`subAdmins.${userId}`]: {
        permissions: finalPermissions,
        addedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('부관리자 추가 오류 (UID):', error);
    throw error;
  }
};

/**
 * 부관리자 권한 수정
 * @param {string} userId - 부관리자 사용자 ID
 * @param {Array<string>} permissions - 새로운 권한 배열
 * @returns {Promise<void>}
 */
export const updateSubAdminPermissions = async (userId, permissions) => {
  try {
    const config = await getAdminConfig();

    if (!config.subAdmins || !config.subAdmins[userId]) {
      throw new Error('부관리자를 찾을 수 없습니다.');
    }

    const configRef = doc(db, 'systemConfig', 'adminSettings');
    await updateDoc(configRef, {
      [`subAdmins.${userId}.permissions`]: permissions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('부관리자 권한 수정 오류:', error);
    throw error;
  }
};

/**
 * 부관리자 제거
 * @param {string} userId - 제거할 부관리자 사용자 ID
 * @returns {Promise<void>}
 */
export const removeSubAdmin = async (userId) => {
  try {
    const configRef = doc(db, 'systemConfig', 'adminSettings');
    await updateDoc(configRef, {
      [`subAdmins.${userId}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('부관리자 제거 오류:', error);
    throw error;
  }
};

/**
 * 모든 부관리자 목록 조회
 * @returns {Promise<Array>}
 */
export const getSubAdmins = async () => {
  try {
    const config = await getAdminConfig();
    const subAdmins = config.subAdmins || {};

    const subAdminList = [];
    for (const [userId, data] of Object.entries(subAdmins)) {
      // 사용자 정보 가져오기
      let userInfo = { displayName: '알 수 없음', email: '' };
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userInfo = {
            displayName: userData.displayName || userData.email || '알 수 없음',
            email: userData.email || '',
          };
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      }

      subAdminList.push({
        userId,
        displayName: userInfo.displayName,
        email: userInfo.email,
        permissions: data.permissions || [],
        addedAt: data.addedAt?.toDate(),
      });
    }

    return subAdminList;
  } catch (error) {
    console.error('부관리자 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 관리자(최고 또는 부)인지 확인
 * @param {string} userId
 * @returns {Promise<Object>} - { isAdmin: boolean, isSuperAdmin: boolean, permissions: Array }
 */
export const checkAdminStatus = async (userId) => {
  try {
    // 최고 관리자 체크
    const superAdminUid = await getSuperAdminUid();
    const isSuperAdminUser = userId === superAdminUid;

    // 최고 관리자인 경우, Firestore의 adminSettings 문서도 동기화
    if (isSuperAdminUser) {
      await syncAdminSettingsIfNeeded(superAdminUid);
    }

    if (isSuperAdminUser) {
      return {
        isAdmin: true,
        isSuperAdmin: true,
        permissions: Object.values(PERMISSIONS), // 모든 권한
      };
    }

    // 부관리자 체크
    const config = await getAdminConfig();
    const subAdminData = config.subAdmins?.[userId];

    if (subAdminData) {
      return {
        isAdmin: true,
        isSuperAdmin: false,
        permissions: subAdminData.permissions || [],
      };
    }

    // 일반 사용자
    return {
      isAdmin: false,
      isSuperAdmin: false,
      permissions: [],
    };
  } catch (error) {
    // 에러 발생 시에도 민감한 정보를 노출하지 않음
    console.error('관리자 상태 확인 중 오류 발생');
    return {
      isAdmin: false,
      isSuperAdmin: false,
      permissions: [],
    };
  }
};

/**
 * 사용자가 특정 권한을 가지고 있는지 확인
 * @param {string} userId
 * @param {string} permission - PERMISSIONS 상수 중 하나
 * @returns {Promise<boolean>}
 */
export const hasPermission = async (userId, permission) => {
  try {
    const status = await checkAdminStatus(userId);
    return status.isAdmin && status.permissions.includes(permission);
  } catch (error) {
    console.error('권한 확인 오류:', error);
    return false;
  }
};

/**
 * 알림을 받아야 하는 모든 관리자 목록 조회
 * @returns {Promise<Array<string>>} - 관리자 UID 배열
 */
export const getNotificationRecipients = async () => {
  try {
    const config = await getAdminConfig();
    const recipients = [];

    // 최고 관리자는 항상 알림 받음
    const superAdminUid = await getSuperAdminUid();
    if (superAdminUid) {
      recipients.push(superAdminUid);
    }

    // 알림 권한이 있는 부관리자 추가
    const subAdmins = config.subAdmins || {};
    for (const [userId, data] of Object.entries(subAdmins)) {
      if (data.permissions && data.permissions.includes(PERMISSIONS.NOTIFICATIONS)) {
        recipients.push(userId);
      }
    }

    return recipients;
  } catch (error) {
    console.error('알림 수신자 조회 오류:', error);
    const superAdminUid = await getSuperAdminUid();
    return superAdminUid ? [superAdminUid] : []; // 오류 시 최고 관리자만
  }
};

/**
 * 권한 이름을 한글로 변환
 * @param {string} permission
 * @returns {string}
 */
export const getPermissionLabel = (permission) => {
  const labels = {
    [PERMISSIONS.REPLY]: '문의 답변',
    [PERMISSIONS.EDIT]: '답변 수정',
    [PERMISSIONS.DELETE]: '문의 삭제',
  };
  return labels[permission] || permission;
};

/**
 * 권한 설명
 * @param {string} permission
 * @returns {string}
 */
export const getPermissionDescription = (permission) => {
  const descriptions = {
    [PERMISSIONS.REPLY]: '문의에 답변을 작성할 수 있습니다',
    [PERMISSIONS.EDIT]: '작성된 문의 답변을 수정할 수 있습니다',
    [PERMISSIONS.DELETE]: '문의를 삭제할 수 있습니다',
  };
  return descriptions[permission] || '';
};
