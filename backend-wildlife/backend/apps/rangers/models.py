from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class RangerTeam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Ranger Teams"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Ranger(models.Model):
    STATUS_CHOICES = [
        ('on_duty', 'On Duty'),
        ('off_duty', 'Off Duty'),
        ('on_leave', 'On Leave'),
        ('emergency_response', 'Emergency Response'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ranger_profile')
    badge_number = models.CharField(max_length=50, unique=True)
    team = models.ForeignKey(RangerTeam, on_delete=models.SET_NULL, null=True, blank=True, related_name='rangers')
    emergency_contact = models.CharField(max_length=20, blank=True, help_text="Emergency contact person (family/supervisor)")
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='off_duty')
    last_active = models.DateTimeField(null=True, blank=True)
    device_id = models.CharField(max_length=100, blank=True, help_text="Mobile device or GPS tracker ID")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['user__name']
    
    def __str__(self):
        return f"{self.user.name} ({self.badge_number})"

class RangerTracking(models.Model):
    ACTIVITY_CHOICES = [
        ('patrolling', 'Patrolling'),
        ('stationary', 'Stationary'),
        ('responding', 'Responding to Incident'),
        ('resting', 'Resting'),
        ('traveling', 'Traveling'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ranger = models.ForeignKey(Ranger, on_delete=models.CASCADE, related_name='tracking_points')
    lat = models.FloatField()
    lon = models.FloatField()
    altitude = models.FloatField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True, help_text="GPS accuracy in meters")
    speed_kmh = models.FloatField(null=True, blank=True)
    directional_angle = models.FloatField(null=True, blank=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_CHOICES, default='patrolling')
    battery_level = models.CharField(max_length=50, blank=True, help_text="Device battery percentage or status")
    signal_strength = models.CharField(max_length=50, blank=True)
    
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ranger', '-timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.ranger.user.name} - {self.timestamp}"

class PatrolLog(models.Model):
    LOG_TYPE_CHOICES = [
        ('patrol_start', 'Patrol Start'),
        ('patrol_end', 'Patrol End'),
        ('animal_sighting', 'Animal Sighting'),
        ('emergency', 'Emergency'),
        ('incident', 'Incident'),
        ('checkpoint', 'Checkpoint'),
        ('rest_break', 'Rest Break'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ranger = models.ForeignKey(Ranger, on_delete=models.CASCADE, related_name='patrol_logs')
    team = models.ForeignKey(RangerTeam, on_delete=models.SET_NULL, null=True, blank=True, related_name='patrol_logs')
    
    log_type = models.CharField(max_length=20, choices=LOG_TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    lat = models.FloatField()
    lon = models.FloatField()
    
    animal = models.ForeignKey('animals.Animal', on_delete=models.SET_NULL, null=True, blank=True, related_name='ranger_logs')
    
    photo_url = models.URLField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_logs')
    
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['log_type', '-timestamp']),
            models.Index(fields=['priority', 'is_resolved']),
        ]
    
    def __str__(self):
        return f"{self.log_type} - {self.ranger.user.name} - {self.timestamp}"

class PatrolRoute(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    team = models.ForeignKey(RangerTeam, on_delete=models.CASCADE, related_name='patrol_routes')
    assigned_rangers = models.ManyToManyField(Ranger, related_name='assigned_routes')
    
    waypoints = models.JSONField(help_text="Array of {lat, lon, name} waypoints")
    estimated_duration_hours = models.FloatField()
    
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_routes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_start']
    
    def __str__(self):
        return f"{self.name} - {self.scheduled_start.date()}"

