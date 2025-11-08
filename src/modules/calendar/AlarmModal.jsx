// src/modules/calendar/AlarmModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { format, addDays, addHours, addMinutes, subDays, subHours, subMinutes } from 'date-fns';
import { AlarmClock } from 'lucide-react';
import Portal from '../../components/Portal';
import { saveAudioFile, loadAudioFile } from '../../utils/audioStorage';

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
  background: ${props => props.$isPastDate ? '#e0e0e0' : '#ffffff'};
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

  &::placeholder {
    color: #adb5bd;
  }

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

const TimeInput = styled.input`
  width: 60px;
  padding: 14px 10px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 16px;
  text-align: center;
  background: white;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: 2px solid #4a90e2;
    border-color: transparent;
  }
`;

const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const AlarmItem = styled.div`
  position: relative;
  background: ${props => {
    if (props.$isPending) return '#e9ecef';
    return '#f8f9fa';
  }};
  border: ${props => {
    if (props.$isModified) return '2px dashed #dc3545';
    if (props.$isPending) return '2px dashed #adb5bd';
    return '1px solid #ced4da';
  }};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

const RegisterButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #218838;
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
  padding: 10px 12px;
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
  padding: 10px 10px;
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
  padding: 8px 10px;
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
    background-color: #999;
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

const ApplyButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
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
  // 과거 날짜 여부 확인
  const isPastDate = scheduleData?.isPastDate || false;

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

  // Sorting
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'registration'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Sound settings
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);
  const [notificationType, setNotificationType] = useState('sound'); // 기본값: 소리만
  const [snoozeEnabled, setSnoozeEnabled] = useState(false); // 기본값: 사용 안함
  const [snoozeMinutes, setSnoozeMinutes] = useState(0); // 기본값: 0분

  // 기본 알람옵션 자동 저장
  useEffect(() => {
    const alarmSettings = {
      soundFile: soundFile === 'default' ? 'default' : 'custom', // base64 데이터 제외, 타입만 저장
      customSoundName,
      volume,
      notificationType,
      snoozeEnabled,
      snoozeMinutes,
      sortBy,
      sortDirection
    };
    localStorage.setItem('alarmSettings', JSON.stringify(alarmSettings));
  }, [soundFile, customSoundName, volume, notificationType, snoozeEnabled, snoozeMinutes, sortBy, sortDirection]);

  // Anniversary settings
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [anniversaryName, setAnniversaryName] = useState('');
  const [anniversaryRepeat, setAnniversaryRepeat] = useState(''); // 초기값 없음
  const [anniversaryTiming, setAnniversaryTiming] = useState(''); // 초기값 없음 - 'today' or 'before'
  const [anniversaryDaysBefore, setAnniversaryDaysBefore] = useState(''); // N일 전

  // 과거 날짜 개별 알람옵션 표시 상태
  const [showIndividualOptions, setShowIndividualOptions] = useState(false);

  // Editing pending alarm
  const [editingPendingId, setEditingPendingId] = useState(null);

  // Editing registered alarm
  const [editingRegisteredId, setEditingRegisteredId] = useState(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIsAnniversary, setEditIsAnniversary] = useState(false);
  const [editAnniversaryRepeat, setEditAnniversaryRepeat] = useState(''); // 초기값 없음
  const [editAnniversaryTiming, setEditAnniversaryTiming] = useState(''); // 초기값 없음 - 사용자가 직접 선택해야 함
  const [editAnniversaryDaysBefore, setEditAnniversaryDaysBefore] = useState('');
  const [editEventTime, setEditEventTime] = useState('09:00');
  const [editOffset, setEditOffset] = useState({ days: 0, hours: 0, minutes: 0 });
  const [hasEditChanges, setHasEditChanges] = useState(false);

  // 개별 알람옵션 상태
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [editCustomSound, setEditCustomSound] = useState(null);
  const [editCustomSoundName, setEditCustomSoundName] = useState('');
  const [editCustomVolume, setEditCustomVolume] = useState(null);
  const [editCustomNotificationType, setEditCustomNotificationType] = useState(null);
  const [editCustomSnoozeEnabled, setEditCustomSnoozeEnabled] = useState(null);
  const [editCustomSnoozeMinutes, setEditCustomSnoozeMinutes] = useState(null);

  // Options collapse state
  const [showOptions, setShowOptions] = useState(false);
  const optionsButtonRef = useRef(null);

  // File input refs
  const soundFileInputRef = useRef(null);
  const editSoundFileInputRef = useRef(null);

  // Validation modal state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Delete confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [deleteTargetAlarm, setDeleteTargetAlarm] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState(''); // 'pending', 'registered', 'anniversary'

  // Edit save confirmation modal state
  const [showEditSaveConfirmModal, setShowEditSaveConfirmModal] = useState(false);

  // Time input values
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');

  // Edit modal time input values
  const [editHourInput, setEditHourInput] = useState('00');
  const [editMinuteInput, setEditMinuteInput] = useState('00');

  // Update eventTime when hour or minute inputs change
  useEffect(() => {
    if (hourInput && minuteInput) {
      const hour = String(hourInput).padStart(2, '0');
      const minute = String(minuteInput).padStart(2, '0');
      setEventTime(`${hour}:${minute}`);
    }
  }, [hourInput, minuteInput]);

  // Update editEventTime when edit hour or minute inputs change
  useEffect(() => {
    if (editHourInput && editMinuteInput) {
      const hour = String(editHourInput).padStart(2, '0');
      const minute = String(editMinuteInput).padStart(2, '0');
      setEditEventTime(`${hour}:${minute}`);
    }
  }, [editHourInput, editMinuteInput]);

  // Detect changes in edit modal
  useEffect(() => {
    if (!editingAlarm) {
      setHasEditChanges(false);
      return;
    }

    const titleChanged = editTitle !== editingAlarm.title;
    const offsetChanged = editOffset.days !== editingAlarm.offset?.days ||
                         editOffset.hours !== editingAlarm.offset?.hours ||
                         editOffset.minutes !== editingAlarm.offset?.minutes;
    const anniversaryChanged = editIsAnniversary !== editingAlarm.isAnniversary;

    // 기념일 관련 변경은 기념일이 활성화되어 있을 때만 체크
    const anniversaryRepeatChanged = editIsAnniversary && editAnniversaryRepeat !== (editingAlarm.anniversaryRepeat || '');
    const anniversaryTimingChanged = editIsAnniversary && editAnniversaryTiming !== (editingAlarm.anniversaryTiming || 'today');
    const anniversaryDaysBeforeChanged = editIsAnniversary && editAnniversaryDaysBefore !== (editingAlarm.anniversaryDaysBefore || '');

    // 개별 알람옵션 변경 감지
    const customSoundChanged = editCustomSound !== (editingAlarm.customSound ?? null);
    const customVolumeChanged = editCustomVolume !== (editingAlarm.customVolume ?? null);
    const customNotificationTypeChanged = editCustomNotificationType !== (editingAlarm.customNotificationType ?? null);
    const customSnoozeEnabledChanged = editCustomSnoozeEnabled !== (editingAlarm.customSnoozeEnabled ?? null);
    const customSnoozeMinutesChanged = editCustomSnoozeMinutes !== (editingAlarm.customSnoozeMinutes ?? null);

    const hasChanges = titleChanged || offsetChanged || anniversaryChanged ||
                       anniversaryRepeatChanged || anniversaryTimingChanged || anniversaryDaysBeforeChanged ||
                       customSoundChanged || customVolumeChanged || customNotificationTypeChanged ||
                       customSnoozeEnabledChanged || customSnoozeMinutesChanged;

    // 디버깅 로그 - 변경사항이 감지될 때만
    if (hasChanges) {
      console.log('🔍 수정 모달 변경 감지:', {
        title: { edit: editTitle, original: editingAlarm.title, changed: titleChanged },
        offset: { edit: editOffset, original: editingAlarm.offset, changed: offsetChanged },
        anniversary: { edit: editIsAnniversary, original: editingAlarm.isAnniversary, changed: anniversaryChanged },
        anniversaryRepeat: { edit: editAnniversaryRepeat, original: editingAlarm.anniversaryRepeat, changed: anniversaryRepeatChanged },
        anniversaryTiming: { edit: editAnniversaryTiming, original: editingAlarm.anniversaryTiming, changed: anniversaryTimingChanged },
        anniversaryDaysBefore: { edit: editAnniversaryDaysBefore, original: editingAlarm.anniversaryDaysBefore, changed: anniversaryDaysBeforeChanged },
        customSound: { edit: editCustomSound, original: editingAlarm.customSound, changed: customSoundChanged },
        customVolume: { edit: editCustomVolume, original: editingAlarm.customVolume, changed: customVolumeChanged },
        customNotificationType: { edit: editCustomNotificationType, original: editingAlarm.customNotificationType, changed: customNotificationTypeChanged },
        customSnoozeEnabled: { edit: editCustomSnoozeEnabled, original: editingAlarm.customSnoozeEnabled, changed: customSnoozeEnabledChanged },
        customSnoozeMinutes: { edit: editCustomSnoozeMinutes, original: editingAlarm.customSnoozeMinutes, changed: customSnoozeMinutesChanged }
      });
    }

    setHasEditChanges(hasChanges);
  }, [editTitle, editOffset.days, editOffset.hours, editOffset.minutes, editIsAnniversary, editAnniversaryRepeat, editAnniversaryTiming, editAnniversaryDaysBefore,
      editCustomSound, editCustomVolume, editCustomNotificationType, editCustomSnoozeEnabled, editCustomSnoozeMinutes, editingAlarm]);

  // Audio preview
  const audioRef = useRef(null);

  // Snooze input refs
  const snoozeInputRef = useRef(null);
  const editSnoozeInputRef = useRef(null);

  // Anniversary days before input refs
  const anniversaryDaysInputRef = useRef(null);
  const editAnniversaryDaysInputRef = useRef(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && scheduleData) {
      // Load last used settings from localStorage
      const savedSettings = localStorage.getItem('alarmSettings');
      const lastSettings = savedSettings ? JSON.parse(savedSettings) : {};

      // IndexedDB에서 커스텀 사운드 불러오기
      const loadCustomSound = async () => {
        if (lastSettings.soundFile === 'custom') {
          const audioData = await loadAudioFile('alarm_sound_main');
          if (audioData) {
            setSoundFile('custom');
            console.log('✅ IndexedDB에서 알람 소리 로드 완료');
          } else {
            setSoundFile('default');
            setCustomSoundName('');
            console.log('⚠️ 저장된 커스텀 사운드를 찾을 수 없습니다.');
          }
        }
      };
      loadCustomSound();

      // alarm 객체가 있고 registeredAlarms에 실제 알람이 있는 경우에만 기존 데이터 로드
      const hasActiveAlarms = scheduleData.alarm &&
                              scheduleData.alarm.registeredAlarms &&
                              scheduleData.alarm.registeredAlarms.length > 0;

      // 로컬스토리지에서 가등록 알람 로드
      const scheduleKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const pendingKey = `pendingAlarms_${scheduleKey}`;
      const savedPendingAlarms = localStorage.getItem(pendingKey);
      const loadedPendingAlarms = savedPendingAlarms ? JSON.parse(savedPendingAlarms) : [];

      if (hasActiveAlarms) {
        // 알람 타이틀은 항상 비우기 - 새 알람 추가용
        setAlarmTitle('');
        const initialEventTime = scheduleData.alarm.eventTime || '09:00';
        setEventTime(initialEventTime);
        // 시간 입력 필드 초기화 - 빈 문자열로 (placeholder 표시)
        setHourInput('');
        setMinuteInput('');
        setRegisteredAlarms(scheduleData.alarm.registeredAlarms || []);
        setPendingAlarms(loadedPendingAlarms); // 로컬스토리지에서 로드
        setNotificationType(lastSettings.notificationType || 'sound');
        setSnoozeEnabled(lastSettings.snoozeEnabled ?? false);
        setSnoozeMinutes(lastSettings.snoozeMinutes || 0);
        setSoundFile(lastSettings.soundFile || 'default');
        setCustomSoundName(lastSettings.customSoundName || '');
        setVolume(lastSettings.volume ?? 80);
        setIsAnniversary(false); // 항상 해제 상태로 초기화
        setAnniversaryName(scheduleData.alarm.anniversaryName || '');
        setAnniversaryRepeat(''); // 초기화 시 선택 안됨
        setAnniversaryTiming(''); // 초기화 시 선택 안됨
        setAnniversaryDaysBefore('');
        setSortBy(lastSettings.sortBy || 'time');
      } else {
        // Reset to defaults (알람이 없거나 registeredAlarms가 비어있으면 초기화)
        setAlarmTitle('');
        setEventTime('09:00');
        // 시간 입력 필드 초기화 - 빈 문자열로 (placeholder 표시)
        setHourInput('');
        setMinuteInput('');
        setRegisteredAlarms([]);
        setPendingAlarms(loadedPendingAlarms); // 로컬스토리지에서 로드
        setNotificationType(lastSettings.notificationType || 'sound');
        setSnoozeEnabled(lastSettings.snoozeEnabled ?? false);
        setSnoozeMinutes(lastSettings.snoozeMinutes || 0);
        setSoundFile(lastSettings.soundFile || 'default');
        setCustomSoundName(lastSettings.customSoundName || '');
        setVolume(lastSettings.volume ?? 80);
        setIsAnniversary(false); // 항상 해제 상태로 초기화
        setAnniversaryName('');
        setAnniversaryRepeat(''); // 초기화 시 선택 안됨
        setAnniversaryTiming(''); // 초기화 시 선택 안됨
        setAnniversaryDaysBefore('');
        setSortBy(lastSettings.sortBy || 'time');
      }

      // Set direct date to schedule date
      if (scheduleData.date) {
        const dateObj = new Date(scheduleData.date);
        setDirectDate(format(dateObj, 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, scheduleData, isPastDate]);

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
    // 1. 알람 타이틀 검사
    if (!alarmTitle.trim()) {
      setValidationMessage('알람 타이틀을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // 2. 기념일 체크 여부에 따라 순서 분기
    if (isAnniversary) {
      // 기념일 체크된 경우: 알림주기 → 알림시기 → 알람시간 순서로 검증
      if (!anniversaryRepeat) {
        setValidationMessage('알림주기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
      if (!anniversaryTiming) {
        setValidationMessage('알림시기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
    }

    // 3. 알람 시간 검사 (기념일 체크 여부 무관, 항상 마지막에 검사)
    if (!hourInput || !minuteInput) {
      setValidationMessage('알람 시간을 입력하세요.');
      setShowValidationModal(true);
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

    // 과거 시간 체크 (오늘 날짜인 경우에만)
    const scheduleDate = new Date(scheduleData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === today.getTime()) {
      // 오늘 날짜이면 현재 시간과 비교
      const now = new Date();
      if (alarmTime <= now) {
        setValidationMessage('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
        setShowValidationModal(true);
        return;
      }
    }

    // 중복 시간 체크
    const alarmTimeStr = format(alarmTime, 'yyyy-MM-dd HH:mm');
    const isDuplicate = [...pendingAlarms, ...registeredAlarms].some(alarm => {
      const existingTimeStr = format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm');
      return existingTimeStr === alarmTimeStr;
    });

    if (isDuplicate) {
      setValidationMessage('설정한 시각은 이미 다른 알람이 등록(가등록) 되어 있어 알람 등록이 불가합니다.');
      setShowValidationModal(true);
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
      registrationOrder: Date.now(), // 등록 순서
      isAnniversary: isAnniversary, // 기념일 여부 추가
      anniversaryName: isAnniversary ? alarmTitle : '', // 알람 타이틀을 기념일 이름으로 사용
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? (anniversaryDaysBefore || 1) : 1,
      // 개별 알람옵션 (선택사항 - 없으면 기본 설정 사용)
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null
    };

    // 바로 등록 목록에 추가
    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    // 즉시 저장
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
      anniversaryRepeat
    };
    onSave(alarmSettings, 'register');

    // 알람 추가 후 타이틀과 시간 입력 비우기
    setAlarmTitle('');
    setHourInput('');
    setMinuteInput('');
  };

  // Add custom alarm (가등록)
  const handleAddCustomAlarm = () => {
    // 1. 알람 타이틀 검사
    if (!alarmTitle.trim()) {
      setValidationMessage('알람 타이틀을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // 2. 기념일 체크 여부에 따라 순서 분기
    if (isAnniversary) {
      if (!anniversaryRepeat) {
        setValidationMessage('알림주기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
      if (!anniversaryTiming) {
        setValidationMessage('알림시기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
      if (anniversaryTiming === 'before' && (!anniversaryDaysBefore || anniversaryDaysBefore === 0)) {
        setValidationMessage('알림시기 일수를 입력하세요.');
        setShowValidationModal(true);
        return;
      }
    }

    // 3. 알람 시간 검사
    if (!hourInput || !minuteInput) {
      setValidationMessage('알람 시간을 입력하세요.');
      setShowValidationModal(true);
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

    // 과거 시간 체크 (오늘 날짜인 경우에만)
    const scheduleDate = new Date(scheduleData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === today.getTime()) {
      // 오늘 날짜이면 현재 시간과 비교
      const now = new Date();
      if (alarmTime <= now) {
        setValidationMessage('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
        setShowValidationModal(true);
        return;
      }
    }

    const newAlarm = {
      id: Date.now(),
      type: 'custom',
      title: alarmTitle,
      offset: { days: customDays, hours: customHours, minutes: customMinutes },
      calculatedTime: alarmTime,
      displayText: `${customDays}일 ${customHours}시간 ${customMinutes}분 전`.replace(/0일 /g, '').replace(/0시간 /g, '').replace(/0분 /g, '').trim(),
      enabled: true,
      registrationOrder: Date.now(),
      isAnniversary: isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '', // 알람 타이틀을 기념일 이름으로 사용
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? anniversaryDaysBefore : 1,
      // 개별 알람옵션 (선택사항 - 없으면 기본 설정 사용)
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null
    };

    // 바로 등록 목록에 추가
    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    // 즉시 저장
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
      anniversaryRepeat
    };
    onSave(alarmSettings, 'register');

    setAlarmTitle('');
  };

  // Add direct time alarm (즉시 등록)
  const handleAddDirectAlarm = () => {
    // 1. 알람 타이틀 검사
    if (!alarmTitle.trim()) {
      setValidationMessage('알람 타이틀을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // 2. 기념일 체크 여부에 따라 순서 분기
    if (isAnniversary) {
      if (!anniversaryRepeat) {
        setValidationMessage('알림주기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
      if (!anniversaryTiming) {
        setValidationMessage('알림시기를 선택하세요.');
        setShowValidationModal(true);
        return;
      }
      if (anniversaryTiming === 'before' && (!anniversaryDaysBefore || anniversaryDaysBefore === 0)) {
        setValidationMessage('알림시기 일수를 입력하세요.');
        setShowValidationModal(true);
        return;
      }
    }

    // 3. 절대시간 입력 검사
    if (!directDate || !directTime) {
      setValidationMessage('알람 시간을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    const [hour, minute] = directTime.split(':').map(Number);
    const dateTime = new Date(directDate);
    dateTime.setHours(hour, minute, 0, 0);

    // 과거 시간 체크
    const now = new Date();
    if (dateTime <= now) {
      setValidationMessage('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
      setShowValidationModal(true);
      return;
    }

    const newAlarm = {
      id: Date.now(),
      type: 'absolute',
      title: alarmTitle,
      dateTime: dateTime.toISOString(),
      calculatedTime: dateTime,
      displayText: format(dateTime, 'yyyy-MM-dd HH:mm'),
      enabled: true,
      registrationOrder: Date.now(),
      isAnniversary: isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '', // 알람 타이틀을 기념일 이름으로 사용
      anniversaryRepeat: isAnniversary ? anniversaryRepeat : '',
      anniversaryTiming: isAnniversary ? anniversaryTiming : 'today',
      anniversaryDaysBefore: isAnniversary ? anniversaryDaysBefore : 1,
      // 개별 알람옵션 (선택사항 - 없으면 기본 설정 사용)
      customSound: null,
      customVolume: null,
      customNotificationType: null,
      customSnoozeEnabled: null,
      customSnoozeMinutes: null
    };

    // 바로 등록 목록에 추가
    const updatedRegisteredAlarms = [...registeredAlarms, newAlarm];
    setRegisteredAlarms(updatedRegisteredAlarms);

    // 즉시 저장
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
      anniversaryRepeat
    };
    onSave(alarmSettings, 'register');

    setAlarmTitle('');
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (alarm, type) => {
    setDeleteTargetAlarm(alarm);
    setDeleteTargetType(type);

    if (type === 'pending') {
      setDeleteConfirmMessage('해당 가등록 알람을 삭제할까요?');
    } else if (alarm.isAnniversary) {
      setDeleteConfirmMessage('정말 해당 기념일을 삭제하시겠습니까?');
    } else if (isPastDate && !alarm.isAnniversary) {
      // 과거 날짜의 일반 알람 (종료된 알람)
      setDeleteConfirmMessage('종료된 알람을 삭제할까요?');
    } else {
      setDeleteConfirmMessage('해당 알람을 삭제할까요?');
    }

    setShowDeleteConfirmModal(true);
  };

  // Confirm delete alarm
  const confirmDeleteAlarm = () => {
    if (!deleteTargetAlarm) return;

    if (deleteTargetType === 'pending') {
      // Delete pending alarm
      const updatedPendingAlarms = pendingAlarms.filter(alarm => alarm.id !== deleteTargetAlarm.id);
      setPendingAlarms(updatedPendingAlarms);

      // 로컬스토리지에 저장
      const scheduleKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const pendingKey = `pendingAlarms_${scheduleKey}`;
      if (updatedPendingAlarms.length > 0) {
        localStorage.setItem(pendingKey, JSON.stringify(updatedPendingAlarms));
      } else {
        localStorage.removeItem(pendingKey);
      }
    } else {
      // Delete registered alarm
      const updatedRegisteredAlarms = registeredAlarms.filter(alarm => alarm.id !== deleteTargetAlarm.id);
      setRegisteredAlarms(updatedRegisteredAlarms);

      // 즉시 저장 - 삭제된 상태를 실제로 저장
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
        anniversaryRepeat
      };

      onSave(alarmSettings, 'delete');
    }

    // Close modal and reset
    setShowDeleteConfirmModal(false);
    setDeleteTargetAlarm(null);
    setDeleteTargetType('');
  };

  // Cancel delete
  const cancelDeleteAlarm = () => {
    setShowDeleteConfirmModal(false);
    setDeleteTargetAlarm(null);
    setDeleteTargetType('');
  };

  // Delete confirmed alarm (deprecated - use showDeleteConfirmation instead)
  const handleDeleteAlarm = (id) => {
    const alarm = registeredAlarms.find(a => a.id === id);
    if (alarm) showDeleteConfirmation(alarm, 'registered');
  };

  // Delete pending alarm (deprecated - use showDeleteConfirmation instead)
  const handleDeletePendingAlarm = (id) => {
    const alarm = pendingAlarms.find(a => a.id === id);
    if (alarm) showDeleteConfirmation(alarm, 'pending');
  };

  // Register individual pending alarm
  const handleRegisterPendingAlarm = (id) => {
    const alarmToRegister = pendingAlarms.find(alarm => alarm.id === id);
    if (!alarmToRegister) return;

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
    const scheduleKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
    const pendingKey = `pendingAlarms_${scheduleKey}`;
    if (updatedPendingAlarms.length > 0) {
      localStorage.setItem(pendingKey, JSON.stringify(updatedPendingAlarms));
    } else {
      localStorage.removeItem(pendingKey);
    }

    // 즉시 저장 - 등록된 알람을 실제로 저장하되 모달은 닫지 않음
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
      anniversaryRepeat
    };

    onSave(alarmSettings, 'register'); // 새 알람 등록
  };

  // Toggle alarm enabled/disabled
  const handleToggleAlarm = (id) => {
    // 현재 알람의 enabled 상태 확인
    const currentAlarm = registeredAlarms.find(alarm => alarm.id === id);
    const newEnabledState = !currentAlarm.enabled;

    const updatedAlarms = registeredAlarms.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: newEnabledState } : alarm
    );
    setRegisteredAlarms(updatedAlarms);

    // 즉시 저장
    const alarmSettings = {
      eventTime,
      registeredAlarms: updatedAlarms,
      notificationType,
      snoozeMinutes,
      soundFile,
      customSoundName,
      volume,
      isAnniversary,
      anniversaryName: isAnniversary ? alarmTitle : '',
      anniversaryRepeat
    };

    // 새로운 상태를 전달
    onSave(alarmSettings, newEnabledState ? 'toggle_on' : 'toggle_off');
  };

  // Edit alarm - opens modal
  const handleEditAlarm = (alarm, isPending) => {
    console.log('📝 수정 모달 열기 - 원본 알람 데이터:', alarm);

    setEditingAlarm({ ...alarm, isPending });
    setEditTitle(alarm.title);
    setEditIsAnniversary(alarm.isAnniversary || false); // Load alarm's own anniversary status

    // Load anniversary settings if it's an anniversary alarm
    if (alarm.isAnniversary) {
      setEditAnniversaryRepeat(alarm.anniversaryRepeat || '');
      setEditAnniversaryTiming(alarm.anniversaryTiming || '');
      // 당일인 경우 빈 문자열, before인 경우에만 값 로드
      setEditAnniversaryDaysBefore(alarm.anniversaryTiming === 'before' ? (alarm.anniversaryDaysBefore || '') : '');
    } else {
      setEditAnniversaryRepeat('');
      setEditAnniversaryTiming('');
      setEditAnniversaryDaysBefore('');
    }

    // Load alarm time from calculatedTime
    const alarmDate = new Date(alarm.calculatedTime);
    const timeStr = format(alarmDate, 'HH:mm');
    setEditEventTime(timeStr);

    // Set hour and minute inputs
    const [hour, minute] = timeStr.split(':');
    setEditHourInput(hour);
    setEditMinuteInput(minute);

    // Load offset if available
    if (alarm.offset) {
      setEditOffset(alarm.offset);
    } else {
      setEditOffset({ days: 0, hours: 0, minutes: 0 });
    }

    // Load custom alarm options (개별 알람옵션)
    const loadedCustomSound = alarm.customSound ?? null;
    const loadedCustomVolume = alarm.customVolume ?? null;
    const loadedCustomNotificationType = alarm.customNotificationType ?? null;
    const loadedCustomSnoozeEnabled = alarm.customSnoozeEnabled ?? null;
    const loadedCustomSnoozeMinutes = alarm.customSnoozeMinutes ?? null;

    console.log('📝 로드한 개별 알람옵션:', {
      customSound: loadedCustomSound,
      customVolume: loadedCustomVolume,
      customNotificationType: loadedCustomNotificationType,
      customSnoozeEnabled: loadedCustomSnoozeEnabled,
      customSnoozeMinutes: loadedCustomSnoozeMinutes
    });

    setEditCustomSound(loadedCustomSound);
    setEditCustomSoundName(alarm.customSoundName || '');
    setEditCustomVolume(loadedCustomVolume);
    setEditCustomNotificationType(loadedCustomNotificationType);
    setEditCustomSnoozeEnabled(loadedCustomSnoozeEnabled);
    setEditCustomSnoozeMinutes(loadedCustomSnoozeMinutes);
    setShowCustomOptions(false); // 기본적으로 접혀있음

    setShowEditModal(true);
  };

  // Save edited alarm
  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      setValidationMessage('필수항목이 입력되지 않았습니다.');
      setShowValidationModal(true);
      return;
    }

    // 개별 알람옵션에서 스누즈 직접입력이 선택되었는데 값이 없는 경우 검사
    const snoozeEnabledValue = editCustomSnoozeEnabled !== null ? editCustomSnoozeEnabled : snoozeEnabled;
    const snoozeMinutesValue = editCustomSnoozeMinutes !== null ? editCustomSnoozeMinutes : snoozeMinutes;

    if (snoozeEnabledValue && (!snoozeMinutesValue || snoozeMinutesValue === 0)) {
      setValidationMessage('스누즈(재알림) 시간을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // 기념일 알림시기 검사
    if (editIsAnniversary && editAnniversaryTiming === 'before' && (!editAnniversaryDaysBefore || editAnniversaryDaysBefore === 0)) {
      setValidationMessage('알림시기 일수를 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // If no changes, just close modal (this should not happen as button is disabled)
    if (!hasEditChanges) {
      setShowEditModal(false);
      setEditingAlarm(null);
      setEditTitle('');
      return;
    }

    // 변경사항이 있으면 확인 모달 표시
    setShowEditSaveConfirmModal(true);
  };

  // 실제 저장 실행
  const confirmEditSave = () => {
    setShowEditSaveConfirmModal(false);

    // Recalculate alarm time with new offset and event time
    const offsetConfig = {
      type: editingAlarm.type || 'preset',
      days: editOffset.days,
      hours: editOffset.hours,
      minutes: editOffset.minutes
    };

    const newAlarmTime = calculateAlarmTime(editEventTime, offsetConfig);
    if (!newAlarmTime) {
      setValidationMessage('알람 시간을 계산할 수 없습니다.');
      setShowValidationModal(true);
      return;
    }

    // 과거 시간 체크 (오늘 날짜인 경우에만)
    const scheduleDate = new Date(scheduleData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate.getTime() === today.getTime()) {
      // 오늘 날짜이면 현재 시간과 비교
      const now = new Date();
      if (newAlarmTime <= now) {
        setValidationMessage('알람 시간은 과거의 시간으로 설정할 수 없습니다.');
        setShowValidationModal(true);
        return;
      }
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
        .trim() + (editOffset.days === 0 && editOffset.hours === 0 && editOffset.minutes === 0 ? '정각' : ''),
      isAnniversary: editIsAnniversary,
      anniversaryName: editIsAnniversary ? editTitle : '', // 편집된 타이틀을 기념일 이름으로 사용
      anniversaryRepeat: editIsAnniversary ? editAnniversaryRepeat : '',
      anniversaryTiming: editIsAnniversary ? editAnniversaryTiming : 'today',
      anniversaryDaysBefore: editIsAnniversary ? (editAnniversaryDaysBefore || 1) : 1,
      // 개별 알람옵션 저장
      customSound: editCustomSound,
      customSoundName: editCustomSoundName,
      customVolume: editCustomVolume,
      customNotificationType: editCustomNotificationType,
      customSnoozeEnabled: editCustomSnoozeEnabled,
      customSnoozeMinutes: editCustomSnoozeMinutes
    };

    let updatedRegisteredAlarms;
    if (editingAlarm.isPending) {
      setPendingAlarms(pendingAlarms.map(alarm =>
        alarm.id === editingAlarm.id ? { ...updatedAlarm, isModified: true } : alarm
      ));
      updatedRegisteredAlarms = registeredAlarms;
    } else {
      updatedRegisteredAlarms = registeredAlarms.map(alarm =>
        alarm.id === editingAlarm.id ? { ...updatedAlarm, isModified: false } : alarm
      );
      setRegisteredAlarms(updatedRegisteredAlarms);
    }

    // 즉시 저장 - 수정 완료 후 바로 적용
    if (!editingAlarm.isPending) {
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
        anniversaryRepeat
      };
      onSave(alarmSettings, 'edit'); // 알람 수정
    }

    // Reset main form to default state (do NOT sync with edited alarm)
    setIsAnniversary(false);
    setAnniversaryRepeat('');

    setShowEditModal(false);
    setEditingAlarm(null);
    setEditTitle('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    // 개별 알람옵션에서 스누즈 직접입력이 선택되었는데 값이 없는 경우 검사
    const snoozeEnabledValue = editCustomSnoozeEnabled !== null ? editCustomSnoozeEnabled : snoozeEnabled;
    const snoozeMinutesValue = editCustomSnoozeMinutes !== null ? editCustomSnoozeMinutes : snoozeMinutes;

    if (snoozeEnabledValue && (!snoozeMinutesValue || snoozeMinutesValue === 0)) {
      setValidationMessage('스누즈(재알림) 시간을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    setShowEditModal(false);
    setEditingAlarm(null);
    setEditTitle('');
  };

  // Apply changes to modified alarm
  const handleApplyChanges = (id) => {
    const alarmToApply = registeredAlarms.find(alarm => alarm.id === id);
    if (!alarmToApply) return;

    // Remove isModified flag
    const { isModified, ...cleanAlarm } = alarmToApply;

    // Update registered alarms
    const updatedRegisteredAlarms = registeredAlarms.map(alarm =>
      alarm.id === id ? cleanAlarm : alarm
    );

    // Update state
    setRegisteredAlarms(updatedRegisteredAlarms);

    // 즉시 저장 - 기존 저장 버튼의 역할을 수행
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
      anniversaryRepeat
    };

    onSave(alarmSettings, 'apply'); // 변경사항 적용
  };

  // Set event time to current time
  const handleSetCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setHourInput(hours);
    setMinuteInput(minutes);
  };

  // Handle close - reset anniversary settings
  const handleClose = () => {
    // 스누즈 직접입력이 선택되었는데 값이 없는 경우 검사
    if (snoozeEnabled && (!snoozeMinutes || snoozeMinutes === 0)) {
      setValidationMessage('스누즈(재알림) 시간을 입력하세요.');
      setShowValidationModal(true);
      return;
    }

    // 기념일 관련 상태 초기화
    setIsAnniversary(false);
    setAnniversaryName('');
    setAnniversaryRepeat('');
    setAnniversaryTiming('');
    setAnniversaryDaysBefore('');

    // 기본 알람옵션 접기
    setShowOptions(false);

    // 모달 닫기
    onClose();
  };

  // Handle sound file upload
  const handleSoundUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('파일 크기는 5MB 이하여야 합니다.');
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
          alert('알람 소리 저장에 실패했습니다.');
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
          alert('저장된 알람 소리를 찾을 수 없습니다.');
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
    const sorted = [...alarms];
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
    // Apply sort direction
    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  };

  // Save alarm settings
  const handleSave = () => {
    // Only save alarm options (notification settings) and registered alarms
    // Pending alarms are stored separately in localStorage
    const alarmSettings = {
      eventTime,
      registeredAlarms: registeredAlarms, // Keep only registered alarms
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

    // 기념일 관련 상태 초기화
    setIsAnniversary(false);
    setAnniversaryName('');
    setAnniversaryRepeat('');
    setAnniversaryTiming('');
    setAnniversaryDaysBefore('');

    // 기본 알람옵션 접기
    setShowOptions(false);

    onSave(alarmSettings, 'save'); // 알람 설정 저장
  };

  if (!isOpen) return null;

  const scheduleDateStr = scheduleData?.date
    ? format(new Date(scheduleData.date), 'yyyy년 M월 d일')
    : '날짜 선택';

  const hasSchedule = scheduleData?.content || scheduleData?.text;

  // 과거 날짜인 경우 기념일 체크해야만 입력 가능
  const isDisabled = isPastDate && !isAnniversary;

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <Portal>
      <Overlay>
        <ModalContent
          $isPastDate={isPastDate}
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: showEditModal ? 0.3 : 1,
            pointerEvents: showEditModal ? 'none' : 'auto',
            transition: 'opacity 0.2s'
          }}
        >
          <Header>
            <div style={{ width: '32px' }}></div>
            <HeaderTitle>{scheduleDateStr} {isPastDate ? '알람 기록' : '알람 설정'}</HeaderTitle>
            <CloseButton onClick={handleClose}>×</CloseButton>
          </Header>

          <FormArea>
            {/* 과거 날짜 안내 메시지 */}
            {isPastDate && (
              <div style={{
                padding: '5px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '5px',
                textAlign: 'center',
                border: '1px solid #ffc107'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#856404',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  과거 날짜
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  기념일만 등록할 수 있습니다.
                </div>
              </div>
            )}

            {/* Registered Alarms - 과거 날짜에서는 최상단에 표시 */}
            {isPastDate && (
              <Section>
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
                        onClick={() => {
                          if (sortBy === 'registration') {
                            // 같은 버튼 클릭 시 방향 토글
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            // 다른 버튼 클릭 시 정렬 기준 변경 및 오름차순으로 초기화
                            setSortBy('registration');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        등록순{sortBy === 'registration' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                      </SortButton>
                      <SortButton
                        $active={sortBy === 'time'}
                        onClick={() => {
                          if (sortBy === 'time') {
                            // 같은 버튼 클릭 시 방향 토글
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            // 다른 버튼 클릭 시 정렬 기준 변경 및 오름차순으로 초기화
                            setSortBy('time');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        시간순{sortBy === 'time' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                      </SortButton>
                    </SortButtonGroup>
                  )}

                  <AlarmList>
                  {/* 확정 알람 - 정렬 적용 */}
                  {registeredAlarms.length > 0 && (
                    <>
                      {getSortedAlarms(registeredAlarms).map((alarm) => (
                        <AlarmItem
                          key={alarm.id}
                          $isPending={false}
                          $enabled={alarm.enabled}
                          $isModified={alarm.isModified}
                          style={{
                            // 과거 날짜의 모든 일반 알람은 반투명 처리 (기념일은 선명하게)
                            opacity: (isPastDate && !alarm.isAnniversary) ? 0.5 : 1
                          }}
                        >
                          <AlarmInfo>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                              <ToggleSwitch style={{
                                opacity: alarm.disabledAt ? 0.5 : 1,
                                // 과거 날짜에서 일반 알람은 비활성화
                                pointerEvents: (isPastDate && !alarm.isAnniversary) ? 'none' : 'auto'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={alarm.enabled !== false}
                                  disabled={!!alarm.disabledAt || (isPastDate && !alarm.isAnniversary)}
                                  onChange={() => handleToggleAlarm(alarm.id)}
                                />
                                <span className="slider"></span>
                              </ToggleSwitch>
                              {alarm.isAnniversary ? (
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4a90e2',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  flexShrink: 0,
                                  opacity: alarm.enabled !== false ? 1 : 0.5,
                                  marginTop: '4px'
                                }}>
                                  기
                                </div>
                              ) : (
                                <AlarmClock
                                  size={14}
                                  color="#d63031"
                                  style={{
                                    flexShrink: 0,
                                    opacity: alarm.enabled !== false ? 1 : 0.5,
                                    marginTop: '4px'
                                  }}
                                />
                              )}
                              <div style={{
                                fontSize: '15px',
                                color: alarm.isAnniversary ? '#4a90e2' : '#333',
                                opacity: alarm.enabled !== false ? 1 : 0.5,
                                wordBreak: 'break-all',
                                lineHeight: '1.3',
                                maxWidth: '8em',
                                display: 'inline-block',
                                minHeight: 'calc(1.3em * 2)',
                                marginTop: '2px'
                              }}>
                                {alarm.title || '제목 없음'}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6c757d',
                              opacity: alarm.enabled !== false ? 1 : 0.5
                            }}>
                              {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                              {/* 과거 날짜의 일반 알람 자동삭제 표시 (스위치 ON/OFF 상관없이) */}
                              {isPastDate && !alarm.isAnniversary && (() => {
                                const now = new Date();
                                const alarmTime = new Date(alarm.calculatedTime);
                                const diffTime = now - alarmTime;
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const daysRemaining = 7 - diffDays;
                                if (daysRemaining >= 0 && daysRemaining <= 7) {
                                  return <span style={{
                                    marginLeft: '8px',
                                    color: '#dc3545',
                                    fontWeight: '600',
                                    opacity: alarm.enabled !== false ? 1 : 0.5
                                  }}>
                                    {daysRemaining}일 후 자동삭제
                                  </span>;
                                }
                                return null;
                              })()}
                            </div>
                          </AlarmInfo>
                          {alarm.isModified && (
                            <div style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              fontSize: '11px',
                              color: '#dc3545',
                              fontWeight: '600'
                            }}>
                              변경사항 미적용
                            </div>
                          )}
                          <AlarmActions style={{
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '12px'
                          }}>
                            {alarm.enabled !== false ? (
                              <>
                                {alarm.isModified ? (
                                  <ApplyButton onClick={() => handleApplyChanges(alarm.id)}>
                                    적용
                                  </ApplyButton>
                                ) : (
                                  // 과거 날짜의 일반 알람은 수정 버튼 숨김
                                  !(isPastDate && !alarm.isAnniversary) && (
                                    <EditButton
                                      onClick={() => handleEditAlarm(alarm, false)}
                                    >
                                      수정
                                    </EditButton>
                                  )
                                )}
                                {/* 과거 날짜의 일반 알람은 삭제 버튼과 "종료된 알람" 표시를 중앙 정렬 */}
                                {isPastDate && !alarm.isAnniversary ? (
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <DeleteButton
                                      onClick={() => handleDeleteAlarm(alarm.id)}
                                    >
                                      삭제
                                    </DeleteButton>
                                    <div style={{
                                      fontSize: '11px',
                                      color: 'rgba(220, 53, 69, 0.85)',
                                      textAlign: 'center',
                                      lineHeight: '1.2'
                                    }}>
                                      알람종료
                                    </div>
                                  </div>
                                ) : (
                                  <DeleteButton
                                    onClick={() => handleDeleteAlarm(alarm.id)}
                                  >
                                    삭제
                                  </DeleteButton>
                                )}
                              </>
                            ) : (
                              // 일시중지 상태
                              // 과거 날짜의 일반 알람은 삭제 버튼과 "종료된 알람" 표시를 중앙 정렬
                              isPastDate && !alarm.isAnniversary ? (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <DeleteButton
                                    onClick={() => handleDeleteAlarm(alarm.id)}
                                  >
                                    삭제
                                  </DeleteButton>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'rgba(220, 53, 69, 0.85)',
                                    textAlign: 'center',
                                    lineHeight: '1.2'
                                  }}>
                                    알람종료
                                  </div>
                                </div>
                              ) : (
                                // 기타: 알람 일시중지 표시
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '13px',
                                  color: '#999',
                                  padding: '4px 0'
                                }}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="22" height="22" rx="3" stroke="#4a90e2" strokeWidth="2"/>
                                    <rect x="8" y="7" width="2.5" height="10" fill="#4a90e2"/>
                                    <rect x="13.5" y="7" width="2.5" height="10" fill="#4a90e2"/>
                                  </svg>
                                  <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                                    <div>알람</div>
                                    <div>일시중지</div>
                                  </div>
                                </div>
                              )
                            )}
                          </AlarmActions>
                        </AlarmItem>
                      ))}
                    </>
                  )}
                  </AlarmList>
                </AlarmBox>
              )}
              </Section>
            )}

            {/* 새 알람 등록 UI */}
            {/* 과거 날짜: 기념일 체크박스만 보이고 체크시 폼 표시 */}
            {isPastDate && (
              <Section style={{ marginTop: '-8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
                  <input
                    type="checkbox"
                    checked={isAnniversary}
                    onChange={(e) => setIsAnniversary(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span
                    style={{ fontSize: '14px', color: '#343a40', cursor: 'pointer' }}
                    onClick={() => setIsAnniversary(!isAnniversary)}
                  >
                    기념일 등록
                  </span>
                </div>
              </Section>
            )}

            {/* 과거 날짜: isAnniversary가 체크되어야만 폼 표시 */}
            {/* 일반 날짜: 항상 폼 표시 */}
            {((!isPastDate) || (isPastDate && isAnniversary)) && (
              <>
            {/* Alarm Title */}
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <TitleIcon />
                알람 타이틀<span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
              </SectionTitle>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Input
                    type="text"
                    placeholder="예: 수빈이 생일"
                    value={alarmTitle}
                    onChange={(e) => {
                      const value = e.target.value;
                      const byteLength = Array.from(value).reduce((acc, char) => {
                        return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
                      }, 0);
                      if (byteLength <= 20) {
                        setAlarmTitle(value);
                      }
                    }}
                    disabled={isDisabled}
                    style={{ flex: 1 }}
                  />
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    whiteSpace: 'nowrap'
                  }}>
                    {Array.from(alarmTitle).reduce((acc, char) => acc + (char.charCodeAt(0) > 127 ? 2 : 1), 0)}/20
                  </div>
                </div>
              </div>
            </Section>

            {/* Anniversary Settings - 과거 날짜는 isAnniversary 체크시 표시, 일반 날짜는 체크박스 표시 */}
            {isPastDate && isAnniversary && (
              <Section style={{ marginTop: '-8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 알림주기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                      알림주기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
                    </div>
                    <RadioGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <RadioOption $checked={anniversaryRepeat === 'daily'} onClick={() => setAnniversaryRepeat('daily')}>
                        <input type="radio" name="anniversaryRepeat-past" value="daily" checked={anniversaryRepeat === 'daily'} onChange={() => {}} />
                        <span>매일</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'weekly'} onClick={() => setAnniversaryRepeat('weekly')}>
                        <input type="radio" name="anniversaryRepeat-past" value="weekly" checked={anniversaryRepeat === 'weekly'} onChange={() => {}} />
                        <span>매주</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'monthly'} onClick={() => setAnniversaryRepeat('monthly')}>
                        <input type="radio" name="anniversaryRepeat-past" value="monthly" checked={anniversaryRepeat === 'monthly'} onChange={() => {}} />
                        <span>매달</span>
                      </RadioOption>
                      <RadioOption $checked={anniversaryRepeat === 'yearly'} onClick={() => setAnniversaryRepeat('yearly')}>
                        <input type="radio" name="anniversaryRepeat-past" value="yearly" checked={anniversaryRepeat === 'yearly'} onChange={() => {}} />
                        <span>매년</span>
                      </RadioOption>
                    </RadioGroup>
                  </div>

                  {/* 알림시기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                      알림시기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          id="timing-today-past"
                          name="anniversaryTiming-past"
                          value="today"
                          checked={anniversaryTiming === 'today'}
                          onChange={() => setAnniversaryTiming('today')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="timing-today-past" style={{ fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
                          당일
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          id="timing-before-past"
                          name="anniversaryTiming-past"
                          value="before"
                          checked={anniversaryTiming === 'before'}
                          onChange={() => {
                            setAnniversaryTiming('before');
                            setTimeout(() => anniversaryDaysInputRef.current?.focus(), 0);
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="timing-before-past" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
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
              </Section>
            )}

            {/* Anniversary Settings - 일반 날짜만 체크박스 표시 */}
            {!isPastDate && (
              <Section style={{ marginTop: '-8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isAnniversary ? '16px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={isAnniversary}
                    onChange={(e) => setIsAnniversary(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span
                    style={{ fontSize: '14px', color: '#343a40', cursor: 'pointer' }}
                    onClick={() => setIsAnniversary(!isAnniversary)}
                  >
                    기념일로 등록
                  </span>
                </div>

              {isAnniversary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 알림주기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                      알림주기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
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
                    <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                      알림시기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
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
                        <label htmlFor="timing-today" style={{ fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
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
                        <label htmlFor="timing-before" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
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
            )}

            {/* Event Time - 과거 날짜에서는 기념일 체크 시에만 표시 */}
            {isPastDate && !isAnniversary ? null : (
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
              <SectionTitle>
                <ClockIcon />
                알람 시간<span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
              </SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    <span style={{ fontSize: '16px', color: '#495057' }}>시</span>
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
                    <span style={{ fontSize: '16px', color: '#495057' }}>분</span>
                  </div>
                  <SetCurrentTimeButton onClick={handleSetCurrentTime} disabled={isDisabled}>
                    현재시간
                  </SetCurrentTimeButton>
                  <AddButton onClick={() => handleAddPresetAlarm(0, 0, 0)} disabled={isDisabled} style={{ marginLeft: 'auto' }}>
                    알람등록
                  </AddButton>
                </div>
              </div>
            </Section>
            )}

            {/* 과거 날짜에서 기념일 등록 시 개별 알람옵션 표시 */}
            {isPastDate && isAnniversary && (
              <>
                <Section>
                  <button
                    onClick={() => setShowIndividualOptions(!showIndividualOptions)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#495057',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  >
                    <span>개별 알람옵션</span>
                    <span style={{ transform: showIndividualOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </button>
                </Section>

                {showIndividualOptions && (
                  <>
                    {/* 개별 알람옵션 설명 및 초기화 버튼 */}
                    <div style={{
                      padding: '6px 20px 8px 20px',
                      fontSize: '12px',
                      color: '#6c757d',
                      background: '#f8f9fa',
                      borderRadius: '0 0 8px 8px',
                      margin: '0 20px 8px 20px',
                      marginTop: '-4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>이 알람에만 적용되는 설정입니다.</span>
                      <button
                        onClick={() => {
                          setSoundFile('default');
                          setCustomSoundName('');
                          setVolume(80);
                          setNotificationType('sound');
                        }}
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          color: '#495057',
                          background: '#f1f3f5',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.color = '#343a40';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f1f3f5';
                          e.currentTarget.style.color = '#495057';
                        }}
                      >
                        초기화
                      </button>
                    </div>

                    {/* 개별 알람 소리 */}
                    <Section style={{ marginTop: '-16px' }}>
                      <SectionTitle>
                        <VolumeIcon />
                        알람 소리
                      </SectionTitle>
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
                      {soundFile !== 'default' && customSoundName && (
                        <FileName>선택된 파일: {customSoundName}</FileName>
                      )}
                      {soundFile !== 'custom' && (
                        <SoundPreview>
                          <PlayButton onClick={handlePlaySound}>▶</PlayButton>
                          <span style={{ fontSize: '13px', color: '#495057' }}>
                            미리듣기
                          </span>
                        </SoundPreview>
                      )}
                    </Section>

                    {/* 개별 알람 볼륨 */}
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

                    {/* 개별 알림 유형 */}
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
                  </>
                )}
              </>
            )}
              </>
            )}

            {/* Registered Alarms - 일반 날짜에서는 하단에 표시 */}
            {!isPastDate && (
              <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
                <div style={{
                  height: '1px',
                  background: '#dee2e6',
                  margin: '0 0 16px 0'
                }} />
                <SectionTitle>
                  <BellIcon />
                  등록된 알람 ({pendingAlarms.length + registeredAlarms.length}개)
                </SectionTitle>

              {pendingAlarms.length === 0 && registeredAlarms.length === 0 ? (
                isPastDate ? null : (
                  <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
                    등록된 알람이 없습니다.
                  </p>
                )
              ) : (
                <AlarmBox>
                  {(pendingAlarms.length > 0 || registeredAlarms.length > 0) && (
                    <SortButtonGroup>
                      <SortButton
                        $active={sortBy === 'registration'}
                        onClick={() => {
                          if (sortBy === 'registration') {
                            // 같은 버튼 클릭 시 방향 토글
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            // 다른 버튼 클릭 시 정렬 기준 변경 및 오름차순으로 초기화
                            setSortBy('registration');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        등록순{sortBy === 'registration' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                      </SortButton>
                      <SortButton
                        $active={sortBy === 'time'}
                        onClick={() => {
                          if (sortBy === 'time') {
                            // 같은 버튼 클릭 시 방향 토글
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            // 다른 버튼 클릭 시 정렬 기준 변경 및 오름차순으로 초기화
                            setSortBy('time');
                            setSortDirection('asc');
                          }
                        }}
                      >
                        시간순{sortBy === 'time' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                      </SortButton>
                    </SortButtonGroup>
                  )}

                  <AlarmList>
                  {/* 가등록 알람 - 항상 최상단 */}
                  {pendingAlarms.length > 0 && (
                    <>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>
                        가등록 ({pendingAlarms.length}개) - 각 알람의 등록 버튼을 눌러 확정하세요
                      </div>
                      {pendingAlarms.map((alarm) => (
                        <AlarmItem key={alarm.id} $isPending={true} $isModified={alarm.isModified}>
                          <AlarmInfo>
                            <div style={{ fontSize: '15px', marginBottom: '4px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 'normal',
                                color: '#fff',
                                backgroundColor: '#ffa726',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                letterSpacing: '-0.5px',
                                flexShrink: 0
                              }}>
                                가등록
                              </span>
                              <span style={{
                                flex: 1,
                                color: alarm.isAnniversary ? '#4a90e2' : '#999',
                                wordBreak: 'break-all',
                                lineHeight: '1.3',
                                maxWidth: '7em',
                                display: 'inline-block'
                              }}>
                                {alarm.title || '제목 없음'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                            </div>
                          </AlarmInfo>
                          <AlarmActions>
                            <RegisterButton onClick={() => handleRegisterPendingAlarm(alarm.id)}>
                              등록
                            </RegisterButton>
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
                        <AlarmItem
                          key={alarm.id}
                          $isPending={false}
                          $enabled={alarm.enabled}
                          $isModified={alarm.isModified}
                          style={{
                            // 과거 날짜에서 기념일은 환하게 표시
                            backgroundColor: isPastDate && alarm.isAnniversary ? '#ffffff' : undefined
                          }}
                        >
                          <AlarmInfo>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                              <ToggleSwitch style={{
                                opacity: alarm.disabledAt ? 0.5 : 1,
                                // 과거 날짜에서 일반 알람은 비활성화
                                pointerEvents: (isPastDate && !alarm.isAnniversary) ? 'none' : 'auto'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={alarm.enabled !== false}
                                  disabled={!!alarm.disabledAt || (isPastDate && !alarm.isAnniversary)}
                                  onChange={() => handleToggleAlarm(alarm.id)}
                                />
                                <span className="slider"></span>
                              </ToggleSwitch>
                              {alarm.isAnniversary ? (
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4a90e2',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  flexShrink: 0,
                                  opacity: alarm.enabled !== false ? 1 : 0.5,
                                  marginTop: '4px'
                                }}>
                                  기
                                </div>
                              ) : (
                                <AlarmClock
                                  size={14}
                                  color="#d63031"
                                  style={{
                                    flexShrink: 0,
                                    opacity: alarm.enabled !== false ? 1 : 0.5,
                                    marginTop: '4px'
                                  }}
                                />
                              )}
                              <div style={{
                                fontSize: '15px',
                                color: alarm.isAnniversary ? '#4a90e2' : '#333',
                                opacity: alarm.enabled !== false ? 1 : 0.5,
                                wordBreak: 'break-all',
                                lineHeight: '1.3',
                                maxWidth: '8em',
                                display: 'inline-block',
                                minHeight: 'calc(1.3em * 2)',
                                marginTop: '2px'
                              }}>
                                {alarm.title || '제목 없음'}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6c757d',
                              opacity: alarm.enabled !== false ? 1 : 0.5
                            }}>
                              {format(alarm.calculatedTime, 'yyyy-MM-dd HH:mm')}
                              {alarm.enabled === false && alarm.disabledAt && !alarm.isAnniversary && (
                                <span style={{
                                  marginLeft: '8px',
                                  color: '#ff6b6b',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {(() => {
                                    const AUTO_DELETE_DAYS = 7;
                                    const disabledDate = new Date(alarm.disabledAt);
                                    const deleteDate = new Date(disabledDate);
                                    deleteDate.setDate(deleteDate.getDate() + AUTO_DELETE_DAYS);
                                    const now = new Date();
                                    const daysLeft = Math.ceil((deleteDate - now) / (1000 * 60 * 60 * 24));
                                    return daysLeft > 0 ? `${daysLeft}일 후 자동 삭제` : '곧 삭제됨';
                                  })()}
                                </span>
                              )}
                            </div>
                          </AlarmInfo>
                          {alarm.isModified && (
                            <div style={{
                              position: 'absolute',
                              bottom: '12px',
                              right: '12px',
                              fontSize: '11px',
                              color: '#dc3545',
                              fontWeight: '600'
                            }}>
                              변경사항 미적용
                            </div>
                          )}
                          <AlarmActions style={{
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '12px',
                            // 과거 날짜에서 일반 알람은 버튼 비활성화
                            opacity: (isPastDate && !alarm.isAnniversary && alarm.enabled !== false) ? 0.5 : 1,
                            pointerEvents: (isPastDate && !alarm.isAnniversary && alarm.enabled !== false) ? 'none' : 'auto'
                          }}>
                            {alarm.enabled !== false ? (
                              <>
                                {alarm.isModified ? (
                                  <ApplyButton onClick={() => handleApplyChanges(alarm.id)}>
                                    적용
                                  </ApplyButton>
                                ) : (
                                  <EditButton
                                    onClick={() => handleEditAlarm(alarm, false)}
                                    disabled={isPastDate && !alarm.isAnniversary}
                                  >
                                    수정
                                  </EditButton>
                                )}
                                <DeleteButton
                                  onClick={() => handleDeleteAlarm(alarm.id)}
                                  disabled={isPastDate && !alarm.isAnniversary}
                                >
                                  삭제
                                </DeleteButton>
                              </>
                            ) : (
                              alarm.disabledAt ? (
                                // 비활성화된 알람 (시간 경과): 삭제 버튼만 표시
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <DeleteButton
                                    onClick={() => handleDeleteAlarm(alarm.id)}
                                    style={{
                                      backgroundColor: '#ff9999',
                                      color: 'white'
                                    }}
                                  >
                                    삭제
                                  </DeleteButton>
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#ff6b6b',
                                    textAlign: 'center',
                                    lineHeight: '1.3',
                                    fontWeight: '600'
                                  }}>
                                    알람종료
                                  </div>
                                </div>
                              ) : (
                                // 수동으로 일시중지한 알람: 기존 일시중지 아이콘
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '13px',
                                  color: '#999',
                                  padding: '4px 0'
                                }}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="1" width="22" height="22" rx="3" stroke="#4a90e2" strokeWidth="2"/>
                                    <rect x="8" y="7" width="2.5" height="10" fill="#4a90e2"/>
                                    <rect x="13.5" y="7" width="2.5" height="10" fill="#4a90e2"/>
                                  </svg>
                                  <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                                    <div>알람</div>
                                    <div>일시중지</div>
                                  </div>
                                </div>
                              )
                            )}
                          </AlarmActions>
                        </AlarmItem>
                      ))}
                    </>
                  )}
                  </AlarmList>
                </AlarmBox>
              )}
              </Section>
            )}

            {/* Alarm Options Toggle Button - 과거 날짜에서는 숨김 */}
            {!isPastDate && (
              <Section>
                <button
                  ref={optionsButtonRef}
                  onClick={() => {
                    const newShowOptions = !showOptions;
                    setShowOptions(newShowOptions);

                    if (newShowOptions && optionsButtonRef.current) {
                      setTimeout(() => {
                        optionsButtonRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }, 100);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                >
                  <span>기본 알람옵션</span>
                  <span style={{ transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
              </Section>
            )}

            {/* Alarm Options Description + Reset Button */}
            {showOptions && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 20px 8px 20px',
                fontSize: '12px',
                color: '#6c757d',
                background: '#f8f9fa',
                borderRadius: '0 0 8px 8px',
                margin: '0 20px 8px 20px'
              }}>
                <span>
                  개별 알람옵션을 지정하지 않는 한<br />
                  아래의 설정값이 적용됩니다.
                </span>
                <button
                  onClick={() => {
                    setSoundFile('default');
                    setCustomSoundName('');
                    setVolume(80);
                    setNotificationType('sound');
                    setSnoozeEnabled(false);
                    setSnoozeMinutes(0);
                  }}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    color: '#495057',
                    background: '#f1f3f5',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                    e.currentTarget.style.color = '#343a40';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f3f5';
                    e.currentTarget.style.color = '#495057';
                  }}
                >
                  초기화
                </button>
              </div>
            )}

            {/* Alarm Sound */}
            {showOptions && (
            <>
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto', marginTop: '-16px' }}>
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

            {/* Snooze Settings - 주석처리: AlarmNotification 자체 스누즈 기능 사용 */}
            {/*
            <Section style={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? 'none' : 'auto', marginBottom: '8px' }}>
              <SectionTitle>
                <AlertIcon />
                스누즈 (알람 후 재알림)
              </SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="snoozeOption"
                    checked={!snoozeEnabled}
                    onChange={() => {
                      setSnoozeEnabled(false);
                      setSnoozeMinutes(0);
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#343a40' }}>사용 안함</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="snoozeOption"
                    checked={snoozeEnabled}
                    onChange={() => {
                      setSnoozeEnabled(true);
                      setTimeout(() => snoozeInputRef.current?.focus(), 0);
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <TimeInput
                    ref={snoozeInputRef}
                    type="number"
                    min="1"
                    max="60"
                    placeholder="1-60"
                    value={snoozeEnabled && snoozeMinutes ? snoozeMinutes : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 60)) {
                        setSnoozeEnabled(true);
                        setSnoozeMinutes(val === '' ? '' : parseInt(val));
                      }
                    }}
                    onFocus={(e) => {
                      setSnoozeEnabled(true);
                      if (!snoozeMinutes) setSnoozeMinutes('');
                      e.target.select();
                    }}
                    style={{ width: '60px', padding: '6px', fontSize: '14px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#343a40' }}>분 후 재알림</span>
                </label>
              </div>
            </Section>
            */}
            </>
            )}
          </FormArea>

          <Footer>
            <SaveButton onClick={handleClose} style={{ width: '100%' }}>닫기</SaveButton>
          </Footer>

          {/* Hidden audio element for sound preview */}
          <audio ref={audioRef} />
        </ModalContent>

        {/* Edit Modal */}
        {showEditModal && (
          <>
            {/* Edit Modal Backdrop */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 10000,
                animation: 'none'
              }}
            />
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10001,
                maxWidth: '480px',
                width: '94%',
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
                  알람 타이틀<span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
                </SectionTitle>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Input
                      type="text"
                      placeholder="예: 최애 식당 재방문 체크"
                      value={editTitle}
                      onChange={(e) => {
                        const value = e.target.value;
                        const byteLength = Array.from(value).reduce((acc, char) => {
                          return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
                        }, 0);
                        if (byteLength <= 20) {
                          setEditTitle(value);
                        }
                      }}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <div style={{
                      fontSize: '11px',
                      color: '#999',
                      whiteSpace: 'nowrap'
                    }}>
                      {Array.from(editTitle).reduce((acc, char) => acc + (char.charCodeAt(0) > 127 ? 2 : 1), 0)}/20
                    </div>
                  </div>
                </div>
              </Section>

              {/* Anniversary Settings */}
              <Section style={{ marginTop: '-8px' }}>
                {/* 과거 날짜의 기념일은 체크박스 숨김 */}
                {!(isPastDate && editingAlarm?.isAnniversary) && (
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
                )}

                {editIsAnniversary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 알림주기 */}
                    <div>
                      <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                        알림주기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
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

                    {/* 알림시기 */}
                    <div>
                      <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                        알림시기 <span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            id="edit-timing-today"
                            name="editAnniversaryTiming"
                            value="today"
                            checked={editAnniversaryTiming === 'today'}
                            onChange={() => setEditAnniversaryTiming('today')}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="edit-timing-today" style={{ fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
                            당일
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="radio"
                            id="edit-timing-before"
                            name="editAnniversaryTiming"
                            value="before"
                            checked={editAnniversaryTiming === 'before'}
                            onChange={() => {
                              setEditAnniversaryTiming('before');
                              setTimeout(() => editAnniversaryDaysInputRef.current?.focus(), 0);
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="edit-timing-before" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#495057', cursor: 'pointer' }}>
                            <TimeInput
                              ref={editAnniversaryDaysInputRef}
                              type="number"
                              min="1"
                              max="30"
                              value={editAnniversaryDaysBefore || ''}
                              placeholder="1-30"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 30)) {
                                  setEditAnniversaryTiming('before');
                                  setEditAnniversaryDaysBefore(val === '' ? '' : parseInt(val));
                                }
                              }}
                              onFocus={() => {
                                setEditAnniversaryTiming('before');
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

              {/* Alarm Time */}
              <Section>
                <SectionTitle>
                  <ClockIcon />
                  알람 시간<span style={{ color: '#dc3545', fontWeight: 'normal' }}>(필수항목)</span>
                </SectionTitle>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <TimeInput
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0-23"
                    value={editHourInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 23)) {
                        setEditHourInput(val);
                      }
                    }}
                    onBlur={() => {
                      if (editHourInput && editHourInput.length === 1) {
                        setEditHourInput('0' + editHourInput);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                  <span style={{ fontSize: '16px', color: '#495057' }}>시</span>
                  <TimeInput
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0-59"
                    value={editMinuteInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                        setEditMinuteInput(val);
                      }
                    }}
                    onBlur={() => {
                      if (editMinuteInput && editMinuteInput.length === 1) {
                        setEditMinuteInput('0' + editMinuteInput);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                  <span style={{ fontSize: '16px', color: '#495057' }}>분</span>
                </div>
              </Section>

              {/* 개별 알람옵션 접기/펼치기 - 과거 날짜 기념일은 숨김 */}
              {!(isPastDate && editingAlarm?.isAnniversary) && (
              <Section>
                <button
                  onClick={() => setShowCustomOptions(!showCustomOptions)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                >
                  <span>개별 알람옵션</span>
                  <span style={{ transform: showCustomOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>
              </Section>
              )}

              {showCustomOptions && !(isPastDate && editingAlarm?.isAnniversary) && (
                <>
                  {/* 개별 알람옵션 설명 및 초기화 버튼 */}
                  <div style={{
                    padding: '6px 20px 8px 20px',
                    fontSize: '12px',
                    color: '#6c757d',
                    background: '#f8f9fa',
                    borderRadius: '0 0 8px 8px',
                    margin: '0 20px 8px 20px',
                    marginTop: '-4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>이 알람에만 적용되는 설정입니다.</span>
                    <button
                      onClick={() => {
                        setEditCustomSound(null);
                        setEditCustomSoundName('');
                        setEditCustomVolume(null);
                        setEditCustomNotificationType(null);
                        setEditCustomSnoozeEnabled(null);
                        setEditCustomSnoozeMinutes(null);
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        color: '#495057',
                        background: '#f1f3f5',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e9ecef';
                        e.currentTarget.style.color = '#343a40';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f3f5';
                        e.currentTarget.style.color = '#495057';
                      }}
                    >
                      초기화
                    </button>
                  </div>

                  {/* 개별 알람 소리 */}
                  <Section style={{ marginTop: '-16px' }}>
                    <SectionTitle>
                      <VolumeIcon />
                      알람 소리
                    </SectionTitle>
                    <Select
                      value={editCustomSound === null ? soundFile : (editCustomSound === 'default' ? 'default' : 'custom')}
                      onChange={(e) => {
                        if (e.target.value === soundFile) {
                          setEditCustomSound(null); // null = 기본 설정 사용
                          setEditCustomSoundName('');
                        } else if (e.target.value === 'default') {
                          setEditCustomSound('default');
                          setEditCustomSoundName('');
                        } else if (e.target.value === 'custom') {
                          setEditCustomSound('custom');
                          setTimeout(() => {
                            editSoundFileInputRef.current?.click();
                          }, 50);
                        }
                      }}
                    >
                      <option value={soundFile}>기본 설정 사용 ({soundFile === 'default' ? '기본 알림음' : customSoundName || '사용자 지정'})</option>
                      <option value="default">기본 알림음</option>
                      <option value="custom">사용자 지정</option>
                    </Select>
                    {/* 항상 렌더링하되, 필요할 때만 보이도록 */}
                    <HiddenFileInput
                      ref={editSoundFileInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // 파일 크기 체크 (5MB 제한)
                          const maxSize = 5 * 1024 * 1024; // 5MB
                          if (file.size > maxSize) {
                            alert('파일 크기는 5MB 이하여야 합니다.');
                            return;
                          }

                          setEditCustomSoundName(file.name);
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const audioData = event.target.result;

                            // IndexedDB에 저장 (개별 알람용 키 사용)
                            try {
                              const alarmKey = `alarm_sound_individual_${editingAlarm?.id || Date.now()}`;
                              await saveAudioFile(alarmKey, audioData);
                              setEditCustomSound(alarmKey); // 키를 저장
                              console.log('✅ 개별 알람 소리 저장 완료:', file.name);
                            } catch (error) {
                              console.error('❌ 알람 소리 저장 실패:', error);
                              alert('알람 소리 저장에 실패했습니다.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    {editCustomSound !== null && editCustomSound !== 'default' && (
                      <FileInputLabel onClick={() => editSoundFileInputRef.current?.click()} style={{ marginTop: '8px' }}>
                        사운드 파일 선택
                      </FileInputLabel>
                    )}
                    {editCustomSound !== null && editCustomSound !== 'default' && editCustomSoundName && (
                      <FileName>선택된 파일: {editCustomSoundName}</FileName>
                    )}
                    {(editCustomSound === null ? soundFile : editCustomSound) !== 'custom' && (
                      <SoundPreview>
                        <PlayButton onClick={handlePlaySound}>▶</PlayButton>
                        <span style={{ fontSize: '13px', color: '#495057' }}>
                          미리듣기
                        </span>
                      </SoundPreview>
                    )}
                  </Section>

                  {/* 개별 알람 볼륨 */}
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
                        value={editCustomVolume !== null ? editCustomVolume : volume}
                        onChange={(e) => setEditCustomVolume(parseInt(e.target.value))}
                      />
                      <VolumeLabel>{editCustomVolume !== null ? editCustomVolume : volume}%</VolumeLabel>
                    </VolumeContainer>
                  </Section>

                  {/* 개별 알림 유형 */}
                  <Section>
                    <SectionTitle>
                      <VibrateIcon />
                      알림 유형
                    </SectionTitle>
                    <RadioGroup>
                      <RadioOption $checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'sound'}>
                        <input
                          type="radio"
                          name="editNotificationType"
                          value="sound"
                          checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'sound'}
                          onChange={(e) => setEditCustomNotificationType(e.target.value)}
                        />
                        <span>소리만</span>
                      </RadioOption>
                      <RadioOption $checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'vibration'}>
                        <input
                          type="radio"
                          name="editNotificationType"
                          value="vibration"
                          checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'vibration'}
                          onChange={(e) => setEditCustomNotificationType(e.target.value)}
                        />
                        <span>진동만</span>
                      </RadioOption>
                      <RadioOption $checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'both'}>
                        <input
                          type="radio"
                          name="editNotificationType"
                          value="both"
                          checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'both'}
                          onChange={(e) => setEditCustomNotificationType(e.target.value)}
                        />
                        <span>소리 + 진동</span>
                      </RadioOption>
                    </RadioGroup>
                  </Section>

                  {/* 개별 스누즈 설정 - 주석처리: AlarmNotification 자체 스누즈 기능 사용 */}
                  {/*
                  <Section style={{ marginBottom: '8px' }}>
                    <SectionTitle>
                      <AlertIcon />
                      스누즈 (알람 후 재알림)
                    </SectionTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="editSnoozeOption"
                          checked={editCustomSnoozeEnabled !== null ? !editCustomSnoozeEnabled : !snoozeEnabled}
                          onChange={() => {
                            setEditCustomSnoozeEnabled(false);
                            setEditCustomSnoozeMinutes(0);
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#343a40' }}>사용 안함</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="editSnoozeOption"
                          checked={editCustomSnoozeEnabled !== null ? editCustomSnoozeEnabled : snoozeEnabled}
                          onChange={() => {
                            setEditCustomSnoozeEnabled(true);
                            setTimeout(() => editSnoozeInputRef.current?.focus(), 0);
                          }}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <TimeInput
                          ref={editSnoozeInputRef}
                          type="number"
                          min="1"
                          max="60"
                          placeholder="1-60"
                          value={(editCustomSnoozeEnabled !== null ? editCustomSnoozeEnabled : snoozeEnabled) ? ((editCustomSnoozeMinutes !== null ? editCustomSnoozeMinutes : snoozeMinutes) || '') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 60)) {
                              setEditCustomSnoozeEnabled(true);
                              setEditCustomSnoozeMinutes(val === '' ? '' : parseInt(val));
                            }
                          }}
                          onFocus={(e) => {
                            setEditCustomSnoozeEnabled(true);
                            const currentValue = editCustomSnoozeMinutes !== null ? editCustomSnoozeMinutes : snoozeMinutes;
                            if (!currentValue) setEditCustomSnoozeMinutes('');
                            e.target.select();
                          }}
                          style={{ width: '60px', padding: '6px', fontSize: '14px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#343a40' }}>분 후 재알림</span>
                      </label>
                    </div>
                  </Section>
                  */}
                </>
              )}
            </FormArea>

            <Footer>
              <CancelButton onClick={handleCancelEdit}>
                {hasEditChanges ? '취소' : '닫기'}
              </CancelButton>
              <SaveButton
                onClick={handleSaveEdit}
                disabled={!hasEditChanges}
                style={{
                  opacity: hasEditChanges ? 1 : 0.5,
                  cursor: hasEditChanges ? 'pointer' : 'not-allowed'
                }}
              >
                수정 완료
              </SaveButton>
            </Footer>
          </ModalContent>
          </>
        )}

        {/* Validation Modal */}
        {showValidationModal && (
          <>
            {/* Validation Modal Backdrop */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 11000,
                animation: 'none'
              }}
              onClick={() => setShowValidationModal(false)}
            />
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 11001,
                maxWidth: '350px',
                width: '90%',
                animation: 'none'
              }}
            >
              <Header>
                <div style={{ width: '32px' }}></div>
                <HeaderTitle>알림</HeaderTitle>
                <CloseButton onClick={() => setShowValidationModal(false)}>×</CloseButton>
              </Header>

              <FormArea style={{ padding: '30px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', color: '#343a40', margin: 0 }}>
                  {validationMessage}
                </p>
              </FormArea>

              <Footer>
                <SaveButton onClick={() => setShowValidationModal(false)} style={{ flex: 'none', width: '100%' }}>
                  확인
                </SaveButton>
              </Footer>
            </ModalContent>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showEditSaveConfirmModal && (
          <>
            {/* Edit Save Confirmation Modal Backdrop */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 11000,
                animation: 'none'
              }}
              onClick={() => setShowEditSaveConfirmModal(false)}
            />
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 11001,
                maxWidth: '350px',
                width: '90%',
                animation: 'none'
              }}
            >
              <Header>
                <div style={{ width: '32px' }}></div>
                <HeaderTitle>저장 확인</HeaderTitle>
                <CloseButton onClick={() => setShowEditSaveConfirmModal(false)}>×</CloseButton>
              </Header>

              <FormArea style={{ padding: '30px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', color: '#343a40', margin: 0 }}>
                  변경내용으로 저장하시겠습니까?
                </p>
              </FormArea>

              <Footer>
                <CancelButton onClick={() => setShowEditSaveConfirmModal(false)}>취소</CancelButton>
                <SaveButton onClick={confirmEditSave}>
                  확인
                </SaveButton>
              </Footer>
            </ModalContent>
          </>
        )}

        {showDeleteConfirmModal && (
          <>
            {/* Delete Confirmation Modal Backdrop */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                zIndex: 11000,
                animation: 'none'
              }}
              onClick={cancelDeleteAlarm}
            />
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 11001,
                maxWidth: '350px',
                width: '90%',
                animation: 'none'
              }}
            >
              <Header>
                <div style={{ width: '32px' }}></div>
                <HeaderTitle>알람 삭제 확인</HeaderTitle>
                <CloseButton onClick={cancelDeleteAlarm}>×</CloseButton>
              </Header>

              <FormArea style={{ padding: '30px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', color: '#343a40', margin: 0 }}>
                  {deleteConfirmMessage}
                </p>
              </FormArea>

              <Footer>
                <CancelButton onClick={cancelDeleteAlarm}>취소</CancelButton>
                <SaveButton onClick={confirmDeleteAlarm} style={{ backgroundColor: '#dc3545' }}>
                  삭제
                </SaveButton>
              </Footer>
            </ModalContent>
          </>
        )}
      </Overlay>
    </Portal>
  );
};

export default AlarmModal;
