import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, Layers, Brain, AlertTriangle, TrendingUp, Shield, MapPin, CheckCircle, X } from '@/components/shared/Icons';
import Sidebar from '@/components/shared/Sidebar';
import MapComponent from '@/components/shared/MapComponent';
import { isAllowedSpecies } from '@/constants/Animals';
import { COLORS, rgba } from '@/constants/Colors';
import { animals as animalsService, corridors as corridorsService, predictions as predictionsService, tracking as trackingService, rangers as rangersService, alerts as alertsService, behavior as behaviorService } from '@/services';
import api from '@/services/api';
import { createTestAnimals, deleteTestAnimals } from '@/utils/createTestAnimals';
import AlertBadge from '@/components/alerts/AlertBadge';
import AlertsPanel from '@/components/alerts/AlertsPanel';

const safeMLCall = async (fn, ...args) => {
  try {
    if (typeof fn === 'function') {
      const result = await fn(...args);
      return result;
    }
    console.warn('ML function not available');
    return null;
  } catch (error) {
    console.warn('ML feature not available:', error.message);
    return null;
  }
};

const SAFE_ZONES = [
  { name: 'Amboseli NP', bounds: [[-2.75, 37.15], [-2.55, 37.35]] },
  { name: 'Tsavo West NP', bounds: [[-3.06, 37.92], [-2.86, 38.12]] },
  { name: 'Maasai Mara NR', bounds: [[-1.6, 35.1], [-1.4, 35.3]] },
  { name: 'Serengeti NP', bounds: [[-2.4, 34.7], [-2.2, 34.9]] },
  { name: 'Tarangire NP', bounds: [[-3.93, 35.9], [-3.73, 36.1]] },
  { name: 'Lake Manyara NP', bounds: [[-3.7, 35.7], [-3.5, 35.9]] }
];

const isInBounds = (lat, lon, bounds) => {
  const [[minLat, minLon], [maxLat, maxLon]] = bounds;
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
};

