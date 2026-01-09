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
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { enterRoom, exitRoom, createMarkAsReadDebounced } from './messageService';

// ==================== 그룹 채팅방 생성 ====================

/**
 * 새 그룹 채팅방 생성
 * @param {string} creatorId - 생성자 UID
 * @param {string} groupName - 그룹 이름
 * @param {Array<string>} memberIds - 초대할 멤버 UID 배열
 * @param {string} groupImage - 그룹 프로필 이미지 URL (선택)
 * @param {boolean} isPublic - 공개방 여부 (기본값: false - 비공개방)
 * @returns {Promise<string>} 생성된 그룹 채팅방 ID
 */
export const createGroupChat = async (creatorId, groupName, memberIds = [], groupImage = null, isPublic = false) => {
  try {
    // 생성자를 멤버에 포함
    const allMembers = [creatorId, ...memberIds.filter(id => id !== creatorId)];

    // 멤버 정보 가져오기
    const membersInfo = {};
    for (const memberId of allMembers) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isCreator = memberId === creatorId;

        // 닉네임 가져오기 (앱 내 설정 우선)
        const nicknameDoc = await getDoc(doc(db, 'nicknames', memberId));
        const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

        membersInfo[memberId] = {
          displayName: nickname || userData.displayName || '익명',
          profileImage: userData.profileImage || null,
          joinedAt: serverTimestamp(),
          status: isCreator ? 'active' : 'pending', // 방장은 active, 나머지는 pending
          invitedBy: creatorId
        };
      }
    }

    // 초대 코드 생성 (공개방만)
    const inviteCode = isPublic ? `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null;

    const groupData = {
      groupName,
      groupImage,
      creatorId,
      members: allMembers,
      membersInfo,
      isPublic, // 🆕 공개/비공개 여부
      inviteCode, // 공개방만 초대 코드 생성
      kickedUsers: [], // 강퇴된 사용자 목록 (채팅 목록에서 숨김용)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: serverTimestamp(),
      messageCount: 0,
      // 읽지 않은 메시지 수 (각 멤버별)
      unreadCount: Object.fromEntries(allMembers.map(id => [id, 0])),
      // 그룹 설정
      settings: {
        allowMemberInvite: !isPublic, // 비공개방만 멤버 초대 허용 (기본값)
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
    let membersToAdd = newMemberIds.filter(id => !groupData.members.includes(id));

    if (membersToAdd.length === 0) {
      console.log('⚠️ 초대할 새 멤버가 없습니다.');
      return;
    }

    // 🚫 차단 확인
    // 1. 초대하는 사람이 초대받는 사람을 차단했는지 확인 (초대자가 차단함)
    // 2. 초대받는 사람이 초대하는 사람을 차단했는지 확인 (피초대자가 차단함)
    const blockedByInviter = []; // 초대자가 차단한 사람들
    const blockedMembers = []; // 피초대자가 초대자를 차단한 경우

    for (const memberId of membersToAdd) {
      // 1. 초대자가 해당 멤버를 차단했는지 확인
      const inviterBlockDoc = await getDoc(doc(db, 'users', inviterId, 'blockedUsers', memberId));
      if (inviterBlockDoc.exists()) {
        blockedByInviter.push(memberId);
        console.log(`⚠️ ${inviterId}가 ${memberId}를 차단함 - 초대 불가`);
        continue;
      }

      // 2. 피초대자가 초대자를 차단했는지 확인
      const memberBlockDoc = await getDoc(doc(db, 'users', memberId, 'blockedUsers', inviterId));
      if (memberBlockDoc.exists()) {
        blockedMembers.push(memberId);
        console.log(`🔇 ${memberId}가 ${inviterId}를 차단함 (조용히 처리)`);
      }
    }

    // 초대자가 차단한 사람이 있으면 에러 반환 (모달 표시용)
    if (blockedByInviter.length > 0) {
      const blockedNames = [];
      for (const memberId of blockedByInviter) {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          const nicknameDoc = await getDoc(doc(db, 'nicknames', memberId));
          const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;
          blockedNames.push(nickname || userDoc.data().displayName || '익명');
        }
      }

      throw new Error(`BLOCKED_BY_YOU:${blockedNames.join(', ')}`);
    }

    // 차단한 사람들은 초대 목록에서 제외
    membersToAdd = membersToAdd.filter(id => !blockedByInviter.includes(id));

    // 모든 멤버 정보 가져오기 (차단 여부와 관계없이 모두 pending 상태)
    const newMembersInfo = {};
    for (const memberId of membersToAdd) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // 닉네임 가져오기 (앱 내 설정 우선)
        const nicknameDoc = await getDoc(doc(db, 'nicknames', memberId));
        const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

        // 차단한 사람도 pending으로 추가 (차단 사실을 노출하지 않음)
        newMembersInfo[memberId] = {
          displayName: nickname || userData.displayName || '익명',
          profileImage: userData.profileImage || null,
          joinedAt: serverTimestamp(),
          status: 'pending',
          // 내부적으로만 차단 여부 기록 (UI에는 노출하지 않음)
          isBlockedInvite: blockedMembers.includes(memberId)
        };
      }
    }

    // 그룹 정보 업데이트 (모든 멤버를 pending으로 추가)
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

    // 시스템 메시지: 모든 멤버 초대 (차단 여부와 관계없이 동일하게 표시)
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
    if (blockedMembers.length > 0) {
      console.log('🔇 차단한 사용자 (조용히 처리):', blockedMembers);
    }
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
      content: `${userName}님이 방을 나갔습니다`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'member_left',
        actorId: userId
      }
    });

    // 마지막 active 멤버가 나가면 그룹 삭제 (선택 사항)
    const updatedGroup = await getDoc(groupRef);
    if (updatedGroup.exists()) {
      const updatedData = updatedGroup.data();
      const activeMemberCount = updatedData.membersInfo
        ? Object.values(updatedData.membersInfo).filter(memberInfo => memberInfo.status === 'active').length
        : 0;

      if (activeMemberCount === 0) {
        await deleteDoc(groupRef);
        console.log('🗑️ 마지막 active 멤버가 나가 그룹 삭제됨');
      }
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

    // 멤버에서 제거 및 강퇴 목록에 추가
    await updateDoc(groupRef, {
      members: arrayRemove(targetId),
      kickedUsers: arrayUnion(targetId), // 강퇴 목록에 추가 (채팅 목록에서 숨김)
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 멤버 강제 퇴장
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${targetName}님이 강퇴되었습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'member_kicked',
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

    // ✅ 항상 최신 그룹 데이터 읽기 (inRoom 상태 실시간 반영 - 1:1과 동일)
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
    // readBy 초기화: 발신자 + 현재 방에 있는 모든 사람
    const initialReadBy = [senderId];
    groupData.members.forEach(memberId => {
      if (memberId !== senderId && groupData.inRoom?.[memberId] === true) {
        initialReadBy.push(memberId);
      }
    });

    const messageData = {
      senderId,
      content,
      type,
      createdAt: serverTimestamp(),
      reactions: {}, // 이모지 반응 (나중에 구현)
      isEdited: false,
      isDeleted: false,
      readBy: initialReadBy // 읽은 사람 목록 (발신자 + 방에 있는 사람들)
    };

    await addDoc(collection(db, 'groupChats', groupId, 'messages'), messageData);

    // 그룹 정보 업데이트 - active 상태이고 채팅방에 없는 멤버에게만 unreadCount 증가
    const unreadCount = {};
    const currentUnreadCount = groupData.unreadCount || {};

    console.log('📤 그룹 메시지 전송:', {
      groupId,
      senderId,
      members: groupData.members,
      inRoom: groupData.inRoom,
      currentUnreadCount,
      initialReadBy
    });

    groupData.members.forEach(memberId => {
      // 발신자가 아니고, active 상태인 멤버에게만 unreadCount 증가
      const memberInfo = groupData.membersInfo?.[memberId];
      if (memberId !== senderId && memberInfo?.status === 'active') {
        // inRoom이 true면 "채팅방을 보고 있다"고 판단 → unreadCount 증가하지 않음 (1:1과 동일)
        const isInRoom = groupData.inRoom?.[memberId] === true;

        console.log(`  멤버 ${memberId}: inRoom=${isInRoom}, unreadCount증가=${!isInRoom}`);

        // 채팅방에 없으면 unreadCount 증가
        if (!isInRoom) {
          // 현재 값을 가져와서 1 증가 (increment 대신 명시적 값 사용)
          const currentCount = currentUnreadCount[memberId] || 0;
          unreadCount[`unreadCount.${memberId}`] = currentCount + 1;
        }
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
 * 그룹 채팅 메시지 실시간 구독 (참여 시점 이후 메시지만 표시)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 현재 사용자 ID (참여 시점 확인용)
 * @param {Function} callback - 메시지 목록을 받을 콜백
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToGroupMessages = (groupId, userId, callback) => {
  // 먼저 그룹 정보를 가져와서 사용자의 joinedAt 확인
  const groupRef = doc(db, 'groupChats', groupId);

  return onSnapshot(groupRef, async (groupSnap) => {
    if (!groupSnap.exists()) {
      callback([]);
      return;
    }

    const groupData = groupSnap.data();
    const memberInfo = groupData.membersInfo?.[userId];
    const joinedAt = memberInfo?.joinedAt;

    const messagesRef = collection(db, 'groupChats', groupId, 'messages');

    let q;
    if (joinedAt) {
      // 참여 시점 이후의 메시지만 조회 (카카오톡 방식)
      q = query(
        messagesRef,
        where('createdAt', '>=', joinedAt),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      console.log(`📨 ${userId}의 참여 시점 이후 메시지만 조회`);
    } else {
      // joinedAt이 없으면 모든 메시지 조회 (하위 호환성 - 방장 등)
      q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
      console.log(`📨 모든 메시지 조회 (joinedAt 없음)`);
    }

    // 메시지 구독
    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // 최신순으로 가져왔으므로 다시 오래된순으로 정렬
      callback(messages);
    });
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
      // ✅ inRoom 업데이트 제거 - enterGroupRoom/exitGroupRoom만 제어
    });
    console.log('✅ 읽음 처리 완료:', groupId);
  } catch (error) {
    console.error('❌ 읽음 처리 실패:', error);
    throw error;
  }
};

/**
 * 채팅방 입장 (비공개방 온라인 상태 표시용)
 * 공통 messageService 사용 (unreadCount도 0으로 초기화)
 */
export const enterGroupRoom = (groupId, userId) => enterRoom('groupChats', groupId, userId, true);

/**
 * 채팅방 퇴장 (비공개방 온라인 상태 표시용)
 * 공통 messageService 사용
 */
export const exitGroupRoom = (groupId, userId) => exitRoom('groupChats', groupId, userId);

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
 * ⚡ 모든 읽지 않은 메시지를 읽음 처리 (채팅방 입장 시) - 최적화: Batch 사용
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} userId - 사용자 UID
 */
export const markAllMessagesAsRead = async (groupId, userId) => {
  try {
    // unreadCount 초기화
    await markGroupAsRead(groupId, userId);

    // ⚡ 최근 100개 메시지만 읽음 처리 (limit 추가)
    const messagesRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    // ⚡ Batch 사용으로 write 횟수 최적화 (최대 500개까지 한 번에 처리)
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.readBy || !data.readBy.includes(userId)) {
        batch.update(doc(db, 'groupChats', groupId, 'messages', docSnap.id), {
          readBy: arrayUnion(userId)
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log('✅ 모든 메시지 읽음 처리 완료:', updateCount, '개 (batch)');
    }
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

    // 🔇 차단으로 인한 초대는 필터링 (조용히 숨김)
    const filteredGroups = groups.filter(group => {
      const myMemberInfo = group.membersInfo?.[userId];

      // membersInfo에 없으면 표시 안 함
      if (!myMemberInfo) return false;

      // isBlockedInvite가 true면 숨김 (차단한 사용자의 초대)
      if (myMemberInfo.isBlockedInvite === true) {
        return false;
      }

      return true;
    });

    callback(filteredGroups);
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

// ==================== 그룹 삭제 ====================

/**
 * 그룹 채팅방 삭제 (방장 전용)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 */
export const deleteGroupChat = async (groupId, creatorId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('그룹을 삭제할 권한이 없습니다.');
    }

    const creatorName = groupData.membersInfo[creatorId]?.displayName || '방장';
    const groupName = groupData.groupName || '이름 없는 그룹';

    // ⚠️ 삭제 전 시스템 메시지 전송 (다른 멤버들에게 알림)
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${creatorName}님이 단체방을 삭제했습니다. 10초 후 방이 삭제됩니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'group_deleted',
        actorId: creatorId,
        groupName, // 그룹 이름 포함
        deleterName: creatorName, // 삭제자 이름 포함
        countdown: 10 // 카운트다운 시간 (초)
      }
    });

    // 10초 대기 (카운트다운)
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 그룹 문서 삭제
    await deleteDoc(groupRef);

    console.log('✅ 그룹 채팅방 삭제 완료:', groupId);
  } catch (error) {
    console.error('❌ 그룹 채팅방 삭제 실패:', error);
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

/**
 * 방 타입 변경 (공개/비공개 전환)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {boolean} isPublic - 새로운 공개 여부
 */
export const updateGroupRoomType = async (groupId, creatorId, isPublic) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('방 공개 설정을 변경할 권한이 없습니다.');
    }

    const updateData = {
      isPublic,
      updatedAt: serverTimestamp()
    };

    // 공개방으로 변경 시 초대 코드 생성
    if (isPublic && !groupData.inviteCode) {
      updateData.inviteCode = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // 비공개방으로 변경 시 초대 코드 제거
    if (!isPublic && groupData.inviteCode) {
      updateData.inviteCode = null;
    }

    await updateDoc(groupRef, updateData);

    // 시스템 메시지
    const creatorName = groupData.membersInfo[creatorId]?.displayName || '방장';
    const roomTypeText = isPublic ? '공개방' : '비공개방';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${creatorName}님이 방을 ${roomTypeText}으로 변경했습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'room_type_changed',
        actorId: creatorId,
        isPublic
      }
    });

    console.log(`✅ 방 타입 변경 완료: ${roomTypeText}`);
  } catch (error) {
    console.error('❌ 방 타입 변경 실패:', error);
    throw error;
  }
};

/**
 * 방장 권한 위임
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} currentCreatorId - 현재 방장 UID
 * @param {string} newCreatorId - 새 방장 UID
 */
export const transferRoomOwnership = async (groupId, currentCreatorId, newCreatorId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (현재 방장만 가능)
    if (groupData.creatorId !== currentCreatorId) {
      throw new Error('방장만 권한을 위임할 수 있습니다.');
    }

    // 새 방장이 멤버인지 확인
    if (!groupData.members.includes(newCreatorId)) {
      throw new Error('그룹 멤버에게만 방장 권한을 위임할 수 있습니다.');
    }

    // 방장 변경
    await updateDoc(groupRef, {
      creatorId: newCreatorId,
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지
    const currentCreatorName = groupData.membersInfo[currentCreatorId]?.displayName || '알 수 없음';
    const newCreatorName = groupData.membersInfo[newCreatorId]?.displayName || '알 수 없음';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${newCreatorName}님이 ${currentCreatorName}님으로부터 방장 권한을 위임받았습니다`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'ownership_transferred',
        fromUserId: currentCreatorId,
        toUserId: newCreatorId
      }
    });

    console.log('✅ 방장 권한 위임 완료:', newCreatorId);
  } catch (error) {
    console.error('❌ 방장 권한 위임 실패:', error);
    throw error;
  }
};

