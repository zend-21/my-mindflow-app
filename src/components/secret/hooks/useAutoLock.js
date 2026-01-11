import { useEffect, useRef } from 'react';

/**
 * 자동 잠금 기능 관리
 * - 설정된 시간 후 자동 잠금
 * - 사용자 활동 감지
 * - 백그라운드 전환 시 즉시 잠금
 */
export function useAutoLock(isUnlocked, autoLockMinutes, handleLock, showToast) {
  const autoLockTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // 자동 잠금 타이머 설정
  useEffect(() => {
    if (!isUnlocked || autoLockMinutes === 0) return;

    const checkAutoLock = () => {
      const now = Date.now();
      const elapsed = (now - lastActivityRef.current) / 1000 / 60; // 분 단위

      if (elapsed >= autoLockMinutes) {
        handleLock();
        showToast?.('자동 잠금되었습니다.');
      }
    };

    autoLockTimerRef.current = setInterval(checkAutoLock, 10000); // 10초마다 확인

    return () => {
      if (autoLockTimerRef.current) {
        clearInterval(autoLockTimerRef.current);
      }
    };
  }, [isUnlocked, autoLockMinutes, handleLock, showToast]);

  // 사용자 활동 감지
  const handleActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (isUnlocked) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('touchmove', handleActivity);

      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('touchmove', handleActivity);
      };
    }
  }, [isUnlocked]);

  // 백그라운드 전환 시 자동 잠금
  useEffect(() => {
    if (!isUnlocked) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 백그라운드로 전환되면 즉시 잠금
        handleLock();
        console.log('🔒 백그라운드 전환으로 인한 자동 잠금');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked, handleLock]);
}
