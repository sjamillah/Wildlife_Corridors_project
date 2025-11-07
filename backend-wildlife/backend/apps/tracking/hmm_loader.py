import os
import sys
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
ml_service_path = str(BASE_DIR / "ml_service")
if ml_service_path not in sys.path:
    sys.path.insert(0, ml_service_path)

class HMMBehaviorPredictor:
    
    STATE_RESTING = 'resting'
    STATE_FORAGING = 'foraging'
    STATE_TRAVELING = 'traveling'
    STATE_MIGRATING = 'migrating'
    
    def __init__(self):
        self.models = {}
        self.models_loaded = False
        self._load_models()
    
    def _load_models(self):
        if os.getenv('DISABLE_LOCAL_ML', 'False').lower() == 'true':
            logger.info("Local ML disabled - HMM unavailable")
            return
        
        hmm_dir = BASE_DIR / "ml_service" / "data" / "hmm"
        
        if not hmm_dir.exists():
            logger.warning(f"HMM model directory not found: {hmm_dir}")
            return
        
        existing_files = list(hmm_dir.glob("*"))
        if existing_files:
            logger.info(f"Found {len(existing_files)} files in HMM directory: {[f.name for f in existing_files]}")
        
        species_list = ['elephant', 'wildebeest']
        
        for species in species_list:
            possible_files = [
                hmm_dir / f"{species}_hmm.pkl",
                hmm_dir / f"hmm_{species}.pkl",
                hmm_dir / f"{species}_behavior_model.pkl",
                hmm_dir / f"{species}_hmm_model.pkl",
                hmm_dir / f"{species}_model.pkl",
            ]
            
            pattern_files = list(hmm_dir.glob(f"*{species}*.pkl"))
            possible_files.extend(pattern_files)
            
            model_loaded = False
            for model_path in possible_files:
                if model_path.exists() and model_path.suffix == '.pkl':
                    try:
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                        
                        self.models[species] = model
                        logger.info(f"Loaded HMM model for {species} from {model_path.name}")
                        self.models_loaded = True
                        model_loaded = True
                        break
                    except Exception as e:
                        logger.warning(f"Error loading HMM model from {model_path}: {e}")
            
            csv_files = list(hmm_dir.glob(f"*{species}*.csv"))
            if csv_files:
                logger.info(f"Found HMM data CSV files for {species}: {[f.name for f in csv_files]}")
            
            if not model_loaded:
                logger.info(f"HMM model (.pkl) not found for {species} in {hmm_dir}, using rule-based fallback")
    
    def predict_behavior(
        self,
        speed_kmh: float,
        directional_angle: Optional[float] = None,
        prev_speed: Optional[float] = None,
        prev_angle: Optional[float] = None,
        species: str = 'elephant'
    ) -> str:
        species_lower = species.lower()
        
        model = self.models.get(species_lower)
        
        if model:
            try:
                return self._predict_with_hmm(
                    model, speed_kmh, directional_angle, prev_speed, prev_angle, species
                )
            except Exception as e:
                logger.warning(f"HMM prediction failed for {species}: {e}, using rules")
        
        return self._predict_with_rules(
            speed_kmh, directional_angle, prev_speed, prev_angle, species
        )
    
    def _predict_with_hmm(
        self,
        model,
        speed: float,
        angle: Optional[float],
        prev_speed: Optional[float],
        prev_angle: Optional[float],
        species: str
    ) -> str:
        features = [speed]
        
        if angle is not None:
            features.append(angle)
        
        if prev_speed is not None:
            features.append(prev_speed)
        
        observation = np.array([features])
        
        try:
            if hasattr(model, 'predict'):
                state = model.predict(observation)[0]
            elif hasattr(model, 'decode'):
                state = model.decode(observation)[0]
            else:
                return self._predict_with_rules(speed, angle, prev_speed, prev_angle, species)
            
            state_mapping = {
                0: self.STATE_RESTING,
                1: self.STATE_FORAGING,
                2: self.STATE_TRAVELING,
                3: self.STATE_MIGRATING
            }
            
            return state_mapping.get(state, self.STATE_TRAVELING)
            
        except Exception as e:
            logger.warning(f"HMM decode error: {e}")
            return self._predict_with_rules(speed, angle, prev_speed, prev_angle, species)
    
    def _predict_with_rules(
        self,
        speed: float,
        angle: Optional[float],
        prev_speed: Optional[float],
        prev_angle: Optional[float],
        species: str
    ) -> str:
        species_lower = species.lower()
        
        if species_lower == 'elephant':
            rest_threshold = 0.5
            forage_threshold = 2.0
            travel_threshold = 6.0
        elif species_lower == 'wildebeest':
            rest_threshold = 0.8
            forage_threshold = 3.0
            travel_threshold = 10.0
        else:
            rest_threshold = 0.5
            forage_threshold = 2.5
            travel_threshold = 8.0
        
        direction_change = 0
        if angle is not None and prev_angle is not None:
            direction_change = abs(angle - prev_angle)
            if direction_change > 180:
                direction_change = 360 - direction_change
        
        if speed < rest_threshold:
            return self.STATE_RESTING
        
        elif speed < forage_threshold:
            if direction_change > 45:
                return self.STATE_FORAGING
            else:
                return self.STATE_RESTING
        
        elif speed < travel_threshold:
            if direction_change < 30:
                return self.STATE_TRAVELING
            else:
                return self.STATE_FORAGING
        
        else:
            if direction_change < 20:
                return self.STATE_MIGRATING
            else:
                return self.STATE_TRAVELING
    
    def analyze_movement_sequence(
        self,
        tracking_points: List[Dict],
        species: str = 'elephant'
    ) -> List[Dict]:
        if not tracking_points:
            return []
        
        analyzed = []
        
        for i, point in enumerate(tracking_points):
            speed = point.get('speed_kmh', 0)
            angle = point.get('directional_angle')
            
            prev_speed = None
            prev_angle = None
            if i > 0:
                prev_speed = tracking_points[i-1].get('speed_kmh')
                prev_angle = tracking_points[i-1].get('directional_angle')
            
            behavior = self.predict_behavior(
                speed, angle, prev_speed, prev_angle, species
            )
            
            analyzed.append({
                **point,
                'behavior_state': behavior
            })
        
        return analyzed

_hmm_predictor = None

def get_hmm_predictor() -> HMMBehaviorPredictor:
    global _hmm_predictor
    if _hmm_predictor is None:
        _hmm_predictor = HMMBehaviorPredictor()
    return _hmm_predictor
