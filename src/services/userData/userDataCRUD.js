/**
 * Core CRUD operations for user data
 * Handles memos, folders, trash, macros, calendar, and activities
 */
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { convertTimestampsToMillis, removeUndefinedValues } from './userDataHelpers';
import { showAlert } from '../../utils/alertModal';
import { localStorageService } from '../../utils/localStorageService';

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
    // 방어 코드: memo 객체 유효성 검사
    if (!memo || !memo.id) {
      console.error('❌ saveMemoToFirestore: 유효하지 않은 memo 객체', { userId, memo });
      throw new Error('Invalid memo object: memo or memo.id is undefined');
    }

    const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);

    // ⭐ Evernote 방식: 모든 저장에 deleted: false와 serverTimestamp 추가
    // ⚠️ [중요] currentWorkingRoomId와 hasPendingEdits는 협업 상태 관리용이므로 제외
    // 이 값들은 CollaborativeDocumentEditor에서만 직접 관리해야 함
    const { currentWorkingRoomId, hasPendingEdits, ...memoWithoutCollabFields } = memo;

    const dataToSave = {
      ...memoWithoutCollabFields,
      deleted: false,  // 활성 문서 표시
      updatedAt: serverTimestamp(),  // 서버 시간으로 강제 (기기 시간 조작 방지)
      createdAt: memo.createdAt || serverTimestamp()  // 신규 생성 시에만 설정
    };

    // ⚠️ Firestore는 undefined를 허용하지 않으므로 null로 변환
    const sanitizedData = Object.fromEntries(
      Object.entries(dataToSave).map(([key, value]) => [key, value === undefined ? null : value])
    );

    await setDoc(docRef, sanitizedData, { merge: true });
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
 * Firestore에서 단일 휴지통 항목 영구 삭제 (Hard Delete)
 * trash 컬렉션과 memos 컬렉션에서 모두 삭제
 */
export const deleteTrashItemFromFirestore = async (userId, trashId) => {
  try {
    // 1. trash 컬렉션에서 삭제
    const trashDocRef = doc(db, 'mindflowUsers', userId, 'trash', trashId);
    await deleteDoc(trashDocRef);
    console.log(`✅ trash 컬렉션에서 삭제 완료: ${trashId}`);

    // 2. memos 컬렉션에서도 삭제 (deleted: true인 원본 문서 제거)
    const memoDocRef = doc(db, 'mindflowUsers', userId, 'memos', trashId);
    await deleteDoc(memoDocRef);
    console.log(`✅ memos 컬렉션에서 삭제 완료: ${trashId}`);

    console.log(`✅ 휴지통 항목 영구 삭제 완료: ${trashId}`);
  } catch (error) {
    console.error('휴지통 항목 삭제 실패:', error);
    throw error;
  }
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
 * Firestore에서 삭제된 문서 완전 삭제 (Hard Delete)
 *
 * 정리 규칙:
 * 1. Secret Documents: deleted: true && deletedAt이 7일 이상 경과 시 삭제 (민감 정보 신속 제거)
 * 2. 일반 문서들: deleted: true && deletedAt이 10일 이상 경과 시 삭제 (휴지통 7일 + 안전 마진 3일)
 * 3. 대상 컬렉션: memos, folders, calendar, trash, activities, macros, secretDocs
 *
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} - 삭제된 문서 수
 */
