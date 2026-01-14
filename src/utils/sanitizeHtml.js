// HTML 정화 유틸리티 - XSS 공격 방지
import DOMPurify from 'dompurify';

// DOMPurify 설정: YouTube iframe 허용
const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com'
];

// iframe 검증 훅 설정
if (typeof window !== 'undefined') {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src') || '';
      try {
        const url = new URL(src);
        const isAllowed = ALLOWED_IFRAME_HOSTS.some(host => url.hostname === host);
        if (!isAllowed) {
          node.remove();
          console.warn('[DOMPurify] 허용되지 않은 iframe 차단:', src);
        }
      } catch (e) {
        // 잘못된 URL이면 제거
        node.remove();
        console.warn('[DOMPurify] 잘못된 iframe URL 차단:', src);
      }
    }
  });
}

/**
 * HTML 정화 함수 - XSS 공격 방지
 * YouTube/Vimeo iframe은 허용하고 위험한 스크립트는 차단
 * @param {string} html - 정화할 HTML 문자열
 * @returns {string} 정화된 HTML 문자열
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height'],
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

/**
 * 검색 결과 하이라이트용 정화 함수
 * 검색 결과에서 <mark> 태그 허용
 * @param {string} html - 정화할 HTML 문자열
 * @returns {string} 정화된 HTML 문자열
 */
export const sanitizeSearchResult = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark', 'span', 'b', 'i', 'strong', 'em', 'br'],
    ALLOWED_ATTR: ['class', 'style']
  });
};

export default sanitizeHtml;
