// 전체화면 채팅방 컴포넌트
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ArrowLeft, Send, MoreVertical, Users, Smile, FileText, Plus, Settings, X, UserCog, UserPlus } from 'lucide-react';
import { subscribeToMessages, sendMessage, markDMAsRead, subscribeToDMRoom } from '../../services/directMessageService';
import { subscribeToGroupMessages, sendGroupMessage, markAllMessagesAsRead, acceptInvitation, rejectInvitation, inviteMembersToGroup, transferRoomOwnership } from '../../services/groupChatService';
import { getMyFriends } from '../../services/friendService';
import { playChatMessageSound, notificationSettings } from '../../utils/notificationSounds';
import CollapsibleDocumentEditor from './CollapsibleDocumentEditor';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';
import SharedMemoSelectorModal from './SharedMemoSelectorModal';
import PermissionManagementModal from './PermissionManagementModal';
import { db } from '../../firebase/config';
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { getCurrentUserId, getCurrentUserData } from '../../utils/userStorage';

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
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

// 드롭다운 메뉴
const DropdownMenu = styled.div`
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

const DropdownItem = styled.button`
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
  position: relative;
`;

const RoleBadge = styled.div`
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

const MessageMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 2px;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #666;
  padding: 0 4px;
`;

const UnreadBadge = styled.div`
  font-size: 11px;
  color: #4a90e2;
  font-weight: 700;
  padding: 0 4px;
  min-width: 16px;
  text-align: center;
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

const EmojiCategoryTabs = styled.div`
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

const CategoryTab = styled.button`
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

const EmojiGrid = styled.div`
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

const EmojiButton = styled.button`
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

// 초대 수락/거부 배너
const InvitationBanner = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InvitationText = styled.div`
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.5;

  strong {
    color: #ffffff;
    font-weight: 600;
  }
`;

const InvitationActions = styled.div`
  display: flex;
  gap: 12px;
`;

const InvitationButton = styled.button`
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

const AcceptButton = styled(InvitationButton)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const RejectButton = styled(InvitationButton)`
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }
`;

// 모달 스타일
const ModalOverlay = styled.div`
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

const ModalContainer = styled.div`
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

const ModalHeader = styled.div`
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
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

const ModalContent = styled.div`
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

const MemberItem = styled.div`
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

