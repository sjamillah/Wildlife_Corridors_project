from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.utils import timezone
from django.db import connection
from drf_yasg.utils import swagger_auto_schema
import logging

from .models import ConflictZone, WildlifeAlert
from .serializers import ConflictZoneSerializer, ConflictZoneGeoJSONSerializer, WildlifeAlertSerializer, AlertAcknowledgeSerializer, AlertResolveSerializer
from .alerts import AlertSeverity

logger = logging.getLogger(__name__)

class ConflictZoneViewSet(viewsets.ModelViewSet):
    queryset = ConflictZone.objects.all()
    serializer_class = ConflictZoneSerializer
    filterset_fields = ['zone_type', 'risk_level', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Conflict Zones'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Get conflict zones as GeoJSON",
        operation_description="Returns all active conflict zones in GeoJSON format for map visualization",
        tags=['Conflict Zones']
    )
    @action(detail=False, methods=['get'], url_path='geojson')
    def geojson(self, request):
        cache_key = 'conflict_zones_geojson'
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return Response(cached_result)
        
        zones = ConflictZone.objects.filter(is_active=True)
        geojson = ConflictZoneGeoJSONSerializer.to_geojson(zones)
        
        cache.set(cache_key, geojson, 3600)
        
        return Response(geojson)

class HealthCheckView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Health check",
        tags=['System']
    )
    @action(detail=False, methods=['get'])
    def health(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            
            cache.set('health_check', 'ok', 10)
            cache_status = cache.get('health_check')
            
            return Response({
                'status': 'healthy',
                'timestamp': timezone.now(),
                'database': 'connected',
                'cache': 'ok' if cache_status == 'ok' else 'error',
                'service': 'wildlife_backend'
            })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'error': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class WildlifeAlertViewSet(viewsets.ModelViewSet):
    queryset = WildlifeAlert.objects.all()
    serializer_class = WildlifeAlertSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['animal', 'alert_type', 'severity', 'status']
    search_fields = ['title', 'message', 'animal__name']
    ordering = ['-detected_at']
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Get active alerts",
        operation_description="Get all unresolved alerts (active and acknowledged)",
        tags=['Alerts']
    )
    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        alerts = WildlifeAlert.objects.filter(
            status__in=['active', 'acknowledged']
        ).select_related('animal', 'conflict_zone', 'acknowledged_by')
        
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Get critical alerts",
        operation_description="Get all critical severity alerts",
        tags=['Alerts']
    )
    @action(detail=False, methods=['get'], url_path='critical')
    def critical(self, request):
        alerts = WildlifeAlert.objects.filter(
            severity=AlertSeverity.CRITICAL,
            status='active'
        ).select_related('animal', 'conflict_zone')
        
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Acknowledge alert",
        operation_description="Mark an alert as acknowledged",
        request_body=AlertAcknowledgeSerializer,
        tags=['Alerts']
    )
    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        
        if alert.status != 'active':
            return Response(
                {'error': f'Alert is already {alert.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.acknowledge(request.user)
        
        if request.data.get('notes'):
            alert.metadata['acknowledgment_notes'] = request.data['notes']
            alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Resolve alert",
        operation_description="Mark an alert as resolved",
        request_body=AlertResolveSerializer,
        tags=['Alerts']
    )
    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve_alert(self, request, pk=None):
        alert = self.get_object()
        
        if alert.status == 'resolved':
            return Response(
                {'error': 'Alert is already resolved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.resolve(request.user)
        
        if request.data.get('resolution_notes'):
            alert.metadata['resolution_notes'] = request.data['resolution_notes']
            alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Get alert statistics",
        operation_description="Get statistics about alerts (counts by type, severity, status)",
        tags=['Alerts']
    )
    @action(detail=False, methods=['get'], url_path='stats')
    def statistics(self, request):
        from django.db.models import Count
        
        stats = {
            'total': WildlifeAlert.objects.count(),
            'active': WildlifeAlert.objects.filter(status='active').count(),
            'critical': WildlifeAlert.objects.filter(
                severity=AlertSeverity.CRITICAL,
                status='active'
            ).count(),
            'by_type': list(
                WildlifeAlert.objects.filter(status='active')
                .values('alert_type')
                .annotate(count=Count('id'))
            ),
            'by_severity': list(
                WildlifeAlert.objects.filter(status='active')
                .values('severity')
                .annotate(count=Count('id'))
            ),
            'recent_24h': WildlifeAlert.objects.filter(
                detected_at__gte=timezone.now() - timezone.timedelta(hours=24)
            ).count(),
        }
        
        return Response(stats)
