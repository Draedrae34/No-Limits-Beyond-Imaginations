#!/usr/bin/env python3
"""
PILLAR 2: AI PATTERN RECOGNITION IN ANCIENT TEXTS
==================================================
Goal: Use ML to find patterns humans have missed for millennia.

Approach:
- Train custom transformers on ancient corpora
- Implement anomaly detection algorithms
- Cross-reference patterns across unrelated text families
- Validate findings against historical/astronomical records

Deliverable: Published findings + open-source pattern detection toolkit
"""

import hashlib
import json
import math
import os
import random
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


# =============================================================================
# TEXT PROCESSING UTILITIES
# =============================================================================

def tokenize(text: str) -> list[str]:
    """Tokenize text into words."""
    return re.findall(r"[a-zA-Z']+", text.lower())


def segment_text(words: list[str], window_size: int = 500, max_segments: int = 300) -> list[list[str]]:
    """Segment text into overlapping windows."""
    if not words:
        return []
    step = max(1, len(words) // max_segments)
    segments = []
    for start in range(0, len(words), step):
        segment = words[start:start + window_size]
        if len(segment) >= window_size // 2:
            segments.append(segment)
        if len(segments) >= max_segments:
            break
    if not segments:
        segments.append(words)
    return segments


def load_text(filepath: str) -> str:
    """Load text from file, stripping Project Gutenberg headers/footers."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # Strip Project Gutenberg header/footer (handles both *** and plain formats)
    # Start marker: "START OF THE PROJECT GUTENBERG EBOOK" (optionally with *** around it)
    start_match = re.search(r'(?:\*\*\*\s*)?START\s+OF\s+(?:THE\s+)?PROJECT\s+GUTENBERG(?:\s+E[A-Z]?BOOK)?\s+\d*\s*', content, re.IGNORECASE)
    if start_match:
        content = content[start_match.end():]
    
    # End marker: "END OF THE PROJECT GUTENBERG EBOOK" (optionally with *** around it)
    end_match = re.search(r'\s*(?:\*\*\*\s*)?END\s+OF\s+(?:THE\s+)?PROJECT\s+GUTENBERG(?:\s+E[A-Z]?BOOK)?\s*\d*\s*(?:\*\*\*)?', content, re.IGNORECASE)
    if end_match:
        content = content[:end_match.start()]
    
    return content.strip()


# =============================================================================
# ANOMALY DETECTION
# =============================================================================

def type_token_ratio(segment: list[str]) -> float:
    """Compute Type-Token Ratio for a segment."""
    types = set(segment)
    tokens = len(segment)
    return len(types) / tokens if tokens else 0.0


def hapax_legomena(segment: list[str]) -> int:
    """Count words that appear exactly once in segment."""
    counts = Counter(segment)
    return sum(1 for c in counts.values() if c == 1)


def burstiness_score(term: str, segments: list[list[str]]) -> float:
    """
    Compute burstiness: how clustered a term's distribution is.
    High burstiness = term appears in tight clusters, not evenly distributed.
    """
    if not segments:
        return 0.0
    
    presence = [1 if term in seg else 0 for seg in segments]
    n = len(presence)
    mean = sum(presence) / n
    
    if mean == 0 or mean == 1:
        return 0.0
    
    variance = sum((x - mean) ** 2 for x in presence) / n
    return (variance - mean) / (mean * (1 - mean)) if mean * (1 - mean) > 0 else 0.0


def function_word_vector(segment: list[str]) -> dict:
    """Create function word frequency vector."""
    FUNCTION_WORDS = {
        "the", "and", "of", "to", "in", "that", "is", "was", "he", "for", "it", "with",
        "as", "his", "on", "be", "at", "by", "i", "this", "had", "not", "are", "but",
        "from", "or", "have", "an", "they", "which", "one", "you", "were", "all", "her",
        "she", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who",
        "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just",
        "him", "know", "take", "people", "into", "year", "your", "good", "some", "could",
        "them", "see", "other", "than", "then", "now", "look", "only", "come", "its",
        "over", "think", "also", "back", "after", "use", "two", "how", "our", "work",
        "first", "well", "way", "even", "new", "want", "because", "any", "these", "give",
        "most", "us", "been", "has", "had", "were", "said", "each", "does", "did", "shall",
        "unto", "thou", "thee", "thy", "ye", "hath", "doth", "art", "wilt", "shalt",
        "might", "shall", "soever", "behold", "verily", "hence", "thus", "yet", "therefore",
        "am", "being", "been", "having", "do", "did", "done", "shall", "will", "would",
        "should", "may", "might", "must", "can", "could", "ought", "need", "dare",
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p",
        "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
    }
    counts = Counter(segment)
    vec = {w: counts.get(w, 0) for w in FUNCTION_WORDS}
    total = sum(vec.values())
    if total > 0:
        vec = {w: c / total for w, c in vec.items()}
    return vec


def cosine_similarity(v1: dict, v2: dict) -> float:
    """Compute cosine similarity between two vectors."""
    keys = set(v1) & set(v2)
    if not keys:
        return 0.0
    dot = sum(v1[k] * v2[k] for k in keys)
    mag1 = math.sqrt(sum(v1[k] ** 2 for k in keys))
    mag2 = math.sqrt(sum(v2[k] ** 2 for k in keys))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


# =============================================================================
# CUSTOM TRANSFORMER PIPELINE
# =============================================================================

@dataclass
class TextFeatures:
    """Extracted features from a text segment."""
    ttr: float = 0.0
    hapax: int = 0
    avg_word_length: float = 0.0
    hapax_ratio: float = 0.0
    function_word_vector: dict = field(default_factory=dict)
    burstiness_scores: dict = field(default_factory=dict)
    
    def to_vector(self) -> list[float]:
        """Convert features to fixed-length vector for ML."""
        vec = [
            self.ttr,
            self.hapax / 100.0,  # Normalize
            self.avg_word_length / 20.0,  # Normalize
            self.hapax_ratio,
        ]
        # Add top 20 function word frequencies
        fw_items = sorted(self.function_word_vector.items(), key=lambda x: -x[1])[:20]
        vec.extend([v for _, v in fw_items])
        return vec


class AncientTextTransformer:
    """
    Custom transformer for ancient text pattern detection.
    """
    
    def __init__(self):
        self.vocab = {}
        self.vocab_size = 0
        self.segment_embeddings = {}
        self.fitted = False
    
    def fit(self, texts: dict[str, list[list[str]]]):
        """
        Fit transformer on segmented texts.
        
        Args:
            texts: Dict mapping corpus name to list of tokenized segments
        """
        all_words = set()
        for corpus_name, segments in texts.items():
            for seg in segments:
                all_words.update(seg)
        
        self.vocab = {word: i for i, word in enumerate(sorted(all_words))}
        self.vocab_size = len(self.vocab)
        self.fitted = True
        print(f"[Pillar 2] Transformer fitted on {self.vocab_size} unique words")
    
    def transform_segment(self, segment: list[str]) -> list[float]:
        """Transform a text segment into feature vector."""
        features = self._extract_features(segment)
        return features.to_vector()
    
    def _extract_features(self, segment: list[str]) -> TextFeatures:
        """Extract rich feature set from segment."""
        ttr = type_token_ratio(segment)
        hapax = hapax_legomena(segment)
        avg_len = sum(len(w) for w in segment) / len(segment) if segment else 0
        hapax_ratio = hapax / len(segment) if segment else 0
        fw_vec = function_word_vector(segment)
        
        # Compute burstiness for top content words
        burstiness = {}
        word_counts = Counter(segment)
        for word, count in word_counts.most_common(50):
            if count > 5 and word not in fw_vec:
                burstiness[word] = 0.0  # Placeholder, computed later with full corpus
        
        return TextFeatures(
            ttr=ttr,
            hapax=hapax,
            avg_word_length=avg_len,
            hapax_ratio=hapax_ratio,
            function_word_vector=fw_vec,
            burstiness_scores=burstiness
        )
    
    def compute_corpus_embeddings(self, texts: dict[str, list[list[str]]]) -> dict[str, list[float]]:
        """Compute corpus-level embeddings."""
        if not self.fitted:
            raise ValueError("Transformer not fitted")
        
        embeddings = {}
        for corpus_name, segments in texts.items():
            segment_vectors = [self.transform_segment(seg) for seg in segments]
            if segment_vectors:
                # Average segment vectors
                dim = len(segment_vectors[0])
                corpus_vec = [sum(v[i] for v in segment_vectors) / len(segment_vectors) 
                             for i in range(dim)]
                embeddings[corpus_name] = corpus_vec
        return embeddings


# =============================================================================
# CROSS-TEXT PATTERN MINING
# =============================================================================

class CrossTextPatternMiner:
    """
    Mine patterns across unrelated text families.
    """
    
    def __init__(self):
        self.patterns = defaultdict(list)
        self.corpus_stats = {}
    
    def analyze_corpus(self, name: str, segments: list[list[str]]):
        """Analyze a corpus for distinctive patterns."""
        # Word frequency distribution
        all_words = [w for seg in segments for w in seg]
        word_freq = Counter(all_words)
        total_words = len(all_words)
        
        self.corpus_stats[name] = {
            "total_words": total_words,
            "unique_words": len(word_freq),
            "top_words": word_freq.most_common(100),
            "avg_segment_length": total_words / len(segments) if segments else 0
        }
        
        # Detect distinctive words (high frequency in this corpus, low in others)
        self.patterns[name] = {
            "distinctive_words": [],
            "shared_vocabulary": {},
            "unique_phrases": []
        }
    
    def find_shared_patterns(self, corpus_a: str, corpus_b: str) -> dict:
        """Find patterns shared between two corpora."""
        if corpus_a not in self.corpus_stats or corpus_b not in self.corpus_stats:
            return {"error": "Corpora not analyzed"}
        
        words_a = set(w for w, _ in self.corpus_stats[corpus_a]["top_words"])
        words_b = set(w for w, _ in self.corpus_stats[corpus_b]["top_words"])
        
        shared = words_a & words_b
        unique_a = words_a - words_b
        unique_b = words_b - words_a
        
        return {
            "shared_count": len(shared),
            "unique_a_count": len(unique_a),
            "unique_b_count": len(unique_b),
            "jaccard_similarity": len(shared) / len(words_a | words_b) if words_a | words_b else 0,
            "shared_words": list(shared)[:50]
        }
    
    def detect_authorial_layers(self, segments: list[list[str]], corpus_name: str) -> dict:
        """
        Detect potential multiple authorship within a corpus.
        Uses vocabulary shift analysis between segments.
        """
        if len(segments) < 10:
            return {"error": "Need at least 10 segments for layer detection"}
        
        # Compute vocabulary richness per segment
        ttrs = [type_token_ratio(seg) for seg in segments]
        
        # Detect abrupt changes in TTR
        shifts = []
        for i in range(1, len(ttrs)):
            shift = abs(ttrs[i] - ttrs[i-1])
            shifts.append({"position": i, "shift_magnitude": shift})
        
        # Sort by shift magnitude
        shifts.sort(key=lambda x: -x["shift_magnitude"])
        
        return {
            "corpus": corpus_name,
            "segments_analyzed": len(segments),
            "mean_ttr": sum(ttrs) / len(ttrs),
            "ttr_std": math.sqrt(sum((t - sum(ttrs)/len(ttrs))**2 for t in ttrs) / len(ttrs)),
            "top_shifts": shifts[:10],
            "potential_layers": len([s for s in shifts if s["shift_magnitude"] > 0.1])
        }


# =============================================================================
# HISTORICAL/ASTRONOMICAL VALIDATION
# =============================================================================

class HistoricalValidator:
    """
    Validate patterns against historical and astronomical records.
    """
    
    def __init__(self):
        self.historical_events = {}
        self.astronomical_data = {}
    
    def load_historical_events(self, events: list[dict]):
        """Load historical events for correlation."""
        for event in events:
            self.historical_events[event["name"]] = event
    
    def load_astronomical_data(self, data: list[dict]):
        """Load astronomical data for correlation."""
        for entry in data:
            self.astronomical_data[entry["date"]] = entry
    
    def validate_correlation(self, pattern_date: str, event_name: str, window_years: int = 50) -> dict:
        """
        Check if a detected pattern correlates with a historical event.
        """
        if event_name not in self.historical_events:
            return {"error": "Event not found"}
        
        event = self.historical_events[event_name]
        event_date = event.get("date")
        
        # Simple date proximity check
        # In production, use proper date parsing and astronomical calculations
        return {
            "pattern_date": pattern_date,
            "event": event_name,
            "event_date": event_date,
            "window_years": window_years,
            "correlation": "pending_implementation"
        }
    
    def check_astronomical_alignment(self, text_date: str, celestial_body: str) -> dict:
        """
        Check if text date aligns with astronomical event.
        """
        return {
            "text_date": text_date,
            "celestial_body": celestial_body,
            "alignment": "pending_implementation",
            "note": "Requires ephemeris data and proper date parsing"
        }


# =============================================================================
# MAIN ANALYSIS ENGINE
# =============================================================================

@dataclass
class CorpusAnalysis:
    """Results from analyzing a single corpus."""
    name: str
    total_segments: int
    total_words: int
    unique_words: int
    mean_ttr: float
    ttr_std: float
    top_bursty_terms: list[dict]
    cross_corpus_patterns: dict
    historical_validations: list[dict]
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "total_segments": self.total_segments,
            "total_words": self.total_words,
            "unique_words": self.unique_words,
            "mean_ttr": round(self.mean_ttr, 4),
            "ttr_std": round(self.ttr_std, 4),
            "top_bursty_terms": self.top_bursty_terms[:10],
            "cross_corpus_patterns": self.cross_corpus_patterns,
            "historical_validations": self.historical_validations
        }


class PatternRecognitionEngine:
    """
    Main engine for Pillar 2: AI Pattern Recognition in Ancient Texts.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.transformer = AncientTextTransformer()
        self.miner = CrossTextPatternMiner()
        self.validator = HistoricalValidator()
        self.texts: dict[str, list[list[str]]] = {}
        self.analyses: list[CorpusAnalysis] = []
    
    def load_corpus(self, name: str, text: str, window_size: int = 500, max_segments: int = 300):
        """Load and segment a corpus."""
        words = tokenize(text)
        segments = segment_text(words, window_size, max_segments)
        self.texts[name] = segments
        print(f"[Pillar 2] Loaded corpus: {name} ({len(segments)} segments, {len(words)} words)")
    
    def analyze_all(self) -> list[CorpusAnalysis]:
        """Run complete analysis on all loaded corpora."""
        if not self.texts:
            raise ValueError("No corpora loaded")
        
        # Fit transformer
        print("\n[Pillar 2] Fitting transformer...")
        self.transformer.fit(self.texts)
        
        # Cross-corpus analysis must run before per-corpus analysis,
        # because _analyze_corpus() calls find_shared_patterns() which
        # depends on miner.analyze_corpus() having populated corpus_stats
        print("\n[Pillar 2] Mining cross-corpus patterns...")
        self._cross_corpus_analysis()
        
        # Analyze each corpus
        print("\n[Pillar 2] Analyzing corpora...")
        for name, segments in self.texts.items():
            analysis = self._analyze_corpus(name, segments)
            self.analyses.append(analysis)
        
        return self.analyses
    
    def _analyze_corpus(self, name: str, segments: list[list[str]]) -> CorpusAnalysis:
        """Analyze a single corpus."""
        print(f"\n  Analyzing: {name}")
        
        # Basic stats
        all_words = [w for seg in segments for w in seg]
        total_words = len(all_words)
        unique_words = len(set(all_words))
        ttrs = [type_token_ratio(seg) for seg in segments]
        mean_ttr = sum(ttrs) / len(ttrs) if ttrs else 0
        ttr_std = math.sqrt(sum((t - mean_ttr)**2 for t in ttrs) / len(ttrs)) if ttrs else 0
        
        # Burstiness analysis
        print("    Computing burstiness scores...")
        word_counts = Counter(all_words)
        bursty_terms = []
        for word, count in word_counts.most_common(200):
            if count > 10 and len(word) > 3:
                score = burstiness_score(word, segments)
                bursty_terms.append({"term": word, "count": count, "burstiness": round(score, 4)})
        
        bursty_terms.sort(key=lambda x: -x["burstiness"])
        
        # Cross-corpus patterns
        print("    Finding cross-corpus patterns...")
        cross_patterns = {}
        for other_name in self.texts:
            if other_name != name:
                cross_patterns[other_name] = self.miner.find_shared_patterns(name, other_name)
        
        # Authorial layer detection
        print("    Detecting authorial layers...")
        layers = self.miner.detect_authorial_layers(segments, name)
        
        analysis = CorpusAnalysis(
            name=name,
            total_segments=len(segments),
            total_words=total_words,
            unique_words=unique_words,
            mean_ttr=mean_ttr,
            ttr_std=ttr_std,
            top_bursty_terms=bursty_terms[:20],
            cross_corpus_patterns=cross_patterns,
            historical_validations=[]
        )
        
        return analysis
    
    def _cross_corpus_analysis(self):
        """Perform cross-corpus pattern mining."""
        for name, segments in self.texts.items():
            self.miner.analyze_corpus(name, segments)
    
    def save_results(self, filename: str = "pillar2_results.json"):
        """Save analysis results."""
        output_path = self.output_dir / filename
        data = {
            "pillar": "Pillar 2: AI Pattern Recognition in Ancient Texts",
            "generated": datetime.utcnow().isoformat() + "Z",
            "corpora_analyzed": len(self.analyses),
            "analyses": [a.to_dict() for a in self.analyses]
        }
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"\n[Pillar 2] Results saved to {output_path}")
        return output_path
    
    def generate_report(self) -> str:
        """Generate analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 2: AI PATTERN RECOGNITION - ANALYSIS REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            f"Corpora analyzed: {len(self.analyses)}",
            ""
        ]
        
        for analysis in self.analyses:
            lines.append(f"Corpus: {analysis.name}")
            lines.append(f"  Segments: {analysis.total_segments}")
            lines.append(f"  Words: {analysis.total_words}")
            lines.append(f"  Unique words: {analysis.unique_words}")
            lines.append(f"  Mean TTR: {analysis.mean_ttr:.4f}")
            lines.append(f"  TTR std dev: {analysis.ttr_std:.4f}")
            lines.append(f"  Top bursty terms: {[t['term'] for t in analysis.top_bursty_terms[:5]]}")
            
            # Cross-corpus highlights
            if analysis.cross_corpus_patterns:
                lines.append("  Cross-corpus similarities:")
                for other, pattern in list(analysis.cross_corpus_patterns.items())[:3]:
                    lines.append(f"    {other}: Jaccard={pattern.get('jaccard_similarity', 0):.3f}")
            
            lines.append("")
        
        lines.append("=" * 70)
        lines.append("CONCLUSION")
        lines.append("=" * 70)
        lines.append("Pillar 2 framework operational. Ready for full corpus analysis.")
        
        return "\n".join(lines)


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run Pillar 2 demonstration with real ancient text corpora."""
    print("=" * 70)
    print("PILLAR 2: AI PATTERN RECOGNITION - DEMONSTRATION")
    print("=" * 70)
    
    engine = PatternRecognitionEngine(output_dir="research/pillars/pillar2_ai_pattern/outputs")
    
    # Load real ancient text corpora from bible-analysis/
    print("\n[1] Loading real ancient text corpora...")
    
    corpora_dir = Path(__file__).resolve().parent.parent.parent.parent / "bible-analysis"
    
    text_files = {
        "KJV Bible": "kjv.txt",
        "Book of Enoch": "enoch.txt",
        "Gospel of Thomas": "thomas.txt",
        "Corpus Hermeticum": "hermetica.txt",
        "Dead Sea Scrolls": "dead_sea_scrolls.txt",
        "Nag Hammadi Library": "nag_hammadi.txt",
    }
    
    loaded_count = 0
    for display_name, filename in text_files.items():
        filepath = corpora_dir / filename
        if filepath.exists():
            try:
                content = load_text(str(filepath))
                
                engine.load_corpus(display_name, content, window_size=500, max_segments=300)
                print(f"  Loaded {display_name}: {len(content):,} chars")
                
                loaded_count += 1
            except Exception as e:
                print(f"  Error loading {display_name}: {e}")
        else:
            print(f"  File not found: {filepath}")
    
    if loaded_count == 0:
        print("\n  WARNING: No corpora loaded. Check file paths.")
        return None
    
    # Run analysis
    print(f"\n[2] Running analysis on {len(engine.texts)} corpora...")
    results = engine.analyze_all()
    
    # Display report
    print("\n" + engine.generate_report())
    
    # Save results
    engine.save_results("pillar2_full_corpora_results.json")
    
    print("\n" + "=" * 70)
    print("PILLAR 2 FRAMEWORK READY")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Implement neural language model integration")
    print("2. Add astronomical dating validation")
    print("3. Develop pattern detection toolkit for public release")
    print("4. Train custom transformer on full corpora")
    print("5. Implement cross-text anomaly detection")
    print("6. Validate findings against known non-encoded texts")
    
    return engine


if __name__ == "__main__":
    run_demonstration()
