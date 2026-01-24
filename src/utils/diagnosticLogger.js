// src/utils/diagnosticLogger.js
// 진단 로그를 화면에 표시하는 유틸리티

/**
 * 진단 로그 전송
 * @param {string} type - 'info' | 'success' | 'warning' | 'error'
 * @param {string} message - 표시할 메시지
 * @param {object} data - 추가 데이터 (선택사항)
 */
export const diagnosticLog = (type, message, data = null) => {
  // 콘솔에도 출력
  const logMethod = type === 'error' ? console.error : console.log;
  logMethod(`[진단] ${type.toUpperCase()}: ${message}`, data || '');

  // 진단 패널로 이벤트 전송
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('diagnostic-log', {
      detail: { type, message, data }
    }));
  }
};

export default diagnosticLog;
