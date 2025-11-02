"""
Loads the selected best model, constructs the environment, and exposes generate/evaluate methods.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from ..config.rl_config import cfg
from ..core.data_integrator import DataIntegrator
from ..core.reward_calculator import summarize_episode_metrics


@dataclass
class SelectedModel:
    algo: str
    model_path: Path
    version: str
    score: float | None


class RLCorridorService:
    def __init__(self) -> None:
        # Use a single forced model (no comparison/selection)
        forced_path = cfg.FORCED_MODEL_PATH
        forced_algo = cfg.FORCED_ALGO or "ppo"
        if not forced_path:
            # Fallback to default PPO path if not set
            forced_path = cfg.PPO_MODEL_PATH
        version = forced_path.stem  # derive version/name from filename
        self.selected = SelectedModel(
            algo=forced_algo,
            model_path=Path(forced_path),
            version=version,
            score=None,
        )
        self.data_integrator = DataIntegrator(cfg.RASTERS_DIR)
        # NOTE: The following placeholders assume you'll connect to your actual env and loader
        self.env = None
        self.agent = None
        self._lazy_load()

    def _lazy_load(self) -> None:
        # Import heavy deps here to keep module import light
        # Example (to be replaced with your actual env/loader):
        # from environment.custom_env import CorridorEnv
        # from integration.model_loader import load_agent
        # self.env = CorridorEnv(...)
        # self.agent = load_agent(self.selected.algo, self.selected.model_path, self.env)
        pass

    def generate_corridor(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Clamp to bounding box if provided
        constraints = payload.get("constraints") or {}
        bbox = constraints.get("bbox") if isinstance(constraints, dict) else None
        # Use default bbox from config if none provided
        if not bbox and getattr(cfg, "DEFAULT_BBOX", None):
            bbox = cfg.DEFAULT_BBOX

        def clamp_point(pt: Dict[str, float]) -> Dict[str, float]:
            if not bbox:
                return pt
            try:
                min_lat = float(bbox["min_lat"])  # type: ignore[index]
                min_lon = float(bbox["min_lon"])  # type: ignore[index]
                max_lat = float(bbox["max_lat"])  # type: ignore[index]
                max_lon = float(bbox["max_lon"])  # type: ignore[index]
            except Exception:
                return pt
            lat = min(max(pt["lat"], min_lat), max_lat)
            lon = min(max(pt["lon"], min_lon), max_lon)
            return {"lat": lat, "lon": lon}

        # Clamp start/end
        payload["start_point"] = clamp_point(payload["start_point"])  # type: ignore[index]
        payload["end_point"] = clamp_point(payload["end_point"])      # type: ignore[index]

        features = self.data_integrator.build_features(payload)
        # Run rollout using self.agent/self.env; here we return a placeholder structure
        path_geojson = {
            "type": "LineString",
            "coordinates": [
                [features["start_point"]["lon"], features["start_point"]["lat"]],
                [features["end_point"]["lon"], features["end_point"]["lat"]],
            ],
        }
        rewards = [1.0]  # replace with episode rewards
        metrics = summarize_episode_metrics(rewards, info={})
        return {
            "path": path_geojson,
            "optimization_score": float(metrics["cumulative_reward"]),
            "objective_breakdown": metrics,
            "model_version": self.selected.version,
        }

    def evaluate_path(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Evaluate a provided GeoJSON path using the env's metrics
        rewards = [1.0]  # replace with evaluation logic
        metrics = summarize_episode_metrics(rewards, info={})
        return {"metrics": metrics, "model_version": self.selected.version}


