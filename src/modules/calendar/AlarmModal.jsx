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

  .required {
    color: #dc3545;
    margin-left: 4px;
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
  background: ${props => props.$isPending ? '#e9ecef' : '#ffffff'};
  border: ${props => props.$isPending ? '2px dashed #adb5bd' : '1px solid #dee2e6'};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: ${props => props.$enabled === false ? 0.5 : 1};
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

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: 8px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: #4a90e2;
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }
`;

const SortButtonGroup = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border-bottom: 2px solid #e9ecef;
`;

const SortButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${props => props.$active ? '#f1f3f5' : 'transparent'};
  color: ${props => props.$active ? '#212529' : '#6c757d'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#495057' : 'transparent'};
  margin-bottom: -2px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    color: #212529;
  }
`;

const AlarmActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AlarmBox = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-top: 12px;
`;

const EditButton = styled.button`
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0a800;
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
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

// ==================== COMPONENT ====================
const AlarmModal = ({ isOpen, scheduleData, onSave, onClose }) => {
  // Core alarm data
  const [alarmTitle, setAlarmTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [registeredAlarms, setRegisteredAlarms] = useState([]);
  const [pendingAlarms, setPendingAlarms] = useState([]); // 가등록 알람

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
  const [snoozeMinutes, setSnoozeMinutes] = useState(5);

  // Sound settings
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);

  // Anniversary settings
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [anniversaryName, setAnniversaryName] = useState('');
  const [anniversaryRepeat, setAnniversaryRepeat] = useState('yearly');

  // Sorting
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'registration'

  // Editing pending alarm
  const [editingPendingId, setEditingPendingId] = useState(null);

  // Editing registered alarm
  const [editingRegisteredId, setEditingRegisteredId] = useState(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIsAnniversary, setEditIsAnniversary] = useState(false);
  const [editAnniversaryRepeat, setEditAnniversaryRepeat] = useState('yearly');
  const [editEventTime, setEditEventTime] = useState('09:00');
  const [editOffset, setEditOffset] = useState({ days: 0, hours: 0, minutes: 0 });

  // Audio preview
  const audioRef = useRef(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && scheduleData) {
      // Load last used settings from localStorage
      const savedSettings = localStorage.getItem('alarmSettings');
      const lastSettings = savedSettings ? JSON.parse(savedSettings) : {};

      // alarm 객체가 있고 registeredAlarms에 실제 알람이 있는 경우에만 기존 데이터 로드
      const hasActiveAlarms = scheduleData.alarm &&
                              scheduleData.alarm.registeredAlarms &&
                              scheduleData.alarm.registeredAlarms.length > 0;

      if (hasActiveAlarms) {
        // 알람 타이틀은 항상 비우기 - 새 알람 추가용
        setAlarmTitle('');
        setEventTime(scheduleData.alarm.eventTime || '09:00');
        setRegisteredAlarms(scheduleData.alarm.registeredAlarms || []);
        setPendingAlarms([]); // 가등록은 항상 초기화
        setNotificationType(scheduleData.alarm.notificationType || 'both');
        setSnoozeMinutes(lastSettings.snoozeMinutes || scheduleData.alarm.snoozeMinutes || 5);
        setSoundFile(scheduleData.alarm.soundFile || 'default');
        setCustomSoundName(scheduleData.alarm.customSoundName || '');
        setVolume(scheduleData.alarm.volume ?? 80);
        setIsAnniversary(scheduleData.alarm.isAnniversary || false);
        setAnniversaryName(scheduleData.alarm.anniversaryName || '');
        setAnniversaryRepeat(scheduleData.alarm.anniversaryRepeat || 'yearly');
        setSortBy(lastSettings.sortBy || 'time');
      } else {
        // Reset to defaults (알람이 없거나 registeredAlarms가 비어있으면 초기화)
        setAlarmTitle('');
        setEventTime('09:00');
        setRegisteredAlarms([]);
        setPendingAlarms([]);
        setNotificationType('both');
        setSnoozeMinutes(lastSettings.snoozeMinutes || 5);
        setSoundFile('default');
        setCustomSoundName('');
        setVolume(80);
        setIsAnniversary(false);
        setAnniversaryName('');
        setAnniversaryRepeat('yearly');
        setSortBy(lastSettings.sortBy || 'time');
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
    if (!scheduleData?.date) {
      return null;
    }

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

  // Add preset alarm (가등록)
  const handleAddPresetAlarm = (days, hours, minutes) => {
    if (!alarmTitle.trim()) {
      alert('알람 타이틀을 입력해주세요.');
      return;
    }

    const offsetConfig = {
      type: 'preset',
      days,
      hours,
      minutes
    };

    const alarmTime = calculateAlarmTime(eventTime, offsetConfig);
    if (!alarmTime) return;

    // 중복 시간 체크
    const alarmTimeStr = format(alarmTime, 'yyyy-MM-dd HH:mm');
    const isDuplicate = [...pendingAlarms, ...registeredAlarms].some(alarm => {
      const existingTimeStr = format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm');
      return existingTimeStr === alarmTimeStr;
    });

    if (isDuplicate) {
      alert('설정한 시각은 이미 다른 알람이 등록(가등록) 되어 있어 알람 등록이 불가합니다.');
      return;
    }

    const newAlarm = {
      id: Date.now(),
      type: 'preset',
      title: alarmTitle,
      offset: { days, hours, minutes },
      calculatedTime: alarmTime,
      displayText: `${days}일 ${hours}시간 ${minutes}분 전`.replace(/0일 /g, '').replace(/0시간 /g, '').replace(/0분 /g, '').trim() + (days === 0 && hours === 0 && minutes === 0 ? '정각' : ''),
      enabled: true, // 알람 활성화 상태
      registrationOrder: Date.now() // 등록 순서
    };

    // 가등록 목록에 추가
    setPendingAlarms([...pendingAlarms, newAlarm]);

    // 알람 추가 후 타이틀 비우기
    setAlarmTitle('');
  };

  // Add custom alarm (가등록)
  const handleAddCustomAlarm = () => {
    if (!alarmTitle.trim()) {
      alert('알람 타이틀을 입력해주세요.');
      return;
    }

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
      title: alarmTitle,
      offset: { days: customDays, hours: customHours, minutes: customMinutes },
      calculatedTime: alarmTime,
      displayText: `${customDays}일 ${customHours}시간 ${customMinutes}분 전`.replace(/0일 /g, '').replace(/0시간 /g, '').replace(/0분 /g, '').trim(),
      enabled: true,
      registrationOrder: Date.now()
    };

    setPendingAlarms([...pendingAlarms, newAlarm]);
    setAlarmTitle('');
  };

  // Add direct time alarm (가등록)
  const handleAddDirectAlarm = () => {
    if (!alarmTitle.trim()) {
      alert('알람 타이틀을 입력해주세요.');
      return;
    }
    if (!directDate || !directTime) return;

    const [hour, minute] = directTime.split(':').map(Number);
    const dateTime = new Date(directDate);
    dateTime.setHours(hour, minute, 0, 0);

    const newAlarm = {
      id: Date.now(),
      type: 'absolute',
      title: alarmTitle,
      dateTime: dateTime.toISOString(),
      calculatedTime: dateTime,
      displayText: format(dateTime, 'yyyy-MM-dd HH:mm'),
      enabled: true,
      registrationOrder: Date.now()
    };

    setPendingAlarms([...pendingAlarms, newAlarm]);
    setAlarmTitle('');
  };

  // Delete confirmed alarm
  const handleDeleteAlarm = (id) => {
    setRegisteredAlarms(registeredAlarms.filter(alarm => alarm.id !== id));
  };

  // Delete pending alarm
  const handleDeletePendingAlarm = (id) => {
    setPendingAlarms(pendingAlarms.filter(alarm => alarm.id !== id));
  };

  // Toggle alarm enabled/disabled
  const handleToggleAlarm = (id) => {
    setRegisteredAlarms(registeredAlarms.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ));
  };

  // Edit alarm - opens modal
  const handleEditAlarm = (alarm, isPending) => {
    setEditingAlarm({ ...alarm, isPending });
    setEditTitle(alarm.title);
    setEditIsAnniversary(isAnniversary); // Load current anniversary status
    setEditAnniversaryRepeat(anniversaryRepeat);

    // Load alarm time from calculatedTime
    const alarmDate = new Date(alarm.calculatedTime);
    setEditEventTime(format(alarmDate, 'HH:mm'));

    // Load offset if available
    if (alarm.offset) {
      setEditOffset(alarm.offset);
    } else {
      setEditOffset({ days: 0, hours: 0, minutes: 0 });
    }

    setShowEditModal(true);
  };

  // Save edited alarm
  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      alert('알람 타이틀을 입력해주세요.');
      return;
    }

    // Recalculate alarm time with new offset and event time
    const offsetConfig = {
      type: editingAlarm.type || 'preset',
      days: editOffset.days,
      hours: editOffset.hours,
      minutes: editOffset.minutes
    };

    const newAlarmTime = calculateAlarmTime(editEventTime, offsetConfig);
    if (!newAlarmTime) {
      alert('알람 시간을 계산할 수 없습니다.');
      return;
    }

    const updatedAlarm = {
      ...editingAlarm,
      title: editTitle,
      offset: editOffset,
      calculatedTime: newAlarmTime,
      displayText: `${editOffset.days}일 ${editOffset.hours}시간 ${editOffset.minutes}분 전`
        .replace(/0일 /g, '')
        .replace(/0시간 /g, '')
        .replace(/0분 /g, '')
        .trim() + (editOffset.days === 0 && editOffset.hours === 0 && editOffset.minutes === 0 ? '정각' : '')
    };

    if (editingAlarm.isPending) {
      setPendingAlarms(pendingAlarms.map(alarm =>
        alarm.id === editingAlarm.id ? updatedAlarm : alarm
      ));
    } else {
      setRegisteredAlarms(registeredAlarms.map(alarm =>
        alarm.id === editingAlarm.id ? updatedAlarm : alarm
      ));
    }

    // Update main anniversary settings if changed in edit modal
    setIsAnniversary(editIsAnniversary);
    setAnniversaryRepeat(editAnniversaryRepeat);

    setShowEditModal(false);
    setEditingAlarm(null);
    setEditTitle('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingAlarm(null);
    setEditTitle('');
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

  // Sort alarms
  const getSortedAlarms = (alarms) => {
    if (sortBy === 'time') {
      return [...alarms].sort((a, b) => a.calculatedTime - b.calculatedTime);
    } else {
      return [...alarms].sort((a, b) => a.registrationOrder - b.registrationOrder);
    }
  };

  // Save alarm settings
  const handleSave = () => {
    // 가등록 알람을 확정 알람으로 이동
    let finalRegisteredAlarms = [...registeredAlarms, ...pendingAlarms];

    // 등록된 알람도 없고 가등록 알람도 없지만 알람 타이틀이 있으면, 이벤트 시간 정각에 알람 자동 추가
    if (finalRegisteredAlarms.length === 0 && alarmTitle.trim()) {
      const [eventHour, eventMinute] = eventTime.split(':').map(Number);
      const eventDateTime = new Date(scheduleData.date);
      eventDateTime.setHours(eventHour, eventMinute, 0, 0);

      const exactTimeAlarm = {
        id: Date.now(),
        type: 'preset',
        title: alarmTitle,
        offset: { days: 0, hours: 0, minutes: 0 },
        calculatedTime: eventDateTime,
        displayText: '정각',
        enabled: true,
        registrationOrder: Date.now()
      };

      finalRegisteredAlarms = [exactTimeAlarm];
    }

    const alarmSettings = {
      eventTime,
      registeredAlarms: finalRegisteredAlarms,
      notificationType,
      snoozeMinutes,
      soundFile,
      customSoundName,
      volume,
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat
    };

    // Save settings to localStorage
    const settingsToSave = {
      snoozeMinutes,
      sortBy
    };
    localStorage.setItem('alarmSettings', JSON.stringify(settingsToSave));

    onSave(alarmSettings);
  };

  if (!isOpen) return null;

  const scheduleDateStr = scheduleData?.date
    ? format(new Date(scheduleData.date), 'yyyy년 M월 d일')
    : '날짜 선택';

  const hasSchedule = scheduleData?.content || scheduleData?.text;

  // 과거 날짜 체크
  const isPastDate = scheduleData?.date
    ? new Date(scheduleData.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
    : false;

  // 과거 날짜인 경우 기념일 체크해야만 입력 가능
  const isDisabled = isPastDate && !isAnniversary;

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <Portal>
      <Overlay onClick={onClose}>
        <ModalContent
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: showEditModal ? 0.3 : 1,
            pointerEvents: showEditModal ? 'none' : 'auto',
            transition: 'opacity 0.2s'
          }}
        >
          <Header>
            <div style={{ width: '32px' }}></div>
            <HeaderTitle>{scheduleDateStr} 알람 설정</HeaderTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          {/* 과거 날짜 경고 메시지 */}
          {isPastDate && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#fff9c4',
              borderBottom: '2px solid #fbc02d',
              color: '#f57f17',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              ⚠️ 오늘 이전의 날에는 기념일만 등록할 수 있습니다.
            </div>
          )}

          <FormArea>
            {/* Alarm Title */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <TitleIcon />
                알람 타이틀<span className="required">*</span>
              </SectionTitle>
              <Input
                type="text"
                placeholder="예: 동현이 결혼식"
                value={alarmTitle}
                onChange={(e) => setAlarmTitle(e.target.value)}
                disabled={isDisabled}
              />
            </Section>

            {/* Anniversary Settings */}
            <Section style={{ marginTop: '-8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isAnniversary ? '16px' : '0' }}>
                <input
                  type="checkbox"
                  checked={isAnniversary}
                  onChange={(e) => setIsAnniversary(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#343a40', cursor: 'pointer' }} onClick={() => setIsAnniversary(!isAnniversary)}>
                  기념일로 등록
                </span>
              </div>

              {isAnniversary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 알림주기 */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                      알림주기
                    </div>
                    <RadioGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
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
                  </div>

                  {/* 알림시기 */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                      알림시기
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Select style={{ flex: 1 }}>
                        <option value="0">당일</option>
                        <option value="custom">직접입력</option>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* Event Time */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <ClockIcon />
                알람 시간<span className="required">*</span>
              </SectionTitle>
              <TimeInputRow>
                <TimeSelect
                  value={eventTime.split(':')[0]}
                  onChange={(e) => setEventTime(`${e.target.value}:${eventTime.split(':')[1]}`)}
                  disabled={isDisabled}
                >
                  {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                </TimeSelect>
                <TimeSelect
                  value={eventTime.split(':')[1]}
                  onChange={(e) => setEventTime(`${eventTime.split(':')[0]}:${e.target.value}`)}
                  disabled={isDisabled}
                >
                  {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                </TimeSelect>
                <SetCurrentTimeButton onClick={handleSetCurrentTime} disabled={isDisabled}>
                  현재 시간
                </SetCurrentTimeButton>
                <AddButton onClick={() => handleAddPresetAlarm(0, 0, 0)} disabled={isDisabled}>
                  가등록
                </AddButton>
              </TimeInputRow>
              <p style={{ fontSize: '12px', color: '#6c757d', margin: '8px 0 0 0', textAlign: 'center' }}>
                💡 창 하단의 저장버튼까지 눌러야 저장됩니다.
              </p>
            </Section>

            {/* Registered Alarms */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <BellIcon />
                등록된 알람 ({pendingAlarms.length + registeredAlarms.length}개)
              </SectionTitle>

              {pendingAlarms.length === 0 && registeredAlarms.length === 0 ? (
                <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                  등록된 알람이 없습니다.
                </p>
              ) : (
                <AlarmBox>
                  {(pendingAlarms.length > 0 || registeredAlarms.length > 0) && (
                    <SortButtonGroup>
                      <SortButton
                        $active={sortBy === 'registration'}
                        onClick={() => setSortBy('registration')}
                      >
                        등록순
                      </SortButton>
                      <SortButton
                        $active={sortBy === 'time'}
                        onClick={() => setSortBy('time')}
                      >
                        시간순
                      </SortButton>
                    </SortButtonGroup>
                  )}

                  {/* 기념일 안내 문구 */}
                  {isAnniversary && (
                    <p style={{
                      fontSize: '12px',
                      color: '#4a90e2',
                      marginTop: '0',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      🎉 기념일이 등록되어 있습니다.
                    </p>
                  )}

                  <AlarmList>
                  {/* 가등록 알람 - 항상 최상단 */}
                  {pendingAlarms.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>
                        가등록 ({pendingAlarms.length}개) - 저장 버튼을 눌러야 확정됩니다
                      </div>
                      {pendingAlarms.map((alarm) => (
                        <AlarmItem key={alarm.id} $isPending={true}>
                          <AlarmInfo>
                            <div style={{ fontSize: '15px', marginBottom: '4px', color: isAnniversary ? '#4a90e2' : '#333' }}>
                              {alarm.title || '제목 없음'}
                            </div>
                            <AlarmTimeDisplay>
                              {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                            </AlarmTimeDisplay>
                            <AlarmRelativeTime>{alarm.displayText}</AlarmRelativeTime>
                          </AlarmInfo>
                          <AlarmActions>
                            <EditButton onClick={() => handleEditAlarm(alarm, true)}>
                              수정
                            </EditButton>
                            <DeleteButton onClick={() => handleDeletePendingAlarm(alarm.id)}>
                              삭제
                            </DeleteButton>
                          </AlarmActions>
                        </AlarmItem>
                      ))}
                    </>
                  )}

                  {/* 확정 알람 - 정렬 적용 */}
                  {registeredAlarms.length > 0 && (
                    <>
                      {pendingAlarms.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#6c757d', margin: '16px 0 4px 0', fontWeight: '600' }}>
                          확정된 알람 ({registeredAlarms.length}개)
                        </div>
                      )}
                      {getSortedAlarms(registeredAlarms).map((alarm) => (
                        <AlarmItem key={alarm.id} $isPending={false} $enabled={alarm.enabled}>
                          <AlarmInfo>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <ToggleSwitch>
                                <input
                                  type="checkbox"
                                  checked={alarm.enabled !== false}
                                  onChange={() => handleToggleAlarm(alarm.id)}
                                />
                                <span className="slider"></span>
                              </ToggleSwitch>
                              <span style={{ fontSize: '15px', color: isAnniversary ? '#4a90e2' : '#333' }}>
                                {alarm.title || '제목 없음'}
                              </span>
                            </div>
                            <AlarmTimeDisplay>
                              {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                            </AlarmTimeDisplay>
                            <AlarmRelativeTime>{alarm.displayText}</AlarmRelativeTime>
                          </AlarmInfo>
                          <AlarmActions>
                            <EditButton onClick={() => handleEditAlarm(alarm, false)}>
                              수정
                            </EditButton>
                            <DeleteButton onClick={() => handleDeleteAlarm(alarm.id)}>
                              삭제
                            </DeleteButton>
                          </AlarmActions>
                        </AlarmItem>
                      ))}
                    </>
                  )}
                  </AlarmList>
                </AlarmBox>
              )}
            </Section>

            {/* Alarm Sound */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
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
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
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
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
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
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <AlertIcon />
                스누즈 (알람 후 재알림)
              </SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                >
                  <option value={0}>사용 안함</option>
                  <option value={5}>5분 후</option>
                  <option value={10}>10분 후</option>
                  <option value={15}>15분 후</option>
                  <option value={20}>20분 후</option>
                  <option value={30}>30분 후</option>
                </Select>
                <span style={{ fontSize: '13px', color: '#6c757d', minWidth: '100px' }}>
                  {snoozeMinutes > 0 ? `${snoozeMinutes}분 후 재알림` : '스누즈 꺼짐'}
                </span>
              </div>
            </Section>
          </FormArea>

          <Footer>
            <CancelButton onClick={onClose}>취소</CancelButton>
            <SaveButton onClick={handleSave}>저장</SaveButton>
          </Footer>

          {/* Hidden audio element for sound preview */}
          <audio ref={audioRef} />
        </ModalContent>

        {/* Edit Modal */}
        {showEditModal && (
          <ModalContent
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              maxWidth: '400px',
              width: '90%',
              animation: 'none'
            }}
          >
            <Header>
              <div style={{ width: '32px' }}></div>
              <HeaderTitle>알람 수정</HeaderTitle>
              <CloseButton onClick={handleCancelEdit}>×</CloseButton>
            </Header>

            <FormArea>
              {/* Alarm Title */}
              <Section>
                <SectionTitle>
                  <TitleIcon />
                  알람 타이틀<span className="required">*</span>
                </SectionTitle>
                <Input
                  type="text"
                  placeholder="예: 동현이 결혼식"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </Section>

              {/* Anniversary Settings */}
              <Section style={{ marginTop: '-8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: editIsAnniversary ? '16px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={editIsAnniversary}
                    onChange={(e) => setEditIsAnniversary(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#343a40', cursor: 'pointer' }} onClick={() => setEditIsAnniversary(!editIsAnniversary)}>
                    기념일로 등록
                  </span>
                </div>

                {editIsAnniversary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 알림주기 */}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                        알림주기
                      </div>
                      <RadioGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <RadioOption $checked={editAnniversaryRepeat === 'daily'} onClick={() => setEditAnniversaryRepeat('daily')}>
                          <input type="radio" name="editAnniversaryRepeat" value="daily" checked={editAnniversaryRepeat === 'daily'} onChange={() => {}} />
                          <span>매일</span>
                        </RadioOption>
                        <RadioOption $checked={editAnniversaryRepeat === 'weekly'} onClick={() => setEditAnniversaryRepeat('weekly')}>
                          <input type="radio" name="editAnniversaryRepeat" value="weekly" checked={editAnniversaryRepeat === 'weekly'} onChange={() => {}} />
                          <span>매주</span>
                        </RadioOption>
                        <RadioOption $checked={editAnniversaryRepeat === 'monthly'} onClick={() => setEditAnniversaryRepeat('monthly')}>
                          <input type="radio" name="editAnniversaryRepeat" value="monthly" checked={editAnniversaryRepeat === 'monthly'} onChange={() => {}} />
                          <span>매달</span>
                        </RadioOption>
                        <RadioOption $checked={editAnniversaryRepeat === 'yearly'} onClick={() => setEditAnniversaryRepeat('yearly')}>
                          <input type="radio" name="editAnniversaryRepeat" value="yearly" checked={editAnniversaryRepeat === 'yearly'} onChange={() => {}} />
                          <span>매년</span>
                        </RadioOption>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </Section>

              {/* Alarm Time */}
              <Section>
                <SectionTitle>
                  <ClockIcon />
                  알람 시간<span className="required">*</span>
                </SectionTitle>
                <TimeInputRow>
                  <TimeSelect
                    value={editEventTime.split(':')[0]}
                    onChange={(e) => setEditEventTime(`${e.target.value}:${editEventTime.split(':')[1]}`)}
                  >
                    {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                  </TimeSelect>
                  <TimeSelect
                    value={editEventTime.split(':')[1]}
                    onChange={(e) => setEditEventTime(`${editEventTime.split(':')[0]}:${e.target.value}`)}
                  >
                    {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                  </TimeSelect>
                </TimeInputRow>
              </Section>

              {/* Alarm Timing (Offset) */}
              <Section>
                <SectionTitle>
                  <AlertIcon />
                  알림시기
                </SectionTitle>
                <CustomInputRow>
                  <SmallInput
                    type="number"
                    min="0"
                    value={editOffset.days}
                    onChange={(e) => setEditOffset({ ...editOffset, days: parseInt(e.target.value) || 0 })}
                  />
                  <Label>일</Label>
                  <SmallInput
                    type="number"
                    min="0"
                    max="23"
                    value={editOffset.hours}
                    onChange={(e) => setEditOffset({ ...editOffset, hours: parseInt(e.target.value) || 0 })}
                  />
                  <Label>시간</Label>
                  <SmallInput
                    type="number"
                    min="0"
                    max="59"
                    value={editOffset.minutes}
                    onChange={(e) => setEditOffset({ ...editOffset, minutes: parseInt(e.target.value) || 0 })}
                  />
                  <Label>분 전</Label>
                </CustomInputRow>
              </Section>
            </FormArea>

            <Footer>
              <CancelButton onClick={handleCancelEdit}>취소</CancelButton>
              <SaveButton onClick={handleSaveEdit}>수정 완료</SaveButton>
            </Footer>
          </ModalContent>
        )}
      </Overlay>
    </Portal>
  );
};

export default AlarmModal;
