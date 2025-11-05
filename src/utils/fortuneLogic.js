// src/utils/fortuneLogic.js

// 🌟 사주팔자 기반 운세 계산 로직

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

const loadTarotData = () => {
    if (!TAROT_DATA) {
        TAROT_DATA = getTarotData();
    }
    return TAROT_DATA;
};

// 별자리 운세 데이터 로드 (2400개: 12별자리 × 200개)
let HOROSCOPE_DATA = null;

const loadHoroscopeData = () => {
    if (!HOROSCOPE_DATA) {
        HOROSCOPE_DATA = getHoroscopeData();
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
 * 정/역방향 결정
 * @param {Object} userData - 사용자 정보
 * @param {Date} date - 현재 시각
 * @returns {boolean} true면 역방향
 */
const calculateReversed = (userData, date) => {
    const { birthDay } = userData;
    const currentDay = date.getDate();
    const hour = date.getHours();

    // 복합 요소로 정/역 결정
    const reverseScore = (birthDay * 3 + currentDay * 2 + hour) % 10;

    // 40% 확률로 역방향 (실제 타로 통계)
    return reverseScore < 4;
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
 * @returns {Object} { card: string, isReversed: boolean, message: string, content: string, id: string }
 */
const selectTarotCard = (userData, currentTime) => {
    // 타로 데이터 로드 (156개: 78장 × 정/역방향)
    const tarotData = loadTarotData();

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
 * 별자리 운세 선택 (신문 스타일: 날짜 기반)
 * @param {string} zodiacSign - 별자리 이름
 * @param {Date} date - 날짜
 * @returns {Object} { keyword: string, content: string }
 */
const selectHoroscopeFortune = (zodiacSign, date) => {
    // 별자리 운세 데이터 로드
    const horoscopeData = loadHoroscopeData();

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

    // 오늘 날짜로 인덱스 결정 (같은 날은 같은 운세, 200개 순환)
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const index = dayOfYear % zodiacFortunes.length;
    const selectedFortune = zodiacFortunes[index];

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
 * 사주 계산 결과로 점수 산출 (0~100)
 * @param {string} userDayStem - 사용자 일간
 * @param {Object} todayPillar - 오늘 일진
 * @param {number} categoryIndex - 카테고리 인덱스 (각 카테고리마다 다른 점수)
 * @returns {number} 0~100 점수
 */
const calculateCategoryScore = (userDayStem, todayPillar, categoryIndex) => {
    const userStemIndex = HEAVENLY_STEMS.indexOf(userDayStem);

    // 천간 인덱스 + 지지 인덱스 + 카테고리별 가중치
    const baseScore = (userStemIndex + todayPillar.index + categoryIndex * 7) % 100;

    // 0~100 범위로 정규화
    return baseScore;
};

/**
 * 오행 기반 행운 요소 선택
 * @param {string} dayStem - 일간 (천간)
 * @param {Date} today - 오늘 날짜
 * @returns {Object} 행운 요소 { introText, numbers, color, direction, items, concepts }
 */
const selectLuckyElements = async (dayStem, today, userData) => {
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

        // 일간의 오행 계산
        const element = getStemElement(dayStem);
        const elementData = luckyElementsData[element];

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

        // 날짜 + 사용자 생년월일 + 출생시간 기반 시드로 개인화된 랜덤 선택
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const birthString = `${userData.birthYear}-${userData.birthMonth}-${userData.birthDay}`;
        const birthTimeString = (userData.birthHour !== undefined && userData.birthMinute !== undefined)
            ? `-${userData.birthHour}-${userData.birthMinute}`
            : '';
        const combinedString = dateString + birthString + birthTimeString;
        const seed = combinedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const random = (max) => {
            const x = Math.sin(seed + max) * 10000;
            return Math.floor((x - Math.floor(x)) * max);
        };

        // 요소 선택
        const color = elementData.colors[random(elementData.colors.length)];
        const direction = elementData.direction;
        const selectedItems = [];
        const selectedConcepts = [];

        // 아이템 2개 선택
        const itemsCopy = [...elementData.items];
        for (let i = 0; i < Math.min(2, itemsCopy.length); i++) {
            const idx = random(itemsCopy.length - i);
            selectedItems.push(itemsCopy[idx]);
            itemsCopy.splice(idx, 1);
        }

        // 개념 2개 선택
        const conceptsCopy = [...elementData.concepts];
        for (let i = 0; i < Math.min(2, conceptsCopy.length); i++) {
            const idx = random(conceptsCopy.length - i);
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
    const overallContent = getCombinedFortune(overallKeyword);

    // 5. 세부 운세 계산: 각 카테고리별로 점수 → 키워드 → 랜덤 콘텐츠 선택
    const categories = ['Money', 'Health', 'Love', 'Advice'];
    const results = {};

    categories.forEach((category, index) => {
        // 사주 기반 점수 계산 (0~100)
        // index + 1 을 사용하여 Main(0)과 다른 시드값 사용
        const score = calculateCategoryScore(userDayStem, todayPillar, index + 1);

        // 점수를 키워드로 변환
        const keyword = mapScoreToKeyword(score, category);

        // 새 JSON DB에서 랜덤 문장 선택
        const content = getRandomFortune(category, keyword);

        results[category.toLowerCase()] = {
            keyword: keyword || '',
            content: content || `${category} 운세를 불러올 수 없습니다.`
        };
    });

    // 6. 행운 요소 계산 (오행 + 개인 생년월일 기반)
    const luckyElements = await selectLuckyElements(userDayStem, today, userData);

    // 7. 타로 카드 선택 (개선된 로직)
    const tarot = selectTarotCard(userData, today);

    // 8. 별자리 운세 선택 (신문 스타일: 날짜 기반)
    const horoscopeFortune = selectHoroscopeFortune(zodiacSign, today);

    return {
        date: today.toLocaleDateString('ko-KR'),
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
    const today = new Date().toLocaleDateString('ko-KR');

    // 날짜가 오늘과 같으면 반환
    if (fortuneData.date === today) {
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
 * ✨ 로그인 사용자와 게스트 모두 저장 (게스트는 당일만 유지)
 * @param {Object} userData - 사용자 정보
 */
export const saveUserProfile = (userData) => {
    if (isUserLoggedIn()) {
        // 로그인 사용자: 영구 저장
        localStorage.setItem('fortuneUserProfile', JSON.stringify(userData));
    } else {
        // 게스트: 날짜와 함께 저장 (당일만 유효)
        const dataWithDate = {
            ...userData,
            savedDate: new Date().toLocaleDateString('ko-KR')
        };
        localStorage.setItem('fortuneUserProfile_guest', JSON.stringify(dataWithDate));
    }
};

/**
 * 사용자 프로필 불러오기
 * ✨ 로그인 사용자는 영구 프로필, 게스트는 당일 프로필만 반환
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getUserProfile = () => {
    if (isUserLoggedIn()) {
        // 로그인 사용자: 영구 저장된 프로필 반환
        const saved = localStorage.getItem('fortuneUserProfile');
        return saved ? JSON.parse(saved) : null;
    } else {
        // 게스트: 당일 저장된 프로필만 반환
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