// 1:1 대화방 (Direct Message) 관리 서비스
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  updateDoc, serverTimestamp, onSnapshot, orderBy, limit, addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

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

    if (currentUserId === targetUserId) {
      throw new Error('자기 자신과는 대화할 수 없습니다');
    }

    // 1:1 대화방 ID 생성
    const roomId = generateDMRoomId(currentUserId, targetUserId);
    const roomRef = doc(db, 'directMessages', roomId);

    // 기존 대화방 확인
    const existingRoom = await getDoc(roomRef);

    if (existingRoom.exists()) {
      console.log('기존 1:1 대화방 찾음:', roomId);

      // 마지막 접속 시간 업데이트
      const updateData = {};
      updateData[`lastAccessTime.${currentUserId}`] = serverTimestamp();

      await updateDoc(roomRef, updateData);

      return {
        success: true,
        roomId,
        data: existingRoom.data(),
        isNew: false
      };
    }

    // 새 대화방 생성
    console.log('새 1:1 대화방 생성:', roomId);

    const roomData = {
      roomId,
      type: 'direct', // 1:1 대화방 타입
      participants: [currentUserId, targetUserId],
      participantsInfo: {
        [currentUserId]: {
          displayName: auth.currentUser.displayName || '익명',
          email: auth.currentUser.email || '',
          photoURL: auth.currentUser.photoURL || ''
        },
        [targetUserId]: {
          displayName: targetUserInfo.displayName || '익명',
          email: targetUserInfo.email || '',
          photoURL: targetUserInfo.photoURL || ''
        }
      },
      createdAt: serverTimestamp(),
      createdBy: currentUserId,
      lastMessage: null,
      lastMessageTime: serverTimestamp(), // null 대신 초기 타임스탬프
      unreadCount: {
        [currentUserId]: 0,
        [targetUserId]: 0
      },
      lastAccessTime: {
        [currentUserId]: serverTimestamp(),
        [targetUserId]: null
      },
      // 차단 상태 (나중에 차단 기능 구현시 사용)
      blocked: {
        [currentUserId]: false,
        [targetUserId]: false
      },
      // 대화방 숨김 상태 (나중에 구현)
      hidden: {
        [currentUserId]: false,
        [targetUserId]: false
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
 * @param {string} roomId
 */
const markDMAsReadDebounced = (() => {
  const timeouts = new Map();

  return async (roomId) => {
    try {
      if (!auth.currentUser) return;

      // 기존 타이머 취소
      if (timeouts.has(roomId)) {
        clearTimeout(timeouts.get(roomId));
      }

      // 3초 후 실행 (quota 절약)
      const timeoutId = setTimeout(async () => {
        const roomRef = doc(db, 'directMessages', roomId);

        const updateData = {
          [`unreadCount.${auth.currentUser.uid}`]: 0,
          [`lastAccessTime.${auth.currentUser.uid}`]: serverTimestamp()
        };

        await updateDoc(roomRef, updateData);
        timeouts.delete(roomId);
      }, 3000);

      timeouts.set(roomId, timeoutId);

    } catch (error) {
      console.error('❌ 읽음 표시 업데이트 오류:', error);
    }
  };
})();

// 기존 함수명 유지 (호환성)
export const markDMAsRead = markDMAsReadDebounced;

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

    // 메시지 데이터
    const messageData = {
      text: text.trim(),
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || '익명',
      createdAt: serverTimestamp(),
      read: false
    };

    // 메시지 추가
    const messageDoc = await addDoc(messagesRef, messageData);

    // 대화방의 lastMessage 업데이트
    // quota 최적화: roomData가 전달되면 getDoc() 생략
    let actualRoomData = roomData;

    if (!actualRoomData) {
      // fallback: roomData 없으면 읽기 (1 read)
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        actualRoomData = roomSnap.data();
      }
    }

    if (actualRoomData) {
      const otherUserId = actualRoomData.participants?.find(id => id !== auth.currentUser.uid);
      const newUnreadCount = (actualRoomData.unreadCount?.[otherUserId] || 0) + 1;

      await updateDoc(roomRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: newUnreadCount
      });
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
      // 증분 업데이트: 변경된 메시지만 처리
      const changes = [];
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
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
