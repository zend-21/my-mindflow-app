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
        /* Android WebView 텍스트 크기 고정 - 시스템 폰트 크기 설정 무시 */
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
    }

    html, body {
        height: 100%;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    body {
        background: #0f0f0f;
        display: flex;
        justify-content: center;

        /* (1) 당겨서 새로고침 (바운스 효과) 비활성화 */
        overscroll-behavior-y: contain;

        /* (2) 모바일 탭 하이라이트(파란색/회색 배경) 제거 */
        -webkit-tap-highlight-color: transparent;

        /* (3) 텍스트 드래그(선택) 방지 */
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;

        /* (4) Safe Area 설정 - 시스템 바 영역 침범 방지 */
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
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
        color: #b0b0b0;
    }
`;