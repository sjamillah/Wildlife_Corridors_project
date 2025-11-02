from django.contrib import admin
from .models import Animal

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ['name', 'species', 'status', 'health_status', 'created_at']
    list_filter = ['species', 'status', 'health_status', 'created_at']
    search_fields = ['name', 'species', 'collar_id']
    readonly_fields = ['created_at', 'updated_at']
