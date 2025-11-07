from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Animal(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('deceased', 'Deceased'),
        ('missing', 'Missing'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('unknown', 'Unknown'),
    ]
    
    HEALTH_STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('injured', 'Injured'),
        ('sick', 'Sick'),
        ('unknown', 'Unknown'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    species = models.CharField(max_length=255)
    collar_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    health_status = models.CharField(max_length=50, choices=HEALTH_STATUS_CHOICES)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    synced = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_animals'
    )
    
    class Meta:
        db_table = 'animals'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.species})"

