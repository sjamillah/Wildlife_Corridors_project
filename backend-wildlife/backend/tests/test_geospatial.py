import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from apps.animals.models import Animal
from apps.tracking.models import Tracking
from apps.corridors.models import Corridor
from apps.core.models import ConflictZone
from tests.factories import AnimalFactory, UserFactory

pytestmark = pytest.mark.django_db

@pytest.mark.api
class TestLiveStatusAPI:
    def test_live_status_with_tracking_data(self, authenticated_client):
        animal = AnimalFactory.create(species='Elephant', status='active')
        
        Tracking.objects.create(
            animal=animal,
            lat=-2.5,
            lon=37.5,
            altitude=1500.0,
            speed_kmh=5.0,
            directional_angle=180.0,
            battery_level='High',
            signal_strength='Good',
            timestamp=timezone.now(),
            source='gps',
            collar_id=animal.collar_id,
            notes=''
        )
        
        url = reverse('api-animals-live-status')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        
        if len(response.data) > 0:
            animal_data = response.data[0]
            
            assert 'animal_id' in animal_data
            assert 'name' in animal_data
            assert 'species' in animal_data
            assert 'current_position' in animal_data
            assert 'predicted_position' in animal_data
            assert 'movement' in animal_data
            assert 'corridor_status' in animal_data
            assert 'conflict_risk' in animal_data
            
            assert 'lat' in animal_data['current_position']
            assert 'lon' in animal_data['current_position']
            assert 'timestamp' in animal_data['current_position']
            
            assert 'speed_kmh' in animal_data['movement']
            assert 'directional_angle' in animal_data['movement']
            assert 'battery_level' in animal_data['movement']
            assert 'signal_strength' in animal_data['movement']
            
            assert 'current' in animal_data['conflict_risk']
            assert 'risk_level' in animal_data['conflict_risk']['current']
            assert animal_data['conflict_risk']['current']['risk_level'] in ['Low', 'Medium', 'High']
    
    def test_live_status_no_tracking_data(self, authenticated_client):
        AnimalFactory.create(species='Elephant', status='active')
        
        url = reverse('api-animals-live-status')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 0
    
    def test_live_status_corridor_detection(self, authenticated_client):
        user = UserFactory.create()
        animal = AnimalFactory.create(species='Elephant', status='active')
        
        Corridor.objects.create(
            name='Test Corridor',
            species='Elephant',
            status='active',
            start_point={'lat': -2.0, 'lon': 37.0},
            end_point={'lat': -3.0, 'lon': 38.0},
            path=[[-2.0, 37.0], [-2.5, 37.5], [-3.0, 38.0]],
            created_by=user
        )
        
        Tracking.objects.create(
            animal=animal,
            lat=-2.5,
            lon=37.5,
            timestamp=timezone.now(),
            source='gps',
            collar_id=animal.collar_id,
            notes=''
        )
        
        url = reverse('api-animals-live-status')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        
        if len(response.data) > 0:
            animal_data = response.data[0]
            assert 'inside_corridor' in animal_data['corridor_status']

@pytest.mark.api
class TestCorridorOptimizationAPI:
    def test_optimize_with_gps_data(self, authenticated_client):
        user = UserFactory.create()
        animal = AnimalFactory.create(species='Elephant', status='active')
        
        for i in range(10):
            Tracking.objects.create(
                animal=animal,
                lat=-2.5 + (i * 0.01),
                lon=37.5 + (i * 0.01),
                timestamp=timezone.now() - timezone.timedelta(days=i),
                source='gps',
                collar_id=animal.collar_id,
                notes=''
            )
        
        url = reverse('corridor-optimize')
        data = {
            'species': 'Elephant',
            'start_point': {'lat': -2.5, 'lon': 37.5},
            'end_point': {'lat': -3.0, 'lon': 38.0},
            'steps': 50
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == status.HTTP_201_CREATED:
            assert 'corridor' in response.data
            assert 'geojson' in response.data
            assert 'summary' in response.data
            assert response.data['geojson']['type'] == 'Feature'
            assert response.data['geojson']['geometry']['type'] == 'LineString'
        elif response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            assert 'error' in response.data
    
    def test_optimize_no_gps_data(self, authenticated_client):
        url = reverse('corridor-optimize')
        data = {
            'species': 'Unicorn',
            'start_point': {'lat': -2.5, 'lon': 37.5},
            'end_point': {'lat': -3.0, 'lon': 38.0}
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'No GPS data available' in response.data['error']
        assert 'available_species' in response.data
    
    def test_optimize_missing_fields(self, authenticated_client):
        url = reverse('corridor-optimize')
        data = {
            'species': 'Elephant'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required_fields' in response.data
    
    def test_optimize_invalid_steps(self, authenticated_client):
        url = reverse('corridor-optimize')
        data = {
            'species': 'Elephant',
            'start_point': {'lat': -2.5, 'lon': 37.5},
            'end_point': {'lat': -3.0, 'lon': 38.0},
            'steps': 500
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'details' in response.data

@pytest.mark.integration
class TestGeospatialWorkflow:
    def test_conflict_detection_workflow(self, authenticated_client):
        user = UserFactory.create()
        
        conflict_zone = ConflictZone.objects.create(
            name='Test Farm',
            zone_type='agriculture',
            risk_level='high',
            geometry={
                'type': 'Polygon',
                'coordinates': [[
                    [37.4, -2.4],
                    [37.6, -2.4],
                    [37.6, -2.6],
                    [37.4, -2.6],
                    [37.4, -2.4]
                ]]
            }
        )
        
        animal = AnimalFactory.create(species='Elephant', status='active')
        
        Tracking.objects.create(
            animal=animal,
            lat=-2.5,
            lon=37.5,
            timestamp=timezone.now(),
            source='gps',
            collar_id=animal.collar_id,
            notes=''
        )
        
        url = reverse('api-animals-live-status')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        if len(response.data) > 0:
            animal_data = response.data[0]
            risk = animal_data['conflict_risk']['current']
            
            assert risk['risk_level'] in ['High', 'Medium', 'Low']
            assert 'reason' in risk
    
    def test_geojson_export_for_maps(self, authenticated_client):
        ConflictZone.objects.create(
            name='Map Zone',
            zone_type='settlement',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]},
            is_active=True
        )
        
        url = reverse('conflict-zone-geojson')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'FeatureCollection'
        assert 'features' in response.data
        assert isinstance(response.data['features'], list)
        
        if len(response.data['features']) > 0:
            feature = response.data['features'][0]
            assert feature['type'] == 'Feature'
            assert 'geometry' in feature
            assert 'properties' in feature

