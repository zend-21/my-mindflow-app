// 📁 그룹 채팅 서비스 (Core - 그룹 생성, 설정, 목록 조회)
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUsersInfo, generateInviteCode, getActiveMemberCount } from './groupChatUtils';
import { sendSystemMessage } from './groupChatMessageService';

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
    const usersInfo = await getUsersInfo(allMembers);

    const membersInfo = {};
    for (const memberId of allMembers) {
      const isCreator = memberId === creatorId;
      // ⚠️ usersInfo[memberId]가 undefined인 경우 기본값 사용
      const userInfo = usersInfo[memberId] || { displayName: '익명', profileImage: null };
      membersInfo[memberId] = {
        ...userInfo,
        joinedAt: serverTimestamp(),
        status: isCreator ? 'active' : 'pending', // 방장은 active, 나머지는 pending
        invitedBy: creatorId
      };
    }

    // 초대 코드 생성 (공개방만)
    const inviteCode = isPublic ? generateInviteCode() : null;

    const groupData = {
      groupName,
      groupImage,
      creatorId,
      members: allMembers,
      membersInfo,
      isPublic, // 공개/비공개 여부
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
    await sendSystemMessage(groupRef.id, `${membersInfo[creatorId].displayName}님이 그룹을 만들었습니다.`, {
      action: 'group_created',
      actorId: creatorId
    });

    console.log('✅ 그룹 채팅방 생성 완료:', groupRef.id);
    return groupRef.id;
  } catch (error) {
    console.error('❌ 그룹 채팅방 생성 실패:', error);
    throw error;
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

    // 차단, 강퇴, 거부 필터링
    const filteredGroups = groups.filter(group => {
      const myMemberInfo = group.membersInfo?.[userId];
      const isKicked = group.kickedUsers?.includes(userId);

      // 강퇴 목록에 있으면 숨김
      if (isKicked) {
        return false;
      }

      // membersInfo에 없으면 표시 안 함
      if (!myMemberInfo) {
        return false;
      }

      // isBlockedInvite가 true면 숨김 (차단한 사용자의 초대)
      if (myMemberInfo.isBlockedInvite === true) {
        return false;
      }

      // 초대를 거부한 경우 숨김
      if (myMemberInfo.status === 'rejected') {
        console.log(`⚠️ [그룹 필터링] 초대 거부됨 - 숨김: ${group.groupName}`);
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

    // 삭제 전 시스템 메시지 전송 (다른 멤버들에게 알림)
    await sendSystemMessage(groupId, `${creatorName}님이 단체방을 삭제했습니다. 10초 후 방이 삭제됩니다.`, {
      action: 'group_deleted',
      actorId: creatorId,
      groupName, // 그룹 이름 포함
      deleterName: creatorName, // 삭제자 이름 포함
      countdown: 10 // 카운트다운 시간 (초)
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
    await sendSystemMessage(groupId, `${creatorName}님이 그룹 이름을 변경했습니다.`, {
      action: 'group_name_changed',
      actorId: creatorId,
      newName
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
      updateData.inviteCode = generateInviteCode();
    }

    // 비공개방으로 변경 시 초대 코드 제거
    if (!isPublic && groupData.inviteCode) {
      updateData.inviteCode = null;
    }

    await updateDoc(groupRef, updateData);

    // 시스템 메시지
    const creatorName = groupData.membersInfo[creatorId]?.displayName || '방장';
    const roomTypeText = isPublic ? '공개방' : '비공개방';
    await sendSystemMessage(groupId, `${creatorName}님이 방을 ${roomTypeText}으로 변경했습니다.`, {
      action: 'room_type_changed',
      actorId: creatorId,
      isPublic
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
    await sendSystemMessage(groupId, `${newCreatorName}님이 ${currentCreatorName}님으로부터 방장 권한을 위임받았습니다`, {
      action: 'ownership_transferred',
      fromUserId: currentCreatorId,
      toUserId: newCreatorId
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
    await sendSystemMessage(groupId, `${creatorName}님이 ${subManagerName}님을 부방장으로 임명했습니다.`, {
      action: 'sub_manager_appointed',
      actorId: creatorId,
      targetId: subManagerId,
      permissions: permissions
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
    await sendSystemMessage(groupId, `${creatorName}님이 ${subManagerName}님의 부방장 권한을 해제했습니다.`, {
      action: 'sub_manager_removed',
      actorId: creatorId,
      targetId: subManagerId
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

// ==================== 그룹 채팅방 실시간 구독 ====================

/**
 * 그룹 채팅방 데이터 실시간 구독
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {function} callback - 업데이트 시 호출될 콜백 (groupData)
 * @returns {function} 구독 해제 함수
 */
export const subscribeToGroupRoom = (groupId, callback) => {
  const groupRef = doc(db, 'groupChats', groupId);

  return onSnapshot(groupRef, (docSnap) => {
    if (docSnap.exists()) {
      const groupData = {
        id: docSnap.id,
        ...docSnap.data(),
        type: 'group'
      };
      callback(groupData);
    }
  }, (error) => {
    console.error('❌ 그룹 채팅방 구독 오류:', error);
  });
};

// ==================== 레거시 함수 (하위 호환성) ====================
// 다른 파일로 이동된 함수들을 재-export하여 기존 import가 깨지지 않도록 함

// Member management (groupChatMemberService.js로 이동)
export {
  inviteMembersToGroup,
  leaveGroup,
  removeMemberFromGroup,
  findGroupByInviteCode,
  checkBlockedMembersInGroup,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  joinGroupByInviteCode,
  muteUserInGroup,
  unmuteUserInGroup,
  getMutedUsersInGroup
} from './groupChatMemberService';

// Message management (groupChatMessageService.js로 이동)
export {
  sendGroupMessage,
  subscribeToGroupMessages,
  markGroupAsRead,
  enterGroupRoom,
  exitGroupRoom,
  markMessageAsRead,
  markAllMessagesAsRead
} from './groupChatMessageService';
