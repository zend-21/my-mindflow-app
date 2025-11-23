// 협업 시스템 Firebase 서비스

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createWorkspace, checkWorkspaceExists, getWorkspaceByCode } from './workspaceService';

// ========================================
// 1. 사용자 프로필 관리
// ========================================

/**
 * 사용자 프로필 생성/업데이트
 */
export const createOrUpdateUserProfile = async (userData) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const userRef = doc(db, 'users', auth.currentUser.uid);

  const profileData = {
    uid: auth.currentUser.uid,
    email: userData.email || auth.currentUser.email,
    displayName: userData.displayName || auth.currentUser.displayName || '익명',
    photoURL: userData.photoURL || auth.currentUser.photoURL || '',
    onlineStatus: 'online',
    lastSeen: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(userRef, profileData, { merge: true });

  // 워크스페이스가 없으면 생성
  try {
    const workspaceExists = await checkWorkspaceExists(auth.currentUser.uid);
    if (!workspaceExists) {
      console.log('워크스페이스가 없습니다. 생성합니다...');
      await createWorkspace(
        auth.currentUser.uid,
        profileData.displayName,
        profileData.email
      );
      console.log('워크스페이스 생성 완료');
    }
  } catch (error) {
    console.error('워크스페이스 생성 오류:', error);
    // 워크스페이스 생성 실패해도 사용자 프로필은 유지
  }

  return profileData;
};

/**
 * 사용자 온라인 상태 업데이트
 */
export const updateOnlineStatus = async (status) => {
  if (!auth.currentUser) return;

  const userRef = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(userRef, {
    onlineStatus: status,
    lastSeen: Date.now()
  });
};

/**
 * 사용자 검색 (워크스페이스 코드로)
 */
export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];

  try {
    console.log('🔍 워크스페이스 검색 시작:', searchTerm);

    // 워크스페이스 코드로 검색
    const workspaceResult = await getWorkspaceByCode(searchTerm);
    console.log('🔍 워크스페이스 검색 결과:', workspaceResult);

    if (!workspaceResult || !workspaceResult.success || !workspaceResult.data) {
      console.log('❌ 워크스페이스를 찾을 수 없습니다');
      return [];
    }

    const workspace = workspaceResult.data;
    console.log('🔍 워크스페이스 데이터:', workspace);

    if (!workspace.ownerId) {
      console.log('❌ 워크스페이스 소유자가 없습니다');
      return [];
    }

    console.log('🔍 워크스페이스 소유자 ID:', workspace.ownerId);
    console.log('🔍 현재 사용자 ID:', auth.currentUser?.uid);

    // 자기 자신은 제외
    if (workspace.ownerId === auth.currentUser?.uid) {
      console.log('❌ 자기 자신은 검색 결과에서 제외됩니다');
      return [];
    }

    // 워크스페이스 소유자 정보 가져오기
    const userRef = doc(db, 'users', workspace.ownerId);
    console.log('🔍 사용자 문서 경로:', `users/${workspace.ownerId}`);

    const userDoc = await getDoc(userRef);
    console.log('🔍 사용자 문서 존재 여부:', userDoc.exists());

    if (!userDoc.exists()) {
      console.log('⚠️ 사용자 프로필이 없지만 워크스페이스 정보로 결과 반환');
      // 사용자 프로필이 없어도 워크스페이스 정보로 검색 결과 제공
      return [{
        id: workspace.ownerId,
        displayName: workspace.ownerName || `사용자 ${workspace.ownerId.substring(0, 8)}`,
        email: workspace.ownerEmail || '이메일 정보 없음',
        photoURL: null,
        wsCode: workspace.wsCode || searchTerm,
        // 프로필 미생성 사용자임을 표시
        isProfileIncomplete: true
      }];
    }

    const userData = userDoc.data();
    console.log('✅ 사용자 정보 찾음:', userData);

    return [{
      id: userDoc.id,
      ...userData,
      isProfileIncomplete: false
    }];
  } catch (error) {
    console.error('❌ 사용자 검색 오류:', error);
    return [];
  }
};

// ========================================
// 2. 친구 관리
// ========================================

/**
 * 친구 요청 보내기
 */
export const sendFriendRequest = async (friendId, friendName) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');
  if (friendId === auth.currentUser.uid) throw new Error('자신에게 친구 요청을 보낼 수 없습니다');

  const friendshipId = [auth.currentUser.uid, friendId].sort().join('_');
  const friendshipRef = doc(db, 'friendships', friendshipId);

  // 이미 존재하는지 확인
  const existingDoc = await getDoc(friendshipRef);
  if (existingDoc.exists()) {
    throw new Error('이미 친구 요청이 존재합니다');
  }

  const friendshipData = {
    id: friendshipId,
    userId: auth.currentUser.uid,
    friendId: friendId,
    status: 'pending',
    createdAt: Date.now()
  };

  await setDoc(friendshipRef, friendshipData);

  // 알림 생성
  await createNotification({
    userId: friendId,
    type: 'friend_request',
    title: '친구 요청',
    message: `${auth.currentUser.displayName || '사용자'}님이 친구 요청을 보냈습니다`,
    relatedId: friendshipId
  });

  return friendshipData;
};

