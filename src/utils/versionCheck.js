// 앱 버전 체크 및 업데이트 관리
const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_INTERVAL = 1000 * 60 * 30; // 30분마다 체크
const VERSION_STORAGE_KEY = 'app_version';
const LAST_CHECK_KEY = 'last_version_check';

/**
 * 서버에서 최신 버전 정보 가져오기
 */
export const fetchLatestVersion = async () => {
  try {
    // 캐시 방지를 위해 타임스탬프 추가
    const timestamp = new Date().getTime();
    const response = await fetch(`/version.json?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error('버전 정보를 가져올 수 없습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('버전 체크 실패:', error);
    return null;
  }
};

/**
 * 버전 비교 (semantic versioning)
 * @returns {number} 1: v1이 더 높음, -1: v2가 더 높음, 0: 같음
 */
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
};

/**
 * 현재 버전 가져오기
 */
export const getCurrentVersion = () => {
  return CURRENT_VERSION;
};

/**
 * 로컬에 저장된 버전 가져오기
 */
export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_STORAGE_KEY) || CURRENT_VERSION;
};

/**
 * 버전 저장
 */
export const saveVersion = (version) => {
  localStorage.setItem(VERSION_STORAGE_KEY, version);
  localStorage.setItem(LAST_CHECK_KEY, new Date().getTime().toString());
};

/**
 * 마지막 체크 시간 확인
 */
export const shouldCheckVersion = () => {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  if (!lastCheck) return true;

  const now = new Date().getTime();
  const elapsed = now - parseInt(lastCheck);

  return elapsed > VERSION_CHECK_INTERVAL;
};

/**
 * 업데이트 필요 여부 확인
 */
export const checkForUpdates = async () => {
  try {
    const versionInfo = await fetchLatestVersion();
    if (!versionInfo) return null;

    const { version: latestVersion, forceUpdate, minVersion, updateMessage } = versionInfo;

    // 현재 버전과 비교
    const isOutdated = compareVersions(latestVersion, CURRENT_VERSION) === 1;

    // 최소 버전 체크 (강제 업데이트)
    const isBelowMinVersion = minVersion && compareVersions(CURRENT_VERSION, minVersion) === -1;

    return {
      hasUpdate: isOutdated,
      latestVersion,
      currentVersion: CURRENT_VERSION,
      forceUpdate: forceUpdate || isBelowMinVersion,
      updateMessage: updateMessage || '새로운 버전이 있습니다.',
      versionInfo
    };
  } catch (error) {
    console.error('업데이트 체크 실패:', error);
    return null;
  }
};

/**
 * 앱 새로고침 (캐시 제거)
 */
export const reloadApp = (clearCache = true) => {
  if (clearCache) {
    // Service Worker 캐시 제거
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    // 로컬 스토리지에 새로고침 플래그 설정
    localStorage.setItem('force_reload', 'true');

    // 캐시 제거 후 새로고침
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
        window.location.reload(true);
      });
    } else {
      // 캐시 API 없으면 강제 새로고침
      window.location.reload(true);
    }
  } else {
    window.location.reload();
  }
};

/**
 * 버전 정보 표시 문자열 생성
 */
export const getVersionDisplay = () => {
  const buildDate = new Date().toLocaleDateString('ko-KR');
  return `v${CURRENT_VERSION} (${buildDate})`;
};

/**
 * 업데이트 알림 표시 여부 확인
 */
export const shouldShowUpdateNotification = () => {
  const lastDismissed = localStorage.getItem('update_notification_dismissed');
  if (!lastDismissed) return true;

  // 24시간마다 다시 표시
  const now = new Date().getTime();
  const elapsed = now - parseInt(lastDismissed);
  const ONE_DAY = 1000 * 60 * 60 * 24;

  return elapsed > ONE_DAY;
};

/**
 * 업데이트 알림 무시
 */
export const dismissUpdateNotification = () => {
  localStorage.setItem('update_notification_dismissed', new Date().getTime().toString());
};

export default {
  fetchLatestVersion,
  compareVersions,
  getCurrentVersion,
  getStoredVersion,
  saveVersion,
  shouldCheckVersion,
  checkForUpdates,
  reloadApp,
  getVersionDisplay,
  shouldShowUpdateNotification,
  dismissUpdateNotification
};
