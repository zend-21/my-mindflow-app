// src/modules/calendar/AlarmModal.jsx
// 알람 설정 모달 - 심플 버전 (레이아웃만 유지, 기능은 단순화)

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Portal from '../../components/Portal';
import { saveAudioFile, loadAudioFile } from '../../utils/audioStorage';

// alarm 모듈에서 필요한 것만 import
import {
  ALARM_COLORS,
  ALARM_REPEAT_CONFIG,
  ADVANCE_NOTICE_CONFIG,
  fadeIn,
  slideUp,
  BellIcon,
  ClockIcon,
  TitleIcon,
  VolumeIcon,
  VibrateIcon,
  AlertIcon,
  RadioGroup,
  RadioOption,
  VolumeContainer,
  VolumeSlider,
  VolumeLabel,
  SoundUploadContainer,
  FileInputLabel,
  HiddenFileInput,
  FileName,
  SoundPreview,
  PlayButton,
} from './alarm';

// 기존 레이아웃의 AlarmItemComponent 사용
import AlarmItemComponent from './alarm/components/AlarmItemComponent';
// 모달 컴포넌트 import
import { ValidationModal, DeleteConfirmModal, EditConfirmModal } from './alarm/components/ConfirmationModals';
import { AlarmEditModal } from './alarm/components/AlarmEditModal';
// 기념일 반복 유틸 함수
import { getRepeatedAnniversaries } from './utils/anniversaryHelpers';
// 알람 토스트 (미리보기용)
import AlarmToast from './AlarmToast';

// ==================== STYLED COMPONENTS ====================
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: ${fadeIn} 0.2s ease-out;
  touch-action: none;
  overscroll-behavior: contain;
`;

const ModalContent = styled.div`
  background: ${props => props.$isPastDate ? '#1f2229' : '#2a2d35'};
  border-radius: 16px;
  width: 95vw;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  animation: ${slideUp} 0.25s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  flex: 1;
  text-align: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${ALARM_COLORS.muted};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const FormArea = styled.div`
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${ALARM_COLORS.primary};
  }
`;

const Input = styled.input`
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

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
  }
`;

const TimeInput = styled.input`
  width: 50px;
  padding: 10px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
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

  &:disabled {
    background: #2a2d35;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  background: #333842;
  color: #e0e0e0;

  &:focus {
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }
`;

const SetCurrentTimeButton = styled.button`
  padding: 8px 7px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #333842;
  font-size: 13px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryLight};
    border-color: ${ALARM_COLORS.primary};
    color: ${ALARM_COLORS.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background: ${ALARM_COLORS.primary};
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${ALARM_COLORS.primaryDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AlarmBox = styled.div`
  padding: 16px;
  background: #333842;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 12px;
`;

const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' && `
    background: ${ALARM_COLORS.primary};
    color: white;

    &:hover {
      background: #0056b3;
    }
  `}

  ${props => props.$variant === 'secondary' && `
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  `}
`;

const PreviewButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  margin-top: 16px;
  border-radius: 8px;
  border: 1px solid ${ALARM_COLORS.primary};
  background: rgba(74, 144, 226, 0.1);
  color: ${ALARM_COLORS.primary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba(74, 144, 226, 0.2);
    border-color: #0056b3;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// ==================== COMPONENT ====================
const AlarmModal = ({ isOpen, scheduleData, onSave, onClose }) => {
  if (!isOpen) return null;

  const isPastDate = scheduleData?.isPastDate || false;
  const scheduleDateStr = scheduleData?.date ? format(new Date(scheduleData.date), 'yyyy년 M월 d일 (E)', { locale: ko }) : '';
  const anniversaryDaysInputRef = useRef(null);

  // ==================== STATE ====================
  // 폼 상태
  const [alarmTitle, setAlarmTitle] = useState('');
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [anniversaryRepeat, setAnniversaryRepeat] = useState('');

  // 모달 상태
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState(null);

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [alarmToEdit, setAlarmToEdit] = useState(null);

  // 수정 전 확인 모달
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [editConfirmMessage, setEditConfirmMessage] = useState('');
  const [pendingEditAlarm, setPendingEditAlarm] = useState(null);

  const [anniversaryTiming, setAnniversaryTiming] = useState('');
  const [anniversaryDaysBefore, setAnniversaryDaysBefore] = useState('');

  // 알람 리스트
  const [alarms, setAlarms] = useState([]);

  // 기본 알람옵션
  const [showOptions, setShowOptions] = useState(false);
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);
  const [notificationType, setNotificationType] = useState('sound');
  const [advanceNotice, setAdvanceNotice] = useState(ADVANCE_NOTICE_CONFIG.defaultValue);
  const [repeatInterval, setRepeatInterval] = useState(ALARM_REPEAT_CONFIG.defaultInterval);
  const [repeatCount, setRepeatCount] = useState(ALARM_REPEAT_CONFIG.defaultCount);

  // 미리보기 상태
  const [previewToasts, setPreviewToasts] = useState([]);
  const previewTimersRef = useRef([]);

  // Refs
  const optionsButtonRef = useRef(null);
  const soundFileInputRef = useRef(null);
  const audioRef = useRef(null);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    if (!isOpen || !scheduleData?.date) return;

    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      if (!allSchedulesStr) return;

      const allSchedules = JSON.parse(allSchedulesStr);
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const dayData = allSchedules[dateKey];

      // 중복 제거를 위한 Map 사용
      const alarmsMap = new Map();

      // 1. 해당 날짜에 직접 등록된 알람 로드 (원본 우선)
      if (dayData?.alarm?.registeredAlarms) {
        dayData.alarm.registeredAlarms.forEach(alarm => {
          alarmsMap.set(alarm.id, alarm);
        });
      }

      // 2. 반복 기념일 알람 로드 (직접 등록된 알람과 ID가 겹치지 않는 것만)
      const repeatedAnniversaries = getRepeatedAnniversaries(new Date(scheduleData.date), allSchedules);
      repeatedAnniversaries.forEach(alarm => {
        if (!alarmsMap.has(alarm.id)) {
          alarmsMap.set(alarm.id, alarm);
        }
      });

      const loadedAlarms = Array.from(alarmsMap.values());
      setAlarms(loadedAlarms);
    } catch (error) {
      console.error('알람 데이터 로드 오류:', error);
    }
  }, [isOpen, scheduleData?.date]);

  // ==================== HANDLERS ====================
  const handleClose = () => {
    // 폼 리셋
    setAlarmTitle('');
    setHourInput('');
    setMinuteInput('');
    setIsAnniversary(false);
    setAnniversaryRepeat('');
    setAnniversaryTiming('');
    setAnniversaryDaysBefore('');

    // 기본 알람옵션 접기
    setShowOptions(false);

    onClose();
  };

  // Handle sound file upload
  const handleSoundUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (500KB 제한 - 알람음은 짧을수록 좋음)
      const maxSize = 500 * 1024; // 500KB
      if (file.size > maxSize) {
        setValidationMessage('알람 소리는 500KB 이하여야 합니다.\n짧은 알람음(3-5초) 사용을 권장합니다.');
        setShowValidationModal(true);
        return;
      }

      setCustomSoundName(file.name);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const audioData = event.target.result;

        // IndexedDB에 저장
        try {
          await saveAudioFile('alarm_sound_main', audioData);
          setSoundFile('custom');
          console.log('✅ 알람 소리 저장 완료:', file.name);
        } catch (error) {
          console.error('❌ 알람 소리 저장 실패:', error);
          setValidationMessage('알람 소리 저장에 실패했습니다.');
          setShowValidationModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Play sound preview with volume
  const handlePlaySound = async () => {
    if (audioRef.current) {
      if (soundFile === 'default') {
        audioRef.current.src = '/sound/Schedule_alarm/default.mp3';
      } else if (soundFile === 'custom') {
        // IndexedDB에서 커스텀 사운드 불러오기
        const audioData = await loadAudioFile('alarm_sound_main');
        if (audioData) {
          audioRef.current.src = audioData;
        } else {
          console.error('❌ 커스텀 사운드를 찾을 수 없습니다.');
          setValidationMessage('저장된 알람 소리를 찾을 수 없습니다.');
          setShowValidationModal(true);
          return;
        }
      }
      audioRef.current.volume = volume / 100;
      audioRef.current.play();
    }
  };

  // Handle volume change with sound preview
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);

    // Play sound preview at new volume
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    // 일반 알람은 +1분, 기념일은 현재시간 그대로
    if (!isAnniversary) {
      now.setMinutes(now.getMinutes() + 1);
    }
    const hours = now.getHours();
    const minutes = now.getMinutes();
    setHourInput(hours < 10 ? '0' + hours : hours.toString());
    setMinuteInput(minutes < 10 ? '0' + minutes : minutes.toString());
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    const byteLength = Array.from(value).reduce((acc, char) => {
      return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
    }, 0);
    if (byteLength <= 20) {
      setAlarmTitle(value);
    }
  };

  // 알람 미리보기 시뮬레이션
  const handlePreview = () => {
    // 기존 미리보기 타이머 모두 제거
    previewTimersRef.current.forEach(timer => clearTimeout(timer));
    previewTimersRef.current = [];
    setPreviewToasts([]);

    // 미리보기 알람 데이터
    const previewData = {
      title: alarmTitle || '알람 미리보기',
      content: '설정된 알람이 이렇게 울립니다',
      soundFile,
      volume,
      notificationType,
    };

    // 첫 번째 토스트 즉시 표시
    const firstToastId = `preview_${Date.now()}`;
    setPreviewToasts([{
      id: firstToastId,
      ...previewData,
      currentRepeat: 1,
      totalRepeats: repeatCount
    }]);

    // 반복 처리
    if (repeatCount > 1) {
      for (let i = 2; i <= repeatCount; i++) {
        const timer = setTimeout(() => {
          const toastId = `preview_${Date.now()}_${i}`;
          setPreviewToasts(prev => [...prev, {
            id: toastId,
            ...previewData,
            currentRepeat: i,
            totalRepeats: repeatCount
          }]);
        }, (i - 1) * repeatInterval * 1000);

        previewTimersRef.current.push(timer);
      }
    }

    // 미리 알림 시뮬레이션 (advanceNotice가 있을 경우)
    if (advanceNotice > 0) {
      // 미리 알림 메시지는 5초 후에 표시 (실제로는 시간차가 있지만 미리보기에서는 짧게)
      const advanceTimer = setTimeout(() => {
        const advanceToastId = `preview_advance_${Date.now()}`;
        setPreviewToasts(prev => [...prev, {
          id: advanceToastId,
          title: `[미리 알림] ${alarmTitle || '알람 미리보기'}`,
          content: `${ADVANCE_NOTICE_CONFIG.options[advanceNotice]} 알림입니다`,
          soundFile,
          volume,
          notificationType,
          currentRepeat: 1,
          totalRepeats: repeatCount
        }]);

        // 미리 알림도 반복 처리
        if (repeatCount > 1) {
          for (let i = 2; i <= repeatCount; i++) {
            const advRepeatTimer = setTimeout(() => {
              const toastId = `preview_advance_${Date.now()}_${i}`;
              setPreviewToasts(prev => [...prev, {
                id: toastId,
                title: `[미리 알림] ${alarmTitle || '알람 미리보기'}`,
                content: `${ADVANCE_NOTICE_CONFIG.options[advanceNotice]} 알림입니다`,
                soundFile,
                volume,
                notificationType,
                currentRepeat: i,
                totalRepeats: repeatCount
              }]);
            }, (i - 1) * repeatInterval * 1000);

            previewTimersRef.current.push(advRepeatTimer);
          }
        }
      }, 5000); // 5초 후 미리 알림 표시

      previewTimersRef.current.push(advanceTimer);
    }
  };

  // 미리보기 토스트 닫기
  const handleDismissPreview = (toastId) => {
    setPreviewToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      previewTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // 토글 핸들러
  const handleToggleAlarm = (id) => {
    console.log('토글 클릭 - ID:', id);
    console.log('현재 알람 목록:', alarms);

    let toggledAlarm = null;
    const alarm = alarms.find(a => a.id === id);

    // 반복 기념일 알람인 경우 전체 기념일 토글
    if (alarm?.isRepeated) {
      try {
        const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
        if (allSchedulesStr) {
          const allSchedules = JSON.parse(allSchedulesStr);

          // 원본 알람을 찾아서 enabled 상태 변경
          const originalDateStr = format(alarm.originalDate, 'yyyy-MM-dd');
          const originalDayData = allSchedules[originalDateStr];

          if (originalDayData?.alarm?.registeredAlarms) {
            const originalAlarms = originalDayData.alarm.registeredAlarms;
            const originalAlarmIndex = originalAlarms.findIndex(a => a.id === id);

            if (originalAlarmIndex !== -1) {
              const currentEnabled = alarm.enabled !== false;
              const newEnabled = !currentEnabled;

              // 원본 알람의 enabled 상태 변경 (disabledDates는 초기화)
              originalAlarms[originalAlarmIndex] = {
                ...originalAlarms[originalAlarmIndex],
                enabled: newEnabled,
                disabledDates: [] // 전체 토글이므로 개별 비활성 날짜 초기화
              };

              allSchedules[originalDateStr].alarm.registeredAlarms = originalAlarms;
              localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));

              // UI 업데이트: 현재 보여지는 알람 목록 업데이트
              const updatedAlarms = alarms.map(a =>
                a.id === id ? { ...a, enabled: newEnabled } : a
              );
              setAlarms(updatedAlarms);

              toggledAlarm = { ...alarm, enabled: newEnabled };

              if (onSave && toggledAlarm) {
                const actionType = newEnabled ? 'toggle_on' : 'toggle_off';
                onSave({ registeredAlarms: updatedAlarms, toggledAlarm, alarmType: 'anniversary' }, actionType);
              }
            }
          }
        }
      } catch (error) {
        console.error('반복 기념일 토글 오류:', error);
      }
      return;
    }

    // 일반 알람 또는 원본 기념일 알람 처리
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === id) {
        // enabled가 undefined나 null일 경우를 대비
        const currentEnabled = alarm.enabled !== false;
        console.log('현재 enabled:', alarm.enabled, '→ currentEnabled:', currentEnabled, '→ 변경 후:', !currentEnabled);

        // 일반 알람이 비활성화되는 경우 disabledAt 저장
        const updates = { enabled: !currentEnabled };
        if (!alarm.isAnniversary && currentEnabled && alarm.calculatedTime) {
          const alarmTime = new Date(alarm.calculatedTime);
          const now = new Date();
          // 알람 시간이 경과된 경우에만 disabledAt 저장
          if (alarmTime < now) {
            updates.disabledAt = now.toISOString();
          }
        }

        toggledAlarm = { ...alarm, ...updates };
        return toggledAlarm;
      }
      return alarm;
    });

    console.log('업데이트된 알람 목록:', updatedAlarms);
    setAlarms(updatedAlarms);

    // localStorage에 저장
    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      if (allSchedulesStr) {
        const allSchedules = JSON.parse(allSchedulesStr);
        const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');

        if (!allSchedules[dateKey]) {
          allSchedules[dateKey] = {};
        }
        if (!allSchedules[dateKey].alarm) {
          allSchedules[dateKey].alarm = {};
        }

        // 반복 알람이 아닌 경우만 해당 날짜에 저장
        const alarmsToSave = updatedAlarms.filter(a => !a.isRepeated);
        allSchedules[dateKey].alarm.registeredAlarms = alarmsToSave;
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));

        // onSave 호출 - 토글된 알람 정보와 함께 전달
        if (onSave && toggledAlarm) {
          const actionType = toggledAlarm.enabled ? 'toggle_on' : 'toggle_off';
          const alarmType = toggledAlarm.isAnniversary ? 'anniversary' : 'normal';
          onSave({ registeredAlarms: updatedAlarms, toggledAlarm, alarmType }, actionType);
        }
      }

    } catch (error) {
      console.error('토글 저장 오류:', error);
    }
  };

  const isDisabled = isPastDate && !isAnniversary;

  // 알람 등록 핸들러
  const handleRegisterAlarm = () => {
    console.log('알람 등록 버튼 클릭');

    // 유효성 검사 (순서: 타이틀 → 알림주기 → 알림시기 → 알람 시간)
    if (!alarmTitle.trim()) {
      setValidationMessage('알람 타이틀을 입력해주세요.');
      setShowValidationModal(true);
      return;
    }

    // 기념일 알람 유효성 검사
    if (isAnniversary) {
      if (!anniversaryRepeat) {
        setValidationMessage('알림주기를 선택해주세요.');
        setShowValidationModal(true);
        return;
      }
      if (!anniversaryTiming) {
        setValidationMessage('알림시기를 선택해주세요.');
        setShowValidationModal(true);
        return;
      }
      if (anniversaryTiming === 'before' && !anniversaryDaysBefore) {
        setValidationMessage('며칠 전에 알림을 받을지 입력해주세요.');
        setShowValidationModal(true);
        return;
      }
    }

    if (hourInput === '' || minuteInput === '') {
      setValidationMessage('알람 시간을 입력해주세요.');
      setShowValidationModal(true);
      return;
    }

    const hour = parseInt(hourInput, 10);
    const minute = parseInt(minuteInput, 10);

    // 알람 시간 계산
    const alarmDate = new Date(scheduleData.date);
    alarmDate.setHours(hour, minute, 0, 0);

    // 새 알람 객체 생성
    const newAlarm = {
      id: Date.now().toString(),
      title: alarmTitle,
      calculatedTime: alarmDate.toISOString(),
      enabled: true,
      isAnniversary: isAnniversary,
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : undefined,
      anniversaryTiming: isAnniversary ? anniversaryTiming : undefined,
      anniversaryDaysBefore: isAnniversary && anniversaryTiming === 'before' ? parseInt(anniversaryDaysBefore, 10) : undefined,
      // 알람 옵션
      soundFile,
      volume,
      notificationType,
      advanceNotice,
      repeatInterval,
      repeatCount,
    };

    console.log('새 알람:', newAlarm);

    // 알람 목록에 추가
    const updatedAlarms = [...alarms, newAlarm];
    setAlarms(updatedAlarms);

    // onSave 호출 (App.jsx의 handleSaveAlarm이 localStorage와 Firestore 저장 처리)
    try {
      if (onSave) {
        const alarmType = isAnniversary ? 'anniversary' : 'normal';
        onSave({ registeredAlarms: updatedAlarms, alarmType }, 'register');
      }

      // 입력 필드 초기화
      setAlarmTitle('');
      setHourInput('');
      setMinuteInput('');
      setIsAnniversary(false);
      setAnniversaryRepeat('');
      setAnniversaryTiming('');
      setAnniversaryDaysBefore('');

    } catch (error) {
      console.error('알람 등록 오류:', error);
      setValidationMessage('알람 등록 중 오류가 발생했습니다.');
      setShowValidationModal(true);
    }
  };

  // 삭제 핸들러
  const handleDeleteAlarm = (alarm) => {
    setAlarmToDelete(alarm);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!alarmToDelete) return;

    console.log('=== 삭제 시작 ===');
    console.log('삭제할 알람:', alarmToDelete);
    console.log('현재 알람 목록:', alarms);

    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      const allSchedules = allSchedulesStr ? JSON.parse(allSchedulesStr) : {};

      // 반복 기념일인 경우 원본 날짜에서 삭제
      if (alarmToDelete.isRepeated) {
        console.log('반복 기념일 삭제 로직');
        const originalDateStr = format(alarmToDelete.originalDate, 'yyyy-MM-dd');
        const originalDayData = allSchedules[originalDateStr];

        if (originalDayData?.alarm?.registeredAlarms) {
          console.log('원본 날짜:', originalDateStr);
          console.log('원본 날짜의 알람들:', originalDayData.alarm.registeredAlarms);

          const originalAlarms = originalDayData.alarm.registeredAlarms.filter(
            a => a.id !== alarmToDelete.id
          );
          console.log('삭제 후 원본 알람들:', originalAlarms);

          allSchedules[originalDateStr].alarm.registeredAlarms = originalAlarms;
          localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));
        }
      } else {
        console.log('일반 알람 또는 원본 기념일 삭제 로직');
        const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
        console.log('현재 날짜:', dateKey);

        // localStorage 업데이트: 해당 날짜의 알람 목록에서 삭제
        if (!allSchedules[dateKey]) {
          allSchedules[dateKey] = {};
        }
        if (!allSchedules[dateKey].alarm) {
          allSchedules[dateKey].alarm = {};
        }

        // 현재 날짜에 직접 등록된 알람 중에서 삭제할 알람 제외
        const currentAlarms = allSchedules[dateKey].alarm.registeredAlarms || [];
        const alarmsToSave = currentAlarms.filter(a => a.id !== alarmToDelete.id);
        console.log('localStorage에 저장할 알람들:', alarmsToSave);
        allSchedules[dateKey].alarm.registeredAlarms = alarmsToSave;
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));
      }

      // localStorage 업데이트 후 알람 목록 완전히 다시 로드 (중복 제거)
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const reloadedSchedules = JSON.parse(localStorage.getItem('calendarSchedules_shared'));
      const alarmsMap = new Map();

      // 1. 해당 날짜에 직접 등록된 알람 로드 (원본 우선)
      if (reloadedSchedules[dateKey]?.alarm?.registeredAlarms) {
        reloadedSchedules[dateKey].alarm.registeredAlarms.forEach(alarm => {
          alarmsMap.set(alarm.id, alarm);
        });
      }

      // 2. 반복 기념일 알람 로드 (직접 등록된 알람과 ID가 겹치지 않는 것만)
      const repeatedAnniversaries = getRepeatedAnniversaries(new Date(scheduleData.date), reloadedSchedules);
      repeatedAnniversaries.forEach(alarm => {
        if (!alarmsMap.has(alarm.id)) {
          alarmsMap.set(alarm.id, alarm);
        }
      });

      const loadedAlarms = Array.from(alarmsMap.values());
      console.log('다시 로드된 알람들:', loadedAlarms);
      setAlarms(loadedAlarms);

      // onSave 호출
      if (onSave) {
        const alarmType = alarmToDelete?.isAnniversary ? 'anniversary' : 'normal';
        onSave({ registeredAlarms: loadedAlarms, alarmType }, 'delete');
      }

      setShowDeleteModal(false);
      setAlarmToDelete(null);
    } catch (error) {
      console.error('알람 삭제 오류:', error);
      setValidationMessage('알람 삭제 중 오류가 발생했습니다.');
      setShowValidationModal(true);
    }
  };

  // 수정 핸들러
  const handleEditAlarm = (alarm) => {
    console.log('수정 알람:', alarm);

    // 수정 확인 메시지 결정
    let confirmMessage = '';

    if (alarm.isRepeated) {
      // 반복 주기일
      confirmMessage = '해당 기념일 전체에 영향을 줍니다.';
    } else if (alarm.isAnniversary) {
      // 원본 기념일
      confirmMessage = '이 기념일 설정을 수정할까요?';
    } else {
      // 일반 알람
      confirmMessage = '이 알람 설정을 수정할까요?';
    }

    setPendingEditAlarm(alarm);
    setEditConfirmMessage(confirmMessage);
    setShowEditConfirmModal(true);
  };

  // 수정 확인 후 실제 수정 모달 열기
  const handleConfirmEdit = () => {
    setShowEditConfirmModal(false);
    setAlarmToEdit(pendingEditAlarm);
    setShowEditModal(true);
    setPendingEditAlarm(null);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setShowEditConfirmModal(false);
    setPendingEditAlarm(null);
  };

  const handleSaveEdit = (updatedAlarm) => {
    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      const allSchedules = allSchedulesStr ? JSON.parse(allSchedulesStr) : {};

      console.log('=== 알람 수정 시작 ===');
      console.log('수정된 알람:', updatedAlarm);

      // 반복 기념일인 경우 원본 날짜에 저장
      if (updatedAlarm.isRepeated && updatedAlarm.originalDate) {
        const originalDateStr = format(updatedAlarm.originalDate, 'yyyy-MM-dd');
        console.log('반복 기념일 수정 - 원본 날짜:', originalDateStr);

        if (allSchedules[originalDateStr]?.alarm?.registeredAlarms) {
          const originalAlarms = allSchedules[originalDateStr].alarm.registeredAlarms.map(a =>
            a.id === updatedAlarm.id ? { ...updatedAlarm, isRepeated: undefined, originalDate: undefined } : a
          );
          allSchedules[originalDateStr].alarm.registeredAlarms = originalAlarms;
          localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));
          console.log('원본 날짜에 저장 완료');
        }
      } else {
        // 일반 알람 또는 원본 기념일 수정
        const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
        console.log('원본 알람 수정 - 현재 날짜:', dateKey);

        if (!allSchedules[dateKey]) {
          allSchedules[dateKey] = {};
        }
        if (!allSchedules[dateKey].alarm) {
          allSchedules[dateKey].alarm = {};
        }

        const currentAlarms = allSchedules[dateKey].alarm.registeredAlarms || [];
        const updatedAlarmsForStorage = currentAlarms.map(a =>
          a.id === updatedAlarm.id ? updatedAlarm : a
        );

        allSchedules[dateKey].alarm.registeredAlarms = updatedAlarmsForStorage;
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));
        console.log('현재 날짜에 저장 완료');
      }

      // localStorage 업데이트 후 알람 목록 완전히 다시 로드 (중복 제거)
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const reloadedSchedules = JSON.parse(localStorage.getItem('calendarSchedules_shared'));
      const alarmsMap = new Map();

      // 1. 해당 날짜에 직접 등록된 알람 로드 (원본 우선)
      if (reloadedSchedules[dateKey]?.alarm?.registeredAlarms) {
        reloadedSchedules[dateKey].alarm.registeredAlarms.forEach(alarm => {
          alarmsMap.set(alarm.id, alarm);
        });
      }

      // 2. 반복 기념일 알람 로드 (직접 등록된 알람과 ID가 겹치지 않는 것만)
      const repeatedAnniversaries = getRepeatedAnniversaries(new Date(scheduleData.date), reloadedSchedules);
      repeatedAnniversaries.forEach(alarm => {
        if (!alarmsMap.has(alarm.id)) {
          alarmsMap.set(alarm.id, alarm);
        }
      });

      const reloadedAlarms = Array.from(alarmsMap.values());
      console.log('수정 후 다시 로드된 알람들:', reloadedAlarms);
      setAlarms(reloadedAlarms);

      // onSave 호출
      if (onSave) {
        const alarmType = updatedAlarm?.isAnniversary ? 'anniversary' : 'normal';
        onSave({ registeredAlarms: reloadedAlarms, alarmType }, 'update');
      }

      setShowEditModal(false);
      setAlarmToEdit(null);
    } catch (error) {
      console.error('알람 수정 오류:', error);
      setValidationMessage('알람 수정 중 오류가 발생했습니다.');
      setShowValidationModal(true);
    }
  };

  return (
    <Portal>
      <Overlay>
        <ModalContent $isPastDate={isPastDate}>
          <Header>
            <div style={{ width: '32px' }}></div>
            <HeaderTitle>{scheduleDateStr} {isPastDate ? '알람 기록' : '알람 설정'}</HeaderTitle>
            <CloseButton onClick={handleClose}>×</CloseButton>
          </Header>

          <FormArea>
            {/* 과거 날짜 안내 */}
            {isPastDate && (
              <div style={{
                padding: '12px',
                background: '#3d424d',
                borderRadius: '8px',
                border: '1px solid #4a90e2',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '600', marginBottom: '4px' }}>
                  과거 날짜
                </div>
                <div style={{ fontSize: '13px', color: '#b0b0b0' }}>
                  기념일 알람만 등록 가능합니다.
                </div>
              </div>
            )}

            {/* 1. 알람 타이틀 */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <TitleIcon />
                알람 타이틀<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
              </SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  type="text"
                  placeholder="예: 수빈이 생일"
                  value={alarmTitle}
                  onChange={handleTitleChange}
                  disabled={isDisabled}
                  style={{ flex: 1 }}
                />
                <div style={{ fontSize: '11px', color: '#808080', whiteSpace: 'nowrap' }}>
                  {Array.from(alarmTitle).reduce((acc, char) => acc + (char.charCodeAt(0) > 127 ? 2 : 1), 0)}/20
                </div>
              </div>
            </Section>

            {/* 2. 기념일 체크박스 + 알람주기 + 알람시기 */}
            <Section style={{ marginTop: '-8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isAnniversary ? '16px' : '0' }}>
                <input
                  type="checkbox"
                  checked={isAnniversary}
                  onChange={(e) => setIsAnniversary(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  disabled={isPastDate}
                />
                <span
                  style={{ fontSize: '14px', color: '#e0e0e0', cursor: isPastDate ? 'default' : 'pointer', opacity: isPastDate ? 0.5 : 1 }}
                  onClick={() => !isPastDate && setIsAnniversary(!isAnniversary)}
                >
                  기념일로 등록 {isPastDate && '(필수)'}
                </span>
              </div>

              {/* 기념일 설정 */}
              {isAnniversary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 알림주기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '8px' }}>
                      알림주기 <span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
                    </div>
                    <RadioGroup style={{ flexDirection: 'row', gap: '8px' }}>
                      <RadioOption $checked={anniversaryRepeat === 'daily'} onClick={() => setAnniversaryRepeat('daily')}>
                        <input type="radio" name="anniversaryRepeat" value="daily" checked={anniversaryRepeat === 'daily'} onChange={() => {}} />
                        <span>매일</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'weekly'} onClick={() => setAnniversaryRepeat('weekly')}>
                        <input type="radio" name="anniversaryRepeat" value="weekly" checked={anniversaryRepeat === 'weekly'} onChange={() => {}} />
                        <span>매주</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'monthly'} onClick={() => setAnniversaryRepeat('monthly')}>
                        <input type="radio" name="anniversaryRepeat" value="monthly" checked={anniversaryRepeat === 'monthly'} onChange={() => {}} />
                        <span>매달</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'yearly'} onClick={() => setAnniversaryRepeat('yearly')}>
                        <input type="radio" name="anniversaryRepeat" value="yearly" checked={anniversaryRepeat === 'yearly'} onChange={() => {}} />
                        <span>매년</span>
                      </RadioOption>
                    </RadioGroup>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#808080', lineHeight: '1.4' }}>
                      * 매일 주기는 등록일 이후의 날짜에는 점표시 되지 않습니다
                    </div>
                  </div>

                  {/* 알림시기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '8px' }}>
                      알림시기 <span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          id="timing-today"
                          name="anniversaryTiming"
                          value="today"
                          checked={anniversaryTiming === 'today'}
                          onChange={() => setAnniversaryTiming('today')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="timing-today" style={{ fontSize: '14px', color: '#e0e0e0', cursor: 'pointer' }}>
                          당일
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          id="timing-before"
                          name="anniversaryTiming"
                          value="before"
                          checked={anniversaryTiming === 'before'}
                          onChange={() => {
                            setAnniversaryTiming('before');
                            setTimeout(() => anniversaryDaysInputRef.current?.focus(), 0);
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="timing-before" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#e0e0e0', cursor: 'pointer' }}>
                          <TimeInput
                            ref={anniversaryDaysInputRef}
                            type="number"
                            min="1"
                            max="30"
                            value={anniversaryDaysBefore || ''}
                            placeholder="1-30"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 30)) {
                                setAnniversaryTiming('before');
                                setAnniversaryDaysBefore(val === '' ? '' : parseInt(val));
                              }
                            }}
                            onFocus={() => {
                              setAnniversaryTiming('before');
                            }}
                            style={{
                              width: '60px',
                              padding: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <span>일 전</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* 3. 알람 시간 */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <ClockIcon />
                알람 시간<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
              </SectionTitle>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <TimeInput
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0-23"
                    value={hourInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                        setHourInput(val);
                      }
                    }}
                    onBlur={() => {
                      if (hourInput && hourInput.length === 1) {
                        setHourInput('0' + hourInput);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={isDisabled}
                  />
                  <span style={{ fontSize: '16px', color: '#e0e0e0' }}>시</span>
                  <TimeInput
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0-59"
                    value={minuteInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                        setMinuteInput(val);
                      }
                    }}
                    onBlur={() => {
                      if (minuteInput && minuteInput.length === 1) {
                        setMinuteInput('0' + minuteInput);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={isDisabled}
                  />
                  <span style={{ fontSize: '16px', color: '#e0e0e0' }}>분</span>
                </div>
                <SetCurrentTimeButton onClick={handleSetCurrentTime} disabled={isDisabled}>
                  현재시간
                </SetCurrentTimeButton>
                <AddButton onClick={handleRegisterAlarm} disabled={isDisabled} style={{ marginLeft: 'auto' }}>
                  알람등록
                </AddButton>
              </div>
            </Section>

            {/* 4. 등록된 기념일 (기념일이 있을 때만 표시) */}
            {alarms.filter(alarm => alarm.isAnniversary).length > 0 && (
              <Section>
                <SectionTitle>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: ALARM_COLORS.primary,
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginRight: '8px'
                  }}>
                    기
                  </div>
                  등록된 기념일 ({alarms.filter(alarm => alarm.isAnniversary).length}개)
                </SectionTitle>
                <AlarmBox>
                  <AlarmList>
                    {alarms
                      .filter(alarm => alarm.isAnniversary)
                      .slice()
                      .sort((a, b) => {
                        const timeA = new Date(a.calculatedTime).getTime();
                        const timeB = new Date(b.calculatedTime).getTime();
                        return timeA - timeB;
                      })
                      .map((alarm) => (
                        <AlarmItemComponent
                          key={alarm.id}
                          alarm={alarm}
                          scheduleData={scheduleData}
                          onToggle={handleToggleAlarm}
                          onDelete={handleDeleteAlarm}
                          onEdit={handleEditAlarm}
                        />
                      ))}
                  </AlarmList>
                </AlarmBox>
              </Section>
            )}

            {/* 5. 등록된 알람 (일반 알람만 표시, 시간순 정렬) */}
            <Section>
              <div style={{
                height: '1px',
                background: '#dee2e6',
                margin: '0 0 16px 0'
              }} />
              <SectionTitle>
                <BellIcon />
                등록된 알람 ({alarms.filter(alarm => !alarm.isAnniversary).length}개)
              </SectionTitle>
              <AlarmBox>
                <AlarmList>
                  {alarms
                    .filter(alarm => !alarm.isAnniversary)
                    .slice()
                    .sort((a, b) => {
                      const timeA = new Date(a.calculatedTime).getTime();
                      const timeB = new Date(b.calculatedTime).getTime();
                      return timeA - timeB;
                    })
                    .map((alarm) => (
                      <div
                        key={alarm.id}
                        style={{
                          opacity: isPastDate ? 0.5 : 1
                        }}
                      >
                        <AlarmItemComponent
                          alarm={alarm}
                          scheduleData={scheduleData}
                          onToggle={handleToggleAlarm}
                          onDelete={handleDeleteAlarm}
                          onEdit={isPastDate ? null : handleEditAlarm}
                          isPastNormalAlarm={isPastDate}
                        />
                      </div>
                    ))}
                </AlarmList>
              </AlarmBox>
            </Section>

            {/* 6. 기본 알람옵션 (접기/펴기 가능) */}
            {!isPastDate && (
              <>
                <Section>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#333842',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#e0e0e0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#3d424d'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#333842'}
                  >
                    <span>기본 알람옵션</span>
                    <span style={{ transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </button>
                </Section>

                {/* 기본 알람옵션 설명 + 초기화 버튼 */}
                {showOptions && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 20px 8px 20px',
                    fontSize: '12px',
                    color: ALARM_COLORS.muted,
                    background: '#333842',
                    borderRadius: '0 0 8px 8px',
                    margin: '0 20px 8px 20px',
                    marginTop: '-4px'
                  }}>
                    <span>
                      개별 알람옵션을 지정하지 않는 한<br />
                      아래의 설정값이 적용됩니다.
                    </span>
                    <button
                      onClick={() => {
                        setSoundFile('default');
                        setVolume(80);
                        setNotificationType('sound');
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        color: '#e0e0e0',
                        background: '#3d424d',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4a5058';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3d424d';
                        e.currentTarget.style.color = '#e0e0e0';
                      }}
                    >
                      초기화
                    </button>
                  </div>
                )}

                {/* Alarm Sound */}
                {showOptions && (
                  <Section style={{ marginTop: '-16px' }}>
                    <SectionTitle>
                      <VolumeIcon />
                      알람 소리
                    </SectionTitle>
                    <SoundUploadContainer>
                      <Select
                        value={soundFile === 'default' ? 'default' : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'default') {
                            setSoundFile('default');
                            setCustomSoundName('');
                          } else if (e.target.value === 'custom') {
                            setSoundFile('custom');
                            setTimeout(() => {
                              soundFileInputRef.current?.click();
                            }, 50);
                          }
                        }}
                      >
                        <option value="default">기본 알림음</option>
                        <option value="custom">사용자 지정</option>
                      </Select>

                      {/* 항상 렌더링하되, 필요할 때만 보이도록 */}
                      <HiddenFileInput
                        ref={soundFileInputRef}
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={handleSoundUpload}
                        style={{ display: 'none' }}
                      />
                      {soundFile !== 'default' && (
                        <FileInputLabel onClick={() => soundFileInputRef.current?.click()}>
                          사운드 파일 선택
                        </FileInputLabel>
                      )}
                      {soundFile !== 'default' && customSoundName && (
                        <FileName>선택된 파일: {customSoundName}</FileName>
                      )}

                      <SoundPreview>
                        <PlayButton onClick={handlePlaySound}>▶</PlayButton>
                        <span style={{ fontSize: '13px', color: '#e0e0e0' }}>
                          미리듣기
                        </span>
                      </SoundPreview>
                    </SoundUploadContainer>
                  </Section>
                )}

                {/* Volume Control */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <VolumeIcon />
                      알람 볼륨
                    </SectionTitle>
                    <VolumeContainer>
                      <VolumeSlider
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                      />
                      <VolumeLabel>{volume}%</VolumeLabel>
                    </VolumeContainer>
                  </Section>
                )}

                {/* Notification Type */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <VibrateIcon />
                      알림 유형
                    </SectionTitle>
                    <RadioGroup>
                      <RadioOption $checked={notificationType === 'sound'}>
                        <input
                          type="radio"
                          name="notificationType"
                          value="sound"
                          checked={notificationType === 'sound'}
                          onChange={(e) => setNotificationType(e.target.value)}
                        />
                        <span>소리만</span>
                      </RadioOption>
                      <RadioOption $checked={notificationType === 'vibration'}>
                        <input
                          type="radio"
                          name="notificationType"
                          value="vibration"
                          checked={notificationType === 'vibration'}
                          onChange={(e) => setNotificationType(e.target.value)}
                        />
                        <span>진동만</span>
                      </RadioOption>
                      <RadioOption $checked={notificationType === 'both'}>
                        <input
                          type="radio"
                          name="notificationType"
                          value="both"
                          checked={notificationType === 'both'}
                          onChange={(e) => setNotificationType(e.target.value)}
                        />
                        <span>소리 + 진동</span>
                      </RadioOption>
                    </RadioGroup>
                  </Section>
                )}

                {/* Advance Notice */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <ClockIcon />
                      미리 알림 <span style={{ fontSize: '11px', color: '#868e96', fontWeight: 'normal', marginLeft: '4px' }}>(알람 시간 전에 미리 한 번 더 울립니다)</span>
                    </SectionTitle>
                    <select
                      value={advanceNotice}
                      onChange={(e) => setAdvanceNotice(parseInt(e.target.value, 10))}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: '#1f2229',
                        color: '#e0e0e0',
                        fontSize: '14px',
                      }}
                    >
                      {Object.entries(ADVANCE_NOTICE_CONFIG.options).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Section>
                )}

                {/* Repeat Count */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <AlertIcon />
                      반복 횟수 <span style={{ fontSize: '11px', color: '#868e96', fontWeight: 'normal', marginLeft: '4px' }}>(특정 간격으로 알람을 반복하여 울립니다)</span>
                    </SectionTitle>
                    <RadioGroup>
                      {Object.entries(ALARM_REPEAT_CONFIG.counts).map(([value, label]) => (
                        <RadioOption key={value} $checked={repeatCount === parseInt(value, 10)}>
                          <input
                            type="radio"
                            name="repeatCount"
                            value={value}
                            checked={repeatCount === parseInt(value, 10)}
                            onChange={(e) => setRepeatCount(parseInt(e.target.value, 10))}
                          />
                          <span>{label}</span>
                        </RadioOption>
                      ))}
                    </RadioGroup>
                  </Section>
                )}

                {/* Repeat Interval - 반복 횟수가 3회일 때만 표시 */}
                {showOptions && repeatCount === 3 && (
                  <Section>
                    <SectionTitle>
                      <BellIcon />
                      반복 간격
                    </SectionTitle>
                    <RadioGroup>
                      {Object.entries(ALARM_REPEAT_CONFIG.intervals).map(([value, label]) => (
                        <RadioOption key={value} $checked={repeatInterval === parseInt(value, 10)}>
                          <input
                            type="radio"
                            name="repeatInterval"
                            value={value}
                            checked={repeatInterval === parseInt(value, 10)}
                            onChange={(e) => setRepeatInterval(parseInt(e.target.value, 10))}
                          />
                          <span>{label}</span>
                        </RadioOption>
                      ))}
                    </RadioGroup>
                  </Section>
                )}

                {/* Preview Button */}
                {showOptions && (
                  <PreviewButton onClick={handlePreview}>
                    <BellIcon />
                    알람 미리보기
                    {advanceNotice > 0 && (
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>
                        (정시 + {ADVANCE_NOTICE_CONFIG.options[advanceNotice]})
                      </span>
                    )}
                  </PreviewButton>
                )}
              </>
            )}
          </FormArea>

          <Footer>
            <Button $variant="secondary" onClick={handleClose}>
              닫기
            </Button>
          </Footer>

          {/* Hidden audio element for sound preview */}
          <audio ref={audioRef} />
        </ModalContent>
      </Overlay>

      {/* 검증 모달 */}
      <ValidationModal
        isOpen={showValidationModal}
        message={validationMessage}
        onClose={() => setShowValidationModal(false)}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        message={
          alarmToDelete?.isRepeated || (alarmToDelete?.isAnniversary && alarmToDelete?.anniversaryRepeat && alarmToDelete?.anniversaryRepeat !== 'none')
            ? `이 기념일을 정말 삭제할까요?\n해당 기념일은 모두 삭제됩니다.`
            : `"${alarmToDelete?.title || '알람'}"을(를) 삭제하시겠습니까?`
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setAlarmToDelete(null);
        }}
      />

      {/* 수정 전 확인 모달 */}
      <EditConfirmModal
        isOpen={showEditConfirmModal}
        message={editConfirmMessage}
        onConfirm={handleConfirmEdit}
        onCancel={handleCancelEdit}
      />

      {/* 수정 모달 */}
      <AlarmEditModal
        isOpen={showEditModal}
        alarm={alarmToEdit}
        onSave={handleSaveEdit}
        onClose={() => {
          setShowEditModal(false);
          setAlarmToEdit(null);
        }}
      />

      {/* 미리보기 토스트 알림 */}
      {previewToasts.map((toast) => (
        <AlarmToast
          key={toast.id}
          isVisible={true}
          alarmData={toast}
          onClose={() => handleDismissPreview(toast.id)}
        />
      ))}
    </Portal>
  );
};

export default AlarmModal;
