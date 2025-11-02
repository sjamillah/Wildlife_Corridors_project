"""
Pytest configuration and shared fixtures for Wildlife Backend tests
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.core.management import call_command
import uuid

User = get_user_model()


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """Setup test database"""
    with django_db_blocker.unblock():
        # Run migrations if needed
        # call_command('migrate', '--noinput')
        pass


@pytest.fixture
def api_client():
    """Return API client for testing"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create admin user"""
    return User.objects.create_superuser(
        email='admin@test.com',
        password='testpass123',
        name='Admin User'
    )


@pytest.fixture
def ranger_user(db):
    """Create ranger user"""
    return User.objects.create_user(
        email='ranger@test.com',
        password='testpass123',
        name='Ranger User',
        role='ranger',
        is_active=True
    )


@pytest.fixture
def viewer_user(db):
    """Create viewer user"""
    return User.objects.create_user(
        email='viewer@test.com',
        password='testpass123',
        name='Viewer User',
        role='viewer',
        is_active=True
    )


@pytest.fixture
def authenticated_client(api_client, ranger_user):
    """Return authenticated API client"""
    api_client.force_authenticate(user=ranger_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return admin authenticated API client"""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def sample_animal(db, ranger_user):
    """Create a sample animal for testing"""
    from apps.animals.models import Animal
    return Animal.objects.create(
        name='Test Elephant',
        species='Elephant',
        collar_id='COL001',
        status='active',
        health_status='healthy',
        gender='male',
        age=10,
        notes='',
        created_by=ranger_user
    )


@pytest.fixture
def sample_tracking(db, sample_animal):
    """Create sample tracking data"""
    from apps.tracking.models import Tracking
    from datetime import datetime
    from django.utils import timezone
    
    return Tracking.objects.create(
        animal=sample_animal,
        lat=-2.1234,
        lon=34.5678,
        altitude=1500.0,
        speed_kmh=5.2,
        heading=180.0,
        accuracy=10.0,
        timestamp=timezone.now(),
        source='gps',
        collar_id='COL001',
        notes=''
    )


@pytest.fixture
def sample_corridor(db):
    """Create sample wildlife corridor"""
    from apps.corridors.models import Corridor
    
    return Corridor.objects.create(
        name='Test Corridor',
        description='Test corridor',
        species='Elephant',
        status='active',
        start_point={'lat': -2.0, 'lon': 34.0},
        end_point={'lat': -2.5, 'lon': 34.5},
        path=[
            {'lat': -2.0, 'lon': 34.0},
            {'lat': -2.25, 'lon': 34.25},
            {'lat': -2.5, 'lon': 34.5}
        ]
    )


@pytest.fixture
def jwt_tokens(api_client, ranger_user):
    """Get JWT tokens for authentication"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(ranger_user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token)
    }

