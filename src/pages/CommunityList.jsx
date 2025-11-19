// src/pages/CommunityList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPopularRestaurants } from '../services/restaurantService';
import './CommunityList.css';

/**
 * 커뮤니티 업체 목록 (업체 중심)
 * - 공개 리뷰가 있는 업체만 표시
 * - 업체별로 그룹화
 */
const CommunityList = ({ showToast, onBack, onNavigateToRestaurant }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('reviewCount'); // 'reviewCount' | 'avgRating' | 'totalLikes'

  useEffect(() => {
    loadRestaurants();
  }, [sortBy]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);

      // 인기 업체 조회 (reviewCount, avgRating, totalLikes 기준)
      const restaurantList = await getPopularRestaurants(sortBy, 50);

      // reviewCount > 0인 업체만 필터링 (공개 리뷰가 있는 업체만)
      const filteredRestaurants = restaurantList.filter(r => r.reviewCount > 0);

      // 각 업체의 대표 사진 가져오기 (첫 번째 공개 리뷰의 첫 사진)
      const restaurantsWithPhotos = await Promise.all(
        filteredRestaurants.map(async (restaurant) => {
          try {
            // orderBy 제거 (인덱스 불필요)
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('restaurantId', '==', restaurant.id),
              where('isPublic', '==', true)
            );
            const snapshot = await getDocs(reviewsQuery);

            let thumbnailPhoto = null;
            if (!snapshot.empty) {
              // 클라이언트에서 최신 리뷰 찾기
              const reviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));

              reviews.sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
              });

              const firstReview = reviews[0];
              if (firstReview.photos && firstReview.photos.length > 0) {
                thumbnailPhoto = firstReview.photos[0];
              }
            }

            return {
              ...restaurant,
              thumbnailPhoto
            };
          } catch (error) {
            console.error('대표 사진 조회 실패:', error);
            return restaurant;
          }
        })
      );

      setRestaurants(restaurantsWithPhotos);
    } catch (error) {
      console.error('업체 목록 로딩 실패:', error);
      showToast?.('업체 목록을 불러올 수 없습니다.');
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

  if (loading) {
    return (
      <div className="community-list-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>인기 업체 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-list-page">
      {/* 정렬 필터 */}
      <div className="community-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
        )}
        <div className="sort-tabs">
          <button
            className={`sort-tab ${sortBy === 'reviewCount' ? 'active' : ''}`}
            onClick={() => setSortBy('reviewCount')}
          >
            리뷰 많은 순
          </button>
          <button
            className={`sort-tab ${sortBy === 'avgRating' ? 'active' : ''}`}
            onClick={() => setSortBy('avgRating')}
          >
            평점 높은 순
          </button>
          <button
            className={`sort-tab ${sortBy === 'totalLikes' ? 'active' : ''}`}
            onClick={() => setSortBy('totalLikes')}
          >
            좋아요 많은 순
          </button>
        </div>
        <div className="review-count">
          🍽️ 인기 업체 {restaurants.length}개
        </div>
      </div>

      {/* 업체 그리드 */}
      {restaurants.length === 0 ? (
        <div className="empty-community">
          <div className="empty-icon">🌟</div>
          <p>아직 공개된 리뷰가 있는 업체가 없습니다.</p>
          <p className="empty-hint">리뷰를 공개하면 커뮤니티에 업체가 추가됩니다!</p>
        </div>
      ) : (
        <div className="community-grid">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="community-card"
              onClick={() => onNavigateToRestaurant?.(restaurant.id)}
            >
              {/* 업체 대표 사진 */}
              {restaurant.thumbnailPhoto ? (
                <div className="card-image">
                  <img src={restaurant.thumbnailPhoto} alt={restaurant.name} />
                  <div className="photo-count">📷 {restaurant.reviewCount}</div>
                </div>
              ) : (
                <div className="card-image-placeholder">
                  <div className="placeholder-icon">🍽️</div>
                </div>
              )}

              {/* 카드 내용 */}
              <div className="card-content">
                {/* 업체명 & 별점 */}
                <div className="card-header">
                  <h3 className="restaurant-name">{restaurant.name}</h3>
                  <div className="rating-display">
                    {renderStars(restaurant.avgRating || 0)}
                    <span className="rating-number">
                      {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>

                {/* 업체 정보 미리보기 */}
                <p className="review-preview">
                  {restaurant.category || '음식점'}
                </p>

                {/* 메타 정보 */}
                <div className="card-meta">
                  <span className="stat">리뷰 {restaurant.reviewCount}개</span>
                  <span className="separator">·</span>
                  <span className="stat">좋아요 {restaurant.totalLikes || 0}개</span>
                  {restaurant.address && (
                    <>
                      <span className="separator">·</span>
                      <span className="location">
                        {restaurant.address.split(' ')[1] || '위치'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityList;
