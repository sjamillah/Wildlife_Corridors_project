import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Svg, Path, Line } from 'react-native-svg';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 32; // Account for padding

const MapScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -1.9441, lng: 30.0619 }); // Kigali
  const [markers, setMarkers] = useState([
    { id: 1, lat: -1.9506, lng: 30.0588, type: 'alert', priority: 'critical', title: 'Equipment Malfunction', description: 'Generator failure at checkpoint Alpha', timestamp: '5 mins ago' },
    { id: 2, lat: -1.9350, lng: 30.0740, type: 'alert', priority: 'high', title: 'High Temperature', description: 'Sensor reading 45°C in storage area', timestamp: '15 mins ago' },
    { id: 3, lat: -1.9580, lng: 30.0450, type: 'checkpoint', title: 'Checkpoint Alpha', description: 'Main entrance security post', status: 'active' },
    { id: 4, lat: -1.9300, lng: 30.0800, type: 'checkpoint', title: 'Checkpoint Bravo', description: 'Secondary perimeter checkpoint', status: 'active' },
    { id: 5, lat: -1.9600, lng: 30.0500, type: 'patrol', title: 'Patrol Route 1', description: 'Northern perimeter patrol path', status: 'in-progress' },
    { id: 6, lat: -1.9400, lng: 30.0650, type: 'vehicle', title: 'Ranger Vehicle 1', description: 'Mobile unit Delta-7', status: 'moving' },
    { id: 7, lat: -1.9520, lng: 30.0620, type: 'camera', title: 'Security Camera 3', description: 'Perimeter surveillance', status: 'online' }
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

  // Geofence boundaries
  const geofenceBounds = {
    north: -1.9300,
    south: -1.9600,
    east: 30.0850,
    west: 30.0400
  };

  // Patrol routes
  const patrolRoutes = [
    [
      { lat: -1.9580, lng: 30.0450 },
      { lat: -1.9520, lng: 30.0620 },
      { lat: -1.9400, lng: 30.0650 },
      { lat: -1.9350, lng: 30.0740 }
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
        
        // Add patrol point if tracking
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
    
    // Simulate navigation updates
    const navigationInterval = setInterval(() => {
      setUserLocation(prev => {
        const deltaLat = (targetMarker.lat - prev.lat) * 0.1;
        const deltaLng = (targetMarker.lng - prev.lng) * 0.1;
        
        const newLocation = {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng
        };
        
        // Check if we've arrived
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
    const x = ((locationX / MAP_SIZE - 0.5) / 1000) + 30.0619;
    const y = -((locationY / MAP_SIZE - 0.5) / 1000) - 1.9441;
    
    const newMarker = {
      id: markers.length + 1,
      lat: y,
      lng: x,
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
    return {
      x: (50 + (lng - 30.0619) * 1000) * (MAP_SIZE / 100),
      y: (50 + (lat + 1.9441) * 1000) * (MAP_SIZE / 100)
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
          {/* Map View Selector */}
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

      {/* Map Display */}
      <View style={styles.mapContainer}>
        <TouchableOpacity
          style={[styles.mapArea, { transform: [{ scale: zoomLevel }] }]}
          onPress={addCustomMarker}
          activeOpacity={0.8}
        >
          {/* Base Map Background */}
          <View style={[
            styles.mapBackground,
            mapView === 'satellite' && styles.satelliteView,
            mapView === 'terrain' && styles.terrainView,
            mapView === 'roads' && styles.roadsView,
            mapView === 'hybrid' && styles.hybridView
          ]}>
            {/* Grid overlay */}
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

            {/* Patrol Routes */}
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
                  opacity="0.8"
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

            {/* User Location */}
            <View style={[
              styles.userLocation,
              {
                left: convertCoordinateToPosition(userLocation.lat, userLocation.lng).x - 8,
                top: convertCoordinateToPosition(userLocation.lat, userLocation.lng).y - 8,
                backgroundColor: userOutsideGeofence ? '#EF4444' : '#3B82F6'
              }
            ]}>
              <View style={[
                styles.userLocationPing,
                { backgroundColor: userOutsideGeofence ? '#F87171' : '#93C5FD' }
              ]} />
              <View style={styles.userLocationArrow} />
            </View>

            {/* Markers */}
            {markers.map(marker => {
              const position = convertCoordinateToPosition(marker.lat, marker.lng);
              return (
                <TouchableOpacity
                  key={marker.id}
                  style={[
                    styles.marker,
                    {
                      left: position.x - 8,
                      top: position.y - 8,
                      backgroundColor: getMarkerColor(marker)
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                  }}
                >
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

      {/* Simulate Location Button */}
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
    // backgroundColor will be set dynamically by theme
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
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
    paddingVertical: 4,
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
    gap: 4,
    minWidth: 80,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    gap: 4,
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
    paddingTop: 280,
    paddingBottom: 200,
  },
  mapArea: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    alignSelf: 'center',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  satelliteView: {
    backgroundColor: '#10B981',
  },
  terrainView: {
    backgroundColor: '#FDE047',
  },
  roadsView: {
    backgroundColor: '#E5E7EB',
  },
  hybridView: {
    backgroundColor: '#A7F3D0',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#6B7280',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#6B7280',
  },
  geofence: {
    position: 'absolute',
    left: '25%',
    top: '20%',
    width: '50%',
    height: '60%',
    borderWidth: 4,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    borderRadius: 8,
    opacity: 0.6,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationPing: {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    opacity: 0.75,
  },
  userLocationArrow: {
    position: 'absolute',
    top: -8,
    left: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2563EB',
  },
  marker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPing: {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    opacity: 0.5,
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
  disabledButtonText: {
    color: '#6B7280',
  },
  legend: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
    maxHeight: 160,
    width: 140,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    opacity: 0.6,
  },
  legendDashLine: {
    width: 16,
    height: 2,
    backgroundColor: '#6366F1',
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