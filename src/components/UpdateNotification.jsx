// 앱 업데이트 알림 컴포넌트
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { checkForUpdates, reloadApp, dismissUpdateNotification, shouldShowUpdateNotification } from '../utils/versionCheck';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const NotificationBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.$forceUpdate ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #4a90e2, #357abd)'};
  color: white;
  padding: 16px 20px;
  z-index: 600000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: ${slideDown} 0.4s cubic-bezier(0.2, 0, 0, 1);
`;

const NotificationContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const MessageSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
`;

const MessageText = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Description = styled.div`
  font-size: 13px;
  opacity: 0.95;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

const UpdateButton = styled.button`
  background: rgba(255, 255, 255, 0.95);
  color: ${props => props.$forceUpdate ? '#c0392b' : '#357abd'};
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DismissButton = styled.button`
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.8);
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  opacity: 0.8;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
  }
`;

const VersionInfo = styled.div`
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
  font-family: 'Roboto Mono', monospace;
`;

/**
 * 앱 업데이트 알림 컴포넌트
 */
const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 앱 시작 시 버전 체크
    const checkVersion = async () => {
      const info = await checkForUpdates();

      if (info && info.hasUpdate) {
        // 강제 업데이트이거나 알림 표시 조건을 만족하면 표시
        if (info.forceUpdate || shouldShowUpdateNotification()) {
          setUpdateInfo(info);
          setIsVisible(true);
        }
      }
    };

    checkVersion();

    // 주기적으로 버전 체크 (30분마다)
    const interval = setInterval(checkVersion, 1000 * 60 * 30);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // 업데이트 실행 (캐시 제거 후 새로고침)
    reloadApp(true);
  };

  const handleDismiss = () => {
    // 나중에 알림 (24시간 동안 숨김)
    dismissUpdateNotification();
    setIsVisible(false);
  };

  const handleClose = () => {
    // 이번 세션 동안만 숨김 (강제 업데이트가 아닌 경우만)
    if (!updateInfo?.forceUpdate) {
      setIsVisible(false);
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <NotificationBanner $forceUpdate={updateInfo.forceUpdate}>
      <NotificationContent>
        <MessageSection>
          <IconWrapper>
            {updateInfo.forceUpdate ? (
              <AlertCircle size={28} strokeWidth={2.5} />
            ) : (
              <RefreshCw size={24} />
            )}
          </IconWrapper>

          <MessageText>
            <Title>
              {updateInfo.forceUpdate ? '⚠️ 필수 업데이트' : '🎉 새로운 버전 출시'}
            </Title>
            <Description>
              {updateInfo.updateMessage}
            </Description>
            <VersionInfo>
              {updateInfo.currentVersion} → {updateInfo.latestVersion}
            </VersionInfo>
          </MessageText>
        </MessageSection>

        <ButtonGroup>
          <UpdateButton
            onClick={handleUpdate}
            $forceUpdate={updateInfo.forceUpdate}
          >
            <RefreshCw size={16} />
            지금 업데이트
          </UpdateButton>

          {!updateInfo.forceUpdate && (
            <DismissButton onClick={handleDismiss}>
              나중에
            </DismissButton>
          )}
        </ButtonGroup>

        {!updateInfo.forceUpdate && (
          <CloseButton onClick={handleClose}>
            <X size={20} />
          </CloseButton>
        )}
      </NotificationContent>
    </NotificationBanner>
  );
};

export default UpdateNotification;
