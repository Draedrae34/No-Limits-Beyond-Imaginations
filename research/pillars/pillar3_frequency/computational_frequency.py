#!/usr/bin/env python3
"""
PILLAR 3: COMPUTATIONAL FREQUENCY EFFECTS
===========================================
Goal: Visualize and simulate frequency-based physical effects without equipment.

PHASE 1: COMPUTATIONAL SIMULATION
- 3D cymatics patterns: simulate sound waves creating geometric forms
- Frequency response curves: how different frequencies interact with matter
- Solfeggio frequency explorer: interactive visualization of the 9 frequencies

PHASE 2: REAL EXPERIMENTS (when funded)
- Water crystallization photography
- Plant growth studies
- EM field detection

This phase builds the visual engine, content pipeline, and audience
so we can fund the real experimental work later.
"""

import hashlib
import json
import math
import os
import random
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple


# =============================================================================
# FREQUENCY DEFINITIONS
# =============================================================================

SOLFEGGIO_FREQUENCIES = {
    "UT": {"freq": 174.0, "chakra": "Base", "purpose": "Foundation", "color": "#8B4513"},
    "RE": {"freq": 396.0, "chakra": "Root", "purpose": "Liberation from Fear", "color": "#FF0000"},
    "MI": {"freq": 417.0, "chakra": "Sacral", "purpose": "Undoing Situations", "color": "#FFA500"},
    "FA": {"freq": 528.0, "chakra": "Solar Plexus", "purpose": "DNA Repair/Transformation", "color": "#FFFF00"},
    "SOL": {"freq": 639.0, "chakra": "Heart", "purpose": "Connecting Relationships", "color": "#00FF00"},
    "LA": {"freq": 741.0, "chakra": "Throat", "purpose": "Expression/Solutions", "color": "#0000FF"},
    "SI": {"freq": 852.0, "chakra": "Third Eye", "purpose": "Intuition", "color": "#4B0082"},
    "DO": {"freq": 963.0, "chakra": "Crown", "purpose": "Divine Connection", "color": "#9400D3"},
    "OM": {"freq": 285.0, "chakra": "Sacral", "purpose": "Healing Tissue", "color": "#FF69B4"},
}


# =============================================================================
# CYMATICS SIMULATION
# =============================================================================

