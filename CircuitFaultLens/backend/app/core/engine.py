"""
Bayesian + Heuristic Fault Reasoning Engine
Core logic for CircuitFaultLens
"""

from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from app.models.schemas import Symptom, FaultHypothesis, DiagnosisResult, TestRecommendation


# ---------------------------------------------------------------------------
# Knowledge Base: fault → {prior, symptom_likelihoods}
# ---------------------------------------------------------------------------

FAULT_KNOWLEDGE_BASE: Dict[str, Dict] = {
    "capacitor_esr_high": {
        "prior": 0.18,
        "description": "Electrolytic capacitor with elevated ESR",
        "symptoms": {
            "voltage_ripple": 0.90,
            "thermal_anomaly": 0.60,
            "voltage_drop": 0.55,
            "noise_hf": 0.70,
            "intermittent_reset": 0.50,
        },
        "tests": [
            {"id": "esr_meter", "name": "In-circuit ESR Measurement", "cost": 1, "discriminates": ["capacitor_esr_high"]},
            {"id": "cap_voltage_ripple", "name": "Measure output ripple (scope, 20MHz BW)", "cost": 1, "discriminates": ["capacitor_esr_high", "inductor_saturation"]},
        ],
    },
    "inductor_saturation": {
        "prior": 0.12,
        "description": "Power inductor operating near or beyond saturation current",
        "symptoms": {
            "thermal_anomaly": 0.75,
            "voltage_drop": 0.80,
            "noise_hf": 0.65,
            "efficiency_loss": 0.85,
        },
        "tests": [
            {"id": "inductor_current", "name": "Measure peak inductor current (current probe)", "cost": 2, "discriminates": ["inductor_saturation"]},
            {"id": "thermal_scan", "name": "IR thermal scan of inductor body", "cost": 2, "discriminates": ["inductor_saturation", "mosfet_rds_high"]},
        ],
    },
    "mosfet_rds_high": {
        "prior": 0.10,
        "description": "MOSFET with elevated on-state resistance (aging or over-stress)",
        "symptoms": {
            "thermal_anomaly": 0.80,
            "voltage_drop": 0.70,
            "efficiency_loss": 0.75,
            "intermittent_reset": 0.30,
        },
        "tests": [
            {"id": "rds_on_measure", "name": "Measure Rds(on) with component tester", "cost": 2, "discriminates": ["mosfet_rds_high"]},
            {"id": "gate_drive_check", "name": "Verify gate drive voltage and timing", "cost": 1, "discriminates": ["mosfet_rds_high", "gate_driver_fault"]},
        ],
    },
    "ground_loop": {
        "prior": 0.15,
        "description": "Ground plane discontinuity or high-impedance return path",
        "symptoms": {
            "noise_hf": 0.80,
            "noise_lf": 0.70,
            "voltage_offset": 0.75,
            "emi_emission": 0.65,
        },
        "tests": [
            {"id": "ground_impedance", "name": "4-wire ground resistance measurement", "cost": 1, "discriminates": ["ground_loop", "trace_resistance"]},
            {"id": "current_probe_ground", "name": "Current probe on ground return path", "cost": 2, "discriminates": ["ground_loop"]},
        ],
    },
    "trace_resistance": {
        "prior": 0.08,
        "description": "Elevated PCB trace resistance (thin trace, cold solder, corrosion)",
        "symptoms": {
            "voltage_drop": 0.85,
            "thermal_anomaly": 0.55,
            "load_regulation_poor": 0.90,
        },
        "tests": [
            {"id": "4wire_resistance", "name": "4-wire Kelvin resistance on suspect trace", "cost": 1, "discriminates": ["trace_resistance"]},
            {"id": "thermal_scan_pcb", "name": "IR scan under load — hot trace segments", "cost": 2, "discriminates": ["trace_resistance", "solder_joint"]},
        ],
    },
    "solder_joint": {
        "prior": 0.14,
        "description": "Cold or cracked solder joint (intermittent contact)",
        "symptoms": {
            "intermittent_reset": 0.80,
            "voltage_drop": 0.60,
            "noise_hf": 0.45,
            "thermal_anomaly": 0.40,
        },
        "tests": [
            {"id": "visual_inspection", "name": "High-magnification visual inspection", "cost": 1, "discriminates": ["solder_joint"]},
            {"id": "xray_joint", "name": "X-ray inspection (BGA/hidden joints)", "cost": 4, "discriminates": ["solder_joint"]},
            {"id": "thermal_cycle", "name": "Thermal cycle + intermittency monitor", "cost": 2, "discriminates": ["solder_joint"]},
        ],
    },
    "gate_driver_fault": {
        "prior": 0.09,
        "description": "Gate driver IC malfunction — weak drive, shoot-through, or delay",
        "symptoms": {
            "noise_hf": 0.75,
            "thermal_anomaly": 0.65,
            "efficiency_loss": 0.70,
            "voltage_drop": 0.40,
        },
        "tests": [
            {"id": "gate_waveform", "name": "Oscilloscope gate waveform (rise/fall time, voltage)", "cost": 1, "discriminates": ["gate_driver_fault"]},
            {"id": "driver_supply", "name": "Verify bootstrap/gate supply voltage", "cost": 1, "discriminates": ["gate_driver_fault"]},
        ],
    },
    "decoupling_inadequate": {
        "prior": 0.14,
        "description": "Insufficient or misplaced decoupling capacitance on power rail",
        "symptoms": {
            "noise_hf": 0.85,
            "voltage_ripple": 0.80,
            "emi_emission": 0.70,
            "intermittent_reset": 0.45,
        },
        "tests": [
            {"id": "pdn_impedance", "name": "PDN impedance sweep (VNA or scope inject)", "cost": 3, "discriminates": ["decoupling_inadequate"]},
            {"id": "rail_noise_scope", "name": "Power rail noise measurement (1GHz BW scope)", "cost": 1, "discriminates": ["decoupling_inadequate", "capacitor_esr_high"]},
        ],
    },
}


