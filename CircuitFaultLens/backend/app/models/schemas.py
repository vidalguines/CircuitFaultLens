from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


class Symptom(BaseModel):
    name: str = Field(..., description="Symptom identifier, e.g. 'voltage_drop'")
    severity: Optional[float] = Field(None, ge=0.0, le=1.0, description="0–1 severity weight (optional)")


class DiagnosisRequest(BaseModel):
    symptoms: List[Symptom] = Field(..., min_length=1)
    absent_symptoms: Optional[List[str]] = Field(default=None, description="Symptoms explicitly NOT present")
    already_run_tests: Optional[List[str]] = Field(default=None, description="Test IDs already performed")
    top_n: int = Field(default=5, ge=1, le=10)


class FaultHypothesis(BaseModel):
    fault_id: str
    description: str
    posterior: float
    confidence_band: str  # HIGH / MODERATE / LOW / UNLIKELY


class TestRecommendation(BaseModel):
    test_id: str
    name: str
    information_gain: float
    cost_units: int
    target_faults: List[str]


class DiagnosisResult(BaseModel):
    hypotheses: List[FaultHypothesis]
    next_best_tests: List[TestRecommendation]
    data_completeness: float
    symptom_count: int
    normalised_symptoms: List[str]


class HealthResponse(BaseModel):
    status: str
    version: str
    fault_count: int
    symptom_types: int