export const cleanupDeletedFirestoreDocuments = async (userId) => {
  if (!userId) return 0;

  console.log('🧹 Firestore 삭제된 문서 정리 시작...');

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;   // Secret documents: 7일
  const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;    // 일반 문서: 10일
  const now = Date.now();
  let totalDeleted = 0;

  // 정리 대상 컬렉션 (컬렉션명, 유예기간)
  const collections = [
    { name: 'memos', gracePeriod: tenDaysInMs },
    { name: 'folders', gracePeriod: tenDaysInMs },
    { name: 'calendar', gracePeriod: tenDaysInMs },
    { name: 'trash', gracePeriod: tenDaysInMs },
    { name: 'activities', gracePeriod: tenDaysInMs },
    { name: 'macros', gracePeriod: tenDaysInMs },
    { name: 'secretDocs', gracePeriod: sevenDaysInMs }  // 🔐 민감 정보는 7일로 단축
  ];

  for (const { name: collectionName, gracePeriod } of collections) {
    try {
      const colRef = collection(db, 'mindflowUsers', userId, collectionName);
      const snapshot = await getDocs(colRef);

      let deletedInCollection = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // deleted: true이고 deletedAt이 있는 문서만 대상
        if (data.deleted === true && data.deletedAt) {
          // Firestore Timestamp를 밀리초로 변환
          const deletedAtMs = data.deletedAt.toMillis ? data.deletedAt.toMillis() : data.deletedAt;
          const timeSinceDeletion = now - deletedAtMs;

          // 유예 기간 경과한 문서 완전 삭제
          if (timeSinceDeletion > gracePeriod) {
            await deleteDoc(doc(db, 'mindflowUsers', userId, collectionName, docSnap.id));
            deletedInCollection++;
            const daysElapsed = Math.floor(timeSinceDeletion / (24 * 60 * 60 * 1000));
            const graceDays = Math.floor(gracePeriod / (24 * 60 * 60 * 1000));
            console.log(`  🗑️ ${collectionName}/${docSnap.id} 완전 삭제 (${daysElapsed}일 경과, 유예기간: ${graceDays}일)`);
          }
        }
      }

      if (deletedInCollection > 0) {
        console.log(`✅ ${collectionName}: ${deletedInCollection}개 문서 완전 삭제`);
        totalDeleted += deletedInCollection;
      }
    } catch (error) {
      console.error(`❌ ${collectionName} 정리 실패:`, error);
    }
  }

  if (totalDeleted > 0) {
    console.log(`✅ Firestore 정리 완료: 총 ${totalDeleted}개 문서 완전 삭제`);
  } else {
    console.log('✅ 정리할 만료 문서 없음');
  }

  return totalDeleted;
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

// ========================================
// 일괄 데이터 로드
// ========================================

/**
 * 모든 사용자 데이터를 Firestore에서 가져오기
 */
export const fetchAllUserData = async (userId) => {
  try {
    const [memos, folders, trash, macros, calendar, activities] = await Promise.all([
      fetchMemosFromFirestore(userId),
      fetchFoldersFromFirestore(userId),
      fetchTrashFromFirestore(userId),
      fetchMacrosFromFirestore(userId),
      fetchCalendarFromFirestore(userId),
      fetchActivitiesFromFirestore(userId)
    ]);

    return {
      memos,
      folders,
      trash,
      macros,
      calendar,
      activities
    };
  } catch (error) {
    console.error('전체 데이터 가져오기 실패:', error);
    throw error;
  }
};

// ========================================
// 🔄 Backwards Compatibility: Array-based batch save functions
// ========================================

/**
 * Save all memos as individual documents (backwards compatible)
 */
export const saveMemosToFirestore = async (userId, memos) => {
  if (!Array.isArray(memos) || memos.length === 0) return;

  const batch = writeBatch(db);
  memos.forEach(memo => {
    if (memo.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);
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
 */
export const saveTrashToFirestore = async (userId, trash) => {
  if (!Array.isArray(trash) || trash.length === 0) return;

  const batch = writeBatch(db);
  trash.forEach(item => {
    if (item.id) {
      const docRef = doc(db, 'mindflowUsers', userId, 'trash', item.id);
      const cleanedItem = removeUndefinedValues({ ...item, updatedAt: serverTimestamp() });
      batch.set(docRef, cleanedItem);
    }
  });
  await batch.commit();
};

/**
 * Save all macros as individual documents (backwards compatible)
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

    // ⚠️ 공유 localStorage 삭제 (다른 계정 데이터 오염 방지)
    const sharedKeys = ['memos_shared', 'memoFolders', 'trash', 'activities', 'calendar', 'macros'];
    sharedKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ 공유 localStorage 삭제: ${key}`);
      }
    });

    // ⚠️ 마이그레이션 방지: TTL 기반 빈 데이터로 설정 (synced: true)
    localStorageService.save(userId, 'memos', [], { synced: true });
    localStorageService.save(userId, 'folders', [], { synced: true });
    localStorageService.save(userId, 'trash', [], { synced: true });
    localStorageService.save(userId, 'activities', [], { synced: true });
    localStorageService.save(userId, 'calendar', {}, { synced: true });
    localStorageService.save(userId, 'macros', [], { synced: true });
    console.log('✅ 마이그레이션 방지 플래그 설정 완료 (TTL 기반 빈 데이터로 초기화)');

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
        showAlert('데이터가 모두 삭제되었습니다. 페이지를 새로고침합니다.', '삭제 완료', () => {
          window.location.reload();
        });
      } catch (error) {
        console.error('❌ 오류 발생:', error);
        showAlert('데이터 삭제 중 오류가 발생했습니다: ' + error.message, '오류');
      }
    }
  };

  console.log('💡 데이터 정리 함수 사용법:\n\n  window._cleanupUserData()\n\n⚠️ 경고: 현재 로그인된 사용자의 모든 데이터를 삭제합니다!');
}
