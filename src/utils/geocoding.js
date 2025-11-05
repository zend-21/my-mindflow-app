// src/utils/geocoding.js

/**
 * Nominatim API를 사용한 도시 검색
 * @param {string} query - 검색어 (예: "서울", "Paris", "つくば")
 * @returns {Promise<Array>} - 검색 결과 배열
 */
/**
 * 검색어의 언어를 감지
 */
const detectLanguage = (text) => {
    // 한글 포함 여부 확인
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)) {
        return 'ko';
    }
    // 일본어 히라가나/가타카나 확인
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
        return 'ja';
    }
    // 중국어 간체/번체 확인
    if (/[\u4E00-\u9FFF]/.test(text)) {
        return 'zh';
    }
    // 기본값: 영어
    return 'en';
};

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

        // 검색어 언어 감지
        const lang = detectLanguage(query.trim());

        const params = new URLSearchParams({
            q: query.trim(),
            format: 'json',
            addressdetails: '1',
            limit: '20' // 더 많은 결과를 가져와서 필터링
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'Accept-Language': `${lang},en;q=0.9` // 감지된 언어 우선, 영어 대체
            }
        });

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();

        // 🔍 디버깅: 첫 3개 결과의 address 구조 확인
        console.group(`🌍 "${query}" 검색 결과 (언어: ${lang})`);
        data.slice(0, 3).forEach((item, idx) => {
            console.log(`\n[${idx + 1}] ${item.display_name}`);
            console.log('address:', item.address);
            console.log('importance:', item.importance);
        });
        console.groupEnd();

        // importance 기준으로 정렬 (중요도가 높은 것이 먼저 - Paris, France > Paris, Texas)
        const sortedData = data.sort((a, b) => (b.importance || 0) - (a.importance || 0));

        // 검색어를 소문자로 변환 (비교용)
        const searchTerm = query.trim().toLowerCase();

        // 결과를 도시 위주로 필터링 및 포맷팅
        return sortedData
            .map(item => {
                const address = item.address || {};

                // 행정구역 필드만 추출 (도로명, 지번 등 제외)
                const city = address.city || '';
                const town = address.town || '';
                const village = address.village || '';
                const suburb = address.suburb || '';
                const municipality = address.municipality || '';
                const city_district = address.city_district || '';
                const district = address.district || '';
                const county = address.county || '';
                const state = address.state || address.province || ''; // province도 포함!
                const country = address.country || '';

                // 📌 primaryName: 검색어와 매칭되는 행정구역 찾기
                let primaryName = '';

                // 우선순위: city > town > village > suburb > municipality
                const candidates = [
                    { value: city, type: 'city' },
                    { value: town, type: 'town' },
                    { value: municipality, type: 'municipality' },
                    { value: village, type: 'village' },
                    { value: suburb, type: 'suburb' },
                ];

                // 1순위: 검색어와 정확히 일치하는 것
                for (const candidate of candidates) {
                    if (candidate.value && candidate.value.toLowerCase() === searchTerm) {
                        primaryName = candidate.value;
                        break;
                    }
                }

                // 2순위: 검색어를 포함하는 것
                if (!primaryName) {
                    for (const candidate of candidates) {
                        const valueLower = candidate.value.toLowerCase();
                        if (candidate.value && (valueLower.includes(searchTerm) || searchTerm.includes(valueLower))) {
                            primaryName = candidate.value;
                            break;
                        }
                    }
                }

                // 3순위: 가장 구체적인 행정구역
                if (!primaryName) {
                    primaryName = city || town || municipality || village || suburb || '';
                }

                // ⚠️ 도시급 이상의 행정구역만 허용 (동/리 제외)
                const cityLevelFields = [
                    city, town, village, municipality,
                    county, state, country
                ];

                const hasCityLevelMatch = cityLevelFields.some(field => {
                    if (!field) return false;
                    const fieldLower = field.toLowerCase();
                    return fieldLower.includes(searchTerm) || searchTerm.includes(fieldLower);
                });

                // 도시급 이상에 검색어가 없으면 제외 (suburb/동 검색 방지)
                if (!hasCityLevelMatch) {
                    return null;
                }

                // 📌 district: 구/군 레벨 (primaryName과 다른 것만)
                let districtName = city_district || district || county || '';
                if (primaryName === districtName || districtName === state) {
                    districtName = '';
                }

                // 📌 state: 시/도/주 레벨
                let stateName = state || '';

                // primaryName이 city가 아니고 state가 있는 경우, city를 district로 승격
                if (stateName && primaryName !== city && city && !districtName) {
                    districtName = city;
                }
                // primaryName이 city가 아니고 state가 없는 경우, city를 state로 승격
                else if (!stateName && primaryName !== city && city) {
                    stateName = city;
                }

                // 중복 제거
                if (primaryName === stateName) stateName = '';
                if (districtName === stateName) stateName = '';
                if (districtName === country) districtName = '';
                if (stateName === country) stateName = '';

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
            // 필터링: null 제거 및 기본 필터
            .filter(item => {
                return item !== null && item.primaryName && item.country;
            })
            // 중복 제거: primaryName + state + country 조합이 같으면 하나만
            .filter((item, index, self) => {
                return index === self.findIndex(t => (
                    t.primaryName === item.primaryName &&
                    t.state === item.state &&
                    t.country === item.country
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
 * 좌표로부터 타임존 정보 가져오기 (사주 계산용)
 * Vercel serverless function을 통해 geo-tz 라이브러리로 정확한 타임존 계산
 * 역사적 타임존 변경사항도 지원 (예: 한국 1961년 이전 UTC+8:30)
 *
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Promise<string>} - IANA 타임존 문자열 (예: "Asia/Seoul", "America/New_York")
 */
export const getTimezoneFromCoords = async (lat, lon) => {
    try {
        // 프로덕션 환경에서만 Vercel serverless function 사용
        // 개발 환경에서는 브라우저 타임존 사용 (Vite proxy 설정 불필요)
        const isDevelopment = import.meta.env.DEV;

        if (isDevelopment) {
            // 개발 환경: 브라우저 타임존 반환 (사주 계산은 경도만 사용하므로 정확도에 큰 영향 없음)
            console.log('🔧 개발 모드: 브라우저 타임존 사용');
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        // 프로덕션 환경: Vercel serverless function 호출
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lon.toString()
        });

        const response = await fetch(`/api/timezone?${params.toString()}`);

        if (!response.ok) {
            throw new Error('타임존 API 호출 실패');
        }

        const data = await response.json();

        if (data.timezone) {
            return data.timezone;
        }

        // 타임존을 찾지 못한 경우 (드문 경우 - 대양 한가운데 등)
        console.warn(`타임존을 찾을 수 없습니다: lat=${lat}, lon=${lon}`);
        return Intl.DateTimeFormat().resolvedOptions().timeZone; // 브라우저 타임존 대체
    } catch (error) {
        console.error('타임존 계산 실패:', error);
        return Intl.DateTimeFormat().resolvedOptions().timeZone; // 에러 시 브라우저 타임존 대체
    }
};