# ---------------------------------------------------------------------------
# Symptom normalisation helpers
# ---------------------------------------------------------------------------

SYMPTOM_ALIASES: Dict[str, str] = {
    "ripple": "voltage_ripple",
    "hot": "thermal_anomaly",
    "heat": "thermal_anomaly",
    "drop": "voltage_drop",
    "noise": "noise_hf",
    "hf_noise": "noise_hf",
    "lf_noise": "noise_lf",
    "reset": "intermittent_reset",
    "efficiency": "efficiency_loss",
    "emi": "emi_emission",
    "offset": "voltage_offset",
    "load_reg": "load_regulation_poor",
}


def normalise_symptom(raw: str) -> str:
    s = raw.lower().strip().replace(" ", "_").replace("-", "_")
    return SYMPTOM_ALIASES.get(s, s)


# ---------------------------------------------------------------------------
# Bayesian inference
# ---------------------------------------------------------------------------

def bayesian_update(
    prior: float,
    symptom_likelihoods: Dict[str, float],
    observed_symptoms: List[str],
    absent_symptoms: Optional[List[str]] = None,
) -> float:
    """
    Naïve Bayes update.
    P(F|S) ∝ P(F) * ∏ P(sᵢ|F)  for observed
                   * ∏ (1-P(sᵢ|F)) for absent
    """
    log_prob = math.log(prior + 1e-12)
    for s in observed_symptoms:
        lkl = symptom_likelihoods.get(s, 0.05)
        log_prob += math.log(lkl + 1e-12)
    if absent_symptoms:
        for s in absent_symptoms:
            lkl = symptom_likelihoods.get(s, 0.05)
            log_prob += math.log(1.0 - lkl + 1e-12)
    return math.exp(log_prob)


