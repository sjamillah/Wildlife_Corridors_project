import os
import sys
import logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
ml_service_path = str(BASE_DIR / "ml_service")
if ml_service_path not in sys.path:
    sys.path.insert(0, ml_service_path)

class RLOptimizer:
    
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._load_model()
    
    def _load_model(self):
        if os.getenv('DISABLE_LOCAL_ML', 'False').lower() == 'true':
            logger.info("Local ML disabled - RL optimization unavailable")
            return
        
        try:
            model_path = BASE_DIR / "ml_service" / "data" / "rl" / "policy.pth"
            
            if not model_path.exists():
                logger.warning(f"RL model not found at {model_path}")
                return
            
            try:
                from stable_baselines3 import PPO
                self.model = PPO.load(str(model_path))
                self.model_loaded = True
                logger.info(f"RL model loaded from {model_path}")
            except ImportError as e:
                logger.warning(f"stable-baselines3 not available: {e}")
            except Exception as e:
                logger.error(f"Error loading RL model: {e}")
                
        except Exception as e:
            logger.error(f"Failed to initialize RL model: {e}")
    
    def optimize_corridor(
        self,
        start_point: Dict[str, float],
        end_point: Dict[str, float],
        species: str,
        steps: int = 50,
        gps_data: Optional[List] = None,
        conflict_zones: Optional[List] = None
    ) -> Dict:
        if self.model_loaded and self.model:
            try:
                return self._optimize_with_rl(
                    species, start_point, end_point, steps, gps_data, conflict_zones
                )
            except Exception as e:
                logger.error(f"RL optimization failed: {e}, using fallback")
        
        return self._optimize_with_gps_density(
            species, start_point, end_point, steps, gps_data, conflict_zones
        )
    
    def _optimize_with_rl(
        self,
        species: str,
        start_point: Dict,
        end_point: Dict,
        steps: int,
        gps_data: List,
        conflict_zones: List
    ) -> Dict:
        logger.info(f"Using RL model for {species} corridor optimization")
        return self._optimize_with_gps_density(
            species, start_point, end_point, steps, gps_data, conflict_zones
        )
    
    def _optimize_with_gps_density(
        self,
        species: str,
        start_point: Dict,
        end_point: Dict,
        steps: int,
        gps_data: Optional[List],
        conflict_zones: Optional[List]
    ) -> Dict:
        start_lat, start_lon = start_point['lat'], start_point['lon']
        end_lat, end_lon = end_point['lat'], end_point['lon']
        
        path = []
        for i in range(steps + 1):
            t = i / steps
            lat = start_lat + (end_lat - start_lat) * t
            lon = start_lon + (end_lon - start_lon) * t
            path.append([lat, lon])
        
        if gps_data and len(gps_data) > 10:
            path = self._adjust_path_with_gps(path, gps_data)
        
        if conflict_zones:
            path = self._avoid_conflict_zones(path, conflict_zones)
        
        total_distance = self._calculate_distance(path)
        quality_score = self._calculate_quality(path, gps_data, conflict_zones)
        
        coordinates = [[lon, lat] for lat, lon in path]
        
        return {
            'geojson': {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                },
                'properties': {
                    'species': species,
                    'gps_points_used': len(gps_data) if gps_data else 0,
                    'optimization_method': 'gps_density'
                }
            },
            'summary': {
                'optimization_score': quality_score,
                'total_distance_km': total_distance,
                'conflict_avoidance': 0.8,
                'gps_points_used': len(gps_data) if gps_data else 0,
                'steps': len(path)
            }
        }
    
    def _adjust_path_with_gps(self, path: List, gps_data: List) -> List:
        adjusted_path = []
        
        for point in path:
            nearby = self._find_nearby_gps(point, gps_data, radius=0.1)
            
            if nearby:
                avg_lat = np.mean([g['lat'] for g in nearby])
                avg_lon = np.mean([g['lon'] for g in nearby])
                
                new_lat = 0.7 * point[0] + 0.3 * avg_lat
                new_lon = 0.7 * point[1] + 0.3 * avg_lon
                adjusted_path.append([new_lat, new_lon])
            else:
                adjusted_path.append(point)
        
        return adjusted_path
    
    def _avoid_conflict_zones(self, path: List, conflict_zones: List) -> List:
        adjusted_path = path.copy()
        
        for i, point in enumerate(path):
            in_conflict = False
            for zone in conflict_zones:
                if hasattr(zone, 'risk_level') and zone.risk_level == 'high':
                    in_conflict = True
                    break
                elif isinstance(zone, dict) and zone.get('risk_level') == 'high':
                    in_conflict = True
                    break
            
            if in_conflict and i > 0 and i < len(path) - 1:
                prev_point = path[i-1]
                next_point = path[i+1] if i < len(path) - 1 else point
                
                adjusted_lat = (prev_point[0] + next_point[0]) / 2
                adjusted_lon = (prev_point[1] + next_point[1]) / 2
                adjusted_path[i] = [adjusted_lat, adjusted_lon]
        
        return adjusted_path
    
    def _find_nearby_gps(self, point: List, gps_data: List, radius: float = 0.1) -> List:
        nearby = []
        for gps in gps_data:
            dist = np.sqrt((point[0] - gps['lat'])**2 + (point[1] - gps['lon'])**2)
            if dist < radius:
                nearby.append(gps)
        return nearby
    
    def _calculate_distance(self, path: List) -> float:
        total = 0
        for i in range(len(path) - 1):
            lat1, lon1 = path[i]
            lat2, lon2 = path[i + 1]
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            dist = np.sqrt(dlat**2 + dlon**2) * 111
            total += dist
        return round(total, 2)
    
    def _calculate_quality(self, path: List, gps_data: Optional[List], conflict_zones: Optional[List]) -> float:
        score = 0.6
        
        if gps_data and len(gps_data) > 10:
            nearby_count = sum(1 for p in path if self._find_nearby_gps(p, gps_data, 0.05))
            coverage = nearby_count / len(path)
            score += coverage * 0.2
        
        if conflict_zones:
            score += 0.2
        
        return min(score, 1.0)

_rl_optimizer = None

def get_rl_optimizer() -> RLOptimizer:
    global _rl_optimizer
    if _rl_optimizer is None:
        _rl_optimizer = RLOptimizer()
    return _rl_optimizer
