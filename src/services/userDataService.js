// 🔥 사용자 데이터 Firestore 동기화 서비스 (개별 문서 실시간 동기화)
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

/**
 * Firestore Timestamp 객체를 JavaScript 숫자(밀리초)로 변환하는 헬퍼 함수
 * 백그라운드에서 포그라운드로 돌아올 때 타임스탬프가 Timestamp 객체로 변환되어
 * Invalid Date가 발생하는 문제를 방지합니다.
 */
const convertTimestampsToMillis = (data) => {
  if (!data) return data;

  const converted = { ...data };

  // createdAt 변환
  if (converted.createdAt && typeof converted.createdAt.toMillis === 'function') {
    converted.createdAt = converted.createdAt.toMillis();
  }

  // updatedAt 변환
  if (converted.updatedAt && typeof converted.updatedAt.toMillis === 'function') {
    converted.updatedAt = converted.updatedAt.toMillis();
  }

  // date 필드 변환 (메모에서 사용)
  if (converted.date && typeof converted.date.toMillis === 'function') {
    converted.date = converted.date.toMillis();
  }

  return converted;
};

/**
 * 객체에서 undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
 * @param {Object} obj - 정리할 객체
 * @returns {Object} undefined 값이 제거된 객체
 */
const removeUndefinedValues = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      // 중첩된 객체도 재귀적으로 처리
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = removeUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

/**
 * 🔐 사용자 데이터 구조 (개별 문서 저장 - 산업 표준 방식)
 * mindflowUsers/{userId}/memos/{memoId}
 * mindflowUsers/{userId}/folders/{folderId}
 * mindflowUsers/{userId}/trash/{trashId}
 * mindflowUsers/{userId}/macros/{macroId}
 * mindflowUsers/{userId}/calendar/{dateKey}
 * mindflowUsers/{userId}/activities/{activityId}
 * mindflowUsers/{userId}/userData/settings (단일 문서)
 *
 * 변경 사항:
 * - 배열 저장 방식(items) → 개별 문서 저장으로 완전 리팩토링
 * - 실시간 onSnapshot 리스너 지원
 * - 메모 1개 변경 시 1개만 저장 (효율성 대폭 향상)
 * - 타임스탬프 자동 관리 (serverTimestamp)
 */

// ========================================
// 메모 데이터 (개별 문서)
// ========================================

/**
 * Firestore에서 모든 메모 가져오기
 */
export const fetchMemosFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'memos');
    const snapshot = await getDocs(colRef);

    const memos = [];
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data = convertTimestampsToMillis(rawData);

      // ⭐ Evernote 방식: deleted가 true면 제외 (하위 호환: deleted 없으면 false로 간주)
      if (data.deleted === true) {
        return;  // 삭제된 메모는 스킵
      }

      memos.push({
        id: docSnap.id,
        ...data,
        deleted: data.deleted ?? false  // 명시적으로 false 설정
      });
    });

    return memos;
  } catch (error) {
    console.error('메모 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 단일 메모 저장
 */
export const saveMemoToFirestore = async (userId, memo) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);

    // ⭐ Evernote 방식: 모든 저장에 deleted: false와 serverTimestamp 추가
    const dataToSave = {
      ...memo,
      deleted: false,  // 활성 문서 표시
      updatedAt: serverTimestamp(),  // 서버 시간으로 강제 (기기 시간 조작 방지)
      createdAt: memo.createdAt || serverTimestamp()  // 신규 생성 시에만 설정
    };

    // ⚠️ Firestore는 undefined를 허용하지 않으므로 null로 변환
    const sanitizedData = Object.fromEntries(
      Object.entries(dataToSave).map(([key, value]) => [key, value === undefined ? null : value])
    );

    await setDoc(docRef, sanitizedData);
  } catch (error) {
    console.error('메모 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 메모 삭제 (Soft Delete)
 * ⭐ Evernote 방식: 실제 삭제 대신 deleted 플래그만 설정
 * 다른 기기에서 삭제를 감지할 수 있도록 함
 */
export const deleteMemoFromFirestore = async (userId, memoId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'memos', memoId);

    // ⭐ Soft Delete: deleted 플래그만 설정 (문서는 유지)
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });  // 기존 필드 유지

    console.log(`✅ 메모 soft delete 완료: ${memoId}`);
  } catch (error) {
    console.error('메모 삭제 실패:', error);
    throw error;
  }
};

/**
 * 메모 실시간 리스너 설정
 */
export const setupMemosListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'memos');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };

      callback(change.type, data);
    });
  }, (error) => {
    console.error('메모 리스너 에러:', error);
  });
};

// ========================================
// 메모 폴더 (개별 문서)
// ========================================

/**
 * Firestore에서 모든 폴더 가져오기
 */
