// 전역 토스트 유틸리티
// App.jsx에서 등록한 showToast 함수를 전역에서 사용할 수 있도록 함

let globalShowToast = null;

export const registerToast = (showToastFn) => {
  globalShowToast = showToastFn;
};

export const toast = (message) => {
  if (globalShowToast) {
    globalShowToast(message);
  } else {
    // fallback: showToast가 등록되지 않은 경우 콘솔에 출력
    console.warn('[Toast] showToast not registered:', message);
  }
};
