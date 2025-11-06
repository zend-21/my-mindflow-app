// src/modules/calendar/AlarmModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, addDays, addHours, addMinutes, subDays, subHours, subMinutes } from 'date-fns';
import Portal from '../../components/Portal';

// ==================== ANIMATIONS ====================
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// ==================== SVG ICONS ====================
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const VibrateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="7" y="3" width="10" height="18" rx="1"></rect>
    <path d="M3 8v8"></path>
    <path d="M21 8v8"></path>
    <path d="M1 12h1"></path>
    <path d="M22 12h1"></path>
  </svg>
);

const RepeatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9"></polyline>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
    <polyline points="7 23 3 19 7 15"></polyline>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const TitleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7h16"></path>
    <path d="M9 20h6"></path>
    <path d="M12 4v16"></path>
  </svg>
);

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
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 95vw;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.25s cubic-bezier(0.2, 0, 0, 1);
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
  margin: 0;
  flex: 1;
  text-align: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
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
    background-color: #f1f3f5;
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
  color: #495057;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #4a90e2;
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;

  &:focus {
    outline: 2px solid #4a90e2;
    border-color: transparent;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;

  &:focus {
    outline: 2px solid #4a90e2;
  }
`;

const TimeInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TimeSelect = styled(Select)`
  flex: 1;
`;

const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const AlarmItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AlarmInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AlarmTimeDisplay = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #343a40;
`;

const AlarmRelativeTime = styled.span`
  font-size: 12px;
  color: #6c757d;
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #c82333;
  }
`;

const AddAlarmSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PresetButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const PresetButton = styled.button`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 4px;
  font-size: 12px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
  }
`;

const CustomInputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CustomInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SmallInput = styled(Input)`
  width: 70px;
  padding: 6px 8px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #495057;
  min-width: 40px;
`;

const AddButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #357abd;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${props => props.$checked ? '#e7f3ff' : '#f8f9fa'};
  border: 2px solid ${props => props.$checked ? '#4a90e2' : '#dee2e6'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4a90e2;
  }

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 14px;
    color: #343a40;
  }
`;

const SnoozeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
`;

const SnoozeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  outline: none;
  background: linear-gradient(to right, #4a90e2 0%, #4a90e2 ${props => props.value}%, #dee2e6 ${props => props.value}%, #dee2e6 100%);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
    border: none;
  }
`;

const VolumeLabel = styled.span`
  font-size: 14px;
  color: #495057;
  min-width: 40px;
  text-align: right;
`;

const SoundUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 10px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  font-size: 14px;
  color: #495057;

  &:hover {
    background: #e9ecef;
    border-color: #adb5bd;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileName = styled.span`
  font-size: 13px;
  color: #6c757d;
  font-style: italic;
`;

const SoundPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
`;

const PlayButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px;

  &:hover {
    background-color: #357abd;
  }
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const SaveButton = styled(Button)`
  background-color: #4a90e2;
  color: white;

  &:hover {
    background-color: #357abd;
  }
`;

const CancelButton = styled(Button)`
  background-color: #e9ecef;
  color: #495057;

  &:hover {
    background-color: #dee2e6;
  }
`;

const SetCurrentTimeButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }
`;

// ==================== COMPONENT ====================
const AlarmModal = ({ isOpen, scheduleData, onSave, onClose }) => {
  // Core alarm data
  const [alarmTitle, setAlarmTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [registeredAlarms, setRegisteredAlarms] = useState([]);

  // Custom alarm input
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(10);

  // Direct time specification
  const [directDate, setDirectDate] = useState('');
  const [directTime, setDirectTime] = useState('09:00');

  // Notification settings
  const [notificationType, setNotificationType] = useState('both');

  // Snooze settings
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  const [snoozeInterval, setSnoozeInterval] = useState(5);
  const [snoozeDuration, setSnoozeDuration] = useState(30);
  const [dismissCondition, setDismissCondition] = useState('tap');

  // Sound settings
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);

  // Repeat settings
  const [repeat, setRepeat] = useState('none');

  // Audio preview
  const audioRef = useRef(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && scheduleData) {
      console.log('📋 AlarmModal 초기화:', {
        hasScheduleData: !!scheduleData,
        hasAlarm: !!scheduleData.alarm,
        registeredAlarmsCount: scheduleData.alarm?.registeredAlarms?.length || 0,
        scheduleData
      });

      if (scheduleData.alarm) {
        setAlarmTitle(scheduleData.alarm.alarmTitle || '');
        setEventTime(scheduleData.alarm.eventTime || '09:00');
        setRegisteredAlarms(scheduleData.alarm.registeredAlarms || []);
        setNotificationType(scheduleData.alarm.notificationType || 'both');
        setSnoozeEnabled(scheduleData.alarm.snoozeEnabled || false);
        setSnoozeInterval(scheduleData.alarm.snoozeInterval || 5);
        setSnoozeDuration(scheduleData.alarm.snoozeDuration || 30);
        setDismissCondition(scheduleData.alarm.dismissCondition || 'tap');
        setSoundFile(scheduleData.alarm.soundFile || 'default');
        setCustomSoundName(scheduleData.alarm.customSoundName || '');
        setVolume(scheduleData.alarm.volume ?? 80);
        setRepeat(scheduleData.alarm.repeat || 'none');

        console.log('📋 기존 알람 데이터 로드 완료:', {
          registeredAlarmsCount: scheduleData.alarm.registeredAlarms?.length || 0
        });
      } else {
        // Reset to defaults
        setAlarmTitle('');
        setEventTime('09:00');
        setRegisteredAlarms([]);
        setNotificationType('both');
        setSnoozeEnabled(false);
        setSnoozeInterval(5);
        setSnoozeDuration(30);
        setDismissCondition('tap');
        setSoundFile('default');
        setCustomSoundName('');
        setVolume(80);
        setRepeat('none');

        console.log('📋 기본값으로 초기화 완료');
      }

      // Set direct date to schedule date
      if (scheduleData.date) {
        const dateObj = new Date(scheduleData.date);
        setDirectDate(format(dateObj, 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, scheduleData]);

  // Calculate actual alarm time from event time and offset
  const calculateAlarmTime = (eventTimeStr, offsetConfig) => {
    if (!scheduleData?.date) return null;

    const [eventHour, eventMinute] = eventTimeStr.split(':').map(Number);
    let eventDateTime = new Date(scheduleData.date);
    eventDateTime.setHours(eventHour, eventMinute, 0, 0);

    if (offsetConfig.type === 'preset' || offsetConfig.type === 'custom') {
      const { days = 0, hours = 0, minutes = 0 } = offsetConfig;
      let alarmTime = eventDateTime;
      alarmTime = subDays(alarmTime, days);
      alarmTime = subHours(alarmTime, hours);
      alarmTime = subMinutes(alarmTime, minutes);
      return alarmTime;
    } else if (offsetConfig.type === 'absolute') {
      return new Date(offsetConfig.dateTime);
    }

    return null;
  };

  // Add preset alarm
  const handleAddPresetAlarm = (days, hours, minutes) => {
    try {
      console.log('➕ Preset 알람 추가 시도:', { days, hours, minutes, eventTime });

      const offsetConfig = {
        type: 'preset',
        days,
        hours,
        minutes
      };

      const alarmTime = calculateAlarmTime(eventTime, offsetConfig);
      if (!alarmTime) {
        console.error('❌ 알람 시간 계산 실패');
        return;
      }

      const newAlarm = {
        id: Date.now(),
        type: 'preset',
        offset: { days, hours, minutes },
        calculatedTime: alarmTime,
        displayText: `${days}일 ${hours}시간 ${minutes}분 전`.replace(/0일 /g, '').replace(/0시간 /g, '').replace(/0분 /g, '').trim() + (days === 0 && hours === 0 && minutes === 0 ? '정각' : '')
      };

      const updatedAlarms = [...registeredAlarms, newAlarm].sort((a, b) =>
        a.calculatedTime - b.calculatedTime
      );

      console.log('✅ Preset 알람 추가 완료:', {
        newAlarm,
        totalAlarms: updatedAlarms.length
      });

      setRegisteredAlarms(updatedAlarms);
    } catch (error) {
      console.error('❌ Preset 알람 추가 중 에러:', error);
    }
  };

  // Add custom alarm
  const handleAddCustomAlarm = () => {
    const offsetConfig = {
      type: 'custom',
      days: customDays,
      hours: customHours,
      minutes: customMinutes
    };

    const alarmTime = calculateAlarmTime(eventTime, offsetConfig);
    if (!alarmTime) return;

    const newAlarm = {
      id: Date.now(),
      type: 'custom',
      offset: { days: customDays, hours: customHours, minutes: customMinutes },
      calculatedTime: alarmTime,
      displayText: `${customDays}일 ${customHours}시간 ${customMinutes}분 전`.replace(/0일 /g, '').replace(/0시간 /g, '').replace(/0분 /g, '').trim()
    };

    setRegisteredAlarms([...registeredAlarms, newAlarm].sort((a, b) =>
      a.calculatedTime - b.calculatedTime
    ));
  };

  // Add direct time alarm
  const handleAddDirectAlarm = () => {
    if (!directDate || !directTime) return;

    const [hour, minute] = directTime.split(':').map(Number);
    const dateTime = new Date(directDate);
    dateTime.setHours(hour, minute, 0, 0);

    const newAlarm = {
      id: Date.now(),
      type: 'absolute',
      dateTime: dateTime.toISOString(),
      calculatedTime: dateTime,
      displayText: format(dateTime, 'yyyy-MM-dd HH:mm')
    };

    setRegisteredAlarms([...registeredAlarms, newAlarm].sort((a, b) =>
      a.calculatedTime - b.calculatedTime
    ));
  };

  // Delete alarm
  const handleDeleteAlarm = (id) => {
    setRegisteredAlarms(registeredAlarms.filter(alarm => alarm.id !== id));
  };

  // Set event time to current time
  const handleSetCurrentTime = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setEventTime(currentTime);
  };

  // Handle sound file upload
  const handleSoundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomSoundName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSoundFile(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Play sound preview with volume
  const handlePlaySound = () => {
    if (audioRef.current) {
      if (soundFile === 'default') {
        audioRef.current.src = '/sound/Schedule_alarm/default.mp3';
      } else {
        audioRef.current.src = soundFile;
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
      if (soundFile === 'default') {
        audioRef.current.src = '/sound/Schedule_alarm/default.mp3';
      } else {
        audioRef.current.src = soundFile;
      }
      audioRef.current.volume = newVolume / 100;
      audioRef.current.play();
    }
  };

  // Save alarm settings
  const handleSave = () => {
    const alarmSettings = {
      alarmTitle,
      eventTime,
      registeredAlarms,
      notificationType,
      snoozeEnabled,
      snoozeInterval,
      snoozeDuration,
      dismissCondition,
      soundFile,
      customSoundName,
      volume,
      repeat
    };

    console.log('💾 AlarmModal 저장 버튼 클릭:', {
      alarmTitle,
      eventTime,
      registeredAlarmsCount: registeredAlarms.length,
      registeredAlarms,
      alarmSettings
    });

    onSave(alarmSettings);
  };

  if (!isOpen) return null;

  const scheduleDateStr = scheduleData?.date
    ? format(new Date(scheduleData.date), 'yyyy년 M월 d일')
    : '날짜 선택';

  const hasSchedule = scheduleData?.content || scheduleData?.text;

  // 일정이 없어도 알람 설정 가능하도록 제약 제거
  // (이전에는 일정이 없으면 알람 설정 불가 메시지만 표시)

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <Portal>
      <Overlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <Header>
            <div style={{ width: '32px' }}></div>
            <HeaderTitle>{scheduleDateStr} 알람 설정</HeaderTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          <FormArea>
            {/* Alarm Title */}
            <Section>
              <SectionTitle>
                <TitleIcon />
                알람 타이틀 (필수)
              </SectionTitle>
              <Input
                type="text"
                placeholder="예: 동현이 결혼식"
                value={alarmTitle}
                onChange={(e) => setAlarmTitle(e.target.value)}
              />
            </Section>

            {/* Event Time */}
            <Section>
              <SectionTitle>
                <ClockIcon />
                일정 시각
              </SectionTitle>
              <TimeInputRow>
                <TimeSelect
                  value={eventTime.split(':')[0]}
                  onChange={(e) => setEventTime(`${e.target.value}:${eventTime.split(':')[1]}`)}
                >
                  {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                </TimeSelect>
                <TimeSelect
                  value={eventTime.split(':')[1]}
                  onChange={(e) => setEventTime(`${eventTime.split(':')[0]}:${e.target.value}`)}
                >
                  {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                </TimeSelect>
                <SetCurrentTimeButton onClick={handleSetCurrentTime}>
                  현재 시간
                </SetCurrentTimeButton>
              </TimeInputRow>
            </Section>

            {/* Registered Alarms */}
            <Section>
              <SectionTitle>
                <BellIcon />
                등록된 알람 ({registeredAlarms.length})
              </SectionTitle>
              {registeredAlarms.length > 0 ? (
                <AlarmList>
                  {registeredAlarms.map((alarm) => (
                    <AlarmItem key={alarm.id}>
                      <AlarmInfo>
                        <AlarmTimeDisplay>
                          {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                        </AlarmTimeDisplay>
                        <AlarmRelativeTime>{alarm.displayText}</AlarmRelativeTime>
                      </AlarmInfo>
                      <DeleteButton onClick={() => handleDeleteAlarm(alarm.id)}>
                        삭제
                      </DeleteButton>
                    </AlarmItem>
                  ))}
                </AlarmList>
              ) : (
                <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                  등록된 알람이 없습니다.
                </p>
              )}
            </Section>

            {/* Add New Alarm */}
            <Section>
              <SectionTitle>
                <BellIcon />
                알람 추가
              </SectionTitle>
              <AddAlarmSection>
                {/* Quick Presets */}
                <div>
                  <Label style={{ marginBottom: '8px', display: 'block' }}>빠른 선택</Label>
                  <PresetButtonGrid>
                    <PresetButton onClick={() => handleAddPresetAlarm(3, 0, 0)}>3일 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(1, 0, 0)}>1일 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(0, 12, 0)}>12시간 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(0, 3, 0)}>3시간 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(0, 1, 0)}>1시간 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(0, 0, 30)}>30분 전</PresetButton>
                    <PresetButton onClick={() => handleAddPresetAlarm(0, 0, 10)}>10분 전</PresetButton>
                  </PresetButtonGrid>
                </div>

                {/* Custom Precise Input */}
                <CustomInputSection>
                  <Label>정확한 시간 입력</Label>
                  <CustomInputRow>
                    <SmallInput
                      type="number"
                      min="0"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 0)}
                    />
                    <Label>일</Label>
                    <SmallInput
                      type="number"
                      min="0"
                      max="23"
                      value={customHours}
                      onChange={(e) => setCustomHours(parseInt(e.target.value) || 0)}
                    />
                    <Label>시간</Label>
                    <SmallInput
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
                    />
                    <Label>분 전</Label>
                  </CustomInputRow>
                  <AddButton onClick={handleAddCustomAlarm}>정확한 시간으로 추가</AddButton>
                </CustomInputSection>

                {/* Direct Time Specification */}
                <CustomInputSection>
                  <Label>직접 시간 지정</Label>
                  <CustomInputRow>
                    <Input
                      type="date"
                      value={directDate}
                      onChange={(e) => setDirectDate(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Input
                      type="time"
                      value={directTime}
                      onChange={(e) => setDirectTime(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </CustomInputRow>
                  <AddButton onClick={handleAddDirectAlarm}>직접 시간으로 추가</AddButton>
                </CustomInputSection>
              </AddAlarmSection>
            </Section>

            {/* Alarm Sound */}
            <Section>
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
                    }
                  }}
                >
                  <option value="default">기본 알림음</option>
                  <option value="custom">사용자 지정 소리</option>
                </Select>

                {soundFile !== 'default' && (
                  <>
                    <FileInputLabel>
                      사운드 파일 선택
                      <HiddenFileInput
                        type="file"
                        accept="audio/*"
                        onChange={handleSoundUpload}
                      />
                    </FileInputLabel>
                    {customSoundName && (
                      <FileName>선택된 파일: {customSoundName}</FileName>
                    )}
                  </>
                )}

                <SoundPreview>
                  <PlayButton onClick={handlePlaySound}>▶</PlayButton>
                  <span style={{ fontSize: '13px', color: '#495057' }}>
                    미리듣기
                  </span>
                </SoundPreview>
              </SoundUploadContainer>
            </Section>

            {/* Volume Control */}
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

            {/* Notification Type */}
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

            {/* Snooze Settings */}
            <Section>
              <SectionTitle>
                <AlertIcon />
                스누즈
              </SectionTitle>
              <SnoozeContainer>
                <RadioOption $checked={snoozeEnabled}>
                  <input
                    type="checkbox"
                    checked={snoozeEnabled}
                    onChange={(e) => setSnoozeEnabled(e.target.checked)}
                  />
                  <span>스누즈 활성화</span>
                </RadioOption>

                {snoozeEnabled && (
                  <>
                    <SnoozeRow>
                      <Label>반복 간격:</Label>
                      <SmallInput
                        type="number"
                        min="1"
                        value={snoozeInterval}
                        onChange={(e) => setSnoozeInterval(parseInt(e.target.value) || 1)}
                      />
                      <Label>분마다</Label>
                    </SnoozeRow>
                    <SnoozeRow>
                      <Label>총 지속 시간:</Label>
                      <SmallInput
                        type="number"
                        min="1"
                        value={snoozeDuration}
                        onChange={(e) => setSnoozeDuration(parseInt(e.target.value) || 1)}
                      />
                      <Label>분</Label>
                    </SnoozeRow>
                    <SnoozeRow>
                      <Label>해제 조건:</Label>
                      <Select
                        value={dismissCondition}
                        onChange={(e) => setDismissCondition(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="shake">흔들기</option>
                        <option value="button">버튼 누르기</option>
                        <option value="tap">화면 터치</option>
                      </Select>
                    </SnoozeRow>
                  </>
                )}
              </SnoozeContainer>
            </Section>

            {/* Repeat Settings */}
            <Section>
              <SectionTitle>
                <RepeatIcon />
                반복
              </SectionTitle>
              <Select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                <option value="none">반복 안함</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
                <option value="yearly">매년</option>
              </Select>
            </Section>
          </FormArea>

          <Footer>
            <CancelButton onClick={onClose}>취소</CancelButton>
            <SaveButton onClick={handleSave}>저장</SaveButton>
          </Footer>

          {/* Hidden audio element for sound preview */}
          <audio ref={audioRef} />
        </ModalContent>
      </Overlay>
    </Portal>
  );
};

export default AlarmModal;
