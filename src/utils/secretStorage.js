// src/utils/secretStorage.js
// 시크릿 페이지 데이터 관리 유틸리티 (Firestore 기반)

import { encrypt, decrypt, hashPassword, verifyPassword } from './encryption';
import {
    fetchSecretPinFromFirestore,
    saveSecretPinToFirestore,
    fetchSecretDocsFromFirestore,
    saveSecretDocsToFirestore,
    fetchSecretSettingsFromFirestore,
    saveSecretSettingsToFirestore,
    fetchDeletedSecretDocIds,
    saveDeletedSecretDocIds,
    // 🚀 개별 문서 암호화 함수들
    fetchIndividualSecretDocsFromFirestore,
    saveIndividualSecretDocsToFirestore,
    deleteIndividualSecretDocsFromFirestore,
    migrateToIndividualEncryption
} from '../services/userDataService';

// ⚠️ localStorage는 Firestore 연결 실패 시 폴백으로만 사용
const SECRET_PIN_KEY = 'secretPagePin';
const SECRET_DATA_KEY = 'secretPageData';
const SECRET_SETTINGS_KEY = 'secretPageSettings';

/**
 * 현재 로그인한 사용자 ID 가져오기
 */
const getUserId = () => {
    return localStorage.getItem('firebaseUserId');
};

/**
 * PIN 설정 여부 확인
 * @returns {Promise<boolean>}
 */
export const hasPinSet = async () => {
    const userId = getUserId();
    if (!userId) {
        return !!localStorage.getItem(SECRET_PIN_KEY);
    }

    try {
        const pinHash = await fetchSecretPinFromFirestore(userId);
        return !!pinHash;
    } catch (error) {
        console.error('PIN 확인 실패, localStorage 폴백:', error);
        return !!localStorage.getItem(SECRET_PIN_KEY);
    }
};

/**
 * PIN 설정
 * @param {string} pin - 4자리 또는 6자리 PIN
 * @returns {Promise<void>}
 */
export const setPin = async (pin) => {
    const hashedPin = await hashPassword(pin);
    const userId = getUserId();

    if (!userId) {
        localStorage.setItem(SECRET_PIN_KEY, hashedPin);
        return;
    }

    try {
        await saveSecretPinToFirestore(userId, hashedPin);
        console.log('✅ PIN Firestore 저장 완료');
    } catch (error) {
        console.error('PIN 저장 실패, localStorage 폴백:', error);
        localStorage.setItem(SECRET_PIN_KEY, hashedPin);
    }
};

/**
 * PIN 검증
 * @param {string} pin - 입력된 PIN
 * @returns {Promise<boolean>}
 */
