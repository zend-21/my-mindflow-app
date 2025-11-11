"""
스마트폰 키보드 클릭 사운드 생성기 (GUI 버전)
버튼을 클릭해서 여러 종류의 클릭 소리를 비교할 수 있습니다.
"""

import numpy as np
from scipy import signal
import tkinter as tk
from tkinter import ttk
import threading
import winsound
import wave
import struct
import tempfile
import os

# 샘플레이트
SAMPLE_RATE = 44100

def generate_sound_1():
    """소리 1: 순수 화이트 노이즈 (하이패스)"""
    duration = 0.01  # 10ms
    samples = int(SAMPLE_RATE * duration)
    noise = np.random.uniform(-1, 1, samples)
    envelope = np.exp(-np.arange(samples) / (samples * 0.3))
    sound = noise * envelope
    sos = signal.butter(4, 1000, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.3
    return sound

def generate_sound_2():
    """소리 2: 임펄스 + 노이즈"""
    duration = 0.005  # 5ms
    samples = int(SAMPLE_RATE * duration)
    impulse = np.zeros(samples)
    impulse[:50] = 1.0
    noise = np.random.uniform(-1, 1, samples)
    envelope = np.exp(-np.arange(samples) / (samples * 0.15))
    sound = impulse * 0.5 + noise * envelope * 0.5
    sos = signal.butter(2, [2000, 6000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.3
    return sound

def generate_sound_3():
    """소리 3: 핑크 노이즈 (더 부드러운 클릭)"""
    duration = 0.008  # 8ms
    samples = int(SAMPLE_RATE * duration)
    white = np.random.uniform(-1, 1, samples)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    pink = signal.lfilter(b, a, white)
    envelope = np.exp(-np.arange(samples) / (samples * 0.2))
    sound = pink * envelope
    sos = signal.butter(3, 800, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.3
    return sound

def generate_sound_4():
    """소리 4: 짧은 버스트 노이즈"""
    duration = 0.003  # 3ms (매우 짧음)
    samples = int(SAMPLE_RATE * duration)
    noise = np.random.uniform(-1, 1, samples)
    envelope = np.exp(-np.arange(samples) / (samples * 0.1))
    sound = noise * envelope
    sos = signal.butter(5, 1500, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.4
    return sound

def generate_sound_5():
    """소리 5: 타악기 스타일 (고음 + 중음)"""
    duration = 0.012  # 12ms
    samples = int(SAMPLE_RATE * duration)
    t = np.arange(samples) / SAMPLE_RATE
    high = np.sin(2 * np.pi * 1400 * t)
    env_high = np.exp(-t / 0.015)
    mid = signal.sawtooth(2 * np.pi * 800 * t)
    env_mid = np.exp(-t / 0.012)
    sound = high * env_high * 0.5 + mid * env_mid * 0.3
    sound = sound / np.max(np.abs(sound)) * 0.3
    return sound

def generate_sound_6():
    """소리 6: 클리킹 사운드 (저음 강조)"""
    duration = 0.006  # 6ms
    samples = int(SAMPLE_RATE * duration)
    t = np.arange(samples) / SAMPLE_RATE
    low = signal.square(2 * np.pi * 200 * t)
    noise = np.random.uniform(-1, 1, samples)
    envelope = np.exp(-np.arange(samples) / (samples * 0.15))
    sound = (low * 0.3 + noise * 0.7) * envelope
    sos = signal.butter(2, [500, 3000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.3
    return sound

def generate_sound_7():
    """소리 7: 스냅 사운드 (찰칵)"""
    duration = 0.004  # 4ms
    samples = int(SAMPLE_RATE * duration)
    noise = np.random.uniform(-1, 1, samples)
    attack = np.linspace(0, 1, samples // 10)
    decay = np.exp(-np.arange(samples - len(attack)) / (samples * 0.05))
    envelope = np.concatenate([attack, decay])
    sound = noise * envelope
    sos = signal.butter(4, 2000, 'highpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.35
    return sound

def generate_sound_8():
    """소리 8: 부드러운 탭"""
    duration = 0.015  # 15ms (조금 길게)
    samples = int(SAMPLE_RATE * duration)
    white = np.random.uniform(-1, 1, samples)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    pink = signal.lfilter(b, a, white)
    envelope = np.exp(-np.arange(samples) / (samples * 0.4))
    sound = pink * envelope
    sos = signal.butter(2, [1000, 4000], 'bandpass', fs=SAMPLE_RATE, output='sos')
    sound = signal.sosfilt(sos, sound)
    sound = sound / np.max(np.abs(sound)) * 0.25
    return sound

# GUI 클래스
class ClickSoundGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("스마트폰 키보드 클릭 사운드 테스트")
        self.root.geometry("600x500")
        self.root.resizable(False, False)

        # 사운드 정의
        self.sounds = [
            ("소리 1: 순수 화이트 노이즈 (하이패스)", generate_sound_1),
            ("소리 2: 임펄스 + 노이즈", generate_sound_2),
            ("소리 3: 핑크 노이즈 (부드러운)", generate_sound_3),
            ("소리 4: 짧은 버스트 노이즈", generate_sound_4),
            ("소리 5: 타악기 스타일 (고음+중음)", generate_sound_5),
            ("소리 6: 클리킹 사운드 (저음 강조)", generate_sound_6),
            ("소리 7: 스냅 사운드 (찰칵)", generate_sound_7),
            ("소리 8: 부드러운 탭", generate_sound_8),
        ]

        self.create_widgets()

    def create_widgets(self):
        # 타이틀
        title = tk.Label(
            self.root,
            text="스마트폰 키보드 클릭 사운드 테스트",
            font=("맑은 고딕", 16, "bold"),
            pady=20
        )
        title.pack()

        # 설명
        desc = tk.Label(
            self.root,
            text="각 버튼을 클릭하여 소리를 듣고 마음에 드는 번호를 기억하세요.",
            font=("맑은 고딕", 10),
            fg="gray"
        )
        desc.pack(pady=(0, 20))

        # 버튼 프레임
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)

        # 버튼 생성
        for i, (name, func) in enumerate(self.sounds, 1):
            btn = tk.Button(
                button_frame,
                text=f"{i}. {name}",
                command=lambda f=func, n=i: self.play_sound(f, n),
                width=50,
                height=2,
                font=("맑은 고딕", 10),
                bg="#f0f0f0",
                activebackground="#e0e0e0",
                relief=tk.RAISED,
                bd=2
            )
            btn.pack(pady=5, padx=20)

        # 모든 소리 재생 버튼
        play_all_btn = tk.Button(
            self.root,
            text="▶ 모든 소리 순차 재생 (1초 간격)",
            command=self.play_all_sounds,
            width=50,
            height=2,
            font=("맑은 고딕", 10, "bold"),
            bg="#4CAF50",
            fg="white",
            activebackground="#45a049",
            relief=tk.RAISED,
            bd=2
        )
        play_all_btn.pack(pady=20)

        # 상태 표시
        self.status_label = tk.Label(
            self.root,
            text="버튼을 클릭하세요",
            font=("맑은 고딕", 10),
            fg="blue"
        )
        self.status_label.pack(pady=10)

    def play_sound(self, sound_func, number):
        """사운드 재생 (스레드로 실행)"""
        def play():
            self.status_label.config(text=f"소리 {number} 재생 중...", fg="green")
            sound = sound_func()
            sd.play(sound, SAMPLE_RATE)
            sd.wait()
            self.status_label.config(text=f"소리 {number} 재생 완료", fg="blue")

        thread = threading.Thread(target=play, daemon=True)
        thread.start()

    def play_all_sounds(self):
        """모든 소리 순차 재생"""
        def play_all():
            self.status_label.config(text="모든 소리 순차 재생 중...", fg="orange")
            import time
            for i, (name, func) in enumerate(self.sounds, 1):
                self.status_label.config(text=f"소리 {i} 재생 중...", fg="green")
                sound = func()
                sd.play(sound, SAMPLE_RATE)
                sd.wait()
                time.sleep(1)
            self.status_label.config(text="모든 소리 재생 완료!", fg="blue")

        thread = threading.Thread(target=play_all, daemon=True)
        thread.start()

# 메인 실행
if __name__ == "__main__":
    root = tk.Tk()
    app = ClickSoundGUI(root)
    root.mainloop()
