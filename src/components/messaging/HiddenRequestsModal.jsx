// src/components/messaging/HiddenRequestsModal.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Eye, Trash2 } from 'lucide-react';
import {
  getHiddenFriendRequests,
  unhideRequest,
  permanentlyDeleteRequest,
} from '../../services/friendService';
import UserAvatar from '../common/UserAvatar';

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

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const RequestInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RequestName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
`;

const RequestId = styled.div`
  font-size: 12px;
  color: #999;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: ${props => props.$danger ? '#ff4757' : '#667eea'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenRequestsModal = ({ isOpen, onClose, showToast, onRequestsUpdated }) => {
  const [hiddenRequests, setHiddenRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHiddenRequests();
    }
  }, [isOpen]);

  const loadHiddenRequests = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) return;

      const result = await getHiddenFriendRequests(userId);
      if (result.success) {
        setHiddenRequests(result.requests || []);
      }
    } catch (error) {
      console.error('숨긴 요청 목록 로드 실패:', error);
      showToast?.('숨긴 요청 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleUnhide = async (request) => {
    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await unhideRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.(`${request.requesterName}님의 요청을 복구했습니다`);
        await loadHiddenRequests();
        onRequestsUpdated?.();
      } else {
        showToast?.('요청 복구에 실패했습니다');
      }
    } catch (error) {
      console.error('요청 복구 실패:', error);
      showToast?.('요청 복구에 실패했습니다');
    }
  };

  const handlePermanentDelete = async (request) => {
    if (!window.confirm(`${request.requesterName}님의 요청을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const userId = localStorage.getItem('firebaseUserId');
      const result = await permanentlyDeleteRequest(userId, request.requesterId);

      if (result.success) {
        showToast?.(`${request.requesterName}님의 요청을 영구 삭제했습니다`);
        await loadHiddenRequests();
      } else {
        showToast?.('영구 삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('영구 삭제 실패:', error);
      showToast?.('영구 삭제에 실패했습니다');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>친구 거절 목록</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <EmptyState>
              <EmptyText>로딩 중...</EmptyText>
            </EmptyState>
          ) : hiddenRequests.length === 0 ? (
            <EmptyState>
              <EmptyIcon>👻</EmptyIcon>
              <EmptyText>거절한 친구 요청이 없습니다</EmptyText>
            </EmptyState>
          ) : (
            hiddenRequests.map((request) => (
              <RequestItem key={request.id}>
                <UserAvatar
                  userId={request.requesterId}
                  fallbackText={request.requesterName || '?'}
                  size="40px"
                  fontSize="16px"
                />
                <RequestInfo>
                  <RequestName>{request.requesterName || '익명'}</RequestName>
                  <RequestId>{request.requesterWorkspaceCode?.replace('WS-', '') || '-'}</RequestId>
                </RequestInfo>
                <ActionButtons>
                  <ActionButton onClick={() => handleUnhide(request)}>
                    <Eye size={14} />
                    복구
                  </ActionButton>
                  <ActionButton $danger onClick={() => handlePermanentDelete(request)}>
                    <Trash2 size={14} />
                    삭제
                  </ActionButton>
                </ActionButtons>
              </RequestItem>
            ))
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default HiddenRequestsModal;
