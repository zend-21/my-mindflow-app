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
            limit: '20' // 더 많은 결과를 가져와서 필터링
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'Accept-Language': 'en' // 영어로 통일 (한글 번역 문제 방지)
            }
        });

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();

        // 검색어를 소문자로 변환 (비교용)
        const searchTerm = query.trim().toLowerCase();

        // importance 기준으로 정렬 (중요도가 높은 것이 먼저)
        const sortedData = data.sort((a, b) => (b.importance || 0) - (a.importance || 0));

        // 결과를 도시 위주로 필터링 및 포맷팅
        return sortedData
            .map(item => {
                const address = item.address || {};

                // 모든 가능한 필드를 추출
                const suburb = address.suburb || '';
                const neighbourhood = address.neighbourhood || '';
                const quarter = address.quarter || '';
                const city_district = address.city_district || '';
                const district = address.district || '';
                const borough = address.borough || '';
                const county = address.county || '';
                const city = address.city || '';
                const town = address.town || '';
                const village = address.village || '';
                const municipality = address.municipality || '';
                const state = address.state || '';
                const province = address.province || '';
                const country = address.country || '';

                // 📌 1단계: 검색어와 정확히 일치하는 필드 찾기 (대소문자 무시)
                let primaryName = '';

                // 우선순위: city > town > village > suburb > neighbourhood
                const priorityFields = [
                    { value: city, type: 'city' },
                    { value: municipality, type: 'municipality' },
                    { value: town, type: 'town' },
                    { value: village, type: 'village' },
                    { value: borough, type: 'borough' },
                    { value: suburb, type: 'suburb' },
                    { value: neighbourhood, type: 'neighbourhood' },
                    { value: quarter, type: 'quarter' },
                ];

                // 정확히 일치하는 필드 찾기
                const exactMatch = priorityFields.find(field =>
                    field.value && field.value.toLowerCase() === searchTerm
                );

                if (exactMatch) {
                    primaryName = exactMatch.value;
                } else {
                    // 정확한 일치가 없으면 검색어를 포함하는 필드 찾기
                    const partialMatch = priorityFields.find(field =>
                        field.value && (
                            field.value.toLowerCase().includes(searchTerm) ||
                            searchTerm.includes(field.value.toLowerCase())
                        )
                    );

                    if (partialMatch) {
                        primaryName = partialMatch.value;
                    } else {
                        // 아무것도 매칭 안되면 가장 구체적인 지명 사용
                        primaryName = city || town || village || suburb ||
                                    neighbourhood || municipality || item.name || '';
                    }
                }

                // 📌 2단계: district (구/군) 설정
                let districtName = city_district || district || borough || county || '';
                if (primaryName === districtName) {
                    districtName = ''; // 중복 제거
                }

                // 📌 3단계: state (시/도/주) 설정
                let stateName = '';
                if (primaryName !== city && city) {
                    stateName = city;
                } else {
                    stateName = state || province || '';
                }

                // 중복 제거
                if (stateName === primaryName || stateName === districtName) {
                    stateName = '';
                }

                return {
                    primaryName,
                    district: districtName,
                    state: stateName,
                    country,
                    city: primaryName,
                    displayName: formatDisplayName(primaryName, districtName, stateName, country),
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    importance: item.importance || 0,
                    rawData: item,
                };
            })
            // 필터링: 유효한 결과만
            .filter(item => {
                if (!item.primaryName || !item.country) return false;

                const primaryLower = item.primaryName.toLowerCase();
                const allText = [
                    item.primaryName,
                    item.district,
                    item.state,
                    item.country
                ].filter(Boolean).join(' ').toLowerCase();

                // 검색어가 주소 어딘가에 포함되어야 함
                return allText.includes(searchTerm);
            })
            // 중복 제거 (같은 좌표)
            .filter((item, index, self) => {
                return index === self.findIndex(t => (
                    Math.abs(t.lat - item.lat) < 0.001 &&
                    Math.abs(t.lon - item.lon) < 0.001
                ));
            })
            // 상위 10개만
            .slice(0, 10);

    } catch (error) {
        console.error('도시 검색 실패:', error);
        return [];
    }
};

/**
 * 표시용 주소 포맷팅 (계층적 표시용)
 * @param {string} primaryName - 주요 지명 (동/리/시)
 * @param {string} district - 구/군/카운티
 * @param {string} state - 주/도
 * @param {string} country - 국가명
 * @returns {string} - "주요지명, 구, 주/도, 국가" 형식
 */
const formatDisplayName = (primaryName, district, state, country) => {
    const parts = [primaryName];
    if (district) parts.push(district);
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
