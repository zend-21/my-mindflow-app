// 전체화면 채팅방 컴포넌트
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ArrowLeft, Send, MoreVertical, Users, Smile, FileText, Plus } from 'lucide-react';
import { subscribeToMessages, sendMessage, markDMAsRead } from '../../services/directMessageService';
import CollapsibleDocumentEditor from './CollapsibleDocumentEditor';
import SharedMemoSelectorModal from './SharedMemoSelectorModal';

// 전체화면 컨테이너
const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  z-index: 100000; /* 모든 요소보다 높게 - 전체화면 채팅 */
  display: flex;
  flex-direction: column;
`;

// 헤더
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(26, 26, 26, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: #4a90e2;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea, #764ba2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ChatName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChatStatus = styled.div`
  font-size: 12px;
  color: #888;
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

// 메시지 영역
const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// 날짜 구분선
const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DateText = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
`;

// 메시지 아이템
const MessageItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-direction: ${props => props.$isMine ? 'row-reverse' : 'row'};
`;

const MessageAvatar = styled(Avatar)`
  width: 32px;
  height: 32px;
  font-size: 14px;
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${props => props.$isMine ? 'flex-end' : 'flex-start'};
  max-width: 70%;
`;

const SenderName = styled.div`
  font-size: 12px;
  color: #888;
  padding: 0 8px;
`;

const MessageBubble = styled.div`
  background: ${props => props.$isMine
    ? 'linear-gradient(135deg, #4a90e2, #357abd)'
    : 'rgba(255, 255, 255, 0.08)'};
  color: #ffffff;
  padding: 10px 14px;
  border-radius: ${props => props.$isMine
    ? '16px 16px 4px 16px'
    : '16px 16px 16px 4px'};
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: ${props => props.$isMine
    ? '0 2px 8px rgba(74, 144, 226, 0.3)'
    : 'none'};
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #666;
  padding: 0 4px;
`;

// 입력 영역
const InputContainer = styled.div`
  padding: 16px 20px;
  background: rgba(26, 26, 26, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  bottom: 0;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 8px 12px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #4a90e2;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const TextInput = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  color: #e0e0e0;
  padding: 8px 4px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  min-height: 48px;
  line-height: 1.5;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

// 이모티콘 선택기
const EmojiPicker = styled.div`
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const EmojiHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const EmojiTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;

  @media (max-width: 400px) {
    grid-template-columns: repeat(6, 1fr);
  }
