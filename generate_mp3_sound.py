#!/usr/bin/env python3
"""
Generate a pleasant notification sound MP3 for Android app
Creates a short, two-tone notification sound similar to popular messaging apps
"""

import numpy as np
import subprocess
import os
import wave
import struct

# Audio parameters
SAMPLE_RATE = 44100  # Standard CD quality
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

def create_kakao_style_notification():
    """
    Create a KakaoTalk-style notification sound
    Two harmonious tones played together with a gentle echo
    """

    # First chord: C6 (1046.5 Hz) + E6 (1318.5 Hz)
    tone1_duration = 0.15
    tone1_c6 = generate_tone(1046.5, tone1_duration, SAMPLE_RATE, AMPLITUDE)
    tone1_e6 = generate_tone(1318.5, tone1_duration, SAMPLE_RATE, AMPLITUDE * 0.8)

    # Combine the two tones
    tone1 = tone1_c6 + tone1_e6
    tone1 = apply_envelope(tone1, SAMPLE_RATE, attack=0.01, release=0.08)

    # Small gap
    gap = np.zeros(int(0.03 * SAMPLE_RATE))

    # Second chord (softer, slightly lower pitch)
    tone2_duration = 0.15
    tone2_a5 = generate_tone(880, tone2_duration, SAMPLE_RATE, AMPLITUDE * 0.6)
    tone2_c6 = generate_tone(1046.5, tone2_duration, SAMPLE_RATE, AMPLITUDE * 0.5)

    tone2 = tone2_a5 + tone2_c6
    tone2 = apply_envelope(tone2, SAMPLE_RATE, attack=0.01, release=0.12)

    # Combine all parts
    final = np.concatenate([tone1, gap, tone2])

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

def convert_to_mp3(wav_file, mp3_file):
    """Convert WAV to MP3 using ffmpeg"""
    try:
        # Check if ffmpeg is available
        subprocess.run(['ffmpeg', '-version'],
                      stdout=subprocess.PIPE,
                      stderr=subprocess.PIPE,
                      check=True)

        # Convert WAV to MP3
        subprocess.run([
            'ffmpeg', '-y',
            '-i', wav_file,
            '-codec:a', 'libmp3lame',
            '-b:a', '128k',
            '-ar', '44100',
            mp3_file
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        print(f"MP3 file created: {mp3_file}")
        return True
    except FileNotFoundError:
        print("FFmpeg not found. Please install FFmpeg to convert to MP3.")
        print("Using WAV file instead.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"Error converting to MP3: {e}")
        return False

if __name__ == '__main__':
    print("Generating notification sound...")

    # Generate the sound
    sound = create_kakao_style_notification()

    # Create output directory if it doesn't exist
    output_dir = 'android/app/src/main/res/raw'
    os.makedirs(output_dir, exist_ok=True)

    # Save as WAV first
    wav_file = os.path.join(output_dir, 'notification_sound.wav')
    save_wav(wav_file, sound, SAMPLE_RATE)
    print(f"WAV file created: {wav_file}")
    print(f"   Duration: {len(sound) / SAMPLE_RATE:.2f} seconds")
    print(f"   Sample rate: {SAMPLE_RATE} Hz")

    # Try to convert to MP3
    mp3_file = os.path.join(output_dir, 'notification_sound.mp3')
    if convert_to_mp3(wav_file, mp3_file):
        # If MP3 was created successfully, we can keep both or delete WAV
        print("\nBoth WAV and MP3 files are available.")
        print("Android supports both formats.")
    else:
        print("\nWAV file will be used (Android supports WAV natively).")

    print("\nThis sound will be used for chat notifications in the Android app.")
