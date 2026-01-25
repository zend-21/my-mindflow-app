// src/modules/calendar/AlarmToast.jsx
// ✨ 간결한 토스트 알림 컴포넌트 (3초 표시, 탭으로 중지)

import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Portal from '../../components/Portal';
import { loadAudioFile } from '../../utils/audioStorage';
import { ALARM_REPEAT_CONFIG } from './alarm/constants/alarmConstants';

// 애니메이션 - 화면 중앙 위에서 아래로 슬라이드
const slideDown = keyframes`
  from {
    transform: translate(-50%, -150%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -150%);
    opacity: 0;
  }
`;

// 스타일 컴포넌트
const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  background: white;
  color: #333;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 13000;
  animation: ${props => props.$isClosing ? slideUp : slideDown} 0.3s ease-out forwards;
  cursor: pointer;
  user-select: none;
  max-width: 90vw;
  min-width: 250px;
`;

const AppIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 8px;
`;

const ToastTitle = styled.div`
  font-size: 16px;
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  word-break: keep-all;
  text-align: center;
`;

const BoldText = styled.span`
  font-weight: bold;
`;

/**
 * 토스트 알림 컴포넌트
 * @param {boolean} isVisible - 표시 여부
 * @param {object} alarmData - 알람 데이터 { title, soundFile, volume }
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

      // notificationType에 따라 소리/진동 제어
      const notificationType = alarmData?.notificationType || 'sound';
      console.log('🔔 [AlarmToast] 알람 데이터:', {
        title: alarmData?.title,
        notificationType,
        vibrateSupported: 'vibrate' in navigator,
        fullAlarmData: alarmData
      });

      // 소리 재생 ('sound' 또는 'both')
      if (notificationType === 'sound' || notificationType === 'both') {
        console.log('🔊 [AlarmToast] 소리 재생');
        playAlarmSound();
      }

      // 진동 ('vibrate' 또는 'both')
      if ((notificationType === 'vibrate' || notificationType === 'both') && 'vibrate' in navigator) {
        console.log('📳 [AlarmToast] 진동 시작:', [500, 200, 500]);
        // 알람 진동 패턴: [진동ms, 정지ms, 진동ms, 정지ms, ...]
        // 500ms 진동 → 200ms 정지 → 500ms 진동
        const vibrateResult = navigator.vibrate([500, 200, 500]);
        console.log('📳 [AlarmToast] 진동 결과:', vibrateResult);
      } else {
        console.log('❌ [AlarmToast] 진동 불가:', {
          condition1: notificationType === 'vibrate' || notificationType === 'both',
          condition2: 'vibrate' in navigator,
          notificationType
        });
      }

      // 3초 후 자동 닫기
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, ALARM_REPEAT_CONFIG.toastDuration);

      // 백그라운드에서도 알람이 계속 재생되도록 Page Visibility 이벤트 리스너 추가
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // 포그라운드로 복귀 시 알람이 멈췄다면 재개
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch((err) => {
              console.log('알람 재개 실패:', err);
            });
          }
        }
        // 백그라운드로 갈 때는 아무것도 하지 않음 (계속 재생)
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
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
        audioSrc = audioData || `/sound/Schedule_alarm/default.mp3?v=${Date.now()}`;
      } else {
        audioSrc = `/sound/Schedule_alarm/default.mp3?v=${Date.now()}`;
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
          <AppIcon src="/icons/icon-48.png" alt="ShareNote" />
          <BoldText>{alarmData.title || '알람'}</BoldText> {alarmData.content || ''}
        </ToastTitle>
      </ToastContainer>
    </Portal>
  );
};

export default AlarmToast;
