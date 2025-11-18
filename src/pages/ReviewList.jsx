import React, { useState, useEffect } from 'react';
import { getUserReviews, searchReviews, deleteReview, toggleReviewPublic, checkCanMakePublic } from '../services/reviewService';
import { REVIEW_SORT_OPTIONS } from '../types/review';
import './ReviewList.css';

const ReviewList = ({ onNavigateToWrite, onNavigateToEdit, showToast }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(REVIEW_SORT_OPTIONS.LATEST);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // TODO: 실제 사용자 ID는 인증 시스템에서 가져와야 함
  const userId = 'temp_user_id';

  // 리뷰 목록 로드
  useEffect(() => {
    loadReviews();
  }, [sortBy, sortOrder]);

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

      const sortConfig = getSortConfig(sortBy, sortOrder);
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

  const getSortConfig = (sortOption, order) => {
    const fieldMap = {
      [REVIEW_SORT_OPTIONS.LATEST]: 'createdAt',
      [REVIEW_SORT_OPTIONS.OLDEST]: 'createdAt',
      [REVIEW_SORT_OPTIONS.RATING_HIGH]: 'rating',
      [REVIEW_SORT_OPTIONS.RATING_LOW]: 'rating'
    };

    return {
      sortBy: fieldMap[sortOption] || 'createdAt',
      sortOrder: order
    };
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // 같은 필드를 클릭하면 정렬 순서만 토글
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // 다른 필드를 클릭하면 기본 정렬 순서로 설정
      setSortBy(newSortBy);
      if (newSortBy === REVIEW_SORT_OPTIONS.LATEST || newSortBy === REVIEW_SORT_OPTIONS.RATING_HIGH) {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
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

  const handleTogglePublic = async (reviewId, currentIsPublic) => {
    const newIsPublic = !currentIsPublic;

    try {
      await toggleReviewPublic(reviewId, userId, newIsPublic);
      showToast?.(newIsPublic ? '리뷰가 공개되었습니다.' : '리뷰가 비공개로 전환되었습니다.');
      loadReviews();
    } catch (error) {
      console.error('리뷰 공개 상태 변경 실패:', error);
      showToast?.(error.message || '공개 상태 변경에 실패했습니다.');
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

  const formatDateWithTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

        <div className="sort-buttons">
          <button
            className={`sort-button ${sortBy === REVIEW_SORT_OPTIONS.LATEST ? 'active' : ''}`}
            onClick={() => handleSortChange(REVIEW_SORT_OPTIONS.LATEST)}
          >
            최신순 {sortBy === REVIEW_SORT_OPTIONS.LATEST && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === REVIEW_SORT_OPTIONS.RATING_HIGH ? 'active' : ''}`}
            onClick={() => handleSortChange(REVIEW_SORT_OPTIONS.RATING_HIGH)}
          >
            별점 {sortBy === REVIEW_SORT_OPTIONS.RATING_HIGH && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
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
            {filteredReviews.map((review) => {
              const { canMakePublic, remainingDays } = checkCanMakePublic(review);

              return (
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

                  {/* 리뷰 내용 - 클릭 가능 */}
                  <div
                    className="review-body"
                    onClick={() => onNavigateToEdit(review.id)}
                    style={{ cursor: 'pointer' }}
                  >
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

                  <p className="review-content review-content-preview">
                    {review.content}
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

                  {/* 작성일 및 상태 정보 */}
                  <div className="review-info-row">
                    <span className="created-date-with-time">
                      {formatDateWithTime(review.createdAt)}
                    </span>
                    <div className="status-badges">
                      <span className={`public-status-badge ${review.isPublic ? 'public' : 'private'}`}>
                        {review.isPublic ? '공개' : '비공개'}
                      </span>
                      {!review.isPublic && remainingDays > 0 && (
                        <span className="remaining-days-badge">
                          D-{remainingDays}
                        </span>
                      )}
                      {review.editHistory && review.editHistory.length > 0 && (
                        <span className="edit-count-badge">
                          수정 {review.editHistory.length}회
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 삭제 버튼만 별도로 */}
                <div className="review-actions-single">
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(review.id);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
            })}
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
