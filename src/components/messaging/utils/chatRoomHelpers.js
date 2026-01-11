import { AVATAR_GRADIENT_COLORS } from '../ChatRoom.constants';

/**
 * 시간 포맷 (메시지용)
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;

  return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * 날짜 포맷 (구분선용)
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '오늘';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '어제';
  } else {
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
};

/**
 * 날짜가 바뀌는지 체크
 */
export const shouldShowDateSeparator = (currentMsg, prevMsg) => {
  if (!prevMsg) return true;

  const currentDate = currentMsg.createdAt?.toDate?.() || new Date(currentMsg.createdAt);
  const prevDate = prevMsg.createdAt?.toDate?.() || new Date(prevMsg.createdAt);

  return currentDate.toDateString() !== prevDate.toDateString();
};

/**
 * 아바타 색상 생성
 */
export const getAvatarColor = (userId) => {
  const index = userId ? userId.charCodeAt(0) % AVATAR_GRADIENT_COLORS.length : 0;
  return AVATAR_GRADIENT_COLORS[index];
};

/**
 * 사용자 역할 확인
 */
export const getUserRole = (userId, chat, permissions) => {
  // 1:1 채팅은 역할 표시 안 함
  if (chat.type !== 'group') return null;

  // 방장 체크 (최우선)
  if (chat.createdBy === userId) {
    return { type: 'owner', icon: '🪄', label: '방장' };
  }

  // 문서 매니저 체크 (문서를 업로드한 사람)
  // 방장과 매니저가 같으면 매니저 표시 우선
  if (permissions.manager === userId) {
    return { type: 'manager', icon: '💪', label: '매니저' };
  }

  // 편집 권한자 체크
  if (permissions.editors?.includes(userId)) {
    return { type: 'editor', icon: '✏️', label: '편집권한자' };
  }

  // 일반 참여자는 아이콘 없음
  return null;
};
