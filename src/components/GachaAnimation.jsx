// src/components/GachaAnimation.jsx

import { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';

// 🎨 Animations

const fadeInScale = keyframes`
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
`;

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const fadeOut = keyframes`
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
`;

const pulseRing = keyframes`
    0% {
        transform: scale(0.95);
        opacity: 0.7;
    }
    50% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(0.95);
        opacity: 0.7;
    }
`;

const rotate = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const shimmer = keyframes`
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
    }
`;

const shuffle = keyframes`
    0%, 100% {
        transform: translateX(0) rotate(0deg);
    }
    25% {
        transform: translateX(-30px) rotate(-15deg);
    }
    75% {
        transform: translateX(30px) rotate(15deg);
    }
`;

const cardReveal = keyframes`
    0% {
        opacity: 0;
        transform: translateY(50px) rotateY(180deg);
    }
    100% {
        opacity: 1;
        transform: translateY(0) rotateY(0deg);
    }
`;

const pulse = keyframes`
    0%, 100% {
        transform: scale(1);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.1);
        opacity: 1;
    }
`;

const floatUp = keyframes`
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: translateY(-50px);
    }
`;

const sparkle = keyframes`
    0%, 100% {
        opacity: 0;
        transform: scale(0) rotate(0deg);
    }
    50% {
        opacity: 1;
        transform: scale(1) rotate(180deg);
    }
`;

const cardFlip = keyframes`
    0% {
        transform: rotateY(0deg) scale(0.8);
        opacity: 0;
    }
    50% {
        transform: rotateY(90deg) scale(1);
        opacity: 1;
    }
    100% {
        transform: rotateY(0deg) scale(1);
        opacity: 1;
    }
`;

const firework = keyframes`
    0% {
        transform: translate(0, 0) scale(0);
        opacity: 1;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: translate(var(--tx), var(--ty)) scale(1);
        opacity: 0;
    }
`;

const glow = keyframes`
    0%, 100% {
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
                    0 0 40px rgba(255, 215, 0, 0.3),
                    0 0 60px rgba(255, 215, 0, 0.1);
    }
    50% {
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.8),
                    0 0 80px rgba(255, 215, 0, 0.5),
                    0 0 120px rgba(255, 215, 0, 0.3);
    }
`;

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

const CenterContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    animation: ${fadeInScale} 0.6s ease-out;
`;

const LoadingRings = styled.div`
    position: relative;
    width: 120px;
    height: 120px;
`;

const Ring = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.2);

    ${props => props.$index === 0 && css`
        width: 120px;
        height: 120px;
        animation: ${pulseRing} 2s ease-in-out infinite;
    `}

    ${props => props.$index === 1 && css`
        width: 90px;
        height: 90px;
        border-color: rgba(255, 255, 255, 0.3);
        animation: ${pulseRing} 2s ease-in-out infinite 0.3s;
    `}

    ${props => props.$index === 2 && css`
        width: 60px;
        height: 60px;
        border-color: rgba(255, 255, 255, 0.4);
        animation: ${pulseRing} 2s ease-in-out infinite 0.6s;
    `}
`;

const CenterOrb = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    animation: ${rotate} 3s linear infinite, ${glow} 2s ease-in-out infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
    }
`;

const TarotCard = styled.div`
    position: relative;
    z-index: 1;
    font-size: 40px;
    animation: ${cardFlip} 2s ease-in-out infinite;
    transition: all 0.3s ease-out;
`;

const FloatingParticles = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const Particle = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    opacity: 0;

    ${Array.from({ length: 20 }, (_, i) => {
        const x = Math.random() * 100;
        const delay = i * 0.2;
        return css`
            &:nth-child(${i + 1}) {
                left: ${x}%;
                bottom: 0;
                animation: ${floatUp} 3s ease-out ${delay}s infinite;
            }
        `;
    })}
`;

const MessageContainer = styled.div`
    text-align: center;
    color: white;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Message = styled.h1`
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.5px;
    animation: ${props => props.$isExiting ? css`${fadeOut} 0.5s ease-out forwards` : css`${fadeIn} 0.5s ease-out forwards`};

    @media (min-width: 768px) {
        font-size: 36px;
    }
