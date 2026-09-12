#!/usr/bin/env python3
"""
Generate web-optimized short preview audio files for testing.
Creates 1-minute versions (~5 MB) instead of 10-minute versions (~100 MB).
"""

import math
import wave
import struct
import os
from pathlib import Path

SAMPLE_RATE = 44100
DURATION_SECONDS = 60

CHAKRA_FREQUENCIES = {
    "base": {"frequency": 174.0, "binaural_offset": 5.0, "harmonics": 2, "volume": 0.4},
    "root": {"frequency": 396.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "sacral": {"frequency": 417.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "solar_plexus": {"frequency": 528.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "heart": {"frequency": 639.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "throat": {"frequency": 741.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "third_eye": {"frequency": 852.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "crown": {"frequency": 963.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
    "healing": {"frequency": 285.0, "binaural_offset": 10.0, "harmonics": 2, "volume": 0.4},
}

def generate_preview(chakra_name, data, output_dir):
    freq = data["frequency"]
    offset = data["binaural_offset"]
    volume = data["volume"]
    harmonics = data["harmonics"]
    
    filename = f"{chakra_name}_{freq}hz_offset{int(offset)}_harm{harmonics}_var1_preview.wav"
    output_path = output_dir / filename
    
    left_freq = freq
    right_freq = freq + offset
    
    num_samples = int(DURATION_SECONDS * SAMPLE_RATE)
    inv_sr = 1.0 / SAMPLE_RATE
    
    chunk_size = 8192
    pack = struct.pack
    
    phase_left = 0.0
    phase_right = 0.0
    two_pi = 2 * math.pi
    inc_left = left_freq * two_pi * inv_sr
    inc_right = right_freq * two_pi * inv_sr
    
    with wave.open(str(output_path), 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        
        buffer = bytearray()
        fade_in = 3.0
        fade_out = 3.0
        
        for i in range(num_samples):
            t = i * inv_sr
            
            if t < fade_in:
                fade_factor = t / fade_in
            elif t > DURATION_SECONDS - fade_out:
                fade_factor = (DURATION_SECONDS - t) / fade_out
            else:
                fade_factor = 1.0
            
            vol = volume * fade_factor
            
            left = math.sin(phase_left)
            right = math.sin(phase_right)
            
            for h in range(2, harmonics + 1):
                left += 0.3 * math.sin(h * phase_left)
                right += 0.3 * math.sin(h * phase_right)
            
            left = max(-1.0, min(1.0, left * vol))
            right = max(-1.0, min(1.0, right * vol))
            
            buffer.extend(pack('<h', int(left * 32767)))
            buffer.extend(pack('<h', int(right * 32767)))
            
            phase_left += inc_left
            phase_right += inc_right
            if phase_left > two_pi:
                phase_left -= two_pi
            if phase_right > two_pi:
                phase_right -= two_pi
        
        wav.writeframes(bytes(buffer))
    
    print(f"  Generated: {filename} ({output_path.stat().st_size / 1024 / 1024:.1f} MB)")
    return filename

if __name__ == "__main__":
    output_dir = Path("D:/Projects/Silent-Spirits-Legacy/meditation-app/outputs/audio")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("Generating preview files for web testing...")
    for chakra_name, data in CHAKRA_FREQUENCIES.items():
        generate_preview(chakra_name, data, output_dir)
    
    print("Done! Preview files ready in meditation-app/outputs/audio/")
