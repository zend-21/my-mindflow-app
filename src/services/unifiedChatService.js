// 통합 채팅 서비스 (1:1 DM + 그룹 채팅)
import {
  doc, updateDoc, collection, query, where, getDocs,
  orderBy, limit, writeBatch, arrayUnion, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { enterRoom, exitRoom } from './messageService';
import { sendMessage as sendDMMessage, subscribeToMessages as subscribeToDMMessages } from './directMessageService';
import { sendGroupMessage, subscribeToGroupMessages } from './groupChatService';

/**
 * 채팅 타입 감지
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 명시적 타입 ('group', 'direct', '1:1' 등)
 * @returns {'group'|'dm'} 정규화된 채팅 타입
 */
const detectChatType = (chatId, chatType) => {
  // 명시적 타입이 있으면 우선 사용
  if (chatType === 'group') return 'group';
  if (chatType === 'direct' || chatType === '1:1' || chatType === 'self') return 'dm';

  // ID 패턴으로 감지
  if (chatId.startsWith('dm_')) return 'dm';
  return 'group';
};

/**
 * 🆕 통합 메시지 전송
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 발신자 ID
 * @param {string} message - 메시지 내용
 * @param {object} roomData - 방 데이터 (DM 최적화용)
 */
export const sendMessage = async (chatId, chatType, userId, message, roomData = null) => {
  const type = detectChatType(chatId, chatType);

  if (type === 'group') {
    return await sendGroupMessage(chatId, userId, message);
  } else {
    // DM은 userId 파라미터 불필요 (roomId, text, roomData 순서)
    return await sendDMMessage(chatId, message, roomData);
  }
};

/**
 * 🆕 통합 메시지 구독
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 사용자 ID (그룹 채팅 참여 시점 필터링용)
 * @param {function} callback - 메시지 콜백
 * @param {number} messageLimit - 메시지 로드 제한 개수 (기본: 제한 없음)
 * @returns {function} unsubscribe 함수
 */
export const subscribeToMessages = (chatId, chatType, userId, callback, messageLimit = null) => {
  const type = detectChatType(chatId, chatType);

  if (type === 'group') {
    return subscribeToGroupMessages(chatId, userId, callback, messageLimit);
  } else {
    return subscribeToDMMessages(chatId, callback, messageLimit);
  }
};

/**
 * 🆕 통합 읽음 처리 (unreadCount 초기화)
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 사용자 ID
 * @param {boolean} isPageVisible - 페이지가 보이는 상태인지 (Page Visibility API)
 */
export const markAsRead = async (chatId, chatType, userId, isPageVisible = true) => {
  // ⚠️ 페이지가 보이지 않으면 읽음 처리 안 함
  if (!isPageVisible) {
    console.log('📵 페이지 비가시 상태 - 읽음 처리 건너뜀');
    return;
  }

  const type = detectChatType(chatId, chatType);

  try {
    if (type === 'group') {
      const groupRef = doc(db, 'groupChats', chatId);
      await updateDoc(groupRef, {
        [`unreadCount.${userId}`]: 0
      });
      console.log('✅ 그룹 채팅 읽음 처리 완료:', chatId);
    } else {
      const dmRef = doc(db, 'directMessages', chatId);
      await updateDoc(dmRef, {
        [`unreadCount.${userId}`]: 0
      });
      console.log('✅ DM 읽음 처리 완료:', chatId);
    }
  } catch (error) {
    console.error('❌ 읽음 처리 실패:', error);
    throw error;
  }
};

/**
 * 🆕 통합 전체 메시지 읽음 처리
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 사용자 ID
 * @param {boolean} isPageVisible - 페이지가 보이는 상태인지
 */
export const markAllMessagesAsRead = async (chatId, chatType, userId, isPageVisible = true) => {
  // ⚠️ 페이지가 보이지 않으면 읽음 처리 안 함
  if (!isPageVisible) {
    console.log('📵 페이지 비가시 상태 - 전체 읽음 처리 건너뜀');
    return;
  }

  const type = detectChatType(chatId, chatType);

  try {
    // 1. unreadCount 초기화
    await markAsRead(chatId, chatType, userId, isPageVisible);

    // 2. 최근 100개 메시지만 읽음 처리
    const collectionName = type === 'group' ? 'groupChats' : 'directMessages';
    const messagesRef = collection(db, collectionName, chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    // Batch 사용으로 write 횟수 최적화
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();

      if (type === 'group') {
        // 그룹: readBy 배열
        if (!data.readBy || !data.readBy.includes(userId)) {
          batch.update(doc(db, collectionName, chatId, 'messages', docSnap.id), {
            readBy: arrayUnion(userId)
          });
          updateCount++;
        }
      } else {
        // DM: read 플래그 (상대방 메시지만)
        if (data.senderId !== userId && data.read === false) {
          batch.update(doc(db, collectionName, chatId, 'messages', docSnap.id), {
            read: true
          });
          updateCount++;
        }
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount}개 메시지 읽음 처리 완료`);
    }
  } catch (error) {
    console.error('❌ 전체 메시지 읽음 처리 실패:', error);
  }
};

/**
 * 🆕 통합 채팅방 입장
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 사용자 ID
 */
export const enterChatRoom = (chatId, chatType, userId) => {
  const type = detectChatType(chatId, chatType);
  const collectionName = type === 'group' ? 'groupChats' : 'directMessages';
  const resetUnreadCount = true; // 항상 읽음으로 표시

  return enterRoom(collectionName, chatId, userId, resetUnreadCount);
};

/**
 * 🆕 통합 채팅방 퇴장
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} userId - 사용자 ID
 */
export const exitChatRoom = (chatId, chatType, userId) => {
  const type = detectChatType(chatId, chatType);
  const collectionName = type === 'group' ? 'groupChats' : 'directMessages';

  return exitRoom(collectionName, chatId, userId);
};

/**
 * 🆕 메시지 삭제 (관리자 권한으로)
 * 메시지 내용을 삭제하고 '삭제됨' 표시로 대체
 * @param {string} chatId - 채팅방 ID
 * @param {string} chatType - 채팅 타입
 * @param {string} messageId - 삭제할 메시지 ID
 * @param {string} deletedByName - 삭제한 사람 이름
 */
export const deleteMessageByAdmin = async (chatId, chatType, messageId, deletedByName) => {
  const type = detectChatType(chatId, chatType);
  const collectionName = type === 'group' ? 'groupChats' : 'directMessages';

  try {
    const messageRef = doc(db, collectionName, chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: null,
      content: null,
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedByName: deletedByName
    });
    console.log('✅ 메시지 삭제 완료:', messageId);
    return true;
  } catch (error) {
    console.error('❌ 메시지 삭제 실패:', error);
    throw error;
  }
};
