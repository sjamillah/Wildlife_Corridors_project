import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { BRAND_COLORS, STATUS_COLORS } from '../../constants/Colors';

Mapbox.setAccessToken('pk.eyJ1IjoiamFtbXktbCIsImEiOiJjbWd0YWRmNnAwMjZwMmpyN252a2d2ajd1In0.M0mjFFqLPLGPfz2mEFNBKA');

const MapboxMap = ({
  animals = [],
  corridors = [],
  predictions = {},
  riskZones = [],
  userLocation = null,
  showBehavior = true,
  onAnimalPress = () => {},
  style = {},
  height = 400,
}) => {
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  // Default center (Maasai Mara)
  const defaultCenter = userLocation 
    ? [userLocation.longitude, userLocation.latitude]
    : [35.0117, -1.4061];

  // Center camera on user location or first animal
  useEffect(() => {
    if (cameraRef.current) {
      let center = defaultCenter;
      let zoom = 10;

      if (userLocation) {
        center = [userLocation.longitude, userLocation.latitude];
        zoom = 12;
      } else if (animals.length > 0) {
        const firstAnimal = animals[0];
        center = [firstAnimal.coordinates.lng, firstAnimal.coordinates.lat];
        zoom = 11;
      }

      cameraRef.current.setCamera({
        centerCoordinate: center,
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    }
  }, [userLocation, animals.length]);

  // Helper: Get risk color
  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'high': return STATUS_COLORS.ERROR;
      case 'medium': return STATUS_COLORS.WARNING;
      default: return STATUS_COLORS.SUCCESS;
    }
  };

  // Helper: Get behavior color
  const getBehaviorColor = (behavior) => {
    switch(behavior?.toLowerCase()) {
      case 'foraging': return '#65a30d';
      case 'resting': return '#4f46e5';
      case 'migrating': return '#d97706';
      default: return BRAND_COLORS.TEXT_SECONDARY;
    }
  };

  // Helper: Validate coordinate
  const isValidCoord = (coord) => {
    return coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && 
           !isNaN(coord.lng) &&
           Math.abs(coord.lat) <= 90 &&
           Math.abs(coord.lng) <= 180;
  };

  return (
    <View style={[styles.container, style, { height }]}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Satellite}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={10}
          centerCoordinate={defaultCenter}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* User Location (Ranger Position) */}
        {userLocation && (
          <Mapbox.PointAnnotation
            id="user-location"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerDot} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Wildlife Corridors */}
        {corridors && corridors.length > 0 && corridors.map((corridor, idx) => {
          if (!corridor.path || corridor.path.length < 2) return null;
          
          return (
            <Mapbox.ShapeSource
              key={`corridor-${idx}`}
              id={`corridor-${idx}`}
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: corridor.path.map(p => Array.isArray(p) ? [p[1], p[0]] : [p.lng || p.lon, p.lat]),
                },
              }}
            >
              <Mapbox.LineLayer
                id={`corridor-line-bg-${idx}`}
                style={{
                  lineColor: BRAND_COLORS.PRIMARY,
                  lineWidth: 12,
                  lineOpacity: 0.2,
                }}
              />
              <Mapbox.LineLayer
                id={`corridor-line-${idx}`}
                style={{
                  lineColor: BRAND_COLORS.PRIMARY,
                  lineWidth: 4,
                  lineOpacity: 0.8,
                }}
              />
            </Mapbox.ShapeSource>
          );
        })}

        {/* Risk Zones (Poaching Areas) */}
        {riskZones && riskZones.length > 0 && riskZones.map((zone, idx) => {
          if (!zone.position || !isValidCoord(zone.position)) return null;
          
          const radius = (zone.intensity || 0.5) * 5000; // meters
          
          return (
            <Mapbox.ShapeSource
              key={`risk-${idx}`}
              id={`risk-${idx}`}
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [zone.position[1], zone.position[0]],
                },
              }}
            >
              <Mapbox.CircleLayer
                id={`risk-circle-${idx}`}
                style={{
                  circleRadius: 100,
                  circleColor: STATUS_COLORS.ERROR,
                  circleOpacity: 0.3,
                }}
              />
            </Mapbox.ShapeSource>
          );
        })}

        {/* Animal Markers with Behavior States */}
        {animals.filter(animal => isValidCoord(animal.coordinates)).map((animal) => {
          const prediction = predictions[animal.id];
          const markerColor = getRiskColor(animal.risk);
          const behaviorColor = showBehavior ? getBehaviorColor(animal.behavior) : null;

          return (
            <React.Fragment key={animal.id}>
              {/* Behavior Glow (if enabled) */}
              {showBehavior && behaviorColor && (
                <Mapbox.ShapeSource
                  id={`behavior-${animal.id}`}
                  shape={{
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [animal.coordinates.lng, animal.coordinates.lat],
                    },
                  }}
                >
                  <Mapbox.CircleLayer
                    id={`behavior-circle-${animal.id}`}
                    style={{
                      circleRadius: 40,
                      circleColor: behaviorColor,
                      circleOpacity: 0.3,
                    }}
                  />
                </Mapbox.ShapeSource>
              )}

              {/* Predicted Path */}
              {prediction && prediction.path && prediction.path.length >= 2 && (
                <Mapbox.ShapeSource
                  id={`prediction-${animal.id}`}
                  shape={{
                    type: 'Feature',
                    geometry: {
                      type: 'LineString',
                      coordinates: prediction.path.map(p => Array.isArray(p) ? [p[1], p[0]] : [p.lng, p.lat]),
                    },
                  }}
                >
                  <Mapbox.LineLayer
                    id={`prediction-line-${animal.id}`}
                    style={{
                      lineColor: '#9333ea',
                      lineWidth: 3,
                      lineOpacity: prediction.confidence || 0.7,
                      lineDasharray: [5, 5],
                    }}
                  />
                </Mapbox.ShapeSource>
              )}

              {/* Animal Marker */}
              <Mapbox.PointAnnotation
                id={`animal-${animal.id}`}
                coordinate={[animal.coordinates.lng, animal.coordinates.lat]}
                onSelected={() => onAnimalPress(animal)}
              >
                <View style={styles.animalMarkerContainer}>
                  {/* Pulse effect for active animals */}
                  {animal.status === 'Active' && (
                    <View style={[styles.pulse, { backgroundColor: markerColor }]} />
                  )}
                  
                  {/* Main marker */}
                  <View style={[styles.animalMarker, { backgroundColor: markerColor }]}>
                    <Text style={styles.animalEmoji}>{animal.icon}</Text>
                  </View>
                </View>
                
                {/* Callout */}
                <Mapbox.Callout title={animal.name}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{animal.name}</Text>
                    <Text style={styles.calloutText}>{animal.species}</Text>
                    <Text style={styles.calloutText}>Status: {animal.status}</Text>
                    <Text style={styles.calloutText}>Battery: {animal.battery}%</Text>
                  </View>
                </Mapbox.Callout>
              </Mapbox.PointAnnotation>
            </React.Fragment>
          );
        })}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STATUS_COLORS.INFO,
    opacity: 0.3,
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: STATUS_COLORS.INFO,
    borderWidth: 3,
    borderColor: '#fff',
  },
  animalMarkerContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.3,
  },
  animalMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  animalEmoji: {
    fontSize: 20,
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
});

export default MapboxMap;
