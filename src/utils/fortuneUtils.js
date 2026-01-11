// src/utils/fortuneUtils.js

/**
 * HEX 색상의 밝기를 계산하여 텍스트 색상 결정 (밝으면 검정, 어두우면 흰색)
 * @param {string} hexColor - HEX 색상 코드
 * @returns {string} 텍스트 색상 (검정 또는 흰색)
 */
export const getTextColorForBg = (hexColor) => {
    // HEX를 RGB로 변환
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // 밝기 계산 (perceived brightness formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 밝기가 155 이상이면 검정, 아니면 흰색
    return brightness > 155 ? '#2d3748' : 'white';
};

/**
 * 행운 색상명을 HEX 코드로 변환
 * @param {string} colorName - 색상명
 * @returns {string} HEX 색상 코드
 */
export const getColorHex = (colorName) => {
    const colorMap = {
        '녹색': '#48bb78',
        '청록': '#38b2ac',
        '연두': '#9ae6b4',
        '청색': '#4299e1',
        '빨강': '#f56565',
        '주황': '#ed8936',
        '보라': '#9f7aea',
        '분홍': '#ed64a6',
        '노랑': '#ecc94b',
        '갈색': '#a0522d',
        '베이지': '#d2b48c',
        '황토': '#cd853f',
        '하양': '#f7fafc',
        '금색': '#d4af37',
        '은색': '#c0c0c0',
        '회색': '#a0aec0',
        '검정': '#2d3748',
        '파랑': '#3182ce',
        '남색': '#2c5282'
    };

    // 색상 이름에서 기본 색상 찾기
    for (const [key, value] of Object.entries(colorMap)) {
        if (colorName.includes(key)) {
            return value;
        }
    }

    // 기본값
    return '#667eea';
};

/**
 * 받침 유무에 따라 조사 선택 (과/와)
 * @param {string|number} num - 확인할 숫자 또는 문자
 * @returns {string} '과' 또는 '와'
 */
export const getJosa = (num) => {
    const numStr = String(num);
    const lastChar = numStr.charAt(numStr.length - 1);
    const code = lastChar.charCodeAt(0);

    // 한글인 경우
    if (code >= 0xAC00 && code <= 0xD7A3) {
        return (code - 0xAC00) % 28 > 0 ? '과' : '와';
    }

    // 숫자인 경우 (0, 1, 3, 6, 7, 8은 받침 있음으로 처리)
    if (['0', '1', '3', '6', '7', '8'].includes(lastChar)) {
        return '과';
    }

    return '와';
};

/**
 * 운세 내용을 텍스트로 변환
 * @param {Object} fortuneResult - 운세 결과 객체
 * @returns {string} 포맷된 운세 텍스트
 */
export const formatFortuneText = (fortuneResult) => {
    return `
🔮 ${fortuneResult.userName}님의 오늘의 운세
📅 ${fortuneResult.date}

━━━━━━━━━━━━━━━━━━━━

🔮 사주 운세
일간: ${fortuneResult.userDayStem}
오늘 일진: ${fortuneResult.todayPillar}

🌈 행운 요소
${fortuneResult.lucky.introText}
행운의 숫자: ${fortuneResult.lucky.numbers}
행운의 색: ${fortuneResult.lucky.color}
행운의 방향: ${fortuneResult.lucky.direction}
행운의 상징: ${fortuneResult.lucky.items}
긍정 키워드: ${fortuneResult.lucky.concepts}

🌟 종합 운세
${fortuneResult.overall.keyword ? `[${fortuneResult.overall.keyword}]` : ''}
${fortuneResult.overall.content}

💰 재물운
${fortuneResult.money.keyword ? `[${fortuneResult.money.keyword}]` : ''}
${fortuneResult.money.content}

💪 건강운
${fortuneResult.health.keyword ? `[${fortuneResult.health.keyword}]` : ''}
${fortuneResult.health.content}

💕 애정운
${fortuneResult.love.keyword ? `[${fortuneResult.love.keyword}]` : ''}
${fortuneResult.love.content}

💡 오늘의 조언
${fortuneResult.advice.keyword ? `[${fortuneResult.advice.keyword}]` : ''}
${fortuneResult.advice.content}

🃏 타로점
${fortuneResult.tarot.message}
${fortuneResult.tarot.content || ''}

♈ 별자리 운세 (${fortuneResult.starSign.sign})
${fortuneResult.starSign.keyword ? `[${fortuneResult.starSign.keyword}]` : ''}
${fortuneResult.starSign.content}

━━━━━━━━━━━━━━━━━━━━
    `.trim();
};
