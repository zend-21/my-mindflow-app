// src/modules/calendar/alarm/components/AlarmItemComponent_SIMPLE.jsx
// 개별 알람 아이템 컴포넌트 - 심플 버전

import React from 'react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { ALARM_COLORS } from '../';

const AlarmItem = styled.div`
  position: relative;
  background: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const AlarmInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: 8px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
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

const AlarmActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const EditButton = styled.button`
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0a800;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AlarmItemComponent = ({ alarm, onToggle, onDelete, onEdit }) => {
  const isEnabled = alarm.enabled !== false;

  return (
    <AlarmItem>
      <AlarmInfo>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
          {/* 토글 스위치 - 항상 표시, OFF 시 반투명 */}
          <ToggleSwitch style={{ opacity: isEnabled ? 1 : 0.3 }}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => onToggle && onToggle(alarm.id)}
            />
            <span className="slider"></span>
          </ToggleSwitch>

          {/* 기념일 아이콘 */}
          {alarm.isAnniversary && (
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: ALARM_COLORS.primary,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 'bold',
              flexShrink: 0,
              opacity: isEnabled ? 1 : 0.5,
              marginTop: '4px'
            }}>
              기
            </div>
          )}

          {/* 타이틀 */}
          <div style={{
            fontSize: '15px',
            color: ALARM_COLORS.primary,
            opacity: isEnabled ? 1 : 0.5,
            wordBreak: 'break-all',
            lineHeight: '1.3',
            maxWidth: '8em',
            display: 'inline-block',
            minHeight: 'calc(1.3em * 2)',
            marginTop: '2px'
          }}>
            {alarm.title || '제목 없음'}
          </div>
        </div>

        {/* 시간 정보 */}
        <div style={{
          fontSize: '12px',
          color: ALARM_COLORS.muted,
          opacity: isEnabled ? 1 : 0.5
        }}>
          {alarm.calculatedTime ? format(new Date(alarm.calculatedTime), 'yyyy-MM-dd HH:mm') : '시간 미정'}
        </div>
      </AlarmInfo>

      {/* 액션 버튼 */}
      <AlarmActions>
        {isEnabled ? (
          <>
            <EditButton onClick={() => onEdit && onEdit(alarm)}>
              수정
            </EditButton>
            <DeleteButton onClick={() => onDelete && onDelete(alarm)}>
              삭제
            </DeleteButton>
          </>
        ) : (
          // 일시중지 상태 - 아이콘 표시
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: '#999',
            padding: '4px 0'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="22" height="22" rx="3" stroke={ALARM_COLORS.primary} strokeWidth="2"/>
              <rect x="8" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
              <rect x="13.5" y="7" width="2.5" height="10" fill={ALARM_COLORS.primary}/>
            </svg>
            <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
              <div>알람</div>
              <div>일시중지</div>
            </div>
          </div>
        )}
      </AlarmActions>
    </AlarmItem>
  );
};
