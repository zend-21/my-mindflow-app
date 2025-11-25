// 🔥 사용자 데이터 Firestore 동기화 서비스
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
      return docSnap.data().items || [];
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
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'memos');
    await setDoc(docRef, {
      items: memos,
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
      return docSnap.data().items || [];
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
    // undefined 값 필터링
    const cleanedTrash = trash.map(item => {
      const cleanedItem = {};
      Object.keys(item).forEach(key => {
        if (item[key] !== undefined) {
          cleanedItem[key] = item[key];
        }
      });
      return cleanedItem;
    });

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'trash');
    await setDoc(docRef, {
      items: cleanedTrash,
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
      return docSnap.data().items || [];
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
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'macros');
    await setDoc(docRef, {
      items: macros,
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
      return docSnap.data().schedules || {};
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

    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'calendar');
    await setDoc(docRef, {
      schedules: cleanedSchedules,
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
      return docSnap.data().items || [];
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
    const docRef = doc(db, 'mindflowUsers', userId, 'userData', 'activities');
    await setDoc(docRef, {
      items: activities,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('활동 데이터 저장 실패:', error);
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
