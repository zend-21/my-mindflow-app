/**
 * useFirestoreSync 동기화 작업
 * - 개별 아이템 동기화 함수
 * - 배열 기반 동기화 함수 (하위 호환)
 */

import {
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
  deleteCalendarDateFromFirestore,
  deleteActivityFromFirestore,
} from '../services/userDataService';

import { setAccountLocalStorage } from './useFirestoreSync.utils';
import { getUserData } from '../utils/userStorage';

/**
 * 디바운스 저장 함수 생성
 */
export const createDebouncedSave = (userId, enabled) => {
  const saveTimeout = { current: null };

  return (saveFn, itemId, dataForComparison, ...saveArgs) => {
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
  };
};

/**
 * 개별 메모 동기화
 */
export const createSyncMemo = (userId, setMemos, debouncedSave) => {
  return (memo) => {
    // 낙관적 UI 업데이트
    setMemos(prev => {
      const exists = prev.find(m => m.id === memo.id);
      const updated = exists ? prev.map(m => m.id === memo.id ? memo : m) : [...prev, memo];
      setAccountLocalStorage(userId, 'memos', updated);
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveMemoToFirestore, `memo_${memo.id}`, memo, memo);
  };
};

/**
 * 메모 삭제
 */
export const createDeleteMemo = (userId, enabled, setMemos) => {
  return (memoId) => {
    setMemos(prev => {
      const updated = prev.filter(m => m.id !== memoId);
      setAccountLocalStorage(userId, 'memos', updated);
      return updated;
    });

    if (userId && enabled) {
      deleteMemoFromFirestore(userId, memoId).catch(err => {
        console.error('메모 삭제 실패:', err);
      });
    }
  };
};

/**
 * 개별 폴더 동기화
 */
export const createSyncFolder = (userId, setFolders, debouncedSave) => {
  return (folder) => {
    setFolders(prev => {
      const exists = prev.find(f => f.id === folder.id);
      const updated = exists ? prev.map(f => f.id === folder.id ? folder : f) : [...prev, folder];
      setAccountLocalStorage(userId, 'folders', updated);
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveFolderToFirestore, `folder_${folder.id}`, folder, folder);
  };
};

/**
 * 폴더 삭제
 */
export const createDeleteFolder = (userId, enabled, setFolders) => {
  return (folderId) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      setAccountLocalStorage(userId, 'folders', updated);
      return updated;
    });

    if (userId && enabled) {
      deleteFolderFromFirestore(userId, folderId).catch(err => {
        console.error('폴더 삭제 실패:', err);
      });
    }
  };
};

/**
 * 휴지통 항목 동기화
 */
export const createSyncTrashItem = (userId, setTrash, debouncedSave) => {
  return (item) => {
    setTrash(prev => {
      const exists = prev.find(t => t.id === item.id);
      const updated = exists ? prev.map(t => t.id === item.id ? item : t) : [...prev, item];
      setAccountLocalStorage(userId, 'trash', updated);
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveTrashItemToFirestore, `trash_${item.id}`, item, item);
  };
};

/**
 * 휴지통 항목 삭제
 */
export const createDeleteTrashItem = (userId, enabled, setTrash) => {
  return (itemId) => {
    setTrash(prev => {
      const updated = prev.filter(t => t.id !== itemId);
      setAccountLocalStorage(userId, 'trash', updated);
      return updated;
    });

    if (userId && enabled) {
      deleteTrashItemFromFirestore(userId, itemId).catch(err => {
        console.error('휴지통 항목 삭제 실패:', err);
      });
    }
  };
};

/**
 * 매크로 동기화
 */
export const createSyncMacro = (userId, enabled, setMacros, debouncedSave) => {
  return (index, macroText) => {
    setMacros(prev => {
      const updated = [...prev];
      updated[index] = macroText;
      setAccountLocalStorage(userId, 'macros', updated);

      // 🚀 변경 감지 후 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        debouncedSave(saveMacroToFirestore, `macros_all`, updated, updated);
      }

      return updated;
    });
  };
};

