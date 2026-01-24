import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ============================================================================
 * 🚨 중요: Android 상태바/네비게이션바 겹침 문제 해결 방법
 * ============================================================================
 *
 * 문제:
 * - Android 15+에서 앱 콘텐츠가 상태바(시계, 배터리)와 네비게이션바(홈, 뒤로가기)와 겹침
 * - 헤더가 잘리거나 하단 버튼이 네비게이션바에 가려지는 현상
 *
 * 원인:
 * 1. Android 15(API 35)부터 edge-to-edge 모드가 강제 적용됨
 * 2. Chromium WebView 버그로 CSS env(safe-area-inset-*) 변수가 작동하지 않음
 * 3. 기존 해결책들(fitsSystemWindows, windowOptOutEdgeToEdgeEnforcement 등)이
 *    WebView 환경에서 제대로 동작하지 않음
 *
 * 해결책:
 * - android.adjustMarginsForEdgeToEdge: 'force' 설정 사용
 * - 이것은 Capacitor 공식 설정으로, 모든 Android 버전에서 안전 영역을 올바르게 처리함
 * - GitHub Issue #8093 참고: https://github.com/ionic-team/capacitor/issues/8093
 *
 * 시도했지만 실패한 방법들 (참고용):
 * - CSS padding: env(safe-area-inset-*) → Chromium WebView 버그로 작동 안함
 * - styles.xml에 fitsSystemWindows: true → WebView에서 효과 없음
 * - windowOptOutEdgeToEdgeEnforcement: true → 부분적으로만 작동
 * - @capacitor-community/safe-area 플러그인 → 효과 없음
 * - MainActivity.java에서 WindowCompat 설정 → 단독으로는 불충분
 *
 * ============================================================================
 */

const config: CapacitorConfig = {
  appId: 'com.mindflow.app',
  appName: 'ShareNote',
  webDir: 'dist',

  android: {
    backgroundColor: '#1f2229',
    allowMixedContent: true,
    webContentsDebuggingEnabled: true  // Chrome inspect 디버깅 활성화
  },

  server: {
    androidScheme: 'https'
  },

  plugins: {
    /**
     * SystemBars 플러그인 설정 (Capacitor 8 화면 겹침 방지)
     * - insetsHandling: 'disable'로 설정하여 @capacitor-community/safe-area 플러그인이 처리하도록 함
     */
    SystemBars: {
      insetsHandling: 'disable'
    },

    /**
     * StatusBar 플러그인 설정
     * - @capacitor/status-bar 패키지 필요
     * - main.tsx에서 런타임 설정도 함께 적용됨
     *
     * ============================================================
     * 상태바 색상 설정
     * ============================================================
     * - 상태바 배경색: #2a2d34 (헤더 상단과 동일)
     * - 아이콘/텍스트: #ffffff (흰색)
     *
     * ⚠️ 사용자의 지시를 받기 전 변경 불가
     * ============================================================
     */
    StatusBar: {
      overlaysWebView: false,  // 상태바가 WebView 위에 겹치지 않도록
      backgroundColor: '#2a2d34',  // 헤더 상단과 동일한 색상
      style: 'DARK'  // 밝은 아이콘 (어두운 배경용)
    },

    PushNotifications: {
      // 포그라운드에서도 알림 표시 및 소리 재생
      // 백그라운드는 MyFirebaseMessagingService가 전담 처리
      presentationOptions: ['badge', 'alert', 'sound']
    },

    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#4a90e2',
      sound: 'notification.wav'
    },

    /**
     * Badge 플러그인 설정 (커스텀 플러그인)
     * - android/app/src/main/java/com/mindflow/app/BadgePlugin.java
     * - ShortcutBadger 라이브러리 사용
     * - 앱 아이콘에 배지 숫자 표시
     */
    Badge: {
      // 커스텀 플러그인이므로 별도 설정 없음
    },

    /**
     * ScheduleAlarm 플러그인 설정 (커스텀 플러그인)
     * - android/app/src/main/java/com/mindflow/app/ScheduleAlarmPlugin.java
     * - Android AlarmManager 직접 사용
     * - 앱 종료 후에도 백그라운드 알람 작동
     */
    ScheduleAlarm: {
      // 커스텀 플러그인이므로 별도 설정 없음
    },

    /**
     * Google Auth 플러그인 설정
     * - @codetrix-studio/capacitor-google-auth 패키지 필요
     * - Android: strings.xml에 server_client_id 설정 필요
     * - 네이티브 앱에서 Google 로그인 지원
     */
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
      androidClientId: process.env.VITE_GOOGLE_CLIENT_ID,
      forceCodeForRefreshToken: false  // 로그아웃 시 서버 통신 문제 방지
    }
  }
};

export default config;
