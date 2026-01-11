import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

/**
 * 문서 권한 관리 커스텀 훅
 * 1:1 대화방과 그룹 대화방의 편집 권한을 통합 관리
 */
export function useDocumentPermissions(chatRoomId, currentUserId, chatType) {
  const [actualCanEdit, setActualCanEdit] = useState(true);
  const [actualIsManager, setActualIsManager] = useState(false);
  const [actualIsSubManager, setActualIsSubManager] = useState(false);
  const [isOneOnOneChat, setIsOneOnOneChat] = useState(false);
  const [invitePermission, setInvitePermission] = useState('managers_and_submanagers');

  useEffect(() => {
    if (!chatRoomId || !currentUserId) return;

    let isMounted = true;

    // 통합된 권한 로드 함수
    const loadDocumentPermissions = async () => {
      try {
        // 1. 대화방 정보 조회
        const roomRef = doc(db, 'chatRooms', chatRoomId);
        const roomSnap = await getDoc(roomRef);

        if (!isMounted || !roomSnap.exists()) return;

        const roomData = roomSnap.data();
        const isOneOnOne = roomData.type !== 'group' && !roomData.isGroupChat;
        setIsOneOnOneChat(isOneOnOne);

        // 2. 문서 정보 조회
        const docRef = doc(db, 'chatRooms', chatRoomId, 'sharedDocument', 'currentDoc');
        const docSnap = await getDoc(docRef);

        if (isMounted && docSnap.exists()) {
          // 문서가 존재하는 경우
          const docData = docSnap.data();
          const isDocOwner = docData.lastEditedBy === currentUserId;

          // 1:1 대화방: 모두 마커 추가 가능
          // 그룹 대화방: 문서 소유자만 편집 가능
          const canEditDoc = isOneOnOne ? true : isDocOwner;

          setActualCanEdit(canEditDoc);
          setActualIsManager(isDocOwner);

          console.log('📋 문서 기반 권한 설정:', {
            chatType: isOneOnOne ? '1:1' : '그룹',
            documentOwner: docData.lastEditedBy,
            currentUser: currentUserId,
            isDocOwner,
            canEdit: canEditDoc
          });
        } else {
          // 문서가 없는 경우: 모두 편집 가능 (누구든 문서를 불러올 수 있음)
          setActualCanEdit(true);
          setActualIsManager(true);

          console.log('📋 문서 없음 - 모두 편집 가능:', {
            chatType: isOneOnOne ? '1:1' : '그룹'
          });
        }

        // 3. 그룹 채팅인 경우 추가 권한 정보 로드 (초대 권한 등)
        if (!isOneOnOne) {
          const isActualSubManager = roomData.subManagers?.includes(currentUserId) || false;
          setActualIsSubManager(isActualSubManager);

          // 초대 권한 설정 로드
          const invitePerm = roomData.invitePermission || 'managers_and_submanagers';
          setInvitePermission(invitePerm);
        } else {
          setActualIsSubManager(false);
        }

      } catch (error) {
        if (error.code !== 'permission-denied') {
          console.error('권한 로드 오류:', error);
        }
        // 오류 시 기본값 설정
        setActualCanEdit(true);
        setActualIsManager(true);
      }
    };

    loadDocumentPermissions();

    return () => {
      isMounted = false;
    };
  }, [chatRoomId, currentUserId, chatType]);

  return {
    actualCanEdit,
    actualIsManager,
    actualIsSubManager,
    isOneOnOneChat,
    invitePermission,
    setActualCanEdit,
    setActualIsManager,
    setInvitePermission
  };
}
