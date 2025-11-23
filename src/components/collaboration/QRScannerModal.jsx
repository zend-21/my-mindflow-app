// src/components/collaboration/QRScannerModal.jsx
// QR 코드를 스캔하여 친구 추가하는 모달

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Html5Qrcode } from 'html5-qrcode';
import Portal from '../Portal';
import { addFriendInstantly } from '../../services/friendService';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

const ModalContent = styled.div`
    background: #2a2d35;
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    position: relative;
    max-width: 500px;
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
    margin-bottom: 20px;
`;

const ScannerContainer = styled.div`
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    background: #1a1d24;

    #qr-reader {
        border: none;
    }

    #qr-reader__dashboard_section_csr {
        display: none !important;
    }

    video {
        border-radius: 12px;
    }
`;

const StatusMessage = styled.div`
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;

    ${props => props.type === 'success' && `
        background: rgba(76, 175, 80, 0.2);
        color: #81c784;
        border: 1px solid rgba(76, 175, 80, 0.3);
    `}

    ${props => props.type === 'error' && `
        background: rgba(244, 67, 54, 0.2);
        color: #e57373;
        border: 1px solid rgba(244, 67, 54, 0.3);
    `}

    ${props => props.type === 'info' && `
        background: rgba(33, 150, 243, 0.2);
        color: #64b5f6;
        border: 1px solid rgba(33, 150, 243, 0.3);
    `}
`;

const InfoText = styled.div`
    font-size: 14px;
    color: #888;
    line-height: 1.6;
`;

function QRScannerModal({ userId, onClose, onFriendAdded, onCodeScanned }) {
    const scannerRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        let html5QrCode = null;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("qr-reader");

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        console.log('✅ QR 스캔 성공:', decodedText);

                        // WS 코드 형식 검증 (예: WS-A3B7-9X)
                        if (!decodedText.startsWith('WS-')) {
                            setMessage({ type: 'error', text: '올바른 WS 코드가 아닙니다' });
                            return;
                        }

                        // 스캔 중지
                        setScanning(false);
                        html5QrCode.stop();

                        // onCodeScanned 콜백이 있으면 코드만 전달하고 종료 (친구 찾기 모드)
                        if (onCodeScanned) {
                            onCodeScanned(decodedText);
                            onClose();
                            return;
                        }

                        // 친구 추가 시도 (즉시 추가 모드)
                        setMessage({ type: 'info', text: '친구 추가 중...' });

                        const result = await addFriendInstantly(userId, decodedText);

                        if (result.success) {
                            setMessage({
                                type: 'success',
                                text: `${result.friend.name}님이 친구로 추가되었습니다!`
                            });

                            // 1초 후 모달 닫기
                            setTimeout(() => {
                                if (onFriendAdded) {
                                    onFriendAdded(result.friend);
                                }
                                onClose();
                            }, 1500);
                        } else {
                            setMessage({
                                type: 'error',
                                text: result.error || '친구 추가에 실패했습니다'
                            });

                            // 3초 후 다시 스캔 시작
                            setTimeout(() => {
                                setMessage(null);
                                startScanner();
                            }, 3000);
                        }
                    },
                    (errorMessage) => {
                        // 스캔 실패는 로그 출력 안 함 (계속 시도 중이므로)
                    }
                );

                setScanning(true);
                console.log('📸 QR 스캐너 시작');
            } catch (error) {
                console.error('❌ QR 스캐너 시작 실패:', error);
                setMessage({
                    type: 'error',
                    text: '카메라 접근 권한이 필요합니다'
                });
            }
        };

        startScanner();

        // 컴포넌트 언마운트 시 스캐너 정지
        return () => {
            if (html5QrCode && scanning) {
                html5QrCode.stop().catch(err => {
                    console.error('QR 스캐너 정지 오류:', err);
                });
            }
        };
    }, [userId, onFriendAdded, onClose]);

    const handleClose = () => {
        // 스캐너 정지는 useEffect cleanup에서 자동으로 처리됨
        onClose();
    };

    return (
        <Portal>
            <ModalOverlay onClick={handleClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={handleClose}>×</CloseButton>

                    <ModalTitle>QR 코드 스캔</ModalTitle>
                    <ModalDescription>
                        친구의 QR 코드를 카메라로 스캔하세요
                    </ModalDescription>

                    {message && (
                        <StatusMessage type={message.type}>
                            {message.text}
                        </StatusMessage>
                    )}

                    <ScannerContainer>
                        <div id="qr-reader" ref={scannerRef}></div>
                    </ScannerContainer>

                    <InfoText>
                        {scanning ? '카메라를 QR 코드에 맞춰주세요' : '준비 중...'}
                    </InfoText>
                </ModalContent>
            </ModalOverlay>
        </Portal>
    );
}

export default QRScannerModal;
