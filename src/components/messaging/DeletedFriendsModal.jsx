// src/components/messaging/DeletedFriendsModal.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, UserPlus, Trash2, Ban } from 'lucide-react';
import {
  getDeletedFriends,
  permanentlyDeleteFriend,
  blockUser,
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

const FriendItem = styled.div`
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
  background: ${props => props.$color || '#4A90E2'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const FriendMeta = styled.div`
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
  border: 1px solid ${props => props.$variant === 'danger' ? '#ff4444' : '#ddd'};
  background: ${props => props.$variant === 'danger' ? '#ff4444' : 'white'};
  color: ${props => props.$variant === 'danger' ? 'white' : '#666'};
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#ff3333' : '#f5f5f5'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const getAvatarColor = (userId) => {
  const colors = ['#4A90E2', '#E24A90', '#90E24A', '#E2904A', '#904AE2', '#4AE290'];
  const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const DeletedFriendsModal = ({ isOpen, onClose, showToast, onFriendAdded }) => {
  const [deletedFriends, setDeletedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDeletedFriends();
    }
  }, [isOpen]);

  const loadDeletedFriends = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('firebaseUserId');
      const friends = await getDeletedFriends(userId);
      setDeletedFriends(friends);
    } catch (error) {
      console.error('삭제된 친구 목록 조회 오류:', error);
      showToast?.('삭제된 친구 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friend) => {
    try {
      setActionLoading(friend.friendId);
      const userId = localStorage.getItem('firebaseUserId');

      const result = await addFriendInstantly(userId, friend.friendWorkspaceCode);

      if (result.success) {
        // 삭제된 친구 목록에서 제거
        await permanentlyDeleteFriend(userId, friend.friendId);
        showToast?.('✅ 친구가 다시 추가되었습니다');
        await loadDeletedFriends();
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

  const handlePermanentDelete = async (friend) => {
    if (!window.confirm(`${friend.friendName}님을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setActionLoading(friend.friendId);
      const userId = localStorage.getItem('firebaseUserId');

      const result = await permanentlyDeleteFriend(userId, friend.friendId);

      if (result.success) {
        showToast?.('✅ 영구 삭제되었습니다');
        await loadDeletedFriends();
      } else {
        showToast?.('❌ 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error);
      showToast?.('영구 삭제에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (friend) => {
    if (!window.confirm(`${friend.friendName}님을 차단하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(friend.friendId);
      const userId = localStorage.getItem('firebaseUserId');

      const result = await blockUser(userId, friend.friendId, {
        userName: friend.friendName,
        userEmail: friend.friendEmail,
        userWorkspaceCode: friend.friendWorkspaceCode,
      });

      if (result.success) {
        showToast?.('✅ 차단되었습니다');
        await loadDeletedFriends();
      } else {
        showToast?.('❌ 차단에 실패했습니다');
      }
    } catch (error) {
      console.error('차단 오류:', error);
      showToast?.('차단에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>친구삭제 목록</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <EmptyState>
              <EmptyText>로딩 중...</EmptyText>
            </EmptyState>
          ) : deletedFriends.length === 0 ? (
            <EmptyState>
              <EmptyIcon>👥</EmptyIcon>
              <EmptyText>삭제된 친구가 없습니다</EmptyText>
            </EmptyState>
          ) : (
            deletedFriends.map((friend) => (
              <FriendItem key={friend.friendId}>
                <Avatar $color={getAvatarColor(friend.friendId)}>
                  {friend.friendName?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <FriendInfo>
                  <FriendName>{friend.friendName}</FriendName>
                  <FriendMeta>WS {friend.friendWorkspaceCode}</FriendMeta>
                </FriendInfo>
                <ActionButtons>
                  <ActionButton
                    onClick={() => handleAddFriend(friend)}
                    disabled={actionLoading === friend.friendId}
                  >
                    <UserPlus size={14} />
                    친구추가
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => handlePermanentDelete(friend)}
                    disabled={actionLoading === friend.friendId}
                  >
                    <Trash2 size={14} />
                    영구삭제
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleBlock(friend)}
                    disabled={actionLoading === friend.friendId}
                  >
                    <Ban size={14} />
                    차단
                  </ActionButton>
                </ActionButtons>
              </FriendItem>
            ))
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default DeletedFriendsModal;