class CymaticsSimulator:
    """
    Simulate cymatics patterns: how sound creates geometric forms.
    
    Uses Chladni plate mathematics: standing wave patterns on a surface
    create nodal lines where sand/particles accumulate.
    
    The pattern depends on:
    - Frequency
    - Plate shape
    - Boundary conditions
    """
    
    def generate_pattern(
        self,
        frequency: float,
        shape: str = "circle",
        resolution: int = 100,
        harmonics: int = 5
    ) -> Dict:
        """
        Generate cymatics pattern for a given frequency.
        
        Args:
            frequency: Driving frequency in Hz
            shape: Plate shape ("circle", "square", "rectangle")
            resolution: Grid resolution
            harmonics: Number of harmonic modes to combine
        
        Returns:
            Pattern data for 3D visualization
        """
        # Normalize frequency to mode numbers
        # Higher frequency = more complex patterns
        base_mode = max(1, int(frequency / 100.0))
        
        # Generate standing wave pattern
        grid = self._generate_standing_wave(shape, resolution, base_mode, harmonics)
        
        # Extract nodal lines (where amplitude is near zero)
        nodal_lines = self._extract_nodal_lines(grid)
        
        # Generate 3D surface data
        surface_data = self._generate_surface_data(grid)
        
        return {
            "frequency": frequency,
            "shape": shape,
            "base_mode": base_mode,
            "harmonics": harmonics,
            "grid_resolution": resolution,
            "nodal_lines": nodal_lines,
            "surface_data": surface_data,
            "symmetry_order": self._compute_symmetry(nodal_lines),
            "complexity": self._compute_complexity(grid)
        }
    
    def _generate_standing_wave(
        self,
        shape: str,
        resolution: int,
        mode: int,
        harmonics: int
    ) -> List[List[float]]:
        """Generate 2D standing wave amplitude grid."""
        grid = []
        for i in range(resolution):
            row = []
            for j in range(resolution):
                # Normalize coordinates to [-1, 1]
                x = 2.0 * i / (resolution - 1) - 1.0
                y = 2.0 * j / (resolution - 1) - 1.0
                
                # Apply shape mask
                if shape == "circle":
                    if x*x + y*y > 1.0:
                        row.append(0.0)
                        continue
                elif shape == "square":
                    pass  # No mask needed
                
                # Generate wave pattern using Bessel functions for circular plates
                # or sine/cosine for rectangular plates
                amplitude = 0.0
                for h in range(1, harmonics + 1):
                    freq_factor = h * mode / 10.0
                    if shape == "circle":
                        # Bessel function approximation for circular plate
                        r = math.sqrt(x*x + y*y)
                        theta = math.atan2(y, x)
                        amplitude += math.sin(freq_factor * r * math.pi) * math.cos(h * theta)
                    else:
                        # Rectangular plate modes
                        amplitude += math.sin(freq_factor * x * math.pi) * math.sin(freq_factor * y * math.pi)
                
                row.append(amplitude)
            grid.append(row)
        
        return grid
    
    def _extract_nodal_lines(self, grid: List[List[float]]) -> List[Dict]:
        """Extract nodal lines (zero-crossings) from amplitude grid."""
        nodal_lines = []
        resolution = len(grid)
        
        # Find horizontal nodal lines
        for i in range(1, resolution - 1):
            for j in range(resolution):
                if grid[i][j] == 0 or (grid[i-1][j] * grid[i+1][j] < 0):
                    nodal_lines.append({
                        "type": "horizontal",
                        "position": i / resolution,
                        "col": j / resolution
                    })
        
        # Find vertical nodal lines
        for j in range(1, resolution - 1):
            for i in range(resolution):
                if grid[i][j] == 0 or (grid[i][j-1] * grid[i][j+1] < 0):
                    nodal_lines.append({
                        "type": "vertical",
                        "position": j / resolution,
                        "row": i / resolution
                    })
        
        return nodal_lines[:100]  # Limit for visualization
    
    def _generate_surface_data(self, grid: List[List[float]]) -> Dict:
        """Generate 3D surface data for visualization."""
        resolution = len(grid)
        vertices = []
        indices = []
        
        for i in range(resolution):
            for j in range(resolution):
                vertices.append({
                    "x": i / resolution,
                    "y": j / resolution,
                    "z": grid[i][j]
                })
        
        # Generate triangle indices
        for i in range(resolution - 1):
            for j in range(resolution - 1):
                base = i * resolution + j
                indices.extend([
                    [base, base + 1, base + resolution],
                    [base + 1, base + resolution + 1, base + resolution]
                ])
        
        return {
            "vertices": vertices[:200],  # Sample for JSON size
            "indices": indices[:200],
            "resolution": resolution
        }
    
    def _compute_symmetry(self, nodal_lines: List[Dict]) -> int:
        """Estimate rotational symmetry order from nodal lines."""
        if not nodal_lines:
            return 1
        
        # Count unique angles from center
        angles = []
        for line in nodal_lines:
            if "row" in line and "col" in line:
                angle = math.atan2(line["row"] - 0.5, line["col"] - 0.5)
                angles.append(angle)
        
        if not angles:
            return 1
        
        # Check for rotational symmetry
        unique_angles = set(round(a % (math.pi / 2), 3) for a in angles)
        symmetry = len(unique_angles)
        
        return max(1, symmetry)
    
    def _compute_complexity(self, grid: List[List[float]]) -> float:
        """Compute pattern complexity from amplitude variance."""
        amplitudes = [grid[i][j] for i in range(len(grid)) for j in range(len(grid[0]))]
        
        if not amplitudes:
            return 0.0
        
        mean = sum(amplitudes) / len(amplitudes)
        variance = sum((a - mean) ** 2 for a in amplitudes) / len(amplitudes)
        
        return math.sqrt(variance)