`;

const SubMessage = styled.p`
    font-size: 16px;
    margin: 12px 0 0 0;
    opacity: 0.9;
    font-weight: 300;
    animation: ${props => props.$isExiting ? css`${fadeOut} 0.5s ease-out forwards` : css`${fadeIn} 0.5s ease-out 0.2s forwards`};

    @media (min-width: 768px) {
        font-size: 18px;
    }
`;

const Sparkles = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const Sparkle = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    background: white;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    animation: ${sparkle} 1.5s ease-in-out infinite;

    ${Array.from({ length: 30 }, (_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 1 + Math.random();
        return css`
            &:nth-child(${i + 1}) {
                left: ${x}%;
                top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            }
        `;
    })}
`;

const Fireworks = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.5s;
`;

const FireworkParticle = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${props => props.$color};
    --tx: ${props => props.$tx}px;
    --ty: ${props => props.$ty}px;
    animation: ${firework} 1s ease-out forwards;
    animation-delay: ${props => props.$delay}s;

    ${props => {
        const left = props.$x;
        const top = props.$y;
        return css`
            left: ${left}%;
            top: ${top}%;
        `;
    }}
`;

const ProgressBar = styled.div`
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 24px;

    &::after {
        content: '';
        display: block;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        animation: ${shimmer} 2s infinite;
    }
`;

