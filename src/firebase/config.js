// ═══════════════════════════════════════════════════════════════════════════
// 📦 이미지/동영상 스토리지 마이그레이션 계획 (CRITICAL - 반드시 읽어볼 것!)
// ═══════════════════════════════════════════════════════════════════════════
//
// ✅ 현재 (0~500명): Firebase Storage 사용
//    - 초기 구축이 빠르고 Firebase 생태계와 완벽하게 통합됨
//    - 소규모에서는 비용 부담 없음 (월 1~2만원 수준)
//
// 🚀 사용자 500명 돌파 시: Cloudflare R2로 마이그레이션 필수!
//    - 예상 비용 절감: 500명 기준 월 ~1.5만원 / 10만명 기준 월 ~160만원 절감
//    - Egress(다운로드) 비용 완전 무료 - 이게 핵심!
//    - 채팅 미디어는 조회 빈도가 높아 Egress 비용 폭증 (Firebase Storage 치명적)
//    - 10만명 규모에서 R2는 월 ~3.8만원 vs Firebase Storage ~165만원
//    - S3 API 호환으로 마이그레이션 쉬움
//    - 500명 시점 마이그레이션 권장 이유: 데이터 적어서 이전 쉬움 (10GB vs 200GB@1만명)
//
// 📌 마이그레이션 체크리스트:
//    1. Cloudflare 계정 생성 및 R2 버킷 생성 (https://dash.cloudflare.com/)
//    2. .env에 R2 환경변수 추가 (아래 주석 참고)
//    3. 기존 Firebase Storage 이미지들을 R2로 복사 (rclone 또는 스크립트 사용)
//    4. 업로드 로직을 Firebase Storage에서 R2 SDK로 변경
//    5. 기존 URL들을 R2 URL로 점진적 마이그레이션 (DB 업데이트)
//
// ═══════════════════════════════════════════════════════════════════════════

// Firebase 설정
// TODO: Firebase Console에서 프로젝트 생성 후 아래 설정값을 입력하세요
// https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase 환경변수가 설정되지 않은 경우 null 반환
let app = null;
let db = null;
let storage = null;
let auth = null;
let analytics = null;

// Firebase 설정이 완료된 경우에만 초기화
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);

    // Analytics 초기화 (브라우저 환경에서만)
    // ⚠️ 임시로 비활성화 - API 키 검증 후 재활성화 필요
    // if (typeof window !== 'undefined') {
    //   try {
    //     analytics = getAnalytics(app);

    //     // 개발 환경에서 Debug Mode 활성화 (DebugView에서 실시간 확인 가능)
    //     if (import.meta.env.DEV) {
    //       window['ga-disable-' + firebaseConfig.measurementId] = false;
    //       console.log('🐛 Firebase Analytics Debug Mode 활성화');
    //     }

    //     console.log('✅ Firebase Analytics 초기화 완료');
    //   } catch (error) {
    //     console.warn('⚠️ Firebase Analytics 초기화 실패 (무시됨):', error);
    //   }
    // }

    console.log('✅ Firebase 초기화 완료 (Analytics 비활성화됨)');
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
  }
} else {
  console.warn('⚠️ Firebase 설정이 없습니다. .env 파일을 확인하세요.');
}

export { db, storage, auth, analytics };
export default app;
