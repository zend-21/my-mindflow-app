/**
 * Data migration utilities
 * Handles various data migration scenarios
 */
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { saveSettingsToFirestore } from './userDataSettings';

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
