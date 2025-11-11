"""
스마트폰 키보드 클릭 사운드 생성기
여러 종류의 클릭 소리를 생성하고 재생하여 비교할 수 있습니다.
"""

import numpy as np
import sounddevice as sd
from scipy import signal
import time

# 샘플레이트
SAMPLE_RATE = 44100

def generate_sound_1():
    """소리 1: 순수 화이트 노이즈 (하이패스)"""
    duration = 0.01  # 10ms
    samples = int(SAMPLE_RATE * duration)

    # 화이트 노이즈
    noise = np.random.uniform(-1, 1, samples)

    # 지수 감쇠
    envelope = np.exp(-np.arange(samples) / (samples * 0.3))
    sound = noise * envelope

    # 하이패스 필터 (1000Hz)
    sos = signal.butter(4, 1000, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.3

    return sound

def generate_sound_2():
    """소리 2: 임펄스 + 노이즈"""
    duration = 0.005  # 5ms
    samples = int(SAMPLE_RATE * duration)

    # 임펄스
    impulse = np.zeros(samples)
    impulse[:50] = 1.0

    # 노이즈
    noise = np.random.uniform(-1, 1, samples)
    envelope = np.exp(-np.arange(samples) / (samples * 0.15))

    sound = impulse * 0.5 + noise * envelope * 0.5

    # 밴드패스 필터 (2000-6000Hz)
    sos = signal.butter(2, [2000, 6000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.3

    return sound

def generate_sound_3():
    """소리 3: 핑크 노이즈 (더 부드러운 클릭)"""
    duration = 0.008  # 8ms
    samples = int(SAMPLE_RATE * duration)

    # 핑크 노이즈 (간단한 근사)
    white = np.random.uniform(-1, 1, samples)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    pink = signal.lfilter(b, a, white)

    # 빠른 감쇠
    envelope = np.exp(-np.arange(samples) / (samples * 0.2))
    sound = pink * envelope

    # 하이패스 필터
    sos = signal.butter(3, 800, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.3

    return sound

def generate_sound_4():
    """소리 4: 짧은 버스트 노이즈"""
    duration = 0.003  # 3ms (매우 짧음)
    samples = int(SAMPLE_RATE * duration)

    # 화이트 노이즈
    noise = np.random.uniform(-1, 1, samples)

    # 매우 급격한 감쇠
    envelope = np.exp(-np.arange(samples) / (samples * 0.1))
    sound = noise * envelope

    # 하이패스 필터 (1500Hz)
    sos = signal.butter(5, 1500, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.4

    return sound

def generate_sound_5():
    """소리 5: 타악기 스타일 (고음 + 중음)"""
    duration = 0.012  # 12ms
    samples = int(SAMPLE_RATE * duration)
    t = np.arange(samples) / SAMPLE_RATE

    # 고음 클릭 (1400Hz)
    high = np.sin(2 * np.pi * 1400 * t)
    env_high = np.exp(-t / 0.015)

    # 중음 (800Hz)
    mid = signal.sawtooth(2 * np.pi * 800 * t)
    env_mid = np.exp(-t / 0.012)

    sound = high * env_high * 0.5 + mid * env_mid * 0.3

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.3

    return sound

def generate_sound_6():
    """소리 6: 클리킹 사운드 (저음 강조)"""
    duration = 0.006  # 6ms
    samples = int(SAMPLE_RATE * duration)

    # 저음 펄스 (200Hz)
    t = np.arange(samples) / SAMPLE_RATE
    low = signal.square(2 * np.pi * 200 * t)

    # 노이즈
    noise = np.random.uniform(-1, 1, samples)

    # 결합
    envelope = np.exp(-np.arange(samples) / (samples * 0.15))
    sound = (low * 0.3 + noise * 0.7) * envelope

    # 밴드패스 필터
    sos = signal.butter(2, [500, 3000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.3

    return sound

def generate_sound_7():
    """소리 7: 스냅 사운드 (찰칵)"""
    duration = 0.004  # 4ms
    samples = int(SAMPLE_RATE * duration)

    # 매우 짧은 노이즈 버스트
    noise = np.random.uniform(-1, 1, samples)

    # 급격한 어택과 감쇠
    attack = np.linspace(0, 1, samples // 10)
    decay = np.exp(-np.arange(samples - len(attack)) / (samples * 0.05))
    envelope = np.concatenate([attack, decay])

    sound = noise * envelope

    # 하이패스 필터 (2000Hz)
    sos = signal.butter(4, 2000, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.35

    return sound

def generate_sound_8():
    """소리 8: 부드러운 탭"""
    duration = 0.015  # 15ms (조금 길게)
    samples = int(SAMPLE_RATE * duration)

    # 핑크 노이즈
    white = np.random.uniform(-1, 1, samples)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    pink = signal.lfilter(b, a, white)

    # 부드러운 감쇠
    envelope = np.exp(-np.arange(samples) / (samples * 0.4))
    sound = pink * envelope

    # 밴드패스 필터 (1000-4000Hz)
    sos = signal.butter(2, [1000, 4000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)

    # 정규화
    sound = sound / np.max(np.abs(sound)) * 0.25

    return sound

# 모든 사운드 생성 함수 리스트
sounds = {
    '1': ('순수 화이트 노이즈 (하이패스)', generate_sound_1),
    '2': ('임펄스 + 노이즈', generate_sound_2),
    '3': ('핑크 노이즈 (부드러운)', generate_sound_3),
    '4': ('짧은 버스트 노이즈', generate_sound_4),
    '5': ('타악기 스타일 (고음+중음)', generate_sound_5),
    '6': ('클리킹 사운드 (저음 강조)', generate_sound_6),
    '7': ('스냅 사운드 (찰칵)', generate_sound_7),
    '8': ('부드러운 탭', generate_sound_8),
}

def play_sound(sound):
    """사운드 재생"""
    sd.play(sound, SAMPLE_RATE)
    sd.wait()

def main():
    print("=" * 60)
    print("스마트폰 키보드 클릭 사운드 테스트")
    print("=" * 60)
    print()
    print("사용 가능한 소리:")
    print()

    for key, (name, _) in sounds.items():
        print(f"  [{key}] {name}")

    print()
    print("명령어:")
    print("  1-8: 해당 소리 재생")
    print("  a: 모든 소리 순차 재생 (1초 간격)")
    print("  q: 종료")
    print()
    print("=" * 60)

    while True:
        try:
            choice = input("\n재생할 소리 선택: ").strip().lower()

            if choice == 'q':
                print("프로그램을 종료합니다.")
                break

            if choice == 'a':
                print("\n모든 소리를 순차 재생합니다...\n")
                for key, (name, func) in sounds.items():
                    print(f"[{key}] {name} 재생 중...")
                    sound = func()
                    play_sound(sound)
                    time.sleep(1)
                print("\n모든 소리 재생 완료!")
                continue

            if choice in sounds:
                name, func = sounds[choice]
                print(f"\n[{choice}] {name} 재생 중...")
                sound = func()
                play_sound(sound)
            else:
                print("잘못된 선택입니다. 1-8, a, q 중 하나를 입력하세요.")

        except KeyboardInterrupt:
            print("\n\n프로그램을 종료합니다.")
            break
        except Exception as e:
            print(f"오류 발생: {e}")

if __name__ == "__main__":
    main()
