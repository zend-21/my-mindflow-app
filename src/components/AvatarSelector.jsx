// src/components/AvatarSelector.jsx
// 아바타 선택 모달

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { avatarList, getRecommendedAvatar } from './avatars/AvatarIcons';
import { getUserProfile } from '../utils/fortuneLogic';

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
    scroll-behavior: smooth;

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

const PreviewSection = styled.div`
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
`;

const PreviewTitle = styled.h4`
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0;
`;

const PreviewContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const PreviewAvatarWrapper = styled.div`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: ${props => props.$bgColor || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'};
    border: 2px solid rgba(240, 147, 251, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;

    svg {
        width: 100%;
        height: 100%;
    }
`;

const PreviewPlaceholder = styled.div`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4a4d55 0%, #35383f 100%);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
    font-size: 14px;
    text-align: center;
    padding: 10px;
    line-height: 1.3;
`;

const ApplyButton = styled.button`
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(240, 147, 251, 0.6);
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }
`;

const BackgroundColorSection = styled.div`
    margin-bottom: 20px;
`;

const BackgroundColorTitle = styled.h4`
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0 0 12px 0;
`;

const ColorPalette = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
`;

const ColorOption = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${props => props.$color};
    cursor: pointer;
    transition: all 0.2s ease;
    border: 3px solid ${props => props.$isSelected ? '#f093fb' : 'transparent'};
    box-shadow: ${props => props.$isSelected
        ? '0 0 0 2px rgba(240, 147, 251, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.2)'
    };
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    &:active {
        transform: scale(0.95);
    }

    ${props => props.$isSelected && !props.$isCustom && `
        &::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
    `}
`;

const ColorPickerInput = styled.input`
    width: 100%;
    height: 100%;
    border: none;
    cursor: pointer;
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
`;

const CustomColorIcon = styled.div`
    font-size: 24px;
    pointer-events: none;
`;

const CustomColorModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 11001;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: ${fadeIn} 0.2s ease-out;
`;

const CustomColorPanel = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1a1d24 100%);
    border-radius: 16px;
    padding: 24px;
    width: 90vw;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CustomColorTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-align: center;
`;

const HexInputWrapper = styled.div`
    margin-bottom: 20px;
`;

const HexInputLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

const HexInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    background: #333842;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #ffffff;
    font-size: 16px;
    font-family: monospace;
    text-transform: uppercase;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #666;
    }
`;

const PresetColorsWrapper = styled.div`
    margin-bottom: 20px;
`;

const PresetColorsLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

const PresetColorsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
`;

const PresetColorButton = styled.button`
    aspect-ratio: 1;
    border-radius: 8px;
    border: 2px solid ${props => props.$isSelected ? 'rgba(240, 147, 251, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
    background: ${props => props.$color};
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;

    &:hover {
        transform: scale(1.1);
        border-color: rgba(240, 147, 251, 0.6);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const ColorPickerWrapper = styled.div`
    margin-bottom: 20px;
`;

const ColorPickerLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

const NativeColorPicker = styled.input`
    width: 100%;
    height: 50px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    background: transparent;
`;

const CustomColorActions = styled.div`
    display: flex;
    gap: 12px;
