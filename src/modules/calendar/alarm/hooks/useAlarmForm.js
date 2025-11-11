// src/modules/calendar/alarm/hooks/useAlarmForm.js
// 알람 등록 폼 상태 및 로직 관리

import { useState, useEffect } from 'react';

export const useAlarmForm = () => {
  // 기본 알람 정보
  const [alarmTitle, setAlarmTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');

  // 커스텀 알람 입력 (상대 시간)
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(10);

  // 직접 시간 지정 (절대 시간)
  const [directDate, setDirectDate] = useState('');
  const [directTime, setDirectTime] = useState('09:00');

  // 기념일 설정
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [anniversaryName, setAnniversaryName] = useState('');
  const [anniversaryRepeat, setAnniversaryRepeat] = useState(''); // 초기값 없음
  const [anniversaryTiming, setAnniversaryTiming] = useState(''); // 'today' or 'before'
  const [anniversaryDaysBefore, setAnniversaryDaysBefore] = useState(''); // N일 전

  // 시간 입력 값 (hour, minute 분리)
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  // UI 상태
  const [showOptions, setShowOptions] = useState(false);
  const [showIndividualOptions, setShowIndividualOptions] = useState(false);
  const [showRepeatedAnniversaries, setShowRepeatedAnniversaries] = useState(false);

  // Update eventTime when hour or minute inputs change
  useEffect(() => {
    if (hourInput && minuteInput) {
      const hour = String(hourInput).padStart(2, '0');
      const minute = String(minuteInput).padStart(2, '0');
      setEventTime(`${hour}:${minute}`);
    }
  }, [hourInput, minuteInput]);

  // 폼 초기화
  const resetForm = () => {
    setAlarmTitle('');
    setEventTime('09:00');
    setCustomDays(0);
    setCustomHours(0);
    setCustomMinutes(10);
    setDirectDate('');
    setDirectTime('09:00');
    setIsAnniversary(false);
    setAnniversaryName('');
    setAnniversaryRepeat('');
    setAnniversaryTiming('');
    setAnniversaryDaysBefore('');
    setHourInput('');
    setMinuteInput('');
    setShowIndividualOptions(false);
  };

  // 기념일 관련 상태만 초기화
  const resetAnniversaryFields = () => {
    setIsAnniversary(false);
    setAnniversaryName('');
    setAnniversaryRepeat('');
    setAnniversaryTiming('');
    setAnniversaryDaysBefore('');
  };

  // 시간 입력 설정
  const setTimeInputs = (hour, minute) => {
    setHourInput(hour);
    setMinuteInput(minute);
  };

  return {
    // 기본 알람 정보
    alarmTitle,
    eventTime,
    setAlarmTitle,
    setEventTime,

    // 커스텀 알람 입력
    customDays,
    customHours,
    customMinutes,
    setCustomDays,
    setCustomHours,
    setCustomMinutes,

    // 직접 시간 지정
    directDate,
    directTime,
    setDirectDate,
    setDirectTime,

    // 기념일 설정
    isAnniversary,
    anniversaryName,
    anniversaryRepeat,
    anniversaryTiming,
    anniversaryDaysBefore,
    setIsAnniversary,
    setAnniversaryName,
    setAnniversaryRepeat,
    setAnniversaryTiming,
    setAnniversaryDaysBefore,

    // 시간 입력
    hourInput,
    minuteInput,
    setHourInput,
    setMinuteInput,
    setTimeInputs,

    // UI 상태
    showOptions,
    showIndividualOptions,
    showRepeatedAnniversaries,
    setShowOptions,
    setShowIndividualOptions,
    setShowRepeatedAnniversaries,

    // 유틸리티 함수
    resetForm,
    resetAnniversaryFields,
  };
};
