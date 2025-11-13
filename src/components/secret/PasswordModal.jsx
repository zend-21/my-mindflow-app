// src/components/secret/PasswordModal.jsx
// 문서 비밀번호 입력 모달

import React, { useState } from 'react';
import styled from 'styled-components';
import Portal from '../Portal';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    touch-action: none;
    overscroll-behavior: contain;
`;

const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
    font-size: 13px;
    color: #b0b0b0;
    margin: 0;
    line-height: 1.5;
`;

const Body = styled.div`
    padding: 24px;
`;

const PasswordInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const PasswordInput = styled.input`
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

const ShowPasswordButton = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #d0d0d0;
    font-size: 20px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const ErrorText = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 500;
`;

const AttemptsWarning = styled.div`
    color: #ffa500;
    font-size: 13px;
    margin-top: 8px;
    font-weight: 500;
`;

const ForgotPasswordButton = styled.button`
    background: none;
    border: none;
    color: rgba(240, 147, 251, 0.8);
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
    margin-top: 12px;
    padding: 0;
    transition: all 0.2s;

    &:hover {
        color: rgba(240, 147, 251, 1);
    }
`;

const Footer = styled.div`
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
`;

const Button = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
        }
    ` : `
        background: rgba(255, 255, 255, 0.05);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
    `}

    &:active {
        transform: translateY(0);
    }
`;

const PasswordModal = ({ onSubmit, onCancel, onForgotPassword }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError('비밀번호를 입력해주세요.');
            return;
        }

        const result = await onSubmit(password);
        // 실패한 경우 시도 횟수 증가
        if (result === false) {
            setAttempts(prev => prev + 1);
            setPassword(''); // 비밀번호 입력 초기화
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <Portal>
            <Overlay
                onClick={onCancel}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                <Modal onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>문서 비밀번호 입력</Title>
                        <Subtitle>이 문서를 보려면 비밀번호가 필요합니다</Subtitle>
                    </Header>

                    <Body>
                        <PasswordInputWrapper>
                            <PasswordInput
                                type={showPassword ? "text" : "password"}
                                placeholder="문서 비밀번호"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <ShowPasswordButton
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </ShowPasswordButton>
                        </PasswordInputWrapper>
                        {error && <ErrorText>{error}</ErrorText>}
                        {attempts >= 3 && (
                            <>
                                <AttemptsWarning>
                                    ⚠️ {attempts}번 실패했습니다.
                                </AttemptsWarning>
                                {onForgotPassword && (
                                    <ForgotPasswordButton onClick={onForgotPassword}>
                                        비밀번호를 잊으셨나요? (PIN으로 확인)
                                    </ForgotPasswordButton>
                                )}
                            </>
                        )}
                    </Body>

                    <Footer>
                        <Button onClick={onCancel}>취소</Button>
                        <Button $primary onClick={handleSubmit}>확인</Button>
                    </Footer>
                </Modal>
            </Overlay>
        </Portal>
    );
};

export default PasswordModal;