def normalise_posteriors(raw_scores: Dict[str, float]) -> Dict[str, float]:
    total = sum(raw_scores.values()) + 1e-12
    return {k: v / total for k, v in raw_scores.items()}


# ---------------------------------------------------------------------------
# Next-Best-Test selection
# ---------------------------------------------------------------------------

def information_gain(
    test: Dict,
    posteriors: Dict[str, float],
) -> float:
    """
    Approximate information gain: weighted sum of posterior probabilities
    of faults the test discriminates, divided by test cost.
    """
    targets = test.get("discriminates", [])
    weight = sum(posteriors.get(f, 0.0) for f in targets)
    cost = test.get("cost", 1)
    return weight / cost


def select_next_best_tests(
    posteriors: Dict[str, float],
    already_run: Optional[List[str]] = None,
    top_n: int = 3,
) -> List[TestRecommendation]:
    already_run = already_run or []
    seen_test_ids: set = set(already_run)
    candidate_tests: Dict[str, Tuple[float, Dict]] = {}

    for fault_id, fault_data in FAULT_KNOWLEDGE_BASE.items():
        for test in fault_data.get("tests", []):
            tid = test["id"]
            if tid in seen_test_ids:
                continue
            gain = information_gain(test, posteriors)
            if tid not in candidate_tests or gain > candidate_tests[tid][0]:
                candidate_tests[tid] = (gain, test)

    ranked = sorted(candidate_tests.items(), key=lambda x: -x[1][0])[:top_n]

    results = []
    for tid, (gain, test) in ranked:
        results.append(
            TestRecommendation(
                test_id=tid,
                name=test["name"],
                information_gain=round(gain, 4),
                cost_units=test.get("cost", 1),
                target_faults=test.get("discriminates", []),
            )
        )
    return results


# ---------------------------------------------------------------------------
# Confidence band
# ---------------------------------------------------------------------------

def confidence_band(posterior: float) -> str:
    if posterior >= 0.60:
        return "HIGH"
    elif posterior >= 0.30:
        return "MODERATE"
    elif posterior >= 0.10:
        return "LOW"
    else:
        return "UNLIKELY"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_diagnosis(
    symptoms: List[Symptom],
    absent_symptoms: Optional[List[str]] = None,
    already_run_tests: Optional[List[str]] = None,
    top_n: int = 5,
) -> DiagnosisResult:
    normalised = [normalise_symptom(s.name) for s in symptoms]
    absent_norm = [normalise_symptom(s) for s in (absent_symptoms or [])]

    raw_scores: Dict[str, float] = {}
    for fault_id, fault_data in FAULT_KNOWLEDGE_BASE.items():
        raw_scores[fault_id] = bayesian_update(
            prior=fault_data["prior"],
            symptom_likelihoods=fault_data["symptoms"],
            observed_symptoms=normalised,
            absent_symptoms=absent_norm,
        )

    posteriors = normalise_posteriors(raw_scores)
    ranked = sorted(posteriors.items(), key=lambda x: -x[1])[:top_n]

    hypotheses = []
    for fault_id, prob in ranked:
        fd = FAULT_KNOWLEDGE_BASE[fault_id]
        hypotheses.append(
            FaultHypothesis(
                fault_id=fault_id,
                description=fd["description"],
                posterior=round(prob, 4),
                confidence_band=confidence_band(prob),
            )
        )

    next_tests = select_next_best_tests(
        posteriors=posteriors,
        already_run=already_run_tests,
        top_n=3,
    )

    coverage = len(normalised) / max(1, len({
        s for fd in FAULT_KNOWLEDGE_BASE.values()
        for s in fd["symptoms"].keys()
    }))

    return DiagnosisResult(
        hypotheses=hypotheses,
        next_best_tests=next_tests,
        data_completeness=round(coverage, 3),
        symptom_count=len(normalised),
        normalised_symptoms=normalised,
    )
