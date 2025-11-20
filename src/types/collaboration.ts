// 협업 시스템 타입 정의

// 사용자 권한 타입
export type Permission = 'read' | 'comment' | 'edit' | 'admin';

// 온라인 상태
export type OnlineStatus = 'online' | 'offline' | 'away';

// 메시지 타입
export type MessageType = 'text' | 'system' | 'edit_suggestion' | 'edit_approved' | 'edit_rejected';

// 사용자 프로필
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  onlineStatus: OnlineStatus;
  lastSeen: number;
  createdAt: number;
}

// 친구 관계
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: number;
  acceptedAt?: number;
}

// 공유 메모/스케줄
export interface SharedNote {
  id: string;
  type: 'memo' | 'schedule';
  ownerId: string;
  ownerName: string;
  title: string;
  content: string;
  originalData: any; // 원본 메모/스케줄 데이터
  createdAt: number;
  updatedAt: number;

  // 공유 참여자 및 권한
  participants: {
    [userId: string]: {
      permission: Permission;
      joinedAt: number;
      displayName: string;
      photoURL?: string;
    }
  };

  // 읽음 상태
  readBy: {
    [userId: string]: number; // timestamp
  };
}

// 수정 제안
export interface EditSuggestion {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  userPhoto?: string;

  // 수정 내용
  originalContent: string;
  suggestedContent: string;
  changes: {
    type: 'add' | 'delete' | 'modify';
    position: number;
    oldText: string;
    newText: string;
  }[];

  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  roomId: string; // sharedNote.id
  userId: string;
  userName: string;
  userPhoto?: string;

  type: MessageType;
  content: string;

  // 수정 제안 관련 (type이 edit_* 일 때)
  editSuggestionId?: string;

  createdAt: number;

  // 읽음 상태
  readBy: {
    [userId: string]: number; // timestamp
  };
}

// 실시간 타이핑 상태
export interface TypingStatus {
  roomId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

// 알림
export interface Notification {
  id: string;
  userId: string; // 받는 사람
  fromUserId: string; // 보낸 사람
  fromUserName: string;
  fromUserPhoto?: string;

  type: 'friend_request' | 'share_invite' | 'edit_suggestion' | 'edit_approved' | 'new_message' | 'mention';
  title: string;
  message: string;

  // 관련 데이터
  relatedId?: string; // noteId, friendshipId 등

  isRead: boolean;
  createdAt: number;
}
