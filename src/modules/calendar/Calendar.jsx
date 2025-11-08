import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ko } from 'date-fns/locale';
import ImprovedDateSelector from './DateSelectorModal.jsx';
import { Copy, Bell, AlarmClock } from "lucide-react";
import { format, isBefore, startOfDay, addDays, subMonths, addMonths, subDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from 'react-swipeable';
import { useTrashContext } from '../../contexts/TrashContext';

// 개인 기념일
const PERSONAL_EVENTS = {};

// API 캐시 관리 유틸리티
const API_CACHE_KEY = 'special_dates_cache';
const CACHE_VERSION = '1.2'; // 캐시 구조 변경 - 월별 체크 시스템 적용
const MAX_RETRY_ATTEMPTS = 5; // 최대 재시도 횟수
const RETRY_INTERVALS = [1000, 5000, 15000, 60000, 300000]; // 재시도 간격 (밀리초)

// 캐시 데이터 구조
const createCacheData = (data, timestamp = Date.now()) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    version: CACHE_VERSION,
    timestamp,
    data,
    lastCheckedMonth: currentMonth, // 마지막으로 체크한 월 (YYYY-MM)
    lastFailedAttempt: null,
    failedAttempts: 0
  };
};

// 캐시 관리 함수들
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(API_CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);

    // 버전 체크
    if (parsedCache.version !== CACHE_VERSION) {
      console.log('캐시 버전 불일치 - 삭제:', parsedCache.version, '→', CACHE_VERSION);
      localStorage.removeItem(API_CACHE_KEY);
      return null;
    }

    // 무결성 검사: 데이터가 비어있거나 잘못된 형식인지 확인
    if (!parsedCache.data || typeof parsedCache.data !== 'object' || Object.keys(parsedCache.data).length === 0) {
      console.warn('캐시 데이터 손상 감지 - 삭제 후 재다운로드');
      localStorage.removeItem(API_CACHE_KEY);
      return null;
    }

    return parsedCache;
  } catch (error) {
    console.error('캐시 데이터 읽기 오류:', error);
    localStorage.removeItem(API_CACHE_KEY);
    return null;
  }
};

const setCachedData = (data) => {
  try {
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('캐시 데이터 저장 오류:', error);
  }
};

// 월별 업데이트 체크 함수
const shouldRunMonthlyCheck = (cachedData) => {
  if (!cachedData) return true;

  // 실패한 시도가 있으면 재시도
  if (cachedData.failedAttempts > 0) return true;

  // lastCheckedMonth가 없으면 체크 필요
  if (!cachedData.lastCheckedMonth) return true;

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // 마지막 체크한 달과 현재 달이 다르면 체크 실행
  return cachedData.lastCheckedMonth !== currentMonth;
};

// 네트워크 상태 감지
const checkNetworkStatus = () => {
  return navigator.onLine !== false;
};

// 캐시 데이터에서 현재 월부터 끝까지의 월 목록 추출
const getMonthsToCheck = (cachedData) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  const months = [];

  // 캐시에 있는 모든 날짜 키에서 년-월 추출
  if (cachedData && cachedData.data) {
    const dateKeys = Object.keys(cachedData.data);
    const uniqueMonths = new Set();

    dateKeys.forEach(dateKey => {
      // dateKey 형식: "YYYY-MM-DD"
      const yearMonth = dateKey.substring(0, 7); // "YYYY-MM"
      const [year, month] = yearMonth.split('-').map(Number);

      // 현재 월 이후의 데이터만 추출
      if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        uniqueMonths.add(yearMonth);
      }
    });

    return Array.from(uniqueMonths).sort();
  }

  return months;
};

// 특정 월의 샘플 데이터 다운로드 (비교용)
const fetchMonthSample = async (yearMonth) => {
  const [year, month] = yearMonth.split('-');
  const monthStr = month.padStart(2, '0');

  try {
    const apiData = await fetchSpecialDatesWithRetry(year, monthStr);

    const mergedData = {};

    const processData = (items, color, isNationalDay = false) => {
      const processedItems = Array.isArray(items) ? items : (items ? [items] : []);

      processedItems.forEach(item => {
        const date = String(item.locdate);
        const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        if (!mergedData[formattedDate]) {
          mergedData[formattedDate] = [];
        }
        mergedData[formattedDate].push({ name: item.dateName, color, isNationalDay });
      });
    };

    processData(apiData.holiday?.response?.body?.items?.item, 'red', true);
    processData(apiData.solarTerm?.response?.body?.items?.item, '#808080');
    processData(apiData.anniversary?.response?.body?.items?.item, '#808080');
    processData(apiData.sundryDay?.response?.body?.items?.item, '#808080');

    return mergedData;
  } catch (error) {
    console.error(`${yearMonth} 샘플 다운로드 실패:`, error);
    throw error;
  }
};

// 두 개의 월 데이터 비교
const compareMonthData = (cachedMonthData, sampleMonthData) => {
  // 캐시된 데이터의 키
  const cachedKeys = Object.keys(cachedMonthData || {});
  const sampleKeys = Object.keys(sampleMonthData || {});

  // 키 개수가 다르면 변경됨
  if (cachedKeys.length !== sampleKeys.length) {
    return false; // 다름
  }

  // 모든 키를 순회하며 비교
  for (const key of sampleKeys) {
    const cachedEvents = cachedMonthData[key];
    const sampleEvents = sampleMonthData[key];

    // 캐시에 해당 날짜가 없으면 변경됨
    if (!cachedEvents) return false;

    // 이벤트 개수가 다르면 변경됨
    if (cachedEvents.length !== sampleEvents.length) return false;

    // 각 이벤트 비교 (이름만 비교)
    const cachedNames = cachedEvents.map(e => e.name).sort();
    const sampleNames = sampleEvents.map(e => e.name).sort();

    if (JSON.stringify(cachedNames) !== JSON.stringify(sampleNames)) {
      return false;
    }
  }

  return true; // 동일
};

