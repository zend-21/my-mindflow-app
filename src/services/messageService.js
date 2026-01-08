// 공통 메시지 관리 서비스 (1:1 채팅과 그룹 채팅의 공통 로직)
import {
  doc, updateDoc, serverTimestamp, writeBatch, getDocs, query, where, collection
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * 채팅방 입장 (inRoom 상태 업데이트)
 * @param {string} collectionName - 'directMessages' 또는 'groupChats'
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 UID
 * @param {boolean} clearUnread - unreadCount도 0으로 설정할지 여부 (기본: false)
 */
export const enterRoom = async (collectionName, roomId, userId, clearUnread = false) => {
  try {
    const roomRef = doc(db, collectionName, roomId);
    const updateData = {
      [`inRoom.${userId}`]: true
    };

    if (clearUnread) {
      updateData[`unreadCount.${userId}`] = 0;
    }

    await updateDoc(roomRef, updateData);
    console.log(`✅ 채팅방 입장: ${collectionName}/${roomId}`, { userId });
  } catch (error) {
    console.error(`❌ 채팅방 입장 실패:`, error);
    throw error;
  }
};

/**
 * 채팅방 퇴장 (inRoom 상태 업데이트)
 * @param {string} collectionName - 'directMessages' 또는 'groupChats'
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const exitRoom = async (collectionName, roomId, userId) => {
  try {
    const roomRef = doc(db, collectionName, roomId);
    await updateDoc(roomRef, {
      [`inRoom.${userId}`]: false
    });
    console.log(`✅ 채팅방 퇴장: ${collectionName}/${roomId}`, { userId });
  } catch (error) {
    console.error(`❌ 채팅방 퇴장 실패:`, error);
    // 퇴장 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * 읽음 처리 (unreadCount 초기화 + 메시지 read 필드 업데이트)
 * Debounce 적용: 1초 후 실행
 * @param {string} collectionName - 'directMessages' 또는 'groupChats'
 * @param {string} roomId - 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
const timeouts = new Map();

export const createMarkAsReadDebounced = (collectionName) => {
  return async (roomId, userId) => {
    try {
      if (!userId) return;

      // 기존 타이머 취소
      const key = `${roomId}_${userId}`;
      if (timeouts.has(key)) {
        clearTimeout(timeouts.get(key));
      }

      // 1초 후 실행 (사용자 경험 최적화)
      const timeoutId = setTimeout(async () => {
        const roomRef = doc(db, collectionName, roomId);
        const messagesRef = collection(db, collectionName, roomId, 'messages');

        // 1. unreadCount와 lastAccessTime 업데이트
        const updateData = {
          [`unreadCount.${userId}`]: 0,
          [`lastAccessTime.${userId}`]: serverTimestamp()
        };
        await updateDoc(roomRef, updateData);

        // 2. 안읽은 메시지들의 read 필드를 true로 업데이트
        const unreadMessagesQuery = query(
          messagesRef,
          where('read', '==', false)
        );

        const unreadSnapshot = await getDocs(unreadMessagesQuery);
        const batch = writeBatch(db);
        let hasUpdates = false;

        unreadSnapshot.forEach((docSnap) => {
          // 내가 보낸 메시지는 제외
          if (docSnap.data().senderId !== userId) {
            batch.update(docSnap.ref, { read: true });
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          await batch.commit();
        }

        timeouts.delete(key);
      }, 1000);

      timeouts.set(key, timeoutId);

    } catch (error) {
      console.error('❌ 읽음 표시 업데이트 오류:', error);
    }
  };
};

/**
 * 🧪 테스트: 앱 시작 시 현재 사용자의 inRoom 상태 초기화 (DRY RUN - 로그만 출력)
 * @param {string} userId - 사용자 UID
 */
export const testInitializeInRoomStatus = async (userId) => {
  try {
    console.log('🧪 [테스트] inRoom 초기화 시작 (실제 업데이트 없음)');

    // 1:1 채팅방 조회
    const dmQuery = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', userId)
    );
    const dmSnapshot = await getDocs(dmQuery);

    console.log(`🔍 [테스트] 1:1 채팅방 ${dmSnapshot.size}개 발견`);
    dmSnapshot.forEach(doc => {
      const data = doc.data();
      const currentInRoom = data.inRoom?.[userId];
      console.log(`  📝 [테스트] DM ${doc.id}: inRoom.${userId} = ${currentInRoom} → false로 설정 예정`);
    });

    // 그룹 채팅방 조회
    const groupQuery = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', userId)
    );
    const groupSnapshot = await getDocs(groupQuery);

    console.log(`🔍 [테스트] 그룹 채팅방 ${groupSnapshot.size}개 발견`);
    groupSnapshot.forEach(doc => {
      const data = doc.data();
      const currentInRoom = data.inRoom?.[userId];
      console.log(`  📝 [테스트] 그룹 ${doc.id}: inRoom.${userId} = ${currentInRoom} → false로 설정 예정`);
    });

    console.log('✅ [테스트] 초기화 대상 확인 완료 (실제 업데이트 수행 안 함)');
    console.log(`📊 [테스트] 총 ${dmSnapshot.size + groupSnapshot.size}개 채팅방의 inRoom 상태를 초기화할 예정`);

  } catch (error) {
    console.error('❌ [테스트] inRoom 초기화 테스트 실패:', error);
  }
};

/**
 * 앱 시작 시 현재 사용자의 inRoom 상태 초기화 (실제 업데이트)
 * @param {string} userId - 사용자 UID
 */
export const initializeInRoomStatus = async (userId) => {
  try {
    console.log('🔄 inRoom 상태 초기화 시작');

    // 1:1 채팅방 조회
    const dmQuery = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', userId)
    );
    const dmSnapshot = await getDocs(dmQuery);

    // 그룹 채팅방 조회
    const groupQuery = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', userId)
    );
    const groupSnapshot = await getDocs(groupQuery);

    // Batch 업데이트
    const batch = writeBatch(db);

    dmSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { [`inRoom.${userId}`]: false });
    });

    groupSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { [`inRoom.${userId}`]: false });
    });

    await batch.commit();

    console.log(`✅ inRoom 상태 초기화 완료: ${dmSnapshot.size + groupSnapshot.size}개 채팅방`);
  } catch (error) {
    console.error('❌ inRoom 초기화 실패:', error);
    // 실패해도 앱은 정상 작동
  }
};
