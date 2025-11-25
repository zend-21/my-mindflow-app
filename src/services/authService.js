// 🔐 휴대폰 기반 인증 서비스
import { auth, db } from '../firebase/config';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * 휴대폰 번호를 국제 형식으로 변환
 * @param {string} phoneNumber - 입력된 휴대폰 번호 (예: 010-1234-5678, 01012345678)
 * @returns {string} - 국제 형식 번호 (예: +821012345678)
 */
export const formatPhoneNumber = (phoneNumber) => {
  // 모든 공백, 하이픈 제거
  let cleaned = phoneNumber.replace(/[\s-]/g, '');

  // 이미 +82로 시작하면 그대로 반환
  if (cleaned.startsWith('+82')) {
    return cleaned;
  }

  // 0으로 시작하면 +82로 변환
  if (cleaned.startsWith('0')) {
    return '+82' + cleaned.substring(1);
  }

  // 그 외에는 +82 추가
  return '+82' + cleaned;
};

/**
 * 휴대폰 번호로 MindFlow 계정 조회
 * @param {string} phoneNumber - 국제 형식 휴대폰 번호
 * @returns {object|null} - 계정 정보 또는 null
 */
export const findAccountByPhone = async (phoneNumber) => {
  try {
    const formatted = formatPhoneNumber(phoneNumber);
    const accountRef = doc(db, 'phoneToUser', formatted);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
      return {
        phoneNumber: formatted,
        ...accountSnap.data()
      };
    }
    return null;
  } catch (error) {
    // Permission 에러는 문서가 없는 경우이므로 null 반환 (신규 사용자)
    if (error.code === 'permission-denied') {
      console.log('신규 사용자 - 계정 없음:', formatted);
      return null;
    }
    console.error('계정 조회 실패:', error);
    throw error;
  }
};

/**
 * Firebase UID로 연결된 휴대폰 번호 조회
 * @param {string} firebaseUID - Firebase Auth UID
 * @returns {string|null} - 휴대폰 번호 또는 null
 */
export const findPhoneByFirebaseUID = async (firebaseUID) => {
  try {
    const mappingRef = doc(db, 'firebaseUIDToPhone', firebaseUID);
    const mappingSnap = await getDoc(mappingRef);

    if (mappingSnap.exists()) {
      return mappingSnap.data().phoneNumber;
    }
    return null;
  } catch (error) {
    // Permission 에러는 문서가 없는 경우이므로 null 반환 (신규 사용자)
    if (error.code === 'permission-denied') {
      console.log('신규 사용자 - UID 매핑 없음:', firebaseUID);
      return null;
    }
    console.error('UID 매핑 조회 실패:', error);
    return null;
  }
};

/**
 * 새로운 MindFlow 계정 생성
 * @param {string} phoneNumber - 국제 형식 휴대폰 번호
 * @param {string} firebaseUID - Firebase Auth UID
 * @param {object} userInfo - Google 사용자 정보
 * @param {object} certInfo - (선택) 본인인증 정보 (미래 확장용)
 */
export const createMindFlowAccount = async (phoneNumber, firebaseUID, userInfo, certInfo = null) => {
  try {
    const formatted = formatPhoneNumber(phoneNumber);

    // 1. mindflowUsers 컬렉션에 계정 생성
    const userRef = doc(db, 'mindflowUsers', formatted);

    const accountData = {
      userId: formatted,
      createdAt: serverTimestamp(),
      loginMethods: {
        google: {
          email: userInfo.email,
          firebaseUID: firebaseUID,
          linkedAt: serverTimestamp()
        }
      },
      profile: {
        displayName: userInfo.name,
        email: userInfo.email,
        photoURL: userInfo.picture
      }
    };

    // 🔮 미래 확장: 본인인증 정보 추가 (PASS/NICE/KCB)
    if (certInfo) {
      accountData.verification = {
        name: certInfo.name,
        birthDate: certInfo.birthDate,
        CI: certInfo.CI, // 연계정보 (중복가입 확인용)
        verifiedAt: serverTimestamp(),
        provider: certInfo.provider // 'PASS', 'NICE', 'KCB'
      };
    }

    await setDoc(userRef, accountData);

    // 2. phoneToUser 매핑 생성
    const phoneRef = doc(db, 'phoneToUser', formatted);
    await setDoc(phoneRef, {
      userId: formatted,
      createdAt: serverTimestamp()
    });

    // 3. firebaseUIDToPhone 매핑 생성
    const uidRef = doc(db, 'firebaseUIDToPhone', firebaseUID);
    await setDoc(uidRef, {
      phoneNumber: formatted,
      createdAt: serverTimestamp()
    });

    console.log('✅ MindFlow 계정 생성 완료:', formatted);
    return formatted;
  } catch (error) {
    console.error('❌ 계정 생성 실패:', error);
    throw error;
  }
};

