// 🔥 Firestore 실시간 동기화 커스텀 훅 (산업 표준 방식)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 MindFlow 앱 개발 핵심 원칙 (모든 작업 전 필수 확인)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 1. 💰 비용 절감 최우선
//    - Firestore 읽기/쓰기 최소화 (무료 할당량: 50K reads/day, 20K writes/day)
//    - 실시간 리스너 사용 금지 (quota 폭발 위험)
//    - Debounce, 캐싱, 조건부 로드 적극 활용
//
// 2. 🛡️ 데이터 유실 방지 절대 우선
//    - 모든 변경사항 즉시 localStorage 저장
//    - beforeunload 이벤트로 긴급 백업
//    - 사용자 수정 → localStorage + Firestore 이중 저장
//    - 데이터 손실 위험 = 0% 목표
//
// 3. 👤 사용자 편의성 중시
//    - 빠른 응답 속도 (낙관적 UI 업데이트)
//    - 오프라인 작업 지원 (localStorage 우선 로드)
//    - 명확한 피드백 (로딩, 에러 상태 표시)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useCallback, useRef } from 'react';
import { diagnosticLog } from '../utils/diagnosticLogger';
import {
  fetchAllUserData,
  migrateLocalStorageToFirestore,
  migrateLegacyFirestoreData,
  migrateArrayToIndividualDocs,
  saveSettingsToFirestore,
  saveFortuneProfileToFirestore,
  fetchFortuneProfileFromFirestore
} from '../services/userDataService';

// 모듈화된 유틸리티 함수들
import {
  getAccountLocalStorage,
  setAccountLocalStorage,
  getLocalStorageWithFallback,
  setAccountLocalStorageWithTTL,
  getAccountLocalStorageWithTTL,
  markLocalStorageSynced,
  removeIfSynced,
  cleanupExpiredLocalStorage
} from './useFirestoreSync.utils';

import {
  mergeMemos,
  mergeFolders,
  mergeTrash,
  mergeCalendar,
  mergeActivities,
  mergeMacros,
  mergeSettings
} from './useFirestoreSync.merging';

import {
  createDebouncedSave,
  createSyncMemo,
  createDeleteMemo,
  createSyncFolder,
  createDeleteFolder,
  createSyncTrashItem,
  createDeleteTrashItem,
  createSyncMacro,
  createDeleteMacro,
  createSyncCalendarDate,
  createDeleteCalendarDate,
  createSyncActivity,
  createDeleteActivity,
  createSyncSettings,
  createSyncMemos,
  createSyncFolders,
  createSyncTrash,
  createSyncMacros,
  createSyncCalendar,
  createSyncActivities
} from './useFirestoreSync.operations';

