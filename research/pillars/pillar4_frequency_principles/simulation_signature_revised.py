#!/usr/bin/env python3
"""
PILLAR 4: THE SIMULATION SIGNATURE (REVISED)
=============================================
Goal: Find statistical evidence of intentional encoding in ancient texts.

REVISED APPROACH - Three Independent Tests:
1. N-gram chi-squared: Compare observed vs expected frequencies against English baselines
2. Compression ratio: Encoded text should compress differently than natural language
3. Letter-position statistics: Test for non-uniform distribution at specific positions

VALIDATION: All tests include control texts (random, Shakespeare, modern English)
            Ancient texts must score significantly differently from ALL controls.

Deliverable: Statistical proof (or disproof) of non-random encoding
"""

import hashlib
import json
import math
import os
import random
import re
import zlib
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


# =============================================================================
# TEXT UTILITIES
# =============================================================================

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def letter_sequence(text: str) -> list[str]:
    return [c.lower() for c in text if c.isalpha()]


def ngrams(sequence: list, n: int) -> list[str]:
    return [tuple(sequence[i:i+n]) for i in range(len(sequence)-n+1)]


def load_text(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


# =============================================================================
# TEST 1: N-GRAM CHI-SQUARED
# =============================================================================

class NGramChiSquared:
    """
    Compare observed n-gram frequencies against English baseline.
    Significant deviation indicates non-natural structure.
    """
    
    def __init__(self, baseline_text: str, n: int = 3):
        self.n = n
        self.baseline_counts = self._compute_counts(baseline_text)
        self.baseline_total = sum(self.baseline_counts.values())
        self.baseline_freq = {k: v/self.baseline_total for k, v in self.baseline_counts.items()}
    
    def _compute_counts(self, text: str) -> Counter:
        seq = letter_sequence(text)
        return Counter(ngrams(seq, self.n))
    
    def test(self, text: str, min_count: int = 5) -> dict:
        """
        Run chi-squared test on text.
        
        Returns raw chi-squared statistic and deviations.
        Significance is computed later via comparison with controls.
        """
        observed_counts = self._compute_counts(text)
        observed_total = sum(observed_counts.values())
        
        if observed_total == 0:
            return {"error": "empty text"}
        
        chi_sq = 0.0
        deviations = []
        
        for ngram, obs_count in observed_counts.items():
            if obs_count < min_count:
                continue
            
            expected_count = self.baseline_freq.get(ngram, 0.0001) * observed_total
            if expected_count < 1:
                continue
            
            chi_sq += (obs_count - expected_count) ** 2 / expected_count
            
            deviation = (obs_count - expected_count) / expected_count
            deviations.append({
                "ngram": "".join(ngram),
                "observed": obs_count,
                "expected": round(expected_count, 2),
                "deviation": round(deviation, 3)
            })
        
        # Sort by absolute deviation
        deviations.sort(key=lambda x: -abs(x["deviation"]))
        
        return {
            "chi_squared": round(chi_sq, 4),
            "top_deviations": deviations[:20],
            "n_grams_tested": len(deviations)
        }


# =============================================================================
# TEST 2: COMPRESSION RATIO
# =============================================================================

class CompressionAnalyzer:
    """
    Analyze compression ratios as a signature of structure.
    Highly structured/encoded text compresses differently than random text.
    """
    
    def __init__(self, baseline_text: str):
        self.baseline_ratio = self._compute_ratio(baseline_text)
    
    def _compute_ratio(self, text: str) -> float:
        """Compute compression ratio: compressed_size / original_size."""
        original = text.encode('utf-8')
        compressed = zlib.compress(original, level=9)
        return len(compressed) / len(original) if original else 1.0
    
    def test(self, text: str) -> dict:
        """
        Test compression ratio against baseline.
        
        Returns:
            ratio: Compression ratio of test text
            deviation: How far from baseline (positive = less compressible)
            z_score: Standard deviations from baseline
        """
        ratio = self._compute_ratio(text)
        
        # For single baseline, compute deviation
        # In production, use multiple baselines for proper z-score
        deviation = ratio - self.baseline_ratio
        
        return {
            "compression_ratio": round(ratio, 6),
            "baseline_ratio": round(self.baseline_ratio, 6),
            "deviation": round(deviation, 6),
            "interpretation": self._interpret(deviation)
        }
    
    def _interpret(self, deviation: float) -> str:
        if deviation > 0.05:
            return "much less compressible than baseline - may indicate random or encrypted content"
        elif deviation < -0.05:
            return "more compressible than baseline - may indicate repetitive structure"
        else:
            return "similar compressibility to baseline"


# =============================================================================
# TEST 3: LETTER-POSITION STATISTICS
# =============================================================================

class LetterPositionAnalyzer:
    """
    Test for non-uniform distribution of letters at specific positions.
    Natural language has position-dependent letter frequencies.
    """
    
    def __init__(self, baseline_text: str, max_position: int = 10):
        self.max_position = max_position
        self.baseline_distributions = self._compute_distributions(baseline_text)
    
    def _compute_distributions(self, text: str) -> dict:
        """Compute letter frequency distributions for each position."""
        seq = letter_sequence(text)
        distributions = {}
        
        for pos in range(min(self.max_position, len(seq))):
            letters_at_pos = []
            for i in range(pos, len(seq), self.max_position):
                letters_at_pos.append(seq[i])
            
            total = len(letters_at_pos)
            if total > 0:
                freq = Counter(letters_at_pos)
                distributions[pos] = {k: v/total for k, v in freq.items()}
        
        return distributions
    
    def test(self, text: str, alpha: float = 0.01) -> dict:
        """
        Test if letter positions deviate from baseline.
        
        Uses chi-squared test for each position.
        """
        seq = letter_sequence(text)
        test_distributions = self._compute_distributions(text)
        
        position_tests = []
        significant_positions = 0
        
        for pos in range(min(self.max_position, len(seq))):
            if pos not in test_distributions or pos not in self.baseline_distributions:
                continue
            
            test_freq = test_distributions[pos]
            base_freq = self.baseline_distributions[pos]
            
            letters = set(test_freq) | set(base_freq)
            n = sum(test_freq.get(l, 0) for l in letters)
            
            if n == 0:
                continue
            
            chi_sq = 0.0
            for letter in letters:
                obs = test_freq.get(letter, 0) * n
                exp = base_freq.get(letter, 0.0001) * n
                if exp > 0:
                    chi_sq += (obs - exp) ** 2 / exp
            
            # Approximate p-value
            df = max(len(letters) - 1, 1)
            p_value = 1.0 - math.erf(math.sqrt(chi_sq / (2 * df)))
            
            is_significant = p_value < alpha
            
            if is_significant:
                significant_positions += 1
            
            position_tests.append({
                "position": pos,
                "chi_squared": round(chi_sq, 4),
                "p_value": round(p_value, 6),
                "significant": is_significant,
                "top_letters": sorted(test_freq.items(), key=lambda x: -x[1])[:5]
            })
        
        return {
            "positions_tested": len(position_tests),
            "significant_positions": significant_positions,
            "significant_ratio": round(significant_positions / len(position_tests), 3) if position_tests else 0,
            "position_tests": position_tests[:10],
            "interpretation": self._interpret_position(significant_positions, len(position_tests))
        }
    
    def _interpret_position(self, sig_count: int, total: int) -> str:
        ratio = sig_count / total if total > 0 else 0
        if ratio > 0.5:
            return "strong deviation from baseline letter positions - possible encoding"
        elif ratio > 0.2:
            return "moderate deviation - worth investigation"
        else:
            return "consistent with baseline letter position distribution"


# =============================================================================
# MAIN ANALYSIS ENGINE
# =============================================================================

@dataclass
class TextAnalysis:
    """Results from analyzing a single text with all three tests."""
    name: str
    text_length: int
    ngram_test: dict = field(default_factory=dict)
    compression_test: dict = field(default_factory=dict)
    position_test: dict = field(default_factory=dict)
    overall_significant: bool = False
    score: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "text_length": self.text_length,
            "ngram_test": self.ngram_test,
            "compression_test": self.compression_test,
            "position_test": self.position_test,
            "overall_significant": self.overall_significant,
            "score": round(self.score, 4)
        }


