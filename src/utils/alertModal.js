// 전역 알림 모달 유틸리티 (alert 대체)
let globalShowAlert = null;

export const registerAlert = (showAlertFn) => {
  globalShowAlert = showAlertFn;
};

export const showAlert = (message, title = '알림', onConfirm = null) => {
  if (globalShowAlert) {
    globalShowAlert(message, title, onConfirm);
  } else {
    // fallback: showAlert가 등록되지 않은 경우 브라우저 alert 사용
    alert(message);
    if (onConfirm) onConfirm();
  }
};
