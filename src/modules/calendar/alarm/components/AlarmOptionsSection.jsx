// src/modules/calendar/alarm/components/AlarmOptionsSection.jsx
// 기본 알람 옵션 섹션 (접을 수 있음)
// ✨ 미리 알림, 반복 간격, 반복 횟수 추가

import React, { useState } from 'react';
import styled from 'styled-components';
import { ALARM_COLORS, ALARM_REPEAT_CONFIG, ADVANCE_NOTICE_CONFIG } from '../';

const Section = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
`;

const SectionHeader = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #f8f9fa;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
`;

const CollapseIcon = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  transform: ${props => props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)'};
  color: ${ALARM_COLORS.muted};
`;

const SectionContent = styled.div`
  padding: ${props => props.$collapsed ? '0 20px' : '0 20px 20px'};
  max-height: ${props => props.$collapsed ? '0' : '1000px'};
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${props => props.$collapsed ? '0' : '1'};
`;

const OptionRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const OptionLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
`;

const OptionDescription = styled.span`
  font-size: 11px;
  color: #868e96;
  font-weight: normal;
  margin-left: 4px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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

const SoundRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${ALARM_COLORS.primaryLight};
    border-color: ${ALARM_COLORS.primary};
    color: ${ALARM_COLORS.primary};
  }
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #dee2e6;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${ALARM_COLORS.primary};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${ALARM_COLORS.primary};
    cursor: pointer;
    border: none;
  }
`;

const VolumeDisplay = styled.span`
  font-size: 14px;
  color: #495057;
  min-width: 40px;
  text-align: right;
`;

const ResetButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;

  &:hover {
    background: #f8f9fa;
    border-color: ${ALARM_COLORS.muted};
  }
`;

export const AlarmOptionsSection = ({
  soundFile,
  onSoundFileChange,
  customSoundName,
  onCustomSoundUpload,
  volume,
  onVolumeChange,
  notificationType,
  onNotificationTypeChange,
  // ✨ 새로 추가된 props
  advanceNotice = 0,
  onAdvanceNoticeChange,
  repeatInterval = 60,
  onRepeatIntervalChange,
  repeatCount = 3,
  onRepeatCountChange,
  onResetDefaults,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      onCustomSoundUpload(file);
    }
  };

  return (
    <Section>
      <SectionHeader onClick={() => setCollapsed(!collapsed)}>
        <SectionTitle>기본 알람 옵션</SectionTitle>
        <CollapseIcon $collapsed={collapsed}>▼</CollapseIcon>
      </SectionHeader>

      <SectionContent $collapsed={collapsed}>
        {/* 사운드 선택 */}
        <OptionRow>
          <OptionLabel>사운드</OptionLabel>
          <SoundRow>
            <Select value={soundFile} onChange={(e) => onSoundFileChange(e.target.value)}>
              <option value="default">기본 사운드</option>
              {customSoundName && (
                <option value="custom">{customSoundName}</option>
              )}
            </Select>
            <FileInput
              type="file"
              accept="audio/*"
              id="custom-sound-upload"
              onChange={handleFileUpload}
            />
            <UploadButton as="label" htmlFor="custom-sound-upload">
              커스텀 업로드
            </UploadButton>
          </SoundRow>
        </OptionRow>

        {/* 볼륨 조절 */}
        <OptionRow>
          <OptionLabel>볼륨</OptionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <VolumeSlider
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
            />
            <VolumeDisplay>{volume}%</VolumeDisplay>
          </div>
        </OptionRow>

        {/* 알림 타입 */}
        <OptionRow>
          <OptionLabel>알림 타입</OptionLabel>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                name="notificationType"
                value="sound"
                checked={notificationType === 'sound'}
                onChange={(e) => onNotificationTypeChange(e.target.value)}
              />
              소리만
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                name="notificationType"
                value="vibrate"
                checked={notificationType === 'vibrate'}
                onChange={(e) => onNotificationTypeChange(e.target.value)}
              />
              진동만
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                name="notificationType"
                value="both"
                checked={notificationType === 'both'}
                onChange={(e) => onNotificationTypeChange(e.target.value)}
              />
              소리+진동
            </RadioLabel>
          </RadioGroup>
        </OptionRow>

        {/* ✨ 미리 알림 */}
        <OptionRow>
          <OptionLabel>
            미리 알림
            <OptionDescription>(알람 시간 전에 미리 한 번 더 울립니다)</OptionDescription>
          </OptionLabel>
          <Select
            value={advanceNotice}
            onChange={(e) => onAdvanceNoticeChange && onAdvanceNoticeChange(parseInt(e.target.value, 10))}
          >
            {Object.entries(ADVANCE_NOTICE_CONFIG.options).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </OptionRow>

        {/* ✨ 반복 횟수 */}
        <OptionRow>
          <OptionLabel>
            반복 횟수
            <OptionDescription>(특정 간격으로 알람을 반복하여 울립니다)</OptionDescription>
          </OptionLabel>
          <RadioGroup>
            {Object.entries(ALARM_REPEAT_CONFIG.counts).map(([value, label]) => (
              <RadioLabel key={value}>
                <input
                  type="radio"
                  name="repeatCount"
                  value={value}
                  checked={repeatCount === parseInt(value, 10)}
                  onChange={(e) => onRepeatCountChange && onRepeatCountChange(parseInt(e.target.value, 10))}
                />
                {label}
              </RadioLabel>
            ))}
          </RadioGroup>
        </OptionRow>

        {/* ✨ 반복 간격 - 반복 횟수가 3회일 때만 활성화 */}
        {repeatCount === 3 && (
          <OptionRow>
            <OptionLabel>반복 간격</OptionLabel>
            <RadioGroup>
              {Object.entries(ALARM_REPEAT_CONFIG.intervals).map(([value, label]) => (
                <RadioLabel key={value}>
                  <input
                    type="radio"
                    name="repeatInterval"
                    value={value}
                    checked={repeatInterval === parseInt(value, 10)}
                    onChange={(e) => onRepeatIntervalChange && onRepeatIntervalChange(parseInt(e.target.value, 10))}
                  />
                  {label}
                </RadioLabel>
              ))}
            </RadioGroup>
          </OptionRow>
        )}

        {/* 기본값으로 되돌리기 */}
        <ResetButton onClick={onResetDefaults}>
          기본값으로 되돌리기
        </ResetButton>
      </SectionContent>
    </Section>
  );
};
