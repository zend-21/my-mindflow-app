// src/components/GachaAnimation.jsx

import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// 🎨 Keyframe Animations

// 태극 회전
const taeguRotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// 음양 입자 흐름
const yinYangFlow = keyframes`
    0% {
        transform: translateY(0) scale(1);
        opacity: 0;
    }
    50% {
        opacity: 0.6;
    }
    100% {
        transform: translateY(-100px) scale(1.5);
        opacity: 0;
    }
`;

// 오행 빛줄기
const wuxingGlow = keyframes`
    0%, 100% {
        opacity: 0.3;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.2);
    }
`;

// 한자 번짐 효과
const hanjaFade = keyframes`
    0% {
        opacity: 0;
        filter: blur(10px);
    }
    50% {
        opacity: 0.3;
        filter: blur(5px);
    }
    100% {
        opacity: 0;
        filter: blur(15px);
    }
`;

// 타로 카드 셔플
const cardShuffle = keyframes`
    0%, 100% {
        transform: translateX(0) rotateY(0deg);
    }
    25% {
        transform: translateX(-30px) rotateY(-15deg);
    }
    75% {
        transform: translateX(30px) rotateY(15deg);
    }
`;

// 차원 이동 효과
const dimensionShift = keyframes`
    0%, 100% {
        opacity: 0.5;
        transform: translateZ(0) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateZ(50px) scale(1.1);
    }
`;

// 별 가루
const stardust = keyframes`
    0% {
        transform: translateY(0) scale(0);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: translateY(-200px) scale(1);
        opacity: 0;
    }
`;

// 행성 궤도
const planetOrbit = keyframes`
    from {
        transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg);
    }
    to {
        transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg);
    }
`;

// 성운 흐름
const nebulaFlow = keyframes`
    0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
    }
    50% {
        transform: translate(20px, -20px) scale(1.2);
        opacity: 0.6;
    }
`;

// 혜성
const comet = keyframes`
    0% {
        transform: translate(-100%, 100%) rotate(-45deg);
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    90% {
        opacity: 1;
    }
    100% {
        transform: translate(200%, -200%) rotate(-45deg);
        opacity: 0;
    }
`;

// 에너지 응집
const energyConverge = keyframes`
    0% {
        transform: scale(3);
        opacity: 0;
    }
    100% {
        transform: scale(0);
        opacity: 1;
    }
`;

// 최종 폭발
const finalExplosion = keyframes`
    0% {
        transform: scale(0);
        opacity: 1;
    }
    50% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(5);
        opacity: 0;
    }
`;

// 텍스트 페이드인
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

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    overflow: hidden;
    transition: background 1s ease-in-out;

    ${props => props.$phase === 0 && css`
        background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0d0221 100%);
    `}

    ${props => props.$phase === 1 && css`
        background: linear-gradient(135deg, #1a0a2a 0%, #2a1a3a 50%, #1a1a2a 100%);
    `}

    ${props => props.$phase === 2 && css`
        background: linear-gradient(135deg, #0a0a2a 0%, #1a0a3a 50%, #0a1a2a 100%);
    `}

    ${props => props.$phase === 3 && css`
        background: #000000;
    `}
`;

// Phase 1: 사주 배경 요소들
const TaeguSymbol = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle,
        rgba(255, 255, 255, 0.8) 0%,
        rgba(0, 0, 0, 0.9) 50%,
        rgba(255, 255, 255, 0.8) 50%,
        rgba(0, 0, 0, 0.9) 100%
    );
    border-radius: 50%;
    animation: ${taeguRotate} 20s linear infinite;
    opacity: ${props => props.$visible ? 0.3 : 0};
    transition: opacity 1s;
    pointer-events: none;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 50%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 150px 150px 0 0;
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        top: 50%;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0 0 150px 150px;
    }
`;

const YinYangParticle = styled.div.attrs(props => ({
    style: {
        background: props.$isYin ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        left: `${props.$x}%`,
        animationDelay: `${props.$delay}s`,
        opacity: props.$visible ? 1 : 0
    }
}))`
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    bottom: 0;
    animation: ${yinYangFlow} ${props => props.$duration}s ease-out infinite;
    transition: opacity 1s;
    pointer-events: none;
`;

