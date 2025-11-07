"""
Health/readiness endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter

from config.rl_config import cfg


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
def live() -> dict:
    return {"status": "ok", "service": cfg.SERVICE_NAME, "version": cfg.VERSION}


@router.get("/ready")
def ready() -> dict:
    # Optionally check model files exist
    return {"status": "ok"}


