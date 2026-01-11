// 📁 그룹 채팅 메시지 서비스
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { enterRoom, exitRoom } from './messageService';

// ==================== 메시지 전송 ====================

/**
 * 그룹 채팅방에 메시지 전송
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} senderId - 발신자 UID
 * @param {string} content - 메시지 내용
 * @param {string} type - 메시지 타입 (text, image, document, etc.)
 */
export const sendGroupMessage = async (groupId, senderId, content, type = 'text') => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);

    // ✅ 항상 최신 그룹 데이터 읽기 (inRoom 상태 실시간 반영 - 1:1과 동일)
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 멤버 확인
    if (!groupData.members.includes(senderId)) {
      throw new Error('그룹 멤버가 아닙니다.');
    }

    // 메시지 추가
    // readBy 초기화: 발신자 + 현재 방에 있는 모든 사람
    const initialReadBy = [senderId];
    groupData.members.forEach(memberId => {
      if (memberId !== senderId && groupData.inRoom?.[memberId] === true) {
        initialReadBy.push(memberId);
      }
    });

    const messageData = {
      senderId,
      content,
      type,
      createdAt: serverTimestamp(),
      reactions: {}, // 이모지 반응 (나중에 구현)
      isEdited: false,
      isDeleted: false,
      readBy: initialReadBy // 읽은 사람 목록 (발신자 + 방에 있는 사람들)
    };

    await addDoc(collection(db, 'groupChats', groupId, 'messages'), messageData);

    // 그룹 정보 업데이트 - active 상태이고 채팅방에 없는 멤버에게만 unreadCount 증가
    const unreadCount = {};
    const currentUnreadCount = groupData.unreadCount || {};

    console.log('📤 그룹 메시지 전송:', {
      groupId,
      senderId,
      members: groupData.members,
      inRoom: groupData.inRoom,
      currentUnreadCount,
      initialReadBy
    });

    groupData.members.forEach(memberId => {
      // 발신자가 아니고, active 상태인 멤버에게만 unreadCount 증가
      const memberInfo = groupData.membersInfo?.[memberId];
      if (memberId !== senderId && memberInfo?.status === 'active') {
        // inRoom이 true면 "채팅방을 보고 있다"고 판단 → unreadCount 증가하지 않음 (1:1과 동일)
        const isInRoom = groupData.inRoom?.[memberId] === true;

        console.log(`  멤버 ${memberId}: inRoom=${isInRoom}, unreadCount증가=${!isInRoom}`);

        // 채팅방에 없으면 unreadCount 증가
        if (!isInRoom) {
          // 현재 값을 가져와서 1 증가 (increment 대신 명시적 값 사용)
          const currentCount = currentUnreadCount[memberId] || 0;
          unreadCount[`unreadCount.${memberId}`] = currentCount + 1;
        }
      }
    });

    await updateDoc(groupRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: increment(1),
      ...unreadCount
    });

    console.log('✅ 그룹 메시지 전송 완료');
  } catch (error) {
    console.error('❌ 그룹 메시지 전송 실패:', error);
    throw error;
  }
};

// ==================== 메시지 구독 ====================

/**
 * 그룹 채팅 메시지 실시간 구독 (참여 시점 이후 메시지만 표시)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 현재 사용자 ID (참여 시점 확인용)
 * @param {Function} callback - 메시지 목록을 받을 콜백
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToGroupMessages = (groupId, userId, callback) => {
  // 먼저 그룹 정보를 가져와서 사용자의 joinedAt 확인
  const groupRef = doc(db, 'groupChats', groupId);

  return onSnapshot(groupRef, async (groupSnap) => {
    if (!groupSnap.exists()) {
      callback([]);
      return;
    }

    const groupData = groupSnap.data();
    const memberInfo = groupData.membersInfo?.[userId];
    const joinedAt = memberInfo?.joinedAt;

    const messagesRef = collection(db, 'groupChats', groupId, 'messages');

    let q;
    if (joinedAt) {
      // 참여 시점 이후의 메시지만 조회 (카카오톡 방식)
      q = query(
        messagesRef,
        where('createdAt', '>=', joinedAt),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      console.log(`📨 ${userId}의 참여 시점 이후 메시지만 조회`);
    } else {
      // joinedAt이 없으면 모든 메시지 조회 (하위 호환성 - 방장 등)
      q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
      console.log(`📨 모든 메시지 조회 (joinedAt 없음)`);
    }

    // 메시지 구독
    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // 최신순으로 가져왔으므로 다시 오래된순으로 정렬
      callback(messages);
    });
  });
};

// ==================== 읽음 처리 ====================

/**
 * 읽음 처리 (unreadCount만 업데이트)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const markGroupAsRead = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    await updateDoc(groupRef, {
      [`unreadCount.${userId}`]: 0
      // ✅ inRoom 업데이트 제거 - enterGroupRoom/exitGroupRoom만 제어
    });
    console.log('✅ 읽음 처리 완료:', groupId);
  } catch (error) {
    console.error('❌ 읽음 처리 실패:', error);
    throw error;
  }
};

/**
 * 채팅방 입장 (비공개방 온라인 상태 표시용)
 * 공통 messageService 사용 (unreadCount도 0으로 초기화)
 */
export const enterGroupRoom = (groupId, userId) => enterRoom('groupChats', groupId, userId, true);

/**
 * 채팅방 퇴장 (비공개방 온라인 상태 표시용)
 * 공통 messageService 사용
 */
export const exitGroupRoom = (groupId, userId) => exitRoom('groupChats', groupId, userId);

/**
 * 개별 메시지 읽음 처리 (readBy 배열에 userId 추가)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} messageId - 메시지 ID
 * @param {string} userId - 사용자 UID
 */
export const markMessageAsRead = async (groupId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'groupChats', groupId, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('❌ 메시지 읽음 처리 실패:', error);
    // 에러 발생해도 무시 (중요하지 않은 기능)
  }
};

/**
 * 모든 읽지 않은 메시지를 읽음 처리 (채팅방 입장 시) - 최적화: Batch 사용
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const markAllMessagesAsRead = async (groupId, userId) => {
  try {
    // unreadCount 초기화
    await markGroupAsRead(groupId, userId);

    // 최근 100개 메시지만 읽음 처리 (limit 추가)
    const messagesRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    // Batch 사용으로 write 횟수 최적화 (최대 500개까지 한 번에 처리)
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.readBy || !data.readBy.includes(userId)) {
        batch.update(doc(db, 'groupChats', groupId, 'messages', docSnap.id), {
          readBy: arrayUnion(userId)
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log('✅ 모든 메시지 읽음 처리 완료:', updateCount, '개 (batch)');
    }
  } catch (error) {
    console.error('❌ 모든 메시지 읽음 처리 실패:', error);
  }
};

// ==================== 시스템 메시지 ====================

/**
 * 시스템 메시지 전송 (내부용)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} content - 시스템 메시지 내용
 * @param {Object} metadata - 메타데이터 (action, actorId, targetId 등)
 */
export const sendSystemMessage = async (groupId, content, metadata = {}) => {
  try {
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content,
      createdAt: serverTimestamp(),
      metadata
    });
    console.log('✅ 시스템 메시지 전송 완료:', content);
  } catch (error) {
    console.error('❌ 시스템 메시지 전송 실패:', error);
    // 시스템 메시지 실패는 무시
  }
};