/**
 * 부방장 임명
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} subManagerId - 부방장으로 임명할 사용자 UID
 * @param {Array<string>} permissions - 부여할 권한 목록 (예: ['kick_member', 'manage_settings'])
 */
export const appointSubManager = async (groupId, creatorId, subManagerId, permissions = []) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('방장만 부방장을 임명할 수 있습니다.');
    }

    // 부방장으로 임명할 사용자가 멤버인지 확인
    if (!groupData.members.includes(subManagerId)) {
      throw new Error('그룹 멤버만 부방장으로 임명할 수 있습니다.');
    }

    // 현재 부방장 목록 가져오기
    const currentSubManagers = groupData.subManagers || {};

    // 부방장 수 제한 (최대 3명)
    if (Object.keys(currentSubManagers).length >= 3 && !currentSubManagers[subManagerId]) {
      throw new Error('부방장은 최대 3명까지만 임명할 수 있습니다.');
    }

    // 부방장 정보 추가
    const subManagerData = {
      userId: subManagerId,
      displayName: groupData.membersInfo[subManagerId]?.displayName || '익명',
      permissions: permissions,
      appointedAt: serverTimestamp(),
      appointedBy: creatorId
    };

    await updateDoc(groupRef, {
      [`subManagers.${subManagerId}`]: subManagerData,
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지
    const creatorName = groupData.membersInfo[creatorId]?.displayName || '방장';
    const subManagerName = groupData.membersInfo[subManagerId]?.displayName || '익명';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${creatorName}님이 ${subManagerName}님을 부방장으로 임명했습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'sub_manager_appointed',
        actorId: creatorId,
        targetId: subManagerId,
        permissions: permissions
      }
    });

    console.log('✅ 부방장 임명 완료:', subManagerId);
  } catch (error) {
    console.error('❌ 부방장 임명 실패:', error);
    throw error;
  }
};

