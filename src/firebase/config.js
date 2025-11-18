// Firebase 설정
// TODO: Firebase Console에서 프로젝트 생성 후 아래 설정값을 입력하세요
// https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 환경변수가 설정되지 않은 경우 null 반환
let app = null;
let db = null;
let storage = null;
let auth = null;

// Firebase 설정이 완료된 경우에만 초기화
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log('✅ Firebase 초기화 완료');
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
  }
} else {
  console.warn('⚠️ Firebase 설정이 없습니다. .env 파일을 확인하세요.');
}

export { db, storage, auth };
export default app;
