// src/hooks/useLocalStorage.js

import { useState, useEffect } from 'react';

function getStorageValue(key, defaultValue) {
    try {
        const saved = localStorage.getItem(key);
        // null, undefined, 빈 문자열, "undefined" 문자열 처리
        if (!saved || saved === 'undefined' || saved === 'null') {
            return defaultValue;
        }
        const initial = JSON.parse(saved);
        return initial !== null && initial !== undefined ? initial : defaultValue;
    } catch (error) {
        console.error(`localStorage 파싱 오류 (${key}):`, error);
        // 오류 발생 시 해당 키 삭제하고 기본값 반환
        localStorage.removeItem(key);
        return defaultValue;
    }
}

export const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};