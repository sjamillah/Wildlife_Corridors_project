import os
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import logging
from django.conf import settings

try:
    from tensorflow import keras
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logging.warning("TensorFlow not available. LSTM predictions will be limited.")

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "ml_service" / "data"

class MovementPredictor:
    
    def __init__(self):
        self.bbmm_models = {}
        self.lstm_models = {}
        self.lstm_scalers = {}
        
    def load_bbmm_model(self, species: str) -> Optional[Dict[str, Any]]:
        if species in self.bbmm_models:
            return self.bbmm_models[species]
        
        bbmm_dir = DATA_DIR / "bbmm"
        species_lower = species.lower()
        
        if bbmm_dir.exists():
            existing_files = list(bbmm_dir.glob("*"))
            if existing_files:
                logger.debug(f"Found {len(existing_files)} files in BBMM directory: {[f.name for f in existing_files]}")
        
        possible_model_files = [
            bbmm_dir / f"{species_lower}_bbmm.pkl",
            bbmm_dir / f"bbmm_{species_lower}.pkl",
            bbmm_dir / f"{species_lower}_model.pkl",
            bbmm_dir / f"{species_lower}_bbmm_model.pkl",
        ]
        
        pattern_files = list(bbmm_dir.glob(f"*{species_lower}*.pkl"))
        possible_model_files.extend(pattern_files)
        
        model_path = None
        for path in possible_model_files:
            if path.exists() and path.suffix == '.pkl':
                model_path = path
                break
        
        if model_path and model_path.exists():
            try:
                with open(model_path, 'rb') as f:
                    model_data = pickle.load(f)
                self.bbmm_models[species] = model_data
                logger.info(f"Loaded BBMM model for {species} from {model_path.name}")
                return model_data
            except Exception as e:
                logger.warning(f"Error loading BBMM model from {model_path}: {e}")
        
        csv_files = list(bbmm_dir.glob(f"*{species_lower}*.csv"))
        if csv_files:
            logger.info(f"Found BBMM data CSV files for {species}: {[f.name for f in csv_files]}")
        
        default_variances = {
            'elephant': 0.05,
            'wildebeest': 0.08,
            'lion': 0.03,
        }
        
        variance = default_variances.get(species_lower, 0.05)
        model_data = {'sigma_squared': variance, 'species': species}
        self.bbmm_models[species] = model_data
        logger.info(f"Using default BBMM variance for {species}: {variance} (data files found: {len(csv_files) > 0})")
        return model_data
    
    def load_lstm_model(self, species: str) -> Optional[Dict[str, Any]]:
        if species in self.lstm_models:
            return self.lstm_models[species]
        
        species_lower = species.lower()
        
        possible_paths = [
            DATA_DIR / "lstm" / f"{species_lower}_lstm.h5",
            DATA_DIR / "lstm" / f"{species_lower}_lstm.pkl",
            DATA_DIR / "lstm" / "wildlife_lstm_improved_*_model.h5",
            DATA_DIR / "lstm" / "wildlife_lstm_model_*.pkl",
        ]
        
        model_path = None
        scaler_x_path = None
        scaler_y_path = None
        
        for pattern in possible_paths[:2]:
            if pattern.exists():
                model_path = pattern
                break
        
        if model_path is None:
            lstm_dir = DATA_DIR / "lstm"
            if lstm_dir.exists():
                for file in lstm_dir.glob("*.h5"):
                    model_path = file
                    break
                if model_path is None:
                    for file in lstm_dir.glob("*.pkl"):
                        if "scaler" not in file.name.lower() and "model" in file.name.lower():
                            model_path = file
                            break
        
        if model_path is None or not model_path.exists():
            logger.warning(f"LSTM model not found for {species}")
            return None
        
        lstm_dir = model_path.parent
        scaler_x_path = lstm_dir / f"{model_path.stem}_scaler_x.pkl"
        if not scaler_x_path.exists():
            for file in lstm_dir.glob("*scaler_x.pkl"):
                scaler_x_path = file
                break
        
        scaler_y_path = lstm_dir / f"{model_path.stem}_scaler_y.pkl"
        if not scaler_y_path.exists():
            for file in lstm_dir.glob("*scaler_y.pkl"):
                scaler_y_path = file
                break
        
        try:
            if model_path.suffix == '.h5' and TENSORFLOW_AVAILABLE:
                import tensorflow as tf
                
                custom_objects = {
                    'InputLayer': tf.keras.layers.InputLayer
                }
                
                try:
                    model = load_model(str(model_path), compile=False, custom_objects=custom_objects)
                    logger.info(f"Loaded LSTM .h5 model for {species}")
                except Exception as h5_error:
                    logger.warning(f"Error loading .h5 model: {h5_error}, trying .pkl fallback")
                    pkl_path = model_path.with_suffix('.pkl')
                    if pkl_path.exists():
                        with open(pkl_path, 'rb') as f:
                            model = pickle.load(f)
                        logger.info(f"Loaded LSTM .pkl model for {species}")
                    else:
                        raise h5_error
            else:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                logger.info(f"Loaded LSTM .pkl model for {species}")
            
            scaler_x = None
            scaler_y = None
            
            if scaler_x_path and scaler_x_path.exists():
                with open(scaler_x_path, 'rb') as f:
                    scaler_x = pickle.load(f)
            
            if scaler_y_path and scaler_y_path.exists():
                with open(scaler_y_path, 'rb') as f:
                    scaler_y = pickle.load(f)
            
            model_data = {
                'model': model,
                'scaler_x': scaler_x,
                'scaler_y': scaler_y,
                'species': species,
            }
            
            self.lstm_models[species] = model_data
            logger.info(f"Loaded LSTM model for {species}")
            return model_data
            
        except Exception as e:
            logger.error(f"Error loading LSTM model for {species}: {e}")
            return None
    
    def predict_with_bbmm(
        self, 
        current_lat: float, 
        current_lon: float, 
        prev_lat: Optional[float],
        prev_lon: Optional[float],
        species: str,
        time_hours: float = 1.0
    ) -> Tuple[float, float]:
        model_data = self.load_bbmm_model(species)
        if not model_data:
            if prev_lat is not None and prev_lon is not None:
                lat_diff = current_lat - prev_lat
                lon_diff = current_lon - prev_lon
                predicted_lat = current_lat + lat_diff
                predicted_lon = current_lon + lon_diff
            else:
                predicted_lat = current_lat
                predicted_lon = current_lon
            return predicted_lat, predicted_lon
        
        sigma_squared = model_data.get('sigma_squared', 0.05)
        
        if prev_lat is not None and prev_lon is not None:
            lat_diff = current_lat - prev_lat
            lon_diff = current_lon - prev_lon
            
            predicted_lat = current_lat + (lat_diff * 0.5)
            predicted_lon = current_lon + (lon_diff * 0.5)
        else:
            predicted_lat = current_lat
            predicted_lon = current_lon
        
        return predicted_lat, predicted_lon
    
    def predict_with_lstm(
        self,
        current_lat: float,
        current_lon: float,
        historical_data: Optional[pd.DataFrame],
        species: str,
        sequence_length: int = 10
    ) -> Tuple[float, float]:
        model_data = self.load_lstm_model(species)
        if not model_data or not model_data.get('model'):
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
        
        model = model_data['model']
        scaler_x = model_data.get('scaler_x')
        scaler_y = model_data.get('scaler_y')
        
        if historical_data is None or len(historical_data) < sequence_length or not scaler_x or not scaler_y:
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
        
        try:
            sequence_data = historical_data.tail(sequence_length).copy()
            
            feature_cols = ['lat', 'lon', 'speed_kmh', 'heading']
            available_cols = [col for col in feature_cols if col in sequence_data.columns]
            
            if len(available_cols) < 2:
                return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
            
            X_seq = sequence_data[available_cols].values
            
            X_seq = X_seq.reshape(1, sequence_length, -1)
            
            X_flat = X_seq.reshape(1, -1)
            X_scaled_flat = scaler_x.transform(X_flat)
            X_scaled = X_scaled_flat.reshape(X_seq.shape)
            
            if TENSORFLOW_AVAILABLE and hasattr(model, 'predict'):
                y_pred_scaled = model.predict(X_scaled, verbose=0)
            else:
                y_pred_scaled = model.predict(X_scaled)
            
            y_pred = scaler_y.inverse_transform(y_pred_scaled)
            
            predicted_lat = float(y_pred[0][0]) if y_pred.shape[1] >= 1 else current_lat
            predicted_lon = float(y_pred[0][1]) if y_pred.shape[1] >= 2 else current_lon
            
            return predicted_lat, predicted_lon
            
        except Exception as e:
            logger.error(f"Error predicting with LSTM for {species}: {e}")
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)

_predictor = None

def get_predictor() -> MovementPredictor:
    global _predictor
    if _predictor is None:
        _predictor = MovementPredictor()
    return _predictor
