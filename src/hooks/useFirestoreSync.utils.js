/**
 * useFirestoreSync 유틸리티 함수
 * - localStorage 헬퍼 함수
 * - 계정별 데이터 저장/로드
 * - TTL 기반 자동 만료 및 synced 플래그 관리
 */

import { getUserData, setUserData } from '../utils/userStorage';
import { localStorageService } from '../utils/localStorageService';

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
 * TTL 기반 저장소를 사용하며, content만 반환
 */
export const getLocalStorageWithFallback = (userId, key, legacyKey) => {
  // 1. 계정별 저장소에서 먼저 확인 (TTL 기반, content만 반환)
  const accountData = getAccountLocalStorageWithTTL(userId, key, false);
  if (accountData !== null) return accountData;

  // 2. 기존 방식 localStorage 확인 (하위 호환)
  const legacyData = localStorage.getItem(legacyKey);
  if (legacyData) {
    try {
      const parsed = JSON.parse(legacyData);
      // 계정별 저장소로 마이그레이션 (TTL 기반, synced: true)
      setAccountLocalStorageWithTTL(userId, key, parsed, { synced: true });
      return parsed;
    } catch (e) {
      console.error('localStorage parse error:', e);
    }
  }

  return null;
};

// ==========================================
// TTL 기반 localStorage 관리 함수
// ==========================================

/**
 * TTL 및 synced 플래그를 포함한 데이터 저장
 * @param {string} userId - 사용자 ID
 * @param {string} key - 저장 키
 * @param {any} value - 저장할 데이터
 * @param {object} options - { ttlDays, synced }
 */
export const setAccountLocalStorageWithTTL = (userId, key, value, options = {}) => {
  return localStorageService.save(userId, key, value, options);
};

/**
 * TTL 체크를 포함한 데이터 조회
 * @param {string} userId - 사용자 ID
 * @param {string} key - 조회 키
 * @param {boolean} includeMetadata - 메타데이터 포함 여부
 */
export const getAccountLocalStorageWithTTL = (userId, key, includeMetadata = false) => {
  return localStorageService.get(userId, key, includeMetadata);
};

/**
 * synced 플래그 업데이트
 * @param {string} userId - 사용자 ID
 * @param {string} key - 키
 * @param {boolean} synced - 동기화 상태
 */
export const markLocalStorageSynced = (userId, key, synced = true) => {
  return localStorageService.markSynced(userId, key, synced);
};

/**
 * 동기화 완료 후 데이터 삭제
 * @param {string} userId - 사용자 ID
 * @param {string} key - 키
 */
export const removeIfSynced = (userId, key) => {
  return localStorageService.removeIfSynced(userId, key);
};

/**
 * 만료 데이터 일괄 정리
 * @param {string} userId - 사용자 ID
 */
export const cleanupExpiredLocalStorage = (userId) => {
  return localStorageService.cleanupExpired(userId);
};

/**
 * 미동기화 데이터 목록 조회
 * @param {string} userId - 사용자 ID
 */
export const getUnsyncedLocalStorage = (userId) => {
  return localStorageService.getUnsyncedData(userId);
};

/**
 * 스토리지 사용량 조회
 * @param {string} userId - 사용자 ID
 */
export const getLocalStorageUsage = (userId) => {
  return localStorageService.getUsage(userId);
};
