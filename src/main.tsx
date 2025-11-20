import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 1. .env.local 파일에서 클라이언트 ID를 안전하게 불러옵니다.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// 2. root를 한 번만 생성합니다.
const root = ReactDOM.createRoot(document.getElementById('root')!);

// 3. 생성한 root를 사용하여 앱을 렌더링합니다.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);