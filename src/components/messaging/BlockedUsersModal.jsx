// src/components/messaging/BlockedUsersModal.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, UserPlus, Shield } from 'lucide-react';
import {
  getBlockedUsers,
  unblockUser,
} from '../../services/userManagementService';
import { addFriendInstantly } from '../../services/friendService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #999;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #999;
  margin: 0;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || '#999'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0.7;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
`;

const UserMeta = styled.div`
  font-size: 12px;
  color: #999;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.$variant === 'primary' ? '#4A90E2' : '#ddd'};
  background: ${props => props.$variant === 'primary' ? '#4A90E2' : 'white'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#666'};
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#3A80D2' : '#f5f5f5'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const getAvatarColor = (userId) => {
  const colors = ['#999', '#888', '#777', '#666', '#555', '#444'];
  const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const BlockedUsersModal = ({ isOpen, onClose, showToast, onFriendAdded }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadBlockedUsers();
    }
  }, [isOpen]);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('firebaseUserId');
      const users = await getBlockedUsers(userId);
      setBlockedUsers(users);
    } catch (error) {
      console.error('차단된 사용자 목록 조회 오류:', error);
      showToast?.('차단된 사용자 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (user) => {
    if (!window.confirm(`${user.userName}님의 차단을 해제하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(user.userId);
      const myUserId = localStorage.getItem('firebaseUserId');

      const result = await unblockUser(myUserId, user.userId);

      if (result.success) {
        showToast?.('✅ 차단이 해제되었습니다');
        await loadBlockedUsers();
      } else {
        showToast?.('❌ 차단 해제에 실패했습니다');
      }
    } catch (error) {
      console.error('차단 해제 오류:', error);
      showToast?.('차단 해제에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddFriend = async (user) => {
    try {
      setActionLoading(user.userId);
      const myUserId = localStorage.getItem('firebaseUserId');

      const result = await addFriendInstantly(myUserId, user.userWorkspaceCode);

      if (result.success) {
        // 차단도 자동으로 해제
        await unblockUser(myUserId, user.userId);
        showToast?.('✅ 친구가 추가되고 차단이 해제되었습니다');
        await loadBlockedUsers();
        onFriendAdded?.();
      } else {
        showToast?.(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('친구 추가 오류:', error);
      showToast?.('친구 추가에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>차단 목록</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <EmptyState>
              <EmptyText>로딩 중...</EmptyText>
            </EmptyState>
          ) : blockedUsers.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🚫</EmptyIcon>
              <EmptyText>차단된 사용자가 없습니다</EmptyText>
            </EmptyState>
          ) : (
            blockedUsers.map((user) => (
              <UserItem key={user.userId}>
                <Avatar $color={getAvatarColor(user.userId)}>
                  {user.userName?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <UserInfo>
                  <UserName>{user.userName}</UserName>
                  <UserMeta>WS {user.userWorkspaceCode}</UserMeta>
                </UserInfo>
                <ActionButtons>
                  <ActionButton
                    $variant="primary"
                    onClick={() => handleUnblock(user)}
                    disabled={actionLoading === user.userId}
                  >
                    <Shield size={14} />
                    차단해제
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleAddFriend(user)}
                    disabled={actionLoading === user.userId}
                  >
                    <UserPlus size={14} />
                    친구추가
                  </ActionButton>
                </ActionButtons>
              </UserItem>
            ))
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default BlockedUsersModal;
