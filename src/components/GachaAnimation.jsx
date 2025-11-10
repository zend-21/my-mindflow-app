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

// ✨ 메인 타이틀을 위한 느린 페이드 애니메이션 (투명도 0.4 ~ 1.0으로 강화)
const slowFade = keyframes`
    0% {
        opacity: 0.4; /* 투명도 강화 */
    }
    50% {
        opacity: 1; 
    }
    100% {
        opacity: 0.4; 
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

// ✨ 새로운 배경/중앙 애니메이션
const vortex = keyframes`
    0% {
        background-position: 0% 0%;
        transform: scale(1) rotate(0deg);
    }
    100% {
        background-position: 100% 100%;
        transform: scale(1.2) rotate(360deg);
    }
`;

const glyphFade = keyframes`
    0% {
        opacity: 0;
        transform: translate(0, 0) scale(0.8) rotate(0deg);
    }
    30% {
        opacity: 0.2;
    }
    100% {
        opacity: 0;
        transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(720deg);
    }
`;

const celestialTrail = keyframes`
    0% {
        opacity: 0;
        transform: translate(var(--sx), var(--sy)) rotate(var(--rot));
    }
    10% {
        opacity: 1;
    }
    60% {
        opacity: 0;
        transform: translate(var(--ex), var(--ey)) rotate(var(--rot));
    }
    100% {
        opacity: 0;
    }
`;

const corePulse = keyframes`
    0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
    }
    50% {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 0 60px rgba(170, 218, 255, 0.8);
    }
`;

const coreSwirl = keyframes`
    from {
        transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
        transform: translate(-50%, -50%) rotate(360deg);
    }
`;

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, #1a1a2e 0%, #0c0018 100%);
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

const BlackholeVortex = styled.div`
    position: absolute;
    width: 200%;
    height: 200%;
    background: repeating-radial-gradient(
        circle,
        rgba(255, 255, 255, 0.03) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 100px,
        transparent 120px
    );
    animation: ${vortex} 100s linear infinite;
    filter: blur(1px);
    top: -50%;
    left: -50%;
    z-index: 1;
    pointer-events: none;
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
    z-index: 100;
`;

// ✨ 분석 코어
const AnalysisCore = styled.div`
    position: relative;
    width: 120px;
    height: 120px;
    
    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle at center, rgba(170, 218, 255, 0.6) 0%, rgba(25, 25, 50, 0) 70%);
        animation: ${corePulse} 3s ease-in-out infinite;
    }
    
    &::after {
        content: '🌌';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(0deg);
        font-size: 60px;
        color: #FFD700;
        animation: ${coreSwirl} 5s linear infinite;
        text-shadow: 0 0 15px #FFD700;
        mix-blend-mode: screen;
    }
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

// 🌟 메인 타이틀: 느린 깜빡임 적용 (효과 강화)
const Message = styled.h1`
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.5px;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    
    /* 느린 펄스 효과 적용 및 속도 3s -> 2.5s로 단축 */
    animation: ${slowFade} 2.5s ease-in-out infinite;

    @media (min-width: 768px) {
        font-size: 36px;
    }
`;

// 🚀 서브 메시지: 빠른 전환 애니메이션 유지
const SubMessage = styled.p`
    font-size: 16px;
    margin: 12px 0 0 0;
    opacity: 0.9;
    font-weight: 300;
    /* 하위 메시지는 빠른 전환 애니메이션 유지 (0.3s) */
    animation: ${props => props.$isExiting ? css`${fadeOut} 0.3s ease-out forwards` : css`${fadeIn} 0.3s ease-out 0.1s forwards`};

    @media (min-width: 768px) {
        font-size: 18px;
    }
`;

const ProgressBarContainer = styled.div`
    width: 250px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 24px;
`;

const ProgressFiller = styled.div.attrs(props => ({
    style: {
        width: `${props.$progress}%`,
    }
}))`
    height: 100%;
    background: linear-gradient(90deg, #aa96da 0%, #ffd700 100%);
    transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); 
    position: relative;
    
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
        position: absolute;
        top: 0;
        left: 0;
    }
`;


