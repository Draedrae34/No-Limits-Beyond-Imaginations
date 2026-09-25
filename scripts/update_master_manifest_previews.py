#!/usr/bin/env python3
"""
Update master_manifest.json to include preview audio entries.
"""

import json
from pathlib import Path

MANIFEST_PATH = Path("meditation-app/outputs/master_manifest.json")
AUDIO_DIR = Path("meditation-app/outputs/audio")

PREVIEW_PARAMS = {
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

def find_preview_file(chakra: str, params: dict) -> str | None:
    freq = params["frequency"]
    offset = int(params["binaural_offset"])
    harmonics = params["harmonics"]
    pattern = f"{chakra}_{freq}hz_offset{offset}_harm{harmonics}_var1_preview.wav"
    candidate = AUDIO_DIR / pattern
    if candidate.exists():
        return str(candidate)
    return None

def main():
    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        manifest = json.load(f)

    updated_count = 0
    for chakra, params in PREVIEW_PARAMS.items():
        if chakra not in manifest:
            continue
        preview_path = find_preview_file(chakra, params)
        if not preview_path:
            continue
        manifest[chakra]["preview_audio"] = {
            "chakra": chakra,
            "variation": 1,
            "filename": Path(preview_path).name,
            "base_freq": params["frequency"],
            "binaural_offset": params["binaural_offset"],
            "harmonics": params["harmonics"],
            "volume": params["volume"],
            "duration_minutes": 1.0,
            "output_path": preview_path,
            "skipped": False,
        }
        updated_count += 1

    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"Updated {updated_count} chakras with preview audio entries in {MANIFEST_PATH}")

if __name__ == "__main__":
    main()
