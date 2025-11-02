// src/components/GachaAnimation.jsx

import { useState, useEffect } from 'react';
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
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    animation: ${rotate} 3s linear infinite;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
    }
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
    opacity: 0;
    animation: ${fadeInScale} 0.8s ease-out 0.5s forwards;
`;

const Message = styled.h1`
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 36px;
    }
`;

const SubMessage = styled.p`
    font-size: 16px;
    margin: 12px 0 0 0;
    opacity: 0.9;
    font-weight: 300;

    @media (min-width: 768px) {
        font-size: 18px;
    }
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

// 🎯 Main Component

const GachaAnimation = ({ onComplete }) => {
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setShowMessage(true), 800);
        const timer2 = setTimeout(() => {
            onComplete();
        }, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    return (
        <Overlay>
            <FloatingParticles>
                {Array.from({ length: 20 }, (_, i) => (
                    <Particle key={i} />
                ))}
            </FloatingParticles>

            <CenterContainer>
                <LoadingRings>
                    <Ring $index={0} />
                    <Ring $index={1} />
                    <Ring $index={2} />
                    <CenterOrb />
                </LoadingRings>

                {showMessage && (
                    <MessageContainer>
                        <Message>운세를 확인하는 중</Message>
                        <SubMessage>잠시만 기다려주세요</SubMessage>
                        <ProgressBar />
                    </MessageContainer>
                )}
            </CenterContainer>
        </Overlay>
    );
};

export default GachaAnimation;
