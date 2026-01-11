/**
 * 메모 필터링 및 정렬 유틸리티
 */

/**
 * 메모 컨텍스트에 따라 필터링 및 정렬된 메모 목록 반환
 */
export const getFilteredAndSortedMemos = (memos, memoContext) => {
  if (!memoContext || !memos || !Array.isArray(memos)) {
    return memos || [];
  }

  const { activeFolder, sortOrder, sortDirection, sharedMemoInfo = new Map() } = memoContext;

  // 1. 폴더 필터링
  let filtered = memos.filter(memo => {
    // "전체"(all)일 때는 폴더에 속하지 않은 미분류 메모만 표시 (공유된 메모 제외)
    if (activeFolder === 'all') return !memo.folderId && !sharedMemoInfo.has(memo.id);
    // "공유"(shared)일 때는 folderId가 'shared'이거나 sharedMemoInfo에 있는 메모 표시
    if (activeFolder === 'shared') return memo.folderId === 'shared' || sharedMemoInfo.has(memo.id);
    // 다른 커스텀 폴더일 때는 해당 폴더 ID와 일치하고 공유되지 않은 메모만 표시
    return memo.folderId === activeFolder && !sharedMemoInfo.has(memo.id);
  });

  // 2. 정렬
  filtered = [...filtered].sort((a, b) => {
    if (sortOrder === 'importance') {
      // 중요 문서가 하나라도 있는지 확인
      const hasImportantMemo = filtered.some(memo => memo.isImportant);

      // 중요 문서가 없으면 정렬하지 않음 (현재 순서 유지)
      if (!hasImportantMemo) {
        return 0;
      }

      // 중요도순 정렬
      const aImportant = a.isImportant ? 1 : 0;
      const bImportant = b.isImportant ? 1 : 0;

      if (sortDirection === 'desc') {
        return bImportant - aImportant || (b.date || 0) - (a.date || 0);
      } else {
        return aImportant - bImportant || (a.date || 0) - (b.date || 0);
      }
    } else if (sortOrder === 'updated') {
      // 수정순 정렬 (updatedAt이 없으면 createdAt 사용)
      const aUpdated = a.updatedAt || a.createdAt || a.date || 0;
      const bUpdated = b.updatedAt || b.createdAt || b.date || 0;

      if (sortDirection === 'desc') {
        return bUpdated - aUpdated;
      } else {
        return aUpdated - bUpdated;
      }
    } else {
      // 등록순 정렬 (date 기준)
      if (sortDirection === 'desc') {
        return (b.date || 0) - (a.date || 0);
      } else {
        return (a.date || 0) - (b.date || 0);
      }
    }
  });

  return filtered;
};
