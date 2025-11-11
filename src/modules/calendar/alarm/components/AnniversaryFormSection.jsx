// src/modules/calendar/alarm/components/AnniversaryFormSection.jsx
// 기념일 설정 폼 (알람주기, 알림시기)

import React from 'react';
import styled from 'styled-components';
import { ALARM_COLORS } from '../';

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  margin-top: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RequiredMark = styled.span`
  color: ${ALARM_COLORS.danger};
  font-weight: normal;
  font-size: 13px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;

  input[type='radio'] {
    cursor: pointer;
  }

  &:hover {
    color: ${ALARM_COLORS.primary};
  }
`;

const NumberInput = styled.input`
  width: 50px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  text-align: center;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

const TimingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AnniversaryFormSection = ({
  isAnniversary,
  anniversaryRepeat,
  onRepeatChange,
  anniversaryTiming,
  onTimingChange,
  anniversaryDaysBefore,
  onDaysBeforeChange,
  disabled = false,
}) => {
  if (!isAnniversary) return null;

  const handleDaysBeforeChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      onDaysBeforeChange('');
      return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 30) {
      onDaysBeforeChange(numValue);
    }
  };

  return (
    <Section style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {/* 알람주기 */}
      <div>
        <SectionTitle>
          알람주기 <RequiredMark>(필수)</RequiredMark>
        </SectionTitle>
        <RadioGroup>
          <RadioLabel>
            <input
              type="radio"
              name="anniversaryRepeat"
              value="daily"
              checked={anniversaryRepeat === 'daily'}
              onChange={(e) => onRepeatChange(e.target.value)}
              disabled={disabled}
            />
            매일
          </RadioLabel>
          <RadioLabel>
            <input
              type="radio"
              name="anniversaryRepeat"
              value="weekly"
              checked={anniversaryRepeat === 'weekly'}
              onChange={(e) => onRepeatChange(e.target.value)}
              disabled={disabled}
            />
            매주
          </RadioLabel>
          <RadioLabel>
            <input
              type="radio"
              name="anniversaryRepeat"
              value="monthly"
              checked={anniversaryRepeat === 'monthly'}
              onChange={(e) => onRepeatChange(e.target.value)}
              disabled={disabled}
            />
            매달
          </RadioLabel>
          <RadioLabel>
            <input
              type="radio"
              name="anniversaryRepeat"
              value="yearly"
              checked={anniversaryRepeat === 'yearly'}
              onChange={(e) => onRepeatChange(e.target.value)}
              disabled={disabled}
            />
            매년
          </RadioLabel>
        </RadioGroup>
      </div>

      {/* 알림시기 */}
      <div>
        <SectionTitle>
          알림시기 <RequiredMark>(필수)</RequiredMark>
        </SectionTitle>
        <RadioGroup>
          <RadioLabel>
            <input
              type="radio"
              name="anniversaryTiming"
              value="today"
              checked={anniversaryTiming === 'today'}
              onChange={(e) => onTimingChange(e.target.value)}
              disabled={disabled}
            />
            당일
          </RadioLabel>
          <TimingRow>
            <RadioLabel>
              <input
                type="radio"
                name="anniversaryTiming"
                value="before"
                checked={anniversaryTiming === 'before'}
                onChange={(e) => onTimingChange(e.target.value)}
                disabled={disabled}
              />
            </RadioLabel>
            <NumberInput
              type="text"
              placeholder="1-30"
              maxLength="2"
              value={anniversaryDaysBefore}
              onChange={handleDaysBeforeChange}
              disabled={disabled || anniversaryTiming !== 'before'}
              onClick={() => {
                if (anniversaryTiming !== 'before') {
                  onTimingChange('before');
                }
              }}
            />
            <span style={{ fontSize: '14px', color: '#495057' }}>일 전</span>
          </TimingRow>
        </RadioGroup>
      </div>
    </Section>
  );
};
