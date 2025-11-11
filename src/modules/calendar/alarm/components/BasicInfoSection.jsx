// src/modules/calendar/alarm/components/BasicInfoSection.jsx
// 알람 타이틀과 이벤트 시간 입력 섹션

import React from 'react';
import styled from 'styled-components';
import { TitleIcon, ClockIcon, ALARM_COLORS } from '../';

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
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const TimeInput = styled.input`
  width: 60px;
  padding: 14px 10px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 16px;
  text-align: center;
  background: white;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

export const BasicInfoSection = ({
  alarmTitle,
  onTitleChange,
  hourInput,
  minuteInput,
  onHourChange,
  onMinuteChange,
  disabled = false,
}) => {
  const calculateByteLength = (str) => {
    return Array.from(str).reduce((acc, char) => {
      return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
    }, 0);
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (calculateByteLength(value) <= 20) {
      onTitleChange(value);
    }
  };

  const handleHourChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      onHourChange('');
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue >= 0 && numValue <= 23) {
      onHourChange(value);
    }
  };

  const handleMinuteChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      onMinuteChange('');
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue >= 0 && numValue <= 59) {
      onMinuteChange(value);
    }
  };

  return (
    <>
      <Section style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        <SectionTitle>
          <TitleIcon />
          알람 타이틀<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
        </SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Input
            type="text"
            placeholder="예: 수빈이 생일"
            value={alarmTitle}
            onChange={handleTitleChange}
            disabled={disabled}
            style={{ flex: 1 }}
          />
          <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>
            {calculateByteLength(alarmTitle)}/20
          </div>
        </div>
      </Section>

      <Section style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        <SectionTitle>
          <ClockIcon />
          알람 시간<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
        </SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TimeInput
            type="text"
            placeholder="0-23"
            value={hourInput}
            onChange={handleHourChange}
            onBlur={(e) => {
              const val = e.target.value;
              if (val && val.length === 1) {
                onHourChange('0' + val);
              }
            }}
            maxLength="2"
            disabled={disabled}
          />
          <span style={{ fontSize: '14px', color: '#6c757d' }}>시</span>
          <TimeInput
            type="text"
            placeholder="0-59"
            value={minuteInput}
            onChange={handleMinuteChange}
            onBlur={(e) => {
              const val = e.target.value;
              if (val && val.length === 1) {
                onMinuteChange('0' + val);
              }
            }}
            maxLength="2"
            disabled={disabled}
          />
          <span style={{ fontSize: '14px', color: '#6c757d' }}>분</span>
        </div>
      </Section>
    </>
  );
};
