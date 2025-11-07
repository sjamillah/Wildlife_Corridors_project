import pytest
from django.urls import reverse
from rest_framework import status
from tests.factories import AnimalFactory, UserFactory, TrackingFactory
from apps.animals.models import Animal

pytestmark = [pytest.mark.django_db, pytest.mark.animals]

@pytest.mark.api
class TestAnimalAPI:
    def test_list_animals(self, authenticated_client):
        # Create test animals
        AnimalFactory.create(name='Elephant 1', species='Elephant')
        AnimalFactory.create(name='Lion 1', species='Lion')
        
        url = reverse('animal-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) >= 2
    
    def test_create_animal(self, authenticated_client, ranger_user):
        url = reverse('animal-list')
        data = {
            'name': 'New Elephant',
            'species': 'Elephant',
            'collar_id': 'COL123',
            'status': 'active',
            'health_status': 'healthy',
            'gender': 'female',
            'age': 8,
            'notes': ''
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Animal.objects.filter(collar_id='COL123').exists()
    
    def test_retrieve_animal(self, authenticated_client, sample_animal):
        url = reverse('animal-detail', kwargs={'pk': sample_animal.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == sample_animal.name
        assert response.data['species'] == sample_animal.species
    
    def test_update_animal(self, authenticated_client, sample_animal):
        url = reverse('animal-detail', kwargs={'pk': sample_animal.id})
        data = {
            'name': sample_animal.name,
            'species': sample_animal.species,
            'collar_id': sample_animal.collar_id,
            'health_status': 'sick',
            'status': 'active',
            'gender': sample_animal.gender
        }
        
        response = authenticated_client.put(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        
        sample_animal.refresh_from_db()
        assert sample_animal.health_status == 'sick'
    
    def test_delete_animal(self, authenticated_client, sample_animal):
        url = reverse('animal-detail', kwargs={'pk': sample_animal.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Animal.objects.filter(id=sample_animal.id).exists()
    
    def test_filter_by_species(self, authenticated_client):
        AnimalFactory.create(species='Elephant')
        AnimalFactory.create(species='Elephant')
        AnimalFactory.create(species='Lion')
        
        url = reverse('animal-list') + '?species=Elephant'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(animal['species'] == 'Elephant' for animal in results)
    
    def test_filter_by_status(self, authenticated_client):
        AnimalFactory.create(status='active')
        AnimalFactory.create(status='inactive')
        
        url = reverse('animal-list') + '?status=active'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert all(animal['status'] == 'active' for animal in results)

@pytest.mark.api
class TestLiveStatusEndpoint:
    def test_live_status_endpoint(self, authenticated_client, sample_animal, sample_tracking):
        url = '/api/animals/live_status/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_live_status_with_predictions(self, authenticated_client, sample_animal):
        # Create tracking data
        TrackingFactory.create_batch(animal=sample_animal, count=5)
        
        url = '/api/animals/live_status/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        if len(response.data) > 0:
            animal_data = response.data[0]
            assert 'current_position' in animal_data or 'animal_id' in animal_data
    
    def test_live_status_corridor_check(self, authenticated_client, sample_animal, sample_corridor):
        # Create tracking near corridor
        TrackingFactory.create(
            animal=sample_animal,
            lat=-2.1,
            lon=34.1
        )
        
        url = '/api/animals/live_status/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK

@pytest.mark.unit
class TestAnimalModel:
    def test_create_animal_model(self, ranger_user):
        animal = Animal.objects.create(
            name='Test Lion',
            species='Lion',
            collar_id='COL999',
            status='active',
            health_status='healthy',
            gender='male',
            age=5,
            notes='',
            created_by=ranger_user
        )
        
        assert animal.name == 'Test Lion'
        assert animal.species == 'Lion'
        assert str(animal) == 'Test Lion (Lion)'
    
    def test_animal_unique_collar_id(self, ranger_user):
        Animal.objects.create(
            name='Animal 1',
            species='Elephant',
            collar_id='UNIQUE_COL',
            status='active',
            health_status='healthy',
            notes='',
            created_by=ranger_user
        )
        
        # Try to create another with same collar_id
        with pytest.raises(Exception):  # Should raise IntegrityError
            Animal.objects.create(
                name='Animal 2',
                species='Elephant',
                collar_id='UNIQUE_COL',
                status='active',
                health_status='healthy',
                notes='',
                created_by=ranger_user
            )
    
    def test_animal_status_choices(self, ranger_user):
        valid_statuses = ['active', 'inactive', 'deceased', 'missing']
        
        for status_choice in valid_statuses:
            animal = AnimalFactory.create(status=status_choice)
            assert animal.status == status_choice
    
    def test_animal_health_status_choices(self, ranger_user):
        valid_health = ['healthy', 'sick', 'injured', 'unknown']
        
        for health in valid_health:
            animal = AnimalFactory.create(health_status=health)
            assert animal.health_status == health

@pytest.mark.api
class TestAnimalSearch:
    def test_search_by_name(self, authenticated_client):
        AnimalFactory.create(name='Jumbo the Elephant')
        AnimalFactory.create(name='Simba the Lion')
        
        url = reverse('animal-list') + '?search=Jumbo'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert any('Jumbo' in animal['name'] for animal in results)
    
    def test_search_by_collar_id(self, authenticated_client):
        animal = AnimalFactory.create(collar_id='SEARCH123')
        
        url = reverse('animal-list') + '?search=SEARCH123'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert any(animal['collar_id'] == 'SEARCH123' for animal in results)

@pytest.mark.api
class TestAnimalPermissions:
    def test_unauthenticated_access_denied(self, api_client):
        url = reverse('animal-list')
        response = api_client.get(url)
        
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    def test_viewer_can_read(self, api_client, viewer_user):
        api_client.force_authenticate(user=viewer_user)
        
        url = reverse('animal-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_full_access(self, admin_client):
        url = reverse('animal-list')
        data = {
            'name': 'Admin Created Animal',
            'species': 'Zebra',
            'collar_id': 'ADMIN001',
            'status': 'active',
            'health_status': 'healthy',
            'gender': 'female'
        }
        
        response = admin_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED

