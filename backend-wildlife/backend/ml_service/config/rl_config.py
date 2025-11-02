"""
NEW: RL service config.
Adjust paths to point to your deployed model and raster locations.
Supports both local paths and Cloudflare storage paths.
"""

from pathlib import Path
from ..core.cloudflare_loader import get_file_loader
from ..config.settings import get_settings

class RLConfig:
    # Model selection
    MODEL_SELECTION_MODE: str = "force"  # "auto" | "force"
    FORCED_ALGO: str | None = "ppo"      # "ppo" | "a2c" | "dqn" | "reinforce"
    # Path to a single saved model you want to use (set after upload)
    # Example: BASE_DIR / "data" / "rl" / "rl_model_updated_ppo_elephant.zip"
    FORCED_MODEL_PATH: Path | None = None

    # Base directories - supports Cloudflare paths
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    
    # Local paths (fallback if Cloudflare not configured)
    MODELS_DIR: Path = BASE_DIR / "data" / "rl"
    RASTERS_DIR_LOCAL: Path = BASE_DIR / "data" / "rasters"
    
    # Cloudflare paths (preferred if Cloudflare is configured)
    # These will be resolved via CloudflareFileLoader
    _settings = get_settings()
    CLOUDFLARE_BASE_URL: str = _settings.CLOUDFLARE_BASE_URL if hasattr(_settings, 'CLOUDFLARE_BASE_URL') else ""
    
    @property
    def RASTERS_DIR(self) -> str:
        """Get raster directory path (Cloudflare or local)"""
        if self.CLOUDFLARE_BASE_URL:
            return "ml-information/data/rasters"
        return str(self.RASTERS_DIR_LOCAL)

    # PPO
    PPO_MODEL_PATH: Path = MODELS_DIR / "ppo" / "best_model.zip"
    PPO_EVAL_PATH: Path = MODELS_DIR / "ppo" / "evaluations.npz"

    # A2C
    A2C_MODEL_PATH: Path = MODELS_DIR / "a2c" / "best_model.zip"
    A2C_EVAL_PATH: Path = MODELS_DIR / "a2c" / "evaluations.npz"

    # DQN
    DQN_MODEL_PATH: Path = MODELS_DIR / "dqn" / "best_model.zip"
    DQN_EVAL_PATH: Path = MODELS_DIR / "dqn" / "evaluations.npz"

    # REINFORCE
    REINFORCE_MODEL_PATH: Path = MODELS_DIR / "reinforce" / "reinforce_model.pth"
    REINFORCE_TRAINING_RESULTS: Path = MODELS_DIR / "reinforce" / "training_results.npy"

    @property
    def RASTERS(self) -> dict[str, str]:
        """Get raster paths (Cloudflare or local)"""
        raster_names = [
            "dist_protected_areas",
            "dist_roads",
            "dist_settlement",
            "dist_water",
            "elevation",
            "landcover",
            "ndvi",
            "rainfall"
        ]
        
        raster_dir = self.RASTERS_DIR
        return {
            name: f"{raster_dir}/{name}_raster_kenya_tanzania.tif"
            for name in raster_names
    }

    # Default corridor bounding box (Kenya-Tanzania wildlife corridor)
    # longitudes first, then latitudes, matching GIS conventions
    DEFAULT_BBOX: dict[str, float | str] = {
        "min_lon": 29.0,
        "max_lon": 42.0,
        "min_lat": -12.0,
        "max_lat": 5.5,
        "name": "Kenya-Tanzania Wildlife Corridor",
    }

    # Service
    SERVICE_NAME: str = "ml_service"
    VERSION: str = "0.1.0"


cfg = RLConfig()


