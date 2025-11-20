// 고유 사용자 ID 생성 및 관리

import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * 고유 ID 생성 (초기 자동 생성용)
 * 형식: displayName_랜덤4자리
 * 예: hong_gildong_a3f2
 * 나중에 사용자가 원하는 ID로 변경 가능
 */
export const generateUniqueId = (displayName) => {
  let cleanName = displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  // 빈 문자열이거나 영문으로 시작하지 않으면 기본값 사용
  if (!cleanName || !/^[a-z]/.test(cleanName)) {
    cleanName = 'user';
  }

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${cleanName}_${randomSuffix}`;
};

/**
 * 고유 ID 유효성 검사
 * @returns {object} { valid: boolean, message: string }
 */
export const validateUniqueId = (uniqueId) => {
  // 길이 체크
  if (uniqueId.length < 3) {
    return { valid: false, message: '3자 이상 입력해주세요' };
  }
  if (uniqueId.length > 20) {
    return { valid: false, message: '20자 이하로 입력해주세요' };
  }

  // 문자 체크 (소문자, 숫자, 언더바만)
  const regex = /^[a-z0-9_]+$/;
  if (!regex.test(uniqueId)) {
    return {
      valid: false,
      message: '영문 소문자, 숫자, 언더바(_)만 사용 가능합니다'
    };
  }

  // 첫 글자는 영문이어야 함
  if (!/^[a-z]/.test(uniqueId)) {
    return { valid: false, message: '첫 글자는 영문이어야 합니다' };
  }

  return { valid: true, message: '사용 가능한 ID입니다' };
};

/**
 * 고유 ID 중복 체크
 */
export const checkUniqueIdAvailable = async (uniqueId) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uniqueId', '==', uniqueId));
  const snapshot = await getDocs(q);
  return snapshot.empty; // true면 사용 가능
};

/**
 * 사용자 프로필에 고유 ID 설정
 */
export const setUserUniqueId = async (uniqueId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { uniqueId, updatedAt: new Date().toISOString() }, { merge: true });
};

/**
 * 고유 ID로 사용자 검색
 */
export const searchByUniqueId = async (uniqueId) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uniqueId', '==', uniqueId.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * 초대 코드 생성
 */
export const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

/**
 * 초대 코드로 사용자 검색
 */
export const getUserByInviteCode = async (inviteCode) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * 내 초대 링크 가져오기
 */
export const getMyInviteLink = async () => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  let inviteCode = userDoc.data()?.inviteCode;

  // 초대 코드가 없으면 생성
  if (!inviteCode) {
    inviteCode = generateInviteCode();
    await setDoc(userRef, { inviteCode }, { merge: true });
  }

  // 웹 URL (나중에 딥링크로 변경 가능)
  return `${window.location.origin}/invite/${inviteCode}`;
};
