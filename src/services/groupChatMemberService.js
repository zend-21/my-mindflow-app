// 📁 그룹 채팅 멤버 관리 서비스
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
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getUserInfo, getActiveMemberCount } from './groupChatUtils';
import { sendSystemMessage } from './groupChatMessageService';

// ==================== 멤버 초대 ====================

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

    // 차단 확인
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
        const userInfo = await getUserInfo(memberId);
        blockedNames.push(userInfo.displayName);
      }

      throw new Error(`BLOCKED_BY_YOU:${blockedNames.join(', ')}`);
    }

    // 차단한 사람들은 초대 목록에서 제외
    membersToAdd = membersToAdd.filter(id => !blockedByInviter.includes(id));

    // 모든 멤버 정보 가져오기 (차단 여부와 관계없이 모두 pending 상태)
    const newMembersInfo = {};
    for (const memberId of membersToAdd) {
      const userInfo = await getUserInfo(memberId);

      // 차단한 사람도 pending으로 추가 (차단 사실을 노출하지 않음)
      newMembersInfo[memberId] = {
        ...userInfo,
        joinedAt: serverTimestamp(),
        status: 'pending',
        invitedBy: inviterId,
        // 내부적으로만 차단 여부 기록 (UI에는 노출하지 않음)
        isBlockedInvite: blockedMembers.includes(memberId)
      };
    }

    // 강퇴 목록에 있는 멤버들 확인 (재초대 시 강퇴 목록에서 제거 필요)
    const kickedMembersToRemove = membersToAdd.filter(
      id => groupData.kickedUsers && groupData.kickedUsers.includes(id)
    );

    console.log('🔄 [멤버 초대] 강퇴 목록 확인:', {
      kickedUsers: groupData.kickedUsers,
      membersToAdd: membersToAdd,
      kickedMembersToRemove: kickedMembersToRemove
    });

    // 그룹 정보 업데이트 (모든 멤버를 pending으로 추가)
    const updateData = {
      members: arrayUnion(...membersToAdd),
      [`membersInfo`]: {
        ...groupData.membersInfo,
        ...newMembersInfo
      },
      updatedAt: serverTimestamp()
    };

    // 강퇴 목록에서 제거 (재초대된 멤버들)
    if (kickedMembersToRemove.length > 0) {
      updateData.kickedUsers = arrayRemove(...kickedMembersToRemove);
      console.log('✅ [멤버 초대] 강퇴 목록에서 제거:', kickedMembersToRemove);
    }

    await updateDoc(groupRef, updateData);
    console.log('✅ [멤버 초대] Firestore 업데이트 완료');

    // 초대자 정보
    const inviterName = groupData.membersInfo[inviterId]?.displayName || '알 수 없음';

    // 시스템 메시지: 모든 멤버 초대 (차단 여부와 관계없이 동일하게 표시)
    for (const memberId of membersToAdd) {
      const memberName = newMembersInfo[memberId]?.displayName || '익명';
      await sendSystemMessage(groupId, `${inviterName}님이 ${memberName}님을 초대했습니다.`, {
        action: 'member_invited',
        actorId: inviterId,
        targetId: memberId
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

// ==================== 멤버 나가기/제거 ====================

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

    const memberInfo = groupData.membersInfo[userId];
    const userName = memberInfo?.displayName || '익명';

    // 워크스페이스 코드 가져오기 (membersInfo에 없으면 users 컬렉션에서 조회)
    let wsCode = memberInfo?.wsCode || memberInfo?.workspaceCode || '';
    if (!wsCode) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          wsCode = userDoc.data().wsCode || '';
        }
      } catch (e) {
        console.warn('워크스페이스 코드 조회 실패:', e);
      }
    }
    // WS- 접두어 제거하여 6자리만 표시
    const wsCodeDisplay = wsCode ? wsCode.replace('WS-', '') : '';

    // 멤버에서 제거
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 멤버 나가기 (워크스페이스 코드 포함)
    const leaveMessage = `${userName}님(${wsCodeDisplay})이 방을 나갔습니다`;
    await sendSystemMessage(groupId, leaveMessage, {
      action: 'member_left',
      actorId: userId
    });

    // 마지막 active 멤버가 나가면 그룹 삭제 (선택 사항)
    const updatedGroup = await getDoc(groupRef);
    if (updatedGroup.exists()) {
      const updatedData = updatedGroup.data();
      const activeMemberCount = getActiveMemberCount(updatedData);

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
 * 멤버 강제 퇴장 (방장 또는 강퇴 권한이 있는 부방장)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} actorId - 강퇴를 실행하는 사람 UID (방장 또는 부방장)
 * @param {string} targetId - 퇴장시킬 멤버 UID
 */
