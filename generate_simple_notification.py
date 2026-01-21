#!/usr/bin/env python3
"""
Simple notification sound generator
Creates a single-tone short beep
"""

import numpy as np
import wave
import struct
import os

# Audio parameters
SAMPLE_RATE = 44100
AMPLITUDE = 0.25

def generate_tone(frequency, duration, sample_rate, amplitude):
    """Generate a sine wave tone"""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = amplitude * np.sin(2 * np.pi * frequency * t)
    return tone

def apply_envelope(tone, sample_rate):
    """Apply smooth fade in/out"""
    length = len(tone)
    attack_samples = int(0.01 * sample_rate)
    release_samples = int(0.05 * sample_rate)

    envelope = np.ones(length)

    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)

    if release_samples > 0:
        envelope[-release_samples:] = np.linspace(1, 0, release_samples)

    return tone * envelope

def create_simple_beep():
    """
    앱 내장 알림음과 동일한 소리 (notificationSounds.js의 playNewMessageNotification)
    카카오톡 스타일: C6 (1046.5Hz) + E6 (1318.5Hz) 화음
    """

    # Web Audio API의 playNewMessageNotification() 함수와 동일한 설정
    # - 주파수: C6 (1046.5Hz) + E6 (1318.5Hz)
    # - 지속 시간: 0.5초
    # - 페이드: 0.05초 페이드 인, 0.45초 페이드 아웃

    duration = 0.5

    # 두 개의 톤 생성 (화음)
    tone_c6 = generate_tone(1046.5, duration, SAMPLE_RATE, AMPLITUDE)
    tone_e6 = generate_tone(1318.5, duration, SAMPLE_RATE, AMPLITUDE * 0.9)  # E6은 약간 더 작게

    # 화음 합성
    tone = tone_c6 + tone_e6

    # 앱과 동일한 엔벨로프 적용
    # attack: 0.05초, release: 0.45초
    tone = apply_envelope_custom(tone, SAMPLE_RATE, attack=0.05, release=0.45)

    return tone

def apply_envelope_custom(tone, sample_rate, attack, release):
    """앱의 Web Audio API와 동일한 커스텀 엔벨로프"""
    length = len(tone)
    attack_samples = int(attack * sample_rate)
    release_samples = int(release * sample_rate)

    envelope = np.ones(length)

    # Attack (linear ramp)
    if attack_samples > 0 and attack_samples < length:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)

    # Release (exponential ramp)
    if release_samples > 0 and release_samples < length:
        # 0.3에서 0.01로 exponential decay (Web Audio API와 유사)
        decay_curve = np.logspace(np.log10(1), np.log10(0.01), release_samples)
        envelope[-release_samples:] = decay_curve

    return tone * envelope

def save_wav(filename, audio_data, sample_rate):
    """Save audio data as WAV file"""
    audio_int16 = np.int16(audio_data * 32767)

    with wave.open(filename, 'w') as wav_file:
        wav_file.setparams((1, 2, sample_rate, len(audio_int16), 'NONE', 'not compressed'))

        for sample in audio_int16:
            wav_file.writeframes(struct.pack('<h', sample))

if __name__ == '__main__':
    print("Generating simple notification sound...")

    sound = create_simple_beep()

    output_dir = 'android/app/src/main/res/raw'
    os.makedirs(output_dir, exist_ok=True)

    wav_file = os.path.join(output_dir, 'notification_sound.wav')
    save_wav(wav_file, sound, SAMPLE_RATE)

    print(f"Notification sound created: {wav_file}")
    print(f"   Duration: {len(sound) / SAMPLE_RATE:.2f} seconds")
    print(f"   Sample rate: {SAMPLE_RATE} Hz")
    print("\nTo change the sound style, edit the script and uncomment different options.")
