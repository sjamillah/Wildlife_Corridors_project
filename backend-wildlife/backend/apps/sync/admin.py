from django.contrib import admin
from .models import SyncLog, SyncQueue

@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'total_items', 'synced_items', 'started_at', 'completed_at']
    list_filter = ['started_at']
    search_fields = ['device_id']
    readonly_fields = ['started_at', 'completed_at']

@admin.register(SyncQueue)
class SyncQueueAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'data_type', 'status', 'created_at', 'synced_at']
    list_filter = ['data_type', 'status', 'created_at']
    search_fields = ['device_id']
    readonly_fields = ['created_at', 'synced_at']
