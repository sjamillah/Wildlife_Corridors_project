from django.contrib import admin
from .models import Tracking, Observation

@admin.register(Tracking)
class TrackingAdmin(admin.ModelAdmin):
    list_display = ['animal', 'timestamp', 'lat', 'lon', 'source', 'created_at']
    list_filter = ['source', 'timestamp', 'created_at']
    search_fields = ['animal__name', 'collar_id']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ['observation_type', 'animal', 'observer', 'timestamp', 'created_at']
    list_filter = ['observation_type', 'timestamp', 'created_at']
    search_fields = ['animal__name', 'observer__name']
    readonly_fields = ['created_at', 'updated_at']
