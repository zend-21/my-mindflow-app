// 🔥 사용자 데이터 Firestore 동기화 서비스
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
// 🔐 E2EE DISABLED - 향후 재활성화 시 사용
// import { encryptArray, decryptArray, encryptCalendar, decryptCalendar } from './encryptionService';
// import { getEncryptionKey } from './keyManagementService';

/**
 * 🔐 사용자 데이터 구조 (휴대폰 기반 인증)
 * mindflowUsers/{phoneNumber}/userData/{dataType}
 *
 * Primary ID: 휴대폰 번호 (국제 형식, 예: +821012345678)
 *
 * dataType:
 * - memos: 메모 데이터
 * - folders: 메모 폴더
 * - trash: 휴지통
 * - macros: 매크로 텍스트
 * - calendar: 캘린더 일정
 * - activities: 최근 활동
 * - settings: 사용자 설정 (위젯, 닉네임, 아바타 등)
 */

// ========================================
// 메모 데이터
// ========================================

/**
 * Firestore에서 메모 데이터 가져오기
 */
export const fetchMemosFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'memos');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedMemos = docSnap.data().items || [];

      // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
      // const key = getEncryptionKey();
      // if (key && encryptedMemos.length > 0) {
      //   return await decryptArray(encryptedMemos, key, ['content']);
      // }

      return encryptedMemos;
    }
    return [];
  } catch (error) {
    console.error('메모 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 메모 데이터 저장
 */
export const saveMemosToFirestore = async (userId, memos) => {
  try {
    // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
    // const key = getEncryptionKey();
    let dataToSave = memos;

    // if (key && memos.length > 0) {
    //   dataToSave = await encryptArray(memos, key, ['content']);
    // }

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'memos');
    await setDoc(docRef, {
      items: dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('메모 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 메모 폴더
// ========================================

/**
 * Firestore에서 메모 폴더 데이터 가져오기
 */
export const fetchFoldersFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'folders');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error('폴더 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 메모 폴더 데이터 저장
 */
export const saveFoldersToFirestore = async (userId, folders) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'folders');
    await setDoc(docRef, {
      items: folders,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('폴더 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 휴지통
// ========================================

/**
 * Firestore에서 휴지통 데이터 가져오기
 */
export const fetchTrashFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'trash');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedTrash = docSnap.data().items || [];

      // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
      // const key = getEncryptionKey();
      // if (key && encryptedTrash.length > 0) {
      //   return await decryptArray(encryptedTrash, key, ['content']);
      // }

      return encryptedTrash;
    }
    return [];
  } catch (error) {
    console.error('휴지통 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 휴지통 데이터 저장
 */
export const saveTrashToFirestore = async (userId, trash) => {
  try {
    // Ensure trash is an array
    const trashArray = Array.isArray(trash) ? trash : [];

    // undefined 값 필터링 (재귀적으로 중첩 객체까지)
    const removeUndefined = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(removeUndefined);

      const cleaned = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      });
      return cleaned;
    };

    const cleanedTrash = trashArray.map(item => removeUndefined(item));

    // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
    // const key = getEncryptionKey();
    let dataToSave = cleanedTrash;

    // if (key && cleanedTrash.length > 0) {
    //   dataToSave = await encryptArray(cleanedTrash, key, ['content']);
    // }

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'trash');
    await setDoc(docRef, {
      items: dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('휴지통 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 매크로 텍스트
// ========================================

/**
 * Firestore에서 매크로 데이터 가져오기
 */
export const fetchMacrosFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'macros');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedMacros = docSnap.data().items || [];

      // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
      // const key = getEncryptionKey();
      // if (key && encryptedMacros.length > 0) {
      //   return await decryptArray(encryptedMacros, key, ['content']);
      // }

      return encryptedMacros;
    }
    return [];
  } catch (error) {
    console.error('매크로 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 매크로 데이터 저장
 */
export const saveMacrosToFirestore = async (userId, macros) => {
  try {
    // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
    // const key = getEncryptionKey();
    let dataToSave = macros;

    // if (key && macros.length > 0) {
    //   dataToSave = await encryptArray(macros, key, ['content']);
    // }

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'macros');
    await setDoc(docRef, {
      items: dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('매크로 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 캘린더 일정
// ========================================

/**
 * Firestore에서 캘린더 일정 데이터 가져오기
 */
export const fetchCalendarFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'calendar');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedCalendar = docSnap.data().schedules || {};

      // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
      // const key = getEncryptionKey();
      // if (key && Object.keys(encryptedCalendar).length > 0) {
      //   return await decryptCalendar(encryptedCalendar, key);
      // }

      return encryptedCalendar;
    }
    return {};
  } catch (error) {
    console.error('캘린더 데이터 가져오기 실패:', error);
    throw error;
  }
};

// undefined 값을 재귀적으로 제거하는 헬퍼 함수
const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== null && item !== undefined);
  }

  const cleaned = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      const cleanedValue = removeUndefined(value);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
  });
  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

/**
 * Firestore에 캘린더 일정 데이터 저장
 */
export const saveCalendarToFirestore = async (userId, schedules) => {
  try {
    // undefined 값 제거하여 정리된 스케줄 생성
    const cleanedSchedules = {};
    Object.keys(schedules).forEach(dateKey => {
      const schedule = schedules[dateKey];
      const cleanedSchedule = removeUndefined(schedule);

      // 빈 객체가 아닌 경우만 추가
      if (cleanedSchedule && Object.keys(cleanedSchedule).length > 0) {
        cleanedSchedules[dateKey] = cleanedSchedule;
      }
    });

    // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
    // const key = getEncryptionKey();
    let dataToSave = cleanedSchedules;

    // if (key && Object.keys(cleanedSchedules).length > 0) {
    //   dataToSave = await encryptCalendar(cleanedSchedules, key);
    // }

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'calendar');
    await setDoc(docRef, {
      schedules: dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('캘린더 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 최근 활동
// ========================================

/**
 * Firestore에서 최근 활동 데이터 가져오기
 */
export const fetchActivitiesFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'activities');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const encryptedActivities = docSnap.data().items || [];

      // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
      // const key = getEncryptionKey();
      // if (key && encryptedActivities.length > 0) {
      //   return await decryptArray(encryptedActivities, key, ['content']);
      // }

      return encryptedActivities;
    }
    return [];
  } catch (error) {
    console.error('활동 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 최근 활동 데이터 저장
 */
export const saveActivitiesToFirestore = async (userId, activities) => {
  try {
    // 🔐 E2EE DISABLED - 향후 재활성화 시 사용
    // const key = getEncryptionKey();
    let dataToSave = activities;

    // if (key && activities.length > 0) {
    //   dataToSave = await encryptArray(activities, key, ['content']);
    // }

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'activities');
    await setDoc(docRef, {
      items: dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('활동 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 시크릿 페이지 데이터
// ========================================

/**
 * Firestore에서 시크릿 PIN 해시 가져오기
 */
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

/**
 * Firestore에 시크릿 PIN 해시 저장
 */
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

/**
 * Firestore에서 시크릿 문서 데이터 가져오기 (암호화된 상태)
 */
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

/**
 * Firestore에 시크릿 문서 데이터 저장 (암호화된 상태)
 */
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

/**
 * Firestore에서 시크릿 설정 가져오기
 */
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

/**
 * Firestore에 시크릿 설정 저장
 */
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

/**
 * Firestore에서 삭제된 시크릿 문서 ID 목록 가져오기
 */
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

/**
 * Firestore에 삭제된 시크릿 문서 ID 목록 저장
 */
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

/**
 * Firestore에서 영구 삭제 대기 중인 시크릿 문서 ID 목록 가져오기
 */
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

/**
 * Firestore에 영구 삭제 대기 중인 시크릿 문서 ID 목록 저장
 */
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

/**
 * 🚀 메타데이터만 빠르게 가져오기 (문서 개수)
 * UI에서 "로딩 중..." 표시용
 */
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

/**
 * 🚀 개별 문서 암호화 - Firestore에서 모든 시크릿 문서 가져오기
 * 각 문서가 개별 암호화된 상태로 저장됨 (성능 최적화)
 */
export const fetchIndividualSecretDocsFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');
    const querySnapshot = await getDocs(colRef);

    const docs = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'metadata') { // 메타데이터 문서 제외
        docs.push({
          id: docSnap.id,
          encryptedData: docSnap.data().encryptedData || ''
        });
      }
    });

    return docs;
  } catch (error) {
    console.error('개별 시크릿 문서 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 🚀 개별 문서 암호화 - Firestore에 모든 시크릿 문서 저장
 * 각 문서를 개별적으로 암호화하여 저장 (성능 최적화)
 */
export const saveIndividualSecretDocsToFirestore = async (userId, encryptedDocs) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    // 각 문서를 개별 문서로 저장
    encryptedDocs.forEach((encDoc) => {
      const docRef = doc(colRef, encDoc.id);
      batch.set(docRef, {
        encryptedData: encDoc.encryptedData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // 메타데이터 저장 (문서 개수, 마지막 업데이트 시간)
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

/**
 * 🚀 개별 문서 암호화 - 특정 문서들을 Firestore에서 삭제
 * 영구 삭제 시 사용
 */
export const deleteIndividualSecretDocsFromFirestore = async (userId, docIds) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    // 각 문서 삭제
    docIds.forEach((docId) => {
      const docRef = doc(colRef, docId);
      batch.delete(docRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('개별 시크릿 문서 삭제 실패:', error);
    throw error;
  }
};

/**
 * 🔄 마이그레이션: 기존 단일 blob에서 개별 문서 암호화로 전환
 * 기존 데이터가 있으면 개별 문서로 변환하고, 기존 blob 삭제
 */
export const migrateToIndividualEncryption = async (userId) => {
  try {
    // 1. 기존 단일 blob 데이터 확인
    const oldDocRef = doc(db, 'mindflowUsers', userId, 'userData', 'secretDocs');
    const oldDocSnap = await getDoc(oldDocRef);

    if (!oldDocSnap.exists() || !oldDocSnap.data().encryptedData) {
      console.log('✅ 마이그레이션 불필요: 기존 데이터 없음');
      return { migrated: false, reason: 'no-old-data' };
    }

    console.log('🔄 마이그레이션 시작: 단일 blob → 개별 문서 암호화');

    // 2. 기존 데이터를 개별 문서 컬렉션으로 복사 (암호화 상태 그대로 유지)
    // 주의: 이 단계는 PIN 입력 후 secretStorage.js에서 처리됨
    // 여기서는 마이그레이션 상태만 표시

    return { migrated: false, reason: 'needs-pin', oldData: oldDocSnap.data().encryptedData };
  } catch (error) {
    console.error('❌ 마이그레이션 확인 실패:', error);
    throw error;
  }
};

// ========================================
// 사용자 설정
// ========================================

/**
 * Firestore에서 사용자 설정 가져오기
 */
export const fetchSettingsFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
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
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('설정 데이터 저장 실패:', error);
    throw error;
  }
};

// ========================================
// 일괄 데이터 로드
// ========================================

/**
 * 모든 사용자 데이터를 Firestore에서 가져오기 (타임스탬프 포함)
 */
export const fetchAllUserData = async (userId) => {
  try {
    // 데이터와 타임스탬프를 함께 가져오기
    const [
      memosDoc,
      foldersDoc,
      trashDoc,
      macrosDoc,
      calendarDoc,
      activitiesDoc,
      settingsDoc
    ] = await Promise.all([
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'memos')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'folders')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'trash')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'macros')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'calendar')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'activities')),
      getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'settings'))
    ]);

    return {
      memos: memosDoc.exists() ? (memosDoc.data().items || []) : [],
      folders: foldersDoc.exists() ? (foldersDoc.data().items || []) : [],
      trash: trashDoc.exists() ? (trashDoc.data().items || []) : [],
      macros: macrosDoc.exists() ? (macrosDoc.data().items || []) : [],
      calendar: calendarDoc.exists() ? (calendarDoc.data().schedules || {}) : {},
      activities: activitiesDoc.exists() ? (activitiesDoc.data().items || []) : [],
      settings: settingsDoc.exists() ? settingsDoc.data() : {
        widgets: ['StatsGrid', 'QuickActions', 'RecentActivity'],
        displayCount: 5,
        nickname: null,
        profileImageType: 'avatar',
        selectedAvatarId: null,
        avatarBgColor: 'none'
      },
      // 타임스탬프 정보 추가
      timestamps: {
        memos: memosDoc.exists() ? memosDoc.data().updatedAt : null,
        folders: foldersDoc.exists() ? foldersDoc.data().updatedAt : null,
        trash: trashDoc.exists() ? trashDoc.data().updatedAt : null,
        macros: macrosDoc.exists() ? macrosDoc.data().updatedAt : null,
        calendar: calendarDoc.exists() ? calendarDoc.data().updatedAt : null,
        activities: activitiesDoc.exists() ? activitiesDoc.data().updatedAt : null,
        settings: settingsDoc.exists() ? settingsDoc.data().updatedAt : null
      }
    };
  } catch (error) {
    console.error('전체 데이터 가져오기 실패:', error);
    throw error;
  }
};

// ========================================
// localStorage → Firestore 마이그레이션
// ========================================

/**
 * localStorage 데이터를 Firestore로 마이그레이션
 */
export const migrateLocalStorageToFirestore = async (userId) => {
  try {
    console.log('📦 localStorage → Firestore 마이그레이션 시작...');

    // localStorage에서 데이터 읽기
    const memos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
    const folders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
    const trash = JSON.parse(localStorage.getItem('trashedItems_shared') || '[]');
    const macros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
    const calendar = JSON.parse(localStorage.getItem('calendarSchedules_shared') || '{}');
    const activities = JSON.parse(localStorage.getItem('recentActivities_shared') || '[]');

    const settings = {
      widgets: JSON.parse(localStorage.getItem('widgets_shared') || '["StatsGrid", "QuickActions", "RecentActivity"]'),
      displayCount: JSON.parse(localStorage.getItem('displayCount_shared') || '5'),
      nickname: localStorage.getItem('userNickname') || null,
      profileImageType: localStorage.getItem('profileImageType') || 'avatar',
      selectedAvatarId: localStorage.getItem('selectedAvatarId') || null,
      avatarBgColor: localStorage.getItem('avatarBgColor') || 'none'
    };

    // Firestore에 저장
    await Promise.all([
      saveMemosToFirestore(userId, memos),
      saveFoldersToFirestore(userId, folders),
      saveTrashToFirestore(userId, trash),
      saveMacrosToFirestore(userId, macros),
      saveCalendarToFirestore(userId, calendar),
      saveActivitiesToFirestore(userId, activities),
      saveSettingsToFirestore(userId, settings)
    ]);

    console.log('✅ 마이그레이션 완료!');
    console.log(`- 메모: ${memos.length}개`);
    console.log(`- 폴더: ${folders.length}개`);
    console.log(`- 휴지통: ${trash.length}개`);
    console.log(`- 매크로: ${macros.length}개`);
    console.log(`- 캘린더: ${Object.keys(calendar).length}개 날짜`);
    console.log(`- 활동: ${activities.length}개`);

    return true;
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
};

// ========================================
// 구 구조 Firestore → 신 구조 Firestore 마이그레이션
// ========================================

/**
 * 구 구조 Firestore 데이터를 신 구조로 마이그레이션
 * @param {string} firebaseUID - Firebase Auth UID
 * @param {string} userId - 새로운 사용자 ID (phoneNumber 또는 firebaseUID)
 */
export const migrateLegacyFirestoreData = async (firebaseUID, userId) => {
  try {
    console.log('🔄 구 구조 → 신 구조 Firestore 마이그레이션 시작...');
    console.log(`  - 원본: users/${firebaseUID}/userData/*`);
    console.log(`  - 대상: mindflowUsers/${userId}/userData/*`);

    // 구 구조에서 데이터 읽기
    const oldMemosRef = doc(db, 'users', firebaseUID, 'userData', 'memos');
    const oldFoldersRef = doc(db, 'users', firebaseUID, 'userData', 'folders');
    const oldTrashRef = doc(db, 'users', firebaseUID, 'userData', 'trash');
    const oldMacrosRef = doc(db, 'users', firebaseUID, 'userData', 'macros');
    const oldCalendarRef = doc(db, 'users', firebaseUID, 'userData', 'calendar');
    const oldActivitiesRef = doc(db, 'users', firebaseUID, 'userData', 'activities');
    const oldSettingsRef = doc(db, 'users', firebaseUID, 'userData', 'settings');

    const [
      oldMemosSnap,
      oldFoldersSnap,
      oldTrashSnap,
      oldMacrosSnap,
      oldCalendarSnap,
      oldActivitiesSnap,
      oldSettingsSnap
    ] = await Promise.all([
      getDoc(oldMemosRef),
      getDoc(oldFoldersRef),
      getDoc(oldTrashRef),
      getDoc(oldMacrosRef),
      getDoc(oldCalendarRef),
      getDoc(oldActivitiesRef),
      getDoc(oldSettingsRef)
    ]);

    // 데이터 추출
    const memos = oldMemosSnap.exists() ? (oldMemosSnap.data().items || []) : [];
    const folders = oldFoldersSnap.exists() ? (oldFoldersSnap.data().items || []) : [];
    const trash = oldTrashSnap.exists() ? (oldTrashSnap.data().items || []) : [];
    const macros = oldMacrosSnap.exists() ? (oldMacrosSnap.data().items || []) : [];
    const calendar = oldCalendarSnap.exists() ? (oldCalendarSnap.data().schedules || {}) : {};
    const activities = oldActivitiesSnap.exists() ? (oldActivitiesSnap.data().items || []) : [];
    const settings = oldSettingsSnap.exists() ? oldSettingsSnap.data() : {};

    // 데이터가 하나라도 있으면 마이그레이션 진행
    const hasData = memos.length > 0 || folders.length > 0 || trash.length > 0 ||
                    macros.length > 0 || Object.keys(calendar).length > 0 ||
                    activities.length > 0 || Object.keys(settings).length > 0;

    if (!hasData) {
      console.log('⚠️ 마이그레이션할 구 구조 데이터가 없습니다.');
      return false;
    }

    // 신 구조로 저장
    await Promise.all([
      memos.length > 0 ? saveMemosToFirestore(userId, memos) : Promise.resolve(),
      folders.length > 0 ? saveFoldersToFirestore(userId, folders) : Promise.resolve(),
      trash.length > 0 ? saveTrashToFirestore(userId, trash) : Promise.resolve(),
      macros.length > 0 ? saveMacrosToFirestore(userId, macros) : Promise.resolve(),
      Object.keys(calendar).length > 0 ? saveCalendarToFirestore(userId, calendar) : Promise.resolve(),
      activities.length > 0 ? saveActivitiesToFirestore(userId, activities) : Promise.resolve(),
      Object.keys(settings).length > 0 ? saveSettingsToFirestore(userId, settings) : Promise.resolve()
    ]);

    console.log('✅ 구 구조 → 신 구조 마이그레이션 완료!');
    console.log(`  - 메모: ${memos.length}개`);
    console.log(`  - 폴더: ${folders.length}개`);
    console.log(`  - 휴지통: ${trash.length}개`);
    console.log(`  - 매크로: ${macros.length}개`);
    console.log(`  - 캘린더: ${Object.keys(calendar).length}개 날짜`);
    console.log(`  - 활동: ${activities.length}개`);

    return true;
  } catch (error) {
    // Permission 에러는 데이터가 없는 경우이므로 무시
    if (error.code === 'permission-denied') {
      console.log('⚠️ 구 구조 데이터 없음 (신규 사용자)');
      return false;
    }
    console.error('❌ 구 구조 마이그레이션 실패:', error);
    throw error;
  }
};

// ========================================
// 🔐 E2EE 마이그레이션
// ========================================

// 🔐 E2EE DISABLED - 향후 재활성화 시 사용
/**
 * 기존 평문 데이터를 암호화하여 다시 저장
 * @param {string} userId - 사용자 ID (휴대폰 번호)
 * @returns {Promise<boolean>} 마이그레이션 성공 여부
 */
/*
export const migrateToEncryption = async (userId) => {
  try {
    console.log('🔐 평문 → 암호화 마이그레이션 시작');

    const key = getEncryptionKey();
    if (!key) {
      console.warn('⚠️ 암호화 키가 없습니다. 마이그레이션 건너뜀');
      return false;
    }

    // 1. 모든 데이터 가져오기 (복호화 없이 원본 그대로)
    const memosDoc = await getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'memos'));
    const trashDoc = await getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'trash'));
    const macrosDoc = await getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'macros'));
    const calendarDoc = await getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'calendar'));
    const activitiesDoc = await getDoc(doc(db, 'mindflowUsers', userId, 'userData', 'activities'));

    let migrationCount = 0;

    // 2. 메모 암호화
    if (memosDoc.exists()) {
      const memos = memosDoc.data().items || [];
      if (memos.length > 0) {
        const encryptedMemos = await encryptArray(memos, key, ['content']);
        await setDoc(doc(db, 'mindflowUsers', userId, 'userData', 'memos'), {
          items: encryptedMemos,
          updatedAt: serverTimestamp()
        }, { merge: true });
        migrationCount++;
        console.log(`✅ 메모 ${memos.length}개 암호화 완료`);
      }
    }

    // 3. 휴지통 암호화
    if (trashDoc.exists()) {
      const trash = trashDoc.data().items || [];
      if (trash.length > 0) {
        const encryptedTrash = await encryptArray(trash, key, ['content']);
        await setDoc(doc(db, 'mindflowUsers', userId, 'userData', 'trash'), {
          items: encryptedTrash,
          updatedAt: serverTimestamp()
        }, { merge: true });
        migrationCount++;
        console.log(`✅ 휴지통 ${trash.length}개 암호화 완료`);
      }
    }

    // 4. 매크로 암호화
    if (macrosDoc.exists()) {
      const macros = macrosDoc.data().items || [];
      if (macros.length > 0) {
        const encryptedMacros = await encryptArray(macros, key, ['content']);
        await setDoc(doc(db, 'mindflowUsers', userId, 'userData', 'macros'), {
          items: encryptedMacros,
          updatedAt: serverTimestamp()
        }, { merge: true });
        migrationCount++;
        console.log(`✅ 매크로 ${macros.length}개 암호화 완료`);
      }
    }

    // 5. 캘린더 암호화
    if (calendarDoc.exists()) {
      const calendar = calendarDoc.data().schedules || {};
      if (Object.keys(calendar).length > 0) {
        const encryptedCalendar = await encryptCalendar(calendar, key);
        await setDoc(doc(db, 'mindflowUsers', userId, 'userData', 'calendar'), {
          schedules: encryptedCalendar,
          updatedAt: serverTimestamp()
        }, { merge: true });
        migrationCount++;
        console.log(`✅ 캘린더 일정 암호화 완료`);
      }
    }

    // 6. 활동 암호화
    if (activitiesDoc.exists()) {
      const activities = activitiesDoc.data().items || [];
      if (activities.length > 0) {
        const encryptedActivities = await encryptArray(activities, key, ['content']);
        await setDoc(doc(db, 'mindflowUsers', userId, 'userData', 'activities'), {
          items: encryptedActivities,
          updatedAt: serverTimestamp()
        }, { merge: true });
        migrationCount++;
        console.log(`✅ 활동 ${activities.length}개 암호화 완료`);
      }
    }

    if (migrationCount > 0) {
      console.log(`✅ 평문 → 암호화 마이그레이션 완료 (${migrationCount}개 항목)`);
      return true;
    } else {
      console.log('⚠️ 마이그레이션할 데이터 없음');
      return false;
    }
  } catch (error) {
    console.error('❌ 암호화 마이그레이션 실패:', error);
    throw error;
  }
};
*/
