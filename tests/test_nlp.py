#!/usr/bin/env python3
"""Unit Tests for NLP Research Claims."""

import json
import math
import os
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent


class TestJaccardSimilarity(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(REPO_ROOT / "research/pillars/pillar2_ai_pattern/outputs/pillar2_full_corpora_results.json") as f:
            cls.data = json.load(f)

    def test_kjv_enoch_jaccard(self):
        corpus = next(c for c in self.data["analyses"] if c["name"] == "KJV Bible")
        jaccard = corpus["cross_corpus_patterns"]["Book of Enoch"]["jaccard_similarity"]
        self.assertGreaterEqual(jaccard, 0.0)
        self.assertLessEqual(jaccard, 1.0)

    def test_thomas_nag_hammadi_jaccard(self):
        corpus = next(c for c in self.data["analyses"] if c["name"] == "Gospel of Thomas")
        jaccard = corpus["cross_corpus_patterns"]["Nag Hammadi Library"]["jaccard_similarity"]
        self.assertGreaterEqual(jaccard, 0.0)
        self.assertLessEqual(jaccard, 1.0)

    def test_jaccard_range_all_pairs(self):
        for corpus in self.data["analyses"]:
            for pair_name, pair_data in corpus["cross_corpus_patterns"].items():
                j = pair_data["jaccard_similarity"]
                self.assertGreaterEqual(j, 0.0)
                self.assertLessEqual(j, 1.0)


class TestStylometry(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(REPO_ROOT / "research/pillars/pillar2_ai_pattern/outputs/pillar2_full_corpora_results.json") as f:
            cls.data = json.load(f)

    def test_enoch_ttr_range(self):
        enoch = next(c for c in self.data["analyses"] if c["name"] == "Book of Enoch")
        mean_ttr = enoch["mean_ttr"]
        self.assertGreater(mean_ttr, 0.0)
        self.assertLess(mean_ttr, 1.0)

    def test_enoch_burstiness_terms_exist(self):
        enoch = next(c for c in self.data["analyses"] if c["name"] == "Book of Enoch")
        self.assertTrue(len(enoch["top_bursty_terms"]) > 0)

    def test_all_corpora_have_ttr(self):
        for corpus in self.data["analyses"]:
            self.assertIn("mean_ttr", corpus)
            self.assertGreater(corpus["mean_ttr"], 0.0)


class TestSpecificityRatio(unittest.TestCase):

    def test_specificity_ratio_file_exists(self):
        path = REPO_ROOT / "research/pillars/pillar2_ai_pattern/outputs/specificity_ratio_2.667x.json"
        self.assertTrue(path.exists())

    def test_specificity_ratio_value(self):
        with open(REPO_ROOT / "research/pillars/pillar2_ai_pattern/outputs/specificity_ratio_2.667x.json") as f:
            data = json.load(f)
        self.assertEqual(data["value"], 2.667)
        self.assertEqual(data["unit"], "x")

    def test_specificity_ratio_coverage_rates(self):
        with open(REPO_ROOT / "research/pillars/pillar2_ai_pattern/outputs/specificity_ratio_2.667x.json") as f:
            data = json.load(f)
        ancient = data["methodology"]["ancient_principle_coverage"]
        control = data["methodology"]["control_principle_coverage"]
        self.assertEqual(ancient["coverage_rate"], 1.0)
        self.assertLess(control["coverage_rate"], ancient["coverage_rate"])


class TestFrequencyPrinciples(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with open(REPO_ROOT / "research/pillars/pillar4_frequency_principles/outputs/pillar4_frequency_principles.json") as f:
            cls.data = json.load(f)

    def test_seven_principles_extracted(self):
        self.assertEqual(len(self.data["principles"]), 7)

    def test_all_principles_found_in_all_texts(self):
        for principle in self.data["principles"]:
            self.assertEqual(len(principle["texts_found_in"]), 6)

    def test_principle_names(self):
        expected = {
            "Divine Sound Creates",
            "Divine Breath Animates Life",
            "Divine Power Regenerates",
            "Water as Life Medium",
            "Light as Creative Force",
            "Numerical Structure of Creation",
            "Sound and Water Interact"
        }
        actual = {p["name"] for p in self.data["principles"]}
        self.assertEqual(expected, actual)


if __name__ == "__main__":
    unittest.main()
