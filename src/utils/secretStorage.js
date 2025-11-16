// src/utils/secretStorage.js
// 시크릿 페이지 데이터 관리 유틸리티

import { encrypt, decrypt, hashPassword, verifyPassword } from './encryption';

const SECRET_PIN_KEY = 'secretPagePin';
const SECRET_DATA_KEY = 'secretPageData';
const SECRET_SETTINGS_KEY = 'secretPageSettings';

/**
 * PIN 설정 여부 확인
 * @returns {boolean}
 */
export const hasPinSet = () => {
    return !!localStorage.getItem(SECRET_PIN_KEY);
};

/**
 * PIN 설정
 * @param {string} pin - 4자리 또는 6자리 PIN
 * @returns {Promise<void>}
 */
export const setPin = async (pin) => {
    const hashedPin = await hashPassword(pin);
    localStorage.setItem(SECRET_PIN_KEY, hashedPin);
};

/**
 * PIN 검증
 * @param {string} pin - 입력된 PIN
 * @returns {Promise<boolean>}
 */
export const verifyPin = async (pin) => {
    const storedHash = localStorage.getItem(SECRET_PIN_KEY);
    if (!storedHash) return false;
    return await verifyPassword(pin, storedHash);
};

/**
 * PIN 변경
 * @param {string} oldPin - 기존 PIN
 * @param {string} newPin - 새 PIN
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const changePin = async (oldPin, newPin) => {
    const isValid = await verifyPin(oldPin);
    if (!isValid) {
        return { success: false, message: '기존 PIN이 올바르지 않습니다.' };
    }

    await setPin(newPin);
    return { success: true, message: 'PIN이 변경되었습니다.' };
};

/**
 * PIN 리셋 (임시 PIN 발급 시 사용)
 * @returns {void}
 */
export const resetPin = () => {
    localStorage.removeItem(SECRET_PIN_KEY);
};

/**
 * 설정 가져오기
 * @returns {object}
 */
export const getSettings = () => {
    const settings = localStorage.getItem(SECRET_SETTINGS_KEY);
    if (!settings) {
        return {
            pinLength: 6,
            autoLockMinutes: 5,
            emailNotifications: false,
            categoryNames: {
                financial: '금융',
                personal: '개인',
                work: '업무',
                diary: '일기'
            },
            categoryIcons: {
                financial: 'dollar',
                personal: 'user',
                work: 'briefcase',
                diary: 'book'
            }
        };
    }
    const parsed = JSON.parse(settings);
    // 기존 설정에 categoryNames가 없으면 기본값 추가
    if (!parsed.categoryNames) {
        parsed.categoryNames = {
            financial: '금융',
            personal: '개인',
            work: '업무',
            diary: '일기'
        };
    }
    // 기존 설정에 categoryIcons가 없으면 기본값 추가 (icon ID 사용)
    if (!parsed.categoryIcons) {
        parsed.categoryIcons = {
            financial: 'dollar',
            personal: 'user',
            work: 'briefcase',
            diary: 'book'
        };
    }
    return parsed;
};

/**
 * 설정 저장
 * @param {object} settings
 */
export const saveSettings = (settings) => {
    localStorage.setItem(SECRET_SETTINGS_KEY, JSON.stringify(settings));
};

/**
 * 모든 시크릿 문서 가져오기 (PIN 검증 후)
 * @param {string} pin - PIN
 * @returns {Promise<Array>}
 */
export const getAllSecretDocs = async (pin) => {
    const isValid = await verifyPin(pin);
    if (!isValid) {
        throw new Error('PIN이 올바르지 않습니다.');
    }

    const encryptedData = localStorage.getItem(SECRET_DATA_KEY);
    if (!encryptedData || encryptedData === '[]') {
        return [];
    }

    try {
        const decryptedJson = await decrypt(encryptedData, pin);
        return JSON.parse(decryptedJson);
    } catch (error) {
        console.error('시크릿 문서 복호화 오류:', error);
        return [];
    }
};

/**
 * 시크릿 문서 저장
 * @param {string} pin - PIN
 * @param {Array} docs - 문서 배열
 * @returns {Promise<void>}
 */
export const saveSecretDocs = async (pin, docs) => {
    const isValid = await verifyPin(pin);
    if (!isValid) {
        throw new Error('PIN이 올바르지 않습니다.');
    }

    const jsonString = JSON.stringify(docs);
    const encryptedData = await encrypt(jsonString, pin);
    localStorage.setItem(SECRET_DATA_KEY, encryptedData);
};

/**
 * 시크릿 문서 추가
 * @param {string} pin - PIN
 * @param {object} doc - 문서 객체
 * @returns {Promise<object>} 추가된 문서 (id 포함)
 */
