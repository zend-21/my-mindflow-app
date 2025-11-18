// src/components/secret/TempPinDisplayModal.jsx
// 임시 PIN 표시 모달 (테스트용)

import React from 'react';
import styled from 'styled-components';
import Portal from '../Portal';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 20100;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 20px;
    padding: 32px 24px;
    max-width: 440px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const Title = styled.h3`
    color: #ffffff;
    font-size: 20px;
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

const PinDisplay = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(240, 147, 251, 0.5);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    text-align: center;
`;

const PinLabel = styled.div`
    color: #d0d0d0;
    font-size: 13px;
    margin-bottom: 8px;
    font-weight: 500;
`;

const PinNumber = styled.div`
    color: #f093fb;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 8px;
    font-family: 'Courier New', monospace;
    text-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
`;

const WarningBox = styled.div`
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
`;

const WarningTitle = styled.div`
    color: #ffc107;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const WarningText = styled.div`
    color: #ffc107;
    font-size: 12px;
    line-height: 1.5;
`;

const InfoBox = styled.div`
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
`;

const InfoText = styled.div`
    color: #60a5fa;
    font-size: 12px;
    line-height: 1.6;
`;

const Button = styled.button`
    width: 100%;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(240, 147, 251, 0.5);
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9));
        box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
    }

    &:active {
        transform: translateY(1px);
    }
`;

const TempPinDisplayModal = ({ tempPin, onClose }) => {
    return (
        <Portal>
            <Overlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <Title>임시 PIN 발급 완료</Title>
                    <Subtitle>아래 임시 PIN을 입력하여 로그인하세요</Subtitle>

                    <PinDisplay>
                        <PinLabel>임시 PIN 번호</PinLabel>
                        <PinNumber>{tempPin}</PinNumber>
                    </PinDisplay>

                    <WarningBox>
                        <WarningTitle>
                            ⚠️ 테스트 모드 안내
                        </WarningTitle>
                        <WarningText>
                            현재 테스트 기간으로, 임시 PIN이 화면에 표시됩니다.<br/>
                            정식 배포 시에는 등록된 이메일로만 전송됩니다.
                        </WarningText>
                    </WarningBox>

                    <InfoBox>
                        <InfoText>
                            • 임시 PIN은 24시간 동안 유효합니다<br/>
                            • 임시 PIN으로 로그인 후 새로운 PIN을 설정하세요<br/>
                            • 새 PIN은 임시 PIN과 달라야 합니다
                        </InfoText>
                    </InfoBox>

                    <Button onClick={onClose}>
                        확인
                    </Button>
                </ModalContent>
            </Overlay>
        </Portal>
    );
};

export default TempPinDisplayModal;
