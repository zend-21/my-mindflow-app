/**
 * App 전체에서 사용되는 헬퍼 함수들
 */

/**
 * 최근 활동 추가
 */
export const addActivity = (type, description, memoId, recentActivities, syncActivities) => {
  const allowedTypes = ['메모 작성', '메모 수정', '메모 삭제', '백업', '복원', '스케줄 등록', '스케줄 수정', '스케줄 삭제', '리뷰 작성', '동기화'];
  if (!allowedTypes.includes(type)) {
    return;
  }

  // 스케줄 관련은 23글자, 나머지는 20글자
  const maxLength = type.includes('스케줄') ? 23 : 20;

  // 이모지를 올바르게 카운트
  const chars = [...description];
  const trimmedDescription = chars.length > maxLength
    ? chars.slice(0, maxLength).join('') + '...'
    : description;

  const formattedDescription = `${type} - ${trimmedDescription}`;

  const now = Date.now();
  const newActivity = {
    id: String(now),
    memoId: memoId,
    type,
    description: formattedDescription,
    date: new Date(now).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  };
  const updatedActivities = [newActivity, ...recentActivities];
  syncActivities(updatedActivities.slice(0, 15));
};

/**
 * Toast 메시지 표시
 */
export const showToastMessage = (message, setToastMessage) => {
  console.log('🔔 showToast 호출됨:', message);
  setToastMessage(message);
};

/**
 * 활동 삭제
 */
export const deleteActivity = (activityId, recentActivities, syncActivities) => {
  const updatedActivities = recentActivities.filter(activity => activity.id !== activityId);
  syncActivities(updatedActivities);
};
