// src/pages/RestaurantDetail.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getRestaurant } from '../services/restaurantService';
import './RestaurantDetail.css';

/**
 * 업체 상세 페이지
 * - 업체 정보 표시
 * - 해당 업체의 공개 리뷰 목록
 */
const RestaurantDetail = ({ restaurantId, onBack, showToast }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      console.log('🔍 업체 상세 로딩:', restaurantId);

      // 업체 정보 조회
      const restaurantData = await getRestaurant(restaurantId);
      console.log('✅ 업체 정보:', restaurantData);
      setRestaurant(restaurantData);

      // 해당 업체의 공개 리뷰 조회 (orderBy 제거 - 인덱스 불필요)
      console.log('🔍 리뷰 쿼리:', { restaurantId, isPublic: true });
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        where('isPublic', '==', true)
      );

      const snapshot = await getDocs(reviewsQuery);
      console.log('📊 조회된 리뷰 수:', snapshot.size);

      const reviewList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 리뷰:', { id: doc.id, restaurantId: data.restaurantId, content: data.content?.substring(0, 30) });
        reviewList.push({
          id: doc.id,
          ...data,
          orderDate: data.orderDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      // 클라이언트에서 정렬 (최신순)
      reviewList.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });

      console.log('✅ 최종 리뷰 목록:', reviewList.length, '개');
      setReviews(reviewList);
    } catch (error) {
      console.error('❌ 업체 정보 로딩 실패:', error);
      showToast?.('업체 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 별점 렌더링
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  // 익명화된 작성자 표시
  const getAnonymousName = (userId, createdAt) => {
    const hash = (userId + createdAt?.getTime()).split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const index = Math.abs(hash) % 100;
    return `맛잘알${index.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="restaurant-detail-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>업체 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-detail-page">
        <div className="error-message">
          <p>업체를 찾을 수 없습니다.</p>
          {onBack && (
            <button className="back-button" onClick={onBack}>
              ← 뒤로
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-detail-page">
      {/* 헤더 */}
      <div className="detail-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
        )}
      </div>

      {/* 업체 정보 */}
      <div className="restaurant-info">
        <h1 className="restaurant-name">{restaurant.name}</h1>

        <div className="restaurant-stats">
          <div className="stat-item">
            <div className="rating-display">
              {renderStars(restaurant.avgRating || 0)}
              <span className="rating-number">
                {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
          <div className="stat-divider">·</div>
          <div className="stat-item">
            <span className="stat-label">리뷰</span>
            <span className="stat-value">{restaurant.reviewCount || 0}</span>
          </div>
          <div className="stat-divider">·</div>
          <div className="stat-item">
            <span className="stat-label">좋아요</span>
            <span className="stat-value">{restaurant.totalLikes || 0}</span>
          </div>
        </div>

        {restaurant.category && (
          <div className="restaurant-category">
            📂 {restaurant.category}
          </div>
        )}

        {restaurant.address && (
          <div className="restaurant-address">
            📍 {restaurant.address}
          </div>
        )}

        {restaurant.phone && (
          <div className="restaurant-phone">
            📞 {restaurant.phone}
          </div>
        )}

        {restaurant.placeUrl && (
          <a
            href={restaurant.placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kakao-map-link"
          >
            🗺️ 카카오맵에서 보기
          </a>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div className="reviews-section">
        <h2 className="section-title">
          리뷰 {reviews.length}개
        </h2>

        {reviews.length === 0 ? (
          <div className="empty-reviews">
            <div className="empty-icon">✍️</div>
            <p>아직 공개된 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="review-card"
                onClick={() => setSelectedReview(review)}
              >
                {/* 사진 (필수 아님) */}
                {review.photos && review.photos.length > 0 ? (
                  <div className="card-image">
                    <img src={review.photos[0]} alt={restaurant.name} />
                    {review.photos.length > 1 && (
                      <div className="photo-count">📷 {review.photos.length}</div>
                    )}
                  </div>
                ) : (
                  <div className="card-image-placeholder">
                    <div className="placeholder-icon">🍽️</div>
                  </div>
                )}

                {/* 카드 내용 */}
                <div className="card-content">
                  <div className="rating-display">
                    {renderStars(review.rating)}
                    <span className="rating-number">{review.rating.toFixed(1)}</span>
                  </div>

                  <p className="review-preview">
                    {review.content.length > 80
                      ? `${review.content.substring(0, 80)}...`
                      : review.content}
                  </p>

                  <div className="card-meta">
                    <span className="author">
                      {getAnonymousName(review.userId, review.createdAt)}
                    </span>
                    <span className="separator">·</span>
                    <span className="date">
                      {review.createdAt?.toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 리뷰 상세보기 모달 */}
      {selectedReview && (
        <div className="review-detail-modal" onClick={() => setSelectedReview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReview(null)}>
              ✕
            </button>

            {/* 사진 슬라이드 */}
            {selectedReview.photos && selectedReview.photos.length > 0 && (
              <div className="modal-photos">
                {selectedReview.photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`${restaurant.name} ${idx + 1}`} />
                ))}
              </div>
            )}

            {/* 상세 정보 */}
            <div className="modal-details">
              <h2 className="modal-restaurant-name">{restaurant.name}</h2>
              <div className="modal-rating">
                {renderStars(selectedReview.rating)}
                <span className="modal-rating-number">{selectedReview.rating.toFixed(1)}</span>
              </div>

              <div className="modal-content-text">{selectedReview.content}</div>

              {selectedReview.foodItems && selectedReview.foodItems.length > 0 && (
                <div className="modal-food-items">
                  <strong>주문 메뉴:</strong>
                  <div className="food-tags">
                    {selectedReview.foodItems.map((item, idx) => {
                      const foodName = typeof item === 'string' ? item : item.name;
                      const foodPrice = typeof item === 'object' ? item.price : null;
                      return (
                        <span key={idx} className="food-tag">
                          {foodName}
                          {foodPrice && ` (${foodPrice.toLocaleString()}원)`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedReview.totalPrice && (
                <p className="modal-price">💰 총액: {selectedReview.totalPrice.toLocaleString()}원</p>
              )}

              <div className="modal-footer">
                <span className="modal-author">
                  {getAnonymousName(selectedReview.userId, selectedReview.createdAt)}
                </span>
                <span className="modal-date">
                  {selectedReview.createdAt?.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
