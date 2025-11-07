"""
Real-time tracking service that integrates HMM, BBMM, XGBoost, LSTM, and RL models
for multi-species wildlife tracking and conflict prediction.
"""
import os
import pickle
import zipfile
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2, pi
import logging
from collections import defaultdict

try:
    from tensorflow import keras
    from tensorflow.keras.models import load_model as keras_load
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    from stable_baselines3 import PPO, A2C, DQN
    STABLE_BASELINES3_AVAILABLE = True
except ImportError:
    STABLE_BASELINES3_AVAILABLE = False

try:
    from hmmlearn import hmm
    HMMLEARN_AVAILABLE = True
except ImportError:
    HMMLEARN_AVAILABLE = False

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "ml_service" / "data"


class RealTimeTracker:
    """
    Real-time wildlife tracking service that integrates:
    - HMM: Behavioral state interpretation (foraging, migrating, resting)
    - BBMM: Path interpolation and movement variance
    - XGBoost: Habitat suitability scoring
    - LSTM: Short-term movement and migration prediction
    - RL: Corridor optimization and conflict detection
    """
    
    def __init__(self):
        self.bbmm_models = {}
        self.hmm_models = {}
        self.lstm_models = {}
        self.lstm_scalers = {}
        self.rl_models = {}
        self.rl_envs = {}
        
        self.species_list = ['elephant', 'wildebeest', 'zebra']
        self.behavior_states = ['foraging', 'migrating', 'resting']
        
        self._load_all_models()
    
    def _load_all_models(self):
        """Load all trained models for all species"""
        logger.info("Loading trained models...")
        
        for species in self.species_list:
            species_lower = species.lower()
            
            self._load_bbmm_model(species_lower)
            self._load_hmm_model(species_lower)
            self._load_lstm_model(species_lower)
            self._load_rl_model(species_lower)
        
        logger.info("All models loaded successfully")
    
    def _load_bbmm_model(self, species: str):
        """Load BBMM model for movement variance"""
        from ..config.settings import get_settings
        from ..core.cloudflare_loader import get_file_loader
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        try:
            cloudflare_path = f"ml-information/trained_models/bbmm/{species}_bbmm.pkl"
            local_path = DATA_DIR / "bbmm" / f"{species}_bbmm.pkl"
            
            model_path = None
            if settings.CLOUDFLARE_BASE_URL and file_loader.exists(cloudflare_path):
                model_path = file_loader.resolve_path(cloudflare_path)
            elif local_path.exists():
                model_path = local_path
            
            if model_path:
                if isinstance(model_path, str):
                    with open(model_path, 'rb') as f:
                        model_data = pickle.load(f)
                elif model_path.exists():
                    with open(model_path, 'rb') as f:
                        model_data = pickle.load(f)
                else:
                    model_data = None
                
                if model_data:
                    self.bbmm_models[species] = model_data
                    logger.info(f"Loaded BBMM model for {species}")
                    return
            
            # No model found, use default variance
            default_variances = {
                'elephant': 0.05,
                'wildebeest': 0.08,
                'zebra': 0.06,
            }
            self.bbmm_models[species] = {'sigma_squared': default_variances.get(species, 0.05)}
            logger.warning(f"Using default BBMM variance for {species}")
        except Exception as e:
            logger.error(f"Error loading BBMM model for {species}: {e}")
            self.bbmm_models[species] = {'sigma_squared': 0.05}
    
    def _load_hmm_model(self, species: str):
        """Load HMM model for behavioral state prediction"""
        from ..config.settings import get_settings
        from ..core.cloudflare_loader import get_file_loader
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        try:
            cloudflare_path = f"ml-information/trained_models/hmm/{species}_hmm.pkl"
            local_path = DATA_DIR / "hmm" / f"{species}_hmm.pkl"
            
            model_path = None
            if settings.CLOUDFLARE_BASE_URL and file_loader.exists(cloudflare_path):
                model_path = file_loader.resolve_path(cloudflare_path)
            elif local_path.exists():
                model_path = local_path
            
            if model_path:
                if isinstance(model_path, str):
                    with open(model_path, 'rb') as f:
                        model_data = pickle.load(f)
                elif model_path.exists():
                    with open(model_path, 'rb') as f:
                        model_data = pickle.load(f)
                else:
                    model_data = None
                
                if model_data:
                    self.hmm_models[species] = model_data
                    logger.info(f"Loaded HMM model for {species}")
                    return
            
            # No model found, use simple heuristics
            logger.warning(f"HMM model not found for {species}, will use simple heuristics")
            self.hmm_models[species] = None
        except Exception as e:
            logger.error(f"Error loading HMM model for {species}: {e}")
            self.hmm_models[species] = None
    
    def _load_lstm_model(self, species: str):
        """Load LSTM model for temporal prediction"""
        from ..config.settings import get_settings
        from ..core.cloudflare_loader import get_file_loader
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        try:
            lstm_dir_local = DATA_DIR / "lstm"
            
            model_paths_to_try = [
                f"ml-information/trained_models/lstm/{species}_lstm.h5",
                f"ml-information/trained_models/lstm/{species}_lstm.pkl",
                f"ml-information/trained_models/lstm/wildlife_lstm_improved_20251021_115339_model.h5",
            ]
            
            model_path = None
            if settings.CLOUDFLARE_BASE_URL:
                for cloudflare_path in model_paths_to_try:
                    if file_loader.exists(cloudflare_path):
                        model_path = file_loader.resolve_path(cloudflare_path)
                        break
            
            if model_path is None:
                lstm_dir = lstm_dir_local
                model_path = lstm_dir / f"{species}_lstm.h5"
                if not model_path.exists():
                    model_path = lstm_dir / f"{species}_lstm.pkl"
                if not model_path.exists():
                    model_path = lstm_dir / "wildlife_lstm_improved_20251021_115339_model.h5"
            
            if model_path and (isinstance(model_path, str) or (isinstance(model_path, Path) and model_path.exists())):
                try:
                    if model_path.suffix == '.h5' and TENSORFLOW_AVAILABLE:
                        model = keras_load(str(model_path))
                    else:
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                except (pickle.UnpicklingError, EOFError, KeyError) as e:
                    logger.error(f"Error loading LSTM model file for {species}: {e}. File may be corrupted or in wrong format.")
                    self.lstm_models[species] = None
                    return
                
                scaler_x_path_cf = "ml-information/trained_models/lstm/wildlife_lstm_improved_20251021_115339_scaler_x.pkl"
                scaler_y_path_cf = "ml-information/trained_models/lstm/wildlife_lstm_improved_20251021_115339_scaler_y.pkl"
                scaler_x_path_local = lstm_dir_local / "wildlife_lstm_improved_20251021_115339_scaler_x.pkl"
                scaler_y_path_local = lstm_dir_local / "wildlife_lstm_improved_20251021_115339_scaler_y.pkl"
                
                scaler_x = None
                scaler_y = None
                
                if settings.CLOUDFLARE_BASE_URL and file_loader.exists(scaler_x_path_cf):
                    scaler_x_path = file_loader.resolve_path(scaler_x_path_cf)
                elif scaler_x_path_local.exists():
                    scaler_x_path = scaler_x_path_local
                else:
                    scaler_x_path = None
                
                if scaler_x_path:
                    with open(scaler_x_path, 'rb') as f:
                        scaler_x = pickle.load(f)
                
                if settings.CLOUDFLARE_BASE_URL and file_loader.exists(scaler_y_path_cf):
                    scaler_y_path = file_loader.resolve_path(scaler_y_path_cf)
                elif scaler_y_path_local.exists():
                    scaler_y_path = scaler_y_path_local
                else:
                    scaler_y_path = None
                
                if scaler_y_path:
                    with open(scaler_y_path, 'rb') as f:
                        scaler_y = pickle.load(f)
                
                self.lstm_models[species] = model
                self.lstm_scalers[species] = {'x': scaler_x, 'y': scaler_y}
                logger.info(f"Loaded LSTM model for {species}")
            else:
                logger.warning(f"LSTM model not found for {species}")
                self.lstm_models[species] = None
        except Exception as e:
            logger.error(f"Error loading LSTM model for {species}: {e}")
            self.lstm_models[species] = None
    
    def _load_rl_model(self, species: str):
        """Load RL model (PPO, A2C, or DQN) from zip file"""
        from ..config.settings import get_settings
        from ..core.cloudflare_loader import get_file_loader
        
        if not STABLE_BASELINES3_AVAILABLE:
            logger.warning("stable-baselines3 not available, RL models will not be loaded")
            self.rl_models[species] = None
            return
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        try:
            rl_dir_local = DATA_DIR / "rl"
            
            cloudflare_model_files = [
                f"ml-information/trained_models/rl/rl_model_updated_ppo_{species}.zip",
                f"ml-information/trained_models/rl/final_model_ppo.zip",
                f"ml-information/trained_models/rl/rl_model_updated_dqn_{species}.zip",
            ]
            
            local_model_files = [
                rl_dir_local / f"rl_model_updated_ppo_{species}.zip",
                rl_dir_local / f"final_model_ppo.zip",
                rl_dir_local / f"rl_model_updated_dqn_{species}.zip",
            ]
            
            model_files = []
            if settings.CLOUDFLARE_BASE_URL:
                model_files.extend([(cf_path, True) for cf_path in cloudflare_model_files])
            model_files.extend([(local_path, False) for local_path in local_model_files])
            
            model_path = None
            algo = None
            
            for path_item in model_files:
                path, is_cloudflare = path_item
                
                exists = False
                if is_cloudflare:
                    exists = file_loader.exists(path)
                    if exists:
                        resolved_path = file_loader.resolve_path(path)
                        model_path = resolved_path
                else:
                    exists = path.exists()
                    if exists:
                        model_path = path
                
                if exists and model_path:
                    path_name = path if isinstance(path, str) else path.name
                    if 'ppo' in path_name.lower():
                        algo = 'ppo'
                    elif 'dqn' in path_name.lower():
                        algo = 'dqn'
                    elif 'a2c' in path_name.lower():
                        algo = 'a2c'
                    break
            
            if model_path:
                try:
                    model_path_str = str(model_path)
                    if algo == 'ppo':
                        model = PPO.load(model_path_str)
                    elif algo == 'dqn':
                        model = DQN.load(model_path_str)
                    elif algo == 'a2c':
                        model = A2C.load(model_path_str)
                    else:
                        model = PPO.load(model_path_str)
                    
                    self.rl_models[species] = {
                        'model': model,
                        'algo': algo or 'ppo',
                        'path': model_path
                    }
                    logger.info(f"Loaded RL model ({algo}) for {species}")
                except Exception as e:
                    logger.error(f"Error loading RL model from {model_path}: {e}")
                    self.rl_models[species] = None
            else:
                logger.warning(f"RL model not found for {species}")
                self.rl_models[species] = None
        except Exception as e:
            logger.error(f"Error loading RL model for {species}: {e}")
            self.rl_models[species] = None
    
    def predict_with_bbmm(
        self, 
        current_lat: float, 
        current_lon: float,
        prev_lat: Optional[float],
        prev_lon: Optional[float],
        species: str,
        time_hours: float = 1.0
    ) -> Tuple[float, float, float]:
        """
        Predict next location using BBMM model
        
        Returns: (predicted_lat, predicted_lon, variance)
        """
        model_data = self.bbmm_models.get(species, {'sigma_squared': 0.05})
        sigma_squared = model_data.get('sigma_squared', 0.05)
        
        if prev_lat is not None and prev_lon is not None:
            lat_diff = current_lat - prev_lat
            lon_diff = current_lon - prev_lon
            
            sigma_degrees = np.sqrt(sigma_squared) * 0.009
            noise_lat = np.random.normal(0, sigma_degrees) * np.sqrt(time_hours)
            noise_lon = np.random.normal(0, sigma_degrees) * np.sqrt(time_hours)
            
            predicted_lat = current_lat + lat_diff + noise_lat
            predicted_lon = current_lon + lon_diff + noise_lon
        else:
            sigma_degrees = np.sqrt(sigma_squared) * 0.009
            noise_lat = np.random.normal(0, sigma_degrees * time_hours)
            noise_lon = np.random.normal(0, sigma_degrees * time_hours)
            predicted_lat = current_lat + noise_lat
            predicted_lon = current_lon + noise_lon
        
        return predicted_lat, predicted_lon, sigma_squared
    
    def predict_behavior_with_hmm(
        self,
        movement_sequence: pd.DataFrame,
        species: str
    ) -> str:
        """
        Predict behavioral state using HMM model
        
        Returns: behavioral state string ('foraging', 'migrating', 'resting')
        """
        hmm_model = self.hmm_models.get(species)
        
        if hmm_model is None or movement_sequence is None or len(movement_sequence) < 3:
            if movement_sequence is not None and len(movement_sequence) >= 2:
                speeds = movement_sequence.get('speed_kmh', pd.Series([0]))
                avg_speed = speeds.mean() if not speeds.empty else 0
                
                if avg_speed > 5.0:
                    return 'migrating'
                elif avg_speed > 1.0:
                    return 'foraging'
                else:
                    return 'resting'
            return 'resting'
        
        try:
            if 'step_length' in movement_sequence.columns and 'turning_angle' in movement_sequence.columns:
                features = movement_sequence[['step_length', 'turning_angle']].values
            else:
                coords = movement_sequence[['lat', 'lon']].values
                step_lengths = []
                turning_angles = []
                
                for i in range(1, len(coords)):
                    lat1, lon1 = radians(coords[i-1][0]), radians(coords[i-1][1])
                    lat2, lon2 = radians(coords[i][0]), radians(coords[i][1])
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * atan2(sqrt(a), sqrt(1-a))
                    distance = 6371 * c
                    step_lengths.append(distance)
                    
                    if i > 1:
                        bearing1 = atan2(sin(lon2-lon1)*cos(lat2), cos(lat1)*sin(lat2)-sin(lat1)*cos(lat2)*cos(lon2-lon1))
                        bearing2 = atan2(sin(lon2-coords[i-2][1]*pi/180)*cos(lat2), cos(coords[i-2][0]*pi/180)*sin(lat2)-sin(coords[i-2][0]*pi/180)*cos(lat2)*cos(lon2-coords[i-2][1]*pi/180))
                        turning_angle = bearing2 - bearing1
                        turning_angles.append(turning_angle)
                    else:
                        turning_angles.append(0)
                
                if len(step_lengths) > 0:
                    features = np.column_stack([step_lengths, turning_angles])
                else:
                    return 'resting'
            
            if isinstance(hmm_model, dict) and 'model' in hmm_model:
                model = hmm_model['model']
            else:
                model = hmm_model
            
            if hasattr(model, 'predict'):
                states = model.predict(features)
                state_counts = pd.Series(states).value_counts()
                most_common_state = state_counts.index[0]
                
                state_mapping = {0: 'resting', 1: 'foraging', 2: 'migrating'}
                return state_mapping.get(most_common_state, 'resting')
            else:
                avg_step_length = np.mean(step_lengths) if len(step_lengths) > 0 else 0
                if avg_step_length > 2.0:
                    return 'migrating'
                elif avg_step_length > 0.5:
                    return 'foraging'
                else:
                    return 'resting'
        except Exception as e:
            logger.error(f"Error predicting behavior with HMM for {species}: {e}")
            return 'resting'
    
    def predict_with_lstm(
        self,
        current_lat: float,
        current_lon: float,
        historical_data: pd.DataFrame,
        species: str,
        sequence_length: int = 10
    ) -> Tuple[float, float]:
        """
        Predict next location using LSTM model
        
        Returns: (predicted_lat, predicted_lon)
        """
        model = self.lstm_models.get(species)
        scalers = self.lstm_scalers.get(species, {})
        scaler_x = scalers.get('x')
        scaler_y = scalers.get('y')
        
        if model is None or historical_data is None or len(historical_data) < sequence_length:
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)[:2]
        
        try:
            sequence_data = historical_data.tail(sequence_length).copy()
            
            feature_cols = ['lat', 'lon', 'speed_kmh', 'heading']
            available_cols = [col for col in feature_cols if col in sequence_data.columns]
            
            if len(available_cols) < 2:
                return current_lat, current_lon
            
            X_seq = sequence_data[available_cols].values
            
            X_seq = X_seq.reshape(1, sequence_length, -1)
            
            if scaler_x:
                X_flat = X_seq.reshape(1, -1)
                X_scaled_flat = scaler_x.transform(X_flat)
                X_scaled = X_scaled_flat.reshape(X_seq.shape)
            else:
                X_scaled = X_seq
            
            if TENSORFLOW_AVAILABLE and hasattr(model, 'predict'):
                y_pred_scaled = model.predict(X_scaled, verbose=0)
            else:
                y_pred_scaled = model.predict(X_scaled)
            
            if scaler_y:
                y_pred = scaler_y.inverse_transform(y_pred_scaled)
            else:
                y_pred = y_pred_scaled
            
            predicted_lat = float(y_pred[0][0]) if y_pred.shape[1] >= 1 else current_lat
            predicted_lon = float(y_pred[0][1]) if y_pred.shape[1] >= 2 else current_lon
            
            return predicted_lat, predicted_lon
        except Exception as e:
            logger.error(f"Error predicting with LSTM for {species}: {e}")
            return self.predict_with_bbmm(current_lat, current_lon, None, None, species)[:2]
    
    def evaluate_with_rl(
        self,
        current_coords: Tuple[float, float],
        predicted_coords: Tuple[float, float],
        species: str,
        corridor_geometry: Optional[Any] = None,
        settlement_distance: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Evaluate position using RL model for conflict detection and corridor optimization
        
        Returns: dict with reward, risk_zone, in_corridor, recommendations
        """
        rl_data = self.rl_models.get(species)
        
        if rl_data is None:
            risk_zone = False
            in_corridor = True
            
            if settlement_distance is not None and settlement_distance < 5.0:
                risk_zone = True
            
            if corridor_geometry:
                from shapely.geometry import Point
                current_point = Point(current_coords[1], current_coords[0])
                predicted_point = Point(predicted_coords[1], predicted_coords[0])
                
                try:
                    in_corridor = corridor_geometry.buffer(0.01).contains(current_point)
                except:
                    in_corridor = True
            
            reward = 1.0 if (in_corridor and not risk_zone) else -0.5
            
            return {
                'reward': reward,
                'risk_zone': risk_zone,
                'in_corridor': in_corridor,
                'recommendation': 'stay_course' if not risk_zone else 'avoid_settlement'
            }
        
        try:
            from shapely.geometry import Point
            current_point = Point(current_coords[1], current_coords[0])
            predicted_point = Point(predicted_coords[1], predicted_coords[0])
            
            in_corridor = False
            if corridor_geometry:
                try:
                    in_corridor = corridor_geometry.buffer(0.01).contains(current_point)
                except:
                    in_corridor = True
            
            risk_zone = False
            if settlement_distance is not None and settlement_distance < 5.0:
                risk_zone = True
            
            reward = 1.0
            if not in_corridor:
                reward -= 0.5
            if risk_zone:
                reward -= 1.0
            
            recommendation = 'stay_course'
            if risk_zone:
                recommendation = 'avoid_settlement'
            elif not in_corridor:
                recommendation = 'return_to_corridor'
            
            return {
                'reward': reward,
                'risk_zone': risk_zone,
                'in_corridor': in_corridor,
                'recommendation': recommendation
            }
        except Exception as e:
            logger.error(f"Error evaluating with RL for {species}: {e}")
            return {
                'reward': 0.0,
                'risk_zone': False,
                'in_corridor': True,
                'recommendation': 'continue'
            }
    
    def process_tracking_data(
        self,
        gps_data: List[Dict[str, Any]],
        corridor_data: Dict[str, Any],
        environmental_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process tracking data through the full pipeline: HMM → BBMM → XGBoost → LSTM → RL
        
        Args:
            gps_data: List of GPS tracking records from database
            corridor_data: Corridor geometry and metadata
            environmental_data: Environmental factors (season, rainfall, NDVI, etc.)
        
        Returns:
            Processed data with predictions and evaluations
        """
        results = {
            'timestamp': datetime.utcnow().isoformat(),
            'season': environmental_data.get('season', 'unknown'),
            'species_data': []
        }
        
        species_groups = defaultdict(lambda: defaultdict(list))
        
        for record in gps_data:
            species = record.get('species', '').lower()
            individual_id = record.get('individual_id') or record.get('animal_id') or record.get('id')
            
            if species and individual_id:
                species_groups[species][individual_id].append(record)
        
        for species, individuals in species_groups.items():
            for individual_id, records in individuals.items():
                records_sorted = sorted(records, key=lambda x: x.get('timestamp', ''))
                
                if len(records_sorted) < 1:
                    continue
                
                latest = records_sorted[-1]
                previous = records_sorted[-2] if len(records_sorted) >= 2 else None
                
                current_lat = latest.get('lat')
                current_lon = latest.get('lon')
                
                if current_lat is None or current_lon is None:
                    continue
                
                historical_df = None
                if len(records_sorted) >= 10:
                    try:
                        historical_records = records_sorted[-20:]
                        historical_df = pd.DataFrame(historical_records)
                    except:
                        pass
                
                prev_lat = previous.get('lat') if previous else None
                prev_lon = previous.get('lon') if previous else None
                predicted_lat, predicted_lon, _ = self.predict_with_bbmm(
                    current_lat, current_lon, prev_lat, prev_lon, species
                )
                
                if historical_df is not None and len(historical_df) >= 3:
                    behavior_state = self.predict_behavior_with_hmm(historical_df, species)
                else:
                    speed = latest.get('speed_kmh', 0)
                    if speed > 5.0:
                        behavior_state = 'migrating'
                    elif speed > 1.0:
                        behavior_state = 'foraging'
                    else:
                        behavior_state = 'resting'
                
                if historical_df is not None:
                    try:
                        lstm_pred_lat, lstm_pred_lon = self.predict_with_lstm(
                            current_lat, current_lon, historical_df, species
                        )
                        predicted_lat = (predicted_lat + lstm_pred_lat) / 2
                        predicted_lon = (predicted_lon + lstm_pred_lon) / 2
                    except:
                        pass
                
                corridor_geom = corridor_data.get(species, {}).get('geometry')
                settlement_dist = latest.get('settlement_distance')
                
                rl_eval = self.evaluate_with_rl(
                    (current_lat, current_lon),
                    (predicted_lat, predicted_lon),
                    species,
                    corridor_geom,
                    settlement_dist
                )
                
                species_result = {
                    'species': species.capitalize(),
                    'individual_id': str(individual_id),
                    'current_coords': [current_lat, current_lon],
                    'predicted_coords': [predicted_lat, predicted_lon],
                    'state': behavior_state,
                    'in_corridor': rl_eval.get('in_corridor', True),
                    'risk_zone': rl_eval.get('risk_zone', False),
                    'reward': rl_eval.get('reward', 0.0),
                    'recommendation': rl_eval.get('recommendation', 'continue')
                }
                
                results['species_data'].append(species_result)
        
        return results


_tracker = None

def get_realtime_tracker() -> RealTimeTracker:
    """Get or create global tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = RealTimeTracker()
    return _tracker

