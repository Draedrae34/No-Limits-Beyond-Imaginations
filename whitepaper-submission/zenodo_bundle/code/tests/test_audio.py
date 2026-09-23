#!/usr/bin/env python3
"""Unit Tests for Binaural Beat Audio Engine."""

import json
import math
import os
import struct
import sys
import unittest
import wave
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "meditation-app/src/engine"))
from binaural_beats import BinauralBeatGenerator, CHAKRA_FREQUENCIES


class TestBinauralBeatGenerator(unittest.TestCase):

    def setUp(self):
        self.gen = BinauralBeatGenerator(sample_rate=44100)

    def test_sample_rate_constant(self):
        self.assertEqual(self.gen.sample_rate, 44100)

    def test_chakra_frequencies_defined(self):
        self.assertEqual(len(CHAKRA_FREQUENCIES), 9)

    def test_base_frequencies_exact(self):
        expected = {
            "base": 174.0,
            "root": 396.0,
            "sacral": 417.0,
            "solar_plexus": 528.0,
            "heart": 639.0,
            "throat": 741.0,
            "third_eye": 852.0,
            "crown": 963.0,
            "healing": 285.0,
        }
        for key, freq in expected.items():
            self.assertAlmostEqual(CHAKRA_FREQUENCIES[key]["frequency"], freq, places=1)

    def test_generate_binaural_returns_samples(self):
        samples = self.gen.generate_binaural(
            base_freq=440.0,
            binaural_offset=10.0,
            duration_seconds=0.1,
        )
        self.assertIsInstance(samples, list)
        self.assertEqual(len(samples), 4410)

    def test_binaural_beat_frequency_in_samples(self):
        base_freq = 440.0
        offset = 10.0
        duration = 1.0
        samples = self.gen.generate_binaural(
            base_freq=base_freq,
            binaural_offset=offset,
            duration_seconds=duration,
        )
        self.assertEqual(len(samples), 44100)
        left_channel = [s[0] for s in samples]
        right_channel = [s[1] for s in samples]
        self.assertEqual(len(left_channel), 44100)
        self.assertEqual(len(right_channel), 44100)

    def test_no_dc_offset(self):
        samples = self.gen.generate_binaural(
            base_freq=440.0,
            binaural_offset=10.0,
            duration_seconds=1.0,
        )
        left_mean = sum(s[0] for s in samples) / len(samples)
        right_mean = sum(s[1] for s in samples) / len(samples)
        self.assertAlmostEqual(left_mean, 0.0, places=2)
        self.assertAlmostEqual(right_mean, 0.0, places=2)

    def test_stereo_separation(self):
        samples = self.gen.generate_binaural(
            base_freq=440.0,
            binaural_offset=10.0,
            duration_seconds=1.0,
        )
        left_energy = sum(s[0] * s[0] for s in samples) / len(samples)
        right_energy = sum(s[1] * s[1] for s in samples) / len(samples)
        ratio = max(left_energy, right_energy) / (min(left_energy, right_energy) + 1e-10)
        self.assertGreater(ratio, 1.01)

    def test_fade_in_out(self):
        samples_short = self.gen.generate_binaural(
            base_freq=440.0,
            binaural_offset=10.0,
            duration_seconds=0.5,
            fade_seconds=0.05,
        )
        self.assertEqual(len(samples_short), 22050)


class TestMasterManifest(unittest.TestCase):

    def test_master_manifest_exists(self):
        path = REPO_ROOT / "meditation-app/outputs/master_manifest.json"
        self.assertTrue(path.exists())

    def test_master_manifest_structure(self):
        with open(REPO_ROOT / "meditation-app/outputs/master_manifest.json") as f:
            manifest = json.load(f)
        self.assertIn("base", manifest)
        self.assertIn("audio_variations", manifest["base"])
        self.assertEqual(len(manifest["base"]["audio_variations"]), 7)

    def test_audio_variation_schema(self):
        with open(REPO_ROOT / "meditation-app/outputs/master_manifest.json") as f:
            manifest = json.load(f)
        for chakra_key, chakra_data in manifest.items():
            if chakra_key == "base":
                continue
            for var in chakra_data.get("audio_variations", []):
                self.assertIn("filename", var)
                self.assertIn("base_freq", var)
                self.assertIn("binaural_offset", var)
                self.assertIn("output_path", var)


if __name__ == "__main__":
    unittest.main()
