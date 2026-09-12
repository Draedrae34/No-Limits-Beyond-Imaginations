#!/usr/bin/env python3
"""
Corpus Cleaning Utility
=======================
Removes HTML/CSS artifacts, markup tags, and web contamination from ancient text corpora.

Usage:
    python clean_corpora.py
"""

import json
import re
from pathlib import Path
from typing import Optional


# =============================================================================
# CLEANING RULES
# =============================================================================

HTML_TAG_PATTERN = re.compile(r'<[^>]+>')
HTML_ENTITY_PATTERN = re.compile(r'&[a-zA-Z0-9#]+;')
CSS_CLASS_PATTERN = re.compile(r'\b(class|id|style|media|scope|subnav|button|primary|week|lines|unrecoverable|login|desktop|quot|column|signed|script|nav|menu|footer|header|sidebar|widget|module)\b')
WHITESPACE_PATTERN = re.compile(r'\s+')
SPECIAL_CHARS_PATTERN = re.compile(r'[^\w\s.,;:!?\'"()-]')


def remove_html_tags(text: str) -> str:
    """Remove HTML/XML tags."""
    return HTML_TAG_PATTERN.sub(' ', text)


def remove_html_entities(text: str) -> str:
    """Remove HTML entities like &nbsp; &amp; etc."""
    return HTML_ENTITY_PATTERN.sub(' ', text)


def remove_css_artifacts(text: str) -> str:
    """Remove CSS class names, IDs, and web UI terms."""
    return CSS_CLASS_PATTERN.sub(' ', text)


def remove_special_characters(text: str) -> str:
    """Remove unusual special characters, keep basic punctuation."""
    return SPECIAL_CHARS_PATTERN.sub(' ', text)


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace to single spaces."""
    return WHITESPACE_PATTERN.sub(' ', text)


def remove_duplicate_lines(text: str) -> str:
    """Remove duplicate consecutive lines."""
    lines = text.split('\n')
    cleaned = []
    prev = None
    for line in lines:
        stripped = line.strip()
        if stripped and stripped != prev:
            cleaned.append(line)
            prev = stripped
        elif not stripped:
            cleaned.append(line)
            prev = None
    return '\n'.join(cleaned)


def remove_navigation_boilerplate(text: str) -> str:
    """Remove common navigation/boilerplate phrases."""
    boilerplate = [
        r'skip to (main )?content',
        r'click here',
        r'read more',
        r'subscribe now',
        r'follow us',
        r'share this',
        r'print (this )?page',
        r'last updated',
        r'page \d+ of \d+',
        r'copyright \d{4}',
        r'all rights reserved',
        r'terms of (use|service)',
        r'privacy policy',
        r'home\s*\|',
        r'\|\s*home',
        r'search\s*\|',
        r'\|\s*search',
    ]
    for pattern in boilerplate:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    return text


def clean_text(text: str, aggressive: bool = False) -> str:
    """
    Apply full cleaning pipeline to text.
    
    Args:
        text: Raw text to clean
        aggressive: If True, apply more aggressive filtering
    """
    # Phase 1: Structural cleaning
    text = remove_html_tags(text)
    text = remove_html_entities(text)
    text = remove_navigation_boilerplate(text)
    
    # Phase 2: Artifact removal
    text = remove_css_artifacts(text)
    text = remove_special_characters(text)
    
    # Phase 3: Normalization
    text = normalize_whitespace(text)
    
    if aggressive:
        # Additional aggressive cleaning
        text = remove_duplicate_lines(text)
        # Remove lines that are mostly numbers or single characters
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            words = line.split()
            if len(words) < 2:
                continue
            # Skip lines that are mostly non-alphabetic
            alpha_ratio = sum(1 for c in line if c.isalpha()) / max(len(line), 1)
            if alpha_ratio < 0.5:
                continue
            cleaned_lines.append(line)
        text = '\n'.join(cleaned_lines)
    
    return text.strip()


def get_cleaning_stats(original: str, cleaned: str) -> dict:
    """Compute statistics about the cleaning process."""
    original_lines = original.split('\n')
    cleaned_lines = cleaned.split('\n')
    
    original_chars = len(original)
    cleaned_chars = len(cleaned)
    
    original_words = len(original.split())
    cleaned_words = len(cleaned.split())
    
    return {
        "original_chars": original_chars,
        "cleaned_chars": cleaned_chars,
        "chars_removed": original_chars - cleaned_chars,
        "percent_removed": round((original_chars - cleaned_chars) / original_chars * 100, 2) if original_chars > 0 else 0,
        "original_lines": len(original_lines),
        "cleaned_lines": len(cleaned_lines),
        "lines_removed": len(original_lines) - len(cleaned_lines),
        "original_words": original_words,
        "cleaned_words": cleaned_words,
        "words_removed": original_words - cleaned_words,
    }


# =============================================================================
# BATCH PROCESSING
# =============================================================================

def clean_corpus_file(
    input_path: Path,
    output_path: Path,
    aggressive: bool = False,
    backup: bool = True
) -> dict:
    """
    Clean a single corpus file.
    
    Args:
        input_path: Path to input file
        output_path: Path to output cleaned file
        aggressive: Apply aggressive cleaning
        backup: Create backup of original file
    
    Returns:
        Cleaning statistics
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Read original
    with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
        original_text = f.read()
    
    # Clean
    cleaned_text = clean_text(original_text, aggressive=aggressive)
    
    # Compute stats
    stats = get_cleaning_stats(original_text, cleaned_text)
    stats['input_file'] = str(input_path.name)
    stats['output_file'] = str(output_path.name)
    
    # Backup original if requested
    if backup:
        backup_path = input_path.with_suffix(input_path.suffix + '.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_text)
        stats['backup_file'] = str(backup_path.name)
    
    # Write cleaned version
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_text)
    
    return stats


