// src/components/FortuneResultPage.jsx

import React, { useState } from 'react';
import * as S from './FortuneResultPage.styles';
import { getTextColorForBg, getColorHex, getJosa, formatFortuneText } from '../utils/fortuneUtils';

// 🎯 Main Component

const FortuneResultPage = ({ fortuneResult, onClose, onReset }) => {
    const [showCopyNotification, setShowCopyNotification] = useState(false);
    const [showErrorNotification, setShowErrorNotification] = useState(false);

    if (!fortuneResult) return null;

    // 행운의 색 HEX 코드와 텍스트 색상 계산
    const luckyColorHex = getColorHex(fortuneResult.lucky.color);
    const luckyTextColor = getTextColorForBg(luckyColorHex);
    const numbersArray = fortuneResult.lucky.numbers.split(', ');

    // 복사 기능
    const handleCopy = async () => {
        const text = formatFortuneText(fortuneResult);
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
            <S.Overlay onClick={onClose}>
                <S.Container onClick={(e) => e.stopPropagation()}>
                    <S.Header>
                        <S.Title>오늘의 운세</S.Title>
                        <S.UserInfo>
                            <div>{fortuneResult.date}</div>
                            <div>{fortuneResult.userName}님</div>
                        </S.UserInfo>
                    </S.Header>

                    <S.Content>
                        {/* ========== 사주 운세 ========== */}
                        <S.CategoryContainer
                            $bgColor="#fefcfb"
                            $borderColor="#d4a574"
                            $delay="0.1s"
                        >
                            <S.CategoryTitle $color="#8b5e34" $borderColor="#d4a574">
                                🔮 사주 운세
                            </S.CategoryTitle>

                            {/* 사주 정보 */}
                            {fortuneResult.lunarDate && (
                                <S.SajuInfoBox>
                                    <S.SajuInfoItem>
                                        <S.SajuInfoLabel>일간</S.SajuInfoLabel>
                                        <S.SajuInfoValue>{fortuneResult.userDayStem}</S.SajuInfoValue>
                                    </S.SajuInfoItem>
                                    <S.SajuInfoItem>
                                        <S.SajuInfoLabel>오늘 일진</S.SajuInfoLabel>
                                        <S.SajuInfoValue>{fortuneResult.todayPillar}</S.SajuInfoValue>
                                    </S.SajuInfoItem>
                                </S.SajuInfoBox>
                            )}

                            {!fortuneResult.lunarDate && (
                                <S.SectionContent $borderColor="#e2e8f0" style={{ textAlign: 'center', padding: '24px', color: '#999', marginBottom: '20px' }}>
                                    ⚠️ 음력 정보가 없어 사주 결과를 표시할 수 없습니다.
                                </S.SectionContent>
                            )}

                            {/* 행운 요소 */}
                            <S.Section $delay="0s">
                                <S.LuckyWrapper>
                                    <S.LuckyTabTitle>🌈 행운 요소</S.LuckyTabTitle>
                                    <S.LuckyContainer>
                                        <S.LuckyIntroText>{fortuneResult.lucky.introText}</S.LuckyIntroText>

                                        <S.LuckyNumbersWrapper>
                                            <S.LuckyNumbers>
                                                {numbersArray.map((num, idx) => (
                                                    <S.LuckyNumber
                                                        key={idx}
                                                        $bgColor={luckyColorHex}
                                                        $textColor={luckyTextColor}
                                                    >
                                                        {num}
                                                    </S.LuckyNumber>
                                                ))}
                                            </S.LuckyNumbers>
                                            <S.LuckyNumberCaption>
                                                금일 행운의 숫자는 {numbersArray[0]}{getJosa(numbersArray[0])} {numbersArray[1]}입니다
                                            </S.LuckyNumberCaption>
                                        </S.LuckyNumbersWrapper>

                                        <S.LuckyDetailsBox>
                                            <S.LuckyDetailRow>
                                                <S.LuckyLabel>행운의 색</S.LuckyLabel>
                                                <S.LuckyValue>{fortuneResult.lucky.color}</S.LuckyValue>
                                            </S.LuckyDetailRow>
                                            <S.LuckyDetailRow>
                                                <S.LuckyLabel>행운의 방향</S.LuckyLabel>
                                                <S.LuckyValue>{fortuneResult.lucky.direction}</S.LuckyValue>
                                            </S.LuckyDetailRow>
                                            <S.LuckyDetailRow>
                                                <S.LuckyLabel>행운의 상징</S.LuckyLabel>
                                                <S.LuckyValue>{fortuneResult.lucky.items}</S.LuckyValue>
                                            </S.LuckyDetailRow>
                                            <S.LuckyDetailRow>
                                                <S.LuckyLabel>긍정 키워드</S.LuckyLabel>
                                                <S.LuckyValue>{fortuneResult.lucky.concepts}</S.LuckyValue>
                                            </S.LuckyDetailRow>
                                        </S.LuckyDetailsBox>
                                    </S.LuckyContainer>
                                </S.LuckyWrapper>
                            </S.Section>

                            {/* 종합 운세 */}
                            <S.Section $delay="0s">
                                <S.FortuneWrapper>
                                    <S.FortuneTabTitle $bgColor="#a5b4fc">🌟 종합 운세</S.FortuneTabTitle>
                                    <S.FortuneContainer $borderColor="#a5b4fc">
                                        {fortuneResult?.overall?.keyword && <S.Keyword $color="#a5b4fc">{fortuneResult.overall.keyword}</S.Keyword>}
                                        <S.Text style={{ whiteSpace: 'pre-wrap' }}>
                                            {fortuneResult?.overall?.content || '운세 정보를 불러올 수 없습니다.'}
                                        </S.Text>
                                    </S.FortuneContainer>
                                </S.FortuneWrapper>
                            </S.Section>

                            {/* 재물운 */}
                            <S.Section $delay="0s">
                                <S.FortuneWrapper>
                                    <S.FortuneTabTitle $bgColor="#f6ad55">💰 재물운</S.FortuneTabTitle>
                                    <S.FortuneContainer $borderColor="#f6ad55">
                                        {fortuneResult?.money?.keyword && <S.Keyword $color="#f6ad55">{fortuneResult.money.keyword}</S.Keyword>}
                                        <S.Text>{fortuneResult?.money?.content || '운세 정보를 불러올 수 없습니다.'}</S.Text>
                                    </S.FortuneContainer>
                                </S.FortuneWrapper>
                            </S.Section>

                            {/* 건강운 */}
                            <S.Section $delay="0s">
                                <S.FortuneWrapper>
                                    <S.FortuneTabTitle $bgColor="#48bb78">💪 건강운</S.FortuneTabTitle>
                                    <S.FortuneContainer $borderColor="#48bb78">
                                        {fortuneResult?.health?.keyword && <S.Keyword $color="#48bb78">{fortuneResult.health.keyword}</S.Keyword>}
                                        <S.Text>{fortuneResult?.health?.content || '운세 정보를 불러올 수 없습니다.'}</S.Text>
                                    </S.FortuneContainer>
                                </S.FortuneWrapper>
                            </S.Section>

                            {/* 애정운 */}
                            <S.Section $delay="0s">
                                <S.FortuneWrapper>
                                    <S.FortuneTabTitle $bgColor="#f687b3">💕 애정운</S.FortuneTabTitle>
                                    <S.FortuneContainer $borderColor="#f687b3">
                                        {fortuneResult?.love?.keyword && <S.Keyword $color="#f687b3">{fortuneResult.love.keyword}</S.Keyword>}
                                        <S.Text>{fortuneResult?.love?.content || '운세 정보를 불러올 수 없습니다.'}</S.Text>
                                    </S.FortuneContainer>
                                </S.FortuneWrapper>
                            </S.Section>

                            {/* 오늘의 조언 */}
                            <S.Section $delay="0s">
                                <S.FortuneWrapper>
                                    <S.FortuneTabTitle $bgColor="#c4b5fd">💡 오늘의 조언</S.FortuneTabTitle>
                                    <S.FortuneContainer $borderColor="#c4b5fd">
                                        {fortuneResult?.advice?.keyword && <S.Keyword $color="#c4b5fd">{fortuneResult.advice.keyword}</S.Keyword>}
                                        <S.Text>{fortuneResult?.advice?.content || '운세 정보를 불러올 수 없습니다.'}</S.Text>
                                    </S.FortuneContainer>
                                </S.FortuneWrapper>
                            </S.Section>
                        </S.CategoryContainer>

                        {/* ========== 타로점 ========== */}
                        <S.CategoryContainer
                            $bgColor="#faf5ff"
                            $borderColor="#9f7aea"
                            $delay="0.2s"
                        >
                            <S.CategoryTitle $color="#6b46c1" $borderColor="#9f7aea">
                                🃏 타로점
                            </S.CategoryTitle>

                            <S.TarotContainer>
                                <S.TarotNotice>
                                    타로는 사용자의 선택 또한 운명의 일부로 받아들입니다. 타로점을 실행한 시간에 따라 그날의 운세가 변동될 수 있습니다.
                                </S.TarotNotice>
                                {fortuneResult.tarot.imageFile && (
                                    <S.TarotImageWrapper>
                                        <S.TarotImage
                                            src={`/images/tarot/${fortuneResult.tarot.imageFile}`}
                                            alt={fortuneResult.tarot.card}
                                            $isReversed={fortuneResult.tarot.isReversed}
                                        />
                                    </S.TarotImageWrapper>
                                )}
                                <S.TarotCard>{fortuneResult.tarot.card}</S.TarotCard>
                                {fortuneResult.tarot.isReversed && (
                                    <S.TarotDirection>역방향</S.TarotDirection>
                                )}
                                {fortuneResult.tarot.content && (
                                    <S.TarotText>{fortuneResult.tarot.content}</S.TarotText>
                                )}
                            </S.TarotContainer>
                        </S.CategoryContainer>

                        {/* ========== 별자리 운세 ========== */}
                        <S.CategoryContainer
                            $bgColor="#fffaf0"
                            $borderColor="#ed8936"
                            $delay="0.3s"
                        >
                            <S.CategoryTitle $color="#c05621" $borderColor="#ed8936">
                                ♈ 별자리 운세
                            </S.CategoryTitle>

                            <S.Section $delay="0s">
                                <S.SectionTitle>✨ {fortuneResult.starSign.sign} 오늘의 운세</S.SectionTitle>
                                <S.SectionContent $borderColor="#ed8936">
                                    {fortuneResult.starSign.keyword && <S.Keyword $color="#ed8936">{fortuneResult.starSign.keyword}</S.Keyword>}
                                    <S.Text>{fortuneResult.starSign.content}</S.Text>
                                </S.SectionContent>
                            </S.Section>
                        </S.CategoryContainer>
                    </S.Content>

                    {/* 버튼 그룹 */}
                    <S.ButtonGroup>
                        <S.Button onClick={handleCopy} $secondary>복사</S.Button>
                        <S.Button onClick={onClose} $primary>확인</S.Button>
                    </S.ButtonGroup>
                </S.Container>
            </S.Overlay>

            {/* 복사 완료 알림 */}
            <S.CopyNotification $show={showCopyNotification}>
                ✓ 복사되었습니다
            </S.CopyNotification>

            {/* 에러 알림 */}
            <S.ErrorNotification $show={showErrorNotification}>
                ⚠️ 복사에 실패했습니다
            </S.ErrorNotification>
        </>
    );
};

export default FortuneResultPage;
