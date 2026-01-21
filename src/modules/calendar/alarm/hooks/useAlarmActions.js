// src/modules/calendar/alarm/hooks/useAlarmActions.js
// 알람 등록/수정/삭제 등의 액션 처리

import { format, addDays, addHours, addMinutes, subDays, subHours, subMinutes } from 'date-fns';
import { registerNativeScheduleAlarm } from '../../../../services/scheduleAlarmService';

export const useAlarmActions = ({
  scheduleData,
  alarmTitle,
  eventTime,
  hourInput,
  minuteInput,
  isAnniversary,
  anniversaryRepeat,
  anniversaryTiming,
  anniversaryDaysBefore,
  pendingAlarms,
  registeredAlarms,
  setRegisteredAlarms,
  setAlarmTitle,
  setHourInput,
  setMinuteInput,
  showValidation,
  onSave,
  notificationType,
  snoozeMinutes,
  soundFile,
  customSoundName,
  volume,
}) => {

  // 알람 시간 계산
  const calculateAlarmTime = (eventTime, offsetConfig) => {
    try {
      const scheduleDate = new Date(scheduleData.date);
      const [eventHours, eventMinutes] = eventTime.split(':').map(Number);

      let alarmDateTime = new Date(scheduleDate);
      alarmDateTime.setHours(eventHours, eventMinutes, 0, 0);

      if (offsetConfig.type === 'preset' || offsetConfig.type === 'custom') {
        const { days = 0, hours = 0, minutes = 0 } = offsetConfig;
        alarmDateTime = subDays(alarmDateTime, days);
        alarmDateTime = subHours(alarmDateTime, hours);
        alarmDateTime = subMinutes(alarmDateTime, minutes);
      } else if (offsetConfig.type === 'direct') {
        alarmDateTime = new Date(offsetConfig.directDateTime);
      }

      return alarmDateTime;
    } catch (error) {
      console.error('알람 시간 계산 오류:', error);
      return null;
    }
  };

  // 공통 검증 로직
  const validateAlarm = () => {
    // 1. 타이틀 검사
    if (!alarmTitle.trim()) {
      showValidation('알람 타이틀을 입력하세요.');
      return false;
    }

    // 2. 기념일 설정 검사
    if (isAnniversary) {
      if (!anniversaryRepeat) {
        showValidation('알림주기를 선택하세요.');
        return false;
      }
      if (!anniversaryTiming) {
        showValidation('알림시기를 선택하세요.');
        return false;
      }
    }

    // 3. 알람 시간 검사
    if (!hourInput || !minuteInput) {
      showValidation('알람 시간을 입력하세요.');
      return false;
    }

    return true;
  };

  // 중복 시간 체크
  const checkDuplicateTime = (alarmTime) => {
    const alarmTimeStr = format(alarmTime, 'yyyy-MM-dd HH:mm');
    return [...pendingAlarms, ...registeredAlarms].some(alarm => {
      const existingTimeStr = format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm');
      return existingTimeStr === alarmTimeStr;
    });
  };

  // 과거 시간 체크
  const checkPastTime = (alarmTime) => {
    if (isAnniversary) return false; // 기념일은 과거 시간 허용

    const scheduleDate = new Date(scheduleData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === today.getTime()) {
      const now = new Date();
      return alarmTime <= now;
    }

    return false;
  };

  // 프리셋 알람 추가
  const handleAddPresetAlarm = (days, hours, minutes) => {
    if (!validateAlarm()) return;

    const offsetConfig = { type: 'preset', days, hours, minutes };
    const alarmTime = calculateAlarmTime(eventTime, offsetConfig);

    if (!alarmTime) return;

    if (checkPastTime(alarmTime)) {
      showValidation('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
      return;
    }

    if (checkDuplicateTime(alarmTime)) {
      showValidation('설정한 시각은 이미 다른 알람이 등록(가등록) 되어 있어 알람 등록이 불가합니다.');
      return;
    }

    const newAlarm = {
      id: Date.now(),
      type: 'preset',
      title: alarmTitle,
      offset: { days, hours, minutes },
      calculatedTime: alarmTime,
      displayText: `${days}일 ${hours}시간 ${minutes}분 전`
        .replace(/0일 /g, '')
        .replace(/0시간 /g, '')
        .replace(/0분 /g, '')
        .trim() + (days === 0 && hours === 0 && minutes === 0 ? '정각' : ''),
      enabled: true,
      registrationOrder: Date.now(),
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? (anniversaryDaysBefore || 1) : 1,
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null,
    };

    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    const alarmSettings = {
      eventTime,
      registeredAlarms: updatedRegisteredAlarms,
      notificationType,
      snoozeMinutes,
      soundFile,
      customSoundName,
      volume,
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat,
    };
    onSave(alarmSettings, 'register');

    // 🔔 네이티브 알람 등록 (백그라운드 알림)
    registerNativeScheduleAlarm(newAlarm, format(scheduleData.date, 'yyyy-MM-dd'));

    // 입력 초기화
    setAlarmTitle('');
    setHourInput('');
    setMinuteInput('');
  };

  // 커스텀 알람 추가
  const handleAddCustomAlarm = (customDays, customHours, customMinutes) => {
    if (!validateAlarm()) return;

    const offsetConfig = {
      type: 'custom',
      days: customDays,
      hours: customHours,
      minutes: customMinutes,
    };

    const alarmTime = calculateAlarmTime(eventTime, offsetConfig);

    if (!alarmTime) return;

    if (checkPastTime(alarmTime)) {
      showValidation('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
      return;
    }

    if (checkDuplicateTime(alarmTime)) {
      showValidation('설정한 시각은 이미 다른 알람이 등록(가등록) 되어 있어 알람 등록이 불가합니다.');
      return;
    }

    const newAlarm = {
      id: Date.now(),
      type: 'custom',
      title: alarmTitle,
      offset: { days: customDays, hours: customHours, minutes: customMinutes },
      calculatedTime: alarmTime,
      displayText: `${customDays}일 ${customHours}시간 ${customMinutes}분 전`
        .replace(/0일 /g, '')
        .replace(/0시간 /g, '')
        .replace(/0분 /g, '')
        .trim() + (customDays === 0 && customHours === 0 && customMinutes === 0 ? '정각' : ''),
      enabled: true,
      registrationOrder: Date.now(),
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? (anniversaryDaysBefore || 1) : 1,
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null,
    };

    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    const alarmSettings = {
      eventTime,
      registeredAlarms: updatedRegisteredAlarms,
      notificationType,
      snoozeMinutes,
      soundFile,
      customSoundName,
      volume,
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat,
    };
    onSave(alarmSettings, 'register');

    // 🔔 네이티브 알람 등록 (백그라운드 알림)
    registerNativeScheduleAlarm(newAlarm, format(scheduleData.date, 'yyyy-MM-dd'));

    // 입력 초기화
    setAlarmTitle('');
    setHourInput('');
    setMinuteInput('');
  };

  // 직접 시간 지정 알람 추가
  const handleAddDirectAlarm = (directDate, directTime) => {
    if (!validateAlarm()) return;

    if (!directDate || !directTime) {
      showValidation('날짜와 시간을 모두 입력하세요.');
      return;
    }

    const [hours, minutes] = directTime.split(':').map(Number);
    const directDateTime = new Date(directDate);
    directDateTime.setHours(hours, minutes, 0, 0);

    const offsetConfig = { type: 'direct', directDateTime };
    const alarmTime = calculateAlarmTime(eventTime, offsetConfig);

    if (!alarmTime) return;

    if (checkPastTime(alarmTime)) {
      showValidation('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
      return;
    }

    if (checkDuplicateTime(alarmTime)) {
      showValidation('설정한 시각은 이미 다른 알람이 등록(가등록) 되어 있어 알람 등록이 불가합니다.');
      return;
    }

    const newAlarm = {
      id: Date.now(),
      type: 'direct',
      title: alarmTitle,
      directTime: directDateTime,
      calculatedTime: alarmTime,
      displayText: format(alarmTime, 'M월 d일 HH:mm'),
      enabled: true,
      registrationOrder: Date.now(),
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? (anniversaryDaysBefore || 1) : 1,
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null,
    };

    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    const alarmSettings = {
      eventTime,
      registeredAlarms: updatedRegisteredAlarms,
      notificationType,
      snoozeMinutes,
      soundFile,
      customSoundName,
      volume,
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat,
    };
    onSave(alarmSettings, 'register');

    // 🔔 네이티브 알람 등록 (백그라운드 알림)
    registerNativeScheduleAlarm(newAlarm, format(scheduleData.date, 'yyyy-MM-dd'));

    // 입력 초기화
    setAlarmTitle('');
    setHourInput('');
    setMinuteInput('');
  };

  return {
    handleAddPresetAlarm,
    handleAddCustomAlarm,
    handleAddDirectAlarm,
    calculateAlarmTime,
  };
};
