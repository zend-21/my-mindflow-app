// src/components/secret/PinInput.jsx
// PIN 입력 화면 컴포넌트

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import PinPad from './PinPad';

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 10px 20px 60px 20px;
    min-height: 400px;
    justify-content: flex-start;
    padding-top: 20px;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
    font-size: 14px;
    color: #b0b0b0;
    margin: 0;
    line-height: 1.5;
`;

const PinDisplay = styled.div`
    display: flex;
    gap: 14px;
    margin-bottom: 16px;
    animation: ${props => props.$shake ? shake : 'none'} 0.5s;
    justify-content: center;
`;

const PinDot = styled.div`
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${props => props.$filled
        ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8))'
        : 'rgba(255, 255, 255, 0.1)'
    };
    border: 2px solid ${props => props.$filled
        ? 'rgba(240, 147, 251, 0.8)'
        : 'rgba(255, 255, 255, 0.2)'
    };
    transition: all 0.2s;
    box-shadow: ${props => props.$filled
        ? '0 2px 8px rgba(240, 147, 251, 0.4)'
        : 'none'
    };
`;

const ErrorMessage = styled.div`
    color: #ff6b6b;
    font-size: 14px;
    text-align: center;
    min-height: 20px;
    font-weight: 500;
`;

const AttemptsWarning = styled.div`
    color: #ffa500;
    font-size: 13px;
    text-align: center;
    margin-top: -8px;
`;

const ForgotPinButton = styled.button`
    background: none;
    border: none;
    color: rgba(240, 147, 251, 0.8);
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
    margin-top: 8px;
    margin-bottom: 40px;
    padding: 8px;
    transition: all 0.2s;

    &:hover {
        color: rgba(240, 147, 251, 1);
    }
`;

const PinInput = ({
    pinLength = 4,
    title = 'PIN 입력',
    subtitle = '',
    onSubmit,
    onForgotPin,
    maxAttempts = 5
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const audioContextRef = React.useRef(null);

    useEffect(() => {
        // 잠금 상태 확인
        const lockData = localStorage.getItem('secretPageLock');
        if (lockData) {
            const { lockedUntil } = JSON.parse(lockData);
            if (Date.now() < lockedUntil) {
                setIsLocked(true);
                const remainingTime = Math.ceil((lockedUntil - Date.now()) / 1000 / 60);
                setError(`너무 많이 실패했습니다. ${remainingTime}분 후에 다시 시도하세요.`);
            } else {
                localStorage.removeItem('secretPageLock');
            }
        }
    }, []);

    // 숫자/스마일 클릭 효과음 (타이머 "톡" 소리)
    const playClickSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = audioContextRef.current;
            const now = audioContext.currentTime;

            // 갤럭시 키보드 "톡" 소리 재현
            const duration = 0.003; // 3ms
            const bufferSize = Math.floor(audioContext.sampleRate * duration);
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const impulse = i < 20 ? 1.0 : 0;
                const noise = Math.random() * 2 - 1;
                const envelope = Math.exp(-i / (bufferSize * 0.1));
                output[i] = (impulse * 0.6 + noise * 0.4) * envelope;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            const bandpass = audioContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 4000;
            bandpass.Q.value = 2;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.3;

            source.connect(bandpass);
            bandpass.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.start(now);
        } catch (err) {
            // 에러 무시
        }
    };

    // 백스페이스 효과음 (낮은 톡 소리)
    const playBackspaceSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = audioContextRef.current;
            const now = audioContext.currentTime;

            const duration = 0.004; // 4ms (약간 길게)
            const bufferSize = Math.floor(audioContext.sampleRate * duration);
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const impulse = i < 25 ? 1.0 : 0;
                const noise = Math.random() * 2 - 1;
                const envelope = Math.exp(-i / (bufferSize * 0.15));
                output[i] = (impulse * 0.5 + noise * 0.5) * envelope;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            const bandpass = audioContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 1800; // 더 낮은 주파수
            bandpass.Q.value = 1.5;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.25;

            source.connect(bandpass);
            bandpass.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.start(now);
        } catch (err) {
            // 에러 무시
        }
    };

    const handleNumberClick = (value) => {
        if (isLocked) return;

        if (pin.length < pinLength) {
            // 효과음 재생
            playClickSound();

            const newPin = pin + String(value);
            setPin(newPin);
            setError('');

            // 6자리가 완성되면 자동으로 제출
            if (newPin.length === pinLength) {
                setTimeout(() => {
                    handleConfirm(newPin);
                }, 100);
            }
        }
    };

    const handleBackspace = () => {
        if (isLocked) return;
        playBackspaceSound();
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleConfirm = async (pinToSubmit = pin) => {
        if (isLocked) return;
        if (pinToSubmit.length !== pinLength) {
            setError(`${pinLength}자리 PIN을 입력해주세요.`);
            return;
        }

        try {
            const result = await onSubmit(pinToSubmit);

            if (result.success) {
                setPin('');
                setError('');
                setAttempts(0);
            } else {
                // 실패 처리
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= maxAttempts) {
                    // 30분 잠금
                    const lockedUntil = Date.now() + (30 * 60 * 1000);
                    localStorage.setItem('secretPageLock', JSON.stringify({ lockedUntil }));
                    setIsLocked(true);
                    setError('너무 많이 실패했습니다. 30분 후에 다시 시도하세요.');
                } else {
                    setError(result.message || '잘못된 PIN입니다.');
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                }

                setPin('');
            }
        } catch (err) {
            setError('오류가 발생했습니다.');
            setPin('');
        }
    };

    return (
        <Container>
            <div>
                <Title>{title}</Title>
                {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </div>

            <PinDisplay $shake={shake}>
                {[...Array(pinLength)].map((_, index) => (
                    <PinDot key={index} $filled={index < pin.length} />
                ))}
            </PinDisplay>

            <ErrorMessage>{error}</ErrorMessage>

            {attempts > 0 && attempts < maxAttempts && !isLocked && (
                <AttemptsWarning>
                    ⚠️ {maxAttempts - attempts}번의 시도가 남았습니다.
                </AttemptsWarning>
            )}

            <PinPad
                onNumberClick={handleNumberClick}
                onBackspace={handleBackspace}
                disabled={isLocked}
            />

            {onForgotPin && !isLocked && (
                <ForgotPinButton onClick={onForgotPin}>
                    PIN을 잊으셨나요?
                </ForgotPinButton>
            )}
        </Container>
    );
};

export default PinInput;
