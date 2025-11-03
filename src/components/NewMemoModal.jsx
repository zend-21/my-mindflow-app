// src/components/NewMemoModal.jsx

// ★ React.Fragment를 사용하기 위해 useState 옆에 Fragment (혹은 React)를 import합니다.
import React, { useState, Fragment, useRef } from 'react'; 
import styled, { keyframes } from 'styled-components';
import Portal from './Portal';

/* --- (1) 기존 스타일 및 애니메이션 (변경 없음) --- */
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    /* ★★★ 수정: 중앙 정렬 속성 주석 해제 ★★★ */
    justify-content: center; 
    align-items: flex-start;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
    
    /* ★★★ 수정: ModalContent가 넘치더라도 Overlay가 전체 화면을 덮도록 설정 ★★★ */
    overflow-y: hidden;
    width: 100vw; /* 뷰포트 너비 명시 */
    height: 100vh; /* 뷰포트 높이 명시 */
`;

const ModalContent = styled.div`
    background: ${props => props.$isImportant ? 'rgba(255, 210, 210, 1)' : '#fff8e1'};
    
    width: 95vw;    
    min-height: 90vh;
    height: 95vh; /* ★★★ 정확한 높이 설정 ★★★ */
    border-radius: 16px;
    margin: 0;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    position: relative;
    padding: 24px;
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.3s ease-out;   
    
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

const ModalTextarea = styled.textarea`
    width: 100%;
    /* height: 300px; */ /* <-- 기존 300px 고정 높이 제거 */
    flex: 1; /* ★ 남은 공간을 모두 차지하도록 flex: 1 추가 */
    padding: 16px;
    border: 1px solid #a1b4ceff;
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
        color: #9bafc9ff;
    }
`;

const LeftButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
`;

const HideKeyboardButton = styled.button`
    background: #e7e7e7ff;
    color: #292b2eff;
    border: none;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;
    &:hover {
        background-color: #d2d6db;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 0px;
    margin-bottom: 15px;
`;

const DoubleTapGuide = styled.p`
    font-size: 12px;
    color: #888;
    text-align: left;
    margin-top: -10px; 
    margin-bottom: 5px; /* ✅ 이 값을 15px에서 5px로 변경하거나 0으로 설정하세요 */
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
    
    ${props => props.$isImportant && `
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
    opacity: ${props => props.$isImportant ? 1 : 0};
    transition: opacity 0.2s ease;
`;


/* --- (2) ★★★ "취소 확인" 모달 새 스타일 추가 ★★★ --- */
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
    z-index: 11000; /* 메인 모달(4000)보다 높게 */
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

    /* 기존 버튼 스타일 재활용 */
    & > ${ModalButton} {
        flex: 1; 
    }
`;

/* --- (3) ★★★ "저장 완료 토스트" 전용 새 스타일 추가 ★★★ --- */
const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000; /* 확인 모달(5000) 보다도 높게 설정 */
  background: rgba(0, 0, 0, 0.2); 
  animation: ${fadeIn} 0.2s ease-out;
`;

const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.75); /* 어두운 배경의 토스트 */
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
`;


/* --- (4) ★★★ NewMemoModal 컴포넌트 로직 수정 ★★★ --- */
const NewMemoModal = ({ isOpen, onSave, onCancel, openSource }) => {
    const [newMemoContent, setNewMemoContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);
    const textareaRef = useRef(null);
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });
    const [showSaveToast, setShowSaveToast] = useState(false);
    const lastTapTime = useRef(0);
    const [isClosing, setIsClosing] = useState(false);

    const placeholderText = openSource === 'fab'
        ? "긴급 메모장 출동~!\n부르시면 어디든지 찾아갑니다.^^\n중요한 순간을 놓치지 마세요.\n\n작성하신 내용은 메모장에 저장됩니다."
        : "떠오르는 아이디어를 잡아보세요...";

    const resetInputs = () => {
        setNewMemoContent('');
        setIsImportant(false);
    };

    const handleSave = () => {
        // 버튼이 disabled 상태이므로 alert는 필요 없음. 가드(guard)만 유지.
        if (!newMemoContent.trim()) {
            return;
        }
        
        onSave(newMemoContent, isImportant);
        resetInputs();
        setShowSaveToast(true); 
        
        setTimeout(() => {
            setShowSaveToast(false);
            onCancel(); // ★ onCancel을 여기서 호출 (저장 후 바로 닫히지 않고 1초 뒤 닫힘)
        }, 1000); 
    };
    
    const handleDoubleTapSave = () => {
        const now = new Date().getTime();
        const timeSinceLastTap = now - lastTapTime.current;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // 더블탭으로 간주
            if (!newMemoContent.trim()) {
                // 내용이 비어있으면 '닫기'와 동일하게 동작
                handleCancelClick();
            } else {
                // 내용이 있으면 저장
                handleSave();
            }
        }
        
        lastTapTime.current = now;
    };

    const handleDoubleClick = () => {
    if (isPristine) {
        handleCancelClick(); // 변경 없으면 닫기
    } else {
        handleSaveClick();   // 변경 있으면 저장
    }
    };  

    const closeConfirmModal = () => {
        setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
    };

    const handleConfirmAction = () => {
        confirmModalState.onConfirm(); // state에 저장된 함수(onConfirm) 실행
        closeConfirmModal();
    };

    // ★ 5. 취소 핸들러 수정 및 isPristine 변수 정의 (오류 수정)

    // [추가] 1. isPristine 변수를 여기서 정의합니다. (ReferenceError 해결)
    //    (내용이 없고 '중요' 표시도 false인 초기 상태인지 확인)
    const isPristine = newMemoContent === '';

    const handleCancelClick = () => {
        if (isClosing) return;

        if (!isPristine) {
        setConfirmModalState({
            isOpen: true,
            message: "변경사항을 저장하지 않고 닫으시겠습니까?",
            onConfirm: () => {
            setIsClosing(true);
            setTimeout(() => {
                resetInputs();
                onCancel();
                setIsClosing(false);
            }, 300);
            },
        });
        } else {
        setIsClosing(true);
        setTimeout(() => {
            resetInputs();
            onCancel();
            setIsClosing(false);
        }, 300);
        }
    };

    const handleTextareaFocus = () => {
        setIsKeyboardActive(true);
    };

    const handleTextareaBlur = () => {
        setIsKeyboardActive(false);
    };

    const handleHideKeyboardClick = () => {
        if (textareaRef.current) {
            textareaRef.current.blur();
        }
    };

    const handleImportantToggle = () => {
        setIsImportant(!isImportant);
    };

    if (!isOpen) {
        return null;
    }
    
    return (
      <Portal>
        <Fragment>
            <Overlay>
                <ModalContent $isImportant={isImportant}>
                    
                    {/* ★★★ 변경된 부분: 버튼 그룹화 ★★★ */}
                    <ButtonContainer>
                        <LeftButtonWrapper>
                            <ImportantCheckWrapper onClick={handleImportantToggle}>
                                <ImportantRadioButton $isImportant={isImportant}>
                                    <RadioInnerCircle $isImportant={isImportant} />
                                </ImportantRadioButton>
                                중요
                            </ImportantCheckWrapper>
                            {isKeyboardActive && (
                                <HideKeyboardButton onClick={handleHideKeyboardClick}>
                                    자판 숨김
                                </HideKeyboardButton>
                            )}
                        </LeftButtonWrapper>
                        <RightButtonWrapper>
                            <CancelButton onClick={handleCancelClick}>
                                {isPristine ? '닫기' : '취소'}
                            </CancelButton>
                            <SaveButton onClick={handleSave} disabled={!newMemoContent.trim()}>저장</SaveButton>
                        </RightButtonWrapper>
                    </ButtonContainer>

                    <DoubleTapGuide>
                        · 입력창을 두 번 탭하여 저장하거나 닫을 수 있습니다.
                    </DoubleTapGuide>

                    <ModalTextarea
                        ref={textareaRef}
                        placeholder={placeholderText}
                        value={newMemoContent}
                        onChange={(e) => setNewMemoContent(e.target.value)}
                        onFocus={handleTextareaFocus}
                        onTouchStart={handleDoubleTapSave}
                        onBlur={handleTextareaBlur}
                        onDoubleClick={handleDoubleClick}
                        autoFocus
                    />
                    
                </ModalContent>
            </Overlay>
            {/* --- 2. "취소 확인" 커스텀 모달 (조건부 렌더링) --- */}
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

            {/* --- 3. "저장 완료" 커스텀 토스트 (조건부 렌더링) --- */}
            {showSaveToast && (
                <ToastOverlay>
                    <ToastBox>
                        새 메모가 저장되었습니다.
                    </ToastBox>
                </ToastOverlay>
            )}
        </Fragment>
      </Portal>
    );
};

export default NewMemoModal;