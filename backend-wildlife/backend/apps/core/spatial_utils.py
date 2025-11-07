from shapely.geometry import Point, Polygon, LineString, shape
from shapely.ops import nearest_points
import logging
import json

logger = logging.getLogger(__name__)

def point_in_polygon(lat, lon, polygon_geojson):
    try:
        point = Point(lon, lat)
        
        if isinstance(polygon_geojson, dict):
            if 'type' in polygon_geojson and 'coordinates' in polygon_geojson:
                polygon = shape(polygon_geojson)
            elif 'coordinates' in polygon_geojson:
                coords = polygon_geojson['coordinates']
                if isinstance(coords[0], list):
                    polygon = Polygon(coords[0])
                else:
                    polygon = Polygon(coords)
            else:
                return False
        elif isinstance(polygon_geojson, (list, tuple)):
            polygon = Polygon(polygon_geojson)
        else:
            return False
        
        return polygon.contains(point)
        
    except Exception as e:
        logger.warning(f"Error checking point in polygon: {e}")
        return False

def distance_to_geometry(lat, lon, geometry_geojson):
    try:
        point = Point(lon, lat)
        
        if isinstance(geometry_geojson, dict):
            geom = shape(geometry_geojson)
        else:
            return None
        
        nearest = nearest_points(point, geom)[1]
        
        dx = (point.x - nearest.x) * 111
        dy = (point.y - nearest.y) * 111
        distance_km = (dx**2 + dy**2) ** 0.5
        
        return distance_km
        
    except Exception as e:
        logger.warning(f"Error calculating distance: {e}")
        return None

def check_corridor_containment(lat, lon, corridor):
    try:
        point = Point(lon, lat)
        
        corridor_geom = None
        
        if corridor.path:
            path_coords = corridor.path
            if isinstance(path_coords, list) and len(path_coords) > 0:
                if isinstance(path_coords[0], (list, tuple)) and len(path_coords[0]) >= 2:
                    coords = [(p[1] if len(p) >= 2 else p['lon'], p[0] if len(p) >= 2 else p['lat']) 
                             if isinstance(p, (list, tuple)) 
                             else (p.get('lon', 0), p.get('lat', 0)) 
                             for p in path_coords]
                    corridor_geom = LineString(coords).buffer(0.01)
                    
        elif corridor.start_point and corridor.end_point:
            start = corridor.start_point
            end = corridor.end_point
            
            start_coord = (start.get('lon', start[1] if isinstance(start, (list, tuple)) else 0),
                          start.get('lat', start[0] if isinstance(start, (list, tuple)) else 0))
            end_coord = (end.get('lon', end[1] if isinstance(end, (list, tuple)) else 0),
                        end.get('lat', end[0] if isinstance(end, (list, tuple)) else 0))
            
            corridor_geom = LineString([start_coord, end_coord]).buffer(0.01)
        
        if not corridor_geom:
            return False, None, None
        
        is_inside = corridor_geom.contains(point)
        
        distance = distance_to_geometry(lat, lon, {'type': 'LineString', 'coordinates': list(corridor_geom.exterior.coords)})
        
        return is_inside, corridor.name, distance
        
    except Exception as e:
        logger.error(f"Error checking corridor containment: {e}")
        return False, None, None

def calculate_conflict_risk(lat, lon, conflict_zones, corridors):
    try:
        point = Point(lon, lat)
        
        for corridor in corridors:
            is_inside, corridor_name, _ = check_corridor_containment(lat, lon, corridor)
            if is_inside:
                return {
                    'risk_level': 'Low',
                    'reason': f'Inside protected corridor: {corridor_name}',
                    'corridor_name': corridor_name,
                    'distance_to_conflict': None,
                    'conflict_zone': None
                }
        
        min_distance = float('inf')
        nearest_zone = None
        inside_conflict = False
        
        for zone in conflict_zones:
            if not zone.is_active:
                continue
            
            if point_in_polygon(lat, lon, zone.geometry):
                inside_conflict = True
                nearest_zone = zone
                min_distance = 0
                break
            
            distance = distance_to_geometry(lat, lon, zone.geometry)
            if distance and distance < min_distance:
                min_distance = distance
                nearest_zone = zone
        
        if inside_conflict:
            risk_level = 'High'
            reason = f'Inside {nearest_zone.get_zone_type_display()}: {nearest_zone.name}'
        elif min_distance < 2.0:
            risk_level = 'Medium'
            reason = f'{min_distance:.2f}km from {nearest_zone.get_zone_type_display()}: {nearest_zone.name}'
        else:
            risk_level = 'Low'
            reason = 'Outside corridor but far from conflict zones'
        
        return {
            'risk_level': risk_level,
            'reason': reason,
            'corridor_name': None,
            'distance_to_conflict': min_distance if min_distance != float('inf') else None,
            'conflict_zone': {
                'name': nearest_zone.name,
                'type': nearest_zone.get_zone_type_display(),
                'risk': nearest_zone.get_risk_level_display()
            } if nearest_zone else None
        }
        
    except Exception as e:
        logger.error(f"Error calculating conflict risk: {e}", exc_info=True)
        return {
            'risk_level': 'Unknown',
            'reason': 'Error calculating risk',
            'corridor_name': None,
            'distance_to_conflict': None,
            'conflict_zone': None
        }

def create_corridor_buffer(corridor_path, buffer_km=1.0):
    try:
        if not corridor_path or len(corridor_path) < 2:
            return None
        
        coords = [(p[1], p[0]) if isinstance(p, (list, tuple)) else (p.get('lon', 0), p.get('lat', 0)) 
                 for p in corridor_path]
        
        line = LineString(coords)
        
        buffer_degrees = buffer_km / 111.0
        
        return line.buffer(buffer_degrees)
        
    except Exception as e:
        logger.error(f"Error creating corridor buffer: {e}")
        return None

