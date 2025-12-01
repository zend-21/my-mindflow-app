// src/utils/fortuneLogic.js

// 🌟 사주팔자 기반 운세 계산 로직
// ✨ 개선: 오행 상생상극, 월령, 24절기 반영

import { getTarotData, getHoroscopeData, getLuckyElementsData } from './fortuneData';
import { getRandomFortune, getCombinedFortune } from './fortuneSelector';

// 천간 (Heavenly Stems) - 10개
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const HEAVENLY_STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 지지 (Earthly Branches) - 12개
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const EARTHLY_BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 12띠 (12 Zodiac Animals)
const ZODIAC_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

// 12 별자리
const ZODIAC_SIGNS = [
    { name: '양자리', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { name: '황소자리', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { name: '쌍둥이자리', startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
    { name: '게자리', startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
    { name: '사자자리', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { name: '처녀자리', startMonth: 8, startDay: 23, endMonth: 9, endDay: 23 },
    { name: '천칭자리', startMonth: 9, startDay: 24, endMonth: 10, endDay: 22 },
    { name: '전갈자리', startMonth: 10, startDay: 23, endMonth: 11, endDay: 22 },
    { name: '사수자리', startMonth: 11, startDay: 23, endMonth: 12, endDay: 24 },
    { name: '염소자리', startMonth: 12, startDay: 25, endMonth: 1, endDay: 19 },
    { name: '물병자리', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { name: '물고기자리', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 }
];

// 타로 카드 데이터 로드 (156개: 78장 × 정/역방향)
let TAROT_DATA = null;

const loadTarotData = async () => {
    if (!TAROT_DATA) {
        TAROT_DATA = await getTarotData();
    }
    return TAROT_DATA;
};

// 별자리 운세 데이터 로드 (2400개: 12별자리 × 200개)
let HOROSCOPE_DATA = null;

const loadHoroscopeData = async () => {
    if (!HOROSCOPE_DATA) {
        HOROSCOPE_DATA = await getHoroscopeData();
    }
    return HOROSCOPE_DATA;
};

/**
 * 날짜를 60갑자 시스템의 일진으로 변환
 * @param {Date} date - 변환할 날짜
 * @returns {Object} { stem: string, branch: string, index: number }
 */
export const calculateDayPillar = (date) => {
    // 기준일: 1900-01-01은 경진일 (index 16)
    const baseDate = new Date(1900, 0, 1);
    const baseDayIndex = 16; // 경진일

    // 두 날짜 사이의 일수 차이 계산
    const diffTime = date.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 60갑자 cycle에서의 위치
    const dayIndex = (baseDayIndex + diffDays) % 60;
    const stemIndex = dayIndex % 10;
    const branchIndex = dayIndex % 12;

    return {
        stem: HEAVENLY_STEMS[stemIndex],
        branch: EARTHLY_BRANCHES[branchIndex],
        index: dayIndex
    };
};

/**
 * 천간의 한자 가져오기
 * @param {string} stem - 천간 한글 (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계)
 * @returns {string} 천간 한자
 */
const getStemHanja = (stem) => {
    const index = HEAVENLY_STEMS.indexOf(stem);
    return index >= 0 ? HEAVENLY_STEMS_HANJA[index] : '';
};

/**
 * 지지의 한자 가져오기
 * @param {string} branch - 지지 한글 (자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해)
 * @returns {string} 지지 한자
 */
const getBranchHanja = (branch) => {
    const index = EARTHLY_BRANCHES.indexOf(branch);
    return index >= 0 ? EARTHLY_BRANCHES_HANJA[index] : '';
};

/**
 * 생년으로부터 띠(12지) 계산
 * @param {number} birthYear - 출생 연도
 * @returns {string} 띠 이름 (쥐, 소, 호랑이, 토끼, 용, 뱀, 말, 양, 원숭이, 닭, 개, 돼지)
 */
export const calculateZodiacAnimal = (birthYear) => {
    // 1900년은 쥐띠 (자), 1901년은 소띠 (축), ...
    const baseYear = 1900;
    let index = (birthYear - baseYear) % 12;
    // 음수가 나올 경우 양수로 변환
    if (index < 0) index += 12;
    return ZODIAC_ANIMALS[index];
};

/**
 * 천간으로부터 오행(五行) 계산
 * @param {string} stem - 천간 (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계)
 * @returns {string} 오행 (Wood, Fire, Earth, Metal, Water)
 */
const getStemElement = (stem) => {
    const elementMap = {
        '갑': 'Wood',  // 甲 - 양목
        '을': 'Wood',  // 乙 - 음목
        '병': 'Fire',  // 丙 - 양화
        '정': 'Fire',  // 丁 - 음화
        '무': 'Earth', // 戊 - 양토
        '기': 'Earth', // 己 - 음토
        '경': 'Metal', // 庚 - 양금
        '신': 'Metal', // 辛 - 음금
        '임': 'Water', // 壬 - 양수
        '계': 'Water'  // 癸 - 음수
    };
    return elementMap[stem] || 'Wood';
};

/**
 * 지지로부터 오행 계산
 * @param {string} branch - 지지 (자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해)
 * @returns {string} 오행 (Wood, Fire, Earth, Metal, Water)
 */
const getBranchElement = (branch) => {
    const elementMap = {
        '인': 'Wood', '묘': 'Wood',  // 寅卯 - 목
        '사': 'Fire', '오': 'Fire',  // 巳午 - 화
        '신': 'Metal', '유': 'Metal', // 申酉 - 금
        '해': 'Water', '자': 'Water', // 亥子 - 수
        '진': 'Earth', '술': 'Earth', '축': 'Earth', '미': 'Earth' // 辰戌丑未 - 토
    };
    return elementMap[branch] || 'Earth';
};

/**
 * ✨ 오행 상생상극(相生相剋) 계산
 * 상생(相生): 木生火, 火生土, 土生金, 金生水, 水生木
 * 상극(相剋): 木剋土, 土剋水, 水剋火, 火剋金, 金剋木
 *
 * @param {string} userElement - 사용자 오행
 * @param {string} todayElement - 오늘의 오행
 * @returns {number} 상호작용 점수 (-20 ~ +20)
 */
const calculateElementInteraction = (userElement, todayElement) => {
    // 상생 관계 (생해주는 관계: +15)
    const generating = {
        'Wood': 'Fire',   // 木生火
        'Fire': 'Earth',  // 火生土
        'Earth': 'Metal', // 土生金
        'Metal': 'Water', // 金生水
        'Water': 'Wood'   // 水生木
    };

    // 상극 관계 (극하는 관계: -15)
    const controlling = {
        'Wood': 'Earth',  // 木剋土
        'Earth': 'Water', // 土剋水
        'Water': 'Fire',  // 水剋火
        'Fire': 'Metal',  // 火剋金
        'Metal': 'Wood'   // 金剋木
    };

    // 같은 오행 (비화: +10)
    if (userElement === todayElement) {
        return 10;
    }

    // 내가 상대를 생해주는 경우 (설기: +15)
    if (generating[userElement] === todayElement) {
        return 15;
    }

    // 상대가 나를 생해주는 경우 (인수: +20) - 가장 좋음
    if (generating[todayElement] === userElement) {
        return 20;
    }

    // 내가 상대를 극하는 경우 (재성: +5) - 약간 좋음
    if (controlling[userElement] === todayElement) {
        return 5;
    }

    // 상대가 나를 극하는 경우 (관살: -15) - 좋지 않음
    if (controlling[todayElement] === userElement) {
        return -15;
    }

    // 그 외 (간접 관계: 0)
    return 0;
};

/**
 * ✨ 24절기 계산
 * @param {Date} date - 날짜
 * @returns {Object} { name: string, index: number, seasonEnergy: number }
 */
const calculateSolarTerm = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 24절기 (간략화된 고정 날짜 - 실제로는 매년 1-2일씩 차이남)
    const solarTerms = [
        { name: '소한', month: 1, day: 6, season: 'Winter', energy: 2 },
        { name: '대한', month: 1, day: 20, season: 'Winter', energy: 1 },
        { name: '입춘', month: 2, day: 4, season: 'Spring', energy: 10 },
        { name: '우수', month: 2, day: 19, season: 'Spring', energy: 11 },
        { name: '경칩', month: 3, day: 6, season: 'Spring', energy: 12 },
        { name: '춘분', month: 3, day: 21, season: 'Spring', energy: 13 },
        { name: '청명', month: 4, day: 5, season: 'Spring', energy: 14 },
        { name: '곡우', month: 4, day: 20, season: 'Spring', energy: 15 },
        { name: '입하', month: 5, day: 6, season: 'Summer', energy: 20 },
        { name: '소만', month: 5, day: 21, season: 'Summer', energy: 21 },
        { name: '망종', month: 6, day: 6, season: 'Summer', energy: 22 },
        { name: '하지', month: 6, day: 21, season: 'Summer', energy: 23 },
        { name: '소서', month: 7, day: 7, season: 'Summer', energy: 24 },
        { name: '대서', month: 7, day: 23, season: 'Summer', energy: 25 },
        { name: '입추', month: 8, day: 8, season: 'Autumn', energy: 30 },
        { name: '처서', month: 8, day: 23, season: 'Autumn', energy: 31 },
        { name: '백로', month: 9, day: 8, season: 'Autumn', energy: 32 },
        { name: '추분', month: 9, day: 23, season: 'Autumn', energy: 33 },
        { name: '한로', month: 10, day: 8, season: 'Autumn', energy: 34 },
        { name: '상강', month: 10, day: 23, season: 'Autumn', energy: 35 },
        { name: '입동', month: 11, day: 8, season: 'Winter', energy: 40 },
        { name: '소설', month: 11, day: 22, season: 'Winter', energy: 41 },
        { name: '대설', month: 12, day: 7, season: 'Winter', energy: 42 },
        { name: '동지', month: 12, day: 22, season: 'Winter', energy: 43 }
    ];

    // 현재 날짜에 가장 가까운 이전 절기 찾기
    let currentTerm = solarTerms[0];
    for (let i = 0; i < solarTerms.length; i++) {
        const term = solarTerms[i];
        if (month > term.month || (month === term.month && day >= term.day)) {
            currentTerm = term;
        } else {
            break;
        }
    }

    return {
        name: currentTerm.name,
        index: solarTerms.indexOf(currentTerm),
        season: currentTerm.season,
        energy: currentTerm.energy
    };
};

/**
 * ✨ 월령(月令) 오행 계산
 * 월령은 사주에서 매우 중요한 요소로, 계절의 기운을 나타냄
 * @param {number} month - 월 (1-12)
 * @returns {string} 월령 오행
 */
const getMonthElement = (month) => {
    // 음력 기준이지만 양력으로 간략화
    const monthElements = {
        1: 'Water',  // 인월(寅月) - 입춘 이후, 목의 시작이지만 수 기운 잔존
        2: 'Wood',   // 묘월(卯月) - 춘분 전후, 목 왕성
        3: 'Wood',   // 진월(辰月) - 청명 전후, 목에서 토로 전환
        4: 'Wood',   // 사월(巳月) - 입하 전후, 목에서 화로 전환
        5: 'Fire',   // 오월(午月) - 하지 전후, 화 왕성
        6: 'Fire',   // 미월(未月) - 소서 전후, 화에서 토로 전환
        7: 'Fire',   // 신월(申月) - 입추 전후, 화에서 금으로 전환
        8: 'Metal',  // 유월(酉月) - 추분 전후, 금 왕성
        9: 'Metal',  // 술월(戌月) - 한로 전후, 금에서 토로 전환
        10: 'Metal', // 해월(亥月) - 입동 전후, 금에서 수로 전환
        11: 'Water', // 자월(子月) - 동지 전후, 수 왕성
        12: 'Water'  // 축월(丑月) - 대한 전후, 수에서 토로 전환
    };
    return monthElements[month] || 'Earth';
};

/**
 * ✨ 간이 천체력 계산 (별자리 운세용)
 * 실제 천체 위치는 아니지만 근사치로 변화를 줌
 * @param {Date} date - 날짜
 * @returns {Object} { sunPosition, moonPhase, planetaryEnergy }
 */
const calculatePlanetaryInfluence = (date) => {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);

    // 태양의 황도 위치 (0-360도)
    const sunPosition = (dayOfYear * 360 / 365) % 360;

    // 달의 위상 (0-1, 0=신월, 0.5=보름)
    const moonPhase = (dayOfYear % 29.5) / 29.5;

    // 수성 역행 근사 (실제로는 1년에 3-4번, 여기서는 간략화)
    const mercuryRetrograde = Math.sin(dayOfYear * Math.PI / 88) < -0.8 ? 1 : 0;

    // 목성의 길조 (1년 주기의 특정 시기)
    const jupiterBlessing = Math.cos(dayOfYear * Math.PI * 2 / 365) > 0.7 ? 1 : 0;

    // 토성의 시련 (1년 주기의 특정 시기)
    const saturnChallenge = Math.sin(dayOfYear * Math.PI * 2 / 365) < -0.7 ? 1 : 0;

    // 종합 행성 에너지 (-10 ~ +10)
    const planetaryEnergy = Math.floor(
        (moonPhase - 0.5) * 10 +  // 달: 보름달(+5) ~ 그믐달(-5)
        jupiterBlessing * 5 -      // 목성 길조 +5
        saturnChallenge * 5 -      // 토성 시련 -5
        mercuryRetrograde * 3      // 수성 역행 -3
    );

    return {
        sunPosition,
        moonPhase,
        planetaryEnergy,
        mercuryRetrograde: mercuryRetrograde === 1,
        jupiterBlessing: jupiterBlessing === 1,
        saturnChallenge: saturnChallenge === 1
    };
};

/**
 * 태양시 보정 (Solar Time Correction)
 * 출생지의 경도에 따라 실제 태양 시간으로 보정
 *
 * @param {number} birthHour - 출생 시간 (0-23)
 * @param {number} birthMinute - 출생 분 (0-59)
 * @param {number} longitude - 출생지 경도 (예: 서울 127°, 부산 129°)
 * @returns {Object} { correctedHour, correctedMinute } - 보정된 시간
 */
export const applySolarTimeCorrection = (birthHour, birthMinute, longitude) => {
    // 경도 15° = 1시간 차이 (지구 360° / 24시간)
    // 한국 표준시 기준 경도: 135° (UTC+9 기준)
    // 실제 서울 경도: 126.978° (약 127°)
    const REFERENCE_LONGITUDE = 135; // 한국 표준시 기준 경도 (UTC+9)

    // 경도 차이로 인한 시간 차이 (분 단위)
    const timeDiffMinutes = (longitude - REFERENCE_LONGITUDE) * 4; // 1° = 4분

    // 총 분으로 변환하여 계산
    let totalMinutes = birthHour * 60 + birthMinute + timeDiffMinutes;

    // 음수 처리 (전날로 넘어가는 경우)
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
    }

    // 24시간 초과 처리 (다음날로 넘어가는 경우)
    if (totalMinutes >= 24 * 60) {
        totalMinutes -= 24 * 60;
    }

    // 시/분으로 다시 분리
    const correctedHour = Math.floor(totalMinutes / 60);
    const correctedMinute = Math.floor(totalMinutes % 60);

    return {
        correctedHour,
        correctedMinute,
        timeDiffMinutes: Math.round(timeDiffMinutes) // 보정량 (참고용)
    };
};

/**
 * 생년월일로부터 일간(Day Master) 계산
 * 태양시 보정이 있는 경우, 보정된 시간이 자정을 넘으면 날짜가 변경됨
 * @param {Object} userData - { birthYear, birthMonth, birthDay, birthHour?, birthMinute?, birthLon? }
 * @returns {string} 일간 (천간)
 */
export const calculateDayStem = (userData) => {
    const { birthYear, birthMonth, birthDay, birthHour, birthMinute, birthLon } = userData;
    let adjustedDate = new Date(birthYear, birthMonth - 1, birthDay);

    // 태양시 보정 적용 (출생 시간과 경도가 모두 있는 경우)
    if (birthHour !== undefined && birthMinute !== undefined && birthLon !== null && birthLon !== undefined) {
        const correction = applySolarTimeCorrection(birthHour, birthMinute, birthLon);

        // 보정된 시간이 자정을 넘는 경우 날짜 조정
        // 원래 시간과 보정된 시간 비교
        if (birthHour >= 23 && correction.correctedHour < birthHour) {
            // 23시에서 다음날 0시로 넘어간 경우
            adjustedDate.setDate(adjustedDate.getDate() + 1);
        } else if (birthHour === 0 && correction.correctedHour === 23) {
            // 0시에서 전날 23시로 넘어간 경우
            adjustedDate.setDate(adjustedDate.getDate() - 1);
        }

        // 디버깅용 로그 (개발 시에만 출력)
        if (typeof console !== 'undefined') {
            console.log(`🌞 태양시 보정: ${birthHour}:${birthMinute.toString().padStart(2, '0')} → ${correction.correctedHour}:${correction.correctedMinute.toString().padStart(2, '0')} (${correction.timeDiffMinutes > 0 ? '+' : ''}${correction.timeDiffMinutes}분)`);
            if (adjustedDate.getDate() !== birthDay) {
                console.log(`📅 날짜 변경: ${birthYear}-${birthMonth}-${birthDay} → ${adjustedDate.getFullYear()}-${adjustedDate.getMonth() + 1}-${adjustedDate.getDate()}`);
            }
        }
    }

    const dayPillar = calculateDayPillar(adjustedDate);
    return dayPillar.stem;
};

/**
 * 생년월일로부터 별자리 계산
 * @param {Object} userData - { birthMonth, birthDay }
 * @returns {string} 별자리 이름
 */
export const calculateZodiacSign = (userData) => {
    const { birthMonth, birthDay } = userData;

    for (const sign of ZODIAC_SIGNS) {
        if (sign.startMonth === sign.endMonth) {
            // 같은 달 내
            if (birthMonth === sign.startMonth && birthDay >= sign.startDay && birthDay <= sign.endDay) {
                return sign.name;
            }
        } else {
            // 두 달에 걸친 경우
            if ((birthMonth === sign.startMonth && birthDay >= sign.startDay) ||
                (birthMonth === sign.endMonth && birthDay <= sign.endDay)) {
                return sign.name;
            }
        }
    }

    return '물고기자리'; // 기본값
};

/**
 * 해시 함수 - 숫자 배열을 받아 0-based 인덱스 반환
 * @param {Array<number>} values - 숫자 배열
 * @param {number} max - 최대값 (결과는 0 ~ max-1)
 * @returns {number}
 */
const hashValues = (values, max) => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum % max;
};

/**
 * Seeded Random Number Generator (재현 가능한 랜덤)
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

/**
 * 배열을 시드 기반으로 섞기 (Fisher-Yates Shuffle)
 * @param {Array} array - 섞을 배열
 * @param {number} seed - 시드 값
 * @returns {Array} 섞인 배열
 */
const seededShuffle = (array, seed) => {
    const shuffled = [...array];
    const rng = new SeededRandom(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

/**
 * 우주의 에너지 계산 (날짜 기반)
 * @param {Date} date - 날짜
 * @returns {number} 우주 에너지 값
 */
const calculateCosmicEnergy = (date) => {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const weekDay = date.getDay(); // 0~6

    // 간단한 음력 근사치 (정확하지 않지만 변화를 주기 위함)
    const moonCycle = dayOfYear % 29; // 음력 주기 근사

    return dayOfYear * 100 + moonCycle * 10 + weekDay;
};

/**
 * 사용자 운명 에너지 계산
 * @param {Object} userData - 사용자 정보
 * @returns {number} 운명 에너지 값
 */
const calculateDestinyEnergy = (userData) => {
    const { birthYear, birthMonth, birthDay, birthHour, birthMinute } = userData;

    // 생년월일 기반 에너지
    const lifePathNumber = (birthYear + birthMonth * 31 + birthDay * 17);

    // 출생 시간 에너지 추가 (시간이 있으면)
    const timeEnergy = (birthHour !== undefined && birthMinute !== undefined)
        ? (birthHour * 60 + birthMinute)
        : 0;

    // 일간 반영 (이미 계산된 사주 데이터 활용)
    const dayStem = calculateDayStem(userData);
    const stemIndex = HEAVENLY_STEMS.indexOf(dayStem);
    const stemBoost = stemIndex * 7;

    return lifePathNumber + timeEnergy + stemBoost;
};

/**
 * 현재 시간 에너지 계산
 * @param {Date} date - 현재 시각
 * @returns {number} 시간 에너지 값
 */
const calculateTimeEnergy = (date) => {
    const hour = date.getHours(); // 0~23
    const minute = date.getMinutes(); // 0~59

    // 시간대별 에너지 가중치
    // 새벽(3~6): 3, 오전(6~12): 2, 오후(12~18): 1, 저녁/밤(18~3): 4
    let timeWeight = 1;
    if (hour >= 3 && hour < 6) timeWeight = 3;
    else if (hour >= 6 && hour < 12) timeWeight = 2;
    else if (hour >= 12 && hour < 18) timeWeight = 1;
    else timeWeight = 4;

    return hour * timeWeight + Math.floor(minute / 10);
};

/**
 * ✨ 개선된 정/역방향 결정 (더 고른 분포)
 * @param {Object} userData - 사용자 정보
 * @param {Date} date - 현재 시각
 * @returns {boolean} true면 역방향
 */
const calculateReversed = (userData, date) => {
    const { birthYear, birthMonth, birthDay } = userData;
    const currentDay = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();

    // 사용자 고유 시드 (생년월일 전체 사용)
    const userSeed = birthYear * 10000 + birthMonth * 100 + birthDay;

    // 시간 시드 (시간 + 분으로 더 세밀하게)
    const timeSeed = hour * 60 + minute;

    // 복잡한 해시로 고른 분포 생성
    const reversedHash = (userSeed * 17 + currentDay * 23 + timeSeed * 7 + hour * 11) % 100;

    // 40% 확률로 역방향 (실제 타로 통계 반영)
    return reversedHash < 40;
};

/**
 * 키워드 선택 - 사용자 일간 + 오늘 일진으로 키워드 결정
 * @param {string} userDayStem - 사용자 일간
 * @param {Object} todayPillar - 오늘의 일진 { stem, branch, index }
 * @param {Array} categoryData - 해당 카테고리의 전체 데이터
 * @returns {string} 선택된 키워드
 */
const selectKeyword = (userDayStem, todayPillar, categoryData) => {
    // 해당 카테고리의 모든 고유 키워드 추출
    const uniqueKeywords = [...new Set(categoryData.map(item => item.Keyword))];

    if (uniqueKeywords.length === 0) return null;

    // 사용자 일간 index + 오늘 일진 index를 조합하여 키워드 선택
    const userStemIndex = HEAVENLY_STEMS.indexOf(userDayStem);
    const keywordIndex = hashValues([userStemIndex, todayPillar.index], uniqueKeywords.length);

    return uniqueKeywords[keywordIndex];
};

/**
 * 키워드에 해당하는 항목 중 랜덤 선택
 * @param {string} keyword - 선택된 키워드
 * @param {Array} categoryData - 해당 카테고리의 전체 데이터
 * @returns {Object} 선택된 항목
 */
const selectRandomContentByKeyword = (keyword, categoryData) => {
    const matchingItems = categoryData.filter(item => item.Keyword === keyword);

    if (matchingItems.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * matchingItems.length);
    return matchingItems[randomIndex];
};

/**
 * 타로 카드 선택 (개선된 로직: 우주 에너지 + 운명 + 시간)
 * @param {Object} userData - 사용자 정보
 * @param {Date} currentTime - 현재 시각
 * @returns {Promise<Object>} { card: string, isReversed: boolean, message: string, content: string, id: string }
 */
const selectTarotCard = async (userData, currentTime) => {
    // 타로 데이터 로드 (156개: 78장 × 정/역방향)
    const tarotData = await loadTarotData();

    // 정방향 카드만 추출 (78장)
    const uprightCards = tarotData.filter(card => !card.Keyword.includes('역방향'));

    // 1️⃣ 우주의 에너지로 덱 섞기 (매일 다른 순서)
    const cosmicSeed = calculateCosmicEnergy(currentTime);
    const shuffledDeck = seededShuffle(uprightCards, cosmicSeed);

    // 2️⃣ 사용자 운명 에너지
    const destinyIndex = calculateDestinyEnergy(userData);

    // 3️⃣ 현재 시간 에너지
    const timeBoost = calculateTimeEnergy(currentTime);

    // 4️⃣ 최종 카드 위치 결정
    const finalPosition = (destinyIndex + timeBoost) % shuffledDeck.length;
    const selectedCard = shuffledDeck[finalPosition];

    // 5️⃣ 정/역방향 결정
    const isReversed = calculateReversed(userData, currentTime);

    // 6️⃣ 역방향이면 역방향 카드 데이터 찾기
    let finalCard = selectedCard;
    if (isReversed) {
        const reversedCard = tarotData.find(
            card => card.ID === selectedCard.ID.replace('U', 'R')
        );
        if (reversedCard) {
            finalCard = reversedCard;
        }
    }

    return {
        card: finalCard.Keyword,
        isReversed: isReversed,
        message: finalCard.Keyword,
        content: finalCard.Content,
        id: finalCard.ID,
        imageFile: finalCard.Image_File
    };
};

/**
 * 행운 요소 선택 (숫자/방향/색상/물건)
 * @param {Object} userData - 사용자 정보
 * @param {Array} luckyData - Lucky 카테고리 데이터
 * @returns {Object} { keyword: string, content: string }
 */
const selectLuckyElement = (userData, luckyData) => {
    const { birthYear, birthMonth, birthDay } = userData;

    // 생년월일 합산으로 행운 요소 선택
    const luckyIndex = hashValues([birthYear, birthMonth, birthDay], luckyData.length);
    const luckyItem = luckyData[luckyIndex];

    return {
        keyword: luckyItem?.Keyword || '0',
        content: luckyItem?.Content || '행운이 함께합니다!'
    };
};

/**
 * ✨ 개선된 별자리 운세 선택 (천체력 반영)
 * @param {string} zodiacSign - 별자리 이름
 * @param {Date} date - 날짜
 * @returns {Promise<Object>} { keyword: string, content: string }
 */
const selectHoroscopeFortune = async (zodiacSign, date) => {
    // 별자리 운세 데이터 로드
    const horoscopeData = await loadHoroscopeData();

    // 별자리 이름을 영문 약어로 매핑
    const zodiacMap = {
        '양자리': 'AR',
        '황소자리': 'TA',
        '쌍둥이자리': 'GE',
        '게자리': 'CA',
        '사자자리': 'LE',
        '처녀자리': 'VI',
        '천칭자리': 'LI',
        '전갈자리': 'SC',
        '사수자리': 'SA',
        '염소자리': 'CP',
        '물병자리': 'AQ',
        '물고기자리': 'PI'
    };

    const zodiacCode = zodiacMap[zodiacSign] || 'AR';

    // 해당 별자리의 운세만 필터링 (200개)
    const zodiacFortunes = horoscopeData.filter(item =>
        item.ID && item.ID.startsWith(`H_${zodiacCode}_`)
    );

    if (zodiacFortunes.length === 0) {
        return {
            keyword: '운세',
            content: '오늘도 좋은 하루 되세요!'
        };
    }

    // ✨ 천체력 반영
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const planetary = calculatePlanetaryInfluence(date);

    // 태양 위치와 달의 위상을 반영하여 인덱스 계산
    const sunInfluence = Math.floor(planetary.sunPosition / 10); // 0-36
    const moonInfluence = Math.floor(planetary.moonPhase * 10);  // 0-10
    const energyInfluence = Math.abs(planetary.planetaryEnergy); // 0-10

    // 복합적인 인덱스 계산 (천체 운행을 고려)
    const complexIndex = (dayOfYear + sunInfluence + moonInfluence + energyInfluence) % zodiacFortunes.length;
    const selectedFortune = zodiacFortunes[complexIndex];

    return {
        keyword: selectedFortune.Keyword || '운세',
        content: selectedFortune.Content || '오늘도 좋은 하루 되세요!'
    };
};

/**
 * 사주 결과 점수를 새로운 키워드로 매핑
 * @param {number} score - 0~100 점수
 * @param {string} category - 카테고리 ('Main', 'Money', 'Love', 'Health', 'Advice', 'Lucky')
 * @returns {string} 키워드
 */
const mapScoreToKeyword = (score, category) => {
    // Main, Money, Love, Health, Lucky: 4단계
    if (category === 'Main') {
        if (score >= 75) return '매우좋음';
        if (score >= 50) return '좋음';
        if (score >= 25) return '보통';
        return '주의';
    }

    if (category === 'Money') {
        if (score >= 75) return '재물상승';
        if (score >= 50) return '현상유지';
        if (score >= 25) return '지출주의';
        return '재정악화';
    }

    if (category === 'Love') {
        if (score >= 75) return '애정최고';
        if (score >= 50) return '관계발전';
        if (score >= 25) return '소강상태';
        return '다툼주의';
    }

    if (category === 'Health') {
        if (score >= 75) return '건강좋음';
        if (score >= 50) return '활력넘침';
        if (score >= 25) return '피로누적';
        return '질병주의';
    }

    if (category === 'Lucky') {
        if (score >= 75) return '행운최고';
        if (score >= 50) return '행운좋음';
        if (score >= 25) return '행운보통';
        return '행운주의';
    }

    // Advice: 3단계
    if (category === 'Advice') {
        if (score >= 66) return '조언강조';
        if (score >= 33) return '신중요함';
        return '실행권유';
    }

    return '좋음'; // 기본값
};

/**
 * ✨ 개선된 사주 점수 계산 (0~100)
 * 오행 상생상극, 월령, 절기를 모두 반영
 *
 * @param {string} userDayStem - 사용자 일간
 * @param {Object} todayPillar - 오늘 일진 { stem, branch, index }
 * @param {number} categoryIndex - 카테고리 인덱스 (각 카테고리마다 다른 점수)
 * @returns {number} 0~100 점수
 */
const calculateCategoryScore = (userDayStem, todayPillar, categoryIndex) => {
    const today = new Date();
    const userStemIndex = HEAVENLY_STEMS.indexOf(userDayStem);

    // 1️⃣ 오행 상생상극 점수 (-20 ~ +20)
    const userElement = getStemElement(userDayStem);
    const todayElement = getStemElement(todayPillar.stem);
    const todayBranchElement = getBranchElement(todayPillar.branch);

    // 천간 오행 상호작용 (가중치 60%)
    const stemInteraction = calculateElementInteraction(userElement, todayElement);
    // 지지 오행 상호작용 (가중치 40%)
    const branchInteraction = calculateElementInteraction(userElement, todayBranchElement);

    const elementScore = stemInteraction * 0.6 + branchInteraction * 0.4; // -20 ~ +20

    // 2️⃣ 월령(계절) 보너스 (-10 ~ +10)
    const monthElement = getMonthElement(today.getMonth() + 1);
    const monthBonus = calculateElementInteraction(userElement, monthElement) * 0.5; // -10 ~ +10

    // 3️⃣ 절기 에너지 (0 ~ 43)
    const solarTerm = calculateSolarTerm(today);
    const termEnergy = solarTerm.energy; // 0 ~ 43

    // 4️⃣ 날짜 기반 변동성 (매일 다른 결과 보장)
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // 복잡한 해시 함수로 날짜별 변화 생성
    const complexHash = ((dateSeed * 31 + userStemIndex * 97 + todayPillar.index * 67 + categoryIndex * 43) ^ termEnergy) >>> 0;
    const dailyVariation = (complexHash % 41) - 20; // -20 ~ +20

    // 5️⃣ 카테고리별 가중치 조정
    const categoryWeights = {
        0: { element: 1.0, month: 0.8, term: 0.5, daily: 1.0 },  // Main
        1: { element: 0.9, month: 0.6, term: 0.4, daily: 1.1 },  // Money
        2: { element: 1.1, month: 0.7, term: 0.6, daily: 0.9 },  // Health
        3: { element: 1.0, month: 0.9, term: 0.7, daily: 1.0 },  // Love
        4: { element: 0.8, month: 0.5, term: 0.3, daily: 0.8 }   // Advice
    };

    const weights = categoryWeights[categoryIndex] || categoryWeights[0];

    // 6️⃣ 최종 점수 계산 (0 ~ 100)
    const rawScore = 50 + // 기본 50점
        elementScore * weights.element +     // 오행 상생상극: -20 ~ +20
        monthBonus * weights.month +         // 월령 보너스: -10 ~ +10
        termEnergy * weights.term +          // 절기 에너지: 0 ~ 43
        dailyVariation * weights.daily;      // 일일 변동: -20 ~ +20

    // 0~100 범위로 클램핑
    const finalScore = Math.max(0, Math.min(100, Math.floor(rawScore)));

    // 디버깅용 로그 (개발 시에만 출력)
    if (typeof console !== 'undefined' && false) { // false로 설정하여 운영 시 비활성화
        console.log(`[점수 계산] 카테고리 ${categoryIndex}:`, {
            오행점수: elementScore.toFixed(1),
            월령보너스: monthBonus.toFixed(1),
            절기: solarTerm.name,
            절기에너지: termEnergy,
            일일변동: dailyVariation,
            최종점수: finalScore
        });
    }

    return finalScore;
};

/**
 * ✨ 개선된 오행 기반 행운 요소 선택 (절기 반영)
 * @param {string} dayStem - 일간 (천간)
 * @param {Date} today - 오늘 날짜
 * @param {Object} todayPillar - 오늘의 일진 { stem, branch, index }
 * @param {Object} userData - 사용자 정보
 * @returns {Object} 행운 요소 { introText, numbers, color, direction, items, concepts }
 */
const selectLuckyElements = async (dayStem, today, todayPillar, userData) => {
    try {
        const luckyElementsData = await getLuckyElementsData();
        if (!luckyElementsData) {
            return {
                introText: "오늘은 균형잡힌 기운이 흐르는 날입니다",
                numbers: "1, 5",
                color: "흰색 계열",
                direction: "中",
                items: "빛, 물",
                concepts: "조화, 평온"
            };
        }

        // ✨ 개선: 사용자 일간 + 오늘 일진 + 절기의 오행을 조합
        const userElement = getStemElement(dayStem);
        const todayElement = getStemElement(todayPillar.stem);
        const solarTerm = calculateSolarTerm(today);

        // 오행 배열
        const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
        const userElementIndex = elements.indexOf(userElement);
        const todayElementIndex = elements.indexOf(todayElement);

        // ✨ 절기 에너지를 오행 선택에 반영
        const termBonus = solarTerm.index % 5; // 0-4, 24절기를 5개 오행에 매핑

        // 세 요소의 조합으로 최종 오행 결정 (절기 추가로 더욱 다양해짐)
        const combinedElementIndex = (userElementIndex + todayElementIndex + termBonus) % elements.length;
        const finalElement = elements[combinedElementIndex];

        const elementData = luckyElementsData[finalElement];

        if (!elementData) {
            return {
                introText: "오늘은 균형잡힌 기운이 흐르는 날입니다",
                numbers: "1, 5",
                color: "흰색 계열",
                direction: "中",
                items: "빛, 물",
                concepts: "조화, 평온"
            };
        }

        // ✨ 시드 생성: 절기 index도 추가하여 더욱 다양한 결과
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const birthString = `${userData.birthYear}-${userData.birthMonth}-${userData.birthDay}`;
        const birthTimeString = (userData.birthHour !== undefined && userData.birthMinute !== undefined)
            ? `-${userData.birthHour}-${userData.birthMinute}`
            : '';
        const todayPillarString = `-${todayPillar.index}`; // 오늘 일진
        const termString = `-${solarTerm.index}`; // 절기 추가
        const combinedString = dateString + birthString + birthTimeString + todayPillarString + termString;
        const seed = combinedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const random = (max, offset = 0) => {
            const x = Math.sin(seed + max + offset) * 10000;
            return Math.floor((x - Math.floor(x)) * max);
        };

        // 요소 선택
        const color = elementData.colors[random(elementData.colors.length, 1)];
        const direction = elementData.direction;
        const selectedItems = [];
        const selectedConcepts = [];

        // 아이템 2개 선택 (매일 다른 조합)
        const itemsCopy = [...elementData.items];
        for (let i = 0; i < Math.min(2, itemsCopy.length); i++) {
            const idx = random(itemsCopy.length - i, i * 10);
            selectedItems.push(itemsCopy[idx]);
            itemsCopy.splice(idx, 1);
        }

        // 개념 2개 선택 (매일 다른 조합)
        const conceptsCopy = [...elementData.concepts];
        for (let i = 0; i < Math.min(2, conceptsCopy.length); i++) {
            const idx = random(conceptsCopy.length - i, i * 20);
            selectedConcepts.push(conceptsCopy[idx]);
            conceptsCopy.splice(idx, 1);
        }

        return {
            introText: elementData.introText,
            numbers: elementData.numbers.join(', '),
            color: color,
            direction: direction,
            items: selectedItems.join(', '),
            concepts: selectedConcepts.join(', ')
        };
    } catch (error) {
        console.error('Failed to select lucky elements:', error);
        return {
            introText: "오늘은 균형잡힌 기운이 흐르는 날입니다",
            numbers: "1, 5",
            color: "흰색 계열",
            direction: "中",
            items: "빛, 물",
            concepts: "조화, 평온"
        };
    }
};

/**
 * 메인 운세 계산 함수 (새 JSON DB 사용)
 * @param {Object} userData - { name, birthYear, birthMonth, birthDay, gender, birthTime, birthCity }
 * @param {Object} fortuneData - getFortuneData()로 받은 카테고리별 데이터
 * @returns {Object} 전체 운세 결과
 */
export const calculateFortune = async (userData, fortuneData) => {
    // 1. 사용자 일간 계산
    const userDayStem = calculateDayStem(userData);

    // 2. 오늘 일진 계산
    const today = new Date();
    const todayPillar = calculateDayPillar(today);

    // 3. 별자리 계산
    const zodiacSign = calculateZodiacSign(userData);

    // 4. 종합 운세 계산 (Main + Main2 조합)
    const overallScore = calculateCategoryScore(userDayStem, todayPillar, 0);
    const overallKeyword = mapScoreToKeyword(overallScore, 'Main');
    const overallContent = await getCombinedFortune(overallKeyword);

    // 5. 세부 운세 계산: 각 카테고리별로 점수 → 키워드 → 랜덤 콘텐츠 선택
    const categories = ['Money', 'Health', 'Love', 'Advice'];
    const results = {};

    for (let index = 0; index < categories.length; index++) {
        const category = categories[index];
        // 사주 기반 점수 계산 (0~100)
        // index + 1 을 사용하여 Main(0)과 다른 시드값 사용
        const score = calculateCategoryScore(userDayStem, todayPillar, index + 1);

        // 점수를 키워드로 변환
        const keyword = mapScoreToKeyword(score, category);

        // 새 JSON DB에서 랜덤 문장 선택
        const content = await getRandomFortune(category, keyword);

        results[category.toLowerCase()] = {
            keyword: keyword || '',
            content: content || `${category} 운세를 불러올 수 없습니다.`
        };
    }

    // 6. 행운 요소 계산 (오행 + 개인 생년월일 + 오늘 일진 기반)
    const luckyElements = await selectLuckyElements(userDayStem, today, todayPillar, userData);

    // 7. 타로 카드 선택 (개선된 로직)
    const tarot = await selectTarotCard(userData, today);

    // 8. 별자리 운세 선택 (신문 스타일: 날짜 기반)
    const horoscopeFortune = await selectHoroscopeFortune(zodiacSign, today);

    // 날짜를 YYYY-MM-DD 형식으로 저장 (자정 기준 정확한 비교)
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return {
        date: dateStr,
        userName: userData.name,
        userDayStem: `${userDayStem}(${getStemHanja(userDayStem)})`,
        todayPillar: `${todayPillar.stem}${todayPillar.branch}(${getStemHanja(todayPillar.stem)}${getBranchHanja(todayPillar.branch)})`,
        zodiacSign,
        lunarDate: userData.lunarDate, // 음력 날짜 추가

        // 종합 운세 (Main + Main2 조합)
        overall: {
            keyword: overallKeyword || '',
            content: overallContent || '오늘도 좋은 하루 되세요!'
        },

        // 세부 운세
        money: results.money,
        health: results.health,
        love: results.love,
        advice: results.advice,

        // 행운 요소 (오행 기반)
        lucky: luckyElements,

        // 타로
        tarot: {
            card: tarot.card,
            isReversed: tarot.isReversed,
            message: tarot.message,
            content: tarot.content,
            id: tarot.id,
            imageFile: tarot.imageFile
        },

        // 별자리 (신문 스타일: 날짜 기반)
        starSign: {
            sign: zodiacSign,
            keyword: horoscopeFortune.keyword,
            content: horoscopeFortune.content
        }
    };
};

/**
 * 운세 저장 키 생성 (로그인 상태별 키 사용)
 * ✨ 게스트와 로그인 각각 하루 1회씩 가능 (총 2회)
 * @returns {string} localStorage 키
 */
const getFortuneStorageKey = () => {
    if (isUserLoggedIn()) {
        // 로그인 사용자: 이메일 기반 키
        const userProfile = JSON.parse(localStorage.getItem('userProfile'));
        const userEmail = userProfile?.email || 'logged_in_user';
        return `todayFortune_${userEmail}`;
    } else {
        // 게스트: 게스트 전용 키
        return 'todayFortune_guest';
    }
};

/**
 * 오늘의 운세가 이미 생성되었는지 확인
 * ✨ 로그인 상태별로 별도 저장 (게스트 1회 + 로그인 1회 = 총 2회)
 * @returns {Object|null} 저장된 운세 또는 null
 */
export const getTodayFortune = () => {
    const storageKey = getFortuneStorageKey();
    const savedFortune = localStorage.getItem(storageKey);
    if (!savedFortune) return null;

    const fortuneData = JSON.parse(savedFortune);
    console.log('[getTodayFortune] 로드한 데이터:', fortuneData);
    console.log('[getTodayFortune] overall.content:', fortuneData?.overall?.content);

    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성 (자정 기준 정확한 비교)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 날짜가 오늘과 같으면 반환
    if (fortuneData.date === todayStr) {
        return fortuneData;
    }

    // 날짜가 다르면 삭제하고 null 반환
    localStorage.removeItem(storageKey);
    return null;
};

/**
 * 운세 결과 저장
 * ✨ 로그인 상태별로 별도 저장
 * @param {Object} fortuneResult - calculateFortune()의 결과
 */
export const saveTodayFortune = (fortuneResult) => {
    const storageKey = getFortuneStorageKey();
    console.log('[saveTodayFortune] 저장하는 데이터:', fortuneResult);
    console.log('[saveTodayFortune] overall.content:', fortuneResult?.overall?.content);
    localStorage.setItem(storageKey, JSON.stringify(fortuneResult));
};

/**
 * 로그인 여부 확인 헬퍼 함수
 * @returns {boolean} 로그인 상태 여부
 */
export const isUserLoggedIn = () => {
    // Check if user is logged in by looking for Google profile in localStorage
    const userProfile = localStorage.getItem('userProfile');
    return !!userProfile;
};

/**
 * 사용자 프로필 저장
 * ⭐ Evernote 방식: Firestore + localStorage 동기화
 * @param {Object} userData - 사용자 정보
 * @param {string} userId - 사용자 ID (로그인 시 필수)
 * @param {Function} saveToFirestore - Firestore 저장 함수 (선택, 제공 시 사용)
 */
export const saveUserProfile = async (userData, userId = null, saveToFirestore = null) => {
    if (isUserLoggedIn() && userId) {
        // ⭐ 로그인 사용자: localStorage + Firestore 동시 저장
        localStorage.setItem('fortuneUserProfile', JSON.stringify(userData));

        // Firestore 저장 (제공된 경우)
        if (saveToFirestore && typeof saveToFirestore === 'function') {
            try {
                await saveToFirestore(userId, userData);
                console.log('✅ 운세 프로필 Firestore 저장 완료');
            } catch (error) {
                console.error('❌ 운세 프로필 Firestore 저장 실패:', error);
                // localStorage는 이미 저장됨 - 다음 로드 시 재시도
            }
        }
    } else {
        // 게스트: localStorage만 사용 (당일만 유효)
        const dataWithDate = {
            ...userData,
            savedDate: new Date().toLocaleDateString('ko-KR')
        };
        localStorage.setItem('fortuneUserProfile_guest', JSON.stringify(dataWithDate));
    }
};

/**
 * 사용자 프로필 불러오기
 * ⭐ Evernote 방식: Firestore 우선, localStorage 폴백
 * @param {string} userId - 사용자 ID (로그인 시 필수)
 * @param {Function} fetchFromFirestore - Firestore 가져오기 함수 (선택, 제공 시 사용)
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
export const getUserProfile = async (userId = null, fetchFromFirestore = null) => {
    if (isUserLoggedIn() && userId) {
        // ⭐ 로그인 사용자: Firestore 우선, 없으면 localStorage
        if (fetchFromFirestore && typeof fetchFromFirestore === 'function') {
            try {
                const firestoreProfile = await fetchFromFirestore(userId);
                if (firestoreProfile) {
                    // Firestore 데이터를 localStorage에도 캐싱
                    localStorage.setItem('fortuneUserProfile', JSON.stringify(firestoreProfile));
                    console.log('✅ 운세 프로필 Firestore 로드 완료');
                    return firestoreProfile;
                }
            } catch (error) {
                console.error('❌ 운세 프로필 Firestore 로드 실패:', error);
                // localStorage 폴백으로 진행
            }
        }

        // Firestore 실패 시 localStorage 폴백
        const saved = localStorage.getItem('fortuneUserProfile');
        const localProfile = saved ? JSON.parse(saved) : null;

        if (localProfile) {
            console.log('⚠️ localStorage 폴백 사용 (Firestore 로드 실패)');
        }

        return localProfile;
    } else {
        // 게스트: localStorage만 사용 (당일만 유효)
        const saved = localStorage.getItem('fortuneUserProfile_guest');
        if (!saved) return null;

        const savedData = JSON.parse(saved);
        const today = new Date().toLocaleDateString('ko-KR');

        // 저장된 날짜가 오늘과 같으면 반환
        if (savedData.savedDate === today) {
            // savedDate 필드 제거 후 반환
            const { savedDate, ...userData } = savedData;
            return userData;
        }

        // 날짜가 다르면 삭제하고 null 반환
        localStorage.removeItem('fortuneUserProfile_guest');
        return null;
    }
};

/**
 * 가챠 테스트 모드 플래그
 * true로 설정하면 하루 1회 제한 무시
 */
export const IS_TESTING_MODE = false; // ⚠️ 테스트용: true, 배포 시 false로 변경