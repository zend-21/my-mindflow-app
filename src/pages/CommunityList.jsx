// src/pages/CommunityList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import './CommunityList.css';

/**
 * 커뮤니티 리뷰 목록 (공개 리뷰만 표시)
 * 인스타그램 스타일의 카드형 레이아웃
 */
const CommunityList = ({ showToast }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'rating' | 'popular'
  const [selectedReview, setSelectedReview] = useState(null); // 상세보기

  useEffect(() => {
    loadCommunityReviews();
  }, [sortBy]);

  const loadCommunityReviews = async () => {
    try {
      setLoading(true);

      // 공개 리뷰만 조회
      let q = query(
        collection(db, 'reviews'),
        where('isPublic', '==', true),
        limit(50)
      );

      // 정렬 조건 추가
      if (sortBy === 'latest') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else if (sortBy === 'rating') {
        q = query(q, orderBy('rating', 'desc'), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const reviewList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        reviewList.push({
          id: doc.id,
          ...data,
          orderDate: data.orderDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      setReviews(reviewList);
    } catch (error) {
      console.error('커뮤니티 리뷰 로딩 실패:', error);
      showToast?.('리뷰를 불러올 수 없습니다.');
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
    // userId와 날짜를 조합하여 고유한 익명 ID 생성
    const hash = (userId + createdAt?.getTime()).split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const index = Math.abs(hash) % 100;
    return `맛잘알${index.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="community-list-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>커뮤니티 리뷰 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-list-page">
      {/* 정렬 필터 */}
      <div className="community-header">
        <div className="sort-tabs">
          <button
            className={`sort-tab ${sortBy === 'latest' ? 'active' : ''}`}
            onClick={() => setSortBy('latest')}
          >
            최신순
          </button>
          <button
            className={`sort-tab ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            평점순
          </button>
        </div>
        <div className="review-count">
          🌍 공개 리뷰 {reviews.length}개
        </div>
      </div>

      {/* 리뷰 그리드 (인스타그램 스타일) */}
      {reviews.length === 0 ? (
        <div className="empty-community">
          <div className="empty-icon">🌟</div>
          <p>아직 공개된 리뷰가 없습니다.</p>
          <p className="empty-hint">리뷰를 공개하면 다른 사용자들과 공유할 수 있어요!</p>
        </div>
      ) : (
        <div className="community-grid">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="community-card"
              onClick={() => setSelectedReview(review)}
            >
              {/* 사진 (필수 아님) */}
              {review.photos && review.photos.length > 0 ? (
                <div className="card-image">
                  <img src={review.photos[0]} alt={review.restaurantName} />
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
                {/* 가게명 & 별점 */}
                <div className="card-header">
                  <h3 className="restaurant-name">{review.restaurantName}</h3>
                  <div className="rating-display">
                    {renderStars(review.rating)}
                    <span className="rating-number">{review.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* 리뷰 내용 미리보기 */}
                <p className="review-preview">
                  {review.content.length > 80
                    ? `${review.content.substring(0, 80)}...`
                    : review.content}
                </p>

                {/* 메타 정보 */}
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
                  {review.restaurantAddress && (
                    <>
                      <span className="separator">·</span>
                      <span className="location">
                        {review.restaurantAddress.split(' ')[1] || '위치'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <img key={idx} src={photo} alt={`${selectedReview.restaurantName} ${idx + 1}`} />
                ))}
              </div>
            )}

            {/* 상세 정보 */}
            <div className="modal-details">
              <h2 className="modal-restaurant-name">{selectedReview.restaurantName}</h2>
              <div className="modal-rating">
                {renderStars(selectedReview.rating)}
                <span className="modal-rating-number">{selectedReview.rating.toFixed(1)}</span>
              </div>

              {selectedReview.restaurantAddress && (
                <p className="modal-address">📍 {selectedReview.restaurantAddress}</p>
              )}

              <div className="modal-content-text">{selectedReview.content}</div>

              {selectedReview.foodItems && selectedReview.foodItems.length > 0 && (
                <div className="modal-food-items">
                  <strong>주문 메뉴:</strong>
                  <div className="food-tags">
                    {selectedReview.foodItems.map((item, idx) => (
                      <span key={idx} className="food-tag">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedReview.price && (
                <p className="modal-price">💰 {selectedReview.price.toLocaleString()}원</p>
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

export default CommunityList;
