/**
 * useFirestoreSync 데이터 병합 로직
 * - Evernote 방식 다중 기기 동기화
 * - 충돌 해결 (타임스탬프 비교)
 */

/**
 * 타임스탬프를 밀리초로 변환
 */
const getTimestamp = (item) => {
  if (!item) return 0;
  const ts = item.updatedAt || item.timestamp;
  return ts?.toMillis ? ts.toMillis() : (ts || 0);
};

/**
 * 개별 아이템 병합 (메모, 폴더, 휴지통, 활동)
 * @param {Object} firestoreItem - Firestore에서 가져온 아이템
 * @param {Object} localItem - localStorage에 있는 아이템
 * @param {string} itemType - 아이템 타입 (memo, folder, trash, activity)
 * @returns {Object} 병합된 아이템
 */
export const mergeItem = (firestoreItem, localItem, itemType) => {
  if (!localItem) return firestoreItem; // Firestore만 있음

  const lastSavedKey = `firestore_saved_${itemType}_${firestoreItem.id}`;
  const lastSaved = localStorage.getItem(lastSavedKey);
  const localData = JSON.stringify(localItem);

  if (lastSaved === localData) {
    // ✅ 로컬 = 마지막 저장 버전 → 이 기기에서 수정 안 함 → Firestore 신뢰
    return firestoreItem;
  } else {
    // ⚠️ 로컬 ≠ 마지막 저장 버전 → 타임스탬프 비교로 충돌 해결
    const firestoreTime = getTimestamp(firestoreItem);
    const lastSavedItem = lastSaved ? JSON.parse(lastSaved) : {};
    const lastSyncedTime = getTimestamp(lastSavedItem);
    const localTime = getTimestamp(localItem);

    // ✅ lastSaved가 없으면 로컬 타임스탬프 사용 (Firestore 저장 실패한 경우)
    const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

    if (firestoreTime > effectiveSyncedTime) {
      // Firestore가 더 최신 → 다른 기기에서 수정됨
      return firestoreItem;
    } else {
      // 로컬이 더 최신 또는 저장 실패 → 로컬 우선
      return localItem;
    }
  }
};

/**
 * 로컬에만 있는 아이템 처리
 * @param {Object} localItem - localStorage에만 있는 아이템
 * @param {string} itemType - 아이템 타입
 * @returns {Object|null} 추가할 아이템 (null이면 삭제된 것으로 간주)
 */
export const handleLocalOnlyItem = (localItem, itemType) => {
  const lastSavedKey = `firestore_saved_${itemType}_${localItem.id}`;
  const lastSaved = localStorage.getItem(lastSavedKey);

  if (!lastSaved) {
    // 한 번도 저장 안 됨 → 진짜 새 아이템
    return localItem;
  } else {
    // 저장 기록 있는데 Firestore에 없음 → 다른 기기에서 삭제됨
    localStorage.removeItem(lastSavedKey);
    return null;
  }
};

/**
 * 메모 배열 병합
 */
export const mergeMemos = (firestoreMemos, localMemos) => {
  const mergedMemos = firestoreMemos.map(firestoreMemo => {
    const localMemo = localMemos.find(m => m.id === firestoreMemo.id);
    return mergeItem(firestoreMemo, localMemo, 'memo');
  });

  // 로컬에만 있는 메모 처리
  const localOnlyMemos = localMemos.filter(localMemo =>
    !firestoreMemos.find(m => m.id === localMemo.id)
  );

  localOnlyMemos.forEach(localMemo => {
    const result = handleLocalOnlyItem(localMemo, 'memo');
    if (result) mergedMemos.push(result);
  });

  return mergedMemos;
};

/**
 * 폴더 배열 병합
 */
export const mergeFolders = (firestoreFolders, localFolders) => {
  const mergedFolders = firestoreFolders.map(firestoreFolder => {
    const localFolder = localFolders.find(f => f.id === firestoreFolder.id);
    return mergeItem(firestoreFolder, localFolder, 'folder');
  });

  // 로컬에만 있는 폴더 처리
  const localOnlyFolders = localFolders.filter(localFolder =>
    !firestoreFolders.find(f => f.id === localFolder.id)
  );

  localOnlyFolders.forEach(localFolder => {
    const result = handleLocalOnlyItem(localFolder, 'folder');
    if (result) mergedFolders.push(result);
  });

  return mergedFolders;
};

