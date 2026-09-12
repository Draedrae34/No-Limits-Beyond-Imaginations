#!/usr/bin/env python3
"""
PILLAR 4 VALIDATION: Control Text Testing
==========================================
Test the simulation signature analyzer against control texts to validate
that significant correlations are not false positives.

Control texts:
- Random character sequences
- Shakespeare complete works
- Modern English news/articles
- Mathematical constants themselves (should show high correlation)
"""

import hashlib
import json
import math
import random
import re
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Optional

# Import the analyzer from the main module
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

from simulation_signature import (
    SimulationSignatureAnalyzer,
    shannon_entropy,
    text_to_numeric_sequence,
    correlation_with_constant,
    pi_digit,
    e_digit,
    phi_digit,
    sqrt2_digit,
    NaturalLanguageBaseline,
    permutation_test
)


# =============================================================================
# CONTROL TEXT GENERATORS
# =============================================================================

def generate_random_text(length: int, method: str = "letters") -> str:
    """
    Generate random text for baseline testing.
    
    Methods:
    - "letters": Random lowercase letters
    - "words": Random words from English dictionary
    - "bytes": Random byte values as text
    """
    if method == "letters":
        return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz ', k=length))
    elif method == "words":
        words = ["the", "and", "of", "to", "in", "that", "is", "was", "he", "for", 
                 "it", "with", "as", "his", "on", "be", "at", "by", "this", "had",
                 "not", "are", "but", "from", "or", "have", "an", "they", "which",
                 "one", "you", "were", "all", "her", "she", "would", "there"]
        return ' '.join(random.choices(words, k=length // 5))
    elif method == "bytes":
        return ''.join(chr(random.randint(32, 126)) for _ in range(length))
    else:
        return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz ', k=length))


def load_shakespeare_sample(length: int = 50000) -> str:
    """Load a sample of Shakespeare's works if available, otherwise generate placeholder."""
    # Try to find Shakespeare texts in common locations
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "bible-analysis" / "shakespeare.txt",
        Path(__file__).resolve().parent.parent.parent / "data" / "shakespeare.txt",
        Path("C:/Users/aundr/.platformio/python3/python.exe") / "shakespeare.txt",
    ]
    
    for path in possible_paths:
        if path.exists():
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return content[:length]
    
    # Fallback: generate Shakespeare-like text
    shakespeare_words = [
        "hath", "doth", "thee", "thou", "thy", "shall", "verily", "behold",
        "hence", "thus", "wherefore", "art", "dost", "hast", "wert", "shalt",
        "love", "heart", "soul", "mind", "spirit", "truth", "beauty", "grace",
        "heaven", "earth", "sea", "sky", "sun", "moon", "star", "light",
        "darkness", "night", "day", "time", "eternity", "mortal", "immortal"
    ]
    return ' '.join(random.choices(shakespeare_words, k=length // 5))


def load_modern_english_sample(length: int = 50000) -> str:
    """Load modern English text sample."""
    modern_text = """
    The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.
    Technology has transformed the way we communicate, work, and live our daily lives.
    Artificial intelligence and machine learning are revolutionizing industries across the globe.
    Climate change represents one of the most significant challenges facing humanity today.
    The internet has connected billions of people, creating unprecedented opportunities for collaboration.
    Scientific research continues to push the boundaries of human knowledge and understanding.
    Economic globalization has created both opportunities and challenges for developed and developing nations.
    Education remains the foundation of individual and societal progress in the modern world.
    Healthcare advances have dramatically increased life expectancy and quality of life worldwide.
    Sustainable development requires balancing economic growth with environmental protection.
    """
    
    # Repeat to reach desired length
    while len(modern_text) < length:
        modern_text += " " + modern_text
    
    return modern_text[:length]


def generate_mathematical_constant_text(constant_name: str, length: int) -> str:
    """Generate text from a mathematical constant's digits."""
    if constant_name == "pi":
        digits = "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989"
    elif constant_name == "e":
        digits = "27182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274"
    elif constant_name == "phi":
        digits = "6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374"
    elif constant_name == "sqrt2":
        digits = "4142135623730950488016887242096980785696718753769480731766797379907324784621070388503875343276415727"
    else:
        digits = "1234567890"
    
    # Repeat digits to reach desired length
    text = ""
    while len(text) < length:
        text += digits
    
    return text[:length]


# =============================================================================
# VALIDATION FRAMEWORK
# =============================================================================

class Pillar4Validator:
    """
    Validate Pillar 4 results against control texts.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.analyzer = SimulationSignatureAnalyzer(output_dir=str(self.output_dir))
        self.results = []
    
    def test_control_text(self, name: str, text: str) -> dict:
        """Test a control text and return results."""
        print(f"\n  Testing control: {name} ({len(text):,} chars)")
        
        # Load text
        self.analyzer.load_text(name, text)
        
        # Run analysis
        analysis = self.analyzer.analyze_text(name)
        
        # Extract key metrics
        result = {
            "name": name,
            "text_length": len(text),
            "letter_entropy": analysis.letter_entropy,
            "baseline_percentile": analysis.baseline_comparison.get("percentile", 0),
            "significant_correlations": [],
            "max_similarity": 0.0,
            "interpretation": analysis.baseline_comparison.get("interpretation", "")
        }
        
        for corr in analysis.constant_correlations:
            if corr.get("significant"):
                result["significant_correlations"].append(corr)
                result["max_similarity"] = max(result["max_similarity"], corr.get("similarity", 0))
        
        self.results.append(result)
        return result
    
    def validate_ancient_texts(self, ancient_texts: dict[str, str]) -> dict:
        """
        Compare ancient texts against control texts.
        
        Returns validation summary.
        """
        print("=" * 70)
        print("PILLAR 4 VALIDATION: Control Text Testing")
        print("=" * 70)
        
        # Test control texts
        print("\n[1] Testing control texts...")
        
        controls = {
            "random_letters": generate_random_text(50000, "letters"),
            "random_words": generate_random_text(50000, "words"),
            "shakespeare": load_shakespeare_sample(50000),
            "modern_english": load_modern_english_sample(50000),
            "pi_digits": generate_mathematical_constant_text("pi", 50000),
            "e_digits": generate_mathematical_constant_text("e", 50000),
        }
        
        control_results = {}
        for name, text in controls.items():
            control_results[name] = self.test_control_text(name, text)
        
        # Test ancient texts
        print("\n[2] Testing ancient texts...")
        ancient_results = {}
        for name, text in ancient_texts.items():
            ancient_results[name] = self.test_control_text(name, text)
        
        # Compare results
        print("\n[3] Generating validation report...")
        
        validation = self._compare_results(control_results, ancient_results)
        
        # Save results
        self._save_validation(control_results, ancient_results, validation)
        
        return validation
    
    def _compare_results(self, controls: dict, ancients: dict) -> dict:
        """Compare control vs ancient text results."""
        
        # Get baseline percentiles
        control_percentiles = [r["baseline_percentile"] for r in controls.values()]
        ancient_percentiles = [r["baseline_percentile"] for r in ancients.values()]
        
        # Get significant correlation counts
        control_sig_counts = [len(r["significant_correlations"]) for r in controls.values()]
        ancient_sig_counts = [len(r["significant_correlations"]) for r in ancients.values()]
        
        # Get max similarities
        control_max_sims = [r["max_similarity"] for r in controls.values() if r["max_similarity"] > 0]
        ancient_max_sims = [r["max_similarity"] for r in ancients.values() if r["max_similarity"] > 0]
        
        validation = {
            "summary": {
                "total_controls_tested": len(controls),
                "total_ancient_tested": len(ancients),
                "controls_with_sig_corr": sum(1 for c in control_sig_counts if c > 0),
                "ancients_with_sig_corr": sum(1 for c in ancient_sig_counts if c > 0),
            },
            "baseline_entropy": {
                "control_mean_percentile": sum(control_percentiles) / len(control_percentiles) if control_percentiles else 0,
                "ancient_mean_percentile": sum(ancient_percentiles) / len(ancient_percentiles) if ancient_percentiles else 0,
                "interpretation": ""
            },
            "constant_correlation": {
                "control_mean_sig_count": sum(control_sig_counts) / len(control_sig_counts) if control_sig_counts else 0,
                "ancient_mean_sig_count": sum(ancient_sig_counts) / len(ancient_sig_counts) if ancient_sig_counts else 0,
                "control_max_similarity": max(control_max_sims) if control_max_sims else 0,
                "ancient_max_similarity": max(ancient_max_sims) if ancient_max_sims else 0,
            },
            "conclusion": ""
        }
        
        # Generate interpretation
        ancient_percentile = validation["baseline_entropy"]["ancient_mean_percentile"]
        control_percentile = validation["baseline_entropy"]["control_mean_percentile"]
        
        if ancient_percentile > 90 and control_percentile < 50:
            validation["baseline_entropy"]["interpretation"] = "Ancient texts show higher entropy than controls - suggests structured encoding"
            validation["conclusion"] = "POSITIVE: Ancient texts show distinct entropy patterns compared to controls."
        elif ancient_percentile < 10 and control_percentile < 50:
            validation["baseline_entropy"]["interpretation"] = "Both ancient and control texts show low entropy - expected for structured text"
            validation["conclusion"] = "NEUTRAL: Ancient texts show expected natural language entropy. Further investigation needed."
        else:
            validation["baseline_entropy"]["interpretation"] = "No clear distinction between ancient and control texts"
            validation["conclusion"] = "NEGATIVE: No significant difference detected between ancient and control texts."
        
        # Print summary
        print("\n" + "=" * 70)
        print("VALIDATION SUMMARY")
        print("=" * 70)
        print(f"Controls with significant correlations: {validation['summary']['controls_with_sig_corr']}/{validation['summary']['total_controls_tested']}")
        print(f"Ancient texts with significant correlations: {validation['summary']['ancients_with_sig_corr']}/{validation['summary']['total_ancient_tested']}")
        print(f"\nBaseline entropy percentile:")
        print(f"  Controls: {validation['baseline_entropy']['control_mean_percentile']:.1f}th percentile")
        print(f"  Ancient:  {validation['baseline_entropy']['ancient_mean_percentile']:.1f}th percentile")
        print(f"\nConstant correlation:")
        print(f"  Controls max similarity: {validation['constant_correlation']['control_max_similarity']:.4f}")
        print(f"  Ancient max similarity:  {validation['constant_correlation']['ancient_max_similarity']:.4f}")
        print(f"\nConclusion: {validation['conclusion']}")
        print("=" * 70)
        
        return validation
    
    def _save_validation(self, controls: dict, ancients: dict, validation: dict):
        """Save validation results."""
        output_path = self.output_dir / "pillar4_validation_results.json"
        
        data = {
            "pillar": "Pillar 4 Validation",
            "generated": datetime.utcnow().isoformat() + "Z",
            "control_results": controls,
            "ancient_results": ancients,
            "validation": validation
        }
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n[Pillar 4] Validation results saved to {output_path}")


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_validation():
    """Run Pillar 4 validation with control texts."""
    validator = Pillar4Validator(output_dir="research/pillars/pillar4_simulation/outputs")
    
    # Load ancient texts from bible-analysis/
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
    
    print("[0] Loading ancient texts...")
    for display_name, filename in text_files.items():
        filepath = corpora_dir / filename
        if filepath.exists():
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                # Sample first 50KB for validation
                ancient_texts[display_name] = content[:50000]
                print(f"  Loaded {display_name}: {len(content):,} chars")
            except Exception as e:
                print(f"  Error loading {display_name}: {e}")
    
    # Run validation
    validation = validator.validate_ancient_texts(ancient_texts)
    
    return validator, validation


if __name__ == "__main__":
    run_validation()
