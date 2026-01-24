import React, { useState, useEffect, useRef } from 'react';
import { ko } from 'date-fns/locale';
import ImprovedDateSelector from './DateSelectorModal.jsx';
import { Copy, Bell, AlarmClock } from "lucide-react";
import { format, isBefore, startOfDay, addDays, subMonths, addMonths, subDays, isSameDay } from 'date-fns';
import { AnimatePresence } from "framer-motion";
import { useSwipeable } from 'react-swipeable';
import { useTrashContext } from '../../contexts/TrashContext';
import { AUTO_DELETE_DAYS, ALARM_COLORS } from './alarm/constants/alarmConstants';
import { hasAlarm, hasActiveAlarm, isAutoDeleted, getRepeatedAnniversaries } from './utils';
import { saveCalendarDateToFirestore } from '../../services/userData';
import * as S from './Calendar.styles';

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

        if (entry && entry.text && entry.text.trim().length > 0) {
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

    // 자동삭제된 알람을 실제로 제거하는 useEffect
    useEffect(() => {
        const cleanupExpiredAlarms = () => {
            const now = new Date();
            let hasChanges = false;
            const updatedSchedules = { ...schedules };

            // 모든 날짜의 알람을 순회하면서 자동삭제 기간이 지난 알람 제거
            for (const dateKey in updatedSchedules) {
                const entry = updatedSchedules[dateKey];
                if (!entry?.alarm?.registeredAlarms) continue;

                const filteredAlarms = entry.alarm.registeredAlarms.filter(alarm => {
                    // 종료되지 않은 알람은 유지
                    if (!alarm.disabledAt) return true;

                    // 자동삭제 기간 계산
                    const disabledDate = new Date(alarm.disabledAt);
                    const deletionDate = new Date(disabledDate);
                    deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);

                    // 삭제 기간이 지나지 않았으면 유지
                    return now < deletionDate;
                });

                // 알람이 제거되었으면 업데이트
                if (filteredAlarms.length !== entry.alarm.registeredAlarms.length) {
                    hasChanges = true;
                    updatedSchedules[dateKey] = {
                        ...entry,
                        alarm: {
                            ...entry.alarm,
                            registeredAlarms: filteredAlarms
                        }
                    };
                }
            }

            // 변경사항이 있으면 저장
            if (hasChanges) {
                setSchedules(updatedSchedules);
            }
        };

        // 컴포넌트 마운트 시 한 번 실행
        cleanupExpiredAlarms();

        // 매일 자정에 실행되도록 타이머 설정
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;

        const midnightTimer = setTimeout(() => {
            cleanupExpiredAlarms();

            // 이후 24시간마다 반복
            const dailyInterval = setInterval(cleanupExpiredAlarms, 24 * 60 * 60 * 1000);
            return () => clearInterval(dailyInterval);
        }, msUntilMidnight);

        return () => clearTimeout(midnightTimer);
    }, [schedules, setSchedules]);

    const hasSchedule = (date) => {
        const key = format(date, 'yyyy-MM-dd');
        const entry = schedules[key];
        // 일정 텍스트가 있고 비어있지 않은 경우에만 true
        return entry && entry.text && entry.text.trim().length > 0;
    };

    // hasAlarm, hasActiveAlarm 함수는 utils로 이동됨
    // 사용 시: hasAlarm(date, schedules), hasActiveAlarm(date, schedules)

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
        const existingEntry = schedules[key];

        // 기존 알람이 있으면 유지, 없으면 새로 생성
        const payload = existingEntry && existingEntry.alarm
            ? { ...existingEntry, text: scheduleText, createdAt: now, updatedAt: now }
            : { text: scheduleText, createdAt: now, updatedAt: now };

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
        const existingEntry = schedules[key];

        if (scheduleText.trim() === "") {
            setSchedules(prev => {
                const copy = { ...prev };

                // 알람이 있으면 텍스트만 삭제하고 알람은 유지
                if (existingEntry && existingEntry.alarm && existingEntry.alarm.registeredAlarms && existingEntry.alarm.registeredAlarms.length > 0) {
                    copy[key] = {
                        alarm: existingEntry.alarm,
                        text: ''
                    };
                } else {
                    // 알람이 없으면 전체 삭제
                    delete copy[key];
                }

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
        } else {
            setIsEditing(true);
            setScheduleText("");
            setIsHolidayText(false);
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
                    // 알람이 있으면 텍스트만 빈 문자열로, createdAt/updatedAt 제거
                    updatedSchedules[key] = {
                        alarm: updatedSchedules[key].alarm, // 알람 데이터만 유지
                        text: ''
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

    // 알람 삭제 실행 함수 (내부) - React state를 직접 사용
    const executeDeleteAlarmOnly = () => {
        // 일반 알람만 삭제, 기념일 알람과 일정 텍스트는 보존
        if (!currentEntry || !currentEntry.alarm) return;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');

        try {
            // 현재 React state에서 알람 가져오기
            const currentAlarms = currentEntry.alarm.registeredAlarms || [];
            console.log('🔍 삭제 전 전체 알람:', currentAlarms);

            // 기념일 알람만 남기기 (일반 알람 모두 삭제)
            const alarmsToSave = currentAlarms.filter(alarm => {
                const isAnniv = alarm.isAnniversary || alarm.isRepeated || alarm.anniversaryRepeat;
                console.log(`🔍 알람 "${alarm.title}": isAnniversary=${alarm.isAnniversary}, isRepeated=${alarm.isRepeated}, anniversaryRepeat=${alarm.anniversaryRepeat} => 보존=${isAnniv}`);
                return isAnniv;
            });

            console.log('✅ 저장할 알람들 (기념일만):', alarmsToSave);

            // 새로운 스케줄 객체 생성
            const updatedSchedule = {
                ...currentEntry,
                alarm: {
                    ...currentEntry.alarm,
                    registeredAlarms: alarmsToSave
                }
            };

            // React state 업데이트 (이것만으로 useFirestoreSync가 자동으로 Firestore 동기화 처리)
            const updatedSchedules = { ...schedules, [dateKey]: updatedSchedule };
            setSchedules(updatedSchedules);

            // ⚠️ localStorage와 동기화 마커는 useFirestoreSync가 자동으로 처리하므로
            // 수동으로 업데이트하지 않음 (수동 업데이트 시 변경 감지 실패로 Firestore 동기화 안 됨)

            showToast('일반 알람이 삭제되었습니다.');
        } catch (error) {
            console.error('알람 삭제 오류:', error);
            showToast('알람 삭제 중 오류가 발생했습니다.');
        }
    };

    // 비활성화된 알람만 삭제 (과거 날짜용)
    const executeDeleteDisabledAlarmsOnly = () => {
        // 일반 알람 중 시간이 지난 알람만 삭제, 기념일 알람과 일정 텍스트는 보존
        if (!currentEntry || !currentEntry.alarm) return;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const now = new Date();

        try {
            // 현재 React state에서 알람 가져오기
            const currentAlarms = currentEntry.alarm.registeredAlarms || [];
            console.log('🔍 삭제 전 전체 알람:', currentAlarms);

            // 기념일 알람이거나, 아직 시간이 안 지난 알람만 남기기
            const alarmsToSave = currentAlarms.filter(alarm => {
                const isAnniv = alarm.isAnniversary || alarm.isRepeated || alarm.anniversaryRepeat;
                const alarmTime = new Date(alarm.calculatedTime);
                const isNotExpired = alarmTime >= now;
                const shouldKeep = isAnniv || isNotExpired;

                console.log(`🔍 알람 "${alarm.title}": 기념일=${isAnniv}, 시간=${alarmTime.toLocaleString('ko-KR')}, 만료=${!isNotExpired} => 보존=${shouldKeep}`);
                return shouldKeep;
            });

            if (alarmsToSave.length === currentAlarms.length) {
                showToast('삭제할 종료된 알람이 없습니다.');
                return;
            }

            console.log('✅ 저장할 알람들 (종료되지 않은 알람):', alarmsToSave);

            // 새로운 스케줄 객체 생성
            const updatedSchedule = {
                ...currentEntry,
                alarm: {
                    ...currentEntry.alarm,
                    registeredAlarms: alarmsToSave
                }
            };

            // React state 업데이트 (이것만으로 useFirestoreSync가 자동으로 Firestore 동기화 처리)
            const updatedSchedules = { ...schedules, [dateKey]: updatedSchedule };
            setSchedules(updatedSchedules);

            // ⚠️ localStorage와 동기화 마커는 useFirestoreSync가 자동으로 처리하므로
            // 수동으로 업데이트하지 않음 (수동 업데이트 시 변경 감지 실패로 Firestore 동기화 안 됨)

            showToast('종료된 알람이 삭제되었습니다.');
        } catch (error) {
            console.error('알람 삭제 오류:', error);
            showToast('알람 삭제 중 오류가 발생했습니다.');
        }
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
            // currentEntry가 없으면 text만 빈 문자열로 전달 (createdAt/updatedAt은 실제 일정 저장 시에만 생성)
            const entryData = currentEntry || { text: '' };
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
        <S.CalendarWrapper {...swipeHandlers}>
            {/* 로딩 중일 때 작은 스피너 아이콘 표시 */}
            {cacheStatus.loading && (
                <S.LoadingIndicator title="특일 정보 로딩 중...">
                    ⏳
                </S.LoadingIndicator>
            )}

            {/* 에러 상태 표시 (디버깅용) */}
            {cacheStatus.error && (
                <S.ErrorIndicator>
                    ⚠️ {cacheStatus.error}
                </S.ErrorIndicator>
            )}

            <S.Header>
                <S.NavContainer>
                    <S.NavButton onClick={() => {
                        setCurrentMonth(prev => subMonths(prev, 1));
                        setSwipeDirection(-1);
                    }}>&lt;</S.NavButton>
                        <S.MonthDisplay onClick={() => setIsDateSelectorModalOpen(true)}>
                            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                        </S.MonthDisplay>
                    <S.NavButton onClick={() => {
                        setCurrentMonth(prev => addMonths(prev, 1));
                        setSwipeDirection(1);
                    }}>&gt;</S.NavButton>
                </S.NavContainer>
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
                    <S.GoToTodayButton 
                        onClick={handleGoToToday} 
                        $notTodaySelected={notTodaySelected}
                        $isTodaySelected={isTodaySelected}
                    >
                        오늘
                    </S.GoToTodayButton>
                </div>
            </S.Header>
            
            <S.CalendarContainer layout>
                <AnimatePresence initial={false} custom={swipeDirection}>
                    <S.CalendarPage
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
                        <S.Weekdays>
                            {weekdays.map(day => (
                                <S.Day key={day}>{day}</S.Day>
                            ))}
                        </S.Weekdays>
                        <S.DatesGrid>
                            {dates.map((date, index) => {
                                const isToday = isSameDay(date, today);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isSchedule = hasSchedule(date);
                                const isAlarm = hasAlarm(date, schedules);
                                const isActiveAlarm = hasActiveAlarm(date, schedules);
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const isPastDate = isBefore(startOfDay(date), startOfDay(today));
                                const isHoliday = isNationalHoliday(date);

                                return (
                                    <S.DateCell
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
                                    </S.DateCell>
                                );
                            })}
                        </S.DatesGrid>
                    </S.CalendarPage>
                </AnimatePresence>
            </S.CalendarContainer>

            {selectedDate && (
                <S.ScheduleContainer>
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
                        {/* 반복 기념일 제목 표시 */}
                        {(() => {
                            if (!selectedDate) return null;

                            try {
                                // ⚠️ CRITICAL FIX: localStorage 대신 React state schedules 사용
                                const repeatedAnniversaries = getRepeatedAnniversaries(selectedDate, schedules);

                                console.log('🔍 [Preview Header] 반복 기념일:', {
                                    selectedDate: format(selectedDate, 'yyyy-MM-dd'),
                                    repeatedCount: repeatedAnniversaries.length,
                                    repeated: repeatedAnniversaries.map(a => ({
                                        id: a.id,
                                        title: a.title,
                                        anniversaryName: a.anniversaryName
                                    }))
                                });

                                if (repeatedAnniversaries.length === 0) return null;

                                return (
                                    <div style={{
                                        marginTop: '4px',
                                        fontSize: '13px',
                                        color: '#4a90e2',
                                        fontWeight: '500'
                                    }}>
                                        {repeatedAnniversaries.map((alarm, index) => (
                                            <span key={alarm.id}>
                                                {alarm.anniversaryName || alarm.title}
                                                {index < repeatedAnniversaries.length - 1 && ' · '}
                                            </span>
                                        ))}
                                    </div>
                                );
                            } catch (error) {
                                console.error('반복 기념일 표시 오류:', error);
                                return null;
                            }
                        })()}
                        <S.SmallNote>(오늘: {format(today, 'yyyy년 M월 d일', { locale: ko })})</S.SmallNote>
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
                    <S.ScheduleInput
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
                                // 자동삭제 필터 함수
                                const isAutoDeleted = (alarm) => {
                                    if (!alarm.disabledAt) return false;
                                    const disabledDate = new Date(alarm.disabledAt);
                                    const deletionDate = new Date(disabledDate);
                                    deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);
                                    return new Date() >= deletionDate;
                                };

                                // 등록된 알람 중에서 기념일 알람들을 추출 (자동삭제된 것만 제외)
                                const directAnniversaryAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    alarm.isAnniversary &&
                                    (alarm.anniversaryName || alarm.title) &&
                                    !isAutoDeleted(alarm)
                                ) || [];

                                // 반복 기념일 알람들을 추출 (자동삭제된 것만 제외)
                                const repeatedAnniversaryAlarms = (() => {
                                    if (!selectedDate) return [];
                                    try {
                                        // ⚠️ CRITICAL FIX: localStorage 대신 React state schedules 사용
                                        const repeated = getRepeatedAnniversaries(selectedDate, schedules);
                                        console.log('🔍 [Calendar Content] 반복 기념일 로드:', {
                                            selectedDate: format(selectedDate, 'yyyy-MM-dd'),
                                            repeatedCount: repeated.length,
                                            repeated: repeated.map(a => ({
                                                id: a.id,
                                                title: a.title,
                                                isRepeated: a.isRepeated,
                                                anniversaryRepeat: a.anniversaryRepeat
                                            }))
                                        });

                                        return repeated.filter(alarm => !isAutoDeleted(alarm));
                                    } catch (error) {
                                        console.error('반복 기념일 로드 오류:', error);
                                        return [];
                                    }
                                })();

                                // 직접 등록된 기념일과 반복 기념일 합치기 (ID 중복 제거)
                                const anniversaryAlarmsMap = new Map();
                                directAnniversaryAlarms.forEach(alarm => anniversaryAlarmsMap.set(alarm.id, alarm));
                                repeatedAnniversaryAlarms.forEach(alarm => {
                                    if (!anniversaryAlarmsMap.has(alarm.id)) {
                                        anniversaryAlarmsMap.set(alarm.id, alarm);
                                    }
                                });
                                // 알람 시간순으로 정렬
                                const anniversaryAlarms = Array.from(anniversaryAlarmsMap.values()).sort((a, b) => {
                                    const timeA = new Date(a.calculatedTime).getTime();
                                    const timeB = new Date(b.calculatedTime).getTime();
                                    return timeA - timeB;
                                });

                                const hasAnniversaries = anniversaryAlarms.length > 0;
                                const hasSpecialEvents = specialEvents.length > 0;

                                if (!hasAnniversaries && !hasSpecialEvents) return null;

                                return (
                                    <div className="special-event-note" style={{ marginBottom: '4px' }}>
                                        {/* 기념일들을 먼저 표시 (파란색) */}
                                        {anniversaryAlarms.map((alarm, index) => (
                                            <span key={`anniversary-${alarm.id}-${selectedDate?.getTime()}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                {alarm.enabled === false && (
                                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ marginRight: '3px', display: 'inline-block' }}>
                                                        <circle cx="6" cy="6" r="5" fill="none" stroke="#dc3545" strokeWidth="1.5"/>
                                                        <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" stroke="#dc3545" strokeWidth="1.5"/>
                                                    </svg>
                                                )}
                                                <span style={{ color: '#4a90e2' }}>
                                                    {alarm.anniversaryName || alarm.title}
                                                </span>
                                                {(index < anniversaryAlarms.length - 1 || hasSpecialEvents) && <span style={{ margin: '0 4px' }}>·</span>}
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
                                // 자동삭제 필터 함수
                                const isAutoDeleted = (alarm) => {
                                    if (!alarm.disabledAt) return false;
                                    const disabledDate = new Date(alarm.disabledAt);
                                    const deletionDate = new Date(disabledDate);
                                    deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);
                                    return new Date() >= deletionDate;
                                };

                                // 기념일이 아닌 일반 알람들만 필터링 (자동삭제된 것 제외)
                                const regularAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    !alarm.isAnniversary && !isAutoDeleted(alarm)
                                ) || [];

                                if (regularAlarms.length === 0) return null;

                                // 알람 시간순으로 정렬 (빠른 시간이 위로)
                                const sortedAlarms = [...regularAlarms].sort((a, b) => {
                                    const timeA = new Date(a.calculatedTime).getTime();
                                    const timeB = new Date(b.calculatedTime).getTime();
                                    return timeA - timeB;
                                });

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
                                        {sortedAlarms.map((alarm, index) => {
                                            // 알람 시간이 경과되었는지 확인
                                            const now = new Date();
                                            const alarmTime = new Date(alarm.calculatedTime);
                                            const isExpired = alarmTime < now;

                                            // 표시 상태 결정
                                            // 1. 토글 OFF + 경과 전: 흐릿 + "일시중지" (미리보기에서는 표시 안함)
                                            // 2. 토글 OFF + 경과 후: 흐릿 + 붉은색 "종료" + "0일 후 자동삭제"
                                            // 3. 토글 ON + 경과 후: 흐릿 + 붉은색 "종료" + "0일 후 자동삭제"
                                            // 4. 토글 ON + 경과 전: 선명 표시

                                            const isToggleOff = alarm.enabled === false;
                                            const isPaused = isToggleOff && !isExpired; // 일시중지 상태
                                            const isTerminated = (isToggleOff && isExpired) || (!isToggleOff && isExpired); // 종료 상태

                                            // 자동삭제까지 남은 일수 계산 (종료 상태일 때만)
                                            let daysUntilDeletion = null;
                                            if (isTerminated) {
                                                // disabledAt이 있으면 사용, 없으면 알람 시간 기준
                                                const baseDate = alarm.disabledAt ? new Date(alarm.disabledAt) : alarmTime;
                                                const deletionDate = new Date(baseDate);
                                                deletionDate.setDate(deletionDate.getDate() + AUTO_DELETE_DAYS);
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
                                                        color={(isTerminated || isPaused) ? 'rgba(255, 107, 107, 0.3)' : '#ff6b6b'}
                                                        style={{ marginTop: '2px', flexShrink: 0 }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{
                                                            fontSize: '13px',
                                                            color: (isTerminated || isPaused) ? 'rgba(208, 208, 208, 0.3)' : '#d0d0d0'
                                                        }}>
                                                            {alarm.title || '제목 없음'}
                                                            {isPaused && <span style={{ fontSize: '13px', color: 'rgba(153, 153, 153, 0.6)' }}> - 일시중지</span>}
                                                            {isTerminated && <span style={{ fontSize: '13px', color: 'rgba(255, 107, 107, 0.6)' }}> - 종료</span>}
                                                        </span>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: (isTerminated || isPaused) ? 'rgba(153, 153, 153, 0.5)' : '#999'
                                                        }}>
                                                            {format(new Date(alarm.calculatedTime), 'HH:mm')}
                                                            {isTerminated && daysUntilDeletion !== null && (
                                                                <span style={{
                                                                    color: daysUntilDeletion === 0
                                                                        ? 'rgba(255, 107, 107, 0.7)'
                                                                        : 'rgba(255, 107, 107, 0.5)'
                                                                }}> · {daysUntilDeletion}일후 자동삭제</span>
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
                                <div style={{
                                    padding: '0 5px 12px 5px'
                                }}>
                                    {/* HTML을 순서대로 파싱하여 텍스트, 이미지, 동영상 표시 */}
                                    {(() => {
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(scheduleText, 'text/html');

                                        // DOM 트리를 순서대로 순회하며 콘텐츠 추출
                                        const orderedContent = [];
                                        let currentTextChunks = [];

                                        const processNode = (node, isFirstChild = false) => {
                                            // 텍스트 노드인 경우
                                            if (node.nodeType === Node.TEXT_NODE) {
                                                const text = node.textContent;
                                                // 공백도 보존 (완전히 비어있지 않으면)
                                                if (text) {
                                                    currentTextChunks.push(text);
                                                }
                                            }
                                            // 이미지 노드인 경우
                                            else if (node.nodeName === 'IMG') {
                                                // 이전까지 모인 텍스트를 먼저 저장
                                                if (currentTextChunks.length > 0) {
                                                    orderedContent.push({
                                                        type: 'text',
                                                        content: currentTextChunks.join('')
                                                    });
                                                    currentTextChunks = [];
                                                }
                                                // 이미지 저장
                                                orderedContent.push({
                                                    type: 'image',
                                                    src: node.src,
                                                    alt: node.alt || ''
                                                });
                                            }
                                            // iframe 노드인 경우
                                            else if (node.nodeName === 'IFRAME') {
                                                // 이전까지 모인 텍스트를 먼저 저장
                                                if (currentTextChunks.length > 0) {
                                                    orderedContent.push({
                                                        type: 'text',
                                                        content: currentTextChunks.join('')
                                                    });
                                                    currentTextChunks = [];
                                                }
                                                // iframe 저장
                                                orderedContent.push({
                                                    type: 'iframe',
                                                    src: node.src,
                                                    title: node.title || ''
                                                });
                                            }
                                            // 다른 요소 노드인 경우 자식 노드들을 재귀적으로 처리
                                            else if (node.nodeType === Node.ELEMENT_NODE) {
                                                // 블록 레벨 요소는 앞에 줄바꿈 추가 (첫 번째 자식 제외)
                                                const blockElements = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE'];
                                                if (blockElements.includes(node.nodeName) && !isFirstChild && currentTextChunks.length > 0) {
                                                    currentTextChunks.push('\n');
                                                }

                                                // <br> 태그는 줄바꿈으로 처리
                                                if (node.nodeName === 'BR') {
                                                    currentTextChunks.push('\n');
                                                } else {
                                                    // 자식 노드들을 순서대로 처리
                                                    node.childNodes.forEach((child, index) => processNode(child, index === 0));

                                                    // 블록 레벨 요소는 뒤에도 줄바꿈 추가
                                                    if (blockElements.includes(node.nodeName)) {
                                                        currentTextChunks.push('\n');
                                                    }
                                                }
                                            }
                                        };

                                        // body의 모든 자식 노드를 순서대로 처리
                                        doc.body.childNodes.forEach((node, index) => processNode(node, index === 0));

                                        // 마지막 남은 텍스트 저장
                                        if (currentTextChunks.length > 0) {
                                            orderedContent.push({
                                                type: 'text',
                                                content: currentTextChunks.join('')
                                            });
                                        }

                                        // 렌더링
                                        return (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                {orderedContent.map((item, index) => {
                                                    if (item.type === 'text') {
                                                        return (
                                                            <div
                                                                key={`text-${index}`}
                                                                style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    color: '#c0c0c0'
                                                                }}
                                                            >
                                                                {item.content}
                                                            </div>
                                                        );
                                                    } else if (item.type === 'image') {
                                                        return (
                                                            <img
                                                                key={`image-${index}`}
                                                                src={item.src}
                                                                alt={item.alt}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    width: 'auto',
                                                                    height: 'auto',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    display: 'block',
                                                                    objectFit: 'contain'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(item.src, '_blank');
                                                                }}
                                                            />
                                                        );
                                                    } else if (item.type === 'iframe') {
                                                        return (
                                                            <iframe
                                                                key={`iframe-${index}`}
                                                                src={item.src}
                                                                title={item.title || `video-${index}`}
                                                                style={{
                                                                    width: '100%',
                                                                    aspectRatio: '16 / 9',
                                                                    borderRadius: '8px',
                                                                    border: 'none'
                                                                }}
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="placeholder-note">
                                    스케줄을 입력하거나 수정하려면 좌상단의 '일정' 버튼을 터치하거나 여기를 '더블탭' 하세요
                                </div>
                            )}
                        </div>
                        )}
                    </S.ScheduleInput>
                    <S.SmallNote style={{ textAlign: 'left', marginTop: 10, marginLeft: 0 }}>
                    {currentEntry ? (
                        <>
                        <S.ButtonGroup>
                            {/* 일정 텍스트가 있으면 스케줄 삭제 버튼 표시 */}
                            {currentEntry.text && currentEntry.text.trim() && (
                                <S.DeleteButton onClick={handleDeleteScheduleOnly}>
                                    일정 삭제
                                </S.DeleteButton>
                            )}
                            {/* 일반 알람이 있으면 알람 삭제 버튼 표시 (기념일 알람 제외) */}
                            {(() => {
                                const today = startOfDay(new Date());
                                const selectedDay = startOfDay(selectedDate);
                                const isPastDate = isBefore(selectedDay, today);

                                const regularAlarms = currentEntry?.alarm?.registeredAlarms?.filter(alarm =>
                                    !alarm.isAnniversary && !alarm.isRepeated && !alarm.anniversaryRepeat
                                ) || [];

                                // 과거 날짜든 현재/미래 날짜든 일반 알람이 있으면 삭제 버튼 표시
                                return regularAlarms.length > 0;
                            })() && (
                                <S.DeleteButton onClick={handleDeleteAlarmOnly} style={{ backgroundColor: '#ff6b6b' }}>
                                    알람 삭제
                                </S.DeleteButton>
                            )}
                        </S.ButtonGroup>
                        {/* 일정 텍스트가 있을 때만 작성일/수정일 표시 */}
                        {currentEntry.text && currentEntry.text.trim() && (
                            <>
                            · 최초 등록일: {formatTs(currentEntry?.createdAt)}
                            {currentEntry?.updatedAt && currentEntry.updatedAt !== currentEntry.createdAt && (
                                <>
                                    {' '}<br />
                                    · 최종 수정일: {formatTs(currentEntry?.updatedAt)}
                                </>
                            )}
                            </>
                        )}
                        </>
                    ) : (
                        <>· 해당 날짜에는 스케줄이 없습니다.</>
                    )}
                    </S.SmallNote>
                </S.ScheduleContainer>
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
                <S.ConfirmOverlay onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null })}>
                    <S.ConfirmModalBox onClick={e => e.stopPropagation()}>
                        <S.ConfirmMessage>{deleteConfirmModal.message}</S.ConfirmMessage>
                        <S.ConfirmButtonWrapper>
                            <S.ConfirmCancelButton onClick={() => setDeleteConfirmModal({ isOpen: false, type: null, message: '', onConfirm: null })}>
                                아니요
                            </S.ConfirmCancelButton>
                            <S.ConfirmButton onClick={deleteConfirmModal.onConfirm}>
                                예
                            </S.ConfirmButton>
                        </S.ConfirmButtonWrapper>
                    </S.ConfirmModalBox>
                </S.ConfirmOverlay>
            )}
        </S.CalendarWrapper>
    );
};

export default Calendar;