export const verifyPin = async (pin) => {
    const userId = getUserId();

    if (!userId) {
        const storedHash = localStorage.getItem(SECRET_PIN_KEY);
        if (!storedHash) return false;
        return await verifyPassword(pin, storedHash);
    }

    try {
        const storedHash = await fetchSecretPinFromFirestore(userId);
        if (!storedHash) return false;
        return await verifyPassword(pin, storedHash);
    } catch (error) {
        console.error('PIN 검증 실패, localStorage 폴백:', error);
        const storedHash = localStorage.getItem(SECRET_PIN_KEY);
        if (!storedHash) return false;
        return await verifyPassword(pin, storedHash);
    }
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
 * @returns {Promise<void>}
 */
export const resetPin = async () => {
    const userId = getUserId();

    if (!userId) {
        localStorage.removeItem(SECRET_PIN_KEY);
        return;
    }

    try {
        await saveSecretPinToFirestore(userId, null);
        console.log('✅ PIN Firestore 리셋 완료');
    } catch (error) {
        console.error('PIN 리셋 실패, localStorage 폴백:', error);
        localStorage.removeItem(SECRET_PIN_KEY);
    }
};

/**
 * 설정 가져오기
 * @returns {Promise<object>}
 */
export const getSettings = async () => {
    const userId = getUserId();
    const defaultSettings = {
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

    if (!userId) {
        const settings = localStorage.getItem(SECRET_SETTINGS_KEY);
        if (!settings) return defaultSettings;

        const parsed = JSON.parse(settings);
        if (!parsed.categoryNames) parsed.categoryNames = defaultSettings.categoryNames;
        if (!parsed.categoryIcons) parsed.categoryIcons = defaultSettings.categoryIcons;
        return parsed;
    }

    try {
        const settings = await fetchSecretSettingsFromFirestore(userId);
        if (!settings.categoryNames) settings.categoryNames = defaultSettings.categoryNames;
        if (!settings.categoryIcons) settings.categoryIcons = defaultSettings.categoryIcons;
        return settings;
    } catch (error) {
        console.error('설정 가져오기 실패, localStorage 폴백:', error);
        const settings = localStorage.getItem(SECRET_SETTINGS_KEY);
        if (!settings) return defaultSettings;

        const parsed = JSON.parse(settings);
        if (!parsed.categoryNames) parsed.categoryNames = defaultSettings.categoryNames;
        if (!parsed.categoryIcons) parsed.categoryIcons = defaultSettings.categoryIcons;
        return parsed;
    }
};

/**
 * 설정 저장
 * @param {object} settings
 * @returns {Promise<void>}
 */
export const saveSettings = async (settings) => {
    const userId = getUserId();

    if (!userId) {
        localStorage.setItem(SECRET_SETTINGS_KEY, JSON.stringify(settings));
        return;
    }

    try {
        await saveSecretSettingsToFirestore(userId, settings);
        console.log('✅ 시크릿 설정 Firestore 저장 완료');
    } catch (error) {
        console.error('설정 저장 실패, localStorage 폴백:', error);
        localStorage.setItem(SECRET_SETTINGS_KEY, JSON.stringify(settings));
    }
};

/**
 * 🚀 모든 시크릿 문서 가져오기 (개별 문서 암호화 방식)
 * @param {string} pin - PIN
 * @param {boolean} includeDeleted - 삭제된 문서도 포함 여부 (기본: false)
 * @returns {Promise<Array>}
 */
export const getAllSecretDocs = async (pin, includeDeleted = false) => {
    console.time('⏱️ getAllSecretDocs - 전체 시간');

    console.time('  ↳ PIN 검증');
    const isValid = await verifyPin(pin);
    console.timeEnd('  ↳ PIN 검증');
    if (!isValid) {
        throw new Error('PIN이 올바르지 않습니다.');
    }

    const userId = getUserId();
    let deletedIds = [];

    // 삭제된 문서 ID 목록 가져오기 (Firestore만 지원)
    if (userId && !includeDeleted) {
        try {
            deletedIds = await fetchDeletedSecretDocIds(userId);
        } catch (error) {
            console.error('삭제된 ID 목록 가져오기 실패:', error);
        }
    }

    // 로컬 모드 (기존 방식 유지)
    if (!userId) {
        const encryptedData = localStorage.getItem(SECRET_DATA_KEY);
        if (!encryptedData || encryptedData === '[]') {
            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return [];
        }

        try {
            const decryptedJson = await decrypt(encryptedData, pin);
            const allDocs = JSON.parse(decryptedJson);
            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return allDocs.filter(doc => !deletedIds.includes(doc.id));
        } catch (error) {
            console.error('시크릿 문서 복호화 오류:', error);
            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return [];
        }
    }

    // 🚀 Firestore 모드 (개별 문서 암호화)
    try {
        console.time('  ↳ Firestore 조회 (컬렉션)');
        const encryptedDocs = await fetchIndividualSecretDocsFromFirestore(userId);
        console.timeEnd('  ↳ Firestore 조회 (컬렉션)');

        if (!encryptedDocs || encryptedDocs.length === 0) {
            console.log('📭 개별 문서 없음, 기존 blob 확인...');

            // 기존 단일 blob 데이터 확인 (마이그레이션 필요)
            console.time('  ↳ Firestore 조회 (기존 blob)');
            const oldEncryptedData = await fetchSecretDocsFromFirestore(userId);
            console.timeEnd('  ↳ Firestore 조회 (기존 blob)');

            if (!oldEncryptedData || oldEncryptedData === '[]') {
                console.log('📭 문서 없음');
                console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
                return [];
            }

            // 기존 blob 복호화
            console.time('  ↳ 복호화 (기존 blob)');
            const decryptedJson = await decrypt(oldEncryptedData, pin);
            const allDocs = JSON.parse(decryptedJson);
            console.timeEnd('  ↳ 복호화 (기존 blob)');

            // 🔄 자동 마이그레이션: 개별 문서로 변환
            console.log('🔄 자동 마이그레이션 시작: blob → 개별 문서');
            const encryptionPromises = allDocs.map(async (doc) => {
                const jsonString = JSON.stringify(doc);
                const encryptedData = await encrypt(jsonString, pin);
                return { id: doc.id, encryptedData };
            });

            const migratedDocs = await Promise.all(encryptionPromises);
            await saveIndividualSecretDocsToFirestore(userId, migratedDocs);
            console.log('✅ 마이그레이션 완료: 개별 문서로 저장됨');

            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return allDocs.filter(doc => !deletedIds.includes(doc.id));
        }

        // 각 문서를 개별적으로 복호화 (병렬 처리)
        console.time('  ↳ 개별 복호화 (병렬)');
        const decryptionPromises = encryptedDocs.map(async (encDoc) => {
            try {
                const decryptedJson = await decrypt(encDoc.encryptedData, pin);
                console.log('📦 복호화된 JSON:', { id: encDoc.id, includesPasswordHash: decryptedJson.includes('passwordHash') });
                const parsedDoc = JSON.parse(decryptedJson);
                console.log('🔓 파싱된 문서:', { id: parsedDoc.id, hasPasswordHash: !!parsedDoc.passwordHash, passwordHash: parsedDoc.passwordHash?.substring(0, 20) });
                return parsedDoc;
            } catch (error) {
                console.error(`문서 ${encDoc.id} 복호화 실패:`, error);
                return null;
            }
        });

        const decryptedDocs = await Promise.all(decryptionPromises);
        const allDocs = decryptedDocs.filter(doc => doc !== null);
        console.timeEnd('  ↳ 개별 복호화 (병렬)');

        console.log(`✅ 시크릿 문서 ${allDocs.length}개 개별 복호화 완료`);
        console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');

        // 삭제된 ID는 제외
        return allDocs.filter(doc => !deletedIds.includes(doc.id));
    } catch (error) {
        console.error('❌ 개별 암호화 로드 실패, 기존 blob 폴백:', error);

        // 폴백: 기존 방식 (전체 복호화)
        try {
            console.time('  ↳ Firestore 조회 (폴백)');
            const encryptedData = await fetchSecretDocsFromFirestore(userId);
            console.timeEnd('  ↳ Firestore 조회 (폴백)');

            if (!encryptedData || encryptedData === '[]') {
                console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
                return [];
            }

            console.time('  ↳ 복호화 (폴백)');
            const decryptedJson = await decrypt(encryptedData, pin);
            const allDocs = JSON.parse(decryptedJson);
            console.timeEnd('  ↳ 복호화 (폴백)');

            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return allDocs.filter(doc => !deletedIds.includes(doc.id));
        } catch (fallbackError) {
            console.error('❌ 폴백도 실패:', fallbackError);
            console.timeEnd('⏱️ getAllSecretDocs - 전체 시간');
            return [];
        }
    }
};

/**
 * 🚀 시크릿 문서 저장 (개별 문서 암호화 방식)
 * @param {string} pin - PIN
 * @param {Array} docs - 문서 배열
 * @returns {Promise<void>}
 */
export const saveSecretDocs = async (pin, docs) => {
    console.time('⏱️ saveSecretDocs - 전체 시간');

    console.time('  ↳ PIN 검증');
    const isValid = await verifyPin(pin);
    console.timeEnd('  ↳ PIN 검증');
    if (!isValid) {
        throw new Error('PIN이 올바르지 않습니다.');
    }

    const userId = getUserId();

    // 로컬 모드 (기존 방식 유지)
    if (!userId) {
        console.time('  ↳ JSON 직렬화 (전체)');
        const jsonString = JSON.stringify(docs);
        console.timeEnd('  ↳ JSON 직렬화 (전체)');

        console.time('  ↳ 암호화 (전체)');
        const encryptedData = await encrypt(jsonString, pin);
        console.timeEnd('  ↳ 암호화 (전체)');

        localStorage.setItem(SECRET_DATA_KEY, encryptedData);
        console.timeEnd('⏱️ saveSecretDocs - 전체 시간');
        return;
    }

    // 🚀 Firestore 모드 (개별 문서 암호화)
    try {
        console.time('  ↳ 개별 암호화 (병렬)');

        // 각 문서를 개별적으로 암호화 (병렬 처리)
        const encryptionPromises = docs.map(async (doc) => {
            console.log('🔒 암호화 전 문서:', { id: doc.id, hasPasswordHash: !!doc.passwordHash, passwordHash: doc.passwordHash?.substring(0, 20) });
            const jsonString = JSON.stringify(doc);
            console.log('📦 JSON 문자열:', { id: doc.id, includesPasswordHash: jsonString.includes('passwordHash') });
            const encryptedData = await encrypt(jsonString, pin);
            return {
                id: doc.id,
                encryptedData
            };
        });

        const encryptedDocs = await Promise.all(encryptionPromises);
        console.timeEnd('  ↳ 개별 암호화 (병렬)');

        console.time('  ↳ Firestore 저장 (배치)');
        await saveIndividualSecretDocsToFirestore(userId, encryptedDocs);
        console.timeEnd('  ↳ Firestore 저장 (배치)');

        console.log(`✅ 시크릿 문서 ${docs.length}개 개별 암호화 저장 완료`);
    } catch (error) {
        console.error('❌ 개별 암호화 저장 실패, 전체 암호화 폴백:', error);

        // 폴백: 기존 방식 (전체 암호화)
        console.time('  ↳ JSON 직렬화 (폴백)');
        const jsonString = JSON.stringify(docs);
        console.timeEnd('  ↳ JSON 직렬화 (폴백)');

        console.time('  ↳ 암호화 (폴백)');
        const encryptedData = await encrypt(jsonString, pin);
        console.timeEnd('  ↳ 암호화 (폴백)');

        await saveSecretDocsToFirestore(userId, encryptedData);
    }

    console.timeEnd('⏱️ saveSecretDocs - 전체 시간');
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

    console.log('📝 updateSecretDoc - 업데이트 전:', { id: docId, oldPasswordHash: docs[index].passwordHash?.substring(0, 20) });
    console.log('📝 updateSecretDoc - 업데이트 내용:', { hasPasswordHash: !!updates.passwordHash, passwordHash: updates.passwordHash?.substring(0, 20) });

    docs[index] = {
        ...docs[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    console.log('📝 updateSecretDoc - 업데이트 후:', { id: docId, newPasswordHash: docs[index].passwordHash?.substring(0, 20) });

    await saveSecretDocs(pin, docs);
    return docs[index];
};

/**
 * 시크릿 문서 소프트 삭제 (암호화 데이터는 유지, 삭제 ID 목록에만 추가)
 * ⚠️ 실제 암호화된 데이터는 그대로 유지하고, 보이지 않게만 처리
 * ⚠️ PIN으로 "삭제 권한"을 획득한 상태로, 복원/영구삭제 시 PIN 불필요
 * @param {string} pin - PIN (문서 존재 여부 확인용)
 * @param {string} docId - 문서 ID
 * @returns {Promise<void>}
 */
export const deleteSecretDoc = async (pin, docId) => {
    console.time('⏱️ deleteSecretDoc (소프트 삭제) - 전체 시간');
    console.log('🗑️ 소프트 삭제 시작:', docId);

    // PIN 검증 및 문서 존재 확인
    const docs = await getAllSecretDocs(pin, false);
    const docExists = docs.some(d => d.id === docId);

    if (!docExists) {
        console.error('❌ 문서를 찾을 수 없음:', docId);
        throw new Error('문서를 찾을 수 없습니다.');
    }

    const userId = getUserId();
    if (!userId) {
        console.warn('⚠️ Firestore 사용자 ID 없음 - 로컬 모드에서는 하드 삭제');
        // 로컬 전용 모드에서는 실제 삭제
        const allDocs = await getAllSecretDocs(pin, true);
        const filtered = allDocs.filter(d => d.id !== docId);
        await saveSecretDocs(pin, filtered);
        console.log('✅ 로컬 전용: 하드 삭제 완료:', docId);
        console.timeEnd('⏱️ deleteSecretDoc (소프트 삭제) - 전체 시간');
        return;
    }

    try {
        // 삭제 ID 목록에 추가 (암호화 데이터는 그대로 유지)
        const deletedIds = await fetchDeletedSecretDocIds(userId);

        // 이미 삭제 목록에 있는지 확인
        if (deletedIds.includes(docId)) {
            console.log('ℹ️ 이미 삭제 목록에 존재:', docId);
            return;
        }

        // 삭제 ID 추가
        const newDeletedIds = [...deletedIds, docId];
        await saveDeletedSecretDocIds(userId, newDeletedIds);

        console.log('✅ 소프트 삭제 완료 (암호화 데이터 유지, ID만 추가):', docId);
        console.log('📝 PIN 권한 획득: 복원/영구삭제 시 PIN 불필요');
    } catch (error) {
        console.error('❌ 삭제 ID 목록 저장 실패:', error);
        throw error;
    }

    console.timeEnd('⏱️ deleteSecretDoc (소프트 삭제) - 전체 시간');
};

/**
 * 시크릿 문서 복원 (삭제 ID 목록에서 제거) - PIN 불필요
 * ⚠️ 휴지통에서 복원할 때 사용
 * ⚠️ 암호화된 데이터는 그대로 유지되어 있으므로 ID 목록에서만 제거하면 복원됨
 * ⚠️ 삭제 시점에 획득한 PIN 권한으로 복원 가능 (PIN 재입력 불필요)
 * @param {Array<string>} docIds - 복원할 문서 ID 배열
 * @returns {Promise<void>}
 */
export const restoreSecretDocsWithoutPin = async (docIds) => {
    console.log('♻️ 시크릿 문서 복원 시작 (PIN 없음):', docIds);
    const userId = getUserId();

    if (!userId) {
        console.error('❌ 사용자 ID 없음 - 로그인 필요');
        throw new Error('로그인이 필요합니다.');
    }

    try {
        // 삭제 ID 목록에서 제거 (암호화 데이터는 이미 존재)
        const deletedIds = await fetchDeletedSecretDocIds(userId);
        const newDeletedIds = deletedIds.filter(id => !docIds.includes(id));
        await saveDeletedSecretDocIds(userId, newDeletedIds);

        console.log(`✅ 시크릿 문서 복원 완료: ${docIds.length}개`);
        console.log('📝 암호화 데이터 유지됨, 다음 PIN 입력 시 복원된 문서 표시됨');
    } catch (error) {
        console.error('❌ 시크릿 문서 복원 실패:', error);
        throw error;
    }
};

/**
 * 시크릿 문서 영구 삭제 (실제로 문서를 제거)
 * ⚠️ 법적 준수: 이 함수는 암호화된 데이터와 삭제 ID 목록 모두에서 완전히 제거합니다.
 * @param {string} pin - PIN (암호화된 데이터 수정 필요)
 * @param {string} docId - 문서 ID
 * @returns {Promise<void>}
 */
export const permanentDeleteSecretDoc = async (pin, docId) => {
    console.time('⏱️ permanentDeleteSecretDoc (영구 삭제) - 전체 시간');
    console.log('🔥 영구 삭제 시작:', docId);

    // includeDeleted = true로 모든 문서 가져오기 (삭제된 문서 포함)
    const docs = await getAllSecretDocs(pin, true);
    const beforeCount = docs.length;

    // 문서가 존재하는지 확인
    const docExists = docs.some(d => d.id === docId);
    if (!docExists) {
        console.warn('⚠️ 영구 삭제할 문서를 찾을 수 없음:', docId);
    }

    // 1. 암호화된 데이터에서 실제로 문서 제거
    const filtered = docs.filter(d => d.id !== docId);
    const afterCount = filtered.length;

    await saveSecretDocs(pin, filtered);

    // 2. 삭제 ID 목록에서도 제거 (완전 삭제)
    const userId = getUserId();
    if (userId) {
        try {
            const deletedIds = await fetchDeletedSecretDocIds(userId);
            const newDeletedIds = deletedIds.filter(id => id !== docId);
            await saveDeletedSecretDocIds(userId, newDeletedIds);
            console.log('✅ 삭제 ID 목록에서도 제거 완료');
        } catch (error) {
            console.error('⚠️ 삭제 ID 목록 정리 실패 (데이터는 제거됨):', error);
        }
    }

    console.log(`🔥 영구 삭제 완료: ${docId} (${beforeCount}개 → ${afterCount}개)`);
    console.log('✅ 법적 준수: 모든 데이터가 완전히 제거되었습니다.');
    console.timeEnd('⏱️ permanentDeleteSecretDoc (영구 삭제) - 전체 시간');
};

/**
 * 시크릿 문서 영구 삭제 (PIN 없이, 정리 대기열에 추가)
 * 휴지통에서 영구 삭제할 때 사용 - 삭제 ID 목록에서 제거하고 정리 대기열에 추가
 * 다음 PIN 입력 시 암호화 데이터에서 실제로 제거됨 (삭제 시점 PIN 권한 사용)
 * @param {Array<string>} docIds - 문서 ID 배열
 * @returns {Promise<void>}
 */
export const permanentDeleteSecretDocWithoutPin = async (docIds) => {
    console.log('🔥 영구 삭제 (PIN 없음) 시작:', docIds);
    const userId = getUserId();

    if (!userId) {
        throw new Error('로그인이 필요합니다.');
    }

    try {
        const { fetchDeletedSecretDocIds, saveDeletedSecretDocIds, fetchPendingCleanupIds, savePendingCleanupIds } =
            await import('../services/userDataService');

        // 1. 삭제 ID 목록에서 제거 (휴지통에서 사라지게)
        const deletedIds = await fetchDeletedSecretDocIds(userId);
        const newDeletedIds = deletedIds.filter(id => !docIds.includes(id));
        await saveDeletedSecretDocIds(userId, newDeletedIds);

        // 2. 정리 대기열에 추가 (다음 PIN 입력 시 실제 암호화 데이터에서 삭제)
        const pendingIds = await fetchPendingCleanupIds(userId);
        const newPendingIds = [...new Set([...pendingIds, ...docIds])]; // 중복 제거
        await savePendingCleanupIds(userId, newPendingIds);

        console.log(`✅ 시크릿 문서 영구 삭제 완료: ${docIds.length}개`);
        console.log(`   - 삭제 ID 목록에서 제거됨 (휴지통 더미 사라짐)`);
        console.log(`   - 정리 대기열에 추가됨 (다음 PIN 입력 시 암호화 데이터에서 완전 삭제)`);
        console.log(`   - 삭제 시점 PIN 권한으로 제거 가능`);
    } catch (error) {
        console.error('❌ 시크릿 문서 영구 삭제 실패:', error);
        throw error;
    }
};

/**
 * 영구 삭제 대기 중인 문서를 암호화된 스토리지에서 완전히 제거 (자동 정리)
 * 시크릿 페이지 PIN 입력 시 자동 실행 - 정리 대기열에 있는 문서들을 실제로 삭제
 * @param {string} pin - PIN
 * @returns {Promise<{cleaned: number, total: number}>} 정리된 문서 수와 전체 문서 수
 */
export const cleanupPermanentlyDeletedDocs = async (pin) => {
    console.log('🧹 영구 삭제 대기 문서 자동 정리 시작');
    const userId = getUserId();

    if (!userId) {
        console.log('⚠️ 로컬 모드에서는 자동 정리 불필요');
        return { cleaned: 0, total: 0 };
    }

    try {
        const { fetchPendingCleanupIds, savePendingCleanupIds } = await import('../services/userDataService');

        // 1. 정리 대기열 가져오기
        const pendingIds = await fetchPendingCleanupIds(userId);

        if (pendingIds.length === 0) {
            console.log('✅ 정리 대기 중인 문서 없음');
            return { cleaned: 0, total: 0 };
        }

        console.log('📋 정리 대기열:', pendingIds);

        // 2. 모든 문서 가져오기 (삭제된 것 포함)
        const allDocs = await getAllSecretDocs(pin, true);
        const beforeCount = allDocs.length;
        console.log('📦 전체 문서 수:', beforeCount);

        // 3. 정리 대기열에 있는 ID 제거
        const pendingIdsSet = new Set(pendingIds);
        const docsToKeep = allDocs.filter(doc => !pendingIdsSet.has(doc.id));
        const removedCount = beforeCount - docsToKeep.length;

        if (removedCount > 0) {
            console.log(`🗑️ 제거할 문서: ${removedCount}개`, pendingIds);

            // 4. 유지할 문서만 다시 저장
            await saveSecretDocs(pin, docsToKeep);

            // 5. 정리 대기열 비우기
            await savePendingCleanupIds(userId, []);

            console.log(`✅ 자동 정리 완료: ${removedCount}개 문서 영구 삭제됨 (${beforeCount}개 → ${docsToKeep.length}개)`);
            console.log('✅ 법적 준수: 삭제 시점 PIN 권한으로 모든 데이터 완전 제거됨');
            return { cleaned: removedCount, total: beforeCount };
        } else {
            console.log('⚠️ 대기열에 있지만 문서를 찾을 수 없음 (이미 삭제됨)');
            // 대기열만 정리
            await savePendingCleanupIds(userId, []);
            return { cleaned: 0, total: beforeCount };
        }
    } catch (error) {
        console.error('❌ 자동 정리 실패:', error);
        // 정리 실패해도 앱 사용에는 문제없도록 에러 무시
        return { cleaned: 0, total: 0 };
    }
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
    // 🔧 race condition 방지: getAllSecretDocs 대신 직접 docs를 로드하고 수정
    // 이렇게 하면 이전 save 작업과 겹치지 않음
    console.log('🔐 개별 비밀번호 설정 시작:', docId);

    const docs = await getAllSecretDocs(pin);
    const doc = docs.find(d => d.id === docId);

    if (!doc) {
        throw new Error('문서를 찾을 수 없습니다.');
    }

    // 문서 내용 암호화 전에 preview 생성 (원본 content 기반)
    console.log('📝 Preview 생성 중...');
    const preview = doc.content ? doc.content.substring(0, 100) : '';

    // 문서 내용 암호화
    console.log('🔒 문서 내용 암호화 중...');
    const encryptedContent = await encrypt(doc.content, password);
    const hashedPassword = await hashPassword(password);

    console.log('💾 암호화된 문서 저장 중...', { hashedPassword });
    const updatedDoc = await updateSecretDoc(pin, docId, {
        content: encryptedContent,
        preview: preview,  // ← 원본 content 기반의 preview 보존
        hasPassword: true,
        passwordHash: hashedPassword,
        isContentEncrypted: true
    });
    console.log('✅ 개별 비밀번호 설정 완료:', { docId, passwordHash: updatedDoc.passwordHash });
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

    console.log('🔓 unlockDoc 시작:', { docId, hasDoc: !!doc });

    if (!doc) {
        return { success: false, message: '문서를 찾을 수 없습니다.' };
    }

    console.log('🔑 문서 정보:', { hasPassword: doc.hasPassword, passwordHash: doc.passwordHash?.substring(0, 20) + '...' });

    if (!doc.hasPassword) {
        return { success: true, content: doc.content };
    }

    try {
        console.log('🔐 비밀번호 검증 중:', { password, storedHash: doc.passwordHash });
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

    // 복호화된 content 기반으로 preview 생성
    const preview = result.content ? result.content.substring(0, 100) : '';

    await updateSecretDoc(pin, docId, {
        content: result.content,
        preview: preview,  // ← 복호화된 content 기반의 preview 업데이트
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
