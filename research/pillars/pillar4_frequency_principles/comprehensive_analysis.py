#!/usr/bin/env python3
"""
PILLAR 4: THE SIMULATION SIGNATURE - FRACTAL EDITION
=====================================================
Goal: Find fractal/recursive mathematical structure in ancient texts.

NEW HYPOTHESIS:
Ancient texts encode knowledge of the universe's regenerative/fractal nature.
This would appear as self-similar patterns across multiple scales.

TESTS:
1. Digital Root Self-Similarity: Same digital root patterns at word, sentence, paragraph scales
2. Word-Length Fractal Dimension: Fractal dimension of word-length sequences
3. Sentence-Length Hurst Exponent: Long-range dependence in sentence lengths
4. Cross-Scale Pattern Recurrence: Same patterns at different structural levels
5. Recursive Structure Detection: Nested self-similarity in text organization

CONTROL TEXTS: Shakespeare, Moby Dick, Pride & Prejudice, random text
ANCIENT TEXTS: KJV, Enoch, Thomas, Hermetica, DSS, Nag Hammadi

If ancient texts show significantly higher fractal structure than ALL controls,
that supports the hypothesis of intentional encoding of regenerative mathematics.
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
from typing import Optional, Dict, List, Tuple


# =============================================================================
# TEXT UTILITIES
# =============================================================================

def letter_sequence(text: str) -> List[str]:
    return [c.lower() for c in text if c.isalpha()]


def word_sequence(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def sentence_sequence(text: str) -> List[str]:
    """Split text into sentences."""
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip()]


def paragraph_sequence(text: str) -> List[str]:
    """Split text into paragraphs."""
    paragraphs = text.split('\n\n')
    return [p.strip() for p in paragraphs if p.strip()]


def load_text(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def clean_text(text: str) -> str:
    return re.sub(r'[^a-z\s]', '', text.lower())


# =============================================================================
# TEST 1: DIGITAL ROOT SELF-SIMILARITY
# =============================================================================

def digital_root(n: int) -> int:
    if n == 0:
        return 0
    return 1 + ((n - 1) % 9)


def text_to_digital_roots(text: str) -> List[int]:
    return [digital_root(ord(c)) for c in text if c.strip()]


def segment_digital_roots(roots: List[int], segment_size: int) -> List[List[int]]:
    """Split digital root sequence into segments."""
    return [roots[i:i+segment_size] for i in range(0, len(roots), segment_size) if i+segment_size <= len(roots)]


class DigitalRootSelfSimilarity:
    """
    Test if digital root patterns repeat across different scales.
    
    Fractal texts should show similar digital root distributions at:
    - Word level
    - Sentence level  
    - Paragraph level
    """
    
    def analyze(self, text: str) -> Dict:
        """Analyze digital root self-similarity."""
        roots = text_to_digital_roots(text)
        
        if len(roots) < 100:
            return {"error": "text too short for self-similarity analysis"}
        
        # Analyze at different scales
        scales = {
            "character": roots,
            "word": self._aggregate_by_words(text, roots),
            "sentence": self._aggregate_by_sentences(text, roots),
            "paragraph": self._aggregate_by_paragraphs(text, roots)
        }
        
        # Compute distributions at each scale
        distributions = {}
        for scale_name, scale_roots in scales.items():
            if not scale_roots:
                continue
            counts = Counter(scale_roots)
            total = len(scale_roots)
            freq = {d: counts.get(d, 0) / total for d in range(1, 10)}
            distributions[scale_name] = freq
        
        # Compute self-similarity: cosine similarity between scale distributions
        scale_names = list(distributions.keys())
        similarities = []
        
        for i in range(len(scale_names)):
            for j in range(i + 1, len(scale_names)):
                name1, name2 = scale_names[i], scale_names[j]
                vec1 = [distributions[name1].get(d, 0) for d in range(1, 10)]
                vec2 = [distributions[name2].get(d, 0) for d in range(1, 10)]
                
                dot = sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
                mag1 = math.sqrt(sum(v * v for v in vec1))
                mag2 = math.sqrt(sum(v * v for v in vec2))
                sim = dot / (mag1 * mag2) if mag1 > 0 and mag2 > 0 else 0
                similarities.append({
                    "scales": f"{name1} vs {name2}",
                    "cosine_similarity": round(sim, 4)
                })
        
        # Overall self-similarity score
        avg_similarity = sum(s["cosine_similarity"] for s in similarities) / len(similarities) if similarities else 0
        
        return {
            "scales_analyzed": len(distributions),
            "scale_distributions": {k: {str(d): round(v, 4) for d, v in freq.items()} 
                                   for k, freq in distributions.items()},
            "cross_scale_similarities": similarities,
            "avg_self_similarity": round(avg_similarity, 4),
            "interpretation": self._interpret_similarity(avg_similarity)
        }
    
    def _aggregate_by_words(self, text: str, roots: List[int]) -> List[int]:
        """Aggregate digital roots by words."""
        words = word_sequence(text)
        word_roots = []
        root_idx = 0
        for word in words:
            word_len = len(word)
            if root_idx + word_len <= len(roots):
                word_root = sum(roots[root_idx:root_idx + word_len]) % 9
                word_root = 9 if word_root == 0 else word_root
                word_roots.append(word_root)
                root_idx += word_len
        return word_roots
    
    def _aggregate_by_sentences(self, text: str, roots: List[int]) -> List[int]:
        """Aggregate digital roots by sentences."""
        sentences = sentence_sequence(text)
        sentence_roots = []
        root_idx = 0
        for sentence in sentences:
            words = word_sequence(sentence)
            if not words:
                continue
            sentence_len = sum(len(w) for w in words)
            if root_idx + sentence_len <= len(roots):
                sent_root = sum(roots[root_idx:root_idx + sentence_len]) % 9
                sent_root = 9 if sent_root == 0 else sent_root
                sentence_roots.append(sent_root)
                root_idx += sentence_len
        return sentence_roots
    
    def _aggregate_by_paragraphs(self, text: str, roots: List[int]) -> List[int]:
        """Aggregate digital roots by paragraphs."""
        paragraphs = paragraph_sequence(text)
        paragraph_roots = []
        root_idx = 0
        for para in paragraphs:
            words = word_sequence(para)
            if not words:
                continue
            para_len = sum(len(w) for w in words)
            if root_idx + para_len <= len(roots):
                para_root = sum(roots[root_idx:root_idx + para_len]) % 9
                para_root = 9 if para_root == 0 else para_root
                paragraph_roots.append(para_root)
                root_idx += para_len
        return paragraph_roots
    
    def _interpret_similarity(self, avg_sim: float) -> str:
        if avg_sim > 0.9:
            return "very high self-similarity - strong fractal structure"
        elif avg_sim > 0.8:
            return "high self-similarity - possible fractal organization"
        elif avg_sim > 0.7:
            return "moderate self-similarity - some cross-scale patterns"
        else:
            return "low self-similarity - no clear fractal structure"


# =============================================================================
# TEST 2: WORD-LENGTH FRACTAL DIMENSION
# =============================================================================

class WordLengthFractal:
    """
    Compute fractal dimension of word-length sequences.
    
    Fractal dimension measures how "rough" or "complex" a sequence is.
    Natural language has fractal-like properties, but intentional structure
    might show different fractal dimensions at different scales.
    """
    
    def analyze(self, text: str) -> Dict:
        """Analyze fractal dimension of word lengths."""
        words = word_sequence(text)
        
        if len(words) < 100:
            return {"error": "text too short for fractal analysis"}
        
        word_lengths = [len(w) for w in words]
        
        # Compute fractal dimension using box-counting method
        fractal_dim = self._box_counting_dimension(word_lengths)
        
        # Compute Hurst exponent (measure of long-range dependence)
        hurst = self._hurst_exponent(word_lengths)
        
        # Compute scaling exponent
        scaling = self._scaling_exponent(word_lengths)
        
        return {
            "total_words": len(words),
            "mean_word_length": round(sum(word_lengths) / len(word_lengths), 2),
            "fractal_dimension": round(fractal_dim, 4),
            "hurst_exponent": round(hurst, 4),
            "scaling_exponent": round(scaling, 4),
            "interpretation": self._interpret_fractal(fractal_dim, hurst)
        }
    
    def _box_counting_dimension(self, sequence: List[int]) -> float:
        """
        Estimate fractal dimension using box-counting.
        
        D = lim_{epsilon -> 0} log(N(epsilon)) / log(1/epsilon)
        """
        if len(sequence) < 10:
            return 1.0
        
        # Normalize sequence to [0, 1]
        min_val = min(sequence)
        max_val = max(sequence)
        if max_val == min_val:
            return 1.0
        
        normalized = [(v - min_val) / (max_val - min_val) for v in sequence]
        
        # Box counting at different scales
        scales = [2, 4, 8, 16, 32]
        counts = []
        
        for scale in scales:
            boxes = set()
            for val in normalized:
                box_idx = int(val * scale)
                box_idx = min(box_idx, scale - 1)
                boxes.add(box_idx)
            counts.append(len(boxes))
        
        # Linear regression: log(N) vs log(1/scale)
        log_counts = [math.log(c) for c in counts if c > 0]
        log_scales = [math.log(1/s) for s in scales if s > 0]
        
        if len(log_counts) < 2:
            return 1.0
        
        # Simple linear regression slope
        n = len(log_counts)
        mean_x = sum(log_scales) / n
        mean_y = sum(log_counts) / n
        
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(log_scales, log_counts))
        denominator = sum((x - mean_x) ** 2 for x in log_scales)
        
        if denominator == 0:
            return 1.0
        
        slope = numerator / denominator
        return max(1.0, min(2.0, slope))
    
    def _hurst_exponent(self, sequence: List[int]) -> float:
        """
        Estimate Hurst exponent using rescaled range analysis.
        
        H > 0.5: persistent/long-range dependence
        H < 0.5: anti-persistent
        H = 0.5: random walk
        """
        if len(sequence) < 20:
            return 0.5
        
        n = len(sequence)
        mean = sum(sequence) / n
        
        # Cumulative deviations
        cumdev = []
        running_sum = 0
        for val in sequence:
            running_sum += val - mean
            cumdev.append(running_sum)
        
        # Range and standard deviation
        r = max(cumdev) - min(cumdev)
        s = math.sqrt(sum((v - mean) ** 2 for v in sequence) / n)
        
        if s == 0:
            return 0.5
        
        rs = r / s
        
        # Hurst exponent approximation
        # RS ~ n^H, so H ~ log(RS) / log(n)
        hurst = math.log(rs) / math.log(n) if n > 1 else 0.5
        
        return max(0.0, min(1.0, hurst))
    
    def _scaling_exponent(self, sequence: List[int]) -> float:
        """Compute power-law scaling exponent."""
        if len(sequence) < 10:
            return 0.0
        
        # Distribution of word lengths
        counts = Counter(sequence)
        lengths = sorted(counts.keys())
        
        if len(lengths) < 3:
            return 0.0
        
        freqs = [counts[l] for l in lengths]
        
        # Log-log regression
        log_lengths = [math.log(l) for l in lengths]
        log_freqs = [math.log(f) for f in freqs]
        
        n = len(lengths)
        mean_x = sum(log_lengths) / n
        mean_y = sum(log_freqs) / n
        
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(log_lengths, log_freqs))
        denominator = sum((x - mean_x) ** 2 for x in log_lengths)
        
        if denominator == 0:
            return 0.0
        
        return -numerator / denominator  # Negative because frequency decreases with length
    
    def _interpret_fractal(self, dim: float, hurst: float) -> str:
        if dim > 1.7 and hurst > 0.6:
            return "high fractal dimension with long-range dependence - complex structure"
        elif dim > 1.5 and hurst > 0.55:
            return "moderate-high fractal dimension - some self-similarity"
        elif dim > 1.3:
            return "moderate fractal dimension - typical of natural language"
        else:
            return "low fractal dimension - more random structure"


# =============================================================================
# TEST 3: SENTENCE-LENGTH HURST EXPONENT
# =============================================================================

class SentenceLengthHurst:
    """
    Analyze sentence-length sequences for long-range dependence.
    
    If ancient texts encode regenerative patterns, sentence lengths might
    show persistent long-range dependence (Hurst > 0.5) across different scales.
    """
    
    def analyze(self, text: str) -> Dict:
        """Analyze sentence-length Hurst exponent."""
        sentences = sentence_sequence(text)
        
        if len(sentences) < 20:
            return {"error": "too few sentences for Hurst analysis"}
        
        sentence_lengths = [len(s.split()) for s in sentences]
        
        # Overall Hurst exponent
        hurst = self._hurst_exponent(sentence_lengths)
        
        # Hurst at different scales (coarse-graining)
        scale_hursts = []
        for scale in [2, 4, 8, 16]:
            if len(sentence_lengths) >= scale:
                coarse_grained = self._coarse_grain(sentence_lengths, scale)
                scale_hurst = self._hurst_exponent(coarse_grained)
                scale_hursts.append({
                    "scale": scale,
                    "hurst": round(scale_hurst, 4),
                    "sample_size": len(coarse_grained)
                })
        
        # Persistence analysis
        persistent_count = sum(1 for sh in scale_hursts if sh["hurst"] > 0.5)
        
        return {
            "total_sentences": len(sentences),
            "mean_sentence_length": round(sum(sentence_lengths) / len(sentence_lengths), 2),
            "overall_hurst": round(hurst, 4),
            "scale_hursts": scale_hursts,
            "persistent_scales": persistent_count,
            "total_scales_tested": len(scale_hursts),
            "persistence_ratio": round(persistent_count / len(scale_hursts), 3) if scale_hursts else 0,
            "interpretation": self._interpret_hurst(hurst, persistent_count, len(scale_hursts))
        }
    
    def _coarse_grain(self, sequence: List[int], scale: int) -> List[int]:
        """Coarse-grain sequence by averaging blocks."""
        result = []
        for i in range(0, len(sequence), scale):
            block = sequence[i:i+scale]
            if block:
                result.append(sum(block) // len(block))
        return result
    
    def _hurst_exponent(self, sequence: List[int]) -> float:
        """Hurst exponent via rescaled range."""
        if len(sequence) < 10:
            return 0.5
        
        n = len(sequence)
        mean = sum(sequence) / n
        
        cumdev = []
        running_sum = 0
        for val in sequence:
            running_sum += val - mean
            cumdev.append(running_sum)
        
        r = max(cumdev) - min(cumdev)
        s = math.sqrt(sum((v - mean) ** 2 for v in sequence) / n)
        
        if s == 0:
            return 0.5
        
        rs = r / s
        hurst = math.log(rs) / math.log(n) if n > 1 else 0.5
        
        return max(0.0, min(1.0, hurst))
    
    def _interpret_hurst(self, hurst: float, persistent_scales: int, total_scales: int) -> str:
        if hurst > 0.6 and persistent_scales / total_scales > 0.7:
            return "strong long-range persistence - possible intentional structure"
        elif hurst > 0.55:
            return "moderate persistence - some structured dependency"
        elif hurst > 0.5:
            return "weak persistence - near random"
        else:
            return "anti-persistent - alternating patterns"


# =============================================================================
# TEST 4: CROSS-SCALE PATTERN RECURRENCE
# =============================================================================

class CrossScaleRecurrence:
    """
    Test if same patterns appear at different structural scales.
    
    Fractal/self-similar texts should show pattern recurrence across:
    - 100-word windows
    - 500-word windows  
    - 1000-word windows
    - 5000-word windows
    """
    
    def analyze(self, text: str) -> Dict:
        """Analyze cross-scale pattern recurrence."""
        words = word_sequence(text)
        
        if len(words) < 1000:
            return {"error": "text too short for cross-scale analysis"}
        
        # Define scales
        scales = [100, 500, 1000, 5000]
        
        # Compute features at each scale
        scale_features = {}
        for scale in scales:
            if len(words) < scale:
                continue
            
            segments = [words[i:i+scale] for i in range(0, len(words) - scale + 1, scale // 2)]
            
            # Features for each segment
            segment_features = []
            for seg in segments[:10]:  # Limit to 10 segments per scale
                features = self._compute_features(seg)
                segment_features.append(features)
            
            scale_features[scale] = segment_features
        
        # Compute recurrence: similarity between features at different scales
        scale_names = list(scale_features.keys())
        recurrence_scores = []
        
        for i in range(len(scale_names)):
            for j in range(i + 1, len(scale_names)):
                scale1, scale2 = scale_names[i], scale_names[j]
                feats1 = scale_features[scale1]
                feats2 = scale_features[scale2]
                
                # Average feature vectors
                avg1 = self._average_features(feats1)
                avg2 = self._average_features(feats2)
                
                # Cosine similarity
                dot = sum(v1 * v2 for v1, v2 in zip(avg1, avg2))
                mag1 = math.sqrt(sum(v * v for v in avg1))
                mag2 = math.sqrt(sum(v * v for v in avg2))
                sim = dot / (mag1 * mag2) if mag1 > 0 and mag2 > 0 else 0
                
                recurrence_scores.append({
                    "scales": f"{scale1} vs {scale2}",
                    "similarity": round(sim, 4)
                })
        
        avg_recurrence = sum(r["similarity"] for r in recurrence_scores) / len(recurrence_scores) if recurrence_scores else 0
        
        return {
            "scales_analyzed": len(scale_features),
            "recurrence_scores": recurrence_scores,
            "avg_recurrence": round(avg_recurrence, 4),
            "interpretation": self._interpret_recurrence(avg_recurrence)
        }
    
    def _compute_features(self, words: List[str]) -> List[float]:
        """Compute feature vector for word segment."""
        if not words:
            return [0.0] * 10
        
        features = [
            len(words),  # segment length
            sum(len(w) for w in words) / len(words),  # avg word length
            len(set(words)) / len(words),  # type-token ratio
            sum(1 for w in words if len(w) <= 3) / len(words),  # short word ratio
            sum(1 for w in words if len(w) >= 7) / len(words),  # long word ratio
            sum(1 for w in words if w in ['the', 'and', 'of', 'to', 'in']) / len(words),  # function words
            len([w for w in words if w.endswith('ing')]) / len(words),  # gerund ratio
            len([w for w in words if w.endswith('ed')]) / len(words),  # past tense ratio
            len([w for w in words if w.endswith('ly')]) / len(words),  # adverb ratio
            sum(ord(c) for w in words for c in w) / sum(len(w) for w in words),  # avg char value
        ]
        
        return features
    
    def _average_features(self, feature_list: List[List[float]]) -> List[float]:
        """Average feature vectors."""
        if not feature_list:
            return [0.0] * 10
        
        n = len(feature_list[0])
        avg = [sum(f[i] for f in feature_list) / len(feature_list) for i in range(n)]
        return avg
    
    def _interpret_recurrence(self, avg_recurrence: float) -> str:
        if avg_recurrence > 0.9:
            return "very high recurrence - strong self-similarity across scales"
        elif avg_recurrence > 0.8:
            return "high recurrence - possible fractal structure"
        elif avg_recurrence > 0.7:
            return "moderate recurrence - some cross-scale patterns"
        else:
            return "low recurrence - no clear self-similarity"


# =============================================================================
# TEST 5: RECURSIVE STRUCTURE DETECTION
# =============================================================================

class RecursiveStructure:
    """
    Detect recursive/self-referential patterns in text organization.
    
    Tests if text shows recursive structure at multiple levels:
    - Chapters/sections containing similar sub-structures
    - Repeated patterns at different nesting levels
    - Self-similar organization
    """
    
    def analyze(self, text: str) -> Dict:
        """Analyze recursive structure."""
        paragraphs = paragraph_sequence(text)
        
        if len(paragraphs) < 10:
            return {"error": "too few paragraphs for recursive analysis"}
        
        # Analyze paragraph-level structure
        para_features = []
        for para in paragraphs[:50]:  # Limit to 50 paragraphs
            words = word_sequence(para)
            if len(words) < 5:
                continue
            features = self._compute_paragraph_features(words)
            para_features.append(features)
        
        if len(para_features) < 5:
            return {"error": "insufficient paragraph data"}
        
        # Compute self-similarity between paragraphs
        similarities = []
        for i in range(len(para_features)):
            for j in range(i + 1, len(para_features)):
                sim = self._cosine_similarity(para_features[i], para_features[j])
                similarities.append(sim)
        
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0
        
        # Detect nested patterns (every 2nd, 3rd, 5th paragraph similar)
        nested_scores = {}
        for interval in [2, 3, 5, 7]:
            if len(para_features) >= interval * 2:
                nested = []
                for i in range(0, len(para_features) - interval, interval):
                    sim = self._cosine_similarity(para_features[i], para_features[i + interval])
                    nested.append(sim)
                if nested:
                    nested_scores[interval] = round(sum(nested) / len(nested), 4)
        
        return {
            "paragraphs_analyzed": len(para_features),
            "avg_paragraph_similarity": round(avg_similarity, 4),
            "nested_pattern_scores": nested_scores,
            "max_nested_score": round(max(nested_scores.values()), 4) if nested_scores else 0,
            "interpretation": self._interpret_recursive(avg_similarity, nested_scores)
        }
    
    def _compute_paragraph_features(self, words: List[str]) -> List[float]:
        """Compute features for a paragraph."""
        if not words:
            return [0.0] * 8
        
        features = [
            len(words),
            sum(len(w) for w in words) / len(words),
            len(set(words)) / len(words),
            sum(1 for w in words if len(w) <= 3) / len(words),
            sum(1 for w in words if len(w) >= 7) / len(words),
            sum(1 for w in words if w in ['the', 'and', 'of', 'to', 'in']) / len(words),
            len([w for w in words if w.endswith('ing')]) / len(words),
            sum(ord(c) for w in words for c in w) / sum(len(w) for w in words),
        ]
        
        return features
    
    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity."""
        if len(v1) != len(v2):
            return 0.0
        
        dot = sum(a * b for a, b in zip(v1, v2))
        mag1 = math.sqrt(sum(a * a for a in v1))
        mag2 = math.sqrt(sum(b * b for b in v2))
        
        if mag1 == 0 or mag2 == 0:
            return 0.0
        
        return dot / (mag1 * mag2)
    
    def _interpret_recursive(self, avg_sim: float, nested: Dict) -> str:
        if avg_sim > 0.8 and any(v > 0.7 for v in nested.values()):
            return "strong recursive structure - nested self-similarity detected"
        elif avg_sim > 0.7:
            return "moderate recursive structure - some self-similarity"
        else:
            return "weak or no recursive structure"


