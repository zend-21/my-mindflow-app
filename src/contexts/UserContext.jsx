// 🌐 사용자 정보 전역 Context (닉네임, 프사, displayName)
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, getDocs, getDoc } from 'firebase/firestore';
import { getUserNickname } from '../services/nicknameService';

const UserContext = createContext();

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userNicknames, setUserNicknames] = useState({}); // { userId: nickname }
  const [userDisplayNames, setUserDisplayNames] = useState({}); // { userId: googleDisplayName }
  const [userProfilePictures, setUserProfilePictures] = useState({}); // { userId: photoURL }
  const [userAvatarSettings, setUserAvatarSettings] = useState({}); // { userId: { icon, color } }
  const [loadedUserIds, setLoadedUserIds] = useState(new Set()); // 이미 로드된 userId 추적
  const [listeners, setListeners] = useState({}); // { userId: unsubscribe }

  /**
   * 특정 사용자의 정보를 로드하고 실시간 구독 시작
   * @param {string} userId - 로드할 사용자 ID
   */
  const loadUser = useCallback(async (userId) => {
    if (!userId || loadedUserIds.has(userId)) {
      return; // 이미 로드됨
    }

    console.log(`👤 사용자 정보 로드 시작: ${userId}`);

    // 1. nicknames 컬렉션에서 앱 닉네임 로드
    try {
      const nickname = await getUserNickname(userId);
      setUserNicknames(prev => ({ ...prev, [userId]: nickname }));
    } catch (error) {
      console.error(`❌ 닉네임 로드 오류 (${userId}):`, error);
      setUserNicknames(prev => ({ ...prev, [userId]: null }));
    }

    // 2. nicknames 컬렉션 실시간 구독
    const nicknameRef = doc(db, 'nicknames', userId);
    const unsubscribeNickname = onSnapshot(
      nicknameRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserNicknames(prev => ({ ...prev, [userId]: docSnap.data().nickname || null }));
        } else {
          setUserNicknames(prev => ({ ...prev, [userId]: null }));
        }
      },
      (error) => {
        console.error(`❌ 닉네임 리스너 오류 (${userId}):`, error);
      }
    );

    // 3. settings에서 displayName, photoURL, 아바타 설정 구독
    const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    const unsubscribeSettings = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`✅ 사용자 정보 업데이트: ${userId}`, {
            displayName: data.displayName,
            photoURL: data.photoURL
          });

          // 구글 displayName
          setUserDisplayNames(prev => ({
            ...prev,
            [userId]: data.displayName || null
          }));

          // 프로필 사진
          setUserProfilePictures(prev => ({
            ...prev,
            [userId]: data.photoURL || null
          }));

          // 아바타 설정
          if (data.selectedAvatar) {
            setUserAvatarSettings(prev => ({
              ...prev,
              [userId]: data.selectedAvatar
            }));
          }
        } else {
          console.log(`⚠️ settings 문서 없음: ${userId}`);
          setUserDisplayNames(prev => ({ ...prev, [userId]: null }));
          setUserProfilePictures(prev => ({ ...prev, [userId]: null }));
        }
      },
      (error) => {
        console.error(`❌ 사용자 정보 로드 오류 (${userId}):`, error);
      }
    );

    // 리스너 저장 (두 개의 구독을 하나의 cleanup 함수로)
    setListeners(prev => ({
      ...prev,
      [userId]: () => {
        unsubscribeNickname();
        unsubscribeSettings();
      }
    }));

    // 로드됨 표시
    setLoadedUserIds(prev => new Set([...prev, userId]));
  }, [loadedUserIds]);

  /**
   * 여러 사용자의 정보를 한 번에 로드
   * @param {Array<string>} userIds - 로드할 사용자 ID 배열
   */
  const loadUsers = useCallback((userIds) => {
    userIds.forEach(userId => loadUser(userId));
  }, [loadUser]);

  /**
   * 특정 사용자의 표시 이름 가져오기 (닉네임 → displayName → fallback)
   * @param {string} userId - 사용자 ID
   * @param {string} fallback - fallback 텍스트 (기본: '사용자')
   * @returns {string} 표시할 이름
   */
  const getUserDisplayName = useCallback((userId, fallback = '사용자') => {
    const nickname = userNicknames[userId];
    const displayName = userDisplayNames[userId];
    return nickname || displayName || fallback;
  }, [userNicknames, userDisplayNames]);

  /**
   * 특정 사용자의 프로필 사진 URL 가져오기
   * @param {string} userId - 사용자 ID
   * @returns {string|null} 프로필 사진 URL
   */
  const getUserProfilePicture = useCallback((userId) => {
    return userProfilePictures[userId] || null;
  }, [userProfilePictures]);

  /**
   * 특정 사용자의 아바타 설정 가져오기
   * @param {string} userId - 사용자 ID
   * @returns {object|null} 아바타 설정 { icon, color }
   */
  const getUserAvatarSetting = useCallback((userId) => {
    return userAvatarSettings[userId] || null;
  }, [userAvatarSettings]);

  // 컴포넌트 언마운트 시 모든 리스너 해제
  useEffect(() => {
    return () => {
      console.log('🧹 UserContext 클린업 - 모든 리스너 해제');
      Object.values(listeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [listeners]);

  const value = {
    // Raw data
    userNicknames,
    userDisplayNames,
    userProfilePictures,
    userAvatarSettings,

    // Methods
    loadUser,
    loadUsers,
    getUserDisplayName,
    getUserProfilePicture,
    getUserAvatarSetting,

    // State
    loadedUserIds
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