/**
 * 기존 계정에 Google 로그인 추가 연결
 * @param {string} phoneNumber - 국제 형식 휴대폰 번호
 * @param {string} firebaseUID - Firebase Auth UID
 * @param {object} userInfo - Google 사용자 정보
 */
export const linkGoogleToAccount = async (phoneNumber, firebaseUID, userInfo) => {
  try {
    const formatted = formatPhoneNumber(phoneNumber);

    // 1. mindflowUsers에 Google 로그인 방법 추가
    const userRef = doc(db, 'mindflowUsers', formatted);
    await updateDoc(userRef, {
      [`loginMethods.google`]: {
        email: userInfo.email,
        firebaseUID: firebaseUID,
        linkedAt: serverTimestamp()
      }
    });

    // 2. firebaseUIDToPhone 매핑 생성
    const uidRef = doc(db, 'firebaseUIDToPhone', firebaseUID);
    await setDoc(uidRef, {
      phoneNumber: formatted,
      linkedAt: serverTimestamp()
    });

    console.log('✅ Google 계정 연결 완료:', formatted);
    return formatted;
  } catch (error) {
    console.error('❌ 계정 연결 실패:', error);
    throw error;
  }
};

/**
 * 구 구조 사용자인지 확인
 * @param {string} firebaseUID - Firebase Auth UID
 * @returns {boolean} - 구 구조 사용자 여부
 */
export const isLegacyUser = async (firebaseUID) => {
  try {
    const oldUserRef = doc(db, 'users', firebaseUID, 'userData', 'memos');
    const oldUserSnap = await getDoc(oldUserRef);
    return oldUserSnap.exists();
  } catch (error) {
    console.error('구 구조 확인 실패:', error);
    return false;
  }
};

/**
 * RecaptchaVerifier 초기화
 * @param {string} containerId - reCAPTCHA 컨테이너 ID
 * @returns {RecaptchaVerifier}
 */
export const initRecaptcha = (containerId = 'recaptcha-container') => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('✅ reCAPTCHA 검증 완료');
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA 만료됨');
      }
    });
  }
  return window.recaptchaVerifier;
};

/**
 * 휴대폰 번호로 인증 코드 발송
 * @param {string} phoneNumber - 국제 형식 휴대폰 번호
 * @returns {object} - confirmationResult
 */
export const sendVerificationCode = async (phoneNumber) => {
  try {
    const formatted = formatPhoneNumber(phoneNumber);
    const appVerifier = initRecaptcha();

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formatted,
      appVerifier
    );

    console.log('✅ 인증 코드 발송 완료:', formatted);
    return confirmationResult;
  } catch (error) {
    console.error('❌ 인증 코드 발송 실패:', error);

    // reCAPTCHA 초기화 실패 시 재시도
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    throw error;
  }
};

/**
 * 인증 코드 확인
 * @param {object} confirmationResult - sendVerificationCode의 반환값
 * @param {string} code - 사용자가 입력한 6자리 코드
 * @returns {object} - UserCredential
 */
export const verifyCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    console.log('✅ 휴대폰 인증 성공');
    return result;
  } catch (error) {
    console.error('❌ 인증 코드 확인 실패:', error);
    throw error;
  }
};

/**
 * 🔮 미래 확장: CI로 계정 조회 (본인인증 연동 시 사용)
 * @param {string} CI - 연계정보 (Connecting Information)
 * @returns {object|null} - 계정 정보 또는 null
 */
export const findAccountByCI = async (CI) => {
  try {
    // 미래 구현: CI 인덱스로 계정 검색
    // const accountsRef = collection(db, 'mindflowUsers');
    // const q = query(accountsRef, where('verification.CI', '==', CI));
    // const snapshot = await getDocs(q);
    // return snapshot.empty ? null : snapshot.docs[0].data();

    console.warn('⚠️ findAccountByCI: 본인인증 미구현 (미래 기능)');
    return null;
  } catch (error) {
    console.error('CI 조회 실패:', error);
    return null;
  }
};

/**
 * 🔮 미래 확장: 본인인증 요청 (PASS/NICE/KCB 연동)
 * @returns {object} - 본인인증 결과 {name, birthDate, phone, CI, provider}
 */
export const requestCertification = async () => {
  // 미래 구현: PASS/NICE/KCB 본인인증 팝업
  // 실제 구현 시 아래 형태로 반환
  throw new Error('본인인증 서비스가 아직 연동되지 않았습니다');

  // 예상 반환 형태:
  // return {
  //   name: '홍길동',
  //   birthDate: '19900101',
  //   phone: '+821012345678',
  //   CI: '고유연계정보_암호화값',
  //   provider: 'PASS' // 또는 'NICE', 'KCB'
  // };
};
