// 🔥 Firestore 동기화 커스텀 훅
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllUserData,
  saveMemosToFirestore,
  saveFoldersToFirestore,
  saveTrashToFirestore,
  saveMacrosToFirestore,
  saveCalendarToFirestore,
  saveActivitiesToFirestore,
  saveSettingsToFirestore,
  migrateLocalStorageToFirestore
} from '../services/userDataService';

/**
 * Firestore와 로컬 상태를 동기화하는 훅
 *
 * @param {string} userId - 사용자 ID
 * @param {boolean} enabled - 동기화 활성화 여부
 * @returns {object} - 동기화된 데이터와 저장 함수들
 */
export const useFirestoreSync = (userId, enabled = true) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 데이터 상태
  const [memos, setMemos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [trash, setTrash] = useState([]);
  const [macros, setMacros] = useState([]);
  const [calendar, setCalendar] = useState({});
  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState({
    widgets: ['StatsGrid', 'QuickActions', 'RecentActivity'],
    displayCount: 5,
    nickname: null,
    profileImageType: 'avatar',
    selectedAvatarId: null,
    avatarBgColor: 'none'
  });

  // 마이그레이션 완료 여부
  const [migrated, setMigrated] = useState(false);
  const migrationRef = useRef(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (!userId || !enabled || migrationRef.current) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 마이그레이션 키 확인
        const migrationKey = `firestore_migrated_${userId}`;
        const alreadyMigrated = localStorage.getItem(migrationKey) === 'true';

        if (!alreadyMigrated) {
          // 첫 로그인 시 localStorage → Firestore 마이그레이션
          console.log('📦 첫 로그인 감지 - 데이터 마이그레이션 시작...');
          await migrateLocalStorageToFirestore(userId);
          localStorage.setItem(migrationKey, 'true');
          console.log('✅ 마이그레이션 완료!');
        }

        // Firestore에서 데이터 로드
        const data = await fetchAllUserData(userId);

        setMemos(data.memos || []);
        setFolders(data.folders || []);
        setTrash(data.trash || []);
        setMacros(data.macros || []);
        setCalendar(data.calendar || {});
        setActivities(data.activities || []);
        setSettings(data.settings || settings);

        // localStorage에도 캐싱 (오프라인 지원)
        localStorage.setItem('memos_shared', JSON.stringify(data.memos || []));
        localStorage.setItem('memoFolders', JSON.stringify(data.folders || []));
        localStorage.setItem('trashedItems_shared', JSON.stringify(data.trash || []));
        localStorage.setItem('macroTexts', JSON.stringify(data.macros || []));
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(data.calendar || {}));
        localStorage.setItem('recentActivities_shared', JSON.stringify(data.activities || []));
        localStorage.setItem('widgets_shared', JSON.stringify(data.settings?.widgets || ['StatsGrid', 'QuickActions', 'RecentActivity']));
        localStorage.setItem('displayCount_shared', JSON.stringify(data.settings?.displayCount || 5));

        if (data.settings?.nickname) localStorage.setItem('userNickname', data.settings.nickname);
        if (data.settings?.profileImageType) localStorage.setItem('profileImageType', data.settings.profileImageType);
        if (data.settings?.selectedAvatarId) localStorage.setItem('selectedAvatarId', data.settings.selectedAvatarId);
        if (data.settings?.avatarBgColor) localStorage.setItem('avatarBgColor', data.settings.avatarBgColor);

        setMigrated(true);
        migrationRef.current = true;
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err);

        // 오류 시 localStorage 폴백
        const fallbackMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
        const fallbackFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
        setMemos(fallbackMemos);
        setFolders(fallbackFolders);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, enabled]);

  // 디바운스 저장 (너무 자주 저장하지 않도록)
  const saveTimeout = useRef(null);
  const debouncedSave = useCallback((saveFn, data) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      if (userId && enabled) {
        saveFn(userId, data).catch(err => {
          console.error('Firestore 저장 실패:', err);
        });
      }
    }, 1000); // 1초 디바운스
  }, [userId, enabled]);

  // 메모 저장
  const syncMemos = useCallback((newMemos) => {
    setMemos(newMemos);
    localStorage.setItem('memos_shared', JSON.stringify(newMemos));
    debouncedSave(saveMemosToFirestore, newMemos);
  }, [debouncedSave]);

  // 폴더 저장
  const syncFolders = useCallback((newFolders) => {
    setFolders(newFolders);
    localStorage.setItem('memoFolders', JSON.stringify(newFolders));
    debouncedSave(saveFoldersToFirestore, newFolders);
  }, [debouncedSave]);

  // 휴지통 저장
  const syncTrash = useCallback((newTrash) => {
    setTrash(newTrash);
    localStorage.setItem('trashedItems_shared', JSON.stringify(newTrash));
    debouncedSave(saveTrashToFirestore, newTrash);
  }, [debouncedSave]);

  // 매크로 저장
  const syncMacros = useCallback((newMacros) => {
    setMacros(newMacros);
    localStorage.setItem('macroTexts', JSON.stringify(newMacros));
    debouncedSave(saveMacrosToFirestore, newMacros);
  }, [debouncedSave]);

  // 캘린더 저장
  const syncCalendar = useCallback((newCalendar) => {
    setCalendar(newCalendar);
    localStorage.setItem('calendarSchedules_shared', JSON.stringify(newCalendar));
    debouncedSave(saveCalendarToFirestore, newCalendar);
  }, [debouncedSave]);

  // 활동 저장
  const syncActivities = useCallback((newActivities) => {
    setActivities(newActivities);
    localStorage.setItem('recentActivities_shared', JSON.stringify(newActivities));
    debouncedSave(saveActivitiesToFirestore, newActivities);
  }, [debouncedSave]);

  // 설정 저장
  const syncSettings = useCallback((newSettings) => {
    setSettings(newSettings);

    if (newSettings.widgets) localStorage.setItem('widgets_shared', JSON.stringify(newSettings.widgets));
    if (newSettings.displayCount) localStorage.setItem('displayCount_shared', JSON.stringify(newSettings.displayCount));
    if (newSettings.nickname) localStorage.setItem('userNickname', newSettings.nickname);
    if (newSettings.profileImageType) localStorage.setItem('profileImageType', newSettings.profileImageType);
    if (newSettings.selectedAvatarId) localStorage.setItem('selectedAvatarId', newSettings.selectedAvatarId);
    if (newSettings.avatarBgColor) localStorage.setItem('avatarBgColor', newSettings.avatarBgColor);

    debouncedSave(saveSettingsToFirestore, newSettings);
  }, [debouncedSave]);

  // 즉시 저장 (디바운스 없이)
  const saveImmediately = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      await Promise.all([
        saveMemosToFirestore(userId, memos),
        saveFoldersToFirestore(userId, folders),
        saveTrashToFirestore(userId, trash),
        saveMacrosToFirestore(userId, macros),
        saveCalendarToFirestore(userId, calendar),
        saveActivitiesToFirestore(userId, activities),
        saveSettingsToFirestore(userId, settings)
      ]);
      console.log('✅ 모든 데이터 즉시 저장 완료');
    } catch (err) {
      console.error('❌ 즉시 저장 실패:', err);
      throw err;
    }
  }, [userId, enabled, memos, folders, trash, macros, calendar, activities, settings]);

  return {
    // 상태
    loading,
    error,
    migrated,

    // 데이터
    memos,
    folders,
    trash,
    macros,
    calendar,
    activities,
    settings,

    // 동기화 함수
    syncMemos,
    syncFolders,
    syncTrash,
    syncMacros,
    syncCalendar,
    syncActivities,
    syncSettings,
    saveImmediately
  };
};
