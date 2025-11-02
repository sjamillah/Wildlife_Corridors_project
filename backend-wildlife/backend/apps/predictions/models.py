"""
Prediction Models - matches existing database schema
"""
from django.db import models
from django.contrib.auth import get_user_model
from apps.animals.models import Animal
import uuid

User = get_user_model()


class Prediction(models.Model):
    """
    Model to store ML predictions (movement, habitat, corridor).
    """
    
    PREDICTION_TYPES = [
        ('movement', 'Movement Prediction'),
        ('habitat', 'Habitat Suitability'),
        ('corridor', 'Corridor Optimization'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prediction_type = models.CharField(max_length=20, choices=PREDICTION_TYPES)
    input_data = models.JSONField(default=dict)
    results = models.JSONField(default=dict)
    confidence = models.FloatField(null=True, blank=True)
    model_version = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    animal = models.ForeignKey(
        Animal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='predictions'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='predictions'
    )
    
    class Meta:
        db_table = 'predictions'
        managed = True
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_prediction_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        """Override save to auto-calculate confidence score if not set"""
        if self.confidence is None and self.results:
            # Extract confidence from results if available
            if 'summary' in self.results:
                summary = self.results['summary']
                if 'average_corridor_quality' in summary:
                    self.confidence = summary['average_corridor_quality']
                elif 'confidence' in summary:
                    self.confidence = summary['confidence']
        
        super().save(*args, **kwargs)

