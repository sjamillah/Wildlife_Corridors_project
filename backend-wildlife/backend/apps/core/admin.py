from django.contrib import admin
from .models import ConflictZone

@admin.register(ConflictZone)
class ConflictZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'zone_type', 'risk_level', 'is_active', 'created_at']
    list_filter = ['zone_type', 'risk_level', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

