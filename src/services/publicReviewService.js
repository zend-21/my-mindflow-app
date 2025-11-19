// src/services/publicReviewService.js
// 공개 리뷰 관련 서비스 (커뮤니티 기능)

import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  limit
} from 'firebase/firestore';

const REVIEWS_COLLECTION = 'reviews';

/**
 * 특정 가게의 공개 리뷰 통계 조회
 * @param {string} restaurantId - 카카오 장소 ID
 * @returns {Promise<Object>} { reviewCount, averageRating }
 */
export const getRestaurantReviewStats = async (restaurantId) => {
  if (!restaurantId) {
    return { reviewCount: 0, averageRating: 0 };
  }

  try {
    // 공개 리뷰만 조회
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('isPublic', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { reviewCount: 0, averageRating: 0 };
    }

    let totalRating = 0;
    let reviewCount = 0;

    snapshot.forEach((doc) => {
      const review = doc.data();
      totalRating += review.rating || 0;
      reviewCount++;
    });

    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    return {
      reviewCount,
      averageRating: parseFloat(averageRating.toFixed(2))
    };
  } catch (error) {
    console.error('리뷰 통계 조회 실패:', error);
    return { reviewCount: 0, averageRating: 0 };
  }
};

/**
 * 여러 가게의 리뷰 통계를 한 번에 조회 (병렬 처리)
 * @param {Array<string>} restaurantIds - 카카오 장소 ID 배열
 * @returns {Promise<Map>} restaurantId -> { reviewCount, averageRating }
 */
export const getBulkRestaurantReviewStats = async (restaurantIds) => {
  if (!restaurantIds || restaurantIds.length === 0) {
    return new Map();
  }

  try {
    // 병렬로 모든 가게의 통계 조회
    const statsPromises = restaurantIds.map(async (restaurantId) => {
      const stats = await getRestaurantReviewStats(restaurantId);
      return [restaurantId, stats];
    });

    const statsArray = await Promise.all(statsPromises);

    // Map 형태로 변환
    return new Map(statsArray);
  } catch (error) {
    console.error('대량 리뷰 통계 조회 실패:', error);
    return new Map();
  }
};

/**
 * 특정 가게의 공개 리뷰 목록 조회
 * @param {string} restaurantId - 카카오 장소 ID
 * @param {Object} options - { limit, sortBy }
 * @returns {Promise<Array>} 공개 리뷰 배열
 */
export const getPublicReviewsByRestaurant = async (restaurantId, options = {}) => {
  if (!restaurantId) {
    return [];
  }

  try {
    const { limitCount = 10, sortBy = 'createdAt' } = options;

    let q = query(
      collection(db, REVIEWS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('isPublic', '==', true),
      orderBy(sortBy, 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    const reviews = [];
    snapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    return reviews;
  } catch (error) {
    console.error('공개 리뷰 목록 조회 실패:', error);
    return [];
  }
};

/**
 * 카카오 검색 결과에 리뷰 정보 병합
 * @param {Array} kakaoPlaces - 카카오 API 검색 결과
 * @returns {Promise<Array>} 리뷰 정보가 추가된 검색 결과
 */
export const enrichPlacesWithReviews = async (kakaoPlaces) => {
  if (!kakaoPlaces || kakaoPlaces.length === 0) {
    return [];
  }

  try {
    // 모든 장소 ID 추출
    const restaurantIds = kakaoPlaces.map(place => place.id);

    // 리뷰 통계 일괄 조회
    const statsMap = await getBulkRestaurantReviewStats(restaurantIds);

    // 검색 결과에 리뷰 정보 병합
    return kakaoPlaces.map(place => {
      const stats = statsMap.get(place.id) || { reviewCount: 0, averageRating: 0 };

      return {
        ...place,
        // 우리 앱 리뷰 정보 추가
        appReviewCount: stats.reviewCount,
        appAverageRating: stats.averageRating,
        hasAppReviews: stats.reviewCount > 0
      };
    });
  } catch (error) {
    console.error('장소 리뷰 정보 병합 실패:', error);
    // 에러 시 원본 반환
    return kakaoPlaces.map(place => ({
      ...place,
      appReviewCount: 0,
      appAverageRating: 0,
      hasAppReviews: false
    }));
  }
};

/**
 * 리뷰가 많은 순으로 정렬
 * @param {Array} places - enrichPlacesWithReviews로 병합된 장소 목록
 * @returns {Array} 리뷰 수 기준 내림차순 정렬된 목록
 */
export const sortByReviewCount = (places) => {
  return [...places].sort((a, b) => {
    // 리뷰 수가 같으면 평균 별점으로 정렬
    if (b.appReviewCount === a.appReviewCount) {
      return b.appAverageRating - a.appAverageRating;
    }
    return b.appReviewCount - a.appReviewCount;
  });
};

/**
 * 리뷰 평점 높은 순으로 정렬
 * @param {Array} places - enrichPlacesWithReviews로 병합된 장소 목록
 * @returns {Array} 평균 별점 기준 내림차순 정렬된 목록
 */
export const sortByRating = (places) => {
  return [...places].sort((a, b) => {
    // 별점이 같으면 리뷰 수로 정렬
    if (b.appAverageRating === a.appAverageRating) {
      return b.appReviewCount - a.appReviewCount;
    }
    return b.appAverageRating - a.appAverageRating;
  });
};