// ✨ 동서양 점술 문양 효과
const FadingGlyph = styled.div.attrs(props => ({
    style: {
        fontSize: `${props.$size}px`,
        color: props.$color,
        animationDuration: `${props.$duration}s`,
        animationDelay: `${props.$delay}s`,
        top: `${props.$top}%`,
        left: `${props.$left}%`,
        '--tx': `${props.$tx}px`,
        '--ty': `${props.$ty}px`,
    }
}))`
    position: absolute;
    opacity: 0;
    pointer-events: none;
    animation: ${glyphFade} ease-in-out infinite;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    z-index: 5;
`;

// ✨ 천체 궤적 효과
const CelestialTrail = styled.div.attrs(props => ({
    style: {
        background: props.$color,
        width: `${props.$length}px`,
        height: '2px',
        animationDuration: `${props.$duration}s`,
        animationDelay: `${props.$delay}s`,
        '--sx': `${props.$sx}px`,
        '--sy': `${props.$sy}px`,
        '--ex': `${props.$ex}px`,
        '--ey': `${props.$ey}px`,
        '--rot': `${props.$rot}deg`,
    }
}))`
    position: absolute;
    opacity: 0;
    pointer-events: none;
    animation: ${celestialTrail} ease-out infinite;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    z-index: 3;
`;


// --- 기존 서브 애니메이션들 (재활용) ---

const SajuSymbols = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 30px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.3s; 
    z-index: 50;
`;

const SajuSymbol = styled.div.attrs(props => ({
    style: {
        animationDelay: `${props.$delay}s`,
    }
}))`
    font-size: 36px;
    animation: ${pulse} 1.2s ease-in-out infinite;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    color: #ffd700;
`;

const TarotDeck = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.3s; 
    z-index: 50;
`;

// 🃏 수정된 ShuffleCard (카드 뒷면 무늬 추가)
const ShuffleCard = styled.div.attrs(props => ({
    style: {
        animationDelay: `${props.$delay}s`,
    }
}))`
    width: 50px;
    height: 75px;
    border-radius: 6px;
    border: 1px solid #FFD700;
    position: relative;
    overflow: hidden;
    
    /* 신비로운 카드 뒷면 패턴 */
    background: #1a1f3a; 
    background-image: repeating-conic-gradient(
        from 0deg, 
        rgba(255, 215, 0, 0.1) 0%, 
        transparent 5%, 
        transparent 50%
    );
    background-size: 15px 15px; 
    
    animation: ${pulse} 0.8s ease-in-out infinite;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);

    /* 중앙 문양 (신비로운 눈) */
    &::before {
        content: '👁️'; 
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        color: #FFD700;
        opacity: 0.8;
        text-shadow: 0 0 5px #FFD700;
    }
`;

const StarSymbols = styled.div`
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    opacity: ${props => props.$show ? 1 : 0};
    transition: opacity 0.3s; 
    z-index: 50;
`;

const StarSymbol = styled.div.attrs(props => ({
    style: {
        animationDelay: `${props.$delay}s`,
    }
}))`
    font-size: 40px;
    animation: ${pulse} 5s linear infinite;
    text-shadow: 0 0 15px rgba(170, 218, 255, 0.8);
    color: #aadaff;
`;

const FloatingParticles = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
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
    z-index: 1000;
