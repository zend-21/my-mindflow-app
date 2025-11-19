// src/services/kakaoMapService.js

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const KAKAO_LOCAL_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

/**
 * 카카오 로컬 API로 가게 검색
 * @param {string} query - 검색어 (예: "피자헛 강남")
 * @param {Object} options - 검색 옵션
 * @param {number} options.page - 페이지 번호 (1-45, 기본 1)
 * @param {number} options.size - 한 페이지 결과 수 (1-15, 기본 15)
 * @param {number} options.x - 중심 좌표 X (경도)
 * @param {number} options.y - 중심 좌표 Y (위도)
 * @param {number} options.radius - 중심 좌표부터의 반경(m) (0-20000)
 * @param {string} options.categoryCode - 카테고리 코드 (예: 'FD6', 'CE7', etc.)
 * @returns {Promise<Array>} 검색 결과 배열
 */
export const searchRestaurants = async (query, options = {}) => {
  if (!KAKAO_REST_API_KEY) {
    console.error('카카오 REST API 키가 설정되지 않았습니다.');
    throw new Error('카카오 REST API 키가 필요합니다. KAKAO_API_KEY_SETUP.md를 참고하세요.');
  }

  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // 쿼리 파라미터 생성
    const params = new URLSearchParams({
      query: query.trim(),
      page: options.page || 1,
      size: options.size || 15,
    });

    // 카테고리 코드 추가 (옵션)
    if (options.categoryCode) {
      params.append('category_group_code', options.categoryCode);
    }

    // 좌표 기반 검색 (선택)
    if (options.x && options.y) {
      params.append('x', options.x);
      params.append('y', options.y);
      if (options.radius) {
        params.append('radius', Math.min(options.radius, 20000));
      }
    }

    const response = await fetch(`${KAKAO_LOCAL_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('카카오 API 오류:', response.status, errorText);
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    // 결과를 우리 앱 형식으로 변환
    return data.documents.map(place => ({
      id: place.id,                     // 카카오 장소 ID (고유값)
      name: place.place_name,           // "피자헛 강남점"
      address: place.address_name,      // "서울 강남구 테헤란로 123"
      roadAddress: place.road_address_name, // 도로명 주소
      phone: place.phone || '',         // "02-1234-5678"
      category: place.category_name,    // "음식점 > 양식 > 피자"
      latitude: parseFloat(place.y),    // 위도
      longitude: parseFloat(place.x),   // 경도
      distance: place.distance ? parseInt(place.distance) : null, // 거리(m)
      placeUrl: place.place_url,        // 카카오맵 URL
    }));
  } catch (error) {
    console.error('가게 검색 실패:', error);
    throw error;
  }
};

/**
 * GPS 위치 기반 주변 음식점 검색
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @param {number} radius - 반경(m, 기본 500m)
 * @param {string} categoryCode - 카테고리 코드 (기본: 'FD6' 음식점)
 * @returns {Promise<Array>} 검색 결과 배열
 */
export const searchNearbyRestaurants = async (latitude, longitude, radius = 500, categoryCode = 'FD6') => {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('카카오 REST API 키가 필요합니다.');
  }

  try {
    const params = new URLSearchParams({
      query: '음식점', // 카카오 API는 query가 필수
      x: longitude,
      y: latitude,
      radius: Math.min(radius, 20000),
      size: 45, // 최대 결과 수 (카카오 API 최대값)
      sort: 'distance', // 거리순 정렬
    });

    // 카테고리 코드 추가
    if (categoryCode) {
      params.append('category_group_code', categoryCode);
    }

    const response = await fetch(`${KAKAO_LOCAL_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    return data.documents.map(place => ({
      id: place.id,
      name: place.place_name,
      address: place.address_name,
      roadAddress: place.road_address_name,
      phone: place.phone || '',
      category: place.category_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      distance: place.distance ? parseInt(place.distance) : null,
      placeUrl: place.place_url,
    }));
  } catch (error) {
    console.error('주변 가게 검색 실패:', error);
    throw error;
  }
};

/**
 * 여러 카테고리로 검색 (병합)
 * @param {string} query - 검색어
 * @param {Array<string>} categoryCodes - 카테고리 코드 배열 (예: ['FD6', 'CE7'], null 포함 시 전체 검색)
 * @param {Object} options - 검색 옵션
 * @returns {Promise<Array>} 중복 제거된 통합 검색 결과
 */
export const searchMultipleCategories = async (query, categoryCodes = ['FD6'], options = {}) => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // null이 포함되어 있으면 (전체 검색) 카테고리 필터 없이 검색
    if (categoryCodes.includes(null) || categoryCodes.length === 0) {
      console.log('🌐 전체 카테고리 검색 (필터 없음)');
      return await searchRestaurants(query, { ...options, categoryCode: undefined });
    }

    // null이 아닌 카테고리 코드만 필터링
    const validCategoryCodes = categoryCodes.filter(code => code !== null);

    console.log('🔍 선택된 카테고리로 검색:', validCategoryCodes);

    // 각 카테고리별로 병렬 검색
    const searchPromises = validCategoryCodes.map(categoryCode =>
      searchRestaurants(query, { ...options, categoryCode })
    );

    const results = await Promise.all(searchPromises);

    // 결과 통합 및 중복 제거 (id 기준)
    const allResults = results.flat();
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    );

    // 거리순 또는 관련도순 정렬 (거리가 있으면 거리순, 없으면 원본 순서 유지)
    if (uniqueResults.some(r => r.distance !== null)) {
      uniqueResults.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return uniqueResults;
  } catch (error) {
    console.error('멀티 카테고리 검색 실패:', error);
    throw error;
  }
};

