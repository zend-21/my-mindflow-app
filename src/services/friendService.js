// src/services/friendService.js
// 친구 추가 및 관리 서비스

import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

/**
 * WS 코드로 사용자 검색
 */
export const getUserByWorkspaceCode = async (workspaceCode) => {
  try {
    const q = query(
      collection(db, 'workspaces'),
      where('workspaceCode', '==', workspaceCode)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const workspaceData = snapshot.docs[0].data();
    const userId = workspaceData.userId;

    // 사용자 정보 가져오기
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userId,
      workspaceCode: workspaceCode,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('WS 코드로 사용자 검색 오류:', error);
    throw error;
  }
};

/**
 * 즉시 양방향 친구 추가 (QR 스캔용)
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetWorkspaceCode - 친구의 WS 코드
 */
export const addFriendInstantly = async (myUserId, targetWorkspaceCode) => {
  try {
    // 1. 대상 사용자 검색
    const targetUser = await getUserByWorkspaceCode(targetWorkspaceCode);

    if (!targetUser) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 자기 자신 추가 방지
    if (myUserId === targetUser.id) {
      throw new Error('자기 자신은 추가할 수 없습니다');
    }

    // 2. 내 정보 가져오기
    const myUserDoc = await getDoc(doc(db, 'users', myUserId));
    if (!myUserDoc.exists()) {
      throw new Error('내 정보를 찾을 수 없습니다');
    }

    const myUserData = myUserDoc.data();

    // 3. 내 워크스페이스 정보 가져오기
    const myWorkspaceQuery = query(
      collection(db, 'workspaces'),
      where('userId', '==', myUserId)
    );
    const myWorkspaceSnapshot = await getDocs(myWorkspaceQuery);
    const myWorkspaceCode = myWorkspaceSnapshot.docs[0]?.data().workspaceCode;

    // 4. 양방향 친구 추가
    const timestamp = Timestamp.now();

    // 내 친구 목록에 추가
    await setDoc(doc(db, 'users', myUserId, 'friends', targetUser.id), {
      friendId: targetUser.id,
      friendName: targetUser.displayName || targetUser.email || '익명',
      friendEmail: targetUser.email || '',
      friendWorkspaceCode: targetWorkspaceCode,
      addedAt: timestamp,
    });

    // 상대방 친구 목록에 추가
    await setDoc(doc(db, 'users', targetUser.id, 'friends', myUserId), {
      friendId: myUserId,
      friendName: myUserData.displayName || myUserData.email || '익명',
      friendEmail: myUserData.email || '',
      friendWorkspaceCode: myWorkspaceCode,
      addedAt: timestamp,
    });

    console.log('✅ 친구 추가 완료:', targetUser.displayName || targetUser.email);

    return {
      success: true,
      friend: {
        id: targetUser.id,
        name: targetUser.displayName || targetUser.email || '익명',
        workspaceCode: targetWorkspaceCode,
      }
    };
  } catch (error) {
    console.error('❌ 친구 추가 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 내 친구 목록 가져오기
 */
export const getMyFriends = async (userId) => {
  try {
    const friendsRef = collection(db, 'users', userId, 'friends');
    const snapshot = await getDocs(friendsRef);

    const friends = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return friends;
  } catch (error) {
    console.error('친구 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 친구 삭제
 */
export const removeFriend = async (myUserId, friendId) => {
  try {
    // 내 친구 목록에서 삭제
    await deleteDoc(doc(db, 'users', myUserId, 'friends', friendId));

    // 상대방 친구 목록에서도 삭제
    await deleteDoc(doc(db, 'users', friendId, 'friends', myUserId));

    console.log('✅ 친구 삭제 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 삭제 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 이미 친구인지 확인
 */
export const isFriend = async (myUserId, targetUserId) => {
  try {
    const friendDoc = await getDoc(doc(db, 'users', myUserId, 'friends', targetUserId));
    return friendDoc.exists();
  } catch (error) {
    console.error('친구 확인 오류:', error);
    return false;
  }
};
