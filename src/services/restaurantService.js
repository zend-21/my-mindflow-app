// src/services/restaurantService.js
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';

const RESTAURANTS_COLLECTION = 'restaurants';

/**
 * 업체 정보를 저장하거나 업데이트
 * @param {Object} restaurantData - 카카오맵에서 받은 업체 정보
 * @returns {Promise<string>} 저장된 업체 ID
 */
export const saveRestaurant = async (restaurantData) => {
  try {
    const {
      id,
      name,
      address,
      roadAddress,
      phone,
      category,
      latitude,
      longitude,
      placeUrl
    } = restaurantData;

    // 카카오 장소 ID를 문서 ID로 사용
    const restaurantId = `kakao_${id}`;
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);

    // 기존 업체 확인
    const restaurantSnap = await getDoc(restaurantRef);

    if (restaurantSnap.exists()) {
      // 이미 존재하면 기본 정보만 업데이트 (통계는 유지)
      await updateDoc(restaurantRef, {
        name,
        address,
        roadAddress,
        phone,
        category,
        latitude,
        longitude,
        placeUrl,
        updatedAt: serverTimestamp()
      });
    } else {
      // 새 업체 등록
      await setDoc(restaurantRef, {
        kakaoPlaceId: id,
        name,
        address,
        roadAddress: roadAddress || '',
        phone: phone || '',
        category: category || '음식점',
        latitude,
        longitude,
        placeUrl: placeUrl || '',

        // 초기 통계
        avgRating: 0,
        reviewCount: 0,
        publicReviewCount: 0,
        totalLikes: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return restaurantId;
  } catch (error) {
    console.error('업체 저장 실패:', error);
    throw error;
  }
};

/**
 * 업체 정보 조회
 * @param {string} restaurantId - 업체 ID (kakao_12345 형식)
 * @returns {Promise<Object>} 업체 정보
 */
export const getRestaurant = async (restaurantId) => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);

    if (restaurantSnap.exists()) {
      return {
        id: restaurantSnap.id,
        ...restaurantSnap.data()
      };
    } else {
      throw new Error('업체를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('업체 조회 실패:', error);
    throw error;
  }
};

/**
 * 업체의 리뷰 통계 업데이트 (공개 리뷰만)
 * @param {string} restaurantId - 업체 ID
 */
export const updateRestaurantStats = async (restaurantId) => {
  try {
    const restaurantRef = doc(db, RESTAURANTS_COLLECTION, restaurantId);

    // 🆕 업체 문서 존재 여부 확인
    const restaurantSnap = await getDoc(restaurantRef);

    // 🆕 공개된 리뷰만 조회
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId),
      where('isPublic', '==', true)  // 공개 리뷰만
    );
    const reviewsSnap = await getDocs(reviewsQuery);

    // 통계 계산 (공개 리뷰 기준)
    let totalRating = 0;
    let publicReviews = 0;
    let totalLikes = 0;
    let restaurantName = '';
    let restaurantAddress = '';
    let restaurantCategory = '';

    // 리뷰에서 업체 정보 추출 (첫 번째 리뷰 기준)
    reviewsSnap.forEach((doc) => {
      const review = doc.data();
      publicReviews++;
      totalRating += review.rating || 0;
      totalLikes += review.likes || 0;

      // 업체 정보 (첫 리뷰에서 가져오기)
      if (!restaurantName && review.restaurantName) {
        restaurantName = review.restaurantName;
        restaurantAddress = review.restaurantAddress || '';
        restaurantCategory = review.category || '음식점';
      }
    });

    const avgRating = publicReviews > 0 ? totalRating / publicReviews : 0;

    const statsData = {
      avgRating: Math.round(avgRating * 10) / 10, // 소수점 1자리
      reviewCount: publicReviews,  // 🆕 공개 리뷰 수만
      publicReviewCount: publicReviews,  // reviewCount와 동일 (하위 호환성)
      totalLikes,
      updatedAt: serverTimestamp()
    };

    // 🆕 업체 문서가 없으면 생성, 있으면 업데이트
    if (!restaurantSnap.exists()) {
      console.log(`⚠️ 업체 문서 없음. 새로 생성: ${restaurantId}`);

      // 업체 문서 새로 생성 (리뷰 정보 기반)
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
      // 기존 업체 문서 업데이트
      await updateDoc(restaurantRef, statsData);
      console.log(`✅ 업체 통계 업데이트 완료: ${restaurantId} (공개 리뷰: ${publicReviews}개)`);
    }
  } catch (error) {
    console.error('업체 통계 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 인기 업체 목록 조회 (리뷰 수 또는 평점 기준)
 * @param {string} sortBy - 'reviewCount' | 'avgRating' | 'totalLikes'
 * @param {number} limitCount - 가져올 개수
 * @returns {Promise<Array>} 업체 목록
 */
export const getPopularRestaurants = async (sortBy = 'reviewCount', limitCount = 20) => {
  try {
    const restaurantsQuery = query(
      collection(db, RESTAURANTS_COLLECTION),
      orderBy(sortBy, 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(restaurantsQuery);
    const restaurants = [];

    snapshot.forEach((doc) => {
      restaurants.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return restaurants;
  } catch (error) {
    console.error('인기 업체 조회 실패:', error);
    throw error;
  }
};

/**
 * 업체 검색 (이름 기준)
 * @param {string} searchTerm - 검색어
 * @returns {Promise<Array>} 검색 결과
 */
export const searchRestaurants = async (searchTerm) => {
  try {
    // Firestore는 부분 검색을 지원하지 않으므로,
    // 클라이언트에서 필터링하거나 Algolia 같은 서비스 사용 권장
    // 임시로 모든 업체를 가져온 후 필터링
    const restaurantsQuery = query(
      collection(db, RESTAURANTS_COLLECTION),
      orderBy('name')
    );

    const snapshot = await getDocs(restaurantsQuery);
    const restaurants = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.includes(searchTerm)) {
        restaurants.push({
          id: doc.id,
          ...data
        });
      }
    });

    return restaurants;
  } catch (error) {
    console.error('업체 검색 실패:', error);
    throw error;
  }
};

/**
 * 특정 카테고리의 업체 목록 조회
 * @param {string} category - 카테고리 (예: "음식점 > 일식")
 * @param {number} limitCount - 가져올 개수
 * @returns {Promise<Array>} 업체 목록
 */
export const getRestaurantsByCategory = async (category, limitCount = 20) => {
  try {
    const restaurantsQuery = query(
      collection(db, RESTAURANTS_COLLECTION),
      where('category', '>=', category),
      where('category', '<=', category + '\uf8ff'),
      orderBy('category'),
      orderBy('reviewCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(restaurantsQuery);
    const restaurants = [];

    snapshot.forEach((doc) => {
      restaurants.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return restaurants;
  } catch (error) {
    console.error('카테고리별 업체 조회 실패:', error);
    throw error;
  }
};
