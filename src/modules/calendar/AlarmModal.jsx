// src/modules/calendar/AlarmModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { format } from 'date-fns';
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

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  margin: 0;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #4a90e2;
  }

  &:checked + span:before {
    transform: translateX(22px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
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

const TextArea = styled.textarea`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 14px;
  background: white;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;

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

// Time Wheel Picker Styles
const WheelPickerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
`;

const WheelColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  height: 180px;
  position: relative;
  width: 60px;
`;

const WheelScroller = styled.div`
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  height: 100%;
  width: 100%;
  padding: 60px 0;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const WheelItem = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: ${props => props.$selected ? '24px' : '16px'};
  font-weight: ${props => props.$selected ? '600' : '400'};
  color: ${props => props.$selected ? '#343a40' : '#adb5bd'};
  transition: all 0.2s;
`;

const WheelLabel = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: #343a40;
`;

const WheelOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 60px;
  transform: translateY(-50%);
  border-top: 2px solid #4a90e2;
  border-bottom: 2px solid #4a90e2;
  pointer-events: none;
  background: rgba(74, 144, 226, 0.05);
`;

// Alarm List Styles
const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AlarmItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AlarmTime = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
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

// Reminder List Styles
const ReminderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReminderItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const ReminderInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const SmallInput = styled(Input)`
  width: 80px;
  padding: 6px 8px;
`;

const SmallSelect = styled(Select)`
  padding: 6px 8px;
  flex: 1;
`;

const SmallDeleteButton = styled(DeleteButton)`
  padding: 4px 10px;
  font-size: 12px;
`;

// Volume Slider Styles
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

// Sound Upload Styles
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

// ==================== COMPONENT ====================
const AlarmModal = ({ isOpen, scheduleData, onSave, onClose }) => {
  // Main alarm enabled state
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);

  // Schedule content (for days without schedules)
  const [scheduleContent, setScheduleContent] = useState('');

  // Multiple alarms array
  const [alarms, setAlarms] = useState([
    { id: Date.now(), time: '09:00' }
  ]);

  // Current editing alarm time (for wheel picker)
  const [currentHour, setCurrentHour] = useState(9);
  const [currentMinute, setCurrentMinute] = useState(0);

  // Reminders array
  const [reminders, setReminders] = useState([]);

  // Sound settings
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');

  // Other settings
  const [volume, setVolume] = useState(80);
  const [vibration, setVibration] = useState(true);
  const [repeat, setRepeat] = useState('none');

  // Audio preview
  const audioRef = useRef(null);

  // Wheel picker refs
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Initialize/reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (scheduleData?.alarm) {
        // Load existing alarm settings
        setIsAlarmEnabled(scheduleData.alarm.isEnabled ?? true);
        setAlarms(scheduleData.alarm.alarms || [{ id: Date.now(), time: '09:00' }]);
        setReminders(scheduleData.alarm.reminders || []);
        setSoundFile(scheduleData.alarm.soundFile || 'default');
        setCustomSoundName(scheduleData.alarm.customSoundName || '');
        setVolume(scheduleData.alarm.volume ?? 80);
        setVibration(scheduleData.alarm.vibration ?? true);
        setRepeat(scheduleData.alarm.repeat || 'none');

        // Set current time for wheel picker from first alarm
        if (scheduleData.alarm.alarms && scheduleData.alarm.alarms.length > 0) {
          const [h, m] = scheduleData.alarm.alarms[0].time.split(':').map(Number);
          setCurrentHour(h);
          setCurrentMinute(m);
        }
      } else {
        // Reset to defaults for new alarm
        setIsAlarmEnabled(true);
        setAlarms([{ id: Date.now(), time: '09:00' }]);
        setReminders([]);
        setSoundFile('default');
        setCustomSoundName('');
        setVolume(80);
        setVibration(true);
        setRepeat('none');
        setCurrentHour(9);
        setCurrentMinute(0);
      }

      // Load schedule content if exists
      setScheduleContent(scheduleData?.content || '');
    }
  }, [isOpen, scheduleData]);

  // Sync wheel picker with scroll position
  useEffect(() => {
    if (isOpen && hourScrollRef.current && minuteScrollRef.current) {
      // Scroll to current hour/minute
      setTimeout(() => {
        if (hourScrollRef.current) {
          hourScrollRef.current.scrollTop = currentHour * 60;
        }
        if (minuteScrollRef.current) {
          minuteScrollRef.current.scrollTop = currentMinute * 60;
        }
      }, 100);
    }
  }, [isOpen, currentHour, currentMinute]);

  // Handle wheel scroll
  const handleWheelScroll = (type) => {
    return (e) => {
      const scrollTop = e.target.scrollTop;
      const itemHeight = 60;
      const index = Math.round(scrollTop / itemHeight);

      if (type === 'hour') {
        setCurrentHour(index % 24);
      } else {
        setCurrentMinute(index % 60);
      }
    };
  };

  // Add new alarm
  const handleAddAlarm = () => {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const newAlarm = {
      id: Date.now(),
      time: timeStr
    };
    setAlarms([...alarms, newAlarm]);
  };

  // Delete alarm
  const handleDeleteAlarm = (id) => {
    if (alarms.length > 1) {
      setAlarms(alarms.filter(alarm => alarm.id !== id));
    }
  };

  // Add new reminder
  const handleAddReminder = () => {
    setReminders([
      ...reminders,
      { id: Date.now(), value: 10, unit: 'minutes' }
    ]);
  };

  // Update reminder
  const handleUpdateReminder = (id, field, value) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, [field]: value } : reminder
    ));
  };

  // Delete reminder
  const handleDeleteReminder = (id) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
  };

  // Handle sound file upload
  const handleSoundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomSoundName(file.name);
      // In production, you'd upload this file to the server or store it locally
      // For now, we'll just store the name
      const reader = new FileReader();
      reader.onload = (event) => {
        setSoundFile(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Play sound preview
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

  // Save alarm settings
  const handleSave = () => {
    const alarmSettings = {
      isEnabled: isAlarmEnabled,
      alarms,
      reminders,
      soundFile,
      customSoundName,
      volume,
      vibration,
      repeat,
      scheduleContent: scheduleContent.trim() || scheduleData?.content || ''
    };

    onSave(alarmSettings);
  };

  if (!isOpen) return null;

  // Generate arrays for wheel picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const scheduleDateStr = scheduleData?.date
    ? format(new Date(scheduleData.date), 'yyyy년 M월 d일')
    : '날짜 선택';

  const hasSchedule = scheduleData?.content;

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
            {/* Alarm Enable/Disable */}
            <Section>
              <SectionHeader>
                <SectionTitle>⏰ 알람 활성화</SectionTitle>
                <ToggleSwitch>
                  <ToggleInput
                    type="checkbox"
                    checked={isAlarmEnabled}
                    onChange={(e) => setIsAlarmEnabled(e.target.checked)}
                  />
                  <ToggleSlider />
                </ToggleSwitch>
              </SectionHeader>
            </Section>

            {/* Schedule Content (if no schedule exists) */}
            {!hasSchedule && (
              <Section>
                <SectionTitle>📝 일정 내용</SectionTitle>
                <TextArea
                  placeholder="일정 내용을 입력하세요..."
                  value={scheduleContent}
                  onChange={(e) => setScheduleContent(e.target.value)}
                />
              </Section>
            )}

            {isAlarmEnabled && (
              <>
                {/* Time Wheel Picker */}
                <Section>
                  <SectionTitle>⏰ 알람 시간 선택</SectionTitle>
                  <WheelPickerContainer>
                    <WheelColumn>
                      <WheelScroller ref={hourScrollRef} onScroll={handleWheelScroll('hour')}>
                        {[...hours, ...hours, ...hours].map((hour, idx) => (
                          <WheelItem
                            key={`hour-${idx}`}
                            $selected={hour === currentHour && idx >= 24 && idx < 48}
                          >
                            {String(hour).padStart(2, '0')}
                          </WheelItem>
                        ))}
                      </WheelScroller>
                      <WheelOverlay />
                    </WheelColumn>

                    <WheelLabel>:</WheelLabel>

                    <WheelColumn>
                      <WheelScroller ref={minuteScrollRef} onScroll={handleWheelScroll('minute')}>
                        {[...minutes, ...minutes, ...minutes].map((minute, idx) => (
                          <WheelItem
                            key={`minute-${idx}`}
                            $selected={minute === currentMinute && idx >= 60 && idx < 120}
                          >
                            {String(minute).padStart(2, '0')}
                          </WheelItem>
                        ))}
                      </WheelScroller>
                      <WheelOverlay />
                    </WheelColumn>
                  </WheelPickerContainer>

                  <AddButton onClick={handleAddAlarm}>
                    현재 시간으로 알람 추가
                  </AddButton>
                </Section>

                {/* Alarm List */}
                <Section>
                  <SectionTitle>🔔 등록된 알람 ({alarms.length})</SectionTitle>
                  <AlarmList>
                    {alarms.map((alarm) => (
                      <AlarmItem key={alarm.id}>
                        <AlarmTime>{alarm.time}</AlarmTime>
                        <DeleteButton
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          disabled={alarms.length === 1}
                        >
                          삭제
                        </DeleteButton>
                      </AlarmItem>
                    ))}
                  </AlarmList>
                </Section>

                {/* Advance Reminders */}
                <Section>
                  <SectionTitle>🔔 미리 알림</SectionTitle>
                  <ReminderList>
                    {reminders.map((reminder) => (
                      <ReminderItem key={reminder.id}>
                        <ReminderInput>
                          <SmallInput
                            type="number"
                            min="1"
                            value={reminder.value}
                            onChange={(e) => handleUpdateReminder(reminder.id, 'value', parseInt(e.target.value) || 1)}
                          />
                          <SmallSelect
                            value={reminder.unit}
                            onChange={(e) => handleUpdateReminder(reminder.id, 'unit', e.target.value)}
                          >
                            <option value="minutes">분 전</option>
                            <option value="hours">시간 전</option>
                            <option value="days">일 전</option>
                            <option value="weeks">주 전</option>
                            <option value="months">달 전</option>
                          </SmallSelect>
                        </ReminderInput>
                        <SmallDeleteButton onClick={() => handleDeleteReminder(reminder.id)}>
                          삭제
                        </SmallDeleteButton>
                      </ReminderItem>
                    ))}
                  </ReminderList>
                  <AddButton onClick={handleAddReminder}>
                    미리 알림 추가
                  </AddButton>
                </Section>

                {/* Sound Settings */}
                <Section>
                  <SectionTitle>🎵 알람 소리</SectionTitle>
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
                  <SectionTitle>🔊 알람 볼륨</SectionTitle>
                  <VolumeContainer>
                    <VolumeSlider
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                    />
                    <VolumeLabel>{volume}%</VolumeLabel>
                  </VolumeContainer>
                </Section>

                {/* Vibration Toggle */}
                <Section>
                  <SectionHeader>
                    <SectionTitle>📳 진동</SectionTitle>
                    <ToggleSwitch>
                      <ToggleInput
                        type="checkbox"
                        checked={vibration}
                        onChange={(e) => setVibration(e.target.checked)}
                      />
                      <ToggleSlider />
                    </ToggleSwitch>
                  </SectionHeader>
                </Section>

                {/* Repeat Settings */}
                <Section>
                  <SectionTitle>🔁 반복</SectionTitle>
                  <Select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                    <option value="none">반복 안함</option>
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                  </Select>
                </Section>
              </>
            )}
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
