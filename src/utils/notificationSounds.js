// 메시지 알림 효과음 생성 유틸리티 (Web Audio API 사용)

import { getCurrentUserData, setCurrentUserData } from './userStorage';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// NotificationSettings 플러그인 인터페이스
const NotificationSettingsPlugin = registerPlugin('NotificationSettings');

/**
 * Firestore에 알림 설정 저장 (FCM Functions에서 사용)
 */
const saveNotificationSettingsToFirestore = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('⚠️ 로그인되지 않음 - Firestore 저장 스킵');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      notificationEnabled: notificationSettings.enabled,
      notificationSoundEnabled: notificationSettings.soundEnabled,
      notificationVibrationEnabled: notificationSettings.vibrationEnabled,
      notificationVolume: notificationSettings.volume,
    }, { merge: true });

    console.log('✅ Firestore에 알림 설정 저장 완료');
  } catch (error) {
    console.error('❌ Firestore 알림 설정 저장 실패:', error);
  }
};

/**
 * AudioContext 싱글톤
 */
let audioContext = null;

let audioContextInitialized = false;

const getAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 백그라운드에서도 AudioContext가 계속 작동하도록 visibilitychange 이벤트 처리
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && audioContext && audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          console.log('🔊 AudioContext resumed (포그라운드 복귀)');
        } catch (error) {
          console.error('AudioContext resume 실패:', error);
        }
      }
    });

    // 🔥 APK 환경에서 AudioContext 자동 활성화 (사용자 제스처 필요 없음)
    if (!audioContextInitialized) {
      try {
        // 무음 오디오 재생으로 AudioContext 깨우기
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.001; // 거의 들리지 않는 볼륨
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.001);
        audioContextInitialized = true;
        console.log('✅ AudioContext 초기화 완료');
      } catch (error) {
        console.warn('⚠️ AudioContext 초기화 실패:', error);
      }
    }
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
    console.log('🔔 [playNewMessageNotification] 호출됨 - 설정:', {
      enabled: notificationSettings.enabled,
      soundEnabled: notificationSettings.soundEnabled,
      volume: notificationSettings.volume,
      pageHidden: document.hidden
    });

    // 🚫 백그라운드에서는 재생 안 함 (FCM이 처리)
    if (document.hidden) {
      console.log('⏭️ [playNewMessageNotification] 백그라운드 상태 - 재생 안 함 (FCM이 처리)');
      return;
    }

    if (!notificationSettings.enabled || !notificationSettings.soundEnabled) {
      console.log('⚠️ [playNewMessageNotification] 알림 또는 소리가 비활성화되어 재생 안 함');
      return;
    }

    const ctx = await getAudioContext();
    console.log('🎵 [playNewMessageNotification] AudioContext 상태:', ctx.state);
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
    // 🔉 메시지 알림음 음량 감소 (0.3 → 0.18로 40% 감소)
    const maxVolume = 0.18 * notificationSettings.volume;
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
 * @param {number|null} customVolume - 개별 음량 (0-100, null이면 전체설정 사용)
 */
export const playChatMessageSound = async (customVolume = null) => {
  try {
    console.log('💬 [playChatMessageSound] 호출됨 - customVolume:', customVolume, '전체설정:', {
      enabled: notificationSettings.enabled,
      soundEnabled: notificationSettings.soundEnabled,
      volume: notificationSettings.volume
    });

    // 🔇 알림 또는 소리가 비활성화되어 있으면 재생 안 함
    if (!notificationSettings.enabled || !notificationSettings.soundEnabled) {
      console.log('⚠️ [playChatMessageSound] 알림 또는 소리가 비활성화되어 재생 안 함');
      return;
    }

    // 🔇 개별 음량이 0이면 재생 안 함
    if (customVolume === 0) {
      console.log('⚠️ [playChatMessageSound] 개별 음량 0 - 재생 안 함');
      return;
    }

    const ctx = await getAudioContext();
    console.log('🎵 [playChatMessageSound] AudioContext 상태:', ctx.state);
    const currentTime = ctx.currentTime;

    // 짧고 부드러운 펄스 사운드
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 주파수 설정 (높은 톤으로 짧게)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, currentTime + 0.1);

    // 볼륨 설정 (매우 짧고 조용하게) - 개별 음량 또는 전체설정 음량 적용
    const volumeToUse = customVolume !== null ? (customVolume / 100) : notificationSettings.volume;
    const maxVolume = 0.15 * volumeToUse;
    const minVolume = 0.01 * volumeToUse;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(maxVolume, currentTime + 0.01); // 빠른 페이드 인
    gainNode.gain.exponentialRampToValueAtTime(Math.max(minVolume, 0.001), currentTime + 0.15); // 빠른 페이드 아웃

    // 연결
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 재생
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.15);

    console.log('💬 채팅 메시지 수신음 재생 (음량:', Math.round(volumeToUse * 100) + '%)');
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
  enabled: true, // 전체 알림 ON/OFF (알림음 & 진동)
  soundEnabled: true, // 소리 ON/OFF
  vibrationEnabled: true, // 진동 ON/OFF
  volume: 0.5, // 기본 볼륨 50% (0.1은 너무 작음)
};

/**
 * 현재 알림 설정 가져오기 (항상 최신 값 반환)
 * localStorage에서 직접 읽어서 최신 상태 보장
 */
