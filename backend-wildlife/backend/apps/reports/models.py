from django.db import models
from django.contrib.auth import get_user_model
from apps.animals.models import Animal
from apps.corridors.models import Corridor
import uuid

User = get_user_model()

class ReportCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_categories'
        managed = True
        ordering = ['name']
        verbose_name_plural = 'Report Categories'
    
    def __str__(self):
        return self.name

class ReportTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('movement_analysis', 'Movement Analysis'),
        ('corridor_effectiveness', 'Corridor Effectiveness'),
        ('conflict_incidents', 'Conflict Incidents'),
        ('species_distribution', 'Species Distribution'),
        ('habitat_quality', 'Habitat Quality'),
        ('custom', 'Custom Report'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    category = models.ForeignKey(
        ReportCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='templates'
    )
    config = models.JSONField(default=dict, help_text="Template configuration and parameters")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_templates'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    category = models.ForeignKey(
        ReportCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    
    date_from = models.DateTimeField(null=True, blank=True)
    date_to = models.DateTimeField(null=True, blank=True)
    species_filter = models.CharField(max_length=100, blank=True, default='', help_text="Filter by species")
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    corridor = models.ForeignKey(
        Corridor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    
    data = models.JSONField(default=dict, help_text="Aggregated report data and statistics")
    summary = models.JSONField(default=dict, help_text="Executive summary metrics")
    charts = models.JSONField(default=dict, help_text="Chart configurations and data")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='pdf')
    file_url = models.CharField(max_length=500, blank=True, default='', help_text="URL to generated report file")
    file_size = models.IntegerField(null=True, blank=True, help_text="File size in bytes")
    
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    generated_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.status})"

