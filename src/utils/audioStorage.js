// src/utils/audioStorage.js

/**
 * IndexedDB를 사용한 오디오 파일 저장 유틸리티
 * LocalStorage의 용량 제한을 피하기 위해 사용
 */

const DB_NAME = 'MindFlowAudioDB';
const STORE_NAME = 'audioFiles';
const DB_VERSION = 1;

/**
 * IndexedDB 연결 및 초기화
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * 오디오 파일 저장
 * @param {string} key - 저장할 키 (예: 'alarm_sound_custom')
 * @param {string} dataUrl - Base64 데이터 URL
 * @returns {Promise<void>}
 */
export const saveAudioFile = async (key, dataUrl) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(dataUrl, key);
      request.onsuccess = () => {
        console.log(`✅ 오디오 파일 저장 성공: ${key}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 오디오 파일 저장 실패:', error);
    throw error;
  }
};

/**
 * 오디오 파일 불러오기
 * @param {string} key - 불러올 키
 * @returns {Promise<string|null>} Base64 데이터 URL 또는 null
 */
export const loadAudioFile = async (key) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 오디오 파일 불러오기 실패:', error);
    return null;
  }
};

/**
 * 오디오 파일 삭제
 * @param {string} key - 삭제할 키
 * @returns {Promise<void>}
 */
export const deleteAudioFile = async (key) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => {
        console.log(`🗑️ 오디오 파일 삭제 성공: ${key}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 오디오 파일 삭제 실패:', error);
    throw error;
  }
};

/**
 * 모든 오디오 파일 목록 가져오기
 * @returns {Promise<Array<string>>} 키 목록
 */
export const getAllAudioKeys = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ 오디오 파일 목록 불러오기 실패:', error);
    return [];
  }
};
