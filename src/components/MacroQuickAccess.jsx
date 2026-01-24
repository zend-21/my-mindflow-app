// src/components/MacroQuickAccess.jsx
// 매크로 빠른 접근 컴포넌트

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Portal from './Portal';
import { getCurrentUserId } from '../utils/userStorage';
import { getAccountLocalStorageWithTTL } from '../hooks/useFirestoreSync.utils';

const MacroButton = styled.button`
    position: fixed;
    width: 32px;
    height: 32px;
    background: rgba(240, 147, 251, 0.25);
    border: 1px solid rgba(240, 147, 251, 0.5);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover {
        background: rgba(240, 147, 251, 0.35);
        border-color: rgba(240, 147, 251, 0.7);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const MacroIcon = styled.span`
    color: #f093fb;
    font-size: 16px;
    font-weight: 700;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const PopoverContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    padding: 20px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const PopoverTitle = styled.h3`
    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px 0;
    text-align: center;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const MacroList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const MacroItem = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(240, 147, 251, 0.5);
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const MacroNumber = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const MacroPreview = styled.div`
    flex: 1;
    color: #e0e0e0;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
`;

const EmptyText = styled.span`
    color: #808080;
    font-style: italic;
`;

const CloseButton = styled.button`
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 12px;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const PREVIEW_LENGTH = 30; // 미리보기 표시 글자 수

const MacroQuickAccess = () => {
    const [showButton, setShowButton] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const [macros, setMacros] = useState(Array(7).fill(''));
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const [focusedElement, setFocusedElement] = useState(null);

    useEffect(() => {
        // localStorage에서 매크로 불러오기
        const loadMacros = () => {
            const userId = getCurrentUserId();
            if (!userId) {
                setMacros(Array(7).fill(''));
                return;
            }

            try {
                // ✅ TTL 기반 localStorage 사용
                const saved = getAccountLocalStorageWithTTL(userId, 'macros') || [];
                if (Array.isArray(saved) && saved.length === 7) {
                    setMacros(saved);
                }
            } catch (error) {
                console.error('Failed to load macros:', error);
            }
        };

        loadMacros();

        // localStorage 변경 감지 (다른 탭이나 매크로 모달에서 변경 시)
        const handleStorageChange = (e) => {
            const userId = getCurrentUserId();
            if (!userId) return;

            const STORAGE_KEY = `user_${userId}_macros`;
            if (e.key === STORAGE_KEY) {
                loadMacros();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        // 포커스된 입력 필드 감지
        const handleFocusIn = (e) => {
            const target = e.target;
            if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text')) {
                setFocusedElement(target);
                const rect = target.getBoundingClientRect();

                setButtonPosition({
                    top: rect.top + window.scrollY,
                    left: rect.right - 40 + window.scrollX // 오른쪽에서 40px 안쪽
                });

                setShowButton(true);
            }
        };

        const handleFocusOut = (e) => {
            // 팝오버가 열려있으면 버튼 유지
            if (!showPopover) {
                setTimeout(() => {
                    setShowButton(false);
                    setFocusedElement(null);
                }, 200);
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, [showPopover]);

    const handleMacroSelect = (index) => {
        const macroText = macros[index];
        if (macroText.trim() && focusedElement) {
            // 현재 커서 위치에 텍스트 삽입
            const start = focusedElement.selectionStart;
            const end = focusedElement.selectionEnd;
            const currentValue = focusedElement.value;
            const newValue = currentValue.substring(0, start) + macroText + currentValue.substring(end);

            // React의 값 업데이트를 트리거
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            )?.set || Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            )?.set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(focusedElement, newValue);

                // React의 change 이벤트 트리거
                const event = new Event('input', { bubbles: true });
                focusedElement.dispatchEvent(event);

                // 커서를 삽입된 텍스트 뒤로 이동
                setTimeout(() => {
                    focusedElement.selectionStart = focusedElement.selectionEnd = start + macroText.length;
                    focusedElement.focus();
                }, 0);
            }

            setShowPopover(false);
            setShowButton(false);
        }
    };

    const handleOpenPopover = () => {
        setShowPopover(true);
    };

    const handleClosePopover = () => {
        setShowPopover(false);
        setShowButton(false);
        if (focusedElement) {
            focusedElement.focus();
        }
    };

    const getPreviewText = (text) => {
        if (!text.trim()) {
            return <EmptyText>(비어있음)</EmptyText>;
        }
        if (text.length <= PREVIEW_LENGTH) {
            return text;
        }
        return text.slice(0, PREVIEW_LENGTH) + '...';
    };

    return (
        <>
            {showButton && (
                <MacroButton
                    onClick={handleOpenPopover}
                    style={{
                        top: `${buttonPosition.top}px`,
                        left: `${buttonPosition.left}px`
                    }}
                    title="매크로 선택"
                >
                    <MacroIcon>M</MacroIcon>
                </MacroButton>
            )}

            {showPopover && (
                <Portal>
                    <Overlay onClick={handleClosePopover}>
                        <PopoverContent onClick={(e) => e.stopPropagation()}>
                            <PopoverTitle>매크로 선택</PopoverTitle>
                            <MacroList>
                                {macros.map((macro, index) => (
                                    <MacroItem
                                        key={index}
                                        onClick={() => handleMacroSelect(index)}
                                        disabled={!macro.trim()}
                                    >
                                        <MacroNumber>{index + 1}</MacroNumber>
                                        <MacroPreview>
                                            {getPreviewText(macro)}
                                        </MacroPreview>
                                    </MacroItem>
                                ))}
                            </MacroList>
                            <CloseButton onClick={handleClosePopover}>
                                닫기
                            </CloseButton>
                        </PopoverContent>
                    </Overlay>
                </Portal>
            )}
        </>
    );
};

export default MacroQuickAccess;