export const addSecretDoc = async (pin, doc) => {
    const docs = await getAllSecretDocs(pin);

    const newDoc = {
        id: `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecret: true
    };

    docs.push(newDoc);
    await saveSecretDocs(pin, docs);

    return newDoc;
};

/**
 * 시크릿 문서 업데이트
 * @param {string} pin - PIN
 * @param {string} docId - 문서 ID
 * @param {object} updates - 업데이트할 내용
 * @returns {Promise<object>} 업데이트된 문서
 */
export const updateSecretDoc = async (pin, docId, updates) => {
    const docs = await getAllSecretDocs(pin);
    const index = docs.findIndex(d => d.id === docId);

    if (index === -1) {
        throw new Error('문서를 찾을 수 없습니다.');
    }

    docs[index] = {
        ...docs[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await saveSecretDocs(pin, docs);
    return docs[index];
};

/**
 * 시크릿 문서 삭제
 * @param {string} pin - PIN
 * @param {string} docId - 문서 ID
 * @returns {Promise<void>}
 */
export const deleteSecretDoc = async (pin, docId) => {
    const docs = await getAllSecretDocs(pin);
    const filtered = docs.filter(d => d.id !== docId);
    await saveSecretDocs(pin, filtered);
};

/**
 * 시크릿 문서 검색
 * @param {string} pin - PIN
 * @param {string} query - 검색어
 * @returns {Promise<Array>}
 */
export const searchSecretDocs = async (pin, query) => {
    const docs = await getAllSecretDocs(pin);
    const lowerQuery = query.toLowerCase();

    return docs.filter(doc =>
        doc.title?.toLowerCase().includes(lowerQuery) ||
        doc.content?.toLowerCase().includes(lowerQuery) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
};

/**
 * 개별 문서 비밀번호 설정
 * @param {string} pin - PIN
 * @param {string} docId - 문서 ID
 * @param {string} password - 문서 비밀번호
 * @returns {Promise<void>}
 */
export const setDocPassword = async (pin, docId, password) => {
    const docs = await getAllSecretDocs(pin);
    const doc = docs.find(d => d.id === docId);

    if (!doc) {
        throw new Error('문서를 찾을 수 없습니다.');
    }

    // 문서 내용 암호화
    const encryptedContent = await encrypt(doc.content, password);
    const hashedPassword = await hashPassword(password);

    await updateSecretDoc(pin, docId, {
        content: encryptedContent,
        hasPassword: true,
        passwordHash: hashedPassword,
        isContentEncrypted: true
    });
};

/**
 * 개별 문서 비밀번호 검증 및 복호화
 * @param {string} pin - PIN
 * @param {string} docId - 문서 ID
 * @param {string} password - 문서 비밀번호
 * @returns {Promise<{success: boolean, content?: string, message?: string}>}
 */
export const unlockDoc = async (pin, docId, password) => {
    const docs = await getAllSecretDocs(pin);
    const doc = docs.find(d => d.id === docId);

    if (!doc) {
        return { success: false, message: '문서를 찾을 수 없습니다.' };
    }

    if (!doc.hasPassword) {
        return { success: true, content: doc.content };
    }

    try {
        const isValid = await verifyPassword(password, doc.passwordHash);
        if (!isValid) {
            return { success: false, message: '비밀번호가 올바르지 않습니다.' };
        }

        const decryptedContent = await decrypt(doc.content, password);
        return { success: true, content: decryptedContent };
    } catch (error) {
        return { success: false, message: '복호화에 실패했습니다.' };
    }
};

/**
 * 개별 문서 비밀번호 제거
 * @param {string} pin - PIN
 * @param {string} docId - 문서 ID
 * @param {string} password - 현재 문서 비밀번호
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const removeDocPassword = async (pin, docId, password) => {
    const result = await unlockDoc(pin, docId, password);

    if (!result.success) {
        return { success: false, message: result.message };
    }

    await updateSecretDoc(pin, docId, {
        content: result.content,
        hasPassword: false,
        passwordHash: null,
        isContentEncrypted: false
    });

    return { success: true, message: '문서 비밀번호가 제거되었습니다.' };
};

/**
 * 시크릿 데이터 내보내기 (백업)
 * @param {string} pin - PIN
 * @returns {Promise<object>}
 */
export const exportSecretData = async (pin) => {
    const docs = await getAllSecretDocs(pin);
    const settings = getSettings();

    return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        docs: docs,
        settings: settings
    };
};

/**
 * 시크릿 데이터 가져오기 (복원)
 * @param {string} pin - PIN
 * @param {object} data - 백업 데이터
 * @returns {Promise<void>}
 */
export const importSecretData = async (pin, data) => {
    if (!data.docs || !Array.isArray(data.docs)) {
        throw new Error('잘못된 백업 데이터 형식입니다.');
    }

    await saveSecretDocs(pin, data.docs);

    if (data.settings) {
        saveSettings(data.settings);
    }
};
