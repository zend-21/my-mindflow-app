// src/components/messaging/CollaborationMemoModal.jsx
// 대화방 협업 문서 작성 전용 모달

import React, { useState, Fragment, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../Portal';
import RichTextEditor from '../RichTextEditor';

/* --- 스타일 및 애니메이션 --- */
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
    justify-content: center;
    align-items: center;
    z-index: 500000;
    animation: ${fadeIn} 0.3s ease-out;
    overflow-y: hidden;
    width: 100vw;
    height: 100vh;
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    width: 95vw;
    min-height: 90vh;
    height: 95vh;
    border-radius: 16px;
    margin: 0;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    position: relative;
    padding: 24px;
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.3s ease-out;

    @media (orientation: landscape) {
        padding-bottom: 10px;
    }

    @media (min-width: 768px) {
        max-width: 420px;
        min-height: 70vh;
        border-radius: 20px;
    }

    @media (min-width: 1200px) {
        max-width: 480px;
    }

    @media (min-width: 1900px) {
        max-width: 530px;
    }
`;

const LeftButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
`;

const HideKeyboardButton = styled.button`
    background: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;

    .material-icons {
        font-size: 16px;
    }

    &:hover {
        background-color: #3d424d;
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
    color: #b0b0b0;
    text-align: left;
    margin-top: -10px;
    margin-bottom: 5px;
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
        background-color: #3d424d;
        color: #666;
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
    background-color: #333842;
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    &:hover:not(:disabled) {
        background-color: #3d424d;
    }
`;

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
    z-index: 510000;
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

const ToastOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 520000;
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

const CollaborationMemoModal = ({ isOpen, onSave, onCancel }) => {
    const [memoContent, setMemoContent] = useState('');
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => {},
    });
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const placeholderText = "새 협업 문서를 작성하세요...\n\n작성하신 내용은 공유 폴더에 저장됩니다.";

    const resetInputs = () => {
        setMemoContent('');
    };

    const handleSave = () => {
        if (!memoContent.trim()) {
            return;
        }

        onSave(memoContent);
        resetInputs();
        setShowSaveToast(true);

        setTimeout(() => {
            setShowSaveToast(false);
            onCancel();
        }, 1000);
    };

    const closeConfirmModal = () => {
        setConfirmModalState({ isOpen: false, message: '', onConfirm: () => {} });
    };

    const handleConfirmAction = () => {
        confirmModalState.onConfirm();
        closeConfirmModal();
    };

    const isPristine = memoContent === '';

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
        // RichTextEditor의 blur 처리는 RichTextEditor 컴포넌트 내부에서 처리
        setIsKeyboardActive(false);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Portal>
            <Fragment>
                <Overlay>
                    <ModalContent>
                        <ButtonContainer>
                            <LeftButtonWrapper>
                                {isKeyboardActive && (
                                    <HideKeyboardButton onClick={handleHideKeyboardClick}>
                                        <span className="material-icons">keyboard_hide</span>
                                        숨김
                                    </HideKeyboardButton>
                                )}
                            </LeftButtonWrapper>
                            <RightButtonWrapper>
                                <CancelButton onClick={handleCancelClick}>
                                    {isPristine ? '닫기' : '취소'}
                                </CancelButton>
                                <SaveButton onClick={handleSave} disabled={!memoContent.trim()}>저장</SaveButton>
                            </RightButtonWrapper>
                        </ButtonContainer>

                        <DoubleTapGuide>
                            · 입력창을 두 번 탭하여 저장하거나 닫을 수 있습니다.
                        </DoubleTapGuide>

                        <RichTextEditor
                            content={memoContent}
                            onChange={setMemoContent}
                            placeholder={placeholderText}
                            onFocus={handleTextareaFocus}
                            onBlur={handleTextareaBlur}
                        />
                    </ModalContent>
                </Overlay>

                {/* 취소 확인 모달 */}
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

                {/* 저장 완료 토스트 */}
                {showSaveToast && (
                    <ToastOverlay>
                        <ToastBox>
                            공유 폴더에 문서가 저장되었습니다.
                        </ToastBox>
                    </ToastOverlay>
                )}
            </Fragment>
        </Portal>
    );
};

export default CollaborationMemoModal;
