// src/utils/logger.js
// 🔒 보안 강화 로깅 유틸리티
//
// 개발 환경: 상세한 디버깅 정보 표시
// 프로덕션 환경: 민감한 정보 자동 필터링

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// UID 마스킹 함수 (앞 4자리 + *** + 뒤 4자리)
const maskUID = (uid) => {
  if (!uid || typeof uid !== 'string') return uid;
  if (uid.length <= 8) return '***';
  return `${uid.slice(0, 4)}***${uid.slice(-4)}`;
};

// 민감한 데이터 자동 필터링
const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  // 민감한 키 목록
  const sensitiveKeys = ['userId', 'uid', 'email', 'password', 'token', 'apiKey'];

  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = maskUID(sanitized[key]);
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

// 로거 클래스
class Logger {
  constructor() {
    this.enabled = true;
  }

  // 개발 환경 전용 로그
  dev(...args) {
    if (!IS_DEVELOPMENT || !this.enabled) return;
    console.log('[DEV]', ...args);
  }

  // 일반 정보 로그 (프로덕션에서는 필터링)
  info(...args) {
    if (!this.enabled) return;

    if (IS_PRODUCTION) {
      const sanitized = args.map(arg =>
        typeof arg === 'object' ? sanitizeData(arg) : arg
      );
      console.log('[INFO]', ...sanitized);
    } else {
      console.log('[INFO]', ...args);
    }
  }

  // 경고 로그
  warn(...args) {
    if (!this.enabled) return;

    if (IS_PRODUCTION) {
      const sanitized = args.map(arg =>
        typeof arg === 'object' ? sanitizeData(arg) : arg
      );
      console.warn('[WARN]', ...sanitized);
    } else {
      console.warn('[WARN]', ...args);
    }
  }

  // 에러 로그 (항상 표시, 민감 정보는 마스킹)
  error(...args) {
    if (!this.enabled) return;

    const sanitized = args.map(arg =>
      typeof arg === 'object' ? sanitizeData(arg) : arg
    );
    console.error('[ERROR]', ...sanitized);
  }

  // Firestore 작업 로그 (UID 자동 마스킹)
  firestore(operation, userId, details = '') {
    if (!this.enabled) return;

    const maskedUserId = IS_PRODUCTION ? maskUID(userId) : userId;

    if (IS_DEVELOPMENT) {
      console.log(`🔥 [Firestore] ${operation} | userId: ${maskedUserId} | ${details}`);
    } else {
      // 프로덕션에서는 간략하게
      console.log(`[Firestore] ${operation}`);
    }
  }

  // 동기화 로그
  sync(message, data = null) {
    if (!this.enabled) return;

    if (IS_DEVELOPMENT) {
      console.log(`🔄 [Sync] ${message}`, data || '');
    } else {
      console.log(`[Sync] ${message}`);
    }
  }

  // 인증 로그 (항상 UID 마스킹)
  auth(message, userId = null) {
    if (!this.enabled) return;

    const maskedUserId = userId ? maskUID(userId) : '';
    console.log(`🔐 [Auth] ${message}`, maskedUserId ? `| User: ${maskedUserId}` : '');
  }

  // 성능 측정 시작
  time(label) {
    if (!this.enabled || !IS_DEVELOPMENT) return;
    console.time(`⏱️ [Performance] ${label}`);
  }

  // 성능 측정 종료
  timeEnd(label) {
    if (!this.enabled || !IS_DEVELOPMENT) return;
    console.timeEnd(`⏱️ [Performance] ${label}`);
  }

  // 로거 완전 비활성화 (프로덕션 최적화)
  disable() {
    this.enabled = false;
  }

  // 로거 활성화
  enable() {
    this.enabled = true;
  }
}

// 싱글톤 인스턴스
const logger = new Logger();

// 프로덕션 환경에서는 기본적으로 최소 로깅
if (IS_PRODUCTION) {
  logger.info('🚀 프로덕션 모드 - 민감한 정보 자동 마스킹 활성화');
}

export default logger;
