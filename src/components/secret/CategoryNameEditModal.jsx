// src/components/secret/CategoryNameEditModal.jsx
// 카테고리 이름 수정 모달

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10002;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h3`
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    text-align: center;
`;

const Subtitle = styled.p`
    color: #808080;
    font-size: 13px;
    margin: 0 0 24px 0;
    text-align: center;
    line-height: 1.5;
`;

const CategoryIcon = styled.div`
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: ${props => {
        switch(props.$category) {
            case 'financial': return 'rgba(76, 175, 80, 0.2)';
            case 'personal': return 'rgba(255, 152, 0, 0.2)';
            case 'work': return 'rgba(33, 150, 243, 0.2)';
            case 'diary': return 'rgba(156, 39, 176, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
    border: 2px solid ${props => {
        switch(props.$category) {
            case 'financial': return '#4caf50';
            case 'personal': return '#ff9800';
            case 'work': return '#2196f3';
            case 'diary': return '#9c27b0';
            default: return 'rgba(255, 255, 255, 0.2)';
        }
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 20px;
`;

const InputWrapper = styled.div`
    position: relative;
    margin-bottom: 8px;
`;

const Input = styled.input`
    width: 100%;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid ${props => props.$error ? '#ff6b6b' : 'rgba(255, 255, 255, 0.1)'};
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 16px;
    text-align: center;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: ${props => props.$error ? '#ff6b6b' : 'rgba(240, 147, 251, 0.5)'};
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px ${props => props.$error ? 'rgba(255, 107, 107, 0.1)' : 'rgba(240, 147, 251, 0.1)'};
    }

    &::placeholder {
        color: #606060;
    }
`;

const CharCount = styled.div`
    text-align: right;
    font-size: 12px;
    color: ${props => props.$isMax ? '#ff6b6b' : '#808080'};
    margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
    color: #ff6b6b;
    font-size: 12px;
    text-align: center;
    margin-bottom: 16px;
    min-height: 16px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
`;

const Button = styled.button`
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid ${props => props.$primary ? 'rgba(240, 147, 251, 0.5)' : 'rgba(255, 255, 255, 0.15)'};
    background: ${props => props.$primary ? 'rgba(240, 147, 251, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$primary ? '#f093fb' : '#d0d0d0'};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${props => props.$primary ? 'rgba(240, 147, 251, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
        border-color: ${props => props.$primary ? 'rgba(240, 147, 251, 0.6)' : 'rgba(255, 255, 255, 0.25)'};
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CATEGORY_ICONS = {
    financial: '💰',
    personal: '👤',
    work: '💼',
    diary: '📔'
};

const CategoryNameEditModal = ({ category, currentName, onSave, onClose }) => {
    const [name, setName] = useState(currentName);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        // 모달이 열릴 때 입력창에 포커스
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 100);
    }, []);

    // 한글 2글자, 영문/숫자 4글자 제한
    const getMaxLength = (text) => {
        const koreanChars = (text.match(/[ㄱ-ㅎ가-힣]/g) || []).length;
        const otherChars = text.replace(/[ㄱ-ㅎ가-힣]/g, '').length;

        if (koreanChars > 0) {
            return 2; // 한글이 포함되면 2글자
        }
        return 4; // 영문/숫자만 있으면 4글자
    };

    const handleChange = (e) => {
        const value = e.target.value;
        const koreanChars = (value.match(/[ㄱ-ㅎ가-힣]/g) || []).length;
        const otherChars = value.replace(/[ㄱ-ㅎ가-힣]/g, '').length;

        // 한글이 포함된 경우 2글자 제한
        if (koreanChars > 0) {
            if (koreanChars + otherChars <= 2) {
                setName(value);
                setError('');
            }
        } else {
            // 영문/숫자만 있는 경우 4글자 제한
            if (value.length <= 4) {
                setName(value);
                setError('');
            }
        }
    };

    const handleSave = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError('카테고리 이름을 입력하세요');
            return;
        }

        const koreanChars = (trimmedName.match(/[ㄱ-ㅎ가-힣]/g) || []).length;
        const otherChars = trimmedName.replace(/[ㄱ-ㅎ가-힣]/g, '').length;

        if (koreanChars > 0 && koreanChars + otherChars > 2) {
            setError('한글은 최대 2글자까지 입력 가능합니다');
            return;
        }

        if (koreanChars === 0 && trimmedName.length > 4) {
            setError('영문/숫자는 최대 4글자까지 입력 가능합니다');
            return;
        }

        onSave(trimmedName);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const koreanChars = (name.match(/[ㄱ-ㅎ가-힣]/g) || []).length;
    const otherChars = name.replace(/[ㄱ-ㅎ가-힣]/g, '').length;
    const currentLength = koreanChars + otherChars;
    const maxLength = getMaxLength(name);
    const isMax = currentLength >= maxLength;

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <CategoryIcon $category={category}>
                    {CATEGORY_ICONS[category] || '📁'}
                </CategoryIcon>

                <Title>카테고리 이름 변경</Title>
                <Subtitle>
                    한글 최대 2글자, 영문/숫자 최대 4글자<br/>
                    (공백 포함)
                </Subtitle>

                <InputWrapper>
                    <Input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={handleChange}
                        onKeyDown={handleKeyPress}
                        placeholder="이름 입력"
                        $error={!!error}
                        maxLength={koreanChars > 0 ? 2 : 4}
                    />
                </InputWrapper>

                <CharCount $isMax={isMax}>
                    {currentLength} / {maxLength}
                </CharCount>

                <ErrorMessage>{error}</ErrorMessage>

                <ButtonGroup>
                    <Button onClick={onClose}>
                        취소
                    </Button>
                    <Button $primary onClick={handleSave} disabled={!name.trim()}>
                        저장
                    </Button>
                </ButtonGroup>
            </ModalContent>
        </Overlay>
    );
};

export default CategoryNameEditModal;
