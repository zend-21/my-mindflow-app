#!/usr/bin/env python3
"""
Generate a pleasant notification sound for Android app
Creates a short, two-tone notification sound similar to popular messaging apps
"""

import numpy as np
import wave
import struct

# Audio parameters
SAMPLE_RATE = 44100  # Standard CD quality
DURATION = 0.5  # 0.5 seconds
AMPLITUDE = 0.3  # Volume (0.0 to 1.0)

def generate_tone(frequency, duration, sample_rate, amplitude):
    """Generate a sine wave tone"""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = amplitude * np.sin(2 * np.pi * frequency * t)
    return tone

def apply_envelope(tone, sample_rate, attack=0.01, release=0.1):
    """Apply ADSR envelope for smooth fade in/out"""
    length = len(tone)
    attack_samples = int(attack * sample_rate)
    release_samples = int(release * sample_rate)

    envelope = np.ones(length)

    # Attack (fade in)
    if attack_samples > 0:
        envelope[:attack_samples] = np.linspace(0, 1, attack_samples)

    # Release (fade out)
    if release_samples > 0:
        envelope[-release_samples:] = np.linspace(1, 0, release_samples)

    return tone * envelope

def create_notification_sound():
    """Create a pleasant two-tone notification sound"""

    # First tone: C6 (1046.5 Hz)
    tone1_duration = 0.15
    tone1 = generate_tone(1046.5, tone1_duration, SAMPLE_RATE, AMPLITUDE)
    tone1 = apply_envelope(tone1, SAMPLE_RATE, attack=0.01, release=0.08)

    # Second tone: E6 (1318.5 Hz) - harmony
    tone2_duration = 0.15
    tone2 = generate_tone(1318.5, tone2_duration, SAMPLE_RATE, AMPLITUDE * 0.8)
    tone2 = apply_envelope(tone2, SAMPLE_RATE, attack=0.01, release=0.08)

    # Combine both tones (play simultaneously)
    max_length = max(len(tone1), len(tone2))
    combined = np.zeros(max_length)
    combined[:len(tone1)] += tone1
    combined[:len(tone2)] += tone2

    # Add a slight gap and then a softer echo
    gap = np.zeros(int(0.05 * SAMPLE_RATE))
    echo = generate_tone(880, 0.2, SAMPLE_RATE, AMPLITUDE * 0.5)  # A5
    echo = apply_envelope(echo, SAMPLE_RATE, attack=0.01, release=0.15)

    # Combine all parts
    final = np.concatenate([combined, gap, echo])

    # Normalize to prevent clipping
    final = final / np.max(np.abs(final)) * 0.9

    return final

def save_wav(filename, audio_data, sample_rate):
    """Save audio data as WAV file"""
    # Convert to 16-bit PCM
    audio_int16 = np.int16(audio_data * 32767)

    with wave.open(filename, 'w') as wav_file:
        # Set parameters: nchannels, sampwidth, framerate, nframes, comptype, compname
        wav_file.setparams((1, 2, sample_rate, len(audio_int16), 'NONE', 'not compressed'))

        # Write audio data
        for sample in audio_int16:
            wav_file.writeframes(struct.pack('<h', sample))

if __name__ == '__main__':
    print("Generating notification sound...")

    # Generate the sound
    sound = create_notification_sound()

    # Save as WAV file
    output_file = 'android/app/src/main/res/raw/notification_sound.wav'
    save_wav(output_file, sound, SAMPLE_RATE)

    print(f"Notification sound created: {output_file}")
    print(f"   Duration: {len(sound) / SAMPLE_RATE:.2f} seconds")
    print(f"   Sample rate: {SAMPLE_RATE} Hz")
    print(f"   Format: WAV (16-bit PCM)")
    print("\nThis sound will be used for chat notifications in the Android app.")
