// src/components/AvatarSelector.styles.js
// AvatarSelector 컴포넌트의 Styled Components

import styled, { keyframes } from 'styled-components';

export const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

export const slideUp = keyframes`
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
`;

export const Overlay = styled.div`
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

export const ModalContainer = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1a1d24 100%);
    border-radius: 20px;
    width: calc(100% - 32px);
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    animation: ${slideUp} 0.3s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
`;

export const ModalHeader = styled.div`
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const ModalTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

export const CloseButton = styled.button`
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

export const ModalBody = styled.div`
    padding: 20px;
    padding-right: 12px; /* 스크롤바 영역 확보 */
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

export const RecommendationBanner = styled.div`
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
    border: 1px solid rgba(240, 147, 251, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const RecommendationIcon = styled.div`
    font-size: 24px;
    color: #FFD700;
`;

export const RecommendationText = styled.div`
    flex: 1;
    color: #ffffff;
    font-size: 14px;

    strong {
        font-weight: 600;
        color: #f093fb;
    }
`;

export const PreviewSection = styled.div`
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

export const PreviewTitle = styled.h4`
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0;
`;

export const PreviewContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

export const PreviewAvatarWrapper = styled.div`
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

export const PreviewPlaceholder = styled.div`
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

export const ApplyButton = styled.button`
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

export const BackgroundColorSection = styled.div`
    margin-bottom: 20px;
`;

export const BackgroundColorTitle = styled.h4`
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0 0 12px 0;
`;

export const ColorPalette = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 48px);
    gap: 12px;
    justify-content: center;
`;

export const ColorOption = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${props => props.$color};
    cursor: pointer;
    transition: all 0.2s ease;
    border: 3px solid ${props => props.$isSelected ? '#f093fb' : (props.$isNone ? 'rgba(255, 255, 255, 0.2)' : 'transparent')};
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

    /* 투명 배경 표시용 사선 패턴 */
    ${props => props.$isNone && `
        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
                linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
            background-size: 8px 8px;
            background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            border-radius: 50%;
        }
    `}

    ${props => props.$isSelected && !props.$isCustom && `
        &::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${props.$isNone ? 'rgba(255, 255, 255, 0.8)' : 'white'};
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            z-index: 1;
        }
    `}
`;

export const ColorPickerInput = styled.input`
    width: 100%;
    height: 100%;
    border: none;
    cursor: pointer;
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
`;

export const CustomColorIcon = styled.div`
    font-size: 24px;
    pointer-events: none;
`;

export const CustomColorModal = styled.div`
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

export const CustomColorPanel = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1a1d24 100%);
    border-radius: 16px;
    padding: 24px;
    width: 90vw;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const CustomColorTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-align: center;
`;

export const HexInputWrapper = styled.div`
    margin-bottom: 20px;
`;

export const HexInputLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

export const HexInput = styled.input`
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

export const PresetColorsWrapper = styled.div`
    margin-bottom: 20px;
`;

export const PresetColorsLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

export const PresetColorsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
`;

export const PresetColorButton = styled.button`
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

export const ColorPickerWrapper = styled.div`
    margin-bottom: 20px;
`;

export const ColorPickerLabel = styled.label`
    display: block;
    font-size: 14px;
    color: #b0b0b0;
    margin-bottom: 8px;
`;

export const NativeColorPicker = styled.input`
    width: 100%;
    height: 50px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    background: transparent;
`;

export const CustomColorActions = styled.div`
    display: flex;
    gap: 12px;
`;

export const CustomColorButton = styled.button`
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

export const SectionTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #d0d0d0;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const AvatarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
    justify-items: center;

    @media (max-width: 480px) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

export const AvatarItem = styled.div`
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

export const RecommendedBadge = styled.div`
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

export const SelectedBadge = styled.div`
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

export const AvatarIcon = styled.div`
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

export const AvatarName = styled.div`
    font-size: 11px;
    color: ${props => props.$isSelected ? '#ffffff' : '#b0b0b0'};
    text-align: center;
    font-weight: ${props => props.$isSelected ? '600' : '400'};
`;
