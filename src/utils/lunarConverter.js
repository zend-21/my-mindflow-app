// src/utils/lunarConverter.js
// 양력 ↔ 음력 변환 유틸리티 (공공데이터포털 API)

const API_KEY = import.meta.env.VITE_SPCDE_API_KEY;

/**
 * 양력을 음력으로 변환
 * @param {number} year - 양력 년도
 * @param {number} month - 양력 월 (1-12)
 * @param {number} day - 양력 일 (1-31)
 * @returns {Promise<Object>} { lunarYear, lunarMonth, lunarDay, isLeapMonth }
 */
export const convertSolarToLunar = async (year, month, day) => {
    if (!API_KEY) {
        console.error('API 키가 설정되지 않았습니다.');
        return null;
    }

    try {
        // Vite 프록시를 통해 API 호출 (CORS 우회)
        const url = `/api/lunar/getLunCalInfo`; // 한국천문연구원 API
        const params = new URLSearchParams({
            serviceKey: API_KEY, // 인코딩된 키 그대로 사용
            solYear: year.toString(),
            solMonth: String(month).padStart(2, '0'),
            solDay: String(day).padStart(2, '0')
        });

        const response = await fetch(`${url}?${params.toString()}`);
        const text = await response.text();

        // XML 파싱
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // 에러 체크
        const resultCode = xmlDoc.getElementsByTagName('resultCode')[0]?.textContent;
        if (resultCode !== '00') {
            const resultMsg = xmlDoc.getElementsByTagName('resultMsg')[0]?.textContent;
            console.error('API 오류:', resultMsg);
            return null;
        }

        // 데이터 추출
        const lunYear = xmlDoc.getElementsByTagName('lunYear')[0]?.textContent;
        const lunMonth = xmlDoc.getElementsByTagName('lunMonth')[0]?.textContent;
        const lunDay = xmlDoc.getElementsByTagName('lunDay')[0]?.textContent;
        const lunLeapmonth = xmlDoc.getElementsByTagName('lunLeapmonth')[0]?.textContent;

        if (!lunYear || !lunMonth || !lunDay) {
            console.error('음력 데이터를 찾을 수 없습니다.');
            return null;
        }

        return {
            lunarYear: parseInt(lunYear),
            lunarMonth: parseInt(lunMonth),
            lunarDay: parseInt(lunDay),
            isLeapMonth: lunLeapmonth !== '평달'
        };
    } catch (error) {
        console.error('음력 변환 실패:', error);
        return null;
    }
};

/**
 * 음력을 양력으로 변환
 * @param {number} year - 음력 년도
 * @param {number} month - 음력 월 (1-12)
 * @param {number} day - 음력 일 (1-30)
 * @param {boolean} isLeapMonth - 윤달 여부
 * @returns {Promise<Object>} { solarYear, solarMonth, solarDay }
 */
export const convertLunarToSolar = async (year, month, day, isLeapMonth = false) => {
    if (!API_KEY) {
        console.error('API 키가 설정되지 않았습니다.');
        return null;
    }

    try {
        // Vite 프록시를 통해 API 호출 (CORS 우회)
        const url = `/api/lunar/getLunToSolInfo`; // 한국천문연구원 API
        const params = new URLSearchParams({
            serviceKey: API_KEY, // 인코딩된 키 그대로 사용
            lunYear: year.toString(),
            lunMonth: String(month).padStart(2, '0'),
            lunDay: String(day).padStart(2, '0'),
            lunLeapmonth: isLeapMonth ? '윤달' : '평달'
        });

        const response = await fetch(`${url}?${params.toString()}`);
        const text = await response.text();

        // XML 파싱
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // 에러 체크
        const resultCode = xmlDoc.getElementsByTagName('resultCode')[0]?.textContent;
        if (resultCode !== '00') {
            const resultMsg = xmlDoc.getElementsByTagName('resultMsg')[0]?.textContent;
            console.error('API 오류:', resultMsg);
            return null;
        }

        // 데이터 추출
        const solYear = xmlDoc.getElementsByTagName('solYear')[0]?.textContent;
        const solMonth = xmlDoc.getElementsByTagName('solMonth')[0]?.textContent;
        const solDay = xmlDoc.getElementsByTagName('solDay')[0]?.textContent;

        if (!solYear || !solMonth || !solDay) {
            console.error('양력 데이터를 찾을 수 없습니다.');
            return null;
        }

        return {
            solarYear: parseInt(solYear),
            solarMonth: parseInt(solMonth),
            solarDay: parseInt(solDay)
        };
    } catch (error) {
        console.error('양력 변환 실패:', error);
        return null;
    }
};

/**
 * 음력 날짜를 포맷팅하여 문자열로 반환
 * @param {Object} lunarDate - { lunarYear, lunarMonth, lunarDay, isLeapMonth }
 * @returns {string} "음력 YYYY년 M월 D일" 또는 "음력 YYYY년 윤M월 D일"
 */
export const formatLunarDate = (lunarDate) => {
    if (!lunarDate) return '';

    const { lunarYear, lunarMonth, lunarDay, isLeapMonth } = lunarDate;
    const leapText = isLeapMonth ? '윤' : '';

    return `음력 ${lunarYear}년 ${leapText}${lunarMonth}월 ${lunarDay}일`;
};
