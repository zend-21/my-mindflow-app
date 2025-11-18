// src/services/kakaoAddressService.js

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const KAKAO_ADDRESS_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
const KAKAO_KEYWORD_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

/**
 * 주소 검색 (지번, 도로명 주소)
 * @param {string} query - 검색어 (예: "강남구 테헤란로 123" 또는 "서초동 1234")
 * @returns {Promise<Array>} 주소 검색 결과
 */
export const searchAddress = async (query) => {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('카카오 REST API 키가 필요합니다.');
  }

  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      page: 1,
      size: 10,
    });

    const response = await fetch(`${KAKAO_ADDRESS_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('카카오 주소 검색 API 오류:', response.status, errorText);
      throw new Error(`카카오 주소 검색 실패: ${response.status}`);
    }

    const data = await response.json();

    // 주소 결과 변환
    return data.documents.map(address => ({
      type: 'address', // 주소 검색 결과
      addressName: address.address_name, // "서울 강남구 테헤란로 123"
      roadAddress: address.road_address ? {
        addressName: address.road_address.address_name,
        buildingName: address.road_address.building_name || '',
        zoneNo: address.road_address.zone_no || '',
      } : null,
      jibunAddress: address.address ? {
        addressName: address.address.address_name,
        buildingName: address.address.building_name || '',
        zoneNo: address.address.zip_code || '',
      } : null,
      latitude: parseFloat(address.y),
      longitude: parseFloat(address.x),
    }));
  } catch (error) {
    console.error('주소 검색 실패:', error);
    throw error;
  }
};

/**
 * 장소 키워드 검색 (동/구 이름으로 검색)
 * @param {string} query - 검색어 (예: "서초동", "강남구")
 * @returns {Promise<Array>} 장소 검색 결과
 */
export const searchPlace = async (query) => {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('카카오 REST API 키가 필요합니다.');
  }

  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      page: 1,
      size: 10,
    });

    const response = await fetch(`${KAKAO_KEYWORD_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('카카오 키워드 검색 API 오류:', response.status, errorText);
      throw new Error(`카카오 키워드 검색 실패: ${response.status}`);
    }

    const data = await response.json();

    // 장소 결과 변환
    return data.documents.map(place => ({
      type: 'place', // 장소 검색 결과
      placeName: place.place_name,
      addressName: place.address_name,
      roadAddress: place.road_address_name || '',
      category: place.category_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
    }));
  } catch (error) {
    console.error('장소 검색 실패:', error);
    throw error;
  }
};

/**
 * 통합 주소 검색 (주소 + 장소)
 * @param {string} query - 검색어
 * @returns {Promise<Array>} 검색 결과 (주소 우선, 장소는 보조)
 */
export const searchAddressWithPlace = async (query) => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // 주소 검색 시도
    const addressResults = await searchAddress(query);

    // 주소 검색 결과가 있으면 반환
    if (addressResults.length > 0) {
      return addressResults;
    }

    // 주소 검색 결과가 없으면 장소 검색 (동/구 이름 등)
    const placeResults = await searchPlace(query);
    return placeResults;
  } catch (error) {
    console.error('통합 검색 실패:', error);
    throw error;
  }
};

/**
 * 좌표를 주소로 변환 (역지오코딩)
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @returns {Promise<Object>} 주소 정보
 */
export const getAddressFromCoords = async (latitude, longitude) => {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('카카오 REST API 키가 필요합니다.');
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`역지오코딩 실패: ${response.status}`);
    }

    const data = await response.json();

    if (data.documents.length === 0) {
      throw new Error('주소를 찾을 수 없습니다.');
    }

    const result = data.documents[0];

    return {
      addressName: result.address?.address_name || '',
      roadAddress: result.road_address?.address_name || '',
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('역지오코딩 실패:', error);
    throw error;
  }
};
