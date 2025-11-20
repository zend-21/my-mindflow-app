// 협업방 관리 서비스
import {
  doc, getDoc, setDoc, collection, query, where, getDocs,
  updateDoc, deleteDoc, addDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  validateAndSanitize,
  isValidUserId,
  roomCreationLimiter,
  invitationLimiter,
  validateContentSize
} from '../utils/securityUtils';

/**
 * 협업방 생성
 * @param {string} memoId - 공유할 메모 ID
 * @param {string} memoTitle - 메모 제목
 * @param {string} memoContent - 메모 내용
 * @param {boolean} isPublic - 공개 방 여부
 * @param {boolean} allCanEdit - 모두 편집 가능 여부
 * @returns {string} roomId
 */
export const createCollaborationRoom = async (memoId, memoTitle, memoContent, isPublic = false, allCanEdit = false) => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: Rate Limiting (도배 방지)
  if (!roomCreationLimiter.allowRequest(userId)) {
    throw new Error('너무 많은 방을 생성했습니다. 잠시 후 다시 시도해주세요.');
  }

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 메모 제목 살균
  const titleValidation = validateAndSanitize(memoTitle, 'message');
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || '유효하지 않은 제목입니다.');
  }

  // 🛡️ 보안: 메모 내용 살균 및 검증
  const contentValidation = validateAndSanitize(memoContent, 'memo');
  if (!contentValidation.isValid) {
    throw new Error(contentValidation.error || '유효하지 않은 메모 내용입니다.');
  }

  // 🛡️ 보안: 사용자 이름 살균
  const nameValidation = validateAndSanitize(userProfile.name || '알 수 없음', 'username');
  if (!nameValidation.isValid) {
    throw new Error('유효하지 않은 사용자 이름입니다.');
  }

  const roomData = {
    // 방 기본 정보
    memoId,
    memoTitle: titleValidation.sanitized || '제목 없음',
    ownerId: userId,
    ownerName: nameValidation.sanitized,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // 메모 내용 (실시간 동기화) - 살균된 콘텐츠
    memoContent: contentValidation.sanitized,

    // 참여자 정보
    participants: [{
      userId,
      displayName: nameValidation.sanitized,
      photoURL: userProfile.picture || null,
      role: 'owner',
      joinedAt: new Date().toISOString()
    }],

    // 권한 설정
    permissions: {
      allCanEdit: allCanEdit, // 모두 편집 가능 여부 (설정값 반영)
      editableUsers: [], // 편집 권한 있는 사용자 ID 배열
    },

    // 방 상태
    status: 'active', // 'active' | 'archived' | 'locked'
    isLocked: false,
    isPublic: isPublic, // 공개 방 여부 (설정값 반영)

    // 통계
    messageCount: 0,
    lastMessageAt: null,
  };

  const roomRef = await addDoc(collection(db, 'collaborationRooms'), roomData);
  return roomRef.id;
};

/**
 * 협업방에 친구 초대
 * @param {string} roomId - 방 ID
 * @param {Array} friendIds - 초대할 친구 ID 배열
 */