def clean_all_corpora(
    corpora_dir: Path,
    output_dir: Optional[Path] = None,
    aggressive: bool = False
) -> dict:
    """
    Clean all corpus files in a directory.
    
    Args:
        corpora_dir: Directory containing corpus files
        output_dir: Directory for cleaned files (defaults to corpora_dir)
        aggressive: Apply aggressive cleaning
    
    Returns:
        Dictionary of cleaning statistics per file
    """
    if output_dir is None:
        output_dir = corpora_dir
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Files to clean
    corpus_files = [
        'kjv.txt',
        'enoch.txt',
        'thomas.txt',
        'hermetica.txt',
        'dead_sea_scrolls.txt',
        'nag_hammadi.txt',
    ]
    
    results = {}
    
    print("=" * 70)
    print("CORPUS CLEANING UTILITY")
    print("=" * 70)
    print(f"Input directory: {corpora_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Aggressive mode: {aggressive}")
    print()
    
    for filename in corpus_files:
        input_path = corpora_dir / filename
        output_path = output_dir / f"{Path(filename).stem}_cleaned{Path(filename).suffix}"
        
        if not input_path.exists():
            print(f"SKIP: {filename} (not found)")
            continue
        
        print(f"CLEANING: {filename}...")
        
        try:
            stats = clean_corpus_file(input_path, output_path, aggressive=aggressive)
            results[filename] = stats
            
            print(f"  Original: {stats['original_chars']:,} chars, {stats['original_lines']} lines")
            print(f"  Cleaned:  {stats['cleaned_chars']:,} chars, {stats['cleaned_lines']} lines")
            print(f"  Removed:  {stats['chars_removed']:,} chars ({stats['percent_removed']}%)")
            if 'backup_file' in stats:
                print(f"  Backup:   {stats['backup_file']}")
            print()
            
        except Exception as e:
            print(f"  ERROR: {e}")
            results[filename] = {"error": str(e)}
    
    # Save cleaning report
    report_path = output_dir / 'cleaning_report.json'
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("=" * 70)
    print(f"CLEANING COMPLETE: {len(results)} files processed")
    print(f"Report saved to: {report_path}")
    print("=" * 70)
    
    return results


# =============================================================================
# DEMONSTRATION
# =============================================================================

if __name__ == "__main__":
    # Clean all corpora
    corpora_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "bible-analysis"
    output_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "bible-analysis"
    
    results = clean_all_corpora(
        corpora_dir=corpora_dir,
        output_dir=output_dir,
        aggressive=True
    )
    
    print("\nCleaning statistics:")
    for filename, stats in results.items():
        if "error" not in stats:
            print(f"  {filename}: {stats['percent_removed']}% removed")
