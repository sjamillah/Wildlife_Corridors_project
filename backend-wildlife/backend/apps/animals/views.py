from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Max
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from shapely.geometry import Point, LineString
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .models import Animal
from .serializers import AnimalSerializer, AnimalListSerializer, LiveStatusSerializer
from apps.tracking.models import Tracking
from apps.corridors.models import Corridor
from apps.core.models import ConflictZone
from apps.core.spatial_utils import check_corridor_containment, calculate_conflict_risk
from apps.core.alerts import check_and_create_alerts
from apps.tracking.hmm_loader import get_hmm_predictor
from .movement_predictor import get_predictor

logger = logging.getLogger(__name__)

class AnimalViewSet(viewsets.ModelViewSet):
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
        cache_key = 'animals_live_status_v2'
        cached_result = cache.get(cache_key)
        if cached_result:
            return Response(cached_result)
        
        try:
            animals = Animal.objects.filter(status='active').only(
                'id', 'name', 'species', 'status', 'health_status', 'gender'
            )
            
            latest_tracking = Tracking.objects.filter(
                animal__in=animals
            ).values('animal_id').annotate(
                latest_timestamp=Max('timestamp')
            )
            
            latest_tracking_dict = {
                item['animal_id']: item['latest_timestamp']
                for item in latest_tracking
            }
            
            from django.conf import settings
            bounds = settings.GEOGRAPHIC_BOUNDS
            
            tracking_records = {}
            for animal_id, latest_ts in latest_tracking_dict.items():
                try:
                    tracking = Tracking.objects.filter(
                        animal_id=animal_id,
                        timestamp=latest_ts
                    ).order_by('-timestamp').first()
                    
                    if tracking:
                        if (bounds['lat_min'] <= tracking.lat <= bounds['lat_max'] and
                            bounds['lon_min'] <= tracking.lon <= bounds['lon_max']):
                            tracking_records[animal_id] = tracking
                        else:
                            logger.debug(f"Skipping {animal_id} - outside research area (lat: {tracking.lat}, lon: {tracking.lon})")
                except Exception as e:
                    logger.error(f"Error fetching tracking for animal {animal_id}: {e}")
            
            corridors_cache_key = 'active_corridors_by_species'
            corridors_by_species = cache.get(corridors_cache_key)
            
            if not corridors_by_species:
                corridors_by_species = {}
                for corridor in Corridor.objects.filter(status='active'):
                    species = corridor.species.lower()
                    if species not in corridors_by_species:
                        corridors_by_species[species] = []
                    corridors_by_species[species].append(corridor)
                cache.set(corridors_cache_key, corridors_by_species, 3600)
            
            conflict_zones_cache_key = 'active_conflict_zones'
            conflict_zones = cache.get(conflict_zones_cache_key)
            
            if conflict_zones is None:
                conflict_zones = list(ConflictZone.objects.filter(is_active=True))
                cache.set(conflict_zones_cache_key, conflict_zones, 3600)
            
            try:
                predictor = get_predictor()
            except Exception as pred_err:
                logger.warning(f"Movement predictor initialization failed, predictions will be disabled: {pred_err}")
                predictor = None
            
            try:
                hmm_predictor = get_hmm_predictor()
            except Exception as hmm_err:
                logger.warning(f"HMM predictor initialization failed: {hmm_err}")
                hmm_predictor = None
            
            results = []
            
            for animal in animals:
                animal_id = str(animal.id)
                species = animal.species
                species_lower = species.lower()
                
                tracking = tracking_records.get(animal.id)
                
                if not tracking:
                    logger.debug(f"Skipping {animal.name} - no tracking data")
                    continue
                
                current_lat = tracking.lat
                current_lon = tracking.lon
                speed_kmh = tracking.speed_kmh or 0
                directional_angle = tracking.directional_angle
                last_seen = tracking.timestamp
                
                prev_tracking = Tracking.objects.filter(
                    animal_id=animal.id,
                    timestamp__lt=tracking.timestamp
                ).order_by('-timestamp').first()
                
                prev_lat = prev_tracking.lat if prev_tracking else None
                prev_lon = prev_tracking.lon if prev_tracking else None
                prev_speed = prev_tracking.speed_kmh if prev_tracking else None
                prev_angle = prev_tracking.directional_angle if prev_tracking else None
                
                behavior_state = tracking.activity_type
                if not behavior_state and hmm_predictor:
                    try:
                        behavior_state = hmm_predictor.predict_behavior(
                            speed_kmh=speed_kmh,
                            directional_angle=directional_angle,
                            prev_speed=prev_speed,
                            prev_angle=prev_angle,
                            species=species
                        )
                        logger.debug(f"{animal.name} behavior: {behavior_state} (HMM)")
                    except Exception as hmm_err:
                        logger.warning(f"HMM prediction failed for {animal.name}: {hmm_err}")
                        behavior_state = self._infer_activity(speed_kmh)
                
                if not behavior_state:
                    behavior_state = self._infer_activity(speed_kmh)
                
                historical_data = None
                try:
                    if predictor:
                        historical_tracking = Tracking.objects.filter(
                            animal_id=animal.id,
                            timestamp__lte=tracking.timestamp
                        ).order_by('-timestamp')[:20].values('lat', 'lon', 'speed_kmh', 'directional_angle', 'timestamp')
                        
                        if historical_tracking:
                            import pandas as pd
                            historical_data = pd.DataFrame(list(historical_tracking))
                except Exception as e:
                    logger.warning(f"Error fetching historical data for {animal_id}: {e}")
                
                if predictor:
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
                            logger.warning(f"BBMM prediction failed for {animal_id}: {e2}")
                            predicted_lat, predicted_lon = current_lat, current_lon
                else:
                    predicted_lat, predicted_lon = current_lat, current_lon
                
                species_corridors = corridors_by_species.get(species_lower, [])
                
                corridor_name = None
                in_corridor = False
                distance_from_corridor = None
                
                for corridor in species_corridors:
                    is_inside, c_name, distance = check_corridor_containment(
                        current_lat, current_lon, corridor
                    )
                    if is_inside:
                        in_corridor = True
                        corridor_name = c_name
                        distance_from_corridor = distance
                        break
                
                predicted_corridor_name = None
                predicted_in_corridor = False
                
                for corridor in species_corridors:
                    is_inside, c_name, _ = check_corridor_containment(
                        predicted_lat, predicted_lon, corridor
                    )
                    if is_inside:
                        predicted_in_corridor = True
                        predicted_corridor_name = c_name
                        break
                
                conflict_info = calculate_conflict_risk(
                    current_lat, current_lon, 
                    conflict_zones, 
                    species_corridors
                )
                
                predicted_conflict_info = calculate_conflict_risk(
                    predicted_lat, predicted_lon,
                    conflict_zones,
                    species_corridors
                )
                
                created_alerts = []
                try:
                    created_alerts = check_and_create_alerts(
                        animal=animal,
                        current_position={'lat': current_lat, 'lon': current_lon},
                        tracking_data=tracking,
                        conflict_info=conflict_info,
                        corridor_status={'inside_corridor': in_corridor, 'corridor_name': corridor_name}
                    )
                except Exception as alert_err:
                    logger.error(f"Error creating alerts for {animal.name}: {alert_err}")
                
                result = {
                    'animal_id': animal.id,
                    'name': animal.name,
                    'species': species,
                    'collar_id': tracking.collar_id,
                    'current_position': {
                        'lat': current_lat,
                        'lon': current_lon,
                        'altitude': tracking.altitude,
                        'timestamp': last_seen,
                    },
                    'predicted_position': {
                        'lat': predicted_lat,
                        'lon': predicted_lon,
                        'prediction_time': last_seen,
                    },
                    'movement': {
                        'speed_kmh': speed_kmh,
                        'directional_angle': directional_angle,
                        'activity_type': behavior_state,
                        'behavior_state': behavior_state,
                        'behavior_source': 'hmm' if (hmm_predictor and hmm_predictor.models_loaded) else 'rule_based',
                        'battery_level': tracking.battery_level,
                        'signal_strength': tracking.signal_strength,
                    },
                    'corridor_status': {
                        'inside_corridor': in_corridor,
                        'corridor_name': corridor_name,
                        'predicted_in_corridor': predicted_in_corridor,
                        'predicted_corridor_name': predicted_corridor_name,
                    },
                    'conflict_risk': {
                        'current': {
                            'risk_level': conflict_info['risk_level'],
                            'reason': conflict_info['reason'],
                            'distance_to_conflict_km': conflict_info['distance_to_conflict'],
                            'conflict_zone': conflict_info['conflict_zone'],
                        },
                        'predicted': {
                            'risk_level': predicted_conflict_info['risk_level'],
                            'reason': predicted_conflict_info['reason'],
                        }
                    },
                    'alerts': {
                        'active_count': len(created_alerts),
                        'has_critical': any(a.severity == 'critical' for a in created_alerts),
                        'latest_alert': created_alerts[0].title if created_alerts else None,
                    },
                    'last_update': last_seen,
                }
                
                results.append(result)
            
            logger.info(f"live_status returning {len(results)} animals with tracking data")
            if results:
                first_animal = results[0]
                logger.info(f"Sample animal data - ID: {first_animal.get('animal_id')}, Lat: {first_animal.get('current_position', {}).get('lat')}, Lon: {first_animal.get('current_position', {}).get('lon')}")
            
            cache.set(cache_key, results, 60)
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in live_status endpoint: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch live status', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _infer_activity(self, speed_kmh):
        if speed_kmh < 0.5:
            return 'resting'
        elif speed_kmh < 2.0:
            return 'feeding'
        else:
            return 'moving'
    
    @action(detail=True, methods=['get'])
    def movement_trail(self, request, pk=None):
        try:
            animal = self.get_object()
            points_limit = min(int(request.query_params.get('points', 50)), 500)
            days = request.query_params.get('days')
            hours = request.query_params.get('hours')
            get_all = request.query_params.get('all', 'false').lower() == 'true'
            
            from django.conf import settings
            bounds = settings.GEOGRAPHIC_BOUNDS
            
            query = Tracking.objects.filter(
                animal=animal,
                lat__gte=bounds['lat_min'],
                lat__lte=bounds['lat_max'],
                lon__gte=bounds['lon_min'],
                lon__lte=bounds['lon_max']
            )
            
            if not get_all:
                if hours:
                    cutoff_time = timezone.now() - timedelta(hours=int(hours))
                    query = query.filter(timestamp__gte=cutoff_time)
                elif days:
                    cutoff_time = timezone.now() - timedelta(days=int(days))
                    query = query.filter(timestamp__gte=cutoff_time)
            
            tracking_points = query.order_by('-timestamp')[:points_limit]
            tracking_points = list(reversed(tracking_points))
            
            trail = []
            time_gaps = []
            
            for i, point in enumerate(tracking_points):
                activity = point.activity_type or self._infer_activity(point.speed_kmh or 0)
                
                time_gap_seconds = 0
                if i > 0:
                    time_gap_seconds = (point.timestamp - tracking_points[i-1].timestamp).total_seconds()
                
                is_large_gap = time_gap_seconds > (6 * 3600)
                if is_large_gap and i > 0:
                    time_gaps.append({
                        'index': i,
                        'gap_hours': round(time_gap_seconds / 3600, 1),
                        'reason': 'collar_sleep_mode' if time_gap_seconds < (24 * 3600) else 'collar_offline'
                    })
                
                trail.append({
                    'lat': point.lat,
                    'lon': point.lon,
                    'timestamp': point.timestamp.isoformat(),
                    'activity_type': activity,
                    'speed_kmh': point.speed_kmh or 0,
                    'directional_angle': point.directional_angle,
                    'time_since_last': {
                        'seconds': int(time_gap_seconds),
                        'minutes': round(time_gap_seconds / 60, 1),
                        'hours': round(time_gap_seconds / 3600, 2),
                        'is_large_gap': is_large_gap
                    }
                })
            
            segments = []
            current_segment = None
            
            for i, point in enumerate(trail):
                is_large_gap = point['time_since_last']['is_large_gap']
                
                if (current_segment is None or 
                    current_segment['activity_type'] != point['activity_type'] or 
                    is_large_gap):
                    if current_segment:
                        segments.append(current_segment)
                    current_segment = {
                        'activity_type': point['activity_type'],
                        'points': [point],
                        'start_time': point['timestamp'],
                        'point_count': 1,
                        'total_duration_hours': 0
                    }
                else:
                    current_segment['points'].append(point)
                    current_segment['point_count'] += 1
                    current_segment['total_duration_hours'] += point['time_since_last']['hours']
            
            if current_segment:
                segments.append(current_segment)
            
            total_time_span = 0
            if len(trail) > 1:
                first_time = timezone.datetime.fromisoformat(trail[0]['timestamp'])
                last_time = timezone.datetime.fromisoformat(trail[-1]['timestamp'])
                total_time_span = (last_time - first_time).total_seconds()
            
            return Response({
                'animal_id': str(animal.id),
                'animal_name': animal.name,
                'species': animal.species,
                'total_points': len(trail),
                'time_range': {
                    'start': trail[0]['timestamp'] if trail else None,
                    'end': trail[-1]['timestamp'] if trail else None,
                    'total_span_hours': round(total_time_span / 3600, 1) if total_time_span else 0,
                    'total_span_days': round(total_time_span / (3600 * 24), 1) if total_time_span else 0
                },
                'trail': trail,
                'segments': segments,
                'time_gaps': time_gaps,
                'tracking_quality': {
                    'average_interval_hours': round((total_time_span / len(trail)) / 3600, 2) if len(trail) > 1 else 0,
                    'large_gaps': len(time_gaps),
                    'continuous_segments': len(segments)
                },
                'activity_summary': {
                    'resting': sum(1 for p in trail if p['activity_type'] == 'resting'),
                    'feeding': sum(1 for p in trail if p['activity_type'] == 'feeding'),
                    'moving': sum(1 for p in trail if p['activity_type'] == 'moving')
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching movement trail for animal {pk}: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch movement trail', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

