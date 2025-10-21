import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { BRAND_COLORS, STATUS_COLORS } from '../../constants/Colors';

// Set your Mapbox access token
Mapbox.setAccessToken('pk.eyJ1IjoiamFtbXktbCIsImEiOiJjbWd0YWRmNnAwMjZwMmpyN252a2d2ajd1In0.M0mjFFqLPLGPfz2mEFNBKA');

const MapboxMap = ({
  markers = [],
  userLocation = null,
  animalMovements = [],
  corridorBounds = null,
  showGeofence = true,
  showPatrolRoutes = true,
  patrolRoutes = [],
  onMarkerPress = () => {},
  style = {},
  height = 400,
}) => {
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  const defaultCenter = userLocation 
    ? [userLocation.lng, userLocation.lat]
    : [35.0117, -1.4061]; // Maasai Mara

  useEffect(() => {
    if (cameraRef.current && userLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.lng, userLocation.lat],
        zoomLevel: 12,
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

  const getMarkerColor = (type, priority) => {
    if (type === 'alert') {
      if (priority === 'critical') return STATUS_COLORS.ERROR;
      if (priority === 'high') return STATUS_COLORS.WARNING;
      return STATUS_COLORS.INFO;
    }
    const colors = {
      checkpoint: STATUS_COLORS.SUCCESS,
      patrol: STATUS_COLORS.INFO,
      vehicle: STATUS_COLORS.WARNING,
      camera: '#8B5CF6',
    };
    return colors[type] || BRAND_COLORS.PRIMARY;
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
          zoomLevel={12}
          centerCoordinate={defaultCenter}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* User Location */}
        {userLocation && (
          <Mapbox.PointAnnotation
            id="user-location"
            coordinate={[userLocation.lng, userLocation.lat]}
          >
            <View style={[styles.marker, { backgroundColor: BRAND_COLORS.PRIMARY }]}>
              <View style={styles.markerInner} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={`marker-${marker.id}`}
            coordinate={[marker.lng, marker.lat]}
            onSelected={() => onMarkerPress(marker)}
          >
            <View style={[
              styles.marker,
              { backgroundColor: getMarkerColor(marker.type, marker.priority) }
            ]}>
              <View style={styles.markerInner} />
            </View>
          </Mapbox.PointAnnotation>
        ))}

        {/* Corridor Geofence */}
        {showGeofence && corridorBounds && (
          <Mapbox.ShapeSource
            id="corridor"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [corridorBounds.west, corridorBounds.north],
                  [corridorBounds.east, corridorBounds.north],
                  [corridorBounds.east, corridorBounds.south],
                  [corridorBounds.west, corridorBounds.south],
                  [corridorBounds.west, corridorBounds.north],
                ]],
              },
            }}
          >
            <Mapbox.LineLayer
              id="corridor-line"
              style={{
                lineColor: STATUS_COLORS.ERROR,
                lineWidth: 2,
                lineDasharray: [2, 2],
              }}
            />
            <Mapbox.FillLayer
              id="corridor-fill"
              style={{
                fillColor: STATUS_COLORS.ERROR,
                fillOpacity: 0.1,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Patrol Routes */}
        {showPatrolRoutes && patrolRoutes.map((route, index) => (
          <Mapbox.ShapeSource
            key={`route-${index}`}
            id={`route-${index}`}
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route.map(p => [p.lng, p.lat]),
              },
            }}
          >
            <Mapbox.LineLayer
              id={`route-line-${index}`}
              style={{
                lineColor: BRAND_COLORS.PRIMARY,
                lineWidth: 3,
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        ))}

        {/* Animal Movements */}
        {animalMovements.map((movement, index) => {
          const lastPos = movement.path[movement.path.length - 1];
          if (!lastPos) return null;

          return (
            <React.Fragment key={`animal-${index}`}>
              <Mapbox.ShapeSource
                id={`animal-path-${index}`}
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: movement.path.map(p => [p.lng, p.lat]),
                  },
                }}
              >
                <Mapbox.LineLayer
                  id={`animal-path-line-${index}`}
                  style={{
                    lineColor: movement.color || STATUS_COLORS.INFO,
                    lineWidth: 2,
                    lineDasharray: [3, 3],
                  }}
                />
              </Mapbox.ShapeSource>

              <Mapbox.PointAnnotation
                id={`animal-${index}`}
                coordinate={[lastPos.lng, lastPos.lat]}
              >
                <View style={[styles.animalMarker, { backgroundColor: movement.color || STATUS_COLORS.INFO }]} />
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
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  animalMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default MapboxMap;

