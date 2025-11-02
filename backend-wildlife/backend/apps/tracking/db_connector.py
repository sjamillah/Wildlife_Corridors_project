"""
Database connector for fetching real-time GPS tracking data from Supabase
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from django.db.models import Max, Q
from django.utils import timezone

from apps.tracking.models import Tracking
from apps.animals.models import Animal
from apps.corridors.models import Corridor
from shapely.geometry import shape, LineString, Point
import json

logger = logging.getLogger(__name__)


class TrackingDBConnector:
    """
    Connects to Supabase database to fetch real-time GPS tracking data
    and corridor geometry for multi-species tracking
    """
    
    def __init__(self):
        pass
    
    def get_latest_gps_data(
        self,
        species: Optional[str] = None,
        minutes_back: int = 60,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch latest GPS tracking data from database
        
        Args:
            species: Filter by species (optional)
            minutes_back: How many minutes back to fetch data
            limit: Maximum number of records per animal
        
        Returns:
            List of GPS records with metadata
        """
        try:
            # Calculate cutoff time
            cutoff_time = timezone.now() - timedelta(minutes=minutes_back)
            
            # Get active animals
            animals_query = Animal.objects.filter(status='active')
            if species:
                animals_query = animals_query.filter(species__iexact=species)
            
            animals = list(animals_query.values('id', 'name', 'species', 'collar_id'))
            
            if not animals:
                return []
            
            animal_ids = [a['id'] for a in animals]
            
            # Get latest tracking data for each animal
            latest_tracking = Tracking.objects.filter(
                animal_id__in=animal_ids,
                timestamp__gte=cutoff_time
            ).values('animal_id').annotate(
                latest_timestamp=Max('timestamp')
            )
            
            latest_tracking_dict = {
                item['animal_id']: item['latest_timestamp']
                for item in latest_tracking
            }
            
            # Fetch full tracking records
            results = []
            for animal in animals:
                animal_id = animal['id']
                
                # Get latest record
                tracking_query = Tracking.objects.filter(
                    animal_id=animal_id,
                    timestamp=latest_tracking_dict.get(animal_id)
                ).order_by('-timestamp')
                
                if limit:
                    tracking_query = tracking_query[:limit]
                
                for tracking in tracking_query:
                    # Also get previous records for movement calculation
                    prev_tracking = Tracking.objects.filter(
                        animal_id=animal_id,
                        timestamp__lt=tracking.timestamp
                    ).order_by('-timestamp').first()
                    
                    record = {
                        'id': str(tracking.id),
                        'animal_id': str(tracking.animal_id),
                        'individual_id': animal.get('collar_id') or f"{animal['species'][:1].upper()}_{animal['id']}",
                        'species': animal['species'],
                        'name': animal['name'],
                        'lat': tracking.lat,
                        'lon': tracking.lon,
                        'timestamp': tracking.timestamp.isoformat() if hasattr(tracking.timestamp, 'isoformat') else str(tracking.timestamp),
                        'speed_kmh': tracking.speed_kmh,
                        'heading': tracking.heading,
                        'altitude': tracking.altitude,
                        'accuracy': tracking.accuracy,
                        'activity_type': tracking.activity_type,
                    }
                    
                    if prev_tracking:
                        record['prev_lat'] = prev_tracking.lat
                        record['prev_lon'] = prev_tracking.lon
                        record['prev_timestamp'] = prev_tracking.timestamp.isoformat() if hasattr(prev_tracking.timestamp, 'isoformat') else str(prev_tracking.timestamp)
                    
                    results.append(record)
            
            logger.info(f"Fetched {len(results)} GPS records for {len(animals)} animals")
            return results
            
        except Exception as e:
            logger.error(f"Error fetching GPS data: {e}", exc_info=True)
            return []
    
    def get_corridor_geometry(
        self,
        species: Optional[str] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Fetch corridor geometry for species
        
        Args:
            species: Filter by species (optional)
        
        Returns:
            Dict mapping species to corridor geometry data
        """
        try:
            corridors_query = Corridor.objects.filter(status='active')
            if species:
                corridors_query = corridors_query.filter(species__iexact=species)
            
            corridors = list(corridors_query)
            
            result = {}
            
            for corridor in corridors:
                species_key = corridor.species.lower()
                
                if species_key not in result:
                    result[species_key] = {
                        'geometry': None,
                        'metadata': {
                            'name': corridor.name,
                            'id': str(corridor.id),
                            'optimization_score': corridor.optimization_score,
                        }
                    }
                
                # Convert corridor path to Shapely geometry
                corridor_geom = None
                
                try:
                    if corridor.path:
                        # Path is JSON array
                        path_coords = corridor.path
                        if isinstance(path_coords, list) and len(path_coords) > 0:
                            if isinstance(path_coords[0], (list, tuple)) and len(path_coords[0]) >= 2:
                                # Convert to (lon, lat) tuples for Shapely
                                coords = [(p[1], p[0]) if len(p) >= 2 else (0, 0) for p in path_coords]
                                corridor_geom = LineString(coords).buffer(0.01)
                    elif corridor.start_point and corridor.end_point:
                        # Create corridor from start to end
                        start = corridor.start_point
                        end = corridor.end_point
                        
                        if isinstance(start, dict):
                            start_coord = (start.get('lon', 0), start.get('lat', 0))
                        else:
                            start_coord = (start[1] if len(start) >= 2 else 0, start[0] if len(start) >= 1 else 0)
                        
                        if isinstance(end, dict):
                            end_coord = (end.get('lon', 0), end.get('lat', 0))
                        else:
                            end_coord = (end[1] if len(end) >= 2 else 0, end[0] if len(end) >= 1 else 0)
                        
                        corridor_geom = LineString([start_coord, end_coord]).buffer(0.01)
                except Exception as e:
                    logger.warning(f"Error creating corridor geometry: {e}")
                
                # Use the first valid geometry or combine multiple corridors
                if corridor_geom:
                    if result[species_key]['geometry'] is None:
                        result[species_key]['geometry'] = corridor_geom
                    else:
                        # Combine multiple corridors for same species
                        result[species_key]['geometry'] = result[species_key]['geometry'].union(corridor_geom)
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching corridor geometry: {e}", exc_info=True)
            return {}
    
    def get_environmental_data(self) -> Dict[str, Any]:
        """
        Fetch environmental data (season, rainfall, NDVI, etc.)
        This is a placeholder - in production, fetch from environment/raster data tables
        
        Returns:
            Dict with environmental factors
        """
        # Placeholder - in production, fetch from database
        # For now, determine season from current date
        current_month = datetime.now().month
        
        # Simple season determination for East Africa
        if current_month in [3, 4, 5, 10, 11]:  # Long rains (Mar-May) and short rains (Oct-Nov)
            season = 'wet'
        else:
            season = 'dry'
        
        return {
            'season': season,
            'rainfall': None,  # Would fetch from database
            'ndvi': None,  # Would fetch from raster data
            'temperature': None,
        }


# Global instance
_db_connector = None

def get_db_connector() -> TrackingDBConnector:
    """Get or create global database connector instance"""
    global _db_connector
    if _db_connector is None:
        _db_connector = TrackingDBConnector()
    return _db_connector

