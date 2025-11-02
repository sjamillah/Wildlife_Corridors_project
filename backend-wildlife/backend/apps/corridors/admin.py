from django.contrib import admin
from .models import Corridor

@admin.register(Corridor)
class CorridorAdmin(admin.ModelAdmin):
    list_display = ['name', 'species', 'status', 'created_at']
    list_filter = ['species', 'status', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