/**
 * GPS 위치 기반 여러 카테고리 주변 검색
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @param {Array<string>} categoryCodes - 카테고리 코드 배열 (null 포함 시 전체 검색)
 * @param {number} radius - 반경(m)
 * @returns {Promise<Array>} 통합 검색 결과
 */
export const searchNearbyMultipleCategories = async (latitude, longitude, categoryCodes = ['FD6'], radius = 500) => {
  try {
    // null이 포함되어 있으면 (전체 검색) 카테고리 필터 없이 검색
    if (categoryCodes.includes(null) || categoryCodes.length === 0) {
      console.log('🌐 주변 전체 카테고리 검색 (필터 없음)');
      return await searchNearbyRestaurants(latitude, longitude, radius, undefined);
    }

    // null이 아닌 카테고리 코드만 필터링
    const validCategoryCodes = categoryCodes.filter(code => code !== null);

    console.log('🔍 선택된 카테고리로 주변 검색:', validCategoryCodes);

    // 각 카테고리별로 병렬 검색
    const searchPromises = validCategoryCodes.map(categoryCode =>
      searchNearbyRestaurants(latitude, longitude, radius, categoryCode)
    );

    const results = await Promise.all(searchPromises);

    // 결과 통합 및 중복 제거
    const allResults = results.flat();
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    );

    // 거리순 정렬
    uniqueResults.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return uniqueResults;
  } catch (error) {
    console.error('주변 멀티 카테고리 검색 실패:', error);
    throw error;
  }
};

/**
 * 현재 위치 가져오기 (Capacitor Geolocation 사용)
 * @returns {Promise<Object>} { latitude, longitude }
 */
export const getCurrentLocation = async () => {
  try {
    // Capacitor Geolocation 사용
    const { Geolocation } = await import('@capacitor/geolocation');

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.error('위치 정보 가져오기 실패:', error);

    // Fallback: Web Geolocation API
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Web Geolocation 실패:', error);
            reject(new Error('위치 정보를 가져올 수 없습니다.'));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    }

    throw new Error('Geolocation이 지원되지 않습니다.');
  }
};
