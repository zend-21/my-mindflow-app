// Toast 컴포넌트
import styled, { keyframes } from 'styled-components';

// 애니메이션
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// 스타일 컴포넌트
const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
  background: rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.2s ease-out;
`;

const ToastBox = styled.div`
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 24px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
  text-align: center;
  min-width: 200px;
  z-index: 12001;
`;

/**
 * Toast 메시지 컴포넌트
 * @param {string} message - 표시할 메시지
 */
const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <ToastOverlay>
      <ToastBox>{message}</ToastBox>
    </ToastOverlay>
  );
};

export default Toast;
