import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ReviewList from './ReviewList';
import ReviewWrite from './ReviewWrite';
// import CommunityList from './CommunityList'; // 나중에 사용

/**
 * 리뷰 페이지 메인 컨테이너
 * ReviewList와 ReviewWrite를 관리
 */
const ReviewPage = ({ showToast, setShowHeader }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'write' | 'edit'
  const [editReviewId, setEditReviewId] = useState(null);

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

  // 리뷰 작성/수정 완료 후 목록으로 돌아가기
  const handleReviewSaved = (message) => {
    showToast?.(message || '리뷰가 저장되었습니다!');
    handleNavigateToList();
  };

  return (
    <>
      {currentView === 'list' && (
        <ReviewList
          onNavigateToWrite={handleNavigateToWrite}
          onNavigateToEdit={handleNavigateToEdit}
          showToast={showToast}
          setShowHeader={setShowHeader}
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
