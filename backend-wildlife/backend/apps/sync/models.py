from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class SyncLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.CharField(max_length=255)
    total_items = models.IntegerField()
    synced_items = models.IntegerField()
    conflict_items = models.IntegerField()
    failed_items = models.IntegerField()
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sync_logs')
    
    class Meta:
        db_table = 'sync_logs'
        managed = True
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Sync {self.device_id} - {self.started_at}"

class SyncQueue(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('syncing', 'Syncing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('conflict', 'Conflict'),
    ]
    
    DATA_TYPE_CHOICES = [
        ('animal', 'Animal'),
        ('tracking', 'Tracking'),
        ('observation', 'Observation'),
        ('prediction', 'Prediction'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.CharField(max_length=255)
    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES)
    local_id = models.UUIDField()
    server_id = models.UUIDField(null=True, blank=True)
    data = models.JSONField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    conflict_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')
    attempts = models.IntegerField(default=0)
    offline_since = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    version = models.IntegerField(default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sync_queue')
    
    class Meta:
        db_table = 'sync_queue'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.data_type} - {self.status}"
