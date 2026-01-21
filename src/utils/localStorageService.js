/**
 * Local Storage Service - TTL 기반 localStorage 관리
 *
 * 기능:
 * - TTL (Time To Live) 기반 자동 만료
 * - synced 플래그로 Firestore 동기화 상태 추적
 * - 용량 초과 시 자동 정리 (QuotaExceededError 처리)
 * - 하위 호환성 (기존 데이터 형식 지원)
 *
 * 데이터 구조:
 * {
 *   content: any,           // 실제 데이터
 *   savedAt: number,        // 저장 시간 (timestamp)
 *   expiresAt: number|null, // 만료 시간 (null = 만료 없음)
 *   synced: boolean         // Firestore 동기화 완료 여부
 * }
 */

// ==========================================
// TTL 정책 상수 (일 단위)
// ==========================================
export const TTL_POLICIES = {
  // 문서 데이터 - Firestore 동기화 완료 후 일정 기간 캐시 유지
  memos: 3,           // 3일 후 localStorage 캐시 삭제 (오프라인 지원 최소 기간)
  folders: 3,         // 3일 후 localStorage 캐시 삭제
  calendar: null,     // TTL 없음 (cleanupExpiredAlarms 함수로 알람별 개별 정리)

  // 보조 데이터 - TTL 기반 자동 정리
  trash: 7,           // 7일 후 localStorage 캐시 삭제
  activities: 7,      // 7일 후 localStorage 캐시 삭제 (1주일 패턴 분석)
  macros: 30,         // 30일 후 localStorage 캐시 삭제 (자주 쓰는 템플릿)

  // 프로필/설정 - 영구 보존
  profile: null,
  settings: null,
};

// ==========================================
// 내부 헬퍼 함수
// ==========================================

/**
 * 스토리지 키 생성
 */
const getStorageKey = (userId, key) => {
  if (!userId) return null;
  return `user_${userId}_${key}`;
};

/**
 * 데이터가 새 형식(TTL 포함)인지 확인
 */
const isNewFormat = (data) => {
  return data &&
         typeof data === 'object' &&
         'content' in data &&
         'savedAt' in data;
};

/**
 * TTL 일수를 밀리초로 변환
 */
const daysToMs = (days) => {
  if (!days) return null;
  return days * 24 * 60 * 60 * 1000;
};

/**
 * 가장 오래된 데이터 키 찾기 (용량 부족 시 정리용)
 */
const findOldestExpirableKey = (userId) => {
  const expirableTypes = ['activities', 'trash', 'macros'];
  let oldestKey = null;
  let oldestTime = Infinity;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(`user_${userId}_`)) continue;

    // 만료 가능한 타입인지 확인
    const isExpirable = expirableTypes.some(type => key.includes(`_${type}`));
    if (!isExpirable) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const data = JSON.parse(raw);
      const savedAt = isNewFormat(data) ? data.savedAt : 0;

      if (savedAt < oldestTime) {
        oldestTime = savedAt;
        oldestKey = key;
      }
    } catch (e) {
      // 파싱 실패 시 무시
    }
  }

  return oldestKey;
};

/**
 * 용량 부족 시 오래된 데이터 정리
 */
const handleQuotaExceeded = (userId) => {
  console.warn('⚠️ localStorage 용량 부족 - 오래된 데이터 정리 시작');

  let freedCount = 0;
  const maxCleanup = 10; // 최대 10개 항목 정리

  while (freedCount < maxCleanup) {
    const oldestKey = findOldestExpirableKey(userId);
    if (!oldestKey) break;

    localStorage.removeItem(oldestKey);
    freedCount++;
    console.log(`  🗑️ 삭제: ${oldestKey}`);
  }

  console.log(`✅ 용량 확보 완료: ${freedCount}개 항목 삭제`);
  return freedCount > 0;
};

// ==========================================
// 메인 Local Storage Service
// ==========================================

