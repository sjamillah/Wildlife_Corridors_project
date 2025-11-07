from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .models import Tracking, Observation
from .serializers import TrackingSerializer, ObservationSerializer
from .db_connector import get_db_connector
from .hmm_loader import get_hmm_predictor
from apps.animals.models import Animal

logger = logging.getLogger(__name__)

def get_realtime_tracker_lazy():
    import os
    
    if os.getenv('DISABLE_LOCAL_ML', 'False').lower() == 'true':
        logger.info("Local ML disabled via DISABLE_LOCAL_ML env var")
        return None
    
    try:
        import sys
        from pathlib import Path
        BASE_DIR = Path(__file__).resolve().parents[2]
        ml_service_path = str(BASE_DIR / "ml_service")
        if ml_service_path not in sys.path:
            sys.path.insert(0, ml_service_path)
        
        from ml_service.core.realtime_tracker import get_realtime_tracker
        logger.info("Local ML tracker loaded successfully")
        return get_realtime_tracker()
    except (ImportError, ModuleNotFoundError, AttributeError) as e:
        logger.warning(f"Real-time tracker not available: {e}. Live tracking will return limited data")
        return None

class TrackingViewSet(viewsets.ModelViewSet):
    queryset = Tracking.objects.all()
    serializer_class = TrackingSerializer
    filterset_fields = ['animal', 'source', 'activity_type']
    search_fields = ['animal__name', 'animal__species', 'collar_id']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        from django.conf import settings
        queryset = super().get_queryset()
        
        bounds = settings.GEOGRAPHIC_BOUNDS
        
        queryset = queryset.filter(
            lat__gte=bounds['lat_min'],
            lat__lte=bounds['lat_max'],
            lon__gte=bounds['lon_min'],
            lon__lte=bounds['lon_max']
        )
        
        logger.debug(f"Filtering tracking data to bounds: {bounds}")
        return queryset
    
    @swagger_auto_schema(tags=['Tracking'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Latest tracking data",
        tags=['Tracking']
    )
    @action(detail=False, methods=['get'], url_path='live', url_name='live')
    def live(self, request):
        try:
            latest = Tracking.objects.filter(
                timestamp__gte=timezone.now() - timezone.timedelta(hours=1)
            ).order_by('-timestamp')[:100]
            
            serializer = self.get_serializer(latest, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in live tracking: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@swagger_auto_schema(
    method='get',
    operation_summary="Get behavioral state for animal",
    operation_description="Analyze animal's recent movements to detect behavioral state",
    manual_parameters=[
        openapi.Parameter('animal_id', openapi.IN_QUERY, description="Animal UUID", type=openapi.TYPE_STRING, required=True),
        openapi.Parameter('hours', openapi.IN_QUERY, description="Hours of data to analyze", type=openapi.TYPE_INTEGER, default=24),
    ],
    tags=['Tracking']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def analyze_behavior(request):
    try:
        animal_id = request.query_params.get('animal_id')
        hours = int(request.query_params.get('hours', 24))
        
        if not animal_id:
            return Response(
                {'error': 'animal_id parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            animal = Animal.objects.get(id=animal_id)
        except Animal.DoesNotExist:
            return Response(
                {'error': 'Animal not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        tracking_points = Tracking.objects.filter(
            animal_id=animal_id,
            timestamp__gte=cutoff_time
        ).order_by('timestamp').values(
            'lat', 'lon', 'speed_kmh', 'directional_angle', 
            'timestamp', 'activity_type'
        )
        
        if not tracking_points:
            return Response({
                'animal_id': str(animal_id),
                'animal_name': animal.name,
                'species': animal.species,
                'message': 'No tracking data available for this time period',
                'points_analyzed': 0,
                'behaviors': []
            })
        
        hmm_predictor = get_hmm_predictor()
        
        analyzed_points = hmm_predictor.analyze_movement_sequence(
            list(tracking_points),
            species=animal.species
        )
        
        behavior_counts = {}
        for point in analyzed_points:
            behavior = point.get('behavior_state', 'unknown')
            behavior_counts[behavior] = behavior_counts.get(behavior, 0) + 1
        
        total_points = len(analyzed_points)
        behavior_distribution = {
            behavior: {
                'count': count,
                'percentage': round((count / total_points) * 100, 1)
            }
            for behavior, count in behavior_counts.items()
        }
        
        current_behavior = analyzed_points[-1].get('behavior_state', 'unknown') if analyzed_points else 'unknown'
        
        return Response({
            'animal_id': str(animal_id),
            'animal_name': animal.name,
            'species': animal.species,
            'time_period_hours': hours,
            'points_analyzed': len(analyzed_points),
            'current_behavior': current_behavior,
            'behavior_distribution': behavior_distribution,
            'recent_behaviors': [
                {
                    'timestamp': p['timestamp'],
                    'behavior': p.get('behavior_state'),
                    'speed_kmh': p.get('speed_kmh'),
                    'direction': p.get('directional_angle')
                }
                for p in analyzed_points[-10:]
            ],
            'model_used': 'hmm' if hmm_predictor.models_loaded else 'rule_based'
        })
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid parameter: {e}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error analyzing behavior: {e}", exc_info=True)
        return Response(
            {'error': 'Failed to analyze behavior', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    operation_summary="Get behavioral statistics for all animals",
    operation_description="Get current behavioral states for all active animals",
    tags=['Tracking']
)
@api_view(['GET'])
@permission_classes([AllowAny])
def behavior_summary(request):
    try:
        hmm_predictor = get_hmm_predictor()
        
        animals = Animal.objects.filter(status='active')
        
        results = []
        
        for animal in animals:
            latest = Tracking.objects.filter(animal=animal).order_by('-timestamp').first()
            
            if not latest:
                continue
            
            prev = Tracking.objects.filter(
                animal=animal,
                timestamp__lt=latest.timestamp
            ).order_by('-timestamp').first()
            
            behavior = latest.activity_type
            if not behavior:
                behavior = hmm_predictor.predict_behavior(
                    speed_kmh=latest.speed_kmh or 0,
                    directional_angle=latest.directional_angle,
                    prev_speed=prev.speed_kmh if prev else None,
                    prev_angle=prev.directional_angle if prev else None,
                    species=animal.species
                )
            
            results.append({
                'animal_id': str(animal.id),
                'name': animal.name,
                'species': animal.species,
                'current_behavior': behavior,
                'speed_kmh': latest.speed_kmh or 0,
                'last_update': latest.timestamp
            })
        
        by_behavior = {}
        for r in results:
            behavior = r['current_behavior']
            if behavior not in by_behavior:
                by_behavior[behavior] = []
            by_behavior[behavior].append(r['name'])
        
        return Response({
            'total_animals': len(results),
            'animals': results,
            'distribution': by_behavior,
            'model_used': 'hmm' if hmm_predictor.models_loaded else 'rule_based',
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        logger.error(f"Error getting behavior summary: {e}", exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    operation_summary="Real-time tracking",
    operation_description="Get real-time tracking with full ML pipeline (HMM, BBMM, XGBoost, LSTM, RL)",
    tags=['Tracking'],
    responses={200: 'Real-time tracking data with ML predictions'}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def live_tracking(request):
    cache_key = 'live_tracking_data'
    cached_result = cache.get(cache_key)
    if cached_result:
        return Response(cached_result)
    
    try:
        db_connector = get_db_connector()
        
        tracker = None
        try:
            tracker = get_realtime_tracker_lazy()
        except Exception as e:
            logger.warning(f"Failed to initialize ML tracker: {e}")
            tracker = None
        
        gps_data = db_connector.get_latest_gps_data(
            minutes_back=60,
            limit=10
        )
        
        if not tracker:
            return Response({
                'timestamp': timezone.now().isoformat(),
                'season': 'unknown',
                'species_data': gps_data[:10] if gps_data else []
            })
        
        if not gps_data:
            return Response({
                'timestamp': timezone.now().isoformat(),
                'season': 'unknown',
                'species_data': []
            })
        
        corridor_data = db_connector.get_corridor_geometry()
        
        environmental_data = db_connector.get_environmental_data()
        
        results = tracker.process_tracking_data(
            gps_data=gps_data,
            corridor_data=corridor_data,
            environmental_data=environmental_data
        )
        
        cache.set(cache_key, results, 5)
        
        return Response(results, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in live_tracking endpoint: {e}", exc_info=True)
        return Response(
            {
                'error': 'Failed to fetch live tracking data',
                'detail': str(e),
                'timestamp': timezone.now().isoformat(),
                'season': 'unknown',
                'species_data': []
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class ObservationViewSet(viewsets.ModelViewSet):
    queryset = Observation.objects.all()
    serializer_class = ObservationSerializer
    filterset_fields = ['animal', 'observation_type']
    search_fields = ['description']
    ordering = ['-timestamp']
    
    @swagger_auto_schema(tags=['Tracking'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Tracking'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
