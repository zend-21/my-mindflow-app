// src/modules/calendar/alarm/components/AlarmEditModal.jsx
// 알람 수정 모달 컴포넌트

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Portal from '../../../../components/Portal';
import {
  ALARM_COLORS,
  TitleIcon,
  ClockIcon,
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
} from '../';
import { saveAudioFile, loadAudioFile } from '../../../../utils/audioStorage';
import { Toast } from './Toast';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 12000;
`;

const ModalContent = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  border-radius: 16px;
  width: 95vw;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
`;

const TimeInput = styled.input`
  width: 60px;
  padding: 14px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
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

const ToggleButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #333842;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background: #3d424d;
  }
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

export const AlarmEditModal = ({ isOpen, alarm, onSave, onClose }) => {
  const [editTitle, setEditTitle] = useState('');
  const [editHourInput, setEditHourInput] = useState('');
  const [editMinuteInput, setEditMinuteInput] = useState('');
  const [editIsAnniversary, setEditIsAnniversary] = useState(false);
  const [editAnniversaryRepeat, setEditAnniversaryRepeat] = useState('');
  const [editAnniversaryTiming, setEditAnniversaryTiming] = useState('');
  const [editAnniversaryDaysBefore, setEditAnniversaryDaysBefore] = useState('');

  // 기본 알람옵션 from main modal (read-only for display)
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);
  const [notificationType, setNotificationType] = useState('sound');

  // 개별 알람옵션 상태
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [editCustomSound, setEditCustomSound] = useState(null);
  const [editCustomSoundName, setEditCustomSoundName] = useState('');
  const [editCustomVolume, setEditCustomVolume] = useState(null);
  const [editCustomNotificationType, setEditCustomNotificationType] = useState(null);

  const editAnniversaryDaysInputRef = useRef(null);
  const editSoundFileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Toast 상태
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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
          setSoundFile(settings.soundFile || 'default');
          setCustomSoundName(settings.customSoundName || '');
          setVolume(settings.volume || 80);
          setNotificationType(settings.notificationType || 'sound');
        }
      } catch (error) {
        console.error('알람 설정 로드 오류:', error);
      }

      // Load 개별 알람옵션 from alarm object
      setEditCustomSound(alarm.customSound !== undefined ? alarm.customSound : null);
      setEditCustomSoundName(alarm.customSoundName || '');
      setEditCustomVolume(alarm.customVolume !== undefined ? alarm.customVolume : null);
      setEditCustomNotificationType(alarm.customNotificationType !== undefined ? alarm.customNotificationType : null);
    }
  }, [alarm, isOpen]);

  if (!isOpen || !alarm) return null;

  // Toast 표시 헬퍼 함수
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // Play sound preview
  const handlePlaySound = async () => {
    if (audioRef.current) {
      const effectiveSound = editCustomSound !== null ? editCustomSound : soundFile;
      const effectiveVolume = editCustomVolume !== null ? editCustomVolume : volume;

      if (effectiveSound === 'default') {
        audioRef.current.src = '/sound/Schedule_alarm/default.mp3';
      } else if (effectiveSound === 'custom' || (typeof effectiveSound === 'string' && effectiveSound.startsWith('alarm_sound_'))) {
        // IndexedDB에서 사운드 불러오기
        const audioData = await loadAudioFile(effectiveSound.startsWith('alarm_sound_') ? effectiveSound : 'alarm_sound_main');
        if (audioData) {
          audioRef.current.src = audioData;
        } else {
          showToastMessage('저장된 알람 소리를 찾을 수 없습니다.');
          return;
        }
      }
      audioRef.current.volume = effectiveVolume / 100;
      audioRef.current.play();
    }
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
      customSound: editCustomSound,
      customSoundName: editCustomSoundName,
      customVolume: editCustomVolume,
      customNotificationType: editCustomNotificationType,
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

  return (
    <Portal>
      <Overlay>
        <ModalContent>
          <Header>
            <div style={{ width: '32px' }}></div>
            <HeaderTitle>알람 수정</HeaderTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          <FormArea>
            {/* 1. 알람 타이틀 */}
            <Section>
              <SectionTitle>
                <TitleIcon />
                알람 타이틀<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
              </SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
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
            </Section>

            {/* 2. 기념일 체크박스 + 설정 */}
            <Section style={{ marginTop: '-8px' }}>
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

            {/* 3. 알람 시간 */}
            <Section>
              <SectionTitle>
                <ClockIcon />
                알람 시간<span style={{ color: ALARM_COLORS.danger, fontWeight: 'normal' }}>(필수항목)</span>
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
                <span style={{ fontSize: '16px', color: '#e0e0e0' }}>시</span>
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
                <span style={{ fontSize: '16px', color: '#e0e0e0' }}>분</span>
              </div>
            </Section>

            {/* 개별 알람옵션 Toggle Button */}
            <Section>
              <ToggleButton
                onClick={() => {
                  const newShowOptions = !showCustomOptions;
                  setShowCustomOptions(newShowOptions);
                }}
              >
                <span>개별 알람옵션</span>
                <span style={{ transform: showCustomOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  ▼
                </span>
              </ToggleButton>
            </Section>

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
                    setEditCustomSound(null);
                    setEditCustomSoundName('');
                    setEditCustomVolume(null);
                    setEditCustomNotificationType(null);
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

            {/* 개별 알람 소리 */}
            {showCustomOptions && (
              <Section style={{ marginTop: '-12px' }}>
                <SectionTitle>
                  <VolumeIcon />
                  알람 소리
                </SectionTitle>
                <Select
                  value={editCustomSound === 'default' ? 'default' : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'default') {
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
                      // 파일 크기 체크 (500KB 제한 - 알람음은 짧을수록 좋음)
                      const maxSize = 500 * 1024; // 500KB
                      if (file.size > maxSize) {
                        showToastMessage('알람 소리는 500KB 이하여야 합니다.\n짧은 알람음(3-5초) 사용을 권장합니다.');
                        return;
                      }

                      setEditCustomSoundName(file.name);
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const audioData = event.target.result;

                        // IndexedDB에 저장 (개별 알람용 키 사용)
                        try {
                          const alarmKey = `alarm_sound_individual_${alarm?.id || Date.now()}`;
                          await saveAudioFile(alarmKey, audioData);
                          setEditCustomSound(alarmKey); // 키를 저장
                          console.log('✅ 개별 알람 소리 저장 완료:', file.name);
                        } catch (error) {
                          console.error('❌ 알람 소리 저장 실패:', error);
                          showToastMessage('알람 소리 저장에 실패했습니다.');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                {editCustomSound !== 'default' && (
                  <FileInputLabel onClick={() => editSoundFileInputRef.current?.click()} style={{ marginTop: '8px' }}>
                    사운드 파일 선택
                  </FileInputLabel>
                )}
                {editCustomSound !== 'default' && editCustomSoundName && (
                  <FileName>선택된 파일: {editCustomSoundName}</FileName>
                )}
                {editCustomSound === 'default' && (
                  <SoundPreview>
                    <PlayButton onClick={handlePlaySound}>▶</PlayButton>
                    <span style={{ fontSize: '13px', color: '#e0e0e0' }}>
                      미리듣기
                    </span>
                  </SoundPreview>
                )}
              </Section>
            )}

            {/* 개별 알람 볼륨 */}
            {showCustomOptions && (
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
            )}

            {/* 개별 알림 유형 */}
            {showCustomOptions && (
              <Section>
                <SectionTitle>
                  <VibrateIcon />
                  알림 유형
                </SectionTitle>
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
            )}
          </FormArea>

          {/* Hidden audio element for sound preview */}
          <audio ref={audioRef} />

          <Footer>
            <Button $variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button $variant="primary" onClick={handleSave}>
              저장
            </Button>
          </Footer>
        </ModalContent>
      </Overlay>
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </Portal>
  );
};
