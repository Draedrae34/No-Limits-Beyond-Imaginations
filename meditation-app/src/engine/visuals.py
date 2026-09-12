#!/usr/bin/env python3
"""
MEDITATION APP — 5D VISUAL ENGINE
==================================
Generates 5D-style visualizations for meditation sessions.

Creates:
- Sacred geometry patterns
- Chakra-colored particle systems
- Frequency-responsive animations
- Color field transitions
- HTML5 Canvas renderer for web/app display
"""

import hashlib
import json
import math
import random
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple


# =============================================================================
# CHAKRA DEFINITIONS
# =============================================================================

CHAKRA_FREQUENCIES = {
    "base": {
        "name": "Base Chakra",
        "sanskrit": "Muladhara",
        "frequency": 174.0,
        "binaural_offset": 10.0,
        "color": "#8B4513",
        "purpose": "Foundation, grounding, safety",
        "position": "Base of spine"
    },
    "root": {
        "name": "Root Chakra",
        "sanskrit": "Svadhishthana",
        "frequency": 396.0,
        "binaural_offset": 10.0,
        "color": "#FF0000",
        "purpose": "Liberation from fear",
        "position": "Lower abdomen"
    },
    "sacral": {
        "name": "Sacral Chakra",
        "sanskrit": "Manipura",
        "frequency": 417.0,
        "binaural_offset": 10.0,
        "color": "#FFA500",
        "purpose": "Change, creativity",
        "position": "Solar plexus"
    },
    "solar_plexus": {
        "name": "Solar Plexus Chakra",
        "sanskrit": "Anahata",
        "frequency": 528.0,
        "binaural_offset": 10.0,
        "color": "#FFFF00",
        "purpose": "DNA repair, transformation",
        "position": "Center of chest"
    },
    "heart": {
        "name": "Heart Chakra",
        "sanskrit": "Vishuddha",
        "frequency": 639.0,
        "binaural_offset": 10.0,
        "color": "#00FF00",
        "purpose": "Connection, love, compassion",
        "position": "Center of chest"
    },
    "throat": {
        "name": "Throat Chakra",
        "sanskrit": "Ajna",
        "frequency": 741.0,
        "binaural_offset": 10.0,
        "color": "#0000FF",
        "purpose": "Expression, truth",
        "position": "Throat"
    },
    "third_eye": {
        "name": "Third Eye Chakra",
        "sanskrit": "Ajna",
        "frequency": 852.0,
        "binaural_offset": 10.0,
        "color": "#4B0082",
        "purpose": "Intuition, inner vision",
        "position": "Between eyebrows"
    },
    "crown": {
        "name": "Crown Chakra",
        "sanskrit": "Sahasrara",
        "frequency": 963.0,
        "binaural_offset": 10.0,
        "color": "#9400D3",
        "purpose": "Divine connection, unity",
        "position": "Top of head"
    },
    "healing": {
        "name": "Healing Chakra",
        "sanskrit": "Quantum",
        "frequency": 285.0,
        "binaural_offset": 10.0,
        "color": "#FF69B4",
        "purpose": "Tissue repair, quantum healing",
        "position": "All over body"
    }
}


# =============================================================================
# VISUAL GENERATION
# =============================================================================

