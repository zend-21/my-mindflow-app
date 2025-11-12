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
    if (props.$isPending) return '#3d424d';
    return '#333842';
  }};
  border: ${props => {
    if (props.$isModified) return `2px dashed ${ALARM_COLORS.danger}`;
    if (props.$isPending) return '2px dashed rgba(255, 255, 255, 0.2)';
    return '1px solid rgba(255, 255, 255, 0.1)';
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
  color: #e0e0e0;
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
  background: ${props => props.$active ? ALARM_COLORS.primary : '#333842'};
  color: ${props => props.$active ? 'white' : '#e0e0e0'};
  border: 1px solid ${props => props.$active ? ALARM_COLORS.primary : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? ALARM_COLORS.primary : '#3d424d'};
  }
`;
