// 보안 유틸리티 - XSS, 인젝션 공격 방어
import DOMPurify from 'dompurify';

/**
 * XSS 공격 방어: HTML/스크립트 태그 제거
 * @param {string} input - 사용자 입력
 * @returns {string} 살균된 텍스트
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';

  // DOMPurify로 모든 HTML 태그 제거
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // 태그 완전 차단
    ALLOWED_ATTR: [], // 속성 완전 차단
    KEEP_CONTENT: true, // 텍스트 내용은 유지
  });

  return clean.trim();
};

/**
 * 메모 내용 살균 (줄바꿈 허용, 스크립트 차단)
 * @param {string} content - 메모 내용
 * @returns {string} 살균된 메모
 */
export const sanitizeMemoContent = (content) => {
  if (typeof content !== 'string') return '';

  // 스크립트 태그 및 이벤트 핸들러 제거
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // 모든 HTML 태그 차단
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // 위험한 프로토콜 패턴 제거 (javascript:, data:, vbscript: 등)
  const sanitized = clean
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // onclick=, onerror= 등

  return sanitized.trim();
};

/**
 * URL 유효성 검증 (피싱 방지)
 * @param {string} url - 검증할 URL
 * @returns {boolean} 안전한 URL 여부
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    // HTTPS만 허용 (또는 개발용 HTTP localhost)
    const allowedProtocols = ['https:', 'http:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }

    // localhost는 개발 환경에서만 허용
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      return false;
    }

    // 위험한 프로토콜 차단
    if (url.match(/^(javascript|data|vbscript|file):/i)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * SQL 인젝션 방지 (특수문자 이스케이프)
 * Firebase는 NoSQL이지만 추가 방어층
 * @param {string} input - 입력값
 * @returns {string} 이스케이프된 문자열
 */
export const escapeSpecialChars = (input) => {
  if (typeof input !== 'string') return '';

  return input
    .replace(/['"`;\\]/g, '') // 위험한 특수문자 제거
    .trim();
};

/**
 * 파일명 살균 (파일 업로드 시)
 * @param {string} filename - 파일명
 * @returns {string} 안전한 파일명
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';

  // 확장자 추출
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  // 안전한 문자만 허용 (알파벳, 숫자, 하이픈, 언더스코어)
  const safeName = name
    .replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    .substring(0, 100); // 길이 제한

  // 허용된 확장자만 (화이트리스트)
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'];
  const safeExt = allowedExtensions.includes(ext.toLowerCase()) ? ext : 'txt';

  return `${safeName}.${safeExt}`;
};

/**
 * 이메일 유효성 검증
 * @param {string} email - 이메일 주소
 * @returns {boolean} 유효한 이메일 여부
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * 사용자 ID 유효성 검증
 * @param {string} userId - 사용자 ID
 * @returns {boolean} 유효한 ID 여부
 */
export const isValidUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return false;

  // Firebase Auth UID 형식 또는 커스텀 ID 형식
  const idRegex = /^[a-zA-Z0-9_-]{1,128}$/;
  return idRegex.test(userId);
};

/**
 * Rate Limiting 체크용 (클라이언트 측)
 * 서버 측 구현이 필요하지만, 클라이언트에서도 1차 방어
 */
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // ms
    this.requests = new Map(); // userId -> [{timestamp}]
  }

  /**
   * 요청 허용 여부 체크
   * @param {string} userId - 사용자 ID
   * @returns {boolean} 요청 허용 여부
   */
  allowRequest(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // 시간 윈도우 밖의 요청 제거
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    // 최대 요청 수 초과 체크
    if (validRequests.length >= this.maxRequests) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return false;
    }

    // 새 요청 추가
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return true;
  }

  /**
   * 사용자 요청 기록 초기화
   * @param {string} userId - 사용자 ID
   */
  reset(userId) {
    this.requests.delete(userId);
  }
}

// Rate Limiter 인스턴스들
export const messageLimiter = new RateLimiter(10, 60000); // 1분에 10개 메시지
export const roomCreationLimiter = new RateLimiter(5, 300000); // 5분에 5개 방 생성
export const invitationLimiter = new RateLimiter(20, 60000); // 1분에 20개 초대

/**
 * 콘텐츠 크기 검증
 * @param {string} content - 검증할 콘텐츠
 * @param {number} maxSize - 최대 크기 (바이트)
 * @returns {boolean} 크기 허용 여부
 */
export const validateContentSize = (content, maxSize = 100000) => {
  if (!content) return true;

  const size = new Blob([content]).size;

  if (size > maxSize) {
    console.warn(`Content size ${size} exceeds max ${maxSize}`);
    return false;
  }

  return true;
};

/**
 * 악성 패턴 감지
 * @param {string} content - 검사할 콘텐츠
 * @returns {boolean} 악성 패턴 발견 여부
 */
export const detectMaliciousPatterns = (content) => {
  if (!content || typeof content !== 'string') return false;

  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];

  return maliciousPatterns.some(pattern => pattern.test(content));
};

/**
 * 종합 보안 검증
 * @param {string} content - 검증할 콘텐츠
 * @param {string} type - 콘텐츠 타입 ('memo' | 'message' | 'username')
 * @returns {Object} {isValid: boolean, sanitized: string, error: string}
 */
export const validateAndSanitize = (content, type = 'memo') => {
  // 1. 타입 검증
  if (typeof content !== 'string') {
    return { isValid: false, sanitized: '', error: '잘못된 입력 형식입니다.' };
  }

  // 2. 크기 검증
  const maxSizes = {
    memo: 100000, // 100KB
    message: 10000, // 10KB
    username: 100, // 100바이트
  };

  if (!validateContentSize(content, maxSizes[type])) {
    return { isValid: false, sanitized: '', error: '입력 크기가 너무 큽니다.' };
  }

  // 3. 악성 패턴 감지
  if (detectMaliciousPatterns(content)) {
    console.error('Malicious pattern detected:', content.substring(0, 100));
    return { isValid: false, sanitized: '', error: '허용되지 않는 내용이 포함되어 있습니다.' };
  }

  // 4. 살균
  const sanitized = type === 'username'
    ? escapeSpecialChars(content)
    : sanitizeMemoContent(content);

  return { isValid: true, sanitized, error: null };
};
