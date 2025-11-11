// src/modules/calendar/alarm/components/ConfirmationModals.jsx
// 확인 모달 컴포넌트들

import React from 'react';
import styled from 'styled-components';
import Portal from '../../../../components/Portal';
import { ALARM_COLORS } from '../';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
`;

const ModalMessage = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
  white-space: pre-line;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' && `
    background: ${ALARM_COLORS.primary};
    color: white;

    &:hover {
      background: #0056b3;
    }
  `}

  ${props => props.$variant === 'danger' && `
    background: ${ALARM_COLORS.danger};
    color: white;

    &:hover {
      background: #c82333;
    }
  `}

  ${props => props.$variant === 'secondary' && `
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  `}
`;

// 검증 모달
export const ValidationModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <ModalOverlay onClick={onClose}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <ModalTitle>알림</ModalTitle>
          <ModalMessage>{message}</ModalMessage>
          <ModalButtons>
            <Button $variant="primary" onClick={onClose}>
              확인
            </Button>
          </ModalButtons>
        </ModalBox>
      </ModalOverlay>
    </Portal>
  );
};

// 삭제 확인 모달
export const DeleteConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <ModalOverlay onClick={onCancel}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <ModalTitle>알람 삭제 확인</ModalTitle>
          <ModalMessage>{message}</ModalMessage>
          <ModalButtons>
            <Button $variant="secondary" onClick={onCancel}>
              취소
            </Button>
            <Button $variant="danger" onClick={onConfirm}>
              삭제
            </Button>
          </ModalButtons>
        </ModalBox>
      </ModalOverlay>
    </Portal>
  );
};

// 수정 저장 확인 모달
export const EditSaveConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <ModalOverlay onClick={onCancel}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <ModalTitle>변경 사항 저장</ModalTitle>
          <ModalMessage>
            알람 수정 내용을 저장하시겠습니까?
          </ModalMessage>
          <ModalButtons>
            <Button $variant="secondary" onClick={onCancel}>
              취소
            </Button>
            <Button $variant="primary" onClick={onConfirm}>
              저장
            </Button>
          </ModalButtons>
        </ModalBox>
      </ModalOverlay>
    </Portal>
  );
};

// 수정 전 확인 모달 (알람 유형에 따라 다른 메시지)
export const EditConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <ModalOverlay onClick={onCancel}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <ModalTitle>알람 수정</ModalTitle>
          <ModalMessage>{message}</ModalMessage>
          <ModalButtons>
            <Button $variant="secondary" onClick={onCancel}>
              취소
            </Button>
            <Button $variant="primary" onClick={onConfirm}>
              확인
            </Button>
          </ModalButtons>
        </ModalBox>
      </ModalOverlay>
    </Portal>
  );
};
