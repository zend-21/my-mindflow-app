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
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 12001;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: #2a2d35;
    border-radius: 16px;
    padding: 24px;
    min-width: 300px;
    max-width: 90%;
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;

const ModalMessage = styled.p`
    font-size: 16px;
    color: #e0e0e0;
    text-align: left;
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    &:active {
        transform: translateY(0px);
    }
`;

const CancelButton = styled(ModalButton)`
    background-color: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
        background-color: #3d4250;
    }
`;

const ConfirmButton = styled(ModalButton)`
    background-color: #f5576c;
    color: white;

    &:hover {
        background-color: #e04757;
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

    // \n을 실제 줄바꿈으로 변환
    const messageLines = message.split('\n');

    return (
      <Portal>
        <Overlay onClick={handleCancelClick}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalMessage>
                    {messageLines.map((line, index) => (
                        <React.Fragment key={index}>
                            {line.startsWith('(') ? (
                                <span style={{ color: '#d4a373' }}>{line}</span>
                            ) : (
                                line
                            )}
                            {index < messageLines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </ModalMessage>
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