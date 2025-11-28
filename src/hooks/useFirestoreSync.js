// 🔥 Firestore 실시간 동기화 커스텀 훅 (산업 표준 방식)
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllUserData,
  migrateLocalStorageToFirestore,
  migrateLegacyFirestoreData,
  migrateArrayToIndividualDocs,
  setupMemosListener,
  setupFoldersListener,
  setupTrashListener,
  setupMacrosListener,
  setupCalendarListener,
  setupActivitiesListener,
  setupSettingsListener,
  saveMemoToFirestore,
  saveFolderToFirestore,
  saveTrashItemToFirestore,
  saveMacroToFirestore,
  saveCalendarDateToFirestore,
  saveActivityToFirestore,
  saveSettingsToFirestore,
  deleteMemoFromFirestore,
  deleteFolderFromFirestore,
  deleteTrashItemFromFirestore,
  deleteMacroFromFirestore,
  deleteCalendarDateFromFirestore,
  deleteActivityFromFirestore
} from '../services/userDataService';

/**
 * Firestore와 로컬 상태를 실시간으로 동기화하는 훅 (산업 표준 방식)
 *
 * 변경 사항:
 * - 타임스탬프 비교 로직 완전 제거
 * - onSnapshot 실시간 리스너로 자동 동기화
 * - 서버 데이터가 항상 신뢰할 수 있는 단일 소스(Single Source of Truth)
 * - 개별 문서 저장으로 효율성 극대화
 *
 * @param {string} userId - 사용자 ID (phoneNumber 또는 firebaseUID)
 * @param {boolean} enabled - 동기화 활성화 여부
 * @param {string} firebaseUID - Firebase Auth UID (구 구조 마이그레이션용)
 * @returns {object} - 동기화된 데이터와 저장 함수들
 */
