from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Max
from django.core.cache import cache
from shapely.geometry import Point, LineString
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .models import Animal
from .serializers import AnimalSerializer, AnimalListSerializer, LiveStatusSerializer
from apps.tracking.models import Tracking
from apps.corridors.models import Corridor
from .movement_predictor import get_predictor

logger = logging.getLogger(__name__)


class AnimalViewSet(viewsets.ModelViewSet):
    """
    Animal Management
    
    CRUD operations for wildlife animals including GPS-collared tracking subjects.
    """
    queryset = Animal.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['species', 'status', 'health_status', 'gender']
    search_fields = ['name', 'species', 'collar_id']
    ordering_fields = ['name', 'species', 'created_at']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['Animals'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Animals'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Animals'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Animals'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Animals'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Animals'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AnimalListSerializer
        elif self.action == 'live_status':
            return LiveStatusSerializer
        return AnimalSerializer
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Live animal status",
        operation_description="Get real-time positions and predictions for all active animals",
        tags=['Animals']
    )
    @action(detail=False, methods=['get'], url_path='live_status', url_name='live_status')
    def live_status(self, request):
        """
        Get live status for all animals with current/predicted positions and corridor checks.
        
        Returns JSON array with:
        - animal_id, species
        - current_lat, current_lon (latest GPS)
        - predicted_lat, predicted_lon (ML prediction)
        - in_corridor (boolean for current position)
        - predicted_in_corridor (boolean for predicted position)
        - speed_kmh, last_seen timestamp
        """
        # Check cache first (5 second cache for real-time updates)
        cache_key = 'animals_live_status'
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)
        
        try:
            # Get all active animals
            animals = Animal.objects.filter(status='active').select_related()
            
            # Get latest tracking data for each animal
            latest_tracking = Tracking.objects.filter(
                animal__in=animals
            ).values('animal_id').annotate(
                latest_timestamp=Max('timestamp')
            )
            
            latest_tracking_dict = {
                item['animal_id']: item['latest_timestamp']
                for item in latest_tracking
            }
            
            # Get tracking data with latest timestamps
            tracking_records = {}
            for animal_id, latest_ts in latest_tracking_dict.items():
                try:
                    tracking = Tracking.objects.filter(
                        animal_id=animal_id,
                        timestamp=latest_ts
                    ).order_by('-timestamp').first()
                    if tracking:
                        tracking_records[animal_id] = tracking
                except Exception as e:
                    logger.error(f"Error fetching tracking for animal {animal_id}: {e}")
            
            # Get corridors by species
            corridors_by_species = {}
            for corridor in Corridor.objects.filter(status='active'):
                species = corridor.species.lower()
                if species not in corridors_by_species:
                    corridors_by_species[species] = []
                corridors_by_species[species].append(corridor)
            
            # Initialize predictor
            predictor = get_predictor()
            
            # Build response data
            results = []
            
            for animal in animals:
                animal_id = str(animal.id)
                species = animal.species
                species_lower = species.lower()
                
                # Get latest tracking data
                tracking = tracking_records.get(animal.id)
                
                if not tracking:
                    # No tracking data available
                    continue
                
                current_lat = tracking.lat
                current_lon = tracking.lon
                speed_kmh = tracking.speed_kmh
                last_seen = tracking.timestamp
                
                # Get previous tracking point for better prediction
                prev_tracking = Tracking.objects.filter(
                    animal_id=animal.id,
                    timestamp__lt=tracking.timestamp
                ).order_by('-timestamp').first()
                
                prev_lat = prev_tracking.lat if prev_tracking else None
                prev_lon = prev_tracking.lon if prev_tracking else None
                
                # Get historical data for LSTM prediction
                historical_data = None
                try:
                    historical_tracking = Tracking.objects.filter(
                        animal_id=animal.id,
                        timestamp__lte=tracking.timestamp
                    ).order_by('-timestamp')[:20].values('lat', 'lon', 'speed_kmh', 'heading', 'timestamp')
                    
                    if historical_tracking.exists():
                        import pandas as pd
                        historical_data = pd.DataFrame(list(historical_tracking))
                except Exception as e:
                    logger.warning(f"Error fetching historical data for {animal_id}: {e}")
                
                # Predict next position
                # Try LSTM first, fallback to BBMM
                try:
                    predicted_lat, predicted_lon = predictor.predict_with_lstm(
                        current_lat, current_lon, historical_data, species_lower
                    )
                except Exception as e:
                    logger.warning(f"LSTM prediction failed for {animal_id}, using BBMM: {e}")
                    try:
                        predicted_lat, predicted_lon = predictor.predict_with_bbmm(
                            current_lat, current_lon, prev_lat, prev_lon, species_lower
                        )
                    except Exception as e2:
                        logger.error(f"BBMM prediction failed for {animal_id}: {e2}")
                        # Fallback to current position
                        predicted_lat, predicted_lon = current_lat, current_lon
                
                # Check corridor geometry
                current_point = Point(current_lon, current_lat)
                predicted_point = Point(predicted_lon, predicted_lat)
                
                in_corridor = False
                predicted_in_corridor = False
                
                # Check against corridors for this species
                species_corridors = corridors_by_species.get(species_lower, [])
                
                for corridor in species_corridors:
                    # Get corridor geometry from path or start/end points
                    corridor_geom = None
                    
                    try:
                        if corridor.path:
                            # Path is a JSON array of coordinates
                            path_coords = corridor.path
                            if isinstance(path_coords, list) and len(path_coords) > 0:
                                # Create LineString or Polygon from path
                                if isinstance(path_coords[0], (list, tuple)) and len(path_coords[0]) >= 2:
                                    # Convert to (lon, lat) tuples
                                    coords = [(p[1], p[0]) if len(p) >= 2 else (0, 0) for p in path_coords]
                                    corridor_geom = LineString(coords).buffer(0.01)  # Buffer for area check
                        elif corridor.start_point and corridor.end_point:
                            # Create a simple corridor from start to end
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
                        
                        if corridor_geom:
                            in_corridor = corridor_geom.contains(current_point) or corridor_geom.buffer(0.001).contains(current_point)
                            predicted_in_corridor = corridor_geom.contains(predicted_point) or corridor_geom.buffer(0.001).contains(predicted_point)
                            
                            # If either position is in corridor, mark it
                            if in_corridor or predicted_in_corridor:
                                break
                                
                    except Exception as e:
                        logger.warning(f"Error checking corridor geometry for {animal_id}: {e}")
                        continue
                
                # Build result
                result = {
                    'animal_id': animal.id,
                    'species': species,
                    'current_lat': current_lat,
                    'current_lon': current_lon,
                    'predicted_lat': predicted_lat,
                    'predicted_lon': predicted_lon,
                    'in_corridor': in_corridor,
                    'predicted_in_corridor': predicted_in_corridor,
                    'speed_kmh': speed_kmh,
                    'last_seen': last_seen,
                }
                
                results.append(result)
            
            # Cache result for 5 seconds
            cache.set(cache_key, results, 5)
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in live_status endpoint: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch live status', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

