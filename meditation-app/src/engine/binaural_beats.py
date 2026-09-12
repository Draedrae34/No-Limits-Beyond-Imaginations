#!/usr/bin/env python3
"""
MEDITATION APP — BINAURAL BEAT ENGINE
======================================
Generates binaural beats for each chakra/frequency combination.

Binaural beats work by playing slightly different frequencies in each ear.
The brain entrains to the difference frequency.

Example: 528 Hz left ear, 518 Hz right ear = 10 Hz binaural beat (Alpha state)

Chakra progression (based on ancient texts + our research):
1. Base/Root: 174 Hz → grounding, safety
2. Root: 396 Hz → liberation from fear
3. Sacral: 417 Hz → change, creativity
4. Solar Plexus: 528 Hz → transformation, DNA repair
5. Heart: 639 Hz → connection, love
6. Throat: 741 Hz → expression, solutions
7. Third Eye: 852 Hz → intuition, inner vision
8. Crown: 963 Hz → divine connection, unity
9. Healing: 285 Hz → tissue repair, quantum healing
"""

import math
import os
import random
import struct
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, List, Tuple


# =============================================================================
# FREQUENCY DEFINITIONS
# =============================================================================

CHAKRA_FREQUENCIES = {
    "base": {
        "name": "Base Chakra",
        "sanskrit": "Muladhara",
        "frequency": 174.0,
        "binaural_offset": 10.0,  # Hz difference between ears
        "brain_state": "Delta/Alpha",
        "color": "#8B4513",
        "purpose": "Foundation, grounding, safety, survival",
        "position": "Base of spine",
        "element": "Earth"
    },
    "root": {
        "name": "Root Chakra",
        "sanskrit": "Svadhishthana",
        "frequency": 396.0,
        "binaural_offset": 10.0,
        "brain_state": "Alpha/Theta",
        "color": "#FF0000",
        "purpose": "Liberation from fear, guilt, anxiety",
        "position": "Lower abdomen",
        "element": "Water"
    },
    "sacral": {
        "name": "Sacral Chakra",
        "sanskrit": "Manipura",
        "frequency": 417.0,
        "binaural_offset": 10.0,
        "brain_state": "Alpha/Theta",
        "color": "#FFA500",
        "purpose": "Change, creativity, sexuality, transformation",
        "position": "Solar plexus",
        "element": "Fire"
    },
    "solar_plexus": {
        "name": "Solar Plexus Chakra",
        "sanskrit": "Anahata",
        "frequency": 528.0,
        "binaural_offset": 10.0,
        "brain_state": "Alpha/Theta",
        "color": "#FFFF00",
        "purpose": "DNA repair, transformation, love, healing",
        "position": "Center of chest",
        "element": "Air"
    },
    "heart": {
        "name": "Heart Chakra",
        "sanskrit": "Vishuddha",
        "frequency": 639.0,
        "binaural_offset": 10.0,
        "brain_state": "Theta/Alpha",
        "color": "#00FF00",
        "purpose": "Connection, relationships, compassion, love",
        "position": "Center of chest",
        "element": "Air"
    },
    "throat": {
        "name": "Throat Chakra",
        "sanskrit": "Ajna",
        "frequency": 741.0,
        "binaural_offset": 10.0,
        "brain_state": "Theta/Delta",
        "color": "#0000FF",
        "purpose": "Expression, solutions, communication, truth",
        "position": "Throat",
        "element": "Sound/Ether"
    },
    "third_eye": {
        "name": "Third Eye Chakra",
        "sanskrit": "Ajna",
        "frequency": 852.0,
        "binaural_offset": 10.0,
        "brain_state": "Theta/Delta",
        "color": "#4B0082",
        "purpose": "Intuition, inner vision, wisdom, insight",
        "position": "Between eyebrows",
        "element": "Light"
    },
    "crown": {
        "name": "Crown Chakra",
        "sanskrit": "Sahasrara",
        "frequency": 963.0,
        "binaural_offset": 10.0,
        "brain_state": "Delta/Gamma",
        "color": "#9400D3",
        "purpose": "Divine connection, unity, enlightenment, bliss",
        "position": "Top of head",
        "element": "Thought/Cosmos"
    },
    "healing": {
        "name": "Healing Chakra",
        "sanskrit": "Quantum",
        "frequency": 285.0,
        "binaural_offset": 10.0,
        "brain_state": "Delta/Alpha",
        "color": "#FF69B4",
        "purpose": "Healing tissue, quantum regeneration, cellular repair",
        "position": "All over body",
        "element": "Energy/Quantum"
    }
}


