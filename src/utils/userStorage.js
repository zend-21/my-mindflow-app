// 계정별 localStorage 관리 유틸리티
// 각 사용자 계정의 데이터를 완전히 분리하여 저장

/**
 * 현재 로그인한 사용자 UID 가져오기
 */
export const getCurrentUserId = () => {
  return localStorage.getItem('currentUserId');
};

/**
 * 현재 로그인한 사용자 설정
 * @param {string} userId - Firebase UID
 */
export const setCurrentUserId = (userId) => {
  if (!userId) {
    console.error('⚠️ setCurrentUserId: userId가 없습니다');
    return;
  }
  localStorage.setItem('currentUserId', userId);
  console.log('✅ 현재 사용자 설정:', userId);
};

/**
 * 계정별 데이터 저장
 * @param {string} userId - Firebase UID
 * @param {string} key - 저장할 키
 * @param {string} value - 저장할 값
 */
export const setUserData = (userId, key, value) => {
  if (!userId) {
    console.error('⚠️ setUserData: userId가 없습니다');
    return;
  }
  const storageKey = `user_${userId}_${key}`;
  localStorage.setItem(storageKey, value);
  // 로그 제거 - 너무 많은 로그가 성능에 영향
  // console.log(`✅ 사용자 데이터 저장: ${storageKey} = ${value}`);
};

/**
 * 계정별 데이터 가져오기
 * @param {string} userId - Firebase UID
 * @param {string} key - 가져올 키
 * @returns {string|null} 저장된 값
 */
export const getUserData = (userId, key) => {
  if (!userId) {
    console.error('⚠️ getUserData: userId가 없습니다');
    return null;
  }
  const storageKey = `user_${userId}_${key}`;
  return localStorage.getItem(storageKey);
};

/**
 * 현재 로그인한 사용자의 데이터 저장
 * @param {string} key - 저장할 키
 * @param {string} value - 저장할 값
 */
export const setCurrentUserData = (key, value) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('⚠️ setCurrentUserData: 현재 로그인한 사용자가 없습니다');
    return;
  }
  setUserData(userId, key, value);
};

/**
 * 현재 로그인한 사용자의 데이터 가져오기
 * @param {string} key - 가져올 키
 * @returns {string|null} 저장된 값
 */
export const getCurrentUserData = (key) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('⚠️ getCurrentUserData: 현재 로그인한 사용자가 없습니다');
    return null;
  }
  return getUserData(userId, key);
};

/**
 * 특정 사용자의 모든 데이터 삭제
 * @param {string} userId - Firebase UID
 */
export const clearUserData = (userId) => {
  if (!userId) {
    console.error('⚠️ clearUserData: userId가 없습니다');
    return;
  }

  const prefix = `user_${userId}_`;
  const keysToDelete = [];

  // 해당 사용자의 모든 키 찾기
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }

  // 찾은 키들 삭제
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`✅ 사용자 데이터 삭제 완료: ${userId} (${keysToDelete.length}개 항목)`);
};

/**
 * 현재 사용자의 모든 데이터 삭제
 */
export const clearCurrentUserData = () => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('⚠️ clearCurrentUserData: 현재 로그인한 사용자가 없습니다');
    return;
  }
  clearUserData(userId);
};

/**
 * 로그아웃 처리 (현재 사용자 정보만 제거, 다른 계정 데이터는 유지)
 */
export const logout = () => {
  const userId = getCurrentUserId();
  console.log('🚪 로그아웃 처리:', userId);

  // currentUserId만 제거 (계정별 데이터는 유지)
  localStorage.removeItem('currentUserId');

  // 기존 방식의 키들도 제거 (호환성)
  localStorage.removeItem('firebaseUserId');
  localStorage.removeItem('userDisplayName');
  localStorage.removeItem('userEmail');

  console.log('✅ 로그아웃 완료');
};

/**
 * 모든 계정의 데이터 완전 삭제 (앱 초기화용)
 */
export const clearAllUserData = () => {
  console.warn('⚠️ 모든 사용자 데이터 삭제 시작');

  const keysToDelete = [];

  // user_ 로 시작하는 모든 키 찾기
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('user_') || key === 'currentUserId')) {
      keysToDelete.push(key);
    }
  }

  // 찾은 키들 삭제
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`✅ 모든 사용자 데이터 삭제 완료 (${keysToDelete.length}개 항목)`);
};

/**
 * Firebase Auth와 localStorage 동기화 확인
 * @param {string} firebaseUserId - Firebase Auth의 현재 사용자 UID
 * @returns {boolean} 동기화 상태
 */
export const checkSync = (firebaseUserId) => {
  const localUserId = getCurrentUserId();

  if (!firebaseUserId) {
    console.log('ℹ️ Firebase Auth: 로그인 안 됨');
    return false;
  }

  if (localUserId !== firebaseUserId) {
    console.warn('⚠️ 동기화 불일치 감지!');
    console.warn(`   Firebase Auth: ${firebaseUserId}`);
    console.warn(`   localStorage: ${localUserId}`);

    // 자동 동기화
    setCurrentUserId(firebaseUserId);
    console.log('✅ 자동 동기화 완료');
    return false;
  }

  console.log('✅ 동기화 확인: 일치');
  return true;
};

/**
 * 사용자 정보 마이그레이션 (기존 방식 → 새 방식)
 * @param {string} userId - Firebase UID
 */
