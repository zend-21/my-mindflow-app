// src/utils/encryption.js
// AES-256-GCM 암호화 유틸리티

/**
 * 문자열을 ArrayBuffer로 변환
 */
const str2ab = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

/**
 * ArrayBuffer를 문자열로 변환
 */
const ab2str = (buffer) => {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
};

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
const ab2base64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

/**
 * Base64 문자열을 ArrayBuffer로 변환
 */
const base642ab = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * PBKDF2를 사용하여 비밀번호에서 암호화 키 생성
 * @param {string} password - 비밀번호 (PIN 또는 비밀번호)
 * @param {ArrayBuffer} salt - 솔트
 * @returns {Promise<CryptoKey>} 암호화 키
 */
const deriveKey = async (password, salt) => {
    const passwordBuffer = str2ab(password);

    // 비밀번호를 키 재료로 가져오기
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    // PBKDF2로 키 생성 (100,000 iterations)
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * 데이터 암호화 (AES-256-GCM)
 * @param {string} plaintext - 평문
 * @param {string} password - 비밀번호
 * @returns {Promise<string>} Base64로 인코딩된 암호문 (salt:iv:ciphertext 형식)
 */
export const encrypt = async (plaintext, password) => {
    try {
        // 랜덤 salt 생성 (16 bytes)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // 랜덤 IV 생성 (12 bytes for GCM)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // 비밀번호에서 키 생성
        const key = await deriveKey(password, salt);

        // 평문을 ArrayBuffer로 변환
        const plaintextBuffer = str2ab(plaintext);

        // 암호화
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            plaintextBuffer
        );

        // salt, iv, ciphertext를 Base64로 인코딩하여 반환
        const saltBase64 = ab2base64(salt);
        const ivBase64 = ab2base64(iv);
        const ciphertextBase64 = ab2base64(ciphertext);

        return `${saltBase64}:${ivBase64}:${ciphertextBase64}`;
    } catch (error) {
        console.error('암호화 오류:', error);
        throw new Error('암호화에 실패했습니다.');
    }
};

/**
 * 데이터 복호화 (AES-256-GCM)
 * @param {string} encryptedData - Base64로 인코딩된 암호문 (salt:iv:ciphertext 형식)
 * @param {string} password - 비밀번호
 * @returns {Promise<string>} 복호화된 평문
 */
export const decrypt = async (encryptedData, password) => {
    try {
        // salt, iv, ciphertext 분리
        const [saltBase64, ivBase64, ciphertextBase64] = encryptedData.split(':');

        if (!saltBase64 || !ivBase64 || !ciphertextBase64) {
            throw new Error('잘못된 암호문 형식입니다.');
        }

        // Base64를 ArrayBuffer로 변환
        const salt = base642ab(saltBase64);
        const iv = base642ab(ivBase64);
        const ciphertext = base642ab(ciphertextBase64);

        // 비밀번호에서 키 생성
        const key = await deriveKey(password, salt);

        // 복호화
        const plaintextBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        // ArrayBuffer를 문자열로 변환
        return ab2str(plaintextBuffer);
    } catch (error) {
        console.error('복호화 오류:', error);
        throw new Error('복호화에 실패했습니다. 비밀번호를 확인해주세요.');
    }
};

/**
 * 비밀번호 해시 생성 (저장용)
 * @param {string} password - 비밀번호
 * @returns {Promise<string>} Base64로 인코딩된 해시값 (salt:hash 형식)
 */
export const hashPassword = async (password) => {
    try {
        // 랜덤 salt 생성 (16 bytes)
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // 비밀번호를 ArrayBuffer로 변환
        const passwordBuffer = str2ab(password);

        // salt와 비밀번호 결합
        const combined = new Uint8Array(salt.length + passwordBuffer.length);
        combined.set(salt);
        combined.set(new Uint8Array(passwordBuffer), salt.length);

        // SHA-256 해시 생성
        const hashBuffer = await crypto.subtle.digest('SHA-256', combined);

        // salt와 hash를 Base64로 인코딩하여 반환
        const saltBase64 = ab2base64(salt);
        const hashBase64 = ab2base64(hashBuffer);

        return `${saltBase64}:${hashBase64}`;
    } catch (error) {
        console.error('해시 생성 오류:', error);
        throw new Error('해시 생성에 실패했습니다.');
    }
};

/**
 * 비밀번호 검증
 * @param {string} password - 확인할 비밀번호
 * @param {string} storedHash - 저장된 해시값 (salt:hash 형식)
 * @returns {Promise<boolean>} 일치 여부
 */
export const verifyPassword = async (password, storedHash) => {
    try {
        // salt와 hash 분리
        const [saltBase64, hashBase64] = storedHash.split(':');

        if (!saltBase64 || !hashBase64) {
            throw new Error('잘못된 해시 형식입니다.');
        }

        // Base64를 ArrayBuffer로 변환
        const salt = new Uint8Array(base642ab(saltBase64));
        const storedHashBuffer = base642ab(hashBase64);

        // 비밀번호를 ArrayBuffer로 변환
        const passwordBuffer = str2ab(password);

        // salt와 비밀번호 결합
        const combined = new Uint8Array(salt.length + passwordBuffer.length);
        combined.set(salt);
        combined.set(new Uint8Array(passwordBuffer), salt.length);

        // SHA-256 해시 생성
        const hashBuffer = await crypto.subtle.digest('SHA-256', combined);

        // 해시 비교
        const hash = new Uint8Array(hashBuffer);
        const stored = new Uint8Array(storedHashBuffer);

        if (hash.length !== stored.length) {
            return false;
        }

        // 타이밍 공격 방지를 위한 상수 시간 비교
        let diff = 0;
        for (let i = 0; i < hash.length; i++) {
            diff |= hash[i] ^ stored[i];
        }

        return diff === 0;
    } catch (error) {
        console.error('비밀번호 검증 오류:', error);
        return false;
    }
};

/**
 * 랜덤 임시 PIN 생성 (6자리)
 * @returns {string} 6자리 숫자 PIN
 */
export const generateTempPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
