"""
ML Service Settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """ML Service configuration"""
    
    # Service
    SERVICE_NAME: str = "Wildlife ML Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API Security - Disabled for development
    API_KEY: str = ""  # Empty string disables API key requirement
    ALLOWED_ORIGINS: list = ["*"]  # Allow all origins
    
    # Cloudflare Storage Configuration
    CLOUDFLARE_BASE_URL: str = ""  # Set to your Cloudflare domain (e.g., "https://your-domain.com")
    
    # Model paths (can be local or Cloudflare paths)
    # If using Cloudflare, use paths like: "ml-information/trained_models/hmm/file.csv"
    MODEL_DIR: str = "./data"
    HMM_DATA_PATH: str = "ml-information/trained_models/hmm"  # Cloudflare path for HMM CSV files
    BBMM_DATA_PATH: str = "ml-information/trained_models/bbmm"  # Cloudflare path for BBMM CSV files
    HMM_MODEL_PATH: str = "./data/hmm/hmm_movement.pkl"
    XGBOOST_MODEL_PATH: str = "./data/xgboost/xgboost_habitat.pkl"
    LSTM_MODEL_PATH: str = "./data/lstm/lstm_movement.h5"
    RL_MODEL_PATH: str = "./data/rl/rl_corridor.pkl"
    
    # Model parameters
    HMM_STATES: int = 5
    PREDICTION_HORIZON_DAYS: int = 7
    
    # Redis (optional for caching)
    REDIS_URL: str = "redis://localhost:6379/2"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "../logs/ml_service.log"
    
    @property
    def CORS_ORIGINS(self):
        return self.ALLOWED_ORIGINS
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


@lru_cache()
def get_settings():
    return Settings()

