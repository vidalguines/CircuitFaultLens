# CircuitFaultLens

> **Bayesian fault diagnosis for power electronics under incomplete data.**

CircuitFaultLens ranks fault hypotheses from partial symptom observations and recommends the most information-efficient next test — the core engineering skill of structured decision-making under uncertainty.

---

## Architecture

```
circuitfaultlens/
├── backend/               # Python · FastAPI
│   ├── app/
│   │   ├── core/engine.py      # Bayesian + heuristic reasoning engine
│   │   ├── api/diagnosis.py    # REST endpoints
│   │   ├── models/schemas.py   # Pydantic schemas
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/              # React · Recharts
│   ├── src/
│   │   ├── components/
│   │   └── App.js
│   └── Dockerfile
├── cli/diagnose.py        # Interactive terminal UI
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Core Logic

The engine implements **Naïve Bayes** posterior updates over a knowledge base of 8 common power-electronics faults:

```
P(F | symptoms) ∝ P(F) · ∏ P(sᵢ | F)   [observed]
                        · ∏ (1 - P(sᵢ | F))  [absent]
```

**Next-Best-Test** selection uses an information-gain-to-cost ratio:

```
IG(test) = Σ P(faultᵢ) for faults the test discriminates
Rank     = IG(test) / cost_units
```

---

## Quick Start

### Docker Compose (recommended)

```bash
git clone https://github.com/<you>/CircuitFaultLens.git
cd CircuitFaultLens
docker compose up --build
```

- UI  → http://localhost:3000
- API → http://localhost:8000/docs

### Local development

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm start          # proxies /api → localhost:8000
```

**CLI**
```bash
cd cli
python diagnose.py
```

---

## API

### `POST /api/v1/diagnose`

```json
{
  "symptoms": [
    {"name": "voltage_ripple"},
    {"name": "thermal_anomaly"}
  ],
  "absent_symptoms": ["noise_hf"],
  "already_run_tests": ["visual_inspection"],
  "top_n": 5
}
```

**Response**

```json
{
  "hypotheses": [
    {
      "fault_id": "capacitor_esr_high",
      "description": "Electrolytic capacitor with elevated ESR",
      "posterior": 0.4231,
      "confidence_band": "HIGH"
    }
  ],
  "next_best_tests": [
    {
      "test_id": "esr_meter",
      "name": "In-circuit ESR Measurement",
      "information_gain": 0.2846,
      "cost_units": 1,
      "target_faults": ["capacitor_esr_high"]
    }
  ],
  "data_completeness": 0.182,
  "symptom_count": 2,
  "normalised_symptoms": ["voltage_ripple", "thermal_anomaly"]
}
```

### Symptom Aliases

| Alias | Canonical |
|-------|-----------|
| `ripple` | `voltage_ripple` |
| `hot`, `heat` | `thermal_anomaly` |
| `drop` | `voltage_drop` |
| `noise`, `hf_noise` | `noise_hf` |
| `reset` | `intermittent_reset` |
| `efficiency` | `efficiency_loss` |

---

## Fault Knowledge Base

| Fault | Prior | Key Symptoms |
|-------|-------|-------------|
| `capacitor_esr_high` | 18% | ripple, noise, thermal |
| `inductor_saturation` | 12% | thermal, voltage drop, efficiency |
| `mosfet_rds_high` | 10% | thermal, voltage drop |
| `ground_loop` | 15% | HF noise, offset |
| `trace_resistance` | 8% | voltage drop, load regulation |
| `solder_joint` | 14% | intermittent reset |
| `gate_driver_fault` | 9% | HF noise, efficiency |
| `decoupling_inadequate` | 14% | HF noise, ripple |

---

## Extending the Knowledge Base

Edit `backend/app/core/engine.py` — `FAULT_KNOWLEDGE_BASE`:

```python
"your_fault_id": {
    "prior": 0.10,                    # initial probability
    "description": "Human-readable description",
    "symptoms": {
        "symptom_name": 0.75,         # P(symptom | fault)
    },
    "tests": [
        {
            "id": "test_id",
            "name": "Test description",
            "cost": 2,                # relative effort 1–5
            "discriminates": ["your_fault_id"],
        }
    ],
}
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## License

MIT
