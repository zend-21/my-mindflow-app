// 🔑 암호화 키 관리 서비스

const ENCRYPTION_KEY_STORAGE = 'mindflow_encryption_key';
const MASTER_PASSWORD_HASH_STORAGE = 'mindflow_master_password_hash';
const RECOVERY_KEY_STORAGE = 'mindflow_recovery_key';

/**
 * 비밀번호에서 암호화 키 생성 (PBKDF2)
 * @param {string} password - 마스터 비밀번호
 * @param {Uint8Array} salt - Salt (없으면 새로 생성)
 * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>}
 */
export const deriveKeyFromPassword = async (password, salt = null) => {
  try {
    // 1. Salt 생성 (없으면)
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    // 2. 비밀번호를 키로 변환
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // 3. PBKDF2로 키 생성 키 파생
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // 4. AES-GCM 키 파생 (100,000 iterations)
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    return { key: derivedKey, salt };
  } catch (error) {
    console.error('키 파생 실패:', error);
    throw new Error('암호화 키 생성에 실패했습니다.');
  }
};

/**
 * 비밀번호 해시 생성 (검증용)
 * @param {string} password - 비밀번호
 * @returns {Promise<string>} Base64 인코딩된 해시
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
};

/**
 * 마스터 비밀번호 설정
 * @param {string} password - 마스터 비밀번호
 * @returns {Promise<{key: CryptoKey, recoveryKey: string}>}
 */
export const setupMasterPassword = async (password) => {
  try {
    // 1. 비밀번호에서 키 파생
    const { key, salt } = await deriveKeyFromPassword(password);

    // 2. 비밀번호 해시 저장 (검증용)
    const passwordHash = await hashPassword(password);
    localStorage.setItem(MASTER_PASSWORD_HASH_STORAGE, passwordHash);

    // 3. Salt를 암호화 키와 함께 저장
    const keyData = await crypto.subtle.exportKey('raw', key);
    const saltBase64 = arrayBufferToBase64(salt);

    localStorage.setItem(ENCRYPTION_KEY_STORAGE, JSON.stringify({
      key: arrayBufferToBase64(keyData),
      salt: saltBase64
    }));

    // 4. 복구 키 생성 (12단어)
    const recoveryKey = await generateRecoveryKey(key);
    localStorage.setItem(RECOVERY_KEY_STORAGE, recoveryKey);

    console.log('✅ 마스터 비밀번호 설정 완료');
    return { key, recoveryKey };
  } catch (error) {
    console.error('마스터 비밀번호 설정 실패:', error);
    throw error;
  }
};

/**
 * 마스터 비밀번호로 키 불러오기
 * @param {string} password - 마스터 비밀번호
 * @returns {Promise<CryptoKey|null>} 암호화 키 (실패 시 null)
 */
export const unlockWithPassword = async (password) => {
  try {
    // 1. 저장된 비밀번호 해시 확인
    const storedHash = localStorage.getItem(MASTER_PASSWORD_HASH_STORAGE);
    if (!storedHash) {
      console.warn('마스터 비밀번호가 설정되지 않았습니다.');
      return null;
    }

    // 2. 입력한 비밀번호 해시 비교
    const inputHash = await hashPassword(password);
    if (inputHash !== storedHash) {
      console.warn('비밀번호가 일치하지 않습니다.');
      return null;
    }

    // 3. 저장된 키 데이터 로드
    const storedData = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (!storedData) {
      console.warn('암호화 키를 찾을 수 없습니다.');
      return null;
    }

    const { key: keyBase64, salt: saltBase64 } = JSON.parse(storedData);
    const keyBuffer = base64ToArrayBuffer(keyBase64);

    // 4. CryptoKey로 import
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    console.log('✅ 마스터 비밀번호로 잠금 해제 성공');
    return cryptoKey;
  } catch (error) {
    console.error('잠금 해제 실패:', error);
    return null;
  }
};

/**
 * 복구 키로 잠금 해제
 * @param {string} recoveryKey - 12단어 복구 키
 * @returns {Promise<CryptoKey|null>}
 */
