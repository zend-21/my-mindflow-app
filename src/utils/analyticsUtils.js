// Firebase Analytics 유틸리티
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../firebase/config';

/**
 * 사용자 ID 설정 (로그인 시 호출)
 * @param {string} userId - Firebase 사용자 ID
 */
export const setAnalyticsUserId = (userId) => {
  if (!analytics) {
    console.warn('Analytics가 초기화되지 않았습니다.');
    return;
  }

  try {
    setUserId(analytics, userId);
    console.log('✅ Analytics 사용자 ID 설정:', userId);
  } catch (error) {
    console.error('Analytics 사용자 ID 설정 오류:', error);
  }
};

/**
 * 사용자 속성 설정
 * @param {object} properties - 사용자 속성 객체
 */
export const setAnalyticsUserProperties = (properties) => {
  if (!analytics) {
    console.warn('Analytics가 초기화되지 않았습니다.');
    return;
  }

  try {
    setUserProperties(analytics, properties);
    console.log('✅ Analytics 사용자 속성 설정:', properties);
  } catch (error) {
    console.error('Analytics 사용자 속성 설정 오류:', error);
  }
};

/**
 * 커스텀 이벤트 로깅
 * @param {string} eventName - 이벤트 이름
 * @param {object} eventParams - 이벤트 파라미터
 */
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (!analytics) {
    console.warn('Analytics가 초기화되지 않았습니다.');
    return;
  }

  try {
    logEvent(analytics, eventName, eventParams);
    console.log('✅ Analytics 이벤트 로깅:', eventName, eventParams);
  } catch (error) {
    console.error('Analytics 이벤트 로깅 오류:', error);
  }
};

/**
 * 페이지 조회 이벤트
 * @param {string} pagePath - 페이지 경로
 * @param {string} pageTitle - 페이지 제목
 */
export const logPageView = (pagePath, pageTitle) => {
  logAnalyticsEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

/**
 * 로그인 이벤트
 * @param {string} method - 로그인 방법 (google, email 등)
 */
export const logLoginEvent = (method) => {
  logAnalyticsEvent('login', {
    method: method,
  });
};

/**
 * 회원가입 이벤트
 * @param {string} method - 가입 방법
 */
export const logSignUpEvent = (method) => {
  logAnalyticsEvent('sign_up', {
    method: method,
  });
};

/**
 * 메모 생성 이벤트
 */
export const logMemoCreateEvent = () => {
  logAnalyticsEvent('memo_create');
};

/**
 * 협업방 생성 이벤트
 * @param {boolean} isPublic - 공개 여부
 */
export const logRoomCreateEvent = (isPublic) => {
  logAnalyticsEvent('room_create', {
    is_public: isPublic,
  });
};

/**
 * 협업방 참여 이벤트
 */
export const logRoomJoinEvent = () => {
  logAnalyticsEvent('room_join');
};
