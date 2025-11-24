// 본인인증 서비스
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 본인인증 상태 확인
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{verified: boolean, verifiedAt: Date|null, method: string|null}>}
 */
export const checkVerificationStatus = async (userId) => {
    if (!userId) {
        return { verified: false, verifiedAt: null, method: null };
    }

    try {
        const verificationRef = doc(db, 'verifications', userId);
        const verificationDoc = await getDoc(verificationRef);

        if (verificationDoc.exists()) {
            const data = verificationDoc.data();
            return {
                verified: data.verified || false,
                verifiedAt: data.verifiedAt,
                method: data.method || null,
                name: data.name || null,
                birthYear: data.birthYear || null
            };
        }

        return { verified: false, verifiedAt: null, method: null };
    } catch (error) {
        console.error('본인인증 상태 확인 오류:', error);
        return { verified: false, verifiedAt: null, method: null };
    }
};

/**
 * 본인인증 정보 저장
 * @param {string} userId - 사용자 ID
 * @param {object} verificationData - 인증 데이터
 * @returns {Promise<boolean>}
 */
export const saveVerification = async (userId, verificationData) => {
    if (!userId) {
        throw new Error('사용자 ID가 필요합니다');
    }

    try {
        const verificationRef = doc(db, 'verifications', userId);

        await setDoc(verificationRef, {
            userId,
            verified: true,
            method: verificationData.method || 'phone', // phone, ipin, etc.
            name: verificationData.name || null,
            birthYear: verificationData.birthYear || null,
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ 본인인증 정보 저장 완료');
        return true;
    } catch (error) {
        console.error('❌ 본인인증 정보 저장 오류:', error);
        throw error;
    }
};

/**
 * 본인인증 해제 (관리자 전용)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>}
 */
export const revokeVerification = async (userId) => {
    if (!userId) {
        throw new Error('사용자 ID가 필요합니다');
    }

    try {
        const verificationRef = doc(db, 'verifications', userId);

        await setDoc(verificationRef, {
            verified: false,
            revokedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ 본인인증 해제 완료');
        return true;
    } catch (error) {
        console.error('❌ 본인인증 해제 오류:', error);
        throw error;
    }
};

/**
 * 전화번호 본인인증 (더미 구현 - 실제로는 외부 API 사용)
 * 실제 구현 시 NICE, KCB 등의 본인인증 API 연동 필요
 * @param {string} phoneNumber - 전화번호
 * @param {string} name - 이름
 * @param {string} birthYear - 생년 (YYYY)
 * @returns {Promise<object>}
 */
export const verifyPhone = async (phoneNumber, name, birthYear) => {
    // TODO: 실제 본인인증 API 연동
    // 현재는 더미 구현으로 시뮬레이션만 수행

    return new Promise((resolve) => {
        setTimeout(() => {
            // 시뮬레이션: 전화번호가 010으로 시작하면 성공
            if (phoneNumber.startsWith('010')) {
                resolve({
                    success: true,
                    method: 'phone',
                    name,
                    birthYear
                });
            } else {
                resolve({
                    success: false,
                    error: '본인인증에 실패했습니다'
                });
            }
        }, 1500); // 1.5초 시뮬레이션
    });
};

/**
 * 아이핀 본인인증 (더미 구현)
 * @param {string} ipin - 아이핀 번호
 * @returns {Promise<object>}
 */
export const verifyIpin = async (ipin) => {
    // TODO: 실제 아이핀 API 연동
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: false,
                error: '아이핀 인증은 준비 중입니다'
            });
        }, 1000);
    });
};