export const unlockWithRecoveryKey = async (recoveryKey) => {
  try {
    const storedRecoveryKey = localStorage.getItem(RECOVERY_KEY_STORAGE);

    if (!storedRecoveryKey) {
      console.warn('복구 키가 설정되지 않았습니다.');
      return null;
    }

    if (recoveryKey.trim() !== storedRecoveryKey) {
      console.warn('복구 키가 일치하지 않습니다.');
      return null;
    }

    // 저장된 키 데이터 로드
    const storedData = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (!storedData) {
      console.warn('암호화 키를 찾을 수 없습니다.');
      return null;
    }

    const { key: keyBase64 } = JSON.parse(storedData);
    const keyBuffer = base64ToArrayBuffer(keyBase64);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    console.log('✅ 복구 키로 잠금 해제 성공');
    return cryptoKey;
  } catch (error) {
    console.error('복구 키 잠금 해제 실패:', error);
    return null;
  }
};

/**
 * 마스터 비밀번호 변경
 * @param {string} currentPassword - 현재 비밀번호
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<boolean>} 성공 여부
 */
export const changeMasterPassword = async (currentPassword, newPassword) => {
  try {
    // 1. 현재 비밀번호 확인
    const currentKey = await unlockWithPassword(currentPassword);
    if (!currentKey) {
      console.warn('현재 비밀번호가 일치하지 않습니다.');
      return false;
    }

    // 2. 새 비밀번호로 키 재생성
    const { key: newKey, salt: newSalt } = await deriveKeyFromPassword(newPassword);

    // 3. 새 비밀번호 해시 저장
    const newPasswordHash = await hashPassword(newPassword);
    localStorage.setItem(MASTER_PASSWORD_HASH_STORAGE, newPasswordHash);

    // 4. 새 키 데이터 저장
    const keyData = await crypto.subtle.exportKey('raw', newKey);
    const saltBase64 = arrayBufferToBase64(newSalt);

    localStorage.setItem(ENCRYPTION_KEY_STORAGE, JSON.stringify({
      key: arrayBufferToBase64(keyData),
      salt: saltBase64
    }));

    // 5. 현재 세션의 암호화 키 업데이트
    setEncryptionKey(newKey);

    console.log('✅ 마스터 비밀번호 변경 완료');
    return true;
  } catch (error) {
    console.error('마스터 비밀번호 변경 실패:', error);
    return false;
  }
};

/**
 * 마스터 비밀번호가 설정되어 있는지 확인
 * @returns {boolean}
 */
export const hasMasterPassword = () => {
  return !!localStorage.getItem(MASTER_PASSWORD_HASH_STORAGE);
};

/**
 * 현재 세션에 암호화 키가 있는지 확인
 * @returns {boolean}
 */
export const isUnlocked = () => {
  return window.__encryptionKey !== undefined;
};

/**
 * 현재 세션의 암호화 키 가져오기
 * @returns {CryptoKey|null}
 */
export const getEncryptionKey = () => {
  return window.__encryptionKey || null;
};

/**
 * 세션에 암호화 키 저장
 * @param {CryptoKey} key
 */
export const setEncryptionKey = (key) => {
  window.__encryptionKey = key;
};

/**
 * 암호화 키 제거 (로그아웃)
 */
export const clearEncryptionKey = () => {
  delete window.__encryptionKey;
};

/**
 * 복구 키 생성 (12단어 형식)
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
async function generateRecoveryKey(key) {
  // 간단한 12단어 복구 키 생성
  // 실제 프로덕션에서는 BIP39 같은 표준 사용 권장
  const keyData = await crypto.subtle.exportKey('raw', key);
  const keyArray = new Uint8Array(keyData);

  const words = [];
  for (let i = 0; i < 12; i++) {
    const wordIndex = (keyArray[i * 2] << 8) | keyArray[i * 2 + 1];
    words.push(WORD_LIST[wordIndex % WORD_LIST.length]);
  }

  return words.join(' ');
}

// ========================================
// 유틸리티 함수
// ========================================

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 복구 키용 단어 목록 (2048단어 중 일부, 실제로는 전체 리스트 사용)
const WORD_LIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  // ... (실제로는 2048개의 단어 사용)
];
