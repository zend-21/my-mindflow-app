import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { subscribeToUnifiedMessages, markUnifiedAsRead, markAllUnifiedMessagesAsRead } from '../../../services/unifiedChatService';
import { getUserNickname } from '../../../services/nicknameService';

/**
 * 채팅방 메시지 실시간 구독 및 관리
 */
export function useChatMessages(chat, currentUserId, isPageVisible, notificationSettings, playChatMessageSound) {
  const [messages, setMessages] = useState([]);
  const [userNicknames, setUserNicknames] = useState({});
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat.id) return;

    let isMounted = true;
    let prevMessageCount = 0;
    let unsubscribe = null;

    // 약간의 지연을 두고 구독 시작 (Firestore 내부 상태 안정화)
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      // 통합 메시지 구독 (1:1과 그룹 모두 지원)
      unsubscribe = subscribeToUnifiedMessages(chat.id, chat.type, currentUserId, async (newMessages) => {
        if (!isMounted) return;

        // 새 메시지가 추가되었고, 내가 보낸 메시지가 아니면 효과음 재생
        if (prevMessageCount > 0 && newMessages.length > prevMessageCount && notificationSettings.enabled) {
          const latestMessage = newMessages[newMessages.length - 1];
          // 상대방이 보낸 메시지인 경우만 효과음 재생
          if (latestMessage?.senderId !== currentUserId) {
            playChatMessageSound();
          }
        }

        // 새 메시지 도착 시 페이지가 보이는 경우에만 읽음 처리
        if (prevMessageCount > 0 && newMessages.length > prevMessageCount) {
          markUnifiedAsRead(chat.id, chat.type, currentUserId, isPageVisible);
        }

        prevMessageCount = newMessages.length;
        setMessages(newMessages);

        // 메시지 발신자들의 닉네임 동적 로드
        const senderIds = new Set(newMessages.map(msg => msg.senderId).filter(Boolean));
        for (const senderId of senderIds) {
          // 이미 로드된 사용자는 스킵
          if (userNicknames[senderId] !== undefined || userDisplayNames[senderId] !== undefined) continue;

          try {
            // 1순위: nicknames 컬렉션에서 앱 닉네임
            const nickname = await getUserNickname(senderId);
            setUserNicknames(prev => ({ ...prev, [senderId]: nickname }));

            // 2순위: settings에서 구글 displayName
            const settingsRef = doc(db, 'mindflowUsers', senderId, 'userData', 'settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              setUserDisplayNames(prev => ({ ...prev, [senderId]: settingsSnap.data().displayName || null }));
            }
          } catch (error) {
            console.error(`메시지 발신자 닉네임 로드 실패 (${senderId}):`, error);
          }
        }

        // 스크롤을 맨 아래로
        setTimeout(() => {
          if (isMounted) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      });

      // 읽음 표시 (통합 함수 사용 - 페이지 가시성 확인)
      markUnifiedAsRead(chat.id, chat.type, currentUserId, isPageVisible);
      markAllUnifiedMessagesAsRead(chat.id, chat.type, currentUserId, isPageVisible);
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);

      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (e) {
          console.error('구독 해제 중 오류:', e);
        }
      }
    };
  }, [chat.id, chat.type, currentUserId, isPageVisible, notificationSettings.enabled, userNicknames, userDisplayNames, playChatMessageSound]);

  return {
    messages,
    setMessages,
    userNicknames,
    setUserNicknames,
    userDisplayNames,
    setUserDisplayNames,
    messagesEndRef
  };
}
