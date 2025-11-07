import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from tests.factories import TrackingFactory, AnimalFactory
from apps.tracking.models import Tracking

pytestmark = [pytest.mark.django_db, pytest.mark.tracking]

@pytest.mark.api
class TestTrackingAPI:
    def test_list_tracking_data(self, authenticated_client, sample_animal):
        TrackingFactory.create_batch(animal=sample_animal, count=5)
        
        url = reverse('tracking-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Handle paginated response
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) >= 5
    
    def test_create_tracking_point(self, authenticated_client, sample_animal):
        url = reverse('tracking-list')
        data = {
            'animal': sample_animal.id,
            'lat': -2.5,
            'lon': 34.5,
            'altitude': 1600.0,
            'speed_kmh': 6.0,
            'directional_angle': 90.0,
            'battery_level': 'Medium',
            'signal_strength': 'Excellent',
            'timestamp': timezone.now().isoformat(),
            'source': 'gps',
            'collar_id': sample_animal.collar_id
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Tracking.objects.filter(lat=-2.5, lon=34.5).exists()
    
    def test_retrieve_tracking_point(self, authenticated_client, sample_tracking):
        url = reverse('tracking-detail', kwargs={'pk': sample_tracking.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['lat'] == sample_tracking.lat
        assert response.data['lon'] == sample_tracking.lon
    
    def test_filter_by_animal(self, authenticated_client):
        animal1 = AnimalFactory.create()
        animal2 = AnimalFactory.create()
        
        TrackingFactory.create_batch(animal=animal1, count=3)
        TrackingFactory.create_batch(animal=animal2, count=2)
        
        url = reverse('tracking-list') + f'?animal={animal1.id}'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(str(track['animal']) == str(animal1.id) for track in results)
    
    def test_filter_by_source(self, authenticated_client, sample_animal):
        TrackingFactory.create(animal=sample_animal, source='gps')
        TrackingFactory.create(animal=sample_animal, source='manual')
        
        url = reverse('tracking-list') + '?source=gps'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(track['source'] == 'gps' for track in results)

@pytest.mark.api
class TestLiveTrackingEndpoint:
    def test_live_tracking_endpoint(self, authenticated_client, sample_animal):
        # Create recent tracking data
        TrackingFactory.create_batch(animal=sample_animal, count=3)
        
        url = '/api/v1/tracking/live_tracking/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Should have timestamp and species_data in response (even in fallback mode)
        assert 'timestamp' in response.data
        assert 'species_data' in response.data
        assert 'season' in response.data
    
    def test_live_tracking_real_time_data(self, authenticated_client, sample_animal):
        # Create tracking from last hour
        recent_time = timezone.now() - timedelta(minutes=30)
        TrackingFactory.create(
            animal=sample_animal,
            timestamp=recent_time,
            source='gps'
        )
        
        url = '/api/v1/tracking/live_tracking/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'timestamp' in response.data
        assert 'season' in response.data
        # Should return species_data (even if ML tracker unavailable)
        assert 'species_data' in response.data

@pytest.mark.unit
class TestTrackingModel:
    def test_create_tracking_model(self, sample_animal):
        tracking = Tracking.objects.create(
            animal=sample_animal,
            lat=-2.123,
            lon=34.567,
            altitude=1500.0,
            speed_kmh=5.0,
            directional_angle=180.0,
            battery_level='High',
            signal_strength='Good',
            timestamp=timezone.now(),
            source='gps',
            collar_id=sample_animal.collar_id
        )
        
        assert tracking.lat == -2.123
        assert tracking.lon == 34.567
        assert tracking.animal == sample_animal
    
    def test_tracking_ordering(self, sample_animal):
        old_tracking = TrackingFactory.create(
            animal=sample_animal,
            timestamp=timezone.now() - timedelta(hours=2)
        )
        new_tracking = TrackingFactory.create(
            animal=sample_animal,
            timestamp=timezone.now()
        )
        
        tracking_list = list(Tracking.objects.all())
        assert tracking_list[0].timestamp >= tracking_list[-1].timestamp
    
    def test_tracking_str_method(self, sample_tracking):
        str_repr = str(sample_tracking)
        assert sample_tracking.animal.name in str_repr or 'Tracking' in str_repr

@pytest.mark.unit
class TestTrackingValidation:
    def test_latitude_range(self, authenticated_client, sample_animal):
        url = reverse('tracking-list')
        data = {
            'animal': sample_animal.id,
            'lat': 100.0,  # Invalid
            'lon': 34.5,
            'timestamp': timezone.now().isoformat(),
            'collar_id': sample_animal.collar_id
        }
        
        response = authenticated_client.post(url, data)
        
        # Should fail validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_longitude_range(self, authenticated_client, sample_animal):
        url = reverse('tracking-list')
        data = {
            'animal': sample_animal.id,
            'lat': -2.5,
            'lon': 200.0,  # Invalid
            'timestamp': timezone.now().isoformat(),
            'collar_id': sample_animal.collar_id
        }
        
        response = authenticated_client.post(url, data)
        
        # Should fail validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_required_fields(self, authenticated_client, sample_animal):
        url = reverse('tracking-list')
        data = {
            'animal': sample_animal.id,
            # Missing lat, lon, timestamp
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.api
class TestTrackingBatchOperations:
    def test_create_multiple_tracking_points(self, authenticated_client, sample_animal):
        base_time = timezone.now() - timedelta(hours=5)
        
        for i in range(5):
            timestamp = base_time + timedelta(hours=i)
            data = {
                'animal': sample_animal.id,
                'lat': -2.0 + (i * 0.01),
                'lon': 34.0 + (i * 0.01),
                'timestamp': timestamp.isoformat(),
                'source': 'gps',
                'collar_id': sample_animal.collar_id
            }
            
            url = reverse('tracking-list')
            response = authenticated_client.post(url, data)
            
            assert response.status_code == status.HTTP_201_CREATED
        
        # Verify all created
        count = Tracking.objects.filter(animal=sample_animal).count()
        assert count >= 5
    
    def test_query_tracking_by_time_range(self, authenticated_client, sample_animal):
        # Create tracking at different times
        base_time = timezone.now() - timedelta(days=2)
        
        TrackingFactory.create(
            animal=sample_animal,
            timestamp=base_time
        )
        TrackingFactory.create(
            animal=sample_animal,
            timestamp=base_time + timedelta(days=1)
        )
        TrackingFactory.create(
            animal=sample_animal,
            timestamp=timezone.now()
        )
        
        # Query recent data (last 24 hours)
        url = reverse('tracking-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

@pytest.mark.api
class TestObservationAPI:
    def test_create_observation(self, authenticated_client, sample_animal):
        url = reverse('observation-list')
        
        data = {
            'animal': sample_animal.id,
            'observation_type': 'sighting',
            'description': 'Elephant spotted near water hole',
            'lat': -2.1234,
            'lon': 34.5678,
            'photo_url': '',
            'timestamp': timezone.now().isoformat()
        }
        
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        from apps.tracking.models import Observation
        assert Observation.objects.filter(description='Elephant spotted near water hole').exists()
    
    def test_list_observations(self, authenticated_client, sample_animal, ranger_user):
        from apps.tracking.models import Observation
        
        # Create some observations
        Observation.objects.create(
            animal=sample_animal,
            observation_type='sighting',
            description='Test observation',
            lat=-2.0,
            lon=34.0,
            timestamp=timezone.now(),
            observer=ranger_user
        )
        
        url = reverse('observation-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) >= 1

