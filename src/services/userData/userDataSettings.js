/**
 * User settings and profile management
 * Handles user settings and fortune profile data
 */
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { convertTimestampsToMillis, removeUndefinedValues } from './userDataHelpers';

// ========================================
// 사용자 설정 (단일 문서 - 기존 방식 유지)
// ========================================

/**
 * Firestore에서 사용자 설정 가져오기
 */
export const fetchSettingsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = convertTimestampsToMillis(docSnap.data());
      return data;
    }
    return {
      widgets: ['StatsGrid', 'QuickActions', 'RecentActivity'],
      displayCount: 5,
      nickname: null,
      profileImageType: 'avatar',
      selectedAvatarId: null,
      avatarBgColor: 'none'
    };
  } catch (error) {
    console.error('설정 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 사용자 설정 저장
 */
export const saveSettingsToFirestore = async (userId, settings) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    await setDoc(docRef, {
      ...settings,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: (settings && settings.createdAt) ? settings.createdAt : serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('설정 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 운세 프로필 데이터 (Evernote 방식)
// ========================================

/**
 * Firestore에서 운세 프로필 가져오기
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object|null>} 운세 프로필 또는 null
 */
export const fetchFortuneProfileFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const rawData = docSnap.data();
    const data = convertTimestampsToMillis(rawData);

    // ⭐ deleted 체크
    if (data.deleted === true) {
      return null;
    }

    return {
      ...data,
      deleted: data.deleted ?? false
    };
  } catch (error) {
    console.error('운세 프로필 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 운세 프로필 저장
 * @param {string} userId - 사용자 ID
 * @param {Object} fortuneProfile - 운세 프로필 객체 { name, birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, birthCity, ... }
 */
export const saveFortuneProfileToFirestore = async (userId, fortuneProfile) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');

    // ⭐ Evernote 방식: deleted: false, serverTimestamp 추가
    const dataToSave = {
      ...fortuneProfile,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: (fortuneProfile && fortuneProfile.createdAt) ? fortuneProfile.createdAt : serverTimestamp()
    };

    // undefined 값 제거 (중첩 객체 포함)
    const sanitizedData = removeUndefinedValues(dataToSave);

    await setDoc(docRef, sanitizedData, { merge: true });
    console.log('✅ 운세 프로필 Firestore 저장 완료');
  } catch (error) {
    console.error('운세 프로필 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 운세 프로필 삭제 (Soft Delete)
 * @param {string} userId - 사용자 ID
 */
export const deleteFortuneProfileFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');

    // ⭐ Soft Delete
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ 운세 프로필 soft delete 완료');
  } catch (error) {
    console.error('운세 프로필 삭제 실패:', error);
    throw error;
  }
};
