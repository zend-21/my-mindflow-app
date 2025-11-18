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
  Timestamp
} from 'firebase/firestore';
import { uploadMultipleImages, deleteMultipleImages } from '../utils/storage';

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
      restaurantId: reviewData.restaurantId || '',
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
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    // Firestore에 리뷰 문서 생성
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewToSave);

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
      updatedAt: Timestamp.fromDate(new Date())
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

    return reviews;
  } catch (error) {
    console.error('리뷰 목록 조회 실패:', error);
    // 에러 발생 시 빈 배열 반환 (Firebase 미설정 등)
    return [];
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

      const foodMatch = review.foodItems.some(food =>
        food.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return nameMatch || foodMatch;
    });

    return filtered;
  } catch (error) {
    console.error('리뷰 검색 실패:', error);
    throw error;
  }
};
