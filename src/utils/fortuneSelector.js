// src/utils/fortuneSelector.js
// 사주 운세 데이터 선택 유틸리티

import fortuneData from '../data/fortune_database.json';

/**
 * 카테고리와 키워드에 맞는 운세 문장을 랜덤으로 선택
 * @param {string} category - 카테고리 ('Main', 'Money', 'Love', 'Health', 'Advice', 'Lucky')
 * @param {string} keyword - 키워드 (예: '매우좋음', '재물상승', '애정최고' 등)
 * @returns {string} 랜덤으로 선택된 운세 문장
 */
export const getRandomFortune = (category, keyword) => {
    try {
        const categoryData = fortuneData[category];

        if (!categoryData) {
            console.warn(`카테고리를 찾을 수 없습니다: ${category}`);
            return '운세 정보를 불러올 수 없습니다.';
        }

        const keywordData = categoryData[keyword];

        if (!keywordData || keywordData.length === 0) {
            console.warn(`키워드를 찾을 수 없습니다: ${category} - ${keyword}`);
            return '운세 정보를 불러올 수 없습니다.';
        }

        // 랜덤 인덱스 선택
        const randomIndex = Math.floor(Math.random() * keywordData.length);
        return keywordData[randomIndex];

    } catch (error) {
        console.error('운세 데이터 로딩 오류:', error);
        return '운세 정보를 불러올 수 없습니다.';
    }
};

/**
 * Main과 Main2를 조합하여 종합 운세 생성
 * @param {string} keyword - 키워드 (예: '매우좋음', '좋음', '보통', '주의')
 * @returns {string} Main + "\n또한, " + Main2로 조합된 운세 문장
 */
export const getCombinedFortune = (keyword) => {
    try {
        // Main에서 1개 랜덤 선택
        const mainContent = getRandomFortune('Main', keyword);

        // Main2에서 1개 랜덤 선택
        const main2Content = getRandomFortune('Main2', keyword);

        // 줄바꿈 + "또한," 으로 연결
        return `${mainContent}\n또한, ${main2Content}`;

    } catch (error) {
        console.error('종합 운세 생성 오류:', error);
        return '운세 정보를 불러올 수 없습니다.';
    }
};

/**
 * 오늘의 운세 전체 결과 생성
 * @param {Object} sajuResult - 사주 계산 결과 객체
 * @param {string} sajuResult.main - 메인 운세 키워드
 * @param {string} sajuResult.money - 재물운 키워드
 * @param {string} sajuResult.love - 애정운 키워드
 * @param {string} sajuResult.health - 건강운 키워드
 * @param {string} sajuResult.advice - 조언 키워드
 * @param {string} sajuResult.lucky - 행운 요소 키워드
 * @returns {Object} 각 카테고리별 운세 문장
 */
export const getTodayFortune = (sajuResult) => {
    return {
        main: getRandomFortune('Main', sajuResult.main),
        money: getRandomFortune('Money', sajuResult.money),
        love: getRandomFortune('Love', sajuResult.love),
        health: getRandomFortune('Health', sajuResult.health),
        advice: getRandomFortune('Advice', sajuResult.advice),
        lucky: getRandomFortune('Lucky', sajuResult.lucky)
    };
};

/**
 * 사용 가능한 모든 카테고리와 키워드 목록
 */
export const FORTUNE_CATEGORIES = {
    Main: ['매우좋음', '좋음', '보통', '주의'],
    Money: ['재물상승', '현상유지', '지출주의', '재정악화'],
    Love: ['애정최고', '관계발전', '소강상태', '다툼주의'],
    Health: ['건강좋음', '활력넘침', '피로누적', '질병주의'],
    Advice: ['조언강조', '신중요함', '실행권유'],
    Lucky: ['행운최고', '행운좋음', '행운보통', '행운주의']
};

/**
 * 카테고리별 이모지 아이콘
 */
export const CATEGORY_ICONS = {
    Main: '🌟',
    Money: '💰',
    Love: '❤️',
    Health: '🏥',
    Advice: '💡',
    Lucky: '🍀'
};

/**
 * 카테고리별 한글 이름
 */
export const CATEGORY_NAMES = {
    Main: '메인 운세',
    Money: '재물운',
    Love: '애정운',
    Health: '건강운',
    Advice: '오늘의 조언',
    Lucky: '행운 요소'
};
