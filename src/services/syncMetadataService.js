// 🔄 동기화 메타데이터 관리 서비스
// 타임스탬프 기반 충돌 해결을 위한 메타데이터 관리

/**
 * 로컬 기기의 마지막 동기화 시간 가져오기
 * @param {string} userId - 사용자 ID
 * @param {string} dataType - 데이터 타입 (memos, folders, trash, etc.)
 * @returns {number|null} 타임스탬프 (ms) 또는 null
 */
export const getLocalSyncTimestamp = (userId, dataType) => {
  try {
    const key = `syncTimestamp_${userId}_${dataType}`;
    const timestamp = localStorage.getItem(key);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error(`로컬 동기화 시간 조회 실패 (${dataType}):`, error);
    return null;
  }
};

/**
 * 로컬 기기의 마지막 동기화 시간 저장
 * @param {string} userId - 사용자 ID
 * @param {string} dataType - 데이터 타입
 * @param {number} timestamp - 타임스탬프 (ms)
 */
export const setLocalSyncTimestamp = (userId, dataType, timestamp = Date.now()) => {
  try {
    const key = `syncTimestamp_${userId}_${dataType}`;
    localStorage.setItem(key, timestamp.toString());
  } catch (error) {
    console.error(`로컬 동기화 시간 저장 실패 (${dataType}):`, error);
  }
};

/**
 * 모든 데이터 타입의 로컬 동기화 시간 가져오기
 * @param {string} userId - 사용자 ID
 * @returns {Object} 데이터 타입별 타임스탬프
 */
export const getAllLocalSyncTimestamps = (userId) => {
  const dataTypes = ['memos', 'folders', 'trash', 'macros', 'calendar', 'activities', 'settings'];

  const timestamps = {};
  dataTypes.forEach(dataType => {
    timestamps[dataType] = getLocalSyncTimestamp(userId, dataType);
  });

  return timestamps;
};

/**
 * 모든 데이터 타입의 로컬 동기화 시간 업데이트
 * @param {string} userId - 사용자 ID
 * @param {number} timestamp - 타임스탬프 (기본값: 현재 시간)
 */
export const updateAllLocalSyncTimestamps = (userId, timestamp = Date.now()) => {
  const dataTypes = ['memos', 'folders', 'trash', 'macros', 'calendar', 'activities', 'settings'];

  dataTypes.forEach(dataType => {
    setLocalSyncTimestamp(userId, dataType, timestamp);
  });
};

/**
 * 서버 타임스탬프와 로컬 타임스탬프 비교
 * @param {Object} serverTimestamp - Firestore Timestamp 객체
 * @param {number|null} localTimestamp - 로컬 타임스탬프 (ms)
 * @returns {string} 'server' | 'local' | 'conflict' | 'unknown'
 */
export const compareTimestamps = (serverTimestamp, localTimestamp) => {
  // 서버 타임스탬프가 없으면 (신규 사용자) 로컬 데이터 우선
  if (!serverTimestamp) {
    return localTimestamp ? 'local' : 'unknown';
  }

  // 로컬 타임스탬프가 없으면 (첫 로그인 또는 이전 기록 없음) 서버 데이터 우선
  if (!localTimestamp) {
    return 'server';
  }

  // Firestore Timestamp를 ms로 변환
  const serverMs = serverTimestamp.toMillis ? serverTimestamp.toMillis() : serverTimestamp.seconds * 1000;

  // 시간 차이 계산 (ms)
  const timeDiff = Math.abs(serverMs - localTimestamp);

  // 1분 이내 차이는 동일하다고 간주 (네트워크 지연 등 고려)
  if (timeDiff < 60000) {
    return 'server'; // 동일한 경우 서버 우선
  }

  // 서버가 더 최신
  if (serverMs > localTimestamp) {
    return 'server';
  }

  // 로컬이 더 최신 (주의: 데이터 손실 가능)
  if (localTimestamp > serverMs) {
    // 30분 이상 차이나면 충돌로 간주하여 사용자 확인 필요
    if (timeDiff > 1800000) {
      return 'conflict';
    }
    return 'local';
  }

  return 'unknown';
};

