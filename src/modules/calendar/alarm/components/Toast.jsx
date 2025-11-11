// src/modules/calendar/alarm/components/Toast.jsx
// 자동으로 사라지는 토스트 알림 컴포넌트

import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../../../../components/Portal';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 20px 32px;
  border-radius: 12px;
  font-size: 16px;
  z-index: 15000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s ease-out;
  min-width: 280px;
  max-width: 500px;
  text-align: center;
  white-space: pre-line;
`;

export const Toast = ({ message, isOpen, onClose, duration = 2500 }) => {
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setIsClosing(true);
        // Wait for fade-out animation before calling onClose
        setTimeout(() => {
          onClose();
          setIsClosing(false);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsClosing(false);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <Portal>
      <ToastContainer $isClosing={isClosing}>
        {message}
      </ToastContainer>
    </Portal>
  );
};
