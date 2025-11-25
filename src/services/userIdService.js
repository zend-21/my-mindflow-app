// 고유 사용자 ID 생성 및 관리

import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * 고유 ID 생성 (초기 자동 생성용)
 * ⚠️ 중요: 이 ID는 한번 생성되면 변경 불가능합니다!
 * 형식: 영문 소문자 + 숫자 6자리
 * 예: a3x7y2, k9m4p1, z2b5n8
 * 용도: 친구 검색, 친구 추가 링크 등
 * 사용자에게 표시: "당신의 ID: a3x7y2"
 */
export const generateUniqueId = () => {
  // 영문 소문자 + 숫자만 사용 (36진수: a-z, 0-9)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';

  // 6자리 랜덤 생성
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    id += chars[randomIndex];
  }

  return id;
};

/**
 * 고유 ID 유효성 검사
 * @returns {object} { valid: boolean, message: string }
 */
export const validateUniqueId = (uniqueId) => {
  // 길이 체크 (정확히 6자리)
  if (uniqueId.length !== 6) {
    return { valid: false, message: 'ID는 6자리여야 합니다' };
  }

  // 문자 체크 (영문 소문자 + 숫자만)
  const regex = /^[a-z0-9]+$/;
  if (!regex.test(uniqueId)) {
    return {
      valid: false,
      message: '영문 소문자와 숫자만 사용 가능합니다'
    };
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
 * ⚠️ 중요: uniqueId는 변경 불가능합니다! 이미 설정된 경우 에러를 발생시킵니다.
 */
export const setUserUniqueId = async (uniqueId) => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  // 이미 uniqueId가 설정되어 있으면 변경 불가
  if (userDoc.exists() && userDoc.data().uniqueId) {
    throw new Error('ID는 변경할 수 없습니다. 이미 설정된 ID: ' + userDoc.data().uniqueId);
  }

  await setDoc(userRef, { uniqueId, createdAt: new Date().toISOString() }, { merge: true });
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
