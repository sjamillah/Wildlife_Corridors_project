"""
Tracking app models - matches existing database schema
"""
from django.db import models
from django.contrib.auth import get_user_model
from apps.animals.models import Animal
import uuid

User = get_user_model()


class Tracking(models.Model):
    """Tracking data model matching the existing database schema"""
    
    SOURCE_CHOICES = [
        ('gps', 'GPS'),
        ('manual', 'Manual'),
        ('imported', 'Imported'),
    ]
    
    ACTIVITY_TYPE_CHOICES = [
        ('resting', 'Resting'),
        ('feeding', 'Feeding'),
        ('moving', 'Moving'),
        ('unknown', 'Unknown'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    local_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    collar_id = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField()
    lat = models.FloatField()
    lon = models.FloatField()
    altitude = models.FloatField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True)
    speed_kmh = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)
    battery_level = models.FloatField(null=True, blank=True)
    signal_strength = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES, null=True, blank=True)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    synced = models.BooleanField(default=False)
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='tracking_data')
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_tracking'
    )
    
    class Meta:
        db_table = 'tracking'
        managed = True
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.animal.name} - {self.timestamp}"


class Observation(models.Model):
    """Observation model matching the existing database schema"""
    
    OBSERVATION_TYPES = [
        ('sighting', 'Sighting'),
        ('behavior', 'Behavior'),
        ('health', 'Health'),
        ('environment', 'Environment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    local_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    observation_type = models.CharField(max_length=50, choices=OBSERVATION_TYPES)
    description = models.TextField()
    lat = models.FloatField()
    lon = models.FloatField()
    timestamp = models.DateTimeField()
    photo_url = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    synced = models.BooleanField(default=False)
    animal = models.ForeignKey(
        Animal, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='observations'
    )
    observer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='observations'
    )
    
    class Meta:
        db_table = 'observations'
        managed = True
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_observation_type_display()} - {self.timestamp}"