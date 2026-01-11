// src/utils/fortuneConstants.js
// 사주팔자 기반 운세 계산에 사용되는 상수 데이터

// 천간 (Heavenly Stems) - 10개
export const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const HEAVENLY_STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 지지 (Earthly Branches) - 12개
export const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const EARTHLY_BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 12띠 (12 Zodiac Animals)
export const ZODIAC_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

// 12 별자리
export const ZODIAC_SIGNS = [
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

// 24절기 (간략화된 고정 날짜)
export const SOLAR_TERMS = [
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

// 천간의 오행 매핑
export const STEM_ELEMENT_MAP = {
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

// 지지의 오행 매핑
export const BRANCH_ELEMENT_MAP = {
    '인': 'Wood', '묘': 'Wood',  // 寅卯 - 목
    '사': 'Fire', '오': 'Fire',  // 巳午 - 화
    '신': 'Metal', '유': 'Metal', // 申酉 - 금
    '해': 'Water', '자': 'Water', // 亥子 - 수
    '진': 'Earth', '술': 'Earth', '축': 'Earth', '미': 'Earth' // 辰戌丑未 - 토
};

// 오행 상생 관계 (木生火, 火生土, 土生金, 金生水, 水生木)
export const ELEMENT_GENERATING = {
    'Wood': 'Fire',   // 木生火
    'Fire': 'Earth',  // 火生土
    'Earth': 'Metal', // 土生金
    'Metal': 'Water', // 金生水
    'Water': 'Wood'   // 水生木
};

// 오행 상극 관계 (木剋土, 土剋水, 水剋火, 火剋金, 金剋木)
export const ELEMENT_CONTROLLING = {
    'Wood': 'Earth',  // 木剋土
    'Earth': 'Water', // 土剋水
    'Water': 'Fire',  // 水剋火
    'Fire': 'Metal',  // 火剋金
    'Metal': 'Wood'   // 金剋木
};

// 월령(月令) 오행 매핑
export const MONTH_ELEMENTS = {
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

// 별자리 영문 약어 매핑
export const ZODIAC_SIGN_MAP = {
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

// 카테고리별 가중치 (점수 계산 시 사용)
export const CATEGORY_WEIGHTS = {
    0: { element: 1.0, month: 0.8, term: 0.5, daily: 1.0 },  // Main
    1: { element: 0.9, month: 0.6, term: 0.4, daily: 1.1 },  // Money
    2: { element: 1.1, month: 0.7, term: 0.6, daily: 0.9 },  // Health
    3: { element: 1.0, month: 0.9, term: 0.7, daily: 1.0 },  // Love
    4: { element: 0.8, month: 0.5, term: 0.3, daily: 0.8 }   // Advice
};
