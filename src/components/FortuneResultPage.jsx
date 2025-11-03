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
    padding: 32px 24px;
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
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 28px;
    }
`;

const UserInfo = styled.div`
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    opacity: 0.95;

    @media (min-width: 768px) {
        font-size: 15px;
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

const Section = styled.div`
    animation: ${slideUp} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay || '0s'};
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
    background: #f7fafc;
    border-radius: 16px;
    padding: 20px;
    border-left: 4px solid ${props => props.$borderColor || '#667eea'};

    @media (min-width: 768px) {
        padding: 24px;
    }
`;

const Keyword = styled.span`
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    margin-bottom: 12px;

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

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    background: #f7fafc;
    border-radius: 16px;
    padding: 20px;
`;

const InfoItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const InfoLabel = styled.span`
    font-size: 12px;
    color: #718096;
    font-weight: 500;
`;

const InfoValue = styled.span`
    font-size: 16px;
    color: #2d3748;
    font-weight: 600;

    @media (min-width: 768px) {
        font-size: 17px;
    }
`;

const LuckyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
`;

const LuckyNumber = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: #19547b;
    font-size: 36px;
    font-weight: 700;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    @media (min-width: 768px) {
        font-size: 42px;
        width: 120px;
        height: 120px;
    }
`;

const LuckyText = styled.p`
    margin: 0;
    color: white;
    font-size: 15px;
    line-height: 1.6;
    font-weight: 500;

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
    margin-top: 8px;
    padding: 0 24px 24px;
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

    // 운세 내용을 텍스트로 변환
    const formatFortuneText = () => {
        return `
🔮 ${fortuneResult.userName}님의 오늘의 운세
📅 ${fortuneResult.date}
🌟 일간: ${fortuneResult.userDayStem} | 오늘 일진: ${fortuneResult.todayPillar}
♈ 별자리: ${fortuneResult.zodiacSign}

━━━━━━━━━━━━━━━━━━━━

📅 오늘의 운세
${fortuneResult.today.keyword ? `[${fortuneResult.today.keyword}]` : ''}
${fortuneResult.today.content}

⭐ 메인 운세
${fortuneResult.main.keyword ? `[${fortuneResult.main.keyword}]` : ''}
${fortuneResult.main.content}

💰 재물운
${fortuneResult.money.keyword ? `[${fortuneResult.money.keyword}]` : ''}
${fortuneResult.money.content}

💊 건강운
${fortuneResult.health.keyword ? `[${fortuneResult.health.keyword}]` : ''}
${fortuneResult.health.content}

💕 애정운
${fortuneResult.love.keyword ? `[${fortuneResult.love.keyword}]` : ''}
${fortuneResult.love.content}

🌈 행운 요소
${fortuneResult.lucky.keyword}
${fortuneResult.lucky.content}

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
                        {/* 사주 정보 */}
                        <Section $delay="0.05s">
                            <SectionTitle>🌟 사주 정보</SectionTitle>
                            {fortuneResult.lunarDate ? (
                                <InfoGrid>
                                    <InfoItem>
                                        <InfoLabel>일간</InfoLabel>
                                        <InfoValue>{fortuneResult.userDayStem}</InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>오늘 일진</InfoLabel>
                                        <InfoValue>{fortuneResult.todayPillar}</InfoValue>
                                    </InfoItem>
                                    <InfoItem>
                                        <InfoLabel>별자리</InfoLabel>
                                        <InfoValue>{fortuneResult.zodiacSign}</InfoValue>
                                    </InfoItem>
                                </InfoGrid>
                            ) : (
                                <SectionContent $borderColor="#e2e8f0" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                                    ⚠️ 음력 정보가 없어 사주 결과를 표시할 수 없습니다.
                                </SectionContent>
                            )}
                        </Section>

                        {/* 오늘의 운세 */}
                        <Section $delay="0.1s">
                            <SectionTitle>📅 오늘의 운세</SectionTitle>
                            <SectionContent $borderColor="#667eea">
                                {fortuneResult.today.keyword && <Keyword>{fortuneResult.today.keyword}</Keyword>}
                                <Text>{fortuneResult.today.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 메인 운세 */}
                        <Section $delay="0.15s">
                            <SectionTitle>⭐ 메인 운세</SectionTitle>
                            <SectionContent $borderColor="#764ba2">
                                {fortuneResult.main.keyword && <Keyword>{fortuneResult.main.keyword}</Keyword>}
                                <Text>{fortuneResult.main.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 재물운 */}
                        <Section $delay="0.2s">
                            <SectionTitle>💰 재물운</SectionTitle>
                            <SectionContent $borderColor="#f6ad55">
                                {fortuneResult.money.keyword && <Keyword>{fortuneResult.money.keyword}</Keyword>}
                                <Text>{fortuneResult.money.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 건강운 */}
                        <Section $delay="0.25s">
                            <SectionTitle>💊 건강운</SectionTitle>
                            <SectionContent $borderColor="#48bb78">
                                {fortuneResult.health.keyword && <Keyword>{fortuneResult.health.keyword}</Keyword>}
                                <Text>{fortuneResult.health.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 애정운 */}
                        <Section $delay="0.3s">
                            <SectionTitle>💕 애정운</SectionTitle>
                            <SectionContent $borderColor="#f687b3">
                                {fortuneResult.love.keyword && <Keyword>{fortuneResult.love.keyword}</Keyword>}
                                <Text>{fortuneResult.love.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 행운 요소 */}
                        <Section $delay="0.35s">
                            <SectionTitle>🌈 행운 요소</SectionTitle>
                            <LuckyContainer>
                                <LuckyNumber>{fortuneResult.lucky.keyword}</LuckyNumber>
                                <LuckyText>{fortuneResult.lucky.content}</LuckyText>
                            </LuckyContainer>
                        </Section>

                        {/* 오늘의 조언 */}
                        <Section $delay="0.4s">
                            <SectionTitle>💡 오늘의 조언</SectionTitle>
                            <SectionContent $borderColor="#9f7aea">
                                {fortuneResult.advice.keyword && <Keyword>{fortuneResult.advice.keyword}</Keyword>}
                                <Text>{fortuneResult.advice.content}</Text>
                            </SectionContent>
                        </Section>

                        {/* 타로점 */}
                        <Section $delay="0.45s">
                            <SectionTitle>🃏 타로점</SectionTitle>
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
                        </Section>

                        {/* 별자리 운세 */}
                        <Section $delay="0.5s">
                            <SectionTitle>♈ 별자리 운세 ({fortuneResult.starSign.sign})</SectionTitle>
                            <SectionContent $borderColor="#ed8936">
                                {fortuneResult.starSign.keyword && <Keyword>{fortuneResult.starSign.keyword}</Keyword>}
                                <Text>{fortuneResult.starSign.content}</Text>
                            </SectionContent>
                        </Section>
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
