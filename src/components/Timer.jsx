// src/components/Timer.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
    animation: fadeIn 0.3s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const TimerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 40px;
    background: #f5f3f0;
    border-radius: 32px;
    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.25),
        0 10px 30px rgba(0, 0, 0, 0.15),
        0 5px 15px rgba(0, 0, 0, 0.1);
    width: 95%;
    max-width: 600px;
`;

const Display = styled.div`
    background: #e8e6e3;
    color: #2c2c2c;
    font-size: 90px;
    font-weight: 700;
    font-family: 'Courier New', 'Consolas', monospace;
    padding: 40px 40px 40px 50px;
    border-radius: 20px;
    margin-bottom: 40px;
    box-shadow:
        inset 0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 2px 6px rgba(0, 0, 0, 0.1);
    letter-spacing: 12px;
    text-align: center;
    width: 100%;
    max-width: 350px;
    min-width: 350px;
    box-sizing: border-box;
    overflow: hidden;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    /* 디지털 숫자 효과 */
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
`;

const TimeButtonRow = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 30px;
    justify-content: center;
`;

const TimeButton = styled.button`
    background: #ffffff;
    border: none;
    color: #5c5c5c;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.06);

    &:hover {
        transform: translateY(-2px);
        box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.12),
            0 2px 4px rgba(0, 0, 0, 0.08);
    }

    &:active {
        transform: translateY(0);
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.06);
    }

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const ControlRow = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const ResetButton = styled.button`
    background: #ffffff;
    border: none;
    color: #5c5c5c;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.06);

    &:hover {
        transform: translateY(-2px);
        box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.12),
            0 2px 4px rgba(0, 0, 0, 0.08);
    }

    &:active {
        transform: translateY(0);
        box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.06);
    }
`;

const StartStopButton = styled.button`
    background: ${props => props.$isRunning ? '#d4d4d4' : '#4a4a4a'};
    border: none;
    color: ${props => props.$isRunning ? '#5c5c5c' : '#ffffff'};
    font-size: 22px;
    font-weight: 700;
    padding: 28px 60px;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow:
        0 6px 18px rgba(0, 0, 0, 0.2),
        0 2px 6px rgba(0, 0, 0, 0.12);

    &:hover {
        transform: translateY(-2px);
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.25),
            0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &:active {
        transform: translateY(0);
        box-shadow:
            0 3px 10px rgba(0, 0, 0, 0.15),
            0 1px 4px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const Timer = ({ onClose }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const longPressIntervalRef = useRef(null);

    // 시간 포맷팅 (MM:SS)
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // 시간 추가 함수
    const addTime = (amount) => {
        setSeconds(prev => {
            const newTime = prev + amount;
            return Math.min(newTime, 59 * 60 + 59);
        });
    };

    // 길게 누르기 시작
    const handleMouseDown = (amount) => {
        addTime(amount);
        longPressTimerRef.current = setTimeout(() => {
            longPressIntervalRef.current = setInterval(() => {
                addTime(amount);
            }, 100);
        }, 500);
    };

    // 길게 누르기 종료
    const handleMouseUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
        if (longPressIntervalRef.current) {
            clearInterval(longPressIntervalRef.current);
        }
    };

    // 타이머 시작/정지
    const toggleTimer = () => {
        if (seconds === 0) return;
        setIsRunning(prev => !prev);
    };

    // 리셋
    const resetTimer = () => {
        setIsRunning(false);
        setSeconds(0);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    // 타이머 카운트다운
    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        playAlarm();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, seconds]);

    // 알람음 재생
    const playAlarm = () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        // 3번 반복
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 800;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc2.start();
            osc2.stop(audioContext.currentTime + 0.5);
        }, 600);

        setTimeout(() => {
            const osc3 = audioContext.createOscillator();
            const gain3 = audioContext.createGain();
            osc3.connect(gain3);
            gain3.connect(audioContext.destination);
            osc3.frequency.value = 800;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc3.start();
            osc3.stop(audioContext.currentTime + 0.5);
        }, 1200);
    };

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            handleMouseUp();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <Overlay onClick={onClose}>
            <TimerContainer onClick={(e) => e.stopPropagation()}>
                <Display>{formatTime(seconds)}</Display>

                <TimeButtonRow>
                    <TimeButton
                        onMouseDown={() => handleMouseDown(5 * 60)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={() => handleMouseDown(5 * 60)}
                        onTouchEnd={handleMouseUp}
                        disabled={isRunning}
                    >
                        5M
                    </TimeButton>
                    <TimeButton
                        onMouseDown={() => handleMouseDown(60)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={() => handleMouseDown(60)}
                        onTouchEnd={handleMouseUp}
                        disabled={isRunning}
                    >
                        1M
                    </TimeButton>
                    <TimeButton
                        onMouseDown={() => handleMouseDown(10)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={() => handleMouseDown(10)}
                        onTouchEnd={handleMouseUp}
                        disabled={isRunning}
                    >
                        10S
                    </TimeButton>
                </TimeButtonRow>

                <ControlRow>
                    <ResetButton onClick={resetTimer}>
                        RESET
                    </ResetButton>
                    <StartStopButton
                        $isRunning={isRunning}
                        onClick={toggleTimer}
                        disabled={seconds === 0 && !isRunning}
                    >
                        {isRunning ? 'STOP' : 'START'}
                    </StartStopButton>
                </ControlRow>
            </TimerContainer>
        </Overlay>
    );
};

export default Timer;
