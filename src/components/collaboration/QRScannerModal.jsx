// src/components/collaboration/QRScannerModal.jsx
// QR 코드를 스캔하여 친구 추가하는 모달

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Html5Qrcode } from 'html5-qrcode';
import { Image } from 'lucide-react';
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
    margin-bottom: 16px;
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
    margin-bottom: 16px;
`;

const GalleryButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: #e0e0e0;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

function QRScannerModal({ userId, onClose, onFriendAdded, onCodeScanned }) {
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null);
    const [processingImage, setProcessingImage] = useState(false);

    // QR 코드 인식 후 처리 함수
    const handleQRCodeResult = async (decodedText) => {
        console.log('✅ QR 스캔 성공:', decodedText);

        // WS 코드 형식 검증 (예: WS-A3B7-9X)
        if (!decodedText.startsWith('WS-')) {
            setMessage({ type: 'error', text: '올바른 WS 코드가 아닙니다' });
            return false;
        }

        // onCodeScanned 콜백이 있으면 코드만 전달하고 종료 (친구 찾기 모드)
        if (onCodeScanned) {
            onCodeScanned(decodedText);
            onClose();
            return true;
        }

        // 친구 추가 시도 (즉시 추가 모드)
        setMessage({ type: 'info', text: '친구 추가 중...' });

        const result = await addFriendInstantly(userId, decodedText);

        if (result.success) {
            setMessage({
                type: 'success',
                text: `${result.friend.name}님이 친구로 추가되었습니다!`
            });

            // 1.5초 후 모달 닫기
            setTimeout(() => {
                if (onFriendAdded) {
                    onFriendAdded(result.friend);
                }
                onClose();
            }, 1500);
            return true;
        } else {
            setMessage({
                type: 'error',
                text: result.error || '친구 추가에 실패했습니다'
            });
            return false;
        }
    };

    useEffect(() => {
        let html5QrCode = null;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        // 스캔 중지
                        setScanning(false);
                        await html5QrCode.stop();
                        html5QrCodeRef.current = null;

                        const success = await handleQRCodeResult(decodedText);

                        // 실패 시 3초 후 다시 스캔 시작
                        if (!success) {
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
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(err => {
                    console.error('QR 스캐너 정지 오류:', err);
                });
                html5QrCodeRef.current = null;
            }
        };
    }, [userId, onFriendAdded, onClose, onCodeScanned]);

    // 갤러리에서 이미지 선택
    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    // 갤러리 이미지에서 QR 스캔
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingImage(true);
        setMessage({ type: 'info', text: '이미지에서 QR 코드를 찾는 중...' });

        try {
            // 카메라 스캐너 일시 중지
            if (html5QrCodeRef.current && scanning) {
                await html5QrCodeRef.current.stop();
                setScanning(false);
            }

            // 이미지에서 QR 스캔
            const html5QrCode = new Html5Qrcode("qr-reader-file");
            const decodedText = await html5QrCode.scanFile(file, true);

            await handleQRCodeResult(decodedText);
        } catch (error) {
            console.error('이미지 QR 스캔 실패:', error);
            setMessage({
                type: 'error',
                text: '이미지에서 QR 코드를 찾을 수 없습니다'
            });

            // 3초 후 카메라 스캔 재시작
            setTimeout(() => {
                setMessage(null);
                window.location.reload(); // 스캐너 재초기화를 위해 새로고침
            }, 3000);
        } finally {
            setProcessingImage(false);
            // input 초기화
            e.target.value = '';
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Portal>
            <ModalOverlay onClick={handleClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={handleClose}>×</CloseButton>

                    <ModalTitle>QR 코드 스캔</ModalTitle>
                    <ModalDescription>
                        친구의 QR 코드를 스캔하세요
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
                        {processingImage ? '이미지 처리 중...' :
                         scanning ? '카메라를 QR 코드에 맞춰주세요' : '준비 중...'}
                    </InfoText>

                    <GalleryButton
                        onClick={handleGalleryClick}
                        disabled={processingImage}
                    >
                        <Image size={20} />
                        갤러리에서 QR 이미지 선택
                    </GalleryButton>

                    <HiddenInput
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    {/* 파일 스캔용 숨김 div */}
                    <div id="qr-reader-file" style={{ display: 'none' }}></div>
                </ModalContent>
            </ModalOverlay>
        </Portal>
    );
}

export default QRScannerModal;
