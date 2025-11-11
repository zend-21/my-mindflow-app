// src/modules/calendar/alarm/components/AlarmRegistrationForm.jsx
// 알람 등록 폼 (타이틀, 시간, 기념일 체크박스, 등록 버튼)

import React from 'react';
import styled from 'styled-components';
import { AnniversaryFormSection } from './AnniversaryFormSection';
import { ALARM_COLORS, TitleIcon, ClockIcon } from '../';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  padding: 8px 0;

  input[type='checkbox'] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: ${ALARM_COLORS.primary};
  }
`;

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 13px;
  color: #495057;
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

const RegisterButton = styled(Button)`
  background: ${ALARM_COLORS.primary};
  color: white;
  border-color: ${ALARM_COLORS.primary};
  font-weight: 600;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryDark};
    border-color: ${ALARM_COLORS.primaryDark};
    color: white;
  }
`;

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

export const AlarmRegistrationForm = ({
  alarmTitle,
  onTitleChange,
  hourInput,
  minuteInput,
  onHourChange,
  onMinuteChange,
  isAnniversary,
  onAnniversaryChange,
  anniversaryRepeat,
  onRepeatChange,
  anniversaryTiming,
  onTimingChange,
  anniversaryDaysBefore,
  onDaysBeforeChange,
  onCurrentTimePlusOne,
  onRegister,
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
    <FormContainer>
      {/* 1. 알람 타이틀 (필수) */}
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

      {/* 2. 기념일 체크박스 */}
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={isAnniversary}
          onChange={(e) => onAnniversaryChange(e.target.checked)}
          disabled={disabled}
        />
        기념일로 등록
      </CheckboxLabel>

      {/* 3. 알람주기 & 4. 알람시기 (기념일 체크 시에만 표시) */}
      <AnniversaryFormSection
        isAnniversary={isAnniversary}
        anniversaryRepeat={anniversaryRepeat}
        onRepeatChange={onRepeatChange}
        anniversaryTiming={anniversaryTiming}
        onTimingChange={onTimingChange}
        anniversaryDaysBefore={anniversaryDaysBefore}
        onDaysBeforeChange={onDaysBeforeChange}
        disabled={disabled}
      />

      {/* 5. 알람 시간 (필수) */}
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

      {/* 6. 하단 버튼 영역 */}
      <TimeRow>
        {!isAnniversary && (
          <Button onClick={onCurrentTimePlusOne} disabled={disabled}>
            현재시간+1분
          </Button>
        )}
        <RegisterButton onClick={onRegister} disabled={disabled} style={{ marginLeft: 'auto' }}>
          알람등록
        </RegisterButton>
      </TimeRow>
    </FormContainer>
  );
};
