/**
 * useFirestoreSync 유틸리티 함수
 * - localStorage 헬퍼 함수
 * - 계정별 데이터 저장/로드
 */

import { getUserData, setUserData } from '../utils/userStorage';

/**
 * 계정별 localStorage 데이터 가져오기
 */
export const getAccountLocalStorage = (userId, key) => {
  if (!userId) return null;
  const data = getUserData(userId, key);
  return data ? JSON.parse(data) : null;
};

/**
 * 계정별 localStorage 데이터 저장
 */
export const setAccountLocalStorage = (userId, key, value) => {
  if (!userId) return;
  setUserData(userId, key, JSON.stringify(value));
};

/**
 * 하위 호환성을 위한 폴백 함수
 * 계정별 저장소와 기존 localStorage를 모두 확인
 */
export const getLocalStorageWithFallback = (userId, key, legacyKey) => {
  // 1. 계정별 저장소에서 먼저 확인
  const accountData = getAccountLocalStorage(userId, key);
  if (accountData !== null) return accountData;

  // 2. 기존 방식 localStorage 확인 (하위 호환)
  const legacyData = localStorage.getItem(legacyKey);
  if (legacyData) {
    try {
      const parsed = JSON.parse(legacyData);
      // 계정별 저장소로 마이그레이션
      setAccountLocalStorage(userId, key, parsed);
      return parsed;
    } catch (e) {
      console.error('localStorage parse error:', e);
    }
  }

  return null;
};
