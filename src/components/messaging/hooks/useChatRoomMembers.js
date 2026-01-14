import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getUserNickname } from '../../../services/nicknameService';

/**
 * 채팅방 참여자 닉네임 실시간 구독 및 관리
 */
export function useChatRoomMembers(chat) {
  const [userNicknames, setUserNicknames] = useState({});
  const [userDisplayNames, setUserDisplayNames] = useState({});
  const [nicknamesLoaded, setNicknamesLoaded] = useState(false);

  useEffect(() => {
    // 닉네임 로딩 상태 초기화
    setNicknamesLoaded(false);

    // 채팅방 참여자만 수집
    const userIds = new Set();

    // 1:1 채팅인 경우
    if (chat.type !== 'group') {
      chat.participants?.forEach(userId => userIds.add(userId));
    } else {
      // 그룹 채팅인 경우 - 활성 멤버만
      Object.keys(chat.membersInfo || {}).forEach(userId => {
        if (chat.membersInfo[userId]?.status === 'active') {
          userIds.add(userId);
        }
      });
    }

    if (userIds.size === 0) {
      setNicknamesLoaded(true); // 참여자가 없으면 로딩 완료 처리
      return;
    }

    const unsubscribers = [];
    let isMounted = true;

    // 초기 닉네임 로드 (nicknames 컬렉션에서 앱 닉네임, settings에서 구글 displayName)
    const loadInitialNicknames = async () => {
      console.log('📥 초기 닉네임 로드 시작:', Array.from(userIds));

      const nicknamePromises = Array.from(userIds).map(async (userId) => {
        try {
          // 1순위: nicknames 컬렉션에서 앱 닉네임
          const nickname = await getUserNickname(userId);

          // 2순위(fallback): settings에서 구글 displayName
          let displayName = null;
          try {
            const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              displayName = settingsSnap.data().displayName || null;
            }
          } catch (settingsError) {
            console.error(`settings displayName 로드 실패 (${userId}):`, settingsError);
          }

          console.log(`✅ 초기 닉네임: ${userId} → ${nickname} (구글: ${displayName})`);
          return { userId, nickname, displayName };
        } catch (error) {
          console.error(`❌ 초기 닉네임 로드 오류 (${userId}):`, error);
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
        setNicknamesLoaded(true); // 닉네임 로드 완료
        console.log('✅ 초기 닉네임 로드 완료:', nicknamesMap);
        console.log('✅ 구글 displayName 로드 완료:', displayNamesMap);
      }
    };

    // 초기 로드 후 실시간 리스너 시작
    loadInitialNicknames().then(() => {
      if (!isMounted) return;

      console.log('🔥 닉네임 실시간 리스너 시작:', Array.from(userIds));

      // 각 참여자의 닉네임 실시간 구독 (nicknames 컬렉션)
      userIds.forEach(userId => {
        const nicknameRef = doc(db, 'nicknames', userId);

        const unsubscribeNickname = onSnapshot(nicknameRef, (docSnap) => {
          let nickname = null;
          if (docSnap.exists()) {
            nickname = docSnap.data().nickname || null;
          }
          console.log(`🔄 닉네임 실시간 업데이트: ${userId} → ${nickname}`);
          setUserNicknames(prev => ({
            ...prev,
            [userId]: nickname
          }));
        }, (error) => {
          console.error(`❌ nicknames 리스너 오류 (${userId}):`, error);
        });

        unsubscribers.push(unsubscribeNickname);

        // displayName은 settings에서 구독 (구글 displayName fallback용)
        const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
        const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            const displayName = docSnap.data().displayName || null;
            setUserDisplayNames(prev => ({
              ...prev,
              [userId]: displayName
            }));
          }
        }, (error) => {
          console.error(`❌ settings 리스너 오류 (${userId}):`, error);
        });

        unsubscribers.push(unsubscribeSettings);
      });
    });

    return () => {
      isMounted = false;
      setNicknamesLoaded(false); // 컴포넌트 언마운트 시 로딩 상태 초기화
      console.log('🧹 닉네임 실시간 리스너 해제:', unsubscribers.length, '개');
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [chat.id, chat.type, chat.participants, chat.membersInfo]);

  return {
    userNicknames,
    setUserNicknames,
    userDisplayNames,
    setUserDisplayNames,
    nicknamesLoaded
  };
}
