// 전체화면 채팅방 컴포넌트
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ArrowLeft, Send, MoreVertical, Users, Smile, FileText, Plus, Settings, X, UserCog, UserPlus, Trash2, Mail, Copy, Shield } from 'lucide-react';
import { subscribeToMessages, sendMessage, markDMAsRead, subscribeToDMRoom, enterDMRoom, exitDMRoom } from '../../services/directMessageService';
import { subscribeToGroupMessages, sendGroupMessage, markAllMessagesAsRead, markGroupAsRead, acceptInvitation, rejectInvitation, inviteMembersToGroup, transferRoomOwnership, removeMemberFromGroup, deleteGroupChat, cancelInvitation, updateGroupRoomType, appointSubManager, updateGroupImage, enterGroupRoom, exitGroupRoom } from '../../services/groupChatService';
import { getMyFriends, getUserByWorkspaceCode } from '../../services/friendService';
import { getUserNickname } from '../../services/nicknameService';
import { isUserBlocked } from '../../services/userManagementService';
import { playChatMessageSound, notificationSettings } from '../../utils/notificationSounds';
import CollapsibleDocumentEditor from './CollapsibleDocumentEditor';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';
import SharedMemoSelectorModal from './SharedMemoSelectorModal';
import PermissionManagementModal from './PermissionManagementModal';
import AppointSubManagerModal from './AppointSubManagerModal';
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

const AvatarBadge = styled.div`
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
  padding-bottom: 80px;  /* 🔥 나가기 버튼 영역 확보 */
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

// 그룹 삭제 알림 박스
const DeletionNotice = styled.div`
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

const DeletionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const DeletionMessage = styled.div`
  font-size: 14px;
  color: #fca5a5;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const DeletionCountdown = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  background: #dc2626;
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
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

const BlockedMessage = styled.div`
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

const RemoveButton = styled.button`
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

const CancelInviteButton = styled.button`
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
const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TabButton = styled.button`
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

const SearchBarWrapper = styled.div`
  margin-bottom: 16px;
`;

const SearchByIdContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const IdInputWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
`;

const IdInput = styled.input`
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

const SearchButton = styled.button`
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

const UserCardContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InviteButton = styled.button`
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

const InviteCodeContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
`;

const InviteCodeLabel = styled.div`
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
`;

const InviteCodeDisplay = styled.div`
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

const InviteCodeText = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #4a90e2;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
`;

