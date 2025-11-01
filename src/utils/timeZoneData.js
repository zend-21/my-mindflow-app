// src/utils/timeZoneData.js

// 주요 국가 및 도시별 시간대 데이터
// 실제 프로젝트에서는 더 포괄적인 데이터나 API를 사용할 수 있습니다.

export const TIMEZONE_DATA = {
    '대한민국': {
        cities: ['서울', '부산', '인천', '대구', '대전', '광주', '울산', '제주'],
        timezone: 'Asia/Seoul',
        offset: '+09:00'
    },
    '일본': {
        cities: ['도쿄', '오사카', '교토', '후쿠오카', '삿포로', '나고야'],
        timezone: 'Asia/Tokyo',
        offset: '+09:00'
    },
    '중국': {
        cities: ['베이징', '상하이', '광저우', '선전', '청두', '홍콩'],
        timezone: 'Asia/Shanghai',
        offset: '+08:00'
    },
    '미국': {
        cities: [
            { name: '뉴욕', timezone: 'America/New_York', offset: '-05:00' },
            { name: '로스앤젤레스', timezone: 'America/Los_Angeles', offset: '-08:00' },
            { name: '시카고', timezone: 'America/Chicago', offset: '-06:00' },
            { name: '휴스턴', timezone: 'America/Chicago', offset: '-06:00' },
            { name: '샌프란시스코', timezone: 'America/Los_Angeles', offset: '-08:00' },
            { name: '마이애미', timezone: 'America/New_York', offset: '-05:00' },
            { name: '시애틀', timezone: 'America/Los_Angeles', offset: '-08:00' },
            { name: '보스턴', timezone: 'America/New_York', offset: '-05:00' }
        ]
    },
    '영국': {
        cities: ['런던', '맨체스터', '버밍엄', '에든버러', '리버풀'],
        timezone: 'Europe/London',
        offset: '+00:00'
    },
    '프랑스': {
        cities: ['파리', '마르세유', '리옹', '니스', '툴루즈'],
        timezone: 'Europe/Paris',
        offset: '+01:00'
    },
    '독일': {
        cities: ['베를린', '뮌헨', '함부르크', '프랑크푸르트', '쾰른'],
        timezone: 'Europe/Berlin',
        offset: '+01:00'
    },
    '캐나다': {
        cities: [
            { name: '토론토', timezone: 'America/Toronto', offset: '-05:00' },
            { name: '밴쿠버', timezone: 'America/Vancouver', offset: '-08:00' },
            { name: '몬트리올', timezone: 'America/Toronto', offset: '-05:00' },
            { name: '캘거리', timezone: 'America/Edmonton', offset: '-07:00' }
        ]
    },
    '호주': {
        cities: [
            { name: '시드니', timezone: 'Australia/Sydney', offset: '+10:00' },
            { name: '멜버른', timezone: 'Australia/Melbourne', offset: '+10:00' },
            { name: '브리즈번', timezone: 'Australia/Brisbane', offset: '+10:00' },
            { name: '퍼스', timezone: 'Australia/Perth', offset: '+08:00' }
        ]
    },
    '싱가포르': {
        cities: ['싱가포르'],
        timezone: 'Asia/Singapore',
        offset: '+08:00'
    },
    '태국': {
        cities: ['방콕', '치앙마이', '푸켓', '파타야'],
        timezone: 'Asia/Bangkok',
        offset: '+07:00'
    },
    '베트남': {
        cities: ['하노이', '호치민', '다낭', '나트랑'],
        timezone: 'Asia/Ho_Chi_Minh',
        offset: '+07:00'
    },
    '인도': {
        cities: ['뉴델리', '뭄바이', '벵갈루루', '첸나이', '콜카타'],
        timezone: 'Asia/Kolkata',
        offset: '+05:30'
    },
    '러시아': {
        cities: [
            { name: '모스크바', timezone: 'Europe/Moscow', offset: '+03:00' },
            { name: '상트페테르부르크', timezone: 'Europe/Moscow', offset: '+03:00' },
            { name: '블라디보스토크', timezone: 'Asia/Vladivostok', offset: '+10:00' }
        ]
    },
    '브라질': {
        cities: [
            { name: '상파울루', timezone: 'America/Sao_Paulo', offset: '-03:00' },
            { name: '리우데자네이루', timezone: 'America/Sao_Paulo', offset: '-03:00' }
        ]
    },
    '스페인': {
        cities: ['마드리드', '바르셀로나', '발렌시아', '세비야'],
        timezone: 'Europe/Madrid',
        offset: '+01:00'
    },
    '이탈리아': {
        cities: ['로마', '밀라노', '베네치아', '피렌체', '나폴리'],
        timezone: 'Europe/Rome',
        offset: '+01:00'
    },
    '네덜란드': {
        cities: ['암스테르담', '로테르담', '헤이그'],
        timezone: 'Europe/Amsterdam',
        offset: '+01:00'
    },
    '스위스': {
        cities: ['취리히', '제네바', '베른', '로잔'],
        timezone: 'Europe/Zurich',
        offset: '+01:00'
    },
    '뉴질랜드': {
        cities: ['오클랜드', '웰링턴', '크라이스트처치'],
        timezone: 'Pacific/Auckland',
        offset: '+12:00'
    }
};

