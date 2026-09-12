#!/usr/bin/env python3
"""
MEDITATION APP — BATCH GENERATOR (PARALLEL)
============================================
Generates all chakra sessions with multiple variations using multiprocessing.

For each chakra:
- 7 audio variations (varying binaural offset, harmonics, volume)
- 7 visual variations
- HTML5 renderer for each variation

Total output: 9 chakras x 7 variations = 63 audio files + 63 visual files

Usage:
    python batch_generator.py [--duration MINUTES] [--variations N] [--dry-run] [--jobs N]
"""

import sys
import json
import argparse
import multiprocessing
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from binaural_beats import BinauralBeatGenerator, CHAKRA_FREQUENCIES
from visuals import MeditationApp as VisualApp


OFFSET_VARIATIONS = [5, 10, 15, 20, 25, 30, 35]
HARMONICS_VARIATIONS = [2, 3, 4, 5, 3, 4, 2]
VOLUME_VARIATIONS = [0.4, 0.5, 0.6, 0.5, 0.45, 0.55, 0.5]


def _generate_single_audio(task_args):
    """Worker function for multiprocessing — generates one audio file."""
    chakra_name, base_freq, variation, duration_minutes, output_dir_str = task_args
    
    offset = OFFSET_VARIATIONS[(variation - 1) % len(OFFSET_VARIATIONS)]
    harmonics = HARMONICS_VARIATIONS[(variation - 1) % len(HARMONICS_VARIATIONS)]
    volume = VOLUME_VARIATIONS[(variation - 1) % len(VOLUME_VARIATIONS)]
    
    filename = f"{chakra_name}_{base_freq}hz_offset{offset}_harm{harmonics}_var{variation}.wav"
    output_path = Path(output_dir_str) / "audio" / filename
    
    if output_path.exists():
        return {
            "chakra": chakra_name,
            "variation": variation,
            "filename": filename,
            "skipped": True,
            "output_path": str(output_path)
        }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    gen = BinauralBeatGenerator()
    samples = gen.generate_binaural(
        base_freq=base_freq,
        binaural_offset=offset,
        duration_seconds=duration_minutes * 60.0,
        volume=volume,
        fade_seconds=15.0,
        harmonics=harmonics,
        add_pink_noise=True,
        add_carrier=True
    )
    gen.save_wav(samples, str(output_path))
    
    return {
        "chakra": chakra_name,
        "variation": variation,
        "filename": filename,
        "base_freq": base_freq,
        "binaural_offset": offset,
        "harmonics": harmonics,
        "volume": volume,
        "duration_minutes": duration_minutes,
        "output_path": str(output_path),
        "skipped": False
    }


