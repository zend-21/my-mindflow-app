// 스플래시 스크린 - 앱 시작 시 로딩 화면
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const zoomIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0a0b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: ${props => props.$fadeOut ? fadeOut : fadeIn} 0.4s ease forwards;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${zoomIn} 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: center center;
  will-change: transform, opacity;
`;

const LogoMark = styled.div`
  width: 64px;
  height: 64px;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 8px;
`;

const LogoText = styled.span`
  font-size: 38px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1;
`;

const AppName = styled.h1`
  font-size: 22px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  letter-spacing: 1px;
`;

const Tagline = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: rgba(200, 230, 255, 0.95);
  margin: 28px 0 0 0;
  letter-spacing: 2px;
  font-family: monospace;
  text-shadow:
    0 0 10px rgba(130, 200, 255, 0.8),
    0 0 25px rgba(130, 200, 255, 0.5),
    0 0 40px rgba(130, 200, 255, 0.3);
`;

const BottomText = styled.div`
  position: absolute;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const AppTitle = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 400;
  letter-spacing: 1px;
`;

const SinceText = styled.span`
  font-size: 9px;
  color: rgba(255, 255, 255, 0.25);
  font-weight: 300;
  letter-spacing: 1.5px;
`;

const SplashScreen = ({
  show = true,
  onComplete,
  duration = 1400
}) => {
  const [visible, setVisible] = useState(show);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <Container $fadeOut={fadeOut}>
      <Content>
        <LogoMark>
          <LogoText>S</LogoText>
        </LogoMark>
        <AppName>셰어노트</AppName>
        <Tagline>모두가 함께 만드는 공유노트</Tagline>
      </Content>
      <BottomText>
        <AppTitle>Share Note</AppTitle>
        <SinceText>SINCE 2026</SinceText>
      </BottomText>
    </Container>
  );
};

export default SplashScreen;