`;

const EmojiButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SendButton = styled.button`
  background: ${props => props.disabled
    ? 'rgba(74, 144, 226, 0.3)'
    : 'linear-gradient(135deg, #4a90e2, #357abd)'};
  border: none;
  color: #ffffff;
  padding: 12px;
  border-radius: 50%;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: ${props => props.disabled
    ? 'none'
    : '0 4px 12px rgba(74, 144, 226, 0.3)'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// 빈 상태
const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
`;

const EmptyDescription = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const ChatRoom = ({ chat, onClose, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null); // 현재 편집중인 문서
  const [showSharedMemoSelector, setShowSharedMemoSelector] = useState(false); // 공유 폴더 메모 선택 모달
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentUserId = localStorage.getItem('firebaseUserId');

  // 이모티콘 목록 (자주 사용하는 이모티콘)
  const emojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
    '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
    '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
    '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦵',
    '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
  ];

  // 상대방 정보 가져오기
  const getOtherUserInfo = () => {
    if (chat.type === 'group') {
      return {
        name: chat.groupName || '이름 없는 그룹',
        isGroup: true,
        memberCount: chat.members?.length || 0
      };
    }

    const otherUserId = chat.participants?.find(id => id !== currentUserId);
    const otherUserInfo = chat.participantsInfo?.[otherUserId];
    return {
      name: otherUserInfo?.displayName || '익명',
      userId: otherUserId,
      isGroup: false
    };
  };

  const otherUser = getOtherUserInfo();

  // 메시지 실시간 구독
  useEffect(() => {
    if (!chat.id) return;

    console.log('📬 채팅방 메시지 구독 시작:', chat.id);

    const unsubscribe = subscribeToMessages(chat.id, (newMessages) => {
      console.log('📨 새 메시지:', newMessages);
      setMessages(newMessages);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // 읽음 표시
    markDMAsRead(chat.id);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chat.id]);

  // 방장 여부 확인 (그룹 채팅인 경우 createdBy가 방장, DM은 모두 방장)
  const isRoomOwner = chat.type === 'group'
    ? chat.createdBy === currentUserId
    : true; // DM은 모두 편집 가능

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendMessage(chat.id, textToSend);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      showToast?.('메시지 전송에 실패했습니다');
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
    // 메모 내용을 복사하여 현재 문서로 설정
    setCurrentDocument({
      title: memo.title || '제목 없음',
      content: memo.content || '',
      originalMemoId: memo.id, // 원본 메모 ID 저장
      updatedAt: memo.updatedAt
    });
    setShowDocument(true);
    setShowSharedMemoSelector(false);
    showToast?.('문서를 불러왔습니다');
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

  // 시간 포맷
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;

    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷 (구분선용)
  const formatDate = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // 날짜가 바뀌는지 체크
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;

    const currentDate = currentMsg.createdAt?.toDate?.() || new Date(currentMsg.createdAt);
    const prevDate = prevMsg.createdAt?.toDate?.() || new Date(prevMsg.createdAt);

    return currentDate.toDateString() !== prevDate.toDateString();
  };

  // 아바타 색상 생성
  const getAvatarColor = (userId) => {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
    ];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return createPortal(
    <FullScreenContainer>
      {/* 헤더 */}
      <Header>
        <HeaderLeft>
          <BackButton onClick={onClose}>
            <ArrowLeft size={24} />
          </BackButton>
          <Avatar $color={otherUser.isGroup ? 'linear-gradient(135deg, #667eea, #764ba2)' : getAvatarColor(otherUser.userId)}>
            {otherUser.isGroup ? <Users size={20} /> : otherUser.name.charAt(0).toUpperCase()}
          </Avatar>
          <ChatInfo>
            <ChatName>{otherUser.name}</ChatName>
            <ChatStatus>
              {otherUser.isGroup ? `멤버 ${otherUser.memberCount}명` : ''}
            </ChatStatus>
          </ChatInfo>
        </HeaderLeft>
        <HeaderRight>
          <MenuButton onClick={handleToggleDocument} title="공유 문서">
            <FileText size={20} />
          </MenuButton>
          <MenuButton onClick={() => showToast?.('메뉴 기능 구현 예정')}>
            <MoreVertical size={20} />
          </MenuButton>
        </HeaderRight>
      </Header>

      {/* 공유 문서 (펼쳤을 때만 표시) */}
      {showDocument && (
        <div style={{ padding: '12px 20px', maxHeight: '500px', overflowY: 'auto' }}>
          <CollapsibleDocumentEditor
            document={currentDocument}
            currentUserId={currentUserId}
            isRoomOwner={isRoomOwner}
            showToast={showToast}
            onClose={() => {
              setShowDocument(false);
              setCurrentDocument(null);
            }}
            onDocumentUpdated={handleDocumentUpdated}
            onLoadFromShared={handleLoadFromShared}
          />
        </div>
      )}

      {/* 메시지 목록 */}
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <EmptyTitle>대화를 시작해보세요</EmptyTitle>
            <EmptyDescription>
              첫 메시지를 보내고<br />대화를 시작해보세요
            </EmptyDescription>
          </EmptyState>
        ) : (
          <>
            {messages.map((message, index) => {
              const isMine = message.senderId === currentUserId;
              const showDate = shouldShowDateSeparator(message, messages[index - 1]);
              const showAvatar = !isMine && (index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId);

              return (
                <div key={message.id}>
                  {showDate && (
                    <DateSeparator>
                      <DateText>{formatDate(message.createdAt)}</DateText>
                    </DateSeparator>
                  )}
                  <MessageItem $isMine={isMine}>
                    {!isMine && showAvatar && (
                      <MessageAvatar $color={getAvatarColor(message.senderId)}>
                        {message.senderName?.charAt(0).toUpperCase() || '?'}
                      </MessageAvatar>
                    )}
                    {!isMine && !showAvatar && <div style={{ width: '32px' }} />}
                    <MessageContent $isMine={isMine}>
                      {!isMine && showAvatar && <SenderName>{message.senderName}</SenderName>}
                      <MessageBubble $isMine={isMine}>
                        {message.text}
                      </MessageBubble>
                    </MessageContent>
                    <MessageTime>{formatMessageTime(message.createdAt)}</MessageTime>
                  </MessageItem>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>

      {/* 입력 영역 */}
      <InputContainer>
        {/* 이모티콘 선택기 */}
        {showEmojiPicker && (
          <EmojiPicker>
            <EmojiHeader>
              <EmojiTitle>이모티콘 선택</EmojiTitle>
              <IconButton onClick={() => setShowEmojiPicker(false)}>
                <X size={18} />
              </IconButton>
            </EmojiHeader>
            <EmojiGrid>
              {emojis.map((emoji, index) => (
                <EmojiButton
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </EmojiButton>
              ))}
            </EmojiGrid>
          </EmojiPicker>
        )}

        <InputWrapper>
          <InputGroup>
            <TextInputWrapper>
              <IconButton
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="이모티콘"
              >
                <Smile size={20} />
              </IconButton>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                rows={1}
                disabled={sending}
              />
            </TextInputWrapper>
          </InputGroup>
          <SendButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Send size={20} />
          </SendButton>
        </InputWrapper>
      </InputContainer>

      {/* 공유 폴더 메모 선택 모달 */}
      {showSharedMemoSelector && (
        <SharedMemoSelectorModal
          onClose={() => setShowSharedMemoSelector(false)}
          onSelectMemo={handleSelectSharedMemo}
          showToast={showToast}
        />
      )}
    </FullScreenContainer>,
    document.body
  );
};

export default ChatRoom;
