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
import { diagnosticLog } from '../utils/diagnosticLogger';

import {
  setAccountLocalStorage,
  setAccountLocalStorageWithTTL,
  getAccountLocalStorageWithTTL,
  markLocalStorageSynced,
  removeIfSynced
} from './useFirestoreSync.utils';

/**
 * 디바운스 저장 함수 생성 (TTL 및 synced 플래그 포함)
 * 반환값: { save, flush } - flush는 대기 중인 저장을 즉시 실행
 */
export const createDebouncedSave = (userId, enabled) => {
  const saveTimeout = { current: null };
  const pendingSaves = { current: [] }; // 대기 중인 저장 작업 추적

  const executeSave = async (saveFn, itemId, dataForComparison, dataType, ...saveArgs) => {
    console.log(`🔍 [executeSave] 호출됨: itemId=${itemId}, dataType=${dataType}, userId=${userId}, enabled=${enabled}`);

    if (!userId || !enabled) {
      console.warn(`⚠️ [executeSave] 저장 건너뜀: userId=${userId}, enabled=${enabled}`);
      return;
    }

    try {
      // 🚀 변경 감지: localStorage에서 마지막 저장 버전 확인
      const lastSavedKey = `firestore_saved_${itemId}`;
      const lastSaved = localStorage.getItem(lastSavedKey);
      const currentData = JSON.stringify(dataForComparison);

      if (lastSaved === currentData) {
        console.log(`⏭️ [변경 감지] 변경사항 없음 - 저장 생략: ${itemId}`);
        return;
      }

      console.log(`💾 [변경 감지] 변경 감지됨 - Firestore 저장 시작: ${itemId}`);
      console.log(`📊 [변경 감지] 데이터 크기: ${currentData.length} bytes`);

      // Firestore 저장 실행 (userId는 자동으로 첫 번째 인자로 전달)
      const saveStartTime = Date.now();
      await saveFn(userId, ...saveArgs);
      const saveDuration = Date.now() - saveStartTime;

      console.log(`✅ [변경 감지] Firestore 저장 성공: ${itemId} (${saveDuration}ms)`);

      // 🔍 진단: 저장 성공 로그
      diagnosticLog('success', `저장 완료: ${dataType || itemId}`, {
        userId: userId.substring(0, 8) + '...',
        itemId: itemId.substring(0, 20) + '...',
        dataSize: currentData.length,
        duration: saveDuration + 'ms'
      });

      // ✅ 성공 시에만 마지막 저장 버전 업데이트
      localStorage.setItem(lastSavedKey, currentData);

      // ✅ synced 플래그를 true로 업데이트
      if (dataType) {
        markLocalStorageSynced(userId, dataType, true);
        console.log(`✅ [변경 감지] 저장 완료 및 synced=true: ${itemId}`);
      } else {
        console.log(`✅ [변경 감지] 저장 완료 및 버전 기록: ${itemId}`);
      }
    } catch (err) {
      console.error(`❌ [변경 감지] Firestore 저장 실패 (${itemId}):`, err);
      console.error(`❌ [변경 감지] 에러 스택:`, err.stack);

      // 🔍 진단: 저장 실패 로그
      diagnosticLog('error', `저장 실패: ${dataType || itemId}`, {
        userId: userId ? userId.substring(0, 8) + '...' : 'N/A',
        error: err.message,
        code: err.code
      });

      // 실패 시 lastSaved 업데이트 안 함 → 다음 저장 시도 시 재시도
    }
  };

  const save = (saveFn, itemId, dataForComparison, dataType, ...saveArgs) => {
    console.log(`📝 [디바운스 저장] 예약됨: itemId=${itemId}, dataType=${dataType}`);

    if (saveTimeout.current) {
      console.log(`⏱️ [디바운스 저장] 기존 타이머 클리어: ${itemId}`);
      clearTimeout(saveTimeout.current);
    }

    // 대기 중인 작업 저장
    pendingSaves.current = [saveFn, itemId, dataForComparison, dataType, ...saveArgs];
    console.log(`📦 [디바운스 저장] 대기 큐에 추가: ${itemId} (300ms 대기)`);

    saveTimeout.current = setTimeout(async () => {
      console.log(`⏰ [디바운스 저장] 타이머 만료 - 실행 시작: ${itemId}`);
      await executeSave(saveFn, itemId, dataForComparison, dataType, ...saveArgs);
      pendingSaves.current = []; // 실행 후 클리어
      console.log(`🏁 [디바운스 저장] 완료 및 큐 클리어: ${itemId}`);
    }, 300); // 300ms 디바운스 (데이터 손실 방지 + 할당량 절약)
  };

  // ⚡ saveImmediate: 디바운스 없이 즉시 저장 (알람 등록 등 중요 작업용)
  const saveImmediate = async (saveFn, itemId, dataForComparison, dataType, ...saveArgs) => {
    console.log('⚡ [즉시 저장] 디바운스 건너뜀:', itemId);
    await executeSave(saveFn, itemId, dataForComparison, dataType, ...saveArgs);
  };

  // ✅ flush: 대기 중인 저장 즉시 실행 (beforeunload용)
  const flush = async () => {
    console.log(`🚨 [flush] 호출됨 - 대기 큐 확인 중...`);
    console.log(`🚨 [flush] saveTimeout 상태:`, saveTimeout.current ? '타이머 존재' : '타이머 없음');
    console.log(`🚨 [flush] pendingSaves 길이:`, pendingSaves.current.length);

    if (saveTimeout.current) {
      console.log(`🚨 [flush] 타이머 클리어`);
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    if (pendingSaves.current.length > 0) {
      const [saveFn, itemId, dataForComparison, dataType, ...saveArgs] = pendingSaves.current;
      console.log(`🚨 [긴급 플러시] 대기 중인 저장 즉시 실행: itemId=${itemId}, dataType=${dataType}`);
      const flushStartTime = Date.now();
      await executeSave(saveFn, itemId, dataForComparison, dataType, ...saveArgs);
      const flushDuration = Date.now() - flushStartTime;
      pendingSaves.current = [];
      console.log(`✅ [긴급 플러시] 완료: ${itemId} (${flushDuration}ms)`);
    } else {
      console.log(`ℹ️ [flush] 대기 중인 저장 없음 - 건너뜀`);
    }
  };

  return { save, saveImmediate, flush };
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
      setAccountLocalStorageWithTTL(userId, 'memos', updated, { synced: false });
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장 (dataType='memos' 전달)
    debouncedSave.save(saveMemoToFirestore, `memo_${memo.id}`, memo, 'memos', memo);
  };
};