export const migrateUserData = (userId) => {
  if (!userId) return;

  console.log('🔄 사용자 데이터 마이그레이션 시작:', userId);

  // 기존 방식의 데이터가 있으면 새 방식으로 복사
  const oldDisplayName = localStorage.getItem('userDisplayName');
  const oldEmail = localStorage.getItem('userEmail');
  const oldWorkspaceCode = localStorage.getItem('workspaceCode');

  if (oldDisplayName) {
    setUserData(userId, 'displayName', oldDisplayName);
    console.log('  ✅ displayName 마이그레이션');
  }

  if (oldEmail) {
    setUserData(userId, 'email', oldEmail);
    console.log('  ✅ email 마이그레이션');
  }

  if (oldWorkspaceCode) {
    setUserData(userId, 'workspaceCode', oldWorkspaceCode);
    console.log('  ✅ workspaceCode 마이그레이션');
  }

  console.log('✅ 마이그레이션 완료');
};

/**
 * 현재 사용자의 프로필 설정 저장
 * @param {string} key - 설정 키 (profileImageType, selectedAvatarId, avatarBgColor, customProfilePicture 등)
 * @param {string} value - 설정 값
 */
export const setProfileSetting = (key, value) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('⚠️ setProfileSetting: 현재 로그인한 사용자가 없습니다');
    return;
  }
  setUserData(userId, key, value);
};

/**
 * 현재 사용자의 프로필 설정 가져오기
 * @param {string} key - 설정 키
 * @returns {string|null} 설정 값
 */
export const getProfileSetting = (key) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('⚠️ getProfileSetting: 현재 로그인한 사용자가 없습니다');
    return null;
  }
  return getUserData(userId, key);
};

/**
 * 특정 채팅방의 채팅중 수신음 소거 상태 가져오기
 * @param {string} roomId - 채팅방 ID
 * @returns {boolean} true: 소거됨, false: 활성화됨 (기본값)
 */
export const getRoomReceiveSoundMuted = (roomId) => {
  const userId = getCurrentUserId();
  if (!userId || !roomId) {
    console.log('⚠️ [getRoomReceiveSoundMuted] userId 또는 roomId 없음:', { userId, roomId });
    return false; // 기본값: 소리 활성화
  }
  const value = getUserData(userId, `room_${roomId}_receiveSoundMuted`);
  const isMuted = value === 'true';
  console.log(`🔍 [getRoomReceiveSoundMuted] 채팅방 ${roomId} 수신음 소거 상태:`, isMuted, '(localStorage 값:', value, ')');
  return isMuted;
};

/**
 * 특정 채팅방의 채팅중 수신음 소거 상태 설정
 * @param {string} roomId - 채팅방 ID
 * @param {boolean} isMuted - true: 소거, false: 활성화
 */
export const setRoomReceiveSoundMuted = async (roomId, isMuted) => {
  const userId = getCurrentUserId();
  if (!userId || !roomId) {
    console.error('⚠️ [setRoomReceiveSoundMuted] userId 또는 roomId 없음:', { userId, roomId });
    return;
  }

  // localStorage에 저장
  setUserData(userId, `room_${roomId}_receiveSoundMuted`, isMuted ? 'true' : 'false');
  console.log(`${isMuted ? '🔇' : '🔊'} [setRoomReceiveSoundMuted] 채팅방 ${roomId} 수신음: ${isMuted ? '소거' : '활성화'} - localStorage 저장 완료`);
};

/**
 * 🧪 공유 키 목록 확인 (테스트용 - 삭제하지 않고 로그만 출력)
 */
export const testCleanupSharedKeys = () => {
  console.log('🧪 [테스트] 공유 키 스캔 시작 (삭제 안 함)');

  const sharedKeyPatterns = [
    '_shared',
    'firebaseUserId',
    'userDisplayName',
    'userEmail',
    'userProfile',
    'userPicture',
    'workspaceCode',
    'accessToken',
    'userInfo',
    'tokenExpiresAt',
    'lastLoginTime',
    'mindflowUserId',
    'isPhoneVerified'
  ];

  const foundKeys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // user_ 로 시작하는 키는 계정별 키이므로 제외
      if (key.startsWith('user_') || key === 'currentUserId') {
        continue;
      }

      // 공유 키 패턴과 매칭되는지 확인
      const isSharedKey = sharedKeyPatterns.some(pattern =>
        key.includes(pattern) || key === pattern
      );

      if (isSharedKey) {
        foundKeys.push(key);
      }
    }
  }

  console.log(`📋 [테스트] 발견된 공유 키 (${foundKeys.length}개):`);
  foundKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const preview = value && value.length > 50 ? value.substring(0, 50) + '...' : value;
    console.log(`  - ${key}: ${preview}`);
  });

  return foundKeys;
};

/**
 * 공유 키 정리 (계정별 키는 유지, 공유 키만 삭제)
 */
export const cleanupSharedKeys = () => {
  console.log('🧹 공유 키 정리 시작');

  const sharedKeyPatterns = [
    '_shared',
    'firebaseUserId',
    'userDisplayName',
    'userEmail',
    'userProfile',
    'userPicture',
    'workspaceCode',
    'accessToken',
    'userInfo',
    'tokenExpiresAt',
    'lastLoginTime',
    'mindflowUserId',
    'isPhoneVerified',
    'lastSyncTime'
  ];

  const keysToDelete = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // user_ 로 시작하는 키는 계정별 키이므로 제외
      if (key.startsWith('user_') || key === 'currentUserId') {
        continue;
      }

      // 공유 키 패턴과 매칭되는지 확인
      const isSharedKey = sharedKeyPatterns.some(pattern =>
        key.includes(pattern) || key === pattern
      );

      if (isSharedKey) {
        keysToDelete.push(key);
      }
    }
  }

  // 찾은 키들 삭제
  keysToDelete.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`✅ 공유 키 정리 완료: ${keysToDelete.length}개 항목 삭제`);
  if (keysToDelete.length > 0) {
    console.log('  삭제된 키:', keysToDelete.join(', '));
  }
};
