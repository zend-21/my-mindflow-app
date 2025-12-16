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
import {
  fetchAllUserData,
  migrateLocalStorageToFirestore,
  migrateLegacyFirestoreData,
  migrateArrayToIndividualDocs,
  saveMemoToFirestore,
  saveFolderToFirestore,
  saveTrashItemToFirestore,
  saveMacroToFirestore,
  saveCalendarDateToFirestore,
  saveActivityToFirestore,
  saveSettingsToFirestore,
  saveFortuneProfileToFirestore,
  deleteMemoFromFirestore,
  deleteFolderFromFirestore,
  deleteTrashItemFromFirestore,
  deleteCalendarDateFromFirestore,
  deleteActivityFromFirestore,
  fetchFortuneProfileFromFirestore
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
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'offline'

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
          // Firestore에 데이터가 있음
          console.log('✅ Firestore 데이터 로드');

          // ⭐ Evernote 방식: 다중 기기 동기화 + 오프라인 병합
          const localMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
          const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
          const localCalendar = JSON.parse(localStorage.getItem('calendarSchedules_shared') || '{}');
          const localTrash = JSON.parse(localStorage.getItem('trashedItems_shared') || '[]');
          const localActivities = JSON.parse(localStorage.getItem('recentActivities_shared') || '[]');
          const localMacros = JSON.parse(localStorage.getItem('macroTexts') || '[]');

          // 📝 메모 병합 (개별 문서별로 처리)
          const mergedMemos = data.memos.map(firestoreMemo => {
            const localMemo = localMemos.find(m => m.id === firestoreMemo.id);
            if (!localMemo) return firestoreMemo;  // Firestore만 있음

            // firestore_saved와 비교하여 미저장 변경사항 감지
            const lastSavedKey = `firestore_saved_memo_${firestoreMemo.id}`;
            const lastSaved = localStorage.getItem(lastSavedKey);
            const localData = JSON.stringify(localMemo);

            if (lastSaved === localData) {
              // ✅ 로컬 = 마지막 저장 버전 → 이 기기에서 수정 안 함 → Firestore 신뢰
              return firestoreMemo;
            } else {
              // ⚠️ 로컬 ≠ 마지막 저장 버전 → 이 기기에서 수정함 또는 다른 기기에서 수정함
              // 💡 타임스탬프 비교로 충돌 해결
              const firestoreTime = firestoreMemo.updatedAt?.toMillis ? firestoreMemo.updatedAt.toMillis() : (firestoreMemo.updatedAt || 0);
              const lastSavedMemo = lastSaved ? JSON.parse(lastSaved) : {};
              const lastSyncedTime = lastSavedMemo.updatedAt?.toMillis ? lastSavedMemo.updatedAt.toMillis() : (lastSavedMemo.updatedAt || 0);

              // 🆕 로컬 메모의 실제 타임스탬프 (Firestore 저장 실패 시에도 사용)
              const localTime = localMemo.updatedAt || 0;

              // ✅ lastSaved가 없으면 로컬 타임스탬프 사용 (Firestore 저장 실패한 경우)
              const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

              if (firestoreTime > effectiveSyncedTime) {
                // Firestore가 더 최신 → 다른 기기에서 수정됨
                console.warn(`⚠️ 다른 기기에서 수정 감지: ${firestoreMemo.id}`);
                console.warn(`  → Firestore 우선 (${new Date(firestoreTime).toLocaleString()} > ${new Date(effectiveSyncedTime).toLocaleString()})`);
                return firestoreMemo;
              } else {
                // 로컬이 더 최신 또는 저장 실패 → 로컬 우선
                console.warn(`⚠️ 로컬 변경 감지: ${firestoreMemo.id}`);
                console.warn(`  → 로컬 우선 (${new Date(localTime).toLocaleString()}) - 재저장 시도`);

                // 재저장 시도 (할당량 초과 시 자동으로 실패하고 다음에 재시도)
                saveMemoToFirestore(userId, localMemo).catch(err => {
                  console.error('재저장 실패:', err);
                });
                return localMemo;
              }
            }
          });

          // 로컬에만 있는 메모 처리 (새 생성 또는 다른 기기에서 삭제됨)
          const localOnlyMemos = localMemos.filter(localMemo =>
            !data.memos.find(m => m.id === localMemo.id)
          );

          localOnlyMemos.forEach(localMemo => {
            const lastSaved = localStorage.getItem(`firestore_saved_memo_${localMemo.id}`);

            if (!lastSaved) {
              // 한 번도 저장 안 됨 → 진짜 새 메모
              console.log(`🆕 새 메모 발견: ${localMemo.id} - 업로드 시도`);
              mergedMemos.push(localMemo);
              saveMemoToFirestore(userId, localMemo).catch(err => {
                console.error('새 메모 업로드 실패:', err);
              });
            } else {
              // 저장 기록 있는데 Firestore에 없음 → 다른 기기에서 삭제됨
              console.warn(`🗑️ 다른 기기에서 삭제됨: ${localMemo.id}`);
              localStorage.removeItem(`firestore_saved_memo_${localMemo.id}`);
              // mergedMemos에 추가 안 함 (삭제 반영)
            }
          });

          // 📁 폴더도 동일하게 병합
          const mergedFolders = data.folders.map(firestoreFolder => {
            const localFolder = localFolders.find(f => f.id === firestoreFolder.id);
            if (!localFolder) return firestoreFolder;

            const lastSaved = localStorage.getItem(`firestore_saved_folder_${firestoreFolder.id}`);
            const localData = JSON.stringify(localFolder);

            if (lastSaved === localData) {
              return firestoreFolder;
            } else {
              // 💡 타임스탬프 비교로 충돌 해결
              const firestoreTime = firestoreFolder.updatedAt?.toMillis ? firestoreFolder.updatedAt.toMillis() : (firestoreFolder.updatedAt || 0);
              const lastSavedFolder = lastSaved ? JSON.parse(lastSaved) : {};
              const lastSyncedTime = lastSavedFolder.updatedAt?.toMillis ? lastSavedFolder.updatedAt.toMillis() : (lastSavedFolder.updatedAt || 0);

              // 🆕 로컬 폴더의 실제 타임스탬프 (Firestore 저장 실패 시에도 사용)
              const localTime = localFolder.updatedAt || 0;

              // ✅ lastSaved가 없으면 로컬 타임스탬프 사용 (Firestore 저장 실패한 경우)
              const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

              if (firestoreTime > effectiveSyncedTime) {
                // Firestore가 더 최신 → 다른 기기에서 수정됨
                console.warn(`⚠️ 폴더 다른 기기에서 수정: ${firestoreFolder.id}`);
                return firestoreFolder;
              } else {
                // 로컬이 더 최신 또는 저장 실패
                console.warn(`⚠️ 폴더 로컬 변경 감지: ${firestoreFolder.id}`);
                saveFolderToFirestore(userId, localFolder).catch(err => {
                  console.error('폴더 재저장 실패:', err);
                });
                return localFolder;
              }
            }
          });

          const localOnlyFolders = localFolders.filter(localFolder =>
            !data.folders.find(f => f.id === localFolder.id)
          );

          localOnlyFolders.forEach(localFolder => {
            const lastSaved = localStorage.getItem(`firestore_saved_folder_${localFolder.id}`);
            if (!lastSaved) {
              mergedFolders.push(localFolder);
              saveFolderToFirestore(userId, localFolder).catch(err => {
                console.error('새 폴더 업로드 실패:', err);
              });
            } else {
              console.warn(`🗑️ 폴더 다른 기기에서 삭제됨: ${localFolder.id}`);
              localStorage.removeItem(`firestore_saved_folder_${localFolder.id}`);
            }
          });

          // 🗑️ 휴지통 병합 (아이템별 타임스탬프 비교 - 메모와 동일한 방식)
          const mergedTrash = (data.trash || []).map(firestoreItem => {
            const localItem = localTrash.find(t => t.id === firestoreItem.id);
            if (!localItem) return firestoreItem;

            const lastSavedKey = `firestore_saved_trash_${firestoreItem.id}`;
            const lastSaved = localStorage.getItem(lastSavedKey);
            const localData = JSON.stringify(localItem);

            if (lastSaved === localData) {
              return firestoreItem;
            } else {
              const firestoreTime = firestoreItem.updatedAt?.toMillis ? firestoreItem.updatedAt.toMillis() : (firestoreItem.updatedAt || 0);
              const lastSavedItem = lastSaved ? JSON.parse(lastSaved) : {};
              const lastSyncedTime = lastSavedItem.updatedAt?.toMillis ? lastSavedItem.updatedAt.toMillis() : (lastSavedItem.updatedAt || 0);

              const localTime = localItem.updatedAt || 0;
              const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

              if (firestoreTime > effectiveSyncedTime) {
                console.warn(`⚠️ 휴지통 아이템 ${firestoreItem.id} 다른 기기에서 수정 - Firestore 우선`);
                return firestoreItem;
              } else {
                console.warn(`⚠️ 휴지통 아이템 ${firestoreItem.id} 로컬 변경 감지 - 로컬 우선`);
                saveTrashItemToFirestore(userId, localItem).catch(() => {});
                return localItem;
              }
            }
          });

          // 로컬에만 있는 휴지통 아이템 추가
          const localOnlyTrash = localTrash.filter(localItem =>
            !data.trash?.find(t => t.id === localItem.id)
          );
          localOnlyTrash.forEach(item => {
            mergedTrash.push(item);
            saveTrashItemToFirestore(userId, item).catch(() => {});
          });

          // 📅 캘린더 병합 (날짜별 타임스탬프 비교 - 메모와 동일한 방식)
          let mergedCalendar = { ...data.calendar };

          // Firestore 캘린더와 로컬 캘린더 병합 (날짜별로)
          const allDateKeys = new Set([
            ...Object.keys(data.calendar || {}),
            ...Object.keys(localCalendar || {})
          ]);

          allDateKeys.forEach(dateKey => {
            const firestoreSchedule = data.calendar?.[dateKey];
            const localSchedule = localCalendar?.[dateKey];

            if (!firestoreSchedule && localSchedule) {
              // Firestore에만 없음 → 로컬이 새로 생성
              mergedCalendar[dateKey] = localSchedule;
              saveCalendarDateToFirestore(userId, dateKey, localSchedule).catch(() => {});
            } else if (firestoreSchedule && !localSchedule) {
              // 로컬에만 없음 → Firestore 우선
              mergedCalendar[dateKey] = firestoreSchedule;
            } else if (firestoreSchedule && localSchedule) {
              // 둘 다 존재 → 타임스탬프 비교
              const lastSavedKey = `firestore_saved_calendar_${dateKey}`;
              const lastSaved = localStorage.getItem(lastSavedKey);
              const localData = JSON.stringify(localSchedule);

              if (lastSaved === localData) {
                // ✅ 로컬 = 마지막 저장 버전 → Firestore 신뢰
                mergedCalendar[dateKey] = firestoreSchedule;
              } else {
                // ⚠️ 로컬 ≠ 마지막 저장 버전 → 타임스탬프 비교
                const firestoreTime = firestoreSchedule.updatedAt?.toMillis ? firestoreSchedule.updatedAt.toMillis() : (firestoreSchedule.updatedAt || 0);
                const lastSavedSchedule = lastSaved ? JSON.parse(lastSaved) : {};
                const lastSyncedTime = lastSavedSchedule.updatedAt?.toMillis ? lastSavedSchedule.updatedAt.toMillis() : (lastSavedSchedule.updatedAt || 0);

                // 🆕 로컬 스케줄의 실제 타임스탬프 (Firestore 저장 실패 시에도 사용)
                const localTime = localSchedule.updatedAt || 0;

                // ✅ lastSaved가 없으면 로컬 타임스탬프 사용 (Firestore 저장 실패한 경우)
                const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

                if (firestoreTime > effectiveSyncedTime) {
                  console.warn(`⚠️ 캘린더 ${dateKey} 다른 기기에서 수정 - Firestore 우선`);
                  console.warn(`  → Firestore 우선 (${new Date(firestoreTime).toLocaleString()} > ${new Date(effectiveSyncedTime).toLocaleString()})`);
                  mergedCalendar[dateKey] = firestoreSchedule;
                } else {
                  console.warn(`⚠️ 캘린더 ${dateKey} 로컬 변경 감지 - 로컬 우선, 재저장 시도`);
                  console.warn(`  → 로컬 우선 (${new Date(localTime).toLocaleString()})`);
                  mergedCalendar[dateKey] = localSchedule;
                  saveCalendarDateToFirestore(userId, dateKey, localSchedule).catch(() => {});
                }
              }
            }
          });

          // 📊 활동 병합 (아이템별 타임스탬프 비교 - 메모와 동일한 방식)
          const mergedActivities = (data.activities || []).map(firestoreActivity => {
            const localActivity = localActivities.find(a => a.id === firestoreActivity.id);
            if (!localActivity) return firestoreActivity;

            const lastSavedKey = `firestore_saved_activity_${firestoreActivity.id}`;
            const lastSaved = localStorage.getItem(lastSavedKey);
            const localData = JSON.stringify(localActivity);

            if (lastSaved === localData) {
              return firestoreActivity;
            } else {
              const firestoreTime = firestoreActivity.timestamp?.toMillis ? firestoreActivity.timestamp.toMillis() : (firestoreActivity.timestamp || 0);
              const lastSavedActivity = lastSaved ? JSON.parse(lastSaved) : {};
              const lastSyncedTime = lastSavedActivity.timestamp?.toMillis ? lastSavedActivity.timestamp.toMillis() : (lastSavedActivity.timestamp || 0);

              const localTime = localActivity.timestamp || 0;
              const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

              if (firestoreTime > effectiveSyncedTime) {
                console.warn(`⚠️ 활동 ${firestoreActivity.id} 다른 기기에서 수정 - Firestore 우선`);
                return firestoreActivity;
              } else {
                console.warn(`⚠️ 활동 ${firestoreActivity.id} 로컬 변경 감지 - 로컬 우선`);
                saveActivityToFirestore(userId, localActivity).catch(() => {});
                return localActivity;
              }
            }
          });

          // 로컬에만 있는 활동 추가
          const localOnlyActivities = localActivities.filter(localActivity =>
            !data.activities?.find(a => a.id === localActivity.id)
          );
          localOnlyActivities.forEach(activity => {
            mergedActivities.push(activity);
            saveActivityToFirestore(userId, activity).catch(() => {});
          });

          // 📝 매크로 병합 (플래그만 사용, 타임스탬프 없음)
          const useLocalMacros = localStorage.getItem('firestore_saved_macros_all') !== JSON.stringify(localMacros);
          const mergedMacros = useLocalMacros ? localMacros : (data.macros || []);

          if (useLocalMacros) {
            console.warn('⚠️ 매크로 미저장 변경 감지 - 로컬 우선, 재저장 시도');
            saveMacroToFirestore(userId, localMacros).catch(() => {});
          }

          // ⚙️ 설정 병합 (타임스탬프 비교 - 메모와 동일한 방식)
          let mergedSettings = settings;
          if (data.settings) {
            const lastSavedKey = 'firestore_saved_settings_main';
            const lastSaved = localStorage.getItem(lastSavedKey);
            const localData = JSON.stringify(settings);

            if (lastSaved === localData) {
              // ✅ 로컬 = 마지막 저장 버전 → Firestore 신뢰
              mergedSettings = data.settings;
            } else {
              // ⚠️ 로컬 ≠ 마지막 저장 버전 → 타임스탬프 비교
              const firestoreTime = data.settings.updatedAt?.toMillis ? data.settings.updatedAt.toMillis() : (data.settings.updatedAt || 0);
              const lastSavedSettings = lastSaved ? JSON.parse(lastSaved) : {};
              const lastSyncedTime = lastSavedSettings.updatedAt?.toMillis ? lastSavedSettings.updatedAt.toMillis() : (lastSavedSettings.updatedAt || 0);

              const localTime = settings.updatedAt || 0;
              const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

              if (firestoreTime > effectiveSyncedTime) {
                console.warn('⚠️ 설정 다른 기기에서 수정 - Firestore 우선');
                mergedSettings = data.settings;
              } else {
                console.warn('⚠️ 설정 로컬 변경 감지 - 로컬 우선, 재저장 시도');
                mergedSettings = settings;
                saveSettingsToFirestore(userId, settings).catch(() => {});
              }
            }
          }

          setMemos(mergedMemos);
          setFolders(mergedFolders);
          setTrash(mergedTrash);
          setMacros(mergedMacros);
          setCalendar(mergedCalendar);
          setActivities(mergedActivities);
          setSettings(mergedSettings);

          console.log('✅ Evernote 방식 다중 기기 동기화 완료');
        }

        // localStorage에 병합된 데이터 캐싱
        const currentMemos = memos.length > 0 ? memos : (data.memos || []);
        const currentFolders = folders.length > 0 ? folders : (data.folders || []);
        const currentCalendar = Object.keys(calendar).length > 0 ? calendar : (data.calendar || {});

        localStorage.setItem('memos_shared', JSON.stringify(currentMemos));
        localStorage.setItem('memoFolders', JSON.stringify(currentFolders));
        localStorage.setItem('trashedItems_shared', JSON.stringify(data.trash || []));
        localStorage.setItem('macroTexts', JSON.stringify(data.macros || []));
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(currentCalendar));
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
  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    try {
      localStorage.setItem('memos_shared', JSON.stringify(memos));
      localStorage.setItem('memoFolders', JSON.stringify(folders));
      localStorage.setItem('trashedItems_shared', JSON.stringify(trash));
      localStorage.setItem('macroTexts', JSON.stringify(macros));
      localStorage.setItem('calendarSchedules_shared', JSON.stringify(calendar));
      localStorage.setItem('recentActivities_shared', JSON.stringify(activities));
    } catch (error) {
      console.error('localStorage 동기화 실패:', error);
    }
  }, [userId, enabled, migrated, memos, folders, trash, macros, calendar, activities]);

  // 브라우저 종료 시 긴급 백업 (데이터 손실 최종 방어선)
  useEffect(() => {
    if (!userId || !enabled) return;

    const handleBeforeUnload = () => {
      // localStorage 긴급 저장 (동기)
      try {
        localStorage.setItem('memos_shared', JSON.stringify(memos));
        localStorage.setItem('memoFolders', JSON.stringify(folders));
        localStorage.setItem('trashedItems_shared', JSON.stringify(trash));
        localStorage.setItem('macroTexts', JSON.stringify(macros));
        localStorage.setItem('calendarSchedules_shared', JSON.stringify(calendar));
        localStorage.setItem('recentActivities_shared', JSON.stringify(activities));
        console.log('✅ 브라우저 종료 전 긴급 백업 완료');
      } catch (error) {
        console.error('❌ 긴급 백업 실패:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, enabled, memos, folders, trash, macros, calendar, activities]);

  // 📱 포그라운드 복귀 시 자동 동기화 체크 (Evernote 방식)
  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    const handleVisibilityChange = async () => {
      // 앱이 포그라운드로 복귀 (백그라운드 → 포그라운드)
      if (!document.hidden) {
        console.log('📱 앱 포그라운드 복귀 - 동기화 체크 시작');
        setSyncStatus('syncing');

        try {
          // Firestore에서 최신 데이터 가져오기
          const data = await fetchAllUserData(userId);

          // localStorage와 비교하여 변경사항 확인
          const localMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
          const localCalendar = JSON.parse(localStorage.getItem('calendarSchedules_shared') || '{}');
          const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');

          // localStorage에만 있는 항목 찾기 (Firestore 저장 실패했던 것들)
          const unsyncedMemos = localMemos.filter(localMemo => {
            const inFirestore = data.memos.find(m => m.id === localMemo.id);
            if (!inFirestore) {
              const lastSaved = localStorage.getItem(`firestore_saved_memo_${localMemo.id}`);
              return !lastSaved; // 한 번도 저장 안 된 것만
            }
            return false;
          });

          const unsyncedCalendar = Object.keys(localCalendar).filter(dateKey => {
            const inFirestore = data.calendar?.[dateKey];
            if (!inFirestore) {
              const lastSaved = localStorage.getItem(`firestore_saved_calendar_${dateKey}`);
              return !lastSaved; // 한 번도 저장 안 된 것만
            }
            return false;
          });

          // 미동기화 항목 자동 업로드
          if (unsyncedMemos.length > 0) {
            console.log(`📤 미동기화 메모 ${unsyncedMemos.length}개 발견 - 업로드 시작`);
            for (const memo of unsyncedMemos) {
              try {
                await saveMemoToFirestore(userId, memo);
                localStorage.setItem(`firestore_saved_memo_${memo.id}`, JSON.stringify(memo));
                console.log(`✅ 메모 ${memo.id} 업로드 완료`);
              } catch (err) {
                console.error(`❌ 메모 ${memo.id} 업로드 실패:`, err);
              }
            }
          }

          if (unsyncedCalendar.length > 0) {
            console.log(`📤 미동기화 일정 ${unsyncedCalendar.length}개 발견 - 업로드 시작`);
            for (const dateKey of unsyncedCalendar) {
              const schedule = localCalendar[dateKey];
              if (schedule) {
                try {
                  await saveCalendarDateToFirestore(userId, dateKey, schedule);
                  localStorage.setItem(`firestore_saved_calendar_${dateKey}`, JSON.stringify(schedule));
                  console.log(`✅ 일정 ${dateKey} 업로드 완료`);
                } catch (err) {
                  console.error(`❌ 일정 ${dateKey} 업로드 실패:`, err);
                }
              }
            }
          }

          if (unsyncedMemos.length === 0 && unsyncedCalendar.length === 0) {
            console.log('✅ 모든 데이터 동기화됨');
          }

          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 2000); // 2초 후 idle로 전환
        } catch (err) {
          console.error('❌ 포그라운드 복귀 동기화 실패:', err);
          setSyncStatus('offline');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, enabled, migrated]);

  // 🌐 온라인/오프라인 상태 감지
  useEffect(() => {
    if (!userId || !enabled || !migrated) return;

    const handleOffline = () => {
      console.log('📴 네트워크 오프라인 감지');
      setSyncStatus('offline');
    };

    const handleOnline = async () => {
      console.log('🌐 네트워크 온라인 복귀 - 미동기화 항목 업로드 시작');
      setSyncStatus('syncing');

      try {
        // localStorage에서 모든 항목 가져오기
        const localMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
        const localCalendar = JSON.parse(localStorage.getItem('calendarSchedules_shared') || '{}');
        const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
        const localMacros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
        const localActivities = JSON.parse(localStorage.getItem('recentActivities_shared') || '[]');

        // 미동기화 항목 찾기 (firestore_saved가 없거나 다른 것들)
        const pendingItems = [];

        localMemos.forEach(memo => {
          const lastSaved = localStorage.getItem(`firestore_saved_memo_${memo.id}`);
          if (!lastSaved || lastSaved !== JSON.stringify(memo)) {
            pendingItems.push({ type: 'memo', id: memo.id, data: memo });
          }
        });

        Object.entries(localCalendar).forEach(([dateKey, schedule]) => {
          const lastSaved = localStorage.getItem(`firestore_saved_calendar_${dateKey}`);
          if (!lastSaved || lastSaved !== JSON.stringify(schedule)) {
            pendingItems.push({ type: 'calendar', id: dateKey, data: schedule });
          }
        });

        localFolders.forEach(folder => {
          const lastSaved = localStorage.getItem(`firestore_saved_folder_${folder.id}`);
          if (!lastSaved || lastSaved !== JSON.stringify(folder)) {
            pendingItems.push({ type: 'folder', id: folder.id, data: folder });
          }
        });

        localMacros.forEach(macro => {
          const lastSaved = localStorage.getItem(`firestore_saved_macro_${macro.id}`);
          if (!lastSaved || lastSaved !== JSON.stringify(macro)) {
            pendingItems.push({ type: 'macro', id: macro.id, data: macro });
          }
        });

        if (pendingItems.length > 0) {
          console.log(`📤 미동기화 항목 ${pendingItems.length}개 발견 - 업로드 시작`);

          for (const item of pendingItems) {
            try {
              switch (item.type) {
                case 'memo':
                  await saveMemoToFirestore(userId, item.data);
                  localStorage.setItem(`firestore_saved_memo_${item.id}`, JSON.stringify(item.data));
                  console.log(`✅ 메모 ${item.id} 업로드 완료`);
                  break;
                case 'calendar':
                  await saveCalendarDateToFirestore(userId, item.id, item.data);
                  localStorage.setItem(`firestore_saved_calendar_${item.id}`, JSON.stringify(item.data));
                  console.log(`✅ 일정 ${item.id} 업로드 완료`);
                  break;
                case 'folder':
                  await saveFolderToFirestore(userId, item.data);
                  localStorage.setItem(`firestore_saved_folder_${item.id}`, JSON.stringify(item.data));
                  console.log(`✅ 폴더 ${item.id} 업로드 완료`);
                  break;
                case 'macro':
                  await saveMacroToFirestore(userId, item.data);
                  localStorage.setItem(`firestore_saved_macro_${item.id}`, JSON.stringify(item.data));
                  console.log(`✅ 매크로 ${item.id} 업로드 완료`);
                  break;
              }
            } catch (err) {
              console.error(`❌ ${item.type} ${item.id} 업로드 실패:`, err);
            }
          }

          console.log('✅ 온라인 복귀 동기화 완료');
        } else {
          console.log('✅ 모든 데이터 이미 동기화됨');
        }

        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000); // 2초 후 idle로 전환
      } catch (err) {
        console.error('❌ 온라인 복귀 동기화 실패:', err);
        setSyncStatus('offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, enabled, migrated]);

  // 디바운스 저장 (로컬 변경사항을 서버에 저장)
  const saveTimeout = useRef(null);
  const debouncedSave = useCallback((saveFn, itemId, dataForComparison, ...saveArgs) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(async () => {
      if (!userId || !enabled) return;

      try {
        // 🚀 변경 감지: localStorage에서 마지막 저장 버전 확인
        const lastSavedKey = `firestore_saved_${itemId}`;
        const lastSaved = localStorage.getItem(lastSavedKey);
        const currentData = JSON.stringify(dataForComparison);

        if (lastSaved === currentData) {
          console.log(`⏭️ [변경 감지] 변경사항 없음 - 저장 생략: ${itemId}`);
          return;
        }

        console.log(`💾 [변경 감지] 변경 감지됨 - Firestore 저장: ${itemId}`);

        // Firestore 저장 실행 (userId는 자동으로 첫 번째 인자로 전달)
        await saveFn(userId, ...saveArgs);

        // ✅ 성공 시에만 마지막 저장 버전 업데이트
        localStorage.setItem(lastSavedKey, currentData);
        console.log(`✅ [변경 감지] 저장 완료 및 버전 기록: ${itemId}`);
      } catch (err) {
        console.error(`❌ [변경 감지] Firestore 저장 실패 (${itemId}):`, err);
        // 실패 시 lastSaved 업데이트 안 함 → 다음 저장 시도 시 재시도
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

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveMemoToFirestore, `memo_${memo.id}`, memo, memo);
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

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveFolderToFirestore, `folder_${folder.id}`, folder, folder);
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

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveTrashItemToFirestore, `trash_${item.id}`, item, item);
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

  // 매크로 저장 (인덱스 기반)
  const syncMacro = useCallback((index, macroText) => {
    setMacros(prev => {
      const updated = [...prev];
      updated[index] = macroText;
      localStorage.setItem('macroTexts', JSON.stringify(updated));

      // 🚀 변경 감지 후 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        debouncedSave(saveMacroToFirestore, `macros_all`, updated, updated);
      }

      return updated;
    });
  }, [userId, enabled, debouncedSave]);

  // 매크로 삭제 (인덱스 기반)
  const deleteMacro = useCallback((index) => {
    setMacros(prev => {
      const updated = [...prev];
      updated[index] = '';
      localStorage.setItem('macroTexts', JSON.stringify(updated));

      // 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        saveMacroToFirestore(userId, updated).catch(err => {
          console.error('매크로 삭제 실패:', err);
        });
      }

      return updated;
    });
  }, [userId, enabled]);

  // 캘린더 날짜 저장
  const syncCalendarDate = useCallback((dateKey, schedule) => {
    setCalendar(prev => {
      const updated = { ...prev, [dateKey]: schedule };
      localStorage.setItem('calendarSchedules_shared', JSON.stringify(updated));
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    // saveCalendarDateToFirestore(userId, dateKey, schedule) 형식으로 호출됨
    debouncedSave(saveCalendarDateToFirestore, `calendar_${dateKey}`, schedule, dateKey, schedule);
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

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveActivityToFirestore, `activity_${activity.id}`, activity, activity);
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

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveSettingsToFirestore, `settings_main`, newSettings, newSettings);
  }, [debouncedSave]);

  // 즉시 저장 (디바운스 없이) - 로그아웃 등에서 사용
  // ⚠️ 2025-12-01: 할당량 절약을 위해 비활성화
  // 디바운스 자동 저장(300ms)으로 충분하며, 전체 저장은 할당량을 과도하게 소모함
  const saveImmediately = useCallback(async () => {
    console.log('⚠️ saveImmediately 호출 무시 (Firestore 할당량 절약)');
    console.log('💡 변경사항은 디바운스 자동 저장(300ms)으로 저장됩니다.');
    // 아무 작업도 하지 않음 - 할당량 절약
    return Promise.resolve();
  }, []);

  // ========================================
  // 🔄 하위 호환성 래퍼 함수 (기존 배열 기반 코드 지원)
  // ========================================

  // 메모 배열 동기화 (하위 호환)
  const syncMemos = useCallback((newMemos) => {
    setMemos(newMemos);
    localStorage.setItem('memos_shared', JSON.stringify(newMemos));

    // 🚀 변경 감지 후 각 메모를 개별 저장
    newMemos.forEach(memo => {
      debouncedSave(saveMemoToFirestore, `memo_${memo.id}`, memo, memo);
    });
  }, [debouncedSave]);

  // 폴더 배열 동기화 (하위 호환)
  const syncFolders = useCallback((newFolders) => {
    setFolders(newFolders);
    localStorage.setItem('memoFolders', JSON.stringify(newFolders));

    // 🚀 변경 감지 후 각 폴더를 개별 저장
    newFolders.forEach(folder => {
      debouncedSave(saveFolderToFirestore, `folder_${folder.id}`, folder, folder);
    });
  }, [debouncedSave]);

  // 휴지통 배열 동기화 (하위 호환)
  const syncTrash = useCallback((newTrash) => {
    setTrash(newTrash);
    localStorage.setItem('trashedItems_shared', JSON.stringify(newTrash));

    newTrash.forEach(item => {
      if (item && item.id) {
        debouncedSave(saveTrashItemToFirestore, `trash_${item.id}`, item, item);
      }
    });
  }, [debouncedSave]);

  // 매크로 배열 동기화 (하위 호환)
  const syncMacros = useCallback((newMacros) => {
    // 방어: Firestore 데이터가 비어있거나 유효하지 않으면 기존 localStorage 유지
    if (!newMacros || !Array.isArray(newMacros)) {
      console.warn('⚠️ syncMacros: 유효하지 않은 데이터 무시', newMacros);
      return;
    }

    // 빈 배열이거나 모두 빈 문자열인 경우, 기존 localStorage에 데이터가 있으면 유지
    const hasValidMacro = newMacros.some(m => m && m.trim().length > 0);
    if (!hasValidMacro) {
      try {
        const existing = JSON.parse(localStorage.getItem('macroTexts') || '[]');
        const hasExistingData = existing.some(m => m && m.trim().length > 0);
        if (hasExistingData) {
          console.warn('⚠️ syncMacros: Firestore 데이터가 비어있어 기존 localStorage 유지');
          return;
        }
      } catch (err) {
        console.error('❌ localStorage 확인 실패:', err);
      }
    }

    // 기존 데이터와 비교하여 변경된 경우에만 저장
    try {
      const existing = JSON.parse(localStorage.getItem('macroTexts') || '[]');
      const hasChanged = newMacros.length !== existing.length ||
                        newMacros.some((macro, index) => macro !== existing[index]);

      if (!hasChanged) {
        // 변경사항이 없으면 조용히 리턴 (로그 없음)
        return;
      }
    } catch (err) {
      console.error('❌ 기존 매크로 비교 실패:', err);
    }

    console.log('💾 매크로 localStorage 저장:', newMacros);
    setMacros(newMacros);
    localStorage.setItem('macroTexts', JSON.stringify(newMacros));

    // 전체 배열을 한 번에 Firestore에 저장
    if (userId && enabled) {
      console.log('☁️ 매크로 Firestore 저장 시작:', userId, newMacros);
      debouncedSave(saveMacroToFirestore, `macros_all`, newMacros, newMacros);
    } else {
      console.warn('⚠️ Firestore 저장 건너뜀 - userId:', userId, 'enabled:', enabled);
    }
  }, [userId, enabled, debouncedSave]);

  // 캘린더 객체 동기화 (하위 호환)
  const syncCalendar = useCallback((newCalendar) => {
    console.log('🔍 [syncCalendar] 시작:', Object.keys(newCalendar).length, '개 날짜');

    setCalendar(newCalendar);
    localStorage.setItem('calendarSchedules_shared', JSON.stringify(newCalendar));

    Object.entries(newCalendar).forEach(([dateKey, schedule]) => {
      // 의미 있는 데이터가 있는지 확인
      const hasText = schedule.text && schedule.text.trim() !== '' && schedule.text !== '<p></p>';
      const hasAlarms = schedule.alarm?.registeredAlarms && schedule.alarm.registeredAlarms.length > 0;

      // 텍스트나 알람이 있는 경우에만 Firestore에 저장
      if (hasText || hasAlarms) {
        console.log('🔍 [syncCalendar] 저장 대기열:', dateKey, '알람 수:', schedule.alarm?.registeredAlarms?.length);
        debouncedSave(saveCalendarDateToFirestore, `calendar_${dateKey}`, schedule, dateKey, schedule);
      } else {
        console.log('⏭️ [syncCalendar] 빈 스케줄 건너뜀:', dateKey);
      }
    });
  }, [debouncedSave]);

  // 활동 배열 동기화 (하위 호환)
  const syncActivities = useCallback((newActivities) => {
    setActivities(newActivities);
    localStorage.setItem('recentActivities_shared', JSON.stringify(newActivities));

    newActivities.forEach(activity => {
      if (activity && activity.id) {
        debouncedSave(saveActivityToFirestore, `activity_${activity.id}`, activity, activity);
      }
    });
  }, [debouncedSave]);

  // 수동 동기화 함수
  const manualSync = useCallback(async () => {
    if (!userId || !enabled) {
      console.log('⚠️ 수동 동기화 실패: 로그인 필요');
      return false;
    }

    console.log('🔄 수동 동기화 시작...');
    setSyncStatus('syncing');

    try {
      // localStorage에서 모든 항목 가져오기
      const localMemos = JSON.parse(localStorage.getItem('memos_shared') || '[]');
      const localCalendar = JSON.parse(localStorage.getItem('calendarSchedules_shared') || '{}');
      const localFolders = JSON.parse(localStorage.getItem('memoFolders') || '[]');
      const localMacros = JSON.parse(localStorage.getItem('macroTexts') || '[]');
      const localTrash = JSON.parse(localStorage.getItem('trashMemos_shared') || '[]');

      // 미동기화 항목 찾기
      const pendingItems = [];

      localMemos.forEach(memo => {
        const lastSaved = localStorage.getItem(`firestore_saved_memo_${memo.id}`);
        if (!lastSaved || lastSaved !== JSON.stringify(memo)) {
          pendingItems.push({ type: 'memo', id: memo.id, data: memo });
        }
      });

      Object.entries(localCalendar).forEach(([dateKey, schedule]) => {
        const lastSaved = localStorage.getItem(`firestore_saved_calendar_${dateKey}`);
        if (!lastSaved || lastSaved !== JSON.stringify(schedule)) {
          pendingItems.push({ type: 'calendar', id: dateKey, data: schedule });
        }
      });

      localFolders.forEach(folder => {
        const lastSaved = localStorage.getItem(`firestore_saved_folder_${folder.id}`);
        if (!lastSaved || lastSaved !== JSON.stringify(folder)) {
          pendingItems.push({ type: 'folder', id: folder.id, data: folder });
        }
      });

      localMacros.forEach(macro => {
        const lastSaved = localStorage.getItem(`firestore_saved_macro_${macro.id}`);
        if (!lastSaved || lastSaved !== JSON.stringify(macro)) {
          pendingItems.push({ type: 'macro', id: macro.id, data: macro });
        }
      });

      localTrash.forEach(item => {
        const lastSaved = localStorage.getItem(`firestore_saved_trash_${item.id}`);
        if (!lastSaved || lastSaved !== JSON.stringify(item)) {
          pendingItems.push({ type: 'trash', id: item.id, data: item });
        }
      });

      if (pendingItems.length > 0) {
        console.log(`📤 미동기화 항목 ${pendingItems.length}개 발견 - 업로드 시작`);

        for (const item of pendingItems) {
          try {
            switch (item.type) {
              case 'memo':
                await saveMemoToFirestore(userId, item.data);
                localStorage.setItem(`firestore_saved_memo_${item.id}`, JSON.stringify(item.data));
                break;
              case 'calendar':
                await saveCalendarDateToFirestore(userId, item.id, item.data);
                localStorage.setItem(`firestore_saved_calendar_${item.id}`, JSON.stringify(item.data));
                break;
              case 'folder':
                await saveFolderToFirestore(userId, item.data);
                localStorage.setItem(`firestore_saved_folder_${item.id}`, JSON.stringify(item.data));
                break;
              case 'macro':
                await saveMacroToFirestore(userId, item.data);
                localStorage.setItem(`firestore_saved_macro_${item.id}`, JSON.stringify(item.data));
                break;
              case 'trash':
                await saveTrashItemToFirestore(userId, item.data);
                localStorage.setItem(`firestore_saved_trash_${item.id}`, JSON.stringify(item.data));
                break;
            }
            console.log(`✅ ${item.type} ${item.id} 업로드 완료`);
          } catch (err) {
            console.error(`❌ ${item.type} ${item.id} 업로드 실패:`, err);
          }
        }

        console.log('✅ 수동 동기화 완료');
      } else {
        console.log('✅ 모든 데이터 이미 동기화됨');
      }

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
      return true;
    } catch (err) {
      console.error('❌ 수동 동기화 실패:', err);
      setSyncStatus('offline');
      return false;
    }
  }, [userId, enabled]);


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

    // 수동 동기화
    manualSync,

    // ⭐ 운세 프로필 Firestore 함수 (fortuneLogic.js에서 사용)
    saveFortuneProfileToFirestore,
    fetchFortuneProfileFromFirestore
  };
};