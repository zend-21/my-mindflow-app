import styled from 'styled-components';

// 전체화면 컨테이너
export const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.$bgColor || '#1a1a1a'};
  z-index: 100000; /* 모든 요소보다 높게 - 전체화면 채팅 */
  display: flex;
  flex-direction: column;
`;

// 헤더
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${props => props.$bgColor || 'rgba(26, 26, 26, 0.95)'};
  color: ${props => props.$textColor || '#ffffff'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const BackButton = styled.button`
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

export const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || '#1E90FF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s;

  &:hover {
    ${props => props.$clickable && `
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    `}
  }
`;

export const AvatarBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: rgba(26, 26, 26, 0.95);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

export const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ChatName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$textColor || '#ffffff'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChatStatus = styled.div`
  font-size: 12px;
  color: #888;
`;

export const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$hasDocument ? '#4a90e2' : '#888'};
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${props => props.$hasDocument ? '#5a9fee' : '#ffffff'};
  }
`;

// 드롭다운 메뉴
export const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
`;

export const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

// 드롭다운 메뉴 구분자
export const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
`;

// 메시지 영역
export const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 30px;  /* 🔥 나가기 버튼 영역 확보 */
  display: flex;
  flex-direction: column;
  gap: 17px;
  scroll-behavior: smooth;

  /* 초대 수락 전 블러 처리 */
  ${props => props.$blurred && `
    filter: blur(8px);
    pointer-events: none;
    user-select: none;
  `}

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
export const DateSeparator = styled.div`
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

export const DateText = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
`;

// 안 읽은 메시지 마커 (여기까지 읽음)
export const UnreadMarker = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #4a9eff;
  }
`;

export const UnreadMarkerText = styled.span`
  font-size: 12px;
  color: #4a9eff;
  font-weight: 600;
  white-space: nowrap;
`;

// 이전 대화 경계 구분선
export const OlderMessagesDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }
`;

export const OlderMessagesDividerText = styled.span`
  font-size: 11px;
  color: #888;
  font-weight: 500;
  white-space: nowrap;
`;

// 이전 메시지 불러오기 버튼
export const LoadMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px auto;
  padding: 10px 20px;
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid #4a9eff;
  border-radius: 20px;
  color: #4a9eff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 158, 255, 0.2);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// 그룹 삭제 알림 박스
export const DeletionNotice = styled.div`
  position: sticky;
  top: 20px;
  margin: 20px auto;
  max-width: 500px;
  padding: 24px;
  background: rgba(220, 38, 38, 0.1);
  border: 2px solid #dc2626;
  border-radius: 12px;
  text-align: center;
  z-index: 50;
`;

export const DeletionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const DeletionMessage = styled.div`
  font-size: 14px;
  color: #fca5a5;
  line-height: 1.6;
  margin-bottom: 16px;
`;

export const DeletionCountdown = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  background: #dc2626;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
`;

// 메시지 아이템
export const MessageItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-direction: ${props => props.$isMine ? 'row-reverse' : 'row'};
`;

export const MessageAvatar = styled(Avatar)`
  width: 38px;
  height: 38px;
  font-size: 15px;
  position: relative;
  margin-top: 4px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
`;