export const fetchFoldersFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'folders');
    const snapshot = await getDocs(colRef);

    const folders = [];
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data = convertTimestampsToMillis(rawData);

      if (data.deleted === true) {
        return;  // 삭제된 폴더는 스킵
      }

      folders.push({
        id: docSnap.id,
        ...data,
        deleted: data.deleted ?? false
      });
    });

    return folders;
  } catch (error) {
    console.error('폴더 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 단일 폴더 저장
 */
export const saveFolderToFirestore = async (userId, folder) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'folders', folder.id);
    await setDoc(docRef, {
      ...folder,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: folder.createdAt || serverTimestamp()
    });
  } catch (error) {
    console.error('폴더 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 폴더 삭제 (Soft Delete)
 */
export const deleteFolderFromFirestore = async (userId, folderId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'folders', folderId);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ 폴더 soft delete 완료: ${folderId}`);
  } catch (error) {
    console.error('폴더 삭제 실패:', error);
    throw error;
  }
};

/**
 * 폴더 실시간 리스너 설정
 */
export const setupFoldersListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'folders');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('폴더 리스너 에러:', error);
  });
};

// ========================================
// 휴지통 (개별 문서)
// ========================================

/**
 * Firestore에서 모든 휴지통 항목 가져오기
 */
export const fetchTrashFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'trash');
    const snapshot = await getDocs(colRef);

    const trash = [];
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data = convertTimestampsToMillis(rawData);

      if (data.deleted === true) {
        return;  // 삭제된 휴지통 항목은 스킵
      }

      trash.push({
        id: docSnap.id,
        ...data,
        deleted: data.deleted ?? false
      });
    });

    return trash;
  } catch (error) {
    console.error('휴지통 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 단일 휴지통 항목 저장
 */
export const saveTrashItemToFirestore = async (userId, trashItem) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'trash', trashItem.id);

    // undefined 값 제거
    const cleanData = {};
    Object.keys(trashItem).forEach(key => {
      if (trashItem[key] !== undefined) {
        cleanData[key] = trashItem[key];
      }
    });

    await setDoc(docRef, {
      ...cleanData,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: cleanData.createdAt || serverTimestamp()
    });
  } catch (error) {
    console.error('휴지통 항목 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 휴지통 항목 삭제 (Soft Delete)
 */
export const deleteTrashItemFromFirestore = async (userId, trashId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'trash', trashId);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ 휴지통 항목 soft delete 완료: ${trashId}`);
  } catch (error) {
    console.error('휴지통 항목 삭제 실패:', error);
    throw error;
  }
};

/**
 * 휴지통 실시간 리스너 설정
 */
export const setupTrashListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'trash');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('휴지통 리스너 에러:', error);
  });
};

// ========================================
// 매크로 텍스트 (개별 문서)
// ========================================

/**
 * Firestore에서 모든 매크로 가져오기
 */
export const fetchMacrosFromFirestore = async (userId) => {
  try {
    const userDocRef = doc(db, 'mindflowUsers', userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return [];
    }

    const data = docSnap.data();
    const macros = data?.macros?.items || [];

    // 배열 형태로 반환 (문자열 배열)
    return Array.isArray(macros) ? macros : [];
  } catch (error) {
    console.error('매크로 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 매크로 배열 저장 (사용자 문서의 macros 필드)
 */
export const saveMacroToFirestore = async (userId, macrosArray) => {
  try {
    console.log('🔥 saveMacroToFirestore 호출:', { userId, macrosArray });
    const userDocRef = doc(db, 'mindflowUsers', userId);
    await setDoc(userDocRef, {
      macros: {
        items: macrosArray,
        deleted: false,
        updatedAt: serverTimestamp()
      }
    }, { merge: true });
    console.log('✅ Firestore 매크로 저장 완료');
  } catch (error) {
    console.error('❌ 매크로 저장 실패:', error);
    throw error;
  }
};

/**
 * 매크로는 사용자 문서의 단일 필드로 관리되므로 개별 삭제/리스너 불필요
 * fetchAllUserData에서 macros 필드를 함께 가져옴
 */

// ========================================
// 캘린더 일정 (날짜별 문서)
// ========================================

/**
 * Firestore에서 모든 캘린더 일정 가져오기
 */
export const fetchCalendarFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'calendar');
    const snapshot = await getDocs(colRef);

    const calendar = {};
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data = convertTimestampsToMillis(rawData);

      if (data.deleted === true) {
        return;  // 삭제된 캘린더 일정은 스킵
      }

      calendar[docSnap.id] = data.schedule || {};

      console.log('🔍 [fetchCalendarFromFirestore] 날짜:', docSnap.id, '알람 수:', data.schedule?.alarm?.registeredAlarms?.length);
    });

    console.log('✅ [fetchCalendarFromFirestore] 총', Object.keys(calendar).length, '개 날짜 로드됨');

    return calendar;
  } catch (error) {
    console.error('캘린더 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 특정 날짜의 일정 저장
 */
export const saveCalendarDateToFirestore = async (userId, dateKey, schedule) => {
  try {
    console.log('🔍 [saveCalendarDateToFirestore] 저장 시작:', dateKey);
    console.log('📦 원본 schedule:', JSON.stringify(schedule, null, 2));

    // undefined 값 제거 (재귀적으로 중첩된 객체도 처리)
    const cleanSchedule = removeUndefinedValues(schedule);

    console.log('🧹 cleanSchedule:', JSON.stringify(cleanSchedule, null, 2));
    console.log('📏 cleanSchedule keys:', cleanSchedule ? Object.keys(cleanSchedule) : 'null');

    const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);

    // 빈 스케줄이면 soft delete
    if (!cleanSchedule || Object.keys(cleanSchedule).length === 0) {
      console.warn('⚠️ [saveCalendarDateToFirestore] 빈 스케줄 감지 - soft delete:', dateKey);
      await setDoc(docRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      }, { merge: true });
      return;
    }

    await setDoc(docRef, {
      schedule: cleanSchedule,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: schedule.createdAt || serverTimestamp()
    });

    console.log('✅ [saveCalendarDateToFirestore] Firestore 저장 완료:', dateKey);
  } catch (error) {
    console.error('❌ 캘린더 일정 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 특정 날짜의 일정 삭제 (Soft Delete)
 */
export const deleteCalendarDateFromFirestore = async (userId, dateKey) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ 캘린더 일정 soft delete 완료: ${dateKey}`);
  } catch (error) {
    console.error('캘린더 일정 삭제 실패:', error);
    throw error;
  }
};

/**
 * 캘린더 실시간 리스너 설정
 */
export const setupCalendarListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'calendar');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const dateKey = change.doc.id;
      const rawData = change.doc.data();
      const convertedData = convertTimestampsToMillis(rawData);
      const schedule = convertedData.schedule || {};
      callback(change.type, dateKey, schedule);
    });
  }, (error) => {
    console.error('캘린더 리스너 에러:', error);
  });
};

// ========================================
// 최근 활동 (개별 문서)
// ========================================

/**
 * Firestore에서 모든 활동 가져오기
 */
export const fetchActivitiesFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'activities');
    const snapshot = await getDocs(colRef);

    const activities = [];
    snapshot.forEach((docSnap) => {
      const rawData = docSnap.data();
      const data = convertTimestampsToMillis(rawData);

      if (data.deleted === true) {
        return;  // 삭제된 활동은 스킵
      }

      activities.push({
        id: docSnap.id,
        ...data,
        deleted: data.deleted ?? false
      });
    });

    return activities;
  } catch (error) {
    console.error('활동 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 단일 활동 저장
 */
export const saveActivityToFirestore = async (userId, activity) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'activities', activity.id);
    await setDoc(docRef, {
      ...activity,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: activity.createdAt || serverTimestamp()
    });
  } catch (error) {
    console.error('활동 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 활동 삭제 (Soft Delete)
 */
export const deleteActivityFromFirestore = async (userId, activityId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'activities', activityId);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ 활동 soft delete 완료: ${activityId}`);
  } catch (error) {
    console.error('활동 삭제 실패:', error);
    throw error;
  }
};

