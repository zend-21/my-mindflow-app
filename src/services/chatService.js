// 실시간 채팅 서비스
import {
  collection, addDoc, query, orderBy, limit, onSnapshot,
  where, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  validateAndSanitize,
  isValidUserId,
  messageLimiter,
  validateContentSize
} from '../utils/securityUtils';
import { getProfileSetting } from '../utils/userStorage';

/**
 * 메시지 전송
 * @param {string} roomId - 방 ID
 * @param {string} message - 메시지 내용
 * @param {string} type - 메시지 타입 ('text' | 'system' | 'edit')
 */
export const sendMessage = async (roomId, message, type = 'text') => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: Rate Limiting (메시지 도배 방지)
  if (!messageLimiter.allowRequest(userId)) {
    throw new Error('메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.');
  }

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 메시지 내용 살균 및 검증
  const messageValidation = validateAndSanitize(message, 'message');
  if (!messageValidation.isValid) {
    throw new Error(messageValidation.error || '유효하지 않은 메시지입니다.');
  }

  // 🛡️ 보안: 사용자 이름 살균
  const nameValidation = validateAndSanitize(userProfile.name || '알 수 없음', 'username');
  if (!nameValidation.isValid) {
    throw new Error('유효하지 않은 사용자 이름입니다.');
  }

  // 🛡️ 보안: 메시지 타입 검증 (화이트리스트)
  const allowedTypes = ['text', 'system', 'edit'];
  if (!allowedTypes.includes(type)) {
    throw new Error('유효하지 않은 메시지 타입입니다.');
  }

  // 프로필 이미지 정보 가져오기 (Firestore 우선)
  const profileImageType = localStorage.getItem('profileImageType') || 'avatar';
  const selectedAvatarId = localStorage.getItem('selectedAvatarId') || null;
  const avatarBgColor = localStorage.getItem('avatarBgColor') || 'none';
  const customPicture = localStorage.getItem('customProfilePicture') || null;

  // Firestore에서 최신 닉네임 가져오기
  let userNickname = null;
  try {
    const { getUserNickname } = await import('./nicknameService');
    userNickname = await getUserNickname(userId);
    if (!userNickname) {
      // Firestore에 없으면 localStorage에서 가져오기 (사용자별)
      userNickname = getProfileSetting('nickname') || null;
    }
  } catch (error) {
    console.error('닉네임 로드 실패:', error);
    userNickname = getProfileSetting('nickname') || null;
  }

  const messageData = {
    roomId,
    userId,
    userName: nameValidation.sanitized,
    userPhoto: userProfile.picture || null,
    // 프로필 이미지 관련 정보 추가
    profileImageType,
    selectedAvatarId,
    avatarBgColor,
    customPicture,
    userNickname,
    message: messageValidation.sanitized, // 🛡️ 살균된 메시지
    type,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  await addDoc(collection(db, 'chatMessages'), messageData);

  // 🗑️ COLLABORATION ROOMS REMOVED - 협업방 기능 제거됨
  // 방의 마지막 메시지 시간 업데이트 로직 제거
  // const roomRef = doc(db, 'collaborationRooms', roomId);
  // await updateDoc(roomRef, {
  //   lastMessageAt: new Date().toISOString(),
  //   messageCount: await getMessageCount(roomId) + 1
  // });

  return true;
};

/**
 * 시스템 메시지 전송 (입장, 퇴장 등)
 * @param {string} roomId - 방 ID
 * @param {string} message - 메시지 내용
 */
export const sendSystemMessage = async (roomId, message) => {
  return sendMessage(roomId, message, 'system');
};

/**
 * 편집 알림 메시지 전송
 * @param {string} roomId - 방 ID
 * @param {string} editorName - 편집한 사람 이름
 */
export const sendEditNotification = async (roomId, editorName) => {
  return sendMessage(roomId, `${editorName}님이 메모를 수정했습니다`, 'edit');
};

/**
 * 메시지 개수 가져오기
 * @param {string} roomId - 방 ID
 */
const getMessageCount = async (roomId) => {
  const messagesRef = collection(db, 'chatMessages');
  const q = query(messagesRef, where('roomId', '==', roomId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * 메시지 실시간 구독
 * @param {string} roomId - 방 ID
 * @param {function} callback - 메시지 수신 콜백
 * @param {number} limitCount - 가져올 메시지 개수
 */
export const subscribeToMessages = (roomId, callback, limitCount = 50) => {
  const messagesRef = collection(db, 'chatMessages');
  const q = query(
    messagesRef,
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  });
};

/**
 * 이전 메시지 불러오기 (페이지네이션)
 * @param {string} roomId - 방 ID
 * @param {string} lastMessageId - 마지막 메시지 ID
 * @param {number} limitCount - 가져올 개수
 */
export const loadPreviousMessages = async (roomId, lastMessageId, limitCount = 20) => {
  // 추후 페이지네이션 구현 시 사용
  // 현재는 subscribeToMessages로 최신 50개만 가져옴
  return [];
};

/**
 * 메시지 읽음 처리
 * @param {string} messageId - 메시지 ID
 */
export const markAsRead = async (messageId) => {
  const messageRef = doc(db, 'chatMessages', messageId);
  await updateDoc(messageRef, {
    isRead: true
  });
};

/**
 * 안 읽은 메시지 개수
 * @param {string} roomId - 방 ID
 */
export const getUnreadCount = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) return 0;

  const messagesRef = collection(db, 'chatMessages');
  const q = query(
    messagesRef,
    where('roomId', '==', roomId),
    where('userId', '!=', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};
