// src/modules/calendar/alarm/hooks/useAlarmSound.js
// 알람 사운드 관련 상태 및 로직 관리

import { useState, useEffect, useRef } from 'react';
import { saveAudioFile, loadAudioFile } from '../../../../utils/audioStorage';

export const useAlarmSound = () => {
  // 사운드 관련 상태
  const [soundFile, setSoundFile] = useState('default');
  const [customSoundName, setCustomSoundName] = useState('');
  const [volume, setVolume] = useState(80);
  const [notificationType, setNotificationType] = useState('sound');
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // 파일 input ref
  const soundFileInputRef = useRef(null);

  // 저장된 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('alarmSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.volume !== undefined) setVolume(settings.volume);
        if (settings.notificationType) setNotificationType(settings.notificationType);
        if (settings.snoozeEnabled !== undefined) setSnoozeEnabled(settings.snoozeEnabled);
        if (settings.snoozeMinutes !== undefined) setSnoozeMinutes(settings.snoozeMinutes);

        // 커스텀 사운드 로드
        if (settings.soundFile === 'custom' && settings.customSoundName) {
          setCustomSoundName(settings.customSoundName);
          loadAudioFile(settings.customSoundName).then(audioData => {
            if (audioData) {
              setSoundFile(audioData);
            }
          });
        }
      } catch (error) {
        console.error('알람 설정 로드 실패:', error);
      }
    }
  }, []);

  // 설정 자동 저장
  useEffect(() => {
    const alarmSettings = {
      soundFile: soundFile === 'default' ? 'default' : 'custom',
      customSoundName,
      volume,
      notificationType,
      snoozeEnabled,
      snoozeMinutes,
    };
    localStorage.setItem('alarmSettings', JSON.stringify(alarmSettings));
  }, [soundFile, customSoundName, volume, notificationType, snoozeEnabled, snoozeMinutes]);

  // 사운드 파일 업로드 처리
  const handleSoundFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('audio/')) {
      setUploadError('오디오 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioData = e.target.result;
        setSoundFile(audioData);
        setCustomSoundName(file.name);

        // IndexedDB에 저장
        await saveAudioFile(file.name, audioData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('사운드 파일 업로드 실패:', error);
      setUploadError('사운드 파일 업로드에 실패했습니다.');
    }
  };

  // 사운드 미리듣기
  const handlePlaySound = () => {
    if (soundFile === 'default') {
      // 기본 사운드 재생 (브라우저 기본 알림음)
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE=';
      audio.volume = volume / 100;
      audio.play().catch(err => console.error('사운드 재생 실패:', err));
    } else {
      // 커스텀 사운드 재생
      const audio = new Audio(soundFile);
      audio.volume = volume / 100;
      audio.play().catch(err => console.error('사운드 재생 실패:', err));
    }
  };

  // 사운드 제거
  const handleRemoveSound = () => {
    setSoundFile('default');
    setCustomSoundName('');
    if (soundFileInputRef.current) {
      soundFileInputRef.current.value = '';
    }
  };

  return {
    // 상태
    soundFile,
    customSoundName,
    volume,
    notificationType,
    snoozeEnabled,
    snoozeMinutes,
    soundFileInputRef,
    uploadError,

    // Setters
    setSoundFile,
    setCustomSoundName,
    setVolume,
    setNotificationType,
    setSnoozeEnabled,
    setSnoozeMinutes,
    setUploadError,

    // 핸들러
    handleSoundFileChange,
    handlePlaySound,
    handleRemoveSound,
  };
};