export const removeMemberFromGroup = async (groupId, actorId, targetId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 권한 확인 (방장 또는 강퇴 권한이 있는 부방장)
    const isCreator = groupData.creatorId === actorId;
    const subManagerInfo = groupData.subManagers?.[actorId];
    const hasKickPermission = subManagerInfo?.permissions?.includes('kick_member');

    if (!isCreator && !hasKickPermission) {
      throw new Error('멤버를 내보낼 권한이 없습니다.');
    }

    // 부방장은 방장이나 다른 부방장을 강퇴할 수 없음
    if (!isCreator) {
      const isTargetCreator = groupData.creatorId === targetId;
      const isTargetSubManager = !!groupData.subManagers?.[targetId];

      if (isTargetCreator) {
        throw new Error('방장은 강퇴할 수 없습니다.');
      }
      if (isTargetSubManager) {
        throw new Error('부방장은 다른 부방장을 강퇴할 수 없습니다.');
      }
    }

    const actorName = groupData.membersInfo[actorId]?.displayName || '익명';
    const targetName = groupData.membersInfo[targetId]?.displayName || '익명';

    // 멤버에서 제거 및 강퇴 목록에 추가
    await updateDoc(groupRef, {
      members: arrayRemove(targetId),
      kickedUsers: arrayUnion(targetId), // 강퇴 목록에 추가 (채팅 목록에서 숨김)
      updatedAt: serverTimestamp()
    });

    // 시스템 메시지: 멤버 강제 퇴장 (누구에 의해 강퇴되었는지 표시)
    await sendSystemMessage(groupId, `${actorName}님에 의해 ${targetName}님이 강퇴되었습니다.`, {
      action: 'member_kicked',
      actorId: actorId,
      targetId
    });

    console.log('✅ 멤버 강제 퇴장 완료:', targetId, '강퇴한 사람:', actorId);
  } catch (error) {
    console.error('❌ 멤버 강제 퇴장 실패:', error);
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
    await sendSystemMessage(groupId, `${userName}님이 대화에 참여했습니다.`, {
      action: 'invitation_accepted',
      userId
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
 * @param {boolean} forceJoin - 차단 확인 무시하고 강제 참여
 */
export const joinGroupByInviteCode = async (inviteCode, userId, forceJoin = false) => {
  try {
    const group = await findGroupByInviteCode(inviteCode);

    if (!group) {
      throw new Error('유효하지 않은 초대 코드입니다.');
    }

    // 공개방 확인 (비공개방은 초대 코드 사용 불가)
    if (!group.isPublic) {
      throw new Error('비공개방은 초대 코드로 참여할 수 없습니다.');
    }

    // 이미 멤버인지 확인
    if (group.members.includes(userId)) {
      const myMemberInfo = group.membersInfo[userId];
      const status = myMemberInfo?.status;

      // isBlockedInvite가 true면 초대 코드가 보이지 않아야 함
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
    const userInfo = await getUserInfo(userId);

    const newMemberInfo = {
      ...userInfo,
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
    await sendSystemMessage(group.id, `${newMemberInfo.displayName}님이 대화에 참여했습니다.`, {
      action: 'joined_by_invite_code',
      userId
    });

    console.log('✅ 초대 코드로 단체방 참여 완료:', userId);
    return { success: true, groupId: group.id, message: '단체방에 참여했습니다.' };
  } catch (error) {
    console.error('❌ 초대 코드로 단체방 참여 실패:', error);
    throw error;
  }
};

// ==================== 메시지 차단 (Mute) ====================

/**
 * 특정 사용자의 메시지 차단 (이 채팅방에서만)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} myUserId - 내 UID
 * @param {string} targetUserId - 차단할 사용자 UID
 */
export const muteUserInGroup = async (groupId, myUserId, targetUserId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    const groupData = groupDoc.data();

    // 내가 멤버인지 확인
    if (!groupData.members.includes(myUserId)) {
      throw new Error('이 채팅방의 멤버가 아닙니다.');
    }

    // membersInfo에 mutedUsers 배열 추가/업데이트
    const myMemberInfo = groupData.membersInfo[myUserId] || {};
    const currentMutedUsers = myMemberInfo.mutedUsers || [];

    if (currentMutedUsers.includes(targetUserId)) {
      console.log('⚠️ 이미 차단된 사용자입니다.');
      return { success: true, alreadyMuted: true };
    }

    await updateDoc(groupRef, {
      [`membersInfo.${myUserId}.mutedUsers`]: arrayUnion(targetUserId),
      updatedAt: serverTimestamp()
    });

    console.log('✅ 사용자 메시지 차단 완료:', targetUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ 사용자 메시지 차단 실패:', error);
    throw error;
  }
};

/**
 * 특정 사용자의 메시지 차단 해제
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} myUserId - 내 UID
 * @param {string} targetUserId - 차단 해제할 사용자 UID
 */
export const unmuteUserInGroup = async (groupId, myUserId, targetUserId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('그룹을 찾을 수 없습니다.');
    }

    await updateDoc(groupRef, {
      [`membersInfo.${myUserId}.mutedUsers`]: arrayRemove(targetUserId),
      updatedAt: serverTimestamp()
    });

    console.log('✅ 사용자 메시지 차단 해제 완료:', targetUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ 사용자 메시지 차단 해제 실패:', error);
    throw error;
  }
};

/**
 * 내가 차단한 사용자 목록 가져오기 (이 채팅방에서)
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} myUserId - 내 UID
 * @returns {Promise<Array<string>>} 차단한 사용자 ID 배열
 */
export const getMutedUsersInGroup = async (groupId, myUserId) => {
  try {
    const groupRef = doc(db, 'groupChats', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return [];
    }

    const groupData = groupDoc.data();
    const myMemberInfo = groupData.membersInfo?.[myUserId];

    return myMemberInfo?.mutedUsers || [];
  } catch (error) {
    console.error('❌ 차단 사용자 목록 조회 실패:', error);
    return [];
  }
};

/**
 * 특정 사용자가 내가 차단한 사용자인지 확인
 * @param {string} groupId - 그룹 채팅방 ID
 * @param {string} myUserId - 내 UID
 * @param {string} targetUserId - 확인할 사용자 UID
 * @returns {Promise<boolean>}
 */
export const isUserMutedInGroup = async (groupId, myUserId, targetUserId) => {
  try {
    const mutedUsers = await getMutedUsersInGroup(groupId, myUserId);
    return mutedUsers.includes(targetUserId);
  } catch (error) {
    console.error('❌ 차단 여부 확인 실패:', error);
    return false;
  }
};
