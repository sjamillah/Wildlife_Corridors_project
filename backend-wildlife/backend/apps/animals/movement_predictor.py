"""
Utility module for loading movement models (BBMM and LSTM) and making predictions
"""
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

# Get base directory
BASE_DIR = Path(__file__).resolve().parents[2]  # backend directory
DATA_DIR = BASE_DIR / "ml_service" / "data"


class MovementPredictor:
    """Handles loading and prediction using BBMM and LSTM models"""
    
    def __init__(self):
        self.bbmm_models = {}
        self.lstm_models = {}
        self.lstm_scalers = {}
        
    def load_bbmm_model(self, species: str) -> Optional[Dict[str, Any]]:
        """
        Load BBMM model for a species
        
        Args:
            species: Species name (e.g., 'elephant', 'wildebeest')
            
        Returns:
            Dictionary with model parameters or None if not found
        """
        if species in self.bbmm_models:
            return self.bbmm_models[species]
        
        # BBMM models are typically stored as variance parameters
        # Try to load from pickle file if available
        model_path = DATA_DIR / "bbmm" / f"{species.lower()}_bbmm.pkl"
        
        if model_path.exists():
            try:
                with open(model_path, 'rb') as f:
                    model_data = pickle.load(f)
                self.bbmm_models[species] = model_data
                logger.info(f"Loaded BBMM model for {species}")
                return model_data
            except Exception as e:
                logger.error(f"Error loading BBMM model for {species}: {e}")
        
        # If no model file, use default variance based on species
        default_variances = {
            'elephant': 0.05,  # km^2
            'wildebeest': 0.08,
            'lion': 0.03,
        }
        
        variance = default_variances.get(species.lower(), 0.05)
        model_data = {'sigma_squared': variance, 'species': species}
        self.bbmm_models[species] = model_data
        logger.info(f"Using default BBMM variance for {species}: {variance}")
        return model_data
    
    def load_lstm_model(self, species: str) -> Optional[Dict[str, Any]]:
        """
        Load LSTM model and scalers for a species
        
        Args:
            species: Species name
            
        Returns:
            Dictionary with model, scaler_x, scaler_y or None if not found
        """
        if species in self.lstm_models:
            return self.lstm_models[species]
        
        species_lower = species.lower()
        
        # Try different possible model file names
        possible_paths = [
            DATA_DIR / "lstm" / f"{species_lower}_lstm.h5",
            DATA_DIR / "lstm" / f"{species_lower}_lstm.pkl",
            DATA_DIR / "lstm" / "wildlife_lstm_improved_*_model.h5",
            DATA_DIR / "lstm" / "wildlife_lstm_model_*.pkl",
        ]
        
        model_path = None
        scaler_x_path = None
        scaler_y_path = None
        
        # Try to find model file
        for pattern in possible_paths[:2]:  # Exact matches first
            if pattern.exists():
                model_path = pattern
                break
        
        # If no exact match, search for pattern files
        if model_path is None:
            lstm_dir = DATA_DIR / "lstm"
            if lstm_dir.exists():
                for file in lstm_dir.glob("*.h5"):
                    model_path = file
                    break
                if model_path is None:
                    for file in lstm_dir.glob("*.pkl"):
                        # Check if it's a model (not a scaler)
                        if "scaler" not in file.name.lower() and "model" in file.name.lower():
                            model_path = file
                            break
        
        if model_path is None or not model_path.exists():
            logger.warning(f"LSTM model not found for {species}")
            return None
        
        # Try to find scalers
        lstm_dir = model_path.parent
        scaler_x_path = lstm_dir / f"{model_path.stem}_scaler_x.pkl"
        if not scaler_x_path.exists():
            # Try pattern matching
            for file in lstm_dir.glob("*scaler_x.pkl"):
                scaler_x_path = file
                break
        
        scaler_y_path = lstm_dir / f"{model_path.stem}_scaler_y.pkl"
        if not scaler_y_path.exists():
            for file in lstm_dir.glob("*scaler_y.pkl"):
                scaler_y_path = file
                break
        
        try:
            # Load model
            if model_path.suffix == '.h5' and TENSORFLOW_AVAILABLE:
                model = load_model(str(model_path))
            else:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            
            # Load scalers
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
        """
        Predict next location using BBMM model
        
        Args:
            current_lat: Current latitude
            current_lon: Current longitude
            prev_lat: Previous latitude (if available)
            prev_lon: Previous longitude (if available)
            species: Species name
            time_hours: Time in hours to predict forward
            
        Returns:
            Tuple of (predicted_lat, predicted_lon)
        """
        model_data = self.load_bbmm_model(species)
        if not model_data:
            # Simple linear extrapolation if no model
            if prev_lat is not None and prev_lon is not None:
                lat_diff = current_lat - prev_lat
                lon_diff = current_lon - prev_lon
                predicted_lat = current_lat + lat_diff
                predicted_lon = current_lon + lon_diff
            else:
                predicted_lat = current_lat
                predicted_lon = current_lon
            return predicted_lat, predicted_lon
        
        # Use Brownian Bridge to predict
        # For simplicity, we'll use a simple movement model
        sigma_squared = model_data.get('sigma_squared', 0.05)
        
        # If we have previous location, use velocity-based prediction
        if prev_lat is not None and prev_lon is not None:
            # Calculate velocity
            lat_diff = current_lat - prev_lat
            lon_diff = current_lon - prev_lon
            
            # Predict with some uncertainty (Brownian motion)
            # Convert sigma to degrees (approximate: 1 km ≈ 0.009 degrees)
            sigma_degrees = np.sqrt(sigma_squared) * 0.009
            noise_lat = np.random.normal(0, sigma_degrees) * np.sqrt(time_hours)
            noise_lon = np.random.normal(0, sigma_degrees) * np.sqrt(time_hours)
            
            predicted_lat = current_lat + lat_diff + noise_lat
            predicted_lon = current_lon + lon_diff + noise_lon
        else:
            # No previous location, just add small random movement
            sigma_degrees = np.sqrt(sigma_squared) * 0.009
            noise_lat = np.random.normal(0, sigma_degrees * time_hours)
            noise_lon = np.random.normal(0, sigma_degrees * time_hours)
            predicted_lat = current_lat + noise_lat
            predicted_lon = current_lon + noise_lon
        
        return predicted_lat, predicted_lon
    
    def predict_with_lstm(
        self,
        current_lat: float,
        current_lon: float,
        historical_data: Optional[pd.DataFrame],
        species: str,
        sequence_length: int = 10
    ) -> Tuple[float, float]:
        """
        Predict next location using LSTM model
        
        Args:
            current_lat: Current latitude
            current_lon: Current longitude
            historical_data: DataFrame with historical tracking data
            species: Species name
            sequence_length: LSTM sequence length
            
        Returns:
            Tuple of (predicted_lat, predicted_lon)
        """
        model_data = self.load_lstm_model(species)
        if not model_data or not model_data.get('model'):
            # Fallback to BBMM if LSTM not available
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
        
        model = model_data['model']
        scaler_x = model_data.get('scaler_x')
        scaler_y = model_data.get('scaler_y')
        
        # If we don't have enough historical data or scalers, fallback to BBMM
        if historical_data is None or len(historical_data) < sequence_length or not scaler_x or not scaler_y:
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
        
        try:
            # Prepare sequence from historical data
            # Get last sequence_length rows
            sequence_data = historical_data.tail(sequence_length).copy()
            
            # Extract features (adjust based on your LSTM model's expected features)
            feature_cols = ['lat', 'lon', 'speed_kmh', 'heading']
            available_cols = [col for col in feature_cols if col in sequence_data.columns]
            
            if len(available_cols) < 2:
                # Not enough features, fallback
                return self.predict_with_bbmm(current_lat, current_lon, None, None, species)
            
            # Create feature array
            X_seq = sequence_data[available_cols].values
            
            # Reshape for LSTM: (1, sequence_length, n_features)
            X_seq = X_seq.reshape(1, sequence_length, -1)
            
            # Scale features
            X_flat = X_seq.reshape(1, -1)
            X_scaled_flat = scaler_x.transform(X_flat)
            X_scaled = X_scaled_flat.reshape(X_seq.shape)
            
            # Predict
            if TENSORFLOW_AVAILABLE and hasattr(model, 'predict'):
                y_pred_scaled = model.predict(X_scaled, verbose=0)
            else:
                # For non-TensorFlow models
                y_pred_scaled = model.predict(X_scaled)
            
            # Inverse transform
            y_pred = scaler_y.inverse_transform(y_pred_scaled)
            
            # Extract lat, lon from prediction
            predicted_lat = float(y_pred[0][0]) if y_pred.shape[1] >= 1 else current_lat
            predicted_lon = float(y_pred[0][1]) if y_pred.shape[1] >= 2 else current_lon
            
            return predicted_lat, predicted_lon
            
        except Exception as e:
            logger.error(f"Error predicting with LSTM for {species}: {e}")
            # Fallback to BBMM
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)


# Global instance
_predictor = None

def get_predictor() -> MovementPredictor:
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = MovementPredictor()
    return _predictor

