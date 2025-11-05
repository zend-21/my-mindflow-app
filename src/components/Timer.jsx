// src/components/Timer.jsx

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
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

const TimerContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 40px;
    background: #ffffff;
    border-radius: 32px;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.05);
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

    /* 가로 모드 대응 - 컨테이너를 90도 회전 */
    @media (orientation: landscape) and (max-height: 500px) {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(90deg);
        transform-origin: center center;
        width: 80vh;
        max-width: 80vh;
        height: auto;
        max-height: 85vw;
        padding: 30px 25px;
    }

    /* 태블릿 이상 큰 화면의 가로 모드 */
    @media (orientation: landscape) and (min-height: 501px) {
        padding: 40px 35px;
        max-height: 85vh;
    }
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
    user-select: none;
    margin-top: 0;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.12),
        0 1px 4px rgba(0, 0, 0, 0.08);

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        opacity: 0.5;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 14px;
        padding: 12px 26px;
        margin-top: 0;
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
    background: #222020ff;
    z-index: 30000;
`;

const Display = styled.div`
    background: #e8e6e3;
    color: #2c2c2c;
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

const TimeButtonRow = styled.div`
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

const TimeButton = styled.button`
    background: #ffffff;
    border: none;
    color: #5c5c5c;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.12),
        0 1px 4px rgba(0, 0, 0, 0.08);
    min-width: 80px;

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.12),
            0 1px 4px rgba(0, 0, 0, 0.08);
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

const ControlRow = styled.div`
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

const ResetButton = styled.button`
    background: #ffffff;
    border: none;
    color: #5c5c5c;
    font-size: 18px;
    font-weight: 500;
    padding: 18px 28px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.12),
        0 1px 4px rgba(0, 0, 0, 0.08);

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        opacity: 0.5;
    }

    @media (orientation: landscape) and (max-height: 500px) {
        font-size: 16px;
        padding: 15px 24px;
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
    user-select: none;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.12),
        0 1px 4px rgba(0, 0, 0, 0.08);
    min-width: 200px;

    &:disabled {
        background: #e8e6e3;
        color: #afafaf;
        cursor: not-allowed;
        box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.12),
            0 1px 4px rgba(0, 0, 0, 0.08);
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