// 타로 카드 덱 (셔플용)
const TarotDeck = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.5s;
`;

const ShuffleCard = styled.div`
    width: 50px;
    height: 75px;
    background: linear-gradient(135deg, #2d3561 0%, #1a1f3a 100%);
    border: 2px solid rgba(255, 215, 0, 0.5);
    border-radius: 8px;
    animation: ${shuffle} 0.8s ease-in-out infinite;
    animation-delay: ${props => props.$delay}s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
`;

// 타로 카드 스프레드 (3장)
const TarotSpread = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.5s;
`;

const SpreadCard = styled.div`
    width: 60px;
    height: 90px;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border: 2px solid #f0c040;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    animation: ${cardReveal} 0.6s ease-out forwards;
    animation-delay: ${props => props.$delay}s;
    opacity: 0;
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
`;

// 사주 기호들
const SajuSymbols = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 30px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.5s;
`;

const SajuSymbol = styled.div`
    font-size: 36px;
    animation: ${pulse} 1.2s ease-in-out infinite;
    animation-delay: ${props => props.$delay}s;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`;

// 역경 괘상
const IChingContainer = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.5s;
`;

const IChingSymbol = styled.div`
    font-size: 80px;
    animation: ${pulse} 1.5s ease-in-out infinite;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
`;

// 🎯 Main Component

const GachaAnimation = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);

    // 단계별 메시지 정의 (실제 점술 과정 반영)
    const steps = [
        {
            main: '타로 카드를 셔플합니다',
            sub: '카드가 당신의 에너지를 읽고 있습니다 🃏',
            icon: '🔮',
            type: 'tarot-shuffle'
        },
        {
            main: '과거·현재·미래 펼치는 중',
            sub: '3장의 카드가 당신의 이야기를 보여줍니다 ✨',
            icon: '🎴',
            type: 'tarot-spread'
        },
        {
            main: '사주팔자 계산 중',
            sub: '천간지지와 음양오행을 분석합니다 ☯️',
            icon: '📿',
            type: 'saju'
        },
        {
            main: '역경 괘상 해석 중',
            sub: '64괘 중 당신의 운명이 드러납니다 🌙',
            icon: '☰',
            type: 'iching'
        },
        {
            main: '최종 분석 완료',
            sub: '당신만의 운세가 준비되었습니다! 🎉',
            icon: '✨',
            type: 'complete'
        }
    ];

    useEffect(() => {
        const timers = [];

        // Step 1: 타로 셔플 - 800ms
        timers.push(setTimeout(() => {
            setCurrentStep(0);
        }, 800));

        // Step 2: 타로 스프레드 - 2000ms
        timers.push(setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsExiting(false);
                setCurrentStep(1);
            }, 500);
        }, 2000));

        // Step 3: 사주팔자 - 3400ms
        timers.push(setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsExiting(false);
                setCurrentStep(2);
            }, 500);
        }, 3400));

        // Step 4: 역경 괘상 - 4800ms
        timers.push(setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsExiting(false);
                setCurrentStep(3);
            }, 500);
        }, 4800));

        // Step 5: 최종 완료 - 6200ms (폭죽 시작)
        timers.push(setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsExiting(false);
                setCurrentStep(4);
                setShowFireworks(true);
            }, 500);
        }, 6200));

        // Complete: 7600ms
        timers.push(setTimeout(() => {
            onComplete();
        }, 7600));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [onComplete]);

    // 폭죽 파티클 생성 (useMemo로 최적화)
    const fireworkParticles = useMemo(() => {
        const fireworks = [];
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'];

        for (let i = 0; i < 5; i++) {
            const x = 20 + Math.random() * 60;
            const y = 20 + Math.random() * 60;

            for (let j = 0; j < 12; j++) {
                const angle = (j / 12) * Math.PI * 2;
                const distance = 50 + Math.random() * 30;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                const delay = i * 0.15 + Math.random() * 0.1;

                fireworks.push(
                    <FireworkParticle
                        key={`${i}-${j}`}
                        $x={x}
                        $y={y}
                        $tx={tx}
                        $ty={ty}
                        $color={colors[Math.floor(Math.random() * colors.length)]}
                        $delay={delay}
                    />
                );
            }
        }
        return fireworks;
    }, []); // 빈 의존성 배열로 한 번만 생성

    return (
        <Overlay>
            <FloatingParticles>
                {Array.from({ length: 20 }, (_, i) => (
                    <Particle key={i} />
                ))}
            </FloatingParticles>

            <Sparkles>
                {Array.from({ length: 30 }, (_, i) => (
                    <Sparkle key={i} />
                ))}
            </Sparkles>

            <Fireworks $show={showFireworks}>
                {fireworkParticles}
            </Fireworks>

            {/* 타로 카드 셔플 (Step 0) */}
            <TarotDeck $show={currentStep === 0}>
                <ShuffleCard $delay={0} />
                <ShuffleCard $delay={0.1} />
                <ShuffleCard $delay={0.2} />
                <ShuffleCard $delay={0.3} />
                <ShuffleCard $delay={0.4} />
            </TarotDeck>

            {/* 타로 카드 스프레드 3장 (Step 1) */}
            <TarotSpread $show={currentStep === 1}>
                <SpreadCard $delay={0}>🌙</SpreadCard>
                <SpreadCard $delay={0.2}>⭐</SpreadCard>
                <SpreadCard $delay={0.4}>☀️</SpreadCard>
            </TarotSpread>

            {/* 사주팔자 기호 (Step 2) */}
            <SajuSymbols $show={currentStep === 2}>
                <SajuSymbol $delay={0}>甲</SajuSymbol>
                <SajuSymbol $delay={0.15}>子</SajuSymbol>
                <SajuSymbol $delay={0.3}>☯️</SajuSymbol>
                <SajuSymbol $delay={0.45}>火</SajuSymbol>
            </SajuSymbols>

            {/* 역경 괘상 (Step 3) */}
            <IChingContainer $show={currentStep === 3}>
                <IChingSymbol>☰</IChingSymbol>
            </IChingContainer>

            <CenterContainer>
                <LoadingRings>
                    <Ring $index={0} />
                    <Ring $index={1} />
                    <Ring $index={2} />
                    <CenterOrb>
                        <TarotCard>
                            {currentStep >= 0 ? steps[currentStep].icon : '🔮'}
                        </TarotCard>
                    </CenterOrb>
                </LoadingRings>

                {currentStep >= 0 && (
                    <MessageContainer>
                        <Message $isExiting={isExiting}>
                            {steps[currentStep].main}
                        </Message>
                        <SubMessage $isExiting={isExiting}>
                            {steps[currentStep].sub}
                        </SubMessage>
                        <ProgressBar />
                    </MessageContainer>
                )}
            </CenterContainer>
        </Overlay>
    );
};

export default GachaAnimation;
