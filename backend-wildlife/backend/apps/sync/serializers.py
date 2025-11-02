from rest_framework import serializers
from .models import SyncLog, SyncQueue


class SyncLogSerializer(serializers.ModelSerializer):
    """Serializer for SyncLog model"""
    
    class Meta:
        model = SyncLog
        fields = [
            'id', 'device_id', 'total_items', 'synced_items',
            'conflict_items', 'failed_items', 'started_at',
            'completed_at', 'duration_seconds', 'user'
        ]
        read_only_fields = ['id', 'user']


class SyncQueueSerializer(serializers.ModelSerializer):
    """Serializer for SyncQueue model"""
    
    class Meta:
        model = SyncQueue
        fields = [
            'id', 'device_id', 'data_type', 'local_id', 'server_id',
            'data', 'status', 'conflict_data', 'error_message',
            'attempts', 'offline_since', 'created_at', 'synced_at',
            'version', 'user'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'synced_at']


class OfflineDataUploadSerializer(serializers.Serializer):
    """Serializer for offline bulk data upload"""
    
    device_id = serializers.CharField(max_length=255, required=True)
    animals = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Array of animal objects collected offline"
    )
    tracking = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Array of GPS tracking points collected offline"
    )
    observations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Array of field observations collected offline"
    )