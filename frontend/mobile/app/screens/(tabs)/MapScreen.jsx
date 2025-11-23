import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Switch,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import SmartMap from '@components/maps/SmartMap';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { animals as animalsService, corridors as corridorsService, predictions, conflictZones, rangers, alerts as alertsService } from '@services';
import { useWebSocket, useOfflineMode, useOfflineGPS } from '@app/hooks';
import { safeNavigate } from '@utils';

const MapScreen = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showMLPanel, setShowMLPanel] = useState(false);
  const [showAnimalPanel, setShowAnimalPanel] = useState(false);
  
  // WebSocket integration for real-time updates
  const { 
    animals: wsAnimals, 
    isConnected,
    alerts: wsAlerts,
    animalPaths 
  } = useWebSocket({
    autoConnect: true,
  });
  
  // Data states
  const [corridors, setCorridors] = useState([]);
  const [animalPredictions, setAnimalPredictions] = useState({});
  const [riskZones, setRiskZones] = useState([]);
  const [rangerPatrols, setRangerPatrols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [allAlerts, setAllAlerts] = useState([]); // All alerts from endpoint
  
  // Map Layer Toggles (matching web app)
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showRangerPatrols, setShowRangerPatrols] = useState(true);
  const [showMyLocation, setShowMyLocation] = useState(true);

  // ML Data states
  const [behavioralStates, setBehavioralStates] = useState({});
  const [riskHeatmap, setRiskHeatmap] = useState([]);
  const [environmentData, setEnvironmentData] = useState({});

  // Offline mode hooks
  const {
    isOnline,
  } = useOfflineMode();

  const {
    location: gpsLocation,
  } = useOfflineGPS({ enableBackground: false });

  // Transform WebSocket animals to display format (matching web format)
  const [animals, setAnimals] = useState([]);
  
  useEffect(() => {
    console.log('🔄 MapScreen: useEffect triggered - wsAnimals:', wsAnimals?.length || 0, 'isConnected:', isConnected);
    
    // Process WebSocket animals if available - ensures real-time updates
    if (wsAnimals && Array.isArray(wsAnimals)) {
      // Only update if WebSocket is connected and has data, or if explicitly empty
      if (wsAnimals.length === 0 && !isConnected) {
        console.log('⏸️ Mobile: WebSocket empty and not connected, keeping existing animals');
        return;
      }
      
      console.log('🔄 Mobile: Processing WebSocket animal data:', wsAnimals.length, 'animals');
      // Filter to only show ACTIVE animals on the map
      const activeAnimals = wsAnimals.filter(animal => {
        const status = animal.status || 'inactive';
        return status === 'active' || status === 'Active';
      });
      console.log(`📊 Filtered animals: ${activeAnimals.length} active out of ${wsAnimals.length} total`);
      
      const transformedAnimals = activeAnimals.map(animal => {
        let lat = animal.current_position?.lat || animal.last_lat || 0;
        let lon = animal.current_position?.lon || animal.last_lon || 0;
        
        // Coordinate validation and swapping if needed
        if (Math.abs(lat) > 90 || (Math.abs(lat) > 20 && Math.abs(lon) < 10)) {
          const temp = lat;
          lat = lon;
          lon = temp;
        }
        
        const speed = animal.movement?.speed_kmh || 0;
        let heading = animal.movement?.directional_angle;
        
        let predictedLat = animal.predicted_position?.lat;
        let predictedLon = animal.predicted_position?.lon;
        
        const hasPredictedPosition = predictedLat && predictedLon;
        const predictedSameAsCurrent = hasPredictedPosition && 
          (Math.abs(predictedLat - lat) < 0.00001 && Math.abs(predictedLon - lon) < 0.00001);
        
        // Calculate predicted position if not provided or same as current
        if (!hasPredictedPosition || predictedSameAsCurrent) {
          if (speed > 0.5) {
            if (typeof heading !== 'number' || heading === null || heading === 0) {
              heading = Math.random() * 360;
            }
            
            const timeAheadMinutes = speed > 2 ? 30 : 10;
            const timeAheadHours = timeAheadMinutes / 60;
            const distanceKm = speed * timeAheadHours;
            const distanceDegrees = distanceKm / 111;
            
            const headingRadians = heading * (Math.PI / 180);
            predictedLat = lat + (distanceDegrees * Math.cos(headingRadians));
            predictedLon = lon + (distanceDegrees * Math.sin(headingRadians));
          } else {
            predictedLat = lat;
            predictedLon = lon;
          }
        }
        
        const activityType = animal.movement?.activity_type || 
                           (speed > 2 ? 'moving' : speed > 0.5 ? 'feeding' : 'resting');
        
        const behaviorState = animal.movement?.behavior_state || activityType;
        const riskLevel = animal.risk_level || 'low';
        
        // Determine marker color based on activity and risk (matches web)
        let markerColor = '#10B981'; // Green default
        if (riskLevel === 'critical' || riskLevel === 'high') {
          markerColor = '#DC2626'; // Red for danger
        } else if (activityType === 'resting' || activityType === 'feeding') {
          markerColor = '#F59E0B'; // Yellow for resting
        }
        
        // Check for recent alerts
        const hasAlert = wsAlerts.some(alert => 
          alert.animalId === animal.id && 
          (Date.now() - new Date(alert.timestamp).getTime()) < 300000
        );
        
        if (hasAlert) {
          markerColor = '#DC2626'; // Red for alerts
        }
        
        // Get alert icon if animal has recent alerts
        const recentAlert = wsAlerts.find(alert => 
          alert.animalId === animal.id && 
          (Date.now() - new Date(alert.timestamp).getTime()) < 300000
        );
        
        return {
          id: animal.id || animal.collar_id,
          species: animal.species,
          name: animal.name || animal.species,
          status: animal.status === 'active' ? 'Active' : 'Inactive',
          location: animal.current_position?.location_name || animal.last_known_location || 'Unknown',
          coordinates: {
            lat: lat,
            lng: lon
          },
          predictedCoordinates: {
            lat: predictedLat,
            lng: predictedLon
          },
          battery: animal.collar_battery || 0,
          lastSeen: animal.last_updated || animal.last_seen || 'Unknown',
          risk: riskLevel,
          icon: animal.species?.toLowerCase().includes('elephant') ? '🐘' : 
                animal.species?.toLowerCase().includes('wildebeest') ? '🦬' : 
                animal.species?.toLowerCase().includes('lion') ? '🦁' : '🦏',
          speed: speed,
          heading: heading,
          health: animal.health_status || 'Good',
          behavior: behaviorState,
          activityType: activityType,
          markerColor: markerColor,
          pathColor: animal.pathColor || markerColor,
          alertIcon: recentAlert?.icon || null,
          hasAlert: hasAlert,
          alertSeverity: recentAlert?.severity || null,
          shouldAnimate: animal.shouldAnimate,
          shouldWobble: animal.shouldWobble,
          isResting: animal.isResting,
          conflict_risk: animal.conflict_risk,
          risk_level: animal.risk_level || animal.conflict_risk?.risk_level || 'low',
          path: animalPaths[animal.id] || [],
        };
      });
      // Force state update with new array reference to ensure React detects change
      setAnimals([...transformedAnimals]);
      setLoading(false);
      console.log('✅ Mobile: Updated animals state:', transformedAnimals.length, 'animals from WebSocket');
      console.log('🔄 Mobile: State updated, MapScreen should re-render');
    } else if (wsAnimals && wsAnimals.length === 0 && isConnected) {
      // WebSocket connected but no animals - clear state
      console.log('⚠️ Mobile: WebSocket connected but no animals received');
      setAnimals([]);
      setLoading(false);
    }
  }, [wsAnimals, wsAlerts, animalPaths, isConnected]);

  // Fallback: Fetch animals from REST API if WebSocket is not connected
  useEffect(() => {
    let mounted = true;
    let interval = null;
    
    if (!isConnected) {
      const refreshAnimals = async () => {
        if (!mounted) return;
        try {
          await fetchAnimals();
        } catch (err) {
          if (mounted) {
            console.warn('Failed to fetch animals:', err.message);
          }
        }
      };
      
      refreshAnimals();
      interval = setInterval(refreshAnimals, 30000);
    }
    
    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [isConnected]);

  // Fetch corridors and risk zones on mount (optimized for fast loading with timeouts)
  useEffect(() => {
    let mounted = true;
    let timeoutIds = [];
    
    const fetchData = async () => {
      try {
        // Load critical data first in parallel with timeout protection
        const criticalPromises = [
          Promise.race([
            fetchCorridors(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed corridors:', err.message); 
            return null; 
          }),
          Promise.race([
            fetchRiskZones(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed risk zones:', err.message); 
            return null; 
          }),
          Promise.race([
            fetchAlerts(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]).catch(err => { 
            if (mounted) console.warn('Failed alerts:', err.message); 
            return null; 
          }),
        ];
        
        // Don't block - use allSettled so failures don't stop the app
        Promise.allSettled(criticalPromises).then(() => {
          if (mounted) {
            // Load secondary data after initial render (lazy load - 400ms delay)
            const timeout = setTimeout(() => {
              if (mounted) {
                Promise.race([
                  fetchRangerPatrols(),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                ]).catch(err => console.warn('Failed ranger patrols:', err.message));
              }
            }, 400);
            timeoutIds.push(timeout);
          }
        });
      } catch (error) {
        if (mounted) console.error('Error fetching initial data:', error);
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  // Fetch alerts on mount and refresh every 30 seconds
  // Don't depend on wsAlerts to prevent refetching on every WebSocket alert
  useEffect(() => {
    let mounted = true;
    let alertInterval = null;
    
    const refreshAlerts = async () => {
      if (!mounted) return;
      try {
        await fetchAlerts();
      } catch (err) {
        if (mounted) {
          console.warn('Failed to refresh alerts:', err.message);
        }
      }
    };
    
    // Initial fetch
    refreshAlerts();
    
    // Refresh alerts every 30 seconds to catch mobile-created alerts
    alertInterval = setInterval(refreshAlerts, 30000); // 30 seconds
    
    return () => {
      mounted = false;
      if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
      }
    };
  }, []); // Empty dependency array - only fetch on mount

  // Get user location
  useEffect(() => {
    let mounted = true;
    const getLocation = async () => {
      try {
        if (mounted) {
          await getRangerLocation();
        }
      } catch (error) {
        console.warn('Failed to get ranger location:', error);
      }
    };
    getLocation();
    const interval = setInterval(() => {
      if (mounted) {
        getLocation().catch(err => console.warn('Failed to update location:', err));
      }
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch predictions when animals change
  useEffect(() => {
    const fetchPreds = async () => {
      try {
    if (animals.length > 0 && showPredictions) {
          await fetchPredictions();
    }
      } catch (error) {
        console.warn('Failed to fetch predictions:', error);
      }
    };
    fetchPreds();
  }, [animals, showPredictions]);

  // Build behavioral states from animals
  useEffect(() => {
    const states = {};
    animals.forEach(animal => {
      if (animal.id && (animal.behaviorState || animal.activityType || animal.behavior)) {
        states[animal.id] = {
          state: animal.behaviorState || animal.activityType || animal.behavior || 'unknown',
          confidence: animal.speed > 2 ? 0.9 : animal.speed > 0.5 ? 0.7 : 0.5,
          timestamp: new Date().toISOString()
        };
      }
    });
    setBehavioralStates(states);
  }, [animals]);

  // Fetch environment data
  const fetchEnvironmentData = async () => {
    if (!showEnvironment) return;
    
    try {
      const centerLat = userLocation?.latitude || -2.0;
      const centerLon = userLocation?.longitude || 35.5;
      
      const data = await predictions.getXGBoostEnvironment(
        centerLat,
        centerLon,
        'elephant',
        50000
      );
      
      if (data) {
        setEnvironmentData(data);
        
        if (data.available && data.coordinates) {
          const heatmapPoint = {
            position: [data.coordinates.lat || centerLat, data.coordinates.lon || centerLon],
            intensity: data.habitat_score || 0.5,
            type: 'habitat',
            suitability: data.suitability || 'medium',
            status: data.status || 'success',
            message: data.message || null
          };
          setRiskHeatmap([heatmapPoint]);
        } else {
          const fallbackPoint = {
            position: [centerLat, centerLon],
            intensity: data.habitat_score || 0.5,
            type: 'habitat',
            suitability: 'unknown',
            status: 'fallback',
            message: data.message || 'ML service unavailable'
          };
          setRiskHeatmap([fallbackPoint]);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch environment data:', error);
      setRiskHeatmap([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    let interval = null;
    
    if (showEnvironment) {
      const refreshEnvironment = async () => {
        if (!mounted) return;
        try {
          await fetchEnvironmentData();
        } catch (error) {
          if (mounted) {
            console.error('Error refreshing environment:', error);
          }
        }
      };
      
      refreshEnvironment();
      interval = setInterval(refreshEnvironment, 300000); // Every 5 minutes
    } else {
      setRiskHeatmap([]);
    }
    
    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [showEnvironment, userLocation]);

  const fetchAnimals = async () => {
    try {
      // Check if online first
      if (!isOnline) {
        // Offline - load from cache
        console.log('📴 Offline: Loading animals from cache');
        await loadCachedAnimals();
        return;
      }
      
      // Online - fetch from API
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
      
      // Cache animals for offline use
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cached_animals', JSON.stringify(transformedAnimals));
        await AsyncStorage.setItem('cached_animals_timestamp', new Date().toISOString());
      } catch (cacheError) {
        console.warn('Failed to cache animals:', cacheError);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch animals:', error);
      // Try to load from cache on error
      await loadCachedAnimals();
    }
  };

  const loadCachedAnimals = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cached = await AsyncStorage.getItem('cached_animals');
      if (cached) {
        const animals = JSON.parse(cached);
        setAnimals(animals);
        console.log('✅ Loaded', animals.length, 'animals from cache');
      } else {
        console.log('No cached animals found');
      }
    } catch (error) {
      console.error('Failed to load cached animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorridors = async () => {
    try {
      if (!isOnline) {
        await loadCachedCorridors();
        return;
      }
      
      const data = await corridorsService.getAll();
      const corridorsData = data.results || data || [];
      setCorridors(corridorsData);
      
      // Cache for offline
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cached_corridors', JSON.stringify(corridorsData));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to fetch corridors:', error);
      await loadCachedCorridors();
    }
  };

  const loadCachedCorridors = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cached = await AsyncStorage.getItem('cached_corridors');
      if (cached) {
        setCorridors(JSON.parse(cached));
      }
    } catch (e) {}
  };

  const fetchRiskZones = async () => {
    try {
      if (!isOnline) {
        await loadCachedRiskZones();
        return;
      }
      
      const data = await conflictZones.getActive();
      const zonesData = data.results || data || [];
      
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
      
      // Cache for offline
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cached_risk_zones', JSON.stringify(transformedZones));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to fetch risk zones:', error);
      await loadCachedRiskZones();
    }
  };

  const loadCachedRiskZones = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cached = await AsyncStorage.getItem('cached_risk_zones');
      if (cached) {
        setRiskZones(JSON.parse(cached));
      }
    } catch (e) {}
  };

  // Fetch alerts from endpoint
  const fetchAlerts = async () => {
    try {
      if (!isOnline) {
        // Offline - load from cache
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const cached = await AsyncStorage.getItem('cached_alerts');
        if (cached) {
          setAllAlerts(JSON.parse(cached));
        }
        return;
      }
      
      // Fetch ALL alerts from API (not just active) to include mobile-created alerts
      const data = await alertsService.getAll(); // No status filter to get all alerts
      const alertsData = data.results || data || [];
      console.log('MapScreen: Fetched alerts:', alertsData.length);
      
      // Deduplication: Group alerts by animal + alert type + location, keeping only the most recent one PER TYPE
      // This allows multiple alert types for the same animal, but prevents duplicate alerts of the same type
      const alertsByAnimalTypeLocation = new Map();
      
      // Process all alerts and keep only the most recent for each animal + type + location combination
      alertsData.forEach(alert => {
        const animalId = alert.animal_id || alert.animal || 'unknown';
        const alertType = String(alert.alert_type || alert.type || 'general').toLowerCase().trim();
        const lat = alert.latitude || (alert.coordinates && (Array.isArray(alert.coordinates) ? alert.coordinates[0] : alert.coordinates.lat)) || 0;
        const lon = alert.longitude || (alert.coordinates && (Array.isArray(alert.coordinates) ? alert.coordinates[1] : alert.coordinates.lon)) || 0;
        // Round coordinates to 3 decimal places (~111 meters) to group nearby alerts of the same type
        // This prevents exact duplicates but allows different alert types at the same location
        const latRounded = Math.round(lat * 1000) / 1000;
        const lonRounded = Math.round(lon * 1000) / 1000;
        // Key includes alertType so different types are kept separately
        const key = `${animalId}-${alertType}-${latRounded}-${lonRounded}`;
        
        const alertTimestamp = new Date(alert.detected_at || alert.timestamp || alert.created_at || 0);
        
        // If we haven't seen this animal+type+location combo, or this alert is newer, keep it
        const existing = alertsByAnimalTypeLocation.get(key);
        if (!existing || alertTimestamp > new Date(existing.detected_at || existing.timestamp || existing.created_at || 0)) {
          alertsByAnimalTypeLocation.set(key, {
            ...alert,
            id: alert.id || `api-${animalId}-${alert.detected_at || alert.timestamp || alert.created_at || Date.now()}`,
            alert_type: alertType, // Normalize alert type
            // Ensure coordinates are in the right format
            latitude: lat,
            longitude: lon,
          });
        }
      });
      
      console.log(`📊 Processed ${alertsData.length} alerts, unique by type+location: ${alertsByAnimalTypeLocation.size}`);
      // Log alert types for debugging
      const alertTypes = new Set(Array.from(alertsByAnimalTypeLocation.values()).map(a => a.alert_type || a.type));
      console.log(`📋 Alert types found: ${Array.from(alertTypes).join(', ')}`);
      
      // Then, merge WebSocket alerts - deduplication by animal + type + location
      if (wsAlerts && wsAlerts.length > 0) {
        console.log(`📡 Merging ${wsAlerts.length} WebSocket alerts`);
        wsAlerts.forEach(wsAlert => {
          const animalId = wsAlert.animalId || wsAlert.animal_id || 'unknown';
          const alertType = String(wsAlert.type || wsAlert.alert_type || 'general').toLowerCase().trim();
          const lat = wsAlert.latitude || (wsAlert.position && wsAlert.position.lat) || (wsAlert.coordinates && (Array.isArray(wsAlert.coordinates) ? wsAlert.coordinates[0] : wsAlert.coordinates.lat)) || 0;
          const lon = wsAlert.longitude || (wsAlert.position && wsAlert.position.lon) || (wsAlert.coordinates && (Array.isArray(wsAlert.coordinates) ? wsAlert.coordinates[1] : wsAlert.coordinates.lon)) || 0;
          // Round coordinates to 3 decimal places (~111 meters) to group nearby alerts of the same type
          const latRounded = Math.round(lat * 1000) / 1000;
          const lonRounded = Math.round(lon * 1000) / 1000;
          // Key includes alertType so different types are kept separately
          const key = `${animalId}-${alertType}-${latRounded}-${lonRounded}`;
          
          const wsAlertTimestamp = new Date(wsAlert.timestamp || wsAlert.detected_at || 0);
          
          // Check if we already have an alert for this animal + type + location
          const existing = alertsByAnimalTypeLocation.get(key);
          const existingTimestamp = existing 
            ? new Date(existing.detected_at || existing.timestamp || existing.created_at || 0)
            : new Date(0);
          
          // If this WebSocket alert is newer, replace the existing one
          if (!existing || wsAlertTimestamp > existingTimestamp) {
            const wsAlertId = wsAlert.id || `ws-${animalId}-${wsAlert.timestamp || Date.now()}-${alertType}`;
            const newAlert = {
              id: wsAlertId,
              alert_type: alertType, // Normalize alert type
              severity: wsAlert.severity || 'medium',
              title: wsAlert.title || 'Wildlife Alert',
              message: wsAlert.message || wsAlert.description || 'Alert received',
              latitude: lat,
              longitude: lon,
              animal: animalId,
              animal_id: animalId,
              animal_name: wsAlert.animalName,
              status: wsAlert.status || 'active',
              detected_at: wsAlert.timestamp || wsAlert.detected_at || new Date().toISOString(),
            };
            
            alertsByAnimalTypeLocation.set(key, newAlert);
          }
        });
        console.log(`📊 After merging WebSocket alerts: ${alertsByAnimalTypeLocation.size} total unique alerts`);
      }
      
      // Convert Map to Array - this ensures no duplicates
      const combinedAlerts = Array.from(alertsByAnimalTypeLocation.values());
      console.log('✅ MapScreen: Combined alerts (deduplicated):', combinedAlerts.length);
      
      // Log breakdown by alert type for debugging
      const alertsByType = {};
      combinedAlerts.forEach(alert => {
        const type = alert.alert_type || alert.type || 'unknown';
        alertsByType[type] = (alertsByType[type] || 0) + 1;
      });
      console.log('📋 Alert breakdown by type:', alertsByType);
      
      setAllAlerts(combinedAlerts);
      
      // Cache alerts for offline use
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cached_alerts', JSON.stringify(combinedAlerts));
        await AsyncStorage.setItem('cached_alerts_timestamp', new Date().toISOString());
      } catch (cacheError) {
        console.warn('Failed to cache alerts:', cacheError);
      }
    } catch (error) {
      console.warn('MapScreen: Alerts unavailable:', error.message);
      setAllAlerts([]);
    }
  };

  const fetchRangerPatrols = async () => {
    try {
      if (!isOnline) {
        await loadCachedRangerPatrols();
        return;
      }
      
      const data = await rangers.getLiveStatus();
      const rangersData = Array.isArray(data) ? data : [];
      
      const transformedPatrols = rangersData
        .filter(ranger => {
          const position = ranger.current_position || {};
          return position.lat || position.lon || ranger.last_lat || ranger.last_lon;
        })
        .map(ranger => {
          const position = ranger.current_position || {};
          return {
            id: ranger.ranger_id || ranger.id,
            name: ranger.name || ranger.username,
            team_name: ranger.team_name || 'Ranger Team',
            current_position: {
              lat: position.lat || ranger.last_lat,
              lng: position.lon || ranger.last_lon
            },
            status: ranger.current_status || 'active',
            activity: ranger.activity_type || 'patrolling',
            locationStatus: position.status || 'live',
            locationSource: ranger.location_source || 'automatic_tracking',
            badge: ranger.badge_number || ''
          };
        });
      
      setRangerPatrols(transformedPatrols);
      
      // Cache for offline
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cached_ranger_patrols', JSON.stringify(transformedPatrols));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to fetch ranger patrols:', error);
      await loadCachedRangerPatrols();
    }
  };

  const loadCachedRangerPatrols = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const cached = await AsyncStorage.getItem('cached_ranger_patrols');
      if (cached) {
        setRangerPatrols(JSON.parse(cached));
      }
    } catch (e) {}
  };

  const fetchPredictions = async () => {
    try {
      const predictionsData = {};
      for (const animal of animals.slice(0, 5)) {
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

  const handleTrackAnimal = (animal) => {
    setSelectedAnimal(animal);
    setShowAnimalPanel(true);
  };

  // Calculate stats from actual map data
  const totalAnimals = animals.length;
  const safeAnimals = animals.filter(a => {
    // Safe: low/medium risk level
    const risk = (a.risk_level || a.risk || '').toLowerCase();
    return risk === 'low' || risk === 'medium' || !risk;
  }).length;
  const movingAnimals = animals.filter(a => {
    // Moving: has speed > 0.5 km/h or activity type indicates movement
    const speed = a.speed || 0;
    const activity = (a.activityType || '').toLowerCase();
    return speed > 0.5 || activity.includes('moving') || activity.includes('active');
  }).length;
  const atRiskAnimals = animals.filter(a => {
    // At Risk: high/critical risk level or critical health
    const risk = (a.risk_level || a.risk || '').toLowerCase();
    const health = (a.health || '').toLowerCase();
    return risk === 'high' || risk === 'critical' || health === 'critical';
  }).length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Simple Header - Offline indicator and Emergency button only */}
      <View style={styles.simpleHeader}>
        {/* Offline Mode Indicator */}
        <View style={styles.offlineIndicator}>
          <MaterialCommunityIcons 
            name={isOnline ? "wifi" : "wifi-off"} 
            size={20} 
            color={isOnline ? STATUS_COLORS.SUCCESS : STATUS_COLORS.ERROR} 
          />
          <Text style={[styles.offlineText, { color: isOnline ? STATUS_COLORS.SUCCESS : STATUS_COLORS.ERROR }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* SOS Emergency Button */}
          <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => safeNavigate('/screens/patrol/ReportEmergencyScreen')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon" size={24} color={BRAND_COLORS.SURFACE} />
          <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {!loading && (
        <SmartMap 
            animals={animals}
          corridors={showCorridors ? corridors : []}
          predictions={showPredictions ? animalPredictions : {}}
          riskZones={showRiskZones ? riskZones : []}
            rangerPatrols={showRangerPatrols ? rangerPatrols : []}
            alerts={allAlerts || []}
          userLocation={showMyLocation ? userLocation : null}
            behavioralStates={showBehavior ? behavioralStates : {}}
            riskHeatmap={showEnvironment ? riskHeatmap : []}
          showBehavior={showBehavior}
            showCorridors={showCorridors}
            showRiskZones={showRiskZones}
            showPredictions={showPredictions}
            showEnvironment={showEnvironment}
            showRangerPatrols={showRangerPatrols}
            showAnimalMovement={true}
            showBehaviorStates={showBehavior}
          onAnimalPress={handleTrackAnimal}
            style={{ flex: 1, width: '100%', height: '100%' }}
        />
        )}

        {/* Map Overlay Stats - Only show if animals exist */}
        {totalAnimals > 0 && (
        <View style={styles.statsOverlay}>
          <View style={styles.statCard}>
              <MaterialCommunityIcons name="shield-check" size={18} color={STATUS_COLORS.SUCCESS} />
              <Text style={styles.statValue}>{safeAnimals}</Text>
              <Text style={styles.statLabel}>Safe</Text>
          </View>
          <View style={styles.statCard}>
              <MaterialCommunityIcons name="run-fast" size={18} color={BRAND_COLORS.PRIMARY} />
              <Text style={styles.statValue}>{movingAnimals}</Text>
              <Text style={styles.statLabel}>Moving</Text>
          </View>
          <View style={styles.statCard}>
              <MaterialCommunityIcons name="alert" size={18} color={STATUS_COLORS.ERROR} />
              <Text style={styles.statValue}>{atRiskAnimals}</Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="paw" size={18} color={BRAND_COLORS.SECONDARY} />
              <Text style={styles.statValue}>{totalAnimals}</Text>
              <Text style={styles.statLabel}>Total</Text>
        </View>
          </View>
        )}

        {/* Legend Button */}
        <TouchableOpacity 
          style={styles.legendButton}
          onPress={() => setShowMLPanel(true)}
        >
          <MaterialCommunityIcons name="information" size={24} color={BRAND_COLORS.PRIMARY} />
        </TouchableOpacity>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading wildlife data...</Text>
          </View>
        )}
      </View>

      {/* Map Legend Panel */}
      <Modal
        visible={showMLPanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMLPanel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.legendPanel}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Map Legend</Text>
              <TouchableOpacity onPress={() => setShowMLPanel(false)}>
                <MaterialCommunityIcons name="close" size={24} color={BRAND_COLORS.TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.legendContent}>
              {/* Animal Risk Status */}
              <View style={styles.legendSection}>
                <Text style={styles.legendSectionTitle}>Animal Risk Status</Text>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: STATUS_COLORS.SUCCESS }]} />
                  <Text style={styles.legendText}>Safe - Within corridor</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: STATUS_COLORS.WARNING }]} />
                  <Text style={styles.legendText}>Caution - Outside corridor</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: STATUS_COLORS.ERROR }]} />
                  <Text style={styles.legendText}>Danger - High risk zone</Text>
                </View>
              </View>

              {/* Alert Types */}
              <View style={styles.legendSection}>
                <Text style={styles.legendSectionTitle}>Alert Types</Text>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="alert" size={16} color={STATUS_COLORS.ERROR} />
                  <Text style={styles.legendText}>High Risk Zone Entry</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="shield" size={16} color={BRAND_COLORS.PRIMARY} />
                  <Text style={styles.legendText}>Poaching Risk</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={STATUS_COLORS.WARNING} />
                  <Text style={styles.legendText}>Corridor Exit</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="run" size={16} color={BRAND_COLORS.ACCENT} />
                  <Text style={styles.legendText}>Rapid Movement</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="battery-low" size={16} color={STATUS_COLORS.WARNING} />
                  <Text style={styles.legendText}>Low Battery</Text>
                </View>
                <View style={styles.legendItem}>
                  <MaterialCommunityIcons name="signal" size={16} color={BRAND_COLORS.TEXT_SECONDARY} />
                  <Text style={styles.legendText}>Weak Signal</Text>
                </View>
              </View>

              {/* Map Layers */}
              <View style={styles.legendSection}>
                <Text style={styles.legendSectionTitle}>Map Layers</Text>
                
                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={BRAND_COLORS.PRIMARY} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>Movement Paths</Text>
                      <Text style={styles.layerDesc}>Show animal movement trails</Text>
                    </View>
                </View>
                <Switch
                    value={true}
                    disabled={true}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.PRIMARY }}
                />
              </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="brain" size={20} color={BRAND_COLORS.HIGHLIGHT} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>Behavior States</Text>
                      <Text style={styles.layerDesc}>Foraging, resting, migrating</Text>
                    </View>
                </View>
                <Switch
                  value={showBehavior}
                  onValueChange={setShowBehavior}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.HIGHLIGHT }}
                />
              </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={STATUS_COLORS.ERROR} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>Risk Zones</Text>
                      <Text style={styles.layerDesc}>Conflict and poaching zones</Text>
                    </View>
                </View>
                <Switch
                  value={showRiskZones}
                  onValueChange={setShowRiskZones}
                  trackColor={{ false: '#E5E7EB', true: STATUS_COLORS.ERROR }}
                />
              </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="map-marker-path" size={20} color={BRAND_COLORS.ACCENT} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>Corridors</Text>
                      <Text style={styles.layerDesc}>Protected movement pathways</Text>
                    </View>
                </View>
                <Switch
                  value={showCorridors}
                  onValueChange={setShowCorridors}
                  trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.ACCENT }}
                />
              </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={STATUS_COLORS.INFO} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>AI Predictions</Text>
                      <Text style={styles.layerDesc}>Predicted movement paths</Text>
                    </View>
                  </View>
                  <Switch
                    value={showPredictions}
                    onValueChange={setShowPredictions}
                    trackColor={{ false: '#E5E7EB', true: STATUS_COLORS.INFO }}
                  />
                </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color={STATUS_COLORS.SUCCESS} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>My Location</Text>
                      <Text style={styles.layerDesc}>Show my position</Text>
                    </View>
                </View>
                <Switch
                  value={showMyLocation}
                  onValueChange={setShowMyLocation}
                    trackColor={{ false: '#E5E7EB', true: STATUS_COLORS.SUCCESS }}
                  />
                </View>

                <View style={styles.layerToggle}>
                  <View style={styles.layerInfo}>
                    <MaterialCommunityIcons name="account-group" size={20} color={BRAND_COLORS.SECONDARY} />
                    <View style={styles.layerText}>
                      <Text style={styles.layerTitle}>Ranger Patrols</Text>
                      <Text style={styles.layerDesc}>Active ranger positions</Text>
                    </View>
                  </View>
                  <Switch
                    value={showRangerPatrols}
                    onValueChange={setShowRangerPatrols}
                    trackColor={{ false: '#E5E7EB', true: BRAND_COLORS.SECONDARY }}
                  />
                </View>
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
                    <Text style={[styles.detailValue, { 
                      color: selectedAnimal.risk === 'High' || selectedAnimal.risk === 'high' 
                        ? STATUS_COLORS.ERROR 
                        : selectedAnimal.risk === 'Medium' || selectedAnimal.risk === 'medium'
                        ? STATUS_COLORS.WARNING
                        : STATUS_COLORS.SUCCESS
                    }]}>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  statsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
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
  legendButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: BRAND_COLORS.SURFACE,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  simpleHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: STATUS_COLORS.ERROR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emergencyButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 14,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  legendPanel: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  legendTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
  },
  legendContent: {
    padding: 20,
  },
  legendSection: {
    marginBottom: 24,
  },
  legendSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT,
  },
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  layerText: {
    flex: 1,
  },
  layerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    marginBottom: 2,
  },
  layerDesc: {
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
