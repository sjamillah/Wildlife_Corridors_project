import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Switch,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartMap from '../../../components/maps/SmartMap';
import { LogoHeader } from '../../../components/ui/LogoHeader';
import { BRAND_COLORS, STATUS_COLORS, STATUS_TINTS } from '../../../constants/Colors';

const MapScreen = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnimalPanel, setShowAnimalPanel] = useState(false);
  
  // ML Feature Toggles
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(false);
  const [showMLPanel, setShowMLPanel] = useState(false);
  
  const [animals] = useState([
    { 
      id: 'KWS-E12', 
      species: 'African Elephant', 
      name: 'Nafisa (Matriarch)', 
      status: 'Moving', 
      location: 'Kimana Corridor', 
      coordinates: { lat: -1.4061, lng: 35.0117 },
      battery: 85, 
      lastSeen: '10 min ago', 
      risk: 'High',
      icon: '🐘',
      speed: 2.3,
      health: 'Good'
    },
    { 
      id: 'KWS-E08', 
      species: 'African Elephant', 
      name: 'Bomani (Bull)', 
      status: 'Feeding', 
      location: 'Mara River', 
      coordinates: { lat: -1.3950, lng: 35.0300 },
      battery: 92, 
      lastSeen: '5 min ago', 
      risk: 'Medium',
      icon: '🐘',
      speed: 1.2,
      health: 'Excellent'
    },
    {
      id: 'WB-001',
      species: 'Wildebeest',
      name: 'Herd Alpha',
      status: 'Moving',
      location: 'Migration Route',
      coordinates: { lat: -1.4150, lng: 34.9900 },
      battery: 76,
      lastSeen: '5 min ago',
      risk: 'Medium',
      icon: '🦬',
      speed: 6.2,
      health: 'Good'
    },
    {
      id: 'WB-003',
      species: 'Wildebeest',
      name: 'Herd Beta',
      status: 'Grazing',
      location: 'Musiara Marsh',
      coordinates: { lat: -1.3800, lng: 35.0500 },
      battery: 88,
      lastSeen: '12 min ago',
      risk: 'Low',
      icon: '🦬',
      speed: 0.8,
      health: 'Excellent'
    }
  ]);

  // Calculate stats
  const totalTracked = animals.length;
  const activeNow = animals.filter(a => a.status === 'Moving' || a.status === 'Feeding').length;
  const highRisk = animals.filter(a => a.risk === 'High').length;
  const lowBattery = animals.filter(a => a.battery < 30).length;

  // Filter animals
  const filteredAnimals = filterSpecies === 'all' 
    ? animals 
    : animals.filter(a => a.species.toLowerCase().includes(filterSpecies.toLowerCase()));

  const searchFilteredAnimals = searchQuery === ''
    ? filteredAnimals
    : filteredAnimals.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Create markers for map
  const mapMarkers = searchFilteredAnimals.map(animal => ({
    id: animal.id,
    lat: animal.coordinates.lat,
    lng: animal.coordinates.lng,
    type: animal.species.toLowerCase().includes('elephant') ? 'elephant' : 'wildebeest',
    title: animal.name,
    description: `${animal.species} | ${animal.status}`,
    color: animal.risk === 'High' ? STATUS_COLORS.ERROR :
           animal.risk === 'Medium' ? BRAND_COLORS.HIGHLIGHT : STATUS_COLORS.SUCCESS
  }));

  const getBatteryColor = (battery) => {
    if (battery > 70) return STATUS_COLORS.SUCCESS;
    if (battery > 30) return BRAND_COLORS.HIGHLIGHT;
    return STATUS_COLORS.ERROR;
  };

  const getRiskColor = (risk) => {
    if (risk === 'High') return STATUS_COLORS.ERROR;
    if (risk === 'Medium') return BRAND_COLORS.HIGHLIGHT;
    return STATUS_COLORS.SUCCESS;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/screens/(tabs)/DashboardScreen')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={BRAND_COLORS.SURFACE} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Wildlife Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Status Overview Bar */}
      <View style={styles.statusBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: STATUS_TINTS.RANGERS }]}>
              <Text style={[styles.statNumber, { color: BRAND_COLORS.PRIMARY }]}>{totalTracked}</Text>
              <Text style={styles.statLabel}>TOTAL TRACKED</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: BRAND_COLORS.ACCENT + '15' }]}>
              <Text style={[styles.statNumber, { color: BRAND_COLORS.ACCENT }]}>{activeNow}</Text>
              <Text style={styles.statLabel}>ACTIVE NOW</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: STATUS_TINTS.CRITICAL }]}>
              <Text style={[styles.statNumber, { color: STATUS_COLORS.ERROR }]}>{highRisk}</Text>
              <Text style={styles.statLabel}>HIGH RISK</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: STATUS_TINTS.WARNING }]}>
              <Text style={[styles.statNumber, { color: BRAND_COLORS.HIGHLIGHT }]}>{lowBattery}</Text>
              <Text style={styles.statLabel}>LOW BATTERY</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <SmartMap
          markers={mapMarkers}
          userLocation={{ lat: -1.4061, lng: 35.0117 }}
          showGeofence={true}
          showPatrolRoutes={false}
          corridorBounds={{
            north: -1.3500,
            south: -1.4500,
            east: 35.1000,
            west: 34.9500
          }}
          height="100%"
        />

        {/* Floating Filter Pills */}
        <View style={styles.filterPills}>
          {['all', 'elephant', 'wildebeest'].map((filter) => {
            const label = filter === 'all' ? 'All' : filter === 'elephant' ? 'Elephants' : 'Wildebeest';
            const isActive = filterSpecies === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setFilterSpecies(filter)}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive
                ]}
              >
                <Text style={[
                  styles.filterPillText,
                  isActive && styles.filterPillTextActive
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ML Controls Button */}
        <TouchableOpacity 
          style={styles.mlButton}
          onPress={() => setShowMLPanel(true)}
        >
          <MaterialCommunityIcons name="brain" size={18} color={BRAND_COLORS.SURFACE} />
          <Text style={styles.mlButtonText}>ML</Text>
        </TouchableOpacity>

        {/* Animals List Button */}
        <TouchableOpacity 
          style={styles.animalsButton}
          onPress={() => setShowAnimalPanel(true)}
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color={BRAND_COLORS.SURFACE} />
          <Text style={styles.animalsButtonText}>Animals ({searchFilteredAnimals.length})</Text>
        </TouchableOpacity>
      </View>

      {/* ML Panel Modal */}
      <Modal
        visible={showMLPanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMLPanel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mlPanel}>
            <View style={styles.mlPanelHeader}>
              <View style={styles.mlPanelTitle}>
                <View style={styles.mlIcon}>
                  <MaterialCommunityIcons name="brain" size={16} color={BRAND_COLORS.SURFACE} />
                </View>
                <View>
                  <Text style={styles.mlTitle}>Model Predictions</Text>
                  <Text style={styles.mlSubtitle}>ML Analysis</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowMLPanel(false)}>
                <MaterialCommunityIcons name="close" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.mlOptions}>
              <View style={[styles.mlOption, showPredictions && styles.mlOptionActive]}>
                <View style={styles.mlOptionLeft}>
                  <MaterialCommunityIcons 
                    name="chart-line" 
                    size={16} 
                    color={STATUS_COLORS.INFO} 
                  />
                  <Text style={styles.mlOptionText}>Movement Paths</Text>
                </View>
                <Switch
                  value={showPredictions}
                  onValueChange={setShowPredictions}
                  trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.INFO }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              <View style={[styles.mlOption, showBehavior && styles.mlOptionActive]}>
                <View style={styles.mlOptionLeft}>
                  <MaterialCommunityIcons 
                    name="chart-bubble" 
                    size={16} 
                    color={STATUS_COLORS.SUCCESS} 
                  />
                  <Text style={styles.mlOptionText}>Behavior States</Text>
                </View>
                <Switch
                  value={showBehavior}
                  onValueChange={setShowBehavior}
                  trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.SUCCESS }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>

              <View style={[styles.mlOption, showRiskZones && styles.mlOptionActive]}>
                <View style={styles.mlOptionLeft}>
                  <MaterialCommunityIcons 
                    name="alert" 
                    size={16} 
                    color={STATUS_COLORS.ERROR} 
                  />
                  <Text style={styles.mlOptionText}>Risk Zones</Text>
                </View>
                <Switch
                  value={showRiskZones}
                  onValueChange={setShowRiskZones}
                  trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.ERROR }}
                  thumbColor={BRAND_COLORS.SURFACE}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Animal List Panel Modal */}
      <Modal
        visible={showAnimalPanel}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAnimalPanel(false)}
      >
        <View style={styles.animalPanelContainer}>
          <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
          
          {/* Panel Screen Header */}
          <View style={styles.screenHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowAnimalPanel(false)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={BRAND_COLORS.SURFACE} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Tracked Animals</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Box */}
          <View style={styles.panelHeader}>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={18} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.searchIcon} />
              <TextInput
                placeholder="Search animals..."
                placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
          </View>

          {/* Animal Cards */}
          <ScrollView style={styles.animalList} showsVerticalScrollIndicator={false}>
            {searchFilteredAnimals.map((animal) => {
              const batteryColor = getBatteryColor(animal.battery);
              const riskColor = getRiskColor(animal.risk);

              return (
                <TouchableOpacity
                  key={animal.id}
                  onPress={() => {
                    setSelectedAnimal(animal);
                    setShowAnimalPanel(false);
                  }}
                  style={[
                    styles.animalCard,
                    selectedAnimal?.id === animal.id && styles.animalCardSelected
                  ]}
                >
                  {/* Left Accent Bar */}
                  <View style={[styles.animalAccent, { backgroundColor: riskColor }]} />

                  {/* Card Header */}
                  <View style={styles.animalCardHeader}>
                    <View style={styles.animalInfo}>
                      <Text style={styles.animalEmoji}>{animal.icon}</Text>
                      <View>
                        <Text style={styles.animalName}>{animal.name}</Text>
                        <Text style={styles.animalSpecies}>{animal.species}</Text>
                        <Text style={styles.animalId}>{animal.id}</Text>
                      </View>
                    </View>
                    <View style={styles.animalStatus}>
                      <MaterialCommunityIcons name="pulse" size={14} color={BRAND_COLORS.ACCENT} />
                      <Text style={styles.statusText}>{animal.status}</Text>
                    </View>
                  </View>

                  {/* Metrics Grid */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Location</Text>
                      <Text style={styles.metricValue}>{animal.location}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Last Seen</Text>
                      <Text style={styles.metricValue}>{animal.lastSeen}</Text>
                    </View>
                  </View>

                  {/* Battery Bar */}
                  <View style={styles.batteryContainer}>
                    <View style={styles.batteryHeader}>
                      <Text style={styles.batteryLabel}>Battery</Text>
                      <Text style={styles.batteryPercent}>{animal.battery}%</Text>
                    </View>
                    <View style={styles.batteryBar}>
                      <View style={[
                        styles.batteryFill,
                        { width: `${animal.battery}%`, backgroundColor: batteryColor }
                      ]} />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.trackButton}
                      onPress={() => {
                        setSelectedAnimal(animal);
                        setShowAnimalPanel(false);
                      }}
                    >
                      <Text style={styles.trackButtonText}>Track</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.moreButton}>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={BRAND_COLORS.TEXT_SECONDARY} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  screenHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  statusBar: {
    backgroundColor: BRAND_COLORS.SECONDARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  statBox: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  filterPills: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1000,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPillActive: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  filterPillTextActive: {
    color: BRAND_COLORS.SURFACE,
  },
  mlButton: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    backgroundColor: BRAND_COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  mlButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 12,
    fontWeight: '700',
  },
  animalsButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: BRAND_COLORS.ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  animalsButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mlPanel: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  mlPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  mlPanelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mlIcon: {
    width: 32,
    height: 32,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  mlSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  mlOptions: {
    padding: 20,
    gap: 12,
  },
  mlOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mlOptionActive: {
    backgroundColor: BRAND_COLORS.BACKGROUND,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  mlOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mlOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  animalPanelContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.SURFACE,
  },
  panelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.MUTED,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: BRAND_COLORS.TEXT,
  },
  animalList: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    padding: 16,
  },
  animalCard: {
    backgroundColor: BRAND_COLORS.MUTED,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    position: 'relative',
  },
  animalCardSelected: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  animalAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 8,
  },
  animalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  animalInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  animalEmoji: {
    fontSize: 32,
  },
  animalName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 2,
  },
  animalSpecies: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  animalId: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  animalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS.ACCENT,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT,
    fontWeight: '600',
  },
  batteryContainer: {
    marginBottom: 12,
  },
  batteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  batteryLabel: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  batteryPercent: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  batteryBar: {
    height: 6,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 3,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  trackButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  trackButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 12,
    fontWeight: '700',
  },
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapScreen;
