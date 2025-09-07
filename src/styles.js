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
    html, body, #root {
        height: 100%; /* 이 부분의 높이가 100%여야 합니다. */
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    body {
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f0f2f5;
    }
    
    .status-bar {
        display: flex;
        justify-content: space-between;
        padding: 8px 24px 0;
        font-size: 12px;
        color: #999;
    }
`;