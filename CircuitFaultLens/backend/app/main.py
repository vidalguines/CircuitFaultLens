from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import diagnosis, health

app = FastAPI(
    title="CircuitFaultLens API",
    description="Bayesian fault diagnosis engine for incomplete circuit data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(diagnosis.router, prefix="/api/v1", tags=["diagnosis"])


@app.get("/")
def root():
    return {"message": "CircuitFaultLens API", "version": "1.0.0"}
