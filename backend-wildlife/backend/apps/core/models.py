from django.db import models
from django.utils import timezone
import uuid

class ConflictZone(models.Model):
    ZONE_TYPE_CHOICES = [
        ('agriculture', 'Agricultural Land'),
        ('settlement', 'Human Settlement'),
        ('road', 'Road/Highway'),
        ('infrastructure', 'Infrastructure'),
        ('protected_area', 'Protected Area'),
        ('buffer_zone', 'Buffer Zone'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('high', 'High Risk'),
        ('medium', 'Medium Risk'),
        ('low', 'Low Risk'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    zone_type = models.CharField(max_length=50, choices=ZONE_TYPE_CHOICES)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='medium')
    geometry = models.JSONField(help_text="GeoJSON geometry for the conflict zone")
    buffer_distance_km = models.FloatField(default=1.0, help_text="Buffer distance in kilometers")
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conflict_zones'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_zone_type_display()})"

class WildlifeAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('high_risk_zone', 'High Risk Zone Entry'),
        ('poaching_risk', 'Potential Poaching Activity'),
        ('corridor_exit', 'Left Wildlife Corridor'),
        ('rapid_movement', 'Rapid/Unusual Movement'),
        ('low_battery', 'Low Collar Battery'),
        ('weak_signal', 'Weak Signal Strength'),
        ('stationary_too_long', 'Animal Stationary Too Long'),
        ('unusual_behavior', 'Unusual Behavior Detected'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('false_alarm', 'False Alarm'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    animal = models.ForeignKey('animals.Animal', on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    title = models.CharField(max_length=255)
    message = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    conflict_zone = models.ForeignKey(
        ConflictZone, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alerts'
    )
    detected_at = models.DateTimeField(default=timezone.now)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts'
    )
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wildlife_alerts'
        managed = True
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['animal', '-detected_at']),
            models.Index(fields=['status', 'severity']),
            models.Index(fields=['alert_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.animal.name}: {self.title}"
    
    def acknowledge(self, user):
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        self.acknowledged_by = user
        self.save()
    
    def resolve(self, user):
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.acknowledged_by = user
        self.save()

