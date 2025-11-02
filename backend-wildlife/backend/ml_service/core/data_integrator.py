from __future__ import annotations

from pathlib import Path
from typing import Any, Dict


class DataIntegrator:
    def __init__(self, rasters_dir: Path):
        self.rasters_dir = rasters_dir

    def build_features(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Return the dict of env/init kwargs expected by the RL environment.

        This method should call into your existing integration/data_connector.py logic
        once this file lives next to it inside the ML service image.
        """
        return {
            "species": request_payload.get("species"),
            "start_point": request_payload.get("start_point"),
            "end_point": request_payload.get("end_point"),
            "constraints": request_payload.get("constraints", {}),
            "rasters_dir": str(self.rasters_dir),
        }


