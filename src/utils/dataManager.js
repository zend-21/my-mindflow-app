// src/utils/dataManager.js

import CryptoJS from 'crypto-js';

// 고정 암호화 키 (실제 배포 시에는 환경변수로 관리하는 것이 좋습니다)
// 여기서는 앱 자체 암호화이므로 사용자가 비밀번호를 기억할 필요 없도록 고정키 사용
const ENCRYPTION_KEY = 'MindFlow_Secure_Key_2025_v1.0_AES256';

const encrypt = (data) => {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
};

const decrypt = (encryptedData) => {
    try {
        // AES 암호화된 데이터 복호화 시도
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedString) {
            // 복호화 실패 - 구 형식(평문 JSON)일 가능성
            throw new Error('Decryption failed');
        }

        return JSON.parse(decryptedString);
    } catch (error) {
        // 구 형식(평문 JSON) 시도
        try {
            return JSON.parse(encryptedData);
        } catch (e) {
            throw new Error('올바른 백업 파일 형식이 아닙니다.');
        }
    }
};

export const exportData = (dataType, data) => {
    const encryptedData = encrypt(data);
    const blob = new Blob([encryptedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_backup_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 이 부분을 수정했습니다. 100ms 후 링크를 제거합니다.
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
};

export const importData = (file, setFunction) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const decryptedData = decrypt(e.target.result);
            setFunction(decryptedData);
            // 성공 메시지는 호출하는 곳에서 처리
        } catch (error) {
            console.error('파일을 불러오는 데 실패했습니다. 올바른 형식의 파일인지 확인해주세요.');
            console.error('Import failed:', error);
        }
    };
    reader.readAsText(file);
};