const WildlifeTracking = () => {
  const navigate = useNavigate();
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies] = useState('all');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(7);
  
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  const [showEnvLayers, setShowEnvLayers] = useState(false);
  const [mlPanelOpen, setMlPanelOpen] = useState(true);
  
  const [animals, setAnimals] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [environmentData, setEnvironmentData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [liveTrackingData, setLiveTrackingData] = useState({});
  const [movementTrail, setMovementTrail] = useState(null);
  const [isPlayingTrail, setIsPlayingTrail] = useState(false);
  const [rangers, setRangers] = useState([]);
  const [historicalPaths, setHistoricalPaths] = useState({});
  const [alertStats, setAlertStats] = useState({ active: 0, critical: 0, total: 0 });
  const [behaviorSummary, setBehaviorSummary] = useState(null);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  
      const [layerToggles, setLayerToggles] = useState({
        corridors: true,
        riskZones: true,
        predictions: true,
        rangerPatrols: true,
        heatmap: false,
        movementPaths: true,
        animalMovement: true
      });
  

      useEffect(() => {
        window.createTestAnimals = createTestAnimals;
        window.deleteTestAnimals = deleteTestAnimals;
        
        window.testMovement = () => {
          console.log('🧪 Testing animal movement...');
          console.log('Animals:', animals.length);
          animals.forEach(animal => {
            const positionsDifferent = (
              Math.abs(animal.coordinates[0] - animal.predictedCoordinates[0]) > 0.00001 || 
              Math.abs(animal.coordinates[1] - animal.predictedCoordinates[1]) > 0.00001
            );
            const shouldMove = animal.speed > 2 && 
                             animal.activityType === 'moving' &&
                             positionsDifferent;
            
            console.log(`${animal.name}:`, {
              speed: animal.speed.toFixed(2),
              activityType: animal.activityType,
              current: `[${animal.coordinates[0].toFixed(6)}, ${animal.coordinates[1].toFixed(6)}]`,
              predicted: `[${animal.predictedCoordinates[0].toFixed(6)}, ${animal.predictedCoordinates[1].toFixed(6)}]`,
              distance_km: (Math.sqrt(
                Math.pow(animal.predictedCoordinates[0] - animal.coordinates[0], 2) + 
                Math.pow(animal.predictedCoordinates[1] - animal.coordinates[1], 2)
              ) * 111).toFixed(3),
              positionsDifferent: positionsDifferent,
              willMove: shouldMove,
              direction: animal.direction,
              willAnimate: animal.willAnimate
            });
          });
          
          const movingAnimals = animals.filter(a => 
            a.speed > 2 && 
            a.activityType === 'moving' &&
            (Math.abs(a.coordinates[0] - a.predictedCoordinates[0]) > 0.00001 || 
             Math.abs(a.coordinates[1] - a.predictedCoordinates[1]) > 0.00001)
          );
          
          console.log(`\n✅ Animals that SHOULD be animating: ${movingAnimals.length}`);
          movingAnimals.forEach(a => console.log(`   - ${a.name} (${a.speed.toFixed(1)} km/h)`));
        };
      }, [animals]);

  const handlePlayTrail = (trail) => {
    setMovementTrail(trail);
    setIsPlayingTrail(true);
    console.log('[TRAIL] Starting animation playback:', trail.total_points, 'points');
  };

  const handleTrailComplete = () => {
    console.log('[TRAIL] Animation completed');
    setIsPlayingTrail(false);
  };

  const handleStopTrail = () => {
    setMovementTrail(null);
    setIsPlayingTrail(false);
  };

      const fetchAnimals = useCallback(async () => {
        try {
          console.log('🔄 Fetching animals from backend...');
          console.log('API URL:', api.defaults.baseURL);
          
          const startTime = performance.now();
          
          const response = await api.get('/api/animals/live_status/', {
            timeout: 150000
          });
          const liveStatusData = response.data;
      
      const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`Live status loaded in ${loadTime}s:`, liveStatusData.length, 'animals');
      console.log('Raw response:', liveStatusData);
        
        const transformedAnimals = liveStatusData.map(animal => {
          let lat = animal.current_position?.lat || animal.last_lat || 0;
          let lon = animal.current_position?.lon || animal.last_lon || 0;
          
          console.log(`Processing ${animal.name || animal.animal_name}: lat=${lat}, lon=${lon}`);
          
          if (Math.abs(lat) > 90 || (Math.abs(lat) > 20 && Math.abs(lon) < 10)) {
            const temp = lat;
            lat = lon;
            lon = temp;
            console.log(`Swapped coordinates for correct lat/lon: [${lat}, ${lon}]`);
          }
          
          const generateLocation = (latitude, longitude) => {
            console.log(`  generateLocation called with lat: ${latitude}, lon: ${longitude}`);
            if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
              console.log(`  Returning Unknown because: lat=${latitude}, lon=${longitude}`);
              return 'Unknown';
            }
            const latDir = latitude >= 0 ? 'N' : 'S';
            const lonDir = longitude >= 0 ? 'E' : 'W';
            const locationStr = `${Math.abs(latitude).toFixed(2)}°${latDir}, ${Math.abs(longitude).toFixed(2)}°${lonDir}`;
            console.log(`  Generated location: ${locationStr}`);
            return locationStr;
          };
          
          const animalName = animal.name || animal.animal_name || `${animal.species} #${animal.animal_id || animal.id || animal.collar_id}`;
          const locationString = generateLocation(lat, lon);
          
          console.log(`${animalName}: ${locationString} [${lat}, ${lon}]`);
          
          const speed = animal.movement?.speed_kmh || 0;
          let heading = animal.movement?.directional_angle;
          const batteryLevel = animal.movement?.battery_level || 'Unknown';
          const signalStrength = animal.movement?.signal_strength || 'Unknown';
          
          let predictedLat = animal.predicted_position?.lat;
          let predictedLon = animal.predicted_position?.lon;
          
          const hasPredictedPosition = predictedLat && predictedLon;
          const predictedSameAsCurrent = hasPredictedPosition && 
            (Math.abs(predictedLat - lat) < 0.00001 && Math.abs(predictedLon - lon) < 0.00001);
          
          if (!hasPredictedPosition || predictedSameAsCurrent) {
            if (speed > 0.5) {
              if (typeof heading !== 'number' || heading === null || heading === 0) {
                heading = Math.random() * 360;
                console.log(`  🎲 ${animalName}: Generated random heading ${heading.toFixed(0)}°`);
              }
              
              const timeAheadMinutes = speed > 2 ? 30 : 10;
              const timeAheadHours = timeAheadMinutes / 60;
              const distanceKm = speed * timeAheadHours;
              const distanceDegrees = distanceKm / 111;
              
              const headingRadians = heading * (Math.PI / 180);
              predictedLat = lat + (distanceDegrees * Math.cos(headingRadians));
              predictedLon = lon + (distanceDegrees * Math.sin(headingRadians));
              
              const distanceFromCurrent = Math.sqrt(
                Math.pow(predictedLat - lat, 2) + Math.pow(predictedLon - lon, 2)
              ) * 111;
              
              if (predictedSameAsCurrent) {
                console.log(`  ⚠️ ${animalName}: Backend predicted same as current - recalculating`);
              }
              console.log(`  📍 ${animalName}: Predicted [${predictedLat.toFixed(4)}, ${predictedLon.toFixed(4)}] (${distanceKm.toFixed(2)}km, heading: ${heading.toFixed(0)}°, distance: ${distanceFromCurrent.toFixed(3)}km)`);
            } else {
              predictedLat = lat;
              predictedLon = lon;
            }
          } else {
            console.log(`  ✅ ${animalName}: Using backend predicted position [${predictedLat.toFixed(4)}, ${predictedLon.toFixed(4)}]`);
          }
          
          const timestamp = animal.current_position?.timestamp || animal.last_update || new Date().toISOString();
          const lastSeenDate = new Date(timestamp);
          const lastSeenStr = isNaN(lastSeenDate) ? 'Unknown' : lastSeenDate.toLocaleString();
          
          const activityType = animal.movement?.activity_type || 
                             (speed > 2 ? 'moving' : speed > 0.5 ? 'feeding' : 'resting');
          
          const behaviorState = animal.movement?.behavior_state || activityType;
          const behaviorSource = animal.movement?.behavior_source || 'rule_based';
          
          const willMove = speed > 2 && 
                         activityType === 'moving' &&
                         (Math.abs(predictedLat - lat) > 0.00001 || Math.abs(predictedLon - lon) > 0.00001);
          
          if (speed > 0.5 || willMove) {
            console.log(`${animalName} [${activityType.toUpperCase()}]:`, {
              speed: `${speed.toFixed(1)} km/h`,
              heading: heading !== null && heading !== undefined ? `${heading.toFixed(0)}°` : 'unknown',
              current: [lat.toFixed(4), lon.toFixed(4)],
              predicted: [predictedLat.toFixed(4), predictedLon.toFixed(4)],
              willAnimate: willMove,
              behaviorSource: behaviorSource
            });
          }
          
          return {
            id: animal.animal_id || animal.id,
            species: animal.species || 'Unknown',
            name: animalName,
            status: 'Active',
            location: locationString,
            coordinates: [lat, lon],
            predictedCoordinates: [predictedLat, predictedLon],
            battery: batteryLevel,
            lastSeen: lastSeenStr,
            risk: animal.conflict_risk?.current?.risk_level || 'Low',
            riskReason: animal.conflict_risk?.current?.reason || 'No threats detected',
            age: animal.age || 'Unknown',
            gender: animal.gender || 'Unknown',
            health: animal.health_status || 'Good',
            speed: speed,
            altitude: animal.current_position?.altitude || 0,
            direction: heading || 0,
            signalStrength: signalStrength,
            temperature: 0,
            activityType: activityType,
            collarId: animal.collar_id,
            synced: true,
            inCorridor: animal.corridor_status?.inside_corridor || false,
            corridorName: animal.corridor_status?.corridor_name || null,
            predictedInCorridor: animal.corridor_status?.predicted_in_corridor || false,
            predictedCorridorName: animal.corridor_status?.predicted_corridor_name || null,
            conflictZone: animal.conflict_risk?.current?.conflict_zone || null,
            conflictRiskLevel: animal.conflict_risk?.current?.risk_level || 'low',
            conflictRiskReason: animal.conflict_risk?.current?.reason || 'No threats detected',
            distanceToConflict: animal.conflict_risk?.current?.distance_to_conflict_km || null,
            alerts: {
              active_count: animal.alerts?.active_count || 0,
              has_critical: animal.alerts?.has_critical || false,
              latest_alert: animal.alerts?.latest_alert || null
            },
            behaviorState: behaviorState,
            behaviorSource: behaviorSource,
            willAnimate: willMove,
          };
        });
        
        setAnimals(prevAnimals => {
          if (prevAnimals.length === 0) {
            console.log(`SUCCESS: Loaded ${transformedAnimals.length} animals from backend (initial load)`);
            return transformedAnimals;
          }
          
          const POSITION_THRESHOLD = 0.0001;
          let hasSignificantChange = false;
          
          const updatedAnimals = transformedAnimals.map(newAnimal => {
            const oldAnimal = prevAnimals.find(a => a.id === newAnimal.id);
            
            if (!oldAnimal) {
              hasSignificantChange = true;
              return newAnimal;
            }
            
            const latDiff = Math.abs(newAnimal.coordinates[0] - oldAnimal.coordinates[0]);
            const lonDiff = Math.abs(newAnimal.coordinates[1] - oldAnimal.coordinates[1]);
            
            if (latDiff > POSITION_THRESHOLD || lonDiff > POSITION_THRESHOLD) {
              hasSignificantChange = true;
              console.log(`${newAnimal.name} moved: ${oldAnimal.coordinates} -> ${newAnimal.coordinates}`);
            }
            
            return newAnimal;
          });
          
          if (hasSignificantChange) {
            console.log(`SUCCESS: Updated ${transformedAnimals.length} animals (positions changed)`);
            return updatedAnimals;
          } else {
            console.log(`No significant movement detected - keeping current positions`);
            return prevAnimals;
          }
        });
        
        console.log('Animals data:', transformedAnimals);
        
        transformedAnimals.forEach(animal => {
          console.log(`${animal.name} (${animal.species}):`, {
            coordinates: animal.coordinates,
            location: animal.location,
            lastSeen: animal.lastSeen,
            battery: animal.battery,
            speed: animal.speed,
            activityType: animal.activityType
          });
        });
        
        if (transformedAnimals.length === 0) {
          console.warn('No animals found! Check if you added animals in the admin panel and they have status="active"');
        } else {
          const animalsWithNoCoords = transformedAnimals.filter(a => a.coordinates[0] === 0 && a.coordinates[1] === 0);
          if (animalsWithNoCoords.length > 0) {
            console.warn(`${animalsWithNoCoords.length} animals have no coordinates (0,0):`, 
              animalsWithNoCoords.map(a => a.name));
            console.warn('Make sure you have tracking data with lat/lon for these animals in the database');
          }
        }
      } catch (err) {
        console.error('Error fetching animals:', err);
        console.error('Error details:', err.response?.data || err.message);
        setAnimals([]);
      } finally {
        setIsLoading(false);
      }
    }, []);
  
  const fetchCorridors = useCallback(async () => {
    try {
      const data = await corridorsService.getAll({ status: 'active' });
      setCorridors(data.results || data || []);
      console.log(`Loaded ${(data.results || data || []).length} corridors from backend`);
    } catch (err) {
      console.error('Error fetching corridors:', err);
      setCorridors([]);
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const predictionMap = {};
      
      for (const animal of animals) {
          predictionMap[animal.id] = {
          movementPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : [],
          lstmPredictions: [],
          behavioralState: animal.activityType || 'unknown',
          behavioralProbabilities: {},
          combinedPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : []
        };
      }
      
      setPredictions(predictionMap);
      console.log(`Loaded ML predictions for ${Object.keys(predictionMap).length} animals`);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions({});
    }
  }, [animals]);

  const fetchCorridorOptimization = useCallback(async () => {
    console.log('[INFO] Corridor optimization skipped on init');
  }, []);

  const fetchPoachingZones = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/?is_active=true');
      const zones = response.data.results || response.data || [];
      setRiskZones(zones);
      console.log(`Loaded ${zones.length} conflict zones from backend`);
    } catch (err) {
      console.warn('Conflict zones unavailable:', err.message);
      setRiskZones([]);
    }
  }, []);

  const fetchLiveTracking = useCallback(async () => {
    try {
      const data = await trackingService.getLiveTracking();
      setLiveTrackingData(data);
      console.log('[INFO] Live tracking ML pipeline loaded:', {
        animals: data.animals?.length || 0,
        mlPipeline: 'HMM→BBMM→XGBoost→LSTM→RL'
      });
    } catch (err) {
      console.warn('Live tracking pipeline unavailable:', err.message);
      setLiveTrackingData({});
    }
  }, []);

  const fetchRangers = useCallback(async () => {
    try {
      const data = await rangersService.getLiveStatus();
      const transformedRangers = (data || []).map(ranger => ({
        id: ranger.ranger_id,
        name: ranger.name,
        badgeNumber: ranger.badge_number,
        team: ranger.team_name,
        status: ranger.current_status,
        coordinates: [
          ranger.current_position?.lat || 0,
          ranger.current_position?.lon || 0
        ],
        activity: ranger.activity_type || 'patrolling',
        battery: ranger.battery_level || '100%',
        lastSeen: ranger.current_position?.timestamp || ranger.last_active,
      }));
      
      setRangers(transformedRangers);
      console.log(`Loaded ${transformedRangers.length} active rangers from backend`);
    } catch (err) {
      console.warn('Rangers data unavailable:', err.message);
      setRangers([]);
    }
  }, []);

  const fetchAlertStats = useCallback(async () => {
    try {
      const stats = await alertsService.getStats();
      setAlertStats(stats);
      console.log('Alert stats loaded:', stats);
    } catch (err) {
      console.warn('Alert stats unavailable:', err.message);
    }
  }, []);

  const fetchBehaviorSummary = useCallback(async () => {
    try {
      const summary = await behaviorService.getSummary();
      setBehaviorSummary(summary);
      console.log('Behavior summary loaded:', summary);
    } catch (err) {
      console.warn('Behavior summary unavailable:', err.message);
    }
  }, []);

  const fetchEnvironmentData = useCallback(async () => {
    const centerLat = -2.0;
    const centerLon = 35.5;
    const data = await safeMLCall(
      predictionsService.getXGBoostEnvironment,
      centerLat,
      centerLon,
      'elephant',
      50000
    );
    
    if (data) {
      setEnvironmentData(data);
      console.log('[INFO] XGBoost environment predictions loaded');
    } else {
      setEnvironmentData({});
    }
  }, []);

  const checkAnimalDanger = useCallback((animal) => {
    if (!animal.coordinates || animal.coordinates[0] === 0) {
      return { risk: 'unknown', threatType: null, threatZone: null };
    }
    
    const [lat, lon] = animal.coordinates;
    
    const safeZone = SAFE_ZONES.find(zone => isInBounds(lat, lon, zone.bounds));
    if (safeZone) {
      return { risk: 'safe', threatType: null, threatZone: safeZone.name };
    }
    
    const conflictZone = riskZones.find(zone => {
      if (!zone.geometry || !zone.geometry.coordinates) return false;
      const zoneCoords = zone.geometry.coordinates;
      const bufferDist = (zone.buffer_distance_km || 5) / 111;
      return Math.abs(zoneCoords[0] - lat) < bufferDist && Math.abs(zoneCoords[1] - lon) < bufferDist;
    });
    
    if (conflictZone) {
      const isPoaching = conflictZone.zone_type === 'poaching' || conflictZone.risk_level === 'high';
      return { 
        risk: 'high', 
        threatType: isPoaching ? 'poaching' : 'human_wildlife_conflict', 
        threatZone: conflictZone.name || 'Conflict Zone',
        threatDetails: conflictZone.description || `${conflictZone.zone_type} risk area`
      };
    }
    
    const corridor = corridors.find(c => {
      if (!c.path || c.path.length === 0) return false;
      return c.path.some(point => {
        const distLat = Math.abs(point[0] - lat);
        const distLon = Math.abs(point[1] - lon);
        return distLat < 0.02 && distLon < 0.02;
      });
    });
    
    if (corridor) {
      return { risk: 'safe', threatType: null, threatZone: corridor.name };
    }
    
    return { 
      risk: 'medium', 
      threatType: 'human_wildlife_conflict', 
      threatZone: 'Human Settlement Area',
      threatDetails: 'Animal near villages, farms, or livestock - possible crop raiding or livestock predation'
    };
  }, [corridors, riskZones]);

  const checkAnimalRisk = useCallback((animal) => {
    return checkAnimalDanger(animal).risk;
  }, [checkAnimalDanger]);


  useEffect(() => {
    console.log('[INIT] WildlifeTracking mounted - initializing...');
    
    const loadingTimeout = setTimeout(() => {
      console.warn('[WARNING] Loading timeout reached - forcing map display');
      setIsLoading(false);
    }, 10000);
    
    const initializeData = async () => {
      try {
        console.log('[INFO] Starting data fetch - map will show as data arrives...');
        
        await fetchAnimals();
        clearTimeout(loadingTimeout);
        
        fetchCorridors().catch(err => console.error('Corridors fetch failed:', err));
        fetchPoachingZones().catch(err => console.error('Poaching zones fetch failed:', err));
        fetchRangers().catch(err => console.error('Rangers fetch failed:', err));
        
        fetchLiveTracking().catch(() => {}); 
        fetchCorridorOptimization().catch(() => {}); 
        fetchEnvironmentData().catch(() => {}); 
        
      } catch (error) {
        console.error('[ERROR] Initialization error:', error);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    };
    
        initializeData();
        
        const liveStatusInterval = setInterval(() => {
          fetchAnimals().catch(() => {});
        }, 60000);
        
        const alertsInterval = setInterval(() => {
          fetchAlertStats().catch(() => {});
        }, 30000);
        
        const rangersInterval = setInterval(() => {
          fetchRangers().catch(() => {});
          fetchPoachingZones().catch(() => {});
        }, 60000);
        
        const behaviorInterval = setInterval(() => {
          fetchBehaviorSummary().catch(() => {});
        }, 120000);
        
        const mlInterval = setInterval(() => {
          fetchEnvironmentData().catch(() => {});
          fetchCorridorOptimization().catch(() => {});
          fetchLiveTracking().catch(() => {});
        }, 300000);
    
        return () => {
          clearInterval(liveStatusInterval);
          clearInterval(alertsInterval);
          clearInterval(rangersInterval);
          clearInterval(behaviorInterval);
          clearInterval(mlInterval);
          clearTimeout(loadingTimeout);
        };
  }, [fetchAnimals, fetchCorridors, fetchPredictions, fetchCorridorOptimization, fetchEnvironmentData, fetchLiveTracking, fetchPoachingZones, fetchRangers, fetchAlertStats, fetchBehaviorSummary, animals.length]);

  useEffect(() => {
    if (showEnvLayers && environmentData && Object.keys(environmentData).length > 0) {
      console.log('XGBoost Environment Data loaded:', environmentData);
    }
  }, [showEnvLayers, environmentData]);

  useEffect(() => {
    if (liveTrackingData && Object.keys(liveTrackingData).length > 0) {
      console.log('[ML] Live Tracking ML Pipeline Active:', liveTrackingData);
    }
  }, [liveTrackingData]);

  useEffect(() => {
    if (animals.length === 0) return;

    const alertedAnimals = new Set();

    animals.forEach(animal => {
      const dangerInfo = checkAnimalDanger(animal);
      
      if (dangerInfo.risk === 'high' && !alertedAnimals.has(animal.id)) {
        alertedAnimals.add(animal.id);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Wildlife Alert', {
            body: `${animal.name} is in ${dangerInfo.threatZone}! ${dangerInfo.threatType?.replace('_', ' ').toUpperCase() || 'Danger detected'}`,
            icon: '/assets/logo.jpg',
            tag: animal.id
          });
        }
        
        console.warn('ALERT: High-risk animal detected!', {
          animal: animal.name,
          species: animal.species,
          location: animal.location,
          coordinates: animal.coordinates,
          threatType: dangerInfo.threatType,
          threatZone: dangerInfo.threatZone,
          speed: animal.speed,
          timestamp: new Date().toLocaleString()
        });
      }
      
      if (!animal.inCorridor && animal.predictedInCorridor === false && !alertedAnimals.has(`${animal.id}-corridor`)) {
        alertedAnimals.add(`${animal.id}-corridor`);
        console.warn(`${animal.name} has left the wildlife corridor`, {
          location: animal.location,
          lastCorridor: animal.corridorName
        });
      }
    });
  }, [animals, checkAnimalDanger]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Browser notifications enabled for wildlife alerts');
        }
      });
    }
  }, []);

  useEffect(() => {
    const fetchHistoricalPath = async () => {
      if (!selectedAnimal || !selectedAnimal.id) return;
      
      if (historicalPaths[selectedAnimal.id]) {
        console.log(`Using cached path for ${selectedAnimal.name}`);
        return;
      }
      
      try {
        console.log(`Fetching historical path for ${selectedAnimal.name}...`);
        const trail = await animalsService.getMovementTrail(selectedAnimal.id, { 
          points: 50,
          hours: 24
        });
        
        if (trail && trail.path && trail.path.length > 0) {
          setHistoricalPaths(prev => ({
            ...prev,
            [selectedAnimal.id]: trail.path.map(p => [p.lat, p.lon])
          }));
          console.log(`Loaded ${trail.path.length} historical points for ${selectedAnimal.name}`);
        }
      } catch (error) {
        console.warn(`Historical path not available for ${selectedAnimal.name}:`, error.message);
      }
    };
    
    fetchHistoricalPath();
  }, [selectedAnimal, historicalPaths]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const getAnimalMarkerColor = (animal) => {
    const risk = checkAnimalRisk(animal);
    switch(risk) {
      case 'safe': return '#059669';
      case 'medium': return '#ea580c';
      case 'high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const toggleLayer = (layerName) => {
    setLayerToggles(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const totalTracked = animals.length;
  const activeNow = animals.filter(a => a.status === 'Moving' || a.status === 'Feeding' || a.status === 'Active').length;
  const highRisk = animals.filter(a => a.risk === 'High').length;
  const healthAlerts = animals.filter(a => a.health === 'Monitoring' || a.health === 'Poor').length;

  const visibleAnimals = animals.filter(a => isAllowedSpecies(a.species));

  const filteredAnimals = filterSpecies === 'all' 
    ? visibleAnimals 
    : animals.filter(a => a.species.toLowerCase().includes(filterSpecies.toLowerCase()));

  // Filter by search query
  const searchFilteredAnimals = searchQuery === ''
    ? filteredAnimals
    : filteredAnimals.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const trackAnimal = (animal) => {
    setSelectedAnimal(animal);
    if (animal.coordinates && animal.coordinates[0] !== 0 && animal.coordinates[1] !== 0) {
      setMapZoom(14);
      console.log(`Tracking ${animal.name} at [${animal.coordinates[0].toFixed(4)}, ${animal.coordinates[1].toFixed(4)}]`);
      
      const dangerInfo = checkAnimalDanger(animal);
      if (dangerInfo.threatType) {
        console.log(`Alert: ${dangerInfo.threatType} - ${dangerInfo.threatZone}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: COLORS.creamBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <Activity style={{ width: 64, height: 64 }} color={COLORS.forestGreen} className="animate-pulse" />
        <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.forestGreen }}>Loading Wildlife Tracking...</div>
      </div>
    );
  }

  console.log('[RENDER] WildlifeTracking - Animals:', animals.length, 'Corridors:', corridors.length);

  try {
    return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh', display: 'flex' }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{ marginLeft: '260px', minHeight: '100vh', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: COLORS.white, marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Wildlife Tracking
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Real-time animal monitoring & conservation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertBadge stats={alertStats} onClick={() => setShowAlertsPanel(!showAlertsPanel)} />
            
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.success, animation: 'pulse 2s ease-in-out infinite' }}></div>
              Active: {activeNow}
            </div>
            <button
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              style={{
                background: COLORS.burntOrange,
                border: `2px solid ${COLORS.burntOrange}`,
                color: COLORS.white,
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; e.currentTarget.style.borderColor = COLORS.terracotta; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; e.currentTarget.style.borderColor = COLORS.burntOrange; }}
            >
              {panelCollapsed ? 'Show Panel' : 'Hide Panel'}
            </button>
          </div>
        </section>

        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintRangers,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {totalTracked}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Total Tracked
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: rgba('burntOrange', 0.1),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.burntOrange, marginBottom: '4px' }}>
                {activeNow}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active Now
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintCritical,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.error, marginBottom: '4px' }}>
                {highRisk}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                High Risk
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: rgba('statusInfo', 0.1),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {healthAlerts}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Health Alerts
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', position: 'relative', height: '700px', marginBottom: '40px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 0, height: '100%', overflow: 'hidden' }}>
            <MapComponent
              markers={searchFilteredAnimals.map(animal => {
                const dangerInfo = checkAnimalDanger(animal);
                const details = [
                  { label: 'Species', value: animal.species },
                  { label: 'Location', value: animal.location },
                  { label: 'Status', value: animal.status },
                  { label: 'Activity', value: animal.activityType || 'Unknown' },
                  { label: 'Speed', value: `${animal.speed?.toFixed(1) || '0.0'} km/h` },
                  { label: 'Risk Level', value: dangerInfo.risk.toUpperCase() },
                  { label: 'Last Seen', value: animal.lastSeen }
                ];
                
                if (dangerInfo.threatType) {
                  details.push({ label: 'Threat Type', value: dangerInfo.threatType.replace('_', ' ').toUpperCase() });
                  details.push({ label: 'Threat Zone', value: dangerInfo.threatZone });
                  if (dangerInfo.threatDetails) {
                    details.push({ label: 'Details', value: dangerInfo.threatDetails });
                  }
                }
                
                const markerType = animal.species.toLowerCase().includes('elephant') ? 'elephant' : 
                                  animal.species.toLowerCase().includes('wildebeest') ? 'wildebeest' : 'wildlife';
                
                console.log(`🏷️ ${animal.name} (${animal.species}) → type: "${markerType}"`);
                
                return {
                  id: animal.id,
                  title: animal.name,
                  position: animal.coordinates,
                  predictedPosition: animal.predictedCoordinates || animal.coordinates,
                  type: markerType,
                  color: getAnimalMarkerColor(animal),
                  activityType: animal.activityType,
                  speed: animal.speed || 0,
                  hasAlert: animal.alerts?.active_count > 0,
                  hasCriticalAlert: animal.alerts?.has_critical,
                  behaviorState: animal.behaviorState,
                  behaviorSource: animal.behaviorSource,
                  popupContent: {
                    title: animal.name,
                    details: details
                  }
                };
              })}
              showCorridors={layerToggles.corridors}
              showRiskZones={layerToggles.riskZones}
              showPredictions={layerToggles.predictions}
              showRangerPatrols={layerToggles.rangerPatrols}
              showAnimalMovement={layerToggles.animalMovement}
              riskZones={riskZones}
              predictedPaths={layerToggles.predictions && predictions ? Object.values(predictions).map(p => ({
                path: p.combinedPath || p.movementPath || [],
                animal_id: p.animal_id,
                model: p.lstmPredictions ? 'LSTM+BBMM' : 'BBMM',
                confidence: 0.85
              })).filter(p => p.path && p.path.length > 0) : []}
              rangerPatrols={rangers.map(ranger => ({
                id: ranger.id,
                team_name: ranger.name,
                status: ranger.status,
                current_position: ranger.coordinates,
                ranger_count: 1,
                badge: ranger.badgeNumber,
                activity: ranger.activity,
              }))}
              corridors={corridors}
              showLegendBox={false}
              center={selectedAnimal && selectedAnimal.coordinates && selectedAnimal.coordinates[0] !== 0 ? selectedAnimal.coordinates : undefined}
              zoom={mapZoom}
              height="100%"
              movementTrail={movementTrail}
              isPlayingTrail={isPlayingTrail}
              onTrailComplete={handleTrailComplete}
              historicalPaths={selectedAnimal && historicalPaths[selectedAnimal.id] ? [
                {
                  animalId: selectedAnimal.id,
                  animalName: selectedAnimal.name,
                  path: historicalPaths[selectedAnimal.id],
                  color: '#8b5cf6'
                }
              ] : []}
            />

            {movementTrail && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '2px solid #9333ea'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isPlayingTrail ? '#10b981' : '#ef4444',
                    animation: isPlayingTrail ? 'pulse 1s infinite' : 'none'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                    {isPlayingTrail ? 'Playing Trail Animation' : 'Trail Paused'}
                  </span>
                </div>
                {movementTrail.total_points && (
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    {movementTrail.total_points} points • {movementTrail.time_range?.total_span_days?.toFixed(1)} days
                  </span>
                )}
                <button
                  onClick={handleStopTrail}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                >
                  Stop Trail
                </button>
              </div>
            )}

            {mlPanelOpen && (
            <div style={{ 
              position: 'absolute', 
              bottom: '80px', 
              right: '20px', 
              background: COLORS.whiteCard, 
              border: `2px solid ${COLORS.forestGreen}`, 
              borderRadius: '10px', 
              padding: '16px', 
              boxShadow: '0 4px 16px rgba(46, 93, 69, 0.2)',
              zIndex: 1000,
              pointerEvents: 'auto',
              width: '260px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: COLORS.forestGreen,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Brain className="w-3.5 h-3.5" color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary }}>Model Predictions</div>
                    <div style={{ fontSize: '9px', color: COLORS.textSecondary, fontWeight: 600 }}>ML Analysis</div>
                  </div>
                </div>
                <button
                  onClick={() => setMlPanelOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.borderLight; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showPredictions ? COLORS.tintInfo : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showPredictions ? COLORS.info : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp className="w-3.5 h-3.5" color={COLORS.info} />
                    Movement Paths
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showPredictions}
                    onChange={(e) => setShowPredictions(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showBehavior ? COLORS.tintSuccess : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showBehavior ? COLORS.success : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity className="w-3.5 h-3.5" color={COLORS.success} />
                    Behavior States
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showBehavior}
                    onChange={(e) => setShowBehavior(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showRiskHeatmap ? COLORS.tintCritical : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showRiskHeatmap ? COLORS.error : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle className="w-3.5 h-3.5" color={COLORS.error} />
                    Risk Zones
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showRiskHeatmap}
                    onChange={(e) => setShowRiskHeatmap(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showEnvLayers ? COLORS.tintSuccess : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showEnvLayers ? COLORS.success : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers className="w-3.5 h-3.5" color={COLORS.success} />
                    Environment
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showEnvLayers}
                    onChange={(e) => setShowEnvLayers(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
              </div>

            </div>
            )}
            
            {!mlPanelOpen && (
              <button
                onClick={() => setMlPanelOpen(true)}
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  right: '20px',
                  background: COLORS.forestGreen,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: COLORS.white,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(46, 93, 69, 0.3)',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.forestGreen; }}
              >
                <Brain className="w-3.5 h-3.5" />
                ML
              </button>
            )}
      </div>

          <div style={{
            width: panelCollapsed ? 0 : '420px',
            background: COLORS.whiteCard,
            borderLeft: `2px solid ${COLORS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
            flexShrink: 0,
            height: '100%'
          }}>
            {!panelCollapsed && (
              <>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderLight}`, flexShrink: 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '12px' }}>
                    Tracked Animals
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                    <input
                      type="text"
                      placeholder="Search animals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        background: COLORS.secondaryBg,
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = COLORS.forestGreen;
                        e.currentTarget.style.background = COLORS.whiteCard;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                        e.currentTarget.style.background = COLORS.secondaryBg;
                      }}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', minHeight: 0 }}>
                  {searchFilteredAnimals.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px',
                      color: COLORS.textSecondary 
                    }}>
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <Search style={{ width: 48, height: 48 }} color={COLORS.textSecondary} />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px' }}>
                        No Animals Found
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: COLORS.textSecondary }}>
                        Waiting for animal data from backend...
                      </div>
                    </div>
                  ) : (
                    searchFilteredAnimals.map((animal) => {
                    const accentColor = animal.risk === 'High' ? COLORS.error :
                                     animal.risk === 'Medium' ? COLORS.ochre : COLORS.success;

                    return (
                      <div
                        key={animal.id}
                        onClick={() => trackAnimal(animal)}
                        style={{
                          background: selectedAnimal?.id === animal.id ? COLORS.whiteCard : COLORS.secondaryBg,
                          border: `2px solid ${selectedAnimal?.id === animal.id ? COLORS.burntOrange : COLORS.borderLight}`,
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          boxShadow: selectedAnimal?.id === animal.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = COLORS.whiteCard;
                          e.currentTarget.style.borderColor = COLORS.borderMedium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedAnimal?.id !== animal.id) {
                            e.currentTarget.style.background = COLORS.secondaryBg;
                            e.currentTarget.style.borderColor = COLORS.borderLight;
                          }
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          borderRadius: '8px 0 0 8px',
                          background: selectedAnimal?.id === animal.id ? COLORS.burntOrange : accentColor
                          }}></div>

                        {selectedAnimal?.id === animal.id && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: COLORS.burntOrange,
                            color: COLORS.white,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}>
                            <MapPin className="w-3 h-3" />
                            TRACKING
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ fontSize: '32px', filter: selectedAnimal?.id === animal.id ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none' }}>{animal.icon}</div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                                {animal.name}
                              </div>
                              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '2px' }}>
                                {animal.species}
                              </div>
                              <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500 }}>
                                {animal.id}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: COLORS.burntOrange }}>
                            <Activity className="w-3.5 h-3.5" />
                            {animal.status}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px', fontWeight: 500 }}>
                              Location
                            </div>
                            <div style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600 }}>
                              {animal.location}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px', fontWeight: 500 }}>
                              Last Seen
                            </div>
                            <div style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600 }}>
                              {animal.lastSeen}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              trackAnimal(animal);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: COLORS.burntOrange,
                              border: 'none',
                              color: COLORS.white,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                          >
                            <MapPin style={{ width: 14, height: 14 }} />
                            Track
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const trail = await animalsService.getMovementTrail(animal.id, { points: 100, all: true });
                                handlePlayTrail(trail);
                              } catch (error) {
                                console.error('Failed to load movement trail:', error);
                                alert('Movement trail not available');
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: '#9333ea',
                              border: 'none',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.background = '#7c3aed';
                            }}
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.background = '#9333ea';
                            }}
                          >
                            <Activity style={{ width: 14, height: 14 }} />
                            Play Trail
                          </button>
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              </>
            )}
          </div>
          </div>

          <div style={{ 
            background: COLORS.whiteCard,
            borderTop: `2px solid ${COLORS.borderLight}`,
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            flexShrink: 0
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Map Layers
              </div>
                   <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     {[
                       { id: 'corridors', label: 'Wildlife Corridors', color: '#2563eb', IconComponent: MapPin },
                       { id: 'riskZones', label: 'Risk Zones', color: '#dc2626', IconComponent: AlertTriangle },
                       { id: 'predictions', label: 'Predictions', color: '#7c3aed', IconComponent: TrendingUp },
                       { id: 'rangerPatrols', label: 'Ranger Patrols', color: '#0891b2', IconComponent: Shield },
                       { id: 'animalMovement', label: 'Animal Movement', color: '#9333ea', IconComponent: Activity }
                     ].map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: layerToggles[layer.id] ? `${layer.color}15` : COLORS.secondaryBg,
                      border: `2px solid ${layerToggles[layer.id] ? layer.color : 'transparent'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!layerToggles[layer.id]) {
                        e.currentTarget.style.background = COLORS.creamBg;
                        e.currentTarget.style.borderColor = `${layer.color}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!layerToggles[layer.id]) {
                        e.currentTarget.style.background = COLORS.secondaryBg;
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <layer.IconComponent style={{ width: 16, height: 16 }} color={layerToggles[layer.id] ? layer.color : COLORS.textSecondary} />
                    <span style={{
                      fontSize: '13px',
                      fontWeight: layerToggles[layer.id] ? 700 : 600,
                      color: layerToggles[layer.id] ? layer.color : COLORS.textPrimary
                    }}>
                      {layer.label}
                    </span>
                    {layerToggles[layer.id] && (
                      <CheckCircle style={{ width: 14, height: 14 }} color={layer.color} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: '2px', height: '60px', background: COLORS.borderLight }} />

            <div style={{ flex: 1, minWidth: '350px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Protected Wildlife Corridors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <div style={{ 
                    width: 16, 
                    height: 3, 
                    background: '#2563eb',
                    marginTop: '6px',
                    borderRadius: '1px'
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                      Kimana-Kuku Corridor (Kenya)
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, lineHeight: '1.4' }}>
                      Amboseli-Tsavo ecosystem dispersal area. Critical for elephants, lions, cheetahs, leopards, wild dogs
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <div style={{ 
                    width: 16, 
                    height: 3, 
                    background: '#2563eb',
                    marginTop: '6px',
                    borderRadius: '1px'
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                      Great Migration Route (Kenya-Tanzania)
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, lineHeight: '1.4' }}>
                      Mara-Serengeti trans-boundary. Millions of wildebeest & zebra cross at Mara River annually
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <div style={{ 
                    width: 16, 
                    height: 3, 
                    background: '#2563eb',
                    marginTop: '6px',
                    borderRadius: '1px'
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                      Kwakuchinja Corridor (Tanzania)
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, lineHeight: '1.4' }}>
                      Tarangire-Manyara seasonal route. Globally significant elephant population & wild dogs
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: '2px', height: '80px', background: COLORS.borderLight }} />

            <div style={{ minWidth: '240px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Animal Risk Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#059669', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)' 
                  }}>
                    <CheckCircle style={{ width: 12, height: 12 }} color="#ffffff" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                    Safe - Animal is within protected corridor
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#ea580c', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)' 
                  }}>
                    <AlertTriangle style={{ width: 12, height: 12 }} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                    Caution - Outside corridor, monitor closely
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#dc2626', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)' 
                  }}>
                    <X style={{ width: 14, height: 14 }} color="#ffffff" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                    Danger - In high-risk zone, urgent action needed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showAlertsPanel && <AlertsPanel onClose={() => setShowAlertsPanel(false)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
  } catch (error) {
    console.error('WildlifeTracking rendering error:', error);
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: COLORS.creamBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', padding: '40px' }}>
        <AlertTriangle style={{ width: 64, height: 64 }} color={COLORS.error} />
        <div style={{ fontSize: '24px', fontWeight: 700, color: COLORS.error }}>Map Rendering Error</div>
        <div style={{ fontSize: '14px', color: COLORS.textSecondary, textAlign: 'center', maxWidth: '500px' }}>
          There was an error loading the wildlife tracking map. Please refresh the page.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: COLORS.forestGreen,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Activity style={{ width: 16, height: 16 }} />
          Reload Page
        </button>
      </div>
    );
  }
};

export default WildlifeTracking;
