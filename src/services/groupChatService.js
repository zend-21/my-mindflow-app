// 📁 그룹 채팅 서비스 (단체방 관리)
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ==================== 그룹 채팅방 생성 ====================

/**
 * 새 그룹 채팅방 생성
 * @param {string} creatorId - 생성자 UID
 * @param {string} groupName - 그룹 이름
 * @param {Array<string>} memberIds - 초대할 멤버 UID 배열
 * @param {string} groupImage - 그룹 프로필 이미지 URL (선택)
 * @returns {Promise<string>} 생성된 그룹 채팅방 ID
 */
export const createGroupChat = async (creatorId, groupName, memberIds = [], groupImage = null) => {
  try {
    // 생성자를 멤버에 포함
    const allMembers = [creatorId, ...memberIds.filter(id => id !== creatorId)];

    // 멤버 정보 가져오기
    const membersInfo = {};
    for (const memberId of allMembers) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        membersInfo[memberId] = {
          displayName: userData.displayName || '익명',
          profileImage: userData.profileImage || null,
          joinedAt: serverTimestamp()
        };
      }
    }

    const groupData = {
      groupName,
      groupImage,
      creatorId,
      members: allMembers,
      membersInfo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: serverTimestamp(),
      messageCount: 0,
      // 읽지 않은 메시지 수 (각 멤버별)
      unreadCount: Object.fromEntries(allMembers.map(id => [id, 0])),
      // 그룹 설정
      settings: {
        allowMemberInvite: true, // 멤버가 다른 사람 초대 가능 여부
        allowMemberLeave: true,  // 멤버가 스스로 나갈 수 있는지
      }
    };

    const groupRef = await addDoc(collection(db, 'groupChats'), groupData);

    // 시스템 메시지: 그룹 생성
    await addDoc(collection(db, 'groupChats', groupRef.id, 'messages'), {
      type: 'system',
      content: `${membersInfo[creatorId].displayName}님이 그룹을 만들었습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'group_created',
        actorId: creatorId
      }
    });

    console.log('✅ 그룹 채팅방 생성 완료:', groupRef.id);
    return groupRef.id;
  } catch (error) {
    console.error('❌ 그룹 채팅방 생성 실패:', error);
    throw error;
  }
};

// ==================== 멤버 관리 ====================

/**
 * 그룹에 멤버 초대
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} inviterId - 초대하는 사람 UID
 * @param {Array<string>} newMemberIds - 초대할 멤버 UID 배열
 */
export const inviteMembersToGroup = async (groupId, inviterId, newMemberIds) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인
    if (!groupData.settings.allowMemberInvite && groupData.creatorId !== inviterId) {
      throw new Error('멤버 초대 권한이 없습니다.');
    }

    // 이미 멤버인 사람 제외
    const membersToAdd = newMemberIds.filter(id => !groupData.members.includes(id));

    if (membersToAdd.length === 0) {
      console.log('⚠️ 초대할 새 멤버가 없습니다.');
      return;
    }

    // 새 멤버 정보 가져오기
    const newMembersInfo = {};
    for (const memberId of membersToAdd) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        newMembersInfo[memberId] = {
          displayName: userData.displayName || '익명',
          profileImage: userData.profileImage || null,
          joinedAt: serverTimestamp()
        };
      }
    }

    // 그룹 정보 업데이트
    await updateDoc(groupRef, {
      members: arrayUnion(...membersToAdd),
      [`membersInfo`]: {
        ...groupData.membersInfo,
        ...newMembersInfo
      },
      updatedAt: serverTimestamp()
    });

    // 초대자 정보
    const inviterName = groupData.membersInfo[inviterId]?.displayName || '알 수 없음';

    // 시스템 메시지: 멤버 초대
    for (const memberId of membersToAdd) {
      const memberName = newMembersInfo[memberId]?.displayName || '익명';
      await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
        type: 'system',
        content: `${inviterName}님이 ${memberName}님을 초대했습니다.`,
        createdAt: serverTimestamp(),
        metadata: {
          action: 'member_invited',
          actorId: inviterId,
          targetId: memberId
        }
      });
    }

    console.log('✅ 멤버 초대 완료:', membersToAdd);
  } catch (error) {
    console.error('❌ 멤버 초대 실패:', error);
    throw error;
  }
};

/**
 * 그룹에서 나가기
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 나가는 사용자 UID
 */
export const leaveGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인
    if (!groupData.settings.allowMemberLeave && groupData.creatorId !== userId) {
      throw new Error('그룹을 나갈 수 없습니다.');
    }

    const userName = groupData.membersInfo[userId]?.displayName || '익명';

    // 멤버에서 제거
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 멤버 나가기
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${userName}님이 그룹을 나갔습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'member_left',
        actorId: userId
      }
    });

    // 마지막 멤버가 나가면 그룹 삭제 (선택 사항)
    const updatedGroup = await getDoc(groupRef);
    if (updatedGroup.exists() && updatedGroup.data().members.length === 0) {
      await deleteDoc(groupRef);
      console.log('🗑️ 마지막 멤버가 나가 그룹 삭제됨');
    }

    console.log('✅ 그룹 나가기 완료:', userId);
  } catch (error) {
    console.error('❌ 그룹 나가기 실패:', error);
    throw error;
  }
};

/**
 * 멤버 강제 퇴장 (방장 전용)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} targetId - 퇴장시킬 멤버 UID
 */
export const removeMemberFromGroup = async (groupId, creatorId, targetId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('멤버를 내보낼 권한이 없습니다.');
    }

    const targetName = groupData.membersInfo[targetId]?.displayName || '익명';

    // 멤버에서 제거
    await updateDoc(groupRef, {
      members: arrayRemove(targetId),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 멤버 강제 퇴장
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${targetName}님이 그룹에서 나갔습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'member_removed',
        actorId: creatorId,
        targetId
      }
    });

    console.log('✅ 멤버 강제 퇴장 완료:', targetId);
  } catch (error) {
    console.error('❌ 멤버 강제 퇴장 실패:', error);
    throw error;
  }
};

// ==================== 메시지 관리 ====================

/**
 * 그룹 채팅방에 메시지 전송
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} senderId - 발신자 UID
 * @param {string} content - 메시지 내용
 * @param {string} type - 메시지 타입 (text, image, document, etc.)
 */
export const sendGroupMessage = async (groupId, senderId, content, type = 'text') => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 멤버 확인
    if (!groupData.members.includes(senderId)) {
      throw new Error('그룹 멤버가 아닙니다.');
    }

    // 메시지 추가
    const messageData = {
      senderId,
      content,
      type,
      createdAt: serverTimestamp(),
      reactions: {}, // 이모지 반응 (나중에 구현)
      isEdited: false,
      isDeleted: false,
      readBy: [senderId] // 읽은 사람 목록 (발신자는 자동으로 읽음 처리)
    };

    await addDoc(collection(db, 'groupChats', groupId, 'messages'), messageData);

    // 그룹 정보 업데이트
    const unreadCount = {};
    groupData.members.forEach(memberId => {
      if (memberId !== senderId) {
        unreadCount[`unreadCount.${memberId}`] = increment(1);
      }
    });

    await updateDoc(groupRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: increment(1),
      ...unreadCount
    });

    console.log('✅ 그룹 메시지 전송 완료');
  } catch (error) {
    console.error('❌ 그룹 메시지 전송 실패:', error);
    throw error;
  }
};

/**
 * 그룹 채팅 메시지 실시간 구독
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {Function} callback - 메시지 목록을 받을 콜백
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToGroupMessages = (groupId, callback) => {
  const messagesRef = collection(db, 'groupChats', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

/**
 * 읽음 처리 (unreadCount만 업데이트)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const markGroupAsRead = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    await updateDoc(groupRef, {
      [`unreadCount.${userId}`]: 0
    });
    console.log('✅ 읽음 처리 완료:', groupId);
  } catch (error) {
    console.error('❌ 읽음 처리 실패:', error);
    throw error;
  }
};

/**
 * 개별 메시지 읽음 처리 (readBy 배열에 userId 추가)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} messageId - 메시지 ID
 * @param {string} userId - 사용자 UID
 */
export const markMessageAsRead = async (groupId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'groupChats', groupId, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('❌ 메시지 읽음 처리 실패:', error);
    // 에러 발생해도 무시 (중요하지 않은 기능)
  }
};

/**
 * 모든 읽지 않은 메시지를 읽음 처리 (채팅방 입장 시)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const markAllMessagesAsRead = async (groupId, userId) => {
  try {
    // unreadCount 초기화
    await markGroupAsRead(groupId, userId);

    // 읽지 않은 메시지 찾기
    const messagesRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    // readBy에 userId가 없는 메시지만 업데이트
    const updatePromises = [];
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.readBy || !data.readBy.includes(userId)) {
        updatePromises.push(
          updateDoc(doc(db, 'groupChats', groupId, 'messages', docSnap.id), {
            readBy: arrayUnion(userId)
          })
        );
      }
    });

    await Promise.all(updatePromises);
    console.log('✅ 모든 메시지 읽음 처리 완료:', updatePromises.length);
  } catch (error) {
    console.error('❌ 모든 메시지 읽음 처리 실패:', error);
  }
};

// ==================== 그룹 목록 조회 ====================

/**
 * 내가 속한 그룹 채팅방 목록 실시간 구독
 * @param {Function} callback - 그룹 목록을 받을 콜백
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToMyGroupChats = (callback) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) {
    console.warn('⚠️ 로그인 정보가 없습니다.');
    callback([]);
    return () => {};
  }

  const groupsRef = collection(db, 'groupChats');
  const q = query(
    groupsRef,
    where('members', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(groups);
  }, (error) => {
    console.error('❌ 그룹 목록 구독 실패:', error);
    callback([]);
  });
};

/**
 * 특정 그룹 정보 조회
 * @param {string} groupId - 그룹 채팅방 ID
 * @returns {Promise<Object>} 그룹 정보
 */
export const getGroupInfo = async (groupId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error) {
    console.error('❌ 그룹 정보 조회 실패:', error);
    throw error;
  }
};

// ==================== 그룹 설정 ====================

/**
 * 그룹 이름 변경
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} newName - 새 그룹 이름
 */
export const updateGroupName = async (groupId, creatorId, newName) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('그룹 이름을 변경할 권한이 없습니다.');
    }

    await updateDoc(groupRef, {
      groupName: newName,
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지
    const creatorName = groupData.membersInfo[creatorId]?.displayName || '알 수 없음';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${creatorName}님이 그룹 이름을 "${newName}"(으)로 변경했습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'group_name_changed',
        actorId: creatorId,
        newName
      }
    });

    console.log('✅ 그룹 이름 변경 완료:', newName);
  } catch (error) {
    console.error('❌ 그룹 이름 변경 실패:', error);
    throw error;
  }
};

/**
 * 그룹 프로필 이미지 변경
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} newImage - 새 이미지 URL
 */
export const updateGroupImage = async (groupId, creatorId, newImage) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('그룹 이미지를 변경할 권한이 없습니다.');
    }

    await updateDoc(groupRef, {
      groupImage: newImage,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 그룹 이미지 변경 완료');
  } catch (error) {
    console.error('❌ 그룹 이미지 변경 실패:', error);
    throw error;
  }
};