/**
 * 모든 데이터 타입에 대한 동기화 전략 결정
 * @param {Object} serverData - Firestore 문서들 (updatedAt 포함)
 * @param {string} userId - 사용자 ID
 * @returns {Object} 데이터 타입별 동기화 전략
 */
export const decideSyncStrategy = (serverData, userId) => {
  const localTimestamps = getAllLocalSyncTimestamps(userId);
  const strategy = {};

  const dataTypes = ['memos', 'folders', 'trash', 'macros', 'calendar', 'activities', 'settings'];

  dataTypes.forEach(dataType => {
    const serverTimestamp = serverData[dataType]?.updatedAt;
    const localTimestamp = localTimestamps[dataType];

    const decision = compareTimestamps(serverTimestamp, localTimestamp);

    strategy[dataType] = {
      action: decision,
      serverTimestamp: serverTimestamp ?
        (serverTimestamp.toMillis ? serverTimestamp.toMillis() : serverTimestamp.seconds * 1000) :
        null,
      localTimestamp: localTimestamp
    };
  });

  return strategy;
};

/**
 * 충돌 상황 요약 생성
 * @param {Object} strategy - decideSyncStrategy 결과
 * @returns {Object} 충돌 요약 정보
 */
export const getSyncConflictSummary = (strategy) => {
  const conflicts = [];
  const serverNewer = [];
  const localNewer = [];

  Object.entries(strategy).forEach(([dataType, info]) => {
    if (info.action === 'conflict') {
      conflicts.push({
        dataType,
        serverTime: info.serverTimestamp,
        localTime: info.localTimestamp
      });
    } else if (info.action === 'server') {
      serverNewer.push(dataType);
    } else if (info.action === 'local') {
      localNewer.push(dataType);
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    serverNewer,
    localNewer,
    needsUserConfirmation: conflicts.length > 0 || localNewer.length > 0
  };
};

/**
 * 사용자에게 보여줄 충돌 메시지 생성
 * @param {Object} conflictSummary - getSyncConflictSummary 결과
 * @returns {string} 사용자 친화적 메시지
 */
export const generateConflictMessage = (conflictSummary) => {
  if (!conflictSummary.needsUserConfirmation) {
    return '서버 데이터가 최신입니다. 서버에서 복원합니다.';
  }

  const messages = [];

  if (conflictSummary.conflicts.length > 0) {
    messages.push('⚠️ 데이터 충돌 감지');
    conflictSummary.conflicts.forEach(conflict => {
      const serverDate = new Date(conflict.serverTime).toLocaleString('ko-KR');
      const localDate = new Date(conflict.localTime).toLocaleString('ko-KR');

      const typeNames = {
        memos: '메모',
        folders: '폴더',
        trash: '휴지통',
        macros: '매크로',
        calendar: '캘린더',
        activities: '활동',
        settings: '설정'
      };

      messages.push(`\n📦 ${typeNames[conflict.dataType] || conflict.dataType}:`);
      messages.push(`  서버: ${serverDate}`);
      messages.push(`  이 기기: ${localDate}`);
    });
  }

  if (conflictSummary.localNewer.length > 0 && conflictSummary.conflicts.length === 0) {
    messages.push('⚠️ 이 기기의 데이터가 서버보다 최신입니다.');
    messages.push('서버 데이터를 덮어쓰시겠습니까?');
  }

  return messages.join('\n');
};

/**
 * 첫 로그인 여부 확인 (모든 타임스탬프가 없는 경우)
 * @param {string} userId - 사용자 ID
 * @returns {boolean} 첫 로그인이면 true
 */
export const isFirstLogin = (userId) => {
  const timestamps = getAllLocalSyncTimestamps(userId);

  // 모든 타임스탬프가 null이면 첫 로그인
  return Object.values(timestamps).every(ts => ts === null);
};

/**
 * 동기화 메타데이터 초기화 (로그아웃 시 사용)
 * @param {string} userId - 사용자 ID
 */
export const clearSyncMetadata = (userId) => {
  const dataTypes = ['memos', 'folders', 'trash', 'macros', 'calendar', 'activities', 'settings'];

  dataTypes.forEach(dataType => {
    const key = `syncTimestamp_${userId}_${dataType}`;
    localStorage.removeItem(key);
  });

  console.log(`✅ 동기화 메타데이터 초기화 완료 (${userId})`);
};
