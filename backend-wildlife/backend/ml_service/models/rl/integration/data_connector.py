"""
Data Connector Module for Real-Time Tracking and Environmental Data
Connects to tracking API and loads environmental rasters
"""

import os
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    import rasterio
    from rasterio.transform import from_bounds
except ImportError:
    print("Warning: rasterio not available. Raster loading will be limited.")
    rasterio = None
    from_bounds = None

class DataConnector:
    """
    Connect to Wildlife Backend:
    - Django Backend (Port 8000): GPS tracking, animals, predictions, corridors
    - ML Service (Port 8001): Real-time ML predictions (movement, habitat, corridor optimization)
    """
    
    def __init__(self, api_base_url: str = None, ml_service_url: str = None, 
                 api_key: str = None, token: str = None, cache_dir: str = "data_cache",
                 use_api: bool = False):
        """
        DataConnector - loads data from local files only by default.
        
        Args:
            use_api: If False (default), only loads from local files. Set True to enable API calls.
        """
        # API settings (only used if use_api=True)
        self.use_api = use_api
        self.api_base_url = api_base_url or os.getenv('DJANGO_API_URL', 'http://localhost:8000/api/v1') if use_api else None
        self.ml_service_url = ml_service_url or os.getenv('ML_SERVICE_URL', 'http://localhost:8001/api/v1/ml') if use_api else None
        self.api_key = api_key or os.getenv('ML_API_KEY', '') if use_api else None
        self.token = token or os.getenv('DJANGO_TOKEN', '') if use_api else None
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        self.gps_cache = {}
        self.raster_cache = {}
        self.last_update = {}
        
    def fetch_gps_data(self, species: str, start_date: str = None, end_date: str = None, 
                      bbox: Tuple[float, float, float, float] = None, use_cache: bool = True) -> pd.DataFrame:
        """
        Fetch GPS tracking data from API.
        
        Args:
            species: Species name (e.g., 'elephant', 'wildebeest')
            start_date: Start date in ISO format
            end_date: End date in ISO format
            bbox: Bounding box (min_lon, min_lat, max_lon, max_lat)
            use_cache: Whether to use cached data if available
        """
        cache_key = f"{species}_{start_date}_{end_date}"
        
        # Check cache
        if use_cache and cache_key in self.gps_cache:
            cache_time = self.last_update.get(cache_key, datetime.min)
            if (datetime.now() - cache_time).seconds < 3600:  # Cache valid for 1 hour
                return self.gps_cache[cache_key]
        
        # Skip API calls if not enabled
        if not self.use_api or not self.api_base_url:
            return pd.DataFrame()
        
        try:
            # Build API request
            params = {
                'species': species,
                'format': 'json'
            }
            
            if start_date:
                params['start_date'] = start_date
            if end_date:
                params['end_date'] = end_date
            if bbox:
                params['bbox'] = ','.join(map(str, bbox))
            
            # Make API request to Django backend tracking endpoint
            headers = {}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
            
            response = requests.get(
                f"{self.api_base_url}/tracking/",
                params=params,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Convert to DataFrame
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                elif 'results' in data:
                    df = pd.DataFrame(data['results'])
                else:
                    df = pd.DataFrame([data])
                
                # Validate and standardize columns
                required_cols = ['timestamp', 'latitude', 'longitude']
                for col in required_cols:
                    if col not in df.columns:
                        # Try alternative column names
                        alt_names = {
                            'timestamp': ['time', 'date', 'datetime'],
                            'latitude': ['lat', 'y'],
                            'longitude': ['lon', 'lng', 'x']
                        }
                        for alt in alt_names.get(col, []):
                            if alt in df.columns:
                                df[col] = df[alt]
                                break
                
                # Cache data
                self.gps_cache[cache_key] = df
                self.last_update[cache_key] = datetime.now()
                
                # Save to disk cache
                cache_file = self.cache_dir / f"gps_{cache_key}.csv"
                df.to_csv(cache_file, index=False)
                
                print(f"Fetched {len(df)} GPS records for {species}")
                return df
            else:
                print(f"API request failed: {response.status_code}")
                return self._load_cached_data(cache_key, species)
                
        except Exception as e:
            print(f"Error fetching GPS data: {e}")
            return self._load_cached_data(cache_key, species)
    
    def _load_cached_data(self, cache_key: str, species: str) -> pd.DataFrame:
        """Load cached data from disk if API fails."""
        cache_file = self.cache_dir / f"gps_{cache_key}.csv"
        
        if cache_file.exists():
            df = pd.read_csv(cache_file)
            print(f"Loaded cached GPS data for {species}")
            return df
        
        # Return empty DataFrame if no cache
        return pd.DataFrame(columns=['timestamp', 'latitude', 'longitude'])
    
    def load_environmental_raster(self, raster_type: str, raster_path: str = None, 
                                  bbox: Tuple[float, float, float, float] = None) -> Dict[str, Any]:
        """
        Load environmental raster (NDVI, rainfall, elevation, land cover).
        
        Args:
            raster_type: Type of raster ('ndvi', 'rainfall', 'elevation', 'landcover')
            raster_path: Path to raster file (optional, for local files)
            bbox: Bounding box for cropping (min_lon, min_lat, max_lon, max_lat)
        
        Returns:
            Dict with 'data' (numpy array), 'transform', 'bounds', 'crs'
        """
        cache_key = f"{raster_type}_{raster_path}_{bbox}"
        
        # Check memory cache
        if cache_key in self.raster_cache:
            return self.raster_cache[cache_key]
        
        try:
            if raster_path and Path(raster_path).exists():
                # Load from local file
                with rasterio.open(raster_path) as src:
                    data = src.read(1)  # Read first band
                    transform = src.transform
                    bounds = src.bounds
                    crs = src.crs
                    
                    # Crop to bbox if provided and valid
                    if bbox and len(bbox) == 4:
                        try:
                            # Ensure bbox is valid (min_lon, min_lat, max_lon, max_lat)
                            # Check if bbox overlaps with raster bounds
                            raster_min_lon, raster_min_lat, raster_max_lon, raster_max_lat = bounds
                            bbox_min_lon, bbox_min_lat, bbox_max_lon, bbox_max_lat = bbox
                            
                            # Only crop if bbox overlaps with raster
                            if (bbox_max_lon > raster_min_lon and bbox_min_lon < raster_max_lon and
                                bbox_max_lat > raster_min_lat and bbox_min_lat < raster_max_lat):
                                from rasterio.windows import from_bounds
                                window = from_bounds(
                                    bbox_min_lon, bbox_min_lat, bbox_max_lon, bbox_max_lat, 
                                    transform, boundless=False
                                )
                                cropped_data = src.read(1, window=window)
                                # Only use cropped data if it's not empty
                                if cropped_data.size > 0 and cropped_data.shape[0] > 0 and cropped_data.shape[1] > 0:
                                    data = cropped_data
                                    transform = src.window_transform(window)
                        except Exception:
                            # If cropping fails, use full raster
                            pass
                    
                    # Validate data is not empty
                    if data is None or data.size == 0 or data.shape[0] == 0 or data.shape[1] == 0:
                        return None
                    
                    result = {
                        'data': data,
                        'transform': transform,
                        'bounds': bounds,
                        'crs': crs,
                        'raster_type': raster_type
                    }
                    
                    # Cache result
                    self.raster_cache[cache_key] = result
                    
                    return result
            
            else:
                # Skip API calls - return None (will use GPS data fallback)
                if self.use_api:
                    return self._fetch_raster_from_api(raster_type, bbox)
                return None
                
        except Exception as e:
            # Return None instead of raising - will be handled by environment generating from GPS data
            return None
    
    def _fetch_raster_from_api(self, raster_type: str, bbox: Tuple[float, float, float, float]) -> Dict[str, Any]:
        """Fetch raster from API (placeholder - implement based on your API)."""
        # This would make an API call to fetch raster tiles
        # No simulations - raise error if real data unavailable
        raise ValueError(f"Real raster data for '{raster_type}' is required but not available. Please ensure raster files are provided or API is accessible.")
    
    def extract_environmental_features(self, lat: float, lon: float, 
                                       rasters: Dict[str, Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Extract environmental features at a specific location.
        
        Args:
            lat: Latitude
            lon: Longitude
            rasters: Dict of loaded rasters (from load_environmental_raster)
        
        Returns:
            Dict of environmental features
        """
        features = {}
        
        if rasters is None:
            # Load real rasters only - no defaults
            rasters = {
                'ndvi': self.load_environmental_raster('ndvi'),
                'rainfall': self.load_environmental_raster('rainfall'),
                'elevation': self.load_environmental_raster('elevation'),
                'landcover': self.load_environmental_raster('landcover')
            }
        
        # Extract values at location (simplified - would need proper coordinate transformation)
        # This assumes rasters are in the same coordinate system and spatial extent
        for raster_type, raster_data in rasters.items():
            data = raster_data['data']
            
            # Simple extraction (replace with proper coordinate transformation)
            # In practice, use rasterio to sample at exact coordinates
            if data is not None and data.size > 0:
                # Use center of raster as approximation
                mid_y, mid_x = data.shape[0] // 2, data.shape[1] // 2
                value = float(data[mid_y, mid_x])
                
                if raster_type == 'ndvi':
                    features['ndvi'] = np.clip(value, 0, 1) if not np.isnan(value) else 0.5
                elif raster_type == 'rainfall':
                    features['rainfall'] = max(0, value) if not np.isnan(value) else 0.0
                elif raster_type == 'elevation':
                    features['elevation'] = value if not np.isnan(value) else 1000.0
                elif raster_type == 'landcover':
                    # Convert to one-hot encoding
                    landcover_value = int(value) if not np.isnan(value) else 2
                    features['landcover'] = landcover_value
                    features['landcover_forest'] = 1.0 if landcover_value == 1 else 0.0
                    features['landcover_grassland'] = 1.0 if landcover_value == 2 else 0.0
                    features['landcover_agriculture'] = 1.0 if landcover_value == 3 else 0.0
                    features['landcover_settlement'] = 1.0 if landcover_value == 4 else 0.0
        
        # Add distance features (required by XGBoost model)
        # These would ideally be calculated from actual geospatial layers
        # For now, use placeholders or call ML service for better predictions
        features['distance_to_water'] = features.get('distance_to_water', 5000.0)
        features['distance_to_settlement'] = features.get('distance_to_settlement', 10000.0)
        features['distance_to_roads'] = features.get('distance_to_roads', 3000.0)  # XGBoost expects this
        features['distance_to_protected_areas'] = features.get('distance_to_protected_areas', 2000.0)  # XGBoost expects this
        
        return features
    
    def get_habitat_prediction_from_ml_service(self, lat: float, lon: float, species: str, 
                                               radius_km: float = 10.0) -> Dict[str, float]:
        """
        Get habitat suitability prediction from ML service (real-time).
        Falls back to local XGBoost if ML service unavailable.
        """
        if not self.api_key:
            return {}
        
        try:
            headers = {'Authorization': f'Bearer {self.api_key}'}
            payload = {
                'lat': lat,
                'lon': lon,
                'species': species,
                'radius_km': radius_km
            }
            
            response = requests.post(
                f"{self.ml_service_url}/habitat/predict",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'suitability_score': result.get('suitability_score', 0.5),
                    'factors': result.get('factors', {})
                }
        except Exception as e:
            print(f"ML service habitat prediction failed: {e}")
        
        return {}
    
    def get_latest_tracking_data(self, species: str, hours: int = 24, 
                                 local_file_path: str = None,
                                 max_records: int = None) -> pd.DataFrame:
        """
        Get latest tracking data from API or local file.
        
        Args:
            species: Species name (e.g., 'elephant', 'wildebeest')
            hours: Hours of data to fetch (if using API)
            local_file_path: Optional path to local CSV file with GPS data
                           If provided, will load from file instead of API
        
        Returns:
            DataFrame with GPS tracking data
        """
        # If local file is provided, load from file instead of API
        if local_file_path and Path(local_file_path).exists():
            try:
                df = pd.read_csv(local_file_path)
                # Ensure required columns exist - check various formats
                if 'Latitude' in df.columns:
                    df['latitude'] = df['Latitude']
                elif 'latitude' not in df.columns and 'lat' in df.columns:
                    df['latitude'] = df['lat']
                
                if 'Longitude' in df.columns:
                    df['longitude'] = df['Longitude']
                elif 'longitude' not in df.columns and 'lon' in df.columns:
                    df['longitude'] = df['lon']
                
                # Movebank format (separate check)
                if 'location-lat' in df.columns and 'latitude' not in df.columns:
                    df['latitude'] = df['location-lat']
                if 'location-long' in df.columns and 'longitude' not in df.columns:
                    df['longitude'] = df['location-long']
                
                if 'timestamp' not in df.columns:
                    if 'time' in df.columns:
                        df['timestamp'] = df['time']
                    elif 'UTC_Date' in df.columns and 'UTC_Time' in df.columns:
                        df['timestamp'] = pd.to_datetime(df['UTC_Date'] + ' ' + df['UTC_Time'], errors='coerce')
                
                # Check if we actually have GPS coordinates
                if 'latitude' not in df.columns or 'longitude' not in df.columns:
                    print(f"Warning: {local_file_path} does not contain GPS coordinates (latitude/longitude columns)")
                    return pd.DataFrame()  # Return empty if no GPS data
                
                # Optionally limit number of records for performance
                if max_records is not None and max_records > 0 and len(df) > max_records:
                    df = df.head(max_records)
                print(f"Loaded {len(df)} GPS records for {species} from {local_file_path}")
                return df
            except Exception as e:
                print(f"Error loading GPS data from {local_file_path}: {e}")
                # Skip API if disabled
                if not self.use_api:
                    return pd.DataFrame()
        
        # Try API (only if enabled)
        if not self.use_api:
            return pd.DataFrame()
        end_date = datetime.now()
        start_date = end_date - timedelta(hours=hours)
        
        return self.fetch_gps_data(
            species=species,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )
    
    def update_cache(self, clear_old: bool = True, max_age_hours: int = 24):
        """Update and clean cache."""
        if clear_old:
            current_time = datetime.now()
            for key, update_time in list(self.last_update.items()):
                age = (current_time - update_time).total_seconds() / 3600
                if age > max_age_hours:
                    del self.gps_cache[key]
                    del self.last_update[key]
                    print(f"Cleared old cache: {key}")

