// src/modules/calendar/AlarmToast.jsx
// ✨ 간결한 토스트 알림 컴포넌트 (3초 표시, 탭으로 중지)

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../../components/Portal';
import { loadAudioFile } from '../../utils/audioStorage';
import { ALARM_REPEAT_CONFIG } from './alarm/constants/alarmConstants';

// 애니메이션
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

const slideUp = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`;

// 스타일 컴포넌트
const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 13000;
  animation: ${props => props.$isClosing ? slideUp : slideDown} 0.3s ease-out;
  cursor: pointer;
  user-select: none;
  max-width: 90vw;
  min-width: 300px;
`;

const ToastTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToastContent = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 6px;
  max-height: 60px;
  overflow-y: auto;
`;

const ToastHint = styled.div`
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
`;

/**
 * 토스트 알림 컴포넌트
 * @param {boolean} isVisible - 표시 여부
 * @param {object} alarmData - 알람 데이터 { title, content, soundFile, volume }
 * @param {function} onClose - 닫기 콜백 (탭 시 호출, 남은 반복 모두 취소)
 */
const AlarmToast = ({ isVisible, alarmData, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const audioRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // 토스트 표시 및 자동 닫기
  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);

      // 소리 재생
      playAlarmSound();

      // 진동
      if ('vibrate' in navigator) {
        navigator.vibrate(500);
      }

      // 3초 후 자동 닫기
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, ALARM_REPEAT_CONFIG.toastDuration);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      stopAlarmSound();
    };
  }, [isVisible]);

  // 알람 소리 재생
  const playAlarmSound = async () => {
    try {
      const soundFile = alarmData?.soundFile || 'default';
      const volume = (alarmData?.volume || 80) / 100;

      let audioSrc = null;

      if (soundFile === 'custom') {
        const audioData = await loadAudioFile('alarm_sound_main');
        audioSrc = audioData || '/sound/Schedule_alarm/default.mp3';
      } else {
        audioSrc = '/sound/Schedule_alarm/default.mp3';
      }

      if (audioSrc) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.loop = false;
        audioRef.current.volume = volume;

        try {
          await audioRef.current.play();
        } catch (playError) {
          console.warn('⚠️ 알람 소리 재생 차단됨:', playError.message);
        }
      }
    } catch (error) {
      console.error('❌ 알람 소리 재생 실패:', error);
    }
  };

  // 소리 중지
  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // 닫기 처리
  const handleClose = () => {
    setIsClosing(true);
    stopAlarmSound();

    // 애니메이션 후 콜백 호출
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  // 탭 시 중지
  const handleClick = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    handleClose();
  };

  if (!isVisible || !alarmData) return null;

  return (
    <Portal>
      <ToastContainer $isClosing={isClosing} onClick={handleClick}>
        <ToastTitle>
          🔔 {alarmData.title || '알람'}
        </ToastTitle>
        {alarmData.content && (
          <ToastContent>
            {alarmData.content}
          </ToastContent>
        )}
        <ToastHint>
          탭하여 중지
        </ToastHint>
      </ToastContainer>
    </Portal>
  );
};

export default AlarmToast;
