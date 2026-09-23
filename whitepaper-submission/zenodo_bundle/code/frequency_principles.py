#!/usr/bin/env python3
"""
PILLAR 4: FREQUENCY PRINCIPLES IN ANCIENT TEXTS
=================================================
Goal: Extract and analyze regenerative/life principles from ancient wisdom texts.

NEW FRAMEWORK:
Ancient texts are instruction manuals for vibrational/regenerative life.
This pipeline extracts passages about:
- Sound, vibration, frequency, resonance
- Creation, generation, regeneration
- Healing, restoration, life force
- Divine word/command as creative mechanism

METHODOLOGY:
1. Keyword extraction: Find passages containing vibrational/regenerative concepts
2. Cross-text comparison: Do ALL traditions contain the same core principles?
3. Principle clustering: Group related concepts into a unified framework
4. Control validation: Compare against non-wisdom texts to ensure specificity

DELIVERABLE: The Regenerative Code — common vibrational principles across all ancient traditions
"""

import hashlib
import json
import math
import os
import random
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple, Set


# =============================================================================
# CONCEPT ONTOLOGY
# =============================================================================

# Core vibrational/regenerative concepts to search for
VIBRATIONAL_CONCEPTS = {
    "sound_creation": [
        "sound", "voice", "word", "speak", "said", "cried", "shouted",
        "sing", "song", "music", "tone", "frequency", "vibration",
        "resonance", "echo", "thunder", "trumpet", "sound", "noise"
    ],
    "divine_command": [
        "god said", "lord said", "command", "created", "made", "let there be",
        "thus saith", "behold", "verily", "truly", "amen"
    ],
    "life_force": [
        "spirit", "breath", "life", "soul", "heart", "mind", "essence",
        "energy", "power", "light", "fire", "flame", "living", "alive"
    ],
    "regeneration": [
        "heal", "healing", "restore", "renew", "regenerate", "revive",
        "resurrect", "raise", "life", "live", "eternal", "forever",
        "immortal", "perpetual", "everlasting", "endless"
    ],
    "frequency_structure": [
        "seven", "sevenfold", "seven times", "thrice", "three times",
        "forty", "forty days", "twelve", "twelve tribes", "hundred",
        "thousand", "ten thousand", "multitude", "innumerable"
    ],
    "water_life": [
        "water", "river", "stream", "fountain", "spring", "well",
        "sea", "ocean", "flood", "rain", "dew", "moisture", "flow"
    ],
    "light_creation": [
        "light", "darkness", "shining", "bright", "glory", "radiant",
        "lamp", "candle", "fire", "flame", "illuminate", "enlighten"
    ],
    "sacred_numbers": [
        "three", "six", "nine", "twelve", "seven", "forty", "fifty",
        "hundred", "thousand", "ten", "twelve", "twenty", "fifty"
    ]
}

# Synonym/related terms for each concept
CONCEPT_RELATIONS = {
    "sound_creation": ["frequency", "vibration", "resonance", "wave", "oscillation"],
    "divine_command": ["word", "speech", "utterance", "decree", "fiat"],
    "life_force": ["vitality", "animating", "quickening", "spark", "essence"],
    "regeneration": ["restoration", "renewal", "revival", "healing", "recovery"],
    "frequency_structure": ["pattern", "cycle", "rhythm", "periodic", "recurring"],
    "water_life": ["fluid", "flow", "current", "stream", "source"],
    "light_creation": ["radiance", "luminescence", "brilliance", "splendor"],
    "sacred_numbers": ["numeric", "numerical", "count", "measure", "reckon"]
}


# =============================================================================
# TEXT UTILITIES
# =============================================================================

