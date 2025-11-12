// src/modules/calendar/alarm/styles/FormStyles.js
// 폼 입력 요소 스타일 컴포넌트

import styled from 'styled-components';
import { ALARM_COLORS } from '../constants/alarmConstants';

export const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  background: #333842;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

export const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  background: #333842;
  color: #e0e0e0;

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
  }
`;

export const TimeInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const TimeSelect = styled(Select)`
  flex: 1;
`;

export const TimeInput = styled.input`
  width: 60px;
  padding: 14px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  text-align: center;
  background: #333842;
  color: #e0e0e0;

  &::placeholder {
    color: #808080;
  }

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

export const SmallInput = styled(Input)`
  width: 70px;
  text-align: center;
`;

export const Label = styled.label`
  font-size: 14px;
  color: #e0e0e0;
`;
