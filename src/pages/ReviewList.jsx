import React, { useState, useEffect, useRef } from 'react';
import { getUserReviews, searchReviews, deleteReview, toggleReviewPublic, checkCanMakePublic, setPendingStatus } from '../services/reviewService';
import { getUserInfo, RANK_INFO } from '../services/userService';
import { REVIEW_SORT_OPTIONS } from '../types/review';
import ConfirmModal from '../components/ConfirmModal';
import './ReviewList.css';

const ReviewList = ({ onNavigateToWrite, onNavigateToEdit, onNavigateToCommunity, showToast, setShowHeader }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true); // 첫 로딩
  const [sortLoading, setSortLoading] = useState(false); // 정렬 로딩
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(REVIEW_SORT_OPTIONS.LATEST);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  const contentRef = useRef(null);
  const scrollDirection = useRef(null); // 'up' | 'down' | null
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  // Pull-to-refresh 상태
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isPullRefreshActive = useRef(false);

  // 🧪 테스트 모드: D-day 강제 조작
  const [testMode, setTestMode] = useState(false);

  // 공개 보류 모달 관리
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [fakeDaysOffset, setFakeDaysOffset] = useState(0); // 음수면 과거로, 양수면 미래로
  const [deleteConfirmReviewId, setDeleteConfirmReviewId] = useState(null); // 삭제 확인 모달용

  // 사용자 정보
  const [userInfo, setUserInfo] = useState(null);

  // TODO: 실제 사용자 ID는 인증 시스템에서 가져와야 함
  const userId = 'temp_user_id';

  // 사용자 정보 로드
  useEffect(() => {
    loadUserInfo();
  }, []);

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

        const foodMatch = review.foodItems.some(food => {
          // 새 형식 { name, price } 또는 구 형식 string 모두 처리
          const foodName = typeof food === 'string' ? food : food.name;
          return foodName.toLowerCase().includes(searchQuery.toLowerCase());
        });

        const contentMatch = review.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        return nameMatch || foodMatch || contentMatch;
      });

      setFilteredReviews(filtered);
    }
  }, [searchQuery, reviews]);

  // 스크롤 기반 헤더 숨김/표시
  useEffect(() => {
    if (initialLoading) return; // 로딩 중에는 실행하지 않음

    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      // 최상단(50px 이하)에 있으면 헤더 표시
      if (currentScrollY <= 50) {
        setShowHeader?.(true);
        setIsHeaderHidden(false);
      }
      // 그 외의 경우 (스크롤이 조금이라도 내려가 있으면) 헤더 숨김
      else {
        setShowHeader?.(false);
        setIsHeaderHidden(true);
      }

      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      setShowHeader?.(true);
    };
  }, [initialLoading, setShowHeader]);

  // Pull-to-refresh 핸들러
  useEffect(() => {
    if (initialLoading) return;

    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    const PULL_THRESHOLD = 80; // 동기화 트리거 거리 (픽셀)

    const handleTouchStart = (e) => {
      // 스크롤이 최상단일 때만 pull-to-refresh 활성화
      if (scrollContainer.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPullRefreshActive.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullRefreshActive.current || isRefreshing) return;

      touchCurrentY.current = e.touches[0].clientY;
      const pullDist = touchCurrentY.current - touchStartY.current;

      // 아래로 당기는 경우에만 (위로 스크롤 방지)
      if (pullDist > 0 && scrollContainer.scrollTop === 0) {
        setIsPulling(true);
        // 최대 120px까지만 당기기 허용
        setPullDistance(Math.min(pullDist, 120));

        // 기본 스크롤 동작 방지
        if (pullDist > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullRefreshActive.current) return;

      isPullRefreshActive.current = false;

      // 임계값을 넘었으면 새로고침 트리거
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);

        try {
          // Google Drive 동기화 이벤트 발생
          window.dispatchEvent(new CustomEvent('triggerGoogleDriveSync'));

          // 리뷰 목록도 다시 로드
          await loadReviews();

          showToast?.('✅ 동기화 완료');
        } catch (error) {
          console.error('동기화 실패:', error);
          showToast?.('❌ 동기화 실패');
        } finally {
          setIsRefreshing(false);
        }
      }

      // 상태 초기화
      setIsPulling(false);
      setPullDistance(0);
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd);

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [initialLoading, pullDistance, isRefreshing, showToast]);

  const loadUserInfo = async () => {
    try {
      const info = await getUserInfo(userId);
      setUserInfo(info);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const loadReviews = async () => {
    try {
      console.log('📥 리뷰 로딩 시작 - sortBy:', sortBy, 'sortOrder:', sortOrder);

      // 첫 로딩인지 정렬 로딩인지 구분
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setSortLoading(true);
      }

      const sortConfig = getSortConfig(sortBy, sortOrder);
      console.log('⚙️ 정렬 설정:', sortConfig);

      const data = await getUserReviews(userId, sortConfig);
      console.log('✅ 리뷰 로드 완료:', data.length, '개');

      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error('❌ 리뷰 목록 로드 실패:', error);
      console.error('에러 상세:', error.message);
      showToast?.('리뷰 목록을 불러오는데 실패했습니다: ' + error.message);
      // 에러 발생 시에도 기존 데이터 유지 (빈 배열로 초기화하지 않음)
    } finally {
      setInitialLoading(false);
      setSortLoading(false);
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
    console.log('🔄 정렬 변경 요청:', newSortBy, '현재 sortBy:', sortBy, '현재 sortOrder:', sortOrder);

    if (sortBy === newSortBy) {
      // 같은 필드를 클릭하면 정렬 순서만 토글
      const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      console.log('📊 같은 필드 클릭 - 순서 토글:', newOrder);
      setSortOrder(newOrder);
    } else {
      // 다른 필드를 클릭하면 기본 정렬 순서로 설정
      console.log('📊 다른 필드 클릭 - sortBy 변경:', newSortBy);
      setSortBy(newSortBy);
      if (newSortBy === REVIEW_SORT_OPTIONS.LATEST || newSortBy === REVIEW_SORT_OPTIONS.RATING_HIGH) {
        console.log('📊 기본 정렬 순서: desc');
        setSortOrder('desc');
      } else {
        console.log('📊 기본 정렬 순서: asc');
        setSortOrder('asc');
      }
    }
  };

  const handleDelete = (reviewId) => {
    setDeleteConfirmReviewId(reviewId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmReviewId) return;

    try {
      await deleteReview(deleteConfirmReviewId, userId);
      showToast?.('리뷰가 삭제되었습니다.');
      setDeleteConfirmReviewId(null);
      loadReviews();
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      showToast?.('리뷰 삭제에 실패했습니다.');
      setDeleteConfirmReviewId(null);
    }
  };

  const handleTogglePublic = async (reviewId, currentIsPublic) => {
    const newIsPublic = !currentIsPublic;

    try {
      await toggleReviewPublic(reviewId, userId, newIsPublic);
      showToast?.(newIsPublic ? '리뷰가 공개되었습니다.' : '리뷰가 비공개로 전환되었습니다.');

      // 리뷰 목록 새로고침 (보류 상태는 toggleReviewPublic에서 자동으로 해제됨)
      loadReviews();
    } catch (error) {
      console.error('리뷰 공개 상태 변경 실패:', error);
      showToast?.(error.message || '공개 상태 변경에 실패했습니다.');
    }
  };

  // 공개하기 버튼 클릭 시 모달 표시
  const handlePublishClick = (reviewId) => {
    setSelectedReviewId(reviewId);
    setShowPublishModal(true);
  };

  // 공개 확정
  const handleConfirmPublish = async () => {
    if (selectedReviewId) {
      await handleTogglePublic(selectedReviewId, false);
      setShowPublishModal(false);
      setSelectedReviewId(null);
    }
  };

  // 보류
  const handlePendPublish = async () => {
    if (selectedReviewId) {
      try {
        // Firebase에 보류 상태 저장
        await setPendingStatus(selectedReviewId, userId, true);

        setShowPublishModal(false);
        setSelectedReviewId(null);
        showToast?.('공개를 보류했습니다.');

        // 리뷰 목록 새로고침
        loadReviews();
      } catch (error) {
        console.error('보류 처리 실패:', error);
        showToast?.('보류 처리에 실패했습니다.');
      }
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowPublishModal(false);
    setSelectedReviewId(null);
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
    const wholeNumber = Math.floor(rating);
    const decimalPart = rating - wholeNumber;
    const decimalString = decimalPart.toFixed(2).substring(2);

    return (
      <span className="star-display">
        {[...Array(5)].map((_, index) => {
          const starNumber = index + 1;

          // 꽉 찬 별
          if (starNumber <= wholeNumber) {
            return (
              <span key={index} className="star-icon filled">
                ★
              </span>
            );
          }

          // 부분적으로 채워진 별
          if (starNumber === wholeNumber + 1 && decimalPart > 0) {
            const fillPercent = parseInt(decimalString);
            return (
              <span
                key={index}
                className="star-icon partial"
                style={{ '--fill-percent': `${fillPercent}%` }}
              >
                ★
              </span>
            );
          }

          // 빈 별
          return (
            <span key={index} className="star-icon empty">
              ★
            </span>
          );
        })}
      </span>
    );
  };

  if (initialLoading) {
    return (
      <div className="review-list-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="review-list-page" ref={contentRef}>
      {/* Pull-to-refresh 인디케이터 */}
      {(isPulling || isRefreshing) && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            transform: `translateY(${isPulling ? pullDistance - 60 : 0}px)`,
            opacity: isPulling ? Math.min(pullDistance / 80, 1) : 1,
          }}
        >
          {isRefreshing ? (
            <>
              <div className="refresh-spinner"></div>
              <span>동기화 중...</span>
            </>
          ) : (
            <>
              <div className="refresh-icon" style={{ transform: `rotate(${pullDistance * 3}deg)` }}>↻</div>
              <span>{pullDistance >= 80 ? '놓아서 동기화' : '아래로 당겨서 동기화'}</span>
            </>
          )}
        </div>
      )}

      <header className={`review-list-header ${isHeaderHidden ? 'header-hidden' : ''}`}>
        <h1>내 리뷰 ({reviews.length})</h1>
        <div className="header-actions">
          {onNavigateToCommunity && (
            <button
              className="community-button"
              onClick={onNavigateToCommunity}
            >
              🌍 커뮤니티
            </button>
          )}
          <button
            className="write-button"
            onClick={onNavigateToWrite}
          >
            + 리뷰 작성
          </button>
        </div>
      </header>

      {/* 검색 및 필터 */}
      <div className={`filter-section ${isHeaderHidden ? 'header-hidden' : ''}`}>
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
            최신순 {sortBy === REVIEW_SORT_OPTIONS.LATEST ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button
            className={`sort-button ${sortBy === REVIEW_SORT_OPTIONS.RATING_HIGH ? 'active' : ''}`}
            onClick={() => handleSortChange(REVIEW_SORT_OPTIONS.RATING_HIGH)}
          >
            별점순 {sortBy === REVIEW_SORT_OPTIONS.RATING_HIGH ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className={`review-list-content ${isHeaderHidden ? 'header-hidden' : ''}`}>
        {sortLoading ? (
          <div className="sort-loading">
            <div className="loading-spinner"></div>
            <p>정렬 중...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
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
            {filteredReviews.map((review, index) => {
              // 관리자는 즉시 공개 가능
              const publicInfo = checkCanMakePublic(review, userInfo?.rank);
              const { canMakePublic, daysInfo } = publicInfo;

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
                      <div className="rating-number">({review.rating.toFixed(2)})</div>
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
                      {/* 보류 상태 */}
                      {review.isPending ? (
                        <span className="public-status-badge pending">
                          보류
                        </span>
                      ) : (
                        <span className={`public-status-badge ${review.isPublic ? 'public' : 'private'}`}>
                          {review.isPublic ? '공개' : '비공개'}
                        </span>
                      )}
                      {!review.isPublic && !review.isPending && daysInfo && (
                        <span className="remaining-days-badge">
                          {daysInfo.type === 'admin' && '👑 관리자'}
                          {daysInfo.type === 'minus' && `D-${daysInfo.value}`}
                          {daysInfo.type === 'zero' && 'D-0'}
                          {daysInfo.type === 'plus' && `D+${daysInfo.value}`}
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

                {/* 액션 버튼들 */}
                <div className="review-actions">
                  {/* 관리자는 즉시 공개 가능 - 공개 전 & 보류 상태 아닐 때 */}
                  {daysInfo?.type === 'admin' && !review.isPublic && !review.isPending && (
                    <button
                      className="toggle-public-button can-publish first-review-publish"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishClick(review.id);
                      }}
                      title="공개하기"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                      </svg>
                      공개하기
                    </button>
                  )}

                  {/* 관리자 - 보류 상태 */}
                  {daysInfo?.type === 'admin' && !review.isPublic && review.isPending && (
                    <button
                      className="toggle-public-button pending-status first-review-publish"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishClick(review.id);
                      }}
                      title="공개 보류 중 (클릭하여 다시 선택)"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                      </svg>
                      공개하기
                    </button>
                  )}

                  {/* 관리자 - 공개 완료 */}
                  {daysInfo?.type === 'admin' && review.isPublic && (
                    <button
                      className="toggle-public-button published-status first-review-publish"
                      disabled
                      title="공개됨"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                      </svg>
                      (공개함)
                    </button>
                  )}

                  {/* 일반 사용자 - 공개된 경우 비공개 버튼 */}
                  {daysInfo?.type !== 'admin' && review.isPublic && (
                    <button
                      className="toggle-public-button public-active"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('리뷰를 비공개로 전환하시겠습니까?\n커뮤니티에서 더 이상 보이지 않습니다.')) {
                          handleTogglePublic(review.id, review.isPublic);
                        }
                      }}
                      title="비공개로 전환"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      비공개로
                    </button>
                  )}

                  {/* 우측 정렬: 삭제 버튼 */}
                  <div className="actions-right">
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

      {/* 사용자 계급 표시 */}
      {userInfo && RANK_INFO[userInfo.rank] && (
        <div className="user-rank-section">
          <div
            className="user-rank-badge"
            style={{
              color: RANK_INFO[userInfo.rank].color,
              background: RANK_INFO[userInfo.rank].bgColor,
              borderColor: RANK_INFO[userInfo.rank].borderColor
            }}
          >
            <span className="rank-icon">{RANK_INFO[userInfo.rank].icon}</span>
            <span className="rank-label">{RANK_INFO[userInfo.rank].label}</span>
          </div>
        </div>
      )}

      {/* 공개/보류 선택 모달 */}
      {showPublishModal && (
        <div className="publish-modal-overlay" onClick={handleCloseModal}>
          <div className="publish-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={handleCloseModal}>
              ✕
            </button>
            <h3>리뷰 공개</h3>
            <p>리뷰를 커뮤니티에 공개하시겠습니까?</p>
            <div className="modal-buttons">
              <button className="modal-button publish" onClick={handleConfirmPublish}>
                공개
              </button>
              <button className="modal-button pend" onClick={handlePendPublish}>
                보류
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmReviewId && (
        <ConfirmModal
          message="정말 이 리뷰를 삭제하시겠습니까?"
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirmReviewId(null)}
        />
      )}

    </div>
  );
};

export default ReviewList;
