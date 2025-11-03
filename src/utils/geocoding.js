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

        // 검색어를 소문자로 변환 (비교용)
        const searchTerm = query.trim().toLowerCase();

        // 결과를 도시 위주로 필터링 및 포맷팅
        return data
            .map(item => {
                const address = item.address || {};

                // 모든 가능한 필드를 추출해서 확인
                const suburb = address.suburb || '';           // 동/리
                const neighbourhood = address.neighbourhood || ''; // 이웃
                const quarter = address.quarter || '';         // 구역
                const city_district = address.city_district || ''; // 구
                const district = address.district || '';       // 구역
                const borough = address.borough || '';         // 자치구
                const county = address.county || '';           // 군/카운티
                const city = address.city || '';               // 시
                const town = address.town || '';               // 읍
                const village = address.village || '';         // 마을
                const municipality = address.municipality || ''; // 자치시
                const state = address.state || '';             // 주/도
                const province = address.province || '';       // 도
                const country = address.country || '';         // 국가

                // 🔍 검색어와 가장 매칭되는 필드를 primaryName으로 선택
                const allFields = [
                    { value: suburb, level: 1, type: 'suburb' },
                    { value: neighbourhood, level: 1, type: 'neighbourhood' },
                    { value: quarter, level: 2, type: 'quarter' },
                    { value: village, level: 3, type: 'village' },
                    { value: town, level: 4, type: 'town' },
                    { value: city, level: 5, type: 'city' },
                    { value: municipality, level: 5, type: 'municipality' },
                    { value: borough, level: 3, type: 'borough' },
                ];

                // 검색어와 매칭되는 필드 찾기
                let bestMatch = null;
                let primaryName = '';

                for (const field of allFields) {
                    if (field.value) {
                        const fieldLower = field.value.toLowerCase();
                        // 검색어와 정확히 일치하거나 포함되는 경우
                        if (fieldLower === searchTerm ||
                            fieldLower.includes(searchTerm) ||
                            searchTerm.includes(fieldLower)) {
                            // 더 큰 level(상위 행정구역)이 매칭되면 우선 선택
                            if (!bestMatch || field.level >= bestMatch.level) {
                                bestMatch = field;
                            }
                        }
                    }
                }

                // 매칭된 필드가 있으면 사용, 없으면 기존 방식(작은 단위부터)
                if (bestMatch) {
                    primaryName = bestMatch.value;
                } else {
                    primaryName = suburb ||
                                 neighbourhood ||
                                 quarter ||
                                 village ||
                                 town ||
                                 city ||
                                 municipality ||
                                 borough ||
                                 item.name;
                }

                // 구/군 (중간 행정구역)
                let districtName = city_district ||
                                  district ||
                                  borough ||
                                  county ||
                                  '';

                // primaryName이 이미 district 레벨이면 중복 방지
                if (primaryName === districtName) {
                    districtName = '';
                }

                // 시/도 (상위 행정구역)
                let stateName = '';

                // primaryName이 city가 아닐 때만 city를 state로 사용
                if (primaryName !== city && city) {
                    stateName = city;
                } else {
                    stateName = state || province || '';
                }

                // ⚠️ 중복 제거: primaryName과 stateName이 같으면 stateName 비우기
                const finalState = (stateName === primaryName) ? '' : stateName;

                return {
                    primaryName,      // 주요 지명 (신사동, Springfield 등)
                    district: districtName,  // 구/군 (강남구, Sangamon County 등)
                    state: finalState,       // 시/도/주 (서울특별시, 일리노이주 등)
                    country,                 // 국가 (대한민국, 미국 등)
                    // 하위 호환성을 위해 기존 필드도 유지
                    city: primaryName,
                    displayName: formatDisplayName(primaryName, districtName, finalState, country),
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    rawData: item,
                };
            })
            .filter(item => {
                // 1. 기본 필터: 지명과 국가명이 있어야 함
                if (!item.primaryName || !item.country) return false;

                // 2. 검색어와 매칭되는지 확인
                const primaryLower = item.primaryName.toLowerCase();

                // 검색어가 primaryName에 포함되어 있으면 OK
                if (primaryLower.includes(searchTerm) || searchTerm.includes(primaryLower)) {
                    return true;
                }

                // 3. display_name 전체에서도 검색어 확인 (fallback)
                const displayNameLower = item.rawData.display_name?.toLowerCase() || '';
                return displayNameLower.includes(searchTerm);
            })
            .filter((item, index, self) => {
                // 4. 중복 제거: 같은 좌표의 결과는 하나만
                return index === self.findIndex(t => (
                    Math.abs(t.lat - item.lat) < 0.001 &&
                    Math.abs(t.lon - item.lon) < 0.001
                ));
            }); // 지명과 국가명이 있는 것만

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
