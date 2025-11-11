// src/modules/calendar/AlarmModal.jsx
// 알람 설정 모달 - 원본 레이아웃 기반 재구성

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Portal from '../../components/Portal';

// alarm 모듈에서 import
import {
  // 상수
  AUTO_DELETE_DAYS,
  ALARM_MESSAGES,
  ALARM_COLORS,
  // 유틸
  getDaysUntilAutoDelete,
  // 애니메이션
  fadeIn,
  slideUp,
  // 아이콘
  BellIcon,
  ClockIcon,
  TitleIcon,
  VolumeIcon,
  // 커스텀 훅
  useAlarmSound,
  useAlarmList,
  useAlarmForm,
  useAlarmEdit,
  useAlarmModals,
  useAlarmActions,
  // 컴포넌트
  ValidationModal,
  DeleteConfirmModal,
  EditSaveConfirmModal,
  AlarmItemComponent,
} from './alarm';

// 기존 utils에서 getRepeatedAnniversaries import
import { getRepeatedAnniversaries } from './utils';

// AUTO_DELETE_DAYS를 다른 파일에서도 import 할 수 있도록 re-export
export { AUTO_DELETE_DAYS } from './alarm';

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
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
`;

const AlarmList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  const scheduleDateStr = scheduleData?.date ? format(new Date(scheduleData.date), 'M월 d일 (E)', { locale: ko }) : '';
  const anniversaryDaysInputRef = useRef(null);

  // ==================== 커스텀 훅 초기화 ====================
  const alarmSound = useAlarmSound();
  const alarmList = useAlarmList(scheduleData);
  const alarmForm = useAlarmForm();
  const alarmEdit = useAlarmEdit();
  const alarmModals = useAlarmModals();

  const {
    registeredAlarms,
    setRegisteredAlarms,
    sortBy,
    sortDirection,
    toggleSort,
    sortAlarms,
  } = alarmList;

  const {
    alarmTitle,
    hourInput,
    minuteInput,
    isAnniversary,
    anniversaryRepeat,
    anniversaryTiming,
    anniversaryDaysBefore,
    setAlarmTitle,
    setHourInput,
    setMinuteInput,
    setIsAnniversary,
    setAnniversaryRepeat,
    setAnniversaryTiming,
    setAnniversaryDaysBefore,
  } = alarmForm;

  const {
    showValidationModal,
    validationMessage,
    showDeleteConfirmModal,
    deleteConfirmMessage,
    closeValidationModal,
    closeDeleteConfirmModal,
    showValidation,
  } = alarmModals;

  // 알람 액션
  const alarmActions = useAlarmActions({
    scheduleData,
    alarmTitle,
    eventTime: `${hourInput}:${minuteInput}`,
    hourInput,
    minuteInput,
    isAnniversary,
    anniversaryRepeat,
    anniversaryTiming,
    anniversaryDaysBefore,
    pendingAlarms: alarmList.pendingAlarms,
    registeredAlarms,
    setRegisteredAlarms,
    setAlarmTitle,
    setHourInput,
    setMinuteInput,
    showValidation,
    onSave,
    notificationType: alarmSound.notificationType,
    snoozeMinutes: alarmSound.snoozeMinutes,
    soundFile: alarmSound.soundFile,
    customSoundName: alarmSound.customSoundName,
    volume: alarmSound.volume,
  });

  // 반복 기념일 계산
  const repeatedAnniversaries = useMemo(() => {
    if (!scheduleData?.date) return [];

    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      if (!allSchedulesStr) return [];

      const allSchedules = JSON.parse(allSchedulesStr);
      return getRepeatedAnniversaries(scheduleData.date, allSchedules);
    } catch (error) {
      console.error('반복 기념일 로드 오류:', error);
      return [];
    }
  }, [scheduleData?.date]);

  // 데이터 로드
  useEffect(() => {
    if (!isOpen || !scheduleData?.date) return;

    try {
      const allSchedulesStr = localStorage.getItem('calendarSchedules_shared');
      if (!allSchedulesStr) return;

      const allSchedules = JSON.parse(allSchedulesStr);
      const dateKey = format(new Date(scheduleData.date), 'yyyy-MM-dd');
      const dayData = allSchedules[dateKey];

      if (dayData?.alarm?.registeredAlarms) {
        setRegisteredAlarms(dayData.alarm.registeredAlarms);
      }
    } catch (error) {
      console.error('알람 데이터 로드 오류:', error);
    }
  }, [isOpen, scheduleData?.date]);

  // 닫기 핸들러
  const handleClose = () => {
    alarmForm.resetForm();
    onClose();
  };

  // 삭제 확인
  const confirmDeleteAlarm = () => {
    // 삭제 로직 구현
    closeDeleteConfirmModal();
  };

  // 삭제 취소
  const cancelDeleteAlarm = () => {
    closeDeleteConfirmModal();
  };

  // 알람 토글
  const handleToggleAlarm = (id, isRepeated) => {
    const result = alarmList.toggleAlarmEnabled(id, isRepeated, scheduleData.date);
    if (result) {
      onSave({
        registeredAlarms: result.updatedAlarms,
        notificationType: alarmSound.notificationType,
        snoozeMinutes: alarmSound.snoozeMinutes,
      }, 'toggle');
    }
  };

  // 알람 삭제
  const handleDeleteAlarm = (alarm) => {
    alarmModals.showDeleteConfirmation(alarm, 'registered');
  };

  // 현재시간 설정
  const handleSetCurrentTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    setHourInput(hours < 10 ? '0' + hours : hours.toString());
    setMinuteInput(minutes < 10 ? '0' + minutes : minutes.toString());
  };

  // 타이틀 변경 핸들러
  const handleTitleChange = (e) => {
    const value = e.target.value;
    const byteLength = Array.from(value).reduce((acc, char) => {
      return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
    }, 0);
    if (byteLength <= 20) {
      setAlarmTitle(value);
    }
  };

  const isDisabled = isPastDate && !isAnniversary;

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

            {/* 등록된 알람 목록 */}
            {registeredAlarms.length > 0 && (
              <Section>
                <SectionTitle>
                  <BellIcon />
                  등록된 알람 ({registeredAlarms.length}개)
                </SectionTitle>
                <AlarmBox>
                  <AlarmList>
                    {sortAlarms(registeredAlarms).map((alarm) => (
                      <AlarmItemComponent
                        key={alarm.id}
                        alarm={alarm}
                        scheduleData={scheduleData}
                        onToggle={handleToggleAlarm}
                        onDelete={handleDeleteAlarm}
                      />
                    ))}
                  </AlarmList>
                </AlarmBox>
              </Section>
            )}

            {/* 알람 등록 폼 */}
            {!isPastDate && (
              <>
                {/* 알람 타이틀 */}
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

                {/* 기념일 체크박스 */}
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

                {/* 알람 시간 */}
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
                    {!isAnniversary && (
                      <SetCurrentTimeButton onClick={handleSetCurrentTime} disabled={isDisabled}>
                        현재시간
                      </SetCurrentTimeButton>
                    )}
                    <AddButton onClick={() => alarmActions.handleAddPresetAlarm(0, 0, 0)} disabled={isDisabled} style={{ marginLeft: 'auto' }}>
                      알람등록
                    </AddButton>
                  </div>
                </Section>
              </>
            )}
          </FormArea>

          <Footer>
            <Button $variant="secondary" onClick={handleClose}>
              닫기
            </Button>
          </Footer>
        </ModalContent>

        {/* Confirmation Modals */}
        <ValidationModal
          isOpen={showValidationModal}
          message={validationMessage}
          onClose={closeValidationModal}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirmModal}
          message={deleteConfirmMessage}
          onConfirm={confirmDeleteAlarm}
          onCancel={cancelDeleteAlarm}
        />
      </Overlay>
    </Portal>
  );
};

export default AlarmModal;
