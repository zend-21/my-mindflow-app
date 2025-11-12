// src/modules/calendar/alarm/styles/ModalStyles.js
// 모달 기본 스타일 컴포넌트

import styled from 'styled-components';
import { fadeIn, slideUp } from './animations';
import { ALARM_COLORS } from '../constants/alarmConstants';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: ${fadeIn} 0.2s ease-out;
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

  .required {
    color: ${ALARM_COLORS.danger};
    margin-left: 4px;
  }
`;
