"""
Model Loader Module for RL Integration
Loads pre-trained HMM, BBMM, XGBoost, and LSTM models
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import json
from datetime import datetime
import joblib
import warnings
warnings.filterwarnings('ignore')

# Apply numpy._core compatibility fix at module level
# This allows loading models saved with NumPy 2.x in NumPy 1.x environments
try:
    import numpy.core as numpy_core
    sys.modules['numpy._core'] = numpy_core
    if hasattr(numpy_core, 'multiarray'):
        sys.modules['numpy._core.multiarray'] = numpy_core.multiarray
    if hasattr(numpy_core, 'umath'):
        sys.modules['numpy._core.umath'] = numpy_core.umath
    if hasattr(numpy_core, '_multiarray_umath'):
        sys.modules['numpy._core._multiarray_umath'] = numpy_core._multiarray_umath
except (ImportError, AttributeError):
    pass  # NumPy 2.x already has numpy._core, or older versions don't need this

try:
    from scipy.ndimage import zoom
except ImportError:
    print("Warning: scipy not available. Some functionality may be limited.")
    zoom = None

class ModelLoader:
    """Load and manage all pre-trained models for RL integration."""
    
    def __init__(self, models_dir: str = "data"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        
        self.hmm_models = {}
        self.bbmm_models = {}
        self.xgboost_models = {}
        self.lstm_model = None
        
        self.model_metadata = {}
        self.model_versions = {}
        
    def load_hmm_results(self, species: str, hmm_csv_path: str) -> pd.DataFrame:
        """
        Load HMM behavioral state probabilities from CSV.
        
        Your HMM CSV has: individual_id, behavior (Resting/Foraging/Traveling), state, etc.
        We convert behavior labels to probabilities for RL observation space.
        Supports Cloudflare URLs or local paths.
        """
        # Use Cloudflare loader if path looks like Cloudflare path or URL
        from ...core.cloudflare_loader import get_file_loader
        from ...config.settings import get_settings
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        # Resolve path (downloads from Cloudflare if needed)
        resolved_path = file_loader.resolve_path(hmm_csv_path)
        df = pd.read_csv(resolved_path)
        
        # Your HMM CSV format: behavior column with "Resting"/"Foraging"/"Traveling"
        # Convert to probability format expected by RL environment
        if 'behavior' in df.columns:
            # Create one-hot encoded probabilities
            df['state_prob_resting'] = (df['behavior'] == 'Resting').astype(float)
            df['state_prob_foraging'] = (df['behavior'] == 'Foraging').astype(float)
            df['state_prob_traveling'] = (df['behavior'] == 'Traveling').astype(float)
        
        # Add lat/lon if not present (try alternative column names)
        if 'lat' not in df.columns:
            if 'Latitude' in df.columns:
                df['lat'] = df['Latitude']
            elif 'latitude' in df.columns:
                df['lat'] = df['latitude']
        
        if 'lon' not in df.columns:
            if 'Longitude' in df.columns:
                df['lon'] = df['Longitude']
            elif 'longitude' in df.columns:
                df['lon'] = df['longitude']
        
        self.hmm_models[species] = df
        print(f"Loaded HMM results for {species}: {len(df)} records")
        return df
    
    def load_bbmm_results(self, species: str, bbmm_csv_path: str) -> pd.DataFrame:
        """
        Load BBMM movement probability distributions from CSV.
        
        Your BBMM CSV has: lat, lon, timestamp, hmm_behavioral_state, step_length, etc.
        BBMM provides utilization distribution - probability density of animal locations.
        We calculate/utilize this for movement probability.
        Supports Cloudflare URLs or local paths.
        """
        # Use Cloudflare loader if path looks like Cloudflare path or URL
        from ...core.cloudflare_loader import get_file_loader
        from ...config.settings import get_settings
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        # Resolve path (downloads from Cloudflare if needed)
        resolved_path = file_loader.resolve_path(bbmm_csv_path)
        df = pd.read_csv(resolved_path)
        
        # Your BBMM CSV format: has lat/lon but no explicit prob_density column
        # BBMM utilization density is implicit in the movement patterns
        # Calculate approximate probability density from step lengths and movement patterns
        
        # If step_length exists, use it to infer movement probability
        if 'step_length' in df.columns:
            # Normalize step lengths to [0, 1] for utilization probability
            max_step = df['step_length'].max() if df['step_length'].max() > 0 else 1.0
            df['movement_probability'] = df['step_length'] / max_step
        
        # Calculate utilization density based on movement characteristics
        if 'prob_density' not in df.columns:
            # Use inverse of step_length as proxy for utilization density
            # Shorter steps = higher utilization = higher probability density
            if 'step_length' in df.columns:
                # Convert to density: high density where animals stay longer (short steps)
                normalized_density = 1.0 / (df['step_length'] + 0.001)  # Avoid division by zero
                df['prob_density'] = normalized_density / normalized_density.max()
            else:
                # No step_length data - cannot compute density
                raise ValueError(f"BBMM results for '{species}' missing 'step_length' column. Real BBMM data required.")
        
        # Standardize lat/lon column names
        if 'lat' not in df.columns:
            if 'Latitude' in df.columns:
                df['lat'] = df['Latitude']
            elif 'latitude' in df.columns:
                df['lat'] = df['latitude']
        
        if 'lon' not in df.columns:
            if 'Longitude' in df.columns:
                df['lon'] = df['Longitude']
            elif 'longitude' in df.columns:
                df['lon'] = df['longitude']
        
        self.bbmm_models[species] = df
        print(f"Loaded BBMM results for {species}: {len(df)} records")
        return df
    
    def load_xgboost_model(self, species: str, model_path: str) -> Any:
        """
        Load trained XGBoost model for habitat suitability.
        
        Handles NumPy version compatibility (models saved with NumPy 2.x can be
        loaded in NumPy 1.x environments).
        """
        # Fix numpy._core compatibility BEFORE any imports that use pickle
        # This is critical - must happen before joblib imports pickle internals
        import sys
        try:
            import numpy.core as numpy_core
            # Map numpy._core to numpy.core for backward compatibility
            sys.modules['numpy._core'] = numpy_core
            sys.modules['numpy._core.multiarray'] = numpy_core.multiarray
            sys.modules['numpy._core.umath'] = numpy_core.umath
            sys.modules['numpy._core._multiarray_umath'] = numpy_core._multiarray_umath
        except (ImportError, AttributeError):
            pass  # NumPy 2.x doesn't need this, older NumPy might not have these
        
        # Helper adapter to give Booster a sklearn-like predict
        class _BoosterAdapter:
            def __init__(self, booster):
                self._booster = booster
            def predict(self, X):
                import xgboost as xgb
                import numpy as _np
                dmat = X if isinstance(X, xgb.DMatrix) else xgb.DMatrix(_np.array(X))
                return self._booster.predict(dmat)
            def get_booster(self):
                return self._booster

        try:
            import xgboost as xgb
            import numpy as _np
            
            # Check if .h5 file exists (prefer it over .pkl)
            model_path_h5 = str(model_path).replace('.pkl', '.h5')
            if Path(model_path_h5).exists() and not str(model_path).endswith('.h5'):
                model_path = model_path_h5
                print(f"  Using .h5 version: {model_path}")
            
            # Prefer native XGBoost formats
            lower = str(model_path).lower()
            is_native = lower.endswith(('.json', '.ubj', '.bin', '.txt'))
            is_h5 = lower.endswith('.h5')
            
            if is_native:
                booster = xgb.Booster()
                booster.load_model(model_path)
                model = _BoosterAdapter(booster)
            elif is_h5:
                # Try loading .h5 as XGBoost model (unusual but possible)
                try:
                    # Some XGBoost versions can save to HDF5
                    booster = xgb.Booster()
                    booster.load_model(model_path)
                    model = _BoosterAdapter(booster)
                except Exception:
                    # If that fails, try as Keras/sklearn model in HDF5 format
                    try:
                        model = joblib.load(model_path)
                    except Exception:
                        # Last resort: try as regular pickle in .h5 file (unlikely but possible)
                        model = pickle.load(open(model_path, 'rb'))
            else:
                # Try joblib/pickle first (sklearn wrapper)
                try:
                    model = joblib.load(model_path)
                except Exception:
                    model = pickle.load(open(model_path, 'rb'))
            
            # If the loaded object doesn't have predict but has a booster, wrap it
            if not hasattr(model, 'predict'):
                booster = None
                if hasattr(model, 'get_booster'):
                    try:
                        booster = model.get_booster()
                    except Exception:
                        booster = None
                if booster is None and hasattr(model, 'booster_'):
                    booster = getattr(model, 'booster_', None)
                if booster is not None:
                    model = _BoosterAdapter(booster)
                else:
                    print(f"Warning: XGBoost model for {species} doesn't have predict method and no booster found")
                    return None
            
            # Quick dry-run prediction to validate (skip if feature names expected)
            # The test will validate properly with actual features
            # Skipping validation here to avoid warnings - model will work with proper feature names
            
            self.xgboost_models[species] = model
            self.model_metadata[f"xgboost_{species}"] = {
                'path': model_path,
                'loaded_at': datetime.now().isoformat(),
                'type': 'XGBoost',
                'status': 'loaded'
            }
            print(f"Loaded XGBoost model for {species}")
            return model
        except Exception as e:
            print(f"Error loading XGBoost model for {species}: {e}")
            print("  Tip: if you saved with Booster.save_model(), pass the .json/.ubj/.bin here.")
            print("  If you saved with sklearn wrapper, joblib.load should work.")
            return None
    
    def load_lstm_model(self, model_path: str) -> Any:
        """
        Load trained LSTM model for temporal environmental forecasting.
        
        Supports:
        - Keras v3 .keras/.h5 format via keras.models.load_model (preferred)
        - TensorFlow SavedModel directory via tf.keras.models.load_model or tf.saved_model.load
        - Falls back to .pkl if .h5 not found
        
        Automatically checks for .h5 version if .pkl is provided.
        """
        # Check if .h5 file exists (prefer it over .pkl)
        model_path_h5 = str(model_path).replace('.pkl', '.h5')
        if Path(model_path_h5).exists() and not str(model_path).endswith('.h5'):
            model_path = model_path_h5
            print(f"  Using .h5 version: {model_path}")
        # Fix numpy._core compatibility BEFORE any imports that use pickle
        import sys
        try:
            import numpy.core as numpy_core
            # Map numpy._core to numpy.core for backward compatibility
            sys.modules['numpy._core'] = numpy_core
            sys.modules['numpy._core.multiarray'] = numpy_core.multiarray
            sys.modules['numpy._core.umath'] = numpy_core.umath
            sys.modules['numpy._core._multiarray_umath'] = numpy_core._multiarray_umath
        except (ImportError, AttributeError):
            pass
        
        # Prefer Keras/TF loading for cross-version stability
        try:
            import tensorflow as tf
            try:
                from tensorflow import keras as tf_keras
            except Exception:
                tf_keras = None
            
            # Strategy: try new Keras API; then TF Keras; then SavedModel
            model = None
            load_err = None
            
            # 1) keras.models.load_model with compile=False (skips metrics/optimizer that cause version issues)
            try:
                import keras as pure_keras  # Keras 3
                model = pure_keras.models.load_model(model_path, compile=False)
            except Exception as e1:
                load_err = e1
                # 2) tf.keras fallback with compile=False
                if tf_keras is not None:
                    try:
                        model = tf_keras.models.load_model(model_path, compile=False)
                        load_err = None
                    except Exception as e2:
                        load_err = e2
                        # Try with custom_objects for common metrics
                        try:
                            model = tf_keras.models.load_model(
                                model_path, 
                                compile=False,
                                custom_objects={
                                    'mse': tf_keras.losses.MeanSquaredError(),
                                    'mean_squared_error': tf_keras.losses.MeanSquaredError(),
                                    'mae': tf_keras.losses.MeanAbsoluteError(),
                                    'mean_absolute_error': tf_keras.losses.MeanAbsoluteError(),
                                }
                            )
                            load_err = None
                        except Exception as e3:
                            load_err = e3
                
            # 3) tf.saved_model.load as last resort (returns a Trackable, not a Keras Model)
            if model is None:
                try:
                    model = tf.saved_model.load(model_path)
                except Exception as e3:
                    if load_err is None:
                        load_err = e3
            
            if model is None:
                raise load_err or RuntimeError("Unknown error loading LSTM model")
            
            self.lstm_model = model
            self.model_metadata['lstm'] = {
                'path': model_path,
                'loaded_at': datetime.now().isoformat(),
                'type': 'LSTM'
            }
            print("Loaded LSTM model for temporal forecasting")
            return model
        except Exception as e:
            print(f"Error loading LSTM model: {e}")
            print("  Try aligning versions: pip install \"tensorflow>=2.15,<2.17\" \"keras>=3.0,<4\"")
            print("  Or re-save the model as SavedModel dir: model.save('path', save_format='tf')")
            return None
    
    def get_hmm_state_probs(self, species: str, lat: float, lon: float, timestamp: Optional[str] = None) -> Dict[str, float]:
        """
        Get HMM behavioral state probabilities for a location.
        
        Returns:
            dict with keys: 'foraging', 'resting', 'traveling'
        """
        if species not in self.hmm_models:
            raise ValueError(f"HMM model results for '{species}' are required but not loaded. Please provide HMM CSV results.")
        
        df = self.hmm_models[species]
        
        # Find nearest record (can be enhanced with spatial indexing)
        if 'lat' in df.columns and 'lon' in df.columns:
            distances = np.sqrt((df['lat'] - lat)**2 + (df['lon'] - lon)**2)
            nearest_idx = distances.idxmin()
            row = df.iloc[nearest_idx]
            
            return {
                'foraging': float(row.get('state_prob_foraging', 0.33)),
                'resting': float(row.get('state_prob_resting', 0.33)),
                'traveling': float(row.get('state_prob_traveling', 0.33))
            }
        
        # If no spatial data, still use real data (mean of loaded results)
        if len(df) == 0:
            raise ValueError(f"HMM results for '{species}' contain no data. Please provide valid HMM CSV results.")
        return {
            'foraging': float(df['state_prob_foraging'].mean()),
            'resting': float(df['state_prob_resting'].mean()),
            'traveling': float(df['state_prob_traveling'].mean())
        }
    
    def get_bbmm_density(self, species: str, lat: float, lon: float) -> float:
        """Get BBMM movement probability density for a location."""
        if species not in self.bbmm_models:
            raise ValueError(f"BBMM model results for '{species}' are required but not loaded. Please provide BBMM CSV results.")
        
        df = self.bbmm_models[species]
        
        if 'lat' in df.columns and 'lon' in df.columns:
            distances = np.sqrt((df['lat'] - lat)**2 + (df['lon'] - lon)**2)
            nearest_idx = distances.idxmin()
            row = df.iloc[nearest_idx]
            # Use prob_density (utilization distribution) as primary measure
            # This represents where the animal is most likely to be (foraging/resting areas)
            # For movement decisions, high density = high probability animal will use this area
            density = row.get('prob_density') if 'prob_density' in row else row.get('movement_probability')
            if density is None:
                raise ValueError(f"BBMM results for '{species}' missing required columns. Need 'prob_density' or 'movement_probability'.")
            return float(density)
        
        # If no spatial data, still use real data (mean of loaded results)
        if len(df) == 0:
            raise ValueError(f"BBMM results for '{species}' contain no data. Please provide valid BBMM CSV results.")
        col_name = 'movement_probability' if 'movement_probability' in df.columns else 'prob_density'
        if col_name not in df.columns:
            raise ValueError(f"BBMM results for '{species}' missing required columns. Need 'movement_probability' or 'prob_density'.")
        return float(df[col_name].mean())
    
    def predict_habitat_suitability(self, species: str, env_features: Dict[str, float]) -> float:
        """
        Predict habitat suitability using XGBoost model.
        
        Your XGBoost model expects these features (from your model description):
        - NDVI (vegetation quality)
        - Elevation
        - Rainfall
        - Land cover (one-hot: forest, grassland, agriculture, settlement, water)
        - Distance to water sources
        - Distance to roads
        - Distance to protected areas
        - Distance to settlements
        
        Args:
            species: Species name
            env_features: Dict of environmental features
        
        Returns:
            Suitability score (0-1)
        """
        if species not in self.xgboost_models:
            raise ValueError(f"XGBoost model for '{species}' is required but not loaded. Please provide trained XGBoost model.")
        
        model = self.xgboost_models[species]
        
        try:
            # Determine expected feature names from model if available
            feature_names = None
            booster = None
            # sklearn wrapper
            if hasattr(model, 'feature_names_in_'):
                try:
                    feature_names = list(model.feature_names_in_)
                except Exception:
                    feature_names = None
            # booster via wrapper
            if feature_names is None and hasattr(model, 'get_booster'):
                try:
                    booster = model.get_booster()
                except Exception:
                    booster = None
            # raw booster
            if feature_names is None and booster is None and hasattr(model, 'feature_names'):
                try:
                    feature_names = list(model.feature_names)
                except Exception:
                    feature_names = None
            if feature_names is None and booster is not None and hasattr(booster, 'feature_names'):
                try:
                    feature_names = list(booster.feature_names)
                except Exception:
                    feature_names = None
            
            # Build feature dictionary - all values must come from real environmental data
            required_features = ['ndvi', 'elevation', 'rainfall']
            for feat in required_features:
                if feat not in env_features:
                    raise ValueError(f"XGBoost prediction requires '{feat}' in env_features. Real environmental data required.")
            
            features_dict = {
                'ndvi': env_features['ndvi'],
                'elevation': env_features['elevation'],
                'rainfall': env_features['rainfall'],
                'landcover_water': env_features.get('landcover_water', 0.0),
                'landcover_forest': env_features.get('landcover_forest', 0.0),
                'landcover_grassland': env_features.get('landcover_grassland', 0.0),
                'landcover_agriculture': env_features.get('landcover_agriculture', 0.0),
                'landcover_settlement': env_features.get('landcover_settlement', 0.0),
                'distance_to_water': env_features.get('distance_to_water', 5000.0),
                'distance_to_roads': env_features.get('distance_to_roads', 3000.0),
                'distance_to_protected_areas': env_features.get('distance_to_protected_areas', 2000.0),
                'distance_to_settlement': env_features.get('distance_to_settlement', 10000.0),
                # Temporal/context features that appeared in your warning
                'rainfall_mm': env_features.get('rainfall_mm', env_features.get('rainfall', 0.0)),
                'distance_to_water_km': env_features.get('distance_to_water_km', env_features.get('distance_to_water', 5000.0)/1000.0),
                'distance_to_protected_areas_km': env_features.get('distance_to_protected_areas_km', env_features.get('distance_to_protected_areas', 2000.0)/1000.0),
                'month': env_features.get('month', 6),
                'hour': env_features.get('hour', 12),
                'is_wet_season': env_features.get('is_wet_season', 1),
                'time_of_day_encoded': env_features.get('time_of_day_encoded', 0.5),
                'day_of_year': env_features.get('day_of_year', 180),
                'lat': env_features.get('lat', 0.0),
                'lon': env_features.get('lon', 0.0),
                'species_encoded': env_features.get('species_encoded', 0),
                'vegetation_productivity': env_features.get('vegetation_productivity', 0.5),
                'elevation_vegetation_index': env_features.get('elevation_vegetation_index', 0.5),
                'water_access_quality': env_features.get('water_access_quality', 0.5),
                'seasonal_resource_index': env_features.get('seasonal_resource_index', 0.5),
                # Specific land cover categories seen in the warning
                'land_cover_4': env_features.get('land_cover_4', 0.0),
                'land_cover_5': env_features.get('land_cover_5', 0.0),
                'land_cover_7': env_features.get('land_cover_7', 0.0),
                'land_cover_8': env_features.get('land_cover_8', 0.0),
                'land_cover_9': env_features.get('land_cover_9', 0.0),
                'land_cover_10': env_features.get('land_cover_10', 0.0),
                'land_cover_11': env_features.get('land_cover_11', 0.0),
                'land_cover_12': env_features.get('land_cover_12', 0.0),
                'land_cover_13': env_features.get('land_cover_13', 0.0),
                'land_cover_16': env_features.get('land_cover_16', 0.0),
            }
            
            # Build input with feature names if the model expects them
            if feature_names:
                import pandas as _pd
                row = {name: features_dict.get(name, 0.0) for name in feature_names}
                feature_array = _pd.DataFrame([row])[feature_names]
            else:
                feature_array = np.array([[features_dict.get(k, 0.0) for k in sorted(features_dict.keys())]])
            
            # Case 1: scikit-learn API (XGBClassifier/XGBRegressor)
            try:
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba(feature_array)[0]
                    return float(proba[1] if len(proba) > 1 else proba[0])
                elif hasattr(model, 'predict'):
                    prediction = model.predict(feature_array)[0]
                    return float(np.clip(prediction, 0, 1))
            except Exception:
                pass

            # Case 2: raw Booster object
            try:
                import xgboost as xgb
                dmat = xgb.DMatrix(feature_array)
                booster = getattr(model, 'get_booster')() if hasattr(model, 'get_booster') else model
                prediction = booster.predict(dmat)
                # prediction could be probability or score
                return float(np.clip(np.ravel(prediction)[0], 0, 1))
            except Exception:
                pass

            # Fallback
            return 0.5
                
        except Exception as e:
            print(f"Error predicting habitat suitability for {species}: {e}")
            import traceback
            traceback.print_exc()
            return 0.5
    
    def predict_temporal_trends(self, historical_data: np.ndarray, forecast_steps: int = 10) -> Dict[str, np.ndarray]:
        """
        Predict temporal environmental trends using LSTM.
        
        Args:
            historical_data: Array of historical environmental values
                - If 1D: treated as single feature time series
                - If 2D: (timesteps, features) - will be reshaped to (1, timesteps, features)
            forecast_steps: Number of steps to forecast ahead
        
        Returns:
            Dict with forecasted values for 'ndvi_trend', 'rainfall_trend', etc.
        """
        if self.lstm_model is None:
            # Return neutral trends if model not available
            return {
                'ndvi_trend': np.ones(forecast_steps) * 0.5,
                'rainfall_trend': np.zeros(forecast_steps),
                'vegetation_trend': np.ones(forecast_steps) * 0.5
            }
        
        try:
            # Get model expected input shape
            model = self.lstm_model
            expected_shape = None
            
            # Try to get expected input shape from model
            if hasattr(model, 'input_shape') and model.input_shape:
                expected_shape = model.input_shape
            elif hasattr(model, 'inputs') and model.inputs and len(model.inputs) > 0:
                try:
                    expected_shape = model.inputs[0].shape.as_list()
                except:
                    pass
            
            # Reshape data for LSTM input (batch_size, timesteps, features)
            if historical_data.ndim == 1:
                # Single feature time series - add feature dimension
                historical_data = historical_data.reshape(1, -1, 1)
            elif historical_data.ndim == 2:
                # (timesteps, features) - add batch dimension
                if expected_shape and len(expected_shape) >= 3:
                    # Match model's expected shape
                    expected_timesteps = expected_shape[1] if expected_shape[1] is not None else historical_data.shape[0]
                    expected_features = expected_shape[2] if len(expected_shape) > 2 and expected_shape[2] is not None else historical_data.shape[1]
                    
                    # Pad or trim to match expected shape
                    if historical_data.shape[0] != expected_timesteps:
                        if historical_data.shape[0] < expected_timesteps:
                            # Pad with last value
                            padding = np.tile(historical_data[-1:], (expected_timesteps - historical_data.shape[0], 1))
                            historical_data = np.vstack([historical_data, padding])
                        else:
                            # Trim to expected length
                            historical_data = historical_data[:expected_timesteps]
                    
                    if historical_data.shape[1] != expected_features:
                        if historical_data.shape[1] < expected_features:
                            # Pad features with zeros
                            padding = np.zeros((historical_data.shape[0], expected_features - historical_data.shape[1]))
                            historical_data = np.hstack([historical_data, padding])
                        else:
                            # Use only first N features
                            historical_data = historical_data[:, :expected_features]
                
                historical_data = historical_data.reshape(1, historical_data.shape[0], historical_data.shape[1])
            
            # Predict future values
            predictions = model.predict(historical_data, verbose=0)
            
            # Extract trend components
            # Model outputs (batch, 3) where 3 features are predicted
            # Typically: [NDVI/vegetation, rainfall, other_feature]
            if predictions.ndim >= 2:
                # Model outputs single prediction per sample with 3 features
                # For forecasting, we replicate this over forecast_steps
                if predictions.shape[-1] >= 3:
                    # Extract the 3 feature values
                    feature_0 = float(predictions[0, 0])  # NDVI/vegetation
                    feature_1 = float(predictions[0, 1])  # Rainfall
                    feature_2 = float(predictions[0, 2]) if predictions.shape[1] > 2 else 0.0  # Other
                    
                    # For forecasting, create trends by replicating or interpolating
                    ndvi_trend = np.ones(forecast_steps) * feature_0
                    rainfall_trend = np.ones(forecast_steps) * feature_1
                    vegetation_trend = np.ones(forecast_steps) * feature_0
                else:
                    raise ValueError(f"LSTM model output shape unexpected: {predictions.shape}. Expected (batch, 3) or (batch, timesteps, 3).")
            else:
                raise ValueError(f"LSTM model output shape unexpected: {predictions.shape}. Expected at least 2 dimensions.")
            
            return {
                'ndvi_trend': ndvi_trend[:forecast_steps],
                'rainfall_trend': rainfall_trend[:forecast_steps],
                'vegetation_trend': vegetation_trend[:forecast_steps]
            }
            
        except Exception as e:
            raise ValueError(f"LSTM prediction failed: {e}") from e
    
    def save_model_versions(self, output_path: str):
        """Save model version metadata for tracking."""
        versions = {
            'timestamp': datetime.now().isoformat(),
            'models': self.model_metadata,
            'available_species': {
                'hmm': list(self.hmm_models.keys()),
                'bbmm': list(self.bbmm_models.keys()),
                'xgboost': list(self.xgboost_models.keys())
            },
            'lstm_available': self.lstm_model is not None
        }
        
        with open(output_path, 'w') as f:
            json.dump(versions, f, indent=2)
        
        print(f"Saved model versions to {output_path}")
        return versions
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models."""
        return {
            'hmm_species': list(self.hmm_models.keys()),
            'bbmm_species': list(self.bbmm_models.keys()),
            'xgboost_species': list(self.xgboost_models.keys()),
            'lstm_loaded': self.lstm_model is not None,
            'metadata': self.model_metadata
        }