const MemberAvatar = styled.div`
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

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
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

const MemberStatus = styled.span`
  font-size: 11px;
  color: ${props => props.$status === 'active' ? '#4ade80' : props.$status === 'pending' ? '#fbbf24' : '#888'};
  background: ${props => props.$status === 'active' ? 'rgba(74, 222, 128, 0.1)' : props.$status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(136, 136, 136, 0.1)'};
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
`;

const OwnerBadge = styled.span`
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
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

// 멤버 초대/위임 모달 추가 스타일
const SearchBarWrapper = styled.div`
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  padding: 12px 16px;
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

const FriendListWrapper = styled.div`
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

const SelectableMemberItem = styled.div`
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

const CheckMark = styled.span`
  color: #667eea;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
`;

const SelectedInfo = styled.div`
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-top: 12px;
`;

const ModalFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
`;

const CancelButton = styled.button`
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

const ConfirmButton = styled.button`
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

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const WarningMessage = styled.div`
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
`;

const ChatRoom = ({ chat, onClose, showToast, memos, onUpdateMemoPendingFlag }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null); // 현재 편집중인 문서
  const [showSharedMemoSelector, setShowSharedMemoSelector] = useState(false); // 공유 폴더 메모 선택 모달
  const [showPermissionModal, setShowPermissionModal] = useState(false); // 권한 관리 모달 (deprecated)
  const [permissions, setPermissions] = useState({ editors: [], manager: null }); // 권한 정보
  const [selectedMemoToLoad, setSelectedMemoToLoad] = useState(null); // CollaborativeDocumentEditor에 전달할 메모
  const [processingInvitation, setProcessingInvitation] = useState(false); // 초대 처리 중
  const [myMemberStatus, setMyMemberStatus] = useState(null); // 내 멤버 상태 (active/pending/rejected)
  const [showMemberListModal, setShowMemberListModal] = useState(false); // 참여자 목록 모달
  const [showMenuDropdown, setShowMenuDropdown] = useState(false); // 점 세개 드롭다운
  const [showInviteMembersModal, setShowInviteMembersModal] = useState(false); // 멤버 초대 모달
  const [showTransferOwnerModal, setShowTransferOwnerModal] = useState(false); // 방장 위임 모달
  const [friends, setFriends] = useState([]); // 친구 목록 (멤버 초대용)
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState([]); // 초대할 친구 선택
  const [searchQueryInvite, setSearchQueryInvite] = useState(''); // 초대 모달 검색어
  const [selectedMemberToTransfer, setSelectedMemberToTransfer] = useState(null); // 위임할 멤버 선택
  const [loadingInvite, setLoadingInvite] = useState(false); // 초대 중
  const [loadingTransfer, setLoadingTransfer] = useState(false); // 위임 중
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 🔐 계정별 localStorage에서 사용자 정보 가져오기
  const currentUserId = getCurrentUserId() || localStorage.getItem('firebaseUserId'); // fallback
  const currentUserName = getCurrentUserData('displayName') || localStorage.getItem('userDisplayName') || '익명';

  // 이모티콘 카테고리별 분류
  const emojiCategories = {
    '😊 표정': [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
      '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
      '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
      '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
      '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
      '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
      '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'
    ],
    '👋 손동작': [
      '👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌',
      '👐', '🤲', '🙏', '✍️', '💪', '🦵', '🦶', '👂',
      '🦻', '👃', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
      '🤏', '✌️', '🤘', '🤙', '👈', '👉', '👆', '🖕',
      '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤝', '🙏'
    ],
    '❤️ 하트': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓'
    ],
    '🐶 동물': [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎'
    ],
    '🍕 음식': [
      '🍕', '🍔', '🍟', '🍿', '🥤', '🍰', '🎂', '🍩',
      '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛',
      '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺',
      '🍻', '🥂', '🥃', '🍎', '🍏', '🍊', '🍋', '🍌',
      '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍',
      '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒'
    ],
    '⚽ 활동': [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿',
      '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️',
      '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗'
    ],
    '🚗 여행': [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
      '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
      '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
      '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️'
    ],
    '🌸 자연': [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🌴',
      '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂',
      '🍁', '🍄', '🌾', '💐', '🌵', '🌾', '🌿', '☘️',
      '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
      '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐', '🌟',
      '✨', '⚡', '☄️', '💫', '🔥', '💧', '🌊', '🌈'
    ],
    '✨ 기호': [
      '✅', '❌', '⭐', '💯', '🔥', '💧', '⚡', '🌈',
      '☀️', '⛅', '☁️', '🌧️', '⛈️', '🌩️', '🌨️', '☃️',
      '⛄', '❄️', '🌬️', '💨', '💦', '☔', '☂️', '🌊',
      '🌫️', '🌪️', '🌀', '🌁', '🌆', '🌇', '🌃', '🌌',
      '🌉', '🌄', '🌅', '🎆', '🎇', '🌠', '🎉', '🎊',
      '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀'
    ]
  };

  // 선택된 이모지 카테고리 상태
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('😊 표정');

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

  // ⚡ 권한 정보 실시간 구독 (그룹 채팅만) - 최적화: 2개 리스너 통합
  useEffect(() => {
    if (!chat.id || chat.type !== 'group') return;

    let isMounted = true;
    const unsubscribers = [];

    // 권한 문서 구독
    const permRef = doc(db, 'chatRooms', chat.id, 'sharedDocument', 'permissions');
    const unsubscribePerm = onSnapshot(permRef, (permDoc) => {
      if (!isMounted) return;
      const permData = permDoc.data();
      setPermissions(prev => ({
        ...prev,
        editors: permData?.editors || []
      }));
    });
    unsubscribers.push(unsubscribePerm);

    // 문서 정보 구독
    const docRef = doc(db, 'chatRooms', chat.id, 'sharedDocument', 'currentDoc');
    const unsubscribeDoc = onSnapshot(docRef, (docSnapshot) => {
      if (!isMounted) return;
      const docData = docSnapshot.data();
      if (docData?.lastEditedBy) {
        setPermissions(prev => ({
          ...prev,
          manager: docData.lastEditedBy
        }));
      }
    });
    unsubscribers.push(unsubscribeDoc);

    return () => {
      isMounted = false;
      unsubscribers.forEach(unsub => unsub());
    };
  }, [chat.id, chat.type]);

  // 그룹 채팅에서 내 멤버 상태 확인
  useEffect(() => {
    if (!chat.id || chat.type !== 'group' || !currentUserId) return;

    // chat.membersInfo에서 내 상태 확인
    const myStatus = chat.membersInfo?.[currentUserId]?.status;
    setMyMemberStatus(myStatus || 'active');
  }, [chat.id, chat.type, chat.membersInfo, currentUserId]);

  // 친구 목록 불러오기 (멤버 초대용)
  useEffect(() => {
    if (!showInviteMembersModal || !currentUserId) return;

    const loadFriends = async () => {
      try {
        const friendList = await getMyFriends(currentUserId);
        setFriends(friendList);
      } catch (error) {
        console.error('친구 목록 불러오기 실패:', error);
        showToast?.('친구 목록을 불러올 수 없습니다');
      }
    };

    loadFriends();
  }, [showInviteMembersModal, currentUserId, showToast]);

  // 1:1 채팅방 데이터 실시간 구독 (lastAccessTime 업데이트 감지)
  const [chatRoomData, setChatRoomData] = useState(chat);

  useEffect(() => {
    if (!chat.id || chat.type === 'group') {
      setChatRoomData(chat);
      return;
    }

    // 1:1 채팅방 데이터 실시간 구독
    const unsubscribe = subscribeToDMRoom(chat.id, (updatedChat) => {
      setChatRoomData(updatedChat);
    });

    return () => unsubscribe();
  }, [chat.id, chat.type]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!chat.id) return;

    let isMounted = true;
    let prevMessageCount = 0;
    let unsubscribe = null;

    // 약간의 지연을 두고 구독 시작 (Firestore 내부 상태 안정화)
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      // 채팅 타입에 따라 다른 구독 함수 사용
      const subscribeFunc = chat.type === 'group' ? subscribeToGroupMessages : subscribeToMessages;

      unsubscribe = subscribeFunc(chat.id, (newMessages) => {
        if (!isMounted) return;

        // 새 메시지가 추가되었고, 내가 보낸 메시지가 아니면 효과음 재생
        if (prevMessageCount > 0 && newMessages.length > prevMessageCount && notificationSettings.enabled) {
          const latestMessage = newMessages[newMessages.length - 1];
          // 상대방이 보낸 메시지인 경우만 효과음 재생
          if (latestMessage?.senderId !== currentUserId) {
            playChatMessageSound();
          }
        }

        prevMessageCount = newMessages.length;
        setMessages(newMessages);

        // 스크롤을 맨 아래로
        setTimeout(() => {
          if (isMounted) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      });

      // 읽음 표시 (채팅 타입에 따라 다른 함수 호출)
      if (chat.type === 'group') {
        markAllMessagesAsRead(chat.id, currentUserId);
      } else {
        markDMAsRead(chat.id);
      }
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
  }, [chat.id, currentUserId]);

  // 방장 여부 확인 (그룹 채팅인 경우 creatorId가 방장, DM은 모두 방장)
  const isRoomOwner = chat.type === 'group'
    ? (chat.creatorId === currentUserId || chat.createdBy === currentUserId) // creatorId와 createdBy 둘 다 체크
    : true; // DM은 모두 편집 가능

  // 사용자 역할 확인 함수
  const getUserRole = (userId) => {
    // 1:1 채팅은 역할 표시 안 함
    if (chat.type !== 'group') return null;

    // 방장 체크 (최우선)
    if (chat.createdBy === userId) {
      return { type: 'owner', icon: '🪄', label: '방장' };
    }

    // 문서 매니저 체크 (문서를 업로드한 사람)
    // 방장과 매니저가 같으면 매니저 표시 우선
    if (permissions.manager === userId) {
      return { type: 'manager', icon: '💪', label: '매니저' };
    }

    // 편집 권한자 체크
    if (permissions.editors?.includes(userId)) {
      return { type: 'editor', icon: '✏️', label: '편집권한자' };
    }

    // 일반 참여자는 아이콘 없음
    return null;
  };

  // 초대 수락 핸들러
  const handleAcceptInvitation = async () => {
    setProcessingInvitation(true);
    try {
      await acceptInvitation(chat.id, currentUserId);
      setMyMemberStatus('active');
      showToast?.('✅ 단체방에 참여했습니다');
    } catch (error) {
      console.error('초대 수락 실패:', error);
      showToast?.('❌ 초대 수락에 실패했습니다');
    } finally {
      setProcessingInvitation(false);
    }
  };

  // 초대 거부 핸들러
  const handleRejectInvitation = async () => {
    setProcessingInvitation(true);
    try {
      await rejectInvitation(chat.id, currentUserId);
      setMyMemberStatus('rejected');
      showToast?.('초대를 거부했습니다');
      // 거부 후 채팅방 닫기
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('초대 거부 실패:', error);
      showToast?.('❌ 초대 거부에 실패했습니다');
    } finally {
      setProcessingInvitation(false);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // 채팅 타입에 따라 다른 전송 함수 사용
      if (chat.type === 'group') {
        await sendGroupMessage(chat.id, currentUserId, textToSend);
      } else {
        // quota 최적화: roomData 전달하여 getDoc() 생략
        await sendMessage(chat.id, textToSend, chat);
      }

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
    // CollaborativeDocumentEditor에 메모 전달 (확인 로직은 에디터에서 처리)
    setSelectedMemoToLoad(memo);
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

  // 멤버 초대 핸들러
  const handleInviteMembers = async () => {
    if (selectedFriendsToInvite.length === 0) {
      showToast?.('최소 1명의 친구를 선택해주세요');
      return;
    }

    // 이미 그룹에 있는 친구 필터링
    const alreadyMembers = selectedFriendsToInvite.filter(friendId =>
      chat.members?.includes(friendId)
    );

    if (alreadyMembers.length > 0) {
      showToast?.('이미 그룹에 있는 친구가 포함되어 있습니다');
      return;
    }

    setLoadingInvite(true);
    try {
      await inviteMembersToGroup(chat.id, currentUserId, selectedFriendsToInvite);
      showToast?.(`${selectedFriendsToInvite.length}명을 초대했습니다`);
      setShowInviteMembersModal(false);
      setSelectedFriendsToInvite([]);
      setSearchQueryInvite('');
    } catch (error) {
      console.error('멤버 초대 실패:', error);
      showToast?.(error.message || '멤버 초대에 실패했습니다');
    } finally {
      setLoadingInvite(false);
    }
  };

  // 방장 위임 핸들러
  const handleTransferOwnership = async () => {
    if (!selectedMemberToTransfer) {
      showToast?.('위임할 멤버를 선택해주세요');
      return;
    }

    if (selectedMemberToTransfer === currentUserId) {
      showToast?.('자기 자신에게는 위임할 수 없습니다');
      return;
    }

    setLoadingTransfer(true);
    try {
      await transferRoomOwnership(chat.id, currentUserId, selectedMemberToTransfer);
      const transferredMemberName = chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '알 수 없음';
      showToast?.(`${transferredMemberName}님에게 방장 권한을 위임했습니다`);
      setShowTransferOwnerModal(false);
      setSelectedMemberToTransfer(null);
    } catch (error) {
      console.error('방장 위임 실패:', error);
      showToast?.(error.message || '방장 위임에 실패했습니다');
    } finally {
      setLoadingTransfer(false);
    }
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
          {chat.type === 'group' && (
            <MenuButton onClick={() => setShowMemberListModal(true)} title="참여자 목록">
              <Settings size={20} />
            </MenuButton>
          )}
          <MenuButton onClick={handleToggleDocument} title="공유 문서">
            <FileText size={20} />
          </MenuButton>
          {chat.type === 'group' && (
            <MenuButton
              onClick={() => {
                if (isRoomOwner) {
                  setShowMenuDropdown(!showMenuDropdown);
                } else {
                  showToast?.('방장만 이용할 수 있습니다');
                }
              }}
              title="메뉴"
            >
              <MoreVertical size={20} />
              {/* 드롭다운 메뉴 (방장만 표시) */}
              {showMenuDropdown && isRoomOwner && (
                <DropdownMenu onClick={(e) => e.stopPropagation()}>
                  <DropdownItem
                    onClick={() => {
                      setShowInviteMembersModal(true);
                      setShowMenuDropdown(false);
                    }}
                  >
                    <Users size={16} />
                    멤버 초대
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      setShowTransferOwnerModal(true);
                      setShowMenuDropdown(false);
                    }}
                  >
                    <UserCog size={16} />
                    방장 위임
                  </DropdownItem>
                </DropdownMenu>
              )}
            </MenuButton>
          )}
        </HeaderRight>
      </Header>

      {/* 초대 수락/거부 배너 (pending 상태일 때만 표시) */}
      {chat.type === 'group' && myMemberStatus === 'pending' && (
        <InvitationBanner>
          <InvitationText>
            <strong>{chat.groupName}</strong> 단체방에 초대되었습니다.<br />
            참여하시겠습니까?
          </InvitationText>
          <InvitationActions>
            <RejectButton
              onClick={handleRejectInvitation}
              disabled={processingInvitation}
            >
              {processingInvitation ? '처리 중...' : '거부'}
            </RejectButton>
            <AcceptButton
              onClick={handleAcceptInvitation}
              disabled={processingInvitation}
            >
              {processingInvitation ? '처리 중...' : '수락'}
            </AcceptButton>
          </InvitationActions>
        </InvitationBanner>
      )}

      {/* 협업 문서 (펼쳤을 때만 표시) */}
      {showDocument && (
        <div style={{ padding: '12px 20px', maxHeight: '500px', overflowY: 'auto' }}>
          <CollaborativeDocumentEditor
            key={currentDocument?.originalMemoId || 'default'} // 문서 변경 시 재마운트
            chatRoomId={chat.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isManager={isRoomOwner}
            canEdit={true} // 1:1은 자동 편집 권한, 그룹은 권한 시스템 적용
            chatType={chat.type} // 1:1 vs 그룹 구분
            showToast={showToast}
            onClose={() => {
              setShowDocument(false);
            }}
            onLoadFromShared={handleLoadFromShared}
            selectedMemo={selectedMemoToLoad}
            onUpdateMemoPendingFlag={onUpdateMemoPendingFlag}
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

              // 상대방 ID 찾기
              const otherUserId = chat.participants?.find(id => id !== currentUserId);

              // 읽음 여부 판단: lastAccessTime과 메시지 생성 시간 비교
              let isUnreadByOther = false;
              let unreadCount = 0;

              if (isMine && chatRoomData.type !== 'group') {
                // 1:1 채팅: 상대방의 lastAccessTime 확인
                const otherLastAccess = chatRoomData.lastAccessTime?.[otherUserId];
                const messageTime = message.createdAt?.toDate?.() || new Date(message.createdAt);

                if (otherLastAccess) {
                  const accessTime = otherLastAccess.toDate?.() || new Date(otherLastAccess);
                  // 메시지 시간이 상대방의 마지막 접속 시간보다 이후면 읽지 않은 것
                  isUnreadByOther = messageTime > accessTime;
                } else {
                  // lastAccessTime이 없으면 읽지 않은 것으로 간주
                  isUnreadByOther = true;
                }
              } else if (isMine && chatRoomData.type === 'group') {
                // 그룹 채팅: readBy 배열로 읽지 않은 사람 수 계산
                // 거절한 멤버(rejected)는 제외하고 활성 멤버만 카운트
                const activeMembers = chat.members?.filter(memberId => {
                  const memberStatus = chat.membersInfo?.[memberId]?.status;
                  return memberStatus === 'active';
                }) || [];
                const totalMembers = activeMembers.length;
                const readByCount = message.readBy?.length || 1; // readBy에 발신자 포함
                unreadCount = totalMembers - readByCount;
                isUnreadByOther = unreadCount > 0;
              }

              const userRole = getUserRole(message.senderId);

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
                        {userRole && (
                          <RoleBadge title={userRole.label}>
                            {userRole.icon}
                          </RoleBadge>
                        )}
                      </MessageAvatar>
                    )}
                    {!isMine && !showAvatar && <div style={{ width: '32px' }} />}
                    <MessageContent $isMine={isMine}>
                      {!isMine && showAvatar && <SenderName>{message.senderName}</SenderName>}
                      <MessageBubble $isMine={isMine}>
                        {message.text}
                      </MessageBubble>
                    </MessageContent>
                    <MessageMeta>
                      {/* 내가 보낸 메시지 중 읽지 않은 사람이 있는 경우 표시 */}
                      {isUnreadByOther && (
                        <UnreadBadge>
                          {chat.type === 'group' ? unreadCount : 1}
                        </UnreadBadge>
                      )}
                      <MessageTime>{formatMessageTime(message.createdAt)}</MessageTime>
                    </MessageMeta>
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

            {/* 카테고리 탭 */}
            <EmojiCategoryTabs>
              {Object.keys(emojiCategories).map((category) => (
                <CategoryTab
                  key={category}
                  $active={selectedEmojiCategory === category}
                  onClick={() => setSelectedEmojiCategory(category)}
                >
                  {category.split(' ')[0]}
                </CategoryTab>
              ))}
            </EmojiCategoryTabs>

            {/* 선택된 카테고리의 이모지 그리드 */}
            <EmojiGrid>
              {emojiCategories[selectedEmojiCategory].map((emoji, index) => (
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
          allMemos={memos}
          chatRoomId={chat.id}
        />
      )}

      {/* 권한 관리 모달 (deprecated) */}
      {showPermissionModal && chat.type === 'group' && (
        <PermissionManagementModal
          chatRoomId={chat.id}
          currentUserId={currentUserId}
          isManager={isRoomOwner}
          showToast={showToast}
          onClose={() => setShowPermissionModal(false)}
        />
      )}

      {/* 참여자 목록 모달 */}
      {showMemberListModal && chat.type === 'group' && (
        <ModalOverlay onClick={() => setShowMemberListModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Users size={24} />
                참여자 목록
              </ModalTitle>
              <CloseButton onClick={() => setShowMemberListModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              {/* 방장 먼저 표시 */}
              {chat.membersInfo && Object.entries(chat.membersInfo).map(([memberId, memberInfo]) => {
                if (memberId !== chat.creatorId) return null;
                const isOwner = memberId === chat.creatorId;

                return (
                  <MemberItem key={memberId}>
                    <MemberAvatar $color={getAvatarColor(memberId)}>
                      {memberInfo.displayName?.charAt(0).toUpperCase() || '?'}
                    </MemberAvatar>
                    <MemberInfo>
                      <MemberName>
                        {memberInfo.displayName || '익명'}
                        {isOwner && <OwnerBadge>방장</OwnerBadge>}
                      </MemberName>
                      <MemberStatus $status={memberInfo.status || 'active'}>
                        {memberInfo.status === 'pending' ? '초대 대기중' : memberInfo.status === 'rejected' ? '거부' : '참여중'}
                      </MemberStatus>
                    </MemberInfo>
                  </MemberItem>
                );
              })}

              {/* 나머지 멤버들 */}
              {chat.membersInfo && Object.entries(chat.membersInfo).map(([memberId, memberInfo]) => {
                if (memberId === chat.creatorId) return null;

                return (
                  <MemberItem key={memberId}>
                    <MemberAvatar $color={getAvatarColor(memberId)}>
                      {memberInfo.displayName?.charAt(0).toUpperCase() || '?'}
                    </MemberAvatar>
                    <MemberInfo>
                      <MemberName>
                        {memberInfo.displayName || '익명'}
                      </MemberName>
                      <MemberStatus $status={memberInfo.status || 'active'}>
                        {memberInfo.status === 'pending' ? '초대 대기중' : memberInfo.status === 'rejected' ? '거부' : '참여중'}
                      </MemberStatus>
                    </MemberInfo>
                  </MemberItem>
                );
              })}
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 멤버 초대 모달 */}
      {showInviteMembersModal && (
        <ModalOverlay onClick={() => {
          setShowInviteMembersModal(false);
          setSelectedFriendsToInvite([]);
          setSearchQueryInvite('');
        }}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <UserPlus size={24} />
                멤버 초대
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowInviteMembersModal(false);
                setSelectedFriendsToInvite([]);
                setSearchQueryInvite('');
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              {friends.length > 0 ? (
                <>
                  {/* 검색 바 */}
                  <SearchBarWrapper>
                    <SearchInput
                      type="text"
                      placeholder="친구 검색..."
                      value={searchQueryInvite}
                      onChange={(e) => setSearchQueryInvite(e.target.value)}
                    />
                  </SearchBarWrapper>

                  {/* 친구 목록 */}
                  <FriendListWrapper>
                    {friends
                      .filter(friend => {
                        if (!searchQueryInvite) return true;
                        const displayName = friend.friendName || friend.displayName || '익명';
                        const wsCode = friend.friendWorkspaceCode || friend.wsCode || '';
                        return displayName.toLowerCase().includes(searchQueryInvite.toLowerCase()) ||
                               wsCode.toLowerCase().includes(searchQueryInvite.toLowerCase());
                      })
                      .filter(friend => {
                        // 이미 그룹 멤버인 친구는 제외
                        const friendId = friend.friendId || friend.id;
                        return !chat.members?.includes(friendId);
                      })
                      .map(friend => {
                        const friendId = friend.friendId || friend.id;
                        const isSelected = selectedFriendsToInvite.includes(friendId);
                        const displayName = friend.friendName || friend.displayName || '익명';
                        const wsCode = friend.friendWorkspaceCode || friend.wsCode || '';

                        return (
                          <SelectableMemberItem
                            key={friendId}
                            $selected={isSelected}
                            onClick={() => {
                              setSelectedFriendsToInvite(prev =>
                                prev.includes(friendId)
                                  ? prev.filter(id => id !== friendId)
                                  : [...prev, friendId]
                              );
                            }}
                          >
                            <MemberAvatar $color={getAvatarColor(friendId)}>
                              {displayName.charAt(0).toUpperCase()}
                            </MemberAvatar>
                            <MemberInfo>
                              <MemberName>{displayName}</MemberName>
                              <MemberStatus>@{wsCode.replace('WS-', '')}</MemberStatus>
                            </MemberInfo>
                            {isSelected && <CheckMark>✓</CheckMark>}
                          </SelectableMemberItem>
                        );
                      })}
                  </FriendListWrapper>

                  {selectedFriendsToInvite.length > 0 && (
                    <SelectedInfo>{selectedFriendsToInvite.length}명 선택됨</SelectedInfo>
                  )}
                </>
              ) : (
                <EmptyStateContainer>
                  <EmptyIcon>👥</EmptyIcon>
                  <EmptyTitle>친구가 없습니다</EmptyTitle>
                  <EmptyDescription>
                    친구 탭에서 친구를 추가해보세요
                  </EmptyDescription>
                </EmptyStateContainer>
              )}
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => {
                setShowInviteMembersModal(false);
                setSelectedFriendsToInvite([]);
                setSearchQueryInvite('');
              }}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleInviteMembers}
                disabled={loadingInvite || selectedFriendsToInvite.length === 0}
              >
                {loadingInvite ? '초대 중...' : '초대하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 방장 위임 모달 */}
      {showTransferOwnerModal && (
        <ModalOverlay onClick={() => {
          setShowTransferOwnerModal(false);
          setSelectedMemberToTransfer(null);
        }}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <UserCog size={24} />
                방장 위임
              </ModalTitle>
              <CloseButton onClick={() => {
                setShowTransferOwnerModal(false);
                setSelectedMemberToTransfer(null);
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              <WarningMessage>
                ⚠️ 방장을 위임하면 이전 방장은 일반 멤버가 됩니다
              </WarningMessage>

              {/* 멤버 목록 (방장 제외, active 상태만) */}
              <FriendListWrapper>
                {chat.membersInfo && Object.entries(chat.membersInfo)
                  .filter(([memberId, memberInfo]) => {
                    // 방장 본인 제외, active 상태만
                    return memberId !== chat.creatorId &&
                           memberId !== currentUserId &&
                           memberInfo.status === 'active';
                  })
                  .map(([memberId, memberInfo]) => {
                    const isSelected = selectedMemberToTransfer === memberId;
                    const displayName = memberInfo.displayName || '익명';

                    return (
                      <SelectableMemberItem
                        key={memberId}
                        $selected={isSelected}
                        onClick={() => setSelectedMemberToTransfer(memberId)}
                      >
                        <MemberAvatar $color={getAvatarColor(memberId)}>
                          {displayName.charAt(0).toUpperCase()}
                        </MemberAvatar>
                        <MemberInfo>
                          <MemberName>{displayName}</MemberName>
                          <MemberStatus $status="active">
                            {memberInfo.status === 'pending' ? '초대 대기중' : '참여중'}
                          </MemberStatus>
                        </MemberInfo>
                        {isSelected && <CheckMark>✓</CheckMark>}
                      </SelectableMemberItem>
                    );
                  })}
              </FriendListWrapper>

              {selectedMemberToTransfer && (
                <SelectedInfo>
                  {chat.membersInfo?.[selectedMemberToTransfer]?.displayName}님을 새 방장으로 선택했습니다
                </SelectedInfo>
              )}
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => {
                setShowTransferOwnerModal(false);
                setSelectedMemberToTransfer(null);
              }}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleTransferOwnership}
                disabled={loadingTransfer || !selectedMemberToTransfer}
              >
                {loadingTransfer ? '위임 중...' : '위임하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}
    </FullScreenContainer>,
    document.body
  );
};

export default ChatRoom;