class BatchGenerator:
    """
    Generate all chakra sessions with multiple variations.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.audio_engine = BinauralBeatGenerator()
        self.visual_app = VisualApp(output_dir=str(self.output_dir))
    
    def generate_all_chakras(self, duration_minutes: float = 10.0, variations_per_chakra: int = 7, jobs: int = None):
        """Generate all chakra sessions with variations (parallel audio)."""
        total_sessions = len(CHAKRA_FREQUENCIES) * variations_per_chakra
        print("=" * 70)
        print("BATCH GENERATOR — ALL CHAKRAS (PARALLEL)")
        print("=" * 70)
        print(f"Chakras: {len(CHAKRA_FREQUENCIES)}")
        print(f"Variations per chakra: {variations_per_chakra}")
        print(f"Duration per session: {duration_minutes} minutes")
        print(f"Total sessions: {total_sessions}")
        print(f"Parallel jobs: {jobs or multiprocessing.cpu_count()}")
        print("=" * 70)
        
        # ---- Phase 1: Generate all audio in parallel ----
        tasks = []
        for chakra_name, chakra_data in CHAKRA_FREQUENCIES.items():
            for v in range(1, variations_per_chakra + 1):
                tasks.append((chakra_name, chakra_data["frequency"], v, duration_minutes, str(self.output_dir)))
        
        # Check how many already exist
        existing = sum(1 for t in tasks if (self.output_dir / "audio" / 
                       f"{t[0]}_{t[1]}hz_offset{OFFSET_VARIATIONS[(t[2]-1)%7]}_harm{HARMONICS_VARIATIONS[(t[2]-1)%7]}_var{t[2]}.wav").exists())
        print(f"\n[Phase 1] Generating audio ({len(tasks)} tasks, {existing} already exist)...")
        
        n_jobs = jobs or multiprocessing.cpu_count()
        with multiprocessing.Pool(processes=n_jobs) as pool:
            audio_results = pool.map(_generate_single_audio, tasks)
        
        # Group audio results by chakra
        audio_by_chakra = {}
        for r in audio_results:
            audio_by_chakra.setdefault(r["chakra"], []).append(r)
        
        print(f"  Audio complete: {sum(1 for r in audio_results if not r.get('skipped'))} generated, {existing} skipped")
        
        # ---- Phase 2: Generate all visuals sequentially ----
        print(f"\n[Phase 2] Generating visuals ({total_sessions} files)...")
        all_results = {}
        
        for chakra_name, chakra_data in CHAKRA_FREQUENCIES.items():
            print(f"\n{'='*70}")
            print(f"CHAKRA: {chakra_data['name'].upper()} ({chakra_data['sanskrit']})")
            print(f"Frequency: {chakra_data['frequency']} Hz")
            print(f"{'='*70}")
            
            audio_variations = audio_by_chakra.get(chakra_name, [])
            
            print(f"\n[2/2] Generating {variations_per_chakra} visual variations...")
            visual_variations = []
            for i in range(variations_per_chakra):
                variation = i + 1
                viz_path = self.output_dir / "visuals" / f"{chakra_name}_var{variation}_visualization.json"
                html_path = self.output_dir / "visuals" / f"{chakra_name}_var{variation}_meditation.html"
                
                if viz_path.exists() and html_path.exists():
                    print(f"  Visual variation {variation}: SKIP (already exists)")
                    visual_variations.append({
                        "variation": variation,
                        "visualization_json": str(viz_path),
                        "html_path": str(html_path),
                        "skipped": True
                    })
                    continue
                
                print(f"  Visual variation {variation}...")
                
                viz_data = self.visual_app.visual_generator.generate_visualization(
                    chakra_name,
                    duration_seconds=duration_minutes * 60.0,
                    fps=30
                )
                
                viz_path.parent.mkdir(parents=True, exist_ok=True)
                with open(viz_path, "w") as f:
                    json.dump(viz_data, f, indent=2)
                
                html_path.parent.mkdir(parents=True, exist_ok=True)
                self.visual_app.html_renderer.generate_html(viz_data, str(html_path))
                
                visual_variations.append({
                    "variation": variation,
                    "visualization_json": str(viz_path),
                    "html_path": str(html_path)
                })
            
            all_results[chakra_name] = {
                "chakra_name": chakra_data["name"],
                "sanskrit": chakra_data["sanskrit"],
                "frequency": chakra_data["frequency"],
                "purpose": chakra_data["purpose"],
                "color": chakra_data["color"],
                "audio_variations": audio_variations,
                "visual_variations": visual_variations,
                "total_variations": len(audio_variations)
            }
            
            # Save manifest incrementally (resumable)
            manifest_path = self.output_dir / "master_manifest.json"
            with open(manifest_path, "w") as f:
                json.dump(all_results, f, indent=2)
        
        print(f"\n{'='*70}")
        print("BATCH GENERATION COMPLETE")
        print(f"{'='*70}")
        audio_count = sum(len(v) for v in audio_by_chakra.values())
        visual_count = sum(len(v["visual_variations"]) for v in all_results.values())
        print(f"Total sessions: {audio_count}")
        print(f"Audio files: {audio_count}")
        print(f"Visual files: {visual_count}")
        print(f"Master manifest: {manifest_path}")
        print(f"{'='*70}")
        
        return all_results


def run_batch_generation(duration_minutes=10.0, variations_per_chakra=7, jobs=None):
    """Run batch generation for all chakras."""
    generator = BatchGenerator(output_dir="meditation-app/outputs")
    results = generator.generate_all_chakras(
        duration_minutes=duration_minutes,
        variations_per_chakra=variations_per_chakra,
        jobs=jobs
    )
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Batch generate all 63 chakra meditation sessions (parallel)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python batch_generator.py                # 10-min sessions, 7 variations each (63 total)
  python batch_generator.py --duration 5   # 5-min sessions
  python batch_generator.py --variations 3 # Only 3 variations per chakra (27 total)
  python batch_generator.py --jobs 2       # Use 2 parallel processes
  python batch_generator.py --dry-run      # Preview what would be generated
""")
    parser.add_argument(
        "--duration", type=float, default=10.0,
        help="Duration per session in minutes (default: 10)"
    )
    parser.add_argument(
        "--variations", type=int, default=7,
        help="Variations per chakra (default: 7)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be generated without creating files"
    )
    parser.add_argument(
        "--jobs", type=int, default=None,
        help="Number of parallel worker processes (default: CPU count)"
    )
    args = parser.parse_args()
    
    if args.dry_run:
        total = len(CHAKRA_FREQUENCIES) * args.variations
        print(f"Would generate {total} sessions ({len(CHAKRA_FREQUENCIES)} chakras x {args.variations} variations)")
        print(f"Each {args.duration} minutes")
        print(f"Approximate audio disk usage: ~{args.duration * 9.6 * total / 1000:.1f} GB")
        print(f"Parallel jobs: {args.jobs or multiprocessing.cpu_count()}")
        for chakra_name, chakra_data in CHAKRA_FREQUENCIES.items():
            print(f"  {chakra_data['name']} ({chakra_data['frequency']} Hz)")
    else:
        run_batch_generation(
            duration_minutes=args.duration,
            variations_per_chakra=args.variations,
            jobs=args.jobs
        )
