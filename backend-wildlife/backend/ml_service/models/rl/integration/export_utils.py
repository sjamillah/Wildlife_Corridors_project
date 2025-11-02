"""
Export Utilities for RL System Outputs
Exports predictions, corridors, routes, and conflict maps as GeoJSON
"""

import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pickle

class RLExportManager:
    """Manage exports of RL system outputs."""
    
    def __init__(self, output_dir: str = "exports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def export_corridors_geojson(self, corridors: Dict[str, np.ndarray], 
                                bbox: Tuple[float, float, float, float],
                                filename: str = None) -> str:
        """
        Export corridor network as GeoJSON.
        
        Args:
            corridors: Dict mapping species to corridor strength arrays
            bbox: Bounding box (min_lon, min_lat, max_lon, max_lat)
            filename: Output filename (optional)
        
        Returns:
            Path to exported file
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        
        features = []
        
        for species, corridor_map in corridors.items():
            # Extract corridor coordinates
            corridor_coords = []
            for i in range(corridor_map.shape[0]):
                for j in range(corridor_map.shape[1]):
                    if corridor_map[i, j] > 0.3:  # Threshold for corridor
                        lon = min_lon + (j / corridor_map.shape[1]) * (max_lon - min_lon)
                        lat = min_lat + (i / corridor_map.shape[0]) * (max_lat - min_lat)
                        
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lon, lat]
                            },
                            "properties": {
                                "species": species,
                                "strength": float(corridor_map[i, j]),
                                "type": "corridor"
                            }
                        }
                        features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "bbox": list(bbox),
                "corridor_count": len(features)
            }
        }
        
        filename = filename or f"corridors_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"Exported {len(features)} corridor points to {filepath}")
        return str(filepath)
    
    def export_predicted_routes(self, routes: Dict[str, List[Tuple[float, float]]],
                               filename: str = None) -> str:
        """
        Export predicted movement routes as GeoJSON LineStrings.
        
        Args:
            routes: Dict mapping species to list of (lat, lon) coordinates
            filename: Output filename (optional)
        """
        features = []
        
        for species, route_coords in routes.items():
            if len(route_coords) < 2:
                continue
            
            # Convert to GeoJSON LineString format [lon, lat]
            coordinates = [[lon, lat] for lat, lon in route_coords]
            
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "properties": {
                    "species": species,
                    "route_length": len(coordinates),
                    "type": "predicted_route"
                }
            }
            features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "route_count": len(features)
            }
        }
        
        filename = filename or f"predicted_routes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"Exported {len(features)} routes to {filepath}")
        return str(filepath)
    
    def export_conflict_heatmap(self, conflict_map: np.ndarray,
                               bbox: Tuple[float, float, float, float],
                               filename: str = None) -> str:
        """
        Export conflict risk heatmap as GeoJSON.
        
        Args:
            conflict_map: 2D array of conflict risk scores
            bbox: Bounding box
            filename: Output filename (optional)
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        
        features = []
        
        for i in range(conflict_map.shape[0]):
            for j in range(conflict_map.shape[1]):
                if conflict_map[i, j] > 0.1:  # Only export significant risks
                    lon = min_lon + (j / conflict_map.shape[1]) * (max_lon - min_lon)
                    lat = min_lat + (i / conflict_map.shape[0]) * (max_lat - min_lat)
                    
                    # Create square polygon for heatmap cell
                    cell_size_lon = (max_lon - min_lon) / conflict_map.shape[1]
                    cell_size_lat = (max_lat - min_lat) / conflict_map.shape[0]
                    
                    coordinates = [
                        [lon, lat],
                        [lon + cell_size_lon, lat],
                        [lon + cell_size_lon, lat + cell_size_lat],
                        [lon, lat + cell_size_lat],
                        [lon, lat]
                    ]
                    
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [coordinates]
                        },
                        "properties": {
                            "conflict_risk": float(conflict_map[i, j]),
                            "type": "conflict_heatmap"
                        }
                    }
                    features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "bbox": list(bbox),
                "risk_cells": len(features)
            }
        }
        
        filename = filename or f"conflict_heatmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"Exported {len(features)} conflict risk cells to {filepath}")
        return str(filepath)
    
    def export_habitat_suitability_map(self, suitability_maps: Dict[str, np.ndarray],
                                     bbox: Tuple[float, float, float, float],
                                     filename: str = None) -> str:
        """Export habitat suitability maps as GeoJSON."""
        min_lon, min_lat, max_lon, max_lat = bbox
        
        features = []
        
        for species, suitability_map in suitability_maps.items():
            for i in range(suitability_map.shape[0]):
                for j in range(suitability_map.shape[1]):
                    if suitability_map[i, j] > 0.2:  # Threshold
                        lon = min_lon + (j / suitability_map.shape[1]) * (max_lon - min_lon)
                        lat = min_lat + (i / suitability_map.shape[0]) * (max_lat - min_lat)
                        
                        cell_size_lon = (max_lon - min_lon) / suitability_map.shape[1]
                        cell_size_lat = (max_lat - min_lat) / suitability_map.shape[0]
                        
                        coordinates = [
                            [lon, lat],
                            [lon + cell_size_lon, lat],
                            [lon + cell_size_lon, lat + cell_size_lat],
                            [lon, lat + cell_size_lat],
                            [lon, lat]
                        ]
                        
                        feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [coordinates]
                            },
                            "properties": {
                                "species": species,
                                "suitability": float(suitability_map[i, j]),
                                "type": "habitat_suitability"
                            }
                        }
                        features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "exported_at": datetime.now().isoformat(),
                "bbox": list(bbox)
            }
        }
        
        filename = filename or f"habitat_suitability_{datetime.now().strftime('%Y%m%d_%H%M%S')}.geojson"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        return str(filepath)
    
    def save_model_metadata(self, model_path: str, 
                           species: str,
                           algorithm: str,
                           model_loader_info: Dict[str, Any],
                           environment_conditions: Dict[str, Any],
                           filename: str = None) -> str:
        """
        Save model metadata with version tracking.
        
        Args:
            model_path: Path to saved model
            species: Species name
            algorithm: Algorithm used
            model_loader_info: Info from ModelLoader.get_model_info()
            environment_conditions: Environmental parameters
            filename: Output filename (optional)
        """
        metadata = {
            "timestamp": datetime.now().isoformat(),
            "model_path": model_path,
            "species": species,
            "algorithm": algorithm,
            "model_dependencies": {
                "hmm_available": species in model_loader_info.get("hmm_species", []),
                "bbmm_available": species in model_loader_info.get("bbmm_species", []),
                "xgboost_available": species in model_loader_info.get("xgboost_species", []),
                "lstm_available": model_loader_info.get("lstm_loaded", False)
            },
            "environment": environment_conditions,
            "model_versions": model_loader_info.get("metadata", {})
        }
        
        filename = filename or f"model_metadata_{species}_{algorithm}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Saved model metadata to {filepath}")
        return str(filepath)
    
    def save_environment_state(self, env, filename: str = None) -> str:
        """Save environment state as pickle for later restoration."""
        state = {
            "habitat_quality": env.habitat_quality,
            "corridor_strength": env.corridor_strength,
            "terrain_grid": env.terrain_grid,
            "animals": [(a.species, a.x, a.y, a.lat, a.lon) for a in env.animals],
            "budget": env.budget,
            "conflicts": env.conflicts,
            "timestamp": datetime.now().isoformat()
        }
        
        filename = filename or f"env_state_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        filepath = self.output_dir / filename
        
        with open(filepath, 'wb') as f:
            pickle.dump(state, f)
        
        print(f"Saved environment state to {filepath}")
        return str(filepath)