class SimulationSignatureAnalyzer:
    """
    Revised main analysis engine for Pillar 4.
    Uses comparative ranking against control texts.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.baseline_text = ""
        self.ngram_tester = None
        self.compression_analyzer = None
        self.position_analyzer = None
        self.analyses: list[TextAnalysis] = []
    
    def load_baseline(self, text: str, n: int = 3):
        """Load baseline English text for comparison."""
        self.baseline_text = text
        self.ngram_tester = NGramChiSquared(text, n=n)
        self.compression_analyzer = CompressionAnalyzer(text)
        self.position_analyzer = LetterPositionAnalyzer(text)
        print(f"[Pillar 4] Baseline loaded: {len(text):,} chars")
    
    def analyze_text(self, name: str, text: str) -> TextAnalysis:
        """Run all three tests on a text."""
        analysis = TextAnalysis(name=name, text_length=len(text))
        
        # Test 1: N-gram chi-squared
        analysis.ngram_test = self.ngram_tester.test(text)
        
        # Test 2: Compression ratio
        analysis.compression_test = self.compression_analyzer.test(text)
        
        # Test 3: Letter position statistics
        analysis.position_test = self.position_analyzer.test(text)
        
        return analysis
    
    def compute_comparative_scores(self) -> list[TextAnalysis]:
        """
        Compute comparative scores by ranking texts against controls.
        
        Returns analyses with percentile ranks and composite scores.
        """
        if not self.analyses:
            return []
        
        # Extract metrics
        chi_sq_values = [a.ngram_test.get("chi_squared", 0) for a in self.analyses]
        compression_ratios = [a.compression_test.get("compression_ratio", 1.0) for a in self.analyses]
        position_ratios = [a.position_test.get("significant_ratio", 0) for a in self.analyses]
        
        # Compute percentiles
        for analysis in self.analyses:
            chi_sq = analysis.ngram_test.get("chi_squared", 0)
            comp_ratio = analysis.compression_test.get("compression_ratio", 1.0)
            pos_ratio = analysis.position_test.get("significant_ratio", 0)
            
            # Percentile ranks (higher chi-sq = more unusual)
            chi_percentile = sum(1 for v in chi_sq_values if v < chi_sq) / len(chi_sq_values) * 100
            # For compression: extreme values (very high or very low) are unusual
            comp_median = sorted(compression_ratios)[len(compression_ratios)//2]
            comp_deviation = abs(comp_ratio - comp_median)
            comp_deviations = [abs(r - comp_median) for r in compression_ratios]
            comp_percentile = sum(1 for d in comp_deviations if d < comp_deviation) / len(comp_deviations) * 100
            # Position ratio: higher = more unusual
            pos_percentile = sum(1 for r in position_ratios if r < pos_ratio) / len(position_ratios) * 100
            
            # Composite score (0-100)
            analysis.score = (chi_percentile + comp_percentile + pos_percentile) / 3
            
            # Store percentiles for report
            analysis.ngram_test["percentile"] = round(chi_percentile, 1)
            analysis.compression_test["percentile"] = round(comp_percentile, 1)
            analysis.position_test["percentile"] = round(pos_percentile, 1)
        
        # Sort by score
        self.analyses.sort(key=lambda a: -a.score)
        
        return self.analyses
    
    def identify_anomalies(self, control_names: list[str], threshold_percentile: float = 90.0) -> list[TextAnalysis]:
        """
        Identify texts that score significantly higher than controls.
        
        Args:
            control_names: Names of control texts
            threshold_percentile: Minimum percentile to be considered anomalous
        
        Returns:
            List of anomalous texts
        """
        if not self.analyses:
            return []
        
        # Get control scores
        control_scores = [a.score for a in self.analyses if a.name in control_names]
        if not control_scores:
            return []
        
        # Compute threshold based on controls
        threshold = sorted(control_scores)[-1]  # Max control score
        
        # Find anomalies
        anomalies = [a for a in self.analyses 
                     if a.name not in control_names and a.score > threshold]
        
        return anomalies
    
    def analyze_batch(self, texts: dict[str, str]) -> list[TextAnalysis]:
        """Analyze multiple texts."""
        results = []
        for name, text in texts.items():
            print(f"  Analyzing: {name} ({len(text):,} chars)")
            analysis = self.analyze_text(name, text)
            results.append(analysis)
        return results
    
    def save_results(self, filename: str = "pillar4_results.json"):
        """Save results."""
        output_path = self.output_dir / filename
        data = {
            "pillar": "Pillar 4: The Simulation Signature (Revised)",
            "generated": datetime.utcnow().isoformat() + "Z",
            "baseline_length": len(self.baseline_text),
            "analyses": [a.to_dict() for a in self.analyses]
        }
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"[Pillar 4] Results saved to {output_path}")
        return output_path
    
    def generate_report(self) -> str:
        """Generate analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 4: THE SIMULATION SIGNATURE (REVISED) - ANALYSIS REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            f"Texts analyzed: {len(self.analyses)}",
            ""
        ]
        
        for analysis in self.analyses:
            lines.append(f"Text: {analysis.name}")
            lines.append(f"  Length: {analysis.text_length:,} chars")
            lines.append(f"  N-gram chi-sq: {analysis.ngram_test.get('chi_squared', 'N/A')}")
            lines.append(f"  N-gram percentile: {analysis.ngram_test.get('percentile', 'N/A')}")
            lines.append(f"  Compression ratio: {analysis.compression_test.get('compression_ratio', 'N/A')}")
            lines.append(f"  Compression percentile: {analysis.compression_test.get('percentile', 'N/A')}")
            lines.append(f"  Position sig. ratio: {analysis.position_test.get('significant_ratio', 'N/A')}")
            lines.append(f"  Position percentile: {analysis.position_test.get('percentile', 'N/A')}")
            lines.append(f"  Composite score: {analysis.score:.2f}")
            lines.append("")
        
        # Summary
        anomalies = self.identify_anomalies(["random_letters", "random_words", "shakespeare", "modern_english"])
        
        lines.append("=" * 70)
        lines.append("SUMMARY")
        lines.append("=" * 70)
        lines.append(f"Anomalous texts (score > max control): {len(anomalies)}")
        
        if anomalies:
            lines.append("STATUS: Potential simulation signatures detected.")
            for a in anomalies:
                lines.append(f"  - {a.name} (score: {a.score:.2f})")
        else:
            lines.append("STATUS: No texts scored above control maximum.")
        
        return "\n".join(lines)


