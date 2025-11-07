from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Max, Q
from datetime import timedelta
from django.conf import settings
import logging

from .models import Ranger, RangerTeam, RangerTracking, PatrolLog, PatrolRoute
from .serializers import (
    RangerSerializer, RangerTeamSerializer, RangerTrackingSerializer,
    PatrolLogSerializer, PatrolRouteSerializer, RangerLiveStatusSerializer
)

logger = logging.getLogger(__name__)

class RangerTeamViewSet(viewsets.ModelViewSet):
    queryset = RangerTeam.objects.all()
    serializer_class = RangerTeamSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['name']

class RangerViewSet(viewsets.ModelViewSet):
    queryset = Ranger.objects.select_related('user', 'team')
    serializer_class = RangerSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['current_status', 'team']
    search_fields = ['user__name', 'badge_number']
    ordering = ['user__name']
    
    @action(detail=False, methods=['get'])
    def live_status(self, request):
        try:
            rangers = Ranger.objects.filter(
                Q(current_status='on_duty') | Q(current_status='emergency_response')
            ).select_related('user', 'team')
            
            latest_tracking_dict = {}
            for ranger in rangers:
                latest = RangerTracking.objects.filter(ranger=ranger).order_by('-timestamp').first()
                if latest:
                    latest_tracking_dict[ranger.id] = latest
            
            bounds = settings.GEOGRAPHIC_BOUNDS
            
            results = []
            for ranger in rangers:
                tracking = latest_tracking_dict.get(ranger.id)
                
                if tracking and (
                    bounds['lat_min'] <= tracking.lat <= bounds['lat_max'] and
                    bounds['lon_min'] <= tracking.lon <= bounds['lon_max']
                ):
                    recent_logs = PatrolLog.objects.filter(
                        ranger=ranger,
                        timestamp__gte=timezone.now() - timedelta(hours=24)
                    ).order_by('-timestamp')[:5]
                    
                    results.append({
                        'ranger_id': str(ranger.id),
                        'name': ranger.user.name,
                        'badge_number': ranger.badge_number,
                        'team_name': ranger.team.name if ranger.team else None,
                        'current_status': ranger.current_status,
                        'last_active': ranger.last_active,
                        'current_position': {
                            'lat': tracking.lat,
                            'lon': tracking.lon,
                            'timestamp': tracking.timestamp.isoformat(),
                            'accuracy': tracking.accuracy
                        },
                        'activity_type': tracking.activity_type,
                        'speed_kmh': tracking.speed_kmh,
                        'battery_level': tracking.battery_level,
                        'signal_strength': tracking.signal_strength,
                        'recent_logs': [
                            {
                                'type': log.log_type,
                                'priority': log.priority,
                                'title': log.title,
                                'timestamp': log.timestamp.isoformat()
                            }
                            for log in recent_logs
                        ],
                        'distance_to_base_km': None  # Could calculate if you have base station coords
                    })
            
            logger.info(f"live_status returning {len(results)} rangers")
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in ranger live_status: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch ranger live status', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def movement_trail(self, request, pk=None):
        try:
            ranger = self.get_object()
            points_limit = min(int(request.query_params.get('points', 50)), 500)
            days = request.query_params.get('days')
            hours = request.query_params.get('hours')
            get_all = request.query_params.get('all', 'false').lower() == 'true'
            
            bounds = settings.GEOGRAPHIC_BOUNDS
            
            query = RangerTracking.objects.filter(
                ranger=ranger,
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
                time_gap_seconds = 0
                if i > 0:
                    time_gap_seconds = (point.timestamp - tracking_points[i-1].timestamp).total_seconds()
                
                is_large_gap = time_gap_seconds > (2 * 3600)  # 2 hours for rangers
                if is_large_gap and i > 0:
                    time_gaps.append({
                        'index': i,
                        'gap_hours': round(time_gap_seconds / 3600, 1),
                        'reason': 'off_duty' if time_gap_seconds > (8 * 3600) else 'break'
                    })
                
                trail.append({
                    'lat': point.lat,
                    'lon': point.lon,
                    'timestamp': point.timestamp.isoformat(),
                    'activity_type': point.activity_type,
                    'speed_kmh': point.speed_kmh or 0,
                    'battery_level': point.battery_level,
                    'time_since_last': {
                        'seconds': int(time_gap_seconds),
                        'minutes': round(time_gap_seconds / 60, 1),
                        'hours': round(time_gap_seconds / 3600, 2),
                        'is_large_gap': is_large_gap
                    }
                })
            
            segments = []
            current_segment = None
            
            for point in trail:
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
                'ranger_id': str(ranger.id),
                'ranger_name': ranger.user.name,
                'badge_number': ranger.badge_number,
                'team': ranger.team.name if ranger.team else None,
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
                    'patrolling': sum(1 for p in trail if p['activity_type'] == 'patrolling'),
                    'stationary': sum(1 for p in trail if p['activity_type'] == 'stationary'),
                    'responding': sum(1 for p in trail if p['activity_type'] == 'responding'),
                    'traveling': sum(1 for p in trail if p['activity_type'] == 'traveling'),
                    'resting': sum(1 for p in trail if p['activity_type'] == 'resting')
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching ranger movement trail: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch movement trail', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RangerTrackingViewSet(viewsets.ModelViewSet):
    queryset = RangerTracking.objects.select_related('ranger__user')
    serializer_class = RangerTrackingSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['ranger', 'activity_type']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        bounds = settings.GEOGRAPHIC_BOUNDS
        
        return queryset.filter(
            lat__gte=bounds['lat_min'],
            lat__lte=bounds['lat_max'],
            lon__gte=bounds['lon_min'],
            lon__lte=bounds['lon_max']
        )

class PatrolLogViewSet(viewsets.ModelViewSet):
    queryset = PatrolLog.objects.select_related('ranger__user', 'team', 'animal')
    serializer_class = PatrolLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['log_type', 'priority', 'is_resolved', 'ranger', 'team']
    search_fields = ['title', 'description']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def emergencies(self, request):
        emergencies = self.queryset.filter(
            log_type='emergency',
            is_resolved=False
        ).order_by('-timestamp')
        
        serializer = self.get_serializer(emergencies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        log = self.get_object()
        log.is_resolved = True
        log.resolved_at = timezone.now()
        log.resolved_by = request.user
        log.save()
        
        return Response({'status': 'resolved'}, status=status.HTTP_200_OK)

class PatrolRouteViewSet(viewsets.ModelViewSet):
    queryset = PatrolRoute.objects.select_related('team', 'created_by').prefetch_related('assigned_rangers')
    serializer_class = PatrolRouteSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'team']
    ordering = ['-scheduled_start']
    
    @action(detail=True, methods=['post'])
    def start_patrol(self, request, pk=None):
        route = self.get_object()
        route.status = 'in_progress'
        route.actual_start = timezone.now()
        route.save()
        
        route.assigned_rangers.update(current_status='on_duty', last_active=timezone.now())
        
        return Response({'status': 'started'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def end_patrol(self, request, pk=None):
        route = self.get_object()
        route.status = 'completed'
        route.actual_end = timezone.now()
        route.save()
        
        return Response({'status': 'completed'}, status=status.HTTP_200_OK)

