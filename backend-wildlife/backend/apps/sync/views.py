from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging
from .models import SyncLog, SyncQueue
from .serializers import SyncLogSerializer, SyncQueueSerializer, OfflineDataUploadSerializer

logger = logging.getLogger(__name__)

class SyncLogViewSet(viewsets.ModelViewSet):
    queryset = SyncLog.objects.all()
    serializer_class = SyncLogSerializer
    
    @swagger_auto_schema(tags=['Synchronization'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Recent sync logs",
        tags=['Synchronization']
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        recent_logs = self.queryset.filter(
            user=request.user
        ).order_by('-started_at')[:10]
        
        serializer = self.get_serializer(recent_logs, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Sync statistics",
        tags=['Synchronization']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        user_logs = self.queryset.filter(user=request.user)
        
        total_syncs = user_logs.count()
        successful_syncs = user_logs.filter(completed_at__isnull=False).count()
        failed_syncs = total_syncs - successful_syncs
        
        total_items = sum(log.total_items for log in user_logs)
        synced_items = sum(log.synced_items for log in user_logs)
        conflict_items = sum(log.conflict_items for log in user_logs)
        failed_items = sum(log.failed_items for log in user_logs)
        
        return Response({
            'total_syncs': total_syncs,
            'successful_syncs': successful_syncs,
            'failed_syncs': failed_syncs,
            'success_rate': (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0,
            'total_items': total_items,
            'synced_items': synced_items,
            'conflict_items': conflict_items,
            'failed_items': failed_items,
            'sync_efficiency': (synced_items / total_items * 100) if total_items > 0 else 0,
        })

class SyncQueueViewSet(viewsets.ModelViewSet):
    queryset = SyncQueue.objects.all()
    serializer_class = SyncQueueSerializer
    
    @swagger_auto_schema(tags=['Synchronization'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(tags=['Synchronization'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Pending sync items",
        tags=['Synchronization']
    )
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_items = self.queryset.filter(
            user=request.user,
            status='pending'
        ).order_by('created_at')
        
        serializer = self.get_serializer(pending_items, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='get',
        operation_summary="Failed sync items",
        tags=['Synchronization']
    )
    @action(detail=False, methods=['get'])
    def failed(self, request):
        failed_items = self.queryset.filter(
            user=request.user,
            status='failed'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(failed_items, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Retry all failed items",
        tags=['Synchronization']
    )
    @action(detail=False, methods=['post'])
    def retry_failed(self, request):
        failed_items = self.queryset.filter(
            user=request.user,
            status='failed'
        )
        
        retry_count = 0
        for item in failed_items:
            item.status = 'pending'
            item.attempts = 0
            item.error_message = ''
            item.save()
            retry_count += 1
        
        return Response({
            'message': f'Retrying {retry_count} failed items',
            'retry_count': retry_count
        })
    
    @swagger_auto_schema(
        method='post',
        operation_summary="Retry specific item",
        tags=['Synchronization']
    )
    @action(detail=True, methods=['post'])
    def retry_item(self, request, pk=None):
        item = self.get_object()
        
        if item.status != 'failed':
            return Response(
                {'error': 'Item is not in failed status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.status = 'pending'
        item.attempts = 0
        item.error_message = ''
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)

@swagger_auto_schema(
    method='post',
    operation_summary="Upload offline data",
    operation_description="Bulk upload data collected offline by mobile app (animals, tracking, observations)",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'device_id': openapi.Schema(type=openapi.TYPE_STRING, description='Unique device identifier'),
            'animals': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT),
                description='Array of animal data'
            ),
            'tracking': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT),
                description='Array of GPS tracking points'
            ),
            'observations': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_OBJECT),
                description='Array of field observations'
            ),
        },
        required=['device_id']
    ),
    tags=['Synchronization'],
    responses={
        200: 'Data uploaded successfully',
        400: 'Invalid data format',
        500: 'Server error during sync'
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_offline_data(request):
    from apps.animals.models import Animal
    from apps.tracking.models import Tracking, Observation
    from apps.animals.serializers import AnimalSerializer
    from apps.tracking.serializers import TrackingSerializer, ObservationSerializer
    
    device_id = request.data.get('device_id')
    if not device_id:
        return Response(
            {'error': 'device_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    sync_log = SyncLog.objects.create(
        device_id=device_id,
        user=request.user,
        started_at=timezone.now(),
        total_items=0,
        synced_items=0,
        conflict_items=0,
        failed_items=0
    )
    
    results = {
        'sync_id': sync_log.id,
        'animals': {'synced': 0, 'failed': 0, 'conflicts': 0},
        'tracking': {'synced': 0, 'failed': 0, 'conflicts': 0},
        'observations': {'synced': 0, 'failed': 0, 'conflicts': 0},
        'errors': []
    }
    
    total_items = 0
    synced_items = 0
    conflict_items = 0
    failed_items = 0
    
    try:
        animals_data = request.data.get('animals', [])
        total_items += len(animals_data)
        
        for animal_data in animals_data:
            local_id = animal_data.get('id') or animal_data.get('local_id')
            
            try:
                existing = SyncQueue.objects.filter(
                    local_id=local_id,
                    data_type='animal',
                    status='completed'
                ).first()
                
                if existing:
                    results['animals']['conflicts'] += 1
                    conflict_items += 1
                    continue
                
                serializer = AnimalSerializer(data=animal_data, context={'request': request})
                if serializer.is_valid():
                    animal = serializer.save()
                    
                    SyncQueue.objects.create(
                        device_id=device_id,
                        user=request.user,
                        data_type='animal',
                        local_id=local_id,
                        server_id=animal.id,
                        data=animal_data,
                        status='completed',
                        synced_at=timezone.now()
                    )
                    
                    results['animals']['synced'] += 1
                    synced_items += 1
                else:
                    results['animals']['failed'] += 1
                    results['errors'].append({
                        'type': 'animal',
                        'local_id': local_id,
                        'errors': serializer.errors
                    })
                    failed_items += 1
                    
            except Exception as e:
                logger.error(f"Error syncing animal {local_id}: {e}")
                results['animals']['failed'] += 1
                results['errors'].append({
                    'type': 'animal',
                    'local_id': local_id,
                    'error': str(e)
                })
                failed_items += 1
        
        tracking_data = request.data.get('tracking', [])
        total_items += len(tracking_data)
        
        for track_data in tracking_data:
            local_id = track_data.get('id') or track_data.get('local_id')
            
            try:
                animal_id = track_data.get('animal') or track_data.get('animal_id')
                timestamp = track_data.get('timestamp')
                lat = track_data.get('lat')
                lon = track_data.get('lon')
                
                if animal_id and timestamp:
                    existing = Tracking.objects.filter(
                        animal_id=animal_id,
                        timestamp=timestamp,
                        lat=lat,
                        lon=lon
                    ).first()
                    
                    if existing:
                        results['tracking']['conflicts'] += 1
                        conflict_items += 1
                        continue
                
                serializer = TrackingSerializer(data=track_data, context={'request': request})
                if serializer.is_valid():
                    tracking = serializer.save()
                    
                    SyncQueue.objects.create(
                        device_id=device_id,
                        user=request.user,
                        data_type='tracking',
                        local_id=local_id,
                        server_id=tracking.id,
                        data=track_data,
                        status='completed',
                        synced_at=timezone.now()
                    )
                    
                    results['tracking']['synced'] += 1
                    synced_items += 1
                else:
                    results['tracking']['failed'] += 1
                    results['errors'].append({
                        'type': 'tracking',
                        'local_id': local_id,
                        'errors': serializer.errors
                    })
                    failed_items += 1
                    
            except Exception as e:
                logger.error(f"Error syncing tracking {local_id}: {e}")
                results['tracking']['failed'] += 1
                results['errors'].append({
                    'type': 'tracking',
                    'local_id': local_id,
                    'error': str(e)
                })
                failed_items += 1
        
        observations_data = request.data.get('observations', [])
        total_items += len(observations_data)
        
        for obs_data in observations_data:
            local_id = obs_data.get('id') or obs_data.get('local_id')
            
            try:
                serializer = ObservationSerializer(data=obs_data, context={'request': request})
                if serializer.is_valid():
                    observation = serializer.save()
                    
                    SyncQueue.objects.create(
                        device_id=device_id,
                        user=request.user,
                        data_type='observation',
                        local_id=local_id,
                        server_id=observation.id,
                        data=obs_data,
                        status='completed',
                        synced_at=timezone.now()
                    )
                    
                    results['observations']['synced'] += 1
                    synced_items += 1
                else:
                    results['observations']['failed'] += 1
                    results['errors'].append({
                        'type': 'observation',
                        'local_id': local_id,
                        'errors': serializer.errors
                    })
                    failed_items += 1
                    
            except Exception as e:
                logger.error(f"Error syncing observation {local_id}: {e}")
                results['observations']['failed'] += 1
                results['errors'].append({
                    'type': 'observation',
                    'local_id': local_id,
                    'error': str(e)
                })
                failed_items += 1
        
        sync_log.total_items = total_items
        sync_log.synced_items = synced_items
        sync_log.conflict_items = conflict_items
        sync_log.failed_items = failed_items
        sync_log.completed_at = timezone.now()
        sync_log.duration_seconds = (sync_log.completed_at - sync_log.started_at).total_seconds()
        sync_log.save()
        
        results['summary'] = {
            'total_items': total_items,
            'synced': synced_items,
            'conflicts': conflict_items,
            'failed': failed_items,
            'success_rate': f"{(synced_items / total_items * 100):.1f}%" if total_items > 0 else "0%",
            'duration_seconds': sync_log.duration_seconds
        }
        
        return Response(results, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Sync session error: {e}", exc_info=True)
        
        sync_log.failed_items = total_items
        sync_log.completed_at = timezone.now()
        sync_log.save()
        
        return Response(
            {
                'error': 'Sync session failed',
                'detail': str(e),
                'sync_id': sync_log.id
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
