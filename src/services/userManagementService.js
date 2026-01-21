// src/services/userManagementService.js
// 친구 삭제 목록 및 차단 목록 관리 서비스

import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * 삭제된 친구를 deletedFriends 컬렉션에 추가
 * @param {string} myUserId - 내 사용자 ID
 * @param {object} friendData - 친구 데이터
 */
export const addToDeletedFriends = async (myUserId, friendData) => {
  try {
    const deletedFriendRef = doc(db, 'users', myUserId, 'deletedFriends', friendData.friendId);
    await setDoc(deletedFriendRef, {
      friendId: friendData.friendId,
      friendName: friendData.friendName,
      friendEmail: friendData.friendEmail || '',
      friendWorkspaceCode: friendData.friendWorkspaceCode,
      deletedAt: Timestamp.now(),
      originalAddedAt: friendData.addedAt || null,
    });
    console.log('✅ 삭제된 친구 목록에 추가 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 삭제된 친구 목록 추가 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 삭제된 친구 목록 가져오기
 * @param {string} userId - 사용자 ID
 */
export const getDeletedFriends = async (userId) => {
  try {
    const deletedFriendsRef = collection(db, 'users', userId, 'deletedFriends');
    const snapshot = await getDocs(deletedFriendsRef);

    const deletedFriends = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return deletedFriends;
  } catch (error) {
    console.error('삭제된 친구 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 삭제된 친구를 영구 삭제
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} friendId - 친구 ID
 */
export const permanentlyDeleteFriend = async (myUserId, friendId) => {
  try {
    await deleteDoc(doc(db, 'users', myUserId, 'deletedFriends', friendId));
    console.log('✅ 친구 영구 삭제 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 영구 삭제 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 차단 (카카오톡 방식)
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetUserId - 차단할 사용자 ID
 * @param {object} userData - 사용자 데이터
 *
 * 카카오톡 방식:
 * - 친구 목록에서 삭제
 * - DM 방은 유지 (대화 내용 모두 보임)
 * - 대화방에서 메시지 전송만 차단
 */
export const blockUser = async (myUserId, targetUserId, userData) => {
  try {
    const blockedUserRef = doc(db, 'users', myUserId, 'blockedUsers', targetUserId);
    await setDoc(blockedUserRef, {
      userId: targetUserId,
      userName: userData.userName || '익명',
      userEmail: userData.userEmail || '',
      userWorkspaceCode: userData.userWorkspaceCode || '',
      blockedAt: Timestamp.now(),
    });

    // 친구 목록에서 삭제
    try {
      console.log('🗑️ 친구 목록에서 삭제 시도:', { myUserId, targetUserId });
      await deleteDoc(doc(db, 'users', myUserId, 'friends', targetUserId));
      console.log('✅ 친구 목록에서 삭제 완료');
    } catch (error) {
      console.warn('⚠️ 친구 목록에서 삭제 실패 (이미 삭제됨 또는 없음):', error);
    }

    // 삭제된 친구 목록에서도 삭제
    try {
      await deleteDoc(doc(db, 'users', myUserId, 'deletedFriends', targetUserId));
    } catch (error) {
      console.warn('삭제된 친구 목록에서 삭제 실패 (없음):', error);
    }

    // 상대방의 friendRequests에서 내 요청 삭제 (재추가 시 충돌 방지)
    try {
      console.log('🗑️ 상대방 friendRequests에서 삭제 시도:', { targetUserId, myUserId });
      await deleteDoc(doc(db, 'users', targetUserId, 'friendRequests', myUserId));
      console.log('✅ 상대방 friendRequests에서 삭제 완료');
    } catch (error) {
      console.warn('⚠️ 상대방 friendRequests 삭제 실패 (없음):', error);
    }

    // 카카오톡 방식: DM 방은 유지 (메시지 전송만 차단)
    // DM 방 숨김 처리 제거

    console.log('✅ 사용자 차단 완료 (DM 방 유지, 메시지 전송 차단)');
    return { success: true };
  } catch (error) {
    console.error('❌ 사용자 차단 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 차단된 사용자 목록 가져오기
 * @param {string} userId - 사용자 ID
 */
export const getBlockedUsers = async (userId) => {
  try {
    const blockedUsersRef = collection(db, 'users', userId, 'blockedUsers');
    const snapshot = await getDocs(blockedUsersRef);

    const blockedUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return blockedUsers;
  } catch (error) {
    console.error('차단된 사용자 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 사용자 차단 해제
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetUserId - 차단 해제할 사용자 ID
 */
export const unblockUser = async (myUserId, targetUserId) => {
  try {
    await deleteDoc(doc(db, 'users', myUserId, 'blockedUsers', targetUserId));
    console.log('✅ 사용자 차단 해제 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 사용자 차단 해제 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자가 차단되었는지 확인
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetUserId - 확인할 사용자 ID
 */
export const isUserBlocked = async (myUserId, targetUserId) => {
  try {
    const blockedUserDoc = await getDoc(doc(db, 'users', myUserId, 'blockedUsers', targetUserId));
    return blockedUserDoc.exists();
  } catch (error) {
    console.error('차단 확인 오류:', error);
    return false;
  }
};
