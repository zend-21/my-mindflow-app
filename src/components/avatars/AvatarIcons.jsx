// src/components/avatars/AvatarIcons.jsx
// SVG 아바타 아이콘 컬렉션 (십이지신 12개 + 추가 8개) - 귀엽고 특징적인 디자인

import React from 'react';

// 십이지신 (12 Zodiac Animals) - 이미지 기반
export const RatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/rat.png" width="100" height="100" />
    </svg>
);

export const OxAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/ox.png" width="100" height="100" />
    </svg>
);

export const TigerAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/tiger.png" width="100" height="100" />
    </svg>
);

export const RabbitAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/rabbit.png" width="100" height="100" />
    </svg>
);

export const DragonAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/dragon.png" width="100" height="100" />
    </svg>
);

export const SnakeAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/snake.png" width="100" height="100" />
    </svg>
);

export const HorseAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/horse.png" width="100" height="100" />
    </svg>
);

export const GoatAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/goat.png" width="100" height="100" />
    </svg>
);

export const MonkeyAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/monkey.png" width="100" height="100" />
    </svg>
);

export const RoosterAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/rooster.png" width="100" height="100" />
    </svg>
);

export const DogAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/dog.png" width="100" height="100" />
    </svg>
);

export const PigAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/pig.png" width="100" height="100" />
    </svg>
);

// 별자리 (12 Zodiac Signs) - 이미지 기반
export const AriesAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/aries.png" width="100" height="100" />
    </svg>
);

export const TaurusAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/taurus.png" width="100" height="100" />
    </svg>
);

export const GeminiAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/gemini.png" width="100" height="100" />
    </svg>
);

export const CancerAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/cancer.png" width="100" height="100" />
    </svg>
);

export const LeoAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/leo.png" width="100" height="100" />
    </svg>
);

export const VirgoAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/virgo.png" width="100" height="100" />
    </svg>
);

export const LibraAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/libra.png" width="100" height="100" />
    </svg>
);

export const ScorpioAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/scorpio.png" width="100" height="100" />
    </svg>
);

export const SagittariusAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/sagittarius.png" width="100" height="100" />
    </svg>
);

export const CapricornAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/capricorn.png" width="100" height="100" />
    </svg>
);

export const AquariusAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/aquarius.png" width="100" height="100" />
    </svg>
);

export const PiscesAvatar = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <image href="/images/avatars/zodiac_sign/pisces.png" width="100" height="100" />
    </svg>
);

