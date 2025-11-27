// 🔐 E2EE 암호화 서비스 (Web Crypto API 사용)

/**
 * 텍스트를 AES-GCM으로 암호화
 * @param {string} plaintext - 암호화할 평문
 * @param {CryptoKey} key - 암호화 키
 * @returns {Promise<string>} Base64로 인코딩된 암호문 (IV + 암호문)
 */
export const encryptText = async (plaintext, key) => {
  try {
    if (!plaintext) return '';

    // 1. 평문을 Uint8Array로 변환
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // 2. 랜덤 IV(Initialization Vector) 생성 (12바이트)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 3. AES-GCM으로 암호화
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // 4. IV + 암호문을 결합하여 Base64로 인코딩
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return arrayBufferToBase64(combined);
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('데이터 암호화에 실패했습니다.');
  }
};

/**
 * AES-GCM으로 암호화된 텍스트를 복호화
 * @param {string} encryptedText - Base64로 인코딩된 암호문
 * @param {CryptoKey} key - 복호화 키
 * @returns {Promise<string>} 복호화된 평문
 */
export const decryptText = async (encryptedText, key) => {
  try {
    if (!encryptedText) return '';

    // 1. Base64 디코딩
    const combined = base64ToArrayBuffer(encryptedText);

    // 2. IV와 암호문 분리
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // 3. AES-GCM으로 복호화
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    // 4. Uint8Array를 문자열로 변환
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('복호화 실패:', error);
    throw new Error('데이터 복호화에 실패했습니다. 올바른 비밀번호를 입력했는지 확인하세요.');
  }
};

/**
 * 배열을 암호화 (메모, 폴더 등)
 * @param {Array} array - 암호화할 배열
 * @param {CryptoKey} key - 암호화 키
 * @param {Array<string>} fieldsToEncrypt - 암호화할 필드명 배열
 * @returns {Promise<Array>} 암호화된 배열
 */
export const encryptArray = async (array, key, fieldsToEncrypt = ['content']) => {
  if (!array || !Array.isArray(array)) return [];

  return Promise.all(
    array.map(async (item) => {
      const encryptedItem = { ...item };

      for (const field of fieldsToEncrypt) {
        if (item[field]) {
          encryptedItem[field] = await encryptText(item[field], key);
        }
      }

      return encryptedItem;
    })
  );
};

/**
 * 배열을 복호화
 * @param {Array} array - 복호화할 배열
 * @param {CryptoKey} key - 복호화 키
 * @param {Array<string>} fieldsToDecrypt - 복호화할 필드명 배열
 * @returns {Promise<Array>} 복호화된 배열
 */
export const decryptArray = async (array, key, fieldsToDecrypt = ['content']) => {
  if (!array || !Array.isArray(array)) return [];

  return Promise.all(
    array.map(async (item) => {
      const decryptedItem = { ...item };

      for (const field of fieldsToDecrypt) {
        if (item[field]) {
          try {
            decryptedItem[field] = await decryptText(item[field], key);
          } catch (error) {
            console.warn(`필드 ${field} 복호화 실패:`, error);
            decryptedItem[field] = '[복호화 실패]';
          }
        }
      }

      return decryptedItem;
    })
  );
};

/**
 * 캘린더 객체를 암호화
 * @param {Object} calendar - 캘린더 객체 { "2025-01-01": [{...}] }
 * @param {CryptoKey} key - 암호화 키
 * @returns {Promise<Object>} 암호화된 캘린더 객체
 */
export const encryptCalendar = async (calendar, key) => {
  if (!calendar || typeof calendar !== 'object') return {};

  const encryptedCalendar = {};

  for (const [date, schedules] of Object.entries(calendar)) {
    if (Array.isArray(schedules)) {
      encryptedCalendar[date] = await encryptArray(schedules, key, ['title', 'description']);
    }
  }

  return encryptedCalendar;
};

/**
 * 캘린더 객체를 복호화
 * @param {Object} calendar - 암호화된 캘린더 객체
 * @param {CryptoKey} key - 복호화 키
 * @returns {Promise<Object>} 복호화된 캘린더 객체
 */
export const decryptCalendar = async (calendar, key) => {
  if (!calendar || typeof calendar !== 'object') return {};

  const decryptedCalendar = {};

  for (const [date, schedules] of Object.entries(calendar)) {
    if (Array.isArray(schedules)) {
      decryptedCalendar[date] = await decryptArray(schedules, key, ['title', 'description']);
    }
  }

  return decryptedCalendar;
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * ArrayBuffer를 Base64로 인코딩
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64를 ArrayBuffer로 디코딩
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
