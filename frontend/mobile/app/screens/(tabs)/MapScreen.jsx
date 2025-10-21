import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SmartMap from '../../../components/maps/SmartMap';
import { LogoHeader } from '../../../components/ui/LogoHeader';
import Icon from '../../../components/ui/Icon';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '../../../constants/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MapScreen = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showGeofence, setShowGeofence] = useState(true);
  const [showPatrolRoutes, setShowPatrolRoutes] = useState(true);
  const [userLocation] = useState({ lat: -1.4061, lng: 35.0117 });
  
  // Markers data
  const [markers] = useState([
    { 
      id: 1, 
      lat: -1.4100, 
      lng: 35.0200, 
      type: 'alert', 
      priority: 'critical', 
      title: 'Elephant Poaching Alert', 
      description: 'Suspicious activity detected near elephant herd',
      timestamp: '5 mins ago' 
    },
    { 
      id: 2, 
      lat: -1.3950, 
      lng: 35.0300, 
      type: 'alert',
      priority: 'high',
      title: 'Fence Breach', 
      description: 'Wildlife corridor fence damaged',
      timestamp: '15 mins ago' 
    },
    { 
      id: 3, 
      lat: -1.4150, 
      lng: 34.9900, 
      type: 'checkpoint', 
      title: 'Main Gate Station', 
      description: 'Primary entrance - anti-poaching unit stationed',
      status: 'active' 
    },
    { 
      id: 4, 
      lat: -1.3800, 
      lng: 35.0500, 
      type: 'checkpoint',
      title: 'Mara River Crossing', 
      description: 'Wildebeest migration monitoring point',
      status: 'active' 
    },
    { 
      id: 5, 
      lat: -1.4200, 
      lng: 34.9800, 
      type: 'patrol', 
      title: 'Anti-Poaching Patrol Alpha', 
      description: 'Rangers tracking black rhino population',
      status: 'in-progress' 
    },
    { 
      id: 6, 
      lat: -1.3900, 
      lng: 35.0400, 
      type: 'vehicle', 
      title: 'Mobile Vet Unit', 
      description: 'Veterinary team responding to injured giraffe',
      status: 'moving' 
    },
    { 
      id: 7, 
      lat: -1.4050, 
      lng: 35.0150, 
      type: 'camera', 
      title: 'Waterhole Cam 3', 
      description: 'Wildlife monitoring - lion pride activity recorded',
      status: 'online' 
    }
  ]);

  // Patrol routes
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

  const handleMarkerPress = (marker) => {
    Alert.alert(
      marker.title,
      `${marker.description}\n\nStatus: ${marker.priority || marker.status || 'Active'}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => console.log('View details:', marker) }
      ]
    );
  };

  const handleMapPress = (location) => {
    console.log('Map pressed at:', location);
  };

  const toggleMapStyle = () => {
    const styles = ['satellite', 'streets', 'outdoors', 'light', 'dark'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
  };

  const renderMapControls = () => (
    <View style={[styles.mapControls, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: colors.surface }]}
        onPress={toggleMapStyle}
      >
        <Icon name={WILDLIFE_ICONS.MAP} size={ICON_SIZES.md} color={colors.text} />
        <Text style={[styles.controlLabel, { color: colors.text }]}>
          {mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1)}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.controlButton, 
          { backgroundColor: showGeofence ? BRAND_COLORS.PRIMARY : colors.surface }
        ]}
        onPress={() => setShowGeofence(!showGeofence)}
      >
        <Icon 
          name={WILDLIFE_ICONS.SHIELD} 
          size={ICON_SIZES.md} 
          color={showGeofence ? BRAND_COLORS.SURFACE : colors.text} 
        />
        <Text style={[
          styles.controlLabel, 
          { color: showGeofence ? BRAND_COLORS.SURFACE : colors.text }
        ]}>
          Geofence
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.controlButton, 
          { backgroundColor: showPatrolRoutes ? STATUS_COLORS.INFO : colors.surface }
        ]}
        onPress={() => setShowPatrolRoutes(!showPatrolRoutes)}
      >
        <Icon 
          name={WILDLIFE_ICONS.ROUTE} 
          size={ICON_SIZES.md} 
          color={showPatrolRoutes ? BRAND_COLORS.SURFACE : colors.text} 
        />
        <Text style={[
          styles.controlLabel, 
          { color: showPatrolRoutes ? BRAND_COLORS.SURFACE : colors.text }
        ]}>
          Routes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMapInfo = () => (
    <View style={[styles.mapInfo, { backgroundColor: colors.surface }]}>
      <View style={styles.infoRow}>
        <Icon name={WILDLIFE_ICONS.ALERT_CIRCLE} size={ICON_SIZES.sm} color={STATUS_COLORS.ERROR} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {markers.filter(m => m.type === 'alert').length} Active Alerts
        </Text>
        </View>
      <View style={styles.infoRow}>
        <Icon name={WILDLIFE_ICONS.SHIELD_CHECK} size={ICON_SIZES.sm} color={STATUS_COLORS.SUCCESS} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {markers.filter(m => m.type === 'checkpoint').length} Checkpoints
        </Text>
        </View>
      <View style={styles.infoRow}>
        <Icon name={WILDLIFE_ICONS.PATROL} size={ICON_SIZES.sm} color={BRAND_COLORS.PRIMARY} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {markers.filter(m => m.type === 'patrol').length} Active Patrols
        </Text>
        </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <LogoHeader />
      
      {/* Map */}
      <View style={styles.mapContainer}>
        <SmartMap
          markers={markers}
          userLocation={userLocation}
          showGeofence={showGeofence}
          showPatrolRoutes={showPatrolRoutes}
          patrolRoutes={patrolRoutes}
          corridorBounds={{
            north: -1.3500,
            south: -1.4500,
            east: 35.1000,
            west: 34.9500
          }}
          animalMovements={[]}
          onMarkerPress={handleMarkerPress}
          height="100%"
        />
      </View>

      {/* Map Controls */}
      {renderMapControls()}

      {/* Map Info */}
      {renderMapInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MapScreen;