`;

const CustomColorButton = styled.button`
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &.confirm {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8));
        color: #ffffff;

        &:hover {
            background: linear-gradient(135deg, rgba(240, 147, 251, 1), rgba(245, 87, 108, 1));
        }
    }

    &.cancel {
        background: rgba(255, 255, 255, 0.1);
        color: #d0d0d0;

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }
    }

    &:active {
        transform: scale(0.98);
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
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
    z-index: 1;
`;

const SelectedBadge = styled.div`
    position: absolute;
    top: -8px;
    left: -8px;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 10px rgba(76, 175, 80, 0.5);
    z-index: 1;
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

const BACKGROUND_COLORS = [
    // 상단: 그라데이션 6개
    { id: 'none', name: '없음', color: 'transparent' },
    { id: 'lavender', name: '라벤더', color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
    { id: 'peach', name: '피치', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'mint', name: '민트', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'sunset', name: '석양', color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
    { id: 'ocean', name: '오션', color: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    // 하단: 비비드한 단색 5개 + 사용자 정의 1개
    { id: 'pink', name: '핑크', color: '#FF69B4' },
    { id: 'blue', name: '블루', color: '#4169E1' },
    { id: 'yellow', name: '옐로우', color: '#FFD700' },
    { id: 'green', name: '그린', color: '#32CD32' },
    { id: 'purple', name: '퍼플', color: '#9370DB' },
    { id: 'custom', name: '사용자정의', color: 'custom' },
];

// 프리셋 컬러 팔레트 (더 많은 선택지 제공)
const PRESET_COLORS = [
    '#FF1493', // Deep Pink
    '#FF69B4', // Hot Pink
    '#FF6B9D', // Light Pink
    '#FFB6C1', // Pastel Pink
    '#FFC0CB', // Pink
    '#FFE4E1', // Misty Rose

    '#FF4500', // Orange Red
    '#FF6347', // Tomato
    '#FF7F50', // Coral
    '#FFA500', // Orange
    '#FFD700', // Gold
    '#FFFF00', // Yellow

    '#00FF00', // Lime
    '#32CD32', // Lime Green
    '#00FA9A', // Medium Spring Green
    '#00CED1', // Dark Turquoise
    '#48D1CC', // Medium Turquoise
    '#40E0D0', // Turquoise

    '#00BFFF', // Deep Sky Blue
    '#1E90FF', // Dodger Blue
    '#4169E1', // Royal Blue
    '#0000FF', // Blue
    '#8A2BE2', // Blue Violet
    '#9370DB', // Medium Purple

    '#DA70D6', // Orchid
    '#EE82EE', // Violet
    '#DDA0DD', // Plum
    '#BA55D3', // Medium Orchid
    '#9932CC', // Dark Orchid
    '#8B008B', // Dark Magenta

    '#DC143C', // Crimson
    '#C71585', // Medium Violet Red
    '#DB7093', // Pale Violet Red
    '#F08080', // Light Coral
    '#CD5C5C', // Indian Red
    '#A52A2A', // Brown
];

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatarId, birthYear, birthMonth, birthDay }) => {
    const [selectedId, setSelectedId] = useState(currentAvatarId || null);
    const [recommendedZodiacAvatar, setRecommendedZodiacAvatar] = useState(null);
    const [recommendedSignAvatar, setRecommendedSignAvatar] = useState(null);
    const [userName, setUserName] = useState('');
    const [selectedBgColor, setSelectedBgColor] = useState(localStorage.getItem('avatarBgColor') || 'none');
    const [customColor, setCustomColor] = useState(localStorage.getItem('avatarCustomColor') || '#FF1493');
    const [showCustomColorModal, setShowCustomColorModal] = useState(false);
    const [tempCustomColor, setTempCustomColor] = useState('#FF1493');
    const [hexInputValue, setHexInputValue] = useState('');
    const scrollRef = React.useRef(null);

    useEffect(() => {
        // 운세 프로필에서 띠와 별자리 가져오기
        const fortuneProfile = getUserProfile();
        console.log('🔍 운세 프로필:', fortuneProfile);

        if (fortuneProfile) {
            // 사용자 이름 저장
            setUserName(fortuneProfile.name || '');

            // 띠 추천 (fortuneProfile.zodiacAnimal은 한글 이름: "쥐", "소" 등)
            if (fortuneProfile.zodiacAnimal) {
                const zodiacAvatar = avatarList.find(avatar => avatar.name === fortuneProfile.zodiacAnimal);
                console.log('🐉 띠 추천:', zodiacAvatar);
                setRecommendedZodiacAvatar(zodiacAvatar);
            }

            // 별자리 추천 (fortuneProfile.zodiacSign은 한글 이름: "양자리", "황소자리" 등)
            if (fortuneProfile.zodiacSign) {
                const signAvatar = avatarList.find(avatar => avatar.name === fortuneProfile.zodiacSign);
                console.log('⭐ 별자리 추천:', signAvatar);
                setRecommendedSignAvatar(signAvatar);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedId(currentAvatarId);
    }, [currentAvatarId]);

    useEffect(() => {
        setSelectedBgColor(localStorage.getItem('avatarBgColor') || 'none');
        setCustomColor(localStorage.getItem('avatarCustomColor') || '#FF1493');
    }, [isOpen]);

    const handleSelect = (avatarId) => {
        setSelectedId(avatarId);
        // 미리보기 섹션으로 스크롤
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const handleBgColorSelect = (colorId) => {
        setSelectedBgColor(colorId);
        localStorage.setItem('avatarBgColor', colorId);
        // 배경색 변경 이벤트 발생
        window.dispatchEvent(new CustomEvent('avatarBgColorChanged', { detail: colorId }));
    };

    const handleCustomColorClick = () => {
        // 현재 customColor를 임시 색상으로 설정
        setTempCustomColor(customColor);
        setHexInputValue(customColor);
        setShowCustomColorModal(true);
    };

    const handlePresetColorSelect = (color) => {
        setTempCustomColor(color);
        setHexInputValue(color);
    };

    const handleNativeColorChange = (e) => {
        const newColor = e.target.value;
        setTempCustomColor(newColor);
        setHexInputValue(newColor);
    };

    const handleHexInputChange = (e) => {
        let value = e.target.value.trim().toUpperCase();

        // '#' 자동 추가
        if (!value.startsWith('#')) {
            value = '#' + value;
        }

        setHexInputValue(value);

        // 유효한 hex 색상인지 확인 (#RGB 또는 #RRGGBB 형식)
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(value)) {
            setTempCustomColor(value);
        }
    };

    const handleCustomColorConfirm = () => {
        // 유효한 hex 색상인지 확인
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(tempCustomColor)) {
            setCustomColor(tempCustomColor);
            localStorage.setItem('avatarCustomColor', tempCustomColor);
            setSelectedBgColor('custom');
            localStorage.setItem('avatarBgColor', 'custom');
            // 배경색 변경 이벤트 발생
            window.dispatchEvent(new CustomEvent('avatarBgColorChanged', { detail: 'custom' }));
            setShowCustomColorModal(false);
        } else {
            alert('유효한 색상 코드를 입력해주세요. (예: #FF1493)');
        }
    };

    const handleCustomColorCancel = () => {
        setShowCustomColorModal(false);
    };

    const handleApply = () => {
        if (selectedId) {
            // 아바타 선택 저장
            localStorage.setItem('selectedAvatarId', selectedId);
            localStorage.setItem('profileImageType', 'avatar');

            // 아바타 변경 이벤트 발생 (Header, SideMenu 업데이트용)
            window.dispatchEvent(new CustomEvent('avatarChanged', { detail: selectedId }));

            onSelect(selectedId);
            setTimeout(() => onClose(), 200);
        }
    };

    if (!isOpen) return null;

    // 십이지신, 별자리, 기타 동물 분리
    const zodiacAvatars = avatarList.filter(avatar => avatar.zodiacYear);
    const zodiacSignAvatars = avatarList.filter(avatar => avatar.zodiacSign);
    const otherAvatars = avatarList.filter(avatar => !avatar.zodiacYear && !avatar.zodiacSign);

    // 현재 선택된 아바타 렌더링 함수
    const renderPreviewAvatar = () => {
        if (!selectedId) return null;
        const avatar = avatarList.find(a => a.id === selectedId);
        if (!avatar) return null;
        const AvatarComponent = avatar.component;
        return <AvatarComponent />;
    };

    // 선택된 배경색 가져오기
    const getSelectedBgColor = () => {
        if (selectedBgColor === 'custom') {
            return customColor;
        }
        const colorObj = BACKGROUND_COLORS.find(c => c.id === selectedBgColor);
        return colorObj?.color || 'transparent';
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>아바타 선택</ModalTitle>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </ModalHeader>
                <ModalBody ref={scrollRef}>
                    {(recommendedZodiacAvatar || recommendedSignAvatar) && (
                        <RecommendationBanner>
                            <RecommendationIcon>⭐</RecommendationIcon>
                            <RecommendationText>
                                {recommendedZodiacAvatar && recommendedSignAvatar ? (
                                    <>
                                        <strong>{userName}</strong>님은 <strong>{recommendedZodiacAvatar.name}</strong>(이)나 <strong>{recommendedSignAvatar.name}</strong>가 어울려요!
                                    </>
                                ) : recommendedZodiacAvatar ? (
                                    <>
                                        <strong>{userName}</strong>님은 <strong>{recommendedZodiacAvatar.name}</strong>이/가 어울려요!
                                    </>
                                ) : (
                                    <>
                                        <strong>{userName}</strong>님은 <strong>{recommendedSignAvatar.name}</strong>이/가 어울려요!
                                    </>
                                )}
                            </RecommendationText>
                        </RecommendationBanner>
                    )}

                    {/* 미리보기 섹션 */}
                    <PreviewSection>
                        <PreviewTitle>미리보기</PreviewTitle>
                        <PreviewContent>
                            {selectedId ? (
                                <PreviewAvatarWrapper $bgColor={getSelectedBgColor()}>
                                    {renderPreviewAvatar()}
                                </PreviewAvatarWrapper>
                            ) : (
                                <PreviewPlaceholder>
                                    아바타를<br />선택해주세요
                                </PreviewPlaceholder>
                            )}
                        </PreviewContent>
                        <ApplyButton onClick={handleApply} disabled={!selectedId}>
                            적용
                        </ApplyButton>
                    </PreviewSection>

                    <BackgroundColorSection>
                        <BackgroundColorTitle>아바타 배경색</BackgroundColorTitle>
                        <ColorPalette>
                            {BACKGROUND_COLORS.map(color => (
                                <ColorOption
                                    key={color.id}
                                    $color={color.id === 'custom' ? customColor : color.color}
                                    $isSelected={selectedBgColor === color.id}
                                    $isCustom={color.id === 'custom'}
                                    onClick={() => color.id === 'custom' ? handleCustomColorClick() : handleBgColorSelect(color.id)}
                                    title={color.name}
                                >
                                    {color.id === 'custom' && (
                                        <CustomColorIcon>🎨</CustomColorIcon>
                                    )}
                                </ColorOption>
                            ))}
                        </ColorPalette>
                    </BackgroundColorSection>

                    <SectionTitle>십이지신</SectionTitle>
                    <AvatarGrid>
                        {zodiacAvatars.map(avatar => {
                            const AvatarComponent = avatar.component;
                            const isRecommended = recommendedZodiacAvatar?.id === avatar.id;
                            const isSelected = selectedId === avatar.id;

                            return (
                                <AvatarItem
                                    key={avatar.id}
                                    $isSelected={isSelected}
                                    $isRecommended={isRecommended}
                                    onClick={() => handleSelect(avatar.id)}
                                >
                                    {isSelected && <SelectedBadge>✓</SelectedBadge>}
                                    {isRecommended && <RecommendedBadge>추천</RecommendedBadge>}
                                    <AvatarIcon>
                                        <AvatarComponent />
                                    </AvatarIcon>
                                    <AvatarName $isSelected={isSelected}>{avatar.name}</AvatarName>
                                </AvatarItem>
                            );
                        })}
                    </AvatarGrid>

                    <SectionTitle>별자리</SectionTitle>
                    <AvatarGrid>
                        {zodiacSignAvatars.map(avatar => {
                            const AvatarComponent = avatar.component;
                            const isRecommended = recommendedSignAvatar?.id === avatar.id;
                            const isSelected = selectedId === avatar.id;

                            return (
                                <AvatarItem
                                    key={avatar.id}
                                    $isSelected={isSelected}
                                    $isRecommended={isRecommended}
                                    onClick={() => handleSelect(avatar.id)}
                                >
                                    {isSelected && <SelectedBadge>✓</SelectedBadge>}
                                    {isRecommended && <RecommendedBadge>추천</RecommendedBadge>}
                                    <AvatarIcon>
                                        <AvatarComponent />
                                    </AvatarIcon>
                                    <AvatarName $isSelected={isSelected}>{avatar.name}</AvatarName>
                                </AvatarItem>
                            );
                        })}
                    </AvatarGrid>

                    {otherAvatars.length > 0 && (
                        <>
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
                                            {isSelected && <SelectedBadge>✓</SelectedBadge>}
                                            <AvatarIcon>
                                                <AvatarComponent />
                                            </AvatarIcon>
                                            <AvatarName $isSelected={isSelected}>{avatar.name}</AvatarName>
                                        </AvatarItem>
                                    );
                                })}
                            </AvatarGrid>
                        </>
                    )}
                </ModalBody>
            </ModalContainer>

            {/* 사용자 정의 색상 선택 모달 */}
            {showCustomColorModal && (
                <CustomColorModal onClick={handleCustomColorCancel}>
                    <CustomColorPanel onClick={(e) => e.stopPropagation()}>
                        <CustomColorTitle>사용자 정의 색상</CustomColorTitle>

                        {/* Hex 값 직접 입력 */}
                        <HexInputWrapper>
                            <HexInputLabel>색상 코드 입력</HexInputLabel>
                            <HexInput
                                type="text"
                                value={hexInputValue}
                                onChange={handleHexInputChange}
                                placeholder="#FF1493"
                                maxLength={7}
                            />
                        </HexInputWrapper>

                        {/* 프리셋 색상 팔레트 */}
                        <PresetColorsWrapper>
                            <PresetColorsLabel>프리셋 색상</PresetColorsLabel>
                            <PresetColorsGrid>
                                {PRESET_COLORS.map((color, index) => (
                                    <PresetColorButton
                                        key={index}
                                        $color={color}
                                        $isSelected={tempCustomColor === color}
                                        onClick={() => handlePresetColorSelect(color)}
                                        title={color}
                                    />
                                ))}
                            </PresetColorsGrid>
                        </PresetColorsWrapper>

                        {/* 네이티브 컬러 피커 (보조 수단) */}
                        <ColorPickerWrapper>
                            <ColorPickerLabel>색상 선택기</ColorPickerLabel>
                            <NativeColorPicker
                                type="color"
                                value={tempCustomColor}
                                onChange={handleNativeColorChange}
                            />
                        </ColorPickerWrapper>

                        {/* 확인/취소 버튼 */}
                        <CustomColorActions>
                            <CustomColorButton className="cancel" onClick={handleCustomColorCancel}>
                                취소
                            </CustomColorButton>
                            <CustomColorButton className="confirm" onClick={handleCustomColorConfirm}>
                                확인
                            </CustomColorButton>
                        </CustomColorActions>
                    </CustomColorPanel>
                </CustomColorModal>
            )}
        </Overlay>
    );
};

export default AvatarSelector;
