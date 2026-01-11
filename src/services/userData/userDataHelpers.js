/**
 * Helper utilities for userDataService
 * Timestamp conversion and data sanitization functions
 */

/**
 * Firestore Timestamp 객체를 JavaScript 숫자(밀리초)로 변환하는 헬퍼 함수
 * 백그라운드에서 포그라운드로 돌아올 때 타임스탬프가 Timestamp 객체로 변환되어
 * Invalid Date가 발생하는 문제를 방지합니다.
 */
export const convertTimestampsToMillis = (data) => {
  if (!data) return data;

  const converted = { ...data };

  // createdAt 변환
  if (converted.createdAt && typeof converted.createdAt.toMillis === 'function') {
    converted.createdAt = converted.createdAt.toMillis();
  }

  // updatedAt 변환
  if (converted.updatedAt && typeof converted.updatedAt.toMillis === 'function') {
    converted.updatedAt = converted.updatedAt.toMillis();
  }

  // date 필드 변환 (메모에서 사용)
  if (converted.date && typeof converted.date.toMillis === 'function') {
    converted.date = converted.date.toMillis();
  }

  return converted;
};

/**
 * 객체에서 undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
 * @param {Object} obj - 정리할 객체
 * @returns {Object} undefined 값이 제거된 객체
 */
export const removeUndefinedValues = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      // 중첩된 객체도 재귀적으로 처리
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = removeUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};
