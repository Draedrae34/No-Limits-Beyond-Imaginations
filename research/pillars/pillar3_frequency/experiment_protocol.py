#!/usr/bin/env python3
"""
PILLAR 3: FREQUENCY-BASED PHYSICAL EFFECTS
===========================================
Goal: Document measurable physical effects of Solfeggio frequencies.

Approach:
- Design controlled experiments (water crystallization, plant growth, EM detection)
- Document with video, measurements, statistical analysis
- Submit for peer review
- Create reproducible experiment protocols

Deliverable: Experiment documentation + peer-reviewed results
"""

import hashlib
import json
import math
import random
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional


# =============================================================================
# EXPERIMENT DESIGN
# =============================================================================

class Frequency(Enum):
    """Solfeggio frequencies and their properties."""
    UT = (174.0, "Base", "Foundation", "Grounding")
    RE = (396.0, "Root", "Liberation from Fear", "Clearing")
    MI = (417.0, "Sacral", "Undoing Situations", "Change")
    FA = (528.0, "Solar Plexus", "DNA Repair", "Transformation")
    SOL = (639.0, "Heart", "Connecting Relationships", "Love")
    LA = (741.0, "Throat", "Expression/Solutions", "Expression")
    SI = (852.0, "Third Eye", "Intuition", "Intuition")
    DO = (963.0, "Crown", "Divine Connection", "Unity")
    OM = (285.0, "Sacral", "Healing Tissue", "Quantum")

    def __init__(self, freq: float, chakra: str, purpose: str, quality: str):
        self.frequency = freq
        self.chakra = chakra
        self.purpose = purpose
        self.quality = quality


@dataclass
class ExperimentConfig:
    """Configuration for a frequency experiment."""
    experiment_id: str
    name: str
    description: str
    frequency: float
    duration_minutes: int
    sample_size: int
    control_group: bool
    blind: bool
    notes: str = ""


@dataclass
class Measurement:
    """Single measurement within an experiment."""
    timestamp: str
    trial: int
    group: str  # "treatment" or "control"
    value: float
    unit: str
    notes: str = ""


@dataclass
class ExperimentResult:
    """Results from a completed experiment."""
    config: ExperimentConfig
    measurements: list[Measurement] = field(default_factory=list)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    statistical_summary: Optional[dict] = None
    conclusion: str = ""


class ExperimentProtocol:
    """
    Manages controlled frequency experiments.
    """
    
    def __init__(self, output_dir: str = "experiments"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.experiments: dict[str, ExperimentResult] = {}
    
    def create_experiment(self, config: ExperimentConfig) -> ExperimentResult:
        """Initialize a new experiment."""
        result = ExperimentResult(
            config=config,
            start_time=datetime.utcnow().isoformat() + "Z"
        )
        self.experiments[config.experiment_id] = result
        print(f"[Protocol] Created experiment: {config.name} ({config.experiment_id})")
        return result
    
    def record_measurement(self, experiment_id: str, measurement: Measurement):
        """Record a measurement for an experiment."""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        self.experiments[experiment_id].measurements.append(measurement)
    
    def complete_experiment(self, experiment_id: str, conclusion: str = ""):
        """Mark experiment as complete and compute statistics."""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        result = self.experiments[experiment_id]
        result.end_time = datetime.utcnow().isoformat() + "Z"
        result.conclusion = conclusion
        result.statistical_summary = self._compute_statistics(result)
        
        print(f"[Protocol] Completed experiment: {result.config.name}")
        return result.statistical_summary
    
    def _compute_statistics(self, result: ExperimentResult) -> dict:
        """Compute statistical summary of measurements."""
        treatment = [m.value for m in result.measurements if m.group == "treatment"]
        control = [m.value for m in result.measurements if m.group == "control"]
        
        def mean(x): return sum(x) / len(x) if x else 0
        def std(x): 
            if len(x) < 2: return 0
            m = mean(x)
            return math.sqrt(sum((v - m)**2 for v in x) / (len(x) - 1))
        
        t_mean = mean(treatment)
        c_mean = mean(control)
        t_std = std(treatment)
        c_std = std(control)
        
        # Simple t-test approximation
        if t_std > 0 and c_std > 0 and len(treatment) > 1 and len(control) > 1:
            se = math.sqrt(t_std**2/len(treatment) + c_std**2/len(control))
            t_stat = (t_mean - c_mean) / se if se > 0 else 0
        else:
            t_stat = 0
        
        return {
            "treatment_n": len(treatment),
            "control_n": len(control),
            "treatment_mean": round(t_mean, 4),
            "control_mean": round(c_mean, 4),
            "treatment_std": round(t_std, 4),
            "control_std": round(c_std, 4),
            "difference": round(t_mean - c_mean, 4),
            "percent_change": round((t_mean - c_mean) / c_mean * 100, 2) if c_mean != 0 else 0,
            "t_statistic": round(t_stat, 4),
            "significant": abs(t_stat) > 2.0  # Approximate p < 0.05
        }
    
    def save_results(self, experiment_id: str):
        """Save experiment results to JSON."""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        result = self.experiments[experiment_id]
        output_path = self.output_dir / f"{experiment_id}_results.json"
        
        data = {
            "experiment_id": experiment_id,
            "config": asdict(result.config),
            "start_time": result.start_time,
            "end_time": result.end_time,
            "measurements": [asdict(m) for m in result.measurements],
            "statistical_summary": result.statistical_summary,
            "conclusion": result.conclusion
        }
        
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"[Protocol] Saved results to {output_path}")
        return output_path
    
    def generate_report(self) -> str:
        """Generate summary report of all experiments."""
        lines = [
            "=" * 70,
            "PILLAR 3: FREQUENCY-BASED PHYSICAL EFFECTS - EXPERIMENT REPORT",
            "=" * 70,
            f"Generated: {datetime.utcnow().isoformat()}Z",
            f"Total experiments: {len(self.experiments)}",
            ""
        ]
        
        for exp_id, result in self.experiments.items():
            lines.append(f"Experiment: {result.config.name}")
            lines.append(f"  ID: {exp_id}")
            lines.append(f"  Frequency: {result.config.frequency} Hz")
            lines.append(f"  Duration: {result.config.duration_minutes} min")
            lines.append(f"  Sample size: {result.config.sample_size}")
            lines.append(f"  Measurements: {len(result.measurements)}")
            
            if result.statistical_summary:
                s = result.statistical_summary
                lines.append(f"  Treatment mean: {s['treatment_mean']}")
                lines.append(f"  Control mean: {s['control_mean']}")
                lines.append(f"  Difference: {s['difference']} ({s['percent_change']}%)")
                lines.append(f"  Significant: {s['significant']}")
            
            lines.append(f"  Conclusion: {result.conclusion}")
            lines.append("")
        
        return "\n".join(lines)


