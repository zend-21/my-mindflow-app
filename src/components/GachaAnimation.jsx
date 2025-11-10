// src/components/GachaAnimation.jsx

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';

/**
 * 🎰 GSAP 기반 고퀄리티 가챠 머신 애니메이션
 *
 * 특징:
 * - 물리 엔진으로 자연스러운 움직임
 * - 부드러운 트윈 애니메이션
 * - 입체감 있는 3D 효과
 */

const Container = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    overflow: hidden;
`;

// 배경 반짝임 효과
const BackgroundSparkle = styled.div`
    position: absolute;
    width: 3px;
    height: 3px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
    opacity: 0;
`;

// 섬광 효과
const Flash = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
    opacity: 0;
    pointer-events: none;
`;

const GachaMachine = styled.div`
    position: relative;
    width: 300px;
    height: 450px;
`;

// 유리 돔 (3D 효과)
const GlassDome = styled.div`
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.4) 0%,
        rgba(255, 255, 255, 0.1) 100%
    );
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    border: 4px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    box-shadow:
        inset -10px -10px 30px rgba(255, 255, 255, 0.4),
        inset 10px 10px 30px rgba(0, 0, 0, 0.1),
        0 20px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
`;

// 반짝이는 하이라이트
const Highlight = styled.div`
    position: absolute;
    top: 20px;
    left: 30px;
    width: 50px;
    height: 50px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
    border-radius: 50%;
    filter: blur(10px);
`;

// 회전 캡슐 컨테이너
const CapsulesContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150px;
    height: 150px;
    transform: translate(-50%, -50%);
`;

// 캡슐
const Capsule = styled.div`
    position: absolute;
    width: 38px;
    height: 55px;
    border-radius: 22px;
    background: ${props => props.$gradient};
    box-shadow:
        inset 0 -22px 0 rgba(0, 0, 0, 0.25),
        inset 0 2px 0 rgba(255, 255, 255, 0.4),
        0 5px 15px rgba(0, 0, 0, 0.3);

    &::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 10px;
        width: 12px;
        height: 12px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }
`;

// 황금 캡슐 (떨어지는 것)
const GoldenCapsule = styled.div`
    position: absolute;
    width: 45px;
    height: 65px;
    border-radius: 25px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
    box-shadow:
        inset 0 -28px 0 rgba(139, 69, 19, 0.3),
        inset 0 3px 0 rgba(255, 255, 150, 0.6),
        0 10px 30px rgba(255, 215, 0, 0.5),
        0 0 40px rgba(255, 215, 0, 0.3);

    &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 12px;
        width: 15px;
        height: 15px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 20px;
        background: radial-gradient(ellipse, rgba(255, 215, 0, 0.4), transparent);
        border-radius: 50%;
        filter: blur(5px);
    }
`;

// 머신 몸통
const MachineBody = styled.div`
    position: absolute;
    top: 180px;
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    height: 200px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #dc4a5a 100%);
    border-radius: 20px;
    box-shadow:
        inset -5px -5px 20px rgba(0, 0, 0, 0.3),
        inset 5px 5px 20px rgba(255, 120, 120, 0.3),
        0 15px 50px rgba(0, 0, 0, 0.5);
    border: 5px solid rgba(255, 255, 255, 0.3);
`;

// 출구
const CapsuleExit = styled.div`
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: 85px;
    height: 55px;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7));
    border-radius: 10px 10px 45px 45px;
    border: 3px solid rgba(0, 0, 0, 0.4);
    box-shadow: inset 0 5px 15px rgba(0, 0, 0, 0.6);
`;

// 손잡이
const Handle = styled.div`
    position: absolute;
    right: -45px;
    top: 40px;
    width: 65px;
    height: 65px;