export const getNotificationSettings = () => {
  // localStorage에서 최신 값 읽기
  const enabled = getCurrentUserData('notificationEnabled');
  const soundEnabled = getCurrentUserData('notificationSoundEnabled');
  const vibrationEnabled = getCurrentUserData('notificationVibrationEnabled');
  const volume = getCurrentUserData('notificationVolume');

  // 값이 있으면 사용, 없으면 메모리 기본값 사용
  return {
    enabled: enabled !== null ? enabled === 'true' : notificationSettings.enabled,
    soundEnabled: soundEnabled !== null ? soundEnabled === 'true' : notificationSettings.soundEnabled,
    vibrationEnabled: vibrationEnabled !== null ? vibrationEnabled === 'true' : notificationSettings.vibrationEnabled,
    volume: volume !== null ? parseFloat(volume) : notificationSettings.volume,
  };
};

/**
 * 전체 알림 활성화/비활성화 (알림음 & 진동 토글)
 */
export const toggleNotification = async (enabled) => {
  notificationSettings.enabled = enabled;
  setCurrentUserData('notificationEnabled', enabled ? 'true' : 'false');

  // Firestore에 저장 (FCM Functions에서 채널 선택에 사용)
  await saveNotificationSettingsToFirestore();
};

/**
 * 알림음만 활성화/비활성화
 */
export const toggleNotificationSound = async (enabled) => {
  notificationSettings.soundEnabled = enabled;
  setCurrentUserData('notificationSoundEnabled', enabled ? 'true' : 'false');

  // 네이티브 플랫폼에서는 SharedPreferences에도 저장
  if (Capacitor.isNativePlatform()) {
    try {
      await NotificationSettingsPlugin.setSoundEnabled({ enabled });
      console.log('✅ 네이티브 알림음 설정 저장:', enabled);
    } catch (error) {
      console.error('❌ 네이티브 알림음 설정 저장 실패:', error);
    }
  }

  // Firestore에도 저장 (FCM Functions에서 채널 선택에 사용)
  await saveNotificationSettingsToFirestore();
};

/**
 * 진동만 활성화/비활성화
 */
export const toggleNotificationVibration = async (enabled) => {
  notificationSettings.vibrationEnabled = enabled;
  setCurrentUserData('notificationVibrationEnabled', enabled ? 'true' : 'false');

  // Firestore에 저장 (FCM Functions에서 채널 선택에 사용)
  await saveNotificationSettingsToFirestore();
};

/**
 * 알림음 볼륨 설정
 */
export const setNotificationVolume = async (volume) => {
  notificationSettings.volume = Math.max(0, Math.min(1, volume));
  setCurrentUserData('notificationVolume', notificationSettings.volume.toString());

  // 네이티브 플랫폼에서는 SharedPreferences에도 저장
  if (Capacitor.isNativePlatform()) {
    try {
      await NotificationSettingsPlugin.setVolume({ volume: notificationSettings.volume });
      console.log('✅ 네이티브 알림음 볼륨 저장:', notificationSettings.volume);
    } catch (error) {
      console.error('❌ 네이티브 알림음 볼륨 저장 실패:', error);
    }
  }

  // Firestore에도 저장 (FCM Functions에서 채널 선택에 사용)
  await saveNotificationSettingsToFirestore();
};

/**
 * 저장된 설정 불러오기
 */
export const loadNotificationSettings = () => {
  const enabled = getCurrentUserData('notificationEnabled');
  const soundEnabled = getCurrentUserData('notificationSoundEnabled');
  const vibrationEnabled = getCurrentUserData('notificationVibrationEnabled');
  const volume = getCurrentUserData('notificationVolume');

  if (enabled !== null) {
    notificationSettings.enabled = enabled === 'true';
  }

  if (soundEnabled !== null) {
    notificationSettings.soundEnabled = soundEnabled === 'true';
  }

  if (vibrationEnabled !== null) {
    notificationSettings.vibrationEnabled = vibrationEnabled === 'true';
  }

  if (volume !== null) {
    notificationSettings.volume = parseFloat(volume);
  }

  console.log('⚙️ [loadNotificationSettings] 알림 설정 로드 완료:', {
    enabled: notificationSettings.enabled,
    soundEnabled: notificationSettings.soundEnabled,
    vibrationEnabled: notificationSettings.vibrationEnabled,
    volume: notificationSettings.volume
  });
};

// 초기 설정 로드
loadNotificationSettings();

// 🔧 초기 사용자: localStorage에 설정이 없으면 기본값으로 초기화
const hasStoredSettings = getCurrentUserData('notificationEnabled') !== null;
if (!hasStoredSettings) {
  console.log('ℹ️ 첫 사용자 - 알림 설정 기본값으로 초기화');
  notificationSettings.enabled = true;
  notificationSettings.soundEnabled = true;
  notificationSettings.vibrationEnabled = true;
  notificationSettings.volume = 0.3;

  // localStorage에 저장
  setCurrentUserData('notificationEnabled', 'true');
  setCurrentUserData('notificationSoundEnabled', 'true');
  setCurrentUserData('notificationVibrationEnabled', 'true');
  setCurrentUserData('notificationVolume', '0.3');

  console.log('✅ 알림 설정 기본값 저장 완료');
}

/**
 * AudioContext 미리 초기화 (앱 시작 시 호출)
 * 채팅 알림음이 언제든 재생될 수 있도록 준비
 */
export const initializeAudioContext = async () => {
  try {
    await getAudioContext();
    console.log('🎵 알림음 시스템 초기화 완료 (앱 시작 시)');
  } catch (error) {
    console.warn('⚠️ 알림음 시스템 초기화 실패:', error);
  }
};