# =============================================================================
# MAIN ANALYSIS ENGINE
# =============================================================================

@dataclass
class TextAnalysis:
    """Complete fractal analysis results."""
    name: str
    text_length: int
    digital_root_self_similarity: Dict = field(default_factory=dict)
    word_length_fractal: Dict = field(default_factory=dict)
    sentence_length_hurst: Dict = field(default_factory=dict)
    cross_scale_recurrence: Dict = field(default_factory=dict)
    recursive_structure: Dict = field(default_factory=dict)
    composite_score: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "text_length": self.text_length,
            "digital_root_self_similarity": self.digital_root_self_similarity,
            "word_length_fractal": self.word_length_fractal,
            "sentence_length_hurst": self.sentence_length_hurst,
            "cross_scale_recurrence": self.cross_scale_recurrence,
            "recursive_structure": self.recursive_structure,
            "composite_score": round(self.composite_score, 4)
        }


class FractalAnalyzer:
    """
    Comprehensive fractal analysis engine for Pillar 4.
    
    Tests for self-similarity, fractal dimension, Hurst exponent,
    and recursive structure across multiple scales.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.analyses: List[TextAnalysis] = []
    
    def analyze_text(self, name: str, text: str) -> TextAnalysis:
        """Run all fractal tests on a text."""
        analysis = TextAnalysis(name=name, text_length=len(text))
        
        # Test 1: Digital root self-similarity
        print(f"  [1/5] Digital root self-similarity: {name}")
        analysis.digital_root_self_similarity = DigitalRootSelfSimilarity().analyze(text)
        
        # Test 2: Word-length fractal dimension
        print(f"  [2/5] Word-length fractal: {name}")
        analysis.word_length_fractal = WordLengthFractal().analyze(text)
        
        # Test 3: Sentence-length Hurst
        print(f"  [3/5] Sentence-length Hurst: {name}")
        analysis.sentence_length_hurst = SentenceLengthHurst().analyze(text)
        
        # Test 4: Cross-scale recurrence
        print(f"  [4/5] Cross-scale recurrence: {name}")
        analysis.cross_scale_recurrence = CrossScaleRecurrence().analyze(text)
        
        # Test 5: Recursive structure
        print(f"  [5/5] Recursive structure: {name}")
        analysis.recursive_structure = RecursiveStructure().analyze(text)
        
        return analysis
    
    def compute_composite_scores(self) -> List[TextAnalysis]:
        """Compute composite fractal scores."""
        for analysis in self.analyses:
            scores = []
            
            # 1. Digital root self-similarity (0-1)
            dr = analysis.digital_root_self_similarity
            if "avg_self_similarity" in dr:
                scores.append(dr["avg_self_similarity"])
            
            # 2. Word-length fractal dimension (0-1)
            wf = analysis.word_length_fractal
            if "fractal_dimension" in wf:
                # Normalize: 1.0 = min, 2.0 = max
                scores.append(min(max((wf["fractal_dimension"] - 1.0), 0.0), 1.0))
            
            # 3. Hurst persistence (0-1)
            sh = analysis.sentence_length_hurst
            if "persistence_ratio" in sh:
                scores.append(sh["persistence_ratio"])
            
            # 4. Cross-scale recurrence (0-1)
            cr = analysis.cross_scale_recurrence
            if "avg_recurrence" in cr:
                scores.append(cr["avg_recurrence"])
            
            # 5. Recursive structure (0-1)
            rs = analysis.recursive_structure
            if "max_nested_score" in rs:
                scores.append(rs["max_nested_score"])
            
            analysis.composite_score = sum(scores) / len(scores) if scores else 0.0
        
        self.analyses.sort(key=lambda a: -a.composite_score)
        return self.analyses
    
    def identify_anomalies(self, control_names: List[str]) -> List[TextAnalysis]:
        """Identify texts with significantly higher fractal structure than controls."""
        if not self.analyses:
            return []
        
        control_scores = [a.composite_score for a in self.analyses if a.name in control_names]
        if not control_scores:
            return []
        
        threshold = max(control_scores)
        anomalies = [a for a in self.analyses if a.name not in control_names and a.composite_score > threshold]
        
        return anomalies
    
    def analyze_batch(self, texts: Dict[str, str]) -> List[TextAnalysis]:
        """Analyze multiple texts."""
        results = []
        for name, text in texts.items():
            print(f"\nAnalyzing: {name} ({len(text):,} chars)")
            analysis = self.analyze_text(name, text)
            results.append(analysis)
        return results
    
    def save_results(self, filename: str = "pillar4_fractal_results.json"):
        """Save results."""
        output_path = self.output_dir / filename
        data = {
            "pillar": "Pillar 4: Fractal Structure Analysis",
            "generated": datetime.utcnow().isoformat() + "Z",
            "analyses": [a.to_dict() for a in self.analyses]
        }
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"\n[Pillar 4] Results saved to {output_path}")
        return output_path
    
    def generate_report(self) -> str:
        """Generate analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 4: FRACTAL STRUCTURE ANALYSIS - REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            f"Texts analyzed: {len(self.analyses)}",
            ""
        ]
        
        for analysis in self.analyses:
            lines.append(f"Text: {analysis.name}")
            lines.append(f"  Length: {analysis.text_length:,} chars")
            
            dr = analysis.digital_root_self_similarity
            if "avg_self_similarity" in dr:
                lines.append(f"  Digital root self-similarity: {dr['avg_self_similarity']:.4f}")
            
            wf = analysis.word_length_fractal
            if "fractal_dimension" in wf:
                lines.append(f"  Word-length fractal dim: {wf['fractal_dimension']:.4f}")
                lines.append(f"  Hurst exponent: {wf['hurst_exponent']:.4f}")
            
            sh = analysis.sentence_length_hurst
            if "overall_hurst" in sh:
                lines.append(f"  Sentence Hurst: {sh['overall_hurst']:.4f}")
                lines.append(f"  Persistence ratio: {sh['persistence_ratio']:.3f}")
            
            cr = analysis.cross_scale_recurrence
            if "avg_recurrence" in cr:
                lines.append(f"  Cross-scale recurrence: {cr['avg_recurrence']:.4f}")
            
            rs = analysis.recursive_structure
            if "max_nested_score" in rs:
                lines.append(f"  Recursive structure: {rs['max_nested_score']:.4f}")
            
            lines.append(f"  COMPOSITE SCORE: {analysis.composite_score:.4f}")
            lines.append("")
        
        # Summary
        anomalies = self.identify_anomalies(["Shakespeare (control)", "Moby Dick (control)", "Pride & Prejudice (control)"])
        
        lines.append("=" * 70)
        lines.append("SUMMARY")
        lines.append("=" * 70)
        lines.append(f"Anomalous texts (score > max control): {len(anomalies)}")
        
        if anomalies:
            lines.append("STATUS: Potential fractal encoding detected.")
            for a in anomalies:
                lines.append(f"  - {a.name} (score: {a.composite_score:.4f})")
        else:
            lines.append("STATUS: No texts exceeded control maximum.")
        
        return "\n".join(lines)


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_fractal_analysis():
    """Run comprehensive fractal analysis."""
    print("=" * 70)
    print("PILLAR 4: FRACTAL STRUCTURE ANALYSIS")
    print("=" * 70)
    
    analyzer = FractalAnalyzer(output_dir="research/pillars/pillar4_simulation/outputs")
    
    # Load real control texts
    print("\n[1] Loading control texts...")
    controls_dir = Path(__file__).resolve().parent / "data" / "controls"
    
    control_texts = {}
    for name, filename in {
        "Shakespeare (control)": "shakespeare.txt",
        "Moby Dick (control)": "moby_dick.txt",
        "Pride & Prejudice (control)": "pride_and_prejudice.txt"
    }.items():
        filepath = controls_dir / filename
        if filepath.exists():
            text = load_text(str(filepath))
            control_texts[name] = text[:200000]
            print(f"  Loaded {name}: {len(text):,} chars")
    
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
                sample = content[:200000] if len(content) > 200000 else content
                ancient_texts[display_name] = sample
                print(f"  Loaded {display_name}: {len(content):,} chars")
            except Exception as e:
                print(f"  Error loading {display_name}: {e}")
    
    # Combine all texts
    all_texts = {}
    all_texts.update(control_texts)
    all_texts.update(ancient_texts)
    
    # Run analysis
    print(f"\n[3] Running fractal analysis on {len(all_texts)} texts...")
    results = analyzer.analyze_batch(all_texts)
    analyzer.analyses = results
    
    # Compute scores
    print("\n[4] Computing composite scores...")
    analyzer.compute_composite_scores()
    
    # Print report
    print("\n" + analyzer.generate_report())
    
    # Save
    analyzer.save_results("pillar4_fractal_results.json")
    
    return analyzer


if __name__ == "__main__":
    run_fractal_analysis()
