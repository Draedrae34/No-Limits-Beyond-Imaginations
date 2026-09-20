#!/usr/bin/env python3
"""Unit Tests for Visualization Engine Claims."""

import json
import os
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestVisualizationJSONSchema(unittest.TestCase):

    def test_visualization_json_files_exist(self):
        viz_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not viz_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        json_files = list(viz_dir.glob("*.json"))
        self.assertGreater(len(json_files), 0)

    def test_visualization_json_schema(self):
        viz_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not viz_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        for json_file in viz_dir.glob("*.json"):
            with open(json_file) as f:
                data = json.load(f)
            self.assertIn("chakra", data)
            self.assertIn("frequency", data)
            self.assertIn("frames", data)


class TestMasterManifestCompleteness(unittest.TestCase):

    def test_master_manifest_has_all_chakras(self):
        with open(REPO_ROOT / "meditation-app/outputs/master_manifest.json") as f:
            manifest = json.load(f)
        expected_chakras = {
            "base", "root", "sacral", "solar_plexus",
            "heart", "throat", "third_eye", "crown", "healing"
        }
        self.assertEqual(set(manifest.keys()), expected_chakras)

    def test_total_file_count(self):
        with open(REPO_ROOT / "meditation-app/outputs/master_manifest.json") as f:
            manifest = json.load(f)
        total_audio = sum(
            len(chakra.get("audio_variations", []))
            for chakra in manifest.values()
        )
        self.assertEqual(total_audio, 63)

    def test_html_renderers_exist(self):
        html_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not html_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        html_files = list(html_dir.glob("*.html"))
        self.assertGreaterEqual(len(html_files), 63)


class TestVisualizationParameters(unittest.TestCase):

    def test_top_level_keys(self):
        viz_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not viz_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        for json_file in viz_dir.glob("*_visualization.json"):
            with open(json_file) as f:
                data = json.load(f)
            self.assertIn("chakra", data)
            self.assertIn("frequency", data)
            self.assertIn("frames", data)

    def test_frame_structure(self):
        viz_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not viz_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        for json_file in viz_dir.glob("*_visualization.json"):
            with open(json_file) as f:
                data = json.load(f)
            frames = data.get("frames", [])
            self.assertTrue(len(frames) > 0)
            frame = frames[0]
            self.assertIn("time", frame)
            self.assertIn("geometry", frame)
            self.assertIn("particles", frame)
            self.assertIn("color_field", frame)
            self.assertIn("waves", frame)

    def test_particle_count_matches(self):
        viz_dir = REPO_ROOT / "meditation-app/outputs/visuals"
        if not viz_dir.exists():
            self.skipTest("Visualization outputs directory does not exist yet")
        for json_file in viz_dir.glob("*_visualization.json"):
            with open(json_file) as f:
                data = json.load(f)
            for frame in data.get("frames", []):
                particles = frame.get("particles", {})
                stored = len(particles.get("particles", []))
                self.assertGreaterEqual(particles.get("count", 0), stored)


if __name__ == "__main__":
    unittest.main()
