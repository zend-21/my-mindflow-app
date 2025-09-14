// src/components/MemoDetailModal.jsx

import React, { useState, useEffect, Fragment, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';

/* --- (1) 기존 스타일 및 애니메이션 (모두 동일) --- */
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
    align-items: flex-start;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
    background: ${props => props.$isImportant ? '#ffe6e6' : '#fff8e1'};
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
    position: relative;
    width: 95vw;
    height: 97vh;
    max-width: 800px;    
    
    /* 가로 모드일 때 padding-bottom을 줄여 공간 확보 */
    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    /* ✅ PC 화면일 때 (768px 이상) */
    @media (min-width: 768px) {
        max-width: 420px;   /* PC에서 폭 제한 */
        min-height: 70vh;   /* PC에서 조금 더 여유 */
        border-radius: 20px; /* PC에선 더 부드럽게 */
    }

    /* ✅ 큰 데스크탑 화면일 때 */
    @media (min-width: 1200px) {
        max-width: 480px;
    }

    /* ✅ 아주 큰 데스크탑 화면일 때 */
    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

// ★★★ 수정: justify-content를 space-between으로 변경 ★★★
const HistoryButtonContainer = styled.div`
    position: relative;
    display: flex;
    /* 변경: 중앙 정렬로 고정 */
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 5px;
    margin-bottom: 15px;
`;

// ★★★ 추가: 중앙 버튼을 감싸는 컨테이너 ★★★
const CenterButtonWrapper = styled.div`
    display: flex;
    gap: 5px;
    justify-content: center;
    flex-grow: 1;
`;

const HistoryButton = styled.button`
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 6px;

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(150, 160, 170, 0.7);
  }
`;

// ★★★ 추가: 키보드 숨김 버튼 스타일 ★★★
const HideKeyboardButton = styled.button`
  right: 0;
  background: #efefef;
  color: #333;
  border: 0.5px solid #949494ff;
  border-radius: 8px;
  padding: 8px 13px;      /* 🔼 버튼 크기 키움 */
  font-size: 13px;        /* 🔼 글씨 크게 */
  cursor: pointer;

  /* ▼▼▼ 추가된 포커스 스타일 ▼▼▼ */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(150, 160, 170, 0.6);
  }
`;

const ModalTextarea = styled.textarea`
    flex: 1;
    width: 100%;
    
    min-height: 200px;
    
    padding: 16px;
    border: 1px solid #a1b4ceff;
    border-radius: 8px;
    background-color: transparent;
    resize: none;
    font-size: 16px;
    color: #4a5568;
    line-height: 1.6;
    outline: none;
    &:focus {
        outline: none;
        border-color: #4a90e2;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-shrink: 0;
`;

const ModalButton = styled.button`
    padding: 8px 15px;
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
    flex-shrink: 0;
`;

const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 16px;
    color: #e53e3e;
    flex-shrink: 0;
`;

const ImportantRadioButton = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid ${props => props.$isImportant ? '#e53e3e' : '#a0aec0'};
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
    background-color: ${props => props.$isImportant ? '#e53e3e' : 'transparent'};
    transition: background-color 0.2s ease;
`;

const RightButtonWrapper = styled.div`
    display: flex;
    gap: 8px;
`;

// 1. 상단 30-40-30 그리드 컨테이너
const TopGridContainer = styled.div`
    display: grid;
    /* 좌측 30%, 중앙 40%, 우측 30% 비율 */
    grid-template-columns: 2.5fr 5fr 2.5fr;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 15px; /* 아래 줄과의 간격 */
`;

// 2. 그리드 각 영역의 정렬을 위한 컨테이너
const GridArea = styled.div`
    display: flex;
    align-items: center;
`;

const GridAreaLeft = styled(GridArea)`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 2px;     /* 버튼 간격 최소화 */
    overflow: hidden; /* 혹시 넘치면 잘리게 */
`;

const GridAreaCenter = styled(GridArea)`
    display: flex;
    justify-content: center;
    gap: 10px;
`;

const GridAreaRight = styled(GridArea)`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    overflow: hidden;   /* 셀 영역을 벗어나지 않도록 */
`;

// 3. '중요'와 '저장 기록'을 담는 두 번째 줄 컨테이너
const SecondRowContainer = styled.div`
    display: flex;
    justify-content: space-between; /* 양쪽 끝으로 정렬 */
    align-items: center;
    width: 100%;
    margin-bottom: 20px; /* 텍스트 입력창과의 간격 */
`;

/* --- (2) 커스텀 확인 모달 스타일 (기존과 동일) --- */
const ConfirmOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 11000;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ConfirmModalBox = styled.div`
    background: #ffffff;
    border-radius: 12px;
    padding: 24px 30px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
    animation: ${slideUp} 0.2s cubic-bezier(0.2, 0, 0, 1);
    width: 90vw;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ConfirmMessage = styled.p`
    font-size: 16px;
    color: #333;
    margin: 0;
    line-height: 1.5;
    text-align: center;
    word-break: keep-all;
`;

const ConfirmButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    & > ${ModalButton} {
        flex: 1;
    }
`;

/* --- (3) 수정 완료 토스트 스타일 추가 --- */
const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
  background: rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;
/* --- 스타일 추가 완료 --- */


const MemoDetailModal = ({ isOpen, memo, onSave, onDelete, onClose, onCancel }) => {
    const [editedContent, setEditedContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    // ★★★ 추가: 키보드 활성화 상태를 관리하는 state ★★★
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });

    const [toastMessage, setToastMessage] = useState(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isOpen && memo) {
            setEditedContent(memo.content);
            setIsImportant(memo.isImportant);
            const initialHistory = [memo.content];
            setHistory(initialHistory);
            setHistoryIndex(0);
            
            closeConfirmModal();
            setToastMessage(null);
            
            if (textareaRef.current) {
                textareaRef.current.blur();
            }
            // ★★★ 추가: 모달이 닫힐 때 키보드 상태를 초기화 ★★★
            setIsKeyboardActive(false);
        }
    }, [isOpen, memo]);
    
    if (!isOpen || !memo) {
        return null;
    }

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setEditedContent(newContent);
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleDoubleClick = () => {
    if (isPristine) {
        handleCancelClick(); // 변경 없으면 닫기
    } else {
        handleSaveClick();   // 변경 있으면 저장
    }
    };   

    const executeSaveAndShowToast = () => {
        onSave(memo.id, editedContent, isImportant);
        setToastMessage("메모를 수정했습니다.");
        setTimeout(() => {
            setToastMessage(null);
            onCancel();
        }, 1000);
    };

    const handleSaveClick = () => {
        setConfirmModalState({
            isOpen: true,
            message: "변경된 내용으로 수정하시겠습니까?",
            onConfirm: executeSaveAndShowToast,
        });
    };
    
    const isPristine = editedContent === memo.content && isImportant === memo.isImportant;

    const handleCancelClick = () => {
        if (!isPristine) {
            setConfirmModalState({
                isOpen: true,
                message: "변경사항을 저장하지 않고 닫으시겠습니까?",
                onConfirm: () => onCancel(),
            });
        } else {
            onCancel();
        }
    };
    
    const closeConfirmModal = () => {
        setConfirmModalState({
            isOpen: false,
            message: '',
            onConfirm: () => {},
        });
    };
    const handleConfirmAction = () => {
        confirmModalState.onConfirm();
        closeConfirmModal();
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

    // ★★★ onFocus와 onBlur 이벤트 핸들러 추가 ★★★
    const handleTextareaFocus = () => {
        setIsKeyboardActive(true);
        if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
    };

    const handleTextareaBlur = () => {
        setIsKeyboardActive(false);
    };

    // ★★★ 추가: 키보드 숨김 버튼 클릭 핸들러 ★★★
    const handleHideKeyboardClick = () => {
        if (textareaRef.current) {
            textareaRef.current.blur();
        }
    };

    return (
      <Portal>
        <Fragment>
            <Overlay onClick={handleCancelClick}>
                <ModalContent onClick={e => e.stopPropagation()} $isImportant={isImportant}>
                    
                    {/* 1. 새로운 상단 그리드 */}
                    <TopGridContainer>
                        {/* 좌측: 되돌리기/다시실행 */}
                        <GridAreaLeft>
                            <HistoryButton onClick={handleUndo} disabled={historyIndex === 0}>
                                <span className="material-icons">undo</span>
                            </HistoryButton>
                            <HistoryButton onClick={handleRedo} disabled={historyIndex === history.length - 1}>
                                <span className="material-icons">redo</span>
                            </HistoryButton>
                        </GridAreaLeft>

                        {/* 중앙: 취소/수정 버튼 */}
                        <GridAreaCenter>
                            <CancelButton onClick={handleCancelClick}>
                                {isPristine ? '닫기' : '취소'}
                            </CancelButton>
                            <SaveButton onClick={handleSaveClick} disabled={isPristine}>
                                수정
                            </SaveButton>
                        </GridAreaCenter>
                        
                        {/* 우측: 자판 숨김 버튼 */}
                        <GridAreaRight>
                            {isKeyboardActive && (
                                <HideKeyboardButton onClick={handleHideKeyboardClick}>
                                    자판 숨김
                                </HideKeyboardButton>
                            )}
                        </GridAreaRight>
                    </TopGridContainer>

                    {/* 2. 새로운 두 번째 줄 */}
                    <SecondRowContainer>
                        {/* 좌측: 중요 체크박스 */}
                        <ImportantCheckWrapper onClick={handleImportantToggle}>
                            <ImportantRadioButton $isImportant={isImportant}>
                                <RadioInnerCircle $isImportant={isImportant} />
                            </ImportantRadioButton>
                            중요
                        </ImportantCheckWrapper>

                        {/* 우측: 저장 기록 */}
                        <DateText>
                            {memo.displayDate}에 저장됨
                        </DateText>
                    </SecondRowContainer>

                    <ModalTextarea
                        ref={textareaRef}
                        value={editedContent}
                        onChange={handleContentChange}
                        onFocus={handleTextareaFocus}
                        onBlur={handleTextareaBlur}
                        onDoubleClick={handleDoubleClick} 
                    />
                </ModalContent>
            </Overlay>

            {confirmModalState.isOpen && (
                <ConfirmOverlay>
                    <ConfirmModalBox onClick={e => e.stopPropagation()}>
                        <ConfirmMessage>
                            {confirmModalState.message}
                        </ConfirmMessage>
                        <ConfirmButtonWrapper>
                            <CancelButton onClick={closeConfirmModal}>아니요</CancelButton>
                            <SaveButton onClick={handleConfirmAction}>예</SaveButton>
                        </ConfirmButtonWrapper>
                    </ConfirmModalBox>
                </ConfirmOverlay>
            )}

            {toastMessage && (
                <ToastOverlay>
                    <ToastBox>
                        {toastMessage}
                    </ToastBox>
                </ToastOverlay>
            )}
        </Fragment>
      </Portal>
    );
};

export default MemoDetailModal;