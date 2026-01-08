// 1:1 대화방 (Direct Message) 관리 서비스
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  updateDoc, serverTimestamp, onSnapshot, orderBy, limit, addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { enterRoom, exitRoom, createMarkAsReadDebounced } from './messageService';

/**
 * 1:1 대화방 ID 생성 (정렬된 userId 조합)
 * @param {string} userId1
 * @param {string} userId2
 * @returns {string} dm_userId1_userId2 (알파벳순 정렬)
 */
const generateDMRoomId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `dm_${sortedIds[0]}_${sortedIds[1]}`;
};

/**
 * 1:1 대화방 생성 또는 가져오기
 * @param {string} targetUserId - 대화 상대 userId
 * @param {object} targetUserInfo - 대화 상대 정보 {displayName, email, photoURL}
 * @returns {Promise<{success: boolean, roomId: string, data: object}>}
 */
export const createOrGetDMRoom = async (targetUserId, targetUserInfo) => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다');
    }

    const currentUserId = auth.currentUser.uid;

    // 나와의 대화 허용 (메모장 용도)
    const isSelfChat = currentUserId === targetUserId;

    // 1:1 대화방 ID 생성 (나와의 대화는 특수 ID 사용)
    const roomId = isSelfChat
      ? `dm_self_${currentUserId}`
      : generateDMRoomId(currentUserId, targetUserId);
    const roomRef = doc(db, 'directMessages', roomId);

    // 기존 대화방 확인
    const existingRoom = await getDoc(roomRef);

    if (existingRoom.exists()) {
      console.log('기존 1:1 대화방 찾음:', roomId);

      // 마지막 접속 시간 및 상대방 정보 업데이트 (닉네임 변경 반영)
      const updateData = {};
      updateData[`lastAccessTime.${currentUserId}`] = serverTimestamp();

      // 상대방 정보 업데이트 (친구 닉네임 반영)
      if (targetUserInfo.displayName) {
        updateData[`participantsInfo.${targetUserId}.displayName`] = targetUserInfo.displayName;
      }

      await updateDoc(roomRef, updateData);

      // 업데이트된 데이터 반환
      const updatedData = {
        ...existingRoom.data(),
        participantsInfo: {
          ...existingRoom.data().participantsInfo,
          [targetUserId]: {
            ...existingRoom.data().participantsInfo?.[targetUserId],
            displayName: targetUserInfo.displayName || existingRoom.data().participantsInfo?.[targetUserId]?.displayName || '익명'
          }
        }
      };

      return {
        success: true,
        roomId,
        data: updatedData,
        isNew: false
      };
    }

    // 새 대화방 생성
    console.log('새 1:1 대화방 생성:', roomId);

    const roomData = {
      roomId,
      type: isSelfChat ? 'self' : 'direct', // 나와의 대화는 'self' 타입
      participants: isSelfChat ? [currentUserId] : [currentUserId, targetUserId],
      participantsInfo: {
        [currentUserId]: {
          displayName: auth.currentUser.displayName || '익명',
          email: auth.currentUser.email || '',
          photoURL: auth.currentUser.photoURL || ''
        },
        ...(isSelfChat ? {} : {
          [targetUserId]: {
            displayName: targetUserInfo.displayName || '익명',
            email: targetUserInfo.email || '',
            photoURL: targetUserInfo.photoURL || ''
          }
        })
      },
      createdAt: serverTimestamp(),
      createdBy: currentUserId,
      lastMessage: null,
      lastMessageTime: serverTimestamp(), // null 대신 초기 타임스탬프
      unreadCount: {
        [currentUserId]: 0,
        ...(isSelfChat ? {} : { [targetUserId]: 0 })
      },
      lastAccessTime: {
        [currentUserId]: serverTimestamp(),
        ...(isSelfChat ? {} : { [targetUserId]: null })
      },
      // 차단 상태 (나중에 차단 기능 구현시 사용)
      blocked: {
        [currentUserId]: false,
        ...(isSelfChat ? {} : { [targetUserId]: false })
      },
      // 대화방 숨김 상태 (나중에 구현)
      hidden: {
        [currentUserId]: false,
        ...(isSelfChat ? {} : { [targetUserId]: false })
      }
    };

    await setDoc(roomRef, roomData);

    console.log('✅ 1:1 대화방 생성 완료:', roomId);

    return {
      success: true,
      roomId,
      data: roomData,
      isNew: true
    };

  } catch (error) {
    console.error('❌ 1:1 대화방 생성/조회 오류:', error);
    throw error;
  }
};

