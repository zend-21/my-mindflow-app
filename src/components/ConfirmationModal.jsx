// src/components/ConfirmationModal.jsx

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
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 12001;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 16px;
    padding: 24px;
    min-width: 300px;
    max-width: 90%;
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const ModalMessage = styled.p`
    font-size: 16px;
    color: #333;
    text-align: center;
    margin-bottom: 24px;
    line-height: 1.5;
    word-break: keep-all;
`;

const ButtonContainer = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
`;

const ModalButton = styled.button`
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-width: 80px;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
        transform: translateY(0px);
    }
`;

const CancelButton = styled(ModalButton)`
    background-color: #e2e8f0;
    color: #4a5568;
    
    &:hover {
        background-color: #cbd5e0;
    }
`;

const ConfirmButton = styled(ModalButton)`
    background-color: #e53e3e;
    color: white;
    
    &:hover {
        background-color: #c53030;
    }
`;

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel, confirmText = '삭제' }) => {
    console.log('ConfirmationModal rendered:', { isOpen, message });

    if (!isOpen) return null;

    const handleConfirmClick = () => {
        console.log('Confirm button clicked');
        onConfirm();
    };

    const handleCancelClick = () => {
        console.log('Cancel button clicked');
        onCancel();
    };

    return (
      <Portal>
        <Overlay onClick={handleCancelClick}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalMessage>{message}</ModalMessage>
                <ButtonContainer>
                    <CancelButton onClick={handleCancelClick}>취소</CancelButton>
                    <ConfirmButton onClick={handleConfirmClick}>{confirmText}</ConfirmButton>
                </ButtonContainer>
            </ModalContent>
        </Overlay>
      </Portal>
    );
};

export default ConfirmationModal;