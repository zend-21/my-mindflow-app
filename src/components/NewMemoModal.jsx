// src/components/NewMemoModal.jsx

import React, { useState } from 'react';
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
    z-index: 4000;
    animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
    background: ${props => props.isImportant ? 'rgba(255, 210, 210, 1)' : '#fff8e1'};
    border-radius: 16px;
    padding: 24px;
    margin: 20px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.3s ease-out;
    transition: background-color 0.3s ease;
`;

const ModalTextarea = styled.textarea`
    width: 100%;
    height: 300px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 18px;
    resize: none;
    line-height: 1.5;
    background-color: transparent;
    white-space: pre-wrap;
    &:focus {
        outline: none;
        border-color: #4a90e2;
    }
    &::placeholder {
        color: #a0aec0;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
`;

const RightButtonWrapper = styled.div`
    display: flex;
    gap: 12px;
`;

const ModalButton = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
    &:disabled {
        background-color: #d2d6db;
        color: #888;
        cursor: not-allowed;
    }
`;

const SaveButton = styled(ModalButton)`
    background-color: #4a90e2;
    color: #fff;
    &:hover:not(:disabled) {
        background-color: #3b78c4;
    }
`;

const CancelButton = styled(ModalButton)`
    background-color: #e2e8f0;
    color: #4a5568;
    &:hover:not(:disabled) {
        background-color: #d2d6db;
    }
`;

const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 16px;
    color: #4a5568;
    gap: 8px;
    font-weight: 500;
`;

const ImportantRadioButton = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #cbd5e0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    ${props => props.isImportant && `
        background-color: #e53e3e;
        border-color: #e53e3e;
        box-shadow: 0 4px 8px rgba(229, 62, 62, 0.2);
    `}
`;

const RadioInnerCircle = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: white;
    opacity: ${props => props.isImportant ? 1 : 0};
    transition: opacity 0.2s ease;
`;

const NewMemoModal = ({ isOpen, onSave, onCancel }) => {
    const [newMemoContent, setNewMemoContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);

    const handleSave = () => {
        if (!newMemoContent.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }
        onSave(newMemoContent, isImportant);
        setNewMemoContent('');
        setIsImportant(false); // 저장 후 상태 초기화
        onCancel();
    };

    if (!isOpen) {
        return null;
    }
    
    const handleImportantToggle = () => {
        setIsImportant(!isImportant);
    };

    return (
        <Overlay onClick={onCancel}>
            <ModalContent onClick={e => e.stopPropagation()} isImportant={isImportant}>
                <ModalTextarea
                    placeholder="떠오르는 아이디어를 잡아보세요..."
                    value={newMemoContent}
                    onChange={(e) => setNewMemoContent(e.target.value)}
                    autoFocus
                />
                <ButtonContainer>
                    <ImportantCheckWrapper onClick={handleImportantToggle}>
                        <ImportantRadioButton isImportant={isImportant}>
                            <RadioInnerCircle isImportant={isImportant} />
                        </ImportantRadioButton>
                        중요
                    </ImportantCheckWrapper>
                    <RightButtonWrapper>
                        <CancelButton onClick={onCancel}>취소</CancelButton>
                        <SaveButton onClick={handleSave} disabled={!newMemoContent.trim()}>저장</SaveButton>
                    </RightButtonWrapper>
                </ButtonContainer>
            </ModalContent>
        </Overlay>
    );
};

export default NewMemoModal;