const WuxingRing = styled.div.attrs(props => ({
    style: {
        width: `${props.$size}px`,
        height: `${props.$size}px`,
        borderColor: props.$color,
        animationDelay: `${props.$delay}s`,
        opacity: props.$visible ? 1 : 0,
        boxShadow: `0 0 20px ${props.$color}`
    }
}))`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 3px solid;
    animation: ${wuxingGlow} ${props => props.$duration}s ease-in-out infinite;
    transition: opacity 1s;
    pointer-events: none;
`;

const HanjaText = styled.div.attrs(props => ({
    style: {
        left: `${props.$x}%`,
        top: `${props.$y}%`,
        animationDelay: `${props.$delay}s`,
        opacity: props.$visible ? 1 : 0
    }
}))`
    position: absolute;
    font-size: 60px;
    color: rgba(218, 165, 32, 0.3);
    font-family: serif;
    animation: ${hanjaFade} 4s ease-in-out infinite;
    transition: opacity 1s;
    pointer-events: none;
`;

// Phase 2: 타로 배경 요소들
const TarotCard = styled.div.attrs(props => ({
    style: {
        left: `${props.$x}%`,
        top: `${props.$y}%`,
        animationDelay: `${props.$delay}s`,
        opacity: props.$visible ? 1 : 0
    }
}))`
    position: absolute;
    width: 60px;
    height: 90px;
    background: linear-gradient(135deg, #2a1a4a 0%, #1a0a2a 100%);
    border: 2px solid rgba(218, 165, 32, 0.5);
    border-radius: 8px;
    animation: ${cardShuffle} ${props => props.$duration}s ease-in-out infinite;
    transition: opacity 1s;
    pointer-events: none;
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
`;

const MysticParticle = styled.div.attrs(props => ({
    style: {
        left: `${props.$x}%`,
        top: `${props.$y}%`,
        background: props.$color,
        animationDelay: `${props.$delay}s`,
        opacity: props.$visible ? 1 : 0,
        boxShadow: `0 0 8px ${props.$color}`
    }
}))`
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: ${stardust} ${props => props.$duration}s linear infinite;
    transition: opacity 1s;
    pointer-events: none;
`;

const DimensionWave = styled.div`
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(138, 43, 226, 0.8) 50%,
        transparent 100%
    );
    top: ${props => props.$y}%;
    animation: ${dimensionShift} 3s ease-in-out infinite;
    animation-delay: ${props => props.$delay}s;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 1s;
    pointer-events: none;
`;

// Phase 3: 별자리 배경 요소들
const Planet = styled.div`
    position: absolute;
    width: ${props => props.$size}px;
    height: ${props => props.$size}px;
    background: ${props => props.$gradient};
    border-radius: 50%;
    top: 50%;
    left: 50%;
    --orbit-radius: ${props => props.$orbit}px;
    animation: ${planetOrbit} ${props => props.$duration}s linear infinite;
    animation-delay: ${props => props.$delay}s;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 1s;
    pointer-events: none;
    box-shadow: 0 0 20px ${props => props.$glowColor};
`;

const Nebula = styled.div`
    position: absolute;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle,
        ${props => props.$color1} 0%,
        ${props => props.$color2} 50%,
        transparent 100%
    );
    border-radius: 50%;
    left: ${props => props.$x}%;
    top: ${props => props.$y}%;
    animation: ${nebulaFlow} ${props => props.$duration}s ease-in-out infinite;
    animation-delay: ${props => props.$delay}s;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 1s;
    pointer-events: none;
    filter: blur(30px);
`;

const Comet = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 10px white, 0 0 20px rgba(255, 255, 255, 0.5);
    animation: ${comet} ${props => props.$duration}s linear infinite;
    animation-delay: ${props => props.$delay}s;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 0.5s;
    pointer-events: none;

    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 100%;
        width: 80px;
        height: 2px;
        background: linear-gradient(90deg,
            rgba(255, 255, 255, 0.8) 0%,
            transparent 100%
        );
        transform: translateY(-50%);
    }
`;

const StarField = styled.div.attrs(props => ({
    style: {
        left: `${props.$x}%`,
        top: `${props.$y}%`,
        opacity: props.$visible ? props.$opacity : 0,
        boxShadow: `0 0 ${props.$glow}px rgba(255, 255, 255, 0.8)`
    }
}))`
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    transition: opacity 1s;
    pointer-events: none;
