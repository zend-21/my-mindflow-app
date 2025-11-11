// src/modules/calendar/alarm/styles/ButtonStyles.js
// 버튼 관련 스타일 컴포넌트

import styled from 'styled-components';
import { ALARM_COLORS } from '../constants/alarmConstants';

export const DeleteButton = styled.button`
  background: ${ALARM_COLORS.danger};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }
`;

export const RegisterButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #218838;
  }
`;

export const AddButton = styled.button`
  background: ${ALARM_COLORS.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #357abd;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

export const PresetButton = styled.button`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 4px;
  font-size: 12px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${ALARM_COLORS.primary};
    color: white;
    border-color: ${ALARM_COLORS.primary};
  }
`;

export const AddAlarmSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PresetGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

export const CustomInputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CustomInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
