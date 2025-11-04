// src/components/FortuneResultPage.jsx

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// 🎨 Animations

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const scaleIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
    padding: 20px;

    @media (max-width: 768px) {
        padding: 0;
    }
`;

const Container = styled.div`
    background: #ffffff;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${scaleIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    @media (max-width: 768px) {
        max-height: 100vh;
        border-radius: 0;
    }
`;

const Header = styled.div`
    padding: 17px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: white;
        border-radius: 2px;
    }
`;

const Title = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

const UserInfo = styled.div`
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 13px;
    opacity: 0.95;

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

const Content = styled.div`
    padding: 40px 24px 24px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;

    /* 커스텀 스크롤바 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }
`;

// 큰 카테고리 컨테이너 (사주/타로/별자리 구분용)
const CategoryContainer = styled.div`
    background: ${props => props.$bgColor || '#ffffff'};
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid ${props => props.$borderColor || '#e2e8f0'};
    animation: ${slideUp} 0.6s ease-out backwards;
    animation-delay: ${props => props.$delay || '0s'};
    margin-bottom: 32px;

    @media (min-width: 768px) {
        padding: 40px 32px;
    }
`;

const CategoryTitle = styled.h2`
    margin: 0 0 28px 0;
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$color || '#2d3748'};
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 3px solid ${props => props.$borderColor || '#e2e8f0'};

    @media (min-width: 768px) {
        font-size: 28px;
    }
`;

const Section = styled.div`
    animation: ${slideUp} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay || '0s'};
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const SectionTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 8px;

    @media (min-width: 768px) {
        font-size: 20px;
    }
`;

const SectionContent = styled.div`
    background: transparent;
    border: 2px solid ${props => props.$borderColor || '#667eea'};
    border-radius: 16px;
    padding: 24px 20px;

    @media (min-width: 768px) {
        padding: 28px 24px;
    }
`;

const Keyword = styled.span`
    display: inline-block;
    background: ${props => props.$color || '#667eea'};
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 20px;
    margin-bottom: 14px;

    @media (min-width: 768px) {
        font-size: 14px;
        padding: 7px 16px;
    }
`;

const Text = styled.p`
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #4a5568;

    @media (min-width: 768px) {
        font-size: 16px;
        line-height: 1.8;
    }
`;

const SajuInfoBox = styled.div`
    background: #fefcfb;
    border: 1px solid #d4a574;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    @media (min-width: 768px) {
        padding: 18px 24px;
    }
`;

const SajuInfoItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

const SajuInfoLabel = styled.span`
    font-size: 12px;
    color: #8b5e34;
    font-weight: 500;
`;

const SajuInfoValue = styled.span`
    font-size: 16px;
    color: #2d3748;
    font-weight: 700;

    @media (min-width: 768px) {
        font-size: 17px;
    }
`;

const LuckyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    background: #fefcfb;
    border: 2px solid #d4a574;
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const LuckyIntroText = styled.p`
    margin: 0;
    color: #8b5e34;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.6;

    @media (min-width: 768px) {
        font-size: 17px;
    }
`;

const LuckyNumbersWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
`;

const LuckyNumbers = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
`;

const LuckyNumber = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$bgColor || '#ffffff'};
    color: ${props => props.$textColor || '#2d3748'};
    font-size: 36px;
    font-weight: 700;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);

    @media (min-width: 768px) {
        font-size: 42px;
        width: 90px;
        height: 90px;
    }
`;

const LuckyNumberCaption = styled.p`
    margin: 0;
    color: #8b5e34;
    font-size: 13px;
    font-weight: 500;

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

const LuckyDetailsBox = styled.div`
    background: #f7f5f3;
    border-radius: 12px;
    padding: 20px 24px;
    width: 100%;
    max-width: 500px;
    border: 1px solid #e6dfd8;
`;

const LuckyDetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const LuckyLabel = styled.span`
    color: #6b5d54;
    font-size: 14px;
    font-weight: 500;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const LuckyValue = styled.span`
    color: #2d3748;
    font-size: 15px;
    font-weight: 600;
    text-align: right;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const TarotContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-radius: 16px;
    padding: 28px 24px;