/**
 * 활동 실시간 리스너 설정
 */
export const setupActivitiesListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'activities');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const rawData = change.doc.data();
      const data = {
        id: change.doc.id,
        ...convertTimestampsToMillis(rawData)
      };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('활동 리스너 에러:', error);
  });
};

// ========================================
// 사용자 설정 (단일 문서 - 기존 방식 유지)
// ========================================

/**
 * Firestore에서 사용자 설정 가져오기
 */
export const fetchSettingsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = convertTimestampsToMillis(docSnap.data());
      return data;
    }
    return {
      widgets: ['StatsGrid', 'QuickActions', 'RecentActivity'],
      displayCount: 5,
      nickname: null,
      profileImageType: 'avatar',
      selectedAvatarId: null,
      avatarBgColor: 'none'
    };
  } catch (error) {
    console.error('설정 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 사용자 설정 저장
 */
export const saveSettingsToFirestore = async (userId, settings) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    await setDoc(docRef, {
      ...settings,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: settings.createdAt || serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('설정 데이터 저장 실패:', error);
    throw error;
  }
};

/**
 * 설정 실시간 리스너 설정
 */
export const setupSettingsListener = (userId, callback) => {
  const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const rawData = snapshot.data();
      const convertedData = convertTimestampsToMillis(rawData);
      callback(convertedData);
    }
  }, (error) => {
    console.error('설정 리스너 에러:', error);
  });
};

// ========================================
// 운세 프로필 데이터 (Evernote 방식)
// ========================================

/**
 * Firestore에서 운세 프로필 가져오기
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object|null>} 운세 프로필 또는 null
 */
export const fetchFortuneProfileFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const rawData = docSnap.data();
    const data = convertTimestampsToMillis(rawData);

    // ⭐ deleted 체크
    if (data.deleted === true) {
      return null;
    }

    return {
      ...data,
      deleted: data.deleted ?? false
    };
  } catch (error) {
    console.error('운세 프로필 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 운세 프로필 저장
 * @param {string} userId - 사용자 ID
 * @param {Object} fortuneProfile - 운세 프로필 객체 { name, birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, birthCity, ... }
 */
export const saveFortuneProfileToFirestore = async (userId, fortuneProfile) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');

    // ⭐ Evernote 방식: deleted: false, serverTimestamp 추가
    const dataToSave = {
      ...fortuneProfile,
      deleted: false,
      updatedAt: serverTimestamp(),
      createdAt: fortuneProfile.createdAt || serverTimestamp()
    };

    // undefined 값 제거 (중첩 객체 포함)
    const sanitizedData = removeUndefinedValues(dataToSave);

    await setDoc(docRef, sanitizedData, { merge: true });
    console.log('✅ 운세 프로필 Firestore 저장 완료');
  } catch (error) {
    console.error('운세 프로필 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 운세 프로필 삭제 (Soft Delete)
 * @param {string} userId - 사용자 ID
 */
export const deleteFortuneProfileFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'fortuneProfile');

    // ⭐ Soft Delete
    await setDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ 운세 프로필 soft delete 완료');
  } catch (error) {
    console.error('운세 프로필 삭제 실패:', error);
    throw error;
  }
};

// ========================================
// 일괄 데이터 로드
// ========================================

/**
 * 모든 사용자 데이터를 Firestore에서 가져오기
 */
export const fetchAllUserData = async (userId) => {
  try {
    const [memos, folders, trash, macros, calendar, activities, settings] = await Promise.all([
      fetchMemosFromFirestore(userId),
      fetchFoldersFromFirestore(userId),
      fetchTrashFromFirestore(userId),
      fetchMacrosFromFirestore(userId),
      fetchCalendarFromFirestore(userId),
      fetchActivitiesFromFirestore(userId),
      fetchSettingsFromFirestore(userId)
    ]);

    return {
      memos,
      folders,
      trash,
      macros,
      calendar,
      activities,
      settings
    };
  } catch (error) {
    console.error('전체 데이터 가져오기 실패:', error);
    throw error;
  }
};