# =============================================================================
# CONTROL VALIDATION
# =============================================================================

def generate_control_texts() -> dict[str, str]:
    """Generate control texts for validation."""
    return {
        "random_letters": ''.join(random.choices('abcdefghijklmnopqrstuvwxyz ', k=50000)),
        "random_words": ' '.join(random.choices([
            "the", "and", "of", "to", "in", "that", "is", "was", "he", "for",
            "it", "with", "as", "his", "on", "be", "at", "by", "this", "had"
        ], k=10000)),
        "shakespeare": load_shakespeare_sample(50000),
        "modern_english": load_modern_english_sample(50000),
    }


def load_shakespeare_sample(length: int = 50000) -> str:
    """Load Shakespeare sample or generate placeholder."""
    shakespeare_words = [
        "hath", "doth", "thee", "thou", "thy", "shall", "verily", "behold",
        "hence", "thus", "wherefore", "art", "dost", "hast", "love", "heart",
        "soul", "mind", "spirit", "truth", "beauty", "grace", "heaven", "earth",
        "sea", "sky", "sun", "moon", "star", "light", "darkness", "night", "day"
    ]
    return ' '.join(random.choices(shakespeare_words, k=length // 5))


def load_modern_english_sample(length: int = 50000) -> str:
    """Load modern English sample."""
    modern_text = """The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet. Technology has transformed the way we communicate, work, and live our daily lives. Artificial intelligence and machine learning are revolutionizing industries across the globe. Climate change represents one of the most significant challenges facing humanity today. The internet has connected billions of people, creating unprecedented opportunities for collaboration. Scientific research continues to push the boundaries of human knowledge and understanding. Economic globalization has created both opportunities and challenges for developed and developing nations. Education remains the foundation of individual and societal progress in the modern world. Healthcare advances have dramatically increased life expectancy and quality of life worldwide. Sustainable development requires balancing economic growth with environmental protection. Renewable energy sources are becoming increasingly important as we transition away from fossil fuels. Urbanization continues to accelerate as people move to cities in search of better opportunities. Digital technology has fundamentally changed how we access information and connect with others. Space exploration has captured human imagination for decades and continues to advance. Medical breakthroughs are extending human lifespan and improving quality of life. Environmental conservation efforts are critical for preserving biodiversity. Quantum computing promises to solve problems that are currently intractable. Social media has transformed communication and information sharing globally. Renewable energy adoption is accelerating due to technological improvements."""
    while len(modern_text) < length:
        modern_text += " " + modern_text
    return modern_text[:length]


def run_validation():
    """Run Pillar 4 validation with controls."""
    print("=" * 70)
    print("PILLAR 4 VALIDATION: Control Text Testing")
    print("=" * 70)
    
    analyzer = SimulationSignatureAnalyzer(output_dir="research/pillars/pillar4_simulation/outputs")
    
    # Load baseline (use large English text)
    print("\n[1] Loading baseline...")
    baseline = load_modern_english_sample(200000)
    analyzer.load_baseline(baseline, n=3)
    
    # Load ancient texts
    print("\n[2] Loading ancient texts...")
    corpora_dir = Path(__file__).resolve().parent.parent.parent.parent / "bible-analysis"
    
    ancient_texts = {}
    text_files = {
        "KJV Bible": "kjv.txt",
        "Book of Enoch": "enoch.txt",
        "Gospel of Thomas": "thomas.txt",
        "Corpus Hermeticum": "hermetica.txt",
        "Dead Sea Scrolls": "dead_sea_scrolls.txt",
        "Nag Hammadi Library": "nag_hammadi.txt",
    }
    
    for display_name, filename in text_files.items():
        filepath = corpora_dir / filename
        if filepath.exists():
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                ancient_texts[display_name] = content[:100000]
                print(f"  Loaded {display_name}: {len(content):,} chars")
            except Exception as e:
                print(f"  Error loading {display_name}: {e}")
    
    # Generate controls
    print("\n[3] Generating control texts...")
    controls = generate_control_texts()
    for name, text in controls.items():
        print(f"  Generated {name}: {len(text):,} chars")
    
    # Run analysis
    print("\n[4] Running analysis...")
    all_texts = {}
    all_texts.update(controls)
    all_texts.update(ancient_texts)
    
    results = analyzer.analyze_batch(all_texts)
    analyzer.analyses = results
    
    # Compute comparative scores
    print("\n[5] Computing comparative scores...")
    analyzer.compute_comparative_scores()
    
    # Identify anomalies
    control_names = list(controls.keys())
    anomalies = analyzer.identify_anomalies(control_names)
    
    print(f"\n  Anomalous texts: {len(anomalies)}")
    for a in anomalies:
        print(f"    {a.name}: score={a.score:.2f}")
    
    # Print report
    print("\n" + analyzer.generate_report())
    
    # Save
    analyzer.save_results("pillar4_revised_validation.json")
    
    return analyzer


if __name__ == "__main__":
    run_validation()