def load_text(filepath: str) -> str:
    """Load text from file."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def find_passages(text: str, keywords: List[str], window: int = 100) -> List[Dict]:
    """
    Find passages containing keywords with context windows.
    
    Args:
        text: Text to search
        keywords: List of keywords to find
        window: Characters of context before/after match
    
    Returns:
        List of passage dictionaries
    """
    passages = []
    text_lower = text.lower()
    
    for keyword in keywords:
        pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)
        for match in pattern.finditer(text):
            start = max(0, match.start() - window)
            end = min(len(text), match.end() + window)
            context = text[start:end]
            
            passages.append({
                "keyword": keyword,
                "position": match.start(),
                "context": context,
                "concept_category": categorize_keyword(keyword)
            })
    
    return passages


def categorize_keyword(keyword: str) -> str:
    """Categorize keyword into concept category."""
    keyword_lower = keyword.lower()
    
    for category, keywords in VIBRATIONAL_CONCEPTS.items():
        if keyword_lower in [k.lower() for k in keywords]:
            return category
    
    return "unknown"


def extract_passages_by_concept(text: str, concept: str, window: int = 100) -> List[Dict]:
    """Extract all passages related to a specific concept."""
    if concept not in VIBRATIONAL_CONCEPTS:
        return []
    
    keywords = VIBRATIONAL_CONCEPTS[concept]
    return find_passages(text, keywords, window)


# =============================================================================
# PRINCIPLE EXTRACTION
# =============================================================================

@dataclass
class Principle:
    """Extracted principle from ancient texts."""
    name: str
    description: str
    supporting_passages: List[Dict]
    texts_found_in: List[str]
    frequency: int  # How many times principle appears
    confidence: float  # 0-1 based on cross-text agreement
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "supporting_passages": self.supporting_passages[:5],  # Top 5
            "texts_found_in": self.texts_found_in,
            "frequency": self.frequency,
            "confidence": round(self.confidence, 3)
        }


class PrincipleExtractor:
    """
    Extract regenerative/life principles from ancient texts.
    
    Identifies patterns across multiple texts to find universal principles.
    """
    
    def __init__(self):
        self.principles: List[Principle] = []
        self.text_passages: Dict[str, List[Dict]] = {}
    
    def analyze_text(self, name: str, text: str):
        """Analyze a text and extract all relevant passages."""
        print(f"  Analyzing: {name}")
        
        passages = []
        for concept in VIBRATIONAL_CONCEPTS:
            concept_passages = extract_passages_by_concept(text, concept, window=150)
            passages.extend(concept_passages)
        
        self.text_passages[name] = passages
        print(f"    Found {len(passages)} relevant passages")
    
    def extract_principles(self) -> List[Principle]:
        """
        Extract common principles across all analyzed texts.
        
        Returns list of principles sorted by confidence.
        """
        # Count concept co-occurrences
        concept_counts = defaultdict(lambda: defaultdict(int))
        
        for text_name, passages in self.text_passages.items():
            for passage in passages:
                concept = passage["concept_category"]
                concept_counts[concept][text_name] += 1
        
        # Extract principles based on concept patterns
        principles = []
        
        # Principle 1: Divine Sound Creates
        if self._concept_present(concept_counts, ["sound_creation", "divine_command"]):
            principles.append(self._create_principle(
                name="Divine Sound Creates",
                description="The universe is created through divine sound/word/command. Sound is the fundamental creative force.",
                concepts=["sound_creation", "divine_command"],
                concept_counts=concept_counts
            ))
        
        # Principle 2: Life Force / Breath
        if self._concept_present(concept_counts, ["life_force", "divine_command"]):
            principles.append(self._create_principle(
                name="Divine Breath Animates Life",
                description="Life is infused through divine breath/spirit. The animating force comes from the divine.",
                concepts=["life_force", "divine_command"],
                concept_counts=concept_counts
            ))
        
        # Principle 3: Regeneration Through Divine Power
        if self._concept_present(concept_counts, ["regeneration", "divine_command"]):
            principles.append(self._create_principle(
                name="Divine Power Regenerates",
                description="Healing and regeneration come through divine power/authority. The divine can restore and renew life.",
                concepts=["regeneration", "divine_command"],
                concept_counts=concept_counts
            ))
        
        # Principle 4: Water as Life Medium
        if self._concept_present(concept_counts, ["water_life", "life_force"]):
            principles.append(self._create_principle(
                name="Water as Life Medium",
                description="Water is the medium through which life flows and is sustained. Living water represents the source of life.",
                concepts=["water_life", "life_force"],
                concept_counts=concept_counts
            ))
        
        # Principle 5: Light as Creative Force
        if self._concept_present(concept_counts, ["light_creation", "divine_command"]):
            principles.append(self._create_principle(
                name="Light as Creative Force",
                description="Light is the first creation and represents divine presence. Light dispels darkness and enables life.",
                concepts=["light_creation", "divine_command"],
                concept_counts=concept_counts
            ))
        
        # Principle 6: Sacred Numbers / Structure
        if self._concept_present(concept_counts, ["sacred_numbers", "frequency_structure"]):
            principles.append(self._create_principle(
                name="Numerical Structure of Creation",
                description="Creation follows numerical patterns and structures. Specific numbers (3, 6, 9, 7, 12, 40) carry structural significance.",
                concepts=["sacred_numbers", "frequency_structure"],
                concept_counts=concept_counts
            ))
        
        # Principle 7: Sound/Water Connection
        if self._concept_present(concept_counts, ["sound_creation", "water_life"]):
            principles.append(self._create_principle(
                name="Sound and Water Interact",
                description="Sound/vibration interacts with water to create or transform. Water responds to vibrational frequencies.",
                concepts=["sound_creation", "water_life"],
                concept_counts=concept_counts
            ))
        
        # Sort by confidence
        principles.sort(key=lambda p: -p.confidence)
        self.principles = principles
        
        return principles
    
    def _concept_present(self, concept_counts: Dict, concepts: List[str]) -> bool:
        """Check if concept combination appears in at least 2 texts."""
        texts_with_concepts = set()
        for concept in concepts:
            if concept in concept_counts:
                texts_with_concepts.update(concept_counts[concept].keys())
        return len(texts_with_concepts) >= 2
    
    def _create_principle(self, name: str, description: str, concepts: List[str], 
                          concept_counts: Dict) -> Principle:
        """Create a principle from concept analysis."""
        # Collect supporting passages
        supporting = []
        texts_found = set()
        total_freq = 0
        
        for text_name, passages in self.text_passages.items():
            for passage in passages:
                if passage["concept_category"] in concepts:
                    supporting.append(passage)
                    texts_found.add(text_name)
                    total_freq += 1
        
        # Compute confidence based on:
        # 1. Number of texts containing principle
        # 2. Total frequency of supporting passages
        # 3. Number of concepts supporting it
        text_coverage = len(texts_found) / len(self.text_passages) if self.text_passages else 0
        frequency_score = min(total_freq / 50.0, 1.0)
        concept_support = len(concepts) / len(VIBRATIONAL_CONCEPTS)
        
        confidence = (text_coverage * 0.5 + frequency_score * 0.3 + concept_support * 0.2)
        
        return Principle(
            name=name,
            description=description,
            supporting_passages=supporting[:10],
            texts_found_in=list(texts_found),
            frequency=total_freq,
            confidence=confidence
        )
    
    def save_results(self, output_path: str):
        """Save extracted principles."""
        data = {
            "pillar": "Pillar 4: Frequency Principles in Ancient Texts",
            "generated": datetime.utcnow().isoformat() + "Z",
            "texts_analyzed": list(self.text_passages.keys()),
            "principles": [p.to_dict() for p in self.principles]
        }
        
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"\n[Pillar 4] Principles saved to {output_path}")


# =============================================================================
# CONTROL VALIDATION
# =============================================================================

class ControlValidator:
    """
    Validate that extracted principles are specific to wisdom texts,
    not just general language patterns.
    """
    
    def __init__(self):
        self.control_passages: Dict[str, List[Dict]] = {}
    
    def analyze_control(self, name: str, text: str):
        """Analyze a control text."""
        passages = []
        for concept in VIBRATIONAL_CONCEPTS:
            concept_passages = extract_passages_by_concept(text, concept, window=150)
            passages.extend(concept_passages)
        self.control_passages[name] = passages
        print(f"  Control {name}: {len(passages)} passages")
    
    def compare(self, principles: List[Principle]) -> Dict:
        """
        Compare wisdom text principles against controls.
        
        Returns validation metrics.
        """
        control_total = sum(len(p) for p in self.control_passages.values())
        wisdom_total = sum(p.frequency for p in principles)
        
        # Compute principle specificity
        # Principles should be more prevalent in wisdom texts than controls
        wisdom_texts_count = len(principles[0].texts_found_in) if principles else 0
        control_texts_count = len(self.control_passages)
        
        # Average passages per text
        wisdom_avg = wisdom_total / wisdom_texts_count if wisdom_texts_count > 0 else 0
        control_avg = control_total / control_texts_count if control_texts_count > 0 else 0
        
        specificity = wisdom_avg / control_avg if control_avg > 0 else 0
        
        return {
            "wisdom_texts_analyzed": wisdom_texts_count,
            "control_texts_analyzed": control_texts_count,
            "total_wisdom_passages": wisdom_total,
            "total_control_passages": control_total,
            "wisdom_avg_per_text": round(wisdom_avg, 2),
            "control_avg_per_text": round(control_avg, 2),
            "specificity_ratio": round(specificity, 3),
            "interpretation": self._interpret_specificity(specificity)
        }
    
    def _interpret_specificity(self, ratio: float) -> str:
        if ratio > 2.0:
            return "Principles highly specific to wisdom texts - strong validation"
        elif ratio > 1.5:
            return "Principles moderately specific - some validation"
        elif ratio > 1.0:
            return "Principles somewhat specific - weak validation"
        else:
            return "Principles not specific to wisdom texts - may be general language patterns"


# =============================================================================
# MAIN ANALYSIS ENGINE
# =============================================================================

class FrequencyPrinciplesAnalyzer:
    """
    Main engine for Pillar 4: Frequency Principles in Ancient Texts.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.extractor = PrincipleExtractor()
        self.validator = ControlValidator()
        self.principles: List[Principle] = []
    
    def analyze_ancient_texts(self, corpora_dir: Path):
        """Analyze all ancient texts."""
        print("\n[1] Analyzing ancient texts...")
        
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
                    # Sample for performance
                    sample = content[:200000] if len(content) > 200000 else content
                    self.extractor.analyze_text(display_name, sample)
                except Exception as e:
                    print(f"  Error loading {display_name}: {e}")
    
    def analyze_controls(self, controls_dir: Path):
        """Analyze control texts."""
        print("\n[2] Analyzing control texts...")
        
        control_files = {
            "Shakespeare": "shakespeare.txt",
            "Moby Dick": "moby_dick.txt",
            "Pride & Prejudice": "pride_and_prejudice.txt"
        }
        
        for name, filename in control_files.items():
            filepath = controls_dir / filename
            if filepath.exists():
                text = load_text(str(filepath))
                sample = text[:200000] if len(text) > 200000 else text
                self.validator.analyze_control(name, sample)
    
    def extract_and_validate(self) -> Tuple[List[Principle], Dict]:
        """Extract principles and validate against controls."""
        print("\n[3] Extracting principles...")
        self.principles = self.extractor.extract_principles()
        
        print("\n[4] Validating against controls...")
        validation = self.validator.compare(self.principles)
        
        return self.principles, validation
    
    def generate_report(self, validation: Dict) -> str:
        """Generate analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 4: FREQUENCY PRINCIPLES IN ANCIENT TEXTS - REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            ""
        ]
        
        lines.append("EXTRACTED PRINCIPLES:")
        lines.append("-" * 70)
        
        for i, principle in enumerate(self.principles, 1):
            lines.append(f"\n{i}. {principle.name}")
            lines.append(f"   Description: {principle.description}")
            lines.append(f"   Found in: {', '.join(principle.texts_found_in)}")
            lines.append(f"   Frequency: {principle.frequency} passages")
            lines.append(f"   Confidence: {principle.confidence:.3f}")
        
        lines.append("\n" + "=" * 70)
        lines.append("VALIDATION RESULTS")
        lines.append("=" * 70)
        lines.append(f"Wisdom texts analyzed: {validation['wisdom_texts_analyzed']}")
        lines.append(f"Control texts analyzed: {validation['control_texts_analyzed']}")
        lines.append(f"Total wisdom passages: {validation['total_wisdom_passages']}")
        lines.append(f"Total control passages: {validation['total_control_passages']}")
        lines.append(f"Specificity ratio: {validation['specificity_ratio']}")
        lines.append(f"Interpretation: {validation['interpretation']}")
        
        lines.append("\n" + "=" * 70)
        lines.append("CONCLUSION")
        lines.append("=" * 70)
        
        if validation["specificity_ratio"] > 1.5:
            lines.append("Ancient texts contain specific frequency/regenerative principles")
            lines.append("not found in control literature. These principles represent")
            lines.append("a coherent framework for understanding life's regenerative nature.")
        else:
            lines.append("Frequency/regenerative principles found in ancient texts are")
            lines.append("also present in control literature. Further refinement needed.")
        
        return "\n".join(lines)
    
    def save_results(self, filename: str = "pillar4_frequency_principles.json"):
        """Save all results."""
        output_path = self.output_dir / filename
        
        principles_data = [p.to_dict() for p in self.principles]
        
        data = {
            "pillar": "Pillar 4: Frequency Principles in Ancient Texts",
            "generated": datetime.utcnow().isoformat() + "Z",
            "principles": principles_data
        }
        
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"\n[Pillar 4] Results saved to {output_path}")


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_analysis():
    """Run Pillar 4 frequency principles analysis."""
    print("=" * 70)
    print("PILLAR 4: FREQUENCY PRINCIPLES IN ANCIENT TEXTS")
    print("=" * 70)
    
    analyzer = FrequencyPrinciplesAnalyzer(output_dir="research/pillars/pillar4_frequency_principles/outputs")
    
    # Analyze ancient texts
    corpora_dir = Path(__file__).resolve().parent.parent.parent.parent / "bible-analysis"
    analyzer.analyze_ancient_texts(corpora_dir)
    
    # Analyze controls
    controls_dir = Path(__file__).resolve().parent / "data" / "controls"
    analyzer.analyze_controls(controls_dir)
    
    # Extract and validate
    principles, validation = analyzer.extract_and_validate()
    
    # Generate report
    report = analyzer.generate_report(validation)
    print("\n" + report)
    
    # Save
    analyzer.save_results("pillar4_frequency_principles.json")
    
    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)
    
    return analyzer, principles, validation


if __name__ == "__main__":
    run_analysis()
