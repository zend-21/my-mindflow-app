// src/scripts/setAdminRank.js
// 특정 사용자에게 관리자 권한을 부여하는 스크립트

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase 설정 (config.js에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyBIQ9WRgKBMDz-BNRwxZVRNIrqLQz3tK4Q",
  authDomain: "my-mindflow.firebaseapp.com",
  projectId: "my-mindflow",
  storageBucket: "my-mindflow.firebasestorage.app",
  messagingSenderId: "452834127649",
  appId: "1:452834127649:web:f1f64f46f8bcd40330a79e",
  measurementId: "G-HQ7BTCRFY3"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 사용자에게 관리자 권한 부여
 */
async function setAdminRank() {
  const userId = 'temp_user_id'; // 현재 사용자 ID (나중에 실제 인증 시스템으로 교체 필요)

  try {
    const userRef = doc(db, 'users', userId);

    await setDoc(userRef, {
      rank: 'admin',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      reviewCount: 0,
      publicReviewCount: 0
    }, { merge: true }); // merge 옵션으로 기존 데이터 유지

    console.log('✅ 관리자 권한이 성공적으로 부여되었습니다!');
    console.log('사용자 ID:', userId);
    console.log('계급: 관리자 (admin)');
  } catch (error) {
    console.error('❌ 관리자 권한 부여 실패:', error);
  }
}

// 스크립트 실행
setAdminRank();
