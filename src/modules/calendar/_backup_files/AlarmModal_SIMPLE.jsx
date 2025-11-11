// src/modules/calendar/AlarmModal_SIMPLE.jsx
// 알람 설정 모달 - 심플 버전 (레이아웃만 유지, 기능은 단순화)

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Portal from '../../components/Portal';

// alarm 모듈에서 필요한 것만 import
import {
  ALARM_COLORS,
  fadeIn,
  slideUp,
  BellIcon,
  ClockIcon,
  TitleIcon,
  VolumeIcon,
} from './alarm';

// 기존 레이아웃의 AlarmItemComponent 사용
import { AlarmItemComponent } from './alarm/components/AlarmItemComponent';

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
    color: ${ALARM_COLORS.primary};
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
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
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
    outline: 2px solid ${ALARM_COLORS.primary};
    border-color: transparent;
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const RadioGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const RadioOption = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  border: 2px solid ${props => props.$checked ? ALARM_COLORS.primary : '#dee2e6'};
  background: ${props => props.$checked ? `${ALARM_COLORS.primary}15` : 'white'};
  font-size: 14px;
  color: ${props => props.$checked ? ALARM_COLORS.primary : '#495057'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;

  input {
    display: none;
  }

  &:hover {
    border-color: ${ALARM_COLORS.primary};
    background: ${ALARM_COLORS.primaryLight};
  }
`;

const SetCurrentTimeButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: white;
  font-size: 13px;
  color: #495057;
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
  font-size: 14px;
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
  background: #f8f9fa;
  border: 1px solid #dee2e6;
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
  border-top: 1px solid #e9ecef;
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
  const [anniversaryRepeat, setAnniversaryRepeat] = useState('yearly');
  const [anniversaryTiming, setAnniversaryTiming] = useState('today');
  const [anniversaryDaysBefore, setAnniversaryDaysBefore] = useState('');

  // 알람 리스트
  const [alarms, setAlarms] = useState([]);

  // 기본 옵션
  const [showOptions, setShowOptions] = useState(false);
  const [notificationType, setNotificationType] = useState('sound');
  const [volume, setVolume] = useState(80);
  const [soundFile, setSoundFile] = useState('default');

  // ==================== LOAD DATA ====================
  useEffect(() => {
    if (!isOpen || !scheduleData?.date) return;

    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      if (!allSchedulesStr) return;

      const allSchedules = JSON.parse(allSchedulesStr);
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const dayData = allSchedules[dateKey];

      if (dayData?.alarm?.registeredAlarms) {
        setAlarms(dayData.alarm.registeredAlarms);
      }
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
    setAnniversaryRepeat('yearly');
    setAnniversaryTiming('today');
    setAnniversaryDaysBefore('');
    onClose();
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

  // 토글 핸들러
  const handleToggleAlarm = (id) => {
    console.log('토글 클릭 - ID:', id);
    console.log('현재 알람 목록:', alarms);

    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === id) {
        // enabled가 undefined나 null일 경우를 대비
        const currentEnabled = alarm.enabled !== false;
        console.log('현재 enabled:', alarm.enabled, '→ currentEnabled:', currentEnabled, '→ 변경 후:', !currentEnabled);
        return { ...alarm, enabled: !currentEnabled };
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

        allSchedules[dateKey].alarm.registeredAlarms = updatedAlarms;
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));

        // onSave 호출
        if (onSave) {
          onSave({ registeredAlarms: updatedAlarms }, 'toggle');
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

    // 유효성 검사
    if (!alarmTitle.trim()) {
      alert('알람 타이틀을 입력해주세요.');
      return;
    }
    if (hourInput === '' || minuteInput === '') {
      alert('알람 시간을 입력해주세요.');
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
    };

    console.log('새 알람:', newAlarm);

    // 알람 목록에 추가
    const updatedAlarms = [...alarms, newAlarm];
    setAlarms(updatedAlarms);

    // localStorage에 저장
    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      const allSchedules = allSchedulesStr ? JSON.parse(allSchedulesStr) : {};
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');

      if (!allSchedules[dateKey]) {
        allSchedules[dateKey] = {};
      }
      if (!allSchedules[dateKey].alarm) {
        allSchedules[dateKey].alarm = {};
      }

      allSchedules[dateKey].alarm.registeredAlarms = updatedAlarms;
      localStorage.setItem('calendarSchedules_shared', JSON.stringify(allSchedules));

      // onSave 호출
      if (onSave) {
        onSave({ registeredAlarms: updatedAlarms }, 'register');
      }

      // 성공 메시지
      if (isAnniversary) {
        alert('새로운 기념일이 등록되었습니다');
      } else {
        alert('알람이 등록되었습니다');
      }

      // 입력 필드 초기화
      setAlarmTitle('');
      setHourInput('');
      setMinuteInput('');
      setIsAnniversary(false);
      setAnniversaryRepeat('yearly');
      setAnniversaryTiming('today');
      setAnniversaryDaysBefore('');

    } catch (error) {
      console.error('알람 등록 오류:', error);
      alert('알람 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Portal>
      <Overlay onClick={handleClose}>
        <ModalContent $isPastDate={isPastDate} onClick={(e) => e.stopPropagation()}>
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
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: '#856404', fontWeight: '600', marginBottom: '4px' }}>
                  과거 날짜
                </div>
                <div style={{ fontSize: '13px', color: '#856404' }}>
                  기념일 알람은 과거 시간으로도 설정 가능합니다.
                </div>
              </div>
            )}

            {/* 1. 알람 타이틀 */}
            {!isPastDate && (
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
                  <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>
                    {Array.from(alarmTitle).reduce((acc, char) => acc + (char.charCodeAt(0) > 127 ? 2 : 1), 0)}/20
                  </div>
                </div>
              </Section>
            )}

            {/* 2. 기념일 체크박스 + 알람주기 + 알람시기 */}
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

                {/* 기념일 설정 */}
                {isAnniversary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 알림주기 */}
                    <div>
                      <div style={{ fontSize: '13px', color: '#495057', marginBottom: '8px' }}>
                        알림주기 <span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
                      </div>
                      <RadioGroup>
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
                    {alarms.filter(alarm => alarm.isAnniversary).map((alarm) => (
                      <AlarmItemComponent
                        key={alarm.id}
                        alarm={alarm}
                        scheduleData={scheduleData}
                        onToggle={handleToggleAlarm}
                        onDelete={(alarm) => console.log('삭제:', alarm)}
                        onEdit={(alarm) => console.log('수정:', alarm)}
                      />
                    ))}
                  </AlarmList>
                </AlarmBox>
              </Section>
            )}

            {/* 5. 등록된 알람 (일반 알람만 표시) */}
            {!isPastDate && alarms.filter(alarm => !alarm.isAnniversary).length > 0 && (
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
                    {alarms.filter(alarm => !alarm.isAnniversary).map((alarm) => (
                      <AlarmItemComponent
                        key={alarm.id}
                        alarm={alarm}
                        scheduleData={scheduleData}
                        onToggle={handleToggleAlarm}
                        onDelete={(alarm) => console.log('삭제:', alarm)}
                        onEdit={(alarm) => console.log('수정:', alarm)}
                      />
                    ))}
                  </AlarmList>
                </AlarmBox>
              </Section>
            )}

            {/* 6. 기본 알람옵션 (접기/펴기 가능) */}
            {!isPastDate && (
              <>
                <Section>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
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

                {/* 기본 알람옵션 설명 + 초기화 버튼 */}
                {showOptions && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 20px 8px 20px',
                    fontSize: '12px',
                    color: ALARM_COLORS.muted,
                    background: '#f8f9fa',
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

                {/* 알람 소리 */}
                {showOptions && (
                  <Section style={{ marginTop: '-16px' }}>
                    <SectionTitle>
                      <VolumeIcon />
                      알람 소리
                    </SectionTitle>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      현재: {soundFile === 'default' ? '기본 알림음' : '사용자 지정'}
                    </div>
                  </Section>
                )}

                {/* 알람 볼륨 */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <VolumeIcon />
                      알람 볼륨
                    </SectionTitle>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      현재: {volume}%
                    </div>
                  </Section>
                )}

                {/* 알림 유형 */}
                {showOptions && (
                  <Section>
                    <SectionTitle>
                      <VolumeIcon />
                      알림 유형
                    </SectionTitle>
                    <RadioGroup>
                      <RadioOption $checked={notificationType === 'sound'} onClick={() => setNotificationType('sound')}>
                        <input type="radio" name="notificationType" value="sound" checked={notificationType === 'sound'} onChange={() => {}} />
                        <span>소리만</span>
                      </RadioOption>
                      <RadioOption $checked={notificationType === 'vibration'} onClick={() => setNotificationType('vibration')}>
                        <input type="radio" name="notificationType" value="vibration" checked={notificationType === 'vibration'} onChange={() => {}} />
                        <span>진동만</span>
                      </RadioOption>
                      <RadioOption $checked={notificationType === 'both'} onClick={() => setNotificationType('both')}>
                        <input type="radio" name="notificationType" value="both" checked={notificationType === 'both'} onChange={() => {}} />
                        <span>소리 + 진동</span>
                      </RadioOption>
                    </RadioGroup>
                  </Section>
                )}
              </>
            )}
          </FormArea>

          <Footer>
            <Button $variant="secondary" onClick={handleClose}>
              닫기
            </Button>
          </Footer>
        </ModalContent>
      </Overlay>
    </Portal>
  );
};

export default AlarmModal;
