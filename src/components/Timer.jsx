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
`;

const TimerContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 40px;
    background: #f5f3f0;
    border-radius: 32px;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.05);
    width: 95%;
    max-width: 600px;
    z-index: 10;
`;

const CloseButton = styled.button`
    background: #ffffff;
    border: none;
    color: #5c5c5c;
    font-size: 16px;
    font-weight: 500;
    padding: 14px 32px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    margin-top: 35px;
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

const ConfirmModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border-radius: 16px;
    padding: 30px;
    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.3),
        0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 30001;
    min-width: 300px;
`;

const ConfirmMessage = styled.p`
    margin: 0 0 25px 0;
    font-size: 18px;
    font-weight: 500;
    color: #2c2c2c;
    text-align: center;
`;

const ConfirmButtonRow = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
`;

const ConfirmButton = styled.button`
    background: ${props => props.$primary ? '#4a4a4a' : '#e8e6e3'};
    border: none;
    color: ${props => props.$primary ? '#ffffff' : '#5c5c5c'};
    font-size: 16px;
    font-weight: 600;
    padding: 12px 28px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
        transform: translateY(-2px);
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 6px rgba(0, 0, 0, 0.08);
    }

    &:active {
        transform: translateY(0);
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    z-index: 30000;
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const intervalRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const longPressIntervalRef = useRef(null);
    const audioRef = useRef(null);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

    // 닫기 확인
    const handleClose = () => {
        setShowConfirmModal(true);
    };

    const confirmClose = () => {
        onClose();
    };

    const cancelClose = () => {
        setShowConfirmModal(false);
    };

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

        // STOP 버튼을 눌렀을 때 알람이 재생 중이면 중지
        if (isRunning && isAlarmPlaying) {
            stopAlarm();
        }

        setIsRunning(prev => !prev);
    };

    // 리셋
    const resetTimer = () => {
        setIsRunning(false);
        setSeconds(0);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        // 알람이 재생 중이면 중지
        if (isAlarmPlaying) {
            stopAlarm();
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

    // 알람 중지
    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsAlarmPlaying(false);
    };

    // 알람음 재생
    const playAlarm = () => {
        setIsAlarmPlaying(true);

        // 01.mp3 재생
        const audio1 = new Audio('/sound/Timer_alarm/01.mp3');
        audioRef.current = audio1;

        audio1.play().catch(err => console.error('Audio 1 play error:', err));

        audio1.onended = () => {
            // 02.mp3 재생
            const audio2 = new Audio('/sound/Timer_alarm/02.mp3');
            audioRef.current = audio2;

            audio2.play().catch(err => console.error('Audio 2 play error:', err));

            audio2.onended = () => {
                // 03.mp3 반복 재생
                const audio3 = new Audio('/sound/Timer_alarm/03.mp3');
                audioRef.current = audio3;
                audio3.loop = true;

                audio3.play().catch(err => console.error('Audio 3 play error:', err));
            };
        };
    };

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            handleMouseUp();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // 알람 중지
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <Overlay>
            {!showConfirmModal && (
                <TimerContainer>
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

                    <CloseButton onClick={handleClose}>
                        CLOSE
                    </CloseButton>
                </TimerContainer>
            )}

            {showConfirmModal && (
                <>
                    <ModalOverlay onClick={cancelClose} />
                    <ConfirmModal>
                        <ConfirmMessage>타이머를 종료하시겠습니까?</ConfirmMessage>
                        <ConfirmButtonRow>
                            <ConfirmButton onClick={cancelClose}>
                                취소
                            </ConfirmButton>
                            <ConfirmButton $primary onClick={confirmClose}>
                                확인
                            </ConfirmButton>
                        </ConfirmButtonRow>
                    </ConfirmModal>
                </>
            )}
        </Overlay>
    );
};

export default Timer;
