// Toast 컴포넌트
import styled, { keyframes } from 'styled-components';
import { X, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

// 애니메이션
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// 모달 오버레이 (ID 복사용)
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 500000;
  background: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.2s ease-out;
`;

// 간단한 토스트 오버레이 (일반 알림용)
const SimpleToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 500000;
  pointer-events: none;
  animation: ${props => props.$closing ? fadeOut : fadeIn} 0.2s ease-out;
`;

// 모달 박스 (ID 복사용)
const ModalBox = styled.div`
  background: rgba(30, 30, 30, 0.98);
  color: white;
  padding: 24px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
  text-align: center;
  min-width: 280px;
  max-width: 400px;
  z-index: 500001;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// 간단한 토스트 박스 (일반 알림용)
const SimpleToastBox = styled.div`
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.3s cubic-bezier(0.2, 0, 0, 1);
  text-align: center;
  min-width: 200px;
  max-width: 400px;
  pointer-events: auto;
  white-space: pre-line;
  line-height: 1.5;
`;

const ToastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

const ToastTitle = styled.div`
  font-size: 14px;
  color: #aaa;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const ToastMessage = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.5;
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const CopyButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Toast 메시지 컴포넌트
 * @param {string} message - 표시할 메시지
 * @param {function} onClose - 닫기 콜백 함수
 */
const Toast = ({ message, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  // "대화명 (ID: WXWF7U)" 형식에서 ID 추출
  const extractId = (msg) => {
    if (!msg || typeof msg !== 'string') return null;
    const match = msg.match(/\(ID:\s*([^)]+)\)/);
    return match ? match[1].trim() : null;
  };

  const id = extractId(message);

  // ID가 없으면 자동으로 사라지는 토스트
  useEffect(() => {
    if (!message || id) return; // ID가 있으면 자동 닫기 안 함

    const timer = setTimeout(() => {
      setClosing(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 200); // 페이드아웃 애니메이션 후 닫기
    }, 4000); // 4초 후 사라짐

    return () => clearTimeout(timer);
  }, [message, id, onClose]);

  const handleCopy = () => {
    const userId = extractId(message);
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!message) return null;

  // ID가 있으면 모달 형식 (수동 닫기)
  if (id) {
    return (
      <ModalOverlay onClick={handleClose}>
        <ModalBox onClick={(e) => e.stopPropagation()}>
          <ToastHeader>
            <ToastTitle>사용자 정보</ToastTitle>
            <CloseButton onClick={handleClose}>
              <X size={20} />
            </CloseButton>
          </ToastHeader>

          <ToastMessage>{message}</ToastMessage>

          <ButtonGroup>
            <CopyButton onClick={handleCopy} disabled={copied}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '복사됨!' : 'ID 복사'}
            </CopyButton>
          </ButtonGroup>
        </ModalBox>
      </ModalOverlay>
    );
  }

  // ID가 없으면 간단한 토스트 (자동 사라짐)
  return (
    <SimpleToastOverlay $closing={closing}>
      <SimpleToastBox>{message}</SimpleToastBox>
    </SimpleToastOverlay>
  );
};

export default Toast;
