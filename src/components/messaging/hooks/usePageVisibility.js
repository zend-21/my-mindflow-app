import { useState, useEffect } from 'react';
import {
  enterChatRoom,
  exitChatRoom,
  markAsRead,
  markAllMessagesAsRead
} from '../../../services/unifiedChatService';

/**
 * 페이지 가시성 감지 및 채팅방 입/퇴장 관리
 */
export function usePageVisibility(chatId, chatType, currentUserId) {
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

  // Page Visibility API - 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      console.log(`📱 페이지 가시성 변경: ${visible ? '보임' : '숨김'}`);

      if (visible) {
        // 페이지가 다시 보이면: inRoom = true로 설정 + 읽음 처리
        await enterChatRoom(chatId, chatType, currentUserId);
        markAsRead(chatId, chatType, currentUserId, true);
        markAllMessagesAsRead(chatId, chatType, currentUserId, true);
      } else {
        // 페이지가 숨겨지면: inRoom = false로 설정
        await exitChatRoom(chatId, chatType, currentUserId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [chatId, chatType, currentUserId]);

  // 채팅방 입장/퇴장 처리 (통합)
  useEffect(() => {
    enterChatRoom(chatId, chatType, currentUserId);
    return () => {
      exitChatRoom(chatId, chatType, currentUserId);
    };
  }, [chatId, chatType, currentUserId]);

  return {
    isPageVisible,
    setIsPageVisible
  };
}
