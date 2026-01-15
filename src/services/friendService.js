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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

/**
 * WS 코드로 사용자 검색
 * @param {string} workspaceCode - WS 코드 (대소문자 구분 없이 자동 변환)
 */
export const getUserByWorkspaceCode = async (workspaceCode) => {
  try {
    // 입력값을 대문자로 변환하여 대소문자 구분 없이 검색
    const normalizedCode = workspaceCode.toUpperCase();

    const q = query(
      collection(db, 'workspaces'),
      where('workspaceCode', '==', normalizedCode)
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

    const userData = userDoc.data();

    // 닉네임 가져오기 (앱 내 설정 우선)
    const nicknameDocRef = doc(db, 'nicknames', userId);
    const nicknameDoc = await getDoc(nicknameDocRef);
    const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

    return {
      id: userId,
      workspaceCode: normalizedCode,
      ...userData,
      // 닉네임이 있으면 displayName 덮어쓰기
      displayName: nickname || userData.displayName || '익명',
    };
  } catch (error) {
    console.error('WS 코드로 사용자 검색 오류:', error);
    throw error;
  }
};

/**
 * 일방향 친구 추가 (카카오톡 방식)
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

    // 2. 이미 친구인지 확인
    const alreadyFriend = await isFriend(myUserId, targetUser.id);
    if (alreadyFriend) {
      throw new Error('이미 친구로 등록된 사용자입니다');
    }

    // 2-1. 내가 차단한 사용자인지 확인
    try {
      const { isUserBlocked } = await import('./userManagementService');
      const isBlocked = await isUserBlocked(myUserId, targetUser.id);
      if (isBlocked) {
        throw new Error('차단한 사용자입니다. 차단을 해제한 후 친구 추가해 주세요.');
      }
    } catch (error) {
      // isUserBlocked 에러가 아닌 경우만 재throw
      if (error.message.includes('차단한 사용자')) {
        throw error;
      }
      console.warn('차단 확인 실패 (무시):', error);
    }

    // 3. 내 정보 가져오기
    const myUserDoc = await getDoc(doc(db, 'users', myUserId));
    if (!myUserDoc.exists()) {
      throw new Error('내 정보를 찾을 수 없습니다');
    }

    const myUserData = myUserDoc.data();

    // 4. 내 워크스페이스 정보 가져오기
    const myWorkspaceQuery = query(
      collection(db, 'workspaces'),
      where('userId', '==', myUserId)
    );
    const myWorkspaceSnapshot = await getDocs(myWorkspaceQuery);
    const myWorkspaceCode = myWorkspaceSnapshot.docs[0]?.data().workspaceCode;

    const timestamp = Timestamp.now();

    // 4-1. 상대방의 앱 닉네임 가져오기 (우선순위)
    let targetDisplayName = targetUser.displayName || targetUser.email || '익명';
    try {
      const { getUserDisplayName } = await import('./nicknameService');
      targetDisplayName = await getUserDisplayName(targetUser.id, targetUser.displayName);
    } catch (error) {
      console.warn('타겟 사용자 닉네임 조회 실패:', error);
    }

    // 4-2. 내 앱 닉네임 가져오기
    let myDisplayName = myUserData.displayName || myUserData.email || '익명';
    try {
      const { getUserDisplayName } = await import('./nicknameService');
      myDisplayName = await getUserDisplayName(myUserId, myUserData.displayName);
    } catch (error) {
      console.warn('내 닉네임 조회 실패:', error);
    }

    // 5. 내 친구 목록에만 추가 (일방향)
    await setDoc(doc(db, 'users', myUserId, 'friends', targetUser.id), {
      friendId: targetUser.id,
      friendName: targetDisplayName,
      friendEmail: targetUser.email || '',
      friendWorkspaceCode: targetWorkspaceCode,
      addedAt: timestamp,
    });

    // 6. 상대방의 friendRequests에 내가 추가했다는 알림 (상대방은 아직 친구 아님)
    await setDoc(doc(db, 'users', targetUser.id, 'friendRequests', myUserId), {
      requesterId: myUserId,
      requesterName: myDisplayName,
      requesterEmail: myUserData.email || '',
      requesterWorkspaceCode: myWorkspaceCode,
      requestedAt: timestamp,
    });

    // 7. deletedFriends에서 삭제 (재추가하는 경우)
    try {
      const { permanentlyDeleteFriend } = await import('./userManagementService');
      await permanentlyDeleteFriend(myUserId, targetUser.id);
      console.log('🗑️ deletedFriends에서 제거 완료');
    } catch (error) {
      console.warn('deletedFriends 삭제 실패 (무시):', error);
      // deletedFriends에 없을 수도 있으므로 실패는 무시
    }

    // DM 방은 항상 유지되므로 숨김 해제 불필요

    console.log('✅ 친구 추가 완료 (일방향):', targetUser.displayName || targetUser.email);

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
 * 친구 삭제 (일방향 - 카카오톡 방식)
 * 내 친구 목록에서만 삭제되고, 상대방 친구 목록에는 남아있음
 * DM 방은 유지되며 계속 대화 가능 (카카오톡 방식)
 */
export const removeFriend = async (myUserId, friendId) => {
  try {
    // 1. 친구 데이터 가져오기 (deletedFriends에 저장하기 위해)
    const friendDoc = await getDoc(doc(db, 'users', myUserId, 'friends', friendId));
    const friendData = friendDoc.exists() ? friendDoc.data() : null;

    // 2. 내 친구 목록에서만 삭제 (상대방 친구 목록에는 유지)
    await deleteDoc(doc(db, 'users', myUserId, 'friends', friendId));

    // 3. deletedFriends 컬렉션에 추가
    if (friendData) {
      try {
        const { addToDeletedFriends } = await import('./userManagementService');
        await addToDeletedFriends(myUserId, friendData);
      } catch (error) {
        console.warn('삭제된 친구 목록 추가 실패 (무시):', error);
        // deletedFriends 추가 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 카카오톡 방식: DM 방은 유지하고 계속 대화 가능
    // (DM 방 숨김 처리 제거)

    console.log('✅ 친구 삭제 완료 (일방향, DM 방 유지)');
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

/**
 * 나를 친구로 추가한 사람 목록 가져오기
 */
export const getFriendRequests = async (userId) => {
  try {
    const requestsRef = collection(db, 'users', userId, 'friendRequests');
    const snapshot = await getDocs(requestsRef);

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return requests;
  } catch (error) {
    console.error('친구 요청 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 친구 요청 수락 (나도 상대방을 친구로 추가)
 */
export const acceptFriendRequest = async (myUserId, requesterId) => {
  try {
    // 1. 요청자 정보 가져오기
    const requestDoc = await getDoc(doc(db, 'users', myUserId, 'friendRequests', requesterId));

    if (!requestDoc.exists()) {
      throw new Error('친구 요청을 찾을 수 없습니다');
    }

    const requestData = requestDoc.data();
    const timestamp = Timestamp.now();

    // 2. 내 친구 목록에 추가
    await setDoc(doc(db, 'users', myUserId, 'friends', requesterId), {
      friendId: requesterId,
      friendName: requestData.requesterName,
      friendEmail: requestData.requesterEmail,
      friendWorkspaceCode: requestData.requesterWorkspaceCode,
      addedAt: timestamp,
    });

    // 3. friendRequests에서 삭제 (이제 친구가 되었으므로)
    await deleteDoc(doc(db, 'users', myUserId, 'friendRequests', requesterId));

    // 4. deletedFriends에서 삭제 (재추가하는 경우)
    try {
      const { permanentlyDeleteFriend } = await import('./userManagementService');
      await permanentlyDeleteFriend(myUserId, requesterId);
      console.log('🗑️ deletedFriends에서 제거 완료');
    } catch (error) {
      console.warn('deletedFriends 삭제 실패 (무시):', error);
      // deletedFriends에 없을 수도 있으므로 실패는 무시
    }

    // DM 방은 항상 유지되므로 숨김 해제 불필요

    console.log('✅ 친구 요청 수락 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 요청 수락 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 친구 요청 거절/숨기기 (삭제 대신 hidden 필드 추가)
 */
export const rejectFriendRequest = async (myUserId, requesterId) => {
  try {
    // friendRequests에 hidden 필드 추가 (삭제하지 않음)
    await setDoc(doc(db, 'users', myUserId, 'friendRequests', requesterId), {
      hidden: true,
      hiddenAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ 친구 요청 숨김 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 요청 숨김 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 숨긴 친구 요청 목록 조회
 */
export const getHiddenFriendRequests = async (userId) => {
  try {
    const requestsRef = collection(db, 'users', userId, 'friendRequests');
    const snapshot = await getDocs(requestsRef);

    const hiddenRequests = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // hidden이 true인 요청만 필터링
      if (data.hidden === true) {
        hiddenRequests.push({
          id: docSnap.id,
          requesterId: data.requesterId || docSnap.id,
          requesterName: data.requesterName || '익명',
          requesterWorkspaceCode: data.requesterWorkspaceCode || '-',
          createdAt: data.createdAt,
          hiddenAt: data.hiddenAt
        });
      }
    }

    console.log('✅ 숨긴 친구 요청 목록 조회 완료:', hiddenRequests.length);
    return { success: true, requests: hiddenRequests };
  } catch (error) {
    console.error('❌ 숨긴 친구 요청 목록 조회 실패:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

/**
 * 숨긴 친구 요청 복구 (다시 표시)
 */
export const unhideRequest = async (userId, requesterId) => {
  try {
    const requestRef = doc(db, 'users', userId, 'friendRequests', requesterId);

    // hidden 필드 제거
    await setDoc(requestRef, {
      hidden: false
    }, { merge: true });

    console.log('✅ 친구 요청 복구 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 요청 복구 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 숨긴 친구 요청 영구 삭제
 */
export const permanentlyDeleteRequest = async (userId, requesterId) => {
  try {
    const requestRef = doc(db, 'users', userId, 'friendRequests', requesterId);
    await deleteDoc(requestRef);

    console.log('✅ 친구 요청 영구 삭제 완료');
    return { success: true };
  } catch (error) {
    console.error('❌ 친구 요청 영구 삭제 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
