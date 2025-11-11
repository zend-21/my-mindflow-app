// src/modules/calendar/alarm/components/PresetButtonGrid.jsx
// 프리셋 알람 버튼 그리드

import React from 'react';
import styled from 'styled-components';
import { ALARM_COLORS } from '../';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const PresetButton = styled.button`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryLight};
    border-color: ${ALARM_COLORS.primary};
    color: ${ALARM_COLORS.primary};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PresetButtonGrid = ({ onAddPreset, disabled = false }) => {
  const presets = [
    { label: '정각', days: 0, hours: 0, minutes: 0 },
    { label: '10분 전', days: 0, hours: 0, minutes: 10 },
    { label: '30분 전', days: 0, hours: 0, minutes: 30 },
    { label: '1시간 전', days: 0, hours: 1, minutes: 0 },
    { label: '3시간 전', days: 0, hours: 3, minutes: 0 },
    { label: '6시간 전', days: 0, hours: 6, minutes: 0 },
    { label: '12시간 전', days: 0, hours: 12, minutes: 0 },
    { label: '1일 전', days: 1, hours: 0, minutes: 0 },
    { label: '3일 전', days: 3, hours: 0, minutes: 0 },
  ];

  return (
    <GridContainer style={{ opacity: disabled ? 0.5 : 1 }}>
      {presets.map((preset, index) => (
        <PresetButton
          key={index}
          onClick={() => onAddPreset(preset.days, preset.hours, preset.minutes)}
          disabled={disabled}
        >
          {preset.label}
        </PresetButton>
      ))}
    </GridContainer>
  );
};
