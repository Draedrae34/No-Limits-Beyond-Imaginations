#!/usr/bin/env python3
"""
PILLAR 4: THE SIMULATION SIGNATURE
====================================
Goal: Find statistical evidence of intentional encoding in ancient texts.

Approach:
- Entropy analysis of letter/word distributions
- Correlation analysis with mathematical constants
- Comparison against known natural language baselines
- Statistical significance testing

Deliverable: Statistical proof (or disproof) of non-random encoding
"""

import hashlib
import json
import math
import random
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


# =============================================================================
# ENTROPY ANALYSIS
# =============================================================================

def shannon_entropy(sequence: list) -> float:
    """Compute Shannon entropy of a sequence."""
    if not sequence:
        return 0.0
    counts = Counter(sequence)
    total = len(sequence)
    entropy = 0.0
    for count in counts.values():
        p = count / total
        entropy -= p * math.log2(p)
    return entropy


def letter_frequency_entropy(text: str) -> float:
    """Compute entropy of letter frequency distribution."""
    letters = [c.lower() for c in text if c.isalpha()]
    return shannon_entropy(letters)


def word_length_entropy(text: str) -> float:
    """Compute entropy of word length distribution."""
    words = re.findall(r'\b\w+\b', text.lower())
    lengths = [len(w) for w in words]
    return shannon_entropy(lengths)


def bigram_entropy(text: str) -> float:
    """Compute entropy of letter bigrams."""
    letters = [c.lower() for c in text if c.isalpha()]
    bigrams = [letters[i] + letters[i+1] for i in range(len(letters)-1)]
    return shannon_entropy(bigrams)


def trigram_entropy(text: str) -> float:
    """Compute entropy of letter trigrams."""
    letters = [c.lower() for c in text if c.isalpha()]
    trigrams = [letters[i] + letters[i+1] + letters[i+2] for i in range(len(letters)-2)]
    return shannon_entropy(trigrams)


# =============================================================================
# MATHEMATICAL CONSTANT CORRELATION
# =============================================================================

def text_to_numeric_sequence(text: str, method: str = "ordinal") -> list[float]:
    """
    Convert text to numeric sequence for correlation analysis.
    
    Methods:
    - "ordinal": ASCII/Unicode values
    - "digital_root": Base-9 digital root (1-9)
    - "mod10": Last digit of ASCII value (0-9)
    - "position": Word position index
    - "length": Word length
    """
    if method == "ordinal":
        return [ord(c) for c in text if c.strip()]
    elif method == "digital_root":
        def dr(n):
            if n == 0:
                return 0
            return 1 + ((n - 1) % 9)
        return [dr(ord(c)) for c in text if c.strip()]
    elif method == "mod10":
        return [ord(c) % 10 for c in text if c.strip()]
    elif method == "position":
        words = re.findall(r'\b\w+\b', text)
        return list(range(len(words)))
    elif method == "length":
        words = re.findall(r'\b\w+\b', text)
        return [len(w) for w in words]
    else:
        raise ValueError(f"Unknown method: {method}")


def correlation_with_constant(
    sequence: list[float],
    constant_func,
    name: str,
    max_offset: int = 100
) -> dict:
    """
    Compute similarity between text sequence digit distribution and a mathematical constant.
    
    Uses frequency distribution comparison instead of raw correlation
    to avoid scale mismatch issues.
    """
    if len(sequence) < 10:
        return {"constant": name, "error": "sequence too short"}
    
    # Get text digit frequencies (0-9)
    text_digits = [int(v) % 10 for v in sequence]
    text_counts = [text_digits.count(d) for d in range(10)]
    text_total = sum(text_counts)
    text_freq = [c / text_total for c in text_counts] if text_total > 0 else [0.1] * 10
    
    # Generate constant digits and get their frequency distribution
    constant_digits = [constant_func(i) % 10 for i in range(len(sequence) + max_offset)]
    
    best_similarity = -1
    best_offset = 0
    
    # Test different offsets to find best alignment
    for offset in range(0, min(max_offset, len(constant_digits) - len(sequence))):
        window = constant_digits[offset:offset + len(sequence)]
        
        const_counts = [window.count(d) for d in range(10)]
        const_total = sum(const_counts)
        const_freq = [c / const_total for c in const_counts] if const_total > 0 else [0.1] * 10
        
        # Compute cosine similarity between frequency distributions
        dot = sum(t * c for t, c in zip(text_freq, const_freq))
        mag_t = math.sqrt(sum(t * t for t in text_freq))
        mag_c = math.sqrt(sum(c * c for c in const_freq))
        
        if mag_t == 0 or mag_c == 0:
            continue
        
        cosine_sim = dot / (mag_t * mag_c)
        
        if cosine_sim > best_similarity:
            best_similarity = cosine_sim
            best_offset = offset
    
    return {
        "constant": name,
        "similarity": round(best_similarity, 6),
        "best_offset": best_offset,
        "sequence_length": len(sequence),
        "significant": best_similarity > 0.85
    }


