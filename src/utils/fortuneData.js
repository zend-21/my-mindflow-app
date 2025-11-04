// src/utils/fortuneData.js

// fortune.csv 파일을 raw string으로 import (Vite의 ?raw 쿼리 사용)
import rawCsvData from './fortune.csv?raw';
// Tarot.csv 파일을 raw string으로 import
import rawTarotData from '../../public/fortune_data/Tarot.csv?raw';
// Horoscope.csv 파일을 raw string으로 import
import rawHoroscopeData from '../../public/fortune_data/horoscope.csv?raw'; 

// CSV 파일을 파싱하는 간단한 유틸리티 함수 (실제 라이브러리 대체 가능)
const parseCsv = (csvString) => {
    // 세미콜론(;) 구분자와 \n 줄바꿈을 기준으로 파싱
    const lines = csvString.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // 헤더(첫 줄)를 세미콜론으로 분리하여 사용
    const headers = lines[0].split(';').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(';');
        const item = {};
        headers.forEach((header, i) => {
            item[header] = (values[i] || '').trim();
        });
        return item;
    });
};

/**
 * CSV 데이터를 카테고리별로 분류하고, 행운 숫자를 0~9로 조정하여 반환
 */
export const getFortuneData = () => {
    // 1. CSV 데이터 파싱
    const allData = parseCsv(rawCsvData);
    const categorizedData = {};

    allData.forEach(item => {
        const category = item.Category;
        if (!categorizedData[category]) {
            categorizedData[category] = [];
        }
        categorizedData[category].push(item);
    });

    // 2. ✨ 행운 숫자 데이터 조정 (Lucky: 10, 11, 22 삭제 후 10 -> 0으로 변환)
    let luckyItems = categorizedData.Lucky || [];

    // 10, 11, 22 항목을 제거하고 1~9만 남김
    luckyItems = luckyItems.filter(item => {
        const keyword = item.Keyword;
        return keyword !== '10' && keyword !== '11' && keyword !== '22';
    });

    // 3. '0' 항목 수동 생성 (이전에 '10'이었던 항목을 대체)
    const newZeroItem = {
        Category: 'Lucky',
        ID: 'YL00', // 새로운 ID
        Keyword: '0',
        Content: '숫자 0은 새로운 시작과 완성된 주기를 의미합니다.',
        Image_File: 'lucky_num_00.png', 
        // 필요한 다른 필드도 CSV 구조에 맞게 채워야 합니다.
    };

    // 4. '0' 항목을 배열 맨 앞에 추가하여 0~9까지 10개 항목 완성
    luckyItems.unshift(newZeroItem);

    categorizedData.Lucky = luckyItems;

    return categorizedData;
};

/**
 * 타로 카드 데이터를 파싱하여 반환
 * @returns {Array} 156개의 타로 카드 데이터 (78장 × 정/역방향)
 */
export const getTarotData = () => {
    const tarotData = parseCsv(rawTarotData);
    return tarotData;
};

/**
 * 별자리 운세 데이터를 파싱하여 반환
 * @returns {Array} 240개의 별자리 운세 데이터 (12별자리 × 20개)
 */
export const getHoroscopeData = () => {
    const horoscopeData = parseCsv(rawHoroscopeData);
    return horoscopeData;
};

/**
 * 오행별 행운 요소 데이터를 반환
 * @returns {Promise<Object>} 오행별 행운 요소 데이터
 */
export const getLuckyElementsData = () => {
    return fetch('/fortune_data/fortune_database.json')
        .then(response => response.json())
        .then(data => data.LuckyElements)
        .catch(error => {
            console.error('Failed to load lucky elements data:', error);
            return null;
        });
};