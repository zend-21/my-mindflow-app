import React, { useState, useEffect } from 'react';
import { getUserReviews, searchReviews, deleteReview } from '../services/reviewService';
import { REVIEW_SORT_OPTIONS } from '../types/review';
import './ReviewList.css';

const ReviewList = ({ onNavigateToWrite, onNavigateToEdit, showToast }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(REVIEW_SORT_OPTIONS.LATEST);

  // TODO: 실제 사용자 ID는 인증 시스템에서 가져와야 함
  const userId = 'temp_user_id';

  // 리뷰 목록 로드
  useEffect(() => {
    loadReviews();
  }, [sortBy]);

  // 검색 처리
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter(review => {
        const nameMatch = review.restaurantName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        const foodMatch = review.foodItems.some(food =>
          food.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const contentMatch = review.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        return nameMatch || foodMatch || contentMatch;
      });

      setFilteredReviews(filtered);
    }
  }, [searchQuery, reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      const sortConfig = getSortConfig(sortBy);
      const data = await getUserReviews(userId, sortConfig);

      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error('리뷰 목록 로드 실패:', error);
      showToast?.('리뷰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSortConfig = (sortOption) => {
    switch (sortOption) {
      case REVIEW_SORT_OPTIONS.LATEST:
        return { sortBy: 'createdAt', sortOrder: 'desc' };
      case REVIEW_SORT_OPTIONS.OLDEST:
        return { sortBy: 'createdAt', sortOrder: 'asc' };
      case REVIEW_SORT_OPTIONS.RATING_HIGH:
        return { sortBy: 'rating', sortOrder: 'desc' };
      case REVIEW_SORT_OPTIONS.RATING_LOW:
        return { sortBy: 'rating', sortOrder: 'asc' };
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' };
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('정말 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteReview(reviewId, userId);
      showToast?.('리뷰가 삭제되었습니다.');
      loadReviews();
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      showToast?.('리뷰 삭제에 실패했습니다.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="review-list-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="review-list-page">
      <header className="review-list-header">
        <h1>내 리뷰</h1>
        <button
          className="write-button"
          onClick={onNavigateToWrite}
        >
          + 리뷰 작성
        </button>
      </header>

      {/* 검색 및 필터 */}
      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="가게명, 음식명, 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="sort-box">
          <label>정렬:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value={REVIEW_SORT_OPTIONS.LATEST}>최신순</option>
            <option value={REVIEW_SORT_OPTIONS.OLDEST}>오래된순</option>
            <option value={REVIEW_SORT_OPTIONS.RATING_HIGH}>별점 높은순</option>
            <option value={REVIEW_SORT_OPTIONS.RATING_LOW}>별점 낮은순</option>
          </select>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="review-list-content">
        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchQuery
                ? '검색 결과가 없습니다.'
                : '아직 작성한 리뷰가 없습니다.'}
            </p>
            {!searchQuery && (
              <button
                className="empty-write-button"
                onClick={onNavigateToWrite}
              >
                첫 리뷰 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="review-grid">
            {filteredReviews.map((review) => (
              <div key={review.id} className="review-card">
                {/* 사진 */}
                {review.photos && review.photos.length > 0 && (
                  <div className="review-photo">
                    <img
                      src={review.photos[0]}
                      alt={review.restaurantName}
                    />
                    {review.photos.length > 1 && (
                      <div className="photo-count">
                        +{review.photos.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* 리뷰 내용 */}
                <div className="review-body">
                  <div className="review-header-card">
                    <h3 className="restaurant-name">
                      {review.restaurantName}
                    </h3>
                    <div className="rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="review-title">{review.title}</h4>
                  )}

                  <p className="review-content">
                    {review.content.length > 100
                      ? `${review.content.substring(0, 100)}...`
                      : review.content}
                  </p>

                  {review.foodItems && review.foodItems.length > 0 && (
                    <div className="food-items">
                      {review.foodItems.map((food, idx) => {
                        // 새 형식 { name, price } 또는 구 형식 string 모두 처리
                        const foodName = typeof food === 'string' ? food : food.name;
                        const foodPrice = typeof food === 'object' && food.price ? food.price : null;

                        return (
                          <span key={idx} className="food-tag">
                            {foodName}
                            {foodPrice && foodPrice > 0 && (
                              <span className="food-price"> · {foodPrice.toLocaleString()}원</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="review-meta">
                    <span className="order-date">
                      주문일: {formatDate(review.orderDate)}
                    </span>
                    {(review.totalPrice || review.price) && (
                      <span className="price">
                        {(review.totalPrice || review.price).toLocaleString()}원
                      </span>
                    )}
                  </div>

                  <div className="review-footer">
                    <span className="created-date">
                      {formatDate(review.createdAt)}
                    </span>
                    <div className="review-actions">
                      <button
                        className="edit-button"
                        onClick={() => onNavigateToEdit(review.id)}
                      >
                        수정
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(review.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 통계 */}
      {filteredReviews.length > 0 && (
        <div className="review-stats">
          <div className="stat-item">
            <span className="stat-label">총 리뷰</span>
            <span className="stat-value">{filteredReviews.length}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">평균 별점</span>
            <span className="stat-value">
              {(
                filteredReviews.reduce((sum, r) => sum + r.rating, 0) /
                filteredReviews.length
              ).toFixed(1)}점
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
