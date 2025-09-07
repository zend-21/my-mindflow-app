// src/components/ConfirmationModal.jsx

import React from 'react';
import styled, { keyframes } from 'styled-components';

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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
    animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    margin: 20px;
    width: 100%;
    max-width: 350px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.3s ease-out;
`;

const ModalMessage = styled.p`
    font-size: 16px;
    color: #4a5568;
    text-align: center;
    margin-bottom: 24px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 12px;
`;

const ModalButton = styled.button`
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
`;

const CancelButton = styled(ModalButton)`
    background-color: #e2e8f0;
    color: #4a5568;
    &:hover {
        background-color: #d2d6db;
    }
`;

const ConfirmButton = styled(ModalButton)`
    background-color: #e53e3e;
    color: #fff;
    &:hover {
        background-color: #c53030;
    }
`;

const ConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <Overlay onClick={onCancel}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalMessage>정말 이 메모를 삭제하시겠습니까?</ModalMessage>
                <ButtonContainer>
                    <CancelButton onClick={onCancel}>취소</CancelButton>
                    <ConfirmButton onClick={onConfirm}>삭제</ConfirmButton>
                </ButtonContainer>
            </ModalContent>
        </Overlay>
    );
};

export default ConfirmationModal;