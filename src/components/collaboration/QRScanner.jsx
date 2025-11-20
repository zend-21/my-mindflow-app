// QR 스캐너 컴포넌트 - 친구 ID QR 코드 스캔

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { X, Camera, AlertCircle } from 'lucide-react';
import { searchByUniqueId } from '../../services/userIdService';
import { sendFriendRequest } from '../../services/collaborationService';
import { auth } from '../../firebase/config';

const QRScanner = ({ isOpen, onClose, onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [foundUser, setFoundUser] = useState(null);
  const [sending, setSending] = useState(false);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('카메라 접근 권한이 필요합니다');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setScanning(false);
  };

  const startScanning = () => {
    // QR 코드 스캔을 위한 간단한 구현
    // 실제로는 jsQR 또는 @zxing/library 같은 라이브러리 사용 권장
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const video = videoRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 여기에 QR 코드 디코딩 로직 추가
          // 현재는 수동 입력으로 대체
        }
      }
    }, 500);
  };

  const handleManualInput = async (uniqueId) => {
    try {
      const user = await searchByUniqueId(uniqueId);
      if (user) {
        setFoundUser(user);
      } else {
        setError('사용자를 찾을 수 없습니다');
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다');
    }
  };

  const handleSendRequest = async () => {
    if (!foundUser) return;

    setSending(true);
    try {
      await sendFriendRequest(auth.currentUser.uid, foundUser.id);
      alert('친구 요청을 보냈습니다!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('친구 요청 실패: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>QR 코드 스캔</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {error && (
            <ErrorBox>
              <AlertCircle size={20} />
              <ErrorText>{error}</ErrorText>
            </ErrorBox>
          )}

          {foundUser ? (
            <UserCard>
              <UserIcon>{foundUser.displayName?.charAt(0) || '?'}</UserIcon>
              <UserName>{foundUser.displayName}</UserName>
              <UserId>@{foundUser.uniqueId}</UserId>
              <SendButton onClick={handleSendRequest} disabled={sending}>
                {sending ? '전송 중...' : '친구 요청 보내기'}
              </SendButton>
            </UserCard>
          ) : (
            <>
              <VideoContainer>
                <Video ref={videoRef} autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <ScanOverlay>
                  <ScanFrame />
                  <ScanText>QR 코드를 화면에 맞춰주세요</ScanText>
                </ScanOverlay>
              </VideoContainer>

              <InfoText>
                <Camera size={16} />
                QR 코드 스캔이 작동하지 않으면, 고유 ID를 직접 입력하세요
              </InfoText>
            </>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

// 스타일 정의
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: white;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 8px;
  display: flex;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: black;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const ScanFrame = styled.div`
  width: 200px;
  height: 200px;
  border: 3px solid #5ebe26;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
`;

const ScanText = styled.div`
  margin-top: 24px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const InfoText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  color: #ff6b6b;
`;

const ErrorText = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: white;
`;

const UserName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: white;
`;

const UserId = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const SendButton = styled.button`
  width: 100%;
  padding: 14px;
  background: ${props => props.disabled ? 'rgba(94, 190, 38, 0.3)' : '#5ebe26'};
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #4fa01f;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(94, 190, 38, 0.3);
  }
`;

export default QRScanner;
