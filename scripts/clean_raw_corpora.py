#!/usr/bin/env python3
"""
Clean raw corpora from bible-analysis/ and write clean outputs to pillar data dirs.
Production-ready: preserves actual text, removes only web/UI boilerplate.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BIBLE_ANALYSIS = ROOT / "bible-analysis"
P2_CLEAN = ROOT / "research" / "pillars" / "pillar2_ai_pattern" / "data" / "cleaned"
P4_CLEAN = ROOT / "research" / "pillars" / "pillar4_frequency_principles" / "data" / "cleaned"

WHITESPACE = re.compile(r"\s+")

FILES = [
    "kjv.txt",
    "enoch.txt",
    "thomas.txt",
    "hermetica.txt",
    "dead_sea_scrolls.txt",
    "nag_hammadi.txt",
]

def clean_kjv(text: str) -> str:
    """Clean KJV Bible - strip Gutenberg header, keep text."""
    # Find where the actual Bible text starts
    # Pattern: after "The First Book of Moses: Called Genesis"
    start_marker = "The First Book of Moses: Called Genesis"
    idx = text.find(start_marker)
    if idx != -1:
        text = text[idx:]
    
    # Remove trailing Gutenberg footer if present
    end_marker = "End of the Project Gutenberg EBook"
    idx = text.find(end_marker)
    if idx != -1:
        text = text[:idx]
    
    # Remove any remaining Gutenberg metadata
    text = re.sub(r'START OF THE PROJECT GUTENBERG EBOOK.*?The First Book of Moses: Called Genesis', 
                  'The First Book of Moses: Called Genesis', text, flags=re.IGNORECASE)
    text = re.sub(r'End of the Project Gutenberg EBook.*', '', text, flags=re.IGNORECASE)
    
    return WHITESPACE.sub(" ", text).strip()

def clean_enoch(text: str) -> str:
    """Clean Book of Enoch - strip Gutenberg header, keep text."""
    # Find where the actual book content starts
    start_marker = "THE BOOK OF ENOCH"
    idx = text.find(start_marker)
    if idx != -1:
        text = text[idx:]
    
    # Remove trailing Gutenberg footer if present
    end_marker = "End of the Project Gutenberg EBook"
    idx = text.find(end_marker)
    if idx != -1:
        text = text[:idx]
    
    # Remove any remaining Gutenberg metadata
    text = re.sub(r'START OF THE PROJECT GUTENBERG EBOOK.*?THE BOOK OF ENOCH', 
                  'THE BOOK OF ENOCH', text, flags=re.IGNORECASE)
    text = re.sub(r'End of the Project Gutenberg EBook.*', '', text, flags=re.IGNORECASE)
    
    return WHITESPACE.sub(" ", text).strip()

def clean_thomas(text: str) -> str:
    """Clean Gospel of Thomas - already clean, minimal processing."""
    text = WHITESPACE.sub(" ", text).strip()
    return text

def clean_hermetica(text: str) -> str:
    """Clean Corpus Hermeticum - already clean, minimal processing."""
    text = WHITESPACE.sub(" ", text).strip()
    return text

def clean_web_dump(text: str, name: str) -> str:
    """Extract readable text from Archive.org web dumps (DSS, Nag Hammadi)."""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Remove HTML entities
    text = re.sub(r'&[a-zA-Z0-9#]+;', ' ', text)
    # Remove CSS/JS blocks
    text = re.sub(r'\{[^}]*\}', ' ', text)
    text = re.sub(r'//[^\n]*', ' ', text)
    # Remove Archive.org specific boilerplate
    text = re.sub(r'Full text of .*?\.pdf \(PDFy mirror\).*', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'licstart.*?licend', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'window\.__realDefine.*?catch \(e\) console\.warn\(e\);', '', text, flags=re.DOTALL)
    text = re.sub(r'Keep the news in the Wayback Machine.*?outline: 0;', '', text, flags=re.DOTALL)
    text = re.sub(r'var vs.*?cache_bust.*?server_ms.*?server_name.*?archive_analytics\.', '', text, flags=re.DOTALL)
    text = re.sub(r'archive_analytics\.send_pageview_on_load.*?\);', '', text, flags=re.DOTALL)
    # Remove CSS class definitions
    text = re.sub(r'\.icon-hamburger[^{]*\{[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\.dropdown-toggle[^{]*\{[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\.active[^{]*\{[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'\.fill-color[^{]*\{[^}]*\}', '', text, flags=re.DOTALL)
    text = re.sub(r'svg\.[^ ]+\s*\{[^}]*\}', '', text, flags=re.DOTALL)
    # Remove download/borrow UI text
    text = re.sub(r'Download options.*?PDF', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'Borrow this Book.*?Free trial', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Normalize whitespace
    text = WHITESPACE.sub(" ", text).strip()
    return text

def clean_file(name: str):
    src = BIBLE_ANALYSIS / name
    if not src.exists():
        return None
    raw = src.read_text(encoding="utf-8", errors="ignore")
    original_len = len(raw)
    
    if name == "kjv.txt":
        text = clean_kjv(raw)
    elif name == "enoch.txt":
        text = clean_enoch(raw)
    elif name == "thomas.txt":
        text = clean_thomas(raw)
    elif name == "hermetica.txt":
        text = clean_hermetica(raw)
    elif name in ("dead_sea_scrolls.txt", "nag_hammadi.txt"):
        text = clean_web_dump(raw, name)
    else:
        text = WHITESPACE.sub(" ", raw).strip()
    
    stats = {
        "file": name,
        "original_chars": original_len,
        "cleaned_chars": len(text),
        "removed_chars": original_len - len(text),
        "removed_pct": round((original_len - len(text)) / original_len * 100, 2) if original_len else 0,
    }
    return text, stats

def write_clean(text: str, stats: dict, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text + "\n", encoding="utf-8")
    return stats

def main():
    reports = []
    for name in FILES:
        result = clean_file(name)
        if result is None:
            continue
        text, stats = result
        if len(text) > 1000:
            write_clean(text, stats, P2_CLEAN / name.replace(".txt", "_cleaned.txt"))
            write_clean(text, stats, P4_CLEAN / name.replace(".txt", "_cleaned.txt"))
            reports.append(stats)
            print(f"{name}: {stats['removed_pct']}% removed ({stats['removed_chars']:,} chars)")
        else:
            print(f"{name}: SKIPPED - only {len(text)} chars after cleaning")
            reports.append({**stats, "status": "skipped_insufficient_content"})
    
    report_path = P2_CLEAN / "cleaning_report.json"
    report_path.write_text(json.dumps({"reports": reports, "status": "completed"}, indent=2), encoding="utf-8")
    print(f"\nWrote cleaning report to {report_path}")

if __name__ == "__main__":
    main()
