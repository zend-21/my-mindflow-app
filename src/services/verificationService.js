// 본인인증 서비스
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';

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
 * ⚡ 여러 사용자의 본인인증 상태 배치 확인 (Firestore 최적화)
 * @param {string[]} userIds - 사용자 ID 배열
 * @returns {Promise<Map<string, {verified: boolean, verifiedAt: Date|null, method: string|null}>>}
 */
export const checkVerificationStatusBatch = async (userIds) => {
    const resultMap = new Map();

    // 빈 배열이면 빈 Map 반환
    if (!userIds || userIds.length === 0) {
        return resultMap;
    }

    // 유효한 userId만 필터링
    const validUserIds = userIds.filter(id => id);

    if (validUserIds.length === 0) {
        return resultMap;
    }

    try {
        // ⚡ Firestore에서는 'in' 쿼리가 최대 10개까지만 지원
        // 10개씩 나누어서 배치 처리
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < validUserIds.length; i += batchSize) {
            batches.push(validUserIds.slice(i, i + batchSize));
        }

        // 각 배치별로 쿼리 실행
        for (const batch of batches) {
            const verificationsRef = collection(db, 'verifications');
            const q = query(verificationsRef, where('__name__', 'in', batch));
            const snapshot = await getDocs(q);

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                resultMap.set(doc.id, {
                    verified: data.verified || false,
                    verifiedAt: data.verifiedAt,
                    method: data.method || null,
                    name: data.name || null,
                    birthYear: data.birthYear || null
                });
            });
        }

        // 조회되지 않은 userId는 기본값 설정
        validUserIds.forEach(userId => {
            if (!resultMap.has(userId)) {
                resultMap.set(userId, {
                    verified: false,
                    verifiedAt: null,
                    method: null
                });
            }
        });

        console.log(`✅ 배치 인증 상태 조회 완료: ${validUserIds.length}개 (${batches.length}개 배치)`);
        return resultMap;
    } catch (error) {
        console.error('배치 본인인증 상태 확인 오류:', error);

        // 에러 발생 시 모든 userId에 대해 기본값 반환
        validUserIds.forEach(userId => {
            resultMap.set(userId, {
                verified: false,
                verifiedAt: null,
                method: null
            });
        });

        return resultMap;
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
