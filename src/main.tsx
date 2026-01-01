import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';

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