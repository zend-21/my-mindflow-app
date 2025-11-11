// src/components/AvatarSelector.jsx
// 아바타 선택 모달

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { avatarList, getRecommendedAvatar } from './avatars/AvatarIcons';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 11000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1a1d24 100%);
    border-radius: 20px;
    width: 90vw;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ModalTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 1;
    }
`;

const ModalBody = styled.div`
    padding: 20px;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const RecommendationBanner = styled.div`
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
    border: 1px solid rgba(240, 147, 251, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const RecommendationIcon = styled.div`
    font-size: 24px;
`;

const RecommendationText = styled.div`
    flex: 1;
    color: #ffffff;
    font-size: 14px;

    strong {
        font-weight: 600;
        color: #f093fb;
    }
`;

const SectionTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const AvatarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

const AvatarItem = styled.div`
    aspect-ratio: 1;
    border-radius: 12px;
    background: ${props => props.$isSelected
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3))'
        : 'rgba(255, 255, 255, 0.05)'
    };
    border: 2px solid ${props => props.$isSelected
        ? 'rgba(240, 147, 251, 0.8)'
        : props.$isRecommended
            ? 'rgba(255, 215, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.1)'
    };
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    position: relative;

    &:hover {
        transform: scale(1.05);
        background: ${props => props.$isSelected
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4))'
        : 'rgba(255, 255, 255, 0.1)'
    };
    }

    &:active {
        transform: scale(0.95);
    }
`;

const RecommendedBadge = styled.div`
    position: absolute;
    top: -6px;
    right: -6px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
`;

const AvatarIcon = styled.div`
    width: 100%;
    height: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: 100%;
        height: 100%;
        max-width: 60px;
        max-height: 60px;
    }
`;

const AvatarName = styled.div`
    font-size: 11px;
    color: ${props => props.$isSelected ? '#ffffff' : '#b0b0b0'};
    text-align: center;
    font-weight: ${props => props.$isSelected ? '600' : '400'};
`;

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatarId, birthYear, birthMonth, birthDay }) => {
    const [selectedId, setSelectedId] = useState(currentAvatarId || null);
    const [recommendedAvatar, setRecommendedAvatar] = useState(null);

    useEffect(() => {
        if (birthYear) {
            const recommended = getRecommendedAvatar(birthYear, birthMonth, birthDay);
            setRecommendedAvatar(recommended);
        }
    }, [birthYear, birthMonth, birthDay]);

    useEffect(() => {
        setSelectedId(currentAvatarId);
    }, [currentAvatarId]);

    const handleSelect = (avatarId) => {
        setSelectedId(avatarId);
        onSelect(avatarId);
        setTimeout(() => onClose(), 200);
    };

    if (!isOpen) return null;

    // 십이지신과 기타 동물 분리
    const zodiacAvatars = avatarList.filter(avatar => avatar.zodiacYear !== null);
    const otherAvatars = avatarList.filter(avatar => avatar.zodiacYear === null);

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>아바타 선택</ModalTitle>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </ModalHeader>
                <ModalBody>
                    {recommendedAvatar && (
                        <RecommendationBanner>
                            <RecommendationIcon>⭐</RecommendationIcon>
                            <RecommendationText>
                                <strong>{recommendedAvatar.name}</strong>이/가 당신의 띠에 어울려요!
                            </RecommendationText>
                        </RecommendationBanner>
                    )}

                    <SectionTitle>십이지신</SectionTitle>
                    <AvatarGrid>
                        {zodiacAvatars.map(avatar => {
                            const AvatarComponent = avatar.component;
                            const isRecommended = recommendedAvatar?.id === avatar.id;
                            const isSelected = selectedId === avatar.id;

                            return (
                                <AvatarItem
                                    key={avatar.id}
                                    $isSelected={isSelected}
                                    $isRecommended={isRecommended}
                                    onClick={() => handleSelect(avatar.id)}
                                >
                                    {isRecommended && <RecommendedBadge>✨</RecommendedBadge>}
                                    <AvatarIcon>
                                        <AvatarComponent />
                                    </AvatarIcon>
                                    <AvatarName $isSelected={isSelected}>{avatar.name}</AvatarName>
                                </AvatarItem>
                            );
                        })}
                    </AvatarGrid>

                    <SectionTitle>기타 동물</SectionTitle>
                    <AvatarGrid>
                        {otherAvatars.map(avatar => {
                            const AvatarComponent = avatar.component;
                            const isSelected = selectedId === avatar.id;

                            return (
                                <AvatarItem
                                    key={avatar.id}
                                    $isSelected={isSelected}
                                    onClick={() => handleSelect(avatar.id)}
                                >
                                    <AvatarIcon>
                                        <AvatarComponent />
                                    </AvatarIcon>
                                    <AvatarName $isSelected={isSelected}>{avatar.name}</AvatarName>
                                </AvatarItem>
                            );
                        })}
                    </AvatarGrid>
                </ModalBody>
            </ModalContainer>
        </Overlay>
    );
};

export default AvatarSelector;
