from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.engine import FAULT_KNOWLEDGE_BASE

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health():
    all_symptoms = set()
    for fd in FAULT_KNOWLEDGE_BASE.values():
        all_symptoms.update(fd["symptoms"].keys())
    return HealthResponse(
        status="ok",
        version="1.0.0",
        fault_count=len(FAULT_KNOWLEDGE_BASE),
        symptom_types=len(all_symptoms),
    )
