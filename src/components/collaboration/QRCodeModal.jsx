// src/components/collaboration/QRCodeModal.jsx
// WS 코드를 QR 코드로 표시하는 모달

import React from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import Portal from '../Portal';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

const ModalContent = styled.div`
    background: #2a2d35;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    position: relative;
    max-width: 400px;
    width: 90%;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #b0b0b0;
    transition: color 0.2s;

    &:active {
        color: #ffffff;
    }
`;

const ModalTitle = styled.h2`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #e0e0e0;
    margin-top: 0;
`;

const ModalDescription = styled.p`
    font-size: 16px;
    color: #b0b0b0;
    line-height: 1.5;
    margin-bottom: 30px;
`;

const QRCodeContainer = styled.div`
    background: white;
    padding: 20px;
    border-radius: 12px;
    display: inline-block;
    margin-bottom: 20px;
`;

const WorkspaceCodeDisplay = styled.div`
    background: #333842;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
`;

const CodeLabel = styled.div`
    font-size: 12px;
    color: #888;
    margin-bottom: 4px;
`;

const CodeValue = styled.div`
    font-size: 20px;
    font-weight: 600;
    color: #e0e0e0;
    letter-spacing: 2px;
`;

const InfoText = styled.div`
    font-size: 14px;
    color: #888;
    line-height: 1.6;
`;

function QRCodeModal({ workspaceCode, onClose }) {
    return (
        <Portal>
            <ModalOverlay onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={onClose}>×</CloseButton>

                    <ModalTitle>친구 추가 QR 코드</ModalTitle>
                    <ModalDescription>
                        상대방이 이 QR 코드를 스캔하면<br />
                        자동으로 친구로 추가됩니다
                    </ModalDescription>

                    <QRCodeContainer>
                        <QRCodeSVG
                            value={workspaceCode}
                            size={200}
                            level="H"
                            includeMargin={false}
                        />
                    </QRCodeContainer>

                    <WorkspaceCodeDisplay>
                        <CodeLabel>WS 코드</CodeLabel>
                        <CodeValue>{workspaceCode}</CodeValue>
                    </WorkspaceCodeDisplay>

                    <InfoText>
                        상대방이 QR 스캔 버튼으로<br />
                        이 코드를 스캔하면 즉시 친구가 됩니다
                    </InfoText>
                </ModalContent>
            </ModalOverlay>
        </Portal>
    );
}

export default QRCodeModal;
