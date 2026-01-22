import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { initializeAudioContext } from './utils/notificationSounds';

/**
 * ============================================================
 * 상태바/네비게이션바 색상 설정
 * ============================================================
 * - 상태바 배경색: #2a2d34 (헤더 상단과 동일)
 * - 네비게이션바 배경색: #202126 (푸터와 동일)
 * - 아이콘/텍스트: #ffffff (흰색)
 * - 네비게이션 버튼: #ffffff (흰색)
 *
 * ⚠️ 사용자의 지시를 받기 전 변경 불가
 * ============================================================
 */
if (Capacitor.isNativePlatform()) {
  // 상태바 설정
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setBackgroundColor({ color: '#2a2d34' });
  StatusBar.setStyle({ style: Style.Dark }); // Dark = 흰색 아이콘

  // 네비게이션바 설정 (하단 3버튼)
  NavigationBar.setColor({ color: '#202126', darkButtons: false }); // darkButtons: false = 흰색 버튼
}

// 🎵 알림음 시스템 미리 초기화 (앱 시작 시)
// 채팅 알림음이 언제든 백그라운드에서도 재생될 수 있도록 준비
initializeAudioContext();

// 1. .env.local 파일에서 클라이언트 ID를 안전하게 불러옵니다.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// 2. root를 한 번만 생성합니다.
const root = ReactDOM.createRoot(document.getElementById('root')!);

// 3. 페이지 로드 시 고유한 키 생성 (로그아웃 후 완전 리셋을 위해)
const providerKey = `google-oauth-${Date.now()}`;

// 4. 생성한 root를 사용하여 앱을 렌더링합니다.
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} key={providerKey}>
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);