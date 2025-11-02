// src/components/FortuneNoticeModal.jsx

import React, { useState } from 'react';
import styled from 'styled-components';

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 15000;
    animation: fadeIn 0.3s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContainer = styled.div`
    background: white;
    width: 90%;
    max-width: 400px;
    border-radius: 20px;
    padding: 32px 24px 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (min-width: 768px) {
        max-width: 420px;
        padding: 40px 32px 28px;
    }
`;

const Icon = styled.div`
    text-align: center;
    font-size: 56px;
    margin-bottom: 20px;
`;

const Title = styled.h2`
    margin: 0 0 16px 0;
    font-size: 22px;
    font-weight: 700;
    color: #2d3748;
    text-align: center;
    line-height: 1.4;

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

const Message = styled.p`
    margin: 0 0 24px 0;
    font-size: 15px;
    color: #4a5568;
    text-align: center;
    line-height: 1.7;
    white-space: pre-line;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const Highlight = styled.span`
    color: #667eea;
    font-weight: 600;
`;

const CheckboxContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #edf2f7;
    }
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
`;

const StyledCheckbox = styled.div`
    width: 20px;
    height: 20px;
    border: 2px solid ${props => props.$checked ? '#667eea' : '#cbd5e0'};
    border-radius: 4px;
    background: ${props => props.$checked ? '#667eea' : 'white'};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &::after {
        content: '✓';
        color: white;
        font-size: 14px;
        font-weight: bold;
        opacity: ${props => props.$checked ? 1 : 0};
        transition: opacity 0.2s;
    }
`;

const CheckboxLabel = styled.span`
    font-size: 14px;
    color: #4a5568;
    user-select: none;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const ConfirmButton = styled.button`
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    &:active {
        transform: translateY(0);
    }

    @media (min-width: 768px) {
        font-size: 17px;
        padding: 18px;
    }
`;

// 🎯 Main Component

const FortuneNoticeModal = ({ onConfirm }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleConfirm = () => {
        if (dontShowAgain) {
            // "다시 보지 않기" 선택 시 localStorage에 저장
            localStorage.setItem('fortuneNoticeHidden', 'true');
        }
        onConfirm();
    };

    const handleCheckboxClick = () => {
        setDontShowAgain(!dontShowAgain);
    };

    return (
        <Overlay>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <Icon>🔮</Icon>
                <Title>오늘의 운세 안내</Title>
                <Message>
                    오늘의 운세는 <Highlight>하루에 한 번만</Highlight> 이용할 수 있습니다.
                    {'\n'}
                    운세를 확인한 후에는 <Highlight>다시 보기</Highlight>가 가능합니다.
                </Message>

                <CheckboxContainer onClick={handleCheckboxClick}>
                    <HiddenCheckbox
                        checked={dontShowAgain}
                        onChange={handleCheckboxClick}
                    />
                    <StyledCheckbox $checked={dontShowAgain} />
                    <CheckboxLabel>다시 보지 않기</CheckboxLabel>
                </CheckboxContainer>

                <ConfirmButton onClick={handleConfirm}>
                    확인
                </ConfirmButton>
            </ModalContainer>
        </Overlay>
    );
};

export default FortuneNoticeModal;
