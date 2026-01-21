import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

export const MainContent = styled.main`
  padding-top: 80px; /* 헤더 높이만큼 패딩 추가 */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

export const SyncingIndicator = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000; /* 모든 UI 위에 표시 */
    width: 60px;
    height: 60px;
    border: 6px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #5c67f2;
    animation: ${keyframes`
        to { transform: rotate(360deg); }
    `} 1s linear infinite;
`;

export const SyncSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #a0aec0;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const Screen = styled.div`
    height: 100vh;
    width: 100%;
    max-width: 450px;
    margin: 0 auto;

    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: hidden;  /* ← visible에서 hidden으로 변경 */
    overscroll-behavior: none;
    overscroll-behavior-y: contain;

    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    /* ★★★ 태블릿 화면 ★★★ */
    @media (min-width: 768px) {
        max-width: 480px; /* ◀◀◀ 책장의 폭을 넓힙니다 */
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        `}
    }

    /* ★★★ 데스크탑 화면 ★★★ */
    @media (min-width: 1024px) {
        max-width: 530px; /* ◀◀◀ 책장의 폭을 더 넓힙니다 */

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        `}
    }

    /* ★★★ 더 큰 데스크탑 화면 ★★★ */
    @media (min-width: 1440px) {
        max-width: 580px; /* ◀◀◀ 책장의 폭을 최대로 넓힙니다 */

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        `}
    }

    /* ★★★ 더 큰 데스크탑 화면 ★★★ */
    @media (min-width: 1900px) {
        max-width: 680px; /* ◀◀◀ 책장의 폭을 최대로 넓힙니다 */

        ${props => props.$layoutView === 'grid' && `
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        `}
    }
`;

export const ContentArea = styled.div`
    flex: 1;
    padding-left: ${props => props.$isSecretTab ? '0' : '24px'};
    padding-right: ${props => props.$isSecretTab ? '0' : '24px'};
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
    padding-top: ${props => props.$showHeader ? 'calc(90px + env(safe-area-inset-top))' : 'calc(20px + env(safe-area-inset-top))'};
    overflow-y: auto;
    position: relative;
    overscroll-behavior: none;
    touch-action: pan-y;
    background: ${props => props.$isSecretTab ? 'linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%)' : '#1a1a1a'};
`;

export const LoginScreen = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0 24px;
    h2 {
        font-size: 24px;
        color: #e0e0e0;
        margin-bottom: 10px;
    }
    p {
        font-size: 16px;
        color: #b0b0b0;
        margin-bottom: 30px;
    }
`;

export const LoadingScreen = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    color: #b0b0b0;
`;

export const LoginButton = styled.button`
    background-color: #4a90e2;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
        background-color: #357abd;
    }
`;

export const WidgetWrapper = styled.div`
    padding: 12px 0;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);

    ${(props) => props.$isDragging && `
        transform: scale(1.03);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 0.85;

        padding: 24px;

        display: flex;
        flex-direction: column;
        background-color: #fff4b7ff;
        border-radius: 16px;
    `}
`;

// 🔒 로그아웃 진행 중 오버레이 (다른 계정 데이터 노출 방지)
export const LogoutOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(8px);
    z-index: 99999; /* 모든 UI 위에 표시 */
    display: flex;
    justify-content: center;
    align-items: center;
    animation: ${fadeIn} 0.2s ease-out;
`;

export const LogoutMessage = styled.div`
    color: #fff;
    font-size: 18px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;

    &::before {
        content: '';
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
