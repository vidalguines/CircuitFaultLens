from fastapi import APIRouter, HTTPException
from app.models.schemas import DiagnosisRequest, DiagnosisResult
from app.core.engine import run_diagnosis, FAULT_KNOWLEDGE_BASE

router = APIRouter()


@router.post("/diagnose", response_model=DiagnosisResult)
def diagnose(request: DiagnosisRequest):
    """
    Submit partial symptoms → ranked fault hypotheses + next-best tests.
    """
    try:
        result = run_diagnosis(
            symptoms=request.symptoms,
            absent_symptoms=request.absent_symptoms,
            already_run_tests=request.already_run_tests,
            top_n=request.top_n,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/faults")
def list_faults():
    """List all known fault types in the knowledge base."""
    return [
        {"fault_id": fid, "description": fd["description"], "prior": fd["prior"]}
        for fid, fd in FAULT_KNOWLEDGE_BASE.items()
    ]


@router.get("/symptoms")
def list_symptoms():
    """List all known symptom identifiers."""
    all_symptoms = set()
    for fd in FAULT_KNOWLEDGE_BASE.values():
        all_symptoms.update(fd["symptoms"].keys())
    return sorted(all_symptoms)
