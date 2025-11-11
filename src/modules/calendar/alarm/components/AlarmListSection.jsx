// src/modules/calendar/alarm/components/AlarmListSection.jsx
// 알람 리스트 표시 섹션 컴포넌트

import React from 'react';
import styled from 'styled-components';
import { ALARM_COLORS } from '../';
import { AlarmItemComponent } from './AlarmItem';

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #495057;
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

const AlarmBox = styled.div`
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
`;

const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const SortContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  justify-content: flex-end;
`;

const SortButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.$active ? ALARM_COLORS.primary : '#dee2e6'};
  background: ${props => props.$active ? ALARM_COLORS.primary : 'white'};
  color: ${props => props.$active ? 'white' : '#6c757d'};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${ALARM_COLORS.primary};
    background: ${props => props.$active ? ALARM_COLORS.primary : '#f8f9fa'};
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: ${ALARM_COLORS.muted};
  font-size: 14px;
`;

export const AlarmListSection = ({
  title,
  icon,
  alarms = [],
  scheduleData,
  showSort = false,
  sortBy,
  sortDirection,
  onToggleSort,
  onToggleAlarm,
  onEditAlarm,
  onDeleteAlarm,
  emptyMessage = '등록된 알람이 없습니다.',
}) => {
  if (alarms.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionTitle>
        {icon}
        {title} ({alarms.length}개)
      </SectionTitle>

      <AlarmBox>
        {showSort && (
          <SortContainer>
            <SortButton
              $active={sortBy === 'registration'}
              onClick={() => onToggleSort('registration')}
            >
              등록순{sortBy === 'registration' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
            </SortButton>
            <SortButton
              $active={sortBy === 'time'}
              onClick={() => onToggleSort('time')}
            >
              시간순{sortBy === 'time' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
            </SortButton>
          </SortContainer>
        )}

        <AlarmList>
          {alarms.length === 0 ? (
            <EmptyMessage>{emptyMessage}</EmptyMessage>
          ) : (
            alarms.map((alarm) => (
              <AlarmItemComponent
                key={alarm.id}
                alarm={alarm}
                scheduleData={scheduleData}
                onToggle={onToggleAlarm}
                onEdit={onEditAlarm}
                onDelete={onDeleteAlarm}
              />
            ))
          )}
        </AlarmList>
      </AlarmBox>
    </Section>
  );
};
