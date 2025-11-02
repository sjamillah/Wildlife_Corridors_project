"""
FastAPI ML Service - Main Application
Serves machine learning models for wildlife predictions
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from .config.settings import get_settings
from .api import corridor, health
from .core.auth import verify_api_key

import os
from pathlib import Path

logs_dir = Path(__file__).parent.parent / 'logs'
logs_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(logs_dir / 'ml_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    logger.info("Starting ML Service...")
    yield
    logger.info("Shutting down ML Service...")


app = FastAPI(
    title="Wildlife Tracking ML Service",
    description="Machine Learning microservice for wildlife predictions",
    version="1.0.0",
    lifespan=lifespan
)

cors_origins = settings.CORS_ORIGINS
if "*" in cors_origins or settings.DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.include_router(corridor.router, prefix="/api/v1/ml", tags=["Corridor Optimization"])
app.include_router(health.router, prefix="/api/v1/ml", tags=["Health & Management"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Wildlife Tracking ML Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "health": "/api/v1/ml/health/live",
            "corridor_generate": "/api/v1/ml/corridor/generate",
            "corridor_evaluate": "/api/v1/ml/corridor/evaluate"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml_service",
        "timestamp": datetime.utcnow().isoformat(),
    }