`;

const TarotCard = styled.div`
    background: white;
    color: #2c3e50;
    font-size: 22px;
    font-weight: 600;
    padding: 20px 32px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;

    @media (min-width: 768px) {
        font-size: 24px;
        padding: 24px 40px;
    }
`;

const TarotImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
`;

const TarotImage = styled.img`
    max-width: 200px;
    width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: ${props => props.$isReversed ? 'rotate(180deg)' : 'rotate(0deg)'};
    transition: transform 0.3s ease;

    @media (min-width: 768px) {
        max-width: 250px;
    }
`;

const TarotDirection = styled.span`
    display: inline-block;
    color: white;
    font-size: 13px;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.15);
    padding: 4px 12px;
    border-radius: 12px;
    margin-top: 8px;
`;

const TarotText = styled.p`
    margin: 16px 0 0 0;
    color: white;
    font-size: 15px;
    line-height: 1.7;
    text-align: center;
    opacity: 0.95;

    @media (min-width: 768px) {
        font-size: 16px;
        line-height: 1.8;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    padding: 24px;
`;

const Button = styled.button`
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        &:active {
            transform: translateY(0);
        }
    ` : props.$secondary ? `
        background: #48bb78;
        color: white;
        &:hover {
            background: #38a169;
            transform: translateY(-2px);
        }
        &:active {
            transform: translateY(0);
        }
    ` : `
        background: #edf2f7;
        color: #4a5568;
        &:hover {
            background: #e2e8f0;
        }
    `}

    @media (min-width: 768px) {
        font-size: 16px;
        padding: 16px;
    }
`;

const CopyNotification = styled.div`
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #48bb78;
    color: white;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(72, 187, 120, 0.4);
    z-index: 10001;
    opacity: ${props => props.$show ? '1' : '0'};
    transform: translateX(-50%) ${props => props.$show ? 'translateY(0)' : 'translateY(-20px)'};
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
`;

const ErrorNotification = styled.div`
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #f56565;
    color: white;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(245, 101, 101, 0.4);
    z-index: 10001;
    opacity: ${props => props.$show ? '1' : '0'};
    transform: translateX(-50%) ${props => props.$show ? 'translateY(0)' : 'translateY(-20px)'};
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
`;

// 🎯 Main Component

const FortuneResultPage = ({ fortuneResult, onClose, onReset }) => {
    const [showCopyNotification, setShowCopyNotification] = useState(false);
    const [showErrorNotification, setShowErrorNotification] = useState(false);

    if (!fortuneResult) return null;

    // HEX 색상의 밝기를 계산하여 텍스트 색상 결정 (밝으면 검정, 어두우면 흰색)
    const getTextColorForBg = (hexColor) => {
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

    // 행운 색상명을 HEX 코드로 변환
    const getColorHex = (colorName) => {
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

    // 행운의 색 HEX 코드와 텍스트 색상 계산
    const luckyColorHex = getColorHex(fortuneResult.lucky.color);
    const luckyTextColor = getTextColorForBg(luckyColorHex);
    const numbersArray = fortuneResult.lucky.numbers.split(', ');

    // 받침 유무에 따라 조사 선택 (과/와)
    const getJosa = (num) => {
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

    // 운세 내용을 텍스트로 변환
    const formatFortuneText = () => {
        return `
🔮 ${fortuneResult.userName}님의 오늘의 운세
📅 ${fortuneResult.date}
🌟 일간: ${fortuneResult.userDayStem} | 오늘 일진: ${fortuneResult.todayPillar}
♈ 별자리: ${fortuneResult.zodiacSign}

━━━━━━━━━━━━━━━━━━━━

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

