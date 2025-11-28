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
      memos.push({
        id: docSnap.id,
        ...docSnap.data()
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
    await setDoc(docRef, {
      ...memo,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('메모 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 메모 삭제
 */
export const deleteMemoFromFirestore = async (userId, memoId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'memos', memoId);
    await deleteDoc(docRef);
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
      const data = { id: change.doc.id, ...change.doc.data() };
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
      folders.push({
        id: docSnap.id,
        ...docSnap.data()
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
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('폴더 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 폴더 삭제
 */
export const deleteFolderFromFirestore = async (userId, folderId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'folders', folderId);
    await deleteDoc(docRef);
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
      const data = { id: change.doc.id, ...change.doc.data() };
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
      trash.push({
        id: docSnap.id,
        ...docSnap.data()
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
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('휴지통 항목 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 휴지통 항목 삭제
 */
export const deleteTrashItemFromFirestore = async (userId, trashId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'trash', trashId);
    await deleteDoc(docRef);
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
      const data = { id: change.doc.id, ...change.doc.data() };
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
    const colRef = collection(db, 'mindflowUsers', userId, 'macros');
    const snapshot = await getDocs(colRef);

    const macros = [];
    snapshot.forEach((docSnap) => {
      macros.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    return macros;
  } catch (error) {
    console.error('매크로 데이터 가져오기 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 단일 매크로 저장
 */
export const saveMacroToFirestore = async (userId, macro) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'macros', macro.id);
    await setDoc(docRef, {
      ...macro,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('매크로 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 매크로 삭제
 */
export const deleteMacroFromFirestore = async (userId, macroId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'macros', macroId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('매크로 삭제 실패:', error);
    throw error;
  }
};

/**
 * 매크로 실시간 리스너 설정
 */
export const setupMacrosListener = (userId, callback) => {
  const colRef = collection(db, 'mindflowUsers', userId, 'macros');
  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = { id: change.doc.id, ...change.doc.data() };
      callback(change.type, data);
    });
  }, (error) => {
    console.error('매크로 리스너 에러:', error);
  });
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
      calendar[docSnap.id] = docSnap.data().schedule || {};
    });

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
    // undefined 값 제거
    const cleanSchedule = {};
    Object.keys(schedule).forEach(key => {
      if (schedule[key] !== undefined && schedule[key] !== null) {
        cleanSchedule[key] = schedule[key];
      }
    });

    // 빈 스케줄이면 문서 삭제
    if (Object.keys(cleanSchedule).length === 0) {
      const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
      await deleteDoc(docRef);
      return;
    }

    const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
    await setDoc(docRef, {
      schedule: cleanSchedule,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('캘린더 일정 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 특정 날짜의 일정 삭제
 */
export const deleteCalendarDateFromFirestore = async (userId, dateKey) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
    await deleteDoc(docRef);
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
      const schedule = change.doc.data().schedule || {};
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
      activities.push({
        id: docSnap.id,
        ...docSnap.data()
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
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('활동 저장 실패:', error);
    throw error;
  }
};

/**
 * Firestore에서 단일 활동 삭제
 */
export const deleteActivityFromFirestore = async (userId, activityId) => {
  try {
    const docRef = doc(db, 'mindflowUsers', userId, 'activities', activityId);
    await deleteDoc(docRef);
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
      const data = { id: change.doc.id, ...change.doc.data() };
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

/**
 * 설정 실시간 리스너 설정
 */
export const setupSettingsListener = (userId, callback) => {
  const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'settings');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  }, (error) => {
    console.error('설정 리스너 에러:', error);
  });
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
          const docRef = doc(db, 'mindflowUsers', userId, 'memos', memo.id);
          batch.set(docRef, {
            ...memo,
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
          const docRef = doc(db, 'mindflowUsers', userId, 'folders', folder.id);
          batch.set(docRef, {
            ...folder,
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

          const docRef = doc(db, 'mindflowUsers', userId, 'trash', item.id);
          batch.set(docRef, {
            ...cleanItem,
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
          const docRef = doc(db, 'mindflowUsers', userId, 'macros', macro.id);
          batch.set(docRef, {
            ...macro,
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
          const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
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
          const docRef = doc(db, 'mindflowUsers', userId, 'activities', activity.id);
          batch.set(docRef, {
            ...activity,
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
      const cleanSchedule = {};
      Object.keys(schedule).forEach(key => {
        if (schedule[key] !== undefined && schedule[key] !== null) {
          cleanSchedule[key] = schedule[key];
        }
      });

      if (Object.keys(cleanSchedule).length > 0) {
        const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
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
      const cleanSchedule = {};
      Object.keys(schedule).forEach(key => {
        if (schedule[key] !== undefined && schedule[key] !== null) {
          cleanSchedule[key] = schedule[key];
        }
      });

      if (Object.keys(cleanSchedule).length > 0) {
        const docRef = doc(db, 'mindflowUsers', userId, 'calendar', dateKey);
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

export const fetchIndividualSecretDocsFromFirestore = async (userId) => {
  try {
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');
    const querySnapshot = await getDocs(colRef);

    const docs = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== 'metadata') {
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

export const saveIndividualSecretDocsToFirestore = async (userId, encryptedDocs) => {
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'mindflowUsers', userId, 'secretDocs');

    encryptedDocs.forEach((encDoc) => {
      const docRef = doc(colRef, encDoc.id);
      batch.set(docRef, {
        encryptedData: encDoc.encryptedData,
        updatedAt: serverTimestamp()
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
      batch.delete(docRef);
    });

    await batch.commit();
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
      batch.set(docRef, { ...memo, updatedAt: serverTimestamp() });
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
      batch.set(docRef, { ...item, updatedAt: serverTimestamp() });
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