export const RoleBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(26, 26, 26, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

export const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${props => props.$isMine ? 'flex-end' : 'flex-start'};
  max-width: calc(80% + 10px);
`;

export const SenderName = styled.div`
  font-size: 12px;
  color: #888;
  padding: 0 8px;
`;

export const MessageBubble = styled.div`
  background: ${props => props.$isMine
    ? (props.$myBubbleColor || '#4a90e2')
    : (props.$otherBubbleColor || 'rgba(255, 255, 255, 0.08)')};
  color: ${props => props.$isMine
    ? (props.$myTextColor || '#ffffff')
    : (props.$otherTextColor || '#ffffff')};
  padding: 10px 14px;
  border-radius: ${props => props.$isMine
    ? '16px 4px 16px 16px'
    : '4px 16px 16px 16px'};
  font-size: 14px;
  line-height: 1.5;
  box-shadow: ${props => props.$isMine
    ? '0 2px 8px rgba(74, 144, 226, 0.3)'
    : 'none'};
  position: relative;
  width: 100%;
  box-sizing: border-box;
  ${props => props.$collapsed && `
    padding-bottom: 35px;
  `}
`;

export const MessageTextContent = styled.div`
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;
  ${props => props.$collapsed && `
    max-height: calc(1.5em * 18);
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 1.5em), transparent 100%);
    mask-image: linear-gradient(to bottom, black calc(100% - 1.5em), transparent 100%);
  `}
`;

export const MessageMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isMine ? 'flex-end' : 'flex-start'};
  gap: 2px;
  flex-shrink: 0;
  min-width: 60px;
  width: 60px;
`;

export const MessageTime = styled.div`
  font-size: 11px;
  color: #666;
  padding: 0 4px;
`;

export const UnreadBadge = styled.div`
  font-size: 11px;
  color: #4a90e2;
  font-weight: 700;
  padding: 0 4px;
  min-width: 16px;
  text-align: center;
`;

// 입력 영역
export const InputContainer = styled.div`
  padding: 16px 20px;
  background: ${props => props.$bgColor || 'rgba(26, 26, 26, 0.95)'};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  bottom: 0;
`;

export const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

export const BlockedMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #999;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TextInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: ${props => props.$bgColor || 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 8px 12px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const IconButton = styled.button`
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

export const TextInput = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  color: ${props => props.$textColor || '#e0e0e0'};
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
export const EmojiPicker = styled.div`
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
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

export const EmojiHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const EmojiTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

export const EmojiCategoryTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
`;

export const CategoryTab = styled.button`
  flex-shrink: 0;
  background: ${props => props.$active ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? 'rgba(74, 144, 226, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#4a90e2' : '#888'};
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
    border-color: ${props => props.$active ? 'rgba(74, 144, 226, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
  }
`;

export const EmojiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤 방지 */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  @media (max-width: 400px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

export const EmojiButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const SendButton = styled.button`
  background: ${props => props.disabled
    ? 'rgba(74, 144, 226, 0.3)'
    : props.$bgColor || 'linear-gradient(135deg, #4a90e2, #357abd)'};
  border: none;
  color: ${props => props.$iconColor || '#ffffff'};
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

// 초대 수락/거부 배너
export const InvitationBanner = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const InvitationText = styled.div`
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.5;

  strong {
    color: #ffffff;
    font-weight: 600;
  }
`;

export const InvitationActions = styled.div`
  display: flex;
  gap: 12px;
`;

export const InvitationButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AcceptButton = styled(InvitationButton)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

export const RejectButton = styled(InvitationButton)`
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }
`;

// 모달 스타일
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
`;

export const ModalContainer = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ModalHeader = styled.div`
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #888;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

export const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

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
`;

export const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

export const MemberAvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const MemberAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || '#1E90FF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

export const BlockedBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  border: 2px solid #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;

  &::after {
    content: '🚫';
    font-size: 8px;
  }
`;

export const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MemberName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const MemberStatus = styled.span`
  font-size: 11px;
  color: ${props => props.$status === 'active' ? '#4ade80' : props.$status === 'pending' ? '#fbbf24' : '#888'};
  background: ${props => props.$status === 'active' ? 'rgba(74, 222, 128, 0.1)' : props.$status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(136, 136, 136, 0.1)'};
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
`;

export const OwnerBadge = styled.span`
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
`;

export const RemoveButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const CancelInviteButton = styled.button`
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  color: #facc15;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(250, 204, 21, 0.2);
    border-color: rgba(250, 204, 21, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// 빈 상태
export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #666;
`;

export const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

export const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #888;
  margin-bottom: 8px;
`;

export const EmptyDescription = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

// 멤버 초대/위임 모달 추가 스타일
export const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const TabButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.$active ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#667eea' : 'transparent'};
  color: ${props => props.$active ? '#667eea' : '#888'};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
  }
`;

export const SearchBarWrapper = styled.div`
  margin-bottom: 16px;
  position: relative;
`;

export const SearchClearButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #888;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`;

export const SearchByIdContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const IdInputWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
`;

export const IdInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  text-transform: uppercase;
  width: 240px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
    text-transform: none;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const IdSearchButton = styled.button`
  background: #667eea;
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 100px;

  &:hover:not(:disabled) {
    background: #5568d3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const UserCardContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const InviteButton = styled.button`
  background: #667eea;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-left: auto;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5568d3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FriendSearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 12px 36px 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.08);
  }
`;

export const FriendListWrapper = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;

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
`;

export const SelectableMemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$selected ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.$selected ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

export const CheckMark = styled.span`
  color: #667eea;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
`;

export const SelectedInfo = styled.div`
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-top: 12px;
`;

export const ModalFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ConfirmButton = styled.button`
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

export const WarningMessage = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
`;

export const InviteCodeContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
`;

export const InviteCodeLabel = styled.div`
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
`;

export const InviteCodeDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
`;

export const InviteCodeText = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #4a90e2;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
`;

export const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const InviteCodeDescription = styled.div`
  font-size: 13px;
  color: #999;
  line-height: 1.6;
`;

export const ShowMoreButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$isMine ? 'rgba(255, 255, 255, 0.9)' : '#4a90e2'};
  font-size: 13px;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: center;
  width: 100%;

  &:hover {
    opacity: 0.7;
  }
`;

export const ShowMoreOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.$isMine
    ? (props.$myBubbleColor || '#4a90e2')
    : (props.$otherBubbleColor || 'rgba(255, 255, 255, 0.08)')};
  border-top: 1px dotted ${props => props.$isMine ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 14px 6px 14px;
  border-radius: ${props => props.$isMine ? '0 0 16px 16px' : '0 0 16px 16px'};
  pointer-events: none;

  button {
    pointer-events: all;
  }
`;


// 검색창
export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(26, 26, 26, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

export const SearchResultInfo = styled.div`
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  padding: 0 4px;
  flex-shrink: 0;
`;

export const SearchButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const SearchInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  min-width: 0;

  &:focus {
    border-color: rgba(74, 144, 226, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`;

export const SearchButton = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

// 매크로 버튼 (입력창 오른쪽 - placeholder와 동일한 고정 색상)
export const MacroButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  color: #999;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid rgba(153, 153, 153, 0.4);
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(153, 153, 153, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// 매크로 모달 오버레이 (RichTextEditor와 동일)
export const MacroModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100001;
`;

export const MacroModalContent = styled.div`
  background: #2a2d35;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

export const MacroModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #e0e0e0;
  font-size: 18px;
  text-align: center;
`;

export const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

export const MacroItem = styled.button`
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-size: 14px;

  &:hover {
    background: rgba(139, 92, 246, 0.25);
    border-color: rgba(139, 92, 246, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const MacroEmptyMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #888;
  font-size: 14px;
`;