🌈 행운 요소
${fortuneResult.lucky.introText}
행운의 숫자: ${fortuneResult.lucky.numbers}
행운의 색: ${fortuneResult.lucky.color}
행운의 방향: ${fortuneResult.lucky.direction}
행운의 상징: ${fortuneResult.lucky.items}
긍정 키워드: ${fortuneResult.lucky.concepts}

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

    // 복사 기능
    const handleCopy = async () => {
        const text = formatFortuneText();
        try {
            await navigator.clipboard.writeText(text);
            setShowCopyNotification(true);
            setTimeout(() => setShowCopyNotification(false), 2500);
        } catch (err) {
            setShowErrorNotification(true);
            setTimeout(() => setShowErrorNotification(false), 2500);
        }
    };

    return (
        <>
            <Overlay onClick={onClose}>
                <Container onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>오늘의 운세</Title>
                        <UserInfo>
                            <div>{fortuneResult.date}</div>
                            <div>{fortuneResult.userName}님</div>
                        </UserInfo>
                    </Header>

                    <Content>
                        {/* ========== 사주 운세 ========== */}
                        <CategoryContainer
                            $bgColor="#fefcfb"
                            $borderColor="#d4a574"
                            $delay="0.1s"
                        >
                            <CategoryTitle $color="#8b5e34" $borderColor="#d4a574">
                                🔮 사주 운세
                            </CategoryTitle>

                            {/* 사주 정보 */}
                            {fortuneResult.lunarDate && (
                                <SajuInfoBox>
                                    <SajuInfoItem>
                                        <SajuInfoLabel>일간</SajuInfoLabel>
                                        <SajuInfoValue>{fortuneResult.userDayStem}</SajuInfoValue>
                                    </SajuInfoItem>
                                    <SajuInfoItem>
                                        <SajuInfoLabel>오늘 일진</SajuInfoLabel>
                                        <SajuInfoValue>{fortuneResult.todayPillar}</SajuInfoValue>
                                    </SajuInfoItem>
                                </SajuInfoBox>
                            )}

                            {!fortuneResult.lunarDate && (
                                <SectionContent $borderColor="#e2e8f0" style={{ textAlign: 'center', padding: '24px', color: '#999', marginBottom: '20px' }}>
                                    ⚠️ 음력 정보가 없어 사주 결과를 표시할 수 없습니다.
                                </SectionContent>
                            )}

                            {/* 행운 요소 */}
                            <Section $delay="0s">
                                <SectionTitle>🌈 행운 요소</SectionTitle>
                                <LuckyContainer>
                                    <LuckyIntroText>{fortuneResult.lucky.introText}</LuckyIntroText>

                                    <LuckyNumbersWrapper>
                                        <LuckyNumbers>
                                            {numbersArray.map((num, idx) => (
                                                <LuckyNumber
                                                    key={idx}
                                                    $bgColor={luckyColorHex}
                                                    $textColor={luckyTextColor}
                                                >
                                                    {num}
                                                </LuckyNumber>
                                            ))}
                                        </LuckyNumbers>
                                        <LuckyNumberCaption>
                                            금일 행운의 숫자는 {numbersArray[0]}{getJosa(numbersArray[0])} {numbersArray[1]}입니다
                                        </LuckyNumberCaption>
                                    </LuckyNumbersWrapper>

                                    <LuckyDetailsBox>
                                        <LuckyDetailRow>
                                            <LuckyLabel>행운의 색</LuckyLabel>
                                            <LuckyValue>{fortuneResult.lucky.color}</LuckyValue>
                                        </LuckyDetailRow>
                                        <LuckyDetailRow>
                                            <LuckyLabel>행운의 방향</LuckyLabel>
                                            <LuckyValue>{fortuneResult.lucky.direction}</LuckyValue>
                                        </LuckyDetailRow>
                                        <LuckyDetailRow>
                                            <LuckyLabel>행운의 상징</LuckyLabel>
                                            <LuckyValue>{fortuneResult.lucky.items}</LuckyValue>
                                        </LuckyDetailRow>
                                        <LuckyDetailRow>
                                            <LuckyLabel>긍정 키워드</LuckyLabel>
                                            <LuckyValue>{fortuneResult.lucky.concepts}</LuckyValue>
                                        </LuckyDetailRow>
                                    </LuckyDetailsBox>
                                </LuckyContainer>
                            </Section>

                            {/* 종합 운세 */}
                            <Section $delay="0s">
                                <SectionTitle>🌟 종합 운세</SectionTitle>
                                <SectionContent $borderColor="#667eea">
                                    {fortuneResult.overall.keyword && <Keyword $color="#667eea">{fortuneResult.overall.keyword}</Keyword>}
                                    <Text style={{ whiteSpace: 'pre-wrap' }}>{fortuneResult.overall.content}</Text>
                                </SectionContent>
                            </Section>

                            {/* 재물운 */}
                            <Section $delay="0s">
                                <SectionTitle>💰 재물운</SectionTitle>
                                <SectionContent $borderColor="#f6ad55">
                                    {fortuneResult.money.keyword && <Keyword $color="#f6ad55">{fortuneResult.money.keyword}</Keyword>}
                                    <Text>{fortuneResult.money.content}</Text>
                                </SectionContent>
                            </Section>

                            {/* 건강운 */}
                            <Section $delay="0s">
                                <SectionTitle>💪 건강운</SectionTitle>
                                <SectionContent $borderColor="#48bb78">
                                    {fortuneResult.health.keyword && <Keyword $color="#48bb78">{fortuneResult.health.keyword}</Keyword>}
                                    <Text>{fortuneResult.health.content}</Text>
                                </SectionContent>
                            </Section>

                            {/* 애정운 */}
                            <Section $delay="0s">
                                <SectionTitle>💕 애정운</SectionTitle>
                                <SectionContent $borderColor="#f687b3">
                                    {fortuneResult.love.keyword && <Keyword $color="#f687b3">{fortuneResult.love.keyword}</Keyword>}
                                    <Text>{fortuneResult.love.content}</Text>
                                </SectionContent>
                            </Section>

                            {/* 오늘의 조언 */}
                            <Section $delay="0s">
                                <SectionTitle>💡 오늘의 조언</SectionTitle>
                                <SectionContent $borderColor="#9f7aea">
                                    {fortuneResult.advice.keyword && <Keyword $color="#9f7aea">{fortuneResult.advice.keyword}</Keyword>}
                                    <Text>{fortuneResult.advice.content}</Text>
                                </SectionContent>
                            </Section>
                        </CategoryContainer>

                        {/* ========== 타로점 ========== */}
                        <CategoryContainer
                            $bgColor="#faf5ff"
                            $borderColor="#9f7aea"
                            $delay="0.2s"
                        >
                            <CategoryTitle $color="#6b46c1" $borderColor="#9f7aea">
                                🃏 타로점
                            </CategoryTitle>

                            <TarotContainer>
                                {fortuneResult.tarot.imageFile && (
                                    <TarotImageWrapper>
                                        <TarotImage
                                            src={`/images/tarot/${fortuneResult.tarot.imageFile}`}
                                            alt={fortuneResult.tarot.card}
                                            $isReversed={fortuneResult.tarot.isReversed}
                                        />
                                    </TarotImageWrapper>
                                )}
                                <TarotCard>{fortuneResult.tarot.card}</TarotCard>
                                {fortuneResult.tarot.isReversed && (
                                    <TarotDirection>역방향</TarotDirection>
                                )}
                                {fortuneResult.tarot.content && (
                                    <TarotText>{fortuneResult.tarot.content}</TarotText>
                                )}
                            </TarotContainer>
                        </CategoryContainer>

                        {/* ========== 별자리 운세 ========== */}
                        <CategoryContainer
                            $bgColor="#fffaf0"
                            $borderColor="#ed8936"
                            $delay="0.3s"
                        >
                            <CategoryTitle $color="#c05621" $borderColor="#ed8936">
                                ♈ 별자리 운세
                            </CategoryTitle>

                            <Section $delay="0s">
                                <SectionTitle>✨ {fortuneResult.starSign.sign} 오늘의 운세</SectionTitle>
                                <SectionContent $borderColor="#ed8936">
                                    {fortuneResult.starSign.keyword && <Keyword $color="#ed8936">{fortuneResult.starSign.keyword}</Keyword>}
                                    <Text>{fortuneResult.starSign.content}</Text>
                                </SectionContent>
                            </Section>
                        </CategoryContainer>
                    </Content>

                    {/* 버튼 그룹 */}
                    <ButtonGroup>
                        <Button onClick={handleCopy} $secondary>복사</Button>
                        <Button onClick={onReset}>다시보기</Button>
                        <Button onClick={onClose} $primary>확인</Button>
                    </ButtonGroup>
                </Container>
            </Overlay>

            {/* 복사 완료 알림 */}
            <CopyNotification $show={showCopyNotification}>
                ✓ 복사되었습니다
            </CopyNotification>

            {/* 에러 알림 */}
            <ErrorNotification $show={showErrorNotification}>
                ⚠️ 복사에 실패했습니다
            </ErrorNotification>
        </>
    );
};

export default FortuneResultPage;