// 아바타 목록 (순서: 십이지신 12개 + 별자리 12개 + 타로)
export const avatarList = [
    // 십이지신
    { id: 'rat', name: '쥐', component: RatAvatar, zodiacYear: [0, 12, 24, 36, 48, 60, 72, 84, 96] },
    { id: 'ox', name: '소', component: OxAvatar, zodiacYear: [1, 13, 25, 37, 49, 61, 73, 85, 97] },
    { id: 'tiger', name: '호랑이', component: TigerAvatar, zodiacYear: [2, 14, 26, 38, 50, 62, 74, 86, 98] },
    { id: 'rabbit', name: '토끼', component: RabbitAvatar, zodiacYear: [3, 15, 27, 39, 51, 63, 75, 87, 99] },
    { id: 'dragon', name: '용', component: DragonAvatar, zodiacYear: [4, 16, 28, 40, 52, 64, 76, 88, 100] },
    { id: 'snake', name: '뱀', component: SnakeAvatar, zodiacYear: [5, 17, 29, 41, 53, 65, 77, 89, 101] },
    { id: 'horse', name: '말', component: HorseAvatar, zodiacYear: [6, 18, 30, 42, 54, 66, 78, 90, 102] },
    { id: 'goat', name: '양', component: GoatAvatar, zodiacYear: [7, 19, 31, 43, 55, 67, 79, 91, 103] },
    { id: 'monkey', name: '원숭이', component: MonkeyAvatar, zodiacYear: [8, 20, 32, 44, 56, 68, 80, 92, 104] },
    { id: 'rooster', name: '닭', component: RoosterAvatar, zodiacYear: [9, 21, 33, 45, 57, 69, 81, 93, 105] },
    { id: 'dog', name: '개', component: DogAvatar, zodiacYear: [10, 22, 34, 46, 58, 70, 82, 94, 106] },
    { id: 'pig', name: '돼지', component: PigAvatar, zodiacYear: [11, 23, 35, 47, 59, 71, 83, 95, 107] },

    // 별자리 (zodiacSign으로 구분)
    { id: 'aries', name: '양자리', component: AriesAvatar, zodiacSign: 'aries' },
    { id: 'taurus', name: '황소자리', component: TaurusAvatar, zodiacSign: 'taurus' },
    { id: 'gemini', name: '쌍둥이자리', component: GeminiAvatar, zodiacSign: 'gemini' },
    { id: 'cancer', name: '게자리', component: CancerAvatar, zodiacSign: 'cancer' },
    { id: 'leo', name: '사자자리', component: LeoAvatar, zodiacSign: 'leo' },
    { id: 'virgo', name: '처녀자리', component: VirgoAvatar, zodiacSign: 'virgo' },
    { id: 'libra', name: '천칭자리', component: LibraAvatar, zodiacSign: 'libra' },
    { id: 'scorpio', name: '전갈자리', component: ScorpioAvatar, zodiacSign: 'scorpio' },
    { id: 'sagittarius', name: '사수자리', component: SagittariusAvatar, zodiacSign: 'sagittarius' },
    { id: 'capricorn', name: '염소자리', component: CapricornAvatar, zodiacSign: 'capricorn' },
    { id: 'aquarius', name: '물병자리', component: AquariusAvatar, zodiacSign: 'aquarius' },
    { id: 'pisces', name: '물고기자리', component: PiscesAvatar, zodiacSign: 'pisces' },
];

