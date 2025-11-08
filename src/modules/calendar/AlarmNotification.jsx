// src/modules/calendar/AlarmNotification.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { format } from 'date-fns';
import Portal from '../../components/Portal';
import { loadAudioFile } from '../../utils/audioStorage';

// --- 애니메이션 ---
const slideDown = keyframes`
  from { 
    transform: translateY(-100%); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`;

// --- 스타일 컴포넌트 ---
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000;
  animation: ${slideDown} 0.5s ease-out;
`;

const AlarmCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px 30px;
  min-width: 350px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  color: white;
  position: relative;
  animation: ${props => props.$isUrgent ? css`${shake} 0.5s infinite` : css`${pulse} 2s infinite`};
`;

const TimeDisplay = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ScheduleTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const ScheduleContent = styled.p`
  font-size: 16px;
  line-height: 1.4;
  margin: 0 0 30px 0;
  opacity: 0.9;
  max-height: 100px;
  overflow-y: auto;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ActionButton = styled.button`
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DismissButton = styled(ActionButton)`
  background: #ff6b6b;
  color: white;
  
  &:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  }
`;

const SnoozeButton = styled(ActionButton)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const SnoozeOptionsContainer = styled.div`
  display: ${props => props.$show ? 'block' : 'none'};
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  margin-top: 10px;
`;

const SnoozeOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
`;

const SnoozeOption = styled.button`
  padding: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const SmartSnoozeToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 14px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.3);
    transition: 0.4s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: rgba(76, 175, 80, 0.8);
  }
  
  input:checked + span:before {
    transform: translateX(26px);
  }
`;

const AlarmNotification = ({ 
  isVisible, 
  scheduleData, 
  onDismiss, 
  onSnooze, 
  currentSnoozeCount = 0,
  maxSnoozeCount = 3 
}) => {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [smartSnoozeEnabled, setSmartSnoozeEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef(null);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 알람 소리 재생
  useEffect(() => {
    if (isVisible && scheduleData) {
      playAlarmSound();
    } else {
      stopAlarmSound();
    }

    return () => {
      stopAlarmSound();
    };
  }, [isVisible, scheduleData]);

  const playAlarmSound = async () => {
    try {
      const soundFile = scheduleData?.alarm?.soundFile || 'default';
      const volume = (scheduleData?.alarm?.volume || 80) / 100;

      let audioSrc = null;

      // 커스텀 사운드인 경우 IndexedDB에서 불러오기
      if (soundFile === 'custom') {
        const audioData = await loadAudioFile('alarm_sound_main');
        if (audioData) {
          audioSrc = audioData;
          console.log('✅ IndexedDB에서 알람 소리 로드');
        } else {
          console.warn('⚠️ 커스텀 사운드를 찾을 수 없어 기본 소리 사용');
          audioSrc = '/sound/Schedule_alarm/default.mp3';
        }
      } else {
        // 기본 사운드
        audioSrc = '/sound/Schedule_alarm/default.mp3';
      }

      if (audioSrc) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;

        await audioRef.current.play();
        console.log('🔔 알람 소리 재생 시작');
      }
    } catch (error) {
      console.error('❌ 알람 소리 재생 실패:', error);
    }
  };

  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const handleDismiss = () => {
    stopAlarmSound();
    onDismiss();
  };

  const handleSnoozeSelect = (minutes) => {
    let actualMinutes = minutes;
    
    // 스마트 스누즈 적용
    if (smartSnoozeEnabled) {
      const smartIntervals = [10, 5, 2]; // 10분 → 5분 → 2분
      if (currentSnoozeCount < smartIntervals.length) {
        actualMinutes = smartIntervals[currentSnoozeCount];
      }
    }
    
    stopAlarmSound();
    onSnooze(actualMinutes);
    setShowSnoozeOptions(false);
  };

  const getSmartSnoozeDescription = () => {
    if (!smartSnoozeEnabled) return '';
    
    const intervals = [10, 5, 2];
    const remaining = Math.max(0, intervals.length - currentSnoozeCount);
    
    if (remaining === 0) {
      return '(스마트 스누즈 완료)';
    }
    
    const nextInterval = intervals[currentSnoozeCount];
    return `(스마트: 다음 ${nextInterval}분)`;
  };

  if (!isVisible || !scheduleData) return null;

  const isUrgent = currentSnoozeCount >= maxSnoozeCount - 1;
  const remainingSnooze = Math.max(0, maxSnoozeCount - currentSnoozeCount);

  return (
    <Portal>
      <Overlay>
        <AlarmCard $isUrgent={isUrgent}>
          <TimeDisplay>
            {format(currentTime, 'HH:mm:ss')}
          </TimeDisplay>
          
          <ScheduleTitle>
            📅 {format(new Date(scheduleData.date), 'yyyy년 M월 d일')} 일정
          </ScheduleTitle>
          
          <ScheduleContent>
            {scheduleData.text || '설정된 일정이 있습니다.'}
          </ScheduleContent>
          
          {currentSnoozeCount > 0 && (
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '20px' }}>
              🔄 다시 알림 횟수: {currentSnoozeCount}/{maxSnoozeCount}
              {remainingSnooze > 0 && ` (${remainingSnooze}회 남음)`}
            </div>
          )}
          
          <ButtonContainer>
            <DismissButton onClick={handleDismiss}>
              ✅ 확인 (알람 끄기)
            </DismissButton>
            
            {remainingSnooze > 0 && (
              <SnoozeButton onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}>
                ⏰ 다시 알림 {getSmartSnoozeDescription()}
              </SnoozeButton>
            )}
            
            <SnoozeOptionsContainer $show={showSnoozeOptions}>
              <SnoozeOptionsGrid>
                <SnoozeOption onClick={() => handleSnoozeSelect(5)}>
                  5분 뒤
                </SnoozeOption>
                <SnoozeOption onClick={() => handleSnoozeSelect(10)}>
                  10분 뒤
                </SnoozeOption>
                <SnoozeOption onClick={() => handleSnoozeSelect(15)}>
                  15분 뒤
                </SnoozeOption>
                <SnoozeOption onClick={() => handleSnoozeSelect(30)}>
                  30분 뒤
                </SnoozeOption>
              </SnoozeOptionsGrid>
              
              <SmartSnoozeToggle>
                <span>스마트 스누즈</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={smartSnoozeEnabled}
                    onChange={(e) => setSmartSnoozeEnabled(e.target.checked)}
                  />
                  <span />
                </ToggleSwitch>
                <small style={{ fontSize: '12px', opacity: 0.7 }}>
                  (간격이 점점 짧아짐)
                </small>
              </SmartSnoozeToggle>
            </SnoozeOptionsContainer>
          </ButtonContainer>
        </AlarmCard>
      </Overlay>
    </Portal>
  );
};

export default AlarmNotification;