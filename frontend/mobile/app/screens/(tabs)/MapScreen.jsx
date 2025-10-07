import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Svg, Path, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 32;

const MapScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -1.4061, lng: 35.0117 });
  const [markers, setMarkers] = useState([
    { id: 1, lat: -1.4100, lng: 35.0200, type: 'alert', priority: 'critical', title: 'Elephant Poaching Alert', description: 'Suspicious activity detected near elephant herd - immediate ranger response required', timestamp: '5 mins ago' },
    { id: 2, lat: -1.3950, lng: 35.0300, type: 'alert', priority: 'high', title: 'Fence Breach', description: 'Wildlife corridor fence damaged - animals at risk of human conflict', timestamp: '15 mins ago' },
    { id: 3, lat: -1.4150, lng: 34.9900, type: 'checkpoint', title: 'Main Gate Station', description: 'Primary entrance - anti-poaching unit stationed', status: 'active' },
    { id: 4, lat: -1.3800, lng: 35.0500, type: 'checkpoint', title: 'Mara River Crossing', description: 'Wildebeest migration monitoring point - Kenya-Tanzania border corridor', status: 'active' },
    { id: 5, lat: -1.4200, lng: 34.9800, type: 'patrol', title: 'Anti-Poaching Patrol Alpha', description: 'Rangers tracking black rhino population - coordinated with Serengeti teams', status: 'in-progress' },
    { id: 6, lat: -1.3900, lng: 35.0400, type: 'vehicle', title: 'Mobile Vet Unit', description: 'Veterinary team responding to injured giraffe', status: 'moving' },
    { id: 7, lat: -1.4050, lng: 35.0150, type: 'camera', title: 'Waterhole Cam 3', description: 'Wildlife monitoring - lion pride activity recorded', status: 'online' }
  ]);
  
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapView] = useState('satellite');
  const [showGeofence, setShowGeofence] = useState(true);
  const [showPatrolRoutes, setShowPatrolRoutes] = useState(true);
  const [trackingMode, setTrackingMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [patrolPoints, setPatrolPoints] = useState([]);
  const [isAddingMarker, setIsAddingMarker] = useState(false);

  // Geofence boundaries (East Africa - Maasai Mara region)
  const geofenceBounds = {
    north: -1.3500,
    south: -1.4500,
    east: 35.1000,
    west: 34.9500
  };

  // Patrol routes (East Africa - Maasai Mara region)
  const patrolRoutes = [
    [
      { lat: -1.4000, lng: 35.0000 },
      { lat: -1.4100, lng: 35.0200 },
      { lat: -1.4200, lng: 35.0300 },
      { lat: -1.4300, lng: 35.0400 }
    ],
    [
      { lat: -1.3800, lng: 35.0100 },
      { lat: -1.3900, lng: 35.0250 },
      { lat: -1.4000, lng: 35.0350 }
    ]
  ];

  const simulateLocation = () => {
    setIsSimulating(true);
    let step = 0;
    const totalSteps = 10;
    
    const interval = setInterval(() => {
      setUserLocation(prev => {
        const newLat = prev.lat + (Math.random() - 0.5) * 0.002;
        const newLng = prev.lng + (Math.random() - 0.5) * 0.002;
        
        if (trackingMode) {
          setPatrolPoints(points => [...points, { lat: newLat, lng: newLng, timestamp: Date.now() }]);
        }
        
        return { lat: newLat, lng: newLng };
      });
      
      step++;
      if (step >= totalSteps) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1000);
  };

  const startNavigation = (targetMarker) => {
    setNavigationTarget(targetMarker);
    setIsNavigating(true);
    
    const navigationInterval = setInterval(() => {
      setUserLocation(prev => {
        const deltaLat = (targetMarker.lat - prev.lat) * 0.1;
        const deltaLng = (targetMarker.lng - prev.lng) * 0.1;
        
        const newLocation = {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng
        };
        
        const distance = Math.sqrt(Math.pow(targetMarker.lat - newLocation.lat, 2) + Math.pow(targetMarker.lng - newLocation.lng, 2));
        if (distance < 0.001) {
          clearInterval(navigationInterval);
          setIsNavigating(false);
          setNavigationTarget(null);
          Alert.alert('Navigation Complete', 'You have arrived at your destination.');
        }
        
        return newLocation;
      });
    }, 2000);
  };

  const addCustomMarker = (event) => {
    if (!isAddingMarker) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const centerLat = -1.4061;
    const centerLng = 35.0117;
    const scale = 8000;
    
    const lng = centerLng + ((locationX - MAP_SIZE / 2) / scale);
    const lat = centerLat + ((locationY - MAP_SIZE / 2) / scale);
    
    const newMarker = {
      id: markers.length + 1,
      lat: lat,
      lng: lng,
      type: 'custom',
      title: 'Custom Waypoint',
      description: 'User-added marker',
      timestamp: 'Just now'
    };
    
    setMarkers([...markers, newMarker]);
    setIsAddingMarker(false);
    setSelectedMarker(newMarker);
  };

  const isOutsideGeofence = (lat, lng) => {
    return lat < geofenceBounds.north || lat > geofenceBounds.south || 
           lng < geofenceBounds.west || lng > geofenceBounds.east;
  };

  const userOutsideGeofence = isOutsideGeofence(userLocation.lat, userLocation.lng);

  const convertCoordinateToPosition = (lat, lng) => {
    // Center coordinates for Maasai Mara: -1.4061, 35.0117
    const centerLat = -1.4061;
    const centerLng = 35.0117;
    const scale = 8000; // Scale factor for visibility
    
    return {
      x: (MAP_SIZE / 2) + ((lng - centerLng) * scale),
      y: (MAP_SIZE / 2) + ((lat - centerLat) * scale)
    };
  };

  const getMarkerColor = (marker) => {
    switch (marker.type) {
      case 'alert':
        return marker.priority === 'critical' ? '#EF4444' : '#F59E0B';
      case 'checkpoint':
        return '#8B5CF6';
      case 'vehicle':
        return '#2563EB';
      case 'camera':
        return '#6B7280';
      case 'custom':
        return '#EAB308';
      default:
        return '#6366F1';
    }
  };

  const StatusIndicators = () => (
    <View style={styles.statusContainer}>
      {isNavigating && (
        <View style={[styles.statusBadge, { backgroundColor: '#3B82F6' }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Navigating</Text>
        </View>
      )}
      {trackingMode && (
        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statusText}>Tracking: {patrolPoints.length} points</Text>
        </View>
      )}
      {userOutsideGeofence && (
        <View style={[styles.statusBadge, { backgroundColor: '#EF4444' }]}>
          <Text style={styles.statusText}>Outside Geofence!</Text>
        </View>
      )}
      {isAddingMarker && (
        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
          <Text style={styles.statusText}>Tap map to add marker</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusIndicators />
      
      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
        >
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
        >
          <Text style={styles.controlButtonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, trackingMode && styles.activeControl]}
          onPress={() => setTrackingMode(!trackingMode)}
        >
          <IconSymbol name="eye.fill" size={20} color={trackingMode ? '#10B981' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, isAddingMarker && styles.activeControl]}
          onPress={() => setIsAddingMarker(!isAddingMarker)}
        >
          <IconSymbol name="mappin" size={20} color={isAddingMarker ? '#10B981' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Map Layer Controls */}
      <View style={styles.layerControls}>
        <View style={styles.pickerContainer}>
          <View style={styles.picker}>
            <Text style={styles.pickerLabel}>{mapView}</Text>
            <IconSymbol name="chevron.down" size={16} color="#6B7280" />
          </View>
        </View>
        
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setShowGeofence(!showGeofence)}
          >
            <View style={[styles.checkboxInner, showGeofence && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Geofence</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setShowPatrolRoutes(!showPatrolRoutes)}
          >
            <View style={[styles.checkboxInner, showPatrolRoutes && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Patrol Routes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Map Display */}
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={[styles.mapArea, { transform: [{ scale: zoomLevel }] }]}
          onPress={addCustomMarker}
          activeOpacity={0.8}
        >
          {/* Base Map Background with realistic styling */}
          <View style={[
            styles.mapBackground,
            mapView === 'satellite' && styles.satelliteView,
            mapView === 'terrain' && styles.terrainView,
            mapView === 'roads' && styles.roadsView,
            mapView === 'hybrid' && styles.hybridView
          ]}>
            {/* Grid overlay for coordinate reference */}
            <View style={styles.gridOverlay}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={`grid-${i}`} style={[styles.gridLine, { top: `${i * 5}%` }]} />
              ))}
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={`grid-v-${i}`} style={[styles.gridLineVertical, { left: `${i * 5}%` }]} />
              ))}
            </View>

            {/* Geofence Boundary */}
            {showGeofence && (
              <View style={styles.geofence}>
                <View style={styles.geofenceLabel}>
                  <Text style={styles.geofenceLabelText}>RESTRICTED AREA</Text>
                </View>
              </View>
            )}

            {/* Patrol Routes with SVG paths */}
            {showPatrolRoutes && (
              <Svg style={StyleSheet.absoluteFill} width={MAP_SIZE} height={MAP_SIZE}>
                {patrolRoutes.map((route, routeIndex) => {
                  const pathData = route.map((point, index) => {
                    const pos = convertCoordinateToPosition(point.lat, point.lng);
                    return index === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`;
                  }).join(' ');
                  
                  return (
                    <Path
                      key={routeIndex}
                      d={pathData}
                      stroke="#4F46E5"
                      strokeWidth="3"
                      strokeDasharray="10,5"
                      fill="none"
                    />
                  );
                })}
              </Svg>
            )}

            {/* Patrol Tracking Trail */}
            {trackingMode && patrolPoints.length > 1 && (
              <Svg style={StyleSheet.absoluteFill} width={MAP_SIZE} height={MAP_SIZE}>
                <Path
                  d={patrolPoints.map((point, index) => {
                    const pos = convertCoordinateToPosition(point.lat, point.lng);
                    return index === 0 ? `M ${pos.x} ${pos.y}` : `L ${pos.x} ${pos.y}`;
                  }).join(' ')}
                  stroke="#10B981"
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
            )}

            {/* Navigation Line */}
            {isNavigating && navigationTarget && (
              <Svg style={StyleSheet.absoluteFill} width={MAP_SIZE} height={MAP_SIZE}>
                <Line
                  x1={convertCoordinateToPosition(userLocation.lat, userLocation.lng).x}
                  y1={convertCoordinateToPosition(userLocation.lat, userLocation.lng).y}
                  x2={convertCoordinateToPosition(navigationTarget.lat, navigationTarget.lng).x}
                  y2={convertCoordinateToPosition(navigationTarget.lat, navigationTarget.lng).y}
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </Svg>
            )}

            {/* User Location with better visibility */}
            <View style={[
              styles.userLocation,
              {
                left: convertCoordinateToPosition(userLocation.lat, userLocation.lng).x - 10,
                top: convertCoordinateToPosition(userLocation.lat, userLocation.lng).y - 10,
                backgroundColor: userOutsideGeofence ? '#EF4444' : '#3B82F6'
              }
            ]}>
              <View style={[
                styles.userLocationPing,
                { backgroundColor: userOutsideGeofence ? '#F87171' : '#93C5FD' }
              ]} />
            </View>

            {/* Enhanced Markers with Icons */}
            {markers.map(marker => {
              const position = convertCoordinateToPosition(marker.lat, marker.lng);
              const getMarkerIcon = (markerType, markerTitle) => {
                if (markerType === 'alert') return 'alert-circle';
                if (markerType === 'checkpoint') return 'shield-check';
                if (markerType === 'patrol') return 'account-group';
                if (markerType === 'vehicle') return 'car';
                if (markerType === 'camera') return 'camera';
                if (markerTitle.toLowerCase().includes('poaching')) return 'elephant';
                if (markerTitle.toLowerCase().includes('fence')) return 'fence';
                if (markerTitle.toLowerCase().includes('vet')) return 'medical-bag';
                if (markerTitle.toLowerCase().includes('waterhole')) return 'water';
                return 'map-marker';
              };
              
              return (
                <TouchableOpacity
                  key={marker.id}
                  style={[
                    styles.markerContainer,
                    {
                      left: position.x - 15,
                      top: position.y - 15,
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                  }}
                >
                  <View style={[
                    styles.marker,
                    { backgroundColor: getMarkerColor(marker) }
                  ]}>
                    <MaterialCommunityIcons 
                      name={getMarkerIcon(marker.type, marker.title)} 
                      size={16} 
                      color="white" 
                    />
                  </View>
                  <View style={[styles.markerPing, { backgroundColor: getMarkerColor(marker) }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </View>

      {/* Enhanced Marker Details Popup */}
      {selectedMarker && (
        <View style={styles.markerPopup}>
          <View style={styles.popupHeader}>
            <View style={styles.popupInfo}>
              <Text style={styles.popupTitle}>{selectedMarker.title}</Text>
              <Text style={styles.popupDescription}>{selectedMarker.description}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedMarker(null)}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark.circle.fill" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.popupMeta}>
            <Text style={styles.metaText}>Type: {selectedMarker.type}</Text>
            {selectedMarker.priority && <Text style={styles.metaText}>Priority: {selectedMarker.priority}</Text>}
            {selectedMarker.status && <Text style={styles.metaText}>Status: {selectedMarker.status}</Text>}
            {selectedMarker.timestamp && <Text style={styles.metaText}>{selectedMarker.timestamp}</Text>}
          </View>

          <View style={styles.popupActions}>
            <TouchableOpacity
              onPress={() => startNavigation(selectedMarker)}
              disabled={isNavigating}
              style={[
                styles.actionButton,
                styles.navigateButton,
                isNavigating && styles.disabledButton
              ]}
            >
              <Text style={[styles.actionButtonText, isNavigating && styles.disabledButtonText]}>
                {isNavigating ? 'Navigating...' : 'Navigate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.detailsButton]}>
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
            {selectedMarker.type === 'alert' && (
              <TouchableOpacity style={[styles.actionButton, styles.resolveButton]}>
                <Text style={styles.actionButtonText}>Resolve</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Map Legend */}
      <View style={styles.legend}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Critical Alert</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>High Alert</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>Checkpoint</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.legendText}>Vehicle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.legendText}>Camera</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
            <Text style={styles.legendText}>Custom</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Geofence</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDashLine} />
            <Text style={styles.legendText}>Patrol Route</Text>
          </View>
        </ScrollView>
      </View>

      {/* Enhanced Simulate Location Button */}
      <View style={styles.simulateContainer}>
        <TouchableOpacity
          onPress={simulateLocation}
          disabled={isSimulating}
          style={[
            styles.simulateButton,
            isSimulating && styles.simulateButtonDisabled
          ]}
        >
          <Text style={[
            styles.simulateButtonText,
            isSimulating && styles.simulateButtonTextDisabled
          ]}>
            {isSimulating ? 'Simulating Movement...' : 'Simulate Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mapControls: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 20,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeControl: {
    backgroundColor: '#DCFCE7',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  layerControls: {
    position: 'absolute',
    top: 80,
    left: 16,
    zIndex: 20,
    gap: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  checkboxContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 10,
    color: '#374151',
  },
  mapContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 200,
    paddingBottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    alignSelf: 'center',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  satelliteView: {
    backgroundColor: '#22543D',
  },
  terrainView: {
    backgroundColor: '#8B5A2B',
  },
  roadsView: {
    backgroundColor: '#F3F4F6',
  },
  hybridView: {
    backgroundColor: '#065F46',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    height: '5%',
    borderBottomWidth: 0.5,
    borderBottomColor: '#10B981',
    opacity: 0.2,
  },
  gridLineVertical: {
    width: '5%',
    borderRightWidth: 0.5,
    borderRightColor: '#10B981',
    opacity: 0.2,
    height: '100%',
    position: 'absolute',
  },
  geofence: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '15%',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  geofenceLabel: {
    position: 'absolute',
    top: -24,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  geofenceLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userLocation: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  userLocationPing: {
    position: 'absolute',
    inset: 0,
    borderRadius: 10,
    opacity: 0.75,
  },
  markerContainer: {
    position: 'absolute',
    zIndex: 20,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerPing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    left: -3,
    top: -3,
    opacity: 0.4,
  },
  markerPopup: {
    position: 'absolute',
    bottom: 200,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  popupInfo: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  popupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 8,
  },
  popupMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  popupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
  },
  detailsButton: {
    backgroundColor: '#F3F4F6',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    maxHeight: 120,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLine: {
    width: 16,
    height: 2,
    backgroundColor: '#EF4444',
  },
  legendDashLine: {
    width: 16,
    height: 2,
    backgroundColor: '#4F46E5',
  },
  legendText: {
    fontSize: 10,
    color: '#374151',
  },
  simulateContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  simulateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simulateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  simulateButtonTextDisabled: {
    color: '#D1D5DB',
  },
});

export default MapScreen;