/**
 * 매크로 삭제
 */
export const createDeleteMacro = (userId, enabled, setMacros) => {
  return (index) => {
    setMacros(prev => {
      const updated = [...prev];
      updated[index] = '';
      setAccountLocalStorage(userId, 'macros', updated);

      // 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        saveMacroToFirestore(userId, updated).catch(err => {
          console.error('매크로 삭제 실패:', err);
        });
      }

      return updated;
    });
  };
};

/**
 * 캘린더 날짜 동기화
 */
export const createSyncCalendarDate = (userId, setCalendar, debouncedSave) => {
  return (dateKey, schedule) => {
    setCalendar(prev => {
      const updated = { ...prev, [dateKey]: schedule };
      setAccountLocalStorage(userId, 'calendar', updated);
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveCalendarDateToFirestore, `calendar_${dateKey}`, schedule, dateKey, schedule);
  };
};

/**
 * 캘린더 날짜 삭제
 */
export const createDeleteCalendarDate = (userId, enabled, setCalendar) => {
  return (dateKey) => {
    setCalendar(prev => {
      const updated = { ...prev };
      delete updated[dateKey];
      setAccountLocalStorage(userId, 'calendar', updated);
      return updated;
    });

    if (userId && enabled) {
      deleteCalendarDateFromFirestore(userId, dateKey).catch(err => {
        console.error('캘린더 삭제 실패:', err);
      });
    }
  };
};

/**
 * 활동 동기화
 */
export const createSyncActivity = (userId, setActivities, debouncedSave) => {
  return (activity) => {
    setActivities(prev => {
      const exists = prev.find(a => a.id === activity.id);
      const updated = exists ? prev.map(a => a.id === activity.id ? activity : a) : [...prev, activity];
      setAccountLocalStorage(userId, 'activities', updated);
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveActivityToFirestore, `activity_${activity.id}`, activity, activity);
  };
};

/**
 * 활동 삭제
 */
export const createDeleteActivity = (userId, enabled, setActivities) => {
  return (activityId) => {
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== activityId);
      setAccountLocalStorage(userId, 'activities', updated);
      return updated;
    });

    if (userId && enabled) {
      deleteActivityFromFirestore(userId, activityId).catch(err => {
        console.error('활동 삭제 실패:', err);
      });
    }
  };
};

/**
 * 설정 동기화
 */
export const createSyncSettings = (setSettings, debouncedSave) => {
  return (newSettings) => {
    setSettings(newSettings);

    if (newSettings.widgets) localStorage.setItem('widgets_shared', JSON.stringify(newSettings.widgets));
    if (newSettings.displayCount) localStorage.setItem('displayCount_shared', JSON.stringify(newSettings.displayCount));
    if (newSettings.nickname) localStorage.setItem('userNickname', newSettings.nickname);
    if (newSettings.profileImageType) localStorage.setItem('profileImageType', newSettings.profileImageType);
    if (newSettings.selectedAvatarId) localStorage.setItem('selectedAvatarId', newSettings.selectedAvatarId);
    if (newSettings.avatarBgColor) localStorage.setItem('avatarBgColor', newSettings.avatarBgColor);

    // 🚀 변경 감지 후 서버에 저장
    debouncedSave(saveSettingsToFirestore, `settings_main`, newSettings, newSettings);
  };
};

// ========================================
// 🔄 하위 호환성 래퍼 함수 (기존 배열 기반 코드 지원)
// ========================================

/**
 * 메모 배열 동기화 (하위 호환)
 */