export const inviteToRoom = async (roomId, friendIds) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: Rate Limiting (초대 도배 방지)
  if (!invitationLimiter.allowRequest(userId)) {
    throw new Error('너무 많은 초대를 보냈습니다. 잠시 후 다시 시도해주세요.');
  }

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 초대할 친구 수 제한 (대량 스팸 방지)
  if (!Array.isArray(friendIds) || friendIds.length === 0) {
    throw new Error('초대할 친구를 선택해주세요.');
  }
  if (friendIds.length > 50) {
    throw new Error('한 번에 최대 50명까지만 초대할 수 있습니다.');
  }

  // 🛡️ 보안: 각 친구 ID 검증
  for (const friendId of friendIds) {
    if (!isValidUserId(friendId)) {
      throw new Error(`유효하지 않은 친구 ID가 포함되어 있습니다: ${friendId}`);
    }
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 초대할 수 있습니다');

  // 초대 알림 생성
  const batch = friendIds.map(async (friendId) => {
    // 친구 정보 조회
    const friendRef = doc(db, 'users', friendId);
    const friendDoc = await getDoc(friendRef);

    if (friendDoc.exists()) {
      const friendData = friendDoc.data();

      // 🛡️ 보안: 친구 이름 살균
      const nameValidation = validateAndSanitize(friendData.displayName || '알 수 없음', 'username');

      // 초대 알림 생성
      await addDoc(collection(db, 'roomInvitations'), {
        roomId,
        inviterId: userId,
        inviteeId: friendId,
        inviteeName: nameValidation.sanitized,
        roomTitle: roomDoc.data().memoTitle,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }
  });

  await Promise.all(batch);
  return true;
};

/**
 * 초대 수락
 * @param {string} invitationId - 초대 ID
 */
export const acceptInvitation = async (invitationId) => {
  const userId = localStorage.getItem('firebaseUserId');
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  if (!userId) throw new Error('로그인이 필요합니다');

  const invitationRef = doc(db, 'roomInvitations', invitationId);
  const invitationDoc = await getDoc(invitationRef);

  if (!invitationDoc.exists()) throw new Error('초대를 찾을 수 없습니다');

  const invitation = invitationDoc.data();
  const roomRef = doc(db, 'collaborationRooms', invitation.roomId);

  // 방에 참여자 추가
  const roomDoc = await getDoc(roomRef);
  const participants = roomDoc.data().participants || [];

  participants.push({
    userId,
    displayName: userProfile.name || '알 수 없음',
    photoURL: userProfile.picture || null,
    role: 'participant',
    joinedAt: new Date().toISOString()
  });

  await updateDoc(roomRef, {
    participants,
    updatedAt: new Date().toISOString()
  });

  // 초대 상태 업데이트
  await updateDoc(invitationRef, {
    status: 'accepted',
    acceptedAt: new Date().toISOString()
  });

  return invitation.roomId;
};

/**
 * 방 나가기
 * @param {string} roomId - 방 ID
 */
export const leaveRoom = async (roomId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();
  const participants = room.participants.filter(p => p.userId !== userId);

  // 참여자가 없으면 방 폭파 또는 아카이브
  if (participants.length === 0) {
    // 옵션 1: 방 삭제
    await deleteDoc(roomRef);

    // 옵션 2: 아카이브 (주석 해제 시 사용)
    // await updateDoc(roomRef, {
    //   status: 'archived',
    //   participants: [],
    //   updatedAt: new Date().toISOString()
    // });
  } else {
    // 방장이 나가면 다음 참여자를 방장으로
    if (room.ownerId === userId && participants.length > 0) {
      participants[0].role = 'owner';
      await updateDoc(roomRef, {
        ownerId: participants[0].userId,
        ownerName: participants[0].displayName,
        participants,
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(roomRef, {
        participants,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return true;
};

/**
 * 메모 내용 업데이트 (실시간 동기화)
 * @param {string} roomId - 방 ID
 * @param {string} content - 메모 내용
 */
export const updateRoomMemo = async (roomId, content) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  // 🛡️ 보안: 사용자 ID 검증
  if (!isValidUserId(userId)) {
    throw new Error('유효하지 않은 사용자 ID입니다.');
  }

  // 🛡️ 보안: 메모 내용 살균 및 검증
  const contentValidation = validateAndSanitize(content, 'memo');
  if (!contentValidation.isValid) {
    throw new Error(contentValidation.error || '유효하지 않은 메모 내용입니다.');
  }

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');

  const room = roomDoc.data();

  // 편집 권한 확인
  const canEdit = room.ownerId === userId ||
                  room.permissions.allCanEdit ||
                  room.permissions.editableUsers.includes(userId);

  if (!canEdit) throw new Error('편집 권한이 없습니다');

  await updateDoc(roomRef, {
    memoContent: contentValidation.sanitized, // 🛡️ 살균된 콘텐츠 저장
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 편집 권한 부여/해제
 * @param {string} roomId - 방 ID
 * @param {string} userId - 대상 사용자 ID
 * @param {boolean} canEdit - 편집 가능 여부
 */
export const setEditPermission = async (roomId, targetUserId, canEdit) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 권한을 부여할 수 있습니다');

  const editableUsers = roomDoc.data().permissions.editableUsers || [];

  if (canEdit) {
    if (!editableUsers.includes(targetUserId)) {
      editableUsers.push(targetUserId);
    }
  } else {
    const index = editableUsers.indexOf(targetUserId);
    if (index > -1) {
      editableUsers.splice(index, 1);
    }
  }

  await updateDoc(roomRef, {
    'permissions.editableUsers': editableUsers,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 모두에게 편집 권한 부여/해제
 * @param {string} roomId - 방 ID
 * @param {boolean} allCanEdit - 모두 편집 가능 여부
 */
export const setAllEditPermission = async (roomId, allCanEdit) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 권한을 부여할 수 있습니다');

  await updateDoc(roomRef, {
    'permissions.allCanEdit': allCanEdit,
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 방 잠그기/열기
 * @param {string} roomId - 방 ID
 * @param {boolean} isLocked - 잠금 여부
 */
export const lockRoom = async (roomId, isLocked) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomRef = doc(db, 'collaborationRooms', roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) throw new Error('방을 찾을 수 없습니다');
  if (roomDoc.data().ownerId !== userId) throw new Error('방장만 방을 잠글 수 있습니다');

  await updateDoc(roomRef, {
    isLocked,
    status: isLocked ? 'locked' : 'active',
    updatedAt: new Date().toISOString()
  });

  return true;
};

/**
 * 내 협업방 목록 가져오기
 */
export const getMyRooms = async () => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const roomsRef = collection(db, 'collaborationRooms');
  const snapshot = await getDocs(roomsRef);

  const myRooms = [];
  snapshot.forEach(doc => {
    const room = doc.data();
    const isParticipant = room.participants?.some(p => p.userId === userId);

    if (isParticipant) {
      myRooms.push({
        id: doc.id,
        ...room
      });
    }
  });

  return myRooms.sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
};

/**
 * 방 정보 실시간 구독
 * @param {string} roomId - 방 ID
 * @param {function} callback - 업데이트 콜백
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = doc(db, 'collaborationRooms', roomId);
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};