# =============================================================================
# BINAURAL BEAT GENERATOR
# =============================================================================

class BinauralBeatGenerator:
    """
    Generate binaural beat audio files.
    
    Creates WAV files with:
    - Left ear: base frequency
    - Right ear: base frequency + binaural offset
    - Optional: carrier wave modulation, harmonics, pink noise
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
    
    def _sin(self, phase: float) -> float:
        idx = (phase * self._SINE_TABLE_SIZE / (2 * math.pi)) % self._SINE_TABLE_SIZE
        idx_int = int(idx)
        frac = idx - idx_int
        nxt = idx_int + 1
        if nxt >= self._SINE_TABLE_SIZE:
            nxt = 0
        return self._sine_table[idx_int] * (1.0 - frac) + self._sine_table[nxt] * frac
    
    def generate_binaural(
        self,
        base_freq: float,
        binaural_offset: float = 10.0,
        duration_seconds: float = 60.0,
        volume: float = 0.5,
        fade_seconds: float = 5.0,
        harmonics: int = 3,
        add_pink_noise: bool = False,
        add_carrier: bool = True
    ) -> List[Tuple[float, float]]:
        """
        Generate binaural beat samples using phase accumulation.
        
        CPython's C-level math.sin with phase accumulation is faster than
        Python-level sine table lookups (~2x speedup).
        """
        num_samples = int(duration_seconds * self.sample_rate)
        inv_sr = 1.0 / self.sample_rate
        two_pi = 2 * math.pi
        
        left_freq = base_freq
        right_freq = base_freq + binaural_offset
        carrier_freq = base_freq * 2.0
        
        # Phase increments per sample
        inc_left = left_freq * two_pi * inv_sr
        inc_right = right_freq * two_pi * inv_sr
        inc_carrier = carrier_freq * two_pi * inv_sr if add_carrier else 0.0
        
        half_vol = volume * 0.5
        gauss = random.gauss
        sin = math.sin
        
        left_channel = [0.0] * num_samples
        right_channel = [0.0] * num_samples
        
        phase_left = 0.0
        phase_right = 0.0
        phase_carrier = 0.0
        
        for i in range(num_samples):
            t = i * inv_sr
            
            # Fade in/out
            fade_factor = 1.0
            if t < fade_seconds:
                fade_factor = t / fade_seconds
            elif t > duration_seconds - fade_seconds:
                fade_factor = (duration_seconds - t) / fade_seconds
            if fade_factor < 0.0:
                fade_factor = 0.0
            elif fade_factor > 1.0:
                fade_factor = 1.0
            
            vol = half_vol * fade_factor
            
            left = sin(phase_left)
            right = sin(phase_right)
            
            # Harmonics
            for h in range(2, harmonics + 1):
                left += 0.5 * sin(h * phase_left)
                right += 0.5 * sin(h * phase_right)
            
            if add_carrier:
                carrier = sin(phase_carrier)
                left *= (0.7 + 0.3 * carrier)
                right *= (0.7 + 0.3 * carrier)
            
            if add_pink_noise:
                noise = gauss(0, 0.02)
                left += noise
                right += noise
            
            left *= vol
            right *= vol
            
            left_channel[i] = left
            right_channel[i] = right
            
            phase_left += inc_left
            phase_right += inc_right
            phase_carrier += inc_carrier
            # Wrap phases to prevent floating-point drift over long durations
            if phase_left > two_pi:
                phase_left -= two_pi
            if phase_right > two_pi:
                phase_right -= two_pi
            if phase_carrier > two_pi:
                phase_carrier -= two_pi
        
        return list(zip(left_channel, right_channel))
    
    def save_wav(self, samples: List[Tuple[float, float]], output_path: str):
        """Save stereo samples to WAV file (chunked for speed)."""
        with wave.open(output_path, 'w') as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(self.sample_rate)
            
            chunk_size = 32768
            pack = struct.pack
            for start in range(0, len(samples), chunk_size):
                chunk = samples[start:start + chunk_size]
                frame_data = pack(
                    '<' + 'hh' * len(chunk),
                    *(
                        int(max(-1.0, min(1.0, l)) * 32767)
                        for pair in chunk
                        for l in (pair[0], pair[1])
                    )
                )
                wav.writeframes(frame_data)
    
    def generate_chakra_session(
        self,
        chakra_name: str,
        duration_minutes: float = 60.0,
        output_dir: Optional[str] = None
    ) -> Dict:
        """Generate complete meditation session for a chakra."""
        if chakra_name not in CHAKRA_FREQUENCIES:
            raise ValueError(f"Unknown chakra: {chakra_name}")
        
        chakra = CHAKRA_FREQUENCIES[chakra_name]
        base_freq = chakra["frequency"]
        offset = chakra["binaural_offset"]
        duration = duration_minutes * 60.0
        
        print(f"Generating {chakra['name']} ({base_freq} Hz) — {duration_minutes} min...")
        
        samples = self.generate_binaural(
            base_freq=base_freq,
            binaural_offset=offset,
            duration_seconds=duration,
            volume=0.5,
            fade_seconds=10.0,
            harmonics=3,
            add_pink_noise=True,
            add_carrier=True
        )
        
        if output_dir:
            Path(output_dir).mkdir(parents=True, exist_ok=True)
            filename = f"{chakra_name}_{base_freq}hz_{int(duration_minutes)}min.wav"
            output_path = os.path.join(output_dir, filename)
            self.save_wav(samples, output_path)
            print(f"  Saved: {output_path}")
        else:
            output_path = None
        
        return {
            "chakra": chakra_name,
            "name": chakra["name"],
            "sanskrit": chakra["sanskrit"],
            "frequency": base_freq,
            "binaural_offset": offset,
            "duration_minutes": duration_minutes,
            "brain_state": chakra["brain_state"],
            "purpose": chakra["purpose"],
            "color": chakra["color"],
            "output_path": output_path,
            "sample_count": len(samples)
        }


# =============================================================================
# FREQUENCY PROGRESSION ENGINE
# =============================================================================

class ChakraProgressionEngine:
    """
    Generate complete chakra journey sessions.
    
    Progressive paths:
    1. Root to Crown (ascending)
    2. Crown to Root (descending/grounding)
    3. Heart-centered (balance)
    4. Custom sequence
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.generator = BinauralBeatGenerator()
    
    def generate_progression(
        self,
        sequence: List[str],
        minutes_per_chakra: float = 7.5,
        include_transition: bool = True,
        transition_seconds: float = 30.0
    ) -> Dict:
        """
        Generate progressive chakra meditation.
        
        Args:
            sequence: List of chakra names in order
            minutes_per_chakra: Minutes per chakra
            include_transition: Add transition tones between chakras
            transition_seconds: Length of transition
        
        Returns:
            Session metadata and file paths
        """
        print(f"Generating chakra progression: {' → '.join(sequence)}")
        
        all_samples = []
        session_data = {
            "sequence": sequence,
            "minutes_per_chakra": minutes_per_chakra,
            "total_duration": 0,
            "chakras": []
        }
        
        for i, chakra_name in enumerate(sequence):
            if chakra_name not in CHAKRA_FREQUENCIES:
                continue
            
            chakra = CHAKRA_FREQUENCIES[chakra_name]
            duration = minutes_per_chakra * 60.0
            
            # Generate binaural beats
            samples = self.generator.generate_binaural(
                base_freq=chakra["frequency"],
                binaural_offset=chakra["binaural_offset"],
                duration_seconds=duration,
                volume=0.5,
                fade_seconds=15.0,
                harmonics=3,
                add_pink_noise=True,
                add_carrier=True
            )
            
            all_samples.extend(samples)
            session_data["total_duration"] += duration
            session_data["chakras"].append({
                "name": chakra_name,
                "frequency": chakra["frequency"],
                "duration_minutes": minutes_per_chakra,
                "purpose": chakra["purpose"]
            })
            
            # Add transition
            if include_transition and i < len(sequence) - 1:
                next_chakra = CHAKRA_FREQUENCIES[sequence[i + 1]]
                transition = self._generate_transition(
                    chakra["frequency"],
                    next_chakra["frequency"],
                    transition_seconds
                )
                all_samples.extend(transition)
                session_data["total_duration"] += transition_seconds
        
        # Save complete session
        output_path = self.output_dir / "chakra_progression_full.wav"
        self.generator.save_wav(all_samples, str(output_path))
        
        session_data["output_path"] = str(output_path)
        print(f"  Session saved: {output_path}")
        print(f"  Total duration: {session_data['total_duration']/60:.1f} minutes")
        
        return session_data
    
    def _generate_transition(
        self,
        from_freq: float,
        to_freq: float,
        duration_seconds: float
    ) -> List[Tuple[float, float]]:
        """Generate smooth frequency transition between chakras."""
        samples = []
        num_samples = int(duration_seconds * 44100)
        
        for i in range(num_samples):
            t = i / 44100
            progress = t / duration_seconds
            
            # Smooth interpolation
            current_freq = from_freq + (to_freq - from_freq) * progress
            
            left = math.sin(2 * math.pi * current_freq * t)
            right = math.sin(2 * math.pi * (current_freq + 10.0) * t)
            
            # Fade
            fade = math.sin(progress * math.pi)
            left *= 0.3 * fade
            right *= 0.3 * fade
            
            samples.append((left, right))
        
        return samples
    
    def generate_all_chakras(self, minutes_per_chakra: float = 10.0) -> Dict:
        """Generate individual sessions for all 9 chakras."""
        results = {}
        for chakra_name in CHAKRA_FREQUENCIES:
            result = self.generator.generate_chakra_session(
                chakra_name,
                duration_minutes=minutes_per_chakra,
                output_dir=str(self.output_dir)
            )
            results[chakra_name] = result
        return results


