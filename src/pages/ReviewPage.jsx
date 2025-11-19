import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ReviewList from './ReviewList';
import ReviewWrite from './ReviewWrite';
import CommunityList from './CommunityList';
import RestaurantDetail from './RestaurantDetail';

/**
 * 리뷰 페이지 메인 컨테이너
 * ReviewList, ReviewWrite, CommunityList, RestaurantDetail를 관리
 */
const ReviewPage = ({ showToast, setShowHeader }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'write' | 'edit' | 'community' | 'restaurantDetail'
  const [editReviewId, setEditReviewId] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const handleNavigateToWrite = () => {
    setCurrentView('write');
    setEditReviewId(null);
  };

  const handleNavigateToEdit = (reviewId) => {
    setCurrentView('edit');
    setEditReviewId(reviewId);
  };

  const handleNavigateToList = () => {
    setCurrentView('list');
    setEditReviewId(null);
  };

  const handleNavigateToCommunity = () => {
    setCurrentView('community');
  };

  const handleNavigateToRestaurant = (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    setCurrentView('restaurantDetail');
  };

  // 리뷰 작성/수정 완료 후 목록으로 돌아가기
  const handleReviewSaved = (message) => {
    showToast?.(message || '리뷰가 저장되었습니다!');
    handleNavigateToList();
  };

  return (
    <>
      {/* 내 리뷰 목록 */}
      {currentView === 'list' && (
        <ReviewList
          onNavigateToWrite={handleNavigateToWrite}
          onNavigateToEdit={handleNavigateToEdit}
          onNavigateToCommunity={handleNavigateToCommunity}
          showToast={showToast}
          setShowHeader={setShowHeader}
        />
      )}

      {/* 커뮤니티 */}
      {currentView === 'community' && (
        <CommunityList
          showToast={showToast}
          onBack={handleNavigateToList}
          onNavigateToRestaurant={handleNavigateToRestaurant}
        />
      )}

      {/* 업체 상세 */}
      {currentView === 'restaurantDetail' && selectedRestaurantId && (
        <RestaurantDetail
          restaurantId={selectedRestaurantId}
          showToast={showToast}
          onBack={handleNavigateToCommunity}
        />
      )}

      {/* Portal을 사용하여 리뷰 작성/수정 페이지를 body에 직접 렌더링 */}
      {currentView === 'write' && createPortal(
        <ReviewWrite
          onBack={handleNavigateToList}
          onSaved={handleReviewSaved}
          showToast={showToast}
        />,
        document.body
      )}

      {currentView === 'edit' && editReviewId && createPortal(
        <ReviewWrite
          reviewId={editReviewId}
          onBack={handleNavigateToList}
          onSaved={handleReviewSaved}
          showToast={showToast}
        />,
        document.body
      )}
    </>
  );
};

export default ReviewPage;
