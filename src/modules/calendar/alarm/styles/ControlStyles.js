// src/modules/calendar/alarm/styles/ControlStyles.js
// 라디오, 볼륨, 파일 업로드 등 컨트롤 스타일

import styled from 'styled-components';
import { ALARM_COLORS } from '../constants/alarmConstants';

export const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: ${props => props.$checked ? '#e7f3ff' : '#f8f9fa'};
  border: 2px solid ${props => props.$checked ? ALARM_COLORS.primary : '#dee2e6'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${ALARM_COLORS.primary};
  }

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 14px;
    color: #343a40;
  }
`;

export const SnoozeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
`;

export const SnoozeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  background: linear-gradient(to right, ${ALARM_COLORS.primary} 0%, ${ALARM_COLORS.primary} ${props => props.value}%, #dee2e6 ${props => props.value}%, #dee2e6 100%);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${ALARM_COLORS.primary};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${ALARM_COLORS.primary};
    cursor: pointer;
    border: none;
  }
`;

export const VolumeLabel = styled.span`
  font-size: 14px;
  color: #495057;
  min-width: 40px;
  text-align: right;
`;

export const SoundUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FileInputLabel = styled.label`
  display: inline-block;
  padding: 10px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 14px;
  color: #495057;

  &:hover {
    background: #e9ecef;
    border-color: #adb5bd;
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const FileName = styled.span`
  font-size: 13px;
  color: #6c757d;
`;

export const SoundPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
`;

export const PlayButton = styled.button`
  background: ${ALARM_COLORS.primary};
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px;

  &:hover {
    background: #0056b3;
  }
`;
