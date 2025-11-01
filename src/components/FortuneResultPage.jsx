// src/components/FortuneResultPage.jsx

import React, { useState } from 'react';
import styled from 'styled-components';

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

const Container = styled.div`
    background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 28px;
    font-weight: 700;
`;

const DateInfo = styled.p`
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
`;

const UserInfo = styled.p`
    margin: 8px 0 0 0;
    font-size: 16px;
    font-weight: 600;
`;

const Content = styled.div`
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ResultCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ResultTitle = styled.h3`
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #667eea;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Keyword = styled.div`
    display: inline-block;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    font-size: 16px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 12px;
`;

const ResultContent = styled.p`
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #555;
`;

const LuckyBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    color: white;
    font-size: 42px;
    font-weight: 700;
    min-width: 140px;
    min-height: 140px;
    border-radius: 50%;
    margin: 16px auto;
    box-shadow: 0 8px 20px rgba(25, 84, 123, 0.4);
    text-align: center;
    padding: 20px;
`;

const TarotCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    font-size: 28px;
    font-weight: 700;
    min-height: 120px;
    border-radius: 12px;
    margin: 12px 0;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    padding: 24px;
    text-align: center;
`;

const TarotDirection = styled.div`
    font-size: 14px;
    font-weight: 500;
    margin-top: 8px;
    opacity: 0.8;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 20px;
`;

const Button = styled.button`
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    ` : props.$secondary ? `
        background: #48bb78;
        color: white;
        &:hover {
            background: #38a169;
            transform: translateY(-2px);
        }
    ` : `
        background: #e2e8f0;
        color: #666;
        &:hover {
            background: #cbd5e0;
        }
    `}
`;

const CopyNotification = styled.div`
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #48bb78;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    opacity: ${props => props.$show ? '1' : '0'};
    transition: opacity 0.3s;
`;

// 🎯 Main Component

const FortuneResultPage = ({ fortuneResult, onClose, onReset }) => {
    const [showCopyNotification, setShowCopyNotification] = useState(false);

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
            setTimeout(() => setShowCopyNotification(false), 2000);
        } catch (err) {
            alert('복사에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <>
            <Overlay onClick={onClose}>
                <Container onClick={(e) => e.stopPropagation()}>
                    <Header>
                        <Title>오늘의 운세</Title>
                        <DateInfo>{fortuneResult.date}</DateInfo>
                        <UserInfo>{fortuneResult.userName}님의 운세</UserInfo>
                    </Header>

                    <Content>
                        {/* 사주 정보 */}
                        <ResultCard>
                            <ResultTitle>🌟 사주 정보</ResultTitle>
                            <ResultContent>
                                일간: <strong>{fortuneResult.userDayStem}</strong> |
                                오늘 일진: <strong>{fortuneResult.todayPillar}</strong> |
                                별자리: <strong>{fortuneResult.zodiacSign}</strong>
                            </ResultContent>
                        </ResultCard>

                        {/* 오늘의 운세 */}
                        <ResultCard>
                            <ResultTitle>📅 오늘의 운세</ResultTitle>
                            {fortuneResult.today.keyword && <Keyword>{fortuneResult.today.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.today.content}</ResultContent>
                        </ResultCard>

                        {/* 메인 운세 */}
                        <ResultCard>
                            <ResultTitle>⭐ 메인 운세</ResultTitle>
                            {fortuneResult.main.keyword && <Keyword>{fortuneResult.main.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.main.content}</ResultContent>
                        </ResultCard>

                        {/* 재물운 */}
                        <ResultCard>
                            <ResultTitle>💰 재물운</ResultTitle>
                            {fortuneResult.money.keyword && <Keyword>{fortuneResult.money.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.money.content}</ResultContent>
                        </ResultCard>

                        {/* 건강운 */}
                        <ResultCard>
                            <ResultTitle>💊 건강운</ResultTitle>
                            {fortuneResult.health.keyword && <Keyword>{fortuneResult.health.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.health.content}</ResultContent>
                        </ResultCard>

                        {/* 애정운 */}
                        <ResultCard>
                            <ResultTitle>💕 애정운</ResultTitle>
                            {fortuneResult.love.keyword && <Keyword>{fortuneResult.love.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.love.content}</ResultContent>
                        </ResultCard>

                        {/* 행운 요소 */}
                        <ResultCard>
                            <ResultTitle>🌈 행운 요소</ResultTitle>
                            <LuckyBox>{fortuneResult.lucky.keyword}</LuckyBox>
                            <ResultContent style={{ textAlign: 'center', marginTop: '8px' }}>
                                {fortuneResult.lucky.content}
                            </ResultContent>
                        </ResultCard>

                        {/* 오늘의 조언 */}
                        <ResultCard>
                            <ResultTitle>💡 오늘의 조언</ResultTitle>
                            {fortuneResult.advice.keyword && <Keyword>{fortuneResult.advice.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.advice.content}</ResultContent>
                        </ResultCard>

                        {/* 타로점 */}
                        <ResultCard>
                            <ResultTitle>🃏 타로점</ResultTitle>
                            <TarotCard>
                                {fortuneResult.tarot.card}
                                {fortuneResult.tarot.isReversed && (
                                    <TarotDirection>(역방향)</TarotDirection>
                                )}
                            </TarotCard>
                        </ResultCard>

                        {/* 별자리 운세 */}
                        <ResultCard>
                            <ResultTitle>♈ 별자리 운세 ({fortuneResult.starSign.sign})</ResultTitle>
                            {fortuneResult.starSign.keyword && <Keyword>{fortuneResult.starSign.keyword}</Keyword>}
                            <ResultContent>{fortuneResult.starSign.content}</ResultContent>
                        </ResultCard>

                        {/* 버튼 그룹 */}
                        <ButtonGroup>
                            <Button onClick={handleCopy} $secondary>복사하기</Button>
                            <Button onClick={onReset}>다시 보기</Button>
                            <Button onClick={onClose} $primary>확인</Button>
                        </ButtonGroup>
                    </Content>
                </Container>
            </Overlay>

            {/* 복사 완료 알림 */}
            <CopyNotification $show={showCopyNotification}>
                클립보드에 복사되었습니다!
            </CopyNotification>
        </>
    );
};

export default FortuneResultPage;
