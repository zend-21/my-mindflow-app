import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

/**
 * 사용자의 쉐어노트 ID 가져오기
 */
export const getUserWorkspaceId = async (userId) => {
  try {
    const workspaceId = `workspace_${userId}`;
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);

    if (workspaceDoc.exists()) {
      const wsCode = workspaceDoc.data().workspaceCode;
      // "WS-Y3T1ZM"에서 "Y3T1ZM"만 추출
      const idOnly = (wsCode?.split('-')[1] || wsCode || '').toUpperCase();
      return idOnly;
    }
    return null;
  } catch (error) {
    console.error('워크스페이스 ID 조회 실패:', error);
    return null;
  }
};

/**
 * HTML 콘텐츠에서 제목 추출
 */
export const extractTitleFromContent = (htmlContent) => {
  if (!htmlContent) return '제목 없음';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const firstLine = textContent.split('\n')[0].trim();

  return firstLine.substring(0, 30) || '제목 없음';
};

/**
 * 편집 이력 참조 경로 가져오기
 */
export const getEditHistoryRef = (chatRoomId) => {
  return `chatRooms/${chatRoomId}/sharedDocument/currentDoc/editHistory`;
};

/**
 * 편집 이력으로부터 마커 재구성
 */
export const reconstructMarkersFromEditHistory = (editHistory) => {
  if (!editHistory || editHistory.length === 0) {
    return { content: '', markers: [] };
  }

  // 최신 편집 이력 기준으로 정렬
  const sortedHistory = [...editHistory].sort((a, b) => {
    const timeA = a.editedAt?.toMillis?.() || 0;
    const timeB = b.editedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  const latestEdit = sortedHistory[0];

  if (!latestEdit) {
    return { content: '', markers: [] };
  }

  // 마커 정보 복원
  const markers = sortedHistory.map(edit => ({
    id: edit.id,
    type: edit.type,
    text: edit.text,
    comment: edit.comment,
    startOffset: edit.startOffset,
    endOffset: edit.endOffset,
    editedBy: edit.editedBy,
    editedAt: edit.editedAt,
    status: edit.status || 'pending'
  }));

  return {
    content: latestEdit.content || '',
    markers
  };
};
