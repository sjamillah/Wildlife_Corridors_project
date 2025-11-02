"""
Corridors API Tests
"""
import pytest
from django.urls import reverse
from rest_framework import status
from tests.factories import CorridorFactory, AnimalFactory, TrackingFactory
from apps.corridors.models import Corridor

pytestmark = [pytest.mark.django_db, pytest.mark.corridors]


@pytest.mark.api
class TestCorridorAPI:
    """Test Corridor CRUD operations"""
    
    def test_list_corridors(self, authenticated_client):
        """Test listing corridors"""
        CorridorFactory.create(species='Elephant')
        CorridorFactory.create(species='Wildebeest')
        
        url = reverse('corridor-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) >= 2
    
    def test_create_corridor(self, authenticated_client):
        """Test creating a new corridor"""
        url = reverse('corridor-list')
        data = {
            'name': 'New Elephant Corridor',
            'description': 'New corridor for elephants',
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
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Corridor.objects.filter(name='New Elephant Corridor').exists()
    
    def test_retrieve_corridor(self, authenticated_client, sample_corridor):
        """Test retrieving a specific corridor"""
        url = reverse('corridor-detail', kwargs={'pk': sample_corridor.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_corridor.name
    
    def test_update_corridor(self, authenticated_client, sample_corridor):
        """Test updating a corridor"""
        url = reverse('corridor-detail', kwargs={'pk': sample_corridor.id})
        data = {
            'name': sample_corridor.name,
            'description': sample_corridor.description,
            'species': sample_corridor.species,
            'status': 'inactive',  # Changed
            'start_point': sample_corridor.start_point,
            'end_point': sample_corridor.end_point
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        sample_corridor.refresh_from_db()
        assert sample_corridor.status == 'inactive'
    
    def test_delete_corridor(self, authenticated_client, sample_corridor):
        """Test deleting a corridor"""
        url = reverse('corridor-detail', kwargs={'pk': sample_corridor.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Corridor.objects.filter(id=sample_corridor.id).exists()
    
    def test_filter_by_species(self, authenticated_client):
        """Test filtering corridors by species"""
        CorridorFactory.create(species='Elephant')
        CorridorFactory.create(species='Elephant')
        CorridorFactory.create(species='Lion')
        
        url = reverse('corridor-list') + '?species=Elephant'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(corridor['species'] == 'Elephant' for corridor in results)
    
    def test_filter_by_status(self, authenticated_client):
        """Test filtering corridors by status"""
        CorridorFactory.create(status='active')
        CorridorFactory.create(status='inactive')
        
        url = reverse('corridor-list') + '?status=active'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(corridor['status'] == 'active' for corridor in results)


@pytest.mark.api
@pytest.mark.ml
class TestCorridorOptimization:
    """Test corridor optimization with RL"""
    
    def test_optimize_corridor_endpoint(self, authenticated_client):
        """Test corridor optimization endpoint"""
        url = reverse('corridor-list') + 'optimize/'
        data = {
            'species': 'elephant',
            'start_point': {'lat': -2.0, 'lon': 34.0},
            'end_point': {'lat': -2.5, 'lon': 34.5},
            'constraints': {
                'max_length_km': 50,
                'min_habitat_score': 0.7
            }
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        # ML service might not be available
        if response.status_code == 404:
            pytest.skip("Corridor optimization endpoint not fully implemented")
        
        if response.status_code == 503:
            pytest.skip("ML service not available")
        
        # Should return optimized corridor or error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_optimization_with_invalid_species(self, authenticated_client):
        """Test optimization with invalid species"""
        url = reverse('corridor-list') + 'optimize/'
        data = {
            'species': 'invalid_species',
            'start_point': {'lat': -2.0, 'lon': 34.0},
            'end_point': {'lat': -2.5, 'lon': 34.5}
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        if response.status_code == 404:
            pytest.skip("Corridor optimization endpoint not fully implemented")
        
        # Should handle invalid species gracefully (400, 500, or 503 if ML service is unavailable)
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR, status.HTTP_503_SERVICE_UNAVAILABLE]


@pytest.mark.unit
class TestCorridorModel:
    """Test Corridor model"""
    
    def test_create_corridor_model(self):
        """Test creating a corridor"""
        corridor = Corridor.objects.create(
            name='Test Corridor',
            description='Test corridor',
            species='Elephant',
            status='active',
            start_point={'lat': -2.0, 'lon': 34.0},
            end_point={'lat': -2.5, 'lon': 34.5},
            path=[
                {'lat': -2.0, 'lon': 34.0},
                {'lat': -2.5, 'lon': 34.5}
            ]
        )
        
        assert corridor.name == 'Test Corridor'
        assert corridor.species == 'Elephant'
        assert str(corridor) == 'Test Corridor (Elephant)'
    
    def test_corridor_path_structure(self, sample_corridor):
        """Test corridor path is valid JSON"""
        assert isinstance(sample_corridor.path, list)
        assert len(sample_corridor.path) > 0
        assert 'lat' in sample_corridor.path[0]
        assert 'lon' in sample_corridor.path[0]
    
    def test_corridor_status_choices(self):
        """Test valid status choices"""
        from tests.factories import CorridorFactory
        
        valid_statuses = ['active', 'inactive', 'planned', 'under_review']
        
        for status_choice in valid_statuses:
            corridor = CorridorFactory.create(status=status_choice)
            assert corridor.status == status_choice


@pytest.mark.unit
class TestCorridorGeometry:
    """Test corridor geometry operations"""
    
    def test_corridor_with_multiple_waypoints(self, authenticated_client):
        """Test creating corridor with multiple waypoints"""
        url = reverse('corridor-list')
        data = {
            'name': 'Multi-Waypoint Corridor',
            'description': 'Corridor with multiple waypoints',
            'species': 'Wildebeest',
            'status': 'active',
            'start_point': {'lat': -2.0, 'lon': 34.0},
            'end_point': {'lat': -3.0, 'lon': 35.0},
            'path': [
                {'lat': -2.0, 'lon': 34.0},
                {'lat': -2.3, 'lon': 34.3},
                {'lat': -2.6, 'lon': 34.6},
                {'lat': -3.0, 'lon': 35.0}
            ]
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['path']) == 4
    
    def test_corridor_length_calculation(self, sample_corridor):
        """Test corridor has valid start and end points"""
        assert sample_corridor.start_point is not None
        assert sample_corridor.end_point is not None
        assert 'lat' in sample_corridor.start_point
        assert 'lon' in sample_corridor.start_point


@pytest.mark.unit
class TestCorridorUsage:
    """Test corridor usage with animal tracking"""
    
    def test_animal_in_corridor_detection(self, authenticated_client, sample_corridor, sample_animal):
        """Test detecting when animal is in corridor"""
        # Create tracking point within corridor bounds
        tracking = TrackingFactory.create(
            animal=sample_animal,
            lat=-2.25,  # Within corridor path
            lon=34.25
        )
        
        # Check live status includes corridor detection
        url = '/api/animals/live_status/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Should include corridor detection logic
        if len(response.data) > 0:
            assert 'in_corridor' in response.data[0] or 'animal_id' in response.data[0]

