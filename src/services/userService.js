// src/services/userService.js
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * 사용자 계급 정의
 */
export const USER_RANKS = {
  ADMIN: 'admin',           // 관리자
  MODERATOR: 'moderator',   // 운영자
  VIP: 'vip',               // VIP
  REGULAR: 'regular',       // 일반 회원
  NEWBIE: 'newbie'          // 신규 회원
};

/**
 * 계급별 표시 정보
 */
export const RANK_INFO = {
  [USER_RANKS.ADMIN]: {
    label: '관리자',
    icon: '👑',
    color: '#ff6b6b',
    bgColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.4)'
  },
  [USER_RANKS.MODERATOR]: {
    label: '운영자',
    icon: '⚡',
    color: '#f093fb',
    bgColor: 'rgba(240, 147, 251, 0.15)',
    borderColor: 'rgba(240, 147, 251, 0.4)'
  },
  [USER_RANKS.VIP]: {
    label: 'VIP',
    icon: '💎',
    color: '#ffd43b',
    bgColor: 'rgba(255, 212, 59, 0.15)',
    borderColor: 'rgba(255, 212, 59, 0.4)'
  },
  [USER_RANKS.REGULAR]: {
    label: '일반 회원',
    icon: '⭐',
    color: '#64b5f6',
    bgColor: 'rgba(100, 181, 246, 0.15)',
    borderColor: 'rgba(100, 181, 246, 0.4)'
  },
  [USER_RANKS.NEWBIE]: {
    label: '신규 회원',
    icon: '🌱',
    color: '#4cd137',
    bgColor: 'rgba(76, 209, 55, 0.15)',
    borderColor: 'rgba(76, 209, 55, 0.4)'
  }
};

/**
 * 사용자 정보 가져오기 (없으면 생성)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 사용자 정보
 */
export const getUserInfo = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } else {
      // 사용자 정보가 없으면 신규 회원으로 생성
      const newUser = {
        rank: USER_RANKS.NEWBIE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewCount: 0,
        publicReviewCount: 0
      };

      await setDoc(userRef, newUser);

      return {
        id: userId,
        ...newUser
      };
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 사용자 계급 업데이트
 * @param {string} userId - 사용자 ID
 * @param {string} rank - 새 계급
 */
export const updateUserRank = async (userId, rank) => {
  try {
    if (!Object.values(USER_RANKS).includes(rank)) {
      throw new Error('유효하지 않은 계급입니다.');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      rank,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('사용자 계급 업데이트 실패:', error);
    throw error;
  }
};

/**
 * 사용자 리뷰 카운트 업데이트
 * @param {string} userId - 사용자 ID
 * @param {number} reviewCount - 총 리뷰 수
 * @param {number} publicReviewCount - 공개 리뷰 수
 */
export const updateUserReviewCount = async (userId, reviewCount, publicReviewCount) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      reviewCount,
      publicReviewCount,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('리뷰 카운트 업데이트 실패:', error);
    throw error;
  }
};