/**
 * 부방장 해임
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} subManagerId - 해임할 부방장 UID
 */
export const removeSubManager = async (groupId, creatorId, subManagerId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('방장만 부방장을 해임할 수 있습니다.');
    }

    // 부방장 목록에서 제거
    const updatedSubManagers = { ...groupData.subManagers };
    delete updatedSubManagers[subManagerId];

    await updateDoc(groupRef, {
      subManagers: updatedSubManagers,
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지
    const creatorName = groupData.membersInfo[creatorId]?.displayName || '방장';
    const subManagerName = groupData.membersInfo[subManagerId]?.displayName || '익명';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${creatorName}님이 ${subManagerName}님의 부방장 권한을 해제했습니다.`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'sub_manager_removed',
        actorId: creatorId,
        targetId: subManagerId
      }
    });

    console.log('✅ 부방장 해임 완료:', subManagerId);
  } catch (error) {
    console.error('❌ 부방장 해임 실패:', error);
    throw error;
  }
};

/**
 * 부방장 권한 수정
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} subManagerId - 권한을 수정할 부방장 UID
 * @param {Array<string>} newPermissions - 새로운 권한 목록
 */
export const updateSubManagerPermissions = async (groupId, creatorId, subManagerId, newPermissions) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('방장만 부방장 권한을 수정할 수 있습니다.');
    }

    // 부방장인지 확인
    if (!groupData.subManagers?.[subManagerId]) {
      throw new Error('해당 사용자는 부방장이 아닙니다.');
    }

    // 권한 업데이트
    await updateDoc(groupRef, {
      [`subManagers.${subManagerId}.permissions`]: newPermissions,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 부방장 권한 수정 완료:', subManagerId);
  } catch (error) {
    console.error('❌ 부방장 권한 수정 실패:', error);
    throw error;
  }
};

// ==================== 초대 관리 ====================

/**
 * 초대 코드로 단체방 찾기
 * @param {string} inviteCode - 초대 코드
 * @returns {Promise<Object>} 단체방 정보
 */
export const findGroupByInviteCode = async (inviteCode) => {
  try {
    const groupsRef = collection(db, 'groupChats');
    const q = query(groupsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const groupDoc = snapshot.docs[0];
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    };
  } catch (error) {
    console.error('❌ 초대 코드로 단체방 찾기 실패:', error);
    throw error;
  }
};

/**
 * 그룹 내 차단한 사용자 확인
 * @param {string} groupId - 그룹 ID
 * @param {string} userId - 확인할 사용자 ID
 * @returns {Promise<Array>} 차단한 사용자 목록 [{id, displayName}]
 */
export const checkBlockedMembersInGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return [];
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];
    const blockedMembers = [];

    // 내가 차단한 사용자 목록 조회
    const blockedUsersRef = collection(db, 'users', userId, 'blockedUsers');
    const blockedSnapshot = await getDocs(blockedUsersRef);
    const blockedUserIds = blockedSnapshot.docs.map(doc => doc.id);

    // 그룹 멤버 중 차단한 사용자 찾기
    for (const memberId of members) {
      if (blockedUserIds.includes(memberId)) {
        const memberInfo = groupData.membersInfo?.[memberId];
        if (memberInfo) {
          blockedMembers.push({
            id: memberId,
            displayName: memberInfo.displayName || '익명'
          });
        }
      }
    }

    return blockedMembers;
  } catch (error) {
    console.error('❌ 그룹 내 차단 사용자 확인 실패:', error);
    return [];
  }
};

/**
 * 초대 수락
 * @param {string} groupId - 단체방 ID
 * @param {string} userId - 사용자 ID
 * @param {boolean} forceAccept - 차단 확인 무시하고 강제 수락
 */
export const acceptInvitation = async (groupId, userId, forceAccept = false) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('단체방을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 이미 멤버인지 확인
    if (!groupData.members.includes(userId)) {
      throw new Error('초대받지 않은 사용자입니다.');
    }

    // 차단한 사용자 확인 (강제 수락이 아닌 경우)
    if (!forceAccept) {
      const blockedMembers = await checkBlockedMembersInGroup(groupId, userId);
      if (blockedMembers.length > 0) {
        const blockedNames = blockedMembers.map(m => m.displayName).join(', ');
        throw new Error(`BLOCKED_MEMBERS_IN_GROUP:${blockedNames}`);
      }
    }

    // 멤버 상태를 active로 변경
    await updateDoc(groupRef, {
      [`membersInfo.${userId}.status`]: 'active',
      [`membersInfo.${userId}.acceptedAt`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 초대 수락
    const userName = groupData.membersInfo[userId]?.displayName || '익명';
    await addDoc(collection(db, 'groupChats', groupId, 'messages'), {
      type: 'system',
      content: `${userName}님이 방에 들어왔습니다`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'invitation_accepted',
        userId
      }
    });

    console.log('✅ 초대 수락 완료:', userId);
  } catch (error) {
    console.error('❌ 초대 수락 실패:', error);
    throw error;
  }
};

/**
 * 초대 거부
 * @param {string} groupId - 단체방 ID
 * @param {string} userId - 사용자 ID
 */
export const rejectInvitation = async (groupId, userId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('단체방을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 이미 멤버인지 확인
    if (!groupData.members.includes(userId)) {
      throw new Error('초대받지 않은 사용자입니다.');
    }

    // 멤버 상태를 rejected로 변경 (목록에는 유지)
    await updateDoc(groupRef, {
      [`membersInfo.${userId}.status`]: 'rejected',
      [`membersInfo.${userId}.rejectedAt`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지는 추가하지 않음 (조용히 거부)
    console.log('✅ 초대 거부 완료:', userId);
  } catch (error) {
    console.error('❌ 초대 거부 실패:', error);
    throw error;
  }
};

/**
 * 초대 취소 (방장 전용 - pending/rejected 멤버 제거)
 * @param {string} groupId - 단체방 ID
 * @param {string} creatorId - 방장 UID
 * @param {string} targetUserId - 제거할 사용자 ID
 */
export const cancelInvitation = async (groupId, creatorId, targetUserId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('단체방을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장만 가능)
    if (groupData.creatorId !== creatorId) {
      throw new Error('초대를 취소할 권한이 없습니다.');
    }

    const targetMemberInfo = groupData.membersInfo?.[targetUserId];

    // pending 또는 rejected 상태인지 확인
    if (!targetMemberInfo || (targetMemberInfo.status !== 'pending' && targetMemberInfo.status !== 'rejected')) {
      throw new Error('초대 대기중이거나 거부한 멤버만 취소할 수 있습니다.');
    }

    // members 배열에서 제거
    await updateDoc(groupRef, {
      members: arrayRemove(targetUserId),
      updatedAt: serverTimestamp()
    });

    // membersInfo에서도 완전히 제거
    const updatedMembersInfo = { ...groupData.membersInfo };
    delete updatedMembersInfo[targetUserId];

    await updateDoc(groupRef, {
      membersInfo: updatedMembersInfo,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 초대 취소 완료:', targetUserId);
  } catch (error) {
    console.error('❌ 초대 취소 실패:', error);
    throw error;
  }
};

/**
 * 초대 코드로 단체방 참여 (친구가 아닌 경우)
 * @param {string} inviteCode - 초대 코드
 * @param {string} userId - 사용자 ID
 */
export const joinGroupByInviteCode = async (inviteCode, userId, forceJoin = false) => {
  try {
    const group = await findGroupByInviteCode(inviteCode);

    if (!group) {
      throw new Error('유효하지 않은 초대 코드입니다.');
    }

    // 🆕 공개방 확인 (비공개방은 초대 코드 사용 불가)
    if (!group.isPublic) {
      throw new Error('비공개방은 초대 코드로 참여할 수 없습니다.');
    }

    // 이미 멤버인지 확인
    if (group.members.includes(userId)) {
      const myMemberInfo = group.membersInfo[userId];
      const status = myMemberInfo?.status;

      // 🔇 isBlockedInvite가 true면 초대 코드가 보이지 않아야 함
      if (myMemberInfo?.isBlockedInvite === true) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }

      if (status === 'active') {
        throw new Error('이미 참여 중인 단체방입니다.');
      } else if (status === 'pending') {
        // pending 상태면 차단 확인 후 수락 결정
        await acceptInvitation(group.id, userId, forceJoin);
        return { success: true, groupId: group.id, message: '단체방에 참여했습니다.' };
      } else if (status === 'rejected') {
        throw new Error('거부한 초대입니다. 방장에게 재초대를 요청하세요.');
      }
    }

    // 새로운 멤버로 참여하는 경우에도 차단 확인
    if (!forceJoin) {
      const blockedMembers = await checkBlockedMembersInGroup(group.id, userId);
      if (blockedMembers.length > 0) {
        const blockedNames = blockedMembers.map(m => m.displayName).join(', ');
        throw new Error(`BLOCKED_MEMBERS_IN_GROUP:${blockedNames}`);
      }
    }

    // 새로운 멤버 추가
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();

    // 닉네임 가져오기 (앱 내 설정 우선)
    const nicknameDoc = await getDoc(doc(db, 'nicknames', userId));
    const nickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

    const newMemberInfo = {
      displayName: nickname || userData.displayName || '익명',
      profileImage: userData.profileImage || null,
      joinedAt: serverTimestamp(),
      status: 'active', // 초대 코드로 참여하면 바로 active
      invitedBy: 'invite_code'
    };

    const groupRef = doc(db, 'groupChats', group.id);

    // 강퇴 목록에 있으면 제거 (재초대)
    const updateData = {
      members: arrayUnion(userId),
      [`membersInfo.${userId}`]: newMemberInfo,
      updatedAt: serverTimestamp()
    };

    if (group.kickedUsers && group.kickedUsers.includes(userId)) {
      updateData.kickedUsers = arrayRemove(userId); // 강퇴 목록에서 제거
    }

    await updateDoc(groupRef, updateData);

    // 시스템 메시지: 새 멤버 참여
    await addDoc(collection(db, 'groupChats', group.id, 'messages'), {
      type: 'system',
      content: `${newMemberInfo.displayName}님이 방에 들어왔습니다`,
      createdAt: serverTimestamp(),
      metadata: {
        action: 'joined_by_invite_code',
        userId
      }
    });

    console.log('✅ 초대 코드로 단체방 참여 완료:', userId);
    return { success: true, groupId: group.id, message: '단체방에 참여했습니다.' };
  } catch (error) {
    console.error('❌ 초대 코드로 단체방 참여 실패:', error);
    throw error;
  }
};