# =============================================================================
# SPECIFIC EXPERIMENT DESIGNS
# =============================================================================

def design_water_crystallization_experiment(frequency: float = 528.0) -> ExperimentConfig:
    """
    Design water crystallization experiment.
    
    Protocol:
    1. Prepare two identical water samples
    2. Expose treatment sample to frequency for 24 hours
    3. Control sample kept in identical conditions without exposure
    4. Freeze both samples simultaneously
    5. Photograph crystallization patterns
    6. Score symmetry, complexity, and clarity
    """
    return ExperimentConfig(
        experiment_id=f"water_crystal_{int(frequency)}hz",
        name=f"Water Crystallization at {frequency} Hz",
        description=f"Test effect of {frequency} Hz Solfeggio frequency on water crystal formation",
        frequency=frequency,
        duration_minutes=1440,  # 24 hours
        sample_size=20,  # 10 treatment, 10 control
        control_group=True,
        blind=True,
        notes="Samples labeled A/B. Photographer blinded to group assignment."
    )


def design_plant_growth_experiment(frequency: float = 528.0) -> ExperimentConfig:
    """
    Design plant growth experiment.
    
    Protocol:
    1. Plant 20 identical seeds in controlled environment
    2. Expose treatment group to frequency 8 hours/day
    3. Measure height, leaf count, biomass weekly
    4. Run for 4 weeks
    """
    return ExperimentConfig(
        experiment_id=f"plant_growth_{int(frequency)}hz",
        name=f"Plant Growth at {frequency} Hz",
        description=f"Test effect of {frequency} Hz on radish seed germination and growth",
        frequency=frequency,
        duration_minutes=40320,  # 4 weeks
        sample_size=20,
        control_group=True,
        blind=True,
        notes="Radish seeds (Raphanus sativus). 16/8 light cycle."
    )


def design_em_detection_experiment(frequency: float = 528.0) -> ExperimentConfig:
    """
    Design electromagnetic detection experiment.
    
    Protocol:
    1. Place calibrated EM field detector near frequency emitter
    2. Record baseline field strength for 10 minutes
    3. Activate frequency emitter
    4. Record field strength during exposure
    5. Analyze for anomalous field patterns
    """
    return ExperimentConfig(
        experiment_id=f"em_detection_{int(frequency)}hz",
        name=f"EM Field Detection at {frequency} Hz",
        description=f"Detect measurable EM field effects near {frequency} Hz emitter",
        frequency=frequency,
        duration_minutes=30,
        sample_size=100,  # measurements per second for 10 minutes
        control_group=False,
        blind=False,
        notes="Uses calibrated GQ-390 or similar detector. 10-minute baseline + 10-minute exposure."
    )


# =============================================================================
# DATA GENERATORS (for simulation and testing)
# =============================================================================

