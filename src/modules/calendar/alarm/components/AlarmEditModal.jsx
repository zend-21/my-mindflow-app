// src/modules/calendar/alarm/components/AlarmEditModal.jsx
// 알람 수정 모달 컴포넌트

import React, { useState, useRef, useEffect } from 'react';
import Portal from '../../../../components/Portal';
import * as S from './AlarmEditModal.styles';
import {
  ALARM_COLORS,
  ADVANCE_NOTICE_CONFIG,
  ALARM_REPEAT_CONFIG,
  TitleIcon,
  ClockIcon,
  VibrateIcon,
  AlertIcon,
  BellIcon,
  RadioGroup,
  RadioOption,
} from '../';
import { Toast } from './Toast';
import AlarmToast from '../../AlarmToast';

export const AlarmEditModal = ({ isOpen, alarm, onSave, onClose }) => {
  const [editTitle, setEditTitle] = useState('');
  const [editHourInput, setEditHourInput] = useState('');
  const [editMinuteInput, setEditMinuteInput] = useState('');
  const [editIsAnniversary, setEditIsAnniversary] = useState(false);
  const [editAnniversaryRepeat, setEditAnniversaryRepeat] = useState('');
  const [editAnniversaryTiming, setEditAnniversaryTiming] = useState('');
  const [editAnniversaryDaysBefore, setEditAnniversaryDaysBefore] = useState('');

  // 기본 알람옵션 from main modal (read-only for display)
  const [notificationType, setNotificationType] = useState('both');

  // 개별 알람옵션 상태
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [editCustomNotificationType, setEditCustomNotificationType] = useState(null);
  const [editCustomRepeatCount, setEditCustomRepeatCount] = useState(null);

  const editAnniversaryDaysInputRef = useRef(null);

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // 미리보기 상태
  const [previewToasts, setPreviewToasts] = useState([]);
  const previewTimersRef = useRef([]);

  // alarm이 변경될 때마다 폼 초기화
  useEffect(() => {
    if (alarm && isOpen) {
      setEditTitle(alarm.title || '');

      const alarmTime = new Date(alarm.calculatedTime);
      setEditHourInput(String(alarmTime.getHours()).padStart(2, '0'));
      setEditMinuteInput(String(alarmTime.getMinutes()).padStart(2, '0'));

      setEditIsAnniversary(alarm.isAnniversary || false);

      // 기념일 알람인 경우에만 기본값 설정, 일반 알람은 빈 값으로 초기화
      if (alarm.isAnniversary) {
        setEditAnniversaryRepeat(alarm.anniversaryRepeat || 'yearly');
        setEditAnniversaryTiming(alarm.anniversaryTiming || 'today');
        setEditAnniversaryDaysBefore(alarm.anniversaryDaysBefore ? String(alarm.anniversaryDaysBefore) : '');
      } else {
        // 일반 알람을 기념일로 변경할 때는 사용자가 선택하도록 빈 값으로 초기화
        setEditAnniversaryRepeat('');
        setEditAnniversaryTiming('');
        setEditAnniversaryDaysBefore('');
      }

      // Load 기본 알람옵션 from localStorage
      try {
        const savedSettings = localStorage.getItem('alarmSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setNotificationType(settings.notificationType || 'both');
        }
      } catch (error) {
        console.error('알람 설정 로드 오류:', error);
      }

      // Load 개별 알람옵션 from alarm object
      setEditCustomNotificationType(alarm.customNotificationType !== undefined ? alarm.customNotificationType : null);
      setEditCustomRepeatCount(alarm.customRepeatCount !== undefined ? alarm.customRepeatCount : null);
    }
  }, [alarm, isOpen]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      previewTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  if (!isOpen || !alarm) return null;

  // Toast 표시 헬퍼 함수
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleSave = () => {
    // 유효성 검사
    if (!editTitle.trim()) {
      showToastMessage('알람 타이틀을 입력해주세요.');
      return;
    }
    if (editHourInput === '' || editMinuteInput === '') {
      showToastMessage('알람 시간을 입력해주세요.');
      return;
    }

    const updatedAlarm = {
      ...alarm,
      title: editTitle,
      isAnniversary: editIsAnniversary,
      anniversaryRepeat: editIsAnniversary ? editAnniversaryRepeat : undefined,
      anniversaryTiming: editIsAnniversary ? editAnniversaryTiming : undefined,
      anniversaryDaysBefore: editIsAnniversary && editAnniversaryTiming === 'before' ? parseInt(editAnniversaryDaysBefore, 10) : undefined,
      // Save 개별 알람옵션
      customNotificationType: editCustomNotificationType,
      customRepeatCount: editCustomRepeatCount,
    };

    // 시간 업데이트
    const alarmDate = new Date(alarm.calculatedTime);
    alarmDate.setHours(parseInt(editHourInput, 10), parseInt(editMinuteInput, 10), 0, 0);
    updatedAlarm.calculatedTime = alarmDate.toISOString();

    onSave(updatedAlarm);
  };

  const calculateByteLength = (str) => {
    return Array.from(str).reduce((acc, char) => {
      return acc + (char.charCodeAt(0) > 127 ? 2 : 1);
    }, 0);
  };

  // 알람 미리보기 시뮬레이션
  const handlePreview = () => {
    // 기존 미리보기 타이머 모두 제거
    previewTimersRef.current.forEach(timer => clearTimeout(timer));
    previewTimersRef.current = [];
    setPreviewToasts([]);

    // 개별 설정 우선, 없으면 기본 설정 사용
    const effectiveRepeatCount = editCustomRepeatCount !== null ? editCustomRepeatCount : ALARM_REPEAT_CONFIG.defaultCount;
    const effectiveNotificationType = editCustomNotificationType !== null ? editCustomNotificationType : notificationType;

    // 미리보기 알람 데이터
    const previewData = {
      title: editTitle || '알람 미리보기',
      content: '설정된 알람이 이렇게 울립니다',
      notificationType: effectiveNotificationType,
    };

    // 첫 번째 토스트 즉시 표시
    const firstToastId = `preview_${Date.now()}`;
    setPreviewToasts([{
      id: firstToastId,
      ...previewData,
      currentRepeat: 1,
      totalRepeats: effectiveRepeatCount
    }]);

    // 반복 처리
    if (effectiveRepeatCount > 1) {
      for (let i = 2; i <= effectiveRepeatCount; i++) {
        const timer = setTimeout(() => {
          const toastId = `preview_${Date.now()}_${i}`;
          setPreviewToasts(prev => [...prev, {
            id: toastId,
            ...previewData,
            currentRepeat: i,
            totalRepeats: effectiveRepeatCount
          }]);
        }, (i - 1) * ALARM_REPEAT_CONFIG.fixedInterval * 1000);

        previewTimersRef.current.push(timer);
      }
    }
  };

  // 미리보기 토스트 닫기
  const handleDismissPreview = (toastId) => {
    setPreviewToasts(prev => prev.filter(t => t.id !== toastId));
  };

  return (
    <Portal>
      <S.Overlay>
        <S.ModalContent>
          <S.Header>
            <div style={{ width: '32px' }}></div>
            <S.HeaderTitle>알람 수정</S.HeaderTitle>
            <S.CloseButton onClick={onClose}>×</S.CloseButton>
          </S.Header>

          <S.FormArea>
            {/* 1. 알람 타이틀 */}
            <S.Section>
              <S.SectionTitle>
                <TitleIcon />
                알람 타이틀<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
              </S.SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <S.Input
                  type="text"
                  placeholder="예: 수빈이 생일"
                  value={editTitle}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (calculateByteLength(value) <= 20) {
                      setEditTitle(value);
                    }
                  }}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <div style={{ fontSize: '11px', color: '#808080', whiteSpace: 'nowrap' }}>
                  {calculateByteLength(editTitle)}/20
                </div>
              </div>
            </S.Section>

            {/* 2. 기념일 체크박스 + 설정 */}
            <S.Section style={{ marginTop: '-8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: editIsAnniversary ? '16px' : '0' }}>
                <input
                  type="checkbox"
                  checked={editIsAnniversary}
                  onChange={(e) => setEditIsAnniversary(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span
                  style={{ fontSize: '14px', color: '#e0e0e0', cursor: 'pointer' }}
                  onClick={() => setEditIsAnniversary(!editIsAnniversary)}
                >
                  기념일로 등록
                </span>
              </div>

              {editIsAnniversary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 알림주기 */}
                  <div>
                    <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '8px' }}>
                      알림주기 <span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
                    </div>
                    <RadioGroup style={{ flexDirection: 'row', gap: '8px' }}>
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
                          id="edit-timing-today"
                          name="editAnniversaryTiming"
                          value="today"
                          checked={editAnniversaryTiming === 'today'}
                          onChange={() => setEditAnniversaryTiming('today')}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="edit-timing-today" style={{ fontSize: '14px', color: '#e0e0e0', cursor: 'pointer' }}>
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
                        <label htmlFor="edit-timing-before" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#e0e0e0', cursor: 'pointer' }}>
                          <S.TimeInput
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
            </S.Section>

            {/* 3. 알람 시간 */}
            <S.Section>
              <S.SectionTitle>
                <ClockIcon />
                알람 시간<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
              </S.SectionTitle>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <S.TimeInput
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
                <span style={{ fontSize: '16px', color: '#e0e0e0' }}>시</span>
                <S.TimeInput
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
                <span style={{ fontSize: '16px', color: '#e0e0e0' }}>분</span>
              </div>
            </S.Section>

            {/* 개별 알람옵션 Toggle Button */}
            <S.Section>
              <S.ToggleButton
                onClick={() => {
                  const newShowOptions = !showCustomOptions;
                  setShowCustomOptions(newShowOptions);
                }}
              >
                <span>개별 알람옵션</span>
                <span style={{ transform: showCustomOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  ▼
                </span>
              </S.ToggleButton>
            </S.Section>

            {/* 개별 알람옵션 설명 및 초기화 버튼 */}
            {showCustomOptions && (
              <div style={{
                padding: '6px 20px 8px 20px',
                fontSize: '12px',
                color: ALARM_COLORS.muted,
                background: '#333842',
                borderRadius: '0 0 8px 8px',
                margin: '0 20px 8px 20px',
                marginTop: '-20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>이 알람에만 적용되는 설정입니다.</span>
                <button
                  onClick={() => {
                    setEditCustomNotificationType(null);
                    setEditCustomRepeatCount(null);
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


            {/* 개별 알림 유형 */}
            {showCustomOptions && (
              <S.Section>
                <S.SectionTitle>
                  <VibrateIcon />
                  알림 유형
                </S.SectionTitle>
                <RadioGroup style={{ flexDirection: 'column' }}>
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
                  <RadioOption $checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'vibrate'}>
                    <input
                      type="radio"
                      name="editNotificationType"
                      value="vibrate"
                      checked={(editCustomNotificationType !== null ? editCustomNotificationType : notificationType) === 'vibrate'}
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
              </S.Section>
            )}

            {/* 개별 반복 횟수 */}
            {showCustomOptions && (
              <S.Section>
                <S.SectionTitle>
                  <AlertIcon />
                  반복 횟수 <span style={{ fontSize: '11px', color: '#868e96', fontWeight: 'normal', marginLeft: '4px' }}>(특정 간격으로 알람을 반복하여 울립니다)</span>
                </S.SectionTitle>
                <RadioGroup style={{ flexDirection: 'column' }}>
                  {Object.entries(ALARM_REPEAT_CONFIG.counts).map(([value, label]) => (
                    <RadioOption key={value} $checked={(editCustomRepeatCount !== null ? editCustomRepeatCount : ALARM_REPEAT_CONFIG.defaultCount) === parseInt(value, 10)}>
                      <input
                        type="radio"
                        name="editRepeatCount"
                        value={value}
                        checked={(editCustomRepeatCount !== null ? editCustomRepeatCount : ALARM_REPEAT_CONFIG.defaultCount) === parseInt(value, 10)}
                        onChange={(e) => setEditCustomRepeatCount(parseInt(e.target.value, 10))}
                      />
                      <span>{label}</span>
                    </RadioOption>
                  ))}
                </RadioGroup>
              </S.Section>
            )}

            {/* 알람 미리보기 버튼 */}
            {showCustomOptions && (
              <S.PreviewButton onClick={handlePreview}>
                <BellIcon />
                알람 미리보기
              </S.PreviewButton>
            )}
          </S.FormArea>

          <S.Footer>
            <S.Button $variant="secondary" onClick={onClose}>
              취소
            </S.Button>
            <S.Button $variant="primary" onClick={handleSave}>
              저장
            </S.Button>
          </S.Footer>
        </S.ModalContent>
      </S.Overlay>
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
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