`;

const HandleStick = styled.div`
    position: absolute;
    top: 30px;
    right: 55px;
    width: 45px;
    height: 10px;
    background: linear-gradient(90deg, #999 0%, #666 100%);
    border-radius: 5px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
`;

const HandleKnob = styled.div`
    width: 55px;
    height: 55px;
    background: linear-gradient(135deg, #FFD700 0%, #FFED4E 50%, #FFC700 100%);
    border-radius: 50%;
    border: 5px solid rgba(139, 69, 19, 0.3);
    box-shadow:
        inset -3px -3px 10px rgba(139, 69, 19, 0.4),
        inset 3px 3px 10px rgba(255, 255, 150, 0.6),
        0 5px 20px rgba(0, 0, 0, 0.4);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 12px;
        left: 12px;
        width: 18px;
        height: 18px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
    }
`;

// 폭죽 조각
const ConfettiPiece = styled.div`
    position: absolute;
    width: 12px;
    height: 12px;
    background: ${props => props.$color};
    border-radius: ${props => props.$shape === 'circle' ? '50%' : '2px'};
    box-shadow: 0 0 10px ${props => props.$color};
`;

// 반짝임 효과
const Sparkle = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 10px white;
`;

// 메시지
const Message = styled.div`
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 20px;
    font-weight: 700;
    text-shadow:
        0 2px 4px rgba(0, 0, 0, 0.5),
        0 0 20px rgba(255, 255, 255, 0.3);
    white-space: nowrap;
    letter-spacing: 0.5px;
`;

const GachaAnimation = ({ onComplete }) => {
    const containerRef = useRef(null);
    const capsulesRef = useRef([]);
    const goldenCapsuleRef = useRef(null);
    const handleRef = useRef(null);
    const confettiRef = useRef([]);
    const sparklesRef = useRef([]);
    const messageRef = useRef(null);
    const backgroundSparklesRef = useRef([]);
    const flashRef = useRef(null);

    // 메시지 텍스트 상태 관리
    const [messageText, setMessageText] = useState('운세를 뽑는 중...');

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(onComplete, 500);
            }
        });

        // 1. 초기 페이드인 (0-0.5초)
        tl.fromTo(containerRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );

        // 배경 반짝임 효과 (계속 반복)
        backgroundSparklesRef.current.forEach((sparkle, i) => {
            tl.to(sparkle, {
                opacity: 1,
                scale: 1.5,
                duration: 0.3,
                repeat: -1,
                yoyo: true,
                ease: 'power2.inOut',
                delay: i * 0.1
            }, 0);
        });

        // 2. 캡슐들 회전 (0.5-3초)
        capsulesRef.current.forEach((capsule, i) => {
            tl.to(capsule, {
                rotation: 360 * 3,
                duration: 2.5,
                ease: 'linear',
                repeat: 0
            }, 0.5);
        });

        // 3. 메시지: "운세를 뽑는 중..."
        tl.fromTo(messageRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' },
            0.5
        );

        // 4. 손잡이 회전 (1.5-2.5초)
        tl.to(handleRef.current, {
            rotation: 360,
            duration: 1,
            ease: 'power2.inOut'
        }, 1.5);

        // 5. 황금 캡슐 떨어지기 (2.5-3.5초)
        tl.call(() => setMessageText('행운의 캡슐이 나왔어요!'), null, 2.5);

        // 황금 캡슐 등장
        tl.fromTo(goldenCapsuleRef.current,
            { top: '30%', left: '50%', x: '-50%', y: 0, scale: 0, opacity: 0, rotation: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: 'back.out(2)'
            },
            2.5
        );

        // 출구로 이동 (곡선 경로로 굴러가는 효과)
        tl.to(goldenCapsuleRef.current, {
            top: '52%',
            left: '50%',
            rotation: 180,
            duration: 0.6,
            ease: 'power1.in'
        }, 2.8);

        // 출구에서 통통 튀면서 나오기 (3번 튕김)
        // 첫 번째 큰 튕김
        tl.to(goldenCapsuleRef.current, {
            top: '68%',
            left: '50%',
            rotation: 270,
            duration: 0.3,
            ease: 'power2.in'
        }, 3.4);

        tl.to(goldenCapsuleRef.current, {
            top: '55%',
            rotation: 360,
            duration: 0.25,
            ease: 'power2.out'
        }, 3.7);

        // 두 번째 중간 튕김
        tl.to(goldenCapsuleRef.current, {
            top: '68%',
            rotation: 450,
            duration: 0.2,
            ease: 'power2.in'
        }, 3.95);

        tl.to(goldenCapsuleRef.current, {
            top: '62%',
            rotation: 540,
            duration: 0.15,
            ease: 'power2.out'
        }, 4.15);

        // 세 번째 작은 튕김
        tl.to(goldenCapsuleRef.current, {
            top: '68%',
            rotation: 600,
            duration: 0.15,
            ease: 'power2.in'
        }, 4.3);

        tl.to(goldenCapsuleRef.current, {
            top: '65%',
            rotation: 720,
            duration: 0.1,
            ease: 'power2.out'
        }, 4.45);

        // 7. 진동 효과 (4.5-4.8초)
        tl.to(goldenCapsuleRef.current, {
            x: '-50%',
            rotation: '+=10',
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            ease: 'none'
        }, 4.55);

        // 8. 메시지 변경
        tl.call(() => setMessageText('캡슐을 여는 중...'), null, 4.5);

        // 9. 섬광 효과
        tl.to(flashRef.current, {
            opacity: 0.6,
            duration: 0.1,
            ease: 'power2.out'
        }, 4.8);

        tl.to(flashRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        }, 4.9);

        // 10. 캡슐 폭발 + 강화된 폭죽 (4.8-5.5초)
        tl.to(goldenCapsuleRef.current, {
            scale: 2,
            opacity: 0,
            rotation: '+=360',
            duration: 0.2,
            ease: 'power2.out'
        }, 4.8);

        // 강화된 폭죽 효과 (더 많은 입자, 더 큰 범위)
        confettiRef.current.forEach((piece, i) => {
            const angle = (i / confettiRef.current.length) * Math.PI * 2;
            const distance = 200 + Math.random() * 150;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            tl.fromTo(piece,
                { x: 0, y: 0, scale: 0, opacity: 1 },
                {
                    x: tx,
                    y: ty,
                    scale: 1.5,
                    opacity: 0,
                    rotation: Math.random() * 1080 - 540,
                    duration: 1.2,
                    ease: 'power2.out'
                },
                4.8 + i * 0.015
            );
        });

        // 반짝임 효과 강화
        sparklesRef.current.forEach((sparkle, i) => {
            tl.fromTo(sparkle,
                { scale: 0, opacity: 0 },
                {
                    scale: 2,
                    opacity: 1,
                    duration: 0.15,
                    yoyo: true,
                    repeat: 3,
                    ease: 'power2.inOut'
                },
                4.8 + i * 0.08
            );
        });

        // 11. 최종 메시지
        tl.call(() => setMessageText('운세 결과 준비 완료!'), null, 5.2);

        tl.to(messageRef.current, {
            scale: 1.1,
            duration: 0.3,
            ease: 'back.out(2)'
        }, 5.2);

        // 12. 페이드 아웃 (5.8-6.3초)
        tl.to(containerRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
        }, 5.8);

        return () => {
            tl.kill();
        };
    }, [onComplete]);

    // 캡슐 데이터
    const capsules = [
        { x: 40, y: 15, gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
        { x: 75, y: 25, gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
        { x: 25, y: 55, gradient: 'linear-gradient(135deg, #F7B733 0%, #FC4A1A 100%)' },
        { x: 80, y: 65, gradient: 'linear-gradient(135deg, #A8E063 0%, #56AB2F 100%)' },
    ];

    // 폭죽 색상 (더 밝고 화려하게)
    const confettiColors = ['#FF6B6B', '#4ECDC4', '#F7B733', '#A8E063', '#FFD93D', '#FF6BCB', '#6B8EFF', '#FFE66D', '#FF6F91', '#00D9FF'];
    const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        shape: i % 3 === 0 ? 'circle' : 'square'
    }));

    // 반짝임 위치
    const sparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
    }));

    // 배경 반짝임 (계속 반짝이는 별들)
    const backgroundSparkles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
    }));

    return (
        <Container ref={containerRef}>
            {/* 배경 반짝임 */}
            {backgroundSparkles.map((sparkle, idx) => (
                <BackgroundSparkle
                    key={`bg-${sparkle.id}`}
                    ref={el => backgroundSparklesRef.current[idx] = el}
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`
                    }}
                />
            ))}

            {/* 섬광 효과 */}
            <Flash ref={flashRef} />

            <GachaMachine>
                {/* 유리 돔 */}
                <GlassDome>
                    <Highlight />
                    <CapsulesContainer>
                        {capsules.map((capsule, idx) => (
                            <Capsule
                                key={idx}
                                ref={el => capsulesRef.current[idx] = el}
                                $gradient={capsule.gradient}
                                style={{
                                    left: `${capsule.x}%`,
                                    top: `${capsule.y}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        ))}
                    </CapsulesContainer>
                </GlassDome>

                {/* 황금 캡슐 */}
                <GoldenCapsule ref={goldenCapsuleRef} />

                {/* 머신 몸통 */}
                <MachineBody>
                    <CapsuleExit />
                    <Handle ref={handleRef}>
                        <HandleStick />
                        <HandleKnob />
                    </Handle>
                </MachineBody>

                {/* 폭죽 */}
                {confettiPieces.map((piece, idx) => (
                    <ConfettiPiece
                        key={piece.id}
                        ref={el => confettiRef.current[idx] = el}
                        $color={piece.color}
                        $shape={piece.shape}
                        style={{
                            left: '50%',
                            top: '65%',
                            opacity: 0
                        }}
                    />
                ))}

                {/* 반짝임 */}
                {sparkles.map((sparkle, idx) => (
                    <Sparkle
                        key={sparkle.id}
                        ref={el => sparklesRef.current[idx] = el}
                        style={{
                            left: `${sparkle.x}%`,
                            top: `${sparkle.y}%`,
                            opacity: 0
                        }}
                    />
                ))}

                {/* 메시지 */}
                <Message ref={messageRef}>{messageText}</Message>
            </GachaMachine>
        </Container>
    );
};

export default GachaAnimation;