class ChakraVisualGenerator:
    """
    Generate 5D-style visualizations for each chakra.
    
    Uses:
    - Sacred geometry patterns
    - Particle systems
    - Color field transitions
    - Frequency-responsive animations
    """
    
    def __init__(self, width: int = 1920, height: int = 1080):
        self.width = width
        self.height = height
    
    def generate_visualization(
        self,
        chakra_name: str,
        duration_seconds: float = 60.0,
        fps: int = 30,
        particle_count: int = 200,
        frame_sample_step: int = None
    ) -> Dict:
        """Generate complete visualization data for a chakra.
        
        Only stores a sampled subset of frames in JSON — the HTML5
        renderer recomputes frames dynamically via JavaScript, so
        storing every frame (e.g. 108 000 for 60 min) is wasteful.
        """
        if chakra_name not in CHAKRA_FREQUENCIES:
            raise ValueError(f"Unknown chakra: {chakra_name}")
        
        chakra = CHAKRA_FREQUENCIES[chakra_name]
        total_frames = int(duration_seconds * fps)
        
        # Determine sampling step to keep ~100-300 frames in JSON
        if frame_sample_step is None:
            frame_sample_step = max(1, total_frames // 120)
        
        frames = []
        for frame_idx in range(0, total_frames, frame_sample_step):
            t = frame_idx / fps
            progress = t / duration_seconds
            frame_data = self._generate_frame(chakra, t, progress, particle_count)
            frame_data["frame_index"] = frame_idx
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
            "resolution": {"width": self.width, "height": self.height},
            "frames": frames
        }
    
    def _generate_frame(self, chakra: Dict, t: float, progress: float, particle_count: int) -> Dict:
        """Generate single frame data."""
        freq = chakra["frequency"]
        color = chakra["color"]
        
        # Parse color
        r, g, b = self._hex_to_rgb(color)
        
        # Sacred geometry: rotating mandala
        geometry = self._generate_mandala(freq, t, progress)
        
        # Particle system
        particles = self._generate_particles(freq, t, progress, particle_count)
        
        # Color field
        color_field = {
            "base_color": [r, g, b],
            "pulse": 0.5 + 0.5 * math.sin(t * freq / 1000),
            "intensity": 0.3 + 0.7 * progress
        }
        
        # Frequency waves
        waves = self._generate_frequency_waves(freq, t)
        
        return {
            "time": round(t, 3),
            "progress": round(progress, 3),
            "geometry": geometry,
            "particles": particles,
            "color_field": color_field,
            "waves": waves
        }
    
    def _generate_mandala(self, freq: float, t: float, progress: float) -> Dict:
        """Generate sacred geometry mandala pattern."""
        # Number of petals/points based on frequency
        points = 6 + int(freq / 100)
        rotation = t * (freq / 5000)  # Rotation speed based on frequency
        
        # Multiple layers
        layers = []
        for layer in range(3):
            layer_points = points + layer * 2
            layer_rotation = rotation * (1 + layer * 0.5)
            layer_scale = 1.0 - layer * 0.2
            
            layer_data = {
                "points": layer_points,
                "rotation": layer_rotation,
                "scale": layer_scale,
                "opacity": 1.0 - layer * 0.3,
                "radius": 0.8 - layer * 0.2
            }
            layers.append(layer_data)
        
        return {
            "type": "mandala",
            "layers": layers,
            "center": {"x": 0.5, "y": 0.5}
        }
    
    def _generate_particles(self, freq: float, t: float, progress: float, count: int) -> Dict:
        """Generate particle system data."""
        particles = []
        for i in range(count):
            angle = (i / count) * math.pi * 2 + t * (freq / 10000)
            radius = 0.3 + 0.2 * math.sin(t * freq / 2000 + i * 0.1)
            x = 0.5 + radius * math.cos(angle)
            y = 0.5 + radius * math.sin(angle)
            size = 2 + 3 * math.sin(t * freq / 1500 + i * 0.2)
            opacity = 0.3 + 0.7 * abs(math.sin(t * freq / 1000 + i * 0.1))
            
            particles.append({
                "x": x,
                "y": y,
                "size": size,
                "opacity": round(opacity, 3),
                "angle": angle,
                "radius": radius
            })
        
        return {
            "count": count,
            "particles": particles[:50],  # Sample for JSON
            "movement_type": "orbital",
            "frequency_responsive": True
        }
    
    def _generate_frequency_waves(self, freq: float, t: float) -> Dict:
        """Generate frequency wave patterns."""
        waves = []
        for i in range(3):
            wave = {
                "frequency": freq * (1 + i * 0.5),
                "amplitude": 0.1 / (1 + i),
                "phase": t * freq / 1000 + i * math.pi / 3,
                "speed": freq / 5000
            }
            waves.append(wave)
        
        return {
            "count": 3,
            "waves": waves,
            "type": "sine"
        }
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


# =============================================================================
# HTML5 CANVAS RENDERER
# =============================================================================

