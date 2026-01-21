/**
 * useFirestoreSync 이벤트 핸들러
 * - 페이지 가시성 변경 핸들러
 * - 온라인/오프라인 네트워크 상태 핸들러
 */

import { getUserData } from '../utils/userStorage';
import { getAccountLocalStorageWithTTL } from './useFirestoreSync.utils';
import {
  saveMemoToFirestore,
  saveCalendarDateToFirestore,
  saveFolderToFirestore,
  saveMacroToFirestore,
} from '../services/userDataService';

/**
 * 포그라운드 복귀 시 동기화 핸들러 생성
 */
export const createVisibilityChangeHandler = (userId, enabled, migrated, setSyncStatus) => {
  let lastVisibilityChange = Date.now();

  return async () => {
    // 앱이 포그라운드로 복귀 (백그라운드 → 포그라운드)
    if (!document.hidden && userId && enabled && migrated) {
      const now = Date.now();
      const timeSinceLastCheck = now - lastVisibilityChange;
      lastVisibilityChange = now;

      // ⚡ 최적화: 5초 이내 재진입은 무시 (과도한 동기화 방지)
      if (timeSinceLastCheck < 5000) {
        console.log('📱 포그라운드 복귀 무시 (5초 이내 재진입)');
        return;
      }

      console.log('📱 앱 포그라운드 복귀 - 미동기화 항목 체크');
      setSyncStatus('syncing');

      try {
        // ⚡ 최적화: Firestore 전체 조회 없이 localStorage만 확인
        const localMemos = getAccountLocalStorageWithTTL(userId, 'memos', false) || [];
        const localCalendar = getAccountLocalStorageWithTTL(userId, 'calendar', false) || {};

        // localStorage에서 저장 실패 마크가 있는 항목만 찾기
        const unsyncedMemos = Array.isArray(localMemos) ? localMemos.filter(localMemo => {
          // 방어 코드: 유효하지 않은 메모 스킵
          if (!localMemo || !localMemo.id) {
            console.warn('⚠️ 유효하지 않은 메모 발견 - 스킵:', localMemo);
            return false;
          }
          const lastSaved = localStorage.getItem(`firestore_saved_memo_${localMemo.id}`);
          return !lastSaved; // 한 번도 저장 안 된 것만
        }) : [];

        const unsyncedCalendar = Object.keys(localCalendar).filter(dateKey => {
          const lastSaved = localStorage.getItem(`firestore_saved_calendar_${dateKey}`);
          // 'DELETED' 마커가 있으면 제외 (삭제된 항목은 재업로드하지 않음)
          return !lastSaved || lastSaved === 'DELETED' ? false : true;
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
};

/**
 * 온라인 복귀 핸들러 생성
 */
export const createOnlineHandler = (userId, enabled, migrated, setSyncStatus) => {
  let onlineDebounceTimer = null;

  const handler = () => {
    if (!userId || !enabled || !migrated) return;

    // ⚡ 최적화: 3초 debounce (네트워크 불안정 시 중복 동기화 방지)
    if (onlineDebounceTimer) {
      clearTimeout(onlineDebounceTimer);
    }

    console.log('🌐 네트워크 온라인 감지 - 3초 후 동기화 시작');
    setSyncStatus('syncing');

    onlineDebounceTimer = setTimeout(async () => {
      console.log('🌐 네트워크 온라인 복귀 - 미동기화 항목 업로드 시작');

      try {
        // localStorage에서 모든 항목 가져오기 (TTL 기반)
        const localMemos = getAccountLocalStorageWithTTL(userId, 'memos', false) || [];
        const localCalendar = getAccountLocalStorageWithTTL(userId, 'calendar', false) || {};
        const localFolders = getAccountLocalStorageWithTTL(userId, 'folders', false) || [];
        const localMacros = getAccountLocalStorageWithTTL(userId, 'macros', false) || [];

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
          // 'DELETED' 마커가 있으면 제외 (삭제된 항목)
          if (lastSaved === 'DELETED') return;
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
    }, 3000); // 3초 debounce
  };

  // 타이머 정리를 위한 cleanup 함수 반환
  handler.cleanup = () => {
    if (onlineDebounceTimer) {
      clearTimeout(onlineDebounceTimer);
    }
  };

  return handler;
};

/**
 * 오프라인 핸들러 생성
 */
export const createOfflineHandler = (setSyncStatus, onlineHandler) => {
  return () => {
    console.log('📴 네트워크 오프라인 감지');
    setSyncStatus('offline');
    // 온라인 복귀 대기 중인 타이머가 있으면 취소
    if (onlineHandler?.cleanup) {
      onlineHandler.cleanup();
    }
  };
};

/**
 * 수동 동기화 함수 생성
 */
export const createManualSync = (userId, enabled, setSyncStatus) => {
  return async () => {
    if (!userId || !enabled) {
      console.log('⚠️ 수동 동기화 실패: 로그인 필요');
      return false;
    }

    console.log('🔄 수동 동기화 시작...');
    setSyncStatus('syncing');

    try {
      // localStorage에서 모든 항목 가져오기 (TTL 기반)
      const localMemos = getAccountLocalStorageWithTTL(userId, 'memos', false) || [];
      const localCalendar = getAccountLocalStorageWithTTL(userId, 'calendar', false) || {};
      const localFolders = getAccountLocalStorageWithTTL(userId, 'folders', false) || [];
      const localMacros = getAccountLocalStorageWithTTL(userId, 'macros', false) || [];
      const localTrash = getAccountLocalStorageWithTTL(userId, 'trash', false) || [];

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
        // 'DELETED' 마커가 있으면 제외 (삭제된 항목)
        if (lastSaved === 'DELETED') return;
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
                const { saveTrashItemToFirestore } = await import('../services/userDataService');
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
  };
};