/**
 * 친구 요청 수락
 */
export const acceptFriendRequest = async (friendshipId) => {
  const friendshipRef = doc(db, 'friendships', friendshipId);

  await updateDoc(friendshipRef, {
    status: 'accepted',
    acceptedAt: Date.now()
  });
};

/**
 * 친구 요청 거절/삭제
 */
export const rejectFriendRequest = async (friendshipId) => {
  const friendshipRef = doc(db, 'friendships', friendshipId);
  await deleteDoc(friendshipRef);
};

/**
 * 친구 목록 가져오기
 */
export const getFriends = async () => {
  if (!auth.currentUser) return [];

  const friendshipsRef = collection(db, 'friendships');
  const q1 = query(
    friendshipsRef,
    where('userId', '==', auth.currentUser.uid),
    where('status', '==', 'accepted')
  );
  const q2 = query(
    friendshipsRef,
    where('friendId', '==', auth.currentUser.uid),
    where('status', '==', 'accepted')
  );

  const [snapshot1, snapshot2] = await Promise.all([
    getDocs(q1),
    getDocs(q2)
  ]);

  const friendIds = new Set();
  snapshot1.forEach(doc => friendIds.add(doc.data().friendId));
  snapshot2.forEach(doc => friendIds.add(doc.data().userId));

  // 친구들의 프로필 정보 가져오기
  const friends = await Promise.all(
    Array.from(friendIds).map(async (friendId) => {
      const userDoc = await getDoc(doc(db, 'users', friendId));
      return userDoc.exists() ? { id: friendId, ...userDoc.data() } : null;
    })
  );

  return friends.filter(f => f !== null);
};

// ========================================
// 3. 메모/스케줄 공유
// ========================================

/**
 * 메모/스케줄 공유하기
 */
export const shareNote = async (noteData, participants, type = 'memo') => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const sharedNoteRef = doc(collection(db, 'sharedNotes'));
  const sharedNoteId = sharedNoteRef.id;

  const participantsData = {
    [auth.currentUser.uid]: {
      permission: 'admin',
      joinedAt: Date.now(),
      displayName: auth.currentUser.displayName || '나',
      photoURL: auth.currentUser.photoURL || ''
    }
  };

  // 초대된 참여자들 추가
  participants.forEach(p => {
    participantsData[p.id] = {
      permission: p.permission || 'read',
      joinedAt: Date.now(),
      displayName: p.displayName,
      photoURL: p.photoURL || ''
    };
  });

  const sharedNote = {
    id: sharedNoteId,
    type: type,
    ownerId: auth.currentUser.uid,
    ownerName: auth.currentUser.displayName || '나',
    title: noteData.title || '제목 없음',
    content: noteData.content || '',
    originalData: noteData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    participants: participantsData,
    readBy: {
      [auth.currentUser.uid]: Date.now()
    }
  };

  await setDoc(sharedNoteRef, sharedNote);

  // 참여자들에게 알림 전송
  await Promise.all(
    participants.map(p =>
      createNotification({
        userId: p.id,
        type: 'share_invite',
        title: '공유 초대',
        message: `${auth.currentUser.displayName}님이 ${type === 'memo' ? '메모' : '스케줄'}를 공유했습니다`,
        relatedId: sharedNoteId
      })
    )
  );

  return sharedNote;
};

/**
 * 공유된 메모/스케줄 목록 가져오기
 */
export const getSharedNotes = async () => {
  if (!auth.currentUser) return [];

  const sharedNotesRef = collection(db, 'sharedNotes');
  const q = query(sharedNotesRef, orderBy('updatedAt', 'desc'));

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(note => note.participants && note.participants[auth.currentUser.uid]);
};

/**
 * 특정 공유 메모/스케줄 가져오기
 */
export const getSharedNote = async (noteId) => {
  const noteRef = doc(db, 'sharedNotes', noteId);
  const noteDoc = await getDoc(noteRef);

  if (!noteDoc.exists()) throw new Error('공유 메모를 찾을 수 없습니다');

  return { id: noteDoc.id, ...noteDoc.data() };
};

/**
 * 공유 메모 읽음 처리
 */
export const markNoteAsRead = async (noteId) => {
  if (!auth.currentUser) return;

  const noteRef = doc(db, 'sharedNotes', noteId);
  await updateDoc(noteRef, {
    [`readBy.${auth.currentUser.uid}`]: Date.now()
  });
};

// ========================================
// 4. 수정 제안 시스템
// ========================================

/**
 * 수정 제안 생성
 */
export const createEditSuggestion = async (noteId, originalContent, suggestedContent, changes) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const suggestionRef = doc(collection(db, 'editSuggestions'));
  const suggestionId = suggestionRef.id;

  const suggestion = {
    id: suggestionId,
    noteId: noteId,
    userId: auth.currentUser.uid,
    userName: auth.currentUser.displayName || '익명',
    userPhoto: auth.currentUser.photoURL || '',
    originalContent: originalContent,
    suggestedContent: suggestedContent,
    changes: changes,
    status: 'pending',
    createdAt: Date.now()
  };

  await setDoc(suggestionRef, suggestion);

  // 방 주인에게 알림
  const note = await getSharedNote(noteId);
  if (note.ownerId !== auth.currentUser.uid) {
    await createNotification({
      userId: note.ownerId,
      type: 'edit_suggestion',
      title: '수정 제안',
      message: `${auth.currentUser.displayName}님이 수정을 제안했습니다`,
      relatedId: suggestionId
    });
  }

  return suggestion;
};

