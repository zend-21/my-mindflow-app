// src/components/AvatarSelector.jsx
// 아바타 선택 모달

import React, { useState, useEffect } from 'react';
import { avatarList, getRecommendedAvatar } from './avatars/AvatarIcons';
// ⚠️ 운세 기능 비활성화
// import { getUserProfile } from '../features/fortune/utils/fortuneLogic';
import * as S from './AvatarSelector.styles';
import { toast } from '../utils/toast';
import { setProfileSetting, getProfileSetting } from '../utils/userStorage';

const BACKGROUND_COLORS = [
    // 첫 줄: 5개
    { id: 'none', name: '없음', color: 'transparent' },
    { id: 'lavender', name: '라벤더', color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
    { id: 'peach', name: '피치', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'mint', name: '민트', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'ocean', name: '오션', color: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    // 둘째 줄: 5개
    { id: 'custom', name: '사용자정의', color: 'custom' },
    { id: 'pink', name: '핑크', color: '#FF69B4' },
    { id: 'blue', name: '블루', color: '#4169E1' },
    { id: 'yellow', name: '옐로우', color: '#FFD700' },
    { id: 'green', name: '그린', color: '#32CD32' },
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

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatarId }) => {
    const [selectedId, setSelectedId] = useState(currentAvatarId || null);
    // 계정별 localStorage에서 배경색 로드
    const [selectedBgColor, setSelectedBgColor] = useState(getProfileSetting('avatarBgColor') || 'none');
    const [customColor, setCustomColor] = useState(getProfileSetting('avatarCustomColor') || '#FF1493');
    const [showCustomColorModal, setShowCustomColorModal] = useState(false);
    const [tempCustomColor, setTempCustomColor] = useState('#FF1493');
    const [hexInputValue, setHexInputValue] = useState('');
    const scrollRef = React.useRef(null);

    useEffect(() => {
        setSelectedId(currentAvatarId);
    }, [currentAvatarId]);

    useEffect(() => {
        // 모달 열릴 때 계정별 localStorage에서 로드
        setSelectedBgColor(getProfileSetting('avatarBgColor') || 'none');
        setCustomColor(getProfileSetting('avatarCustomColor') || '#FF1493');
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
        // 계정별 localStorage에 저장 (공유 localStorage 대신)
        setProfileSetting('avatarBgColor', colorId);
        // 배경색 변경 이벤트 발생 (일관된 형식 사용)
        window.dispatchEvent(new CustomEvent('avatarBgColorChanged', {
            detail: { type: colorId, customColor: null }
        }));
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
            // 계정별 localStorage에 저장 (공유 localStorage 대신)
            setProfileSetting('avatarCustomColor', tempCustomColor);
            setSelectedBgColor('custom');
            setProfileSetting('avatarBgColor', 'custom');
            // 배경색 변경 이벤트 발생 (커스텀 색상값도 함께 전달)
            window.dispatchEvent(new CustomEvent('avatarBgColorChanged', {
                detail: { type: 'custom', customColor: tempCustomColor }
            }));
            setShowCustomColorModal(false);
        } else {
            toast('유효한 색상 코드를 입력해주세요. (예: #FF1493)');
        }
    };

    const handleCustomColorCancel = () => {
        setShowCustomColorModal(false);
    };

    const handleApply = () => {
        if (selectedId) {
            // 아바타 선택 저장 (계정별 localStorage에 저장)
            setProfileSetting('selectedAvatarId', selectedId);
            setProfileSetting('profileImageType', 'avatar');

            // 아바타 변경 이벤트 발생 (Header, SideMenu 업데이트용)
            window.dispatchEvent(new CustomEvent('avatarChanged', { detail: selectedId }));

            onSelect(selectedId);
            setTimeout(() => onClose(), 200);
        }
    };

    if (!isOpen) return null;

    // 십이지신, 기타 동물 분리 (별자리 제거됨)
    const zodiacAvatars = avatarList.filter(avatar => avatar.zodiacYear);
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
        <S.Overlay onClick={onClose}>
            <S.ModalContainer onClick={(e) => e.stopPropagation()}>
                <S.ModalHeader>
                    <S.ModalTitle>아바타 선택</S.ModalTitle>
                    <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
                </S.ModalHeader>
                <S.ModalBody ref={scrollRef}>
                    {/* 미리보기 섹션 */}
                    <S.PreviewSection>
                        <S.PreviewTitle>미리보기</S.PreviewTitle>
                        <S.PreviewContent>
                            {selectedId ? (
                                <S.PreviewAvatarWrapper $bgColor={getSelectedBgColor()}>
                                    {renderPreviewAvatar()}
                                </S.PreviewAvatarWrapper>
                            ) : (
                                <S.PreviewPlaceholder>
                                    아바타를<br />선택해주세요
                                </S.PreviewPlaceholder>
                            )}
                        </S.PreviewContent>
                        <S.ApplyButton onClick={handleApply} disabled={!selectedId}>
                            적용
                        </S.ApplyButton>
                    </S.PreviewSection>

                    <S.BackgroundColorSection>
                        <S.BackgroundColorTitle>아바타 배경색</S.BackgroundColorTitle>
                        <S.ColorPalette>
                            {BACKGROUND_COLORS.map(color => (
                                <S.ColorOption
                                    key={color.id}
                                    $color={color.id === 'custom' ? customColor : color.color}
                                    $isSelected={selectedBgColor === color.id}
                                    $isCustom={color.id === 'custom'}
                                    $isNone={color.id === 'none'}
                                    onClick={() => color.id === 'custom' ? handleCustomColorClick() : handleBgColorSelect(color.id)}
                                    title={color.name}
                                >
                                    {color.id === 'custom' && (
                                        <S.CustomColorIcon>🎨</S.CustomColorIcon>
                                    )}
                                </S.ColorOption>
                            ))}
                        </S.ColorPalette>
                    </S.BackgroundColorSection>

                    <S.SectionTitle>십이지신</S.SectionTitle>
                    <S.AvatarGrid>
                        {zodiacAvatars.map(avatar => {
                            const AvatarComponent = avatar.component;
                            const isSelected = selectedId === avatar.id;

                            return (
                                <S.AvatarItem
                                    key={avatar.id}
                                    $isSelected={isSelected}
                                    onClick={() => handleSelect(avatar.id)}
                                >
                                    {isSelected && <S.SelectedBadge>✓</S.SelectedBadge>}
                                    <S.AvatarIcon>
                                        <AvatarComponent />
                                    </S.AvatarIcon>
                                    <S.AvatarName $isSelected={isSelected}>{avatar.name}</S.AvatarName>
                                </S.AvatarItem>
                            );
                        })}
                    </S.AvatarGrid>

                    {/* 별자리 섹션 제거됨 (운세 기능 비활성화) */}

                    {otherAvatars.length > 0 && (
                        <>
                            <S.SectionTitle>기타 동물</S.SectionTitle>
                            <S.AvatarGrid>
                                {otherAvatars.map(avatar => {
                                    const AvatarComponent = avatar.component;
                                    const isSelected = selectedId === avatar.id;

                                    return (
                                        <S.AvatarItem
                                            key={avatar.id}
                                            $isSelected={isSelected}
                                            onClick={() => handleSelect(avatar.id)}
                                        >
                                            {isSelected && <S.SelectedBadge>✓</S.SelectedBadge>}
                                            <S.AvatarIcon>
                                                <AvatarComponent />
                                            </S.AvatarIcon>
                                            <S.AvatarName $isSelected={isSelected}>{avatar.name}</S.AvatarName>
                                        </S.AvatarItem>
                                    );
                                })}
                            </S.AvatarGrid>
                        </>
                    )}
                </S.ModalBody>
            </S.ModalContainer>

            {/* 사용자 정의 색상 선택 모달 */}
            {showCustomColorModal && (
                <S.CustomColorModal onClick={handleCustomColorCancel}>
                    <S.CustomColorPanel onClick={(e) => e.stopPropagation()}>
                        <S.CustomColorTitle>사용자 정의 색상</S.CustomColorTitle>

                        {/* Hex 값 직접 입력 */}
                        <S.HexInputWrapper>
                            <S.HexInputLabel>색상 코드 입력</S.HexInputLabel>
                            <S.HexInput
                                type="text"
                                value={hexInputValue}
                                onChange={handleHexInputChange}
                                placeholder="#FF1493"
                                maxLength={7}
                            />
                        </S.HexInputWrapper>

                        {/* 프리셋 색상 팔레트 */}
                        <S.PresetColorsWrapper>
                            <S.PresetColorsLabel>프리셋 색상</S.PresetColorsLabel>
                            <S.PresetColorsGrid>
                                {PRESET_COLORS.map((color, index) => (
                                    <S.PresetColorButton
                                        key={index}
                                        $color={color}
                                        $isSelected={tempCustomColor === color}
                                        onClick={() => handlePresetColorSelect(color)}
                                        title={color}
                                    />
                                ))}
                            </S.PresetColorsGrid>
                        </S.PresetColorsWrapper>

                        {/* 네이티브 컬러 피커 (보조 수단) */}
                        <S.ColorPickerWrapper>
                            <S.ColorPickerLabel>색상 선택기</S.ColorPickerLabel>
                            <S.NativeColorPicker
                                type="color"
                                value={tempCustomColor}
                                onChange={handleNativeColorChange}
                            />
                        </S.ColorPickerWrapper>

                        {/* 확인/취소 버튼 */}
                        <S.CustomColorActions>
                            <S.CustomColorButton className="cancel" onClick={handleCustomColorCancel}>
                                취소
                            </S.CustomColorButton>
                            <S.CustomColorButton className="confirm" onClick={handleCustomColorConfirm}>
                                확인
                            </S.CustomColorButton>
                        </S.CustomColorActions>
                    </S.CustomColorPanel>
                </S.CustomColorModal>
            )}
        </S.Overlay>
    );
};

export default AvatarSelector;