# =============================================================================
# FREQUENCY RESPONSE SIMULATION
# =============================================================================

class FrequencyResponseSimulator:
    """
    Simulate how different frequencies interact with matter.
    
    Models:
    - Water molecule resonance
    - Cell membrane vibration
    - Metal/sand pattern formation
    """
    
    def simulate_water_response(self, frequency: float, duration: float = 1.0) -> Dict:
        """
        Simulate water molecule response to frequency.
        
        Water has natural resonance around 2.45 GHz (microwave)
        but also responds to lower frequencies through cluster formation.
        """
        # Simulate water cluster formation
        # Higher frequencies create smaller clusters
        cluster_size = max(3, int(20 - frequency / 100))
        
        # Generate cluster pattern
        clusters = []
        for i in range(cluster_size):
            angle = 2 * math.pi * i / cluster_size
            radius = 0.3 + 0.1 * math.sin(frequency / 100.0 + i)
            clusters.append({
                "index": i,
                "angle": round(angle, 4),
                "radius": round(radius, 4),
                "amplitude": round(0.5 + 0.5 * math.sin(frequency * duration + i), 4)
            })
        
        return {
            "frequency": frequency,
            "cluster_size": cluster_size,
            "clusters": clusters,
            "resonance_quality": round(self._compute_resonance(frequency), 4)
        }
    
    def simulate_metal_plate(self, frequency: float, size: float = 1.0) -> Dict:
        """
        Simulate metal plate vibration patterns (Chladni figures).
        
        Returns pattern data for 3D rendering.
        """
        simulator = CymaticsSimulator()
        pattern = simulator.generate_pattern(frequency, shape="square", resolution=50)
        
        # Add metal-specific properties
        pattern["material"] = "metal"
        pattern["plate_size"] = size
        pattern["wave_speed"] = self._compute_wave_speed(frequency)
        
        return pattern
    
    def _compute_resonance(self, frequency: float) -> float:
        """Compute resonance quality factor for a frequency."""
        # Resonance peaks at Solfeggio frequencies
        peaks = [174, 285, 396, 417, 528, 639, 741, 852, 963]
        
        min_distance = min(abs(frequency - p) for p in peaks)
        max_distance = max(abs(frequency - p) for p in peaks)
        
        if max_distance == 0:
            return 1.0
        
        # Closer to a peak = higher resonance
        resonance = 1.0 - (min_distance / max_distance)
        return max(0.0, min(1.0, resonance))
    
    def _compute_wave_speed(self, frequency: float) -> float:
        """Compute wave speed in material."""
        # Simplified: speed increases with frequency
        return 340.0 * (1.0 + frequency / 1000.0)  # m/s


# =============================================================================
# 3D VISUALIZATION DATA GENERATOR
# =============================================================================

