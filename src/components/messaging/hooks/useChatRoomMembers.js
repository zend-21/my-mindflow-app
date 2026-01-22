import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getUserNickname } from '../../../services/nicknameService';

/**
 * 채팅방 참여자 닉네임 실시간 구독 및 관리
 * 최적화: 사용자 ID 목록을 안정적인 문자열로 변환하여 불필요한 재구독 방지
 */
export function useChatRoomMembers(chat) {
  const [userNicknames, setUserNicknames] = useState({});
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [nicknamesLoaded, setNicknamesLoaded] = useState(false);

  // 참여자 ID를 안정적인 문자열로 변환 (객체 참조 변경에 의한 재구독 방지)
  const participantIds = useMemo(() => {
    const userIds = new Set();
    if (chat.type !== 'group') {
      chat.participants?.forEach(userId => userIds.add(userId));
    } else {
      Object.keys(chat.membersInfo || {}).forEach(userId => {
        if (chat.membersInfo[userId]?.status === 'active') {
          userIds.add(userId);
        }
      });
    }
    return Array.from(userIds).sort().join(',');
  }, [chat.type, chat.participants, chat.membersInfo]);

  useEffect(() => {
    // 닉네임 로딩 상태 초기화
    setNicknamesLoaded(false);

    const userIds = participantIds ? participantIds.split(',').filter(Boolean) : [];

    if (userIds.length === 0) {
      setNicknamesLoaded(true);
      return;
    }

    const unsubscribers = [];
    let isMounted = true;

    // 초기 닉네임 로드 (한 번에 모든 사용자 로드)
    const loadInitialNicknames = async () => {
      const nicknamePromises = userIds.map(async (userId) => {
        try {
          const nickname = await getUserNickname(userId);
          let displayName = null;
          try {
            const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              displayName = settingsSnap.data().displayName || null;
            }
          } catch (settingsError) {
            // 무시
          }
          return { userId, nickname, displayName };
        } catch (error) {
          return { userId, nickname: null, displayName: null };
        }
      });

      const results = await Promise.all(nicknamePromises);

      if (isMounted) {
        const nicknamesMap = {};
        const displayNamesMap = {};
        results.forEach(({ userId, nickname, displayName }) => {
          nicknamesMap[userId] = nickname;
          displayNamesMap[userId] = displayName;
        });
        setUserNicknames(nicknamesMap);
        setUserDisplayNames(displayNamesMap);
        setNicknamesLoaded(true);
      }
    };

    // 초기 로드 후 실시간 리스너 시작 (nicknames만 - settings 리스너 제거로 비용 절감)
    loadInitialNicknames().then(() => {
      if (!isMounted) return;

      // 닉네임만 실시간 구독 (displayName은 자주 변경되지 않으므로 초기 로드만)
      userIds.forEach(userId => {
        const nicknameRef = doc(db, 'nicknames', userId);

        const unsubscribeNickname = onSnapshot(nicknameRef, (docSnap) => {
          if (!isMounted) return;
          let nickname = null;
          if (docSnap.exists()) {
            nickname = docSnap.data().nickname || null;
          }
          setUserNicknames(prev => {
            if (prev[userId] === nickname) return prev; // 변경 없으면 스킵
            return { ...prev, [userId]: nickname };
          });
        }, (error) => {
          console.error(`❌ nicknames 리스너 오류 (${userId}):`, error);
        });

        unsubscribers.push(unsubscribeNickname);
      });
    });

    return () => {
      isMounted = false;
      setNicknamesLoaded(false);
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [chat.id, participantIds]); // participantIds는 안정적인 문자열

  return {
    userNicknames,
    setUserNicknames,
    userDisplayNames,
    setUserDisplayNames,
    nicknamesLoaded
  };
}
