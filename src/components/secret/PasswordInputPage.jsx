// src/components/secret/PasswordInputPage.jsx
// 비밀번호 입력 전용 페이지 (모달 디자인)

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: #d0d0d0;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }
`;

const ContentArea = styled.div`
    padding: 40px 24px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const LockIconContainer = styled.div`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
    border: 2px solid rgba(240, 147, 251, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(240, 147, 251, 0.2);
`;

const LockIcon = styled.svg`
    width: 30px;
    height: 30px;
`;

const Title = styled.h1`
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
    font-size: 13px;
    color: #b0b0b0;
    margin: 0 0 20px 0;
    text-align: center;
    line-height: 1.5;
`;

const DocumentTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: rgba(240, 147, 251, 0.9);
    margin-bottom: 20px;
    text-align: center;
    padding: 8px 16px;
    background: rgba(240, 147, 251, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(240, 147, 251, 0.2);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const InputWrapper = styled.div`
    width: 100%;
    margin-bottom: 16px;
`;

const PasswordInput = styled.input`
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;

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

const ErrorText = styled.div`
    color: #ff6b6b;
    font-size: 12px;
    margin-top: 8px;
    font-weight: 500;
    text-align: center;
`;

const AttemptsWarning = styled.div`
    color: #ffa500;
    font-size: 12px;
    margin-top: 8px;
    font-weight: 500;
    text-align: center;
`;

const SubmitButton = styled.button`
    width: 100%;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
    color: white;
    border: 1px solid rgba(240, 147, 251, 0.5);
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
`;

const ForgotPasswordButton = styled.button`
    background: none;
    border: none;
    color: rgba(240, 147, 251, 0.8);
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
    margin-top: 12px;
    padding: 4px;
    transition: all 0.2s;

    &:hover {
        color: rgba(240, 147, 251, 1);
    }
`;

const PasswordInputPage = ({ document, onSubmit, onCancel, onForgotPassword }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // 페이지 로드 시 자동으로 입력창에 포커스
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError('비밀번호를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = await onSubmit(password);

            if (result === false) {
                // 비밀번호 틀림
                setAttempts(prev => prev + 1);
                setPassword('');
                setError('비밀번호가 올바르지 않습니다.');
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
            // result가 true면 onSubmit에서 페이지 전환을 처리함
        } catch (err) {
            setError('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isSubmitting) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <PageContainer>
            <Modal>
                <CloseButton onClick={onCancel}>✕</CloseButton>
                <ContentArea>
                    <LockIconContainer>
                        <LockIcon viewBox="0 0 24 24" fill="none" stroke="rgba(240, 147, 251, 0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </LockIcon>
                    </LockIconContainer>

                    <Title>개별 비밀번호가 필요합니다</Title>
                    <Subtitle>
                        이 문서는 개별 비밀번호로 보호되고 있습니다.<br />
                        문서를 열려면 저장 당시 설정한 비밀번호를 입력하세요.
                    </Subtitle>

                    {document && (
                        <DocumentTitle>
                            {document.title || '제목 없음'}
                        </DocumentTitle>
                    )}

                    <InputWrapper>
                        <PasswordInput
                            ref={inputRef}
                            type="password"
                            placeholder="개별 비밀번호"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={isSubmitting}
                        />

                        {error && <ErrorText>{error}</ErrorText>}
                        {attempts >= 3 && (
                            <AttemptsWarning>
                                ⚠️ {attempts}번 실패했습니다.
                            </AttemptsWarning>
                        )}
                    </InputWrapper>

                    <SubmitButton onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '확인 중...' : '확인'}
                    </SubmitButton>

                    {attempts >= 3 && onForgotPassword && (
                        <ForgotPasswordButton onClick={onForgotPassword}>
                            비밀번호를 잊으셨나요? (PIN으로 확인)
                        </ForgotPasswordButton>
                    )}
                </ContentArea>
            </Modal>
        </PageContainer>
    );
};

export default PasswordInputPage;