export const localStorageService = {
  /**
   * 데이터 저장 (TTL 및 synced 플래그 포함)
   * @param {string} userId - 사용자 ID
   * @param {string} key - 저장 키
   * @param {any} value - 저장할 데이터
   * @param {object} options - 옵션 { ttlDays, synced }
   */
  save: (userId, key, value, options = {}) => {
    if (!userId) {
      console.error('⚠️ localStorageService.save: userId가 없습니다');
      return false;
    }

    const storageKey = getStorageKey(userId, key);
    if (!storageKey) return false;

    // TTL 결정 (옵션 > 정책 > null)
    const ttlDays = options.ttlDays !== undefined
      ? options.ttlDays
      : (TTL_POLICIES[key] || null);

    const data = {
      content: value,
      savedAt: Date.now(),
      expiresAt: ttlDays ? Date.now() + daysToMs(ttlDays) : null,
      synced: options.synced !== undefined ? options.synced : false
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // 용량 부족 시 정리 후 재시도
        if (handleQuotaExceeded(userId)) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
            return true;
          } catch (retryError) {
            console.error('❌ 재시도 후에도 저장 실패:', retryError);
            return false;
          }
        }
      }
      console.error('❌ localStorage 저장 실패:', e);
      return false;
    }
  },

  /**
   * 데이터 조회 (TTL 체크 및 하위 호환)
   * @param {string} userId - 사용자 ID
   * @param {string} key - 조회 키
   * @param {boolean} includeMetadata - 메타데이터 포함 여부
   * @returns {any} 데이터 또는 null
   */
  get: (userId, key, includeMetadata = false) => {
    if (!userId) {
      console.error('⚠️ localStorageService.get: userId가 없습니다');
      return null;
    }

    const storageKey = getStorageKey(userId, key);
    if (!storageKey) return null;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw);

      // 하위 호환: 기존 형식 (content 없이 직접 데이터)
      if (!isNewFormat(data)) {
        // 기존 형식을 새 형식으로 마이그레이션
        const migratedData = {
          content: data,
          savedAt: Date.now(),
          expiresAt: null,
          synced: true // 기존 데이터는 동기화된 것으로 간주
        };

        // 마이그레이션 저장
        try {
          localStorage.setItem(storageKey, JSON.stringify(migratedData));
        } catch (e) {
          // 마이그레이션 실패해도 데이터는 반환
        }

        return includeMetadata ? migratedData : data;
      }

      // TTL 체크
      if (data.expiresAt && Date.now() > data.expiresAt) {
        // synced가 true면 삭제, false면 유지 (동기화 필요)
        if (data.synced) {
          localStorage.removeItem(storageKey);
          console.log(`🗑️ TTL 만료 삭제: ${key}`);
          return null;
        } else {
          console.warn(`⚠️ TTL 만료됐지만 미동기화 데이터 유지: ${key}`);
        }
      }

      return includeMetadata ? data : data.content;
    } catch (e) {
      console.error('❌ localStorage 조회 실패:', e);
      return null;
    }
  },

  /**
   * 데이터 삭제
   * @param {string} userId - 사용자 ID
   * @param {string} key - 삭제 키
   */
  remove: (userId, key) => {
    if (!userId) return false;

    const storageKey = getStorageKey(userId, key);
    if (!storageKey) return false;

    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (e) {
      console.error('❌ localStorage 삭제 실패:', e);
      return false;
    }
  },

  /**
   * synced 플래그 업데이트
   * @param {string} userId - 사용자 ID
   * @param {string} key - 키
   * @param {boolean} synced - 동기화 상태
   */
  markSynced: (userId, key, synced = true) => {
    if (!userId) return false;

    const storageKey = getStorageKey(userId, key);
    if (!storageKey) return false;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;

      const data = JSON.parse(raw);

      // 새 형식인 경우에만 업데이트
      if (isNewFormat(data)) {
        data.synced = synced;
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
      }

      return false;
    } catch (e) {
      console.error('❌ synced 플래그 업데이트 실패:', e);
      return false;
    }
  },

  /**
   * 만료된 데이터 일괄 정리 (앱 시작 시 호출)
   * @param {string} userId - 사용자 ID
   * @returns {number} 삭제된 항목 수
   */
  cleanupExpired: (userId) => {
    if (!userId) return 0;

    console.log('🧹 만료 데이터 정리 시작...');

    const prefix = `user_${userId}_`;
    let deletedCount = 0;
    const now = Date.now();

    // 삭제할 키 수집 (반복 중 삭제 방지)
    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const data = JSON.parse(raw);

        // 새 형식이고, 만료됐고, 동기화 완료된 경우만 삭제
        if (isNewFormat(data) &&
            data.expiresAt &&
            now > data.expiresAt &&
            data.synced) {
          keysToDelete.push(key);
        }
      } catch (e) {
        // 파싱 실패 시 무시
      }
    }

    // 수집된 키 삭제
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
      deletedCount++;
    });

    // 알람 특화 정리 (calendar 데이터 내부의 만료된 알람)
    deletedCount += localStorageService.cleanupExpiredAlarms(userId);

    // DELETED 마커 정리
    deletedCount += localStorageService.cleanupDeletedMarkers(userId);

    if (deletedCount > 0) {
      console.log(`✅ 만료 데이터 정리 완료: ${deletedCount}개 삭제`);
    } else {
      console.log('✅ 정리할 만료 데이터 없음');
    }

    return deletedCount;
  },

  /**
   * 알람 특화 정리 - calendar 데이터 내부의 만료된 알람 삭제
   *
   * 정리 규칙:
   * 1. 일반 알람: calculatedTime + 3일 후 삭제
   * 2. 반복/기념일 알람: 영구 보존
   * 3. 동기화 완료된(synced: true) 알람만 삭제
   *
   * @param {string} userId - 사용자 ID
   * @returns {number} 삭제된 알람 수
   */
  cleanupExpiredAlarms: (userId) => {
    if (!userId) return 0;

    const storageKey = getStorageKey(userId, 'calendar');
    if (!storageKey) return 0;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return 0;

      const data = JSON.parse(raw);
      const calendarData = isNewFormat(data) ? data.content : data;

      if (!calendarData || typeof calendarData !== 'object') return 0;

      const now = Date.now();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      let deletedAlarmCount = 0;
      let hasChanges = false;

      // 각 날짜의 알람 검사
      Object.keys(calendarData).forEach(dateKey => {
        const schedule = calendarData[dateKey];
        if (!schedule || !schedule.alarm || !schedule.alarm.registeredAlarms) return;

        const originalLength = schedule.alarm.registeredAlarms.length;

        // 만료되지 않은 알람만 남기기
        schedule.alarm.registeredAlarms = schedule.alarm.registeredAlarms.filter(alarm => {
          // 반복/기념일 알람은 영구 보존
          if (alarm.isAnniversary || alarm.anniversaryRepeat) {
            return true;
          }

          // 일반 알람: calculatedTime + 3일 체크
          const alarmTime = alarm.calculatedTime ? new Date(alarm.calculatedTime).getTime() : 0;
          const expirationTime = alarmTime + threeDaysInMs;

          // 만료되지 않았거나, 동기화되지 않은 알람은 유지
          if (now < expirationTime) {
            return true;
          }

          // synced 플래그 확인 (firestore_saved_calendar_{dateKey} 마커)
          const markerKey = `firestore_saved_calendar_${dateKey}`;
          const marker = localStorage.getItem(markerKey);
          const isSynced = marker && marker !== 'DELETED';

          if (!isSynced) {
            console.warn(`⚠️ 알람 만료됐지만 미동기화 - 유지: ${dateKey} - ${alarm.title}`);
            return true;
          }

          // 만료되고 동기화 완료된 알람은 삭제
          console.log(`🗑️ 만료 알람 삭제: ${dateKey} - ${alarm.title} (${new Date(alarmTime).toLocaleString()})`);
          deletedAlarmCount++;
          return false;
        });

        // 알람이 삭제되었으면 변경 사항 표시
        if (originalLength !== schedule.alarm.registeredAlarms.length) {
          hasChanges = true;

          // 모든 알람이 삭제되고 텍스트도 없으면 날짜 전체 삭제
          const hasText = schedule.text && schedule.text.trim() !== '' && schedule.text !== '<p></p>';
          if (schedule.alarm.registeredAlarms.length === 0 && !hasText) {
            delete calendarData[dateKey];
            console.log(`🗑️ 빈 스케줄 삭제: ${dateKey}`);
          }
        }
      });

      // 변경 사항이 있으면 저장
      if (hasChanges) {
        if (isNewFormat(data)) {
          data.content = calendarData;
          localStorage.setItem(storageKey, JSON.stringify(data));
        } else {
          localStorage.setItem(storageKey, JSON.stringify(calendarData));
        }
        console.log(`✅ calendar 데이터 업데이트 완료: ${deletedAlarmCount}개 알람 삭제`);
      }

      return deletedAlarmCount;
    } catch (e) {
      console.error('❌ 알람 정리 실패:', e);
      return 0;
    }
  },

  /**
   * DELETED 마커 정리
   *
   * firestore_saved_calendar_{dateKey} = 'DELETED' 마커 중
   * 오래된 것들을 정리 (30일 이상 경과)
   *
   * @param {string} userId - 사용자 ID
   * @returns {number} 삭제된 마커 수
   */
  cleanupDeletedMarkers: (userId) => {
    if (!userId) return 0;

    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    let deletedMarkerCount = 0;

    const markersToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('firestore_saved_calendar_')) continue;

      try {
        const value = localStorage.getItem(key);
        if (value !== 'DELETED') continue;

        // DELETED 마커의 생성 시간을 알 수 없으므로,
        // 해당 날짜의 calendar 데이터가 없으면 삭제
        const dateKey = key.replace('firestore_saved_calendar_', '');
        const calendarKey = getStorageKey(userId, 'calendar');

        if (calendarKey) {
          const calendarRaw = localStorage.getItem(calendarKey);
          if (calendarRaw) {
            const calendarDataParsed = JSON.parse(calendarRaw);
            const calendarData = isNewFormat(calendarDataParsed)
              ? calendarDataParsed.content
              : calendarDataParsed;

            // calendar에 해당 날짜가 없으면 마커 삭제
            if (!calendarData || !calendarData[dateKey]) {
              markersToDelete.push(key);
            }
          } else {
            // calendar 데이터 자체가 없으면 모든 DELETED 마커 삭제
            markersToDelete.push(key);
          }
        }
      } catch (e) {
        // 파싱 실패 시 무시
      }
    }

    // 수집된 마커 삭제
    markersToDelete.forEach(key => {
      localStorage.removeItem(key);
      deletedMarkerCount++;
      console.log(`🗑️ DELETED 마커 삭제: ${key}`);
    });

    if (deletedMarkerCount > 0) {
      console.log(`✅ DELETED 마커 정리 완료: ${deletedMarkerCount}개 삭제`);
    }

    return deletedMarkerCount;
  },

  /**
   * 미동기화 데이터 목록 조회 (오프라인 복구용)
   * @param {string} userId - 사용자 ID
   * @returns {Array} 미동기화 항목 목록 [{key, content, savedAt}]
   */
  getUnsyncedData: (userId) => {
    if (!userId) return [];

    const prefix = `user_${userId}_`;
    const unsyncedItems = [];

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (!storageKey || !storageKey.startsWith(prefix)) continue;

      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) continue;

        const data = JSON.parse(raw);

        if (isNewFormat(data) && !data.synced) {
          const key = storageKey.replace(prefix, '');
          unsyncedItems.push({
            key,
            content: data.content,
            savedAt: data.savedAt
          });
        }
      } catch (e) {
        // 파싱 실패 시 무시
      }
    }

    return unsyncedItems;
  },

  /**
   * 동기화 완료 후 삭제 가능한 데이터 정리
   * (synced: true이고 TTL 정책이 있는 데이터 중 즉시 삭제)
   * @param {string} userId - 사용자 ID
   * @param {string} key - 키
   */
  removeIfSynced: (userId, key) => {
    if (!userId) return false;

    const storageKey = getStorageKey(userId, key);
    if (!storageKey) return false;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;

      const data = JSON.parse(raw);

      // 새 형식이고 동기화 완료된 경우 삭제
      if (isNewFormat(data) && data.synced) {
        localStorage.removeItem(storageKey);
        return true;
      }

      return false;
    } catch (e) {
      console.error('❌ removeIfSynced 실패:', e);
      return false;
    }
  },

  /**
   * 스토리지 사용량 조회
   * @param {string} userId - 사용자 ID
   * @returns {object} { used, items, byType }
   */
  getUsage: (userId) => {
    if (!userId) return { used: 0, items: 0, byType: {} };

    const prefix = `user_${userId}_`;
    let totalSize = 0;
    let itemCount = 0;
    const byType = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      const size = (key.length + value.length) * 2; // UTF-16
      totalSize += size;
      itemCount++;

      // 타입별 분류
      const type = key.replace(prefix, '').split('_')[0];
      byType[type] = (byType[type] || 0) + size;
    }

    return {
      used: totalSize,
      usedKB: Math.round(totalSize / 1024),
      usedMB: (totalSize / (1024 * 1024)).toFixed(2),
      items: itemCount,
      byType
    };
  }
};

export default localStorageService;
