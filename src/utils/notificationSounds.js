// 메시지 알림 효과음 생성 유틸리티 (Web Audio API 사용)

import { getCurrentUserData, setCurrentUserData } from './userStorage';

/**
 * AudioContext 싱글톤
 */
let audioContext = null;

const getAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // 모바일에서 AudioContext가 suspended 상태일 수 있음 - resume 필요
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('🔊 AudioContext resumed');
    } catch (error) {
      console.error('AudioContext resume 실패:', error);
    }
  }

  return audioContext;
};

/**
 * 효과음 1: 새 메시지 알림 (채팅창 밖에서)
 * 카카오톡 스타일의 부드러운 알림음
 */
export const playNewMessageNotification = async () => {
  try {
    if (!notificationSettings.enabled) return;

    const ctx = await getAudioContext();
    const currentTime = ctx.currentTime;

    // 메인 톤 (두 개의 주파수로 화음 생성)
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 주파수 설정 (C6 + E6 화음)
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(1046.5, currentTime); // C6

    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1318.5, currentTime); // E6

    // 볼륨 설정 (부드러운 페이드 인/아웃) - 사용자 설정 음량 적용
    const maxVolume = 0.3 * notificationSettings.volume;
    const minVolume = 0.01 * notificationSettings.volume;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(maxVolume, currentTime + 0.05); // 페이드 인
    gainNode.gain.exponentialRampToValueAtTime(Math.max(minVolume, 0.001), currentTime + 0.5); // 페이드 아웃

    // 연결
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 재생
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator1.stop(currentTime + 0.5);
    oscillator2.stop(currentTime + 0.5);

    console.log('🔔 새 메시지 알림음 재생 (음량:', Math.round(notificationSettings.volume * 100) + '%)');
  } catch (error) {
    console.error('알림음 재생 오류:', error);
  }
};

/**
 * 효과음 2: 채팅 중 메시지 수신 (채팅창 안에서)
 * 매우 부드러운 팝 사운드
 */
export const playChatMessageSound = async () => {
  try {
    if (!notificationSettings.enabled) return;

    const ctx = await getAudioContext();
    const currentTime = ctx.currentTime;

    // 짧고 부드러운 펄스 사운드
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 주파수 설정 (높은 톤으로 짧게)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, currentTime + 0.1);

    // 볼륨 설정 (매우 짧고 조용하게) - 사용자 설정 음량 적용
    const maxVolume = 0.15 * notificationSettings.volume;
    const minVolume = 0.01 * notificationSettings.volume;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(maxVolume, currentTime + 0.01); // 빠른 페이드 인
    gainNode.gain.exponentialRampToValueAtTime(Math.max(minVolume, 0.001), currentTime + 0.15); // 빠른 페이드 아웃

    // 연결
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 재생
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.15);

    console.log('💬 채팅 메시지 수신음 재생 (음량:', Math.round(notificationSettings.volume * 100) + '%)');
  } catch (error) {
    console.error('메시지 수신음 재생 오류:', error);
  }
};

/**
 * 효과음 3: 부드러운 버블 팝 (대안)
 * 더 귀여운 느낌의 효과음
 */
export const playBubblePopSound = async () => {
  try {
    if (!notificationSettings.enabled) return;

    const ctx = await getAudioContext();
    const currentTime = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 버블 팝 효과 (주파수 상승 후 하락)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, currentTime);
    oscillator.frequency.linearRampToValueAtTime(1200, currentTime + 0.05);
    oscillator.frequency.linearRampToValueAtTime(300, currentTime + 0.1);

    // 볼륨 (짧고 귀엽게) - 사용자 설정 음량 적용
    const maxVolume = 0.2 * notificationSettings.volume;
    const minVolume = 0.01 * notificationSettings.volume;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(maxVolume, currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(minVolume, 0.001), currentTime + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.12);

    console.log('🫧 버블 팝 사운드 재생 (음량:', Math.round(notificationSettings.volume * 100) + '%)');
  } catch (error) {
    console.error('버블 팝 사운드 재생 오류:', error);
  }
};

/**
 * 알림음 설정 관리
 */
export const notificationSettings = {
  enabled: true,
  volume: 0.1,
};

/**
 * 알림음 활성화/비활성화
 */
export const toggleNotificationSound = (enabled) => {
  notificationSettings.enabled = enabled;
  setCurrentUserData('notificationSoundEnabled', enabled ? 'true' : 'false');
};

/**
 * 알림음 볼륨 설정
 */
export const setNotificationVolume = (volume) => {
  notificationSettings.volume = Math.max(0, Math.min(1, volume));
  setCurrentUserData('notificationVolume', notificationSettings.volume.toString());
};

/**
 * 저장된 설정 불러오기
 */
export const loadNotificationSettings = () => {
  const enabled = getCurrentUserData('notificationSoundEnabled');
  const volume = getCurrentUserData('notificationVolume');

  if (enabled !== null) {
    notificationSettings.enabled = enabled === 'true';
  }

  if (volume !== null) {
    notificationSettings.volume = parseFloat(volume);
  }
};

// 초기 설정 로드
loadNotificationSettings();
