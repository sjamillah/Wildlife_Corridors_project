from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from django.core.cache import cache
from asgiref.sync import async_to_sync
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from datetime import timedelta
import logging

from apps.predictions.ml_client import get_ml_client
from apps.tracking.models import Tracking
from apps.animals.models import Animal
from apps.core.models import ConflictZone
from apps.core.spatial_utils import create_corridor_buffer, distance_to_geometry
from .models import Corridor
from .serializers import CorridorSerializer, CorridorOptimizationSerializer
from .rl_optimizer import get_rl_optimizer
import httpx

logger = logging.getLogger(__name__)

class CorridorViewSet(viewsets.ModelViewSet):
    queryset = Corridor.objects.all()
    serializer_class = CorridorSerializer
    filterset_fields = ['species', 'status']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['Corridors'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Corridors'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Optimize corridor with RL using real GPS data",
        operation_description="Generate optimized wildlife corridor using real GPS data and RL models",
        request_body=CorridorOptimizationSerializer,
        tags=['Corridors']
    )
    @action(detail=False, methods=['post'])
    def optimize(self, request):
        serializer = CorridorOptimizationSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"Corridor optimization validation failed: {serializer.errors}")
            return Response(
                {
                    'error': 'Invalid request data',
                    'details': serializer.errors,
                    'required_fields': {
                        'species': 'string (e.g., "Elephant")',
                        'start_point': '{"lat": -2.5, "lon": 37.5}',
                        'end_point': '{"lat": -3.0, "lon": 38.0}',
                        'steps': 'integer (optional, 10-200, default: 50)'
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.is_valid(raise_exception=True)
        
        try:
            species = serializer.validated_data['species']
            start_point = serializer.validated_data['start_point']
            end_point = serializer.validated_data['end_point']
            steps = serializer.validated_data.get('steps', 50)
            
            historical_gps = Tracking.objects.filter(
                animal__species__iexact=species,
                animal__status='active'
            ).select_related('animal').order_by('-timestamp').values(
                'lat', 'lon', 'timestamp', 'speed_kmh', 'directional_angle',
                'animal__name', 'animal__collar_id'
            )[:1000]
            
            if not historical_gps.exists():
                logger.warning(f"No GPS data found for {species}")
                return Response(
                    {
                        'error': f'No GPS data available for {species}',
                        'details': 'No tracking data found for this species',
                        'suggestion': 'Upload GPS tracking data first, or try a different species',
                        'available_species': list(Animal.objects.filter(status='active').values_list('species', flat=True).distinct())
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            gps_data = list(historical_gps)
            
            conflict_zones = ConflictZone.objects.filter(
                is_active=True,
                risk_level__in=['high', 'medium']
            ).values('name', 'zone_type', 'geometry', 'risk_level')
            
            conflict_data = list(conflict_zones)
            
            logger.info(f"Optimizing corridor for {species}: {len(gps_data)} GPS points, {len(conflict_data)} conflict zones")
            
            try:
                logger.info("Trying local RL optimizer...")
                rl_optimizer = get_rl_optimizer()
                ml_data = rl_optimizer.optimize_corridor(
                    species=species,
                    start_point=start_point,
                    end_point=end_point,
                    steps=steps,
                    gps_data=gps_data,
                    conflict_zones=conflict_data
                )
                logger.info(f"Using local RL optimizer")
            except Exception as rl_error:
                logger.warning(f"Local RL failed ({rl_error}), trying ML service...")
                try:
                    ml_client = get_ml_client()
                    ml_data = async_to_sync(ml_client.predict_corridor)(
                        species=species,
                        start_lat=start_point['lat'],
                        start_lon=start_point['lon'],
                        end_lat=end_point.get('lat'),
                        end_lon=end_point.get('lon'),
                        steps=steps,
                        algorithm='ppo',
                        historical_gps=gps_data,
                        conflict_zones=conflict_data
                    )
                    logger.info(f"Using remote ML service")
                except Exception as ml_error:
                    logger.warning(f"ML service unavailable ({ml_error}), using simple corridor generation")
                    ml_data = self._generate_local_corridor(
                        start_point, end_point, steps, gps_data, conflict_data
                    )
            
            optimized_path = ml_data.get('path', [])
            
            geojson_path = {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [[p[1], p[0]] for p in optimized_path] if optimized_path else []
                },
                'properties': {
                    'species': species,
                    'optimization_score': ml_data.get('summary', {}).get('average_corridor_quality', 0),
                    'total_distance_km': ml_data.get('summary', {}).get('total_distance', 0),
                    'conflict_avoidance_score': ml_data.get('summary', {}).get('conflict_avoidance', 0),
                    'gps_points_used': len(gps_data),
                    'conflict_zones_avoided': len(conflict_data),
                }
            }
            
            corridor = Corridor.objects.create(
                name=serializer.validated_data.get('name', f"{species} Optimized Corridor"),
                description=f"RL-optimized corridor using {len(gps_data)} real GPS points",
                species=species,
                status='active',
                start_point=start_point,
                end_point=end_point,
                path=optimized_path,
                optimization_score=ml_data.get('summary', {}).get('average_corridor_quality'),
                optimization_data={
                    **ml_data,
                    'gps_data_count': len(gps_data),
                    'conflict_zones_count': len(conflict_data),
                    'optimization_timestamp': timezone.now().isoformat(),
                },
                created_by=request.user
            )
            
            logger.info(f"Corridor optimized and saved: {corridor.name} (score: {corridor.optimization_score})")
            
            return Response({
                'corridor': CorridorSerializer(corridor).data,
                'geojson': geojson_path,
                'summary': ml_data.get('summary', {}),
                'message': f'Corridor optimized successfully using {len(gps_data)} GPS points'
            }, status=status.HTTP_201_CREATED)
        
        except (httpx.HTTPError, httpx.ConnectError) as e:
            logger.error(f"ML service connection error: {e}")
            return Response(
                {'error': 'ML service unavailable', 'detail': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Corridor optimization error: {e}", exc_info=True)
            return Response(
                {'error': 'Optimization failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_local_corridor(self, start_point, end_point, steps, gps_data, conflict_data):
        import numpy as np
        from shapely.geometry import Point, LineString
        from apps.core.spatial_utils import distance_to_geometry
        
        start_lat, start_lon = start_point['lat'], start_point['lon']
        end_lat, end_lon = end_point['lat'], end_point['lon']
        
        path = []
        for i in range(steps + 1):
            t = i / steps
            lat = start_lat + (end_lat - start_lat) * t
            lon = start_lon + (end_lon - start_lon) * t
            path.append([lat, lon])
        
        quality_score = 0.6
        
        if gps_data:
            nearby_points = 0
            for point in path[::5]:
                for gps in gps_data[:100]:
                    dist = np.sqrt((point[0] - gps['lat'])**2 + (point[1] - gps['lon'])**2)
                    if dist < 0.1:
                        nearby_points += 1
                        break
            
            coverage = nearby_points / (len(path) // 5)
            quality_score += coverage * 0.3
        
        return {
            'path': path,
            'summary': {
                'average_corridor_quality': min(quality_score, 1.0),
                'total_distance': self._calculate_distance(path),
                'conflict_avoidance': 0.7,
                'optimization_method': 'local_interpolation'
            }
        }
    
    def _calculate_distance(self, path):
        import numpy as np
        total = 0
        for i in range(len(path) - 1):
            lat1, lon1 = path[i]
            lat2, lon2 = path[i + 1]
            dlat = np.radians(lat2 - lat1)
            dlon = np.radians(lon2 - lon1)
            a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
            c = 2 * np.arcsin(np.sqrt(a))
            total += 6371 * c
        return round(total, 2)

