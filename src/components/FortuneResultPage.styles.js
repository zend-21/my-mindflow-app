// src/components/FortuneResultPage.styles.js

import styled, { keyframes } from 'styled-components';

// 🎨 Animations

export const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

export const slideUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const scaleIn = keyframes`
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

export const Overlay = styled.div`
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

export const Container = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ${scaleIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);

    @media (max-width: 768px) {
        max-height: 100vh;
        border-radius: 0;
    }
`;

export const Header = styled.div`
    padding: 17px 24px;
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    color: #e0e0e0;
    text-align: center;
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
    }
`;

export const Title = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.5px;

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

export const UserInfo = styled.div`
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

export const Content = styled.div`
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
        background: rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

export const CategoryContainer = styled.div`
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 2px solid ${props => props.$borderColor || 'rgba(255, 255, 255, 0.1)'};
    animation: ${slideUp} 0.6s ease-out backwards;
    animation-delay: ${props => props.$delay || '0s'};
    margin-bottom: 32px;

    @media (min-width: 768px) {
        padding: 40px 32px;
    }
`;

export const CategoryTitle = styled.h2`
    margin: 0 0 28px 0;
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$color || '#e0e0e0'};
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 3px solid ${props => props.$borderColor || 'rgba(255, 255, 255, 0.1)'};

    @media (min-width: 768px) {
        font-size: 28px;
    }
`;

export const Section = styled.div`
    animation: ${slideUp} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay || '0s'};
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

export const SectionTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 8px;

    @media (min-width: 768px) {
        font-size: 20px;
    }
`;

export const SectionContent = styled.div`
    background: transparent;
    border: 2px solid ${props => props.$borderColor || '#667eea'};
    border-radius: 16px;
    padding: 24px 20px;

    @media (min-width: 768px) {
        padding: 28px 24px;
    }
`;

export const Keyword = styled.span`
    display: inline-block;
    align-self: flex-start;
    background: ${props => props.$color || '#667eea'};
    color: #1a202c;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 16px;
    margin-bottom: 14px;

    @media (min-width: 768px) {
        font-size: 14px;
        padding: 7px 16px;
    }
`;

export const Text = styled.p`
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #d0d0d0;

    @media (min-width: 768px) {
        font-size: 16px;
        line-height: 1.8;
    }
`;

export const SajuInfoBox = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 165, 116, 0.3);
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

export const SajuInfoItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;

export const SajuInfoLabel = styled.span`
    font-size: 12px;
    color: #d4a574;
    font-weight: 500;
`;

export const SajuInfoValue = styled.span`
    font-size: 16px;
    color: #e0e0e0;
    font-weight: 700;

    @media (min-width: 768px) {
        font-size: 17px;
    }
`;

export const LuckyWrapper = styled.div`
    position: relative;
    padding-top: 20px;
`;

export const LuckyTabTitle = styled.div`
    position: absolute;
    top: 0;
    left: 20px;
    background: #d4a574;
    color: white;
    font-size: 15px;
    font-weight: 700;
    padding: 8px 20px;
    border-radius: 8px 8px 0 0;
    z-index: 1;

    @media (min-width: 768px) {
        font-size: 16px;
        padding: 10px 24px;
        left: 24px;
    }
`;

export const LuckyContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(212, 165, 116, 0.3);
    border-radius: 20px;
    padding: 32px 24px;
    padding-top: 44px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: relative;
    margin-top: 15px;

    @media (min-width: 768px) {
        padding-top: 48px;
    }
`;

export const LuckyIntroText = styled.p`
    margin: 0;
    color: #d4a574;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.6;

    @media (min-width: 768px) {
        font-size: 17px;
    }
`;

export const LuckyNumbersWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
`;

export const LuckyNumbers = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
`;

export const LuckyNumber = styled.div`
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

export const LuckyNumberCaption = styled.p`
    margin: 0;
    color: #d4a574;
    font-size: 13px;
    font-weight: 500;

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

export const LuckyDetailsBox = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px 24px;
    width: 100%;
    max-width: 500px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const LuckyDetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }
`;

export const LuckyLabel = styled.span`
    color: #b0b0b0;
    font-size: 14px;
    font-weight: 500;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

export const LuckyValue = styled.span`
    color: #e0e0e0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

export const FortuneWrapper = styled.div`
    position: relative;
    padding-top: 20px;
`;

export const FortuneTabTitle = styled.div`
    position: absolute;
    top: 0;
    left: 20px;
    background: ${props => props.$bgColor || '#667eea'};
    color: #1a202c;
    font-size: 15px;
    font-weight: 700;
    padding: 8px 20px;
    border-radius: 8px 8px 0 0;
    z-index: 1;

    @media (min-width: 768px) {
        font-size: 16px;
        padding: 10px 24px;
        left: 24px;
    }
`;

export const FortuneContainer = styled.div`
    display: flex;
    flex-direction: column;
    background: transparent;
    border: 2px solid ${props => props.$borderColor || '#667eea'};
    border-radius: 20px;
    padding: 24px 20px;
    padding-top: 18px;
    position: relative;
    margin-top: 15px;

    @media (min-width: 768px) {
        padding: 28px 24px;
        padding-top: 20px;
    }
`;

export const TarotContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-radius: 16px;
    padding: 28px 24px;
`;

export const TarotCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    font-size: 22px;
    font-weight: 600;
    padding: 20px 32px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    text-align: center;

    @media (min-width: 768px) {
        font-size: 24px;
        padding: 24px 40px;
    }
`;

export const TarotImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
`;

export const TarotImage = styled.img`
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

export const TarotDirection = styled.span`
    display: inline-block;
    color: white;
    font-size: 13px;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.15);
    padding: 4px 12px;
    border-radius: 12px;
    margin-top: 8px;
`;

export const TarotText = styled.p`
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

export const TarotNotice = styled.p`
    margin: -8px 0 24px 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
    line-height: 1.5;
    text-align: center;
    font-style: italic;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;

    @media (min-width: 768px) {
        font-size: 11px;
        margin: -8px 0 28px 0;
    }
`;

export const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    padding: 24px;
`;

export const Button = styled.button`
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

export const CopyNotification = styled.div`
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

export const ErrorNotification = styled.div`
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
