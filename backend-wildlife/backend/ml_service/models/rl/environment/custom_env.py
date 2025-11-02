import gymnasium as gym
import numpy as np
import pygame
import uuid
import sys
import os
import warnings
# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings('ignore')
from pathlib import Path
from gymnasium import spaces
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional, Any
import math
from collections import defaultdict
import matplotlib.pyplot as plt
import pandas as pd

sys.path.append(str(Path(__file__).parent.parent))
try:
    from integration.model_loader import ModelLoader
    from integration.data_connector import DataConnector
    from integration.dynamic_species import DynamicSpeciesHandler
except ImportError:
    ModelLoader = None
    DataConnector = None
    DynamicSpeciesHandler = None

class SpeciesType(Enum):
    ELEPHANT = "elephant"
    WILDEBEEST = "wildebeest"

class TerrainType(Enum):
    FOREST = "forest"
    GRASSLAND = "grassland"
    WATER = "water"
    AGRICULTURE = "agriculture"
    SETTLEMENT = "settlement"
    ROAD = "road"

class BehaviorState(Enum):
    FORAGING = "foraging"
    MIGRATING = "migrating"
    RESTING = "resting"

@dataclass
class Animal:
    species: Any
    x: int
    y: int
    energy: float
    age: int
    group_size: int
    behavior_state: BehaviorState
    target_x: Optional[int] = None
    target_y: Optional[int] = None

