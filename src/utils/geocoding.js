// src/utils/geocoding.js

/**
 * Nominatim API를 사용한 도시 검색
 * @param {string} query - 검색어 (예: "서울", "Paris", "つくば")
 * @returns {Promise<Array>} - 검색 결과 배열
 */
export const searchCity = async (query) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        // 개발 환경에서는 Vite proxy, 프로덕션에서는 Vercel serverless function 사용
        const isDevelopment = import.meta.env.DEV;
        const baseUrl = isDevelopment
            ? '/api/geocoding/search'
            : '/api/geocoding';

        const params = new URLSearchParams({
            q: query.trim(),
            format: 'json',
            addressdetails: '1',
            limit: '10'
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();

        // 결과를 도시 위주로 필터링 및 포맷팅
        return data
            .map(item => {
                const address = item.address || {};

                // 도시명 추출 (우선순위 순서)
                const city = address.city ||
                            address.town ||
                            address.village ||
                            address.municipality ||
                            address.borough ||
                            address.suburb ||
                            item.name;

                // 국가명
                const country = address.country || '';

                // 주/도 정보
                const state = address.state || address.province || '';

                return {
                    city,
                    state,
                    country,
                    displayName: formatDisplayName(city, state, country),
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    rawData: item
                };
            })
            .filter(item => item.city && item.country); // 도시명과 국가명이 있는 것만

    } catch (error) {
        console.error('도시 검색 실패:', error);
        return [];
    }
};

/**
 * 표시용 주소 포맷팅
 * @param {string} city - 도시명
 * @param {string} state - 주/도
 * @param {string} country - 국가명
 * @returns {string} - "도시, 주/도, 국가" 형식
 */
const formatDisplayName = (city, state, country) => {
    const parts = [city];
    if (state) parts.push(state);
    if (country) parts.push(country);
    return parts.join(', ');
};

/**
 * 좌표로부터 타임존 정보 가져오기 (추후 사주 계산용)
 * 참고: Nominatim은 타임존 정보를 직접 제공하지 않으므로,
 * 필요시 별도 API(예: TimeZoneDB) 사용 필요
 */
export const getTimezoneFromCoords = async (lat, lon) => {
    // TODO: 타임존 API 연동 필요 시 구현
    // 현재는 브라우저 타임존 사용
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
