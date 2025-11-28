// src/hooks/useAlarmManager.js
// ✨ 토스트 기반 알람 매니저 (미리 알림 + 정시 알림 모두 트리거)

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, addWeeks, addMonths, addYears, isSameMinute, startOfMinute } from 'date-fns';
import { ALARM_REPEAT_CONFIG } from '../modules/calendar/alarm/constants/alarmConstants';

const useAlarmManager = (schedules) => {
  const [toastAlarms, setToastAlarms] = useState([]); // 활성 토스트 알람 큐
  const repeatTimersRef = useRef({}); // 반복 타이머 관리

  // 기념일 알람의 다음 발생 시간 계산
  const calculateNextAnniversaryTime = useCallback((alarm, baseDate) => {
    if (!alarm.isAnniversary || !alarm.anniversaryRepeat) {
      return null;
    }

    const alarmDate = new Date(alarm.calculatedTime);
    const now = new Date();

    // 알람 시간 (시:분)
    const alarmHours = alarmDate.getHours();
    const alarmMinutes = alarmDate.getMinutes();

    // 현재 날짜 기준으로 알람 시간 설정
    let nextDate = new Date(baseDate || now);
    nextDate.setHours(alarmHours, alarmMinutes, 0, 0);

    // 반복 주기에 따라 다음 발생 시간 계산
    switch (alarm.anniversaryRepeat) {
      case 'daily':
        // 오늘 시간이 지났으면 내일
        if (nextDate <= now) {
          nextDate = addDays(nextDate, 1);
        }
        break;

      case 'weekly':
        // 같은 요일 기준
        const targetDay = alarmDate.getDay();
        const currentDay = nextDate.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        if (daysToAdd === 0 && nextDate <= now) daysToAdd = 7;
        nextDate = addDays(nextDate, daysToAdd);
        break;

      case 'monthly':
        // 같은 날짜 기준
        const targetDate = alarmDate.getDate();
        nextDate.setDate(targetDate);
        if (nextDate <= now) {
          nextDate = addMonths(nextDate, 1);
          nextDate.setDate(Math.min(targetDate, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
        }
        break;

      case 'yearly':
        // 같은 월/일 기준
        const targetMonth = alarmDate.getMonth();
        const targetDateOfMonth = alarmDate.getDate();
        nextDate.setMonth(targetMonth);
        nextDate.setDate(targetDateOfMonth);
        if (nextDate <= now) {
          nextDate = addYears(nextDate, 1);
        }
        break;

      default:
        return null;
    }

    return nextDate;
  }, []);

  // 알람 트리거 (반복 포함)
  const triggerAlarm = useCallback((alarm, scheduleData, isAdvance = false) => {
    const repeatInterval = alarm.repeatInterval || ALARM_REPEAT_CONFIG.defaultInterval;
    const repeatCount = alarm.repeatCount || ALARM_REPEAT_CONFIG.defaultCount;
    const alarmId = `${alarm.id}_${isAdvance ? 'advance' : 'ontime'}_${Date.now()}`;

    // 첫 번째 토스트 표시
    const alarmData = {
      id: alarmId,
      title: isAdvance ? `[미리 알림] ${alarm.title}` : alarm.title,
      content: alarm.content || scheduleData.text,
      soundFile: alarm.soundFile,
      volume: alarm.volume,
      currentRepeat: 1,
      totalRepeats: repeatCount
    };

    setToastAlarms(prev => [...prev, alarmData]);

    // 반복 처리
    if (repeatCount > 1) {
      let currentRepeat = 1;
      const timerId = setInterval(() => {
        currentRepeat++;

        if (currentRepeat <= repeatCount) {
          // 다음 반복 토스트 표시
          const nextAlarmData = {
            ...alarmData,
            id: `${alarmId}_${currentRepeat}`,
            currentRepeat,
          };
          setToastAlarms(prev => [...prev, nextAlarmData]);
        } else {
          // 모든 반복 완료
          clearInterval(timerId);
          delete repeatTimersRef.current[alarmId];
        }
      }, repeatInterval * 1000);

      repeatTimersRef.current[alarmId] = timerId;
    }
  }, []);

  // 토스트 알람 닫기 (남은 반복 모두 취소)
  const dismissToast = useCallback((alarmId) => {
    // 해당 알람의 모든 반복 타이머 제거
    const baseId = alarmId.split('_').slice(0, -1).join('_');
    Object.keys(repeatTimersRef.current).forEach(timerId => {
      if (timerId.startsWith(baseId)) {
        clearInterval(repeatTimersRef.current[timerId]);
        delete repeatTimersRef.current[timerId];
      }
    });

    // 토스트 제거
    setToastAlarms(prev => prev.filter(alarm => !alarm.id.startsWith(baseId)));
  }, []);

  // 알람 체크 함수
  const checkAlarms = useCallback(() => {
    const now = startOfMinute(new Date());

    // 모든 스케줄의 알람들을 검사
    Object.values(schedules).forEach((schedule) => {
      if (!schedule.alarm || !schedule.alarm.registeredAlarms) return;

      schedule.alarm.registeredAlarms.forEach((alarm) => {
        // enabled가 false면 무시
        if (!alarm.enabled) return;

        let onTimeAlarm;

        // 정시 알람 시간 계산
        if (alarm.isAnniversary) {
          // 기념일 알람 - 다음 발생 시간 계산
          onTimeAlarm = calculateNextAnniversaryTime(alarm);
        } else {
          // 일반 알람 - calculatedTime 사용
          onTimeAlarm = new Date(alarm.calculatedTime);
        }

        if (!onTimeAlarm) return;

        // 미리 알림 체크 (advanceNotice가 설정된 경우)
        const advanceNotice = alarm.advanceNotice || 0;
        if (advanceNotice > 0) {
          const advanceTime = new Date(onTimeAlarm);
          advanceTime.setMinutes(advanceTime.getMinutes() - advanceNotice);

          if (isSameMinute(now, advanceTime)) {
            // 미리 알림 트리거
            triggerAlarm(alarm, {
              date: schedule.date || onTimeAlarm,
              text: alarm.title
            }, true);
          }
        }

        // 정시 알람 체크
        if (isSameMinute(now, onTimeAlarm)) {
          // 정시 알람 트리거
          triggerAlarm(alarm, {
            date: schedule.date || onTimeAlarm,
            text: alarm.title
          }, false);
        }
      });
    });
  }, [schedules, calculateNextAnniversaryTime, triggerAlarm]);

  // 매 분마다 알람 체크
  useEffect(() => {
    // 초기 체크
    checkAlarms();

    // 다음 분의 시작까지 대기 후 인터벌 시작
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = (secondsUntilNextMinute * 1000) - now.getMilliseconds();

    const initialTimer = setTimeout(() => {
      checkAlarms();

      // 정확히 매 분마다 체크
      const interval = setInterval(() => {
        checkAlarms();
      }, 60000);

      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(initialTimer);
      // 모든 반복 타이머 정리
      Object.values(repeatTimersRef.current).forEach(timerId => clearInterval(timerId));
    };
  }, [checkAlarms]);

  return {
    toastAlarms,
    dismissToast
  };
};

export default useAlarmManager;
