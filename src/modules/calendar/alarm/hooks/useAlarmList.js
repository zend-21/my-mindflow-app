// src/modules/calendar/alarm/hooks/useAlarmList.js
// 알람 리스트 관리 및 정렬 로직

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const useAlarmList = (scheduleData) => {
  // 알람 리스트 상태
  const [registeredAlarms, setRegisteredAlarms] = useState([]);
  const [pendingAlarms, setPendingAlarms] = useState([]);

  // 정렬 상태
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'registration'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // 저장된 정렬 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('alarmSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.sortBy) setSortBy(settings.sortBy);
        if (settings.sortDirection) setSortDirection(settings.sortDirection);
      } catch (error) {
        console.error('정렬 설정 로드 실패:', error);
      }
    }
  }, []);

  // 정렬 설정 자동 저장
  useEffect(() => {
    const savedSettings = localStorage.getItem('alarmSettings');
    let settings = {};
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('기존 설정 로드 실패:', error);
      }
    }
    settings.sortBy = sortBy;
    settings.sortDirection = sortDirection;
    localStorage.setItem('alarmSettings', JSON.stringify(settings));
  }, [sortBy, sortDirection]);

  // 알람 정렬 함수
  const sortAlarms = (alarms) => {
    if (!alarms || alarms.length === 0) return [];

    const sorted = [...alarms];

    // 기념일 알람은 항상 시간순 정렬 (오름차순)
    if (alarms.length > 0 && alarms[0].isAnniversary) {
      sorted.sort((a, b) => {
        const timeA = new Date(a.calculatedTime).getTime();
        const timeB = new Date(b.calculatedTime).getTime();
        return timeA - timeB;
      });
    } else {
      // 일반 알람은 사용자가 선택한 정렬 기준으로 정렬
      if (sortBy === 'time') {
        sorted.sort((a, b) => {
          const timeA = new Date(a.calculatedTime).getTime();
          const timeB = new Date(b.calculatedTime).getTime();
          return timeA - timeB;
        });
      } else {
        sorted.sort((a, b) => {
          const orderA = Number(a.registrationOrder) || 0;
          const orderB = Number(b.registrationOrder) || 0;
          return orderA - orderB;
        });
      }

      // 일반 알람에만 정렬 방향 적용
      if (sortDirection === 'desc') {
        sorted.reverse();
      }
    }

    return sorted;
  };

  // 정렬 토글
  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      // 같은 정렬 기준을 클릭하면 방향만 변경
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 정렬 기준으로 변경
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // 알람 삭제 (실제 삭제는 상위 컴포넌트에서 처리하기 위해 알람 반환)
  const findAlarmById = (id, type = 'registered') => {
    if (type === 'registered') {
      return registeredAlarms.find(a => a.id === id);
    } else if (type === 'pending') {
      return pendingAlarms.find(a => a.id === id);
    }
    return null;
  };

  // 알람 삭제 실행
  const deleteAlarm = (id, type = 'registered') => {
    if (type === 'registered') {
      setRegisteredAlarms(prev => prev.filter(alarm => alarm.id !== id));
    } else if (type === 'pending') {
      setPendingAlarms(prev => prev.filter(alarm => alarm.id !== id));

      // 가등록 알람 로컬스토리지 업데이트
      if (scheduleData?.date) {
        const scheduleKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
        const pendingKey = `pendingAlarms_${scheduleKey}`;
        const updatedPending = pendingAlarms.filter(alarm => alarm.id !== id);

        if (updatedPending.length > 0) {
          localStorage.setItem(pendingKey, JSON.stringify(updatedPending));
        } else {
          localStorage.removeItem(pendingKey);
        }
      }
    }
  };

  // 가등록 알람을 등록 알람으로 이동
  const registerPendingAlarm = (id) => {
    const alarmToRegister = pendingAlarms.find(alarm => alarm.id === id);
    if (!alarmToRegister) return null;

    // Remove isModified flag if exists
    const { isModified, ...cleanAlarm } = alarmToRegister;

    // Add to registered alarms
    const updatedRegisteredAlarms = [...registeredAlarms, cleanAlarm];

    // Remove from pending alarms
    const updatedPendingAlarms = pendingAlarms.filter(alarm => alarm.id !== id);

    // Update state
    setRegisteredAlarms(updatedRegisteredAlarms);
    setPendingAlarms(updatedPendingAlarms);

    // 로컬스토리지에서 가등록 알람 업데이트
    if (scheduleData?.date) {
      const scheduleKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const pendingKey = `pendingAlarms_${scheduleKey}`;

      if (updatedPendingAlarms.length > 0) {
        localStorage.setItem(pendingKey, JSON.stringify(updatedPendingAlarms));
      } else {
        localStorage.removeItem(pendingKey);
      }
    }

    return {
      registeredAlarms: updatedRegisteredAlarms,
      pendingAlarms: updatedPendingAlarms,
      alarmToRegister: cleanAlarm
    };
  };

  // 알람 활성화/비활성화 토글
  const toggleAlarmEnabled = (id, isRepeated = false, currentDate) => {
    const currentAlarm = registeredAlarms.find(alarm => alarm.id === id);
    if (!currentAlarm) return null;

    if (isRepeated) {
      // 반복 기념일의 경우: 해당 날짜만 비활성화/활성화
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');
      const disabledDates = currentAlarm.disabledDates || [];
      const isCurrentlyDisabled = disabledDates.includes(currentDateStr);

      let updatedDisabledDates;
      if (isCurrentlyDisabled) {
        // 현재 비활성화되어 있으면 활성화 (배열에서 제거)
        updatedDisabledDates = disabledDates.filter(date => date !== currentDateStr);
      } else {
        // 현재 활성화되어 있으면 비활성화 (배열에 추가)
        updatedDisabledDates = [...disabledDates, currentDateStr];
      }

      const updatedAlarms = registeredAlarms.map(alarm =>
        alarm.id === id ? { ...alarm, disabledDates: updatedDisabledDates } : alarm
      );
      setRegisteredAlarms(updatedAlarms);

      return { updatedAlarms, isCurrentlyDisabled: !isCurrentlyDisabled };
    } else {
      // 일반 알람 또는 원본 기념일의 경우: enabled 토글
      const currentEnabled = currentAlarm.enabled !== false;
      const updatedAlarms = registeredAlarms.map(alarm =>
        alarm.id === id
          ? {
              ...alarm,
              enabled: !currentEnabled,
              disabledAt: !currentEnabled ? null : new Date().toISOString()
            }
          : alarm
      );
      setRegisteredAlarms(updatedAlarms);

      return { updatedAlarms, isCurrentlyDisabled: currentEnabled };
    }
  };

  // 알람 업데이트
  const updateAlarm = (id, updatedAlarm) => {
    const updatedAlarms = registeredAlarms.map(alarm =>
      alarm.id === id ? { ...alarm, ...updatedAlarm } : alarm
    );
    setRegisteredAlarms(updatedAlarms);
    return updatedAlarms;
  };

  return {
    // 상태
    registeredAlarms,
    pendingAlarms,
    sortBy,
    sortDirection,

    // Setters
    setRegisteredAlarms,
    setPendingAlarms,
    setSortBy,
    setSortDirection,

    // 유틸리티 함수
    sortAlarms,
    toggleSort,
    findAlarmById,
    deleteAlarm,
    registerPendingAlarm,
    toggleAlarmEnabled,
    updateAlarm,
  };
};