class HTML5Renderer:
    """
    Generate HTML5 Canvas code for rendering visualizations.
    
    Creates standalone HTML files that can be played in any browser.
    """
    
    def generate_html(
        self,
        visualization_data: Dict,
        output_path: str,
        include_audio: bool = False,
        audio_path: Optional[str] = None
    ):
        """Generate standalone HTML visualization."""
        chakra = visualization_data["chakra"]
        name = visualization_data["name"]
        frequency = visualization_data["frequency"]
        color = visualization_data["color"]
        duration = visualization_data["duration_seconds"]
        fps = visualization_data["fps"]
        points = 6 + int(frequency / 100)  # Mandala points based on frequency
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{name} — {frequency} Hz Meditation</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }}
        canvas {{
            display: block;
            background: radial-gradient(circle at center, #0a0a2e 0%, #000 70%);
        }}
        .controls {{
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 15px 30px;
            border-radius: 30px;
            border: 1px solid #333;
            color: #fff;
            font-family: 'Courier New', monospace;
            text-align: center;
            z-index: 100;
        }}
        .controls button {{
            background: {color};
            border: none;
            color: #000;
            padding: 10px 25px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            margin: 0 10px;
        }}
        .info {{
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #888;
            font-family: 'Courier New', monospace;
            text-align: center;
        }}
        .info h1 {{
            color: {color};
            font-size: 1.8em;
            margin-bottom: 5px;
        }}
    </style>
</head>
<body>
    <div class="info">
        <h1>{name}</h1>
        <p>{frequency} Hz | {duration/60:.0f} minutes</p>
    </div>
    <canvas id="canvas"></canvas>
    <div class="controls">
        <button onclick="togglePlay()">Play/Pause</button>
        <button onclick="toggleFullscreen()">Fullscreen</button>
    </div>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let playing = true;
        let startTime = Date.now();
        const fps = {fps};
        const frameDuration = 1000 / fps;
        let lastFrame = 0;
        
        function resize() {{
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }}
        window.addEventListener('resize', resize);
        resize();
        
        function drawMandala(cx, cy, radius, points, rotation, opacity, color) {{
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {{
                const angle = (i / points) * Math.PI * 2;
                const r = radius * (0.8 + 0.2 * Math.sin(angle * 3));
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }}
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }}
        
        function drawParticles(particles, color) {{
            ctx.save();
            particles.forEach(p => {{
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
                ctx.fill();
            }});
            ctx.restore();
        }}
        
        function drawWaves(waves, color, time) {{
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            waves.forEach(wave => {{
                ctx.beginPath();
                for (let x = 0; x < width; x += 5) {{
                    const y = height/2 + Math.sin(x * wave.frequency * 0.001 + time * wave.speed) * wave.amplitude * height;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }}
                ctx.stroke();
            }});
            ctx.restore();
        }}
        
        function render(timestamp) {{
            if (!playing) {{
                requestAnimationFrame(render);
                return;
            }}
            
            const elapsed = (timestamp - startTime) / 1000;
            const frameIndex = Math.floor(elapsed * {fps});
            
            if (frameIndex > lastFrame) {{
                lastFrame = frameIndex;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, width, height);
                
                const cx = width / 2;
                const cy = height / 2;
                const maxR = Math.min(width, height) * 0.4;
                const freq = {frequency};
                const color = '{color}';
                
                // Draw mandala layers
                for (let layer = 0; layer < 3; layer++) {{
                    const points = {points} + layer * 2;
                    const rotation = elapsed * (freq / 5000) * (1 + layer * 0.5);
                    const scale = 1.0 - layer * 0.2;
                    const opacity = 1.0 - layer * 0.3;
                    drawMandala(cx, cy, maxR * scale, points, rotation, opacity, color);
                }}
                
                // Draw particles
                const particles = [];
                const particleCount = 100;
                for (let i = 0; i < particleCount; i++) {{
                    const angle = (i / particleCount) * Math.PI * 2 + elapsed * (freq / 10000);
                    const radius = 0.3 + 0.2 * Math.sin(elapsed * freq / 2000 + i * 0.1);
                    particles.push({{
                        x: 0.5 + radius * Math.cos(angle),
                        y: 0.5 + radius * Math.sin(angle),
                        size: 2 + 3 * Math.sin(elapsed * freq / 1500 + i * 0.2),
                        opacity: 0.3 + 0.7 * Math.abs(Math.sin(elapsed * freq / 1000 + i * 0.1))
                    }});
                }}
                drawParticles(particles, color);
                
                // Draw waves
                const waves = [
                    {{ frequency: freq, amplitude: 0.1, speed: freq / 5000 }},
                    {{ frequency: freq * 1.5, amplitude: 0.07, speed: freq / 5000 }},
                    {{ frequency: freq * 2, amplitude: 0.04, speed: freq / 5000 }}
                ];
                drawWaves(waves, color, elapsed);
            }}
            
            requestAnimationFrame(render);
        }}
        
        function togglePlay() {{
            playing = !playing;
            if (playing) startTime = Date.now() - (lastFrame / {fps}) * 1000;
        }}
        
        function toggleFullscreen() {{
            if (document.fullscreenElement) document.exitFullscreen();
            else document.body.requestFullscreen();
        }}
        
        requestAnimationFrame(render);
    </script>
