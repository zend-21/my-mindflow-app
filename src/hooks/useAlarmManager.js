// src/hooks/useAlarmManager.js

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, addWeeks, addMonths, addYears, isSameMinute, startOfMinute } from 'date-fns';

const useAlarmManager = (schedules) => {
  const [currentAlarm, setCurrentAlarm] = useState(null);
  const [snoozedAlarms, setSnoozedAlarms] = useState(() => {
    // localStorage에서 스누즈된 알람 복원
    const saved = localStorage.getItem('snoozedAlarms');
    return saved ? JSON.parse(saved) : {};
  });

  // 스누즈 정보를 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('snoozedAlarms', JSON.stringify(snoozedAlarms));
  }, [snoozedAlarms]);

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

  // 알람 체크 함수
  const checkAlarms = useCallback(() => {
    const now = startOfMinute(new Date());

    // 모든 스케줄의 알람들을 검사
    Object.values(schedules).forEach((schedule) => {
      if (!schedule.alarm || !schedule.alarm.registeredAlarms) return;

      schedule.alarm.registeredAlarms.forEach((alarm) => {
        // enabled가 false면 무시
        if (!alarm.enabled) return;

        // 스누즈된 알람 확인
        const snoozeInfo = snoozedAlarms[alarm.id];
        if (snoozeInfo) {
          const snoozeTime = new Date(snoozeInfo.snoozeUntil);
          if (isSameMinute(now, snoozeTime)) {
            // 스누즈 시간 도달 - 알람 트리거
            setCurrentAlarm({
              ...alarm,
              scheduleData: {
                date: schedule.date || snoozeInfo.originalDate,
                text: schedule.text || alarm.title
              },
              snoozeCount: snoozeInfo.count || 0
            });
            // 스누즈 정보 삭제
            setSnoozedAlarms((prev) => {
              const updated = { ...prev };
              delete updated[alarm.id];
              return updated;
            });
          }
          return; // 스누즈 중이면 일반 체크는 건너뛰기
        }

        // 일반 알람 시간 체크
        let alarmTime;

        if (alarm.isAnniversary) {
          // 기념일 알람 - 다음 발생 시간 계산
          alarmTime = calculateNextAnniversaryTime(alarm);
        } else {
          // 일반 알람 - calculatedTime 사용
          alarmTime = new Date(alarm.calculatedTime);
        }

        if (alarmTime && isSameMinute(now, alarmTime)) {
          // 알람 시간 도달 - 트리거
          setCurrentAlarm({
            ...alarm,
            scheduleData: {
              date: schedule.date || alarmTime,
              text: schedule.text || alarm.title
            },
            snoozeCount: 0
          });
        }
      });
    });
  }, [schedules, snoozedAlarms, calculateNextAnniversaryTime]);

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

    return () => clearTimeout(initialTimer);
  }, [checkAlarms]);

  // 알람 닫기
  const dismissAlarm = useCallback((onAlarmDismissed) => {
    if (currentAlarm && !currentAlarm.isAnniversary) {
      // 일반 알람(기념일 아님)은 비활성화 처리
      if (onAlarmDismissed) {
        onAlarmDismissed(currentAlarm);
      }
    }
    setCurrentAlarm(null);
  }, [currentAlarm]);

  // 스누즈 처리
  const snoozeAlarm = useCallback((minutes) => {
    if (!currentAlarm) return;

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    setSnoozedAlarms((prev) => ({
      ...prev,
      [currentAlarm.id]: {
        snoozeUntil: snoozeUntil.toISOString(),
        count: (currentAlarm.snoozeCount || 0) + 1,
        originalDate: currentAlarm.scheduleData.date
      }
    }));

    setCurrentAlarm(null);
  }, [currentAlarm]);

  return {
    currentAlarm,
    dismissAlarm,
    snoozeAlarm
  };
};

export default useAlarmManager;
