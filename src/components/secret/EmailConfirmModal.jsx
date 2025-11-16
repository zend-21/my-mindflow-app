// src/components/secret/EmailConfirmModal.jsx
// 임시 PIN 이메일 발송 확인 모달

import React from 'react';
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
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

const Header = styled.div`
    padding: 24px 24px 20px 24px;
    text-align: center;
`;

const IconContainer = styled.div`
    width: 64px;
    height: 64px;
    margin: 0 auto 16px auto;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    border: 2px solid rgba(240, 147, 251, 0.3);
`;

const Title = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Body = styled.div`
    padding: 0 24px 24px 24px;
`;

const Message = styled.p`
    color: #d0d0d0;
    font-size: 15px;
    line-height: 1.6;
    text-align: center;
    margin: 0 0 20px 0;
`;

const EmailBox = styled.div`
    background: rgba(240, 147, 251, 0.1);
    border: 1px solid rgba(240, 147, 251, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    text-align: center;
`;

const EmailLabel = styled.div`
    color: #a0a0a0;
    font-size: 12px;
    margin-bottom: 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const EmailText = styled.div`
    color: #f093fb;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
    word-break: break-all;
`;

const InfoBox = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 24px;
`;

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    color: #a0a0a0;
    font-size: 13px;
    line-height: 1.5;

    &:not(:last-child) {
        margin-bottom: 8px;
    }
`;

const InfoIcon = styled.span`
    font-size: 16px;
    flex-shrink: 0;
`;

const Footer = styled.div`
    padding: 0 24px 24px 24px;
    display: flex;
    gap: 12px;
`;

const Button = styled.button`
    flex: 1;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);

        &:hover {
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9));
            box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
            transform: translateY(-1px);
        }

        &:active {
            transform: translateY(0);
        }
    ` : `
        background: rgba(255, 255, 255, 0.08);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.15);

        &:hover {
            background: rgba(255, 255, 255, 0.12);
        }

        &:active {
            transform: translateY(1px);
        }
    `}
`;

const EmailConfirmModal = ({ email, maskedEmail, onConfirm, onCancel }) => {
    return (
        <Portal>
            <Overlay onClick={onCancel}>
                <Modal onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <IconContainer>📧</IconContainer>
                        <Title>임시 PIN 전송</Title>
                    </Header>

                    <Body>
                        <Message>
                            연동된 구글 계정으로<br />
                            임시 PIN 번호를 전송할까요?
                        </Message>

                        <EmailBox>
                            <EmailLabel>전송할 이메일 주소</EmailLabel>
                            <EmailText>{maskedEmail}</EmailText>
                        </EmailBox>

                        <InfoBox>
                            <InfoItem>
                                <InfoIcon>⏱️</InfoIcon>
                                <span>임시 PIN은 24시간 동안 유효합니다</span>
                            </InfoItem>
                            <InfoItem>
                                <InfoIcon>🔒</InfoIcon>
                                <span>로그인 후 새로운 PIN 설정이 필요합니다</span>
                            </InfoItem>
                            <InfoItem>
                                <InfoIcon>⚠️</InfoIcon>
                                <span>하루 1회만 요청 가능합니다</span>
                            </InfoItem>
                        </InfoBox>
                    </Body>

                    <Footer>
                        <Button onClick={onCancel}>취소</Button>
                        <Button $primary onClick={onConfirm}>전송하기</Button>
                    </Footer>
                </Modal>
            </Overlay>
        </Portal>
    );
};

export default EmailConfirmModal;
