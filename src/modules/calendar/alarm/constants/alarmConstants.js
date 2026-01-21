// ==========================================
// 알람 관련 상수 정의
// ==========================================

// 자동 삭제
export const AUTO_DELETE_DAYS = 3; // 종료된 알람 자동삭제 일수

// 색상
export const ALARM_COLORS = {
  // 알람 상태별 색상
  active: '#FF6B6B',                    // 활성 알람 (진한 빨강)
  disabled: 'rgba(255, 107, 107, 0.3)', // 비활성 알람 (흐린 빨강)

  // 캘린더 점 색상
  dot: {
    active: '#FF6B6B',                  // 활성 알람 점
    inactive: 'rgba(255, 107, 107, 0.3)', // 비활성 알람 점
  },

  // 기념일 색상
  anniversary: {
    badge: '#FF4B8C',                   // 기념일 뱃지 배경색
    text: '#4a90e2',                    // 기념일 텍스트 색상
  },

  // UI 색상
  primary: '#4a90e2',                   // 주요 버튼, 링크 색상
  danger: '#dc3545',                    // 삭제, 경고 색상
  success: '#28a745',                   // 성공, 확인 색상
  muted: '#6c757d',                     // 보조 텍스트 색상
};

// 메시지
export const ALARM_MESSAGES = {
  // 삭제 확인 메시지
  delete: {
    pending: '해당 가등록 알람을 삭제할까요?',
    terminated: '종료된 알람을 삭제할까요?',
    normal: '해당 알람을 삭제할까요?',
    anniversary: {
      sameDay: '정말 해당 기념일을 삭제하시겠습니까?',
      repeated: '해당 기념일은 완전히 삭제됩니다. 진행할까요?',
    },
  },

  // 자동 삭제 안내
  autoDelete: {
    daysRemaining: (days) => `${days}일 후 자동 삭제`,
    deleted: '자동 삭제됨',
  },

  // 상태 메시지
  status: {
    terminated: '- 종료된 알람',
    modified: '변경사항 미적용',
    registeredToday: '(당일 등록)',
  },
};

// 반복 옵션
export const REPEAT_OPTIONS = {
  none: 'none',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly',
};

// 반복 옵션 라벨
export const REPEAT_LABELS = {
  [REPEAT_OPTIONS.none]: '반복 안함',
  [REPEAT_OPTIONS.daily]: '매일',
  [REPEAT_OPTIONS.weekly]: '매주',
  [REPEAT_OPTIONS.monthly]: '매월',
  [REPEAT_OPTIONS.yearly]: '매년',
};

// 알람 타이밍
export const ALARM_TIMING = {
  today: 'today',      // 당일
  before: 'before',    // N일 전
};

// ✨ 알람 반복 설정 (스누즈 제거, 토스트 알림)
export const ALARM_REPEAT_CONFIG = {
  counts: {
    1: '1회 (반복 없음)',
    3: '3회 (1분 간격으로 3회 알림)'
  },
  fixedInterval: 60,                    // 고정: 1분 간격 (60초)
  defaultCount: 1,                      // 기본: 1회
  toastDuration: 3000,                  // 토스트 표시 시간: 3초
};

// 미리 알림 설정
export const ADVANCE_NOTICE_CONFIG = {
  options: {
    0: '없음',
    10: '10분 전',
    30: '30분 전',
    60: '1시간 전',
    180: '3시간 전',
    1440: '1일 전'
  },
  defaultValue: 0,                      // 기본: 없음
};

// 알림 타입
export const NOTIFICATION_TYPES = {
  sound: 'sound',                       // 소리만
  vibration: 'vibration',               // 진동만
  both: 'both',                         // 소리 + 진동
};

// 정렬 옵션
export const SORT_OPTIONS = {
  time: 'time',                         // 시간순
  registration: 'registration',         // 등록순
};

// 정렬 방향
export const SORT_DIRECTION = {
  asc: 'asc',                           // 오름차순
  desc: 'desc',                         // 내림차순
};

// 기본 설정값
export const DEFAULT_ALARM_SETTINGS = {
  soundFile: 'default',
  volume: 80,
  notificationType: NOTIFICATION_TYPES.both,
  snoozeEnabled: false,
  snoozeMinutes: 0,
  sortBy: SORT_OPTIONS.time,
  sortDirection: SORT_DIRECTION.asc,
};