/**
 * 국가 목록 반환
 * @returns {Array<string>} 국가명 배열
 */
export const getCountries = () => {
    return Object.keys(TIMEZONE_DATA).sort();
};

/**
 * 특정 국가의 도시 목록 반환
 * @param {string} country - 국가명
 * @returns {Array<string>} 도시명 배열
 */
export const getCities = (country) => {
    const countryData = TIMEZONE_DATA[country];
    if (!countryData) return [];

    // cities가 배열인지 객체 배열인지 확인
    if (Array.isArray(countryData.cities)) {
        const firstCity = countryData.cities[0];
        if (typeof firstCity === 'string') {
            return countryData.cities;
        } else if (typeof firstCity === 'object') {
            return countryData.cities.map(city => city.name);
        }
    }

    return [];
};

/**
 * 특정 도시의 시간대 정보 반환
 * @param {string} country - 국가명
 * @param {string} city - 도시명
 * @returns {Object} { timezone: string, offset: string }
 */
export const getTimezoneInfo = (country, city) => {
    const countryData = TIMEZONE_DATA[country];
    if (!countryData) return { timezone: 'UTC', offset: '+00:00' };

    // cities가 문자열 배열인 경우
    if (typeof countryData.cities[0] === 'string') {
        return {
            timezone: countryData.timezone,
            offset: countryData.offset
        };
    }

    // cities가 객체 배열인 경우 (미국, 캐나다 등)
    const cityData = countryData.cities.find(c => c.name === city);
    if (cityData) {
        return {
            timezone: cityData.timezone,
            offset: cityData.offset
        };
    }

    // 기본값
    return { timezone: 'UTC', offset: '+00:00' };
};

/**
 * 시간대를 고려한 출생 시간 계산
 * @param {Object} params - { birthYear, birthMonth, birthDay, birthHour, birthMinute, country, city }
 * @returns {Date} UTC 기준 출생 시간
 */
export const calculateBirthTimeWithTimezone = ({ birthYear, birthMonth, birthDay, birthHour, birthMinute, country, city }) => {
    const timezoneInfo = getTimezoneInfo(country, city);

    // 로컬 시간으로 Date 객체 생성
    const localBirthTime = new Date(birthYear, birthMonth - 1, birthDay, birthHour, birthMinute);

    // offset을 파싱하여 UTC로 변환
    const offsetMatch = timezoneInfo.offset.match(/([+-])(\d{2}):(\d{2})/);
    if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? -1 : 1; // UTC로 변환이므로 부호 반전
        const hours = parseInt(offsetMatch[2]);
        const minutes = parseInt(offsetMatch[3]);

        const utcTime = new Date(localBirthTime.getTime() + sign * (hours * 60 + minutes) * 60 * 1000);
        return utcTime;
    }

    return localBirthTime;
};
