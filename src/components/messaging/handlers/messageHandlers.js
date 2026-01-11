import { sendUnifiedMessage } from '../../../services/unifiedChatService';

/**
 * 메시지 관련 핸들러 생성 팩토리
 */
export function createMessageHandlers({
  chat,
  chatRoomData,
  currentUserId,
  inputText,
  setInputText,
  sending,
  setSending,
  isOtherUserBlocked,
  showToast,
  messagesEndRef,
  inputRef,
  setShowEmojiPicker,
  setShowDocument,
  showDocument,
  setCurrentDocument,
  setShowSharedMemoSelector,
  setSelectedMemoToLoad
}) {
  // 메시지 전송 (통합)
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    // DM 방에서 차단된 경우 전송 차단
    if (chat.type !== 'group' && isOtherUserBlocked) {
      showToast?.('차단된 사용자와는 메시지를 주고받을 수 없습니다');
      return;
    }

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // 통합 메시지 전송
      await sendUnifiedMessage(chat.id, chat.type, currentUserId, textToSend, chatRoomData);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      // Firestore 차단 규칙에 의한 에러인 경우 특별한 메시지 표시
      if (error.code === 'permission-denied') {
        showToast?.('차단된 사용자와는 메시지를 주고받을 수 없습니다');
      } else {
        showToast?.('메시지 전송에 실패했습니다');
      }
      setInputText(textToSend); // 실패 시 텍스트 복구
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // 이모티콘 선택 핸들러
  const handleEmojiSelect = (emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // 문서창 토글 (처음 열 때 빈 문서로 시작)
  const handleToggleDocument = () => {
    if (!showDocument) {
      // 문서창을 여는 경우 - 빈 문서로 시작
      setCurrentDocument({
        title: '',
        content: '',
        originalMemoId: null
      });
    }
    setShowDocument(!showDocument);
  };

  // 공유 폴더에서 문서 불러오기
  const handleLoadFromShared = () => {
    setShowSharedMemoSelector(true);
  };

  // 공유 메모 선택 핸들러
  const handleSelectSharedMemo = (memo) => {
    // 먼저 null로 리셋한 후 메모 설정 (React가 변경을 확실히 감지하도록)
    setSelectedMemoToLoad(null);

    // CollaborativeDocumentEditor에 메모 전달
    setTimeout(() => {
      setSelectedMemoToLoad(memo);
    }, 0);

    setShowSharedMemoSelector(false);

    // 문서창이 닫혀있으면 열기
    if (!showDocument) {
      setShowDocument(true);
    }
  };

  // 문서 업데이트 핸들러
  const handleDocumentUpdated = (updatedDoc) => {
    setCurrentDocument(updatedDoc);
  };

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    handleSendMessage,
    handleEmojiSelect,
    handleToggleDocument,
    handleLoadFromShared,
    handleSelectSharedMemo,
    handleDocumentUpdated,
    handleKeyDown
  };
}