import {
  createVisibilityChangeHandler,
  createOnlineHandler,
  createOfflineHandler,
  createManualSync
} from './useFirestoreSync.events';

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
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'offline'

  // ✅ Hydration First: localStorage → State → Firestore 병합
  // isReady 플래그: Firestore 초기 로드 완료 전까지 localStorage 쓰기 방지
  const [isReady, setIsReady] = useState(false);

  // ✅ HYDRATION FIRST: useState 초기값을 localStorage에서 로드
  const [memos, setMemos] = useState(() => {
    if (!userId) return [];
    return getAccountLocalStorageWithTTL(userId, 'memos', false) || [];
  });
  const memosRef = useRef([]); // 함수형 업데이트 지원을 위한 ref

  const [folders, setFolders] = useState(() => {
    if (!userId) return [];
    return getAccountLocalStorageWithTTL(userId, 'folders', false) || [];
  });

  const [trash, setTrash] = useState(() => {
    if (!userId) return [];
    return getAccountLocalStorageWithTTL(userId, 'trash', false) || [];
  });

  const [macros, setMacros] = useState(() => {
    if (!userId) return [];
    return getAccountLocalStorageWithTTL(userId, 'macros', false) || [];
  });

  const [calendar, setCalendar] = useState(() => {
    if (!userId) return {};
    return getAccountLocalStorageWithTTL(userId, 'calendar', false) || {};
  });

  const [activities, setActivities] = useState(() => {
    if (!userId) return [];
    return getAccountLocalStorageWithTTL(userId, 'activities', false) || [];
  });

  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      widgets: ['StatsGrid', 'QuickActions', 'RecentActivity'],
      displayCount: 5,
      nickname: null,
      profileImageType: 'avatar',
      selectedAvatarId: null,
      avatarBgColor: 'none'
    };
    if (!userId) return defaultSettings;

    const widgets = getAccountLocalStorageWithTTL(userId, 'widgets', false);
    const displayCount = getAccountLocalStorageWithTTL(userId, 'displayCount', false);

    return {
      ...defaultSettings,
      ...(widgets && { widgets }),
      ...(displayCount && { displayCount })
    };
  });

  // 마이그레이션 완료 여부
  const [migrated, setMigrated] = useState(false);
  const migrationRef = useRef(false);

  // 리스너 언마운트용 참조
  const unsubscribeRefs = useRef([]);

  // 리스너가 설정되었는지 여부 (중복 방지)
  const listenersSetupRef = useRef(false);

  // memos 변경 시 ref 업데이트 (함수형 업데이트 지원)
  useEffect(() => {
    memosRef.current = memos;
  }, [memos]);

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

        // 🔍 진단: 데이터 로드 시작
        diagnosticLog('info', '데이터 로드 시작', {
          userId: userId ? userId.substring(0, 8) + '...' : 'N/A',
          enabled,
          migrated: migrationRef.current
        });

        // 🧹 Step 0-1: 만료된 localStorage 데이터 정리
        const cleanedCount = cleanupExpiredLocalStorage(userId);
        if (cleanedCount > 0) {
          console.log(`🧹 localStorage 만료 데이터 ${cleanedCount}개 정리 완료`);
        }

        // 🧹 Step 0-2: Firestore 삭제된 문서 정리 (10일 유예 기간)
        try {
          const { cleanupDeletedFirestoreDocuments } = await import('../services/userDataService');
          const deletedDocsCount = await cleanupDeletedFirestoreDocuments(userId);
          if (deletedDocsCount > 0) {
            console.log(`🧹 Firestore 삭제 문서 ${deletedDocsCount}개 완전 삭제 완료`);
          }
        } catch (error) {
          console.warn('⚠️ Firestore 삭제 문서 정리 실패:', error);
        }

        // 🔄 Step 1: 구 구조 Firestore → 신 구조 Firestore 마이그레이션
        const legacyMigrationKey = `legacy_firestore_migrated_${userId}`;
        const legacyAlreadyMigrated = localStorage.getItem(legacyMigrationKey) === 'true';

        if (!legacyAlreadyMigrated && firebaseUID) {
          try {
            const migrated = await migrateLegacyFirestoreData(firebaseUID, userId);
            if (migrated) {
              localStorage.setItem(legacyMigrationKey, 'true');
              console.log('✅ 구 구조 데이터 마이그레이션 완료!');
            } else {
              // 마이그레이션할 데이터가 없으면 플래그 설정
              localStorage.setItem(legacyMigrationKey, 'true');
            }
          } catch (error) {
            console.warn('⚠️ 구 구조 마이그레이션 건너뜀:', error);
            // 오류 발생 시에도 플래그 설정하여 다음부터 건너뛰기
            localStorage.setItem(legacyMigrationKey, 'true');
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

        // 🔍 진단: Firestore 데이터 로드 완료
        diagnosticLog('success', 'Firestore 로드 완료', {
          memos: data.memos?.length || 0,
          folders: data.folders?.length || 0,
          calendar: Object.keys(data.calendar || {}).length,
          macros: data.macros?.length || 0
        });

        // Step 4: Firestore에 데이터가 없으면 localStorage에서 마이그레이션
        const hasFirestoreData = data.memos?.length > 0 ||
                                  data.folders?.length > 0 ||
                                  data.trash?.length > 0 ||
                                  Object.keys(data.calendar || {}).length > 0;

        if (!hasFirestoreData) {
          // ⚠️ 계정별 localStorage만 확인 (공유 localStorage 사용 안 함)
          const localMemos = getAccountLocalStorage(userId, 'memos') || [];
          const localFolders = getAccountLocalStorage(userId, 'folders') || [];
          const hasLocalData = localMemos.length > 0 || localFolders.length > 0;

          if (hasLocalData) {
            console.log('📦 Firestore 비어있음 - 계정별 localStorage 데이터 마이그레이션 시작...');
            await migrateLocalStorageToFirestore(userId);
            console.log('✅ 계정별 localStorage 마이그레이션 완료!');

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
          // Firestore에 데이터가 있음
          console.log('✅ Firestore 데이터 로드');

          // ⭐ Evernote 방식: 다중 기기 동기화 + 오프라인 병합
          const localMemos = getLocalStorageWithFallback(userId, 'memos', 'memos_shared') || [];
          const localFolders = getLocalStorageWithFallback(userId, 'folders', 'memoFolders') || [];
          const localCalendar = getLocalStorageWithFallback(userId, 'calendar', 'calendarSchedules_shared') || {};
          const localTrash = getLocalStorageWithFallback(userId, 'trash', 'trashedItems_shared') || [];
          const localActivities = getLocalStorageWithFallback(userId, 'activities', 'recentActivities_shared') || [];
          const localMacros = getLocalStorageWithFallback(userId, 'macros', 'macroTexts') || [];

          // 각 데이터 타입별로 병합
          const mergedMemos = mergeMemos(data.memos, localMemos);
          const mergedFolders = mergeFolders(data.folders, localFolders);
          const mergedTrash = mergeTrash(data.trash, localTrash);
          const mergedCalendar = mergeCalendar(data.calendar, localCalendar);
          const mergedActivities = mergeActivities(data.activities, localActivities);
          const mergedMacros = mergeMacros(data.macros, localMacros);
          const mergedSettings = mergeSettings(data.settings, settings, saveSettingsToFirestore, userId);

          setMemos(mergedMemos);
          setFolders(mergedFolders);
          setTrash(mergedTrash);
          setMacros(mergedMacros);
          setCalendar(mergedCalendar);
          setActivities(mergedActivities);
          setSettings(mergedSettings);

          // ✅ FIX: State 타이밍 버그 수정 - 병합된 값을 직접 사용
          // setState는 비동기이므로 state 변수가 아닌 병합된 값을 localStorage에 저장
          setAccountLocalStorageWithTTL(userId, 'memos', mergedMemos, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'folders', mergedFolders, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'trash', mergedTrash, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'macros', mergedMacros, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'calendar', mergedCalendar, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'activities', mergedActivities, { synced: true });
        }

        // 신규 사용자의 경우에만 아래 로직 실행
        if (!hasFirestoreData) {
          // localStorage에 병합된 데이터 캐싱 (TTL 기반)
          const currentMemos = memos.length > 0 ? memos : (data.memos || []);
          const currentFolders = folders.length > 0 ? folders : (data.folders || []);
          const currentCalendar = Object.keys(calendar).length > 0 ? calendar : (data.calendar || {});

          // Firestore에서 로드한 데이터이므로 synced: true로 저장
          setAccountLocalStorageWithTTL(userId, 'memos', currentMemos, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'folders', currentFolders, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'trash', data.trash || [], { synced: true });
          setAccountLocalStorageWithTTL(userId, 'macros', data.macros || [], { synced: true });
          setAccountLocalStorageWithTTL(userId, 'calendar', currentCalendar, { synced: true });
          setAccountLocalStorageWithTTL(userId, 'activities', data.activities || [], { synced: true });
        }

        // 설정은 영구 보존 (TTL 정책에 따라)
        setAccountLocalStorageWithTTL(userId, 'widgets', data.settings?.widgets || ['StatsGrid', 'QuickActions', 'RecentActivity'], { synced: true });
        setAccountLocalStorageWithTTL(userId, 'displayCount', data.settings?.displayCount || 5, { synced: true });

        // 알람 설정도 동기화 (사용자별 localStorage에 저장)
        if (data.settings?.alarmSettings) {
          const alarmSettingsKey = `user_${userId}_alarmSettings`;
          localStorage.setItem(alarmSettingsKey, JSON.stringify(data.settings.alarmSettings));
          console.log('✅ 알람 설정 Firestore에서 로드:', data.settings.alarmSettings);
        }

        // 닉네임은 별도 nicknames 컬렉션에서 가져오기 (사용자별 저장)
        try {
          const { getUserNickname } = await import('../services/nicknameService');
          const nickname = await getUserNickname(userId);
          if (nickname) {
            localStorage.setItem(`user_${userId}_nickname`, nickname);
            console.log('✅ 닉네임 로드 (userId:', userId + '):', nickname);
          }
        } catch (error) {
          console.error('닉네임 동기화 실패:', error);
        }

        if (data.settings?.profileImageType) localStorage.setItem('profileImageType', data.settings.profileImageType);
        if (data.settings?.selectedAvatarId) localStorage.setItem('selectedAvatarId', data.settings.selectedAvatarId);
        if (data.settings?.avatarBgColor) localStorage.setItem('avatarBgColor', data.settings.avatarBgColor);

        setMigrated(true);
        migrationRef.current = true;

        // ✅ Write Guard: Firestore 초기 로드 완료 후 localStorage 쓰기 허용
        setIsReady(true);
        console.log('✅ Firestore 초기 로드 완료 - localStorage 쓰기 활성화');

        // 🔍 진단: 초기화 완료
        diagnosticLog('success', '초기화 완료', {
          ready: true,
          userId: userId.substring(0, 8) + '...'
        });
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err);

        // 🔍 진단: 로드 실패
        diagnosticLog('error', 'Firestore 로드 실패', {
          error: err.message,
          code: err.code
        });

        // 오류 시 localStorage 폴백
        const fallbackMemos = getLocalStorageWithFallback(userId, 'memos', 'memos_shared') || [];
        const fallbackFolders = getLocalStorageWithFallback(userId, 'folders', 'memoFolders') || [];
        setMemos(fallbackMemos);
        setFolders(fallbackFolders);

        // ✅ 오류 시에도 isReady 활성화 (로컬 모드로 작동)
        setIsReady(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, enabled, firebaseUID]);

  // ⚠️ 실시간 리스너 비활성화 (Firestore quota 절약)
  // 이유: 개발자 혼자 테스트하는데 하루 50,000 읽기 소진은 비정상
  // 해결: 수동 동기화 방식 - 앱 시작 시 1회 로드, 사용자 수정 시 즉시 저장
  // 필요 시 syncFromFirestore() 함수로 수동 동기화 가능

  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    console.log('✅ 수동 동기화 모드 활성화 (실시간 리스너 비활성화로 quota 99% 절감)');
    listenersSetupRef.current = true;

    return () => {
      listenersSetupRef.current = false;
    };
  }, [userId, enabled, migrated]);

  // localStorage 즉시 동기화 (데이터 손실 방지)
  // ⚠️ 캘린더는 제외 - Firestore가 단일 진실 공급원(Single Source of Truth)
  // ⚠️ TTL 정책: memos, folders는 synced 플래그로 관리, 나머지는 TTL 기반
  useEffect(() => {
    // ✅ Write Guard: Firestore 초기 로드 완료 전에는 localStorage 쓰기 금지
    if (!userId || !enabled || !migrated || !isReady) return;

    try {
      // synced: false로 저장 (Firestore 저장 완료 후 true로 변경됨)
      setAccountLocalStorageWithTTL(userId, 'memos', memos, { synced: false });
      setAccountLocalStorageWithTTL(userId, 'folders', folders, { synced: false });
      setAccountLocalStorageWithTTL(userId, 'trash', trash, { synced: false });
      setAccountLocalStorageWithTTL(userId, 'macros', macros, { synced: false });
      // calendar는 Firestore에만 저장 (localStorage 사용 안 함)
      setAccountLocalStorageWithTTL(userId, 'activities', activities, { synced: false });
    } catch (error) {
      console.error('localStorage 동기화 실패:', error);
    }
  }, [userId, enabled, migrated, isReady, memos, folders, trash, macros, calendar, activities]);

  // ⚡ 포그라운드 복귀 시 자동 동기화 체크 (최적화: localStorage 기반 증분 동기화)
  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    const handleVisibilityChange = createVisibilityChangeHandler(userId, enabled, migrated, setSyncStatus);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, enabled, migrated]);

  // 🌐 온라인/오프라인 상태 감지 (⚡ debounce 추가)
  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    const handleOnline = createOnlineHandler(userId, enabled, migrated, setSyncStatus);
    const handleOffline = createOfflineHandler(setSyncStatus, handleOnline);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // ⚡ 클린업 시 타이머 제거
      if (handleOnline?.cleanup) {
        handleOnline.cleanup();
      }
    };
  }, [userId, enabled, migrated]);

  // 디바운스 저장 함수 생성
  const debouncedSave = useCallback(
    createDebouncedSave(userId, enabled),
    [userId, enabled]
  );

  // 브라우저 종료 시 긴급 백업 (데이터 손실 최종 방어선)
  // ⚠️ 캘린더는 제외 - Firestore가 단일 진실 공급원
  useEffect(() => {
    if (!userId || !enabled) return;

    const handleBeforeUnload = async (e) => {
      // ✅ CRITICAL FIX: 대기 중인 디바운스 타이머 즉시 실행
      try {
        if (debouncedSave && debouncedSave.flush) {
          await debouncedSave.flush();
          console.log('🚨 [긴급 플러시] 대기 중인 Firestore 저장 완료');
        }
      } catch (error) {
        console.error('❌ 디바운스 플러시 실패:', error);
      }

      // localStorage 긴급 저장 (동기) - synced: false로 저장
      try {
        setAccountLocalStorageWithTTL(userId, 'memos', memos, { synced: false });
        setAccountLocalStorageWithTTL(userId, 'folders', folders, { synced: false });
        setAccountLocalStorageWithTTL(userId, 'trash', trash, { synced: false });
        setAccountLocalStorageWithTTL(userId, 'macros', macros, { synced: false });
        // calendar는 Firestore에만 저장 (localStorage 긴급 백업 제외)
        setAccountLocalStorageWithTTL(userId, 'activities', activities, { synced: false });
        console.log('✅ 브라우저 종료 전 긴급 백업 완료');
      } catch (error) {
        console.error('❌ 긴급 백업 실패:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, enabled, memos, folders, trash, macros, calendar, activities, debouncedSave]);

  // 개별 동기화 함수들
  const syncMemo = useCallback(createSyncMemo(userId, setMemos, debouncedSave), [userId, debouncedSave]);
  const deleteMemo = useCallback(createDeleteMemo(userId, enabled, setMemos), [userId, enabled]);
  const syncFolder = useCallback(createSyncFolder(userId, setFolders, debouncedSave), [userId, debouncedSave]);
  const deleteFolder = useCallback(createDeleteFolder(userId, enabled, setFolders), [userId, enabled]);
  const syncTrashItem = useCallback(createSyncTrashItem(userId, setTrash, debouncedSave), [userId, debouncedSave]);
  const deleteTrashItem = useCallback(createDeleteTrashItem(userId, enabled, setTrash), [userId, enabled]);
  const syncMacro = useCallback(createSyncMacro(userId, enabled, setMacros, debouncedSave), [userId, enabled, debouncedSave]);
  const deleteMacro = useCallback(createDeleteMacro(userId, enabled, setMacros), [userId, enabled]);
  const syncCalendarDate = useCallback(createSyncCalendarDate(userId, setCalendar, debouncedSave), [userId, debouncedSave]);
  const deleteCalendarDate = useCallback(createDeleteCalendarDate(userId, enabled, setCalendar), [userId, enabled]);
  const syncActivity = useCallback(createSyncActivity(userId, setActivities, debouncedSave), [userId, debouncedSave]);
  const deleteActivity = useCallback(createDeleteActivity(userId, enabled, setActivities), [userId, enabled]);
  const syncSettings = useCallback(createSyncSettings(userId, setSettings, debouncedSave), [userId, debouncedSave]);

  // 배열 기반 동기화 함수들 (하위 호환)
  // getMemosRef를 useMemo 대신 ref로 저장하여 안정성 확보
  const getMemosRefFn = useRef(() => memosRef.current);
  const syncMemos = useCallback(
    createSyncMemos(userId, setMemos, debouncedSave, getMemosRefFn.current),
    [userId, debouncedSave]
  );
  const syncFolders = useCallback(createSyncFolders(userId, setFolders, debouncedSave), [userId, debouncedSave]);
  const syncTrash = useCallback(createSyncTrash(userId, setTrash, debouncedSave), [userId, debouncedSave]);
  const syncMacros = useCallback(createSyncMacros(userId, enabled, setMacros, debouncedSave), [userId, enabled, debouncedSave]);
  const syncCalendar = useCallback(createSyncCalendar(userId, setCalendar, debouncedSave), [userId, debouncedSave]);
  const syncActivities = useCallback(createSyncActivities(userId, setActivities, debouncedSave), [userId, debouncedSave]);

  // 즉시 저장 (디바운스 없이) - 로그아웃 등에서 사용
  // ⚠️ 2025-12-01: 할당량 절약을 위해 비활성화
  // 디바운스 자동 저장(300ms)으로 충분하며, 전체 저장은 할당량을 과도하게 소모함
  const saveImmediately = useCallback(async () => {
    console.log('⚠️ saveImmediately 호출 무시 (Firestore 할당량 절약)');
    console.log('💡 변경사항은 디바운스 자동 저장(300ms)으로 저장됩니다.');
    // 아무 작업도 하지 않음 - 할당량 절약
    return Promise.resolve();
  }, []);

  // ⚡ 대기 중인 저장 즉시 실행 (알람 등록 등 중요 작업용)
  const flushPendingSaves = useCallback(async () => {
    if (debouncedSave && debouncedSave.flush) {
      console.log('⚡ [flushPendingSaves] 대기 중인 저장 즉시 실행');
      await debouncedSave.flush();
    }
  }, [debouncedSave]);

  // 수동 동기화
  const manualSync = useCallback(
    createManualSync(userId, enabled, setSyncStatus),
    [userId, enabled]
  );

  return {
    // 상태
    loading,
    error,
    migrated,
    syncStatus,

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
    saveImmediately,
    flushPendingSaves,

    // 수동 동기화
    manualSync,

    // ⭐ 운세 프로필 Firestore 함수 (fortuneLogic.js에서 사용)
    saveFortuneProfileToFirestore,
    fetchFortuneProfileFromFirestore
  };
};
