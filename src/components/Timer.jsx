// src/components/Timer.jsx

import React, { useState, useEffect, useRef } from 'react';
import * as S from './Timer.styles';
import { LocalNotifications } from '@capacitor/local-notifications';

const Timer = ({ onClose }) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    // 6단계 볼륨: 0(무음), 0.002(0.2%), 0.03(3%), 0.1(10%), 0.3(30%), 1.0(100%)
    const volumeLevels = [0, 0.002, 0.03, 0.1, 0.3, 1.0];

    // 볼륨 레벨 인덱스 (0~5)를 저장하고, 실제 볼륨값으로 변환
    const [volumeLevelIndex, setVolumeLevelIndex] = useState(() => {
        const savedVolume = localStorage.getItem('timerVolume');
        if (savedVolume !== null) {
            const vol = parseFloat(savedVolume);
            // 저장된 볼륨값에서 가장 가까운 레벨 인덱스 찾기
            let closestIndex = 0;
            let minDiff = Math.abs(vol - volumeLevels[0]);
            for (let i = 1; i < volumeLevels.length; i++) {
                const diff = Math.abs(vol - volumeLevels[i]);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            }
            return closestIndex;
        }
        return 4; // 기본값 0.3 (인덱스 4)
    });

    const volume = volumeLevels[volumeLevelIndex];
    const [vibrationMode, setVibrationMode] = useState(() => {
        const savedVibration = localStorage.getItem('timerVibration');
        return savedVibration === 'true';
    });
    const intervalRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const longPressIntervalRef = useRef(null);
    const audioRef = useRef(null);
    const isAlarmPlayingRef = useRef(false);
    const wakeLockRef = useRef(null);
    const preloadedAudioRef = useRef(null);
    const vibrationIntervalRef = useRef(null);
    const testAudioRef = useRef(null);
    const testAudioTimeoutRef = useRef(null);
    const notificationPermissionGranted = useRef(false);
    const notificationSentAt10s = useRef(false);
    // 버튼 클릭 효과음용 ref
    const clickSoundRef = useRef(null);

    // 음량 변경 핸들러 (슬라이더 드래그 시 - 테스트 소리 없음)
    const handleVolumeChange = (e) => {
        const newIndex = parseInt(e.target.value);
        setVolumeLevelIndex(newIndex);

        const newVolume = volumeLevels[newIndex];
        localStorage.setItem('timerVolume', newVolume.toString());

        // 오디오가 재생 중이면 즉시 볼륨 적용
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }

        // 볼륨이 0이 아니면 진동 모드 해제
        if (newVolume > 0 && vibrationMode) {
            setVibrationMode(false);
            localStorage.setItem('timerVibration', 'false');
        }
    };

    // 스피커 아이콘 클릭 - 음소거/최대 볼륨 토글
    const toggleVolume = () => {
        const newIndex = volumeLevelIndex === 0 ? 5 : 0;
        setVolumeLevelIndex(newIndex);

        const newVolume = volumeLevels[newIndex];
        localStorage.setItem('timerVolume', newVolume.toString());

        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }

        // 음소거로 전환 시 진동 모드는 유지하지 않음
        if (newVolume === 0) {
            setVibrationMode(false);
            localStorage.setItem('timerVibration', 'false');
        }
    };

    // 음량 감소 (한 단계 내리기)
    const decreaseVolume = () => {
        if (volumeLevelIndex > 0) {
            const newIndex = volumeLevelIndex - 1;
            setVolumeLevelIndex(newIndex);

            const newVolume = volumeLevels[newIndex];
            localStorage.setItem('timerVolume', newVolume.toString());

            if (audioRef.current) {
                audioRef.current.volume = newVolume;
            }

            // 볼륨이 0이 되면 진동 모드는 유지하지 않음
            if (newVolume === 0) {
                setVibrationMode(false);
                localStorage.setItem('timerVibration', 'false');
            }

            // 버튼용 테스트 사운드 재생 (1초 제한)
            playTestSoundButton(newVolume);
        }
    };

    // 음량 증가 (한 단계 올리기)
    const increaseVolume = () => {
        if (volumeLevelIndex < volumeLevels.length - 1) {
            const newIndex = volumeLevelIndex + 1;
            setVolumeLevelIndex(newIndex);

            const newVolume = volumeLevels[newIndex];
            localStorage.setItem('timerVolume', newVolume.toString());

            if (audioRef.current) {
                audioRef.current.volume = newVolume;
            }

            // 볼륨이 0이 아니면 진동 모드 해제
            if (newVolume > 0 && vibrationMode) {
                setVibrationMode(false);
                localStorage.setItem('timerVibration', 'false');
            }

            // 버튼용 테스트 사운드 재생 (1초 제한)
            playTestSoundButton(newVolume);
        }
    };

    // 진동 모드 토글
    const toggleVibrationMode = () => {
        const newVibrationMode = !vibrationMode;
        console.log('진동 모드 토글:', vibrationMode, '->', newVibrationMode);
        setVibrationMode(newVibrationMode);
        localStorage.setItem('timerVibration', newVibrationMode.toString());

        // 진동 모드 활성화 시 볼륨을 0으로
        if (newVibrationMode) {
            setVolumeLevelIndex(0);
            localStorage.setItem('timerVolume', '0');
            if (audioRef.current) {
                audioRef.current.volume = 0;
            }

            // 진동 모드 활성화 시 0.5초간 진동 피드백
            if ('vibrate' in navigator) {
                navigator.vibrate(500); // 500ms 진동
            }
        } else {
            // 진동 모드 해제 시 진동 즉시 중지
            if ('vibrate' in navigator) {
                navigator.vibrate(0); // 진동 중지
            }
        }
    };

    // 진동 실행
    const triggerVibration = () => {
        if ('vibrate' in navigator && vibrationMode) {
            // 반복 진동 패턴: [진동 500ms, 쉼 300ms]
            const vibratePattern = [500, 300];
            const vibrateInterval = setInterval(() => {
                navigator.vibrate(vibratePattern);
            }, 800);

            // 알람 중지 시 진동도 중지되도록 ref에 저장
            return vibrateInterval;
        }
        return null;
    };

    // 테스트 사운드 재생 (버튼용 - 1초 제한)
    const playTestSoundButton = (volumeLevel) => {
        // 진동 모드이거나 볼륨이 0이면 테스트 사운드 중지
        if (volumeLevel === 0 || vibrationMode) {
            stopTestSound();
            return;
        }

        // 기존에 재생 중인 테스트 사운드가 있으면 즉시 중지
        stopTestSound();

        // 새 테스트 오디오 생성
        const testAudio = new Audio('/sound/Timer_alarm/01.mp3');
        testAudio.volume = volumeLevel;
        testAudio.loop = false;
        testAudioRef.current = testAudio;

        // 재생 시작
        testAudio.play().catch(err => {
            console.log('Test audio play failed:', err);
        });

        // 1초 후 자동 중지
        if (testAudioTimeoutRef.current) {
            clearTimeout(testAudioTimeoutRef.current);
        }
        testAudioTimeoutRef.current = setTimeout(() => {
            stopTestSound();
        }, 1000);
    };

    // 테스트 사운드 중지
    const stopTestSound = () => {
        if (testAudioRef.current) {
            testAudioRef.current.pause();
            testAudioRef.current.currentTime = 0;
            testAudioRef.current = null;
        }
        if (testAudioTimeoutRef.current) {
            clearTimeout(testAudioTimeoutRef.current);
            testAudioTimeoutRef.current = null;
        }
    };

    // 버튼 클릭 효과음 재생 (Web Audio API 사용 - 갤럭시 키보드 타이핑음)
    const playClickSound = () => {
        // 진동 모드이거나 볼륨이 0이면 소리 재생 안함
        if (volume === 0 || vibrationMode) {
            return;
        }

        try {
            // Web Audio API 컨텍스트 생성 (싱글톤)
            if (!clickSoundRef.current) {
                clickSoundRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const audioContext = clickSoundRef.current;
            const now = audioContext.currentTime;

            // 갤럭시 키보드 "톡" 소리 재현
            // 매우 짧은 임펄스 + 고주파 노이즈 버스트
            const duration = 0.003; // 3ms (매우 짧음)
            const bufferSize = Math.floor(audioContext.sampleRate * duration);
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = buffer.getChannelData(0);

            // 임펄스 + 노이즈 생성
            for (let i = 0; i < bufferSize; i++) {
                // 초반 임펄스 (첫 20샘플)
                const impulse = i < 20 ? 1.0 : 0;
                // 화이트 노이즈
                const noise = Math.random() * 2 - 1;
                // 매우 급격한 지수 감쇠
                const envelope = Math.exp(-i / (bufferSize * 0.1));

                output[i] = (impulse * 0.6 + noise * 0.4) * envelope;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            // 밴드패스 필터 (2000-6000Hz) - 갤럭시 특유의 "톡" 음역대
            const bandpass = audioContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 4000; // 중심 주파수
            bandpass.Q.value = 1.5; // Q값 (대역폭)

            const gain = audioContext.createGain();
            // 급격한 감쇠
            gain.gain.setValueAtTime(Math.min(volume * 0.25, 0.2), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.002);

            // 연결: 소스 → 밴드패스 필터 → 볼륨 → 출력
            source.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(audioContext.destination);

            source.start(now);
            source.stop(now + duration);

        } catch (err) {
            console.log('Click sound error:', err);
        }
    };

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

    // 알림 권한 요청 (비활성화 - 앱용으로 부적격)
    const requestNotificationPermission = async () => {
        // 브라우저 네이티브 알림은 URL 주소가 노출되므로 앱에서 사용 안함
        return false;
    };

    // 타이머 알림 전송 (비활성화 - 앱용으로 부적격)
    const sendTimerNotification = (title, body) => {
        // 브라우저 네이티브 알림 대신 앱 내 UI로만 알림 처리
        return;
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
        // 타이머 실행 중이면 무시
        if (isRunning) return;

        // 클릭 효과음 재생
        playClickSound();

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
        // 타이머 실행 중이면 무시
        if (isRunning) return;

        // 클릭 효과음 재생
        playClickSound();

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

        // 진동 중지
        if (vibrationIntervalRef.current) {
            clearInterval(vibrationIntervalRef.current);
            vibrationIntervalRef.current = null;
            navigator.vibrate(0); // 진동 즉시 중지
        }

        setIsAlarmPlaying(false);
    };

    // 로컬 알림 예약 (백그라운드 알람용 - 소리 없이 알림만)
    const scheduleLocalNotification = async (delaySeconds) => {
        try {
            // 알림 권한 요청
            const permission = await LocalNotifications.requestPermissions();
            if (permission.display !== 'granted') {
                console.log('⚠️ 알림 권한이 거부되었습니다');
                return;
            }

            // 기존 알림 취소
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

            // 새 알림 예약 (timer_alarm.mp3 사운드 사용)
            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: 1,
                        title: '타이머 완료!',
                        body: '설정한 시간이 종료되었습니다',
                        schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
                        smallIcon: 'ic_stat_icon_config_sample',
                        iconColor: '#1a1a2e',
                        channelId: 'timer_channel', // 타이머 전용 채널 (timer_alarm.mp3 사용)
                        // extra 데이터로 타이머 알림임을 표시
                        extra: {
                            type: 'timer',
                            action: 'open_timer'
                        }
                    }
                ]
            });
            console.log('✅ 로컬 알림 예약 완료:', delaySeconds, '초 후');
        } catch (error) {
            console.error('❌ 로컬 알림 예약 실패:', error);
        }
    };

    // 로컬 알림 취소
    const cancelLocalNotification = async () => {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
            console.log('✅ 로컬 알림 취소 완료');
        } catch (error) {
            console.error('❌ 로컬 알림 취소 실패:', error);
        }
    };

    // 타이머 시작/정지
    const toggleTimer = async () => {
        // 알람이 울리는 중에 STOP 버튼을 누르면 알람 중지하고 타이머 완전 종료
        if (isAlarmPlaying) {
            stopAlarm();
            setIsRunning(false);
            setSeconds(0); // 타이머를 완전히 리셋
            releaseWakeLock();
            notificationSentAt10s.current = false;
            await cancelLocalNotification();
            return;
        }

        if (seconds === 0) return;

        // 타이머 시작 시
        if (!isRunning) {
            requestWakeLock();
            requestNotificationPermission(); // 알림 권한 요청
            notificationSentAt10s.current = false; // 10초 알림 플래그 초기화
            // 🔔 로컬 알림 예약 (백그라운드에서만 알림 표시)
            await scheduleLocalNotification(seconds);
        } else {
            // 타이머 일시정지 시
            releaseWakeLock();
            await cancelLocalNotification();
        }

        setIsRunning(prev => !prev);
    };

    // 리셋
    const resetTimer = async () => {
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
        // 10초 알림 플래그 초기화
        notificationSentAt10s.current = false;
        // 로컬 알림 취소
        await cancelLocalNotification();
    };

    // 타이머 카운트다운
    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    // 10초 남았을 때 알림 전송 (한 번만)
                    if (prev === 10 && !notificationSentAt10s.current) {
                        sendTimerNotification('타이머 곧 종료', '10초 남았습니다');
                        notificationSentAt10s.current = true;
                    }

                    if (prev <= 1) {
                        // 타이머 종료 알림 전송
                        sendTimerNotification('타이머 종료!', '설정한 시간이 종료되었습니다');
                        // 포그라운드인 경우에만 타이머 알람 재생
                        // 백그라운드인 경우 알림음으로 충분
                        if (!document.hidden) {
                            console.log('🔊 포그라운드 - 타이머 알람 재생');
                            playAlarm();
                        } else {
                            console.log('🔇 백그라운드 - 알림음만 재생 (타이머 알람 생략)');
                            // 백그라운드에서는 알람이 울리지 않으므로 isRunning을 false로 설정
                            setIsRunning(false);
                        }
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

        // 진동 모드이거나 볼륨이 0인 경우 진동 실행
        if (vibrationMode || volume === 0) {
            vibrationIntervalRef.current = triggerVibration();
        }

        // 볼륨이 0보다 크면 알람 소리 재생
        if (volume > 0) {
            // 미리 로드된 오디오가 있으면 사용, 없으면 새로 생성
            let audio;
            if (preloadedAudioRef.current && preloadedAudioRef.current.readyState >= 2) {
                audio = preloadedAudioRef.current;
                audio.currentTime = 0; // 처음부터 재생
            } else {
                audio = new Audio('/sound/Timer_alarm/01.mp3');
            }

            audio.loop = false; // loop 대신 ended 이벤트 사용
            audio.volume = volume; // 볼륨 설정

            // ⚠️ Android 백그라운드 재생을 위한 중요 속성
            audio.setAttribute('preload', 'auto');
            audio.setAttribute('playsinline', 'true');

            audioRef.current = audio;

            // 알람이 끝나면 0.2초 텀을 두고 재생
            audio.addEventListener('ended', () => {
                setTimeout(() => {
                    if (audioRef.current && isAlarmPlayingRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(() => {
                            // 재생 실패 무시
                        });
                    }
                }, 300); // 0.3초 = 300ms (원하는 간격으로 조절 가능)
            });

            console.log('🔊 타이머 알람 시작', {
                volume: audio.volume,
                loop: audio.loop,
                readyState: audio.readyState,
                src: audio.src,
                backgroundMode: document.hidden
            });

            // 오디오가 충분히 로드될 때까지 기다린 후 재생
            const playWhenReady = () => {
                if (audio.readyState >= 2) {
                    // HAVE_CURRENT_DATA 이상이면 재생 가능
                    console.log('🎬 즉시 재생 시도 (readyState >= 2)');
                    audio.play()
                        .then(() => {
                            console.log('✅ 타이머 알람 재생 성공!');
                        })
                        .catch((error) => {
                            console.error('❌ 타이머 알람 재생 실패:', error);
                            console.log('📱 오디오 상태:', {
                                readyState: audio.readyState,
                                paused: audio.paused,
                                volume: audio.volume,
                                src: audio.src,
                                error: error.message
                            });
                        });
                } else {
                    // 아직 로드 중이면 canplay 이벤트를 기다림
                    console.log('⏳ 오디오 로딩 대기 중... (readyState:', audio.readyState + ')');
                    audio.addEventListener('canplay', () => {
                        console.log('✅ 오디오 로드 완료, 재생 시작 시도');
                        audio.play()
                            .then(() => {
                                console.log('✅ 타이머 알람 재생 성공!');
                            })
                            .catch((error) => {
                                console.error('❌ 타이머 알람 재생 실패 (canplay 후):', error);
                                console.log('📱 오디오 상태:', {
                                    readyState: audio.readyState,
                                    paused: audio.paused,
                                    volume: audio.volume,
                                    src: audio.src,
                                    error: error.message
                                });
                            });
                    }, { once: true });
                }
            };

            playWhenReady();
        }
    };

    // 컴포넌트 마운트/언마운트 시 처리
    useEffect(() => {
        // 오디오 파일 미리 로드
        const preloadAudio = new Audio('/sound/Timer_alarm/01.mp3');
        preloadAudio.load();
        preloadedAudioRef.current = preloadAudio;

        // Page Visibility API - 백그라운드/포그라운드 전환 처리
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // 백그라운드로 갔을 때 - 알람음 중지 (조용히)
                console.log('📱 타이머 백그라운드로 이동 - 알람음 일시정지');
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                    console.log('🔇 백그라운드에서 알람음 일시정지');
                }
            } else {
                // 다시 포그라운드로 돌아왔을 때
                console.log('📱 타이머 포그라운드로 복귀');
                // Wake Lock 재요청 (브라우저가 해제했을 수 있음)
                if (isRunning || isAlarmPlaying) {
                    requestWakeLock();
                }
                // ⚠️ 백그라운드에서 알림음이 울렸으면 포그라운드에서는 타이머 알람을 울리지 않음
                // (백그라운드 알림음으로 충분)
                console.log('🔇 포그라운드 복귀 - 백그라운드에서 알림음이 울렸으므로 타이머 알람 생략');
            }
        };

        // 오디오 중단 이벤트 처리 (전화 수신 등)
        const handleAudioInterruption = () => {
            console.log('📞 오디오 중단 감지 (전화 등)');
            if (isAlarmPlayingRef.current && audioRef.current) {
                // 오디오가 자동으로 일시정지됨
                audioRef.current.pause();
            }
        };

        // 오디오 재개 이벤트 처리 (전화 종료 등)
        const handleAudioResume = () => {
            console.log('📞 오디오 재개 가능');
            if (isAlarmPlayingRef.current && audioRef.current && !document.hidden) {
                audioRef.current.play().catch(() => {
                    console.log('알람 자동 재개 실패');
                });
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 오디오 중단/재개 이벤트 (iOS/Android)
        if (audioRef.current) {
            audioRef.current.addEventListener('pause', handleAudioInterruption);
            audioRef.current.addEventListener('play', handleAudioResume);
        }

        return () => {
            handleMouseUp();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // 알람 중지
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('pause', handleAudioInterruption);
                audioRef.current.removeEventListener('play', handleAudioResume);
                audioRef.current = null;
            }
            // 테스트 오디오 정리
            if (testAudioRef.current) {
                testAudioRef.current.pause();
                testAudioRef.current = null;
            }
            if (testAudioTimeoutRef.current) {
                clearTimeout(testAudioTimeoutRef.current);
            }
            // Wake Lock 해제
            releaseWakeLock();
            // 이벤트 리스너 제거
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <S.Overlay>
            {!showConfirmModal && (
                <S.TimerContainer>
                    <S.Display $fontFamily="'DSEG7', monospace">
                        {formatTime(seconds)}
                    </S.Display>

                    <S.TimeButtonRow>
                        <S.TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownMinutes(5);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            5M
                        </S.TimeButton>
                        <S.TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownMinutes(1);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            1M
                        </S.TimeButton>
                        <S.TimeButton
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleMouseDownSeconds(10);
                            }}
                            onPointerUp={handleMouseUp}
                            onPointerLeave={handleMouseUp}
                            disabled={isRunning}
                        >
                            10S
                        </S.TimeButton>
                    </S.TimeButtonRow>

                    <S.ControlRow>
                        <S.ResetButton onClick={resetTimer} disabled={isRunning}>
                            RESET
                        </S.ResetButton>
                        <S.StartStopButton
                            $isRunning={isRunning}
                            onClick={toggleTimer}
                            disabled={seconds === 0 && !isRunning}
                        >
                            {isRunning ? 'STOP' : 'START'}
                        </S.StartStopButton>
                    </S.ControlRow>

                    <S.BottomControlRow>
                        <S.VolumeControlContainer>
                            <S.VolumeControlInner>
                                <S.VolumeIconButton onClick={toggleVolume} disabled={isRunning}>
                                    <S.SpeakerIcon viewBox="0 0 28 24" fill="currentColor">
                                        {/* 막대 1 (가장 낮음) - 레벨 1 */}
                                        <rect x="2" y="14" width="3" height="6" rx="1.5" opacity={volumeLevelIndex === 0 ? 0.2 : 1}/>
                                        {/* 막대 2 - 레벨 2 */}
                                        <rect x="7" y="11" width="3" height="9" rx="1.5" opacity={volumeLevelIndex <= 1 ? 0.2 : 1}/>
                                        {/* 막대 3 (중간) - 레벨 3 */}
                                        <rect x="12" y="8" width="3" height="12" rx="1.5" opacity={volumeLevelIndex <= 2 ? 0.2 : 1}/>
                                        {/* 막대 4 - 레벨 4 */}
                                        <rect x="17" y="5" width="3" height="15" rx="1.5" opacity={volumeLevelIndex <= 3 ? 0.2 : 1}/>
                                        {/* 막대 5 (가장 높음) - 레벨 5 */}
                                        <rect x="22" y="2" width="3" height="18" rx="1.5" opacity={volumeLevelIndex <= 4 ? 0.2 : 1}/>
                                    </S.SpeakerIcon>
                                </S.VolumeIconButton>
                                <S.VolumeSlider
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="1"
                                    value={volumeLevelIndex}
                                    onChange={handleVolumeChange}
                                    onMouseUp={stopTestSound}
                                    onTouchEnd={stopTestSound}
                                    disabled={isRunning}
                                />
                                <S.VibrationButton
                                    $show={volume === 0}
                                    $active={vibrationMode}
                                    onClick={toggleVibrationMode}
                                    disabled={isRunning}
                                >
                                    <S.VibrationIcon viewBox="0 0 24 24" fill="none" stroke={vibrationMode ? "white" : "#5c5c5c"} strokeWidth="1.5">
                                        {/* 휴대폰 본체 */}
                                        <rect x="7" y="3" width="10" height="18" rx="1.5" strokeLinecap="round" strokeLinejoin="round" fill={vibrationMode ? "#5c5c5c" : "none"}/>
                                        {/* 상단 영역 (스피커 부분) */}
                                        <rect x="7" y="3" width="10" height="2.5" rx="1.5" fill={vibrationMode ? "white" : "#5c5c5c"} stroke="none"/>
                                        {/* 스피커 (가늘고 짧은 선) */}
                                        <line x1="10" y1="4.2" x2="14" y2="4.2" stroke={vibrationMode ? "#5c5c5c" : "white"} strokeWidth="0.8" strokeLinecap="round"/>
                                        {/* 하단 영역 (홈버튼 부분) */}
                                        <rect x="7" y="18.5" width="10" height="2.5" rx="1.5" fill={vibrationMode ? "white" : "#5c5c5c"} stroke="none"/>
                                        {/* 홈버튼 (작은 원) */}
                                        <circle cx="12" cy="19.7" r="0.7" fill={vibrationMode ? "#5c5c5c" : "white"}/>
                                        {/* 좌측 진동 물결 (꼬불꼬불) */}
                                        <path d="M4.5 8 Q3.5 9 4.5 10 Q5.5 11 4.5 12 Q3.5 13 4.5 14 Q5.5 15 4.5 16" strokeLinecap="round"/>
                                        {/* 우측 진동 물결 (꼬불꼬불) */}
                                        <path d="M19.5 8 Q20.5 9 19.5 10 Q18.5 11 19.5 12 Q20.5 13 19.5 14 Q18.5 15 19.5 16" strokeLinecap="round"/>
                                    </S.VibrationIcon>
                                </S.VibrationButton>
                            </S.VolumeControlInner>
                            <S.VolumeButtonRow>
                                <S.VolumeButton
                                    onClick={decreaseVolume}
                                    disabled={isRunning || volumeLevelIndex === 0}
                                >
                                    −
                                </S.VolumeButton>
                                <S.VolumeButton
                                    onClick={increaseVolume}
                                    disabled={isRunning || volumeLevelIndex === 5}
                                    style={{ marginLeft: '15px' }}
                                >
                                    +
                                </S.VolumeButton>
                            </S.VolumeButtonRow>
                        </S.VolumeControlContainer>
                        <S.CloseButton onClick={handleClose} disabled={isRunning}>
                            CLOSE
                        </S.CloseButton>
                    </S.BottomControlRow>

                    <S.WarningNotice>
                        다른 앱 사용 시 타이머가 중단될 수 있습니다.<br />화면을 켜둔 상태에서 사용하세요.
                    </S.WarningNotice>
                </S.TimerContainer>
            )}

            {showConfirmModal && (
                <>
                    <S.ModalOverlay onClick={cancelClose} />
                    <S.ConfirmModal>
                        <S.ConfirmMessage>타이머를 종료하시겠습니까?</S.ConfirmMessage>
                        <S.ConfirmButtonRow>
                            <S.ConfirmButton onClick={cancelClose}>
                                취소
                            </S.ConfirmButton>
                            <S.ConfirmButton $primary onClick={confirmClose}>
                                확인
                            </S.ConfirmButton>
                        </S.ConfirmButtonRow>
                    </S.ConfirmModal>
                </>
            )}
        </S.Overlay>
    );
};

export default Timer;
