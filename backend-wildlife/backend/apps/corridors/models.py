"""
Corridors app models - matches existing database schema
"""
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Corridor(models.Model):
    """Corridor model matching the existing database schema"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('planned', 'Planned'),
        ('under_review', 'Under Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    species = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    start_point = models.JSONField()
    end_point = models.JSONField()
    path = models.JSONField(null=True, blank=True)
    optimization_score = models.FloatField(null=True, blank=True)
    optimization_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_corridors'
    )
    
    class Meta:
        db_table = 'corridors'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.species})"
