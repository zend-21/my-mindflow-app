// src/utils/badgeUtils.js
// 앱 아이콘 배지 관리 유틸리티

import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// Badge 플러그인 인터페이스 정의
const Badge = registerPlugin('Badge');

/**
 * 앱 아이콘 배지 숫자 설정
 * @param {number} count - 배지에 표시할 숫자
 */
export const setBadgeCount = async (count) => {
  // 네이티브 플랫폼에서만 실행
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 웹 환경 - 배지 설정 스킵');
    return;
  }

  console.log(`🔔 setBadgeCount 호출됨: ${count}`, {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    badgePlugin: Badge
  });

  try {
    if (count > 0) {
      console.log(`📍 Badge.set 호출 시작: ${count}`);
      const result = await Badge.set({ count });
      console.log(`✅ 앱 배지 설정 성공: ${count}`, result);
    } else {
      console.log('📍 Badge.clear 호출 시작');
      const result = await Badge.clear();
      console.log('✅ 앱 배지 제거 성공', result);

      // ⚠️ 중요: 알림바의 알림도 모두 제거 (시스템이 배지를 다시 살리지 못하도록)
      try {
        await PushNotifications.removeAllDeliveredNotifications();
        console.log('✅ 알림바 알림 모두 제거 완료');
      } catch (notifError) {
        console.warn('⚠️ 알림 제거 실패 (무시 가능):', notifError);
      }
    }
  } catch (error) {
    console.error('❌ 배지 설정 실패:', error);
    console.error('❌ 배지 에러 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
};

/**
 * 앱 아이콘 배지 제거
 */
export const clearBadge = async () => {
  await setBadgeCount(0);
};
