import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BRAND_COLORS, STATUS_COLORS } from '../../constants/Colors';

/**
 * OpenStreetMap Component
 * Pure React Native - No dependencies
 * Works on both Web and Mobile
 */
const OSMMap = ({
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

  // Calculate marker position as percentage
  const getMarkerPosition = (marker) => {
    if (!corridorBounds) {
      return { top: '50%', left: '50%' };
    }
    
    const latRange = corridorBounds.north - corridorBounds.south;
    const lngRange = corridorBounds.east - corridorBounds.west;
    
    const top = ((corridorBounds.north - marker.lat) / latRange) * 100;
    const left = ((marker.lng - corridorBounds.west) / lngRange) * 100;
    
    return { 
      top: `${Math.max(5, Math.min(95, top))}%`, 
      left: `${Math.max(5, Math.min(95, left))}%` 
    };
  };

  return (
    <View style={[styles.container, style, { height }]}>
      {/* Map Background */}
      <View style={styles.mapBackground}>
        {/* Grid overlay */}
        {[...Array(6)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 16.67}%` }]} />
        ))}
        {[...Array(6)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineVertical, { left: `${i * 16.67}%` }]} />
        ))}

        {/* Corridor boundary */}
        {showGeofence && corridorBounds && (
          <View style={styles.corridorBoundary}>
            <View style={styles.boundaryLabel}>
              <Text style={styles.boundaryText}>Wildlife Corridor</Text>
            </View>
          </View>
        )}

        {/* Markers */}
        {markers.map((marker) => {
          const position = getMarkerPosition(marker);
          const color = getMarkerColor(marker.type, marker.priority);
          
          return (
            <View 
              key={marker.id} 
              style={[
                styles.marker, 
                position,
                { backgroundColor: color }
              ]}
            >
              <View style={[styles.markerPulse, { backgroundColor: color }]} />
            </View>
          );
        })}

        {/* User location */}
        {userLocation && (
          <View 
            style={[
              styles.userMarker, 
              getMarkerPosition({ lat: userLocation.lat, lng: userLocation.lng })
            ]}
          >
            <View style={styles.userDot} />
            <View style={[styles.userPulse, styles.pulse1]} />
            <View style={[styles.userPulse, styles.pulse2]} />
          </View>
        )}

        {/* Animal movements */}
        {animalMovements.map((movement, idx) => {
          const lastPos = movement.path[movement.path.length - 1];
          if (!lastPos) return null;
          
          return (
            <View 
              key={`animal-${idx}`}
              style={[
                styles.animalMarker,
                getMarkerPosition(lastPos),
                { backgroundColor: movement.color || STATUS_COLORS.INFO }
              ]}
            />
          );
        })}

        {/* Map attribution */}
        <View style={styles.attribution}>
          <View style={styles.attributionBadge}>
            <Text style={styles.attributionText}>
              🗺️ Maasai Mara Wildlife Corridor
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a4d2e',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#1a4d2e',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: STATUS_COLORS.SUCCESS,
    opacity: 0.1,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: STATUS_COLORS.SUCCESS,
    opacity: 0.1,
  },
  corridorBoundary: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    borderWidth: 2,
    borderColor: STATUS_COLORS.ERROR,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  boundaryLabel: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: STATUS_COLORS.ERROR,
  },
  boundaryText: {
    color: STATUS_COLORS.ERROR,
    fontSize: 8,
    fontWeight: '600',
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    elevation: 5,
  },
  markerPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.3,
    top: -2,
    left: -2,
  },
  userMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
  userPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.PRIMARY,
    top: 0,
    left: 0,
  },
  pulse1: {
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
  pulse2: {
    opacity: 0.2,
    transform: [{ scale: 2 }],
  },
  animalMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    elevation: 3,
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  attributionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: {
    color: '#333',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default OSMMap;