const Timer = ({ onClose }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const intervalRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const longPressIntervalRef = useRef(null);
    const audioRef = useRef(null);
    const isAlarmPlayingRef = useRef(false);
    const wakeLockRef = useRef(null);
    const preloadedAudioRef = useRef(null);

    // Wake Lock 요청 (화면 꺼짐 방지)
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            // Wake Lock 지원하지 않는 브라우저
        }
    };

    // Wake Lock 해제
    const releaseWakeLock = async () => {
        try {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        } catch (err) {
            // 무시
        }
    };

    // 전체화면 API 제거 - 모바일에서 화면 요동 방지
    // CSS Overlay(z-index: 20000)로 충분히 몰입형 UI 제공

    // 닫기 확인
    const handleClose = () => {
        setShowConfirmModal(true);
    };

    const confirmClose = () => {
        // 알람이 재생 중이면 중지
        if (isAlarmPlaying) {
            stopAlarm();
        }
        // Wake Lock 해제
        releaseWakeLock();
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

    // 분만 추가 (60분이 넘으면 0분으로)
    const addMinutes = (minutes) => {
        setSeconds(prev => {
            const currentMinutes = Math.floor(prev / 60);
            const currentSeconds = prev % 60;

            // 분을 추가하고 60으로 나눈 나머지로 순환
            const newMinutes = (currentMinutes + minutes) % 60;

            return newMinutes * 60 + currentSeconds;
        });
    };

    // 초만 추가 (60초가 넘으면 0초로)
    const addSeconds = (amount) => {
        setSeconds(prev => {
            const currentMinutes = Math.floor(prev / 60);
            const currentSeconds = prev % 60;

            // 초를 추가하고 60으로 나눈 나머지로 순환
            const newSeconds = (currentSeconds + amount) % 60;

            return currentMinutes * 60 + newSeconds;
        });
    };

    // 길게 누르기 시작 (분 버튼용)
    const handleMouseDownMinutes = (minutes) => {
        // 첫 번째 클릭은 즉시 실행
        addMinutes(minutes);
        // 길게 누르면 반복 실행
        longPressTimerRef.current = setTimeout(() => {
            longPressIntervalRef.current = setInterval(() => {
                addMinutes(minutes);
            }, 100);
        }, 500);
    };

    // 길게 누르기 시작 (초 버튼용)
    const handleMouseDownSeconds = (amount) => {
        // 첫 번째 클릭은 즉시 실행
        addSeconds(amount);
        // 길게 누르면 반복 실행
        longPressTimerRef.current = setTimeout(() => {
            longPressIntervalRef.current = setInterval(() => {
                addSeconds(amount);
            }, 100);
        }, 500);
    };

    // 길게 누르기 종료
    const handleMouseUp = (e) => {
        if (e) {
            e.preventDefault();
        }
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
        if (longPressIntervalRef.current) {
            clearInterval(longPressIntervalRef.current);
        }
    };

    // 알람 중지
    const stopAlarm = () => {
        isAlarmPlayingRef.current = false;

        if (audioRef.current) {
            try {
                // loop 속성 먼저 제거
                audioRef.current.loop = false;
                // onended 이벤트 핸들러 제거
                audioRef.current.onended = null;
                // 볼륨 0으로 설정 (즉시 무음)
                audioRef.current.volume = 0;
                // 오디오 즉시 정지
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                // src 제거하여 완전히 언로드
                audioRef.current.src = '';
                audioRef.current.load();
                audioRef.current = null;
            } catch (err) {
                // 무시
            }
        }
        setIsAlarmPlaying(false);
    };

    // 타이머 시작/정지
    const toggleTimer = () => {
        // 알람이 울리는 중에 STOP 버튼을 누르면 알람 중지하고 타이머 완전 종료
        if (isAlarmPlaying) {
            stopAlarm();
            setIsRunning(false);
            setSeconds(0); // 타이머를 완전히 리셋
            releaseWakeLock();
            return;
        }

        if (seconds === 0) return;

        // 타이머 시작 시
        if (!isRunning) {
            requestWakeLock();
        } else {
            // 타이머 일시정지 시
            releaseWakeLock();
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
        // 알람이 울리는 중이면 중지
        if (isAlarmPlaying) {
            stopAlarm();
        }
        // Wake Lock 해제
        releaseWakeLock();
    };

    // 타이머 카운트다운
    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        // 타이머는 멈추지만 isRunning은 true로 유지
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
        // 이미 알람이 재생 중이면 중복 실행 방지
        if (isAlarmPlayingRef.current) {
            return;
        }

        // 기존 오디오가 있다면 먼저 정리
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsAlarmPlaying(true);
        isAlarmPlayingRef.current = true;

        // 미리 로드된 오디오가 있으면 사용, 없으면 새로 생성
        let audio;
        if (preloadedAudioRef.current && preloadedAudioRef.current.readyState >= 2) {
            audio = preloadedAudioRef.current;
            audio.currentTime = 0; // 처음부터 재생
        } else {
            audio = new Audio('/sound/Timer_alarm/01.mp3');
        }

        audio.loop = true; // 반복 재생 설정
        audioRef.current = audio;

        audio.play().catch(() => {
            // 오디오 재생 실패 (사용자 제스처 필요 등)
        });
    };

    // 컴포넌트 마운트/언마운트 시 처리
    useEffect(() => {
        // 오디오 파일 미리 로드
        const preloadAudio = new Audio('/sound/Timer_alarm/01.mp3');
        preloadAudio.load();
        preloadedAudioRef.current = preloadAudio;

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
            // Wake Lock 해제
            releaseWakeLock();
        };
    }, []);

    return (
        <Overlay>
            {!showConfirmModal && (
                <TimerContainer>
                    <Display $fontFamily="'DSEG7', monospace">
                        {formatTime(seconds)}
                    </Display>

                    <TimeButtonRow>
                        <TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownMinutes(5);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            5M
                        </TimeButton>
                        <TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownMinutes(1);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            1M
                        </TimeButton>
                        <TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownSeconds(10);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            10S
                        </TimeButton>
                    </TimeButtonRow>

                    <ControlRow>
                        <ResetButton onClick={resetTimer} disabled={isRunning}>
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

                    <CloseButton onClick={handleClose} disabled={isRunning}>
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