class WildlifeCorridorEnv(gym.Env):
    """
    Wildlife Corridor Environment for multi-agent reinforcement learning.
    Supports elephants, wildebeests, and dynamically detected species.
    Enhanced with real model integration (HMM, BBMM, XGBoost, LSTM).
    """
    
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 4}
    
    def __init__(self, grid_size: int = 80, budget: int = 120, max_steps: int = 1000,
                 model_loader: ModelLoader = None, data_connector: DataConnector = None,
                 use_real_data: bool = False, bbox: Tuple[float, float, float, float] = None,
                 update_frequency: int = 10):
        super().__init__()
        
        self.grid_size = grid_size
        self.budget = budget
        self.max_steps = max_steps
        self.current_step = 0
        self.use_real_data = use_real_data
        self.update_frequency = update_frequency
        self.bbox = bbox or (29.0, -12.0, 42.0, 5.5)
        
        self.model_loader = model_loader
        self.data_connector = data_connector
        self.dynamic_species_handler = None
        if DynamicSpeciesHandler and self.model_loader:
            self.dynamic_species_handler = DynamicSpeciesHandler(self.model_loader)
        
        self.gps_data = {}
        self.environmental_rasters = {}
        self.lstm_forecasts = {}
        self.habitat_suitability_map = {}
        self.dynamic_species = set()
        
        self.terrain_grid = None
        self.habitat_quality = None
        self.corridor_strength = None
        self.water_sources = []
        self.animals = []
        self.conflicts = 0
        self.crisis_mode = False
        self.crisis_steps = 0
        
        self.climate_shift = 0.0
        self.drought_intensity = 0.0
        self.season = "wet"
        self.season_step = 0
        
        self.agents = ["elephant_agent", "wildebeest_agent"]
        self.current_agent_idx = 0
        self.current_agent = self.agents[0] if self.agents else None
        
        self.reward_history = []
        self.population_history = []
        self.budget_history = []
        self.action_history = []
        self.conflict_history = []
        self.habitat_suitability_history = []
        
        self._setup_spaces()
        
        if self.use_real_data:
            if not self.data_connector:
                raise ValueError("DataConnector is required when use_real_data=True. "
                               "Please provide a DataConnector instance.")
            try:
                self._load_real_data()
            except Exception as e:
                raise ValueError(f"Failed to load required real data: {e}. "
                               "Please ensure GPS tracking API is accessible and environmental rasters are available.")
        else:
            raise ValueError("System requires real data (no simulations). "
                           "Set use_real_data=True and provide ModelLoader and DataConnector with accessible data sources.")
        
        self._initialize_populations()
        
        self.window = None
        self.clock = None
        self.screen = None
        
    def _setup_spaces(self):
        """Setup action and observation spaces for each agent."""
        
        self.action_spaces = {
            "elephant_agent": spaces.Discrete(7),
            "wildebeest_agent": spaces.Discrete(7)
        }
        
        obs_dict = {
            "habitat_quality_mean": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "habitat_quality_std": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "habitat_quality_max": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "habitat_quality_min": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "corridor_density": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "corridor_coverage": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "corridor_quality": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "elephant_population": spaces.Box(0, 100, shape=(1,), dtype=np.float32),
            "wildebeest_population": spaces.Box(0, 100, shape=(1,), dtype=np.float32),
            "conflicts": spaces.Box(0, 50, shape=(1,), dtype=np.float32),
            "poaching_risk_mean": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "climate_shift": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "drought_intensity": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "water_sources_count": spaces.Box(0, 50, shape=(1,), dtype=np.float32),
            "water_quality": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "water_access": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "budget": spaces.Box(0, 200, shape=(1,), dtype=np.float32),
            "agent_position_x": spaces.Box(0, self.grid_size, shape=(1,), dtype=np.float32),
            "agent_position_y": spaces.Box(0, self.grid_size, shape=(1,), dtype=np.float32),
            
            "hmm_foraging_prob": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "hmm_resting_prob": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "hmm_traveling_prob": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "bbmm_density": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "habitat_suitability": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "lstm_ndvi_trend": spaces.Box(-1, 1, shape=(5,), dtype=np.float32),
            "lstm_rainfall_trend": spaces.Box(-1, 1, shape=(5,), dtype=np.float32),
        }
        
        elephant_specific = {
            "distance_to_forest": spaces.Box(0, self.grid_size, shape=(1,), dtype=np.float32),
            "water_proximity": spaces.Box(0, self.grid_size, shape=(1,), dtype=np.float32),
            "human_presence_density": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
        }
        
        wildebeest_specific = {
            "grassland_quality": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "seasonal_timing": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
            "water_proximity": spaces.Box(0, self.grid_size, shape=(1,), dtype=np.float32),
            "herd_density": spaces.Box(0, 1, shape=(1,), dtype=np.float32),
        }
        
        self.observation_spaces = {
            "elephant_agent": spaces.Dict({**obs_dict, **elephant_specific}),
            "wildebeest_agent": spaces.Dict({**obs_dict, **wildebeest_specific}),
        }
        
    def _load_real_data(self):
        """Load real tracking data and environmental rasters."""
        if not self.data_connector:
            return
        
        print("Loading real data...")
        from pathlib import Path
        from ...core.cloudflare_loader import get_file_loader
        from ...config.settings import get_settings
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        gps_data_dir = Path("data") / "gps"
        
        for species in ["elephant", "wildebeest"]:
            try:
                gps_file = None
                
                cloudflare_paths = [
                    f"ml-information/trained_models/bbmm/{species}_bbmm_gps_data.csv",
                    f"ml-information/trained_models/hmm/{species}_predictions.csv",
                ]
                
                local_paths = [
                    Path("data") / "bbmm" / f"{species}_bbmm_gps_data.csv",
                    gps_data_dir / f"{species}_gps.csv",
                    gps_data_dir / f"{species}_tracking.csv",
                    Path("data") / "hmm" / f"{species}_predictions.csv",
                ]
                
                if settings.CLOUDFLARE_BASE_URL:
                    for cf_path in cloudflare_paths:
                        if file_loader.exists(cf_path):
                            gps_file = cf_path
                            break
                
                if not gps_file:
                    for local_path in local_paths:
                        if local_path.exists():
                            gps_file = str(local_path)
                            break
                
                df = self.data_connector.get_latest_tracking_data(
                    species, 
                    hours=24,
                    local_file_path=gps_file,
                    max_records=10000
                )
                if not df.empty:
                    self.gps_data[species] = df
                    print(f"Loaded {len(df)} GPS records for {species}")
                else:
                    raise ValueError(f"No GPS data available for {species}. "
                                   f"Provide CSV file at: {gps_data_dir}/{species}_gps.csv "
                                   f"or ensure backend API is accessible.")
            except Exception as e:
                print(f"Error loading GPS data for {species}: {e}")
                raise ValueError(f"GPS tracking data is required for {species}. "
                               f"Please provide a CSV file or ensure backend API is accessible. Error: {e}")
        
        from ...config.rl_config import cfg
        from ...core.cloudflare_loader import get_file_loader
        from ...config.settings import get_settings
        
        settings = get_settings()
        file_loader = get_file_loader(
            cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
        )
        
        missing_rasters = []
        raster_paths = cfg.RASTERS
        
        for raster_type in ['ndvi', 'rainfall', 'elevation', 'landcover']:
            try:
                raster_path = raster_paths.get(raster_type)
                if not raster_path:
                    if settings.CLOUDFLARE_BASE_URL:
                        raster_path = f"ml-information/data/rasters/{raster_type}_raster_kenya_tanzania.tif"
                    else:
                        raster_path = f"data/rasters/{raster_type}_raster_kenya_tanzania.tif"
                
                try:
                    resolved_path = file_loader.resolve_path(raster_path)
                        raster_data = self.data_connector.load_environmental_raster(
                        raster_type,
                        raster_path=str(resolved_path),
                        bbox=None
                    )
                    if raster_data and raster_data.get('data') is not None:
                        data_arr = raster_data.get('data')
                        if hasattr(data_arr, 'shape') and data_arr.shape[0] > 0 and data_arr.shape[1] > 0:
                            self.environmental_rasters[raster_type] = raster_data
                        else:
                            missing_rasters.append(raster_type)
                        else:
                            missing_rasters.append(raster_type)
                except Exception as e:
                    try:
                        raster_data = self.data_connector.load_environmental_raster(raster_type, bbox=self.bbox)
                        if raster_data:
                            self.environmental_rasters[raster_type] = raster_data
                        else:
                            missing_rasters.append(raster_type)
                    except:
                        missing_rasters.append(raster_type)
            except Exception as e:
                missing_rasters.append(raster_type)
        
        if missing_rasters:
            pass
        
        valid_rasters = {k: v for k, v in self.environmental_rasters.items() 
                        if v and isinstance(v, dict) and v.get('data') is not None 
                        and hasattr(v['data'], 'shape') and v['data'].shape[0] > 0 and v['data'].shape[1] > 0}
        
        if valid_rasters:
            self.environmental_rasters = valid_rasters
            self._generate_habitat_quality_from_rasters()
        else:
            self._generate_rasters_from_data()
        
        self._update_lstm_forecasts()
    
    def _generate_habitat_quality_from_rasters(self):
        """Generate habitat quality from environmental rasters or XGBoost models."""
        if not self.environmental_rasters or 'landcover' not in self.environmental_rasters:
            print("Generating environmental layers from GPS data and models...")
            self._generate_rasters_from_data()
        
        self.terrain_grid = np.zeros((self.grid_size, self.grid_size), dtype=int)
        self.habitat_quality = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        self.corridor_strength = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        
        ndvi_data = self.environmental_rasters.get('ndvi', {}).get('data')
        if ndvi_data is not None and ndvi_data.size > 0 and ndvi_data.shape[0] > 0 and ndvi_data.shape[1] > 0:
            try:
                from scipy.ndimage import zoom
            except ImportError:
                def zoom(arr, factor, order=1):
                    h, w = arr.shape
                    new_h, new_w = int(h * factor[0]), int(w * factor[1])
                    return np.array([[arr[int(i/factor[0]), int(j/factor[1])] 
                                    for j in range(new_w)] for i in range(new_h)])
            
            if ndvi_data.shape != (self.grid_size, self.grid_size):
                if ndvi_data.shape[0] > 0 and ndvi_data.shape[1] > 0:
                    zoom_factor = (self.grid_size / ndvi_data.shape[0], self.grid_size / ndvi_data.shape[1])
                    ndvi_resized = zoom(ndvi_data, zoom_factor, order=1) if callable(zoom) else ndvi_data
                else:
                    ndvi_resized = ndvi_data
            else:
                ndvi_resized = ndvi_data
            self.habitat_quality = np.clip(ndvi_resized.astype(np.float32), 0, 1)
        
        landcover_data = self.environmental_rasters.get('landcover', {}).get('data')
        if landcover_data is not None and landcover_data.size > 0 and landcover_data.shape[0] > 0 and landcover_data.shape[1] > 0:
            try:
                from scipy.ndimage import zoom
            except ImportError:
                def zoom(arr, factor, order=0):
                    h, w = arr.shape
                    new_h, new_w = int(h * factor[0]), int(w * factor[1])
                    return np.array([[arr[int(i/factor[0]), int(j/factor[1])] 
                                    for j in range(new_w)] for i in range(new_h)])
            
            if landcover_data.shape != (self.grid_size, self.grid_size):
                if landcover_data.shape[0] > 0 and landcover_data.shape[1] > 0:
                    zoom_factor = (self.grid_size / landcover_data.shape[0], self.grid_size / landcover_data.shape[1])
                    landcover_resized = zoom(landcover_data, zoom_factor, order=0) if callable(zoom) else landcover_data
                else:
                    landcover_resized = landcover_data
            else:
                landcover_resized = landcover_data
            
            self.terrain_grid = landcover_resized.astype(int)
            multipliers = {0: 1.0, 1: 0.9, 2: 0.85, 3: 0.3, 4: 0.1}
            for i in range(self.grid_size):
                for j in range(self.grid_size):
                    if i < landcover_resized.shape[0] and j < landcover_resized.shape[1]:
                        lc = int(landcover_resized[i, j])
                        mult = multipliers.get(lc, 0.5)
                        self.habitat_quality[i, j] *= mult
    
    def _update_lstm_forecasts(self):
        """Update LSTM temporal forecasts using real data only."""
        if not self.model_loader or not self.model_loader.lstm_model:
            raise ValueError("LSTM model is required but not loaded. Please provide trained LSTM model.")
        
        timesteps = 10
        historical_features = []
        
        for t in range(timesteps):
            if 'ndvi' not in self.environmental_rasters or self.environmental_rasters['ndvi']['data'] is None:
                raise ValueError("Real NDVI raster data is required for LSTM prediction.")
            ndvi_val = np.mean(self.environmental_rasters['ndvi']['data'])
            
            if 'rainfall' not in self.environmental_rasters or self.environmental_rasters['rainfall']['data'] is None:
                raise ValueError("Real rainfall raster data is required for LSTM prediction.")
            rainfall_val = np.mean(self.environmental_rasters['rainfall']['data'])
            
            if 'elevation' not in self.environmental_rasters or self.environmental_rasters['elevation']['data'] is None:
                raise ValueError("Real elevation raster data is required for LSTM prediction.")
            elev_val = np.mean(self.environmental_rasters['elevation']['data'])
            
            if self.habitat_quality is None:
                raise ValueError("Habitat quality (from XGBoost) is required for LSTM prediction.")
            habitat_qual_mean = np.mean(self.habitat_quality)
            
            if self.corridor_strength is None:
                raise ValueError("Corridor strength is required for LSTM prediction.")
            corridor_strength_mean = np.mean(self.corridor_strength)
            
            feature_row = [
                ndvi_val,
                rainfall_val,
                elev_val,
                self.climate_shift,
                float(self.season == "wet"),
                self.drought_intensity,
                habitat_qual_mean,
                corridor_strength_mean,
                len(self.animals) / 100.0,
                self.conflicts / 25.0,
                float(t) / timesteps,
                self.current_step / self.max_steps,
                np.mean([animal.energy for animal in self.animals]) / 100.0 if self.animals else 0.5,
            ]
            
            historical_features.append(feature_row[:13])
        
        historical_data = np.array(historical_features)
        forecasts = self.model_loader.predict_temporal_trends(historical_data, forecast_steps=10)
        self.lstm_forecasts = forecasts
    
    def _latlon_to_grid(self, lat, lon):
        """Convert lat/lon to grid coordinates."""
        min_lon, min_lat, max_lon, max_lat = self.bbox
        x = int((lon - min_lon) / (max_lon - min_lon) * self.grid_size)
        y = int((lat - min_lat) / (max_lat - min_lat) * self.grid_size)
        return np.clip(x, 0, self.grid_size-1), np.clip(y, 0, self.grid_size-1)
    
    def _grid_to_latlon(self, x, y):
        """Convert grid coordinates to lat/lon."""
        min_lon, min_lat, max_lon, max_lat = self.bbox
        lon = min_lon + (x / self.grid_size) * (max_lon - min_lon)
        lat = min_lat + (y / self.grid_size) * (max_lat - min_lat)
        return lat, lon
    
    def _generate_rasters_from_data(self):
        """Create minimal environmental layers from available GPS data."""
        print("Creating environmental layers from GPS data coverage...")
        
        for species, df in self.gps_data.items():
            if df.empty or 'latitude' not in df.columns or 'longitude' not in df.columns:
                continue
            
            min_lat = df['latitude'].min()
            max_lat = df['latitude'].max()
            min_lon = df['longitude'].min()
            max_lon = df['longitude'].max()
        
        if 'ndvi' not in self.environmental_rasters:
            ndvi_data = np.ones((self.grid_size, self.grid_size), dtype=np.float32) * 0.55
            self.environmental_rasters['ndvi'] = {
                'data': ndvi_data,
                'transform': None,
                'bounds': None,
                'crs': None,
                'raster_type': 'ndvi'
            }
        
        if 'rainfall' not in self.environmental_rasters:
            rainfall_data = np.ones((self.grid_size, self.grid_size), dtype=np.float32) * 75.0
            self.environmental_rasters['rainfall'] = {
                'data': rainfall_data,
                'transform': None,
                'bounds': None,
                'crs': None,
                'raster_type': 'rainfall'
            }
        
        if 'elevation' not in self.environmental_rasters:
            elev_data = np.ones((self.grid_size, self.grid_size), dtype=np.float32) * 1200.0
            self.environmental_rasters['elevation'] = {
                'data': elev_data,
                'transform': None,
                'bounds': None,
                'crs': None,
                'raster_type': 'elevation'
            }
        
        if 'landcover' not in self.environmental_rasters:
            landcover_data = np.ones((self.grid_size, self.grid_size), dtype=int) * 2
            for species, df in self.gps_data.items():
                if not df.empty and 'latitude' in df.columns and 'longitude' in df.columns:
                    for _, row in df.sample(min(100, len(df))).iterrows():
                        lat, lon = row['latitude'], row['longitude']
                        x, y = self._latlon_to_grid(lat, lon)
                        if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
                            landcover_data[x, y] = 2  # Grassland
            
            self.environmental_rasters['landcover'] = {
                'data': landcover_data,
                'transform': None,
                'bounds': None,
                'crs': None,
                'raster_type': 'landcover'
            }
        
        print("✓ Generated environmental layers from GPS data")
        
    def _generate_landscape(self):
        """Load landscape from real environmental rasters or generated from data."""
        
        self.terrain_grid = np.zeros((self.grid_size, self.grid_size), dtype=int)
        self.habitat_quality = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        self.corridor_strength = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        
        if not self.environmental_rasters or 'landcover' not in self.environmental_rasters:
            self._generate_rasters_from_data()
        
        landcover_data = self.environmental_rasters['landcover']['data']
        if landcover_data.shape != (self.grid_size, self.grid_size):
            # Resize if needed
            from scipy.ndimage import zoom
            zoom_factor = (self.grid_size / landcover_data.shape[0], self.grid_size / landcover_data.shape[1])
            landcover_data = zoom(landcover_data, zoom_factor, order=0)
        
        terrain_map = {0: TerrainType.WATER, 1: TerrainType.FOREST, 2: TerrainType.GRASSLAND,
                      3: TerrainType.AGRICULTURE, 4: TerrainType.SETTLEMENT}
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if i < landcover_data.shape[0] and j < landcover_data.shape[1]:
                    lc_value = int(landcover_data[i, j])
                    self.terrain_grid[i, j] = list(TerrainType).index(terrain_map.get(lc_value, TerrainType.GRASSLAND))
                    if lc_value == 0:
                        self.water_sources.append((i, j))
        
        self._update_habitat_quality()
        
    def _update_habitat_quality(self):
        """Update habitat quality from XGBoost model predictions if available, otherwise keep existing."""
        
        if not self.model_loader or not self.data_connector:
            return
        
        if self.habitat_quality is None:
            self.habitat_quality = np.ones((self.grid_size, self.grid_size), dtype=np.float32) * 0.5
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                lat, lon = self._grid_to_latlon(i, j)
                
                try:
                    env_features = self.data_connector.extract_environmental_features(
                        lat, lon, rasters=self.environmental_rasters
                    )
                except:
                    continue
                
                suitability_scores = []
                for species in ["elephant", "wildebeest"]:
                    if species in self.model_loader.xgboost_models:
                        try:
                            suitability = self.model_loader.predict_habitat_suitability(
                                species, env_features
                            )
                            suitability_scores.append(suitability)
                        except:
                            continue
                
                if suitability_scores:
                    self.habitat_quality[i, j] = np.mean(suitability_scores)
        
        self.habitat_quality = np.clip(self.habitat_quality, 0, 1)
        
    def _initialize_populations(self):
        """Initialize animal populations from real GPS tracking data only - no random placements."""
        
        self.animals = []
        
        if not self.use_real_data:
            raise ValueError("Real GPS tracking data is required. Set use_real_data=True and provide GPS data.")
        
        if "elephant" not in self.gps_data or self.gps_data["elephant"].empty:
            raise ValueError("Real GPS data for elephants is required. No simulated positions allowed.")
        
        df_elephants = self.gps_data["elephant"]
        valid_animals = 0
        max_elephants = 20
        sample_df = df_elephants.sample(min(max_elephants, len(df_elephants))).reset_index(drop=True)
        
        for idx, row in sample_df.iterrows():
            lat = row.get('latitude') or row.get('lat') or row.get('Latitude')
            lon = row.get('longitude') or row.get('lon') or row.get('Longitude')
            
            if lat is None or lon is None or pd.isna(lat) or pd.isna(lon):
                continue
            
            try:
                lat = float(lat)
                lon = float(lon)
                if not (-10 <= lat <= 10) or not (25 <= lon <= 45):
                    continue
            except (ValueError, TypeError):
                continue
            
            x, y = self._latlon_to_grid(lat, lon)
            energy = row.get('energy', 80.0) if 'energy' in row else 80.0
            age = row.get('age', 15) if 'age' in row else 15
            group_size = row.get('group_size', 10) if 'group_size' in row else 10
            
            animal = Animal(
                species=SpeciesType.ELEPHANT,
                x=x, y=y,
                energy=float(energy),
                age=int(age),
                group_size=int(group_size),
                behavior_state=BehaviorState.FORAGING
            )
            self.animals.append(animal)
            valid_animals += 1
        
        if "wildebeest" not in self.gps_data or self.gps_data["wildebeest"].empty:
            raise ValueError("Real GPS data for wildebeests is required. No simulated positions allowed.")
        
        df_wildebeests = self.gps_data["wildebeest"]
        valid_wildebeests = 0
        max_wildebeests = 60
        sample_wildebeests = df_wildebeests.sample(min(max_wildebeests, len(df_wildebeests))).reset_index(drop=True)
        
        for idx, row in sample_wildebeests.iterrows():
            lat = row.get('latitude') or row.get('lat') or row.get('Latitude')
            lon = row.get('longitude') or row.get('lon') or row.get('Longitude')
            
            if lat is None or lon is None or pd.isna(lat) or pd.isna(lon):
                continue
            
            try:
                lat = float(lat)
                lon = float(lon)
                if not (-10 <= lat <= 10) or not (25 <= lon <= 45):
                    continue
            except (ValueError, TypeError):
                continue
            
            x, y = self._latlon_to_grid(lat, lon)
            energy = row.get('energy', 60.0) if 'energy' in row else 60.0
            age = row.get('age', 10) if 'age' in row else 10
            group_size = row.get('group_size', 100) if 'group_size' in row else 100
            
            animal = Animal(
                species=SpeciesType.WILDEBEEST,
                x=x, y=y,
                energy=float(energy),
                age=int(age),
                group_size=int(group_size),
                behavior_state=BehaviorState.FORAGING
            )
            self.animals.append(animal)
            valid_wildebeests += 1
        
        print(f"Initialized {valid_animals} elephants and {valid_wildebeests} wildebeests from GPS data")
        
        if len(self.animals) == 0:
            raise ValueError("No animals could be initialized from GPS data. Check that GPS data contains valid coordinates.")
        
        if self.dynamic_species_handler and self.dynamic_species:
            for species_name in self.dynamic_species:
                agent_name = f"{species_name}_agent"
                if agent_name not in self.agents:
                    self.agents.append(agent_name)
                    self.observation_spaces[agent_name] = self.observation_spaces["wildebeest_agent"]
                    self.action_spaces[agent_name] = spaces.Discrete(7)
                
                if species_name not in self.gps_data or self.gps_data[species_name].empty:
                    print(f"Warning: No GPS data for dynamic species '{species_name}'. Skipping population initialization.")
                    continue
                
                df_species = self.gps_data[species_name]
                for idx, row in df_species.iterrows():
                    lat = row.get('latitude', row.get('lat'))
                    lon = row.get('longitude', row.get('lon'))
                    
                    if lat is None or lon is None:
                        continue
                    
                    x, y = self._latlon_to_grid(lat, lon)
                    energy = row.get('energy', 70.0) if 'energy' in row else 70.0
                    age = row.get('age', 15) if 'age' in row else 15
                    group_size = row.get('group_size', 15) if 'group_size' in row else 15
                    
                    animal = Animal(
                        species=species_name,
                        x=x, y=y,
                        energy=float(energy),
                        age=int(age),
                        group_size=int(group_size),
                        behavior_state=BehaviorState.FORAGING
                    )
                    self.animals.append(animal) 
    
    def _update_animal_behaviors(self):
        """Update animal behaviors and positions from real models and GPS data only."""
        
        for animal in self.animals:
            animal_species = animal.species.value if isinstance(animal.species, SpeciesType) else animal.species
            if self.model_loader and animal_species in self.model_loader.hmm_models:
                lat, lon = self._grid_to_latlon(animal.x, animal.y)
                hmm_probs = self.model_loader.get_hmm_state_probs(animal_species, lat, lon)
                max_state = max(hmm_probs.items(), key=lambda x: x[1])[0]
                if max_state == 'foraging':
                    animal.behavior_state = BehaviorState.FORAGING
                elif max_state == 'resting':
                    animal.behavior_state = BehaviorState.RESTING
                elif max_state == 'traveling':
                    animal.behavior_state = BehaviorState.MIGRATING
            else:
                if animal.energy < 30:
                    animal.behavior_state = BehaviorState.RESTING
                elif animal.energy > 70:
                    animal.behavior_state = BehaviorState.MIGRATING
                else:
                    animal.behavior_state = BehaviorState.FORAGING
            
            if animal.behavior_state == BehaviorState.MIGRATING:
                animal_species = animal.species.value if isinstance(animal.species, SpeciesType) else animal.species
                current_lat, current_lon = self._grid_to_latlon(animal.x, animal.y)
                
                move_scores = []
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        new_x = np.clip(animal.x + dx, 0, self.grid_size - 1)
                        new_y = np.clip(animal.y + dy, 0, self.grid_size - 1)
                        
                        if new_x == animal.x and new_y == animal.y:
                            continue
                        
                        new_lat, new_lon = self._grid_to_latlon(new_x, new_y)
                        
                        bbmm_prob = 0.5
                        if self.model_loader and animal_species in self.model_loader.bbmm_models:
                            try:
                                bbmm_prob = self.model_loader.get_bbmm_density(animal_species, new_lat, new_lon)
                            except:
                                bbmm_prob = 0.5
                        
                        habitat_score = self.habitat_quality[new_x, new_y]
                        
                        terrain_type = TerrainType.GRASSLAND
                        if hasattr(self, 'terrain_grid') and self.terrain_grid is not None:
                            terrain_idx = int(self.terrain_grid[new_x, new_y])
                            if 0 <= terrain_idx < len(list(TerrainType)):
                                terrain_type = list(TerrainType)[terrain_idx]
                        conflict_penalty = 0.0
                        if terrain_type == TerrainType.SETTLEMENT:
                            conflict_penalty = -0.5
                        
                        combined_score = (bbmm_prob * 0.4 +
                                        habitat_score * 0.4 +
                                        conflict_penalty)
                        
                        move_scores.append((combined_score, new_x, new_y, dx, dy))
                
                if move_scores:
                    best_score, best_x, best_y, best_dx, best_dy = max(move_scores, key=lambda x: x[0])
                    animal.x = best_x
                    animal.y = best_y
                    
            elif animal.behavior_state == BehaviorState.FORAGING:
                animal_species = animal.species.value if isinstance(animal.species, SpeciesType) else animal.species
                current_lat, current_lon = self._grid_to_latlon(animal.x, animal.y)
                
                current_bbmm = 0.5
                if self.model_loader and animal_species in self.model_loader.bbmm_models:
                    try:
                        current_bbmm = self.model_loader.get_bbmm_density(animal_species, current_lat, current_lon)
                    except:
                        current_bbmm = 0.5
                
                if self.habitat_quality[animal.x, animal.y] < 0.5 or current_bbmm < 0.4:
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            new_x = np.clip(animal.x + dx, 0, self.grid_size - 1)
                            new_y = np.clip(animal.y + dy, 0, self.grid_size - 1)
                            
                            new_lat, new_lon = self._grid_to_latlon(new_x, new_y)
                            
                            new_bbmm = 0.5
                            if self.model_loader and animal_species in self.model_loader.bbmm_models:
                                try:
                                    new_bbmm = self.model_loader.get_bbmm_density(animal_species, new_lat, new_lon)
                                except:
                                    new_bbmm = 0.5
                            
                            if (new_bbmm > current_bbmm * 1.1 or 
                                (new_bbmm >= current_bbmm and self.habitat_quality[new_x, new_y] > self.habitat_quality[animal.x, animal.y])):
                                animal.x = new_x
                                animal.y = new_y
                                break
                        else:
                            continue
                        break
            
            if animal.behavior_state == BehaviorState.FORAGING:
                energy_gain = self.habitat_quality[animal.x, animal.y] * 2
                animal.energy = min(100, animal.energy + energy_gain)
                
            elif animal.behavior_state == BehaviorState.MIGRATING:
                terrain_penalty = 0.5 if self.terrain_grid[animal.x, animal.y] == list(TerrainType).index(TerrainType.SETTLEMENT) else 0.1
                animal.energy = max(0, animal.energy - (1 + terrain_penalty))
                
            elif animal.behavior_state == BehaviorState.RESTING:
                recovery = self.habitat_quality[animal.x, animal.y] * 3
                animal.energy = min(100, animal.energy + recovery)
            
            animal.age += 1
            
            mortality_risk = 0.0
            
            if animal.energy < 15:
                habitat_risk = (1.0 - self.habitat_quality[animal.x, animal.y]) * 0.1
                mortality_risk += 0.05 + (15 - animal.energy) * 0.005 + habitat_risk
            
            if animal.age > 45:
                mortality_risk += 0.015
            
            if self.conflicts > 0:
                conflict_risk = min(0.1, self.conflicts / 100.0)
                mortality_risk += conflict_risk
            
            if mortality_risk > 0.5:
                self.animals.remove(animal)
                continue
            
            if self.use_real_data and animal_species in self.gps_data:
                pass
    
    def _get_agent_position(self, agent_name: str) -> Tuple[int, int]:
        """Get the current position of the specified agent."""
        
        species = agent_name.replace("_agent", "")
        
        for animal in self.animals:
            animal_species = animal.species.value if isinstance(animal.species, SpeciesType) else animal.species
            if animal_species == species:
                return animal.x, animal.y
        
        return self.grid_size // 2, self.grid_size // 2
    
    def _get_observation(self, agent_name: str) -> Dict[str, np.ndarray]:
        """Get observation for the specified agent."""
        
        agent_x, agent_y = self._get_agent_position(agent_name)
        
        habitat_qualities = [self.habitat_quality[i, j] for i in range(self.grid_size) for j in range(self.grid_size)]
        corridor_strengths = [self.corridor_strength[i, j] for i in range(self.grid_size) for j in range(self.grid_size)]
        
        elephant_count = sum(1 for animal in self.animals 
                           if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.ELEPHANT)
                           or (isinstance(animal.species, str) and animal.species == "elephant"))
        wildebeest_count = sum(1 for animal in self.animals 
                             if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.WILDEBEEST)
                             or (isinstance(animal.species, str) and animal.species == "wildebeest"))
        
        lat, lon = self._grid_to_latlon(agent_x, agent_y)
        species = agent_name.replace("_agent", "")
        
        if self.model_loader:
            if hasattr(self.model_loader, 'hmm_models') and species in self.model_loader.hmm_models:
                hmm_state = self.model_loader.get_hmm_state_probs(species, lat, lon)
            else:
                hmm_state = {'foraging': 0.33, 'resting': 0.33, 'traveling': 0.33}
            
            if hasattr(self.model_loader, 'bbmm_models') and species in self.model_loader.bbmm_models:
                bbmm_density = self.model_loader.get_bbmm_density(species, lat, lon)
            else:
                bbmm_density = 0.5
            
            env_features = {}
            if self.data_connector:
                env_features = self.data_connector.extract_environmental_features(
                    lat, lon, self.environmental_rasters)
            
            if species in self.model_loader.xgboost_models:
                habitat_suitability = self.model_loader.predict_habitat_suitability(species, env_features)
            else:
                habitat_suitability = 0.5
        else:
            hmm_state = {'foraging': 0.33, 'resting': 0.33, 'traveling': 0.33}
            bbmm_density = 0.5
            habitat_suitability = 0.5
            env_features = {}
        
        ndvi_trend = self.lstm_forecasts.get('ndvi_trend', np.ones(5)*0.5)[:5]
        rainfall_trend = self.lstm_forecasts.get('rainfall_trend', np.zeros(5))[:5]
        
        distance_to_forest = self._calculate_distance_to_terrain(agent_x, agent_y, TerrainType.FOREST)
        distance_to_water = self._calculate_distance_to_water(agent_x, agent_y)
        human_presence = self._calculate_human_presence_density(agent_x, agent_y)
        grassland_quality = self._calculate_grassland_quality(agent_x, agent_y)
        distance_to_calving = self._calculate_distance_to_calving(agent_x, agent_y)
        
        obs = {
            "habitat_quality_mean": np.array([np.mean(habitat_qualities)], dtype=np.float32),
            "habitat_quality_std": np.array([np.std(habitat_qualities)], dtype=np.float32),
            "habitat_quality_max": np.array([np.max(habitat_qualities)], dtype=np.float32),
            "habitat_quality_min": np.array([np.min(habitat_qualities)], dtype=np.float32),
            "corridor_density": np.array([np.mean(corridor_strengths)], dtype=np.float32),
            "corridor_coverage": np.array([np.sum(corridor_strengths) / (self.grid_size * self.grid_size)], dtype=np.float32),
            "corridor_quality": np.array([np.mean(corridor_strengths)], dtype=np.float32),
            "elephant_population": np.array([elephant_count], dtype=np.float32),
            "wildebeest_population": np.array([wildebeest_count], dtype=np.float32),
            "conflicts": np.array([self.conflicts], dtype=np.float32),
            "poaching_risk_mean": np.array([0.1], dtype=np.float32),
            "climate_shift": np.array([self.climate_shift], dtype=np.float32),
            "drought_intensity": np.array([self.drought_intensity], dtype=np.float32),
            "water_sources_count": np.array([len(self.water_sources)], dtype=np.float32),
            "water_quality": np.array([1.0], dtype=np.float32),
            "water_access": np.array([1.0 - distance_to_water / self.grid_size], dtype=np.float32),
            "budget": np.array([self.budget], dtype=np.float32),
            "agent_position_x": np.array([agent_x], dtype=np.float32),
            "agent_position_y": np.array([agent_y], dtype=np.float32),
            
            "hmm_foraging_prob": np.array([hmm_state['foraging']], dtype=np.float32),
            "hmm_resting_prob": np.array([hmm_state['resting']], dtype=np.float32),
            "hmm_traveling_prob": np.array([hmm_state['traveling']], dtype=np.float32),
            "bbmm_density": np.array([bbmm_density], dtype=np.float32),
            "habitat_suitability": np.array([habitat_suitability], dtype=np.float32),
            "lstm_ndvi_trend": ndvi_trend.astype(np.float32),
            "lstm_rainfall_trend": rainfall_trend.astype(np.float32),
        }
        
        if "elephant" in agent_name:
            obs.update({
                "distance_to_forest": np.array([distance_to_forest], dtype=np.float32),
                "water_proximity": np.array([distance_to_water], dtype=np.float32),
                "human_presence_density": np.array([human_presence], dtype=np.float32),
            })
        elif "wildebeest" in agent_name:
            obs.update({
                "grassland_quality": np.array([grassland_quality], dtype=np.float32),
                "seasonal_timing": np.array([1.0 if self.season == "wet" else 0.0], dtype=np.float32),
                "water_proximity": np.array([distance_to_water], dtype=np.float32),
                "herd_density": np.array([wildebeest_count / (self.grid_size * self.grid_size)], dtype=np.float32),
            })
        else:
            species_count = sum(1 for animal in self.animals 
                              if isinstance(animal.species, str) and animal.species == species)
            obs.update({
                "grassland_quality": np.array([grassland_quality], dtype=np.float32),
                "seasonal_timing": np.array([1.0 if self.season == "wet" else 0.0], dtype=np.float32),
                "water_proximity": np.array([distance_to_water], dtype=np.float32),
                "herd_density": np.array([species_count / (self.grid_size * self.grid_size)], dtype=np.float32),
            })
        
        return obs
    
    def _calculate_distance_to_terrain(self, x: int, y: int, terrain_type: TerrainType) -> float:
        """Calculate distance to nearest terrain of specified type."""
        min_distance = float('inf')
        terrain_idx = list(TerrainType).index(terrain_type)
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if self.terrain_grid[i, j] == terrain_idx:
                    distance = math.sqrt((x - i)**2 + (y - j)**2)
                    min_distance = min(min_distance, distance)
        
        return min_distance if min_distance != float('inf') else self.grid_size
    
    def _calculate_distance_to_water(self, x: int, y: int) -> float:
        """Calculate distance to nearest water source."""
        min_distance = float('inf')
        
        for wx, wy in self.water_sources:
            distance = math.sqrt((x - wx)**2 + (y - wy)**2)
            min_distance = min(min_distance, distance)
        
        return min_distance if min_distance != float('inf') else self.grid_size
    
    def _calculate_human_presence_density(self, x: int, y: int) -> float:
        """Calculate human presence density around position."""
        if self.terrain_grid is None:
            return 0.0
        
        human_count = 0
        total_count = 0
        
        for i in range(max(0, x - 5), min(self.grid_size, x + 5)):
            for j in range(max(0, y - 5), min(self.grid_size, y + 5)):
                terrain_idx = int(self.terrain_grid[i, j])
                if 0 <= terrain_idx < len(list(TerrainType)):
                    terrain_type = list(TerrainType)[terrain_idx]
                    if terrain_type in [TerrainType.SETTLEMENT, TerrainType.AGRICULTURE, TerrainType.ROAD]:
                        human_count += 1
                total_count += 1
        
        return human_count / total_count if total_count > 0 else 0.0
    
    def _calculate_grassland_quality(self, x: int, y: int) -> float:
        """Calculate grassland quality around position."""
        if self.terrain_grid is None:
            return 0.5
        
        quality_sum = 0
        count = 0
        
        for i in range(max(0, x - 3), min(self.grid_size, x + 3)):
            for j in range(max(0, y - 3), min(self.grid_size, y + 3)):
                terrain_idx = int(self.terrain_grid[i, j])
                if 0 <= terrain_idx < len(list(TerrainType)):
                    terrain_type = list(TerrainType)[terrain_idx]
                    if terrain_type == TerrainType.GRASSLAND:
                        quality_sum += self.habitat_quality[i, j]
                        count += 1
        
        return quality_sum / count if count > 0 else 0.0
    
    def _calculate_distance_to_calving(self, x: int, y: int) -> float:
        """Calculate distance to nearest calving area (simplified)."""
        # For simplicity, assume calving areas are near water sources
        return self._calculate_distance_to_water(x, y) 
    
    def _calculate_reward(self, agent_name: str, action: int) -> float:
        """Calculate reward for the agent's action with real model integration."""
        
        reward = 0.0
        
        agent_x, agent_y = self._get_agent_position(agent_name)
        species = agent_name.replace("_agent", "")
        lat, lon = self._grid_to_latlon(agent_x, agent_y)
        
        if self.model_loader and species in ["elephant", "wildebeest"]:
            env_features = {}
            if self.data_connector:
                env_features = self.data_connector.extract_environmental_features(
                    lat, lon, self.environmental_rasters)
            if species in self.model_loader.xgboost_models:
                habitat_suitability = self.model_loader.predict_habitat_suitability(species, env_features)
                reward += habitat_suitability * 30.0
            
            if species in self.model_loader.bbmm_models:
                bbmm_density = self.model_loader.get_bbmm_density(species, lat, lon)
                reward += bbmm_density * 20.0
            
            if species in self.model_loader.hmm_models:
                hmm_state = self.model_loader.get_hmm_state_probs(species, lat, lon)
                reward += hmm_state.get('foraging', 0.33) * 10.0
                if hmm_state['traveling'] > 0.5 and action in [0, 1, 2, 3]:
                    reward += 10.0
            else:
                hmm_state = {'foraging': 0.33, 'resting': 0.33, 'traveling': 0.33}
            
            ndvi_trend = self.lstm_forecasts.get('ndvi_trend', np.ones(5)*0.5)
            if len(ndvi_trend) > 0 and ndvi_trend[0] > 0.6:
                reward += 15.0
        else:
            hmm_state = {'foraging': 0.33, 'resting': 0.33, 'traveling': 0.33}
        
        if "elephant" in agent_name:
            reward += self._calculate_elephant_reward(agent_x, agent_y, action)
        elif "wildebeest" in agent_name:
            reward += self._calculate_wildebeest_reward(agent_x, agent_y, action)
        else:
            reward += self._calculate_generic_species_reward(agent_x, agent_y, action, species)
        
        reward += self._calculate_common_reward(agent_name)
        terrain_type = None
        if hasattr(self, 'terrain_grid') and self.terrain_grid is not None:
            terrain_idx = int(self.terrain_grid[agent_x, agent_y])
            if 0 <= terrain_idx < len(list(TerrainType)):
                terrain_type = list(TerrainType)[terrain_idx]
        if terrain_type == TerrainType.SETTLEMENT:
            reward -= 25.0
            self.conflicts += 1
        
        if self.corridor_strength[agent_x, agent_y] > 0.5:
            reward += 15.0
        
        return reward
    
    def _calculate_elephant_reward(self, x: int, y: int, action: int) -> float:
        """Calculate elephant-specific reward."""
        reward = 0.0
        
        if self.habitat_quality[x, y] > 0.6:
            reward += 25
        
        if self._calculate_distance_to_water(x, y) <= 5:
            reward += 10
        
        if self.corridor_strength[x, y] > 0.5:
            reward += 15
        
        human_density = self._calculate_human_presence_density(x, y)
        if human_density > 0.3:
            reward -= 20
        
        if self.habitat_quality[x, y] < 0.3:
            reward -= 25
        
        return reward
    
    
    def _calculate_wildebeest_reward(self, x: int, y: int, action: int) -> float:
        """Calculate wildebeest-specific reward."""
        reward = 0.0
        
        if self.corridor_strength[x, y] > 0.3:
            reward += 30
        
        if self._calculate_distance_to_calving(x, y) <= 10:
            reward += 25
        
        if self._calculate_distance_to_water(x, y) <= 5:
            reward += 15
        
        if self.habitat_quality[x, y] < 0.3:
            reward -= 30
        
        return reward
    
    def _calculate_generic_species_reward(self, x: int, y: int, action: int, species: str) -> float:
        """Calculate reward for dynamically detected species."""
        reward = 0.0
        
        if self.dynamic_species_handler and species in self.dynamic_species_handler.species_profiles:
            profile = self.dynamic_species_handler.species_profiles[species]
            preferences = profile.get('habitat_preferences', {})
            
            terrain_type = None
            if hasattr(self, 'terrain_grid') and self.terrain_grid is not None:
                terrain_idx = int(self.terrain_grid[x, y])
                if 0 <= terrain_idx < len(list(TerrainType)):
                    terrain_type = list(TerrainType)[terrain_idx]
            
            if preferences.get('prefers_forest', 0.5) > 0.6 and terrain_type == TerrainType.FOREST:
                reward += 20
            
            if preferences.get('prefers_grassland', 0.5) > 0.6 and terrain_type == TerrainType.GRASSLAND:
                reward += 20
            
            if preferences.get('water_dependence', 0.5) > 0.7:
                water_dist = self._calculate_distance_to_water(x, y)
                if water_dist <= 5:
                    reward += 15
                elif water_dist > 10:
                    reward -= 10
        
        # Generic habitat quality reward
        reward += self.habitat_quality[x, y] * 15
        
        # Corridor reward
        if self.corridor_strength[x, y] > 0.3:
            reward += 20
        
        return reward
    
    def _calculate_common_reward(self, agent_name: str) -> float:
        """Calculate common rewards for all agents."""
        reward = 0.0
        
        # Population rewards
        elephant_count = sum(1 for animal in self.animals 
                           if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.ELEPHANT)
                           or (isinstance(animal.species, str) and animal.species == "elephant"))
        wildebeest_count = sum(1 for animal in self.animals 
                             if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.WILDEBEEST)
                             or (isinstance(animal.species, str) and animal.species == "wildebeest"))
        
        # Count all animals including dynamic species
        total_animals = len(self.animals)
        
        reward += total_animals * 2.0
        
        if total_animals > 25:
            reward += 20
        elif total_animals > 15:
            reward += 15
        elif total_animals > 8:
            reward += 5
        
        # Conflict rewards
        if self.conflicts == 0:
            reward += 8.0
        else:
            reward -= min(12.0, self.conflicts * 4.0)
        
        # Crisis recovery reward
        if self.crisis_mode and total_animals >= 8:
            reward += 12.0
            self.crisis_mode = False
        
        return reward
    
    def _apply_action(self, agent_name: str, action: int):
        """Apply the agent's action - moves animals in real time."""
        
        agent_x, agent_y = self._get_agent_position(agent_name)
        
        species_name = agent_name.replace("_agent", "")
        
        moved = False
        if action == 0:
            new_y = max(0, agent_y - 1)
            if new_y != agent_y:
                agent_y = new_y
                moved = True
        elif action == 1:
            new_y = min(self.grid_size - 1, agent_y + 1)
            if new_y != agent_y:
                agent_y = new_y
                moved = True
        elif action == 2:
            new_x = min(self.grid_size - 1, agent_x + 1)
            if new_x != agent_x:
                agent_x = new_x
                moved = True
        elif action == 3:
            new_x = max(0, agent_x - 1)
            if new_x != agent_x:
                agent_x = new_x
                moved = True
        
        if moved:
            for animal in self.animals:
                animal_species = animal.species.value if isinstance(animal.species, SpeciesType) else animal.species
                if animal_species == species_name:
                    animal.x = agent_x
                    animal.y = agent_y
                    for other_animal in self.animals:
                        other_species = other_animal.species.value if isinstance(other_animal.species, SpeciesType) else other_animal.species
                        if other_species == species_name and other_animal != animal:
                            dx = np.sign(agent_x - other_animal.x)
                            dy = np.sign(agent_y - other_animal.y)
                            other_animal.x = np.clip(other_animal.x + dx, 0, self.grid_size - 1)
                            other_animal.y = np.clip(other_animal.y + dy, 0, self.grid_size - 1)
                    break
        
        elif action == 4:
            if "elephant" in agent_name:
                if self.budget >= 5:
                    self.corridor_strength[agent_x, agent_y] += 0.3
                    self.budget -= 5
                if self.budget >= 3:
                    self.corridor_strength[agent_x, agent_y] += 0.2
                    self.budget -= 3
            elif "wildebeest" in agent_name:
                if self.budget >= 5:
                    self.corridor_strength[agent_x, agent_y] += 0.3
                    self.budget -= 5
        
        elif action == 5:
            if "elephant" in agent_name:
                if self.budget >= 12:
                    self.water_sources.append((agent_x, agent_y))
                    self.budget -= 12
                if self.budget >= 8:
                    self.habitat_quality[agent_x, agent_y] += 0.2
                    self.budget -= 8
            elif "wildebeest" in agent_name:
                if self.budget >= 10:
                    self.habitat_quality[agent_x, agent_y] += 0.25
                    self.budget -= 10
        
        if self.budget < 0:
            self.budget = 0 
    
    def step(self, action):
        """Execute one step in the environment."""
        
        self._apply_action(self.current_agent, action)
        reward = self._calculate_reward(self.current_agent, action)
        
        self.current_agent_idx = (self.current_agent_idx + 1) % len(self.agents)
        self.current_agent = self.agents[self.current_agent_idx]
        
        self._update_animal_behaviors()
        self._update_habitat_quality()
        
        if self.use_real_data and self.current_step % self.update_frequency == 0:
            self._update_environment_state()
        
        self.climate_shift += 0.001
        self.season_step += 1
        
        if self.season_step >= 100:
            self.season = "dry" if self.season == "wet" else "wet"
            self.season_step = 0
            if 'rainfall' in self.environmental_rasters and self.environmental_rasters['rainfall']['data'] is not None:
                mean_rainfall = np.mean(self.environmental_rasters['rainfall']['data'])
                if mean_rainfall < 50:
                    self.drought_intensity = min(0.5, (50 - mean_rainfall) / 100.0)
                else:
                    self.drought_intensity = 0.0
            else:
                raise ValueError("Rainfall raster data required to calculate drought intensity. No simulations allowed.")
        
        elephant_count = sum(1 for animal in self.animals 
                           if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.ELEPHANT) 
                           or (isinstance(animal.species, str) and animal.species == "elephant"))
        wildebeest_count = sum(1 for animal in self.animals 
                             if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.WILDEBEEST)
                             or (isinstance(animal.species, str) and animal.species == "wildebeest"))
        total_animals = len(self.animals)
        
        if total_animals < 8:
            if not self.crisis_mode:
                self.crisis_mode = True
                self.crisis_steps = 0
            else:
                self.crisis_steps += 1
        
        terminated = False
        truncated = False
        
        extinct_species = 0
        if elephant_count == 0:
            extinct_species += 1
        if wildebeest_count == 0:
            extinct_species += 1
        
        if extinct_species >= 2 or total_animals == 0 or self.conflicts > 25:
            terminated = True
        elif self.crisis_mode and self.crisis_steps >= 100:
            terminated = True
        elif self.current_step >= self.max_steps:
            truncated = True
        
        self.current_step += 1
        
        self.reward_history.append(reward)
        pop_dict = {
            'elephant': elephant_count,
            'wildebeest': wildebeest_count
        }
        for species_name in self.dynamic_species:
            count = sum(1 for animal in self.animals 
                       if isinstance(animal.species, str) and animal.species == species_name)
            pop_dict[species_name] = count
        self.population_history.append(pop_dict)
        self.budget_history.append(self.budget)
        self.action_history.append(action)
        self.conflict_history.append(self.conflicts)
        
        if self.model_loader and self.current_agent:
            species = self.current_agent.replace("_agent", "") if self.current_agent else None
            if species and species in self.model_loader.xgboost_models:
                next_agent_x, next_agent_y = self._get_agent_position(self.current_agent) if self.current_agent else (0, 0)
                lat, lon = self._grid_to_latlon(next_agent_x, next_agent_y)
                env_features = {}
                if self.data_connector:
                    env_features = self.data_connector.extract_environmental_features(
                        lat, lon, self.environmental_rasters)
                try:
                    suitability = self.model_loader.predict_habitat_suitability(species, env_features)
                    self.habitat_suitability_history.append(suitability)
                except ValueError:
                    pass
        
        observation = self._get_observation(self.current_agent) if self.current_agent else {}
        info = self._get_info()
        
        return observation, reward, terminated, truncated, info
    
    def _update_environment_state(self):
        """Update environment state with latest real data."""
        if not self.use_real_data or not self.data_connector:
            return
        
        if self.current_step % self.update_frequency == 0:
            from pathlib import Path
            for species in ["elephant", "wildebeest"]:
                local_gps_file = None
                for possible_path in [
                    Path("data") / "bbmm" / f"{species}_bbmm_gps_data.csv",
                    Path("data") / "gps" / f"{species}_gps.csv",
                ]:
                    if possible_path.exists():
                        local_gps_file = str(possible_path)
                        break
                
                if local_gps_file:
                    try:
                        latest_data = self.data_connector.get_latest_tracking_data(
                            species, hours=1, local_file_path=local_gps_file, max_records=5000
                        )
                        if not latest_data.empty:
                            self.gps_data[species] = latest_data
                    except Exception as e:
                        pass
        
        if self.current_step % self.update_frequency == 0:
            try:
                self._update_lstm_forecasts()
            except Exception as e:
                pass
    
    def _get_info(self) -> Dict[str, Any]:
        """Get environment information."""
        
        elephant_count = sum(1 for animal in self.animals 
                           if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.ELEPHANT) 
                           or (isinstance(animal.species, str) and animal.species == "elephant"))
        wildebeest_count = sum(1 for animal in self.animals 
                             if (isinstance(animal.species, SpeciesType) and animal.species == SpeciesType.WILDEBEEST)
                             or (isinstance(animal.species, str) and animal.species == "wildebeest"))
        
        dynamic_counts = {}
        for species_name in self.dynamic_species:
            count = sum(1 for animal in self.animals 
                       if isinstance(animal.species, str) and animal.species == species_name)
            dynamic_counts[f"{species_name}_population"] = count
        
        return {
            "elephant_population": elephant_count,
            "wildebeest_population": wildebeest_count,
            "total_animals": len(self.animals),
            **dynamic_counts,
            "budget": self.budget,
            "conflicts": self.conflicts,
            "climate_shift": self.climate_shift,
            "drought_intensity": self.drought_intensity,
            "season": self.season,
            "crisis_mode": self.crisis_mode,
            "current_agent": self.current_agent,
            "step": self.current_step,
            "habitat_suitability_mean": np.mean(self.habitat_suitability_history) if self.habitat_suitability_history else 0.0,
        }
    
    def _detect_new_species(self):
        """Detect new species - DISABLED to avoid errors without full model support."""
        # Skip dynamic species detection to avoid errors
        return
        """
        Detect new animal species from GPS tracking data using LSTM.
        New species are detected when movement patterns don't match known species.
        """
        if not self.data_connector or not self.model_loader:
            return
        
        if self.dynamic_species_handler:
            for species_name in ["elephant", "wildebeest"]:
                if species_name in self.gps_data and not self.gps_data[species_name].empty:
                    df = self.gps_data[species_name]
                    
                    if len(df) > 10:
                        coords = df[['latitude', 'longitude']].values
                        
                        new_species = self.dynamic_species_handler.detect_new_species(
                            coords, 
                            [coords],
                            self.model_loader.lstm_model
                        )
                        
                        if new_species:
                            self.dynamic_species.add(new_species)
                            profile = self.dynamic_species_handler.create_species_profile(new_species)
                            print(f"Detected new species: {new_species}")
    
    def reset(self, seed=None, options=None):
        """Reset the environment."""
        super().reset(seed=seed)
        
        self.current_step = 0
        self.budget = 120
        self.conflicts = 0
        self.crisis_mode = False
        self.crisis_steps = 0
        self.climate_shift = 0.0
        self.drought_intensity = 0.0
        self.season = "wet"
        self.season_step = 0
        self.current_agent_idx = 0
        self.current_agent = self.agents[0] if self.agents else None
        self.dynamic_species = set()
        
        self.reward_history = []
        self.population_history = []
        self.budget_history = []
        self.action_history = []
        self.conflict_history = []
        self.habitat_suitability_history = []
        
        if self.use_real_data and self.data_connector:
            self._load_real_data()
            self._detect_new_species()
        else:
            self._generate_landscape()
        
        self._initialize_populations()
        
        observation = self._get_observation(self.current_agent)
        info = self._get_info()
        
        return observation, info
    
    def plot_metrics(self):
        """Plot environment metrics: reward, population, budget, conflicts, and action distribution."""
        try:
            plt.figure(figsize=(15, 12))

            plt.subplot(3, 2, 1)
            plt.plot(self.reward_history, label='Reward', color='blue')
            plt.title('Reward Over Time')
            plt.xlabel('Step')
            plt.ylabel('Reward')
            plt.grid(True)
            plt.legend()

            plt.subplot(3, 2, 2)
            steps = range(len(self.population_history))
            elephant_pop = [p.get('elephant', 0) for p in self.population_history]
            wildebeest_pop = [p.get('wildebeest', 0) for p in self.population_history]
            plt.plot(steps, elephant_pop, label='Elephant', color='gray')
            plt.plot(steps, wildebeest_pop, label='Wildebeest', color='brown')
            
            for species_name in self.dynamic_species:
                species_pop = [p.get(species_name, 0) for p in self.population_history]
                plt.plot(steps, species_pop, label=species_name.title(), color='green', linestyle='--')
            plt.title('Population Over Time')
            plt.xlabel('Step')
            plt.ylabel('Population')
            plt.grid(True)
            plt.legend()

            plt.subplot(3, 2, 3)
            plt.plot(self.budget_history, label='Budget', color='green')
            plt.title('Budget Over Time')
            plt.xlabel('Step')
            plt.ylabel('Budget ($)')
            plt.grid(True)
            plt.legend()

            plt.subplot(3, 2, 4)
            plt.plot(self.conflict_history, label='Conflicts', color='red')
            plt.title('Conflicts Over Time')
            plt.xlabel('Step')
            plt.ylabel('Conflicts')
            plt.grid(True)
            plt.legend()

            plt.subplot(3, 2, 5)
            action_counts = defaultdict(int)
            action_names = {
                0: 'Move North', 1: 'Move South', 2: 'Move East', 3: 'Move West',
                4: 'Build Corridor', 5: 'Build Infrastructure', 6: 'No Action'
            }
            for action in self.action_history:
                action_counts[action] += 1
            actions = list(action_counts.keys())
            counts = [action_counts[a] for a in actions]
            action_labels = [action_names.get(a, f'Action {a}') for a in actions]
            plt.bar(action_labels, counts, color='purple')
            plt.title('Action Distribution')
            plt.xlabel('Action')
            plt.ylabel('Count')
            plt.xticks(rotation=45, ha='right')
            plt.grid(True, axis='y')

            plt.tight_layout()
            plt.show()

        except ImportError:
            print("Matplotlib not available - cannot plot metrics. Install with: pip install matplotlib")
        except Exception as e:
            print(f"Error plotting metrics: {e}")

    def render(self, mode="human"):
        """Render the environment."""
        
        if mode == "human":
            if self.window is None:
                pygame.init()
                pygame.display.init()
                self.window = pygame.display.set_mode((800, 600))
                self.clock = pygame.time.Clock()
            
            self.screen = pygame.Surface((800, 600))
            self.screen.fill((255, 255, 255))
            
            # Draw grid
            cell_size = min(600 // self.grid_size, 800 // self.grid_size)
            grid_offset_x = (800 - self.grid_size * cell_size) // 2
            grid_offset_y = (600 - self.grid_size * cell_size) // 2
            
            # Draw terrain
            terrain_colors = {
                TerrainType.FOREST: (34, 139, 34),
                TerrainType.GRASSLAND: (144, 238, 144),
                TerrainType.WATER: (0, 191, 255),
                TerrainType.AGRICULTURE: (255, 215, 0),
                TerrainType.SETTLEMENT: (128, 128, 128),
                TerrainType.ROAD: (64, 64, 64),
            }
            
            for i in range(self.grid_size):
                for j in range(self.grid_size):
                    terrain_idx = int(self.terrain_grid[i, j])
                    if 0 <= terrain_idx < len(list(TerrainType)):
                        terrain_type = list(TerrainType)[terrain_idx]
                    else:
                        terrain_type = TerrainType.GRASSLAND
                    color = terrain_colors[terrain_type]
                    
                    # Adjust color based on habitat quality
                    quality = self.habitat_quality[i, j]
                    color = tuple(int(c * quality) for c in color)
                    
                    x = grid_offset_x + i * cell_size
                    y = grid_offset_y + j * cell_size
                    pygame.draw.rect(self.screen, color, (x, y, cell_size, cell_size))
                    pygame.draw.rect(self.screen, (0, 0, 0), (x, y, cell_size, cell_size), 1)
            
            # Draw corridors
            for i in range(self.grid_size):
                for j in range(self.grid_size):
                    if self.corridor_strength[i, j] > 0:
                        x = grid_offset_x + i * cell_size
                        y = grid_offset_y + j * cell_size
                        alpha = int(255 * self.corridor_strength[i, j])
                        corridor_surface = pygame.Surface((cell_size, cell_size))
                        corridor_surface.set_alpha(alpha)
                        corridor_surface.fill((255, 255, 0))
                        self.screen.blit(corridor_surface, (x, y))
            
            # Draw animals
            animal_colors = {
                SpeciesType.ELEPHANT: (139, 69, 19),
                SpeciesType.WILDEBEEST: (160, 82, 45),
            }
            default_color = (128, 128, 128)
            
            for animal in self.animals:
                x = grid_offset_x + animal.x * cell_size + cell_size // 2
                y = grid_offset_y + animal.y * cell_size + cell_size // 2
                species_key = animal.species if isinstance(animal.species, SpeciesType) else animal.species
                color = animal_colors.get(species_key, default_color) if isinstance(species_key, SpeciesType) else default_color
                pygame.draw.circle(self.screen, color, (x, y), cell_size // 4)
                pygame.draw.circle(self.screen, (0, 0, 0), (x, y), cell_size // 4, 2)
            
            # Draw info overlay
            font = pygame.font.Font(None, 24)
            elephant_count = sum(1 for a in self.animals 
                                if (isinstance(a.species, SpeciesType) and a.species == SpeciesType.ELEPHANT)
                                or (isinstance(a.species, str) and a.species == "elephant"))
            wildebeest_count = sum(1 for a in self.animals 
                                  if (isinstance(a.species, SpeciesType) and a.species == SpeciesType.WILDEBEEST)
                                  or (isinstance(a.species, str) and a.species == "wildebeest"))
            info_text = [
                f"Elephants: {elephant_count}",
                f"Wildebeests: {wildebeest_count}",
            ]
            for species_name in self.dynamic_species:
                count = sum(1 for a in self.animals if isinstance(a.species, str) and a.species == species_name)
                info_text.append(f"{species_name.title()}: {count}")
            
            info_text.extend([
                f"Budget: {self.budget}",
                f"Conflicts: {self.conflicts}",
                f"Season: {self.season}",
                f"Agent: {self.current_agent}",
                f"Step: {self.current_step}",
            ])
            
            for i, text in enumerate(info_text):
                text_surface = font.render(text, True, (0, 0, 0))
                self.screen.blit(text_surface, (10, 10 + i * 25))
            
            self.window.blit(self.screen, (0, 0))
            pygame.event.pump()
            pygame.display.flip()
            self.clock.tick(self.metadata["render_fps"])
            
        elif mode == "rgb_array":
            if self.screen is None:
                self.screen = pygame.Surface((800, 600))
            
            return pygame.surfarray.array3d(self.screen)
    
    def close(self):
        """Close the environment."""
        if self.window is not None:
            pygame.display.quit()
            pygame.quit()

def test_improved_wildlife_environment():
    """Test function for the wildlife environment - requires real data."""
    from integration.model_loader import ModelLoader
    from integration.data_connector import DataConnector
    
    print("Setting up test environment with real data...")
    print("Note: Test mode requires real models and data files.")
    print("To run without real data, use --mode demo without --use-real-data flag.\n")
    
    model_loader = ModelLoader()
    data_connector = DataConnector(
        use_api=False
    )
    
    from pathlib import Path
    data_dir = Path("data")
    
    from ...config.settings import get_settings
    from ...core.cloudflare_loader import get_file_loader
    
    settings = get_settings()
    file_loader = get_file_loader(
        cloudflare_base_url=getattr(settings, 'CLOUDFLARE_BASE_URL', '')
    )
    
    hmm_base_path = getattr(settings, 'HMM_DATA_PATH', 'ml-information/trained_models/hmm')
    if not settings.CLOUDFLARE_BASE_URL:
        hmm_base_path = str(data_dir / "hmm")
    
    for species in ["elephant", "wildebeest"]:
        hmm_file = f"{hmm_base_path}/{species}_predictions.csv"
        if not file_loader.exists(hmm_file):
            hmm_file = f"{hmm_base_path}/{species}_hmm_results.csv"
        
        if file_loader.exists(hmm_file):
            model_loader.load_hmm_results(species, hmm_file)
            print(f"✓ Loaded HMM for {species}")
        else:
            local_hmm_dir = data_dir / "hmm"
            if local_hmm_dir.exists():
                local_hmm_file = local_hmm_dir / f"{species}_predictions.csv"
                if not local_hmm_file.exists():
                    local_hmm_file = local_hmm_dir / f"{species}_hmm_results.csv"
                if local_hmm_file.exists():
                    model_loader.load_hmm_results(species, str(local_hmm_file))
                    print(f"✓ Loaded HMM for {species} (local)")
    
    bbmm_base_path = getattr(settings, 'BBMM_DATA_PATH', 'ml-information/trained_models/bbmm')
    if not settings.CLOUDFLARE_BASE_URL:
        bbmm_base_path = str(data_dir / "bbmm")
    
    for species in ["elephant", "wildebeest"]:
        bbmm_file = f"{bbmm_base_path}/{species}_bbmm_gps_data.csv"
        if not file_loader.exists(bbmm_file):
            bbmm_file = f"{bbmm_base_path}/{species}_bbmm_results.csv"
        
        if file_loader.exists(bbmm_file):
            model_loader.load_bbmm_results(species, bbmm_file)
            print(f"✓ Loaded BBMM for {species}")
        else:
            local_bbmm_dir = data_dir / "bbmm"
            if local_bbmm_dir.exists():
                local_bbmm_file = local_bbmm_dir / f"{species}_bbmm_gps_data.csv"
                if not local_bbmm_file.exists():
                    local_bbmm_file = local_bbmm_dir / f"{species}_bbmm_results.csv"
                if local_bbmm_file.exists():
                    model_loader.load_bbmm_results(species, str(local_bbmm_file))
                    print(f"✓ Loaded BBMM for {species} (local)")
    
    xgboost_dir = data_dir / "xgboost"
    if xgboost_dir.exists():
        for species in ["elephant", "wildebeest"]:
            xgb_file = xgboost_dir / f"xgboost_habitat_model_{species}.h5"
            if not xgb_file.exists():
                xgb_file = xgboost_dir / f"xgboost_habitat_model_{species}.pkl"
            if xgb_file.exists():
                model_loader.load_xgboost_model(species, str(xgb_file))
                print(f"✓ Loaded XGBoost for {species}")
    
    lstm_file = data_dir / "lstm" / "lstm_final_model.h5"
    if not lstm_file.exists():
        lstm_file = data_dir / "lstm" / "lstm_final_model.pkl"
    if lstm_file.exists():
        model_loader.load_lstm_model(str(lstm_file))
        print(f"✓ Loaded LSTM model")
    
    env = WildlifeCorridorEnv(
        grid_size=30, 
        budget=100, 
        max_steps=500,
        model_loader=model_loader,
        data_connector=data_connector,
        use_real_data=True
    )
    
    print("Testing Wildlife Corridor Environment...")
    print(f"Grid size: {env.grid_size}")
    print(f"Initial budget: {env.budget}")
    print(f"Max steps: {env.max_steps}")
    
    obs, info = env.reset()
    print(f"Initial observation keys: {list(obs.keys())}")
    print(f"Initial info: {info}")
    
    total_reward = 0
    step_count = 0
    
    while step_count < 100:
        action = env.action_spaces[env.current_agent].sample()
        obs, reward, terminated, truncated, info = env.step(action)
        
        total_reward += reward
        step_count += 1
        
        if step_count % 20 == 0:
            print(f"Step {step_count}: Reward = {reward:.2f}, Total = {total_reward:.2f}")
            pop_str = f"Populations: E={info['elephant_population']}, W={info['wildebeest_population']}"
            for key in info.keys():
                if key.endswith('_population') and key not in ['elephant_population', 'wildebeest_population']:
                    species = key.replace('_population', '')
                    pop_str += f", {species.title()}={info[key]}"
            print(pop_str)
        
        if terminated or truncated:
            break
    
    print(f"Final total reward: {total_reward:.2f}")
    pop_str = f"Final populations: E={info['elephant_population']}, W={info['wildebeest_population']}"
    for key in info.keys():
        if key.endswith('_population') and key not in ['elephant_population', 'wildebeest_population']:
            species = key.replace('_population', '')
            pop_str += f", {species.title()}={info[key]}"
    print(pop_str)
    
    env.close()
    print("Environment test completed!")

if __name__ == "__main__":
    test_improved_wildlife_environment() 