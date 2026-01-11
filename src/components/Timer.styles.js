// src/components/Timer.styles.js

import styled from 'styled-components';

export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #222020ff;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

export const TimerContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 40px;
    background: linear-gradient(180deg, #e8e6e3 0%, #d4d2cf 100%);
    border-radius: 32px;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.16),
        0 1px 3px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 10;
    box-sizing: border-box;

    /* 작은 화면 대응 */
    @media (max-width: 480px) {
        padding: 30px 20px;
        width: 95%;
    }

    /* 매우 작은 화면 (작은 폰) */
    @media (max-width: 360px) {
        padding: 20px 15px;
    }

    /* 가로 모드에서도 회전하지 않고 세로 방향 유지 */
    @media (orientation: landscape) {
        max-height: 90vh;
        overflow-y: auto;
    }
`;

export const BottomControlRow = styled.div`
    display: flex;
    gap: 26px;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 500px;

    @media (max-width: 480px) {
        gap: 22px;
    }
`;

export const VolumeControlContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(0, 0, 0, 0.05);
    padding: 12px 16px;
    border-radius: 12px;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        0 1px 4px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.08);

    @media (max-width: 480px) {
        padding: 10px 14px;
        gap: 6px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        padding: 10px 14px;
        gap: 6px;
    }
`;

export const VolumeControlInner = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    @media (max-width: 480px) {
        gap: 10px;
    }
`;

export const VolumeIconButton = styled.button`
    background: none;
    border: none;
    color: #333333;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        color: #000000;
        transform: scale(1.1);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        color: #999999;
    }
`;

export const SpeakerIcon = styled.svg`
    width: 28px;
    height: 28px;

    @media (max-width: 480px) {
        width: 26px;
        height: 26px;
    }
`;

export const VolumeSlider = styled.input`
    width: 80px;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.15);
    outline: none;
    cursor: pointer;

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #333333;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            transform: scale(1.2);
            box-shadow: 0 2px 8px rgba(51, 51, 51, 0.3);
        }
    }

    &:disabled::-webkit-slider-thumb {
        background: #999999;
        cursor: not-allowed;
        &:hover {
            transform: none;
            box-shadow: none;
        }
    }

    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #333333;
        border: none;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            transform: scale(1.2);
            box-shadow: 0 2px 8px rgba(51, 51, 51, 0.3);
        }
    }

    &:disabled::-moz-range-thumb {
        background: #999999;
        cursor: not-allowed;
        &:hover {
            transform: none;
            box-shadow: none;
        }
    }

    @media (max-width: 480px) {
        width: 80px;
        height: 3px;

        &::-webkit-slider-thumb {
            width: 14px;
            height: 14px;
        }

        &::-moz-range-thumb {
            width: 14px;
            height: 14px;
        }
    }
`;

export const VibrationButton = styled.button`
    background: ${props => props.$active ? '#5c5c5c' : 'transparent'};
    border: none;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s, background 0.2s;
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    opacity: ${props => props.$show ? '1' : '0.15'};
    pointer-events: ${props => props.$show ? 'auto' : 'none'};

    &:hover:not(:disabled) {
        transform: scale(1.1);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.15;
        cursor: not-allowed;
        pointer-events: none;
    }

    @media (max-width: 480px) {
        width: 22px;
        height: 22px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        width: 22px;
        height: 22px;
    }
`;

export const VibrationIcon = styled.svg`
    width: 24px;
    height: 24px;

    @media (max-width: 480px) {
        width: 22px;
        height: 22px;
    }
`;

export const VolumeButtonRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    min-width: 88px; /* 고정 너비 - gap 증가로 인해 조정 */
`;

export const VolumeButton = styled.button`
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #333333;
    font-size: 18px;
    font-weight: 600;
    width: 32px;
    height: 32px;
    min-width: 32px; /* 최소 너비 고정 */
    max-width: 32px; /* 최대 너비 고정 */
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s, opacity 0.2s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.08);
        color: #000000;
    }

    &:active:not(:disabled) {
        background: rgba(0, 0, 0, 0.1);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        background: rgba(0, 0, 0, 0.03);
        color: #999999;
    }

    @media (max-width: 480px) {
        width: 28px;
        height: 28px;
        min-width: 28px;
        max-width: 28px;
        font-size: 16px;
    }
`;

export const WarningNotice = styled.div`
    margin-top: 24px;
    text-align: left;
    font-size: 13px;
    color: #666666;
    line-height: 1.4;
    opacity: 0.7;

    @media (max-width: 480px) {
        font-size: 12px;
        margin-top: 20px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 12px;
        margin-top: 16px;
    }
`;

export const CloseButton = styled.button`
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #333333;
    font-size: 16px;
    font-weight: 500;
    padding: 14px 32px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    margin-top: 0;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        0 1px 4px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;

    &:hover {
        background: rgba(0, 0, 0, 0.08);
        color: #000000;
    }

    &:disabled {
        background: rgba(0, 0, 0, 0.03);
        color: #999999;
        cursor: not-allowed;
        opacity: 0.5;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 14px;
        padding: 12px 26px;
        margin-top: 0;
    }
`;

