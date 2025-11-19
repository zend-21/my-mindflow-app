import { db } from '../firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { uploadMultipleImages, deleteMultipleImages } from '../utils/storage';
import { saveRestaurant, updateRestaurantStats } from './restaurantService';

const REVIEWS_COLLECTION = 'reviews';

/**
 * 새 리뷰 작성
 * @param {Object} reviewData - 리뷰 데이터
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string>} 생성된 리뷰 ID
 */
export const createReview = async (reviewData, userId) => {
  try {
    const now = new Date();

    // 🆕 업체 정보가 있으면 restaurants 컬렉션에 저장
    let restaurantId = '';
    if (reviewData.selectedRestaurant) {
      try {
        restaurantId = await saveRestaurant(reviewData.selectedRestaurant);
        console.log('✅ 업체 정보 저장 완료:', restaurantId);
      } catch (error) {
        console.error('⚠️ 업체 정보 저장 실패 (리뷰는 계속 진행):', error);
      }
    }

    // 음식 항목 처리 (새 형식 { name, price })
    const processedFoodItems = reviewData.foodItems
      .filter(item => item.name && item.name.trim() !== '')
      .map(item => ({
        name: item.name.trim(),
        price: item.price ? parseInt(item.price) : 0
      }));

    // Firestore에 저장할 데이터 준비
    const reviewToSave = {
      userId,
      restaurantId: restaurantId || reviewData.restaurantId || '', // 🆕 저장된 restaurantId 사용
      restaurantName: reviewData.restaurantName,
      restaurantAddress: reviewData.restaurantAddress || '',
      restaurantPhone: reviewData.restaurantPhone || '',
      rating: reviewData.rating,
      tasteRating: reviewData.tasteRating || 0,
      priceRating: reviewData.priceRating || 0,
      serviceRating: reviewData.serviceRating || 0,
      title: reviewData.title || '',
      content: reviewData.content,
      photos: [], // 나중에 업데이트
      foodItems: processedFoodItems,
      totalPrice: reviewData.totalPrice ? parseInt(reviewData.totalPrice) : null,
      orderDate: Timestamp.fromDate(new Date(reviewData.orderDate)),
      isPublic: false, // 오프라인 리뷰는 기본 비공개

      // 🆕 좋아요 시스템 초기화
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],

      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      editHistory: [] // 수정 이력 (빈 배열로 시작)
    };

    // Firestore에 리뷰 문서 생성
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewToSave);

    // 🆕 업체 통계 업데이트 (비동기, 실패해도 리뷰 작성은 성공)
    if (restaurantId) {
      updateRestaurantStats(restaurantId).catch(err =>
        console.error('업체 통계 업데이트 실패:', err)
      );
    }

    // 사진이 있으면 업로드
    if (reviewData.photos && reviewData.photos.length > 0) {
      const photoUrls = await uploadMultipleImages(
        reviewData.photos,
        userId,
        docRef.id
      );

      // 리뷰 문서에 사진 URL 추가
      await updateDoc(doc(db, REVIEWS_COLLECTION, docRef.id), {
        photos: photoUrls,
        updatedAt: Timestamp.fromDate(new Date())
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('리뷰 생성 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 수정
 * @param {string} reviewId - 리뷰 ID
 * @param {Object} updateData - 수정할 데이터
 * @param {string} userId - 사용자 ID
 */
export const updateReview = async (reviewId, updateData, userId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // 기존 리뷰 조회
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const existingReview = reviewSnap.data();

    // 권한 확인
    if (existingReview.userId !== userId) {
      throw new Error('수정 권한이 없습니다.');
    }

    // 음식 항목 처리 (새 형식 { name, price })
    let processedFoodItems = updateData.foodItems;
    if (updateData.foodItems) {
      processedFoodItems = updateData.foodItems
        .filter(item => item.name && item.name.trim() !== '')
        .map(item => ({
          name: item.name.trim(),
          price: item.price ? parseInt(item.price) : 0
        }));
    }

    // 수정 이력 추가
    const now = new Date();

    // 변경 사항 분석
    const changes = {};

    // 가게명 변경
    if (updateData.restaurantName !== existingReview.restaurantName) {
      changes.restaurantName = {
        changed: true,
        isMinor: false,
        before: existingReview.restaurantName,
        after: updateData.restaurantName
      };
    }

    // 평점 변경
    if (updateData.rating !== existingReview.rating) {
      changes.rating = {
        changed: true,
        isMinor: false,
        before: existingReview.rating,
        after: updateData.rating
      };
    }

    // 내용 변경 (오타 수정 vs 본질적 수정 구분)
    if (updateData.content !== existingReview.content) {
      const oldContent = existingReview.content || '';
      const newContent = updateData.content || '';

      // Levenshtein distance 계산 (편집 거리)
      const editDistance = calculateEditDistance(oldContent, newContent);
      const contentLength = Math.max(oldContent.length, newContent.length);
      const changeRatio = editDistance / contentLength;

      // 변경 비율이 10% 미만이고, 길이 차이가 5글자 이하면 오타 수정으로 간주
      const isMinorEdit = changeRatio < 0.1 && Math.abs(oldContent.length - newContent.length) <= 5;

      changes.content = {
        changed: true,
        isMinor: isMinorEdit,
        editDistance: editDistance,
        changeRatio: Math.round(changeRatio * 100),
        before: oldContent,
        after: newContent
      };
    }

    // 주문 항목 변경
    if (JSON.stringify(processedFoodItems) !== JSON.stringify(existingReview.foodItems)) {
      changes.foodItems = {
        changed: true,
        isMinor: false,
        before: existingReview.foodItems,
        after: processedFoodItems
      };
    }

    // 총액 변경
    const newTotalPrice = updateData.totalPrice ? parseInt(updateData.totalPrice) : null;
    if (newTotalPrice !== existingReview.totalPrice) {
      changes.totalPrice = {
        changed: true,
        isMinor: false,
        before: existingReview.totalPrice,
        after: newTotalPrice
      };
    }

    const editHistoryEntry = {
      editedAt: Timestamp.fromDate(now),
      changes: changes
    };

    // 기존 수정 이력 가져오기 (없으면 빈 배열)
    const editHistory = existingReview.editHistory || [];
    editHistory.push(editHistoryEntry);

    // 수정 데이터 준비
    const dataToUpdate = {
      restaurantId: updateData.restaurantId || '',
      restaurantName: updateData.restaurantName,
      restaurantAddress: updateData.restaurantAddress || '',
      restaurantPhone: updateData.restaurantPhone || '',
      rating: updateData.rating,
      tasteRating: updateData.tasteRating || 0,
      priceRating: updateData.priceRating || 0,
      serviceRating: updateData.serviceRating || 0,
      title: updateData.title || '',
      content: updateData.content,
      foodItems: processedFoodItems,
      totalPrice: updateData.totalPrice ? parseInt(updateData.totalPrice) : null,
      updatedAt: Timestamp.fromDate(now),
      editHistory: editHistory
    };

    // 날짜 필드 변환
    if (updateData.orderDate) {
      dataToUpdate.orderDate = Timestamp.fromDate(new Date(updateData.orderDate));
    }

    // 사진 처리
    if (updateData.photos !== undefined) {
      // 기존 사진 삭제
      if (existingReview.photos && existingReview.photos.length > 0) {
        await deleteMultipleImages(existingReview.photos);
      }

      // 새 사진 업로드
      if (updateData.photos.length > 0) {
        const photoUrls = await uploadMultipleImages(
          updateData.photos,
          userId,
          reviewId
        );
        dataToUpdate.photos = photoUrls;
      } else {
        dataToUpdate.photos = [];
      }
    }

    // Firestore 업데이트
    await updateDoc(reviewRef, dataToUpdate);
  } catch (error) {
    console.error('리뷰 수정 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 삭제
 * @param {string} reviewId - 리뷰 ID
 * @param {string} userId - 사용자 ID
 */
export const deleteReview = async (reviewId, userId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // 기존 리뷰 조회
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const review = reviewSnap.data();

    // 권한 확인
    if (review.userId !== userId) {
      throw new Error('삭제 권한이 없습니다.');
    }

    // 사진 삭제
    if (review.photos && review.photos.length > 0) {
      await deleteMultipleImages(review.photos);
    }

    // Firestore에서 삭제
    await deleteDoc(reviewRef);

    // 🆕 업체 통계 업데이트 (리뷰 삭제 시)
    if (review.restaurantId) {
      updateRestaurantStats(review.restaurantId).catch(err =>
        console.error('업체 통계 업데이트 실패:', err)
      );
    }
  } catch (error) {
    console.error('리뷰 삭제 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 상세 조회
 * @param {string} reviewId - 리뷰 ID
 * @returns {Promise<Object>} 리뷰 데이터
 */
export const getReview = async (reviewId) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    return {
      id: reviewSnap.id,
      ...reviewSnap.data(),
      // Timestamp를 Date로 변환
      orderDate: reviewSnap.data().orderDate?.toDate(),
      createdAt: reviewSnap.data().createdAt?.toDate(),
      updatedAt: reviewSnap.data().updatedAt?.toDate()
    };
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    throw error;
  }
};

/**
 * 사용자의 리뷰 목록 조회
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 정렬 옵션
 * @returns {Promise<Array>} 리뷰 목록
 */
export const getUserReviews = async (userId, options = {}) => {
  try {
    // Firebase가 제대로 설정되지 않은 경우 빈 배열 반환
    if (!db) {
      console.warn('Firebase가 초기화되지 않았습니다.');
      return [];
    }

    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPublic = null
    } = options;

    console.log('🔍 getUserReviews 호출 - sortBy:', sortBy, 'sortOrder:', sortOrder);

    // 쿼리 구성
    let q = query(
      collection(db, REVIEWS_COLLECTION),
      where('userId', '==', userId)
    );

    // 공개/비공개 필터
    if (isPublic !== null) {
      q = query(q, where('isPublic', '==', isPublic));
    }

    // 정렬
    q = query(q, orderBy(sortBy, sortOrder));

    // 실행
    const querySnapshot = await getDocs(q);

    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
        // Timestamp를 Date로 변환
        orderDate: doc.data().orderDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      });
    });

    console.log('✅ getUserReviews 완료 - 리뷰 수:', reviews.length);
    return reviews;
  } catch (error) {
    console.error('❌ 리뷰 목록 조회 실패:', error);
    console.error('에러 상세:', error.message, error.code);
    // 에러 발생 시에도 throw하여 상위에서 처리하도록 변경
    throw error;
  }
};

/**
 * 가게명으로 리뷰 검색
 * @param {string} userId - 사용자 ID
 * @param {string} searchQuery - 검색어
 * @returns {Promise<Array>} 검색 결과
 */
export const searchReviews = async (userId, searchQuery) => {
  try {
    const reviews = await getUserReviews(userId);

    // 클라이언트 사이드 필터링
    // Firestore는 부분 문자열 검색을 지원하지 않으므로
    const filtered = reviews.filter(review => {
      const nameMatch = review.restaurantName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const foodMatch = review.foodItems.some(food => {
        // 새 형식 { name, price } 또는 구 형식 string 모두 처리
        const foodName = typeof food === 'string' ? food : food.name;
        return foodName.toLowerCase().includes(searchQuery.toLowerCase());
      });

      return nameMatch || foodMatch;
    });

    return filtered;
  } catch (error) {
    console.error('리뷰 검색 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 공개 상태 토글
 * @param {string} reviewId - 리뷰 ID
 * @param {string} userId - 사용자 ID
 * @param {boolean} isPublic - 공개 여부
 * @returns {Promise<void>}
 */
export const toggleReviewPublic = async (reviewId, userId, isPublic) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // 기존 리뷰 조회
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const review = reviewSnap.data();

    // 권한 확인
    if (review.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    // 🆕 관리자 권한 체크 (관리자는 D-7 제한 없이 즉시 공개 가능)
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userRank = userDoc.exists() ? userDoc.data().rank : 'newbie';
    const isAdmin = userRank === 'admin';

    // 공개 대기 기간 확인 (7일)
    const createdAt = review.createdAt.toDate();
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const WAITING_PERIOD_DAYS = 7;

    // 디버깅: 날짜 정보 로그
    console.log('📅 공개 가능 체크:', {
      createdAt: createdAt.toISOString(),
      now: now.toISOString(),
      daysSinceCreation,
      WAITING_PERIOD_DAYS,
      isAdmin,
      canPublish: isAdmin || daysSinceCreation >= WAITING_PERIOD_DAYS
    });

    // 비공개 → 공개로 전환하려는 경우에만 대기 기간 체크
    if (!review.isPublic && isPublic) {
      // 관리자는 즉시 공개 가능
      if (!isAdmin && daysSinceCreation < WAITING_PERIOD_DAYS) {
        const remainingDays = WAITING_PERIOD_DAYS - daysSinceCreation;
        throw new Error(`리뷰 작성 후 ${WAITING_PERIOD_DAYS}일이 지나야 공개할 수 있습니다. (남은 기간: ${remainingDays}일, 경과: ${daysSinceCreation}일)`);
      }
    }

    // 상태 업데이트
    await updateDoc(reviewRef, {
      isPublic,
      updatedAt: Timestamp.fromDate(now),
      // 공개 시 보류 상태 해제
      ...(isPublic && { isPending: false, pendingAt: null })
    });

    // 🆕 업체 통계 업데이트 (공개 상태 변경 시)
    if (review.restaurantId) {
      updateRestaurantStats(review.restaurantId).catch(err =>
        console.error('업체 통계 업데이트 실패:', err)
      );
    }
  } catch (error) {
    console.error('리뷰 공개 상태 변경 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 보류 상태 설정
 * @param {string} reviewId - 리뷰 ID
 * @param {string} userId - 사용자 ID
 * @param {boolean} isPending - 보류 상태
 */
export const setPendingStatus = async (reviewId, userId, isPending) => {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);

    // 기존 리뷰 조회
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      throw new Error('리뷰를 찾을 수 없습니다.');
    }

    const review = reviewSnap.data();

    // 권한 확인
    if (review.userId !== userId) {
      throw new Error('권한이 없습니다.');
    }

    // 보류 상태 업데이트
    await updateDoc(reviewRef, {
      isPending: isPending,
      pendingAt: isPending ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('보류 상태 설정 실패:', error);
    throw error;
  }
};

/**
 * 리뷰의 공개 가능 여부 확인
 * @param {Object} review - 리뷰 객체
 * @returns {Object} { canMakePublic: boolean, remainingDays: number }
 */
export const checkCanMakePublic = (review, userRank = 'newbie') => {
  const createdAt = review.createdAt instanceof Date
    ? review.createdAt
    : review.createdAt?.toDate();

  if (!createdAt) {
    return { canMakePublic: false, remainingDays: 0 };
  }

  // 관리자는 즉시 공개 가능
  const isAdmin = userRank === 'admin';
  if (isAdmin) {
    return {
      canMakePublic: true,
      daysInfo: { type: 'admin', value: 0 }
    };
  }

  const now = new Date();
  const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  const WAITING_PERIOD_DAYS = 7;

  const canMakePublic = daysSinceCreation >= WAITING_PERIOD_DAYS;

  let daysInfo;
  if (daysSinceCreation < WAITING_PERIOD_DAYS) {
    // D-7 ~ D-1 (공개 불가)
    daysInfo = {
      type: 'minus',
      value: WAITING_PERIOD_DAYS - daysSinceCreation
    };
  } else if (daysSinceCreation === WAITING_PERIOD_DAYS) {
    // D-0 (오늘이 공개 가능일)
    daysInfo = {
      type: 'zero',
      value: 0
    };
  } else {
    // D+1, D+2, D+3... (공개 가능일 경과)
    daysInfo = {
      type: 'plus',
      value: daysSinceCreation - WAITING_PERIOD_DAYS
    };
  }

  // TODO: 신뢰도 점수가 높으면 즉시 공개 가능
  // if (userTrustScore >= INSTANT_PUBLIC_THRESHOLD) {
  //   return { canMakePublic: true, daysInfo: { type: 'zero', value: 0 } };
  // }

  return { canMakePublic, daysInfo };
};

/**
 * Levenshtein distance 계산 (두 문자열 간의 편집 거리)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} 편집 거리
 */
function calculateEditDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // DP 테이블 생성
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // 초기화
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  // DP 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 삭제
          dp[i][j - 1] + 1,      // 삽입
          dp[i - 1][j - 1] + 1   // 교체
        );
      }
    }
  }

  return dp[len1][len2];
}