`;

// Final: 에너지 응집 및 폭발
const EnergyCore = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle,
        rgba(255, 255, 255, 1) 0%,
        rgba(138, 43, 226, 0.8) 30%,
        rgba(218, 165, 32, 0.6) 60%,
        transparent 100%
    );
    opacity: ${props => props.$show ? 1 : 0};
    animation: ${props => props.$show && css`${energyConverge} 1.5s ease-in-out forwards`};
    pointer-events: none;
    filter: blur(10px);
`;

const ExplosionRing = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.8);
    opacity: ${props => props.$show ? 1 : 0};
    animation: ${props => props.$show && css`${finalExplosion} 1s ease-out forwards`};
    animation-delay: ${props => props.$delay}s;
    pointer-events: none;
    box-shadow: 0 0 40px rgba(255, 255, 255, 1);
`;

// UI 요소들
const Container = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    z-index: 100;
    width: 80%;
    max-width: 500px;
`;

const ProgressBarContainer = styled.div`
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

const ProgressBarFill = styled.div`
    height: 100%;
    background: linear-gradient(90deg,
        #667eea 0%,
        #764ba2 50%,
        #f093fb 100%
    );
    border-radius: 4px;
    width: ${props => props.$progress}%;
    transition: width 0.3s ease-out;
    box-shadow: 0 0 20px rgba(118, 75, 162, 0.8);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 50px;
        height: 100%;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
        );
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;

const StatusText = styled.div`
    font-size: 14px;
    color: rgba(218, 165, 32, 1);
    text-align: center;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    letter-spacing: 1px;
    animation: ${fadeIn} 0.5s ease-out;
    text-shadow: 0 0 10px rgba(218, 165, 32, 0.8), 0 0 20px rgba(0, 0, 0, 1);
    font-weight: 500;
    min-height: 20px;
`;

const MessageList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100px;
    max-height: 100px;
    overflow: hidden;
    align-items: center;
`;

const Message = styled.div`
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    letter-spacing: 0.5px;
    line-height: 1.5;
    animation: ${fadeIn} 0.5s ease-out;
    text-shadow: 0 0 10px rgba(0, 0, 0, 1), 0 2px 4px rgba(0, 0, 0, 0.8);
    text-align: center;