def pi_digit(n: int) -> int:
    """Generate nth digit of pi (simplified - uses known digits)."""
    pi_digits = "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
    return int(pi_digits[n % len(pi_digits)])


def e_digit(n: int) -> int:
    """Generate nth digit of e."""
    e_digits = "27182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274"
    return int(e_digits[n % len(e_digits)])


def phi_digit(n: int) -> int:
    """Generate nth digit of golden ratio phi."""
    phi_digits = "6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374"
    return int(phi_digits[n % len(phi_digits)])


def sqrt2_digit(n: int) -> int:
    """Generate nth digit of sqrt(2)."""
    sqrt2_digits = "4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727"
    return int(sqrt2_digits[n % len(sqrt2_digits)])


# =============================================================================
# NATURAL LANGUAGE BASELINE
# =============================================================================

class NaturalLanguageBaseline:
    """
    Generate and compare against natural language baselines.
    """
    
    def __init__(self):
        self.baselines = {}
    
    def generate_random_baseline(self, length: int, method: str = "ordinal") -> list[float]:
        """Generate random baseline of specified length."""
        if method == "ordinal":
            return [random.randint(97, 122) for _ in range(length)]  # a-z
        elif method == "digital_root":
            return [random.randint(1, 9) for _ in range(length)]
        else:
            return [random.random() for _ in range(length)]
    
    def generate_markov_baseline(self, length: int, order: int = 2) -> list[float]:
        """
        Generate Markov chain baseline from letter frequencies.
        In production, train on large English corpus.
        """
        # Simplified: use random walk with small steps
        current = random.randint(97, 122)
        sequence = [current]
        for _ in range(length - 1):
            step = random.randint(-3, 3)
            current = max(97, min(122, current + step))
            sequence.append(current)
        return sequence
    
    def compare_against_baselines(self, text_sequence: list[float], n_baselines: int = 1000) -> dict:
        """
        Compare text entropy against random baselines.
        Returns percentile ranking.
        """
        text_entropy = shannon_entropy(text_sequence)
        
        baseline_entropies = []
        for _ in range(n_baselines):
            baseline = self.generate_random_baseline(len(text_sequence))
            baseline_entropies.append(shannon_entropy(baseline))
        
        # Calculate percentile
        count_lower = sum(1 for e in baseline_entropies if e < text_entropy)
        percentile = count_lower / n_baselines * 100
        
        return {
            "text_entropy": round(text_entropy, 4),
            "baseline_mean": round(sum(baseline_entropies) / len(baseline_entropies), 4),
            "baseline_std": round(math.sqrt(sum((e - sum(baseline_entropies)/len(baseline_entropies))**2 
                                                for e in baseline_entropies) / len(baseline_entropies)), 4),
            "percentile": round(percentile, 2),
            "interpretation": self._interpret_percentile(percentile)
        }
    
    def _interpret_percentile(self, percentile: float) -> str:
        if percentile < 5:
            return "much lower than random - expected for structured natural language"
        elif percentile < 10:
            return "somewhat lower than random - may indicate structure"
        elif percentile > 95:
            return "much higher than random - may indicate compression or encoding"
        elif percentile > 90:
            return "somewhat higher than random - worth investigation"
        else:
            return "consistent with structured natural language"


# =============================================================================
# STATISTICAL SIGNIFICANCE TESTING
# =============================================================================

def permutation_test(
    observed_statistic: float,
    text_sequence: list[float],
    n_permutations: int = 10000,
    test_func=shannon_entropy
) -> dict:
    """
    Perform permutation test for statistical significance.
    
    Args:
        observed_statistic: The observed test statistic
        text_sequence: The original text sequence
        n_permutations: Number of permutations to generate
        test_func: Function to compute test statistic
    """
    # Generate null distribution by random permutation
    null_stats = []
    seq_length = len(text_sequence)
    
    for _ in range(n_permutations):
        permuted = text_sequence.copy()
        random.shuffle(permuted)
        null_stats.append(test_func(permuted))
    
    # Calculate p-value (two-tailed)
    count_extreme = sum(1 for s in null_stats if abs(s) >= abs(observed_statistic))
    p_value = count_extreme / n_permutations
    
    return {
        "observed": round(observed_statistic, 4),
        "null_mean": round(sum(null_stats) / len(null_stats), 4),
        "null_std": round(math.sqrt(sum((s - sum(null_stats)/len(null_stats))**2 
                                         for s in null_stats) / len(null_stats)), 4),
        "p_value": round(p_value, 6),
        "significant_at_0.05": p_value < 0.05,
        "significant_at_0.01": p_value < 0.01,
        "n_permutations": n_permutations
    }


