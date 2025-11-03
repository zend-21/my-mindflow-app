// src/utils/dataManager.js

const encrypt = (data) => JSON.stringify(data);
const decrypt = (data) => JSON.parse(data);

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