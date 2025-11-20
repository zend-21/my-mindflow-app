// 초대 코드 생성 및 관리 서비스
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 랜덤 초대 코드 생성 (6자리)
 * 예: x7k9m2, a3f8d1
 */
export const generateInviteCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * 사용자의 초대 코드 생성 또는 가져오기
 */
export const getUserInviteCode = async () => {
  const userId = localStorage.getItem('firebaseUserId');
  if (!userId) throw new Error('로그인이 필요합니다');

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('사용자 정보를 찾을 수 없습니다');
  }

  let inviteCode = userDoc.data()?.inviteCode;

  // 초대 코드가 없으면 생성 (중복 체크)
  if (!inviteCode) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      inviteCode = generateInviteCode();

      // 중복 체크
      const isAvailable = await checkInviteCodeAvailable(inviteCode);
      if (isAvailable) {
        // Firestore에 저장
        await setDoc(userRef, { inviteCode }, { merge: true });
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('초대 코드 생성에 실패했습니다');
    }
  }

  return inviteCode;
};

/**
 * 초대 코드 중복 체크
 */
const checkInviteCodeAvailable = async (inviteCode) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);
  return snapshot.empty; // true면 사용 가능
};

/**
 * 초대 코드로 사용자 검색
 */
export const getUserByInviteCode = async (inviteCode) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('inviteCode', '==', inviteCode.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * 초대 링크 생성
 */
export const createInviteLink = async () => {
  const inviteCode = await getUserInviteCode();
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${appUrl}/add/${inviteCode}`;
};
