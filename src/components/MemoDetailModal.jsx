// src/components/MemoDetailModal.jsx

import React, { useState, useEffect } from 'react';
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
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
    position: relative;
    max-height: 80vh;
`;

const HistoryButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    gap: 5px;
    margin-bottom: 15px;
`;

const HistoryButton = styled.button`
    background: #e2e8f0;
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ModalTextarea = styled.textarea`
    flex: 1;
    width: 100%;
    min-height: 150px;
    background: transparent;
    border: none;
    resize: none;
    font-size: 16px;
    color: #4a5568;
    line-height: 1.6;
    outline: none;
    padding: 0;
    margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

const ModalButton = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
`;

const SaveButton = styled(ModalButton)`
    background-color: #4a90e2;
    color: #fff;
    &:hover {
        background-color: #3b78c4;
    }
    &:disabled {
        background-color: #a0aec0;
        cursor: not-allowed;
    }
`;

const CancelButton = styled(ModalButton)`
    background-color: #e2e8f0;
    color: #4a5568;
    &:hover {
        background-color: #d2d6db;
    }
`;

const DateText = styled.span`
    font-size: 12px;
    color: #a0aec0;
    margin-top: 10px;
    text-align: right;
`;

const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 16px;
    color: #e53e3e;
`;

const ImportantRadioButton = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid ${props => props.isImportant ? '#e53e3e' : '#a0aec0'};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 8px;
    transition: border-color 0.2s ease;
`;

const RadioInnerCircle = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => props.isImportant ? '#e53e3e' : 'transparent'};
    transition: background-color 0.2s ease;
`;

const RightButtonWrapper = styled.div`
    display: flex;
    gap: 8px;
`;

const MemoDetailModal = ({ isOpen, memo, onSave, onCancel }) => {
    const [editedContent, setEditedContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);

    useEffect(() => {
        if (memo) {
            setEditedContent(memo.content);
            setIsImportant(memo.isImportant);
            const initialHistory = [memo.content];
            setHistory(initialHistory);
            setHistoryIndex(0);
        }
    }, [memo]);
    
    if (!isOpen || !memo) {
        return null;
    }

    const isContentChanged = editedContent.trim() !== memo.content.trim();
    const isImportantChanged = isImportant !== memo.isImportant;

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setEditedContent(newContent);
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleSaveClick = () => {
        if (window.confirm("변경된 내용으로 수정하시겠습니까?")) {
            onSave(memo.id, editedContent, isImportant);
        }
    };
    
    const handleCancelClick = () => {
        // 변경사항이 있을 경우에만 경고창을 띄웁니다.
        // 기존의 isContentChanged 대신, editedContent와 원본 memo.content를 직접 비교합니다.
        if (editedContent !== memo.content || isImportant !== memo.isImportant) {
            if (window.confirm("변경사항을 저장하지 않고 닫으시겠습니까?")) {
                onCancel();
            }
        } else {
            // 변경사항이 없으면 바로 닫습니다.
            onCancel();
        }
    };

    const handleImportantToggle = () => {
        setIsImportant(prev => !prev);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setEditedContent(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    };

    return (
        <Overlay onClick={handleCancelClick}>
            <ModalContent onClick={e => e.stopPropagation()} isImportant={isImportant}>
                <HistoryButtonContainer>
                    <HistoryButton onClick={handleUndo} disabled={historyIndex === 0}>
                        ↶ 되돌리기
                    </HistoryButton>
                    <HistoryButton onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                        다시 실행 ↷
                    </HistoryButton>
                </HistoryButtonContainer>
                <ModalTextarea
                    value={editedContent}
                    onChange={handleContentChange}
                />
                <ButtonContainer>
                    <ImportantCheckWrapper onClick={handleImportantToggle}>
                        <ImportantRadioButton isImportant={isImportant}>
                            <RadioInnerCircle isImportant={isImportant} />
                        </ImportantRadioButton>
                        중요
                    </ImportantCheckWrapper>
                    <RightButtonWrapper>
                        <CancelButton onClick={handleCancelClick}>취소</CancelButton>
                        <SaveButton onClick={handleSaveClick} disabled={editedContent === memo.content && isImportant === memo.isImportant}>수정</SaveButton>
                    </RightButtonWrapper>
                </ButtonContainer>
                <DateText>
                    {memo.displayDate}에 저장됨
                </DateText>
            </ModalContent>
        </Overlay>
    );
};

export default MemoDetailModal;