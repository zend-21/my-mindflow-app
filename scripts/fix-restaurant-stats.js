// scripts/fix-restaurant-stats.js
// 기존 공개 리뷰들의 업체 통계를 재계산하는 유틸리티 스크립트

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Firebase 설정 (firebase/config.js에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyA4ZYEV2BhkK1dkJeVNgOe_6WZ9Iyar-4w",
  authDomain: "mindflow-app-379c7.firebaseapp.com",
  projectId: "mindflow-app-379c7",
  storageBucket: "mindflow-app-379c7.firebasestorage.app",
  messagingSenderId: "638743849799",
  appId: "1:638743849799:web:52d4e4fc96c3af27aa0a11",
  measurementId: "G-B5LQ4CXWKT"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// updateRestaurantStats 함수 복사 (import 대신)
async function updateRestaurantStats(restaurantId) {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);

    // 업체 문서 존재 여부 확인
    const restaurantSnap = await getDoc(restaurantRef);

    // 공개된 리뷰만 조회
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId),
      where('isPublic', '==', true)
    );
    const reviewsSnap = await getDocs(reviewsQuery);

    // 통계 계산
    let totalRating = 0;
    let publicReviews = 0;
    let totalLikes = 0;
    let restaurantName = '';
    let restaurantAddress = '';
    let restaurantCategory = '';

    reviewsSnap.forEach((doc) => {
      const review = doc.data();
      publicReviews++;
      totalRating += review.rating || 0;
      totalLikes += review.likes || 0;

      if (!restaurantName && review.restaurantName) {
        restaurantName = review.restaurantName;
        restaurantAddress = review.restaurantAddress || '';
        restaurantCategory = review.category || '음식점';
      }
    });

    const avgRating = publicReviews > 0 ? totalRating / publicReviews : 0;

    const statsData = {
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: publicReviews,
      publicReviewCount: publicReviews,
      totalLikes,
      updatedAt: serverTimestamp()
    };

    // 업체 문서가 없으면 생성, 있으면 업데이트
    if (!restaurantSnap.exists()) {
      console.log(`⚠️ 업체 문서 없음. 새로 생성: ${restaurantId}`);

      await setDoc(restaurantRef, {
        ...statsData,
        name: restaurantName || '업체명 미상',
        address: restaurantAddress,
        category: restaurantCategory,
        kakaoPlaceId: restaurantId.replace('kakao_', ''),
        roadAddress: '',
        phone: '',
        latitude: 0,
        longitude: 0,
        placeUrl: '',
        createdAt: serverTimestamp()
      });
      console.log(`✅ 업체 문서 생성 완료: ${restaurantId}`);
    } else {
      await updateDoc(restaurantRef, statsData);
      console.log(`✅ 업체 통계 업데이트 완료: ${restaurantId} (공개 리뷰: ${publicReviews}개)`);
    }
  } catch (error) {
    console.error('업체 통계 업데이트 실패:', error);
    throw error;
  }
}

async function fixRestaurantStats() {
  try {
    console.log('🔧 업체 통계 재계산 시작...\n');

    // 모든 공개 리뷰 조회
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('isPublic', '==', true)
    );
    const reviewsSnap = await getDocs(reviewsQuery);

    console.log(`📊 공개 리뷰 총 ${reviewsSnap.size}개 발견\n`);

    // 업체 ID 수집 (중복 제거)
    const restaurantIds = new Set();
    reviewsSnap.forEach((doc) => {
      const review = doc.data();
      if (review.restaurantId) {
        restaurantIds.add(review.restaurantId);
      }
    });

    console.log(`🏪 업체 총 ${restaurantIds.size}개\n`);

    // 각 업체의 통계 재계산
    let successCount = 0;
    let errorCount = 0;

    for (const restaurantId of restaurantIds) {
      try {
        console.log(`처리 중: ${restaurantId}...`);
        await updateRestaurantStats(restaurantId);
        successCount++;
        console.log(`✅ 성공\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ 실패: ${error.message}\n`);
      }
    }

    console.log('\n=== 완료 ===');
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${errorCount}개`);
    console.log(`총: ${restaurantIds.size}개`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
fixRestaurantStats();
