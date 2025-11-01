// src/components/GachaAnimation.jsx

import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// 🎨 Animations

const starFall = keyframes`
    0% {
        top: -100px;
        opacity: 0;
        transform: translateX(-50%) scale(0) rotate(0deg);
    }
    20% {
        opacity: 1;
    }
    100% {
        top: 50%;
        opacity: 1;
        transform: translateX(-50%) scale(1) rotate(720deg);
    }
`;

const starShine = keyframes`
    0%, 100% {
        filter: brightness(1) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
    }
    50% {
        filter: brightness(1.5) drop-shadow(0 0 40px rgba(255, 215, 0, 1));
    }
`;

const starBurst = keyframes`
    0% {
        opacity: 1;
        transform: translateX(-50%) scale(1);
    }
    100% {
        opacity: 0;
        transform: translateX(-50%) scale(3);
    }
`;

const sparkleAnimation = keyframes`
    0% {
        opacity: 0;
        transform: scale(0);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(0);
    }
`;

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translate(-50%, -40%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
`;

// 🎨 Styled Components

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

const Star = styled.div`
    position: absolute;
    left: 50%;
    width: 100px;
    height: 100px;
    color: #ffd700;
    font-size: 100px;
    text-align: center;
    line-height: 1;

    ${props => props.$phase === 'falling' && css`
        animation: ${starFall} 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    `}

    ${props => props.$phase === 'shining' && css`
        top: 50%;
        transform: translateX(-50%);
        animation: ${starShine} 1s ease-in-out infinite;
    `}

    ${props => props.$phase === 'bursting' && css`
        top: 50%;
        animation: ${starBurst} 0.8s ease-out forwards;
    `}

    display: ${props => props.$phase === 'complete' ? 'none' : 'block'};
`;

const SparkleContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400px;
    height: 400px;
    transform: translate(-50%, -50%);
    pointer-events: none;
`;

const Sparkle = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    background: radial-gradient(circle, #fff, #ffd700);
    border-radius: 50%;

    ${Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * 360;
        const distance = 80 + Math.random() * 100;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        const delay = i * 0.03;
        return css`
            &:nth-child(${i + 1}) {
                left: calc(50% + ${x}px);
                top: calc(50% + ${y}px);
                animation: ${sparkleAnimation} 1.2s ease-out ${delay}s forwards;
            }
        `;
    })}
`;

const MessageContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    z-index: 10;
    opacity: 0;
    width: 80%;
    max-width: 500px;

    ${props => props.$show && css`
        animation: ${fadeIn} 0.8s ease-out forwards;
    `}
`;

const Message = styled.h1`
    font-size: 48px;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const SubMessage = styled.p`
    font-size: 20px;
    margin: 16px 0 0 0;
    opacity: 0.9;
    color: #e0e0e0;
`;

// 🎯 Main Component

const GachaAnimation = ({ onComplete }) => {
    const [phase, setPhase] = useState('falling'); // falling → shining → bursting → complete
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setPhase('shining'), 1500);
        const timer2 = setTimeout(() => setPhase('bursting'), 3000);
        const timer3 = setTimeout(() => {
            setPhase('complete');
            setShowMessage(true);
        }, 3800);
        const timer4 = setTimeout(() => {
            onComplete();
        }, 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [onComplete]);

    return (
        <Overlay>
            <Star $phase={phase}>⭐</Star>

            {phase === 'bursting' && (
                <SparkleContainer>
                    {Array.from({ length: 30 }, (_, i) => (
                        <Sparkle key={i} />
                    ))}
                </SparkleContainer>
            )}

            <MessageContainer $show={showMessage}>
                <Message>✨ 운세를 확인하는 중...</Message>
                <SubMessage>당신만을 위한 특별한 메시지</SubMessage>
            </MessageContainer>
        </Overlay>
    );
};

export default GachaAnimation;
