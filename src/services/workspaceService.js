// 워크스페이스 서비스 (Stub - 기능 비활성화됨)
// 협업방 서비스와의 호환성을 위해 최소한의 stub만 유지

/**
 * 사용자 ID로 워크스페이스 조회 (Stub)
 * @param {string} userId - Firebase 사용자 ID
 * @returns {Promise<{success: boolean, data?: object}>}
 */
export const getWorkspaceByUserId = async (userId) => {
  // 워크스페이스 기능이 제거되었으므로 기본값 반환
  return {
    success: true,
    data: {
      workspaceId: `workspace_${userId}`,
      userId: userId,
      createdAt: Date.now()
    }
  };
};

/**
 * 워크스페이스 통계 업데이트 (Stub)
 * @param {string} workspaceId - 워크스페이스 ID
 * @returns {Promise<void>}
 */
export const updateWorkspaceStats = async (workspaceId) => {
  // 워크스페이스 기능이 제거되었으므로 아무것도 하지 않음
  console.log('워크스페이스 통계 업데이트 스킵 (기능 비활성화):', workspaceId);
  return;
};

/**
 * 워크스페이스 존재 확인 (Stub - 항상 true 반환)
 * @param {string} userId - Firebase 사용자 ID
 * @returns {Promise<boolean>}
 */
export const checkWorkspaceExists = async (userId) => {
  return true;
};

/**
 * 워크스페이스 생성 (Stub - 아무것도 하지 않음)
 * @param {string} userId - Firebase 사용자 ID
 * @param {string} displayName - 사용자 이름
 * @param {string} email - 이메일
 * @returns {Promise<void>}
 */
export const createWorkspace = async (userId, displayName, email) => {
  console.log('워크스페이스 생성 스킵 (기능 비활성화)');
  return;
};

/**
 * 워크스페이스 코드로 검색 (Stub - 항상 실패 반환)
 * @param {string} workspaceCode - 워크스페이스 코드
 * @returns {Promise<{success: boolean, data?: object}>}
 */
export const getWorkspaceByCode = async (workspaceCode) => {
  // 워크스페이스 기능이 제거되었으므로 항상 실패 반환
  return {
    success: false,
    data: null
  };
};
