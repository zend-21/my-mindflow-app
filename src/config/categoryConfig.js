// src/config/categoryConfig.js

/**
 * Kakao Local API 카테고리 그룹 코드
 * https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-category
 */
export const KAKAO_CATEGORIES = {
  RESTAURANT: {
    id: 'restaurant',
    code: 'FD6', // 음식점
    name: '음식점',
    icon: 'utensils',
  },
  CAFE: {
    id: 'cafe',
    code: 'CE7', // 카페
    name: '카페',
    icon: 'coffee',
  },
  HOSPITAL: {
    id: 'hospital',
    code: 'HP8', // 병원
    name: '병원',
    icon: 'hospital',
  },
  PHARMACY: {
    id: 'pharmacy',
    code: 'PM9', // 약국
    name: '약국',
    icon: 'pills',
  },
  GAS_STATION: {
    id: 'gas_station',
    code: 'OL7', // 주유소
    name: '주유소',
    icon: 'gas-pump',
  },
  CONVENIENCE_STORE: {
    id: 'convenience_store',
    code: 'CS2', // 편의점
    name: '편의점',
    icon: 'store',
  },
  PARKING: {
    id: 'parking',
    code: 'PK6', // 주차장
    name: '주차장',
    icon: 'parking',
  },
  SUBWAY: {
    id: 'subway',
    code: 'SW8', // 지하철역
    name: '지하철역',
    icon: 'subway',
  },
  BANK: {
    id: 'bank',
    code: 'BK9', // 은행
    name: '은행',
    icon: 'bank',
  },
  CULTURE: {
    id: 'culture',
    code: 'CT1', // 문화시설
    name: '문화시설',
    icon: 'theater',
  },
  TOURISM: {
    id: 'tourism',
    code: 'AT4', // 관광명소
    name: '관광명소',
    icon: 'landmark',
  },
  ACCOMMODATION: {
    id: 'accommodation',
    code: 'AD5', // 숙박
    name: '숙박',
    icon: 'bed',
  },
  SHOPPING: {
    id: 'shopping',
    code: 'MT1', // 대형마트
    name: '쇼핑',
    icon: 'shopping-cart',
  },
  SCHOOL: {
    id: 'school',
    code: 'SC4', // 학교
    name: '학교',
    icon: 'school',
  },
  ACADEMY: {
    id: 'academy',
    code: 'AC5', // 학원
    name: '학원',
    icon: 'book',
  },
};

/**
 * 리뷰 가능한 카테고리 목록 (UI에 표시될 순서대로)
 */
export const REVIEWABLE_CATEGORIES = [
  KAKAO_CATEGORIES.RESTAURANT,
  KAKAO_CATEGORIES.CAFE,
  KAKAO_CATEGORIES.CONVENIENCE_STORE,
  KAKAO_CATEGORIES.SHOPPING,
  KAKAO_CATEGORIES.HOSPITAL,
  KAKAO_CATEGORIES.PHARMACY,
  KAKAO_CATEGORIES.CULTURE,
  KAKAO_CATEGORIES.TOURISM,
  KAKAO_CATEGORIES.ACCOMMODATION,
];

/**
 * 카테고리별 아이콘 SVG 경로
 */
export const CATEGORY_ICONS = {
  utensils: 'M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  coffee: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 1v3M10 1v3M14 1v3',
  hospital: 'M12 6v4m0 0v4m0-4h4m-4 0H8m13 10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z',
  pills: 'M8 13h8M8 17h8M3 19h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2ZM7 3v18',
  'gas-pump': 'M3 3h6v8H3zM9 8h3l3 3v5M15 11h2M9 19v2M3 19v2',
  store: 'M3 9h18M3 9V7l3-4h12l3 4v2M3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 21V13h6v8',
  parking: 'M3 3h18v18H3zM9 8h3a3 3 0 0 1 0 6H9V8Z',
  subway: 'M12 2L6 8v8c0 1 1 2 2 2h8c1 0 2-1 2-2V8l-6-6zM9 15h6M9 12h6',
  bank: 'M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l10 5H2l10-5Z',
  theater: 'M4 3h16M4 7h16M4 21h16M4 11h16M8 11v10M16 11v10',
  landmark: 'M12 2l9 4.5V9H3V6.5L12 2zM3 12h18M5 12v9M9 12v9M15 12v9M19 12v9M3 21h18',
  bed: 'M3 12h18M3 17h18M3 12V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M3 17v4M21 17v4M7 7h4',
  'shopping-cart': 'M9 2L7 6H3l3.5 7.5M9 2h6l2 4h4l-4 8M9 2l2 4M21 6l-2.5 5M7 13.5L5.5 18H19l2.5-5M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  school: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z',
};

/**
 * 기본 선택 카테고리 (음식점)
 */
export const DEFAULT_CATEGORY = KAKAO_CATEGORIES.RESTAURANT;

/**
 * 카테고리 설정 localStorage 키
 */
export const CATEGORY_SETTINGS_KEY = 'mindflow_category_settings';

/**
 * 카테고리 설정 기능 숨김 여부 (나중에 활성화할 때 false로 변경)
 */
export const CATEGORY_FEATURE_HIDDEN = false;