export const useFirestoreSync = (userId, enabled = true, firebaseUID = null) => {
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

  // 리스너 언마운트용 참조
  const unsubscribeRefs = useRef([]);

  // 리스너가 설정되었는지 여부 (중복 방지)
  const listenersSetupRef = useRef(false);

  // userId 변경 시 초기화
  useEffect(() => {
    migrationRef.current = false;
    listenersSetupRef.current = false;

    // 기존 리스너 정리
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
  }, [userId]);

  // 초기 데이터 로드 및 마이그레이션
  useEffect(() => {
    if (!userId || !enabled || migrationRef.current) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔄 Step 1: 구 구조 Firestore → 신 구조 Firestore 마이그레이션
        const legacyMigrationKey = `legacy_firestore_migrated_${userId}`;
        const legacyAlreadyMigrated = localStorage.getItem(legacyMigrationKey) === 'true';

        if (!legacyAlreadyMigrated && firebaseUID) {
          try {
            const migrated = await migrateLegacyFirestoreData(firebaseUID, userId);
            if (migrated) {
              localStorage.setItem(legacyMigrationKey, 'true');
              console.log('✅ 구 구조 데이터 마이그레이션 완료!');
            }
          } catch (error) {
            console.warn('⚠️ 구 구조 마이그레이션 건너뜀:', error);
          }
        }

        // 🔄 Step 2: 배열 저장 → 개별 문서 마이그레이션 체크
        const arrayToDocsKey = `array_to_docs_migrated_${userId}`;
        const arrayToDocsMigrated = localStorage.getItem(arrayToDocsKey) === 'true';

        if (!arrayToDocsMigrated) {
          try {
            await migrateArrayToIndividualDocs(userId);
            localStorage.setItem(arrayToDocsKey, 'true');
            console.log('✅ 배열 → 개별 문서 마이그레이션 완료!');
          } catch (error) {
            // 마이그레이션할 데이터가 없으면 무시 (신규 사용자)
            console.log('⚠️ 배열 마이그레이션 건너뜀 (데이터 없음)');
            localStorage.setItem(arrayToDocsKey, 'true');
          }
        }

        // 📦 Step 3: Firestore에서 데이터 로드
        const data = await fetchAllUserData(userId);

        // Step 4: Firestore에 데이터가 없으면 localStorage에서 마이그레이션
        const hasFirestoreData = data.memos?.length > 0 ||
                                  data.folders?.length > 0 ||
                                  data.trash?.length > 0 ||
                                  Object.keys(data.calendar || {}).length > 0;

        if (!hasFirestoreData) {
          const localMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
          const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
          const hasLocalData = localMemos.length > 0 || localFolders.length > 0;

          if (hasLocalData) {
            console.log('📦 Firestore 비어있음 - localStorage 데이터 마이그레이션 시작...');
            await migrateLocalStorageToFirestore(userId);
            console.log('✅ localStorage 마이그레이션 완료!');

            // 마이그레이션 후 다시 로드
            const refreshedData = await fetchAllUserData(userId);
            setMemos(refreshedData.memos || []);
            setFolders(refreshedData.folders || []);
            setTrash(refreshedData.trash || []);
            setMacros(refreshedData.macros || []);
            setCalendar(refreshedData.calendar || {});
            setActivities(refreshedData.activities || []);
            setSettings(refreshedData.settings || settings);
          } else {
            // 완전 신규 사용자
            console.log('🆕 신규 사용자 - 빈 상태로 시작');
            setMemos(data.memos || []);
            setFolders(data.folders || []);
            setTrash(data.trash || []);
            setMacros(data.macros || []);
            setCalendar(data.calendar || {});
            setActivities(data.activities || []);
            setSettings(data.settings || settings);
          }
        } else {
          // Firestore에 데이터가 있음 - 서버 데이터 사용 (Single Source of Truth)
          console.log('✅ Firestore 데이터 로드');
          setMemos(data.memos || []);
          setFolders(data.folders || []);
          setTrash(data.trash || []);
          setMacros(data.macros || []);
          setCalendar(data.calendar || {});
          setActivities(data.activities || []);
          setSettings(data.settings || settings);
        }

        // localStorage에도 캐싱 (오프라인 지원)
        localStorage.setItem('memos_shared', JSON.stringify(data.memos || []));
        localStorage.setItem('memoFolders', JSON.stringify(data.folders || []));
        localStorage.setItem('trashedItems_shared', JSON.stringify(data.trash || []));
        localStorage.setItem('macroTexts', JSON.stringify(data.macros || []));
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(data.calendar || {}));
        localStorage.setItem('recentActivities_shared', JSON.stringify(data.activities || []));
        localStorage.setItem('widgets_shared', JSON.stringify(data.settings?.widgets || ['StatsGrid', 'QuickActions', 'RecentActivity']));
        localStorage.setItem('displayCount_shared', JSON.stringify(data.settings?.displayCount || 5));

        // 닉네임은 별도 nicknames 컬렉션에서 가져오기
        try {
          const { getUserNickname } = await import('../services/nicknameService');
          const nickname = await getUserNickname(userId);
          if (nickname) {
            localStorage.setItem('userNickname', nickname);
          }
        } catch (error) {
          console.error('닉네임 동기화 실패:', error);
        }

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
  }, [userId, enabled, firebaseUID]);

  // 실시간 리스너 설정 (마이그레이션 완료 후)
  useEffect(() => {
    if (!userId || !enabled || !migrated || listenersSetupRef.current) return;

    console.log('🔥 실시간 리스너 설정 시작...');

    // 메모 리스너
    const unsubMemos = setupMemosListener(userId, (type, memo) => {
      if (type === 'added') {
        setMemos(prev => {
          const exists = prev.find(m => m.id === memo.id);
          if (exists) return prev;
          const updated = [...prev, memo];
          localStorage.setItem('memos_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'modified') {
        setMemos(prev => {
          const updated = prev.map(m => m.id === memo.id ? memo : m);
          localStorage.setItem('memos_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setMemos(prev => {
          const updated = prev.filter(m => m.id !== memo.id);
          localStorage.setItem('memos_shared', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 폴더 리스너
    const unsubFolders = setupFoldersListener(userId, (type, folder) => {
      if (type === 'added') {
        setFolders(prev => {
          const exists = prev.find(f => f.id === folder.id);
          if (exists) return prev;
          const updated = [...prev, folder];
          localStorage.setItem('memoFolders', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'modified') {
        setFolders(prev => {
          const updated = prev.map(f => f.id === folder.id ? folder : f);
          localStorage.setItem('memoFolders', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setFolders(prev => {
          const updated = prev.filter(f => f.id !== folder.id);
          localStorage.setItem('memoFolders', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 휴지통 리스너
    const unsubTrash = setupTrashListener(userId, (type, item) => {
      if (type === 'added') {
        setTrash(prev => {
          const exists = prev.find(t => t.id === item.id);
          if (exists) return prev;
          const updated = [...prev, item];
          localStorage.setItem('trashedItems_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'modified') {
        setTrash(prev => {
          const updated = prev.map(t => t.id === item.id ? item : t);
          localStorage.setItem('trashedItems_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setTrash(prev => {
          const updated = prev.filter(t => t.id !== item.id);
          localStorage.setItem('trashedItems_shared', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 매크로 리스너
    const unsubMacros = setupMacrosListener(userId, (type, macro) => {
      if (type === 'added') {
        setMacros(prev => {
          const exists = prev.find(m => m.id === macro.id);
          if (exists) return prev;
          const updated = [...prev, macro];
          localStorage.setItem('macroTexts', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'modified') {
        setMacros(prev => {
          const updated = prev.map(m => m.id === macro.id ? macro : m);
          localStorage.setItem('macroTexts', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setMacros(prev => {
          const updated = prev.filter(m => m.id !== macro.id);
          localStorage.setItem('macroTexts', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 캘린더 리스너
    const unsubCalendar = setupCalendarListener(userId, (type, dateKey, schedule) => {
      if (type === 'added' || type === 'modified') {
        setCalendar(prev => {
          const updated = { ...prev, [dateKey]: schedule };
          localStorage.setItem('calendarSchedules_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setCalendar(prev => {
          const updated = { ...prev };
          delete updated[dateKey];
          localStorage.setItem('calendarSchedules_shared', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 활동 리스너
    const unsubActivities = setupActivitiesListener(userId, (type, activity) => {
      if (type === 'added') {
        setActivities(prev => {
          const exists = prev.find(a => a.id === activity.id);
          if (exists) return prev;
          const updated = [...prev, activity];
          localStorage.setItem('recentActivities_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'modified') {
        setActivities(prev => {
          const updated = prev.map(a => a.id === activity.id ? activity : a);
          localStorage.setItem('recentActivities_shared', JSON.stringify(updated));
          return updated;
        });
      } else if (type === 'removed') {
        setActivities(prev => {
          const updated = prev.filter(a => a.id !== activity.id);
          localStorage.setItem('recentActivities_shared', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // 설정 리스너
    const unsubSettings = setupSettingsListener(userId, (newSettings) => {
      setSettings(newSettings);

      if (newSettings.widgets) localStorage.setItem('widgets_shared', JSON.stringify(newSettings.widgets));
      if (newSettings.displayCount) localStorage.setItem('displayCount_shared', JSON.stringify(newSettings.displayCount));
      if (newSettings.nickname) localStorage.setItem('userNickname', newSettings.nickname);
      if (newSettings.profileImageType) localStorage.setItem('profileImageType', newSettings.profileImageType);
      if (newSettings.selectedAvatarId) localStorage.setItem('selectedAvatarId', newSettings.selectedAvatarId);
      if (newSettings.avatarBgColor) localStorage.setItem('avatarBgColor', newSettings.avatarBgColor);
    });

    // 언마운트 시 리스너 정리
    unsubscribeRefs.current = [
      unsubMemos,
      unsubFolders,
      unsubTrash,
      unsubMacros,
      unsubCalendar,
      unsubActivities,
      unsubSettings
    ];

    listenersSetupRef.current = true;
    console.log('✅ 실시간 리스너 설정 완료!');

    return () => {
      console.log('🔥 실시간 리스너 정리 중...');
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
      listenersSetupRef.current = false;
    };
  }, [userId, enabled, migrated]);

  // 디바운스 저장 (로컬 변경사항을 서버에 저장)
  const saveTimeout = useRef(null);
  const debouncedSave = useCallback((saveFn, ...args) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      if (userId && enabled) {
        saveFn(userId, ...args).catch(err => {
          console.error('Firestore 저장 실패:', err);
        });
      }
    }, 300); // 300ms 디바운스
  }, [userId, enabled]);

  // 메모 저장 (개별 문서)
  const syncMemo = useCallback((memo) => {
    // 낙관적 UI 업데이트
    setMemos(prev => {
      const exists = prev.find(m => m.id === memo.id);
      const updated = exists ? prev.map(m => m.id === memo.id ? memo : m) : [...prev, memo];
      localStorage.setItem('memos_shared', JSON.stringify(updated));
      return updated;
    });

    // 서버에 저장
    debouncedSave(saveMemoToFirestore, memo);
  }, [debouncedSave]);

  // 메모 삭제
  const deleteMemo = useCallback((memoId) => {
    setMemos(prev => {
      const updated = prev.filter(m => m.id !== memoId);
      localStorage.setItem('memos_shared', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteMemoFromFirestore(userId, memoId).catch(err => {
        console.error('메모 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

  // 폴더 저장 (개별 문서)
  const syncFolder = useCallback((folder) => {
    setFolders(prev => {
      const exists = prev.find(f => f.id === folder.id);
      const updated = exists ? prev.map(f => f.id === folder.id ? folder : f) : [...prev, folder];
      localStorage.setItem('memoFolders', JSON.stringify(updated));
      return updated;
    });

    debouncedSave(saveFolderToFirestore, folder);
  }, [debouncedSave]);

  // 폴더 삭제
  const deleteFolder = useCallback((folderId) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      localStorage.setItem('memoFolders', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteFolderFromFirestore(userId, folderId).catch(err => {
        console.error('폴더 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

  // 휴지통 항목 저장
  const syncTrashItem = useCallback((item) => {
    setTrash(prev => {
      const exists = prev.find(t => t.id === item.id);
      const updated = exists ? prev.map(t => t.id === item.id ? item : t) : [...prev, item];
      localStorage.setItem('trashedItems_shared', JSON.stringify(updated));
      return updated;
    });

    debouncedSave(saveTrashItemToFirestore, item);
  }, [debouncedSave]);

  // 휴지통 항목 삭제
  const deleteTrashItem = useCallback((itemId) => {
    setTrash(prev => {
      const updated = prev.filter(t => t.id !== itemId);
      localStorage.setItem('trashedItems_shared', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteTrashItemFromFirestore(userId, itemId).catch(err => {
        console.error('휴지통 항목 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

  // 매크로 저장
  const syncMacro = useCallback((macro) => {
    setMacros(prev => {
      const exists = prev.find(m => m.id === macro.id);
      const updated = exists ? prev.map(m => m.id === macro.id ? macro : m) : [...prev, macro];
      localStorage.setItem('macroTexts', JSON.stringify(updated));
      return updated;
    });

    debouncedSave(saveMacroToFirestore, macro);
  }, [debouncedSave]);

  // 매크로 삭제
  const deleteMacro = useCallback((macroId) => {
    setMacros(prev => {
      const updated = prev.filter(m => m.id !== macroId);
      localStorage.setItem('macroTexts', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteMacroFromFirestore(userId, macroId).catch(err => {
        console.error('매크로 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

  // 캘린더 날짜 저장
  const syncCalendarDate = useCallback((dateKey, schedule) => {
    setCalendar(prev => {
      const updated = { ...prev, [dateKey]: schedule };
      localStorage.setItem('calendarSchedules_shared', JSON.stringify(updated));
      return updated;
    });

    debouncedSave(saveCalendarDateToFirestore, dateKey, schedule);
  }, [debouncedSave]);

  // 캘린더 날짜 삭제
  const deleteCalendarDate = useCallback((dateKey) => {
    setCalendar(prev => {
      const updated = { ...prev };
      delete updated[dateKey];
      localStorage.setItem('calendarSchedules_shared', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteCalendarDateFromFirestore(userId, dateKey).catch(err => {
        console.error('캘린더 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

  // 활동 저장
  const syncActivity = useCallback((activity) => {
    setActivities(prev => {
      const exists = prev.find(a => a.id === activity.id);
      const updated = exists ? prev.map(a => a.id === activity.id ? activity : a) : [...prev, activity];
      localStorage.setItem('recentActivities_shared', JSON.stringify(updated));
      return updated;
    });

    debouncedSave(saveActivityToFirestore, activity);
  }, [debouncedSave]);

  // 활동 삭제
  const deleteActivity = useCallback((activityId) => {
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== activityId);
      localStorage.setItem('recentActivities_shared', JSON.stringify(updated));
      return updated;
    });

    if (userId && enabled) {
      deleteActivityFromFirestore(userId, activityId).catch(err => {
        console.error('활동 삭제 실패:', err);
      });
    }
  }, [userId, enabled]);

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

  // 즉시 저장 (디바운스 없이) - 로그아웃 등에서 사용
  const saveImmediately = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      // 현재 상태를 모두 서버에 즉시 저장
      await Promise.all([
        ...memos.map(memo => saveMemoToFirestore(userId, memo)),
        ...folders.map(folder => saveFolderToFirestore(userId, folder)),
        ...trash.map(item => saveTrashItemToFirestore(userId, item)),
        ...macros.map(macro => saveMacroToFirestore(userId, macro)),
        ...Object.entries(calendar).map(([dateKey, schedule]) =>
          saveCalendarDateToFirestore(userId, dateKey, schedule)
        ),
        ...activities.map(activity => saveActivityToFirestore(userId, activity)),
        saveSettingsToFirestore(userId, settings)
      ]);

      console.log('✅ 모든 데이터 즉시 저장 완료');
    } catch (err) {
      console.error('❌ 즉시 저장 실패:', err);
      throw err;
    }
  }, [userId, enabled, memos, folders, trash, macros, calendar, activities, settings]);

  // ========================================
  // 🔄 하위 호환성 래퍼 함수 (기존 배열 기반 코드 지원)
  // ========================================

  // 메모 배열 동기화 (하위 호환)
  const syncMemos = useCallback((newMemos) => {
    setMemos(newMemos);
    localStorage.setItem('memos_shared', JSON.stringify(newMemos));

    // 각 메모를 개별 저장 (실시간 리스너가 자동으로 반영)
    newMemos.forEach(memo => {
      debouncedSave(saveMemoToFirestore, memo);
    });
  }, [debouncedSave]);

  // 폴더 배열 동기화 (하위 호환)
  const syncFolders = useCallback((newFolders) => {
    setFolders(newFolders);
    localStorage.setItem('memoFolders', JSON.stringify(newFolders));

    newFolders.forEach(folder => {
      debouncedSave(saveFolderToFirestore, folder);
    });
  }, [debouncedSave]);

  // 휴지통 배열 동기화 (하위 호환)
  const syncTrash = useCallback((newTrash) => {
    setTrash(newTrash);
    localStorage.setItem('trashedItems_shared', JSON.stringify(newTrash));

    newTrash.forEach(item => {
      debouncedSave(saveTrashItemToFirestore, item);
    });
  }, [debouncedSave]);

  // 매크로 배열 동기화 (하위 호환)
  const syncMacros = useCallback((newMacros) => {
    setMacros(newMacros);
    localStorage.setItem('macroTexts', JSON.stringify(newMacros));

    newMacros.forEach(macro => {
      debouncedSave(saveMacroToFirestore, macro);
    });
  }, [debouncedSave]);

  // 캘린더 객체 동기화 (하위 호환)
  const syncCalendar = useCallback((newCalendar) => {
    setCalendar(newCalendar);
    localStorage.setItem('calendarSchedules_shared', JSON.stringify(newCalendar));

    Object.entries(newCalendar).forEach(([dateKey, schedule]) => {
      debouncedSave(saveCalendarDateToFirestore, dateKey, schedule);
    });
  }, [debouncedSave]);

  // 활동 배열 동기화 (하위 호환)
  const syncActivities = useCallback((newActivities) => {
    setActivities(newActivities);
    localStorage.setItem('recentActivities_shared', JSON.stringify(newActivities));

    newActivities.forEach(activity => {
      debouncedSave(saveActivityToFirestore, activity);
    });
  }, [debouncedSave]);

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

    // 🔄 하위 호환 함수 (배열 기반 - 기존 코드 지원)
    syncMemos,
    syncFolders,
    syncTrash,
    syncMacros,
    syncCalendar,
    syncActivities,
    syncSettings,

    // 개별 항목 동기화 함수 (산업 표준 방식 - 권장)
    syncMemo,
    deleteMemo,
    syncFolder,
    deleteFolder,
    syncTrashItem,
    deleteTrashItem,
    syncMacro,
    deleteMacro,
    syncCalendarDate,
    deleteCalendarDate,
    syncActivity,
    deleteActivity,

    // 즉시 저장
    saveImmediately
  };
};