/**
 * 수정 제안 승인
 */
export const approveEditSuggestion = async (suggestionId) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const suggestionRef = doc(db, 'editSuggestions', suggestionId);
  const suggestionDoc = await getDoc(suggestionRef);

  if (!suggestionDoc.exists()) throw new Error('수정 제안을 찾을 수 없습니다');

  const suggestion = suggestionDoc.data();

  // 공유 메모 업데이트
  const noteRef = doc(db, 'sharedNotes', suggestion.noteId);
  await updateDoc(noteRef, {
    content: suggestion.suggestedContent,
    updatedAt: Date.now()
  });

  // 제안 상태 업데이트
  await updateDoc(suggestionRef, {
    status: 'approved',
    reviewedAt: Date.now(),
    reviewedBy: auth.currentUser.uid
  });

  // 제안자에게 알림
  await createNotification({
    userId: suggestion.userId,
    type: 'edit_approved',
    title: '수정 승인',
    message: '수정 제안이 승인되었습니다',
    relatedId: suggestion.noteId
  });
};

/**
 * 수정 제안 거절
 */
export const rejectEditSuggestion = async (suggestionId) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const suggestionRef = doc(db, 'editSuggestions', suggestionId);
  const suggestionDoc = await getDoc(suggestionRef);

  if (!suggestionDoc.exists()) throw new Error('수정 제안을 찾을 수 없습니다');

  const suggestion = suggestionDoc.data();

  await updateDoc(suggestionRef, {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewedBy: auth.currentUser.uid
  });

  // 제안자에게 알림
  await createNotification({
    userId: suggestion.userId,
    type: 'edit_rejected',
    title: '수정 거절',
    message: '수정 제안이 거절되었습니다',
    relatedId: suggestion.noteId
  });
};

/**
 * 특정 메모의 수정 제안 목록 가져오기
 */
export const getEditSuggestions = async (noteId) => {
  const suggestionsRef = collection(db, 'editSuggestions');
  const q = query(
    suggestionsRef,
    where('noteId', '==', noteId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ========================================
// 5. 실시간 채팅
// ========================================

/**
 * 채팅 메시지 전송
 */
export const sendChatMessage = async (roomId, content, type = 'text', editSuggestionId = null) => {
  if (!auth.currentUser) throw new Error('로그인이 필요합니다');

  const messageRef = doc(collection(db, 'chatMessages'));
  const messageId = messageRef.id;

  const message = {
    id: messageId,
    roomId: roomId,
    userId: auth.currentUser.uid,
    userName: auth.currentUser.displayName || '익명',
    userPhoto: auth.currentUser.photoURL || '',
    type: type,
    content: content,
    editSuggestionId: editSuggestionId,
    createdAt: Date.now(),
    readBy: {
      [auth.currentUser.uid]: Date.now()
    }
  };

  await setDoc(messageRef, message);

  // 공유 메모의 updatedAt 갱신
  const noteRef = doc(db, 'sharedNotes', roomId);
  await updateDoc(noteRef, {
    updatedAt: Date.now()
  });

  return message;
};

/**
 * 채팅 메시지 실시간 구독
 */
export const subscribeToChatMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'chatMessages');
  const q = query(
    messagesRef,
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

/**
 * 채팅 메시지 읽음 처리
 */
export const markMessagesAsRead = async (messageIds) => {
  if (!auth.currentUser) return;

  await Promise.all(
    messageIds.map(messageId => {
      const messageRef = doc(db, 'chatMessages', messageId);
      return updateDoc(messageRef, {
        [`readBy.${auth.currentUser.uid}`]: Date.now()
      });
    })
  );
};

// ========================================
// 6. 알림 시스템
// ========================================

/**
 * 알림 생성
 */
export const createNotification = async (notificationData) => {
  if (!auth.currentUser) return;

  const notificationRef = doc(collection(db, 'notifications'));

  const notification = {
    id: notificationRef.id,
    userId: notificationData.userId,
    fromUserId: auth.currentUser.uid,
    fromUserName: auth.currentUser.displayName || '익명',
    fromUserPhoto: auth.currentUser.photoURL || '',
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    relatedId: notificationData.relatedId || null,
    isRead: false,
    createdAt: Date.now()
  };

  await setDoc(notificationRef, notification);
  return notification;
};

/**
 * 알림 목록 가져오기
 */
export const getNotifications = async () => {
  if (!auth.currentUser) return [];

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true
  });
};

/**
 * 알림 실시간 구독
 */
export const subscribeToNotifications = (callback) => {
  if (!auth.currentUser) return () => {};

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', auth.currentUser.uid),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  });
};