`;

// 🎯 Main Component
const GachaAnimation = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [visibleMessages, setVisibleMessages] = useState([]);
    const [showExplosion, setShowExplosion] = useState(false);
    const [exploding, setExploding] = useState(false);

    const phases = [
        {
            title: '운명의 뿌리를 추적합니다...',
            messages: [
                '천간지지(天干地支) 좌표 설정 중...',
                '오행(五行) 에너지 흐름 감지 중...',
                '팔자(八字) 구조 해독 진행 중...',
                '육십갑자(六十甲子) 순환 분석 중...',
                '명리(命理) 통계 집계 완료...'
            ],
            progressRange: [0, 33]
        },
        {
            title: '카드가 당신의 운명을 읽습니다...',
            messages: [
                '우주의 덱(Cosmic Deck) 셔플 중...',
                '아르카나(Arcana) 에너지 정렬 중...',
                '시간의 스프레드(Spread) 전개 중...',
                '상징의 언어 번역 진행 중...',
                '내면의 진실 포착 완료...'
            ],
            progressRange: [33, 66]
        },
        {
            title: '별들이 당신의 이야기를 들려줍니다...',
            messages: [
                '천구(天球) 좌표 매핑 중...',
                '행성 트랜짓(Transit) 추적 중...',
                '에너지 하우스 분석 진행 중...',
                '천체 조화(Harmony) 측정 중...',
                '우주적 영향력 계산 완료...'
            ],
            progressRange: [66, 100]
        }
    ];

    useEffect(() => {
        const timers = [];
        let currentTime = 0;

        phases.forEach((phase, phaseIndex) => {
            timers.push(setTimeout(() => {
                setCurrentPhase(phaseIndex);
                setVisibleMessages([]);
                setStatusText(`${Math.floor(phase.progressRange[0])}%`);
            }, currentTime));

            let messageTime = currentTime;
            const [startProgress, endProgress] = phase.progressRange;
            const progressPerMessage = (endProgress - startProgress) / phase.messages.length;

            phase.messages.forEach((message, msgIndex) => {
                const randomDelay = 300 + Math.random() * 400;
                messageTime += randomDelay;

                timers.push(setTimeout(() => {
                    setVisibleMessages(prev => [...prev.slice(-2), message]);
                    const newProgress = startProgress + (progressPerMessage * (msgIndex + 1));
                    setProgress(newProgress);
                    setStatusText(`${Math.floor(newProgress)}%`);
                }, messageTime));
            });

            currentTime = messageTime + 300;
        });

        // 최종 집계
        currentTime += 500;
        timers.push(setTimeout(() => {
            setProgress(100);
            setStatusText('100%');
            setVisibleMessages(['모든 차원 데이터 동기화 중...']);
            setCurrentPhase(3);
        }, currentTime));

        currentTime += 400;
        timers.push(setTimeout(() => {
            setVisibleMessages(['종합 운세 보고서 완성...']);
        }, currentTime));

        currentTime += 400;
        timers.push(setTimeout(() => {
            setVisibleMessages(['당신의 진실, 지금 공개됩니다.']);
            setShowExplosion(true);
        }, currentTime));

        currentTime += 800;
        timers.push(setTimeout(() => {
            setExploding(true);
        }, currentTime));

        // 완료
        currentTime += 1500;
        timers.push(setTimeout(() => {
            onComplete();
        }, currentTime));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [onComplete]);

    // 오행 색상
    const wuxing = [
        { color: 'rgba(0, 255, 128, 0.6)', size: 350, duration: 3, delay: 0 },     // 木 - 청색
        { color: 'rgba(255, 69, 58, 0.6)', size: 320, duration: 3.5, delay: 0.6 }, // 火 - 적색
        { color: 'rgba(255, 204, 0, 0.6)', size: 380, duration: 4, delay: 1.2 },   // 土 - 황색
        { color: 'rgba(255, 255, 255, 0.6)', size: 340, duration: 3.2, delay: 1.8 }, // 金 - 백색
        { color: 'rgba(10, 132, 255, 0.6)', size: 360, duration: 3.8, delay: 2.4 }  // 水 - 흑색(청)
    ];

    // 한자 배열
    const hanja = ['天', '地', '陰', '陽', '五', '行', '命', '運'];

    return (
        <Overlay $phase={currentPhase}>
            {/* Phase 1: 사주 배경 */}
            <TaeguSymbol $visible={currentPhase === 0} />
            {Array.from({ length: 12 }, (_, i) => (
                <YinYangParticle
                    key={`yin-yang-${i}`}
                    $isYin={i % 2 === 0}
                    $x={10 + (i % 4) * 25}
                    $duration={3 + Math.random() * 2}
                    $delay={i * 0.3}
                    $visible={currentPhase === 0}
                />
            ))}
            {wuxing.map((wu, i) => (
                <WuxingRing
                    key={`wuxing-${i}`}
                    $size={wu.size}
                    $color={wu.color}
                    $duration={wu.duration}
                    $delay={wu.delay}
                    $visible={currentPhase === 0}
                />
            ))}
            {hanja.map((char, i) => (
                <HanjaText
                    key={`hanja-${i}`}
                    $x={15 + (i % 4) * 23}
                    $y={20 + Math.floor(i / 4) * 30}
                    $delay={i * 0.5}
                    $visible={currentPhase === 0}
                >
                    {char}
                </HanjaText>
            ))}

            {/* Phase 2: 타로 배경 */}
            {Array.from({ length: 8 }, (_, i) => (
                <TarotCard
                    key={`tarot-${i}`}
                    $x={15 + (i % 4) * 25}
                    $y={20 + Math.floor(i / 4) * 40}
                    $duration={2 + Math.random()}
                    $delay={i * 0.2}
                    $visible={currentPhase === 1}
                />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
                <DimensionWave
                    key={`wave-${i}`}
                    $y={20 + i * 15}
                    $delay={i * 0.3}
                    $visible={currentPhase === 1}
                />
            ))}
            {Array.from({ length: 30 }, (_, i) => {
                const colors = ['rgba(138, 43, 226, 0.8)', 'rgba(218, 165, 32, 0.8)', 'rgba(255, 255, 255, 0.8)'];
                return (
                    <MysticParticle
                        key={`mystic-${i}`}
                        $x={Math.random() * 100}
                        $y={Math.random() * 100}
                        $color={colors[i % colors.length]}
                        $duration={3 + Math.random() * 2}
                        $delay={i * 0.1}
                        $visible={currentPhase === 1}
                    />
                );
            })}

            {/* Phase 3: 별자리 배경 */}
            {Array.from({ length: 5 }, (_, i) => {
                const planets = [
                    { size: 20, gradient: 'radial-gradient(circle, #ff6b6b, #c92a2a)', glow: 'rgba(255, 107, 107, 0.8)', orbit: 80, duration: 10 },
                    { size: 25, gradient: 'radial-gradient(circle, #ffd43b, #fab005)', glow: 'rgba(255, 212, 59, 0.8)', orbit: 120, duration: 15 },
                    { size: 15, gradient: 'radial-gradient(circle, #4dabf7, #1c7ed6)', glow: 'rgba(77, 171, 247, 0.8)', orbit: 150, duration: 20 },
                    { size: 18, gradient: 'radial-gradient(circle, #ff8787, #fa5252)', glow: 'rgba(255, 135, 135, 0.8)', orbit: 180, duration: 25 },
                    { size: 30, gradient: 'radial-gradient(circle, #ffd8a8, #fd7e14)', glow: 'rgba(255, 216, 168, 0.8)', orbit: 220, duration: 30 }
                ];
                const planet = planets[i];
                return (
                    <Planet
                        key={`planet-${i}`}
                        $size={planet.size}
                        $gradient={planet.gradient}
                        $glowColor={planet.glow}
                        $orbit={planet.orbit}
                        $duration={planet.duration}
                        $delay={i * 2}
                        $visible={currentPhase === 2}
                    />
                );
            })}
            {Array.from({ length: 3 }, (_, i) => {
                const nebulas = [
                    { color1: 'rgba(138, 43, 226, 0.3)', color2: 'rgba(218, 165, 32, 0.2)', x: 20, y: 30, duration: 8 },
                    { color1: 'rgba(255, 107, 107, 0.3)', color2: 'rgba(77, 171, 247, 0.2)', x: 70, y: 60, duration: 10 },
                    { color1: 'rgba(77, 171, 247, 0.3)', color2: 'rgba(138, 43, 226, 0.2)', x: 40, y: 80, duration: 12 }
                ];
                const nebula = nebulas[i];
                return (
                    <Nebula
                        key={`nebula-${i}`}
                        $color1={nebula.color1}
                        $color2={nebula.color2}
                        $x={nebula.x}
                        $y={nebula.y}
                        $duration={nebula.duration}
                        $delay={i * 1.5}
                        $visible={currentPhase === 2}
                    />
                );
            })}
            {Array.from({ length: 5 }, (_, i) => (
                <Comet
                    key={`comet-${i}`}
                    $duration={4 + Math.random() * 2}
                    $delay={i * 1.5}
                    $visible={currentPhase === 2}
                />
            ))}
            {Array.from({ length: 100 }, (_, i) => (
                <StarField
                    key={`star-${i}`}
                    $x={Math.random() * 100}
                    $y={Math.random() * 100}
                    $opacity={0.3 + Math.random() * 0.7}
                    $glow={2 + Math.random() * 3}
                    $visible={currentPhase === 2}
                />
            ))}

            {/* Final: 에너지 응집 및 폭발 */}
            <EnergyCore $show={showExplosion} />
            {Array.from({ length: 5 }, (_, i) => (
                <ExplosionRing
                    key={`explosion-${i}`}
                    $show={exploding}
                    $delay={i * 0.1}
                />
            ))}

            {/* UI: 로딩바 및 메시지 (항상 하단 고정) */}
            <Container>
                <MessageList>
                    {visibleMessages.map((msg, i) => (
                        <Message key={`${i}-${msg}`}>{msg}</Message>
                    ))}
                </MessageList>
                <ProgressBarContainer>
                    <ProgressBarFill $progress={progress} />
                </ProgressBarContainer>
                <StatusText>{statusText}</StatusText>
            </Container>
        </Overlay>
    );
};

export default GachaAnimation;
