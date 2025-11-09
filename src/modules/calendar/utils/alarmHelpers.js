import { format, startOfDay } from 'date-fns';
import { AUTO_DELETE_DAYS } from '../constants';

/**
 * 알람이 자동삭제되었는지 확인
 */
export const isAutoDeleted = (alarm) => {
  if (!alarm.disabledAt) return false;
  const disabledDate = new Date(alarm.disabledAt);
  const deletionDate = new Date(disabledDate);
  deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);
  return new Date() >= deletionDate;
};

/**
 * 자동삭제까지 남은 일수 계산
 */
export const getDaysUntilAutoDelete = (alarm) => {
  if (!alarm.disabledAt) return null;
  const disabledDate = new Date(alarm.disabledAt);
  const deletionDate = new Date(disabledDate);
  deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);
  const today = new Date();
  const diffTime = deletionDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * 특정 날짜에 알람이 있는지 확인 (활성/비활성 모두 포함)
 */
export const hasAlarm = (date, schedules) => {
  const key = format(date, 'yyyy-MM-dd');
  const entry = schedules[key];

  // 1. 해당 날짜에 직접 등록된 알람 확인 (일반 알람, 활성/비활성 모두, 기념일 제외)
  const hasDirectAlarm = entry && entry.alarm && entry.alarm.registeredAlarms &&
    entry.alarm.registeredAlarms.filter(alarm => !alarm.isAnniversary && !isAutoDeleted(alarm)).length > 0;

  if (hasDirectAlarm) return true;

  // 2. 기념일 알람 확인 - 모든 날짜의 기념일을 순회하면서 오늘이 반복 날짜인지 확인
  for (const scheduleKey in schedules) {
    const scheduleEntry = schedules[scheduleKey];
    if (!scheduleEntry?.alarm?.registeredAlarms) continue;

    const anniversaryAlarms = scheduleEntry.alarm.registeredAlarms.filter(
      alarm => alarm.isAnniversary && !isAutoDeleted(alarm)
    );

    for (const alarm of anniversaryAlarms) {
      const alarmDate = new Date(alarm.calculatedTime);
      const targetDate = new Date(date);

      // 과거 날짜는 반복 적용 안 함 (등록일 포함 미래만)
      if (targetDate < startOfDay(alarmDate)) {
        continue;
      }

      // 기념일 반복 로직 확인
      if (alarm.anniversaryRepeat === 'daily') {
        return true;
      } else if (alarm.anniversaryRepeat === 'weekly') {
        if (alarmDate.getDay() === targetDate.getDay()) {
          return true;
        }
      } else if (alarm.anniversaryRepeat === 'monthly') {
        if (alarmDate.getDate() === targetDate.getDate()) {
          return true;
        }
      } else if (alarm.anniversaryRepeat === 'yearly') {
        if (alarmDate.getMonth() === targetDate.getMonth() &&
          alarmDate.getDate() === targetDate.getDate()) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * 특정 날짜에 활성화된 알람이 있는지 확인
 */
export const hasActiveAlarm = (date, schedules) => {
  const key = format(date, 'yyyy-MM-dd');
  const entry = schedules[key];

  // 1. 해당 날짜에 직접 등록된 활성 알람 확인 (기념일 제외)
  const hasDirectActiveAlarm = entry && entry.alarm && entry.alarm.registeredAlarms &&
    entry.alarm.registeredAlarms.filter(
      alarm => !alarm.isAnniversary && alarm.enabled !== false && !isAutoDeleted(alarm)
    ).length > 0;

  if (hasDirectActiveAlarm) return true;

  // 2. 기념일 활성 알람 확인
  for (const scheduleKey in schedules) {
    const scheduleEntry = schedules[scheduleKey];
    if (!scheduleEntry?.alarm?.registeredAlarms) continue;

    const activeAnniversaryAlarms = scheduleEntry.alarm.registeredAlarms.filter(
      alarm => alarm.isAnniversary && alarm.enabled !== false && !isAutoDeleted(alarm)
    );

    for (const alarm of activeAnniversaryAlarms) {
      const alarmDate = new Date(alarm.calculatedTime);
      const targetDate = new Date(date);

      // 과거 날짜는 반복 적용 안 함
      if (targetDate < startOfDay(alarmDate)) {
        continue;
      }

      // 기념일 반복 로직 확인
      if (alarm.anniversaryRepeat === 'daily') {
        return true;
      } else if (alarm.anniversaryRepeat === 'weekly') {
        if (alarmDate.getDay() === targetDate.getDay()) {
          return true;
        }
      } else if (alarm.anniversaryRepeat === 'monthly') {
        if (alarmDate.getDate() === targetDate.getDate()) {
          return true;
        }
      } else if (alarm.anniversaryRepeat === 'yearly') {
        if (alarmDate.getMonth() === targetDate.getMonth() &&
          alarmDate.getDate() === targetDate.getDate()) {
          return true;
        }
      }
    }
  }

  return false;
};
