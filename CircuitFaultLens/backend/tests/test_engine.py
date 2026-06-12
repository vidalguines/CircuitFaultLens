import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.engine import run_diagnosis, normalise_symptom
from app.models.schemas import Symptom

client = TestClient(app)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["fault_count"] >= 8


def test_diagnose_basic():
    r = client.post("/api/v1/diagnose", json={
        "symptoms": [
            {"name": "voltage_ripple"},
            {"name": "thermal_anomaly"},
        ]
    })
    assert r.status_code == 200
    data = r.json()
    assert len(data["hypotheses"]) > 0
    assert len(data["next_best_tests"]) > 0
    # posteriors should sum near 1
    total = sum(h["posterior"] for h in data["hypotheses"])
    assert 0.0 < total <= 1.05


def test_diagnose_with_absent():
    r = client.post("/api/v1/diagnose", json={
        "symptoms": [{"name": "noise_hf"}],
        "absent_symptoms": ["thermal_anomaly", "voltage_drop"],
    })
    assert r.status_code == 200


def test_diagnose_alias_symptom():
    r = client.post("/api/v1/diagnose", json={
        "symptoms": [{"name": "ripple"}, {"name": "hot"}],
    })
    assert r.status_code == 200
    data = r.json()
    assert "voltage_ripple" in data["normalised_symptoms"]
    assert "thermal_anomaly" in data["normalised_symptoms"]


def test_list_faults():
    r = client.get("/api/v1/faults")
    assert r.status_code == 200
    assert len(r.json()) >= 8


def test_list_symptoms():
    r = client.get("/api/v1/symptoms")
    assert r.status_code == 200
    assert "voltage_ripple" in r.json()


def test_engine_direct():
    result = run_diagnosis(
        symptoms=[Symptom(name="voltage_drop"), Symptom(name="thermal_anomaly")],
        top_n=3,
    )
    assert len(result.hypotheses) == 3
    assert result.hypotheses[0].posterior >= result.hypotheses[-1].posterior


def test_normalise():
    assert normalise_symptom("ripple") == "voltage_ripple"
    assert normalise_symptom("HOT") == "thermal_anomaly"
    assert normalise_symptom("unknown_sym") == "unknown_sym"
