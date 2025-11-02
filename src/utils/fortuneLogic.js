// src/utils/fortuneLogic.js

// 🌟 사주팔자 기반 운세 계산 로직

import { getTarotData, getHoroscopeData } from './fortuneData';

// 천간 (Heavenly Stems) - 10개
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// 지지 (Earthly Branches) - 12개
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

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

// 별자리 운세 데이터 로드 (240개: 12별자리 × 20개)
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
 * 생년월일로부터 일간(Day Master) 계산
 * @param {Object} userData - { birthYear, birthMonth, birthDay }
 * @returns {string} 일간 (천간)
 */
export const calculateDayStem = (userData) => {
    const { birthYear, birthMonth, birthDay } = userData;
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const dayPillar = calculateDayPillar(birthDate);
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
    const { birthYear, birthMonth, birthDay } = userData;

    // 생년월일 기반 에너지
    const lifePathNumber = (birthYear + birthMonth * 31 + birthDay * 17);

    // 일간 반영 (이미 계산된 사주 데이터 활용)
    const dayStem = calculateDayStem(userData);
    const stemIndex = HEAVENLY_STEMS.indexOf(dayStem);
    const stemBoost = stemIndex * 7;

    return lifePathNumber + stemBoost;
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

    // 해당 별자리의 운세만 필터링 (20개)
    const zodiacFortunes = horoscopeData.filter(item =>
        item.ID && item.ID.startsWith(`H_${zodiacCode}_`)
    );

    if (zodiacFortunes.length === 0) {
        return {
            keyword: '운세',
            content: '오늘도 좋은 하루 되세요!'
        };
    }

    // 오늘 날짜로 인덱스 결정 (같은 날은 같은 운세)
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const index = dayOfYear % zodiacFortunes.length;
    const selectedFortune = zodiacFortunes[index];

    return {
        keyword: selectedFortune.Keyword || '운세',
        content: selectedFortune.Content || '오늘도 좋은 하루 되세요!'
    };
};

/**
 * 메인 운세 계산 함수
 * @param {Object} userData - { name, birthYear, birthMonth, birthDay, gender, birthTime, birthCity }
 * @param {Object} fortuneData - getFortuneData()로 받은 카테고리별 데이터
 * @returns {Object} 전체 운세 결과
 */
export const calculateFortune = (userData, fortuneData) => {
    // 1. 사용자 일간 계산
    const userDayStem = calculateDayStem(userData);

    // 2. 오늘 일진 계산
    const today = new Date();
    const todayPillar = calculateDayPillar(today);

    // 3. 별자리 계산
    const zodiacSign = calculateZodiacSign(userData);

    // 4. 각 카테고리별로 키워드 선택 → 랜덤 콘텐츠 선택
    const categories = ['Main', 'Money', 'Health', 'Love', 'Advice'];
    const results = {};

    categories.forEach(category => {
        const categoryData = fortuneData[category] || [];
        const keyword = selectKeyword(userDayStem, todayPillar, categoryData);
        const selectedItem = selectRandomContentByKeyword(keyword, categoryData);

        results[category.toLowerCase()] = {
            keyword: keyword || '',
            content: selectedItem?.Content || `${category} 운세를 불러올 수 없습니다.`,
            id: selectedItem?.ID || ''
        };
    });

    // 5. 행운 요소 선택
    const luckyData = fortuneData.Lucky || [];
    const luckyElement = selectLuckyElement(userData, luckyData);

    // 6. 타로 카드 선택 (개선된 로직)
    const tarot = selectTarotCard(userData, today);

    // 7. 별자리 운세 선택 (신문 스타일: 날짜 기반)
    const horoscopeFortune = selectHoroscopeFortune(zodiacSign, today);

    // 8. 오늘의 운세 (Main에서 한번 더 선택)
    const todayKeyword = selectKeyword(userDayStem, todayPillar, fortuneData.Main || []);
    const todayItem = selectRandomContentByKeyword(todayKeyword, fortuneData.Main || []);

    return {
        date: today.toLocaleDateString('ko-KR'),
        userName: userData.name,
        userDayStem,
        todayPillar: `${todayPillar.stem}${todayPillar.branch}`,
        zodiacSign,

        // 운세 결과
        today: {
            keyword: todayKeyword || '',
            content: todayItem?.Content || '오늘은 좋은 일이 있을 거예요!'
        },
        main: results.main,
        money: results.money,
        health: results.health,
        love: results.love,
        advice: results.advice,

        // 행운 요소
        lucky: {
            keyword: luckyElement.keyword,
            content: luckyElement.content
        },

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
 * 운세 저장 키 생성 (로그인 상태에 따라 다른 키 사용)
 * ✨ 게스트와 로그인 사용자가 서로 다른 키를 사용하여 중복 사용 방지
 * @returns {string} localStorage 키
 */
const getFortuneStorageKey = () => {
    if (isUserLoggedIn()) {
        // Logged-in user: use email-based key
        const userProfile = JSON.parse(localStorage.getItem('userProfile'));
        const userEmail = userProfile?.email || 'logged_in_user';
        return `todayFortune_${userEmail}`;
    } else {
        // Guest user: use guest key
        return 'todayFortune_guest';
    }
};

/**
 * 오늘의 운세가 이미 생성되었는지 확인
 * ✨ 로그인 상태별로 별도 저장하여 게스트/로그인 중복 사용 방지
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
 * ✨ 로그인 상태별로 별도 저장하여 게스트/로그인 중복 사용 방지
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
const isUserLoggedIn = () => {
    // Check if user is logged in by looking for Google profile in localStorage
    const userProfile = localStorage.getItem('userProfile');
    return !!userProfile;
};

/**
 * 사용자 프로필 저장
 * ✨ 로그인된 사용자만 저장, 게스트는 저장하지 않음
 * @param {Object} userData - 사용자 정보
 */
export const saveUserProfile = (userData) => {
    // Only save if user is logged in
    if (isUserLoggedIn()) {
        localStorage.setItem('fortuneUserProfile', JSON.stringify(userData));
    }
    // Guest users: do not save (they will need to re-enter each time)
};

/**
 * 사용자 프로필 불러오기
 * ✨ 로그인된 사용자만 불러옴, 게스트는 항상 null 반환
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getUserProfile = () => {
    // Only load if user is logged in
    if (isUserLoggedIn()) {
        const saved = localStorage.getItem('fortuneUserProfile');
        return saved ? JSON.parse(saved) : null;
    }
    // Guest users: always return null (forcing re-entry)
    return null;
};

/**
 * 가챠 테스트 모드 플래그
 * true로 설정하면 하루 1회 제한 무시
 */
export const IS_TESTING_MODE = true; // ⚠️ 테스트용: true, 배포 시 false로 변경