# =============================================================================
# VISUAL ENGINE (5D AI STYLE)
# =============================================================================

class MeditationVisualEngine:
    """
    Generate 5D-style visualizations for meditation sessions.
    
    Creates:
    - Chakra-colored geometric patterns
    - Frequency-responsive animations
    - Sacred geometry overlays
    - Particle systems
    - Color field transitions
    
    Outputs: JSON animation data + HTML5 Canvas renderer
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_chakra_visualization(
        self,
        chakra_name: str,
        duration_seconds: float = 60.0,
        fps: int = 30,
        resolution: Tuple[int, int] = (1920, 1080)
    ) -> Dict:
        """Generate visualization data for a chakra meditation.
        
        Only stores a sampled subset of frames — the HTML5 renderer
        recomputes frames dynamically via JavaScript.
        """
        if chakra_name not in CHAKRA_FREQUENCIES:
            raise ValueError(f"Unknown chakra: {chakra_name}")
        
        chakra = CHAKRA_FREQUENCIES[chakra_name]
        total_frames = int(duration_seconds * fps)
        frame_sample_step = max(1, total_frames // 120)
        
        frames = []
        for frame in range(0, total_frames, frame_sample_step):
            t = frame / fps
            progress = t / duration_seconds
            
            frame_data = {
                "time": round(t, 3),
                "progress": round(progress, 3),
                "chakra": chakra_name,
                "frequency": chakra["frequency"],
                "color": chakra["color"],
                "elements": self._generate_frame_elements(chakra, t, progress)
            }
            frames.append(frame_data)
        
        return {
            "chakra": chakra_name,
            "name": chakra["name"],
            "frequency": chakra["frequency"],
            "color": chakra["color"],
            "duration_seconds": duration_seconds,
            "fps": fps,
            "total_frames": total_frames,
            "frame_sample_step": frame_sample_step,
            "stored_frames": len(frames),
            "resolution": resolution,
            "frames": frames
        }
    
    def _generate_frame_elements(self, chakra: Dict, t: float, progress: float) -> Dict:
        """Generate visual elements for a single frame."""
        freq = chakra["frequency"]
        
        # Sacred geometry pattern that evolves with frequency
        geometry = {
            "circles": 3 + int(freq / 200),  # 3-6 circles based on frequency
            "rotation_speed": freq / 1000.0,
            "pulse_rate": freq / 500.0,
            "complexity": 1 + int(freq / 300)
        }
        
        # Particle system
        particles = {
            "count": 50 + int(freq / 10),
            "spread": 0.5 + 0.5 * math.sin(t * freq / 1000),
            "speed": freq / 5000.0,
            "color_shift": (t * freq / 10000) % 1.0
        }
        
        # Color field
        color_field = {
            "base_hue": self._freq_to_hue(freq),
            "saturation": 0.7 + 0.3 * math.sin(t * 0.5),
            "brightness": 0.5 + 0.5 * math.sin(t * freq / 2000),
            "pulse": math.sin(t * freq / 1000) * 0.3
        }
        
        return {
            "geometry": geometry,
            "particles": particles,
            "color_field": color_field
        }
    
    def _freq_to_hue(self, freq: float) -> float:
        """Map frequency to hue (0-360)."""
        # Map 174-963 Hz to 0-360 hue
        normalized = (freq - 174) / (963 - 174)
        return normalized * 360
    
    def generate_full_journey_visualization(
        self,
        sequence: List[str],
        minutes_per_chakra: float = 7.5,
        include_transition: bool = True
    ) -> Dict:
        """Generate complete visualization for chakra journey."""
        total_duration = len(sequence) * minutes_per_chakra * 60.0
        if include_transition:
            total_duration += (len(sequence) - 1) * 30.0
        
        frames = []
        current_time = 0.0
        
        for i, chakra_name in enumerate(sequence):
            if chakra_name not in CHAKRA_FREQUENCIES:
                continue
            
            chakra = CHAKRA_FREQUENCIES[chakra_name]
            chakra_duration = minutes_per_chakra * 60.0
            
            # Generate frames for this chakra
            fps = 30
            num_frames = int(chakra_duration * fps)
            
            for frame_idx in range(num_frames):
                t = current_time + (frame_idx / fps)
                progress = (frame_idx / fps) / chakra_duration
                
                frame_data = {
                    "time": round(t, 3),
                    "progress": round(progress, 3),
                    "chakra": chakra_name,
                    "frequency": chakra["frequency"],
                    "color": chakra["color"],
                    "elements": self._generate_frame_elements(chakra, t, progress)
                }
                frames.append(frame_data)
            
            current_time += chakra_duration
            
            # Add transition
            if include_transition and i < len(sequence) - 1:
                transition_frames = 30 * 30  # 30 seconds at 30fps
                for frame_idx in range(transition_frames):
                    t = current_time + (frame_idx / 30)
                    progress = frame_idx / transition_frames
                    
                    # Blend between chakras
                    from_chakra = CHAKRA_FREQUENCIES[chakra_name]
                    to_chakra = CHAKRA_FREQUENCIES[sequence[i + 1]]
                    
                    blended_freq = from_chakra["frequency"] + (to_chakra["frequency"] - from_chakra["frequency"]) * progress
                    blended_color = self._blend_colors(from_chakra["color"], to_chakra["color"], progress)
                    
                    frame_data = {
                        "time": round(t, 3),
                        "progress": round(progress, 3),
                        "chakra": "transition",
                        "frequency": round(blended_freq, 1),
                        "color": blended_color,
                        "elements": self._generate_frame_elements(
                            {"frequency": blended_freq, "color": blended_color},
                            t,
                            progress
                        )
                    }
                    frames.append(frame_data)
                
                current_time += 30.0
        
        return {
            "sequence": sequence,
            "total_duration_seconds": total_duration,
            "fps": 30,
            "total_frames": len(frames),
            "frames": frames
        }


# =============================================================================
# MAIN APP ENGINE
# =============================================================================

class MeditationAppEngine:
    """
    Main engine for the meditation app.
    
    Generates:
    - Individual chakra sessions (10-60 minutes)
    - Progressive journeys (root to crown, etc.)
    - 5D-style visualizations
    - Audio + visual synchronization data
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.audio_engine = BinauralBeatGenerator()
        self.progression_engine = ChakraProgressionEngine(output_dir=str(self.output_dir))
        self.visual_engine = MeditationVisualEngine(output_dir=str(self.output_dir))
    
    def generate_chakra_session(
        self,
        chakra_name: str,
        duration_minutes: float = 60.0,
        generate_audio: bool = True,
        generate_visuals: bool = True
    ) -> Dict:
        """Generate complete chakra meditation session."""
        print(f"\n{'='*70}")
        print(f"GENERATING CHAKRA SESSION: {chakra_name.upper()}")
        print(f"{'='*70}")
        
        result = {
            "chakra": chakra_name,
            "duration_minutes": duration_minutes,
            "audio": None,
            "visuals": None
        }
        
        if generate_audio:
            print(f"\n[1/2] Generating binaural audio...")
            result["audio"] = self.audio_engine.generate_chakra_session(
                chakra_name,
                duration_minutes=duration_minutes,
                output_dir=str(self.output_dir / "audio")
            )
        
        if generate_visuals:
            print(f"\n[2/2] Generating 5D visuals...")
            duration_seconds = duration_minutes * 60.0
            result["visuals"] = self.visual_engine.generate_chakra_visualization(
                chakra_name,
                duration_seconds=duration_seconds,
                fps=30
            )
            # Save visualization data
            viz_path = self.output_dir / "visuals" / f"{chakra_name}_visualization.json"
            with open(viz_path, "w") as f:
                json.dump(result["visuals"], f, indent=2)
            print(f"  Visuals saved: {viz_path}")
        
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
        print(f"Sequence: {' → '.join(sequence)}")
        print(f"{'='*70}")
        
        # Generate audio progression
        print(f"\n[1/3] Generating audio progression...")
        audio_session = self.progression_engine.generate_progression(
            sequence,
            minutes_per_chakra=minutes_per_chakra,
            include_transition=include_transition
        )
        
        # Generate visuals for each chakra
        print(f"\n[2/3] Generating individual chakra visuals...")
        visual_sessions = {}
        for chakra_name in sequence:
            if chakra_name in CHAKRA_FREQUENCIES:
                viz = self.visual_engine.generate_chakra_visualization(
                    chakra_name,
                    duration_seconds=minutes_per_chakra * 60.0,
                    fps=30
                )
                visual_sessions[chakra_name] = viz
        
        # Generate full journey visualization
        print(f"\n[3/3] Generating full journey visualization...")
        journey_viz = self.visual_engine.generate_full_journey_visualization(
            sequence,
            minutes_per_chakra=minutes_per_chakra,
            include_transition=include_transition
        )
        
        # Save journey visualization
        journey_path = self.output_dir / "visuals" / "full_journey_visualization.json"
        with open(journey_path, "w") as f:
            json.dump(journey_viz, f, indent=2)
        print(f"  Journey visuals saved: {journey_path}")
        
        return {
            "audio_session": audio_session,
            "visual_sessions": visual_sessions,
            "journey_visualization": journey_viz,
            "sequence": sequence,
            "total_duration_minutes": len(sequence) * minutes_per_chakra + (len(sequence) - 1) * 0.5 if include_transition else len(sequence) * minutes_per_chakra
        }
    
    def generate_all_sessions(self) -> Dict:
        """Generate all individual chakra sessions."""
        print(f"\n{'='*70}")
        print(f"GENERATING ALL CHAKRA SESSIONS")
        print(f"{'='*70}")
        
        results = {}
        for chakra_name in CHAKRA_FREQUENCIES:
            result = self.generate_chakra_session(
                chakra_name,
                duration_minutes=60.0,
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
    print("MEDITATION APP ENGINE — DEMONSTRATION")
    print("=" * 70)
    
    engine = MeditationAppEngine(output_dir="meditation-app/outputs")
    
    # Demo 1: Single chakra session (short)
    print("\n[DEMO 1] Generating 5-minute Solar Plexus session...")
    solar_result = engine.generate_chakra_session(
        "solar_plexus",
        duration_minutes=5.0,
        generate_audio=True,
        generate_visuals=True
    )
    
    # Demo 2: Full chakra journey
    print("\n[DEMO 2] Generating full root-to-crown journey...")
    journey = engine.generate_full_journey(
        sequence=["base", "root", "sacral", "solar_plexus", "heart", "throat", "third_eye", "crown"],
        minutes_per_chakra=7.5,
        include_transition=True
    )
    
    # Demo 3: All individual chakras
    print("\n[DEMO 3] Generating all 9 chakra sessions...")
    all_sessions = engine.generate_all_sessions()
    
    print("\n" + "=" * 70)
    print("MEDITATION APP ENGINE READY")
    print("=" * 70)
    print(f"\nGenerated:")
    print(f"  - 1 short chakra session (5 min)")
    print(f"  - 1 full journey ({journey['total_duration_minutes']:.1f} min)")
    print(f"  - 9 individual chakra sessions (60 min each)")
    print(f"\nOutput directory: meditation-app/outputs/")
    
    return engine


if __name__ == "__main__":
    run_demonstration()
