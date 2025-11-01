// src/utils/fortuneLogic.js

// 🌟 사주팔자 기반 운세 계산 로직

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

// 타로 카드 78장 (22 Major + 56 Minor)
const TAROT_CARDS = [
    // Major Arcana (22장)
    '바보', '마법사', '여사제', '여황제', '황제', '교황', '연인',
    '전차', '힘', '은둔자', '운명의 수레바퀴', '정의', '매달린 사람',
    '죽음', '절제', '악마', '탑', '별', '달', '태양', '심판', '세계',
    // Wands (14장)
    '완드 에이스', '완드 2', '완드 3', '완드 4', '완드 5', '완드 6', '완드 7',
    '완드 8', '완드 9', '완드 10', '완드 시종', '완드 기사', '완드 여왕', '완드 왕',
    // Cups (14장)
    '컵 에이스', '컵 2', '컵 3', '컵 4', '컵 5', '컵 6', '컵 7',
    '컵 8', '컵 9', '컵 10', '컵 시종', '컵 기사', '컵 여왕', '컵 왕',
    // Swords (14장)
    '검 에이스', '검 2', '검 3', '검 4', '검 5', '검 6', '검 7',
    '검 8', '검 9', '검 10', '검 시종', '검 기사', '검 여왕', '검 왕',
    // Pentacles (14장)
    '펜타클 에이스', '펜타클 2', '펜타클 3', '펜타클 4', '펜타클 5', '펜타클 6', '펜타클 7',
    '펜타클 8', '펜타클 9', '펜타클 10', '펜타클 시종', '펜타클 기사', '펜타클 여왕', '펜타클 왕'
];

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
 * 타로 카드 선택 (정방향/역방향 포함)
 * @param {Object} userData - 사용자 정보
 * @param {Object} todayPillar - 오늘의 일진
 * @returns {Object} { card: string, isReversed: boolean, message: string }
 */
const selectTarotCard = (userData, todayPillar) => {
    const { birthYear, birthMonth, birthDay } = userData;

    // 카드 선택 (deterministic)
    const cardIndex = hashValues([birthYear, birthMonth, birthDay, todayPillar.index], TAROT_CARDS.length);
    const card = TAROT_CARDS[cardIndex];

    // 정/역방향 결정 (deterministic)
    const isReversed = hashValues([birthYear + birthMonth + birthDay, todayPillar.index], 2) === 1;

    return {
        card,
        isReversed,
        message: `${card}${isReversed ? ' (역방향)' : ''}`
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

    // 6. 타로 카드 선택
    const tarot = selectTarotCard(userData, todayPillar);

    // 7. 별자리 운세 선택
    const starSignData = fortuneData.StarSign || [];
    const starSignKeyword = selectKeyword(userDayStem, todayPillar, starSignData);
    const starSignItem = selectRandomContentByKeyword(starSignKeyword, starSignData);

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
            message: tarot.message
        },

        // 별자리
        starSign: {
            sign: zodiacSign,
            keyword: starSignKeyword || '',
            content: starSignItem?.Content || '별자리 운세를 불러올 수 없습니다.'
        }
    };
};

/**
 * 오늘의 운세가 이미 생성되었는지 확인
 * @returns {Object|null} 저장된 운세 또는 null
 */
export const getTodayFortune = () => {
    const savedFortune = localStorage.getItem('todayFortune');
    if (!savedFortune) return null;

    const fortuneData = JSON.parse(savedFortune);
    const today = new Date().toLocaleDateString('ko-KR');

    // 날짜가 오늘과 같으면 반환
    if (fortuneData.date === today) {
        return fortuneData;
    }

    // 날짜가 다르면 삭제하고 null 반환
    localStorage.removeItem('todayFortune');
    return null;
};

/**
 * 운세 결과 저장
 * @param {Object} fortuneResult - calculateFortune()의 결과
 */
export const saveTodayFortune = (fortuneResult) => {
    localStorage.setItem('todayFortune', JSON.stringify(fortuneResult));
};

/**
 * 사용자 프로필 저장
 * @param {Object} userData - 사용자 정보
 */
export const saveUserProfile = (userData) => {
    localStorage.setItem('fortuneUserProfile', JSON.stringify(userData));
};

/**
 * 사용자 프로필 불러오기
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getUserProfile = () => {
    const saved = localStorage.getItem('fortuneUserProfile');
    return saved ? JSON.parse(saved) : null;
};

/**
 * 테스트 모드 플래그
 * true로 설정하면 하루 1회 제한 무시
 */
export const IS_TESTING_MODE = true; // 배포 시 false로 변경