</body>
</html>
"""
        
        with open(output_path, "w") as f:
            f.write(html)
        
        return output_path


# =============================================================================
# MAIN APP
# =============================================================================

class MeditationApp:
    """
    Main meditation app controller.
    
    Generates:
    - Binaural beat audio for each chakra
    - 5D-style visualizations
    - HTML5 renderer for web/app display
    - Complete meditation sessions
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.visual_generator = ChakraVisualGenerator()
        self.html_renderer = HTML5Renderer()
    
    def generate_chakra_session(
        self,
        chakra_name: str,
        duration_minutes: float = 60.0,
        generate_visuals: bool = True,
        generate_html: bool = True
    ) -> Dict:
        """Generate complete chakra meditation session."""
        print(f"\n{'='*70}")
        print(f"GENERATING: {chakra_name.upper()} — {duration_minutes} minutes")
        print(f"{'='*70}")
        
        chakra = CHAKRA_FREQUENCIES[chakra_name]
        result = {
            "chakra": chakra_name,
            "name": chakra["name"],
            "frequency": chakra["frequency"],
            "duration_minutes": duration_minutes,
            "visualization": None,
            "html_path": None
        }
        
        if generate_visuals:
            print(f"[1/2] Generating 5D visuals...")
            duration_seconds = duration_minutes * 60.0
            viz_data = self.visual_generator.generate_visualization(
                chakra_name,
                duration_seconds=duration_seconds,
                fps=30
            )
            result["visualization"] = viz_data
            
            # Save visualization JSON
            viz_path = self.output_dir / "visuals" / f"{chakra_name}_visualization.json"
            viz_path.parent.mkdir(parents=True, exist_ok=True)
            with open(viz_path, "w") as f:
                json.dump(viz_data, f, indent=2)
            print(f"  Visuals JSON: {viz_path}")
            
            if generate_html:
                print(f"[2/2] Generating HTML5 renderer...")
                html_path = self.output_dir / "visuals" / f"{chakra_name}_meditation.html"
                html_path.parent.mkdir(parents=True, exist_ok=True)
                self.html_renderer.generate_html(viz_data, str(html_path))
                result["html_path"] = str(html_path)
                print(f"  HTML renderer: {html_path}")
        
        return result
    
    def generate_full_journey(
        self,
        sequence: List[str] = None,
        minutes_per_chakra: float = 7.5
    ) -> Dict:
        """Generate complete chakra journey."""
        if sequence is None:
            sequence = ["base", "root", "sacral", "solar_plexus", "heart", "throat", "third_eye", "crown"]
        
        print(f"\n{'='*70}")
        print(f"GENERATING FULL CHAKRA JOURNEY")
        print(f"Sequence: {' → '.join(sequence)}")
        print(f"{'='*70}")
        
        journey = {
            "sequence": sequence,
            "chakras": [],
            "total_duration": 0
        }
        
        for chakra_name in sequence:
            if chakra_name not in CHAKRA_FREQUENCIES:
                continue
            
            session = self.generate_chakra_session(
                chakra_name,
                duration_minutes=minutes_per_chakra,
                generate_visuals=True,
                generate_html=True
            )
            journey["chakras"].append(session)
            journey["total_duration"] += minutes_per_chakra
        
        # Save journey manifest
        manifest_path = self.output_dir / "journey_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(journey, f, indent=2)
        print(f"\n  Journey manifest: {manifest_path}")
        
        return journey
    
    def generate_all_chakras(self, duration_minutes: float = 60.0) -> Dict:
        """Generate all 9 chakra sessions."""
        print(f"\n{'='*70}")
        print(f"GENERATING ALL 9 CHAKRA SESSIONS")
        print(f"{'='*70}")
        
        results = {}
        for chakra_name in CHAKRA_FREQUENCIES:
            result = self.generate_chakra_session(
                chakra_name,
                duration_minutes=duration_minutes,
                generate_visuals=True,
                generate_html=True
            )
            results[chakra_name] = result
        
        return results


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run meditation app demonstration."""
    print("=" * 70)
    print("MEDITATION APP — 5D VISUAL ENGINE")
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
    
    print("\n" + "=" * 70)
    print("MEDITATION APP VISUAL ENGINE READY")
    print("=" * 70)
    print(f"\nGenerated:")
    print(f"  - 1 short chakra session (5 min)")
    print(f"  - 1 full journey ({journey['total_duration']:.1f} min)")
    print(f"\nOutput: meditation-app/outputs/")
    
    return app


if __name__ == "__main__":
    run_demonstration()
