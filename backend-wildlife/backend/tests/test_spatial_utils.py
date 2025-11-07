import pytest
from apps.core.spatial_utils import (
    point_in_polygon, 
    distance_to_geometry,
    check_corridor_containment,
    calculate_conflict_risk,
    create_corridor_buffer
)
from apps.core.models import ConflictZone
from apps.corridors.models import Corridor
from tests.factories import UserFactory

pytestmark = pytest.mark.django_db

class TestPointInPolygon:
    def test_point_inside_polygon(self):
        polygon = {
            'type': 'Polygon',
            'coordinates': [[
                [37.0, -2.0],
                [38.0, -2.0],
                [38.0, -3.0],
                [37.0, -3.0],
                [37.0, -2.0]
            ]]
        }
        
        # Point in center of polygon
        assert point_in_polygon(-2.5, 37.5, polygon) is True
    
    def test_point_outside_polygon(self):
        polygon = {
            'type': 'Polygon',
            'coordinates': [[
                [37.0, -2.0],
                [38.0, -2.0],
                [38.0, -3.0],
                [37.0, -3.0],
                [37.0, -2.0]
            ]]
        }
        
        # Point far outside
        assert point_in_polygon(-1.0, 36.0, polygon) is False
    
    def test_point_on_edge(self):
        polygon = {
            'type': 'Polygon',
            'coordinates': [[
                [37.0, -2.0],
                [38.0, -2.0],
                [38.0, -3.0],
                [37.0, -3.0],
                [37.0, -2.0]
            ]]
        }
        
        # Point on edge
        result = point_in_polygon(-2.0, 37.5, polygon)
        assert isinstance(result, bool)

class TestDistanceCalculation:
    def test_distance_to_point(self):
        geometry = {
            'type': 'Point',
            'coordinates': [37.0, -2.0]
        }
        
        distance = distance_to_geometry(-2.0, 37.1, geometry)
        
        assert distance is not None
        assert distance > 0
        assert distance < 20  # Should be ~11km (0.1 degree)
    
    def test_distance_to_polygon(self):
        geometry = {
            'type': 'Polygon',
            'coordinates': [[
                [37.0, -2.0],
                [37.1, -2.0],
                [37.1, -2.1],
                [37.0, -2.1],
                [37.0, -2.0]
            ]]
        }
        
        # Point outside polygon
        distance = distance_to_geometry(-2.5, 37.5, geometry)
        
        assert distance is not None
        assert distance > 0

class TestCorridorContainment:
    def test_check_corridor_with_path(self, db):
        user = UserFactory.create()
        
        corridor = Corridor.objects.create(
            name='Test Corridor',
            species='Elephant',
            status='active',
            start_point={'lat': -2.0, 'lon': 37.0},
            end_point={'lat': -3.0, 'lon': 38.0},
            path=[
                [-2.0, 37.0],
                [-2.5, 37.5],
                [-3.0, 38.0]
            ],
            created_by=user
        )
        
        # Point inside corridor buffer
        is_inside, name, distance = check_corridor_containment(-2.5, 37.5, corridor)
        
        assert is_inside is True
        assert name == 'Test Corridor'
    
    def test_check_corridor_without_path(self, db):
        user = UserFactory.create()
        
        corridor = Corridor.objects.create(
            name='Simple Corridor',
            species='Wildebeest',
            status='active',
            start_point={'lat': -2.0, 'lon': 37.0},
            end_point={'lat': -3.0, 'lon': 38.0},
            created_by=user
        )
        
        # Point near midpoint
        is_inside, name, distance = check_corridor_containment(-2.5, 37.5, corridor)
        
        assert isinstance(is_inside, bool)
        if is_inside:
            assert name == 'Simple Corridor'

class TestConflictRiskCalculation:
    def test_risk_inside_corridor(self, db):
        user = UserFactory.create()
        
        corridor = Corridor.objects.create(
            name='Safe Corridor',
            species='Elephant',
            status='active',
            start_point={'lat': -2.0, 'lon': 37.0},
            end_point={'lat': -3.0, 'lon': 38.0},
            path=[[-2.0, 37.0], [-2.5, 37.5], [-3.0, 38.0]],
            created_by=user
        )
        
        conflict_zones = []
        corridors = [corridor]
        
        risk = calculate_conflict_risk(-2.5, 37.5, conflict_zones, corridors)
        
        assert risk['risk_level'] == 'Low'
        assert 'corridor' in risk['reason'].lower()
    
    def test_risk_inside_conflict_zone(self, db):
        zone = ConflictZone.objects.create(
            name='Danger Zone',
            zone_type='settlement',
            risk_level='high',
            geometry={
                'type': 'Polygon',
                'coordinates': [[
                    [37.0, -2.0],
                    [38.0, -2.0],
                    [38.0, -3.0],
                    [37.0, -3.0],
                    [37.0, -2.0]
                ]]
            }
        )
        
        risk = calculate_conflict_risk(-2.5, 37.5, [zone], [])
        
        assert risk['risk_level'] == 'High'
        assert zone.name in risk['reason']
    
    def test_risk_near_conflict_zone(self, db):
        zone = ConflictZone.objects.create(
            name='Nearby Zone',
            zone_type='agriculture',
            risk_level='high',
            geometry={
                'type': 'Polygon',
                'coordinates': [[
                    [37.0, -2.0],
                    [37.1, -2.0],
                    [37.1, -2.1],
                    [37.0, -2.1],
                    [37.0, -2.0]
                ]]
            }
        )
        
        # Point about 1km away
        risk = calculate_conflict_risk(-2.2, 37.2, [zone], [])
        
        # Should be medium or low risk (within or outside 2km buffer)
        assert risk['risk_level'] in ['Medium', 'Low']

class TestCorridorBuffer:
    def test_create_buffer_from_path(self):
        path = [
            [-2.0, 37.0],
            [-2.5, 37.5],
            [-3.0, 38.0]
        ]
        
        buffer = create_corridor_buffer(path, buffer_km=1.0)
        
        assert buffer is not None
        assert buffer.area > 0
    
    def test_create_buffer_invalid_path(self):
        # Empty path
        buffer = create_corridor_buffer([], buffer_km=1.0)
        assert buffer is None
        
        # Single point
        buffer = create_corridor_buffer([[-2.0, 37.0]], buffer_km=1.0)
        assert buffer is None

