"""
FastAPI routes for RL corridor generation and evaluation.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel, Field

from models.rl_corridor import RLCorridorService


router = APIRouter(prefix="/corridor", tags=["corridor"])
service = RLCorridorService()


class Point(BaseModel):
    lat: float
    lon: float


class GenerateRequest(BaseModel):
    species: str = Field(..., description="Species name")
    start_point: Point
    end_point: Point
    constraints: Dict[str, Any] | None = None
    seed: int | None = None
    model_version: str | None = None


@router.post("/generate")
def generate(req: GenerateRequest) -> Dict[str, Any]:
    payload = req.model_dump()
    return service.generate_corridor(payload)


@router.post("/predict")
def predict(req: GenerateRequest) -> Dict[str, Any]:
    """Alias for generate (for compatibility with Django client)"""
    payload = req.model_dump()
    return service.generate_corridor(payload)


class EvaluateRequest(BaseModel):
    species: str
    path: Dict[str, Any]
    metrics: list[str] | None = None


@router.post("/evaluate")
def evaluate(req: EvaluateRequest) -> Dict[str, Any]:
    payload = req.model_dump()
    return service.evaluate_path(payload)


