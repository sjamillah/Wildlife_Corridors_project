import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import Icon from '@components/ui/Icon';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartMap from '@components/maps/SmartMap';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '@constants/Icons';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useWebSocket } from '@app/hooks';
import { animals as animalsService, corridors as corridorsService, conflictZones, rangers, alerts as alertsService } from '@services';
import { safeNavigate } from '@utils';

export default function DashboardScreen() {
  const [alertCounts, setAlertCounts] = useState({
    Critical: 0,
    High: 0,
    Medium: 0
  });

  // WebSocket integration for real-time updates
  const { 
    animals: wsAnimals = [], 
    isConnected = false,
    alerts: wsAlerts = [],
    animalPaths = {}
  } = useWebSocket({
    autoConnect: true,
  });

  // Data states
  const [animals, setAnimals] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define all fetch functions BEFORE they're used in useEffect
  const fetchAnimals = async () => {
    try {
      const data = await animalsService.getAll({ status: 'active' });
      const transformedAnimals = (data.results || data || []).map(animal => ({
        id: animal.id || animal.collar_id,
        species: animal.species,
        name: animal.name || `${animal.species} #${animal.id}`,
        status: animal.status === 'active' ? 'Active' : 'Inactive',
        coordinates: {
          lat: animal.last_lat || 0,
          lng: animal.last_lon || 0
        },
        battery: animal.collar_battery || 0,
        risk: animal.risk_level || 'Low',
        icon: animal.species?.toLowerCase().includes('elephant') ? '🐘' : 
              animal.species?.toLowerCase().includes('wildebeest') ? '🦬' : '🦏',
        speed: animal.speed || 0,
        behavior: animal.behavior_state || 'Unknown',
        activityType: animal.movement?.activity_type || 'unknown',
        markerColor: '#10B981',
        path: [],
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
      const corridorsData = data.results || data || [];
      console.log('📊 Dashboard: Fetched corridors:', corridorsData.length);
      setCorridors(corridorsData);
    } catch (error) {
      console.error('Failed to fetch corridors:', error);
    }
  };

  const fetchRiskZones = async () => {
    try {
      const data = await conflictZones.getActive();
      const zonesData = data.results || data || [];
      console.log('⚠️ Dashboard: Fetched risk zones:', zonesData.length);
      
      // Transform conflict zones to risk zones format for map
      const transformedZones = zonesData.map(zone => ({
        id: zone.id,
        position: zone.geometry?.coordinates || [zone.longitude || zone.lng, zone.latitude || zone.lat],
        geometry: zone.geometry || {
          type: 'Point',
          coordinates: [zone.longitude || zone.lng, zone.latitude || zone.lat]
        },
        buffer_distance_km: zone.buffer_distance_km || zone.radius_km || 5,
        intensity: zone.severity === 'high' ? 0.8 : zone.severity === 'medium' ? 0.5 : 0.3,
        severity: zone.severity || 'medium',
        zone_type: zone.zone_type,
        is_active: zone.is_active
      }));
      
      setRiskZones(transformedZones);
    } catch (error) {
      console.error('Failed to fetch risk zones:', error);
    }
  };

  const fetchAlertCounts = async () => {
    try {
      // Fetch alerts from API
      const alerts = await alertsService.getAll();
      const alertsArray = Array.isArray(alerts) ? alerts : (alerts.results || []);
      
      // Filter out alerts that just repeat information already visible on map
      // Only keep alerts with unique/new information (not just animal location)
      const uniqueAlerts = alertsArray.filter(alert => {
        // Skip alerts that are just "animal at location" if that animal is already on the map
        const alertType = (alert.alert_type || alert.type || '').toLowerCase();
        const isLocationOnly = alertType.includes('location') || alertType.includes('position');
        const hasActionableInfo = alert.message || alert.description || 
                                  alertType.includes('risk') || 
                                  alertType.includes('danger') ||
                                  alertType.includes('breach') ||
                                  alertType.includes('emergency') ||
                                  alertType.includes('poaching') ||
                                  alertType.includes('conflict') ||
                                  alertType.includes('battery') ||
                                  alertType.includes('signal') ||
                                  alertType.includes('exit') ||
                                  alertType.includes('entry');
        
        // Keep alerts that have actionable information, not just location updates
        return hasActionableInfo || !isLocationOnly;
      });
      
      // Combine with WebSocket alerts (also filter for unique info)
      const allAlerts = [...uniqueAlerts];
      if (wsAlerts && wsAlerts.length > 0) {
        wsAlerts.forEach(wsAlert => {
          // Check if this WebSocket alert is already in the array
          const exists = allAlerts.some(a => 
            a.id === wsAlert.id || 
            (a.animal_id === wsAlert.animalId && 
             a.alert_type === wsAlert.type &&
             Math.abs(new Date(a.detected_at || a.timestamp || 0).getTime() - new Date(wsAlert.timestamp || 0).getTime()) < 60000)
          );
          
          // Only add if it has actionable information
          const wsAlertType = (wsAlert.type || wsAlert.alert_type || '').toLowerCase();
          const hasActionableInfo = wsAlert.message || wsAlert.description ||
                                   wsAlertType.includes('risk') ||
                                   wsAlertType.includes('danger') ||
                                   wsAlertType.includes('breach') ||
                                   wsAlertType.includes('emergency') ||
                                   wsAlertType.includes('poaching') ||
                                   wsAlertType.includes('conflict') ||
                                   wsAlertType.includes('battery') ||
                                   wsAlertType.includes('signal') ||
                                   wsAlertType.includes('exit') ||
                                   wsAlertType.includes('entry');
          
          if (!exists && hasActionableInfo) {
            allAlerts.push({
              id: wsAlert.id || `ws-${wsAlert.animalId}-${wsAlert.timestamp}`,
              severity: wsAlert.severity || 'medium',
              alert_type: wsAlert.type || wsAlert.alert_type || 'general',
              status: wsAlert.status || 'active',
              detected_at: wsAlert.timestamp || wsAlert.detected_at,
              ...wsAlert
            });
          }
        });
      }
      
      // Calculate counts from filtered alerts (only unique/actionable ones)
      const counts = {
        Critical: allAlerts.filter(a => {
          const severity = String(a.severity || '').toLowerCase();
          const alertType = String(a.alert_type || a.type || '').toLowerCase();
          return severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
        }).length,
        High: allAlerts.filter(a => {
          const severity = String(a.severity || '').toLowerCase();
          const alertType = String(a.alert_type || a.type || '').toLowerCase();
          const isCritical = severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
          return (severity === 'high' || alertType === 'high') && !isCritical;
        }).length,
        Medium: allAlerts.filter(a => {
          const severity = String(a.severity || '').toLowerCase();
          const alertType = String(a.alert_type || a.type || '').toLowerCase();
          const isCritical = severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
          const isHigh = (severity === 'high' || alertType === 'high') && !isCritical;
          return !isCritical && !isHigh;
        }).length
      };
      
      console.log('📊 Dashboard: Alert counts calculated (filtered for unique info):', {
        totalAlerts: allAlerts.length,
        apiAlerts: alertsArray.length,
        filteredAlerts: uniqueAlerts.length,
        wsAlerts: wsAlerts?.length || 0,
        counts
      });
      
      setAlertCounts(counts);
    } catch (error) {
      console.error('Failed to fetch alert counts:', error);
      // Fallback: calculate from WebSocket alerts only (filtered)
      if (wsAlerts && wsAlerts.length > 0) {
        const filteredWsAlerts = wsAlerts.filter(wsAlert => {
          const wsAlertType = (wsAlert.type || wsAlert.alert_type || '').toLowerCase();
          return wsAlert.message || wsAlert.description ||
                 wsAlertType.includes('risk') ||
                 wsAlertType.includes('danger') ||
                 wsAlertType.includes('breach') ||
                 wsAlertType.includes('emergency') ||
                 wsAlertType.includes('poaching') ||
                 wsAlertType.includes('conflict') ||
                 wsAlertType.includes('battery') ||
                 wsAlertType.includes('signal') ||
                 wsAlertType.includes('exit') ||
                 wsAlertType.includes('entry');
        });
        
        const counts = {
          Critical: filteredWsAlerts.filter(a => {
            const severity = String(a.severity || '').toLowerCase();
            return severity === 'critical' || severity === 'emergency';
          }).length,
          High: filteredWsAlerts.filter(a => {
            const severity = String(a.severity || '').toLowerCase();
            return severity === 'high' && severity !== 'critical' && severity !== 'emergency';
          }).length,
          Medium: filteredWsAlerts.filter(a => {
            const severity = String(a.severity || '').toLowerCase();
            return severity !== 'critical' && severity !== 'emergency' && severity !== 'high';
          }).length
        };
        setAlertCounts(counts);
      }
    }
  };

  // Transform WebSocket animals to display format (same as MapScreen)
  useEffect(() => {
    try {
      if (wsAnimals && wsAnimals.length > 0) {
        const transformedAnimals = wsAnimals.map(animal => {
        let lat = animal.current_position?.lat || animal.last_lat || 0;
        let lon = animal.current_position?.lon || animal.last_lon || 0;
        
        // Coordinate validation and swapping if needed
        if (Math.abs(lat) > 90 || (Math.abs(lat) > 20 && Math.abs(lon) < 10)) {
          const temp = lat;
          lat = lon;
          lon = temp;
        }
        
        const speed = animal.movement?.speed_kmh || 0;
        const activityType = animal.movement?.activity_type || 
                           (speed > 2 ? 'moving' : speed > 0.5 ? 'feeding' : 'resting');
        const riskLevel = animal.risk_level || 'low';
        
        // Determine marker color based on activity and risk
        let markerColor = '#10B981'; // Green default
        if (riskLevel === 'critical' || riskLevel === 'high') {
          markerColor = '#DC2626'; // Red for danger
        } else if (activityType === 'resting' || activityType === 'feeding') {
          markerColor = '#F59E0B'; // Yellow for resting
        }
        
        return {
          id: animal.id || animal.collar_id,
          species: animal.species,
          name: animal.name || animal.species,
          status: animal.status === 'active' ? 'Active' : 'Inactive',
          coordinates: {
            lat: lat,
            lng: lon
          },
          battery: animal.collar_battery || 0,
          risk: riskLevel,
          icon: animal.species?.toLowerCase().includes('elephant') ? '🐘' : 
                animal.species?.toLowerCase().includes('wildebeest') ? '🦬' : '🦏',
          speed: speed,
          behavior: activityType,
          activityType: activityType,
          markerColor: markerColor,
          path: animalPaths[animal.id] || [],
        };
      });
        setAnimals(transformedAnimals);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error transforming animals:', error);
      setLoading(false);
    }
  }, [wsAnimals, animalPaths]);

  // Fetch all data in parallel on mount (truly parallel, not sequential)
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        // Fetch ALL data in parallel at the same time with timeout protection
        const allPromises = [
          // Animals
          Promise.race([
            fetchAnimals(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed animals:', err.message); 
            return null; 
          }),
          // Corridors
          Promise.race([
            fetchCorridors(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed corridors:', err.message); 
            return null; 
          }),
          // Risk Zones
          Promise.race([
            fetchRiskZones(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed risk zones:', err.message); 
            return null; 
          }),
          // Alert Counts
          Promise.race([
            fetchAlertCounts(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed alert counts:', err.message); 
            return null; 
          }),
        ];
        
        // Execute all promises in parallel - they all start at the same time
        await Promise.allSettled(allPromises);
        console.log('✅ Dashboard: All data fetched in parallel');
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Don't crash - just log the error
      }
    };
    
    loadData();
    
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also fetch animals if WebSocket disconnects (fallback) - but don't duplicate if already fetched
  useEffect(() => {
    if (!isConnected && animals.length === 0) {
      fetchAnimals();
    }
  }, [isConnected, animals.length]);
  
  // Update alert counts when WebSocket alerts change (but only if we have new actionable alerts)
  useEffect(() => {
    if (wsAlerts && wsAlerts.length > 0) {
      fetchAlertCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsAlerts]); // Update counts when WebSocket alerts change

  // Get user location with error handling
  useEffect(() => {
    let mounted = true;
    const getLocation = async () => {
      try {
        if (mounted) {
          await getRangerLocation();
        }
      } catch (error) {
        console.warn('Failed to get initial location:', error);
        // Don't crash the app if location fails
      }
    };
    getLocation();
    return () => {
      mounted = false;
    };
  }, []);

  const getRangerLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      // Add timeout to prevent hanging
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location timeout')), 10000)
        )
      ]);

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.warn('Failed to get location:', error.message || error);
      // Don't throw - location is not critical for app functionality
    }
  };

  const handleViewAlerts = () => {
    safeNavigate('/screens/(tabs)/AlertsScreen');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Safety check - if component fails to render, show error
  try {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Large Green Header */}
      <View style={styles.largeHeader}>
        <View style={styles.headerContent}>
          {/* Left Column */}
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../assets/images/Aureynx_Logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>
          
          {/* Right Column */}
          <View style={styles.headerRight}>
            <View style={styles.onlineStatusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationBox}
              onPress={handleViewAlerts}
            >
              <Text style={styles.bellEmoji}>🔔</Text>
              <View style={styles.notificationDot}>
                <Text style={styles.notificationNumber}>
                  {alertCounts.Critical + alertCounts.High + alertCounts.Medium}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Alert Chips Integrated in Header */}
        <View style={styles.alertChips}>
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.Critical}</Text>
            <Text style={styles.alertChipLabel}>Critical</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(232, 150, 28, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.High}</Text>
            <Text style={styles.alertChipLabel}>High</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.alertChip, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}
            onPress={handleViewAlerts}
          >
            <Text style={styles.alertChipNumber}>{alertCounts.Medium}</Text>
            <Text style={styles.alertChipLabel}>Medium</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={() => safeNavigate('/screens/(tabs)/MapScreen')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.locationCard}>
            {/* Map Area - Overview of main map */}
            <View style={styles.mapArea}>
              <SmartMap
                animals={animals.slice(0, 10)} // Show first 10 animals as overview
                corridors={corridors}
                predictions={{}}
                riskZones={riskZones}
                rangerPatrols={[]}
                userLocation={userLocation}
                showBehavior={false}
                showCorridors={true}
                showRiskZones={true}
                showPredictions={false}
                showRangerPatrols={false}
                showAnimalMovement={true}
                onAnimalPress={() => safeNavigate('/screens/(tabs)/MapScreen')}
                height={200}
              />
              {/* Location Label on Map */}
              <View style={styles.mapLocationLabel}>
                <MaterialCommunityIcons name="map-marker" size={16} color={BRAND_COLORS.SURFACE} style={{ marginRight: 4 }} />
                <Text style={styles.mapLabelText}>
                  {animals.length} Animals Tracked
                </Text>
              </View>
            </View>
            
            {/* Location Info */}
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Wildlife Overview</Text>
              <Text style={styles.locationCoords}>
                {animals.filter(a => a.species?.toLowerCase().includes('elephant')).length} Elephants • {' '}
                {animals.filter(a => a.species?.toLowerCase().includes('wildebeest')).length} Wildebeest
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.mapButton]}
              onPress={() => safeNavigate('/screens/(tabs)/MapScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.MAP} size={ICON_SIZES.md} color={BRAND_COLORS.SURFACE} />
              <Text style={styles.actionBtnText}>Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.reportButton]}
              onPress={() => safeNavigate('/screens/(tabs)/FieldDataScreen')}
              activeOpacity={0.8}
            >
              <Icon name={WILDLIFE_ICONS.DOCUMENT} size={ICON_SIZES.md} color={BRAND_COLORS.TEXT} />
              <Text style={[styles.actionBtnText, { color: BRAND_COLORS.TEXT }]}>Report</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.emergencyBtn}
            onPress={() => safeNavigate('/screens/patrol/ReportEmergencyScreen')}
            activeOpacity={0.8}
          >
            <Icon name={WILDLIFE_ICONS.ALERT_OCTAGON} size={ICON_SIZES.md} color={BRAND_COLORS.SURFACE} />
            <Text style={styles.emergencyBtnText}>Report Emergency</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    );
  } catch (error) {
    console.error('DashboardScreen render error:', error);
    // Return a simple error view instead of crashing
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND_COLORS.TEXT, marginBottom: 10 }}>
          Unable to load dashboard
        </Text>
        <Text style={{ fontSize: 14, color: BRAND_COLORS.TEXT_SECONDARY, textAlign: 'center' }}>
          Please try again or restart the app
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: BRAND_COLORS.PRIMARY, borderRadius: 8 }}
          onPress={() => safeNavigate('/screens/(tabs)/DashboardScreen', { method: 'replace' })}
        >
          <Text style={{ color: BRAND_COLORS.SURFACE, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  largeHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 120,
    height: 38,
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_COLORS.SURFACE,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  onlineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS_COLORS.SUCCESS,
  },
  onlineText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '600',
  },
  notificationBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellEmoji: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationNumber: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 10,
    fontWeight: '800',
  },
  alertChips: {
    flexDirection: 'row',
    gap: 8,
  },
  alertChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertChipNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_COLORS.SURFACE,
    marginBottom: 2,
  },
  alertChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.ACCENT,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconText: {
    fontSize: 18,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  secondaryActions: {
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  locationCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  mapArea: {
    height: 200,
    backgroundColor: BRAND_COLORS.PRIMARY,
    position: 'relative',
  },
  mapLocationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapLabelText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 12,
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: BRAND_COLORS.SURFACE,
    padding: 16,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 11,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
  },
  mapButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
  },
  reportButton: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.SURFACE,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    backgroundColor: BRAND_COLORS.ACCENT,
  },
  emergencyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  miniMapBackground: {
    flex: 1,
    backgroundColor: '#2d5a3d',
    position: 'relative',
  },
  miniGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    opacity: 0.2,
  },
  miniGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    opacity: 0.2,
  },
  alertMarker: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'white',
  },
  miniUserLocation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  miniLocationDot: {
    width: 8,
    height: 8,
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

