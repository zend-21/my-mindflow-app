// src/components/messaging/BlockedUsersModal.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Copy, Shield } from 'lucide-react';
import {
  getBlockedUsers,
  unblockUser,
} from '../../services/userManagementService';
import ConfirmModal from '../ConfirmModal';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
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
  color: #888;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #ffffff;
  margin-bottom: 4px;
`;

const UserMeta = styled.div`
  font-size: 12px;
  color: #888;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.$variant === 'primary' ? '#4A90E2' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.$variant === 'primary' ? '#4A90E2' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#e0e0e0'};
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#3A80D2' : 'rgba(255, 255, 255, 0.15)'};
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

const BlockedUsersModal = ({ isOpen, onClose, showToast }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [unblockConfirm, setUnblockConfirm] = useState({ show: false, user: null });

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

  const handleUnblock = (user) => {
    setUnblockConfirm({ show: true, user });
  };

  const confirmUnblock = async () => {
    const user = unblockConfirm.user;
    setUnblockConfirm({ show: false, user: null });

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

  const handleCopyId = async (user) => {
    try {
      const idToCopy = user.userWorkspaceCode?.replace('WS-', '') || '';
      await navigator.clipboard.writeText(idToCopy);
      showToast?.('✅ ID가 복사되었습니다');
    } catch (error) {
      console.error('ID 복사 실패:', error);
      showToast?.('❌ 복사에 실패했습니다');
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
                  <UserMeta>{user.userWorkspaceCode?.replace('WS-', '') || ''}</UserMeta>
                </UserInfo>
                <ActionButtons>
                  <ActionButton
                    onClick={() => handleCopyId(user)}
                  >
                    <Copy size={14} />
                    ID복사
                  </ActionButton>
                  <ActionButton
                    $variant="primary"
                    onClick={() => handleUnblock(user)}
                    disabled={actionLoading === user.userId}
                  >
                    <Shield size={14} />
                    차단해제
                  </ActionButton>
                </ActionButtons>
              </UserItem>
            ))
          )}
        </ModalBody>
      </ModalContainer>

      {unblockConfirm.show && (
        <ConfirmModal
          icon="🔓"
          title="차단 해제"
          message={`${unblockConfirm.user?.userName}님의 차단을 해제하시겠습니까?\n친구로 추가할 예정이라면 ID를 반드시 복사하세요.`}
          confirmText="해제"
          cancelText="취소"
          onConfirm={confirmUnblock}
          onCancel={() => setUnblockConfirm({ show: false, user: null })}
        />
      )}
    </ModalOverlay>
  );
};

export default BlockedUsersModal;
