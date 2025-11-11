// src/modules/calendar/alarm/hooks/useAlarmEdit.js
// 알람 수정 모달 상태 및 로직 관리

import { useState, useEffect, useRef } from 'react';

export const useAlarmEdit = () => {
  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [editingPendingId, setEditingPendingId] = useState(null);
  const [editingRegisteredId, setEditingRegisteredId] = useState(null);

  // 수정 폼 필드
  const [editTitle, setEditTitle] = useState('');
  const [editEventTime, setEditEventTime] = useState('09:00');
  const [editOffset, setEditOffset] = useState({ days: 0, hours: 0, minutes: 0 });

  // 기념일 수정 필드
  const [editIsAnniversary, setEditIsAnniversary] = useState(false);
  const [editAnniversaryRepeat, setEditAnniversaryRepeat] = useState('');
  const [editAnniversaryTiming, setEditAnniversaryTiming] = useState('');
  const [editAnniversaryDaysBefore, setEditAnniversaryDaysBefore] = useState('');

  // 개별 알람옵션 상태
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [editCustomSound, setEditCustomSound] = useState(null);
  const [editCustomSoundName, setEditCustomSoundName] = useState('');
  const [editCustomVolume, setEditCustomVolume] = useState(null);
  const [editCustomNotificationType, setEditCustomNotificationType] = useState(null);
  const [editCustomSnoozeEnabled, setEditCustomSnoozeEnabled] = useState(null);
  const [editCustomSnoozeMinutes, setEditCustomSnoozeMinutes] = useState(null);

  // 변경 감지
  const [hasEditChanges, setHasEditChanges] = useState(false);

  // 시간 입력 값
  const [editHourInput, setEditHourInput] = useState('00');
  const [editMinuteInput, setEditMinuteInput] = useState('00');

  // 파일 input ref
  const editSoundFileInputRef = useRef(null);

  // Update editEventTime when edit hour or minute inputs change
  useEffect(() => {
    if (editHourInput && editMinuteInput) {
      const hour = String(editHourInput).padStart(2, '0');
      const minute = String(editMinuteInput).padStart(2, '0');
      setEditEventTime(`${hour}:${minute}`);
    }
  }, [editHourInput, editMinuteInput]);

  // 알람 수정 시작
  const startEditAlarm = (alarm) => {
    setEditingAlarm(alarm);
    setEditTitle(alarm.title || '');
    setEditIsAnniversary(alarm.isAnniversary || false);
    setEditAnniversaryRepeat(alarm.anniversaryRepeat || '');
    setEditAnniversaryTiming(alarm.anniversaryTiming || '');
    setEditAnniversaryDaysBefore(alarm.anniversaryDaysBefore || '');

    // 이벤트 시간 설정
    if (alarm.eventTime) {
      const [hours, minutes] = alarm.eventTime.split(':');
      setEditEventTime(alarm.eventTime);
      setEditHourInput(hours);
      setEditMinuteInput(minutes);
    }

    // 오프셋 설정
    if (alarm.offset) {
      setEditOffset(alarm.offset);
    } else {
      setEditOffset({ days: 0, hours: 0, minutes: 0 });
    }

    // 개별 알람옵션 설정
    setEditCustomSound(alarm.customSound || null);
    setEditCustomSoundName(alarm.customSoundName || '');
    setEditCustomVolume(alarm.customVolume ?? null);
    setEditCustomNotificationType(alarm.customNotificationType || null);
    setEditCustomSnoozeEnabled(alarm.customSnoozeEnabled ?? null);
    setEditCustomSnoozeMinutes(alarm.customSnoozeMinutes ?? null);

    setShowEditModal(true);
    setHasEditChanges(false);
    setShowCustomOptions(false);
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAlarm(null);
    setEditTitle('');
    setEditEventTime('09:00');
    setEditOffset({ days: 0, hours: 0, minutes: 0 });
    setEditIsAnniversary(false);
    setEditAnniversaryRepeat('');
    setEditAnniversaryTiming('');
    setEditAnniversaryDaysBefore('');
    setEditHourInput('00');
    setEditMinuteInput('00');
    setHasEditChanges(false);
    setShowCustomOptions(false);
    setEditCustomSound(null);
    setEditCustomSoundName('');
    setEditCustomVolume(null);
    setEditCustomNotificationType(null);
    setEditCustomSnoozeEnabled(null);
    setEditCustomSnoozeMinutes(null);
  };

  // 시간 입력 설정
  const setEditTimeInputs = (hour, minute) => {
    setEditHourInput(hour);
    setEditMinuteInput(minute);
  };

  return {
    // 모달 상태
    showEditModal,
    editingAlarm,
    editingPendingId,
    editingRegisteredId,
    setShowEditModal,
    setEditingAlarm,
    setEditingPendingId,
    setEditingRegisteredId,

    // 수정 폼 필드
    editTitle,
    editEventTime,
    editOffset,
    setEditTitle,
    setEditEventTime,
    setEditOffset,

    // 기념일 수정 필드
    editIsAnniversary,
    editAnniversaryRepeat,
    editAnniversaryTiming,
    editAnniversaryDaysBefore,
    setEditIsAnniversary,
    setEditAnniversaryRepeat,
    setEditAnniversaryTiming,
    setEditAnniversaryDaysBefore,

    // 개별 알람옵션
    showCustomOptions,
    editCustomSound,
    editCustomSoundName,
    editCustomVolume,
    editCustomNotificationType,
    editCustomSnoozeEnabled,
    editCustomSnoozeMinutes,
    setShowCustomOptions,
    setEditCustomSound,
    setEditCustomSoundName,
    setEditCustomVolume,
    setEditCustomNotificationType,
    setEditCustomSnoozeEnabled,
    setEditCustomSnoozeMinutes,

    // 변경 감지
    hasEditChanges,
    setHasEditChanges,

    // 시간 입력
    editHourInput,
    editMinuteInput,
    setEditHourInput,
    setEditMinuteInput,
    setEditTimeInputs,

    // Ref
    editSoundFileInputRef,

    // 유틸리티 함수
    startEditAlarm,
    closeEditModal,
  };
};
