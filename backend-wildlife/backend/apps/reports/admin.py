from django.contrib import admin
from .models import Report, ReportCategory, ReportTemplate

@admin.register(ReportCategory)
class ReportCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'category', 'is_active', 'created_by', 'created_at']
    list_filter = ['template_type', 'category', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'format', 'generated_by', 'generated_at', 'created_at']
    list_filter = ['status', 'format', 'category', 'template']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    readonly_fields = ['generated_by', 'generated_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'template', 'category')
        }),
        ('Filters & Parameters', {
            'fields': ('date_from', 'date_to', 'species_filter', 'animal', 'corridor')
        }),
        ('Report Data', {
            'fields': ('data', 'summary', 'charts'),
            'classes': ('collapse',)
        }),
        ('Status & Output', {
            'fields': ('status', 'format', 'file_url', 'file_size', 'error_message')
        }),
        ('Metadata', {
            'fields': ('generated_by', 'generated_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