// ========================================
// 🔄 마이그레이션: 배열 저장 → 개별 문서 저장
// ========================================

/**
 * 구 구조(배열 저장)에서 신 구조(개별 문서)로 데이터 마이그레이션
 */
export const migrateArrayToIndividualDocs = async (userId) => {
  try {
    console.log('🔄 배열 저장 → 개별 문서 마이그레이션 시작...');

    // 구 구조에서 데이터 읽기
    const oldMemosRef = doc(db, 'mindflowUsers', userId, 'userData', 'memos');
    const oldFoldersRef = doc(db, 'mindflowUsers', userId, 'userData', 'folders');
    const oldTrashRef = doc(db, 'mindflowUsers', userId, 'userData', 'trash');
    const oldMacrosRef = doc(db, 'mindflowUsers', userId, 'userData', 'macros');
    const oldCalendarRef = doc(db, 'mindflowUsers', userId, 'userData', 'calendar');
    const oldActivitiesRef = doc(db, 'mindflowUsers', userId, 'userData', 'activities');

    const [memosSnap, foldersSnap, trashSnap, macrosSnap, calendarSnap, activitiesSnap] =
      await Promise.all([
        getDoc(oldMemosRef),
        getDoc(oldFoldersRef),
        getDoc(oldTrashRef),
        getDoc(oldMacrosRef),
        getDoc(oldCalendarRef),
        getDoc(oldActivitiesRef)
      ]);

    const batch = writeBatch(db);

    // 메모 마이그레이션
    if (memosSnap.exists() && memosSnap.data().items) {
      const memos = memosSnap.data().items;
      memos.forEach(memo => {
        if (memo.id) {
          const docRef = doc(db, 'mindflowUsers', userId, 'memos', String(memo.id));
          batch.set(docRef, {
            ...memo,
            id: String(memo.id), // ID도 문자열로 저장
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 메모 ${memos.length}개 마이그레이션 준비`);
    }

    // 폴더 마이그레이션
    if (foldersSnap.exists() && foldersSnap.data().items) {
      const folders = foldersSnap.data().items;
      folders.forEach(folder => {
        if (folder.id) {
          const docRef = doc(db, 'mindflowUsers', userId, 'folders', String(folder.id));
          batch.set(docRef, {
            ...folder,
            id: String(folder.id),
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 폴더 ${folders.length}개 마이그레이션 준비`);
    }

    // 휴지통 마이그레이션
    if (trashSnap.exists() && trashSnap.data().items) {
      const trash = trashSnap.data().items;
      trash.forEach(item => {
        if (item.id) {
          // undefined 제거
          const cleanItem = {};
          Object.keys(item).forEach(key => {
            if (item[key] !== undefined) {
              cleanItem[key] = item[key];
            }
          });

          const docRef = doc(db, 'mindflowUsers', userId, 'trash', String(item.id));
          batch.set(docRef, {
            ...cleanItem,
            id: String(item.id),
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 휴지통 ${trash.length}개 마이그레이션 준비`);
    }

    // 매크로 마이그레이션
    if (macrosSnap.exists() && macrosSnap.data().items) {
      const macros = macrosSnap.data().items;
      macros.forEach(macro => {
        if (macro.id) {
          const docRef = doc(db, 'mindflowUsers', userId, 'macros', String(macro.id));
          batch.set(docRef, {
            ...macro,
            id: String(macro.id),
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 매크로 ${macros.length}개 마이그레이션 준비`);
    }

    // 캘린더 마이그레이션
    if (calendarSnap.exists() && calendarSnap.data().schedules) {
      const calendar = calendarSnap.data().schedules;
      Object.entries(calendar).forEach(([dateKey, schedule]) => {
        // undefined 제거
        const cleanSchedule = {};
        Object.keys(schedule).forEach(key => {
          if (schedule[key] !== undefined && schedule[key] !== null) {
            cleanSchedule[key] = schedule[key];
          }
        });

        if (Object.keys(cleanSchedule).length > 0) {
          const docRef = doc(db, 'mindflowUsers', userId, 'calendar', String(dateKey));
          batch.set(docRef, {
            schedule: cleanSchedule,
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 캘린더 ${Object.keys(calendar).length}개 날짜 마이그레이션 준비`);
    }

    // 활동 마이그레이션
    if (activitiesSnap.exists() && activitiesSnap.data().items) {
      const activities = activitiesSnap.data().items;
      activities.forEach(activity => {
        if (activity.id) {
          const docRef = doc(db, 'mindflowUsers', userId, 'activities', String(activity.id));
          batch.set(docRef, {
            ...activity,
            id: String(activity.id),
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`✅ 활동 ${activities.length}개 마이그레이션 준비`);
    }

    // 일괄 저장
    await batch.commit();
    console.log('✅ 배열 → 개별 문서 마이그레이션 완료!');

    // 마이그레이션 완료 플래그 저장
    const migrationFlagRef = doc(db, 'mindflowUsers', userId, 'userData', 'migrationStatus');
    await setDoc(migrationFlagRef, {
      arrayToIndividualDocs: true,
      migratedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ 배열 → 개별 문서 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * localStorage 데이터를 Firestore로 마이그레이션 (개별 문서로 직접 저장)
 */
export const migrateLocalStorageToFirestore = async (userId) => {
  try {
    console.log('📦 localStorage → Firestore (개별 문서) 마이그레이션 시작...');

    // ⚠️ 계정별 localStorage만 읽기 (공유 키 사용 안 함)
    const getUserStorage = (key) => {
      const data = localStorage.getItem(`user_${userId}_${key}`);
      return data ? JSON.parse(data) : null;
    };

    const memos = getUserStorage('memos') || [];
    const folders = getUserStorage('folders') || [];
    const trash = getUserStorage('trash') || [];
    const macros = getUserStorage('macros') || [];
    const calendar = getUserStorage('calendar') || {};
    const activities = getUserStorage('activities') || [];

    const settings = {
      widgets: getUserStorage('widgets') || ['StatsGrid', 'QuickActions', 'RecentActivity'],
      displayCount: getUserStorage('displayCount') || 5,
      nickname: getUserStorage('nickname') || null,
      profileImageType: getUserStorage('profileImageType') || 'avatar',
      selectedAvatarId: getUserStorage('selectedAvatarId') || null,
      avatarBgColor: getUserStorage('avatarBgColor') || 'none'
    };

    const batch = writeBatch(db);

    // 메모 저장
    memos.forEach(memo => {
      if (memo.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);
        batch.set(docRef, { ...memo, updatedAt: serverTimestamp() });
      }
    });

    // 폴더 저장
    folders.forEach(folder => {
      if (folder.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'folders', folder.id);
        batch.set(docRef, { ...folder, updatedAt: serverTimestamp() });
      }
    });

    // 휴지통 저장
    trash.forEach(item => {
      if (item.id) {
        const cleanItem = {};
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined) {
            cleanItem[key] = item[key];
          }
        });
        const docRef = doc(db, 'mindflowUsers', userId, 'trash', item.id);
        batch.set(docRef, { ...cleanItem, updatedAt: serverTimestamp() });
      }
    });

    // 매크로 저장
    macros.forEach(macro => {
      if (macro.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'macros', macro.id);
        batch.set(docRef, { ...macro, updatedAt: serverTimestamp() });
      }
    });

    // 캘린더 저장
    Object.entries(calendar).forEach(([dateKey, schedule]) => {
      // dateKey가 문자열이 아니면 문자열로 변환
      const safeKey = typeof dateKey === 'string' ? dateKey : String(dateKey);

      const cleanSchedule = {};
      Object.keys(schedule).forEach(key => {
        if (schedule[key] !== undefined && schedule[key] !== null) {
          cleanSchedule[key] = schedule[key];
        }
      });

      if (Object.keys(cleanSchedule).length > 0) {
        const docRef = doc(db, 'mindflowUsers', userId, 'calendar', safeKey);
        batch.set(docRef, { schedule: cleanSchedule, updatedAt: serverTimestamp() });
      }
    });

    // 활동 저장
    activities.forEach(activity => {
      if (activity.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'activities', activity.id);
        batch.set(docRef, { ...activity, updatedAt: serverTimestamp() });
      }
    });

    // 일괄 저장
    await batch.commit();

    // 설정 저장 (별도 - merge 옵션 필요)
    await saveSettingsToFirestore(userId, settings);

    console.log('✅ localStorage 마이그레이션 완료!');
    console.log(`- 메모: ${memos.length}개`);
    console.log(`- 폴더: ${folders.length}개`);
    console.log(`- 휴지통: ${trash.length}개`);
    console.log(`- 매크로: ${macros.length}개`);
    console.log(`- 캘린더: ${Object.keys(calendar).length}개 날짜`);
    console.log(`- 활동: ${activities.length}개`);

    return true;
  } catch (error) {
    console.error('❌ localStorage 마이그레이션 실패:', error);
    throw error;
  }
};

/**
 * 구 구조 Firestore 데이터를 신 구조로 마이그레이션 (Firebase Auth 기반 → 휴대폰 기반)
 */
export const migrateLegacyFirestoreData = async (firebaseUID, userId) => {
  try {
    console.log('🔄 구 구조 → 신 구조 Firestore 마이그레이션 시작...');
    console.log(`  - 원본: users/${firebaseUID}/userData/*`);
    console.log(`  - 대상: mindflowUsers/${userId}/*`);

    // 구 구조에서 데이터 읽기
    const [memosSnap, foldersSnap, trashSnap, macrosSnap, calendarSnap, activitiesSnap, settingsSnap] =
      await Promise.all([
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'memos')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'folders')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'trash')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'macros')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'calendar')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'activities')),
        getDoc(doc(db, 'users', firebaseUID, 'userData', 'settings'))
      ]);

    const memos = memosSnap.exists() ? (memosSnap.data().items || []) : [];
    const folders = foldersSnap.exists() ? (foldersSnap.data().items || []) : [];
    const trash = trashSnap.exists() ? (trashSnap.data().items || []) : [];
    const macros = macrosSnap.exists() ? (macrosSnap.data().items || []) : [];
    const calendar = calendarSnap.exists() ? (calendarSnap.data().schedules || {}) : {};
    const activities = activitiesSnap.exists() ? (activitiesSnap.data().items || []) : [];
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};

    const hasData = memos.length > 0 || folders.length > 0 || trash.length > 0 ||
                    macros.length > 0 || Object.keys(calendar).length > 0 ||
                    activities.length > 0 || Object.keys(settings).length > 0;

    if (!hasData) {
      console.log('⚠️ 마이그레이션할 구 구조 데이터가 없습니다.');
      return false;
    }

    const batch = writeBatch(db);

    // 개별 문서로 저장
    memos.forEach(memo => {
      if (memo.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);
        batch.set(docRef, { ...memo, updatedAt: serverTimestamp() });
      }
    });

    folders.forEach(folder => {
      if (folder.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'folders', folder.id);
        batch.set(docRef, { ...folder, updatedAt: serverTimestamp() });
      }
    });

    trash.forEach(item => {
      if (item.id) {
        const cleanItem = {};
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined) {
            cleanItem[key] = item[key];
          }
        });
        const docRef = doc(db, 'mindflowUsers', userId, 'trash', item.id);
        batch.set(docRef, { ...cleanItem, updatedAt: serverTimestamp() });
      }
    });

    macros.forEach(macro => {
      if (macro.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'macros', macro.id);
        batch.set(docRef, { ...macro, updatedAt: serverTimestamp() });
      }
    });

    Object.entries(calendar).forEach(([dateKey, schedule]) => {
      // dateKey가 문자열이 아니면 문자열로 변환
      const safeKey = typeof dateKey === 'string' ? dateKey : String(dateKey);

      const cleanSchedule = {};
      Object.keys(schedule).forEach(key => {
        if (schedule[key] !== undefined && schedule[key] !== null) {
          cleanSchedule[key] = schedule[key];
        }
      });

      if (Object.keys(cleanSchedule).length > 0) {
        const docRef = doc(db, 'mindflowUsers', userId, 'calendar', safeKey);
        batch.set(docRef, { schedule: cleanSchedule, updatedAt: serverTimestamp() });
      }
    });

    activities.forEach(activity => {
      if (activity.id) {
        const docRef = doc(db, 'mindflowUsers', userId, 'activities', activity.id);
        batch.set(docRef, { ...activity, updatedAt: serverTimestamp() });
      }
    });

    await batch.commit();

    // 설정 저장
    if (Object.keys(settings).length > 0) {
      await saveSettingsToFirestore(userId, settings);
    }

    console.log('✅ 구 구조 → 신 구조 마이그레이션 완료!');
    console.log(`  - 메모: ${memos.length}개`);
    console.log(`  - 폴더: ${folders.length}개`);
    console.log(`  - 휴지통: ${trash.length}개`);
    console.log(`  - 매크로: ${macros.length}개`);
    console.log(`  - 캘린더: ${Object.keys(calendar).length}개 날짜`);
    console.log(`  - 활동: ${activities.length}개`);

    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('⚠️ 구 구조 데이터 없음 (신규 사용자)');
      return false;
    }
    console.error('❌ 구 구조 마이그레이션 실패:', error);
    throw error;
  }
};

// ========================================
// 시크릿 페이지 데이터 (기존 방식 유지)
// ========================================

export const fetchSecretPinFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPin');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().pinHash || null;
    }
    return null;
  } catch (error) {
    console.error('시크릿 PIN 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretPinToFirestore = async (userId, pinHash) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPin');
    await setDoc(docRef, {
      pinHash,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 PIN 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretDocsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().encryptedData || '';
    }
    return '';
  } catch (error) {
    console.error('시크릿 문서 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretDocsToFirestore = async (userId, encryptedData) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    await setDoc(docRef, {
      encryptedData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 문서 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretSettingsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretSettings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
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
  } catch (error) {
    console.error('시크릿 설정 가져오기 실패:', error);
    throw error;
  }
};

export const saveSecretSettingsToFirestore = async (userId, settings) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretSettings');
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('시크릿 설정 저장 실패:', error);
    throw error;
  }
};

export const fetchDeletedSecretDocIds = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDeletedIds');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().deletedIds || [];
    }
    return [];
  } catch (error) {
    console.error('삭제된 시크릿 문서 ID 가져오기 실패:', error);
    throw error;
  }
};

export const saveDeletedSecretDocIds = async (userId, deletedIds) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDeletedIds');
    await setDoc(docRef, {
      deletedIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('삭제된 시크릿 문서 ID 저장 실패:', error);
    throw error;
  }
};

export const fetchPendingCleanupIds = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPendingCleanup');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().pendingIds || [];
    }
    return [];
  } catch (error) {
    console.error('대기 중인 정리 ID 가져오기 실패:', error);
    throw error;
  }
};

export const savePendingCleanupIds = async (userId, pendingIds) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretPendingCleanup');
    await setDoc(docRef, {
      pendingIds,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('대기 중인 정리 ID 저장 실패:', error);
    throw error;
  }
};

export const fetchSecretDocsMetadata = async (userId) => {
  try {
    const metadataRef = doc(db, 'mindflowUsers', userId, 'secretDocs', 'metadata');
    const metadataSnap = await getDoc(metadataRef);

    if (metadataSnap.exists()) {
      return metadataSnap.data();
    }
    return { count: 0, updatedAt: null };
  } catch (error) {
    console.error('시크릿 메타데이터 가져오기 실패:', error);
    return { count: 0, updatedAt: null };
  }
};

export const fetchIndividualSecretDocsFromFirestore = async (userId, docId = null) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    // 🚀 최적화: 단일 문서만 요청하는 경우
    if (docId) {
      const docRef = doc(colRef, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // ⭐ deleted 체크
      if (data.deleted === true) {
        return null;
      }

      return {
        id: docSnap.id,
        encryptedData: data.encryptedData || '',
        deleted: data.deleted ?? false
      };
    }

    // 전체 문서 요청
    const querySnapshot = await getDocs(colRef);

    const docs = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'metadata') {
        const data = docSnap.data();

        // ⭐ deleted 체크
        if (data.deleted === true) {
          return;  // 스킵
        }

        docs.push({
          id: docSnap.id,
          encryptedData: data.encryptedData || '',
          deleted: data.deleted ?? false,
          updatedAt: data.updatedAt  // ⭐ Firestore 타임스탬프 추가 (timestamp comparison용)
        });
      }
    });

    return docs;
  } catch (error) {
    console.error('개별 시크릿 문서 가져오기 실패:', error);
    throw error;
  }
};

export const saveIndividualSecretDocsToFirestore = async (userId, encryptedDocs) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    encryptedDocs.forEach((encDoc) => {
      const docRef = doc(colRef, encDoc.id);
      batch.set(docRef, {
        encryptedData: encDoc.encryptedData,
        deleted: false,  // ⭐ Evernote 방식
        updatedAt: serverTimestamp(),
        createdAt: encDoc.createdAt || serverTimestamp()
      }, { merge: true });
    });

    const metadataRef = doc(colRef, 'metadata');
    batch.set(metadataRef, {
      count: encryptedDocs.length,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
  } catch (error) {
    console.error('개별 시크릿 문서 저장 실패:', error);
    throw error;
  }
};

export const deleteIndividualSecretDocsFromFirestore = async (userId, docIds) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    docIds.forEach((docId) => {
      const docRef = doc(colRef, docId);
      // ⭐ Soft Delete
      batch.set(docRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`✅ 시크릿 문서 soft delete 완료: ${docIds.join(', ')}`);
  } catch (error) {
    console.error('개별 시크릿 문서 삭제 실패:', error);
    throw error;
  }
};

export const migrateToIndividualEncryption = async (userId) => {
  try {
    const oldDocRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists() || !oldDocSnap.data().encryptedData) {
      console.log('✅ 마이그레이션 불필요: 기존 데이터 없음');
      return { migrated: false, reason: 'no-old-data' };
    }

    console.log('🔄 마이그레이션 시작: 단일 blob → 개별 문서 암호화');
    return { migrated: false, reason: 'needs-pin', oldData: oldDocSnap.data().encryptedData };
  } catch (error) {
    console.error('❌ 마이그레이션 확인 실패:', error);
    throw error;
  }
};

// ========================================
// 🔄 Backwards Compatibility: Array-based functions for legacy hooks
// ========================================

/**
 * Save all memos as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} memos - Array of memo objects
 */
export const saveMemosToFirestore = async (userId, memos) => {
  if (!Array.isArray(memos) || memos.length === 0) return;

  const batch = writeBatch(db);
  memos.forEach(memo => {
    if (memo.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);
      // 새로 생성된 메모(updatedAt이 없음)는 updatedAt을 추가하지 않음
      // 수정된 메모(updatedAt이 이미 있음)만 updatedAt을 업데이트
      const dataToSave = memo.updatedAt
        ? { ...memo, updatedAt: serverTimestamp() }
        : { ...memo };
      batch.set(docRef, dataToSave);
    }
  });
  await batch.commit();
};

/**
 * Save all folders as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} folders - Array of folder objects
 */
export const saveFoldersToFirestore = async (userId, folders) => {
  if (!Array.isArray(folders) || folders.length === 0) return;

  const batch = writeBatch(db);
  folders.forEach(folder => {
    if (folder.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'folders', folder.id);
      batch.set(docRef, { ...folder, updatedAt: serverTimestamp() });
    }
  });
  await batch.commit();
};

/**
 * Save all trash items as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} trash - Array of trash objects
 */
export const saveTrashToFirestore = async (userId, trash) => {
  if (!Array.isArray(trash) || trash.length === 0) return;

  const batch = writeBatch(db);
  trash.forEach(item => {
    if (item.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'trash', item.id);
      // undefined 값 제거 후 저장
      const cleanedItem = removeUndefinedValues({ ...item, updatedAt: serverTimestamp() });
      batch.set(docRef, cleanedItem);
    }
  });
  await batch.commit();
};

/**
 * Save all macros as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} macros - Array of macro objects
 */
export const saveMacrosToFirestore = async (userId, macros) => {
  if (!Array.isArray(macros) || macros.length === 0) return;

  const batch = writeBatch(db);
  macros.forEach(macro => {
    if (macro.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'macros', macro.id);
      batch.set(docRef, { ...macro, updatedAt: serverTimestamp() });
    }
  });
  await batch.commit();
};

/**
 * Save all calendar events as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} calendar - Array of calendar event objects
 */
export const saveCalendarToFirestore = async (userId, calendar) => {
  if (!Array.isArray(calendar) || calendar.length === 0) return;

  const batch = writeBatch(db);
  calendar.forEach(event => {
    if (event.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'calendar', event.id);
      batch.set(docRef, { ...event, updatedAt: serverTimestamp() });
    }
  });
  await batch.commit();
};

/**
 * Save all activities as individual documents (backwards compatible)
 * @param {string} userId - User ID
 * @param {Array} activities - Array of activity objects
 */
export const saveActivitiesToFirestore = async (userId, activities) => {
  if (!Array.isArray(activities) || activities.length === 0) return;

  const batch = writeBatch(db);
  activities.forEach(activity => {
    if (activity.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'activities', activity.id);
      batch.set(docRef, { ...activity, updatedAt: serverTimestamp() });
    }
  });
  await batch.commit();
};

/**
 * base64 이미지가 포함된 캘린더 데이터 삭제
 * @param {string} userId - User ID
 * @returns {Promise<number>} - 삭제된 항목 수
 */
export const deleteBase64ImagesFromCalendar = async (userId) => {
  console.log('🧹 캘린더에서 base64 이미지 정리 시작...\n');

  const calendarRef = collection(db, 'mindflowUsers', userId, 'calendar');
  const snapshot = await getDocs(calendarRef);

  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    const dateKey = docSnap.id;
    const data = docSnap.data();

    if (data.text && data.text.includes('data:image')) {
      console.log(`📅 ${dateKey}: base64 이미지 발견 - 삭제 중...`);
      await deleteDoc(doc(db, 'mindflowUsers', userId, 'calendar', dateKey));
      deletedCount++;
    }
  }

  console.log(`✅ 완료! ${deletedCount}개 날짜 데이터 삭제됨`);

  // localStorage도 정리
  localStorage.removeItem('firestore_saved_calendar_all');
  localStorage.removeItem('calendarSchedules_shared');
  console.log('✅ localStorage 캘린더 데이터도 정리됨');

  return deletedCount;
};

// ========================================
// 🗑️ 사용자 전체 데이터 삭제
// ========================================

/**
 * 특정 사용자의 모든 Firestore 데이터를 삭제합니다
 * @param {string} userId - 사용자 UID
 * @returns {Promise<Object>} 삭제된 항목 수
 */
export const deleteAllUserData = async (userId) => {
  if (!userId) {
    throw new Error('userId가 필요합니다');
  }

  console.log('🗑️ 사용자 데이터 전체 삭제 시작:', userId);

  const deleteCounts = {
    memos: 0,
    folders: 0,
    trash: 0,
    calendar: 0,
    activities: 0,
    settings: 0
  };

  try {
    // 1. 메모 삭제
    const memosRef = collection(db, 'mindflowUsers', userId, 'memos');
    const memosSnapshot = await getDocs(memosRef);
    const memoBatch = writeBatch(db);
    memosSnapshot.docs.forEach(doc => {
      memoBatch.delete(doc.ref);
      deleteCounts.memos++;
    });
    if (deleteCounts.memos > 0) await memoBatch.commit();

    // 2. 폴더 삭제
    const foldersRef = collection(db, 'mindflowUsers', userId, 'folders');
    const foldersSnapshot = await getDocs(foldersRef);
    const folderBatch = writeBatch(db);
    foldersSnapshot.docs.forEach(doc => {
      folderBatch.delete(doc.ref);
      deleteCounts.folders++;
    });
    if (deleteCounts.folders > 0) await folderBatch.commit();

    // 3. 휴지통 삭제
    const trashRef = collection(db, 'mindflowUsers', userId, 'trash');
    const trashSnapshot = await getDocs(trashRef);
    const trashBatch = writeBatch(db);
    trashSnapshot.docs.forEach(doc => {
      trashBatch.delete(doc.ref);
      deleteCounts.trash++;
    });
    if (deleteCounts.trash > 0) await trashBatch.commit();

    // 4. 캘린더 삭제
    const calendarRef = collection(db, 'mindflowUsers', userId, 'calendar');
    const calendarSnapshot = await getDocs(calendarRef);
    const calendarBatch = writeBatch(db);
    calendarSnapshot.docs.forEach(doc => {
      calendarBatch.delete(doc.ref);
      deleteCounts.calendar++;
    });
    if (deleteCounts.calendar > 0) await calendarBatch.commit();

    // 5. 활동 삭제
    const activitiesRef = collection(db, 'mindflowUsers', userId, 'activities');
    const activitiesSnapshot = await getDocs(activitiesRef);
    const activityBatch = writeBatch(db);
    activitiesSnapshot.docs.forEach(doc => {
      activityBatch.delete(doc.ref);
      deleteCounts.activities++;
    });
    if (deleteCounts.activities > 0) await activityBatch.commit();

    // 6. 설정 삭제
    const settingsRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      await deleteDoc(settingsRef);
      deleteCounts.settings = 1;
    }

    console.log('✅ Firestore 데이터 삭제 완료:', deleteCounts);

    // localStorage의 계정별 데이터도 삭제
    const prefix = `user_${userId}_`;
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
    console.log(`✅ localStorage 데이터도 삭제: ${keysToDelete.length}개 항목`);

    return deleteCounts;
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error);
    throw error;
  }
};

// 전역 함수로 등록 (개발자 도구에서 쉽게 접근)
if (typeof window !== 'undefined') {
  window._cleanupUserData = async () => {
    const userId = localStorage.getItem('firebaseUserId') || localStorage.getItem('currentUserId');
    if (!userId) {
      console.error('❌ 로그인된 사용자가 없습니다');
      return;
    }

    const confirmed = confirm(`⚠️ 경고!\n\n사용자 "${userId}"의 모든 데이터를 삭제합니다.\n\n✅ Firestore 데이터\n✅ localStorage 데이터\n\n이 작업은 되돌릴 수 없습니다!\n\n정말 삭제하시겠습니까?`);

    if (confirmed) {
      try {
        const result = await deleteAllUserData(userId);
        console.log('✅ 데이터 정리 완료!', result);
        alert('데이터가 모두 삭제되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('❌ 오류 발생:', error);
        alert('데이터 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  console.log('💡 데이터 정리 함수 사용법:\n\n  window._cleanupUserData()\n\n⚠️ 경고: 현재 로그인된 사용자의 모든 데이터를 삭제합니다!');
}