class VisualizationGenerator:
    """
    Generate data for 3D visualizations of frequency effects.
    
    Outputs JSON data compatible with Three.js, WebGL, or other renderers.
    """
    
    def generate_cymatics_3d(self, frequency: float, shape: str = "circle") -> Dict:
        """Generate 3D cymatics visualization data."""
        simulator = CymaticsSimulator()
        pattern = simulator.generate_pattern(frequency, shape, resolution=80)
        
        # Convert to 3D mesh format
        mesh_data = {
            "type": "cymatics",
            "frequency": frequency,
            "shape": shape,
            "vertices": [],
            "faces": [],
            "colors": []
        }
        
        surface = pattern["surface_data"]
        grid_size = int(math.sqrt(len(surface["vertices"])))
        
        for idx, vertex in enumerate(surface["vertices"]):
            # Position
            x = vertex["x"] * 2 - 1
            y = vertex["y"] * 2 - 1
            z = vertex["z"] * 0.5  # Scale amplitude
            
            mesh_data["vertices"].append([x, y, z])
            
            # Color based on amplitude
            intensity = abs(z) / 0.5
            mesh_data["colors"].append([
                intensity,
                0.5 + 0.5 * math.sin(frequency / 100.0),
                1.0 - intensity
            ])
        
        # Generate faces
        for i in range(grid_size - 1):
            for j in range(grid_size - 1):
                base = i * grid_size + j
                mesh_data["faces"].append([base, base + 1, base + grid_size])
                mesh_data["faces"].append([base + 1, base + grid_size + 1, base + grid_size])
        
        return mesh_data
    
    def generate_frequency_spectrum(self, start_freq: float = 100.0, end_freq: float = 1000.0, steps: int = 100) -> Dict:
        """Generate frequency spectrum visualization data."""
        frequencies = [start_freq + i * (end_freq - start_freq) / steps for i in range(steps)]
        
        simulator = FrequencyResponseSimulator()
        
        data_points = []
        for freq in frequencies:
            response = simulator.simulate_water_response(freq)
            data_points.append({
                "frequency": freq,
                "resonance": response["resonance_quality"],
                "cluster_size": response["cluster_size"]
            })
        
        return {
            "type": "spectrum",
            "frequencies": frequencies,
            "data_points": data_points,
            "peaks": self._find_peaks(data_points)
        }
    
    def generate_solfeggio_radar(self) -> Dict:
        """Generate radar chart data for Solfeggio frequencies."""
        categories = ["Foundation", "Liberation", "Change", "Transformation", "Connection", "Expression", "Intuition", "Unity", "Healing"]
        
        values = []
        for name, data in SOLFEGGIO_FREQUENCIES.items():
            # Normalize frequency to 0-1 scale
            normalized = data["freq"] / 1000.0
            values.append(round(normalized, 4))
        
        return {
            "type": "radar",
            "categories": categories,
            "values": values,
            "frequencies": [data["freq"] for data in SOLFEGGIO_FREQUENCIES.values()]
        }
    
    def _find_peaks(self, data_points: List[Dict]) -> List[Dict]:
        """Find resonance peaks in frequency data."""
        peaks = []
        for i in range(1, len(data_points) - 1):
            if (data_points[i]["resonance"] > data_points[i-1]["resonance"] and
                data_points[i]["resonance"] > data_points[i+1]["resonance"] and
                data_points[i]["resonance"] > 0.7):
                peaks.append({
                    "frequency": data_points[i]["frequency"],
                    "resonance": data_points[i]["resonance"]
                })
        return peaks


# =============================================================================
# CONTENT GENERATOR
# =============================================================================

class ContentGenerator:
    """
    Generate shareable content from frequency simulations.
    
    Creates:
    - 3D visualization JSON files
    - Social media graphics data
    - Interactive web pages
    - Educational content
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.viz_generator = VisualizationGenerator()
    
    def generate_solfeggio_visualization_set(self) -> Dict:
        """Generate complete visualization set for all Solfeggio frequencies."""
        results = {}
        
        for name, data in SOLFEGGIO_FREQUENCIES.items():
            freq = data["freq"]
            
            # 3D cymatics pattern
            cymatics_3d = self.viz_generator.generate_cymatics_3d(freq, shape="circle")
            results[f"{name}_cymatics"] = cymatics_3d
            
            # Water response
            water_response = FrequencyResponseSimulator().simulate_water_response(freq)
            results[f"{name}_water"] = water_response
        
        # Frequency spectrum
        results["spectrum"] = self.viz_generator.generate_frequency_spectrum()
        
        # Radar chart
        results["radar"] = self.viz_generator.generate_solfeggio_radar()
        
        return results
    
    def generate_web_visualization(self, output_file: str = "frequency_visualization.html"):
        """Generate standalone HTML visualization page."""
        viz_data = self.generate_solfeggio_visualization_set()
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Frequency Visualization Engine</title>
    <style>
        body {{ margin: 0; padding: 20px; background: #000; color: #fff; font-family: Arial, sans-serif; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        h1 {{ text-align: center; color: {SOLFEGGIO_FREQUENCIES['FA']['color']}; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }}
        .card {{ background: #111; padding: 20px; border-radius: 10px; border: 1px solid #333; }}
        .freq {{ font-size: 2em; color: {SOLFEGGIO_FREQUENCIES['FA']['color']}; }}
        .chakra {{ color: #888; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Frequency Visualization Engine</h1>
        <p>Computational simulation of frequency-based physical effects</p>
        <div class="grid">
"""
        
        for name, data in SOLFEGGIO_FREQUENCIES.items():
            html += f"""
            <div class="card">
                <div class="freq">{data['freq']} Hz</div>
                <div class="chakra">{name} - {data['chakra']}</div>
                <p>{data['purpose']}</p>
                <p style="color: {data['color']};">Color resonance: {data['color']}</p>
            </div>
"""
        
        html += """
        </div>
    </div>
</body>
</html>
"""
        
        output_path = self.output_dir / output_file
        with open(output_path, "w") as f:
            f.write(html)
        
        print(f"[Pillar 3] Visualization saved to {output_path}")
        return output_path