`;

const FireworkParticle = styled.div.attrs(props => ({
    style: {
        left: `${props.$x}%`,
        top: `${props.$y}%`,
        background: props.$color,
        animationDelay: `${props.$delay}s`,
        '--tx': `${props.$tx}px`,
        '--ty': `${props.$ty}px`,
    }
}))`
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: ${firework} 1s ease-out forwards;
`;


// 🎯 Main Component

const GachaAnimation = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentSubStepIndex, setCurrentSubStepIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);
    const [overallIndex, setOverallIndex] = useState(0); 
    const totalSteps = 22; // 6 (사주) + 6 (타로) + 6 (별자리) + 4 (최종) = 22
    const progress = Math.min(100, (overallIndex / totalSteps) * 100);
    
    // 단계별 메시지 정의 (단계 번호/진행률 텍스트 제거)
    const analysisStages = useMemo(() => ([
        {
            main: '사주 분석',
            icon: '☯️',
            sub: [
                '운명의 뿌리를 추적합니다...',
                '천간지지(天干地支) 좌표 설정 중...',
                '오행(五行) 에너지 흐름 감지 중...',
                '팔자(八字) 구조 해독 진행 중...',
                '육십갑자(六十甲子) 순환 분석 중...',
                '명리(命理) 통계 집계 완료...'
            ],
            type: 'saju'
        },
        {
            main: '타로 리딩',
            icon: '🃏',
            sub: [
                '카드가 당신의 운명을 읽습니다...',
                '우주의 덱(Cosmic Deck) 셔플 중...',
                '아르카나(Arcana) 에너지 정렬 중...',
                '시간의 스프레드(Spread) 전개 중...',
                '상징의 언어 번역 진행 중...',
                '내면의 진실 포착 완료...'
            ],
            type: 'tarot'
        },
        {
            main: '별자리 운세',
            icon: '✨',
            sub: [
                '별들이 당신의 이야기를 들려줍니다...',
                '천구(天球) 좌표 매핑 중...',
                '행성 트랜짓(Transit) 추적 중...',
                '에너지 하우스 분석 진행 중...',
                '천체 조화(Harmony) 측정 중...',
                '우주적 영향력 계산 완료...'
            ],
            type: 'star'
        },
        {
            main: '최종 집계',
            icon: '🎉',
            sub: [
                '운명의 문이 열립니다...',
                '모든 차원 데이터 동기화 중...',
                '종합 운세 보고서 완성...',
                '당신의 진실, 지금 공개됩니다.'
            ],
            type: 'complete'
        }
    ]), []);

    const currentStage = analysisStages[currentStep];

    useEffect(() => {
        const timers = [];
        let cumulativeDelay = 0;
        let globalIndex = 0;
        const fadeDuration = 300; // 애니메이션 속도 단축 (0.5s -> 0.3s)

        const allSubSteps = analysisStages.flatMap((stage, stageIndex) => 
            stage.sub.map((subMessage, subIndex) => ({
                stageIndex,
                subIndex,
                isFinalStep: stageIndex === analysisStages.length - 1 && subIndex === stage.sub.length - 1,
            }))
        );

        allSubSteps.forEach((step, index) => {
            // 랜덤 딜레이 설정 (50ms ~ 300ms로 단축)
            const delay = 50 + Math.random() * 250; 

            // 상태 업데이트 스케줄링
            timers.push(setTimeout(() => {
                // 하위 메시지 페이드 아웃 처리
                setIsExiting(true);
                
                // 페이드 아웃 후 상태 업데이트 및 페이드 인 시작
                timers.push(setTimeout(() => {
                    setIsExiting(false);
                    // 메인 타이틀은 단계가 변경될 때만 바뀜
                    setCurrentStep(step.stageIndex);
                    // 하위 메시지는 매번 바뀜
                    setCurrentSubStepIndex(step.subIndex);
                    setOverallIndex(globalIndex + 1); // 전체 진행 인덱스 업데이트

                    // 최종 완료 단계에서 폭죽 시작
                    if (step.isFinalStep) {
                        setShowFireworks(true);
                    }

                }, fadeDuration)); // 단축된 페이드 시간 적용

                globalIndex++;

            }, cumulativeDelay));

            // 누적 딜레이 업데이트 (단축된 딜레이와 페이드 시간 적용)
            cumulativeDelay += delay + fadeDuration;

            // 최종 완료 후 onComplete 호출
            if (index === allSubSteps.length - 1) {
                timers.push(setTimeout(() => {
                    onComplete();
                }, cumulativeDelay + 1000)); // 최종 문구 표시 후 1초 대기
            }
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [onComplete, analysisStages]);

    // 폭죽 파티클 생성
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
    }, []);

    // Fading Glyphs (점술 문양) 생성
    const fadingGlyphs = useMemo(() => {
        const glyphs = [];
        const symbols = ['🎴', '🔮', '☯️', '☰', '☱', '☴', '♈', '♎', '★', '◇', '◎'];
        const colors = ['#FFFFFF', '#FFD700', '#AADAFF'];

        for (let i = 0; i < 20; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const size = 15 + Math.random() * 25;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = 5 + Math.random() * 5;
            const delay = Math.random() * 10;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const tx = (Math.random() - 0.5) * 100;
            const ty = (Math.random() - 0.5) * 100;

            glyphs.push(
                <FadingGlyph
                    key={`glyph-${i}`}
                    $size={size}
                    $color={color}
                    $duration={duration}
                    $delay={delay}
                    $top={top}
                    $left={left}
                    $tx={tx}
                    $ty={ty}
                >
                    {symbol}
                </FadingGlyph>
            );
        }
        return glyphs;
    }, []);

    // Celestial Trails (천체 궤적) 생성
    const celestialTrails = useMemo(() => {
        const trails = [];
        const colors = ['rgba(255, 255, 255, 0.8)', 'rgba(170, 218, 255, 0.9)'];
        
        for (let i = 0; i < 15; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const length = 50 + Math.random() * 100;
            const duration = 2 + Math.random() * 3;
            const delay = Math.random() * 5;
            const startX = -100 + Math.random() * 1200;
            const startY = -100 + Math.random() * 1200;
            const angle = Math.random() * 360;
            const distance = 1000;
            const endX = startX + Math.cos(angle * Math.PI / 180) * distance;
            const endY = startY + Math.sin(angle * Math.PI / 180) * distance;

            trails.push(
                <CelestialTrail
                    key={`trail-${i}`}
                    $color={color}
                    $length={length}
                    $duration={duration}
                    $delay={delay}
                    $sx={startX}
                    $sy={startY}
                    $ex={endX}
                    $ey={endY}
                    $rot={angle}
                />
            );
        }
        return trails;
    }, []);

    const currentSubMessage = currentStage ? currentStage.sub[currentSubStepIndex] : '';
    const currentMainMessage = currentStage ? currentStage.main : '';


    return (
        <Overlay>
            {/* 배경 애니메이션 */}
            <BlackholeVortex />
            <FloatingParticles>
                {Array.from({ length: 20 }, (_, i) => (
                    <Particle key={i} />
                ))}
            </FloatingParticles>
            {fadingGlyphs}
            {celestialTrails}
            <Sparkles>
                {Array.from({ length: 30 }, (_, i) => (
                    <Sparkle key={i} />
                ))}
            </Sparkles>

            <Fireworks $show={showFireworks}>
                {fireworkParticles}
            </Fireworks>

            {/* 사주팔자 기호 (Step 0) */}
            <SajuSymbols $show={currentStep === 0}>
                <SajuSymbol $delay={0}>甲</SajuSymbol>
                <SajuSymbol $delay={0.15}>子</SajuSymbol>
                <SajuSymbol $delay={0.3}>木</SajuSymbol>
                <SajuSymbol $delay={0.45}>火</SajuSymbol>
            </SajuSymbols>

            {/* 타로 카드 셔플 (Step 1) */}
            <TarotDeck $show={currentStep === 1}>
                <ShuffleCard $delay={0} />
                <ShuffleCard $delay={0.1} />
                <ShuffleCard $delay={0.2} />
                <ShuffleCard $delay={0.3} />
                <ShuffleCard $delay={0.4} />
            </TarotDeck>

            {/* 별자리 심볼 (Step 2) */}
            <StarSymbols $show={currentStep === 2}>
                <StarSymbol $delay={0}>♈</StarSymbol>
                <StarSymbol $delay={0.15}>♌</StarSymbol>
                <StarSymbol $delay={0.3}>♎</StarSymbol>
            </StarSymbols>


            <CenterContainer>
                {/* 중앙 분석 코어 */}
                <AnalysisCore />

                {currentStage && (
                    <MessageContainer>
                        {/* 메인 타이틀은 느린 깜빡임 효과로 진행 중임을 표시 */}
                        <Message>
                            {currentMainMessage}
                        </Message>
                        {/* 서브 메시지는 전환 시 빠른 페이드 인/아웃으로 진행 속도를 표현 */}
                        <SubMessage $isExiting={isExiting}>
                            {currentSubMessage}
                        </SubMessage>
                        {/* 로딩 바에 실제 진행률 적용 */}
                        <ProgressBarContainer>
                            <ProgressFiller $progress={progress} />
                        </ProgressBarContainer>
                    </MessageContainer>
                )}
            </CenterContainer>
        </Overlay>
    );
};

export default GachaAnimation;