/**
 * 휴지통 배열 병합
 */
export const mergeTrash = (firestoreTrash, localTrash) => {
  const mergedTrash = (firestoreTrash || []).map(firestoreItem => {
    const localItem = localTrash.find(t => t.id === firestoreItem.id);
    return mergeItem(firestoreItem, localItem, 'trash');
  });

  // 로컬에만 있는 휴지통 아이템 추가
  const localOnlyTrash = localTrash.filter(localItem =>
    !firestoreTrash?.find(t => t.id === localItem.id)
  );

  localOnlyTrash.forEach(item => {
    if (item && item.id) {
      mergedTrash.push(item);
    }
  });

  return mergedTrash;
};

/**
 * 캘린더 병합 (날짜별 타임스탬프 비교)
 */
export const mergeCalendar = (firestoreCalendar, localCalendar) => {
  const mergedCalendar = { ...firestoreCalendar };

  const allDateKeys = new Set([
    ...Object.keys(firestoreCalendar || {}),
    ...Object.keys(localCalendar || {})
  ]);

  allDateKeys.forEach(dateKey => {
    const firestoreSchedule = firestoreCalendar?.[dateKey];
    const localSchedule = localCalendar?.[dateKey];

    if (!firestoreSchedule && localSchedule) {
      // Firestore에만 없음 → 로컬이 새로 생성
      mergedCalendar[dateKey] = localSchedule;
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
        const firestoreTime = getTimestamp(firestoreSchedule);
        const localTime = getTimestamp(localSchedule);

        if (firestoreTime > localTime) {
          mergedCalendar[dateKey] = firestoreSchedule;
        } else {
          mergedCalendar[dateKey] = localSchedule;
        }
      }
    }
  });

  return mergedCalendar;
};

/**
 * 활동 배열 병합
 */
export const mergeActivities = (firestoreActivities, localActivities) => {
  const mergedActivities = (firestoreActivities || []).map(firestoreActivity => {
    const localActivity = localActivities.find(a => a.id === firestoreActivity.id);
    return mergeItem(firestoreActivity, localActivity, 'activity');
  });

  // 로컬에만 있는 활동 추가
  const localOnlyActivities = localActivities.filter(localActivity =>
    !firestoreActivities?.find(a => a.id === localActivity.id)
  );

  localOnlyActivities.forEach(activity => {
    if (activity && activity.id) {
      mergedActivities.push(activity);
    }
  });

  return mergedActivities;
};

/**
 * 매크로 병합 (플래그만 사용, 타임스탬프 없음)
 */
export const mergeMacros = (firestoreMacros, localMacros) => {
  const useLocalMacros = localStorage.getItem('firestore_saved_macros_all') !== JSON.stringify(localMacros);
  const mergedMacros = useLocalMacros ? localMacros : (firestoreMacros || []);

  if (useLocalMacros) {
    console.log('📝 매크로: 로컬 우선');
  }

  return mergedMacros;
};

/**
 * 설정 병합
 */
export const mergeSettings = (firestoreSettings, localSettings, saveSettingsToFirestore, userId) => {
  if (!firestoreSettings) return localSettings;

  const lastSavedKey = 'firestore_saved_settings_main';
  const lastSaved = localStorage.getItem(lastSavedKey);
  const localData = JSON.stringify(localSettings);

  if (lastSaved === localData) {
    // ✅ 로컬 = 마지막 저장 버전 → Firestore 신뢰
    return firestoreSettings;
  } else {
    // ⚠️ 로컬 ≠ 마지막 저장 버전 → 타임스탬프 비교
    const firestoreTime = getTimestamp(firestoreSettings);
    const lastSavedSettings = lastSaved ? JSON.parse(lastSaved) : {};
    const lastSyncedTime = getTimestamp(lastSavedSettings);
    const localTime = getTimestamp(localSettings);
    const effectiveSyncedTime = lastSaved ? lastSyncedTime : localTime;

    if (firestoreTime > effectiveSyncedTime) {
      return firestoreSettings;
    } else {
      saveSettingsToFirestore(userId, localSettings).catch(() => {});
      return localSettings;
    }
  }
};
