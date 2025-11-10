import { format, startOfDay, addYears } from 'date-fns';

/**
 * 특정 날짜에 반복되는 기념일 알람을 찾아서 반환
 * @param {Date} targetDate - 확인할 날짜
 * @param {Object} schedules - 전체 일정 객체
 * @returns {Array} 해당 날짜에 반복되는 기념일 알람 목록
 */
export const getRepeatedAnniversaries = (targetDate, schedules) => {
  const repeatedAlarmsMap = new Map(); // ID로 중복 제거
  const target = new Date(targetDate);
  const twoYearsFromNow = addYears(new Date(), 2);

  // 2년 후를 넘어가는 날짜는 처리하지 않음
  if (target > twoYearsFromNow) {
    return [];
  }

  for (const scheduleKey in schedules) {
    const scheduleEntry = schedules[scheduleKey];
    if (!scheduleEntry?.alarm?.registeredAlarms) continue;

    const anniversaryAlarms = scheduleEntry.alarm.registeredAlarms.filter(
      alarm => alarm.isAnniversary && alarm.anniversaryRepeat && alarm.anniversaryRepeat !== 'none'
    );

    for (const alarm of anniversaryAlarms) {
      // 이미 처리한 알람이면 건너뛰기 (중복 방지)
      if (repeatedAlarmsMap.has(alarm.id)) {
        continue;
      }

      const alarmDate = new Date(alarm.calculatedTime);
      const alarmDateStr = format(alarmDate, 'yyyy-MM-dd');
      const targetDateStr = format(target, 'yyyy-MM-dd');

      // 등록일 당일은 제외 (이미 직접 등록된 알람으로 표시됨)
      if (alarmDateStr === targetDateStr) {
        continue;
      }

      // 과거 날짜는 반복 적용 안 함 (등록일 이후만)
      if (target < startOfDay(alarmDate)) {
        continue;
      }

      // 기념일 반복 로직 확인
      let shouldRepeat = false;

      if (alarm.anniversaryRepeat === 'daily') {
        shouldRepeat = true;
      } else if (alarm.anniversaryRepeat === 'weekly') {
        shouldRepeat = alarmDate.getDay() === target.getDay();
      } else if (alarm.anniversaryRepeat === 'monthly') {
        shouldRepeat = alarmDate.getDate() === target.getDate();
      } else if (alarm.anniversaryRepeat === 'yearly') {
        shouldRepeat =
          alarmDate.getMonth() === target.getMonth() &&
          alarmDate.getDate() === target.getDate();
      }

      if (shouldRepeat) {
        // 해당 날짜가 disabledDates에 포함되어 있는지 확인
        const disabledDates = alarm.disabledDates || [];
        const isDisabledOnThisDate = disabledDates.includes(targetDateStr);

        repeatedAlarmsMap.set(alarm.id, {
          ...alarm,
          isRepeated: true, // 반복 표시임을 나타내는 플래그
          originalDate: alarmDate, // 원본 등록일
          enabled: !isDisabledOnThisDate // 이 날짜에서의 활성화 상태
        });
      }
    }
  }

  return Array.from(repeatedAlarmsMap.values());
};

/**
 * 등록일과 현재 보는 날짜가 같은지 확인
 */
export const isRegisteredToday = (alarm, currentDate) => {
  const alarmDateStr = format(alarm.calculatedTime, 'yyyy-MM-dd');
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  return alarmDateStr === currentDateStr;
};

/**
 * 기념일이 반복 설정되어 있는지 확인
 */
export const hasRepeat = (alarm) => {
  return alarm.anniversaryRepeat && alarm.anniversaryRepeat !== 'none';
};
