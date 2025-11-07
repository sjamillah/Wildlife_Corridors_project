import os
import sys
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import Optional, Dict

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
ml_service_path = str(BASE_DIR / "ml_service")
if ml_service_path not in sys.path:
    sys.path.insert(0, ml_service_path)

class XGBoostHabitatPredictor:
    
    def __init__(self):
        self.models = {}
        self.models_loaded = False
        self._load_models()
    
    def _load_models(self):
        if os.getenv('DISABLE_LOCAL_ML', 'False').lower() == 'true':
            logger.info("Local ML disabled - XGBoost unavailable")
            return
        
        model_dir = BASE_DIR / "ml_service" / "data" / "xgboost"
        
        if not model_dir.exists():
            logger.warning(f"XGBoost model directory not found: {model_dir}")
            return
        
        species_list = ['elephant', 'wildebeest']
        
        for species in species_list:
            model_path = model_dir / f"xgboost_habitat_model_{species}.pkl"
            
            if model_path.exists():
                try:
                    with open(model_path, 'rb') as f:
                        model = pickle.load(f)
                    
                    self.models[species] = model
                    logger.info(f"Loaded XGBoost model for {species}")
                    self.models_loaded = True
                    
                except Exception as e:
                    logger.error(f"Error loading XGBoost model for {species}: {e}")
            else:
                logger.warning(f"XGBoost model not found: {model_path}")
    
    def predict_habitat(
        self,
        lat: float,
        lon: float,
        species: str = 'elephant',
        features: Optional[Dict] = None
    ) -> Dict:
        species_lower = species.lower()
        
        model = self.models.get(species_lower)
        
        if not model:
            logger.warning(f"XGBoost model not loaded for {species}")
            return self._get_default_habitat(lat, lon, species)
        
        try:
            if features:
                feature_vector = self._prepare_features(lat, lon, features)
            else:
                feature_vector = self._extract_features_from_location(lat, lon, species)
            
            habitat_score = model.predict(feature_vector)[0]
            
            if habitat_score > 0.7:
                suitability = 'High'
            elif habitat_score > 0.4:
                suitability = 'Medium'
            else:
                suitability = 'Low'
            
            return {
                'habitat_score': float(habitat_score),
                'suitability': suitability,
                'location': {'lat': lat, 'lon': lon},
                'species': species,
                'model': 'xgboost',
                'features': feature_vector.tolist() if hasattr(feature_vector, 'tolist') else []
            }
            
        except Exception as e:
            logger.error(f"Error predicting habitat for {species}: {e}")
            return self._get_default_habitat(lat, lon, species)
    
    def _prepare_features(self, lat: float, lon: float, features: Dict) -> np.ndarray:
        feature_list = [
            features.get('ndvi', 0.5),
            features.get('elevation', 1000),
            features.get('slope', 5.0),
            features.get('water_distance_km', 2.0),
            features.get('land_cover', 0.5),
            lat,
            lon
        ]
        
        return np.array([feature_list])
    
    def _extract_features_from_location(self, lat: float, lon: float, species: str) -> np.ndarray:
        if -3.0 <= lat <= -1.0 and 35.0 <= lon <= 38.0:
            ndvi = 0.6
            elevation = 1200
            water_dist = 2.5
        else:
            ndvi = 0.5
            elevation = 1000
            water_dist = 5.0
        
        features = [
            ndvi,
            elevation,
            5.0,
            water_dist,
            0.6,
            lat,
            lon
        ]
        
        return np.array([features])
    
    def _get_default_habitat(self, lat: float, lon: float, species: str) -> Dict:
        return {
            'habitat_score': 0.6,
            'suitability': 'Medium',
            'location': {'lat': lat, 'lon': lon},
            'species': species,
            'model': 'default',
            'features': []
        }
    
    def get_environment_data(
        self,
        lat: float,
        lon: float,
        radius: int = 50000,
        species: str = 'elephant'
    ) -> Dict:
        habitat = self.predict_habitat(lat, lon, species)
        
        result = {
            'center': {'lat': lat, 'lon': lon},
            'radius_m': radius,
            'species': species,
            'habitat': habitat,
            'features': {
                'ndvi': 0.6,
                'elevation': 1200,
                'water_distance_km': 2.5,
                'land_cover': 'grassland',
                'slope': 5.2,
                'vegetation_density': 'moderate'
            },
            'model_available': species.lower() in self.models,
            'model_type': 'xgboost' if species.lower() in self.models else 'default'
        }
        
        return result

_xgboost_predictor = None

def get_xgboost_predictor() -> XGBoostHabitatPredictor:
    global _xgboost_predictor
    if _xgboost_predictor is None:
        _xgboost_predictor = XGBoostHabitatPredictor()
    return _xgboost_predictor
