"""
Test data factories for creating model instances
"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class UserFactory:
    """Factory for creating test users"""
    
    @staticmethod
    def create(email=None, password='testpass123', **kwargs):
        if email is None:
            email = f'user{uuid.uuid4().hex[:8]}@test.com'
        
        defaults = {
            'name': 'Test User',
            'role': 'viewer',
            'is_active': True
        }
        defaults.update(kwargs)
        
        return User.objects.create_user(email=email, password=password, **defaults)
    
    @staticmethod
    def create_admin(**kwargs):
        kwargs['role'] = 'admin'
        kwargs['is_staff'] = True
        kwargs['is_superuser'] = True
        return UserFactory.create(**kwargs)
    
    @staticmethod
    def create_ranger(**kwargs):
        kwargs['role'] = 'ranger'
        return UserFactory.create(**kwargs)


class AnimalFactory:
    """Factory for creating test animals"""
    
    @staticmethod
    def create(created_by=None, **kwargs):
        from apps.animals.models import Animal
        
        if created_by is None:
            created_by = UserFactory.create_ranger()
        
        defaults = {
            'name': f'Animal {uuid.uuid4().hex[:8]}',
            'species': 'Elephant',
            'collar_id': f'COL{uuid.uuid4().hex[:6].upper()}',
            'status': 'active',
            'health_status': 'healthy',
            'gender': 'male',
            'age': 5,
            'notes': '',
            'created_by': created_by
        }
        defaults.update(kwargs)
        
        return Animal.objects.create(**defaults)


class TrackingFactory:
    """Factory for creating test tracking data"""
    
    @staticmethod
    def create(animal=None, **kwargs):
        from apps.tracking.models import Tracking
        
        if animal is None:
            animal = AnimalFactory.create()
        
        defaults = {
            'animal': animal,
            'lat': -2.0 + (hash(str(uuid.uuid4())) % 100) / 1000,
            'lon': 34.0 + (hash(str(uuid.uuid4())) % 100) / 1000,
            'altitude': 1500.0,
            'speed_kmh': 5.0,
            'heading': 180.0,
            'accuracy': 10.0,
            'timestamp': timezone.now(),
            'source': 'gps',
            'collar_id': animal.collar_id,
            'notes': ''
        }
        defaults.update(kwargs)
        
        return Tracking.objects.create(**defaults)
    
    @staticmethod
    def create_batch(animal=None, count=10, **kwargs):
        """Create multiple tracking points"""
        if animal is None:
            animal = AnimalFactory.create()
        
        tracking_points = []
        base_time = timezone.now() - timedelta(hours=count)
        
        for i in range(count):
            timestamp = base_time + timedelta(hours=i)
            tracking = TrackingFactory.create(
                animal=animal,
                timestamp=timestamp,
                **kwargs
            )
            tracking_points.append(tracking)
        
        return tracking_points


class CorridorFactory:
    """Factory for creating test corridors"""
    
    @staticmethod
    def create(**kwargs):
        from apps.corridors.models import Corridor
        
        defaults = {
            'name': f'Corridor {uuid.uuid4().hex[:8]}',
            'description': 'Test corridor',
            'species': 'Elephant',
            'status': 'active',
            'start_point': {'lat': -2.0, 'lon': 34.0},
            'end_point': {'lat': -2.5, 'lon': 34.5},
            'path': [
                {'lat': -2.0, 'lon': 34.0},
                {'lat': -2.25, 'lon': 34.25},
                {'lat': -2.5, 'lon': 34.5}
            ]
        }
        defaults.update(kwargs)
        
        return Corridor.objects.create(**defaults)


class PredictionFactory:
    """Factory for creating test predictions"""
    
    @staticmethod
    def create(animal=None, created_by=None, **kwargs):
        from apps.predictions.models import Prediction
        
        if animal is None:
            animal = AnimalFactory.create()
        
        if created_by is None:
            created_by = UserFactory.create_ranger()
        
        defaults = {
            'animal': animal,
            'prediction_type': 'movement',
            'input_data': {
                'tracking_points': 100,
                'time_range_hours': 168,
                'features': {'speed': 5.0, 'heading': 180}
            },
            'results': {
                'predicted_lat': -2.1,
                'predicted_lon': 34.1,
                'prediction_timestamp': (timezone.now() + timedelta(hours=24)).isoformat()
            },
            'confidence': 0.85,
            'model_version': 'v1.0',
            'created_by': created_by
        }
        defaults.update(kwargs)
        
        return Prediction.objects.create(**defaults)