// API 호출 함수 (재시도 로직 포함)
const fetchSpecialDatesWithRetry = async (year, month, attempt = 0) => {
  const API_KEY = import.meta.env.VITE_SPCDE_API_KEY;

  if (!API_KEY) {
    console.error('❌ VITE_SPCDE_API_KEY 환경 변수가 설정되지 않았습니다!');
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  if (!checkNetworkStatus()) {
    throw new Error('네트워크 연결이 없습니다.');
  }
  
  const urls = [
    `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo?solYear=${year}&solMonth=${month}&_type=json&serviceKey=${API_KEY}`,
    `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo?solYear=${year}&solMonth=${month}&_type=json&serviceKey=${API_KEY}`,
    `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getAnniversaryInfo?solYear=${year}&solMonth=${month}&_type=json&serviceKey=${API_KEY}`,
    `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getSundryDayInfo?solYear=${year}&solMonth=${month}&_type=json&serviceKey=${API_KEY}`
  ];
  
  try {
    const responses = await Promise.all(urls.map(url => fetch(url)));
    const data = await Promise.all(responses.map(response => response.json()));
    
    return {
      holiday: data[0],
      solarTerm: data[1],
      anniversary: data[2],
      sundryDay: data[3]
    };
  } catch (error) {
    if (attempt < MAX_RETRY_ATTEMPTS - 1) {
      const delay = RETRY_INTERVALS[attempt] || 300000;
      console.log(`API 호출 실패, ${delay}ms 후 재시도 (${attempt + 1}/${MAX_RETRY_ATTEMPTS}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchSpecialDatesWithRetry(year, month, attempt + 1);
    }
    throw error;
  }
};

// 날짜 유틸리티 함수를 파일 내부에 재정의
const getDatesInMonth = (date) => {
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

// 스타일 컴포넌트들 (기존과 동일)
const DeleteButton = styled.button`
  background-color: #5089dfff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background-color 0.2s ease;
  margin-bottom: 12px;

  &:hover {
    background-color: #5089dfff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
`;

// 확인 모달 스타일
const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 11000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmModalBox = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  width: 90vw;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.2s cubic-bezier(0.2, 0, 0, 1);

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ConfirmMessage = styled.p`
  font-size: 16px;
  color: #333;
  margin: 0;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
`;

const ConfirmButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  width: 100%;

  & > button {
    flex: 1;
  }
`;

const ConfirmCancelButton = styled.button`
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #3b78c4;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.6);
  }
`;

const ConfirmButton = styled.button`
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(150, 160, 170, 0.6);
  }
`;

const CalendarWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 14px;
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    position: relative;

    @media (min-width: 768px) {
        max-width: 95%;
        padding: 24px;
    }
    
    @media (min-width: 1024px) {
        max-width: 100%;
        padding: 32px;
    }
    
    @media (min-width: 1440px) {
        max-width: 100%;
        padding: 40px;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    /* 큰 화면에서 여백 증가 */
    @media (min-width: 768px) {
        margin-bottom: 12px;
    }
    
    @media (min-width: 1024px) {
        margin-bottom: 16px;
    }
`;

const NavContainer = styled.div`
    display: flex;
    align-items: center;
`;

const NavButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #4a90e2;
    cursor: pointer;
    padding: 0 18px;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: #f0f4ff;
    }
`;

const GoToTodayButton = styled.button`
    background-color: #4a90e2;
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    /* 반응형 크기 */
    @media (min-width: 768px) {
        padding: 8px 16px;
        font-size: 16px;
        border-radius: 24px;
    }
    
    @media (min-width: 1024px) {
        padding: 10px 20px;
        font-size: 18px;
        border-radius: 28px;
    }

    &:hover {
        background-color: #4a90e2;
    }

    ${props => props.$notTodaySelected ? `
        background-color: #ffffff !important;
        border: 2px solid #4a90e2 !important;
        color: #333333 !important;
    ` : ''}

    ${props => props.$isTodaySelected ? `
        background-color: #4a90e2 !important;
        border: 2px solid #4a90e2 !important;
        color: #fff !important;
    ` : ''}
`;

const MonthDisplay = styled.div`
    font-size: 20px;
    font-weight: 800;
    color: #333;
    cursor: pointer;
    margin: 0 8px;
    
    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 24px;
        margin: 0 12px;
    }
    
    @media (min-width: 1024px) {
        font-size: 28px;
        margin: 0 16px;
    }
    
    &:hover {
        color: #4a90e2;
    }
`;

const Weekdays = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-weight: 600;
    color: #718096;
    margin-bottom: 8px;
    gap: 0;
`;

const Day = styled.div`
    font-size: 18px;
    padding: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    
    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 20px;
        height: 36px;
        padding: 10px 0;
    }
    
    @media (min-width: 1024px) {
        font-size: 22px;
        height: 42px;
        padding: 12px 0;
    }
    
    &:nth-child(1) { color: red; }
    &:nth-child(7) { color: #3399ff; }
`;

const CalendarContainer = styled(motion.div)`
  position: relative;
  overflow: hidden;
`;

const CalendarPage = styled(motion.div)`
  width: 100%;
`;

const DatesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2;
    padding: 0 1px 1px;
    
    /* 큰 화면에서 간격 증가 */
    @media (min-width: 768px) {
        gap: 4px;
        padding: 0 2px 2px;
    }
    
    @media (min-width: 1024px) {
        gap: 6px;
        padding: 0 3px 3px;
    }
`;

const DateCell = styled.div`
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;
    border: 2px solid transparent;
    box-sizing: border-box;
    padding: 2px;
    overflow: visible;
    
    /* 반응형 폰트 크기 */
    @media (min-width: 768px) {
        font-size: 18px;
        border-radius: 10px;
        padding: 4px;
    }
    
    @media (min-width: 1024px) {
        font-size: 20px;
        border-radius: 12px;
        padding: 6px;
    }
    
    @media (min-width: 1440px) {
        font-size: 22px;
    }
    
    color: ${props => {
        if (props.$isToday && props.$isSelected) {
            return 'white';
        }
        
        if (props.$isSelected && !props.$isToday) {
            if (!props.$isCurrentMonth) {
                if (props.$isNationalHoliday || props.$dateDay === 0) {
                    return 'rgba(255, 0, 0, 0.4)';
                }
                if (props.$dateDay === 6) {
                    return 'rgba(51, 153, 255, 0.4)';
                }
                return '#cbd5e0';
            } 
            else {
                if (props.$dateDay === 0) {
                    return 'red';
                }
                if (props.$dateDay === 6) {
                    return '#3399ff';
                }
                if (props.$isNationalHoliday) {
                    return 'red';
                }
                return '#4a5568';
            }
        }
        
        if (props.$isCurrentMonth && props.$isNationalHoliday && props.$dateDay !== 0) {
            return 'red';
        }
        
        if (props.$isCurrentMonth && props.$dateDay === 0) {
            return 'red';
        }
        
        if (props.$isCurrentMonth) {
            return '#4a5568';
        }
        
        if (props.$isNationalHoliday || props.$dateDay === 0) {
            return 'rgba(255, 0, 0, 0.4)';
        }
        
        return '#cbd5e0';
    }};
    
    &:nth-child(7n) {
                color: ${props => props.$isCurrentMonth ? '#3399ff' : 'rgba(51, 153, 255, 0.4)'};
    }

    &:hover {
        transform: scale(1.05);
        background-color: #f0f8ff;
    }

    ${props => props.$isToday && props.$isSelected ? `
        background-color: #4a90e2 !important;
        color: white !important;
        font-weight: 700;
        border: 1px solid #4a90e2 !important;
        
        &:nth-child(7n+1), &:nth-child(7n) {
            color: white !important;
        }
        
        &:hover {
            background-color: #357abd !important;
            transform: scale(1.05);
        }
    ` : ''}
    
    ${props => props.$isSelected && !props.$isToday ? `
        background-color: transparent !important;
        border: 2px solid red !important;
        font-weight: 700;
        
        &:nth-child(7n) {
        color: ${props.$isCurrentMonth ? '#3399ff' : 'rgba(51, 153, 255, 0.4)'} !important;
        }
    ` : ''}

    ${props => props.$isToday && !props.$isSelected ? `
        background-color: transparent !important;
        border: 1px solid #70b3ffff !important;
        font-weight: 700;
    ` : ''}
    
    ${props => {
        const hasSchedule = props.$hasSchedule;
        const hasAlarm = props.$hasAlarm;
        const hasActiveAlarm = props.$hasActiveAlarm;
        const isCurrentMonth = props.$isCurrentMonth;
        const isPastDate = props.$isPastDate;

        // 일정 점: 파란색 (dodgerblue)
        // - 지나간 일정: 흐린 파란색 (시간 지나도 유지, 삭제 안 됨)
        let scheduleColor;
        if (isPastDate) {
            scheduleColor = 'rgba(30, 144, 255, 0.3)'; // 지나간 일정: 흐린 파란색
        } else {
            scheduleColor = isCurrentMonth ? 'dodgerblue' : 'rgba(30, 144, 255, 0.4)';
        }

        // 알람 점: 빨간색 (tomato)
        // - 활성 알람이 없으면 (모두 종료): 항상 흐린 빨간색
        // - 활성 알람이 있으면: 현재 달은 진한 빨강, 다른 달은 중간 빨강
        let alarmColor;
        if (!hasActiveAlarm) {
            alarmColor = 'rgba(255, 99, 71, 0.3)'; // 종료된 알람: 흐린 빨간색
        } else {
            alarmColor = isCurrentMonth ? 'tomato' : 'rgba(255, 99, 71, 0.4)';
        }

        if (hasSchedule && hasAlarm) {
            // 둘 다 있을 때: 상단에 나란히 5px 간격으로 배치 (등록 순서 무관, 항상 일정→알람 순서)
            return `
                &::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-7.5px); /* 일정 점 - 왼쪽(앞) */
                    width: 5px;
                    height: 5px;
                    background-color: ${scheduleColor};
                    border-radius: 50%;
                }
                &::before {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(2.5px); /* 알람 점 - 오른쪽(뒤) */
                    width: 5px;
                    height: 5px;
                    background-color: ${alarmColor};
                    border-radius: 50%;
                }
            `;
        } else if (hasSchedule) {
            // 일정만 있을 때: 상단 중앙에 파란색 점
            return `
                &::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    background-color: ${scheduleColor};
                    border-radius: 50%;
                }
            `;
        } else if (hasAlarm) {
            // 알람만 있을 때: 상단 중앙에 빨간색 점
            return `
                &::before {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    background-color: ${alarmColor};
                    border-radius: 50%;
                }
            `;
        }
        return '';
    }}
`;

const ScheduleContainer = styled.div`
    margin-top: 12px;
    padding: 18px;
    background-color: #f7f7f7;
    border-radius: 12px;
    text-align: center;
    color: #718096;
    font-size: 16px;
    
    /* 반응형 패딩과 폰트 크기 */
    @media (min-width: 768px) {
        margin-top: 16px;
        padding: 24px;
        font-size: 18px;
        border-radius: 16px;
    }
    
    @media (min-width: 1024px) {
        margin-top: 20px;
        padding: 32px;
        font-size: 20px;
        border-radius: 20px;
    }
`;

const SmallNote = styled.div`
    font-size: 12px;
    color: #9aa4b2;
    margin-top: 6px;
`;

const ScheduleInput = styled.div`
    margin-top: 12px;
    max-height: 180px;
    min-height: 180px; 
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: ${props => props.$isPastDate ? '#f1f1f1ff' : '#fff'};
    position: relative;
    box-sizing: border-box;
    
    /* 반응형 높이와 간격 */
    @media (min-width: 768px) {
        margin-top: 16px;
        max-height: 220px;
        min-height: 220px;
        gap: 12px;
        border-radius: 12px;
        border-width: 2px;
    }
    
    @media (min-width: 1024px) {
        margin-top: 20px;
        max-height: 280px;
        min-height: 280px;
        gap: 16px;
        border-radius: 16px;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: ${props => props.$isEditing ? 'none' : 'auto'};
        cursor: pointer;
    }
    
    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        width: 100%;
        align-items: stretch;
        text-align: left;
        display: ${props => props.$isEditing ? 'none' : 'flex'};
        min-height: 180px;
        padding-top: 5px;
        
        @media (min-width: 768px) {
            font-size: 16px;
            min-height: 220px;
            gap: 6px;
        }
        
        @media (min-width: 1024px) {
            font-size: 18px;
            min-height: 280px;
            gap: 8px;
        }
    }

    .special-event-note {
        color: #555;
        font-weight: 600;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 5px;
        border-bottom: 1px dashed #ddd;
        padding-bottom: 5px;
        text-align: center;
        width: 100%;
        
        @media (min-width: 768px) {
            font-size: 16px;
            margin-bottom: 8px;
            padding-bottom: 8px;
        }
        
        @media (min-width: 1024px) {
            font-size: 18px;
            margin-bottom: 10px;
            padding-bottom: 10px;
        }
    }

    .placeholder-note {
        color: #a0a0a0;
        font-size: 14px;
        text-align: center;
        padding-top: 10px;
        width: 100%;
    }

    .textarea {
        padding: 6px;
        border: none;
        width: 100%;
        font-size: 16px;
        resize: vertical;
        background-color: transparent;
        outline: none;
        user-select: auto;
        display: ${props => props.$isEditing ? 'block' : 'none'};
        box-sizing: border-box;
        text-align: left;
        padding-bottom: 12px;
        
        @media (min-width: 768px) {
            font-size: 18px;
            padding: 8px;
            padding-bottom: 16px;
        }
        
        @media (min-width: 1024px) {
            font-size: 20px;
            padding: 10px;
            padding-bottom: 20px;
        }

        ${props => props.$isHolidayText && `
            font-weight: bold;
            text-align: center;
        `}
    }

    .content-wrapper > * {
        width: 100%;
        display: block;
    }

    .buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 6px;
        display: ${props => props.$isEditing ? 'flex' : 'none'};
    }

    .buttons button {
        background-color: #4a90e2;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;

        &:hover {
            background-color: #357abd;
        }

        &:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
    }
`;

// 로딩 상태 표시 컴포넌트 - 작은 아이콘
const LoadingIndicator = styled.div`
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 20px;
    z-index: 10;
    animation: spin 1s linear infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

// 에러 표시 (디버깅용)
const ErrorIndicator = styled.div`
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: #ff4444;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ff4444;
    max-width: 80%;
    text-align: center;
`;

const today = new Date();
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

const Calendar = ({
  onSelectDate,
  addActivity,
  schedules,
  setSchedules,
  showToast,
  onRequestDelete,
  onConfirmDelete,
  onOpenCalendarConfirm,
  onOpenAlarm,
  onOpenEditor,
  onOpenDateSelector,
}) => {
    // 휴지통 컨텍스트
    const { moveToTrash } = useTrashContext();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDateSelectorModalOpen, setIsDateSelectorModalOpen] = useState(false);
    const [scheduleText, setScheduleText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [originalTextOnEdit, setOriginalTextOnEdit] = useState('');
    const textareaRef = useRef(null);
    const calendarRef = useRef(null);
    const [swipeDirection, setSwipeDirection] = useState(0);
    const touchStartX = useRef(0);
    const [isHolidayText, setIsHolidayText] = useState(false);
    const [isNationalDay, setIsNationalDay] = useState(false);
    const [isLoadingSpecialDates, setIsLoadingSpecialDates] = useState(false);

    // API 데이터를 저장할 새로운 상태를 추가합니다.
    const [specialDates, setSpecialDates] = useState({});
    const [cacheStatus, setCacheStatus] = useState({ loading: false, error: null });

    // 삭제 확인 모달 상태
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({
        isOpen: false,
        type: null, // 'schedule' 또는 'alarm'
        message: '',
        onConfirm: null
    });

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            setCurrentMonth(prev => addMonths(prev, 1));
            setSwipeDirection(1);
        },
        onSwipedRight: () => {
            setCurrentMonth(prev => subMonths(prev, 1));
            setSwipeDirection(-1);
        },
        preventScrollOnSwipe: true,
        trackTouch: true,
        trackMouse: true,
    });

    // 월별 체크 시스템을 적용한 특일 데이터 로드 함수
    const loadSpecialDatesData = async (forceUpdate = false) => {
        const cachedData = getCachedData();

        console.log('🔍 loadSpecialDatesData 호출');
        console.log('  - forceUpdate:', forceUpdate);
        console.log('  - cachedData 존재:', !!cachedData);
        if (cachedData) {
            console.log('  - cachedData.timestamp:', new Date(cachedData.timestamp));
            console.log('  - lastCheckedMonth:', cachedData.lastCheckedMonth);
            console.log('  - shouldRunMonthlyCheck:', shouldRunMonthlyCheck(cachedData));
        }

        // 캐시가 없으면 전체 다운로드
        if (!cachedData) {
            console.log('⚠️ 캐시 없음 - 전체 데이터 다운로드 시작');
            await downloadAllData();
            return;
        }

        // 캐시가 유효하고 강제 업데이트가 아니며 월별 체크 불필요한 경우
        if (!forceUpdate && !shouldRunMonthlyCheck(cachedData)) {
            setSpecialDates(cachedData.data);
            setCacheStatus({ loading: false, error: null });
            console.log('✅ 캐시된 특일 데이터 사용 (이번 달 이미 체크함)');
            return;
        }

        // 네트워크 연결 확인
        if (!checkNetworkStatus()) {
            if (cachedData && cachedData.data) {
                setSpecialDates(cachedData.data);
                setCacheStatus({ loading: false, error: '네트워크 연결 없음' });
                console.log('네트워크 연결 없음 - 기존 캐시 데이터 사용');
            }
            return;
        }

        console.log('📅 월별 체크 시작 - 현재 월부터 캐시 끝까지 샘플 비교');
        setCacheStatus({ loading: true, error: null });

        try {
            // 현재 월부터 캐시 끝까지의 월 목록 추출
            const monthsToCheck = getMonthsToCheck(cachedData);

            if (monthsToCheck.length === 0) {
                console.log('⚠️ 체크할 월이 없음 - 전체 재다운로드');
                await downloadAllData();
                return;
            }

            console.log(`📋 체크할 월 목록 (${monthsToCheck.length}개월):`, monthsToCheck);

            let hasChanges = false;
            let firstChangedMonth = null;

            // 각 월의 샘플 다운로드 및 비교
            for (const yearMonth of monthsToCheck) {
                console.log(`🔍 ${yearMonth} 샘플 체크 중...`);

                try {
                    const sampleData = await fetchMonthSample(yearMonth);

                    // 캐시에서 해당 월의 데이터만 추출
                    const cachedMonthData = {};
                    Object.keys(cachedData.data).forEach(dateKey => {
                        if (dateKey.startsWith(yearMonth)) {
                            cachedMonthData[dateKey] = cachedData.data[dateKey];
                        }
                    });

                    // 비교
                    const isIdentical = compareMonthData(cachedMonthData, sampleData);

                    if (!isIdentical) {
                        console.log(`⚠️ ${yearMonth} 변경 감지!`);
                        hasChanges = true;
                        firstChangedMonth = yearMonth;
                        break; // 변경 감지 시 즉시 중단
                    } else {
                        console.log(`✅ ${yearMonth} 변경 없음`);
                    }
                } catch (error) {
                    console.error(`${yearMonth} 샘플 체크 실패:`, error);
                    // 샘플 체크 실패 시 안전하게 전체 재다운로드
                    throw error;
                }
            }

            if (hasChanges) {
                console.log(`🔄 변경 감지 - ${firstChangedMonth}부터 전체 재다운로드`);
                await downloadFromMonth(firstChangedMonth);
            } else {
                console.log('✅ 모든 월 변경 없음 - 캐시 유지, lastCheckedMonth 갱신');

                // lastCheckedMonth만 업데이트
                const today = new Date();
                const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

                const updatedCache = {
                    ...cachedData,
                    lastCheckedMonth: currentMonth,
                    failedAttempts: 0,
                    lastFailedAttempt: null
                };

                setCachedData(updatedCache);
                setSpecialDates(cachedData.data);
                setCacheStatus({ loading: false, error: null });
                // showToast?.('특일 정보 확인 완료 (변경사항 없음)'); // 사용자에게 불필요한 메시지
            }

        } catch (error) {
            console.error('월별 체크 실패:', error);

            // 실패 정보를 캐시에 기록
            const updatedCache = {
                ...cachedData,
                lastFailedAttempt: Date.now(),
                failedAttempts: (cachedData.failedAttempts || 0) + 1
            };
            setCachedData(updatedCache);

            setCacheStatus({ loading: false, error: error.message });

            // 기존 캐시 데이터 사용
            if (cachedData && cachedData.data) {
                setSpecialDates(cachedData.data);
                showToast?.(`특일 정보 체크 실패: ${error.message}`);
            }
        }
    };

    // 전체 데이터 다운로드 (초기 또는 캐시 없을 때)
    const downloadAllData = async () => {
        console.log('📥 전체 데이터 다운로드 시작 (24개월)');
        setCacheStatus({ loading: true, error: null });

        try {
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;
            const mergedData = {};

            for (const year of [currentYear, nextYear]) {
                for (let month = 1; month <= 12; month++) {
                    try {
                        const monthStr = month.toString().padStart(2, '0');
                        const apiData = await fetchSpecialDatesWithRetry(year, monthStr);

                        const processData = (items, color, isNationalDay = false) => {
                            const processedItems = Array.isArray(items) ? items : (items ? [items] : []);

                            processedItems.forEach(item => {
                                const date = String(item.locdate);
                                const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
                                if (!mergedData[formattedDate]) {
                                    mergedData[formattedDate] = [];
                                }
                                mergedData[formattedDate].push({ name: item.dateName, color, isNationalDay });
                            });
                        };

                        processData(apiData.holiday?.response?.body?.items?.item, 'red', true);
                        processData(apiData.solarTerm?.response?.body?.items?.item, '#808080');
                        processData(apiData.anniversary?.response?.body?.items?.item, '#808080');
                        processData(apiData.sundryDay?.response?.body?.items?.item, '#808080');

                        const progress = ((year - currentYear) * 12 + month) / 24 * 100;
                        console.log(`특일 데이터 로딩 진행률: ${Math.round(progress)}%`);

                    } catch (monthError) {
                        console.error(`${year}-${month} 데이터 로딩 실패:`, monthError);
                    }
                }
            }

            const newCacheData = createCacheData(mergedData);
            setCachedData(newCacheData);
            setSpecialDates(mergedData);
            setCacheStatus({ loading: false, error: null });

            console.log('특일 데이터 다운로드 완료:', new Date());
            // showToast?.('특일 정보가 업데이트되었습니다.'); // 사용자에게 불필요한 메시지

        } catch (error) {
            console.error('전체 데이터 다운로드 실패:', error);
            setCacheStatus({ loading: false, error: error.message });
            showToast?.(`특일 정보 다운로드 실패: ${error.message}`);
        }
    };

    // 특정 월부터 끝까지 다운로드 (변경 감지 시)
    const downloadFromMonth = async (startYearMonth) => {
        console.log(`📥 ${startYearMonth}부터 끝까지 재다운로드 시작`);
        setCacheStatus({ loading: true, error: null });

        try {
            const [startYear, startMonth] = startYearMonth.split('-').map(Number);
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;

            const cachedData = getCachedData();

            // ✅ 새로운 임시 데이터 객체 (기존 캐시는 건드리지 않음)
            const newMergedData = {};

            // 과거 데이터 (startYearMonth 이전)는 기존 캐시에서 복사
            Object.keys(cachedData.data).forEach(dateKey => {
                if (dateKey < startYearMonth) {
                    newMergedData[dateKey] = cachedData.data[dateKey];
                }
            });

            console.log(`📦 과거 데이터 ${Object.keys(newMergedData).length}개 복사 완료`);

            // startYearMonth부터 내년 12월까지 다운로드
            let downloading = false;

            for (const year of [currentYear, nextYear]) {
                for (let month = 1; month <= 12; month++) {
                    // startYearMonth부터 시작
                    if (year === startYear && month < startMonth) continue;
                    if (year === startYear && month === startMonth) downloading = true;
                    if (!downloading) continue;

                    try {
                        const monthStr = month.toString().padStart(2, '0');
                        const apiData = await fetchSpecialDatesWithRetry(year, monthStr);

                        const processData = (items, color, isNationalDay = false) => {
                            const processedItems = Array.isArray(items) ? items : (items ? [items] : []);

                            processedItems.forEach(item => {
                                const date = String(item.locdate);
                                const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
                                if (!newMergedData[formattedDate]) {
                                    newMergedData[formattedDate] = [];
                                }
                                newMergedData[formattedDate].push({ name: item.dateName, color, isNationalDay });
                            });
                        };

                        processData(apiData.holiday?.response?.body?.items?.item, 'red', true);
                        processData(apiData.solarTerm?.response?.body?.items?.item, '#808080');
                        processData(apiData.anniversary?.response?.body?.items?.item, '#808080');
                        processData(apiData.sundryDay?.response?.body?.items?.item, '#808080');

                        console.log(`${year}-${monthStr} 다운로드 완료`);

                    } catch (monthError) {
                        console.error(`${year}-${month} 데이터 로딩 실패:`, monthError);
                        // 개별 월 실패는 계속 진행 (부분 실패 허용)
                    }
                }
            }

            // ✅ 모든 다운로드 완료 후 한 번에 저장 (원자적 업데이트)
            const newCacheData = createCacheData(newMergedData);
            setCachedData(newCacheData);
            setSpecialDates(newMergedData);
            setCacheStatus({ loading: false, error: null });

            console.log('부분 재다운로드 완료:', new Date());
            console.log(`✅ lastCheckedMonth 갱신됨 → ${newCacheData.lastCheckedMonth}`);
            // showToast?.('특일 정보가 업데이트되었습니다.'); // 사용자에게 불필요한 메시지

        } catch (error) {
            console.error('부분 재다운로드 실패:', error);
            setCacheStatus({ loading: false, error: error.message });

            // ⚠️ 실패 시 lastCheckedMonth는 갱신되지 않음 → 다음 실행 시 재시도
            const cachedData = getCachedData();
            if (cachedData) {
                const updatedCache = {
                    ...cachedData,
                    lastFailedAttempt: Date.now(),
                    failedAttempts: (cachedData.failedAttempts || 0) + 1
                };
                setCachedData(updatedCache);
            }

            showToast?.(`특일 정보 업데이트 실패: ${error.message}`);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadSpecialDatesData();
    }, []); // 한 번만 실행

    // 로딩 상태 타임아웃 (10초 후 강제 종료)
    useEffect(() => {
        if (cacheStatus.loading) {
            const timeout = setTimeout(() => {
                console.log('로딩 타임아웃 - 강제 종료');
                setCacheStatus({ loading: false, error: '타임아웃' });
                showToast?.('특일 정보 로딩 시간 초과 - API 호출 실패');
            }, 10000); // 10초

            return () => clearTimeout(timeout);
        }
    }, [cacheStatus.loading]);

    // 앱 포커스 시 재시도 로직
    useEffect(() => {
        const handleFocus = () => {
            const cachedData = getCachedData();
            if (cachedData && cachedData.failedAttempts > 0) {
                console.log('앱 포커스 - 실패한 업데이트 재시도');
                loadSpecialDatesData(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const getSpecialEvents = (date) => {
        const events = [];
        const dateKey = format(date, 'yyyy-MM-dd');
        const monthlyKey = format(date, 'MM-dd');
        const dayKey = format(date, 'd');

        // 공휴일, 24절기, 기념일 등 API에서 가져온 데이터 확인
        const specialDateArr = specialDates[dateKey];
        if (Array.isArray(specialDateArr)) {
            specialDateArr.forEach(d =>
                events.push({ 
                    text: d.name, 
                    color: d.color, 
                    isNationalDay: d.isNationalDay || false
                })
            );
        }

        // 개인 기념일 확인 (수동 데이터)
        const personalEvent = PERSONAL_EVENTS[dateKey] || PERSONAL_EVENTS[monthlyKey] || PERSONAL_EVENTS[dayKey];
        if (personalEvent) {
            events.push({ text: personalEvent.name, color: '#007BFF', isNationalDay: false });
        }

        return events;
    };

    const isNationalHoliday = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const specialDateArr = specialDates[dateKey];
        if (Array.isArray(specialDateArr)) {
            return specialDateArr.some(d => d.isNationalDay === true);
        }
        return false;
    };

    useEffect(() => {
        if (!selectedDate) {
            setScheduleText("");
            setOriginalTextOnEdit("");
            setIsHolidayText(false);
            return;
        }

        const key = format(selectedDate, "yyyy-MM-dd");
        const entry = schedules[key];
        const specialDate = specialDates[key];

        if (entry && entry.text.trim().length > 0) {
            setScheduleText(entry.text);
            setOriginalTextOnEdit(entry.text);
            setIsHolidayText(false);
        } else {
            setScheduleText("");
            setIsHolidayText(false);
            setIsNationalDay(false);
            setOriginalTextOnEdit("");
        }
    }, [schedules, selectedDate]);

    const hasSchedule = (date) => {
        const key = format(date, 'yyyy-MM-dd');
        const entry = schedules[key];
        // 일정 텍스트가 있고 비어있지 않은 경우에만 true
        return entry && entry.text && entry.text.trim().length > 0;
    };

    const hasAlarm = (date) => {
        const key = format(date, 'yyyy-MM-dd');
        const entry = schedules[key];

        // 1. 해당 날짜에 직접 등록된 알람 확인 (일반 알람, 활성/비활성 모두)
        const hasDirectAlarm = entry && entry.alarm && entry.alarm.registeredAlarms &&
                              entry.alarm.registeredAlarms.length > 0;

        if (hasDirectAlarm) return true;

        // 2. 기념일 알람 확인 - 모든 날짜의 기념일을 순회하면서 오늘이 반복 날짜인지 확인
        for (const scheduleKey in schedules) {
            const scheduleEntry = schedules[scheduleKey];
            if (!scheduleEntry?.alarm?.registeredAlarms) continue;

            const anniversaryAlarms = scheduleEntry.alarm.registeredAlarms.filter(
                alarm => alarm.isAnniversary
            );

            for (const alarm of anniversaryAlarms) {
                const alarmDate = new Date(alarm.calculatedTime);
                const targetDate = new Date(date);

                // 기념일 반복 로직 확인
                if (alarm.anniversaryRepeat === 'daily') {
                    return true;
                } else if (alarm.anniversaryRepeat === 'weekly') {
                    if (alarmDate.getDay() === targetDate.getDay()) {
                        return true;
                    }
                } else if (alarm.anniversaryRepeat === 'monthly') {
                    if (alarmDate.getDate() === targetDate.getDate()) {
                        return true;
                    }
                } else if (alarm.anniversaryRepeat === 'yearly') {
                    if (alarmDate.getMonth() === targetDate.getMonth() &&
                        alarmDate.getDate() === targetDate.getDate()) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    const hasActiveAlarm = (date) => {
        const key = format(date, 'yyyy-MM-dd');
        const entry = schedules[key];

        // 1. 해당 날짜에 직접 등록된 활성 알람 확인 (일반 알람)
        const hasDirectActiveAlarm = entry && entry.alarm && entry.alarm.registeredAlarms &&
                                     entry.alarm.registeredAlarms.some(alarm => alarm.enabled !== false);

        if (hasDirectActiveAlarm) return true;

        // 2. 기념일 알람 확인 - 활성화된 기념일만
        for (const scheduleKey in schedules) {
            const scheduleEntry = schedules[scheduleKey];
            if (!scheduleEntry?.alarm?.registeredAlarms) continue;

            const anniversaryAlarms = scheduleEntry.alarm.registeredAlarms.filter(
                alarm => alarm.isAnniversary && alarm.enabled !== false
            );

            for (const alarm of anniversaryAlarms) {
                const alarmDate = new Date(alarm.calculatedTime);
                const targetDate = new Date(date);

                // 기념일 반복 로직 확인
                if (alarm.anniversaryRepeat === 'daily') {
                    return true;
                } else if (alarm.anniversaryRepeat === 'weekly') {
                    if (alarmDate.getDay() === targetDate.getDay()) {
                        return true;
                    }
                } else if (alarm.anniversaryRepeat === 'monthly') {
                    if (alarmDate.getDate() === targetDate.getDate()) {
                        return true;
                    }
                } else if (alarm.anniversaryRepeat === 'yearly') {
                    if (alarmDate.getMonth() === targetDate.getMonth() &&
                        alarmDate.getDate() === targetDate.getDate()) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    const handleGoToToday = () => {
        const todayDate = new Date();
        setCurrentMonth(new Date(todayDate));
        setSelectedDate(new Date(todayDate));
        const key = format(todayDate, 'yyyy-MM-dd');
        const entry = schedules[key];
        setScheduleText(entry?.text || '');
        setIsEditing(false);
        if (onSelectDate) {
            onSelectDate(new Date(todayDate));
        }
    };

    const handleDateClick = (date) => {
        const newSelectedDate = new Date(date);
        setSelectedDate(newSelectedDate);
        const key = format(newSelectedDate, 'yyyy-MM-dd');
        const entry = schedules[key];
        setScheduleText(entry?.text || '');
        setIsEditing(false);
        setOriginalTextOnEdit(entry?.text || '');
        if (onSelectDate) {
            onSelectDate(newSelectedDate);
        }
    };

    const handleDateSelect = (year, month) => {
        const newDate = new Date(year, month, 1);
        setCurrentMonth(new Date(newDate));
        setSelectedDate(new Date(newDate));
        const key = format(newDate, 'yyyy-MM-dd');
        const entry = schedules[key];
        setScheduleText(entry?.text || '');
        setIsEditing(false);
        setOriginalTextOnEdit(entry?.text || '');
        if (onSelectDate) {
            onSelectDate(new Date(newDate));
        }
        setIsDateSelectorModalOpen(false);
    };

    const enableAdd = () => {
        const key = format(selectedDate, 'yyyy-MM-dd');
        const has = !!schedules[key];
        return !has && isEditing && scheduleText.trim().length > 0;
    };

    const enableUpdate = () => {
        const key = format(selectedDate, 'yyyy-MM-dd');
        const has = !!schedules[key];
        if (!has) return false;

        if (isEditing) {
            const before = (originalTextOnEdit ?? '');
            const after = scheduleText;
            if (before !== after || after.trim() === '') {
                return true;
            }
        }
        return false;
    };

    const enableDelete = () => {
        const key = format(selectedDate, 'yyyy-MM-dd');
        return !!schedules[key];
    };

    const handleAddSchedule = () => {
        if (!scheduleText.trim()) return;
        const key = format(selectedDate, 'yyyy-MM-dd');
        const now = Date.now();
        const payload = { text: scheduleText, createdAt: now, updatedAt: now };
        setSchedules(prev => ({
            ...prev,
            [key]: payload
        }));
        setIsEditing(false);
        setOriginalTextOnEdit(scheduleText);
        if (typeof addActivity === 'function') {
            addActivity('스케줄 등록', `${format(selectedDate, 'yyyy-MM-dd')} - ${scheduleText}`);
            showToast?.('스케줄이 등록되었습니다 ✅');
        }
    };

    const handleUpdateSchedule = () => {
        if (!selectedDate) return;
        const key = format(selectedDate, 'yyyy-MM-dd');

        if (scheduleText.trim() === "") {
            setSchedules(prev => {
                const copy = { ...prev };
                delete copy[key];
                return copy;
            });
            showToast("스케줄이 삭제되었습니다.");
            return;
        }

        setSchedules(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                text: scheduleText,
                updatedAt: Date.now(),
            },
        }));
        showToast("스케줄이 수정되었습니다.");
    };

    const handleDeleteRequest = () => {
        const key = format(selectedDate, 'yyyy-MM-dd');
        if (schedules[key]) {
            onRequestDelete(selectedDate);
        }
    };

    const handleInputTouch = () => {
        if (!isHolidayText) {
            setIsEditing(true);
            setOriginalTextOnEdit(scheduleText ?? '');
            setTimeout(() => {
                if (textareaRef.current) textareaRef.current.focus();
            }, 0);
        } else {
            setIsEditing(true);
            setScheduleText("");
            setIsHolidayText(false);
            setTimeout(() => {
                if (textareaRef.current) textareaRef.current.focus();
            }, 0);
        }
    };

    const notTodaySelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');
    const isTodaySelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

    const key = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    const currentEntry = key ? schedules[key] : null;
    const specialEvents = getSpecialEvents(selectedDate);

    const handleDelete = () => {
        if (currentEntry) {
            onRequestDelete(selectedDate);
        }
    };

    // 일정 삭제 실행 함수 (내부)
    const executeDeleteScheduleOnly = () => {
        // 일정 텍스트만 삭제, 알람은 보존 (휴지통으로 이동)
        if (!currentEntry) return;

        const key = format(selectedDate, 'yyyy-MM-dd');
        const hasAlarms = currentEntry.alarm && currentEntry.alarm.registeredAlarms && currentEntry.alarm.registeredAlarms.length > 0;

        // 휴지통으로 이동
        moveToTrash(
            key, // ID로 날짜 키 사용
            'schedule', // 타입
            currentEntry.text || '내용 없음', // 미리보기 내용
            {
                date: selectedDate.toISOString(),
                text: currentEntry.text,
                createdAt: currentEntry.createdAt,
                updatedAt: currentEntry.updatedAt,
                // 알람은 원본 데이터에 포함하지 않음 (알람은 유지되므로)
            }
        );

        setSchedules((prevSchedules) => {
            const updatedSchedules = { ...prevSchedules };

            if (updatedSchedules[key]) {
                if (hasAlarms) {
                    // 알람이 있으면 텍스트만 빈 문자열로
                    updatedSchedules[key] = {
                        ...updatedSchedules[key],
                        text: '',
                        updatedAt: Date.now()
                    };
                } else {
                    // 알람이 없으면 전체 삭제
                    delete updatedSchedules[key];
                }
            }

            return updatedSchedules;
        });

        setScheduleText('');
        setIsEditing(false);
        showToast('일정이 휴지통으로 이동되었습니다.');
    };

    // 일정 삭제 버튼 클릭 핸들러 (확인 모달 표시)
    const handleDeleteScheduleOnly = () => {
        if (!currentEntry) return;

        setDeleteConfirmModal({
            isOpen: true,
            type: 'schedule',
            message: '해당 날짜의 일정을 삭제할까요?',
            onConfirm: () => {
                executeDeleteScheduleOnly();
                setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null });
            }
        });
    };

    // 알람 삭제 실행 함수 (내부)
    const executeDeleteAlarmOnly = () => {
        // 일반 알람만 삭제, 기념일 알람과 일정 텍스트는 보존
        if (!currentEntry || !currentEntry.alarm) return;

        const key = format(selectedDate, 'yyyy-MM-dd');

        setSchedules((prevSchedules) => {
            const updatedSchedules = { ...prevSchedules };

            if (updatedSchedules[key] && updatedSchedules[key].alarm) {
                // 기념일 알람만 필터링하여 남김
                const anniversaryAlarms = updatedSchedules[key].alarm.registeredAlarms?.filter(alarm =>
                    alarm.isAnniversary
                ) || [];

                if (anniversaryAlarms.length > 0) {
                    // 기념일 알람이 있으면 기념일 알람만 보존
                    updatedSchedules[key] = {
                        ...updatedSchedules[key],
                        alarm: {
                            ...updatedSchedules[key].alarm,
                            registeredAlarms: anniversaryAlarms
                        },
                        updatedAt: Date.now()
                    };
                } else {
                    // 기념일 알람이 없으면 alarm 필드 완전히 제거
                    const { alarm, ...restOfEntry } = updatedSchedules[key];
                    updatedSchedules[key] = {
                        ...restOfEntry,
                        updatedAt: Date.now()
                    };
                }
            }

            return updatedSchedules;
        });

        showToast('일반 알람이 삭제되었습니다.');
    };

    // 비활성화된 알람만 삭제 (과거 날짜용)
    const executeDeleteDisabledAlarmsOnly = () => {
        const key = format(selectedDate, 'yyyy-MM-dd');
        const currentSchedule = schedules[key];

        if (!currentSchedule || !currentSchedule.alarm) return;

        // 기념일 알람과 활성화된 알람만 유지
        const remainingAlarms = currentSchedule.alarm.registeredAlarms?.filter(alarm =>
            alarm.isAnniversary || alarm.enabled !== false
        ) || [];

        if (remainingAlarms.length === currentSchedule.alarm.registeredAlarms.length) {
            showToast('삭제할 종료된 알람이 없습니다.');
            return;
        }

        onSave(key, {
            ...currentSchedule,
            alarm: {
                ...currentSchedule.alarm,
                registeredAlarms: remainingAlarms
            }
        });

        showToast('종료된 알람이 삭제되었습니다.');
    };

    // 알람 삭제 버튼 클릭 핸들러 (확인 모달 표시)
    const handleDeleteAlarmOnly = () => {
        if (!currentEntry || !currentEntry.alarm) return;

        const today = startOfDay(new Date());
        const selectedDay = startOfDay(selectedDate);
        const isPastDate = isBefore(selectedDay, today);

        // 과거 날짜인 경우 종료된 알람만 삭제, 아니면 모든 알람 삭제
        const message = isPastDate
            ? '종료된 알람을 모두 삭제 할까요?'
            : '해당 날짜의 모든 알람을 삭제할까요?';

        setDeleteConfirmModal({
            isOpen: true,
            type: 'alarm',
            message: message,
            onConfirm: () => {
                if (isPastDate) {
                    executeDeleteDisabledAlarmsOnly();
                } else {
                    executeDeleteAlarmOnly();
                }
                setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null });
            }
        });
    };
    
    const handleAlarmClick = () => {
        const today = startOfDay(new Date());
        const selectedDay = startOfDay(selectedDate);

        // 과거 날짜에도 알람창 열기 (단, 모달에서 isPastDate를 전달하여 처리)
        if (onOpenAlarm) {
            const entryData = currentEntry || { text: '', createdAt: Date.now(), updatedAt: Date.now() };
            const isPastDate = isBefore(selectedDay, today);
            const dataToPass = { ...entryData, date: selectedDate, isPastDate };
            onOpenAlarm(dataToPass);
        }
    };

    const formatTs = (ts) => {
        try {
            return format(new Date(ts), 'yyyy년 M월 d일 HH:mm', { locale: ko });
        } catch (e) {
            return '-';
        }
    };
    
    const pageVariants = {
        enter: (direction) => {
            return {
                x: direction > 0 ? "100%" : "-100%",
                opacity: 0,
                position: 'absolute'
            };
        },
        center: {
            x: "0%",
            opacity: 1,
            position: 'relative'
        },
        exit: (direction) => {
            return {
                x: direction > 0 ? "-100%" : "100%",
                opacity: 0,
                position: 'absolute'
            };
        }
    };
    
    const dates = getDatesInMonth(currentMonth);
    const hasCurrentDateSchedule = currentEntry && currentEntry.text && currentEntry.text.trim() !== '';

    return (
        <CalendarWrapper {...swipeHandlers}>
            {/* 로딩 중일 때 작은 스피너 아이콘 표시 */}
            {cacheStatus.loading && (
                <LoadingIndicator title="특일 정보 로딩 중...">
                    ⏳
                </LoadingIndicator>
            )}

            {/* 에러 상태 표시 (디버깅용) */}
            {cacheStatus.error && (
                <ErrorIndicator>
                    ⚠️ {cacheStatus.error}
                </ErrorIndicator>
            )}

            <Header>
                <NavContainer>
                    <NavButton onClick={() => {
                        setCurrentMonth(prev => subMonths(prev, 1));
                        setSwipeDirection(-1);
                    }}>&lt;</NavButton>
                        <MonthDisplay onClick={() => setIsDateSelectorModalOpen(true)}>
                            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                        </MonthDisplay>
                    <NavButton onClick={() => {
                        setCurrentMonth(prev => addMonths(prev, 1));
                        setSwipeDirection(1);
                    }}>&gt;</NavButton>
                </NavContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 수동 업데이트 버튼 */}
                    {/*
                    <button
                        onClick={() => loadSpecialDatesData(true)}
                        disabled={cacheStatus.loading}
                        style={{
                            background: 'none',
                            border: '1px solid #4a90e2',
                            color: '#4a90e2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: cacheStatus.loading ? 'not-allowed' : 'pointer',
                            opacity: cacheStatus.loading ? 0.5 : 1
                        }}
                        title="특일 정보 수동 업데이트"
                    >
                         📅 업데이트
                    </button>
                    */}
                    <GoToTodayButton 
                        onClick={handleGoToToday} 
                        $notTodaySelected={notTodaySelected}
                        $isTodaySelected={isTodaySelected}
                    >
                        오늘
                    </GoToTodayButton>
                </div>
            </Header>
            
            <CalendarContainer layout>
                <AnimatePresence initial={false} custom={swipeDirection}>
                    <CalendarPage
                        key={format(currentMonth, 'yyyyMM')}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                    >
                        <Weekdays>
                            {weekdays.map(day => (
                                <Day key={day}>{day}</Day>
                            ))}
                        </Weekdays>
                        <DatesGrid>
                            {dates.map((date, index) => {
                                const isToday = isSameDay(date, today);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isSchedule = hasSchedule(date);
                                const isAlarm = hasAlarm(date);
                                const isActiveAlarm = hasActiveAlarm(date);
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const isPastDate = isBefore(startOfDay(date), startOfDay(today));
                                const isHoliday = isNationalHoliday(date);

                                return (
                                    <DateCell
                                        key={`${dateKey}-${index}`}
                                        $isCurrentMonth={date.getMonth() === currentMonth.getMonth()}
                                        $isToday={isToday}
                                        $isSelected={isSelected}
                                        $hasSchedule={isSchedule}
                                        $hasAlarm={isAlarm}
                                        $hasActiveAlarm={isActiveAlarm}
                                        $isNationalHoliday={isHoliday}
                                        $dateDay={date.getDay()}
                                        $isPastDate={isPastDate}
                                        onClick={() => handleDateClick(date)}
                                    >
                                        {date.getDate()}
                                    </DateCell>
                                );
                            })}
                        </DatesGrid>
                    </CalendarPage>
                </AnimatePresence>
            </CalendarContainer>

            {selectedDate && (
                <ScheduleContainer>
                    <div 
                        style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        marginBottom: "8px"
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <button
                                onClick={() => onOpenEditor?.(selectedDate, scheduleText)}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                title="편집창 열기"
                            >
                                <Copy size={24} color="dodgerblue" style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.4))" }} />
                            </button>
                            <span style={{ fontSize: "12px", color: "#888" }}>일정</span>
                        </div>

                        <div style={{ textAlign: "center" }}>
                        {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 스케줄
                        <SmallNote>(오늘: {format(today, 'yyyy년 M월 d일', { locale: ko })})</SmallNote>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <button 
                            onClick={handleAlarmClick}
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                            title="알람 설정"
                        >
                            <Bell size={24} color="tomato" style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.4))" }} />
                        </button>
                        <span style={{ fontSize: "12px", color: "#888" }}>알람</span>
                        </div>
                    </div>
                    <ScheduleInput
                        $isEditing={isEditing}
                        $isPastDate={isBefore(startOfDay(selectedDate), startOfDay(today))}
                        onDoubleClick={() => onOpenEditor?.(selectedDate, scheduleText)}
                    >
                        {isEditing ? (
                            <textarea
                                ref={textareaRef}
                                value={scheduleText}
                                onChange={(e) => setScheduleText(e.target.value)}
                                style={{
                                    height: "180px",
                                    overflowY: "auto",
                                }}
                            />
                        ) : (
                        <div className="content-wrapper" onDoubleClick={() => onOpenEditor?.(selectedDate, scheduleText)}>
                            {/* 기념일과 특일을 같은 줄에 표시 */}
                            {(() => {
                                // 등록된 알람 중에서 기념일 알람들을 추출
                                const anniversaryAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    alarm.isAnniversary && (alarm.anniversaryName || alarm.title)
                                ) || [];

                                const hasAnniversaries = anniversaryAlarms.length > 0;
                                const hasSpecialEvents = specialEvents.length > 0;

                                if (!hasAnniversaries && !hasSpecialEvents) return null;

                                return (
                                    <div className="special-event-note" style={{ marginBottom: '4px' }}>
                                        {/* 기념일들을 먼저 표시 (파란색) */}
                                        {anniversaryAlarms.map((alarm, index) => (
                                            <span key={`anniversary-${alarm.id || index}`}>
                                                <span style={{ color: '#4a90e2' }}>
                                                    {alarm.anniversaryName || alarm.title}
                                                </span>
                                                {(index < anniversaryAlarms.length - 1 || hasSpecialEvents) && <span> · </span>}
                                            </span>
                                        ))}
                                        {/* 특일들을 나중에 표시 */}
                                        {specialEvents.map((event, index) => (
                                            <span key={`special-${index}`} style={{ color: event.color }}>
                                                {event.text}{index < specialEvents.length - 1 ? ' · ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* 알람 목록 - 간결하게 표시 (기념일 알람은 제외) */}
                            {(() => {
                                // 기념일이 아닌 일반 알람들만 필터링
                                const regularAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    !alarm.isAnniversary
                                ) || [];

                                if (regularAlarms.length === 0) return null;

                                const today = startOfDay(new Date());
                                const selectedDay = startOfDay(selectedDate);
                                const isPastDate = isBefore(selectedDay, today);

                                return (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        marginBottom: '8px',
                                        paddingLeft: '3px'
                                    }}>
                                        {regularAlarms.map((alarm, index) => {
                                            // 비활성화된 알람인지 확인 (과거 날짜가 아니어도)
                                            const isTerminated = alarm.enabled === false;

                                            // 자동삭제까지 남은 일수 계산
                                            let daysUntilDeletion = null;
                                            if (isTerminated && alarm.disabledAt) {
                                                const disabledDate = new Date(alarm.disabledAt);
                                                const deletionDate = new Date(disabledDate);
                                                deletionDate.setDate(deletionDate.getDate() + 7);
                                                const todayStart = startOfDay(new Date());
                                                const deletionStart = startOfDay(deletionDate);
                                                daysUntilDeletion = Math.ceil((deletionStart - todayStart) / (1000 * 60 * 60 * 24));
                                                if (daysUntilDeletion < 0) daysUntilDeletion = 0;
                                            }

                                            return (
                                                <div key={alarm.id || index} style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '6px',
                                                    lineHeight: '1.3'
                                                }}>
                                                    <AlarmClock
                                                        size={14}
                                                        color={isTerminated ? 'rgba(214, 48, 49, 0.3)' : '#d63031'}
                                                        style={{ marginTop: '2px', flexShrink: 0 }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{
                                                            fontSize: '13px',
                                                            color: isTerminated ? 'rgba(51, 51, 51, 0.3)' : '#333'
                                                        }}>
                                                            {alarm.title || '제목 없음'}
                                                            {isTerminated && <span style={{ color: 'rgba(153, 153, 153, 0.5)' }}> - 종료된 알람</span>}
                                                        </span>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: isTerminated ? 'rgba(153, 153, 153, 0.3)' : '#999'
                                                        }}>
                                                            {format(new Date(alarm.calculatedTime), 'HH:mm')}
                                                            {isTerminated && daysUntilDeletion !== null && (
                                                                <span> · {daysUntilDeletion}일후 자동삭제</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {scheduleText ? (
                                <span style={{
                                    whiteSpace: 'pre-wrap',
                                    color: '#4a5568',
                                    display: 'block',
                                    paddingBottom: '12px',
                                    padding: '0 5px 12px 5px'   // ✅ 위0, 오른쪽5, 아래12, 왼쪽5
                                  }}
                                >
                                    {scheduleText}
                                </span>
                            ) : (
                                <div className="placeholder-note">
                                    스케줄을 입력하거나 수정하려면 좌상단의 '일정' 버튼을 터치하거나 여기를 '더블탭' 하세요
                                </div>
                            )}
                        </div>
                        )}
                    </ScheduleInput>
                    <SmallNote style={{ textAlign: 'left', marginTop: 10, marginLeft: 0 }}>
                    {currentEntry ? (
                        <>
                        <ButtonGroup>
                            {/* 일정 텍스트가 있으면 스케줄 삭제 버튼 표시 */}
                            {currentEntry.text && currentEntry.text.trim() && (
                                <DeleteButton onClick={handleDeleteScheduleOnly}>
                                    일정 삭제
                                </DeleteButton>
                            )}
                            {/* 일반 알람이 있으면 알람 삭제 버튼 표시 (기념일 알람 제외) */}
                            {(() => {
                                const today = startOfDay(new Date());
                                const selectedDay = startOfDay(selectedDate);
                                const isPastDate = isBefore(selectedDay, today);

                                const regularAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    !alarm.isAnniversary
                                ) || [];

                                // 과거 날짜든 현재/미래 날짜든 일반 알람이 있으면 삭제 버튼 표시
                                return regularAlarms.length > 0;
                            })() && (
                                <DeleteButton onClick={handleDeleteAlarmOnly} style={{ backgroundColor: '#ff6b6b' }}>
                                    알람 삭제
                                </DeleteButton>
                            )}
                        </ButtonGroup>
                        {/* 일정 텍스트가 있을 때만 작성일/수정일 표시 */}
                        {currentEntry.text && currentEntry.text.trim() && (
                            <>
                            · 처음 작성일: {formatTs(currentEntry?.createdAt)} <br />
                            · 마지막 수정일: {formatTs(currentEntry?.updatedAt)}
                            </>
                        )}
                        </>
                    ) : (
                        <>· 해당 날짜에는 스케줄이 없습니다.</>
                    )}
                    </SmallNote>
                </ScheduleContainer>
            )}
            <ImprovedDateSelector
                isOpen={isDateSelectorModalOpen}
                onClose={() => setIsDateSelectorModalOpen(false)}
                onSelect={handleDateSelect}
                initialYear={currentMonth.getFullYear()}
                initialMonth={currentMonth.getMonth()}
            />

            {/* 삭제 확인 모달 */}
            {deleteConfirmModal.isOpen && (
                <ConfirmOverlay onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null })}>
                    <ConfirmModalBox onClick={e => e.stopPropagation()}>
                        <ConfirmMessage>{deleteConfirmModal.message}</ConfirmMessage>
                        <ConfirmButtonWrapper>
                            <ConfirmCancelButton onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null })}>
                                아니요
                            </ConfirmCancelButton>
                            <ConfirmButton onClick={deleteConfirmModal.onConfirm}>
                                예
                            </ConfirmButton>
                        </ConfirmButtonWrapper>
                    </ConfirmModalBox>
                </ConfirmOverlay>
            )}
        </CalendarWrapper>
    );
};

export default Calendar;