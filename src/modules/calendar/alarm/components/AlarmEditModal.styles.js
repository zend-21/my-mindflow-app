// src/modules/calendar/alarm/components/AlarmEditModal.styles.js
// AlarmEditModal 컴포넌트의 Styled Components

import styled from 'styled-components';
import { ALARM_COLORS } from '../';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
  touch-action: none;
  overscroll-behavior: contain;
`;

export const ModalContent = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  border-radius: 16px;
  width: 95vw;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
`;

export const TimeInput = styled.input`
  width: 60px;
  padding: 14px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
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

export const ToggleButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #333842;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background: #3d424d;
  }
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
