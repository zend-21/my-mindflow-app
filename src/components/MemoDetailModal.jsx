// src/components/MemoDetailModal.jsx

import React, { useState, useEffect, Fragment, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';
import RoomSettingsModal from './collaboration/RoomSettingsModal';
import CollaborationRoom from './collaboration/CollaborationRoom';
import { createCollaborationRoom } from '../services/collaborationRoomService';

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
    background: ${props => props.$isImportant ? 'linear-gradient(135deg, #3d2a2e, #4a2d32)' : 'linear-gradient(135deg, #2a2d35, #333842)'};
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
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
  color: #e0e0e0; /* 흰색으로 변경하여 잘 보이도록 */

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
  background: #333842;
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;      /* 패딩 축소 */
  font-size: 12px;        /* 글씨 크기 축소 */
  cursor: pointer;
  white-space: nowrap;    /* 텍스트 줄바꿈 방지 */
  min-width: fit-content; /* 내용에 맞게 크기 조정 */
  display: flex;
  align-items: center;
  gap: 4px;

  /* Material Icons 아이콘 크기 조정 */
  .material-icons {
    font-size: 16px;
  }

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
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background-color: #333842;
    resize: none;
    font-size: 16px;
    color: #e0e0e0;
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
    padding: 10px 20px;     /* 원래 크기로 복원 */
    border: none;
    border-radius: 8px;     /* 원래 둥근 모서리로 복원 */
    font-size: 16px;        /* 원래 글씨 크기로 복원 */
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;    /* 줄바꿈 방지 */
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
    background-color: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    &:hover {
        background-color: #3d424d;
    }
`;

const DateText = styled.div`
    font-size: 10px;        /* 글씨 크기 더 축소 */
    color: #b0b0b0;
    width: 100%;
    text-align: left;       /* 좌측 정렬 */
    line-height: 1.4;
    margin-bottom: 12px;    /* 텍스트 입력창과의 간격 */
`;

const ImportantCheckWrapper = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    font-size: 14px;        /* 글씨 크기 축소 */
    color: #e0e0e0;
    flex-shrink: 0;
    white-space: nowrap;    /* 줄바꿈 방지 */
`;

const ImportantRadioButton = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid ${props => props.$isImportant ? '#e53e3e' : 'rgba(255, 255, 255, 0.3)'};
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
    /* 좌측 25%, 중앙 50%, 우측 25% 비율 */
    grid-template-columns: 2.5fr 5fr 2.5fr;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-bottom: 15px; /* 아래 줄과의 간격 */
`;

// 2. 그리드 각 영역의 정렬을 위한 컨테이너
const GridArea = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;  /* 버튼 사이 간격 */
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
    align-items: center;
    gap: 8px;
`;

const GridAreaRight = styled(GridArea)`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    overflow: hidden;   /* 셀 영역을 벗어나지 않도록 */
`;

// 3. '중요'와 '공유'를 담는 두 번째 줄 컨테이너
const SecondRowContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between; /* 양쪽 끝 정렬 */
    width: 100%;
    margin-bottom: 12px; /* 간격 축소 */
`;

// 공유 버튼 스타일
const ShareButton = styled.button`
    background: rgba(94, 190, 38, 0.2);
    border: 1px solid rgba(94, 190, 38, 0.5);
    border-radius: 8px;
    padding: 8px 14px;      /* 패딩 증가 */
    color: #5ebe26;
    font-size: 14px;        /* 글씨 크기 증가 */
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;              /* 간격 증가 */
    transition: all 0.2s;
    white-space: nowrap;   /* 줄바꿈 방지 */
    flex-shrink: 0;        /* 축소 방지 */

    .material-icons {
        font-size: 16px;   /* 아이콘 크기 증가 */
    }

    &:hover {
        background: rgba(94, 190, 38, 0.3);
    }

    &:focus {
        outline: none;
    }
    &:focus-visible {
        box-shadow: 0 0 0 2px rgba(94, 190, 38, 0.5);
    }
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
    background: #2a2d35;
    border-radius: 12px;
    padding: 24px 30px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: ${slideUp} 0.2s cubic-bezier(0.2, 0, 0, 1);
    width: 90vw;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ConfirmMessage = styled.p`
    font-size: 16px;
    color: #e0e0e0;
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
    const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
    const [isCollaborationRoomOpen, setIsCollaborationRoomOpen] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState(null);
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

        // 히스토리 중간에서 수정한 경우, 이후 히스토리 삭제
        const newHistory = history.slice(0, historyIndex + 1);

        // 마지막 항목과 동일하지 않을 때만 추가
        if (newHistory[newHistory.length - 1] !== newContent) {
            newHistory.push(newContent);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
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

    // 공유 버튼 클릭: 방 설정 모달 열기
    const handleShareClick = () => {
        // 메모 첫 50자를 기본 제목으로 제안
        setIsRoomSettingsOpen(true);
    };

    // 방 설정 완료 후 방 생성 및 협업방 열기
    const handleRoomSettingsConfirm = async (settings) => {
        try {
            // 협업방 생성
            const roomId = await createCollaborationRoom(
                memo.id,
                settings.title, // 사용자가 입력한 제목
                editedContent, // 현재 편집 중인 내용
                settings.isPublic, // 공개 여부
                settings.allowEdit // 모두 편집 가능 여부
            );

            setCurrentRoomId(roomId);
            setIsRoomSettingsOpen(false);

            // 방 생성 완료 후 협업방 화면으로 이동
            setIsCollaborationRoomOpen(true);

            setToastMessage('협업방이 생성되었습니다!');
            setTimeout(() => setToastMessage(null), 2000);
        } catch (error) {
            console.error('협업방 생성 실패:', error);
            setToastMessage(error.message || '협업방 생성에 실패했습니다.');
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    // 협업방 닫기
    const handleCloseCollaborationRoom = () => {
        setIsCollaborationRoomOpen(false);
        setCurrentRoomId(null);
    };

    return (
      <Portal>
        <Fragment>
            <Overlay>
                <ModalContent $isImportant={isImportant}>
                    
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
                                    <span className="material-icons">keyboard_hide</span>
                                    숨김
                                </HideKeyboardButton>
                            )}
                        </GridAreaRight>
                    </TopGridContainer>

                    {/* 2. 새로운 두 번째 줄 - 중요와 공유 */}
                    <SecondRowContainer>
                        {/* 중요 체크박스 */}
                        <ImportantCheckWrapper onClick={handleImportantToggle}>
                            <ImportantRadioButton $isImportant={isImportant}>
                                <RadioInnerCircle $isImportant={isImportant} />
                            </ImportantRadioButton>
                            중요
                        </ImportantCheckWrapper>

                        {/* 공유 버튼 */}
                        <ShareButton onClick={handleShareClick}>
                            <span className="material-icons">share</span>
                            공유
                        </ShareButton>
                    </SecondRowContainer>

                    {/* 3. 날짜 정보 - 별도 줄 */}
                    <DateText>
                        {memo.createdAt && (
                            <>
                                최초 등록일: {new Date(memo.createdAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                                {memo.updatedAt && memo.updatedAt !== memo.createdAt && ' / '}
                            </>
                        )}
                        {memo.updatedAt && memo.createdAt && memo.updatedAt !== memo.createdAt && (
                            <>
                                최종 수정일: {new Date(memo.updatedAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\. /g, '. ').replace(/\.$/, '')}
                            </>
                        )}
                    </DateText>

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

            {/* 방 설정 모달 */}
            <RoomSettingsModal
                isOpen={isRoomSettingsOpen}
                onClose={() => setIsRoomSettingsOpen(false)}
                onConfirm={handleRoomSettingsConfirm}
                defaultTitle={memo?.content?.substring(0, 50) || '제목 없음'}
            />

            {/* 협업방 */}
            {isCollaborationRoomOpen && currentRoomId && (
                <CollaborationRoom
                    roomId={currentRoomId}
                    onClose={handleCloseCollaborationRoom}
                    showToast={(message) => {
                        setToastMessage(message);
                        setTimeout(() => setToastMessage(null), 2000);
                    }}
                />
            )}
        </Fragment>
      </Portal>
    );
};

export default MemoDetailModal;