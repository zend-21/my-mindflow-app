// src/modules/calendar/AlarmModal.styles.js
import styled from 'styled-components';
import { ALARM_COLORS, fadeIn, slideUp } from './alarm';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: ${fadeIn} 0.2s ease-out;
  touch-action: none;
  overscroll-behavior: contain;
`;

export const ModalContent = styled.div`
  background: ${props => props.$isPastDate ? '#1f2229' : '#2a2d35'};
  border-radius: 16px;
  width: 95vw;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.25s cubic-bezier(0.2, 0, 0, 1);
`;

export const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const HeaderTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  flex: 1;
  text-align: center;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${ALARM_COLORS.muted};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const FormArea = styled.div`
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${ALARM_COLORS.primary};
  }
`;

export const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  background: #333842;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
  }
`;

export const TimeInput = styled.input`
  width: 50px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
  text-align: center;
  background: #333842;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  background: #333842;
  color: #e0e0e0;

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

export const SetCurrentTimeButton = styled.button`
  padding: 8px 7px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #333842;
  font-size: 13px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryLight};
    border-color: ${ALARM_COLORS.primary};
    color: ${ALARM_COLORS.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background: ${ALARM_COLORS.primary};
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AlarmBox = styled.div`
  padding: 16px;
  background: #333842;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 12px;
`;

export const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' && `
    background: ${ALARM_COLORS.primary};
    color: white;

    &:hover {
      background: #0056b3;
    }
  `}

  ${props => props.$variant === 'secondary' && `
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  `}
`;

export const PreviewButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  margin-top: 16px;
  border-radius: 8px;
  border: 1px solid ${ALARM_COLORS.primary};
  background: rgba(74, 144, 226, 0.1);
  color: ${ALARM_COLORS.primary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba(74, 144, 226, 0.2);
    border-color: #0056b3;
  }

  &:active {
    transform: scale(0.98);
  }
`;