export const ConfirmModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
    border-radius: 16px;
    padding: 30px;
    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.2),
        0 10px 30px rgba(0, 0, 0, 0.1);
    z-index: 30001;
    min-width: 300px;
    border: 1px solid rgba(0, 0, 0, 0.1);
`;

export const ConfirmMessage = styled.p`
    margin: 0 0 25px 0;
    font-size: 18px;
    font-weight: 500;
    color: #333333;
    text-align: center;
`;

export const ConfirmButtonRow = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
`;

export const ConfirmButton = styled.button`
    background: ${props => props.$primary
        ? '#4a4a4a'
        : 'rgba(0, 0, 0, 0.05)'};
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: ${props => props.$primary ? '#ffffff' : '#333333'};
    font-size: 16px;
    font-weight: 600;
    padding: 12px 28px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        background: ${props => props.$primary
            ? '#5a5a5a'
            : 'rgba(0, 0, 0, 0.08)'};
    }

    &:active {
        transform: translateY(0);
    }
`;

export const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #222020ff;
    z-index: 30000;
`;

export const Display = styled.div`
    background: rgba(0, 0, 0, 0.08);
    color: #1a1a1a;
    font-size: 90px;
    font-weight: 700;
    font-family: ${props => props.$fontFamily || "'Courier New', 'Consolas', monospace"};
    padding: 40px;
    border-radius: 20px;
    margin-bottom: 40px;
    box-shadow:
        inset 0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 2px 6px rgba(0, 0, 0, 0.1);
    letter-spacing: 0;
    text-align: center;
    width: 350px;
    height: 130px;
    box-sizing: border-box;
    overflow: hidden;
    line-height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);

    /* 디지털 숫자 효과 - 고정폭 숫자 */
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "tnum";
    white-space: nowrap;

    /* 반응형 폰트 크기 */
    @media (max-width: 480px) {
        font-size: 70px;
        width: 280px;
        height: 110px;
        line-height: 110px;
        padding: 30px;
    }

    @media (max-width: 360px) {
        font-size: 60px;
        width: 240px;
        height: 100px;
        line-height: 100px;
        padding: 25px;
    }

    /* 가로 모드 - 회전되므로 세로와 비슷한 크기 유지 */
    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 65px;
        width: 260px;
        height: 105px;
        line-height: 105px;
        padding: 28px;
        margin-bottom: 25px;
    }
`;

export const TimeButtonRow = styled.div`
    display: flex;
    gap: 30px;
    margin-bottom: 45px;
    justify-content: center;
    flex-wrap: wrap;

    @media (max-width: 480px) {
        gap: 22px;
        margin-bottom: 35px;
    }

    @media (max-width: 360px) {
        gap: 16px;
        margin-bottom: 30px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        gap: 18px;
        margin-bottom: 18px;
    }
`;

export const TimeButton = styled.button`
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #333333;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        0 1px 4px rgba(0, 0, 0, 0.05);
    min-width: 80px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.08);
        color: #000000;
    }

    &:disabled {
        background: rgba(0, 0, 0, 0.03);
        color: #999999;
        cursor: not-allowed;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.1),
            0 1px 4px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 480px) {
        font-size: 16px;
        padding: 14px 22px;
        min-width: 70px;
    }

    @media (max-width: 360px) {
        font-size: 14px;
        padding: 12px 18px;
        min-width: 60px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 15px;
        padding: 13px 20px;
        min-width: 65px;
    }
`;

export const ControlRow = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 45px;

    @media (max-width: 480px) {
        margin-bottom: 35px;
    }

    @media (max-width: 360px) {
        margin-bottom: 30px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        margin-bottom: 18px;
    }
`;

export const ResetButton = styled.button`
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #333333;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        0 1px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.08);
        color: #000000;
    }

    &:disabled {
        background: rgba(0, 0, 0, 0.03);
        color: #999999;
        cursor: not-allowed;
        opacity: 0.5;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 16px;
        padding: 15px 24px;
    }
`;

export const StartStopButton = styled.button`
    background: ${props => props.$isRunning
        ? 'rgba(0, 0, 0, 0.08)'
        : '#4a4a4a'};
    border: 1px solid rgba(0, 0, 0, 0.12);
    color: ${props => props.$isRunning ? '#333333' : '#ffffff'};
    font-size: 22px;
    font-weight: 700;
    padding: 28px 60px;
    border-radius: 14px;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: ${props => props.$isRunning
            ? 'rgba(0, 0, 0, 0.1)'
            : '#5a5a5a'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:disabled {
        background: rgba(0, 0, 0, 0.03);
        color: #999999;
        cursor: not-allowed;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.1),
            0 1px 4px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 480px) {
        font-size: 20px;
        padding: 24px 50px;
        min-width: 180px;
    }

    @media (max-width: 360px) {
        font-size: 18px;
        padding: 20px 40px;
        min-width: 160px;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 19px;
        padding: 22px 48px;
        min-width: 170px;
    }
`;
