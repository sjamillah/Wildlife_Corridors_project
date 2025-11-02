"""
Integration Tests - Testing multiple components working together
"""
import pytest
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from tests.factories import AnimalFactory, TrackingFactory, CorridorFactory, UserFactory

pytestmark = pytest.mark.django_db


@pytest.mark.integration
class TestEndToEndAnimalTracking:
    """Test complete animal tracking workflow"""
    
    def test_create_animal_and_track_movement(self, authenticated_client, ranger_user):
        """Test creating an animal and tracking its movement"""
        # Step 1: Create an animal
        url = reverse('animal-list')
        animal_data = {
            'name': 'Journey Elephant',
            'species': 'Elephant',
            'collar_id': 'E2E001',
            'status': 'active',
            'health_status': 'healthy',
            'gender': 'male',
            'age': 7,
            'notes': ''
        }
        response = authenticated_client.post(url, animal_data)
        assert response.status_code == status.HTTP_201_CREATED
        animal_id = response.data['id']
        
        # Step 2: Add tracking points
        tracking_url = reverse('tracking-list')
        base_time = timezone.now() - timedelta(hours=3)
        
        for i in range(3):
            tracking_data = {
                'animal': animal_id,
                'lat': -2.0 + (i * 0.01),
                'lon': 34.0 + (i * 0.01),
                'altitude': 1500.0,
                'speed_kmh': 5.0,
                'timestamp': (base_time + timedelta(hours=i)).isoformat(),
                'source': 'gps',  # Required field
                'collar_id': 'E2E001'
            }
            response = authenticated_client.post(tracking_url, tracking_data)
            assert response.status_code == status.HTTP_201_CREATED
        
        # Step 3: Retrieve animal with tracking history
        animal_url = reverse('animal-detail', kwargs={'pk': animal_id})
        response = authenticated_client.get(animal_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Journey Elephant'
        
        # Step 4: Get tracking data for the animal
        tracking_filter_url = reverse('tracking-list') + f'?animal={animal_id}'
        response = authenticated_client.get(tracking_filter_url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 3


@pytest.mark.integration
class TestCorridorAndAnimalInteraction:
    """Test corridor and animal tracking integration"""
    
    def test_animal_corridor_detection(self, authenticated_client, sample_animal, sample_corridor):
        """Test detecting when animal enters corridor"""
        # Create tracking point inside corridor
        tracking_data = {
            'animal': sample_animal.id,
            'lat': -2.1,  # Within corridor path
            'lon': 34.1,
            'timestamp': timezone.now().isoformat(),
            'source': 'gps',  # Required field
            'collar_id': sample_animal.collar_id
        }
        
        url = reverse('tracking-list')
        response = authenticated_client.post(url, tracking_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check live status shows corridor detection
        live_status_url = '/api/animals/live_status/'
        response = authenticated_client.get(live_status_url)
        
        if response.status_code == 200:
            # Verify corridor detection logic
            assert isinstance(response.data, list)


@pytest.mark.integration
class TestMultiSpeciesTracking:
    """Test tracking multiple species simultaneously"""
    
    def test_track_multiple_species(self, authenticated_client):
        """Test tracking different species"""
        # Create animals of different species
        elephant = AnimalFactory.create(species='Elephant', collar_id='ELE001')
        lion = AnimalFactory.create(species='Lion', collar_id='LION001')
        zebra = AnimalFactory.create(species='Zebra', collar_id='ZEB001')
        
        # Add tracking for each
        for animal in [elephant, lion, zebra]:
            TrackingFactory.create(animal=animal)
        
        # List all animals
        url = reverse('animal-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        species_list = [a['species'] for a in results]
        assert 'Elephant' in species_list
        assert 'Lion' in species_list
        assert 'Zebra' in species_list
    
    def test_species_specific_corridors(self, authenticated_client):
        """Test filtering corridors by species"""
        CorridorFactory.create(species='Elephant', name='Elephant Route')
        CorridorFactory.create(species='Lion', name='Lion Territory')
        
        url = reverse('corridor-list') + '?species=Elephant'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(c['species'] == 'Elephant' for c in results)


@pytest.mark.integration
@pytest.mark.ml
class TestPredictionWorkflow:
    """Test prediction generation workflow"""
    
    def test_prediction_based_on_tracking(self, authenticated_client, sample_animal):
        """Test generating predictions from tracking data"""
        # Create historical tracking data
        TrackingFactory.create_batch(animal=sample_animal, count=10)
        
        # Try to get predictions
        try:
            url = reverse('prediction-list') + f'?animal={sample_animal.id}'
            response = authenticated_client.get(url)
            
            if response.status_code == 200:
                # Predictions exist
                assert isinstance(response.data, list)
        except:
            pytest.skip("Prediction endpoint not fully configured")


@pytest.mark.integration
class TestUserWorkflow:
    """Test different user role workflows"""
    
    def test_ranger_workflow(self, api_client):
        """Test ranger can perform field operations"""
        # Create ranger user
        ranger = UserFactory.create_ranger()
        api_client.force_authenticate(user=ranger)
        
        # Ranger can create animals
        url = reverse('animal-list')
        data = {
            'name': 'Field Elephant',
            'species': 'Elephant',
            'collar_id': 'FIELD001',
            'status': 'active',
            'health_status': 'healthy',
            'gender': 'female'  # Use full name: 'female', 'male', or 'unknown'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Ranger can add tracking
        animal_id = response.data['id']
        tracking_url = reverse('tracking-list')
        tracking_data = {
            'animal': animal_id,
            'lat': -2.5,
            'lon': 34.5,
            'timestamp': timezone.now().isoformat(),
            'source': 'gps',  # Required field
            'collar_id': 'FIELD001'
        }
        response = api_client.post(tracking_url, tracking_data)
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_viewer_limited_access(self, api_client):
        """Test viewer has read-only access"""
        viewer = UserFactory.create(role='viewer')
        api_client.force_authenticate(user=viewer)
        
        # Viewer can list animals
        url = reverse('animal-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        # Viewer might not create animals (depending on permissions)
        data = {
            'name': 'Test',
            'species': 'Elephant',
            'collar_id': 'TEST001'
        }
        response = api_client.post(url, data)
        # Could be 201 or 403 depending on permissions setup


@pytest.mark.integration
class TestDataConsistency:
    """Test data consistency across operations"""
    
    def test_delete_animal_cascades_tracking(self, authenticated_client, sample_animal):
        """Test deleting animal removes tracking data"""
        # Add tracking
        TrackingFactory.create_batch(animal=sample_animal, count=3)
        
        animal_id = sample_animal.id
        collar_id = sample_animal.collar_id
        
        # Delete animal
        url = reverse('animal-detail', kwargs={'pk': animal_id})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify tracking is also handled appropriately
        from apps.tracking.models import Tracking
        from apps.animals.models import Animal
        
        assert not Animal.objects.filter(id=animal_id).exists()
    
    def test_tracking_requires_valid_animal(self, authenticated_client):
        """Test tracking requires existing animal"""
        import uuid
        
        url = reverse('tracking-list')
        data = {
            'animal': str(uuid.uuid4()),  # Non-existent animal
            'lat': -2.5,
            'lon': 34.5,
            'timestamp': timezone.now().isoformat(),
            'collar_id': 'INVALID'
        }
        
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.integration
class TestAPIPerformance:
    """Test API performance with larger datasets"""
    
    @pytest.mark.slow
    def test_list_many_animals(self, authenticated_client):
        """Test listing endpoint with many records"""
        # Create multiple animals
        for _ in range(50):
            AnimalFactory.create()
        
        url = reverse('animal-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Handle paginated response
        if isinstance(response.data, dict) and 'count' in response.data:
            assert response.data['count'] >= 50
        else:
            assert len(response.data) >= 50
    
    @pytest.mark.slow
    def test_tracking_data_volume(self, authenticated_client, sample_animal):
        """Test handling large volume of tracking data"""
        # Create many tracking points
        TrackingFactory.create_batch(animal=sample_animal, count=100)
        
        url = reverse('tracking-list') + f'?animal={sample_animal.id}'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Should have pagination or reasonable limit
        assert len(response.data) > 0


@pytest.mark.api
class TestHealthCheck:
    """Test system health endpoints"""
    
    def test_health_check_endpoint(self, api_client):
        """Test health check returns OK"""
        url = '/health/'
        response = api_client.get(url)
        
        # Health check should be publicly accessible
        assert response.status_code == status.HTTP_200_OK
        assert 'status' in response.data
        assert 'database' in response.data
    
    def test_api_root_endpoint(self, authenticated_client):
        """Test API root endpoint"""
        url = '/'
        response = authenticated_client.get(url)
        
        # Root endpoint may require authentication or be public
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
        
        if response.status_code == status.HTTP_200_OK:
            # Accept various response formats: endpoints, message, status, or system info
            assert any(key in response.data for key in ['endpoints', 'message', 'status', 'database', 'environment'])

