// src/components/collaboration/QRScannerModal.jsx
// QR 코드를 스캔하여 친구 추가하는 모달

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Html5Qrcode } from 'html5-qrcode';
import { Search } from 'lucide-react';
import Portal from '../Portal';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

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

const SearchSection = styled.div`
    margin-top: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchLabel = styled.div`
    font-size: 13px;
    color: #81c784;
    margin-bottom: 8px;
    text-align: left;
`;

const SearchInputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const SearchInput = styled.input`
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e0e0e0;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-align: center;

    &::placeholder {
        color: #666;
        text-transform: none;
        letter-spacing: normal;
        font-weight: 400;
    }

    &:focus {
        outline: none;
        border-color: #4a90e2;
    }
`;

const SearchButton = styled.button`
    width: 100%;
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid rgba(74, 144, 226, 0.4);
    color: #4a90e2;
    padding: 14px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
        background: rgba(74, 144, 226, 0.3);
    }

    &:active {
        transform: scale(0.98);
    }
`;

function QRScannerModal({ onClose, onCodeScanned }) {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null);
    const [scannedCode, setScannedCode] = useState(''); // 스캔된 6자리 코드

    // 콜백을 ref로 저장하여 useEffect 재실행 방지
    const onCloseRef = useRef(onClose);
    const onCodeScannedRef = useRef(onCodeScanned);

    // ref 동기화
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    useEffect(() => { onCodeScannedRef.current = onCodeScanned; }, [onCodeScanned]);

    // QR 코드에서 6자리 코드만 추출 (ws- 또는 WS- 접두사 제거)
    const extractCode = (rawText) => {
        // 대소문자 무관하게 ws- 또는 WS- 접두사 제거
        const cleaned = rawText.replace(/^[wW][sS]-/i, '');
        // 6자리만 추출 (공백, 하이픈 등 제거)
        return cleaned.replace(/[-\s]/g, '').substring(0, 6).toUpperCase();
    };

    // QR 코드 인식 후 처리 함수 - 6자리 코드만 추출해서 검색창에 표시
    const handleQRCodeResult = (decodedText) => {
        console.log('✅ QR 스캔 성공:', decodedText);

        // WS 코드 형식 검증 (예: WS-A3B7-9X 또는 ws-a3b79x)
        if (!decodedText.toUpperCase().startsWith('WS-')) {
            setMessage({ type: 'error', text: '올바른 WS 코드가 아닙니다' });
            return false;
        }

        // 6자리 코드 추출
        const extractedCode = extractCode(decodedText);
        console.log('📝 추출된 코드:', extractedCode);

        // 검색창에 코드 표시
        setScannedCode(extractedCode);
        setMessage({ type: 'success', text: 'QR 코드에서 ID를 추출했습니다!' });
        return true;
    };

    // 검색 버튼 클릭 - 부모 컴포넌트로 코드 전달
    const handleSearch = () => {
        if (!scannedCode) {
            setMessage({ type: 'error', text: 'QR 코드를 먼저 스캔해주세요' });
            return;
        }

        if (onCodeScannedRef.current) {
            onCodeScannedRef.current(scannedCode);
        }
        onCloseRef.current();
    };

    useEffect(() => {
        console.log('🔄 QRScannerModal useEffect 시작');

        let html5QrCode = null;
        let isMounted = true;
        let scannerStarted = false;

        const requestCameraPermission = async () => {
            // Capacitor 네이티브 앱인 경우 권한 요청
            if (Capacitor.isNativePlatform()) {
                try {
                    console.log('📷 카메라 권한 요청 시작...');
                    const permission = await Camera.requestPermissions({ permissions: ['camera'] });
                    console.log('📷 카메라 권한 상태:', permission.camera);
                    if (permission.camera !== 'granted') {
                        setMessage({
                            type: 'error',
                            text: '카메라 권한을 허용해주세요'
                        });
                        return false;
                    }
                } catch (error) {
                    console.error('카메라 권한 요청 실패:', error);
                }
            } else {
                console.log('🌐 웹 환경 - 브라우저 권한 사용');
            }
            return true;
        };

        const startScanner = async () => {
            console.log('🚀 startScanner 호출 - isMounted:', isMounted);

            // 컴포넌트가 언마운트되었으면 시작하지 않음
            if (!isMounted) {
                console.log('❌ 컴포넌트 언마운트됨 - 스캐너 시작 취소');
                return;
            }

            // DOM 요소가 준비될 때까지 대기
            const qrReaderElement = document.getElementById('qr-reader');
            if (!qrReaderElement) {
                console.log('⏳ qr-reader 요소 대기 중...');
                setTimeout(startScanner, 100);
                return;
            }
            console.log('✅ qr-reader DOM 요소 발견');

            // 먼저 카메라 권한 요청
            const hasPermission = await requestCameraPermission();
            console.log('📷 권한 결과:', hasPermission, 'isMounted:', isMounted);
            if (!hasPermission || !isMounted) {
                console.log('❌ 권한 없음 또는 언마운트됨 - 스캐너 시작 취소');
                return;
            }

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
                        if (!isMounted) return;

                        // 스캔 중지
                        setScanning(false);
                        scannerStarted = false;

                        try {
                            await html5QrCode.stop();
                        } catch (stopErr) {
                            console.log('스캐너 중지 중 오류 (무시):', stopErr);
                        }
                        html5QrCodeRef.current = null;

                        const success = handleQRCodeResult(decodedText);

                        // 실패 시 3초 후 다시 스캔 시작
                        if (!success && isMounted) {
                            setTimeout(() => {
                                if (isMounted) {
                                    setMessage(null);
                                    startScanner();
                                }
                            }, 3000);
                        }
                    },
                    (errorMessage) => {
                        // 스캔 실패는 로그 출력 안 함 (계속 시도 중이므로)
                    }
                );

                scannerStarted = true;
                if (isMounted) {
                    setScanning(true);
                    console.log('📸 QR 스캐너 시작');
                }
            } catch (error) {
                console.error('❌ QR 스캐너 시작 실패:', error);
                scannerStarted = false;
                html5QrCodeRef.current = null;

                if (isMounted) {
                    // 권한 거부 에러인 경우
                    if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
                        setMessage({
                            type: 'error',
                            text: '카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
                        });
                    } else {
                        setMessage({
                            type: 'error',
                            text: '카메라를 시작할 수 없습니다'
                        });
                    }
                }
            }
        };

        // 약간의 딜레이 후 스캐너 시작 (DOM 렌더링 대기)
        const timeoutId = setTimeout(startScanner, 100);

        // 컴포넌트 언마운트 시 스캐너 정지
        return () => {
            console.log('🛑 QRScannerModal cleanup 호출 - scannerStarted:', scannerStarted);
            isMounted = false;
            clearTimeout(timeoutId);

            if (html5QrCodeRef.current && scannerStarted) {
                console.log('🛑 스캐너 중지 시도...');
                html5QrCodeRef.current.stop().catch(err => {
                    // 이미 정지된 경우 무시
                    if (!err.message?.includes('not running')) {
                        console.log('QR 스캐너 정지 중:', err.message);
                    }
                });
            }
            html5QrCodeRef.current = null;
        };
    }, []); // 빈 배열 - 마운트/언마운트 시에만 실행

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
                        {scanning ? '카메라를 QR 코드에 맞춰주세요' : '준비 중...'}
                    </InfoText>

                    {/* 스캔된 코드가 있으면 검색창 표시 */}
                    {scannedCode && (
                        <SearchSection>
                            <SearchLabel>✅ 추출된 ID</SearchLabel>
                            <SearchInputWrapper>
                                <SearchInput
                                    type="text"
                                    value={scannedCode}
                                    readOnly
                                    placeholder="스캔된 ID"
                                />
                                <SearchButton onClick={handleSearch}>
                                    <Search size={18} />
                                    검색
                                </SearchButton>
                            </SearchInputWrapper>
                        </SearchSection>
                    )}
                </ModalContent>
            </ModalOverlay>
        </Portal>
    );
}

export default QRScannerModal;
