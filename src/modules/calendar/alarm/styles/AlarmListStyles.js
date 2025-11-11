// src/modules/calendar/alarm/styles/AlarmListStyles.js
// 알람 리스트 관련 스타일 컴포넌트

import styled from 'styled-components';
import { ALARM_COLORS } from '../constants/alarmConstants';

export const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

export const AlarmItem = styled.div`
  position: relative;
  background: ${props => {
    if (props.$isPending) return '#e9ecef';
    return '#f8f9fa';
  }};
  border: ${props => {
    if (props.$isModified) return `2px dashed ${ALARM_COLORS.danger}`;
    if (props.$isPending) return '2px dashed #adb5bd';
    return '1px solid #ced4da';
  }};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const AlarmInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const AlarmTimeDisplay = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #343a40;
`;

export const AlarmRelativeTime = styled.span`
  font-size: 12px;
  color: ${ALARM_COLORS.muted};
`;

export const SortContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
`;

export const SortButton = styled.button`
  background: ${props => props.$active ? ALARM_COLORS.primary : 'white'};
  color: ${props => props.$active ? 'white' : '#495057'};
  border: 1px solid ${props => props.$active ? ALARM_COLORS.primary : '#dee2e6'};
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? ALARM_COLORS.primary : '#f8f9fa'};
  }
`;