/**
 * 내 1:1 대화방 목록 가져오기
 * @returns {Promise<Array>} 대화방 목록
 */
export const getMyDMRooms = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다');
    }

    const q = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(room => {
        // 숨김 처리된 대화방 제외 (선택사항)
        return !room.hidden?.[auth.currentUser.uid];
      });

  } catch (error) {
    console.error('❌ 1:1 대화방 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 내 1:1 대화방 목록 실시간 구독 (quota 최적화: 최근 20개만)
 * @param {function} callback
 * @returns {function} unsubscribe 함수
 */
export const subscribeToMyDMRooms = (callback) => {
  if (!auth.currentUser) {
    console.error('로그인이 필요합니다');
    return () => {};
  }

  // quota 최적화: 최근 20개 대화방만 로드
  const q = query(
    collection(db, 'directMessages'),
    where('participants', 'array-contains', auth.currentUser.uid),
    limit(20) // quota 절약: 최근 20개만
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(room => {
        // 숨김 처리된 대화방 제외
        return !room.hidden?.[auth.currentUser.uid];
      })
      .sort((a, b) => {
        // 클라이언트에서 정렬: lastMessageTime 내림차순
        const aTime = a.lastMessageTime?.toMillis?.() || 0;
        const bTime = b.lastMessageTime?.toMillis?.() || 0;
        return bTime - aTime;
      });

    callback(rooms);
  });
};

/**
 * 1:1 대화방 실시간 구독
 * @param {string} roomId
 * @param {function} callback
 * @returns {function} unsubscribe 함수
 */
export const subscribeToDMRoom = (roomId, callback) => {
  const roomRef = doc(db, 'directMessages', roomId);

  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data()
      });
    }
  });
};

/**
 * 읽음 표시 업데이트 (디바운스 적용 - quota 최적화)
 * 공통 messageService 사용
 */
const markDMAsReadDebounced = createMarkAsReadDebounced('directMessages');

// 기존 함수명 유지 (호환성)
export const markDMAsRead = (roomId) => markDMAsReadDebounced(roomId, auth.currentUser?.uid);

/**
 * 대화방 나가기 (숨기기)
 * @param {string} roomId
 */
export const leaveDMRoom = async (roomId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다');
    }

    const roomRef = doc(db, 'directMessages', roomId);

    await updateDoc(roomRef, {
      [`hidden.${auth.currentUser.uid}`]: true
    });

    console.log('✅ 대화방 나가기(숨김) 완료');

  } catch (error) {
    console.error('❌ 대화방 나가기 오류:', error);
    throw error;
  }
};

/**
 * 차단하기 (나중에 구현)
 * @param {string} roomId
 */
export const blockUser = async (roomId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다');
    }

    const roomRef = doc(db, 'directMessages', roomId);

    await updateDoc(roomRef, {
      [`blocked.${auth.currentUser.uid}`]: true
    });

    console.log('✅ 사용자 차단 완료');

  } catch (error) {
    console.error('❌ 사용자 차단 오류:', error);
    throw error;
  }
};

/**
 * 메시지 전송 (quota 최적화: roomData 캐싱)
 * @param {string} roomId
 * @param {string} text - 메시지 내용
 * @param {object} roomData - 대화방 정보 (선택사항, 전달 시 getDoc 생략)
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendMessage = async (roomId, text, roomData = null) => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인이 필요합니다');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('메시지 내용을 입력해주세요');
    }

    const messagesRef = collection(db, 'directMessages', roomId, 'messages');
    const roomRef = doc(db, 'directMessages', roomId);

    // ✅ 항상 최신 roomData를 Firestore에서 직접 읽기 (inRoom 상태 실시간 반영)
    const roomSnap = await getDoc(roomRef);
    const actualRoomData = roomSnap.exists() ? roomSnap.data() : null;
    const currentUnreadCount = actualRoomData?.unreadCount || {};

    // 상대방이 방에 있는지 확인
    const otherUserId = actualRoomData?.participants?.find(id => id !== auth.currentUser.uid);
    const isOtherUserInRoom = otherUserId && actualRoomData?.inRoom?.[otherUserId] === true;

    console.log('📤 메시지 전송:', {
      roomId,
      senderId: auth.currentUser.uid,
      currentUnreadCount,
      otherUserId,
      inRoom: actualRoomData?.inRoom,
      isOtherUserInRoom,
      willBeRead: isOtherUserInRoom
    });

    // 메시지 데이터
    const messageData = {
      text: text.trim(),
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || '익명',
      createdAt: serverTimestamp(),
      read: isOtherUserInRoom  // 상대방이 방에 있으면 즉시 read: true
    };

    // 메시지 추가
    const messageDoc = await addDoc(messagesRef, messageData);

    // 대화방의 lastMessage 업데이트
    if (actualRoomData) {

      // 나와의 대화인 경우 (otherUserId가 없음)
      if (!otherUserId) {
        await updateDoc(roomRef, {
          lastMessage: text.trim(),
          lastMessageTime: serverTimestamp()
        });
      } else {
        // 일반 1:1 대화
        // 상대방이 방에 없을 때만 unreadCount 증가
        const updateData = {
          lastMessage: text.trim(),
          lastMessageTime: serverTimestamp()
        };

        if (!isOtherUserInRoom) {
          // ✅ 현재 값을 가져와서 1 증가 (그룹 채팅과 동일)
          const currentCount = currentUnreadCount[otherUserId] || 0;
          updateData[`unreadCount.${otherUserId}`] = currentCount + 1;
        }

        await updateDoc(roomRef, updateData);
      }
    }

    return {
      success: true,
      messageId: messageDoc.id
    };

  } catch (error) {
    console.error('❌ 메시지 전송 오류:', error);
    throw error;
  }
};

/**
 * 1:1 채팅방 입장 (inRoom 상태 업데이트)
 * 공통 messageService 사용
 */