export const createSyncMemos = (userId, setMemos, debouncedSave, getMemosRef) => {
  return (newMemosOrUpdater) => {
    // 함수형 업데이트 지원: 함수가 전달되면 현재 memos를 전달
    let newMemos;
    if (typeof newMemosOrUpdater === 'function') {
      const currentMemos = getMemosRef ? getMemosRef() : [];
      newMemos = newMemosOrUpdater(currentMemos);
    } else {
      newMemos = newMemosOrUpdater;
    }

    // 배열이 아니면 무시
    if (!Array.isArray(newMemos)) {
      console.warn('⚠️ syncMemos: 배열이 아닌 값 무시:', newMemos);
      return;
    }

    // 방어 코드: 유효하지 않은 메모 필터링
    const validMemos = newMemos.filter(memo => {
      if (!memo || !memo.id) {
        console.warn('⚠️ syncMemos: 유효하지 않은 메모 스킵:', memo);
        return false;
      }
      return true;
    });

    setMemos(validMemos);
    setAccountLocalStorage(userId, 'memos', validMemos);

    // 🚀 변경 감지 후 각 메모를 개별 저장
    validMemos.forEach(memo => {
      debouncedSave(saveMemoToFirestore, `memo_${memo.id}`, memo, memo);
    });
  };
};

/**
 * 폴더 배열 동기화 (하위 호환)
 */
export const createSyncFolders = (userId, setFolders, debouncedSave) => {
  return (newFolders) => {
    setFolders(newFolders);
    setAccountLocalStorage(userId, 'folders', newFolders);

    // 🚀 변경 감지 후 각 폴더를 개별 저장
    newFolders.forEach(folder => {
      debouncedSave(saveFolderToFirestore, `folder_${folder.id}`, folder, folder);
    });
  };
};

/**
 * 휴지통 배열 동기화 (하위 호환)
 */
export const createSyncTrash = (userId, setTrash, debouncedSave) => {
  return (newTrash) => {
    setTrash(newTrash);
    setAccountLocalStorage(userId, 'trash', newTrash);

    newTrash.forEach(item => {
      if (item && item.id) {
        debouncedSave(saveTrashItemToFirestore, `trash_${item.id}`, item, item);
      }
    });
  };
};

/**
 * 매크로 배열 동기화 (하위 호환)
 */
export const createSyncMacros = (userId, enabled, setMacros, debouncedSave) => {
  return (newMacros) => {
    // 방어: Firestore 데이터가 비어있거나 유효하지 않으면 기존 localStorage 유지
    if (!newMacros || !Array.isArray(newMacros)) {
      console.warn('⚠️ syncMacros: 유효하지 않은 데이터 무시', newMacros);
      return;
    }

    // 빈 배열이거나 모두 빈 문자열인 경우, 기존 localStorage에 데이터가 있으면 유지
    const hasValidMacro = newMacros.some(m => m && m.trim().length > 0);
    if (!hasValidMacro) {
      try {
        const existing = JSON.parse(getUserData(userId, 'macros') || '[]');
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
      const existing = JSON.parse(getUserData(userId, 'macros') || '[]');
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
    setAccountLocalStorage(userId, 'macros', newMacros);

    // 전체 배열을 한 번에 Firestore에 저장
    if (userId && enabled) {
      console.log('☁️ 매크로 Firestore 저장 시작:', userId, newMacros);
      debouncedSave(saveMacroToFirestore, `macros_all`, newMacros, newMacros);
    } else {
      console.warn('⚠️ Firestore 저장 건너뜀 - userId:', userId, 'enabled:', enabled);
    }
  };
};

/**
 * 캘린더 객체 동기화 (하위 호환)
 */
export const createSyncCalendar = (userId, setCalendar, debouncedSave) => {
  return (newCalendar) => {
    console.log('🔍 [syncCalendar] 시작:', Object.keys(newCalendar).length, '개 날짜');

    setCalendar(newCalendar);
    setAccountLocalStorage(userId, 'calendar', newCalendar);

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
  };
};

/**
 * 활동 배열 동기화 (하위 호환)
 */
export const createSyncActivities = (userId, setActivities, debouncedSave) => {
  return (newActivities) => {
    setActivities(newActivities);
    setAccountLocalStorage(userId, 'activities', newActivities);

    newActivities.forEach(activity => {
      if (activity && activity.id) {
        debouncedSave(saveActivityToFirestore, `activity_${activity.id}`, activity, activity);
      }
    });
  };
};