/**
 * 메모 삭제
 */
export const createDeleteMemo = (userId, enabled, setMemos) => {
  return (memoId) => {
    setMemos(prev => {
      const updated = prev.filter(m => m.id !== memoId);
      setAccountLocalStorageWithTTL(userId, 'memos', updated, { synced: false });
      return updated;
    });

    if (userId && enabled) {
      deleteMemoFromFirestore(userId, memoId)
        .then(() => {
          // Firestore 삭제 성공 시 synced=true 업데이트
          markLocalStorageSynced(userId, 'memos', true);
        })
        .catch(err => {
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
      setAccountLocalStorageWithTTL(userId, 'folders', updated, { synced: false });
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장 (dataType='folders' 전달)
    debouncedSave.save(saveFolderToFirestore, `folder_${folder.id}`, folder, 'folders', folder);
  };
};

/**
 * 폴더 삭제
 */
export const createDeleteFolder = (userId, enabled, setFolders) => {
  return (folderId) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      setAccountLocalStorageWithTTL(userId, 'folders', updated, { synced: false });
      return updated;
    });

    if (userId && enabled) {
      deleteFolderFromFirestore(userId, folderId)
        .then(() => {
          markLocalStorageSynced(userId, 'folders', true);
        })
        .catch(err => {
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
      setAccountLocalStorageWithTTL(userId, 'trash', updated, { synced: false });
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장 (dataType='trash' 전달)
    debouncedSave.save(saveTrashItemToFirestore, `trash_${item.id}`, item, 'trash', item);
  };
};

/**
 * 휴지통 항목 삭제
 */
export const createDeleteTrashItem = (userId, enabled, setTrash) => {
  return (itemId) => {
    setTrash(prev => {
      const updated = prev.filter(t => t.id !== itemId);
      setAccountLocalStorageWithTTL(userId, 'trash', updated, { synced: false });
      return updated;
    });

    if (userId && enabled) {
      deleteTrashItemFromFirestore(userId, itemId)
        .then(() => {
          markLocalStorageSynced(userId, 'trash', true);
        })
        .catch(err => {
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
      setAccountLocalStorageWithTTL(userId, 'macros', updated, { synced: false });

      // 🚀 변경 감지 후 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        debouncedSave.save(saveMacroToFirestore, `macros_all`, updated, 'macros', updated);
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
      setAccountLocalStorageWithTTL(userId, 'macros', updated, { synced: false });

      // 전체 배열을 Firestore에 저장
      if (userId && enabled) {
        saveMacroToFirestore(userId, updated)
          .then(() => {
            markLocalStorageSynced(userId, 'macros', true);
          })
          .catch(err => {
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
      // localStorage에도 즉시 반영 (오프라인 지원)
      setAccountLocalStorageWithTTL(userId, 'calendar', updated, { synced: false });
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장 (dataType='calendar' 전달)
    debouncedSave.save(saveCalendarDateToFirestore, `calendar_${dateKey}`, schedule, 'calendar', dateKey, schedule);
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
      // ⚠️ CRITICAL: localStorage에도 즉시 삭제 반영 (데이터 부활 방지)
      setAccountLocalStorageWithTTL(userId, 'calendar', updated, { synced: false });
      return updated;
    });

    if (userId && enabled) {
      deleteCalendarDateFromFirestore(userId, dateKey)
        .then(() => {
          // Firestore 삭제 성공 시 마커도 업데이트
          localStorage.setItem(`firestore_saved_calendar_${dateKey}`, 'DELETED');
          console.log(`✅ 캘린더 ${dateKey} 삭제 완료`);
        })
        .catch(err => {
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
      setAccountLocalStorageWithTTL(userId, 'activities', updated, { synced: false });
      return updated;
    });

    // 🚀 변경 감지 후 서버에 저장 (dataType='activities' 전달)
    debouncedSave.save(saveActivityToFirestore, `activity_${activity.id}`, activity, 'activities', activity);
  };
};

/**
 * 활동 삭제
 */
export const createDeleteActivity = (userId, enabled, setActivities) => {
  return (activityId) => {
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== activityId);
      setAccountLocalStorageWithTTL(userId, 'activities', updated, { synced: false });
      return updated;
    });

    if (userId && enabled) {
      deleteActivityFromFirestore(userId, activityId)
        .then(() => {
          markLocalStorageSynced(userId, 'activities', true);
        })
        .catch(err => {
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
    debouncedSave.save(saveSettingsToFirestore, `settings_main`, newSettings, newSettings);
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
    setAccountLocalStorageWithTTL(userId, 'memos', validMemos, { synced: false });

    // 🚀 변경 감지 후 각 메모를 개별 저장 (dataType='memos' 전달)
    validMemos.forEach(memo => {
      debouncedSave.save(saveMemoToFirestore, `memo_${memo.id}`, memo, 'memos', memo);
    });
  };
};

/**
 * 폴더 배열 동기화 (하위 호환)
 */
export const createSyncFolders = (userId, setFolders, debouncedSave) => {
  return (newFolders) => {
    setFolders(newFolders);
    setAccountLocalStorageWithTTL(userId, 'folders', newFolders, { synced: false });

    // 🚀 변경 감지 후 각 폴더를 개별 저장 (dataType='folders' 전달)
    newFolders.forEach(folder => {
      debouncedSave.save(saveFolderToFirestore, `folder_${folder.id}`, folder, 'folders', folder);
    });
  };
};

/**
 * 휴지통 배열 동기화 (하위 호환)
 */
export const createSyncTrash = (userId, setTrash, debouncedSave) => {
  return (newTrash) => {
    setTrash(newTrash);
    setAccountLocalStorageWithTTL(userId, 'trash', newTrash, { synced: false });

    newTrash.forEach(item => {
      if (item && item.id) {
        debouncedSave.save(saveTrashItemToFirestore, `trash_${item.id}`, item, 'trash', item);
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
        const existingData = getAccountLocalStorageWithTTL(userId, 'macros', false);
        const existing = Array.isArray(existingData) ? existingData : [];
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
      const existingData = getAccountLocalStorageWithTTL(userId, 'macros', false);
      const existing = Array.isArray(existingData) ? existingData : [];
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
    setAccountLocalStorageWithTTL(userId, 'macros', newMacros, { synced: false });

    // 전체 배열을 한 번에 Firestore에 저장 (dataType='macros' 전달)
    if (userId && enabled) {
      console.log('☁️ 매크로 Firestore 저장 시작:', userId, newMacros);
      debouncedSave.save(saveMacroToFirestore, `macros_all`, newMacros, 'macros', newMacros);
    } else {
      console.warn('⚠️ Firestore 저장 건너뜀 - userId:', userId, 'enabled:', enabled);
    }
  };
};

/**
 * 캘린더 객체 동기화 (하위 호환)
 */
export const createSyncCalendar = (userId, setCalendar, debouncedSave) => {
  return (newCalendarOrUpdater) => {
    // ⚠️ [중요] 함수형 업데이트 지원
    // Calendar 컴포넌트에서 setSchedules(prev => {...}) 형태로 호출할 수 있음
    let resolvedCalendar;

    setCalendar(prev => {
      // 함수가 전달되면 이전 값으로 실행
      resolvedCalendar = typeof newCalendarOrUpdater === 'function'
        ? newCalendarOrUpdater(prev)
        : newCalendarOrUpdater;

      console.log('🔍 [syncCalendar] 시작:', Object.keys(resolvedCalendar).length, '개 날짜');

      // localStorage에 전체 캘린더 즉시 캐싱 (오프라인 지원, synced: false)
      setAccountLocalStorageWithTTL(userId, 'calendar', resolvedCalendar, { synced: false });

      return resolvedCalendar;
    });

    Object.entries(resolvedCalendar).forEach(([dateKey, schedule]) => {
      // 의미 있는 데이터가 있는지 확인
      const hasText = schedule.text && schedule.text.trim() !== '' && schedule.text !== '<p></p>';
      const hasAlarms = schedule.alarm?.registeredAlarms && schedule.alarm.registeredAlarms.length > 0;

      // 텍스트나 알람이 있는 경우에만 Firestore에 저장 (dataType='calendar' 전달)
      if (hasText || hasAlarms) {
        console.log('🔍 [syncCalendar] 저장 대기열:', dateKey, '알람 수:', schedule.alarm?.registeredAlarms?.length);
        // ✅ 마커는 debouncedSave 내부에서 Firestore 저장 성공 후에만 업데이트됨
        debouncedSave.save(saveCalendarDateToFirestore, `calendar_${dateKey}`, schedule, 'calendar', dateKey, schedule);
      } else {
        // 빈 스케줄인 경우 Firestore에서 삭제
        console.log('🗑️ [syncCalendar] 빈 스케줄 삭제:', dateKey);
        if (userId) {
          deleteCalendarDateFromFirestore(userId, dateKey)
            .then(() => {
              localStorage.setItem(`firestore_saved_calendar_${dateKey}`, 'DELETED');
              console.log(`✅ Firestore에서 ${dateKey} 삭제 완료`);
            })
            .catch(err => {
              console.error(`❌ Firestore 삭제 실패 (${dateKey}):`, err);
            });
        }
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
    setAccountLocalStorageWithTTL(userId, 'activities', newActivities, { synced: false });

    newActivities.forEach(activity => {
      if (activity && activity.id) {
        debouncedSave.save(saveActivityToFirestore, `activity_${activity.id}`, activity, 'activities', activity);
      }
    });
  };
};