export const enterDMRoom = (roomId, userId) => enterRoom('directMessages', roomId, userId, false);

/**
 * 1:1 채팅방 퇴장 (inRoom 상태 업데이트)
 * 공통 messageService 사용
 */
export const exitDMRoom = (roomId, userId) => exitRoom('directMessages', roomId, userId);

/**
 * 메시지 목록 실시간 구독 (quota 최적화: 최근 50개 + 증분 업데이트)
 * @param {string} roomId
 * @param {function} callback
 * @returns {function} unsubscribe 함수
 */
export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'directMessages', roomId, 'messages');

  // quota 최적화: 최근 50개 메시지만 로드
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  let isInitialLoad = true;

  return onSnapshot(q, (snapshot) => {
    if (isInitialLoad) {
      // 초기 로드: 전체 메시지 (최근 50개)
      const messages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .reverse(); // 오름차순으로 변경 (오래된 것 → 최신)

      callback(messages);
      isInitialLoad = false;
    } else {
      // 증분 업데이트: 변경된 메시지만 처리 (추가 + 수정)
      const changes = [];
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          changes.push({
            id: change.doc.id,
            ...change.doc.data()
          });
        }
      });

      if (changes.length > 0) {
        // 전체 메시지 재조합 (역순 정렬 후 reverse)
        const messages = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .reverse();

        callback(messages);
      }
    }
  });
};

/**
 * 특정 사용자와의 DM 방 숨기기 (친구 삭제 시 사용)
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetUserId - 상대방 사용자 ID
 * @returns {Promise<{success: boolean}>}
 */
export const hideDMRoomWithUser = async (myUserId, targetUserId) => {
  try {
    const roomId = generateDMRoomId(myUserId, targetUserId);
    const roomRef = doc(db, 'directMessages', roomId);

    // 대화방이 존재하는지 확인
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      // 대화방이 없으면 숨길 것도 없음
      console.log('대화방이 존재하지 않음:', roomId);
      return { success: true };
    }

    // 나만 대화방 숨김 처리 (상대방은 모름)
    const updateData = {};
    updateData[`hidden.${myUserId}`] = true;

    await updateDoc(roomRef, updateData);

    console.log('✅ DM 방 숨김 완료:', roomId);
    return { success: true };
  } catch (error) {
    console.error('❌ DM 방 숨김 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 특정 사용자와의 DM 방 숨김 해제 (친구 재추가 시 사용 가능)
 * @param {string} myUserId - 내 사용자 ID
 * @param {string} targetUserId - 상대방 사용자 ID
 * @returns {Promise<{success: boolean}>}
 */
export const unhideDMRoomWithUser = async (myUserId, targetUserId) => {
  try {
    const roomId = generateDMRoomId(myUserId, targetUserId);
    const roomRef = doc(db, 'directMessages', roomId);

    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      console.log('대화방이 존재하지 않음:', roomId);
      return { success: true };
    }

    // 숨김 해제
    const updateData = {};
    updateData[`hidden.${myUserId}`] = false;

    await updateDoc(roomRef, updateData);

    console.log('✅ DM 방 숨김 해제 완료:', roomId);
    return { success: true };
  } catch (error) {
    console.error('❌ DM 방 숨김 해제 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
