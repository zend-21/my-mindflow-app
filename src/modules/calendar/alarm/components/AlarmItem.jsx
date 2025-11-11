// src/modules/calendar/alarm/components/AlarmItem.jsx
// 개별 알람 아이템 컴포넌트

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styled from 'styled-components';
import { ALARM_COLORS, getDaysUntilAutoDelete, ClockIcon } from '../';

const AlarmItemContainer = styled.div`
  position: relative;
  background: ${props => {
    if (props.$isPending) return '#e9ecef';
    if (props.$isModified) return '#fff9e6';
    if (props.$enabled === false) return '#f8f9fa';
    return '#ffffff';
  }};
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => {
    if (props.$isModified) return '#ffc107';
    return '#dee2e6';
  }};
  display: flex;
  align-items: flex-start;
  gap: 10px;

  ${props => props.$enabled === false && `
    opacity: 0.6;
  `}
`;

const AlarmInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AlarmTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #343a40;
  word-break: break-word;
`;

const AlarmTimeDisplay = styled.div`
  font-size: 14px;
  color: ${ALARM_COLORS.text};
  font-weight: 500;
`;

const AlarmRelativeTime = styled.div`
  font-size: 12px;
  color: ${ALARM_COLORS.muted};
  margin-top: 2px;
`;

const AlarmBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;

  ${props => props.$type === 'anniversary' && `
    background: ${ALARM_COLORS.primary};
    color: white;
  `}

  ${props => props.$type === 'repeated' && `
    background: #e3f2fd;
    color: #1976d2;
  `}

  ${props => props.$type === 'expired' && `
    background: #ffebee;
    color: #c62828;
  `}

  ${props => props.$type === 'autoDelete' && `
    background: #fff3cd;
    color: #856404;
  `}
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;

  svg {
    width: 14px;
    height: 14px;
    color: ${ALARM_COLORS.muted};
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: '';
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: ${ALARM_COLORS.primary};
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: ${ALARM_COLORS.danger};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #c82333;
  }
`;

const EditButton = styled.button`
  background: ${ALARM_COLORS.primary};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #0056b3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`;

export const AlarmItemComponent = ({
  alarm,
  isPending = false,
  scheduleData,
  onToggle,
  onEdit,
  onDelete,
}) => {
  // 등록일과 현재 보는 날짜 비교
  const alarmDateStr = format(new Date(alarm.calculatedTime), 'yyyy-MM-dd');
  const currentDateStr = format(new Date(scheduleData.date), 'yyyy-MM-dd');
  const isRegisteredToday = alarmDateStr === currentDateStr;
  const hasRepeat = alarm.anniversaryRepeat && alarm.anniversaryRepeat !== 'none';
  const isRepeated = alarm.isRepeated && !isRegisteredToday;

  // 자동삭제 관련
  const daysUntilDelete = getDaysUntilAutoDelete(alarm);
  const showAutoDeleteWarning = daysUntilDelete !== null && daysUntilDelete <= 3;

  // 알람 시간 표시
  const alarmTime = format(new Date(alarm.calculatedTime), 'M월 d일 (E) HH:mm', { locale: ko });

  // 상대 시간 계산
  const getRelativeTime = () => {
    const now = new Date();
    const alarmDate = new Date(alarm.calculatedTime);
    const diffMs = alarmDate - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return '지난 알람';
    } else if (diffMins < 60) {
      return `${diffMins}분 후`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 ${diffMins % 60}분 후`;
    } else {
      return `${diffDays}일 후`;
    }
  };

  return (
    <AlarmItemContainer
      $isPending={isPending}
      $enabled={alarm.enabled}
      $isModified={alarm.isModified}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', width: '100%' }}>
        {onToggle && (
          <ToggleSwitch style={{ opacity: alarm.disabledAt ? 0.5 : 1 }}>
            <input
              type="checkbox"
              checked={alarm.enabled !== false}
              disabled={!!alarm.disabledAt}
              onChange={() => onToggle(alarm.id, isRepeated)}
            />
            <span className="slider"></span>
          </ToggleSwitch>
        )}

        <AlarmInfo>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            {/* 기념일 배지 또는 알람 아이콘 */}
            {alarm.isAnniversary ? (
              <AlarmBadge $type="anniversary">기</AlarmBadge>
            ) : (
              <IconWrapper>
                <ClockIcon />
              </IconWrapper>
            )}

            {/* 반복 배지 */}
            {isRepeated && hasRepeat && (
              <AlarmBadge $type="repeated">반복</AlarmBadge>
            )}

            {/* 종료됨 배지 */}
            {alarm.disabledAt && (
              <AlarmBadge $type="expired">종료됨</AlarmBadge>
            )}

            {/* 자동삭제 경고 배지 */}
            {showAutoDeleteWarning && (
              <AlarmBadge $type="autoDelete">
                {daysUntilDelete}일 후 자동삭제
              </AlarmBadge>
            )}
          </div>

          <AlarmTitle>{alarm.title}</AlarmTitle>

          <AlarmTimeDisplay>{alarmTime}</AlarmTimeDisplay>
          <AlarmRelativeTime>{getRelativeTime()}</AlarmRelativeTime>

          {hasRepeat && (
            <div style={{ fontSize: '12px', color: ALARM_COLORS.muted, marginTop: '4px' }}>
              {alarm.anniversaryRepeat === 'daily' && '매일 반복'}
              {alarm.anniversaryRepeat === 'weekly' && '매주 반복'}
              {alarm.anniversaryRepeat === 'monthly' && '매월 반복'}
              {alarm.anniversaryRepeat === 'yearly' && '매년 반복'}
            </div>
          )}

          {(onEdit || onDelete) && (
            <ButtonGroup>
              {onEdit && (
                <EditButton onClick={() => onEdit(alarm)}>
                  수정
                </EditButton>
              )}
              {onDelete && (
                <DeleteButton onClick={() => onDelete(alarm)}>
                  삭제
                </DeleteButton>
              )}
            </ButtonGroup>
          )}
        </AlarmInfo>
      </div>
    </AlarmItemContainer>
  );
};
