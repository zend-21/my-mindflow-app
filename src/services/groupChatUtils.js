// 📁 그룹 채팅 유틸리티 함수
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 사용자 정보 가져오기 (닉네임 우선)
 * @param {string} userId - 사용자 UID
 * @returns {Promise<Object>} { displayName, profileImage }
 */
export const getUserInfo = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { displayName: '익명', profileImage: null };
    }

    const userData = userDoc.data();

    // 닉네임 가져오기 (앱 내 설정 우선)
    const nicknameDoc = await getDoc(doc(db, 'nicknames', userId));
    const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

    return {
      displayName: nickname || userData.displayName || '익명',
      profileImage: userData.profileImage || null
    };
  } catch (error) {
    console.error('❌ 사용자 정보 가져오기 실패:', error);
    return { displayName: '익명', profileImage: null };
  }
};

/**
 * 여러 사용자 정보 한 번에 가져오기
 * @param {Array<string>} userIds - 사용자 UID 배열
 * @returns {Promise<Object>} { [userId]: { displayName, profileImage } }
 */
export const getUsersInfo = async (userIds) => {
  const usersInfo = {};

  await Promise.all(
    userIds.map(async (userId) => {
      usersInfo[userId] = await getUserInfo(userId);
    })
  );

  return usersInfo;
};

/**
 * 초대 코드 생성
 * @returns {string} 초대 코드 (예: INV-ABC123)
 */
export const generateInviteCode = () => {
  return `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

/**
 * 그룹 정보 검증
 * @param {Object} groupData - 그룹 데이터
 * @param {string} userId - 사용자 UID
 * @param {string} requiredRole - 필요한 역할 ('creator', 'member', 'subManager')
 * @throws {Error} 권한이 없으면 에러 발생
 */
export const validateGroupPermission = (groupData, userId, requiredRole = 'member') => {
  if (!groupData) {
    throw new Error('그룹을 찾을 수 없습니다.');
  }

  // 멤버 확인
  if (!groupData.members.includes(userId)) {
    throw new Error('그룹 멤버가 아닙니다.');
  }

  // 방장 권한 필요
  if (requiredRole === 'creator' && groupData.creatorId !== userId) {
    throw new Error('방장만 이 작업을 수행할 수 있습니다.');
  }

  // 부방장 이상 권한 필요
  if (requiredRole === 'subManager') {
    const isCreator = groupData.creatorId === userId;
    const isSubManager = groupData.subManagers?.[userId];
    if (!isCreator && !isSubManager) {
      throw new Error('방장 또는 부방장만 이 작업을 수행할 수 있습니다.');
    }
  }
};

/**
 * 멤버 상태 확인
 * @param {Object} groupData - 그룹 데이터
 * @param {string} userId - 사용자 UID
 * @returns {string} 'active', 'pending', 'rejected', 'not_member'
 */
export const getMemberStatus = (groupData, userId) => {
  if (!groupData.members.includes(userId)) {
    return 'not_member';
  }

  const memberInfo = groupData.membersInfo?.[userId];
  return memberInfo?.status || 'active';
};

/**
 * 그룹에서 active 멤버 수 세기
 * @param {Object} groupData - 그룹 데이터
 * @returns {number} active 멤버 수
 */
export const getActiveMemberCount = (groupData) => {
  if (!groupData.membersInfo) {
    return 0;
  }

  return Object.values(groupData.membersInfo).filter(
    memberInfo => memberInfo.status === 'active'
  ).length;
};

/**
 * 부방장 권한 확인
 * @param {Object} groupData - 그룹 데이터
 * @param {string} userId - 사용자 UID
 * @param {string} permission - 확인할 권한 (예: 'kick_member')
 * @returns {boolean} 권한이 있으면 true
 */
export const hasSubManagerPermission = (groupData, userId, permission) => {
  // 방장은 모든 권한 소유
  if (groupData.creatorId === userId) {
    return true;
  }

  // 부방장 권한 확인
  const subManager = groupData.subManagers?.[userId];
  if (!subManager) {
    return false;
  }

  return subManager.permissions?.includes(permission) || false;
};

/**
 * 에러 메시지 파싱 (차단 관련 에러 등)
 * @param {Error} error - 에러 객체
 * @returns {Object} { type, message, data }
 */
export const parseGroupChatError = (error) => {
  const message = error.message || '';

  // 차단 관련 에러
  if (message.startsWith('BLOCKED_BY_YOU:')) {
    return {
      type: 'BLOCKED_BY_YOU',
      message: '차단한 사용자를 초대할 수 없습니다.',
      data: message.split(':')[1]
    };
  }

  if (message.startsWith('BLOCKED_MEMBERS_IN_GROUP:')) {
    return {
      type: 'BLOCKED_MEMBERS_IN_GROUP',
      message: '그룹에 차단한 사용자가 있습니다.',
      data: message.split(':')[1]
    };
  }

  // 일반 에러
  return {
    type: 'GENERAL',
    message: message,
    data: null
  };
};
