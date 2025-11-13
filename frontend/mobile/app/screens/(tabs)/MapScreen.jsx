import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import SmartMap from '../../../components/maps/SmartMap';
import { LogoHeader } from '../../../components/ui/LogoHeader';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { animals as animalsService, tracking, corridors as corridorsService, predictions } from '../../services';
import { useWebSocket } from '../../hooks';

const MapScreen = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnimalPanel, setShowAnimalPanel] = useState(false);
  const [showMLPanel, setShowMLPanel] = useState(false);
  
  // WebSocket integration for real-time updates
  const { 
    animals: wsAnimals, 
    isConnected, 
    connectionStatus,
    alerts: wsAlerts,
    lastUpdate,
    animalPaths 
  } = useWebSocket({
    autoConnect: true,
    onAlert: (alert) => {
      // Show notification for alerts with icon and severity
      const alertTitle = alert.icon + ' ' + (alert.severity === 'critical' || alert.severity === 'high' ? 'CRITICAL ALERT' : 'Wildlife Alert');
      Alert.alert(
        alertTitle,
        `${alert.animalName || 'Unknown animal'}\n${alert.message || 'Alert received'}`,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    },
    onPositionUpdate: (data) => {
      console.log('Position update received:', data.animals?.length || 0, 'animals');
    }
  });
  
  // Data states
  const [corridors, setCorridors] = useState([]);
  const [animalPredictions, setAnimalPredictions] = useState({});
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  
  // ML Feature Toggles (ranger field tools)
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showMyLocation, setShowMyLocation] = useState(true);

  // Transform WebSocket animals to display format
  const [animals, setAnimals] = useState([]);
  
  useEffect(() => {
    if (wsAnimals && wsAnimals.length > 0) {
      const transformedAnimals = wsAnimals.map(animal => {
        const activity = animal.movement?.activity_type || animal.behavior_state || 'Unknown';
        const riskLevel = animal.risk_level || 'Low';
        const speed = animal.movement?.speed_kmh || animal.speed || 0;
        
        // Determine marker color based on state
        let markerColor = STATUS_COLORS.SUCCESS; // Default green
        if (riskLevel === 'High' || riskLevel === 'critical' || riskLevel === 'high') {
          markerColor = STATUS_COLORS.ERROR; // Red for danger
        } else if (activity === 'resting' || activity === 'feeding' || speed < 1) {
          markerColor = STATUS_COLORS.WARNING; // Yellow for resting
        }
        
        // Get alert icon if animal has recent alerts
        const recentAlert = wsAlerts.find(alert => 
          alert.animalId === animal.id && 
          (Date.now() - new Date(alert.timestamp).getTime()) < 300000 // Within last 5 minutes
        );
        
        return {
          id: animal.id || animal.collar_id,
          species: animal.species,
          name: animal.name,
          status: animal.status === 'active' ? 'Active' : 'Inactive',
          location: animal.current_position?.location_name || animal.last_known_location || 'Unknown',
          coordinates: {
            lat: animal.current_position?.lat || animal.last_lat || 0,
            lng: animal.current_position?.lon || animal.last_lon || 0
          },
          battery: animal.collar_battery || 0,
          lastSeen: animal.last_updated || animal.last_seen || 'Unknown',
          risk: riskLevel,
          icon: animal.species?.toLowerCase().includes('elephant') ? '🐘' : 
                animal.species?.toLowerCase().includes('wildebeest') ? '🦬' : 
                animal.species?.toLowerCase().includes('lion') ? '🦁' : '🦏',
          speed: speed,
          health: animal.health_status || 'Good',
          behavior: activity,
          markerColor: markerColor,
          pathColor: animal.pathColor || markerColor,
          alertIcon: recentAlert?.icon || null,
          hasAlert: !!recentAlert,
          alertSeverity: recentAlert?.severity || null,
          // Add path data
          path: animalPaths[animal.id] || [],
        };
      });
      setAnimals(transformedAnimals);
      setLoading(false);
    }
  }, [wsAnimals, wsAlerts, animalPaths]);

  // Fallback: Fetch animals from REST API if WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      fetchAnimals();
      const interval = setInterval(fetchAnimals, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Fetch corridors
  useEffect(() => {
    fetchCorridors();
  }, []);

  // Get user location (ranger's current position)
  useEffect(() => {
    getRangerLocation();
    const interval = setInterval(getRangerLocation, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch predictions when animals change
  useEffect(() => {
    if (animals.length > 0 && showPredictions) {
      fetchPredictions();
    }
  }, [animals, showPredictions]);

  const fetchAnimals = async () => {
    try {
      const data = await animalsService.getAll({ status: 'active' });
      const transformedAnimals = (data.results || data || []).map(animal => ({
        id: animal.id || animal.collar_id,
        species: animal.species,
        name: animal.name,
        status: animal.status === 'active' ? 'Active' : 'Inactive',
        location: animal.last_known_location || 'Unknown',
        coordinates: {
          lat: animal.last_lat || 0,
          lng: animal.last_lon || 0
        },
        battery: animal.collar_battery || 0,
        lastSeen: animal.last_seen || 'Unknown',
        risk: animal.risk_level || 'Low',
        icon: animal.species?.toLowerCase().includes('elephant') ? '🐘' : 
              animal.species?.toLowerCase().includes('wildebeest') ? '🦬' : 
              animal.species?.toLowerCase().includes('lion') ? '🦁' : '🦏',
        speed: animal.speed || 0,
        health: animal.health_status || 'Good',
        behavior: animal.behavior_state || 'Unknown'
      }));
      
      setAnimals(transformedAnimals);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch animals:', error);
      setLoading(false);
    }
  };

  const fetchCorridors = async () => {
    try {
      const data = await corridorsService.getAll();
      setCorridors(data.results || data || []);
    } catch (error) {
      console.error('Failed to fetch corridors:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const predictionsData = {};
      for (const animal of animals.slice(0, 5)) { // Limit to 5 for performance
        try {
          const prediction = await predictions.getAnimalPrediction(animal.id);
          if (prediction && prediction.predicted_path) {
            predictionsData[animal.id] = {
              path: prediction.predicted_path,
              confidence: prediction.confidence || 0.7,
              model: prediction.model || 'LSTM'
            };
          }
        } catch (err) {
          console.log(`No prediction for animal ${animal.id}`);
        }
      }
      setAnimalPredictions(predictionsData);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  const getRangerLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      });
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  // Quick ranger actions
  const handleQuickReport = () => {
    Alert.alert(
      'Quick Field Report',
      'What would you like to report?',
      [
        { text: 'Wildlife Sighting', onPress: () => console.log('Sighting') },
        { text: 'Poaching Activity', onPress: () => console.log('Poaching'), style: 'destructive' },
        { text: 'Obstruction', onPress: () => console.log('Obstruction') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSOSAlert = () => {
    Alert.alert(
      'Emergency SOS',
      'Send distress signal to all nearby rangers?',
      [
        { 
          text: 'Send SOS', 
          onPress: () => {
            Alert.alert('SOS Sent', 'Emergency signal broadcasted. Help is on the way.');
            // TODO: Implement SOS functionality
          },
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTrackAnimal = (animal) => {
    setSelectedAnimal(animal);
    setShowAnimalPanel(true);
  };

  // Calculate stats
  const totalTracked = animals.length;
  const activeNow = animals.filter(a => a.status === 'Active').length;
  const highRisk = animals.filter(a => a.risk === 'High').length;
  const lowBattery = animals.filter(a => a.battery < 30).length;

  // Filter animals
  const filteredAnimals = filterSpecies === 'all' 
    ? animals 
    : animals.filter(a => a.species?.toLowerCase().includes(filterSpecies.toLowerCase()));

  const searchFilteredAnimals = searchQuery === ''
    ? filteredAnimals
    : filteredAnimals.filter(a => 
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.species?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Risk level styling
  const getRiskStyle = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'high': return { color: STATUS_COLORS.ERROR, bg: '#FEE2E2' };
      case 'medium': return { color: STATUS_COLORS.WARNING, bg: '#FEF3C7' };
      default: return { color: STATUS_COLORS.SUCCESS, bg: '#D1FAE5' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Ranger Tools */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LogoHeader title="Field Map" />
          {/* WebSocket Connection Status */}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot, 
              { backgroundColor: isConnected ? STATUS_COLORS.SUCCESS : STATUS_COLORS.WARNING }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* SOS Button */}
          <TouchableOpacity 
            style={styles.sosButton}
            onPress={handleSOSAlert}
          >
            <MaterialCommunityIcons name="alert-octagon" size={20} color={BRAND_COLORS.SURFACE} />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>

          {/* Quick Report */}
          <TouchableOpacity 
            style={styles.quickReportButton}
            onPress={handleQuickReport}
          >
            <MaterialCommunityIcons name="plus" size={24} color={BRAND_COLORS.SURFACE} />
          </TouchableOpacity>

          {/* ML Toggle */}
          <TouchableOpacity 
            style={styles.mlToggleButton}
            onPress={() => setShowMLPanel(!showMLPanel)}
          >
            <MaterialCommunityIcons name="brain" size={24} color={BRAND_COLORS.SURFACE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <SmartMap 
          animals={searchFilteredAnimals}
          corridors={showCorridors ? corridors : []}
          predictions={showPredictions ? animalPredictions : {}}
          riskZones={showRiskZones ? riskZones : []}
          userLocation={showMyLocation ? userLocation : null}
          showBehavior={showBehavior}
          onAnimalPress={handleTrackAnimal}
        />

        {/* Map Overlay Stats */}
        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="paw" size={20} color={BRAND_COLORS.PRIMARY} />
            <Text style={styles.statValue}>{totalTracked}</Text>
            <Text style={styles.statLabel}>Tracked</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="run" size={20} color={STATUS_COLORS.SUCCESS} />
            <Text style={styles.statValue}>{activeNow}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="alert" size={20} color={STATUS_COLORS.ERROR} />
            <Text style={styles.statValue}>{highRisk}</Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading wildlife data...</Text>
          </View>
        )}
      </View>

      {/* Filter Panel */}
      <View style={styles.filterPanel}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search animals..."
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Species Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {['all', 'elephant', 'wildebeest', 'lion', 'rhino'].map((species) => (
            <TouchableOpacity
              key={species}
              style={[styles.chip, filterSpecies === species && styles.chipActive]}
              onPress={() => setFilterSpecies(species)}
            >
              <Text style={[styles.chipText, filterSpecies === species && styles.chipTextActive]}>
                {species.charAt(0).toUpperCase() + species.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Animals List */}
        <ScrollView style={styles.animalsList} showsVerticalScrollIndicator={false}>
          {searchFilteredAnimals.map((animal) => {
            const riskStyle = getRiskStyle(animal.risk);
            return (
              <TouchableOpacity
                key={animal.id}
                style={[
                  styles.animalCard,
                  animal.hasAlert && { borderLeftWidth: 4, borderLeftColor: animal.markerColor }
                ]}
                onPress={() => handleTrackAnimal(animal)}
              >
                <View style={styles.animalIconContainer}>
                  <Text style={styles.animalIcon}>{animal.icon}</Text>
                  {animal.hasAlert && animal.alertIcon && (
                    <View style={[styles.alertBadge, { backgroundColor: animal.markerColor }]}>
                      <Text style={styles.alertIcon}>{animal.alertIcon}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.animalInfo}>
                  <View style={styles.animalHeader}>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: riskStyle.bg }]}>
                      <Text style={[styles.riskText, { color: riskStyle.color }]}>{animal.risk}</Text>
                    </View>
                  </View>
                  <Text style={styles.animalSpecies}>
                    {animal.species} • {animal.behavior}
                  </Text>
                  <View style={styles.animalMeta}>
                    <View style={[styles.statusDot, { backgroundColor: animal.markerColor }]} />
                    <Text style={styles.metaText}>{animal.location}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{animal.speed.toFixed(1)} km/h</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ML Features Panel (Ranger Tools) */}
      <Modal
        visible={showMLPanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMLPanel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mlPanel}>
            <View style={styles.mlHeader}>
              <Text style={styles.mlTitle}>Map Layers</Text>
              <TouchableOpacity onPress={() => setShowMLPanel(false)}>
                <MaterialCommunityIcons name="close" size={24} color={BRAND_COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.mlContent}>
              {/* Movement Predictions */}
              <View style={styles.mlSection}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={BRAND_COLORS.PRIMARY} />
                <View style={styles.mlSectionContent}>
                  <Text style={styles.mlSectionTitle}>AI Movement Predictions</Text>
                  <Text style={styles.mlSectionDesc}>Show predicted animal paths</Text>
                </View>
                <Switch
                  value={showPredictions}
                  onValueChange={setShowPredictions}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.PRIMARY }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              {/* Behavior States */}
              <View style={styles.mlSection}>
                <MaterialCommunityIcons name="brain" size={24} color={BRAND_COLORS.HIGHLIGHT} />
                <View style={styles.mlSectionContent}>
                  <Text style={styles.mlSectionTitle}>Behavior Analysis</Text>
                  <Text style={styles.mlSectionDesc}>Foraging, resting, migrating states</Text>
                </View>
                <Switch
                  value={showBehavior}
                  onValueChange={setShowBehavior}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.HIGHLIGHT }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              {/* Risk Zones */}
              <View style={styles.mlSection}>
                <MaterialCommunityIcons name="alert-circle" size={24} color={STATUS_COLORS.ERROR} />
                <View style={styles.mlSectionContent}>
                  <Text style={styles.mlSectionTitle}>Poaching Risk Zones</Text>
                  <Text style={styles.mlSectionDesc}>High-risk areas for ranger awareness</Text>
                </View>
                <Switch
                  value={showRiskZones}
                  onValueChange={setShowRiskZones}
                  trackColor={{ false: '#E5E7EB', true: STATUS_COLORS.ERROR }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              {/* Corridors */}
              <View style={styles.mlSection}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color={BRAND_COLORS.ACCENT} />
                <View style={styles.mlSectionContent}>
                  <Text style={styles.mlSectionTitle}>Wildlife Corridors</Text>
                  <Text style={styles.mlSectionDesc}>Protected movement pathways</Text>
                </View>
                <Switch
                  value={showCorridors}
                  onValueChange={setShowCorridors}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.ACCENT }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              {/* My Location */}
              <View style={styles.mlSection}>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color={STATUS_COLORS.INFO} />
                <View style={styles.mlSectionContent}>
                  <Text style={styles.mlSectionTitle}>My Location</Text>
                  <Text style={styles.mlSectionDesc}>Show my position on map</Text>
                </View>
                <Switch
                  value={showMyLocation}
                  onValueChange={setShowMyLocation}
                  trackColor={{ false: '#E5E7EB', true: STATUS_COLORS.INFO }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Animal Detail Panel */}
      {selectedAnimal && (
        <Modal
          visible={showAnimalPanel}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAnimalPanel(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.animalDetailPanel}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailIcon}>{selectedAnimal.icon}</Text>
                  <Text style={styles.detailName}>{selectedAnimal.name}</Text>
                  <Text style={styles.detailSpecies}>{selectedAnimal.species}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAnimalPanel(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={BRAND_COLORS.TEXT} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Status</Text>
                  <Text style={styles.detailValue}>{selectedAnimal.status}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Location</Text>
                  <Text style={styles.detailValue}>{selectedAnimal.location}</Text>
                  <Text style={styles.detailCoords}>
                    {selectedAnimal.coordinates.lat.toFixed(4)}, {selectedAnimal.coordinates.lng.toFixed(4)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Battery</Text>
                    <Text style={styles.detailValue}>{selectedAnimal.battery}%</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Risk Level</Text>
                    <Text style={[styles.detailValue, { color: getRiskStyle(selectedAnimal.risk).color }]}>
                      {selectedAnimal.risk}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Last Seen</Text>
                  <Text style={styles.detailValue}>{selectedAnimal.lastSeen}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Health</Text>
                  <Text style={styles.detailValue}>{selectedAnimal.health}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sosButton: {
    backgroundColor: STATUS_COLORS.ERROR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  sosText: {
    color: BRAND_COLORS.SURFACE,
    fontWeight: '700',
    fontSize: 12,
  },
  quickReportButton: {
    backgroundColor: BRAND_COLORS.ACCENT,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mlToggleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  statsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  filterPanel: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: BRAND_COLORS.TEXT,
  },
  filterChips: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: BRAND_COLORS.BACKGROUND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  chipTextActive: {
    color: BRAND_COLORS.SURFACE,
  },
  animalsList: {
    flex: 1,
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderRadius: 8,
    marginBottom: 8,
  },
  animalIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  animalIcon: {
    fontSize: 32,
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.SURFACE,
  },
  alertIcon: {
    fontSize: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  animalInfo: {
    flex: 1,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  animalName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  animalSpecies: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  animalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  metaDot: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mlPanel: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  mlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  mlTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
  },
  mlContent: {
    padding: 20,
  },
  mlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  mlSectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  mlSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    marginBottom: 2,
  },
  mlSectionDesc: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  animalDetailPanel: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  detailIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
  },
  detailSpecies: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  detailCoords: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

export default MapScreen;