const CopyButton = styled.button`
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

const InviteCodeDescription = styled.div`
  font-size: 13px;
  color: #999;
  line-height: 1.6;
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
  const [showAppointSubManagerModal, setShowAppointSubManagerModal] = useState(false); // 부방장 임명 모달
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false); // 초대 코드 보기 모달
  const [friends, setFriends] = useState([]); // 친구 목록 (멤버 초대용)
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState([]); // 초대할 친구 선택
  const [searchQueryInvite, setSearchQueryInvite] = useState(''); // 초대 모달 검색어
  const [inviteTab, setInviteTab] = useState('friends'); // 'friends' | 'search'
  const [workspaceIdInput, setWorkspaceIdInput] = useState(''); // 아이디 입력
  const [searchedUser, setSearchedUser] = useState(null); // 검색된 사용자
  const [searchingUser, setSearchingUser] = useState(false); // 사용자 검색 중
  const [selectedMemberToTransfer, setSelectedMemberToTransfer] = useState(null); // 위임할 멤버 선택
  const [loadingInvite, setLoadingInvite] = useState(false); // 초대 중
  const [loadingTransfer, setLoadingTransfer] = useState(false); // 위임 중
  const [memberNicknames, setMemberNicknames] = useState({}); // 멤버 닉네임 캐시
  const [nicknamesLoaded, setNicknamesLoaded] = useState(false); // 닉네임 로딩 완료 여부
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false); // 강퇴 확인 모달
  const [memberToRemove, setMemberToRemove] = useState(null); // 강퇴할 멤버 { id, name }
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false); // 멤버 상세 정보 모달
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null); // 선택된 멤버 { id, name, workspaceId }
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false); // 단체방 삭제 확인 모달 (1단계)
  const [showDeleteGroupFinalModal, setShowDeleteGroupFinalModal] = useState(false); // 단체방 삭제 최종 확인 모달 (2단계)
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false); // 🆕 방 타입 변경 모달
  const [selectedRoomType, setSelectedRoomType] = useState(null); // 선택된 방 타입 (null | true | false)
  const [showRoomTypeConfirmModal, setShowRoomTypeConfirmModal] = useState(false); // 방 타입 변경 최종 확인 모달
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false); // 그룹 나가기 확인 모달
  const [leaveAfterTransfer, setLeaveAfterTransfer] = useState(false); // 위임 후 나가기 플래그
  const [showOwnerLeaveGuideModal, setShowOwnerLeaveGuideModal] = useState(false); // 방장 나가기 안내 모달
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState(false); // 위임 최종 확인 모달
  const [isOtherUserBlocked, setIsOtherUserBlocked] = useState(false); // 상대방 차단 여부 (양방향)
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true); // 차단 상태 확인 중
  const [groupDeletionInfo, setGroupDeletionInfo] = useState(null); // 그룹 삭제 정보 { deleterName, countdown }
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null); // 프로필 이미지 업로드용

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
      // 실제 활성화된 멤버 수 계산 (pending, rejected 제외)
      const activeMemberCount = chat.membersInfo
        ? Object.values(chat.membersInfo).filter(memberInfo => memberInfo.status === 'active').length
        : 0;

      return {
        name: chat.groupName || '이름 없는 그룹',
        isGroup: true,
        memberCount: activeMemberCount
      };
    }

    const otherUserId = chat.participants?.find(id => id !== currentUserId);

    // 나와의 대화인 경우 (otherUserId가 없음)
    if (!otherUserId) {
      const myInfo = chat.participantsInfo?.[currentUserId];
      const myDisplayName = memberNicknames[currentUserId] || myInfo?.displayName || currentUserName || '나';
      return {
        name: `${myDisplayName} (나)`,
        userId: currentUserId,
        isGroup: false,
        isSelfChat: true
      };
    }

    const otherUserInfo = chat.participantsInfo?.[otherUserId];
    // 앱 닉네임 우선, fallback으로 Google displayName 사용
    const displayName = memberNicknames[otherUserId] || otherUserInfo?.displayName || '익명';
    return {
      name: displayName,
      userId: otherUserId,
      isGroup: false,
      isSelfChat: false
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

  // 🚨 그룹 삭제 감지 및 메시지 구독 (실시간)
  useEffect(() => {
    if (!chat.id || chat.type !== 'group') return;

    let isMounted = true;
    const groupRef = doc(db, 'groupChats', chat.id);
    let countdownInterval = null;

    const unsubscribe = onSnapshot(
      groupRef,
      (docSnapshot) => {
        if (!isMounted) return;

        // 그룹이 삭제된 경우
        if (!docSnapshot.exists()) {
          // 이미 카운트다운 중이면 무시 (중복 방지)
          if (groupDeletionInfo) return;

          // 마지막 메시지에서 삭제자 이름 확인
          const lastMessage = messages[messages.length - 1];
          let deleterName = '방장';

          if (lastMessage?.metadata?.action === 'group_deleted') {
            const deleterId = lastMessage.metadata.actorId;
            deleterName = chat.membersInfo?.[deleterId]?.displayName || '방장';
          }

          // 10초 카운트다운 시작
          setGroupDeletionInfo({ deleterName, countdown: 10 });

          let remaining = 10;
          countdownInterval = setInterval(() => {
            remaining--;
            if (remaining > 0 && isMounted) {
              setGroupDeletionInfo({ deleterName, countdown: remaining });
            } else {
              clearInterval(countdownInterval);
              if (isMounted) {
                onClose();
              }
            }
          }, 1000);
        }
      },
      (error) => {
        console.error('그룹 문서 구독 에러:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [chat.id, chat.type, chat.membersInfo, messages, groupDeletionInfo, onClose]);

  // 그룹 채팅에서 내 멤버 상태 확인
  useEffect(() => {
    if (!chat.id || chat.type !== 'group' || !currentUserId) return;

    // chat.membersInfo에서 내 상태 확인
    const myStatus = chat.membersInfo?.[currentUserId]?.status;
    setMyMemberStatus(myStatus || 'active');
  }, [chat.id, chat.type, chat.membersInfo, currentUserId]);

  // DM 방에서 차단 상태 확인 (양방향)
  useEffect(() => {
    if (chat.type === 'group') {
      setCheckingBlockStatus(false);
      return;
    }

    const checkBlockStatus = async () => {
      try {
        setCheckingBlockStatus(true);
        const otherUserId = chat.participants?.find(id => id !== currentUserId);
        if (!otherUserId) {
          setIsOtherUserBlocked(false);
          return;
        }

        // 양방향 차단 확인: 내가 상대를 차단했거나 상대가 나를 차단한 경우
        const iBlockedThem = await isUserBlocked(currentUserId, otherUserId);
        const theyBlockedMe = await isUserBlocked(otherUserId, currentUserId);

        setIsOtherUserBlocked(iBlockedThem || theyBlockedMe);
      } catch (error) {
        console.error('차단 상태 확인 오류:', error);
        setIsOtherUserBlocked(false);
      } finally {
        setCheckingBlockStatus(false);
      }
    };

    checkBlockStatus();
  }, [chat.type, chat.participants, currentUserId]);

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

        // 새 메시지 도착 시 즉시 읽음 처리
        if (prevMessageCount > 0 && newMessages.length > prevMessageCount) {
          if (chat.type === 'group') {
            markGroupAsRead(chat.id, currentUserId);
          } else {
            markDMAsRead(chat.id);
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
        // 그룹 채팅: unreadCount를 0으로 설정하고 메시지 읽음 처리
        markGroupAsRead(chat.id, currentUserId);
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

  // 🆕 chat.isPublic이 변경되면 selectedRoomType 자동 업데이트
  useEffect(() => {
    if (chat.type === 'group') {
      setSelectedRoomType(chat.isPublic);
    }
  }, [chat.isPublic, chat.type]);

  // 멤버들의 닉네임 조회
  useEffect(() => {
    const fetchNicknames = async () => {
      setNicknamesLoaded(false); // 닉네임 로딩 시작

      if (chat.type === 'group' && chat.membersInfo) {
        const nicknames = {};
        for (const memberId of Object.keys(chat.membersInfo)) {
          const nickname = await getUserNickname(memberId);
          if (nickname) {
            nicknames[memberId] = nickname;
          }
        }
        setMemberNicknames(nicknames);
      } else if (chat.type !== 'group' && chat.participants) {
        // 1:1 채팅 - 상대방 닉네임 조회
        const nicknames = {};
        for (const participantId of chat.participants) {
          if (participantId !== currentUserId) {
            const nickname = await getUserNickname(participantId);
            if (nickname) {
              nicknames[participantId] = nickname;
            }
          }
        }
        setMemberNicknames(nicknames);
      }

      setNicknamesLoaded(true); // 닉네임 로딩 완료
    };

    fetchNicknames();
  }, [chat.id, chat.membersInfo, chat.participants, currentUserId]);

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
  const handleAcceptInvitation = async (forceAccept = false) => {
    setProcessingInvitation(true);
    try {
      await acceptInvitation(chat.id, currentUserId, forceAccept);
      setMyMemberStatus('active');
      showToast?.('✅ 단체방에 참여했습니다');
    } catch (error) {
      console.error('초대 수락 실패:', error);

      // 차단 사용자가 있는 경우
      if (error.message?.startsWith('BLOCKED_MEMBERS_IN_GROUP:')) {
        const blockedNames = error.message.replace('BLOCKED_MEMBERS_IN_GROUP:', '');
        const confirmed = window.confirm(
          `참여자 중에 차단한 사용자가 있습니다.\n\n차단한 사용자: ${blockedNames}\n\n이 방에 참여하시겠습니까?\n(참여하면 이 방에서는 서로 대화할 수 있습니다)`
        );

        if (confirmed) {
          // 사용자가 참여를 선택한 경우 forceAccept로 다시 호출
          await handleAcceptInvitation(true);
        }
        setProcessingInvitation(false);
        return;
      }

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

  // 🆕 채팅방 입장/퇴장 처리
  useEffect(() => {
    if (chat.type === 'group') {
      // 그룹 채팅방
      enterGroupRoom(chat.id, currentUserId);
      return () => {
        exitGroupRoom(chat.id, currentUserId);
      };
    } else {
      // 1:1 채팅방
      enterDMRoom(chat.id, currentUserId);
      return () => {
        exitDMRoom(chat.id, currentUserId);
      };
    }
  }, [chat.id, chat.type, currentUserId]);

  // 메시지 전송
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

  // 아이디로 사용자 검색 핸들러
  const handleSearchUserById = async () => {
    if (!workspaceIdInput.trim()) {
      showToast?.('아이디를 입력해주세요');
      return;
    }

    if (workspaceIdInput.trim().length !== 6) {
      showToast?.('아이디는 6자리입니다');
      return;
    }

    setSearchingUser(true);
    try {
      const wsCode = `WS-${workspaceIdInput.trim().toUpperCase()}`;
      const user = await getUserByWorkspaceCode(wsCode);

      if (!user) {
        showToast?.('사용자를 찾을 수 없습니다');
        setSearchedUser(null);
        return;
      }

      // 자기 자신 체크
      if (user.id === currentUserId) {
        showToast?.('자신을 초대할 수 없습니다');
        setSearchedUser(null);
        return;
      }

      // 이미 그룹 멤버인지 체크
      if (chat.members?.includes(user.id)) {
        showToast?.('이미 그룹 멤버입니다');
        setSearchedUser(null);
        return;
      }

      setSearchedUser(user);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      showToast?.('사용자 검색에 실패했습니다');
      setSearchedUser(null);
    } finally {
      setSearchingUser(false);
    }
  };

  // 검색된 사용자 초대 핸들러
  const handleInviteSearchedUser = async () => {
    if (!searchedUser) return;

    setLoadingInvite(true);
    try {
      await inviteMembersToGroup(chat.id, currentUserId, [searchedUser.id]);
      showToast?.(`${searchedUser.displayName || '사용자'}님을 초대했습니다`);
      setShowInviteMembersModal(false);
      setWorkspaceIdInput('');
      setSearchedUser(null);
      setInviteTab('friends');
    } catch (error) {
      console.error('멤버 초대 실패:', error);
      showToast?.(error.message || '멤버 초대에 실패했습니다');
    } finally {
      setLoadingInvite(false);
    }
  };

  // 멤버 초대 핸들러 (친구 목록)
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

  // 부방장 임명 핸들러
  const handleAppointSubManager = async (subManagerId, permissions) => {
    try {
      await appointSubManager(chat.id, currentUserId, subManagerId, permissions);
      const subManagerName = chat.membersInfo?.[subManagerId]?.displayName || '익명';
      showToast?.(`${subManagerName}님을 부방장으로 임명했습니다`);
    } catch (error) {
      console.error('부방장 임명 실패:', error);
      showToast?.(error.message || '부방장 임명에 실패했습니다');
      throw error;
    }
  };

  // 단체방 프로필 이미지 변경 핸들러
  const handleAvatarClick = () => {
    // 단체방이고 방장인 경우에만 이미지 변경 가능
    if (chat.type === 'group' && isRoomOwner) {
      imageInputRef.current?.click();
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('이미지 크기는 5MB 이하여야 합니다');
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      showToast?.('이미지 파일만 업로드할 수 있습니다');
      return;
    }

    try {
      // R2에 이미지 업로드 (Base64가 아닌 R2 URL 사용)
      const { uploadImage } = await import('../../utils/storageService');
      showToast?.('이미지 업로드 중...');
      const imageUrl = await uploadImage(file, 'group-profile-images');

      // R2 URL을 Firestore에 저장
      await updateGroupImage(chat.id, currentUserId, imageUrl);
      showToast?.('프로필 이미지가 변경되었습니다');
    } catch (error) {
      console.error('프로필 이미지 업데이트 실패:', error);
      showToast?.(error.message || '프로필 이미지 변경에 실패했습니다');
    }

    // input 초기화
    e.target.value = '';
  };

  // 방장 위임 핸들러 - 최종 확인 모달 표시
  const handleTransferOwnership = () => {
    if (!selectedMemberToTransfer) {
      showToast?.('위임할 멤버를 선택해주세요');
      return;
    }

    if (selectedMemberToTransfer === currentUserId) {
      showToast?.('자기 자신에게는 위임할 수 없습니다');
      return;
    }

    // 최종 확인 모달 표시
    setShowTransferConfirmModal(true);
  };

  // 방장 위임 최종 확인
  const handleConfirmTransferOwnership = async () => {
    setLoadingTransfer(true);
    try {
      await transferRoomOwnership(chat.id, currentUserId, selectedMemberToTransfer);
      const transferredMemberName = chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '알 수 없음';
      showToast?.(`${transferredMemberName}님에게 방장 권한을 위임했습니다`);
      setShowTransferConfirmModal(false);
      setShowTransferOwnerModal(false);
      setSelectedMemberToTransfer(null);

      // 위임 후 나가기 플래그가 설정되어 있으면 자동으로 나가기
      if (leaveAfterTransfer) {
        setLeaveAfterTransfer(false);
        // 잠깐 대기 후 나가기 (위임 완료 후)
        setTimeout(async () => {
          try {
            const { leaveGroup } = await import('../../services/groupChatService');
            await leaveGroup(chat.id, currentUserId);
            showToast?.('그룹을 나갔습니다');
            onClose(); // 채팅방 닫기
          } catch (error) {
            console.error('그룹 나가기 실패:', error);
            showToast?.(error.message || '그룹 나가기에 실패했습니다');
          }
        }, 500);
      }
    } catch (error) {
      console.error('방장 위임 실패:', error);
      showToast?.(error.message || '방장 위임에 실패했습니다');
      setLeaveAfterTransfer(false); // 실패 시 플래그 초기화
    } finally {
      setLoadingTransfer(false);
    }
  };

  // 멤버 강퇴 핸들러 - 모달 열기
  const handleRemoveMember = (targetId, targetName) => {
    setMemberToRemove({ id: targetId, name: targetName });
    setShowRemoveMemberModal(true);
  };

  // 멤버 강퇴 확인
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMemberFromGroup(chat.id, currentUserId, memberToRemove.id);
      showToast?.(`${memberToRemove.name}님을 강퇴했습니다`);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('멤버 강퇴 실패:', error);
      showToast?.(error.message || '멤버 강퇴에 실패했습니다');
    }
  };

  // 초대 취소 핸들러 (pending/rejected 멤버만)
  const handleCancelInvitation = async (targetId, targetName) => {
    const confirmed = window.confirm(
      `${targetName}님의 초대를 취소하시겠습니까?\n목록에서 완전히 제거됩니다.`
    );

    if (!confirmed) return;

    try {
      await cancelInvitation(chat.id, currentUserId, targetId);
      showToast?.(`${targetName}님의 초대를 취소했습니다`);
    } catch (error) {
      console.error('초대 취소 실패:', error);
      showToast?.(error.message || '초대 취소에 실패했습니다');
    }
  };

  // 멤버 상세 정보 보기
  const handleShowMemberDetail = async (memberId, memberName) => {
    try {
      // Firestore에서 워크스페이스 코드 조회
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const workspacesRef = collection(db, 'workspaces');
      const q = query(workspacesRef, where('userId', '==', memberId));
      const snapshot = await getDocs(q);

      let workspaceCode = '정보 없음';
      if (!snapshot.empty) {
        workspaceCode = snapshot.docs[0].data().workspaceCode || '정보 없음';
      }

      setSelectedMemberDetail({
        id: memberId,
        name: memberName,
        workspaceId: workspaceCode
      });
      setShowMemberDetailModal(true);
    } catch (error) {
      console.error('워크스페이스 코드 조회 실패:', error);
      // 실패해도 모달은 띄움
      setSelectedMemberDetail({
        id: memberId,
        name: memberName,
        workspaceId: '정보 없음'
      });
      setShowMemberDetailModal(true);
    }
  };

  // 워크스페이스 ID 복사
  const handleCopyWorkspaceId = () => {
    if (selectedMemberDetail?.workspaceId && selectedMemberDetail.workspaceId !== '정보 없음') {
      // WS- 제거하고 6자리만 복사
      const idOnly = selectedMemberDetail.workspaceId.replace('WS-', '');
      navigator.clipboard.writeText(idOnly);
      showToast?.('셰어노트 ID가 복사되었습니다');
    }
  };

  // 초대 코드 복사 핸들러
  const handleCopyInviteCode = () => {
    if (chat.inviteCode) {
      navigator.clipboard.writeText(chat.inviteCode);
      showToast?.('초대 코드가 복사되었습니다');
    }
  };

  // 첫 번째 모달에서 확인 버튼 클릭 (최종 확인 모달 띄우기)
  const handleRoomTypeSelectConfirm = () => {
    if (selectedRoomType === null || selectedRoomType === chat.isPublic) {
      // 변경사항이 없으면 그냥 닫기
      setShowRoomTypeModal(false);
      setSelectedRoomType(null);
      return;
    }

    // 최종 확인 모달 열기
    setShowRoomTypeModal(false);
    setShowRoomTypeConfirmModal(true);
  };

  // 최종 확인 모달에서 확인 버튼 클릭 (실제 변경 수행)
  const handleFinalConfirmRoomTypeChange = async () => {
    try {
      await updateGroupRoomType(chat.id, currentUserId, selectedRoomType);
      setShowRoomTypeConfirmModal(false);
      setSelectedRoomType(null);
    } catch (error) {
      console.error('방 타입 변경 실패:', error);
      showToast?.(error.message || '방 타입 변경에 실패했습니다');
      setShowRoomTypeConfirmModal(false);
      setSelectedRoomType(null);
    }
  };

  // 단체방 삭제 핸들러
  const handleDeleteGroup = () => {
    setShowDeleteGroupModal(true);
  };

  // 단체방 삭제 1단계 확인 → 2단계 모달로 이동
  const handleConfirmDeleteGroup = () => {
    setShowDeleteGroupModal(false);
    setShowDeleteGroupFinalModal(true);
  };

  // 단체방 삭제 최종 확인 (2단계)
  const handleFinalConfirmDeleteGroup = async () => {
    try {
      await deleteGroupChat(chat.id, currentUserId);
      showToast?.('단체방이 삭제되었습니다');
      setShowDeleteGroupFinalModal(false);
      onClose(); // 채팅방 닫기
    } catch (error) {
      console.error('단체방 삭제 실패:', error);
      showToast?.(error.message || '단체방 삭제에 실패했습니다');
    }
  };

  // 그룹 나가기 핸들러
  const handleLeaveGroup = () => {
    // 방장인지 확인
    if (isRoomOwner && chat.membersInfo) {
      // active 멤버가 있는지 확인 (방장 본인 제외)
      const hasActiveMember = Object.entries(chat.membersInfo).some(
        ([memberId, memberInfo]) =>
          memberId !== currentUserId && memberInfo.status === 'active'
      );

      if (hasActiveMember) {
        // active 멤버가 있으면 위임 안내 모달
        setShowOwnerLeaveGuideModal(true);
      } else {
        // active 멤버가 없으면 (pending만 있거나 아무도 없으면) 안내
        showToast?.('위임할 수 있는 참여자가 없습니다.\n단체방 삭제를 이용하세요');
      }
      return;
    }

    // 마지막 멤버이거나 일반 멤버인 경우 → 바로 나가기 모달
    setShowLeaveGroupModal(true);
  };

  // 방장 나가기 안내 모달에서 "위임하기" 클릭
  const handleStartTransferForLeave = () => {
    setShowOwnerLeaveGuideModal(false);
    setLeaveAfterTransfer(true);
    setShowTransferOwnerModal(true);
  };

  // 그룹 나가기 확인
  const handleConfirmLeaveGroup = async () => {
    try {
      const { leaveGroup } = await import('../../services/groupChatService');
      await leaveGroup(chat.id, currentUserId);
      showToast?.('그룹을 나갔습니다');
      setShowLeaveGroupModal(false);
      onClose(); // 채팅방 닫기
    } catch (error) {
      console.error('그룹 나가기 실패:', error);
      showToast?.(error.message || '그룹 나가기에 실패했습니다');
    }
  };

  // 마지막 active 멤버 여부 확인
  const isLastMember = chat.type === 'group' && chat.membersInfo &&
    Object.values(chat.membersInfo).filter(memberInfo => memberInfo.status === 'active').length === 1;

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
          <Avatar
            $color={otherUser.isGroup ? 'linear-gradient(135deg, #667eea, #764ba2)' : getAvatarColor(otherUser.userId)}
            $clickable={otherUser.isGroup && isRoomOwner}
            onClick={handleAvatarClick}
            title={otherUser.isGroup && isRoomOwner ? '프로필 이미지 변경' : ''}
            style={chat.groupImage ? { backgroundImage: `url(${chat.groupImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {!chat.groupImage && (otherUser.isGroup ? <Users size={20} /> : (nicknamesLoaded ? otherUser.name.charAt(0).toUpperCase() : '...'))}
            {otherUser.isGroup && (
              <AvatarBadge title={chat.isPublic ? '공개방' : '비공개방'}>
                {chat.isPublic ? '🌐' : '🔒'}
              </AvatarBadge>
            )}
          </Avatar>
          <ChatInfo>
            <ChatName>
              {nicknamesLoaded
                ? (otherUser.name.length > 10 ? otherUser.name.substring(0, 10) + '...' : otherUser.name)
                : '로딩 중...'}
            </ChatName>
            <ChatStatus>
              {otherUser.isGroup ? `멤버 ${otherUser.memberCount}명` : ''}
            </ChatStatus>
          </ChatInfo>
        </HeaderLeft>
        <HeaderRight>
          {chat.type === 'group' && !chat.isPublic && (
            <MenuButton onClick={() => setShowMemberListModal(true)} title="참여자 목록">
              <Users size={20} />
            </MenuButton>
          )}
          {!getOtherUserInfo().isSelfChat && (
            <MenuButton onClick={handleToggleDocument} title="공유 문서">
              <FileText size={20} />
            </MenuButton>
          )}
          {chat.type === 'group' && (
            <div style={{ position: 'relative' }}>
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
              </MenuButton>
              {/* 드롭다운 메뉴 (방장만 표시) */}
              {showMenuDropdown && isRoomOwner && (
                <DropdownMenu onClick={(e) => e.stopPropagation()}>
                  {/* 비공개방일 때만 멤버 초대 메뉴 표시 */}
                  {!chat.isPublic && (
                    <DropdownItem
                      onClick={() => {
                        setShowInviteMembersModal(true);
                        setShowMenuDropdown(false);
                      }}
                    >
                      <Users size={16} />
                      멤버 초대
                    </DropdownItem>
                  )}
                  {/* 공개방일 때만 초대 코드 보기 메뉴 표시 */}
                  {chat.isPublic && (
                    <DropdownItem
                      onClick={() => {
                        setShowInviteCodeModal(true);
                        setShowMenuDropdown(false);
                      }}
                    >
                      <Mail size={16} />
                      초대 코드 보기
                    </DropdownItem>
                  )}
                  {/* 🆕 방 공개 설정 변경 메뉴 */}
                  <DropdownItem
                    onClick={() => {
                      setSelectedRoomType(chat.isPublic); // 현재 방 타입으로 초기화
                      setShowRoomTypeModal(true);
                      setShowMenuDropdown(false);
                    }}
                  >
                    <Settings size={16} />
                    방 공개 설정
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      setShowAppointSubManagerModal(true);
                      setShowMenuDropdown(false);
                    }}
                  >
                    <Shield size={16} />
                    부방장 임명
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
                  <DropdownItem
                    onClick={() => {
                      setShowMenuDropdown(false);
                      handleDeleteGroup();
                    }}
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                    단체방 삭제
                  </DropdownItem>
                </DropdownMenu>
              )}
            </div>
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
        {/* 그룹 삭제 알림 (카운트다운) */}
        {groupDeletionInfo && (
          <DeletionNotice>
            <DeletionTitle>
              ⚠️ 단체방 삭제 안내
            </DeletionTitle>
            <DeletionMessage>
              {groupDeletionInfo.deleterName}님에 의해<br />
              대화방이 삭제되었습니다.
            </DeletionMessage>
            <DeletionCountdown>
              {groupDeletionInfo.countdown}초 후 방이 사라집니다
            </DeletionCountdown>
          </DeletionNotice>
        )}

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
              // 🆕 그룹 채팅은 항상 프로필/닉네임 표시, 1:1은 연속 메시지에서 생략
              const showAvatar = !isMine && (
                chat.type === 'group'
                  ? true  // 그룹 채팅: 항상 표시
                  : (index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId)  // 1:1: 연속 메시지 생략
              );

              // 상대방 ID 찾기
              const otherUserId = chat.participants?.find(id => id !== currentUserId);

              // 읽음 여부 판단: 방에 있는 모든 사람에게 표시
              let isUnreadByOther = false;
              let unreadCount = 0;

              if (chatRoomData.type !== 'group') {
                // 1:1 채팅: message.read 필드로 직접 확인 (즉시 반영)
                // 내가 보낸 메시지만 표시 (상대방이 안 읽었는지)
                if (isMine) {
                  isUnreadByOther = message.read === false;
                }
              } else {
                // 그룹 채팅: 방에 있는 사람은 누구나 안 읽은 사람 수 표시
                const activeMembers = chat.members?.filter(memberId => {
                  const memberStatus = chat.membersInfo?.[memberId]?.status;
                  return memberStatus === 'active' && memberId !== currentUserId;
                }) || [];

                // readBy 배열에 없는 멤버 수만 카운트
                const readByArray = message.readBy || [];
                unreadCount = activeMembers.filter(memberId => {
                  return !readByArray.includes(memberId);
                }).length;

                isUnreadByOther = unreadCount > 0;
              }

              const userRole = getUserRole(message.senderId);

              // 시스템 메시지인 경우
              if (message.type === 'system') {
                return (
                  <div key={message.id}>
                    {showDate && (
                      <DateSeparator>
                        <DateText>{formatDate(message.createdAt)}</DateText>
                      </DateSeparator>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '16px 0',
                      padding: '0 20px'
                    }}>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.2)'
                      }} />
                      <div style={{
                        fontSize: '13px',
                        color: '#999',
                        whiteSpace: 'nowrap'
                      }}>
                        {message.content}
                      </div>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.2)'
                      }} />
                    </div>
                  </div>
                );
              }

              // 일반 메시지
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
                        {(memberNicknames[message.senderId] || message.senderName || '?').charAt(0).toUpperCase()}
                        {userRole && (
                          <RoleBadge title={userRole.label}>
                            {userRole.icon}
                          </RoleBadge>
                        )}
                      </MessageAvatar>
                    )}
                    {!isMine && !showAvatar && <div style={{ width: '32px' }} />}
                    <MessageContent $isMine={isMine}>
                      {!isMine && showAvatar && <SenderName>{memberNicknames[message.senderId] || message.senderName}</SenderName>}
                      <MessageBubble $isMine={isMine}>
                        {message.text || message.content}
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
        {/* 차단된 경우 메시지 표시 (DM 전용) */}
        {chat.type !== 'group' && isOtherUserBlocked ? (
          <BlockedMessage>
            🚫 차단된 사용자와는 메시지를 주고받을 수 없습니다
          </BlockedMessage>
        ) : (
          <>
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
          </>
        )}
      </InputContainer>

      {/* 단체방 나가기 버튼 */}
      {chat.type === 'group' && (
        <div style={{
          padding: '12px 20px',
          background: '#1a1a1a',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={handleLeaveGroup}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #f56565, #e53e3e)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 101, 101, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 101, 101, 0.3)';
            }}
          >
            채팅방 나가기
          </button>
        </div>
      )}

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
                참여자 목록 ({chat.membersInfo ? Object.values(chat.membersInfo).filter(m => m.status === 'active').length : 0})
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
                const displayName = memberNicknames[memberId] || memberInfo.displayName || '익명';

                // 상태 표시 - 초대 대기중/거부만 표시
                let statusText = null;
                if (memberInfo.status === 'pending') {
                  statusText = '초대 대기중';
                } else if (memberInfo.status === 'rejected') {
                  statusText = '초대 거부';
                }
                // 'active' 상태는 상태 텍스트 없음

                return (
                  <MemberItem key={memberId} onClick={() => handleShowMemberDetail(memberId, displayName)} style={{ cursor: 'pointer' }}>
                    <MemberAvatar $color={getAvatarColor(memberId)}>
                      {displayName.charAt(0).toUpperCase()}
                    </MemberAvatar>
                    <MemberInfo>
                      <MemberName>
                        {displayName}
                        {isOwner && <OwnerBadge>방장</OwnerBadge>}
                      </MemberName>
                      {statusText && (
                        <MemberStatus $status={memberInfo.status || 'active'}>
                          {statusText}
                        </MemberStatus>
                      )}
                    </MemberInfo>
                  </MemberItem>
                );
              })}

              {/* 나머지 멤버들 */}
              {chat.membersInfo && Object.entries(chat.membersInfo).map(([memberId, memberInfo]) => {
                if (memberId === chat.creatorId) return null;
                const displayName = memberNicknames[memberId] || memberInfo.displayName || '익명';
                const memberStatus = memberInfo.status || 'active';

                // 강퇴 여부 확인
                const isKicked = chat.kickedUsers && chat.kickedUsers.includes(memberId);
                // members 배열에 있는지 확인 (대화방에 남아있는지)
                const isStillInRoom = chat.members && chat.members.includes(memberId);

                // 강퇴되었고 방을 나간 상태
                const hasLeftAfterKick = isKicked && !isStillInRoom;

                // 상태 표시 - 초대 대기중/거부만 표시
                let statusText = null;
                if (memberStatus === 'pending') {
                  statusText = '초대 대기중';
                } else if (memberStatus === 'rejected') {
                  statusText = '초대 거부';
                }
                // 'active' 상태는 상태 텍스트 없음

                return (
                  <MemberItem
                    key={memberId}
                    style={{ opacity: hasLeftAfterKick ? 0.5 : 1, cursor: 'pointer' }}
                    onClick={(e) => {
                      // 강퇴 버튼 클릭 시에는 상세 모달 안 띄우기
                      if (e.target.closest('button')) return;
                      handleShowMemberDetail(memberId, displayName);
                    }}
                  >
                    <MemberAvatar $color={getAvatarColor(memberId)} style={{ opacity: hasLeftAfterKick ? 0.6 : 1 }}>
                      {displayName.charAt(0).toUpperCase()}
                    </MemberAvatar>
                    <MemberInfo>
                      <MemberName style={{ opacity: hasLeftAfterKick ? 0.7 : 1 }}>
                        {displayName}
                        {isKicked && <OwnerBadge style={{ background: '#e53e3e', marginLeft: '6px' }}>강퇴됨</OwnerBadge>}
                      </MemberName>
                      {(hasLeftAfterKick || statusText) && (
                        <MemberStatus $status={hasLeftAfterKick ? 'rejected' : memberStatus}>
                          {hasLeftAfterKick ? '퇴장함' : statusText}
                        </MemberStatus>
                      )}
                    </MemberInfo>
                    {isRoomOwner && memberStatus === 'active' && !isKicked && (
                      <RemoveButton onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMember(memberId, displayName);
                      }}>
                        강퇴
                      </RemoveButton>
                    )}
                    {isRoomOwner && (memberStatus === 'pending' || memberStatus === 'rejected') && (
                      <CancelInviteButton onClick={(e) => {
                        e.stopPropagation();
                        handleCancelInvitation(memberId, displayName);
                      }}>
                        초대 취소
                      </CancelInviteButton>
                    )}
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
          setWorkspaceIdInput('');
          setSearchedUser(null);
          setInviteTab('friends');
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
                setWorkspaceIdInput('');
                setSearchedUser(null);
                setInviteTab('friends');
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            {/* 탭 버튼 */}
            <TabContainer>
              <TabButton $active={inviteTab === 'friends'} onClick={() => setInviteTab('friends')}>
                친구 목록
              </TabButton>
              <TabButton $active={inviteTab === 'search'} onClick={() => setInviteTab('search')}>
                아이디로 검색
              </TabButton>
            </TabContainer>

            <ModalContent>
              {/* 친구 목록 탭 */}
              {inviteTab === 'friends' && (
                friends.length > 0 ? (
                  <>
                    {/* 검색 바 */}
                    <SearchBarWrapper>
                      <SearchInput
                        type="text"
                        placeholder="친구의 아이디나 닉네임으로 검색..."
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
                )
              )}

              {/* 아이디로 검색 탭 */}
              {inviteTab === 'search' && (
                <SearchByIdContainer>
                  <IdInputWrapper>
                    <IdInput
                      type="text"
                      placeholder="아이디 (6자리)"
                      value={workspaceIdInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        if (value.length <= 6) {
                          setWorkspaceIdInput(value);
                        }
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUserById()}
                      maxLength={6}
                    />
                    <SearchButton
                      onClick={handleSearchUserById}
                      disabled={searchingUser || workspaceIdInput.trim().length !== 6}
                    >
                      {searchingUser ? '검색 중...' : '검색'}
                    </SearchButton>
                  </IdInputWrapper>

                  {searchedUser && (
                    <UserCardContainer>
                      <MemberAvatar $color={getAvatarColor(searchedUser.id)}>
                        {(searchedUser.displayName || '익명').charAt(0).toUpperCase()}
                      </MemberAvatar>
                      <MemberInfo>
                        <MemberName>{searchedUser.displayName || '익명'}</MemberName>
                        <MemberStatus>@{searchedUser.workspaceCode?.replace('WS-', '')}</MemberStatus>
                      </MemberInfo>
                      <InviteButton
                        onClick={handleInviteSearchedUser}
                        disabled={loadingInvite}
                      >
                        {loadingInvite ? '초대 중...' : '초대'}
                      </InviteButton>
                    </UserCardContainer>
                  )}
                </SearchByIdContainer>
              )}
            </ModalContent>
            {inviteTab === 'friends' && (
              <ModalFooter>
                <CancelButton onClick={() => {
                  setShowInviteMembersModal(false);
                  setSelectedFriendsToInvite([]);
                  setSearchQueryInvite('');
                  setInviteTab('friends');
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
            )}
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 방장 위임 모달 */}
      {showTransferOwnerModal && (
        <ModalOverlay onClick={() => {
          setShowTransferOwnerModal(false);
          setSelectedMemberToTransfer(null);
          setLeaveAfterTransfer(false);
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
                setLeaveAfterTransfer(false);
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              {leaveAfterTransfer && (
                <WarningMessage>
                  💡 방장 위임 후 자동으로 채팅방을 나갑니다
                </WarningMessage>
              )}

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
                setLeaveAfterTransfer(false);
              }}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleTransferOwnership}
                disabled={loadingTransfer || !selectedMemberToTransfer}
              >
                {loadingTransfer ? '위임 중...' : leaveAfterTransfer ? '위임 후 나가기' : '위임하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 초대 코드 보기 모달 */}
      {showInviteCodeModal && (
        <ModalOverlay onClick={() => setShowInviteCodeModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <ModalHeader>
              <ModalTitle>
                <Mail size={24} />
                초대 코드
              </ModalTitle>
              <CloseButton onClick={() => setShowInviteCodeModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              <InviteCodeContainer>
                <InviteCodeLabel>단체방 초대 코드</InviteCodeLabel>
                <InviteCodeDisplay>
                  <InviteCodeText>{chat.inviteCode || 'INV-XXXXXX'}</InviteCodeText>
                </InviteCodeDisplay>
                <CopyButton onClick={handleCopyInviteCode}>
                  <Copy size={16} />
                  코드 복사
                </CopyButton>
              </InviteCodeContainer>
              <InviteCodeDescription>
                이 코드를 친구에게 공유하면 단체방에 참여할 수 있습니다.<br />
                친구는 채팅 탭에서 "초대 코드로 참여" 버튼을 눌러 코드를 입력하면 됩니다.
              </InviteCodeDescription>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 멤버 강퇴 확인 모달 */}
      {showRemoveMemberModal && memberToRemove && (
        <ModalOverlay onClick={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>멤버 강퇴</ModalTitle>
              <CloseButton onClick={() => {
                setShowRemoveMemberModal(false);
                setMemberToRemove(null);
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                <strong style={{ color: '#4a90e2' }}>{memberToRemove.name}</strong>님을<br />
                단체방에서 강퇴하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#ffa500'
                }}>
                  강퇴된 멤버는 초대 코드로 다시 참여할 수 있습니다.
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => {
                setShowRemoveMemberModal(false);
                setMemberToRemove(null);
              }}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmRemoveMember}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                강퇴하기
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 멤버 상세 정보 모달 */}
      {showMemberDetailModal && selectedMemberDetail && (
        <ModalOverlay onClick={() => {
          setShowMemberDetailModal(false);
          setSelectedMemberDetail(null);
        }}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>멤버 정보</ModalTitle>
              <CloseButton onClick={() => {
                setShowMemberDetailModal(false);
                setSelectedMemberDetail(null);
              }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* 대화명 */}
                <div>
                  <div style={{
                    fontSize: '13px',
                    color: '#999',
                    marginBottom: '8px'
                  }}>
                    대화명
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#e0e0e0',
                    fontWeight: '500'
                  }}>
                    {selectedMemberDetail.name}
                  </div>
                </div>

                {/* 셰어노트 ID */}
                <div>
                  <div style={{
                    fontSize: '13px',
                    color: '#999',
                    marginBottom: '8px'
                  }}>
                    셰어노트 ID
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(74, 144, 226, 0.1)',
                    border: '1px solid rgba(74, 144, 226, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      flex: 1,
                      fontSize: '16px',
                      color: '#4a90e2',
                      fontWeight: '600',
                      letterSpacing: '1px'
                    }}>
                      {selectedMemberDetail.workspaceId === '정보 없음' ? '정보 없음' : selectedMemberDetail.workspaceId.replace('WS-', '')}
                    </div>
                    {selectedMemberDetail.workspaceId !== '정보 없음' && (
                      <button
                        onClick={handleCopyWorkspaceId}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        복사
                      </button>
                    )}
                  </div>
                </div>

                {/* 안내 메시지 */}
                {selectedMemberDetail.workspaceId !== '정보 없음' && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(74, 144, 226, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#4a90e2',
                    lineHeight: '1.5',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{ flexShrink: 0 }}>💡</span>
                    <span>초대 코드를 공유하면 강퇴된 멤버도 다시 참여할 수 있습니다</span>
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              <ConfirmButton onClick={() => {
                setShowMemberDetailModal(false);
                setSelectedMemberDetail(null);
              }}>
                확인
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 단체방 삭제 확인 모달 */}
      {showDeleteGroupModal && (
        <ModalOverlay onClick={() => setShowDeleteGroupModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>단체방 삭제</ModalTitle>
              <CloseButton onClick={() => setShowDeleteGroupModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                정말로 <strong style={{ color: '#4a90e2' }}>"{chat.groupName}"</strong> 단체방을<br />
                삭제하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#e53e3e'
                }}>
                  ⚠️ 삭제하면 모든 대화 내용을 다시 볼 수 없습니다
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowDeleteGroupModal(false)}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmDeleteGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                삭제하기
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 단체방 삭제 최종 확인 모달 (2단계) */}
      {showDeleteGroupFinalModal && (
        <ModalOverlay onClick={() => setShowDeleteGroupFinalModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <ModalHeader>
              <ModalTitle>⚠️ 최종 확인</ModalTitle>
              <CloseButton onClick={() => setShowDeleteGroupFinalModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#e0e0e0'
              }}>
                <div style={{
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f56565'
                }}>
                  정말로 단체방을 삭제하시겠습니까?
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#4a90e2' }}>
                    📢 삭제 안내
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>현재 대화 중인 참여자에게 방 삭제 메시지가 전송됩니다</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>10초 카운트 후 방이 완전히 삭제됩니다</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>현재 방에 없는 참여자는 대화방 목록 접속 시 삭제 알림을 1회 확인할 수 있습니다</span>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: 'rgba(229, 62, 62, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#e53e3e',
                  textAlign: 'center'
                }}>
                  ⚠️ 삭제 후에는 모든 대화 내용을 복구할 수 없습니다
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowDeleteGroupFinalModal(false)}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleFinalConfirmDeleteGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                확인
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 🆕 방 공개 설정 변경 모달 (1단계: 선택) */}
      {showRoomTypeModal && (
        <ModalOverlay onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <ModalHeader>
              <ModalTitle>
                <Settings size={24} />
                방 공개 설정
              </ModalTitle>
              <CloseButton onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px', fontSize: '14px', color: '#aaa', lineHeight: '1.6' }}>
                현재: <strong style={{ color: '#4a90e2' }}>{chat.isPublic ? '🌐 공개방' : '🔒 비공개방'}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  onClick={() => setSelectedRoomType(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: (selectedRoomType === false) ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${(selectedRoomType === false) ? '#4a90e2' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${(selectedRoomType === false) ? '#4a90e2' : '#666'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {(selectedRoomType === false) && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#4a90e2'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e0e0e0', marginBottom: '6px' }}>
                      🔒 비공개방
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                      친구를 직접 초대해서 참여시킬 수 있습니다
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRoomType(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: (selectedRoomType === true) ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${(selectedRoomType === true) ? '#4a90e2' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${(selectedRoomType === true) ? '#4a90e2' : '#666'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {(selectedRoomType === true) && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#4a90e2'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e0e0e0', marginBottom: '6px' }}>
                      🌐 공개방
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
                      초대 코드를 공유하여 누구나 참여할 수 있습니다
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(74, 144, 226, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#4a90e2',
                lineHeight: '1.6'
              }}>
                <div style={{ marginBottom: '6px', paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                  💡 비공개방에서 공개방으로 변경하면 초대 코드가 자동 생성됩니다.
                </div>
                <div style={{ paddingLeft: '1.5em', textIndent: '-1.5em' }}>
                  💡 공개방에서 비공개방으로 변경하면 초대 코드가 비활성화됩니다.
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => { setShowRoomTypeModal(false); setSelectedRoomType(null); }}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleRoomTypeSelectConfirm}
                disabled={selectedRoomType === null}
              >
                확인
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 🆕 방 공개 설정 변경 최종 확인 모달 (2단계: 최종 확인) */}
      {showRoomTypeConfirmModal && (
        <ModalOverlay onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>
                <Settings size={24} />
                방 설정 변경 확인
              </ModalTitle>
              <CloseButton onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                방 설정을 <strong style={{ color: '#4a90e2' }}>
                  {selectedRoomType ? '🌐 공개방' : '🔒 비공개방'}
                </strong>으로 변경할까요?
              </div>
              {selectedRoomType && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#4a90e2',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  초대 코드가 자동으로 생성됩니다
                </div>
              )}
              {!selectedRoomType && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#4a90e2',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  초대 코드가 비활성화됩니다
                </div>
              )}
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => { setShowRoomTypeConfirmModal(false); setSelectedRoomType(null); }}>
                취소
              </CancelButton>
              <ConfirmButton onClick={handleFinalConfirmRoomTypeChange}>
                확인
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 방장 나가기 안내 모달 */}
      {showOwnerLeaveGuideModal && (
        <ModalOverlay onClick={() => setShowOwnerLeaveGuideModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>채팅방 나가기</ModalTitle>
              <CloseButton onClick={() => setShowOwnerLeaveGuideModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                방장은 다른 참여자에게 방장권한을 위임한 후<br />
                단체방에서 나갈 수 있습니다
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowOwnerLeaveGuideModal(false)}>
                취소
              </CancelButton>
              <ConfirmButton onClick={handleStartTransferForLeave}>
                위임하기
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 그룹 나가기 확인 모달 */}
      {showLeaveGroupModal && (
        <ModalOverlay onClick={() => setShowLeaveGroupModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>채팅방 나가기</ModalTitle>
              <CloseButton onClick={() => setShowLeaveGroupModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                정말로 <strong style={{ color: '#4a90e2' }}>"{chat.groupName}"</strong> 채팅방을<br />
                나가시겠습니까?
                {isLastMember ? (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(229, 62, 62, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#e53e3e',
                    lineHeight: '1.5'
                  }}>
                    ⚠️ 마지막 멤버가 나가면 이 방은 삭제되며<br />
                    모든 대화 내용을 다시 볼 수 없습니다
                  </div>
                ) : (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(255, 165, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ffa500'
                  }}>
                    나간 후에는 초대를 통해서만 다시 참여할 수 있습니다
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowLeaveGroupModal(false)}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmLeaveGroup}
                style={{
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.3)'
                }}
              >
                나가기
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 방장 위임 최종 확인 모달 */}
      {/* 부방장 임명 모달 */}
      {showAppointSubManagerModal && (
        <AppointSubManagerModal
          chat={chat}
          members={Object.values(chat.membersInfo || {}).map(memberInfo => ({
            userId: Object.keys(chat.membersInfo || {}).find(id => chat.membersInfo[id] === memberInfo),
            ...memberInfo
          }))}
          currentUserId={currentUserId}
          onClose={() => setShowAppointSubManagerModal(false)}
          onAppoint={handleAppointSubManager}
        />
      )}

      {showTransferConfirmModal && selectedMemberToTransfer && (
        <ModalOverlay onClick={() => setShowTransferConfirmModal(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <ModalHeader>
              <ModalTitle>방장 위임 확인</ModalTitle>
              <CloseButton onClick={() => setShowTransferConfirmModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalContent style={{ padding: '24px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#e0e0e0'
              }}>
                <strong style={{ color: '#4a90e2' }}>
                  {chat.membersInfo?.[selectedMemberToTransfer]?.displayName || '알 수 없음'}
                </strong>님에게<br />
                방장 권한을 위임하시겠습니까?
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 165, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#ffa500'
                }}>
                  위임하면 일반 참여자가 됩니다
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowTransferConfirmModal(false)}>
                취소
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmTransferOwnership}
                disabled={loadingTransfer}
              >
                {loadingTransfer ? '위임 중...' : '위임하기'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* 프로필 이미지 업로드용 숨겨진 input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />
    </FullScreenContainer>,
    document.body
  );
};

export default ChatRoom;
