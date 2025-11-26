// 닉네임 관리 서비스
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

/**
 * 닉네임 중복 체크
 * @param {string} nickname - 체크할 닉네임
 * @param {string} excludeUserId - 제외할 사용자 ID (자기 자신 제외용)
 * @returns {Promise<boolean>} true면 사용 가능, false면 중복
 */
export const checkNicknameAvailability = async (nickname, excludeUserId = null) => {
    if (!nickname || !nickname.trim()) {
        return false;
    }

    const trimmedNickname = nickname.trim(); // 대소문자 구분

    try {
        // nicknames 컬렉션에서 해당 닉네임 검색
        const nicknamesRef = collection(db, 'nicknames');
        const q = query(nicknamesRef, where('nickname', '==', trimmedNickname));
        const querySnapshot = await getDocs(q);

        // 문서가 없으면 사용 가능
        if (querySnapshot.empty) {
            return true;
        }

        // ✅ 자기 자신의 닉네임이면 사용 가능
        if (excludeUserId) {
            const isSelf = querySnapshot.docs.every(doc => doc.data().userId === excludeUserId);
            return isSelf;
        }

        return false;
    } catch (error) {
        console.error('닉네임 중복 체크 오류:', error);
        throw error;
    }
};

/**
 * 닉네임 등록
 * @param {string} userId - 사용자 ID
 * @param {string} nickname - 등록할 닉네임
 * @returns {Promise<boolean>} 성공 여부
 */
export const registerNickname = async (userId, nickname) => {
    if (!userId || !nickname || !nickname.trim()) {
        return false;
    }

    const trimmedNickname = nickname.trim();

    try {
        // 중복 체크
        const isAvailable = await checkNicknameAvailability(trimmedNickname);
        if (!isAvailable) {
            return false;
        }

        // nicknames 컬렉션에 등록 (문서 ID는 userId)
        const nicknameDocRef = doc(db, 'nicknames', userId);
        await setDoc(nicknameDocRef, {
            nickname: trimmedNickname,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return true;
    } catch (error) {
        console.error('닉네임 등록 오류:', error);
        throw error;
    }
};

/**
 * 닉네임 변경
 * @param {string} userId - 사용자 ID
 * @param {string} newNickname - 새 닉네임
 * @returns {Promise<boolean>} 성공 여부
 */
export const updateNickname = async (userId, newNickname) => {
    if (!userId || !newNickname || !newNickname.trim()) {
        return false;
    }

    const trimmedNickname = newNickname.trim();

    try {
        // 기존 닉네임 문서 가져오기
        const nicknameDocRef = doc(db, 'nicknames', userId);
        const nicknameDoc = await getDoc(nicknameDocRef);

        // 현재 사용자의 닉네임 가져오기
        const currentNickname = nicknameDoc.exists() ? nicknameDoc.data().nickname : null;

        // 같은 닉네임이면 변경 불필요
        if (currentNickname === trimmedNickname) {
            return true;
        }

        // ✅ 새 닉네임 중복 체크 (자기 자신 제외)
        const isAvailable = await checkNicknameAvailability(trimmedNickname, userId);
        if (!isAvailable) {
            return false;
        }

        // ✅ 닉네임 업데이트 (createdAt은 기존 문서면 포함하지 않음)
        const updateData = {
            nickname: trimmedNickname,
            userId: userId,
            updatedAt: new Date()
        };

        // 새 문서인 경우만 createdAt 추가
        if (!nicknameDoc.exists()) {
            updateData.createdAt = new Date();
        }

        await setDoc(nicknameDocRef, updateData, { merge: true });

        return true;
    } catch (error) {
        console.error('닉네임 변경 오류:', error);
        throw error;
    }
};

/**
 * 사용자의 현재 닉네임 가져오기
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string|null>} 닉네임 또는 null
 */
export const getUserNickname = async (userId) => {
    if (!userId) {
        return null;
    }

    try {
        const nicknameDocRef = doc(db, 'nicknames', userId);
        const nicknameDoc = await getDoc(nicknameDocRef);

        if (nicknameDoc.exists()) {
            return nicknameDoc.data().nickname;
        }

        return null;
    } catch (error) {
        console.error('닉네임 조회 오류:', error);
        return null;
    }
};

/**
 * 닉네임 삭제 (회원 탈퇴 시)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export const deleteNickname = async (userId) => {
    if (!userId) {
        return false;
    }

    try {
        const nicknameDocRef = doc(db, 'nicknames', userId);
        await deleteDoc(nicknameDocRef);
        return true;
    } catch (error) {
        console.error('닉네임 삭제 오류:', error);
        throw error;
    }
};
