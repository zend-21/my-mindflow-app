// 확인 알림 모달 (alert 대체용)
import React from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Modal = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.3s ease-out;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
`;

const Message = styled.p`
  margin: 0 0 24px 0;
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  background: ${props => props.$primary ? '#4a90e2' : '#444'};
  color: #fff;

  &:hover {
    background: ${props => props.$primary ? '#357abd' : '#555'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ConfirmAlertModal = ({ message, title = '알림', onConfirm, onClose }) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Portal>
      <Overlay onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <Title>{title}</Title>
          <Message>{message}</Message>
          <ButtonContainer>
            <Button $primary onClick={handleConfirm}>
              확인
            </Button>
          </ButtonContainer>
        </Modal>
      </Overlay>
    </Portal>
  );
};

export default ConfirmAlertModal;