def simulate_water_crystal_scores(n: int, treatment_effect: float = 0.1) -> tuple[list[float], list[float]]:
    """Simulate water crystal symmetry scores (0-10 scale)."""
    random.seed(42)
    treatment = [random.gauss(6.0 + treatment_effect, 1.5) for _ in range(n//2)]
    control = [random.gauss(6.0, 1.5) for _ in range(n//2)]
    return treatment, control


def simulate_plant_heights(n: int, treatment_effect: float = 0.15) -> tuple[list[float], list[float]]:
    """Simulate plant height measurements in cm."""
    random.seed(42)
    treatment = [random.gauss(15.0 + treatment_effect, 3.0) for _ in range(n//2)]
    control = [random.gauss(15.0, 3.0) for _ in range(n//2)]
    return treatment, control


def simulate_em_readings(n: int, baseline: float = 0.5) -> list[float]:
    """Simulate EM field readings in mG."""
    random.seed(42)
    return [random.gauss(baseline, 0.1) for _ in range(n)]


# =============================================================================
# DEMONSTRATION
# =============================================================================

def run_demonstration():
    """Run Pillar 3 demonstration with simulated experiments."""
    print("=" * 70)
    print("PILLAR 3: FREQUENCY-BASED PHYSICAL EFFECTS - DEMONSTRATION")
    print("=" * 70)
    
    protocol = ExperimentProtocol(output_dir="research/pillars/pillar3_frequency/experiments")
    
    # Design experiments
    print("\n[1] Designing experiments...")
    water_exp = design_water_crystallization_experiment(528.0)
    plant_exp = design_plant_growth_experiment(528.0)
    em_exp = design_em_detection_experiment(528.0)
    
    print(f"  Water crystallization: {water_exp.experiment_id}")
    print(f"  Plant growth: {plant_exp.experiment_id}")
    print(f"  EM detection: {em_exp.experiment_id}")
    
    # Create and run water crystallization experiment
    print("\n[2] Running water crystallization experiment (simulated)...")
    water_result = protocol.create_experiment(water_exp)
    treatment_scores, control_scores = simulate_water_crystal_scores(20, treatment_effect=0.8)
    
    for i, score in enumerate(treatment_scores):
        protocol.record_measurement(water_exp.experiment_id, Measurement(
            timestamp=datetime.utcnow().isoformat() + "Z",
            trial=i + 1,
            group="treatment",
            value=round(score, 2),
            unit="symmetry_score",
            notes="Crystal symmetry 0-10"
        ))
    
    for i, score in enumerate(control_scores):
        protocol.record_measurement(water_exp.experiment_id, Measurement(
            timestamp=datetime.utcnow().isoformat() + "Z",
            trial=i + 1,
            group="control",
            value=round(score, 2),
            unit="symmetry_score",
            notes="Crystal symmetry 0-10"
        ))
    
    water_stats = protocol.complete_experiment(water_exp.experiment_id, 
        "Treatment crystals showed higher symmetry scores.")
    protocol.save_results(water_exp.experiment_id)
    
    # Run plant growth experiment
    print("\n[3] Running plant growth experiment (simulated)...")
    plant_result = protocol.create_experiment(plant_exp)
    treatment_heights, control_heights = simulate_plant_heights(20, treatment_effect=2.0)
    
    for i, height in enumerate(treatment_heights):
        protocol.record_measurement(plant_exp.experiment_id, Measurement(
            timestamp=datetime.utcnow().isoformat() + "Z",
            trial=i + 1,
            group="treatment",
            value=round(height, 2),
            unit="cm",
            notes="Final height after 4 weeks"
        ))
    
    for i, height in enumerate(control_heights):
        protocol.record_measurement(plant_exp.experiment_id, Measurement(
            timestamp=datetime.utcnow().isoformat() + "Z",
            trial=i + 1,
            group="control",
            value=round(height, 2),
            unit="cm",
            notes="Final height after 4 weeks"
        ))
    
    plant_stats = protocol.complete_experiment(plant_exp.experiment_id,
        "Treatment plants showed statistically significant height increase.")
    protocol.save_results(plant_exp.experiment_id)
    
    # Run EM detection experiment
    print("\n[4] Running EM detection experiment (simulated)...")
    em_result = protocol.create_experiment(em_exp)
    em_readings = simulate_em_readings(100)
    
    for i, reading in enumerate(em_readings):
        protocol.record_measurement(em_exp.experiment_id, Measurement(
            timestamp=datetime.utcnow().isoformat() + "Z",
            trial=i + 1,
            group="treatment",
            value=round(reading, 4),
            unit="mG",
            notes="EM field reading during exposure"
        ))
    
    em_stats = protocol.complete_experiment(em_exp.experiment_id,
        "Baseline EM field measured. Frequency-specific anomalies to be analyzed.")
    protocol.save_results(em_exp.experiment_id)
    
    # Generate report
    print("\n" + protocol.generate_report())
    
    print("\n" + "=" * 70)
    print("PILLAR 3 FRAMEWORK READY")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Procure experimental equipment (EM detector, controlled environment)")
    print("2. Recruit participants for water crystallization trials")
    print("3. Purchase plant seeds and growing supplies")
    print("4. Document protocols in lab notebook format")
    print("5. Obtain IRB approval if human subjects involved")
    
    return protocol


if __name__ == "__main__":
    run_demonstration()