// 음력 설날 날짜 (1900-2100년) - MM-DD 형식
// 음력 설날 이전에 태어난 사람은 이전 해의 띠를 가짐
const lunarNewYearDates = {
    1900: '01-31', 1901: '02-19', 1902: '02-08', 1903: '01-29', 1904: '02-16',
    1905: '02-04', 1906: '01-25', 1907: '02-13', 1908: '02-02', 1909: '01-22',
    1910: '02-10', 1911: '01-30', 1912: '02-18', 1913: '02-06', 1914: '01-26',
    1915: '02-14', 1916: '02-03', 1917: '01-23', 1918: '02-11', 1919: '02-01',
    1920: '02-20', 1921: '02-08', 1922: '01-28', 1923: '02-16', 1924: '02-05',
    1925: '01-24', 1926: '02-13', 1927: '02-02', 1928: '01-23', 1929: '02-10',
    1930: '01-30', 1931: '02-17', 1932: '02-06', 1933: '01-26', 1934: '02-14',
    1935: '02-04', 1936: '01-24', 1937: '02-11', 1938: '01-31', 1939: '02-19',
    1940: '02-08', 1941: '01-27', 1942: '02-15', 1943: '02-05', 1944: '01-25',
    1945: '02-13', 1946: '02-02', 1947: '01-22', 1948: '02-10', 1949: '01-29',
    1950: '02-17', 1951: '02-06', 1952: '01-27', 1953: '02-14', 1954: '02-03',
    1955: '01-24', 1956: '02-12', 1957: '01-31', 1958: '02-18', 1959: '02-08',
    1960: '01-28', 1961: '02-15', 1962: '02-05', 1963: '01-25', 1964: '02-13',
    1965: '02-02', 1966: '01-21', 1967: '02-09', 1968: '01-30', 1969: '02-17',
    1970: '02-06', 1971: '01-27', 1972: '02-15', 1973: '02-03', 1974: '01-23',
    1975: '02-11', 1976: '01-31', 1977: '02-18', 1978: '02-07', 1979: '01-28',
    1980: '02-16', 1981: '02-05', 1982: '01-25', 1983: '02-13', 1984: '02-02',
    1985: '02-20', 1986: '02-09', 1987: '01-29', 1988: '02-17', 1989: '02-06',
    1990: '01-27', 1991: '02-15', 1992: '02-04', 1993: '01-23', 1994: '02-10',
    1995: '01-31', 1996: '02-19', 1997: '02-07', 1998: '01-28', 1999: '02-16',
    2000: '02-05', 2001: '01-24', 2002: '02-12', 2003: '02-01', 2004: '01-22',
    2005: '02-09', 2006: '01-29', 2007: '02-18', 2008: '02-07', 2009: '01-26',
    2010: '02-14', 2011: '02-03', 2012: '01-23', 2013: '02-10', 2014: '01-31',
    2015: '02-19', 2016: '02-08', 2017: '01-28', 2018: '02-16', 2019: '02-05',
    2020: '01-25', 2021: '02-12', 2022: '02-01', 2023: '01-22', 2024: '02-10',
    2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13',
    2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19',
    2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04', 2039: '01-24',
    2040: '02-12', 2041: '02-01', 2042: '01-22', 2043: '02-10', 2044: '01-30',
    2045: '02-17', 2046: '02-06', 2047: '01-26', 2048: '02-14', 2049: '02-02',
    2050: '01-23', 2051: '02-11', 2052: '02-01', 2053: '02-19', 2054: '02-08',
    2055: '01-28', 2056: '02-15', 2057: '02-04', 2058: '01-24', 2059: '02-12',
    2060: '02-02', 2061: '01-21', 2062: '02-09', 2063: '01-29', 2064: '02-17',
    2065: '02-05', 2066: '01-26', 2067: '02-14', 2068: '02-03', 2069: '01-23',
    2070: '02-11', 2071: '01-31', 2072: '02-19', 2073: '02-07', 2074: '01-27',
    2075: '02-15', 2076: '02-05', 2077: '01-24', 2078: '02-12', 2079: '02-02',
    2080: '01-22', 2081: '02-09', 2082: '01-29', 2083: '02-17', 2084: '02-06',
    2085: '01-26', 2086: '02-14', 2087: '02-03', 2088: '01-24', 2089: '02-10',
    2090: '01-30', 2091: '02-18', 2092: '02-07', 2093: '01-27', 2094: '02-15',
    2095: '02-05', 2096: '01-25', 2097: '02-12', 2098: '02-01', 2099: '01-21',
    2100: '02-09'
};

// 생년월일을 기반으로 추천 아바타 찾기 (음력 설날 기준)
export const getRecommendedAvatar = (birthYear, birthMonth, birthDay) => {
    if (!birthYear) return null;
    const year = parseInt(birthYear);
    if (isNaN(year) || year < 1900 || year > 2100) return null;

    // 실제 띠를 결정할 연도 (음력 설날 이전이면 전년도)
    let zodiacYear = year;

    // 생월일이 제공되고, 음력 설날 정보가 있는 경우
    if (birthMonth && birthDay && lunarNewYearDates[year]) {
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);

        if (!isNaN(month) && !isNaN(day)) {
            const [lunarMonth, lunarDay] = lunarNewYearDates[year].split('-').map(Number);

            // 생일이 음력 설날 이전이면 전년도의 띠
            if (month < lunarMonth || (month === lunarMonth && day < lunarDay)) {
                zodiacYear = year - 1;
            }
        }
    }

    const yearOffset = zodiacYear - 1900;
    const zodiacIndex = yearOffset % 12;

    return avatarList.find(avatar =>
        avatar.zodiacYear && avatar.zodiacYear.includes(zodiacIndex)
    );
};

// 별자리 ID로 아바타 찾기
export const getRecommendedZodiacSign = (zodiacSignId) => {
    if (!zodiacSignId) return null;
    return avatarList.find(avatar => avatar.zodiacSign === zodiacSignId);
};
