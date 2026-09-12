#!/usr/bin/env python3
"""
MEDITATION APP — MAIN CONTROLLER
=================================
Unified controller for the meditation app.

Integrates:
- Binaural beat audio generation
- 5D visual generation
- HTML5 renderer
- Session management
"""

import sys
import json
from pathlib import Path
from typing import Optional, Dict, List

# Add parent directories to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from binaural_beats import BinauralBeatGenerator, ChakraProgressionEngine, CHAKRA_FREQUENCIES
from visuals import MeditationApp as VisualApp


class MeditationApp:
    """
    Main meditation app controller.
    
    Generates complete meditation experiences:
    - Individual chakra sessions (10-60 minutes)
    - Progressive journeys (root to crown, etc.)
    - 5D visuals synchronized with audio
    - HTML5 renderer for web/app display
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.audio_engine = BinauralBeatGenerator()
        self.progression_engine = ChakraProgressionEngine(output_dir=str(self.output_dir))
        self.visual_app = VisualApp(output_dir=str(self.output_dir))
    
    def generate_chakra_session(
        self,
        chakra_name: str,
        duration_minutes: float = 60.0,
        generate_audio: bool = True,
        generate_visuals: bool = True
    ) -> Dict:
        """Generate complete chakra meditation session."""
        print(f"\n{'='*70}")
        print(f"GENERATING: {chakra_name.upper()} — {duration_minutes} minutes")
        print(f"{'='*70}")
        
        chakra = CHAKRA_FREQUENCIES[chakra_name]
        result = {
            "chakra": chakra_name,
            "name": chakra["name"],
            "sanskrit": chakra["sanskrit"],
            "frequency": chakra["frequency"],
            "color": chakra["color"],
            "purpose": chakra["purpose"],
            "duration_minutes": duration_minutes,
            "audio": None,
            "visuals": None
        }
        
        if generate_audio:
            print(f"\n[1/3] Generating binaural audio...")
            result["audio"] = self.audio_engine.generate_chakra_session(
                chakra_name,
                duration_minutes=duration_minutes,
                output_dir=str(self.output_dir / "audio")
            )
        
        if generate_visuals:
            print(f"\n[2/3] Generating 5D visuals...")
            visual_result = self.visual_app.generate_chakra_session(
                chakra_name,
                duration_minutes=duration_minutes
            )
            result["visuals"] = visual_result
        
        # Save session manifest
        manifest_path = self.output_dir / f"{chakra_name}_session.json"
        with open(manifest_path, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n[3/3] Session manifest saved: {manifest_path}")
        
        return result
    
    def generate_full_journey(
        self,
        sequence: List[str] = None,
        minutes_per_chakra: float = 7.5,
        include_transition: bool = True
    ) -> Dict:
        """Generate complete chakra journey."""
        if sequence is None:
            sequence = ["base", "root", "sacral", "solar_plexus", "heart", "throat", "third_eye", "crown"]
        
        print(f"\n{'='*70}")
        print(f"GENERATING FULL CHAKRA JOURNEY")
        print(f"Sequence: {' -> '.join(sequence)}")
        print(f"{'='*70}")
        
        # Generate audio progression
        print(f"\n[1/3] Generating audio progression...")
        audio_session = self.progression_engine.generate_progression(
            sequence,
            minutes_per_chakra=minutes_per_chakra,
            include_transition=include_transition
        )
        
        # Generate visuals for each chakra
        print(f"\n[2/3] Generating visuals for each chakra...")
        visual_sessions = {}
        for chakra_name in sequence:
            if chakra_name in CHAKRA_FREQUENCIES:
                viz = self.visual_app.generate_chakra_session(
                    chakra_name,
                    duration_minutes=minutes_per_chakra
                )
                visual_sessions[chakra_name] = viz
        
        # Generate full journey visualization
        print(f"\n[3/3] Generating full journey visualization...")
        journey_viz = self.visual_app.visual_engine.generate_full_journey_visualization(
            sequence,
            minutes_per_chakra=minutes_per_chakra,
            include_transition=include_transition
        )
        
        journey = {
            "sequence": sequence,
            "audio_session": audio_session,
            "visual_sessions": visual_sessions,
            "journey_visualization": journey_viz,
            "total_duration_minutes": len(sequence) * minutes_per_chakra + (len(sequence) - 1) * 0.5 if include_transition else len(sequence) * minutes_per_chakra
        }
        
        # Save journey manifest
        manifest_path = self.output_dir / "full_journey_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(journey, f, indent=2)
        print(f"\n  Journey manifest: {manifest_path}")
        
        return journey
    
    def generate_all_sessions(self, duration_minutes: float = 60.0) -> Dict:
        """Generate all 9 chakra sessions."""
        print(f"\n{'='*70}")
        print(f"GENERATING ALL 9 CHAKRA SESSIONS")
        print(f"{'='*70}")
        
        results = {}
        for chakra_name in CHAKRA_FREQUENCIES:
            result = self.generate_chakra_session(
                chakra_name,
                duration_minutes=duration_minutes,
                generate_audio=True,
                generate_visuals=True
            )
            results[chakra_name] = result
        
        return results


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run meditation app demonstration."""
    print("=" * 70)
    print("MEDITATION APP — MAIN CONTROLLER")
    print("=" * 70)
    
    app = MeditationApp(output_dir="meditation-app/outputs")
    
    # Demo 1: Single chakra (short)
    print("\n[DEMO 1] Generating Solar Plexus (528 Hz) — 5 minutes...")
    solar = app.generate_chakra_session("solar_plexus", duration_minutes=5.0)
    
    # Demo 2: Full journey
    print("\n[DEMO 2] Generating full root-to-crown journey...")
    journey = app.generate_full_journey(
        sequence=["base", "root", "sacral", "solar_plexus", "heart", "throat", "third_eye", "crown"],
        minutes_per_chakra=7.5
    )
    
    # Demo 3: All individual chakras (short for demo)
    print("\n[DEMO 3] Generating all 9 chakra sessions (1 min each)...")
    all_sessions = app.generate_all_sessions(duration_minutes=1.0)
    
    print("\n" + "=" * 70)
    print("MEDITATION APP READY")
    print("=" * 70)
    print(f"\nGenerated:")
    print(f"  - 1 short chakra session (5 min)")
    print(f"  - 1 full journey ({journey['total_duration_minutes']:.1f} min)")
    print(f"  - 9 individual chakra sessions (1 min each)")
    print(f"\nOutput: meditation-app/outputs/")
    
    return app


if __name__ == "__main__":
    run_demonstration()