# =============================================================================
# MAIN ANALYSIS ENGINE
# =============================================================================

@dataclass
class TextAnalysis:
    """Results from analyzing a single text."""
    name: str
    text: str
    letter_entropy: float = 0.0
    word_length_entropy: float = 0.0
    bigram_entropy: float = 0.0
    trigram_entropy: float = 0.0
    constant_correlations: list[dict] = field(default_factory=list)
    baseline_comparison: dict = field(default_factory=dict)
    significance_tests: list[dict] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "text_length": len(self.text),
            "letter_entropy": self.letter_entropy,
            "word_length_entropy": self.word_length_entropy,
            "bigram_entropy": self.bigram_entropy,
            "trigram_entropy": self.trigram_entropy,
            "constant_correlations": self.constant_correlations,
            "baseline_comparison": self.baseline_comparison,
            "significance_tests": self.significance_tests
        }


class SimulationSignatureAnalyzer:
    """
    Main analysis engine for Pillar 4: The Simulation Signature.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.texts: dict[str, str] = {}
        self.analyses: list[TextAnalysis] = []
        self.baseline = NaturalLanguageBaseline()
    
    def load_text(self, name: str, content: str):
        """Load a text for analysis."""
        self.texts[name] = content
        print(f"[Pillar 4] Loaded text: {name} ({len(content)} chars)")
    
    def analyze_text(self, name: str) -> TextAnalysis:
        """Run complete analysis on a loaded text."""
        if name not in self.texts:
            raise ValueError(f"Text '{name}' not loaded")
        
        text = self.texts[name]
        analysis = TextAnalysis(name=name, text=text)
        
        print(f"\n[Pillar 4] Analyzing: {name}")
        
        # Entropy analysis
        print("  Computing entropy measures...")
        analysis.letter_entropy = letter_frequency_entropy(text)
        analysis.word_length_entropy = word_length_entropy(text)
        analysis.bigram_entropy = bigram_entropy(text)
        analysis.trigram_entropy = trigram_entropy(text)
        
        # Constant correlation
        print("  Testing correlations with mathematical constants...")
        mod10_seq = text_to_numeric_sequence(text, "mod10")
        constants = [
            ("pi", pi_digit),
            ("e", e_digit),
            ("phi", phi_digit),
            ("sqrt2", sqrt2_digit)
        ]
        
        for const_name, const_func in constants:
            corr = correlation_with_constant(mod10_seq, const_func, const_name, max_offset=20)
            analysis.constant_correlations.append(corr)
            if corr.get("significant"):
                print(f"    *** SIGNIFICANT correlation with {const_name}: {corr['similarity']} ***")
        
        # Baseline comparison
        print("  Comparing against random baselines...")
        ordinal_sequence = text_to_numeric_sequence(text, "ordinal")
        analysis.baseline_comparison = self.baseline.compare_against_baselines(ordinal_sequence, n_baselines=100)
        
        # Significance tests
        print("  Running permutation tests...")
        letter_seq = text_to_numeric_sequence(text, "ordinal")
        sig_test = permutation_test(analysis.letter_entropy, letter_seq, n_permutations=1000)
        analysis.significance_tests.append({
            "test": "letter_entropy_permutation",
            "result": sig_test
        })
        
        self.analyses.append(analysis)
        return analysis
    
    def analyze_all(self) -> list[TextAnalysis]:
        """Analyze all loaded texts."""
        for name in self.texts:
            self.analyze_text(name)
        return self.analyses
    
    def save_results(self, filename: str = "pillar4_results.json"):
        """Save analysis results to JSON."""
        output_path = self.output_dir / filename
        
        data = {
            "pillar": "Pillar 4: The Simulation Signature",
            "generated": datetime.utcnow().isoformat() + "Z",
            "texts_analyzed": len(self.analyses),
            "analyses": [a.to_dict() for a in self.analyses]
        }
        
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"\n[Pillar 4] Results saved to {output_path}")
        return output_path
    
    def generate_report(self) -> str:
        """Generate human-readable analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 4: THE SIMULATION SIGNATURE - ANALYSIS REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            f"Texts analyzed: {len(self.analyses)}",
            ""
        ]
        
        for analysis in self.analyses:
            lines.append(f"Text: {analysis.name}")
            lines.append(f"  Length: {len(analysis.text)} characters")
            lines.append(f"  Letter entropy: {analysis.letter_entropy:.4f}")
            lines.append(f"  Word length entropy: {analysis.word_length_entropy:.4f}")
            lines.append(f"  Bigram entropy: {analysis.bigram_entropy:.4f}")
            lines.append(f"  Trigram entropy: {analysis.trigram_entropy:.4f}")
            
            # Significant correlations
            sig_corrs = [c for c in analysis.constant_correlations if c.get("significant")]
            if sig_corrs:
                lines.append("  *** SIGNIFICANT CONSTANT CORRELATIONS ***")
                for corr in sig_corrs:
                    lines.append(f"    {corr['constant']}: similarity={corr['similarity']} at offset {corr['best_offset']}")
            
            # Baseline comparison
            if analysis.baseline_comparison:
                bc = analysis.baseline_comparison
                lines.append(f"  Baseline comparison: {bc['percentile']}th percentile")
                lines.append(f"    Interpretation: {bc['interpretation']}")
            
            lines.append("")
        
        lines.append("=" * 70)
        lines.append("CONCLUSION")
        lines.append("=" * 70)
        
        significant_texts = sum(1 for a in self.analyses 
                               if any(c.get("significant") for c in a.constant_correlations))
        lines.append(f"Texts with significant constant correlations: {significant_texts}/{len(self.analyses)}")
        
        if significant_texts > 0:
            lines.append("STATUS: Potential simulation signatures detected.")
            lines.append("NOTE: Requires further validation and peer review.")
        else:
            lines.append("STATUS: No strong evidence of non-random encoding detected.")
        
        return "\n".join(lines)


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run Pillar 4 demonstration with real ancient text corpora."""
    print("=" * 70)
    print("PILLAR 4: THE SIMULATION SIGNATURE - DEMONSTRATION")
    print("=" * 70)
    
    analyzer = SimulationSignatureAnalyzer(output_dir="research/pillars/pillar4_simulation/outputs")
    
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
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # For large texts, sample first 100KB for demo performance
                if len(content) > 100000:
                    sample = content[:100000]
                    analyzer.load_text(f"{display_name} (sample)", sample)
                    print(f"  Loaded {display_name}: {len(content):,} chars (using first 100KB sample)")
                else:
                    analyzer.load_text(display_name, content)
                    print(f"  Loaded {display_name}: {len(content):,} chars")
                
                loaded_count += 1
            except Exception as e:
                print(f"  Error loading {display_name}: {e}")
        else:
            print(f"  File not found: {filepath}")
    
    if loaded_count == 0:
        print("\n  WARNING: No corpora loaded. Falling back to sample texts.")
        sample_texts = {
            "genesis_sample": "In the beginning God created the heaven and the earth And the earth was without form and void and darkness was upon the face of the deep And the Spirit of God moved upon the face of the waters",
            "enoch_sample": "And it came to pass when the children of men had multiplied that in those days there were born unto them fair and beautiful daughters and the angels the sons of heaven saw them and desired them",
            "thomas_sample": "Jesus said If those who lead you say to you See the kingdom is in the sky then the birds of the sky will precede you But the kingdom is inside you and it is outside you",
            "hermetica_sample": "I am Pymander the Mind of the Supreme I know what you wish for you wish to hear the truth and the truth is this The One is all and through its will all things are",
            "random_control": "The quick brown fox jumps over the lazy dog and then runs away into the forest where it finds a hidden treasure chest filled with gold coins and precious gems"
        }
        for name, text in sample_texts.items():
            analyzer.load_text(name, text)
    
    # Run analysis
    print(f"\n[2] Running analysis on {len(analyzer.texts)} texts...")
    results = analyzer.analyze_all()
    
    # Display report
    print("\n" + analyzer.generate_report())
    
    # Save results
    analyzer.save_results("pillar4_real_corpora_results.json")
    
    print("\n" + "=" * 70)
    print("PILLAR 4 FRAMEWORK READY")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Expand mathematical constant library (more constants, longer sequences)")
    print("2. Implement n-gram frequency distribution analysis")
    print("3. Cross-reference findings with historical dating methods")
    print("4. Develop formal statistical framework for publication")
    print("5. Compare results across multiple ancient traditions")
    print("6. Validate findings against known non-encoded texts")
    
    return analyzer


if __name__ == "__main__":
    run_demonstration()
