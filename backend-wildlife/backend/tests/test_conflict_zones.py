import pytest
from django.urls import reverse
from rest_framework import status
from apps.core.models import ConflictZone
from tests.factories import UserFactory

pytestmark = [pytest.mark.django_db, pytest.mark.api]

@pytest.mark.api
class TestConflictZoneAPI:
    def test_create_conflict_zone(self, authenticated_client):
        url = reverse('conflict-zone-list')
        data = {
            'name': 'Test Agricultural Zone',
            'zone_type': 'agriculture',
            'risk_level': 'high',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [37.5, -2.5],
                        [37.6, -2.5],
                        [37.6, -2.6],
                        [37.5, -2.6],
                        [37.5, -2.5]
                    ]
                ]
            },
            'buffer_distance_km': 2.0,
            'description': 'Test zone for validation',
            'is_active': True
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert ConflictZone.objects.filter(name='Test Agricultural Zone').exists()
        
        zone = ConflictZone.objects.get(name='Test Agricultural Zone')
        assert zone.zone_type == 'agriculture'
        assert zone.risk_level == 'high'
        assert zone.buffer_distance_km == 2.0
    
    def test_list_conflict_zones(self, authenticated_client):
        # Create test zones
        ConflictZone.objects.create(
            name='Zone 1',
            zone_type='settlement',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        ConflictZone.objects.create(
            name='Zone 2',
            zone_type='road',
            risk_level='medium',
            geometry={'type': 'Point', 'coordinates': [37.6, -2.6]}
        )
        
        url = reverse('conflict-zone-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2
    
    def test_get_conflict_zone_detail(self, authenticated_client):
        zone = ConflictZone.objects.create(
            name='Detail Test Zone',
            zone_type='agriculture',
            risk_level='low',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        
        url = reverse('conflict-zone-detail', kwargs={'pk': zone.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Detail Test Zone'
        assert response.data['zone_type'] == 'agriculture'
    
    def test_update_conflict_zone(self, authenticated_client):
        zone = ConflictZone.objects.create(
            name='Original Name',
            zone_type='agriculture',
            risk_level='low',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        
        url = reverse('conflict-zone-detail', kwargs={'pk': zone.id})
        data = {
            'name': 'Updated Name',
            'zone_type': 'settlement',
            'risk_level': 'high',
            'geometry': {'type': 'Point', 'coordinates': [37.5, -2.5]}
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        zone.refresh_from_db()
        assert zone.name == 'Updated Name'
        assert zone.zone_type == 'settlement'
        assert zone.risk_level == 'high'
    
    def test_delete_conflict_zone(self, authenticated_client):
        zone = ConflictZone.objects.create(
            name='To Delete',
            zone_type='road',
            risk_level='medium',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        
        url = reverse('conflict-zone-detail', kwargs={'pk': zone.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ConflictZone.objects.filter(id=zone.id).exists()
    
    def test_geojson_export(self, authenticated_client):
        # Create test zones
        ConflictZone.objects.create(
            name='GeoJSON Zone 1',
            zone_type='agriculture',
            risk_level='high',
            geometry={
                'type': 'Polygon',
                'coordinates': [[[37.5, -2.5], [37.6, -2.5], [37.6, -2.6], [37.5, -2.6], [37.5, -2.5]]]
            },
            is_active=True
        )
        ConflictZone.objects.create(
            name='GeoJSON Zone 2',
            zone_type='settlement',
            risk_level='medium',
            geometry={'type': 'Point', 'coordinates': [37.7, -2.7]},
            is_active=True
        )
        
        url = reverse('conflict-zone-geojson')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'FeatureCollection'
        assert 'features' in response.data
        assert len(response.data['features']) >= 2
        
        # Verify feature structure
        feature = response.data['features'][0]
        assert 'type' in feature
        assert feature['type'] == 'Feature'
        assert 'geometry' in feature
        assert 'properties' in feature
        assert 'name' in feature['properties']
        assert 'zone_type' in feature['properties']
        assert 'risk_level' in feature['properties']
    
    def test_filter_by_zone_type(self, authenticated_client):
        ConflictZone.objects.create(
            name='Farm Zone',
            zone_type='agriculture',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        ConflictZone.objects.create(
            name='Village Zone',
            zone_type='settlement',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.6, -2.6]}
        )
        
        url = reverse('conflict-zone-list')
        response = authenticated_client.get(url, {'zone_type': 'agriculture'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        for zone in results:
            assert zone['zone_type'] == 'agriculture'
    
    def test_filter_by_risk_level(self, authenticated_client):
        ConflictZone.objects.create(
            name='High Risk Zone',
            zone_type='agriculture',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        ConflictZone.objects.create(
            name='Low Risk Zone',
            zone_type='road',
            risk_level='low',
            geometry={'type': 'Point', 'coordinates': [37.6, -2.6]}
        )
        
        url = reverse('conflict-zone-list')
        response = authenticated_client.get(url, {'risk_level': 'high'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        for zone in results:
            assert zone['risk_level'] == 'high'
    
    def test_inactive_zones_excluded_from_geojson(self, authenticated_client):
        ConflictZone.objects.create(
            name='Active Zone',
            zone_type='agriculture',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]},
            is_active=True
        )
        ConflictZone.objects.create(
            name='Inactive Zone',
            zone_type='agriculture',
            risk_level='high',
            geometry={'type': 'Point', 'coordinates': [37.6, -2.6]},
            is_active=False
        )
        
        url = reverse('conflict-zone-geojson')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that only active zones are in GeoJSON
        names = [f['properties']['name'] for f in response.data['features']]
        assert 'Active Zone' in names
        assert 'Inactive Zone' not in names

@pytest.mark.unit
class TestConflictZoneModel:
    def test_create_conflict_zone_model(self, db):
        zone = ConflictZone.objects.create(
            name='Model Test Zone',
            zone_type='infrastructure',
            risk_level='medium',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]},
            buffer_distance_km=1.5,
            description='Test description'
        )
        
        assert zone.id is not None
        assert zone.name == 'Model Test Zone'
        assert zone.zone_type == 'infrastructure'
        assert zone.risk_level == 'medium'
        assert zone.is_active is True
        assert str(zone) == 'Model Test Zone (Infrastructure)'
    
    def test_conflict_zone_defaults(self, db):
        zone = ConflictZone.objects.create(
            name='Defaults Test',
            zone_type='road',
            geometry={'type': 'Point', 'coordinates': [37.5, -2.5]}
        )
        
        assert zone.risk_level == 'medium'  # Default
        assert zone.buffer_distance_km == 1.0  # Default
        assert zone.description == ''  # Default
        assert zone.is_active is True  # Default

