// src/components/ConfirmModal.jsx

import React from 'react';
import styled from 'styled-components';

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
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    width: 90%;
    max-width: 420px;
    border-radius: 20px;
    padding: 32px 24px 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);

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
        max-width: 480px;
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
    color: #e0e0e0;
    text-align: center;
    line-height: 1.4;

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

const Message = styled.p`
    margin: 0 0 24px 0;
    font-size: 15px;
    color: #b0b0b0;
    text-align: center;
    line-height: 1.7;
    white-space: pre-line;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const Highlight = styled.span`
    color: #e53e3e;
    font-weight: 600;
`;

const Warning = styled.div`
    background: rgba(254, 178, 178, 0.1);
    border: 1px solid rgba(254, 178, 178, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    font-size: 14px;
    color: #ffb3b3;
    line-height: 1.6;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

const Button = styled.button`
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    @media (min-width: 768px) {
        font-size: 17px;
        padding: 18px;
    }
`;

const CancelButton = styled(Button)`
    background: rgba(255, 255, 255, 0.08);
    color: #d0d0d0;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const ConfirmButton = styled(Button)`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
`;

const ConfirmModal = ({ type = 'phone', onConfirm, onCancel }) => {
    const isGoogleRestore = type === 'google';

    return (
        <Overlay onClick={onCancel}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <Icon>⚠️</Icon>
                <Title>{isGoogleRestore ? '동기화 확인 (구글→폰)' : '휴대폰 복원 확인'}</Title>
                <Message>
                    <Highlight>현재 휴대폰 데이터를 덮어씁니다.</Highlight>{'\n'}
                    {isGoogleRestore ? '동기화를' : '복원을'} 진행하시겠습니까?
                </Message>

                {isGoogleRestore && (
                    <Warning>
                        💡 <strong>동기화 주의사항 (구글→폰)</strong><br />
                        구글 드라이브의 데이터가 휴대폰 데이터를 덮어씁니다.
                        중요한 데이터가 있다면 <strong>동기화 전에 휴대폰 백업</strong>을 먼저 진행하세요.
                        (과거 데이터가 최신 데이터를 덮어쓸 경우 휴대폰 복원으로 데이터를 되돌릴 수 있습니다)
                    </Warning>
                )}

                <ButtonGroup>
                    <CancelButton onClick={onCancel}>
                        취소
                    </CancelButton>
                    <ConfirmButton onClick={onConfirm}>
                        {isGoogleRestore ? '동기화' : '복원하기'}
                    </ConfirmButton>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};

export default ConfirmModal;
