// src/styles.js
import { createGlobalStyle, keyframes } from 'styled-components';

export const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const GlobalStyle = createGlobalStyle`
    /* CSS Reset */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    
    html, body {
        height: 100%;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    body {
        background: #f0f2f5;
        display: flex;
        justify-content: center;

        /* ▼▼▼▼▼▼ 여기로 코드를 옮겨주세요 ▼▼▼▼▼▼ */

        /* (1) 당겨서 새로고침 (바운스 효과) 비활성화 */
        overscroll-behavior-y: contain;

        /* (2) 모바일 탭 하이라이트(파란색/회색 배경) 제거 */
        -webkit-tap-highlight-color: transparent;

        /* (3) 텍스트 드래그(선택) 방지 */
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
    
    #root {
        height: 100%;
        width: 100%;
    }
    
    /* 입력창은 텍스트 선택이 가능하도록 예외 처리 (이것은 그대로 둡니다) */
    textarea,
    input {
        user-select: auto !important;
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
    }
    
    .status-bar {
        display: flex;
        justify-content: space-between;
        padding: 8px 24px 0;
        font-size: 12px;
        color: #999;
    }
`;