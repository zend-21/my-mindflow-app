// src/components/secret/PinPad.jsx
// PIN 입력 숫자 키패드 컴포넌트

import React, { useState } from 'react';
import styled from 'styled-components';

const KeypadContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 380px;
    margin: 0 auto;
`;

const KeyButton = styled.button`
    aspect-ratio: 1;
    min-height: 70px;
    background: ${props => {
        if (props.$isPressed) {
            return 'linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4))';
        }
        return props.$isSpecial
            ? 'rgba(255, 255, 255, 0.03)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)';
    }};
    border: 1px solid ${props => props.$isPressed
        ? 'rgba(240, 147, 251, 0.6)'
        : props.$isSpecial
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.1)'
    };
    border-radius: 16px;
    color: #ffffff;
    font-size: ${props => props.$isDelButton ? '18px' : '28px'};
    font-weight: ${props => props.$isDelButton ? '700' : '600'};
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${props => props.$isPressed
        ? '0 1px 4px rgba(240, 147, 251, 0.5) inset'
        : '0 2px 8px rgba(0, 0, 0, 0.2)'
    };
    transform: ${props => props.$isPressed ? 'scale(0.92)' : 'scale(1)'};
    letter-spacing: ${props => props.$isDelButton ? '0.5px' : 'normal'};

    &:hover:not(:disabled) {
        background: ${props => props.$isSpecial
        ? 'rgba(255, 255, 255, 0.05)'
        : 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))'
    };
        border-color: rgba(240, 147, 251, 0.3);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: none;
    }
`;

const PinPad = ({ onNumberClick, onBackspace, onClear, disabled }) => {
    const [pressedKey, setPressedKey] = useState(null);
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const handleKeyPress = (value) => {
        if (disabled) return;

        setPressedKey(value);
        onNumberClick(value);

        // 150ms 후 눌림 효과 해제 (보안 - 애니메이션은 보이되 상태는 남기지 않음)
        setTimeout(() => {
            setPressedKey(null);
        }, 150);
    };

    const handleBackspacePress = () => {
        if (disabled) return;

        setPressedKey('backspace');
        onBackspace();

        // 150ms 후 눌림 효과 해제
        setTimeout(() => {
            setPressedKey(null);
        }, 150);
    };

    const handleClearPress = () => {
        if (disabled) return;

        setPressedKey('clear');
        if (onClear) {
            onClear();
        }

        // 150ms 후 눌림 효과 해제
        setTimeout(() => {
            setPressedKey(null);
        }, 150);
    };

    return (
        <KeypadContainer>
            {numbers.map(num => (
                <KeyButton
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    disabled={disabled}
                    $isPressed={pressedKey === num}
                >
                    {num}
                </KeyButton>
            ))}

            <KeyButton
                $isSpecial
                onClick={handleBackspacePress}
                disabled={disabled}
                title="삭제"
                $isPressed={pressedKey === 'backspace'}
            >
                ←
            </KeyButton>

            <KeyButton
                onClick={() => handleKeyPress(0)}
                disabled={disabled}
                $isPressed={pressedKey === 0}
            >
                0
            </KeyButton>

            <KeyButton
                $isSpecial
                $isDelButton
                onClick={handleClearPress}
                disabled={disabled}
                title="전체 삭제"
                $isPressed={pressedKey === 'clear'}
            >
                Del
            </KeyButton>
        </KeypadContainer>
    );
};

export default PinPad;