# =============================================================================
# MAIN ENGINE
# =============================================================================

class Pillar3Engine:
    """
    Main engine for Pillar 3: Computational Frequency Effects.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cymatics = CymaticsSimulator()
        self.frequency_response = FrequencyResponseSimulator()
        self.content_generator = ContentGenerator(output_dir=str(self.output_dir))
    
    def run_full_simulation(self) -> Dict:
        """Run complete frequency simulation suite."""
        print("=" * 70)
        print("PILLAR 3: COMPUTATIONAL FREQUENCY EFFECTS")
        print("=" * 70)
        
        results = {}
        
        # 1. Generate cymatics for all Solfeggio frequencies
        print("\n[1] Generating cymatics patterns...")
        for name, data in SOLFEGGIO_FREQUENCIES.items():
            pattern = self.cymatics.generate_pattern(data["freq"], shape="circle")
            results[f"{name}_cymatics"] = pattern
            print(f"  {name} ({data['freq']} Hz): symmetry={pattern['symmetry_order']}, complexity={pattern['complexity']:.3f}")
        
        # 2. Generate frequency response curves
        print("\n[2] Generating frequency response curves...")
        spectrum = self.frequency_response.simulate_water_response(100.0)
        results["water_response_sample"] = spectrum
        
        # 3. Generate 3D visualization data
        print("\n[3] Generating 3D visualization data...")
        viz_data = self.content_generator.generate_solfeggio_visualization_set()
        results["visualizations"] = viz_data
        
        # 4. Generate web page
        print("\n[4] Generating web visualization...")
        html_path = self.content_generator.generate_web_visualization()
        results["html_page"] = str(html_path)
        
        # Save all results
        output_path = self.output_dir / "pillar3_computational_results.json"
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n[Pillar 3] Results saved to {output_path}")
        return results
    
    def generate_report(self, results: Dict) -> str:
        """Generate analysis report."""
        lines = [
            "=" * 70,
            "PILLAR 3: COMPUTATIONAL FREQUENCY EFFECTS - REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            ""
        ]
        
        lines.append("CYMATICS PATTERNS BY FREQUENCY:")
        lines.append("-" * 70)
        
        for name, data in SOLFEGGIO_FREQUENCIES.items():
            key = f"{name}_cymatics"
            if key in results:
                pattern = results[key]
                lines.append(f"\n{name} ({data['freq']} Hz):")
                lines.append(f"  Symmetry order: {pattern['symmetry_order']}")
                lines.append(f"  Complexity: {pattern['complexity']:.4f}")
                lines.append(f"  Nodal lines: {len(pattern['nodal_lines'])}")
        
        lines.append("\n" + "=" * 70)
        lines.append("CONCLUSION")
        lines.append("=" * 70)
        lines.append("Computational frequency effects simulation complete.")
        lines.append("Ready for 3D visualization and content generation.")
        
        return "\n".join(lines)


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run Pillar 3 computational demonstration."""
    engine = Pillar3Engine(output_dir="research/pillars/pillar3_frequency/outputs")
    results = engine.run_full_simulation()
    print("\n" + engine.generate_report(results))
    return engine


if __name__ == "__main__":
    run_demonstration()
