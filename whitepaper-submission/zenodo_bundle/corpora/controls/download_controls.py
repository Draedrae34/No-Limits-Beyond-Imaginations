#!/usr/bin/env python3
"""
Download real control texts for Pillar 4 validation.
"""

import urllib.request
from pathlib import Path

controls_dir = Path(__file__).resolve().parent

def download(url: str, filename: str, max_chars: int = 500000):
    path = controls_dir / filename
    print(f"Downloading {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read().decode("utf-8", errors="ignore")
        text = data[:max_chars]
        path.write_text(text, encoding="utf-8")
        print(f"Saved {path} ({len(text):,} chars)")
    except Exception as e:
        print(f"Failed {url}: {e}")

if __name__ == "__main__":
    download(
        "https://www.gutenberg.org/files/100/100-0.txt",
        "shakespeare.txt",
        max_chars=500_000,
    )
    download(
        "https://www.gutenberg.org/files/2701/2701-0.txt",
        "moby_dick.txt",
        max_chars=500_000,
    )
    download(
        "https://www.gutenberg.org/files/1342/1342-0.txt",
        "pride_and_prejudice.txt",
        max_chars=500_000,
    )
