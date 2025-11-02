from django.contrib import admin
from .models import Prediction

@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ['prediction_type', 'animal', 'confidence', 'model_version', 'created_by', 'created_at']
    list_filter = ['prediction_type', 'created_at', 'created_by']
    search_fields = ['animal__name', 'created_by__email']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('prediction_type', 'animal', 'created_by')
        }),
        ('Data', {
            'fields': ('input_data', 'results', 'confidence', 'model_version')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('animal', 'created_by')
