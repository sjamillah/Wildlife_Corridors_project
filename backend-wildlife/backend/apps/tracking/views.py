"""
Tracking views including real-time live tracking endpoint
"""
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

logger = logging.getLogger(__name__)

# Import real-time tracker - handle gracefully if not available
try:
    import sys
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parents[2]  # backend directory
    sys.path.insert(0, str(BASE_DIR / "ml_service"))
    from core.realtime_tracker import get_realtime_tracker
    TRACKER_AVAILABLE = True
    logger.info("Real-time tracker loaded successfully")
except (ImportError, ModuleNotFoundError) as e:
    logger.warning(f"Real-time tracker not available: {e}. Live tracking will return limited data")
    TRACKER_AVAILABLE = False
    def get_realtime_tracker():
        return None


class TrackingViewSet(viewsets.ModelViewSet):
    """
    GPS Tracking Data
    
    Manage GPS tracking points and real-time animal location data.
    """
    queryset = Tracking.objects.all()
    serializer_class = TrackingSerializer
    filterset_fields = ['animal', 'source', 'activity_type']
    search_fields = ['animal__name', 'animal__species', 'collar_id']
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
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Latest tracking data",
        tags=['Tracking']
    )
    @action(detail=False, methods=['get'], url_path='live', url_name='live')
    def live(self, request):
        """
        Get latest real-time tracking data for all animals
        """
        try:
            # Get latest tracking data (last hour)
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


# Real-time tracking endpoint
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
    """
    Real-Time Tracking with ML Pipeline
    
    Integrates HMM, BBMM, XGBoost, LSTM, and RL models for comprehensive tracking.
    
    Returns:
    - Current and predicted coordinates
    - Behavioral states (foraging, migrating, resting)
    - Corridor status
    - Risk zone detection
    - RL recommendations
    """
    # Check cache (5 second cache for real-time updates)
    cache_key = 'live_tracking_data'
    cached_result = cache.get(cache_key)
    if cached_result:
        return Response(cached_result)
    
    try:
        # Initialize services
        db_connector = get_db_connector()
        
        # Try to get tracker, but fallback gracefully if initialization fails
        tracker = None
        if TRACKER_AVAILABLE:
            try:
                tracker = get_realtime_tracker()
            except Exception as e:
                logger.warning(f"Failed to initialize ML tracker: {e}")
                tracker = None
        
        # Fetch latest GPS data from database
        gps_data = db_connector.get_latest_gps_data(
            minutes_back=60,  # Last hour of data
            limit=10  # Latest 10 records per animal
        )
        
        # Fallback if tracker not available or no GPS data
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
        
        # Fetch corridor geometry
        corridor_data = db_connector.get_corridor_geometry()
        
        # Fetch environmental data
        environmental_data = db_connector.get_environmental_data()
        
        # Process through pipeline: HMM → BBMM → XGBoost → LSTM → RL
        results = tracker.process_tracking_data(
            gps_data=gps_data,
            corridor_data=corridor_data,
            environmental_data=environmental_data
        )
        
        # Cache result for 5 seconds
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
    """
    Field Observations
    
    Record and manage field observations and wildlife sightings.
    """
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
