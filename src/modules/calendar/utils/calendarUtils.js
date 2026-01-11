/**
 * Calendar 날짜 유틸리티 함수들
 */

/**
 * 특정 월의 모든 날짜 배열 생성 (이전/다음 달 포함)
 */
export const getDatesInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const numDays = end.getDate();
  const startDay = start.getDay();

  const dates = [];

  // 이전 달 날짜 채우기
  for (let i = startDay; i > 0; i--) {
    const prevDate = new Date(year, month, 1 - i);
    dates.push(prevDate);
  }

  // 현재 달 날짜 채우기
  for (let i = 1; i <= numDays; i++) {
    const currentDate = new Date(year, month, i);
    dates.push(currentDate);
  }

  // 다음 달 날짜 채우기
  const endDay = end.getDay();
  const remainingCells = 6 - endDay;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    dates.push(nextDate);
  }

  return dates;
};

/**
 * 요일 배열
 */
export const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 오늘 날짜
 */
export const getToday = () => new Date();
