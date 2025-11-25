import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, AlertTriangle, TrendingUp, MapPin, Shield, Battery, Signal, AlertCircle } from '@/components/shared/Icons';
import Sidebar from '@/components/shared/Sidebar';
import MapComponent from '@/components/shared/MapComponent';
import { isAllowedSpecies } from '@/constants/Animals';
import { COLORS, rgba } from '@/constants/Colors';
import { animals as animalsService, corridors as corridorsService, predictions as predictionsService, tracking as trackingService, rangers as rangersService, alerts as alertsService, behavior as behaviorService } from '@/services';
import api from '@/services/api';
import { createTestAnimals, deleteTestAnimals } from '@/utils/createTestAnimals';
import AlertBadge from '@/components/alerts/AlertBadge';
import AlertsPanel from '@/components/alerts/AlertsPanel';
import { useWebSocket } from '@/hooks/useWebSocket';


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
  
  // WebSocket integration for REAL-TIME animal tracking
  const { 
    animals: wsAnimals, 
    isConnected,
    alerts: wsAlerts,
    animalPaths: wsAnimalPaths
  } = useWebSocket({
    autoConnect: false, // CHANGED: Don't auto-connect - connection managed centrally
    onAlert: (alert) => {
      console.log('Real-time alert received:', alert.message);
      // Update alert stats
      setAlertStats(prev => ({
        active: prev.active + 1,
        critical: alert.severity === 'critical' ? prev.critical + 1 : prev.critical,
        total: prev.total + 1
      }));
    },
    onPositionUpdate: (data) => {
      console.log('Position update received via WebSocket:', data.animals?.length || 0, 'animals');
    }
  });
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies] = useState('all');
  const [mapZoom, setMapZoom] = useState(7);
  
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true); // Conflict zones/risk zones toggle
  const [showEnvLayers, setShowEnvLayers] = useState(false); // ML risk heatmap (XGBoost environment) toggle
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
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [alertMarkers, setAlertMarkers] = useState([]);

  // Point-in-polygon algorithm (Ray casting algorithm)
  const isPointInPolygon = useCallback((point, polygon) => {
    if (!polygon || polygon.length < 3) return false;
    
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }, []);

  // Check if point is within buffer distance of a path
  const isPointNearPath = useCallback((point, path, bufferKm = 5) => {
    if (!path || path.length < 2) return false;
    
    const [lat, lon] = point;
    const bufferDegrees = bufferKm / 111; // Convert km to degrees (~111 km per degree)
    
    // Check if point is within buffer distance of any segment
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lon1] = Array.isArray(path[i]) ? path[i] : [path[i].lat || path[i][0], path[i].lng || path[i][1] || path[i][0]];
      const [lat2, lon2] = Array.isArray(path[i + 1]) ? path[i + 1] : [path[i + 1].lat || path[i + 1][0], path[i + 1].lng || path[i + 1][1] || path[i + 1][0]];
      
      // Calculate distance from point to line segment
      const A = lat - lat1;
      const B = lon - lon1;
      const C = lat2 - lat1;
      const D = lon2 - lon1;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      
      if (lenSq !== 0) param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = lat1;
        yy = lon1;
      } else if (param > 1) {
        xx = lat2;
        yy = lon2;
      } else {
        xx = lat1 + param * C;
        yy = lon1 + param * D;
      }
      
      const dx = lat - xx;
      const dy = lon - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= bufferDegrees) return true;
    }
    
    return false;
  }, []);

  // Calculate animal risk status based on location (corridors, risk zones, etc.)
  // This must be defined before useEffects that use it
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
    
    // Check if animal is inside a corridor polygon or near corridor path
    const corridor = corridors.find(c => {
      // First, check if corridor has polygon geometry (boundary)
      if (c.geometry && c.geometry.coordinates) {
        const coords = c.geometry.coordinates;
        // Handle GeoJSON Polygon format: [[[lng, lat], [lng, lat], ...]]
        if (Array.isArray(coords) && coords.length > 0) {
          let polygon = null;
          
          // GeoJSON Polygon: coordinates[0] is the outer ring
          if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            polygon = coords[0].map(coord => {
              // GeoJSON uses [lng, lat], convert to [lat, lng] for our algorithm
              if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
                return [coord[0], coord[1]]; // Already [lat, lng]
              }
              return [coord[1], coord[0]]; // Swap [lng, lat] to [lat, lng]
            });
          }
          
          if (polygon && polygon.length >= 3) {
            return isPointInPolygon([lat, lon], polygon);
          }
        }
      }
      
      // Fallback: Check if animal is near corridor path (within 5km buffer)
      if (c.path && Array.isArray(c.path) && c.path.length > 0) {
        return isPointNearPath([lat, lon], c.path, 5);
      }
      
      // Also check boundary if available
      if (c.boundary && Array.isArray(c.boundary) && c.boundary.length >= 3) {
        const boundary = c.boundary.map(coord => {
          if (Array.isArray(coord)) {
            // Check if [lat, lng] or [lng, lat]
            if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
              return [coord[0], coord[1]]; // [lat, lng]
            }
            return [coord[1], coord[0]]; // Swap [lng, lat] to [lat, lng]
          }
          return coord;
        });
        return isPointInPolygon([lat, lon], boundary);
      }
      
      return false;
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
  }, [corridors, riskZones, isPointInPolygon, isPointNearPath]);

  const checkAnimalRisk = useCallback((animal) => {
    return checkAnimalDanger(animal).risk;
  }, [checkAnimalDanger]);

  // Transform WebSocket animals to display format with REAL-TIME updates
  // This effect runs whenever wsAnimals changes, ensuring real-time updates
  useEffect(() => {
    // Process WebSocket animals if available (even if empty array - to clear state)
    if (wsAnimals && Array.isArray(wsAnimals)) {
      console.log('🔄 Processing WebSocket animal data:', wsAnimals.length, 'animals');
      
      // If WebSocket has no animals but we have animals from API, don't clear them
      // Only update if WebSocket is connected and has data, or if explicitly empty
      if (wsAnimals.length === 0 && !isConnected) {
        console.log('⏸️ WebSocket empty and not connected, keeping existing animals');
        return;
      }
      
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
        const willMove = speed > 2 && 
                       activityType === 'moving' &&
                       (Math.abs(predictedLat - lat) > 0.00001 || Math.abs(predictedLon - lon) > 0.00001);
        
        // Determine color based on activity and risk
        // Calculate risk status based on location (corridors, risk zones, etc.)
        const dangerInfo = checkAnimalDanger({
          coordinates: [lat, lon],
          id: animal.id
        });
        
        // Map risk status to colors matching the legend
        let markerColor = '#10B981'; // Green for Safe (within corridor)
        let riskLevel = 'low';
        
        if (dangerInfo.risk === 'high') {
          markerColor = '#DC2626'; // Red for Danger (in high-risk zone)
          riskLevel = 'high';
        } else if (dangerInfo.risk === 'medium') {
          markerColor = '#EA580C'; // Orange for Caution (outside corridor)
          riskLevel = 'medium';
        } else if (dangerInfo.risk === 'safe') {
          markerColor = '#10B981'; // Green for Safe (within corridor)
          riskLevel = 'low';
        } else if (animal.risk_level === 'critical' || animal.risk_level === 'high') {
          // Fallback to backend risk level if location-based check fails
          markerColor = '#DC2626';
          riskLevel = animal.risk_level;
        } else if (activityType === 'resting' || activityType === 'feeding') {
          // Only use activity color if not in a risk zone
          if (dangerInfo.risk !== 'high') {
            markerColor = '#F59E0B'; // Yellow for resting/feeding
          }
        }
        
        // Check for recent alerts
        const hasAlert = wsAlerts.some(alert => 
          alert.animalId === animal.id && 
          (Date.now() - new Date(alert.timestamp).getTime()) < 300000
        );
        
        if (hasAlert) {
          markerColor = '#DC2626'; // Red for alerts
        }
        
        return {
          id: animal.id || animal.collar_id,
          name: animal.name || animal.species,
          species: animal.species,
          collar_id: animal.collar_id || animal.id,
          coordinates: [lat, lon],
          predictedCoordinates: [predictedLat, predictedLon],
          speed: speed,
          heading: heading,
          direction: heading,
          activityType: activityType,
          behaviorState: behaviorState,
          health: animal.health_status || 'Good',
          lastSeen: animal.last_updated || new Date().toISOString(),
          batteryLevel: animal.collar_battery || 0,
          signalStrength: animal.signal_strength || 0,
          inSafeZone: SAFE_ZONES.some(zone => isInBounds(lat, lon, zone.bounds)),
          riskLevel: riskLevel,
          riskStatus: dangerInfo.risk, // 'safe', 'medium', 'high' - matches legend
          threatZone: dangerInfo.threatZone,
          threatType: dangerInfo.threatType,
          markerColor: markerColor,
          pathColor: animal.pathColor || markerColor,
          willAnimate: willMove,
          // WebSocket-specific data
          path: wsAnimalPaths[animal.id] || [],
          hasAlert: hasAlert,
          isLiveTracking: true, // Mark as WebSocket data
        };
      });
      
      setAnimals(transformedAnimals);
      setIsLoading(false);
      console.log('✅ Updated animals state:', transformedAnimals.length, 'animals from WebSocket');
      
      // Log moving animals
      const movingAnimals = transformedAnimals.filter(a => a.willAnimate);
      if (movingAnimals.length > 0) {
        console.log('🏃 Moving animals:', movingAnimals.map(a => `${a.name} (${a.speed.toFixed(1)} km/h)`).join(', '));
      }
    } else if (wsAnimals && wsAnimals.length === 0 && isConnected) {
      // WebSocket connected but no animals - clear state
      console.log('⚠️ WebSocket connected but no animals received');
      setAnimals([]);
    }
  }, [wsAnimals, wsAlerts, wsAnimalPaths, isConnected, checkAnimalDanger]);
  
  useEffect(() => {
    window.createTestAnimals = createTestAnimals;
    window.deleteTestAnimals = deleteTestAnimals;
        
        window.testMovement = () => {
          console.log('Testing animal movement...');
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
          
          console.log('Animals that SHOULD be animating:', movingAnimals.length);
          movingAnimals.forEach(a => console.log(`   - ${a.name} (${a.speed.toFixed(1)} km/h)`));
        };
      }, [animals]);


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
          console.log('Fetching animals from backend...');
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
          
          const animalName = animal.name || animal.animal_name || animal.species;
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
                console.log(`  ${animalName}: Generated random heading ${heading.toFixed(0)}°`);
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
                console.log(`  ${animalName}: Backend predicted same as current - recalculating`);
              }
              console.log(`  ${animalName}: Predicted [${predictedLat.toFixed(4)}, ${predictedLon.toFixed(4)}] (${distanceKm.toFixed(2)}km, heading: ${heading.toFixed(0)}°, distance: ${distanceFromCurrent.toFixed(3)}km)`);
            } else {
              predictedLat = lat;
              predictedLon = lon;
            }
          } else {
            console.log(`  ${animalName}: Using backend predicted position [${predictedLat.toFixed(4)}, ${predictedLon.toFixed(4)}]`);
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
      // Fetch ALL corridors from database (not just active ones)
      const data = await corridorsService.getAll();
      setCorridors(data.results || data || []);
      console.log(`📊 Loaded ${(data.results || data || []).length} corridors from database (all corridors)`);
    } catch (err) {
      console.error('Error fetching corridors:', err);
      setCorridors([]);
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      if (!animals || animals.length === 0) {
        setPredictions({});
        return;
      }

      const predictionMap = {};
      
      // Fetch predictions from backend for each animal
      for (const animal of animals.slice(0, 10)) { // Limit to 10 for performance
        try {
          // Try to get prediction from backend
          const predictionData = await predictionsService.getByAnimal(animal.id);
          if (predictionData && predictionData.length > 0) {
            const latestPrediction = Array.isArray(predictionData) ? predictionData[0] : predictionData;
            predictionMap[animal.id] = {
              movementPath: latestPrediction.movement_path || latestPrediction.path || [],
              lstmPredictions: latestPrediction.lstm_predictions || [],
              behavioralState: latestPrediction.behavioral_state || animal.activityType || 'unknown',
              behavioralProbabilities: latestPrediction.behavioral_probabilities || {},
              combinedPath: latestPrediction.combined_path || latestPrediction.movement_path || [],
              model: latestPrediction.model || 'BBMM',
              confidence: latestPrediction.confidence || 0.75,
              animal_id: animal.id
            };
          } else {
            // Fallback: create simple prediction from animal data
            predictionMap[animal.id] = {
              movementPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : [],
              lstmPredictions: [],
              behavioralState: animal.activityType || 'unknown',
              behavioralProbabilities: {},
              combinedPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : [],
              model: 'BBMM',
              confidence: 0.75,
              animal_id: animal.id
            };
          }
        } catch (err) {
          // Fallback for this animal if API call fails
          console.warn(`Failed to fetch prediction for animal ${animal.id}:`, err);
          predictionMap[animal.id] = {
            movementPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : [],
            lstmPredictions: [],
            behavioralState: animal.activityType || 'unknown',
            behavioralProbabilities: {},
            combinedPath: animal.predictedCoordinates ? [animal.coordinates, animal.predictedCoordinates] : [],
            model: 'BBMM',
            confidence: 0.75,
            animal_id: animal.id
          };
        }
      }
      
      setPredictions(predictionMap);
      console.log(`✅ Loaded ML predictions for ${Object.keys(predictionMap).length} animals`);
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

  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch ALL alerts from API (not just active) to include mobile-created alerts
      const data = await alertsService.getAll(); // No status filter to get all alerts
      const alertsData = data.results || data || [];
      console.log('WildlifeTracking: Fetched alerts:', alertsData.length);
      
      // Combine with WebSocket alerts (handle new format)
      const allAlerts = Array.isArray(alertsData) ? alertsData : [];
      if (wsAlerts && wsAlerts.length > 0) {
        wsAlerts.forEach(wsAlert => {
          // Check if alert already exists (2-hour cooldown for same animal/zone)
          const exists = allAlerts.find(a => 
            a.id === wsAlert.id || 
            (a.animal === wsAlert.animalId && 
             a.conflict_zone_name === wsAlert.conflictZoneName &&
             Math.abs(new Date(a.detected_at || a.timestamp || a.created_at) - new Date(wsAlert.timestamp || wsAlert.detected_at)) < 7200000) // 2 hours
          );
          if (!exists) {
            // Convert WebSocket alert to API format
            allAlerts.push({
              id: wsAlert.id || `ws-${Date.now()}`,
              alert_type: wsAlert.type || wsAlert.alert_type,
              severity: wsAlert.severity || 'medium',
              title: wsAlert.title || 'Wildlife Alert',
              message: wsAlert.message || wsAlert.description,
              latitude: wsAlert.latitude || (wsAlert.coordinates && wsAlert.coordinates[0]),
              longitude: wsAlert.longitude || (wsAlert.coordinates && wsAlert.coordinates[1]),
              animal: wsAlert.animalId,
              animal_id: wsAlert.animalId,
              animal_name: wsAlert.animalName,
              animal_species: wsAlert.animalSpecies,
              conflict_zone_name: wsAlert.conflictZoneName,
              status: wsAlert.status || 'active',
              detected_at: wsAlert.timestamp || wsAlert.detected_at || new Date().toISOString(),
              metadata: wsAlert.metadata || {}
            });
          }
        });
      }
      
      // Transform alerts to map markers (new format uses latitude/longitude)
      const markers = allAlerts
        .filter(alert => {
          // New format: latitude/longitude fields
          const lat = alert.latitude;
          const lon = alert.longitude;
          // Fallback to old format
          const coords = alert.coordinates || [lat, lon] || [0, 0];
          const finalLat = lat || (Array.isArray(coords) ? coords[0] : coords.lat || 0);
          const finalLon = lon || (Array.isArray(coords) ? coords[1] : coords.lon || 0);
          // Validate coordinates (not 0,0 and within Kenya/Tanzania bounds)
          return finalLat !== 0 && finalLon !== 0 && 
                 finalLat >= -5 && finalLat <= 1 && // Kenya/Tanzania latitude bounds
                 finalLon >= 33 && finalLon <= 42;  // Kenya/Tanzania longitude bounds
        })
        .map(alert => {
          // Extract coordinates from new format (latitude/longitude)
          const lat = alert.latitude;
          const lon = alert.longitude;
          const coords = lat && lon ? [lat, lon] : (alert.coordinates || [0, 0]);
          const finalCoords = Array.isArray(coords) ? coords : [coords.lat || coords[0] || 0, coords.lon || coords[1] || 0];
          
          const severity = alert.severity || alert.alert_type || 'medium';
          
          // Color based on severity (new color scheme)
          let color = '#F59E0B'; // Orange for medium
          if (severity === 'critical') {
            color = '#DC2626'; // Red for critical
          } else if (severity === 'high') {
            color = '#EA580C'; // Orange-red for high
          } else if (severity === 'low') {
            color = '#3B82F6'; // Blue for low
          }
          
          // Determine alert title from alert_type if title is missing
          let alertTitle = alert.title || alert.alert_type || 'Alert';
          if (alert.alert_type && !alert.title) {
            // Format alert_type for display (e.g., "emergency" -> "Emergency Alert")
            alertTitle = alert.alert_type
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            if (!alertTitle.toLowerCase().includes('alert')) {
              alertTitle += ' Alert';
            }
          }
          
          // Include message in description if available
          const alertDescription = alert.message || alert.description || '';
          
          return {
            id: `alert-${alert.id}`,
            position: finalCoords,
            type: 'alert',
            title: alertTitle,
            description: alertDescription,
            message: alertDescription, // Also set message field for popup
            color: color,
            severity: severity,
            alert_type: alert.alert_type || alert.type || 'high_risk_zone', // Include alert_type for display
            animalId: alert.animal || alert.animal_id,
            animalName: alert.animal_name,
            conflictZoneName: alert.conflict_zone_name,
            timestamp: alert.detected_at || alert.timestamp || alert.created_at,
            status: alert.status || 'active', // Include status
            source: alert.source || (alert.alert_type === 'emergency' ? 'mobile' : 'system') // Mark mobile alerts
          };
        });
      
      setAlertMarkers(markers);
      console.log('WildlifeTracking: Created', markers.length, 'alert markers');
      
      // Update alert stats
      setAlertStats({
        active: allAlerts.length,
        critical: allAlerts.filter(a => (a.severity || 'medium') === 'critical').length,
        total: allAlerts.length
      });
    } catch (error) {
      console.warn('WildlifeTracking: Alerts unavailable:', error.message);
      setAlertMarkers([]);
    }
  }, [wsAlerts]);

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
      console.log('Behavior summary loaded:', summary);
      // Behavior summary can be used for future analytics/display
    } catch (err) {
      console.warn('Behavior summary unavailable:', err.message);
    }
  }, []);

  const fetchEnvironmentData = useCallback(async () => {
    const centerLat = -2.0;
    const centerLon = 35.5;
    
    try {
      const data = await predictionsService.getXGBoostEnvironment(
        centerLat,
        centerLon,
        'elephant',
        50000
      );
      
      if (data) {
        // Convert to format expected by map component
        if (data.available) {
          // Real prediction - create heatmap point
          const latKey = data.coordinates?.lat || centerLat;
          setEnvironmentData({
            [latKey]: {
              position: [data.coordinates?.lat || centerLat, data.coordinates?.lon || centerLon],
              intensity: data.habitat_score || 0.5,
              type: 'habitat',
              suitability: data.suitability,
              score: data.habitat_score,
              status: 'success',
              model_info: data.model_info
            }
          });
          console.log('[INFO] XGBoost environment predictions loaded:', {
            habitat_score: data.habitat_score,
            suitability: data.suitability,
            status: data.status,
            available: data.available
          });
        } else {
          // Fallback - still show with lower intensity
          const latKey = data.coordinates?.lat || centerLat;
          setEnvironmentData({
            [latKey]: {
              position: [data.coordinates?.lat || centerLat, data.coordinates?.lon || centerLon],
              intensity: data.habitat_score || 0.5,
              type: 'habitat',
              suitability: 'unknown',
              score: data.habitat_score || 0.5,
              status: 'fallback',
              message: data.message
            }
          });
          console.warn('[INFO] Using fallback habitat prediction:', data.message);
        }
      } else {
        setEnvironmentData({});
        console.warn('[INFO] No environment data received');
      }
    } catch (error) {
      console.error('[ERROR] Failed to fetch environment data:', error);
      setEnvironmentData({});
    }
  }, []);


  useEffect(() => {
    console.log('[INIT] WildlifeTracking mounted - initializing...');
    
    const loadingTimeout = setTimeout(() => {
      console.warn('[WARNING] Loading timeout reached - forcing map display');
      setIsLoading(false);
    }, 10000);
    
    const initializeData = async () => {
      try {
        console.log('[INFO] Starting data fetch - map will show as data arrives...');
        
        // Only fetch animals via REST API if WebSocket is not connected
        if (!isConnected) {
          console.log('WebSocket not connected, using REST API fallback');
          await fetchAnimals();
        } else {
          console.log('Using WebSocket for real-time animal data');
        }
        clearTimeout(loadingTimeout);
        
        fetchCorridors().catch(err => console.error('Corridors fetch failed:', err));
        fetchPoachingZones().catch(err => console.error('Poaching zones fetch failed:', err));
        fetchRangers().catch(err => console.error('Rangers fetch failed:', err));
        fetchAlerts().catch(err => console.error('Alerts fetch failed:', err));
        
        fetchLiveTracking().catch(() => {}); 
        fetchCorridorOptimization().catch(() => {}); 
        fetchEnvironmentData().catch(() => {});
        
        // Fetch predictions after animals are loaded
        if (animals.length > 0) {
          fetchPredictions().catch(err => console.error('Predictions fetch failed:', err));
        } 
        
      } catch (error) {
        console.error('[ERROR] Initialization error:', error);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    };
    
    initializeData();
    
        // Only poll if WebSocket is disconnected
        const liveStatusInterval = setInterval(() => {
      if (!isConnected) {
        console.log('WebSocket disconnected, fetching via REST API');
        fetchAnimals().catch(() => {});
      }
        }, 60000);
        
        const alertsInterval = setInterval(() => {
          fetchAlertStats().catch(() => {});
          fetchAlerts().catch(() => {});
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
          if (animals.length > 0) {
            fetchPredictions().catch(() => {});
          }
    }, 300000);
    
    return () => {
          clearInterval(liveStatusInterval);
          clearInterval(alertsInterval);
          clearInterval(rangersInterval);
          clearInterval(behaviorInterval);
      clearInterval(mlInterval);
          clearTimeout(loadingTimeout);
    };
  }, [isConnected, fetchAnimals, fetchCorridors, fetchPredictions, fetchCorridorOptimization, fetchEnvironmentData, fetchLiveTracking, fetchPoachingZones, fetchRangers, fetchAlertStats, fetchBehaviorSummary, fetchAlerts, animals.length]);

  // Fetch alerts when WebSocket alerts change
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Fetch predictions when toggle is turned on or animals change
  useEffect(() => {
    if (showPredictions && animals && animals.length > 0) {
      console.log('🔄 Movement Paths toggle ON - Fetching predictions...');
      fetchPredictions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPredictions, animals.length, fetchPredictions]);
  
  // Fetch environment data when toggle is turned on
  useEffect(() => {
    if (showEnvLayers) {
      console.log('🔄 Environment toggle ON - Fetching XGBoost data...');
      fetchEnvironmentData();
    }
  }, [showEnvLayers, fetchEnvironmentData]);
  
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

  // Update historical paths from WebSocket paths
  // Convert WebSocket animal paths to historicalPaths format with colors
  useEffect(() => {
    if (wsAnimalPaths && Object.keys(wsAnimalPaths).length > 0 && animals.length > 0) {
      console.log('Updating movement paths from WebSocket:', Object.keys(wsAnimalPaths).length, 'animals');
      
      const pathsWithColors = {};
      
      // Convert each animal's path to historicalPaths format with proper colors
      animals.forEach(animal => {
        const path = wsAnimalPaths[animal.id] || animal.path || [];
        if (path && path.length > 0) {
          // Convert path to [lat, lng] format if needed
          const formattedPath = path.map(point => {
            if (Array.isArray(point)) {
              // Already in [lat, lng] or [lng, lat] format
              if (Math.abs(point[0]) <= 90) {
                return [point[0], point[1]]; // [lat, lng]
              } else {
                return [point[1], point[0]]; // Swap if [lng, lat]
              }
            } else if (point.lat !== undefined && point.lng !== undefined) {
              return [point.lat, point.lng];
            } else if (point.latitude !== undefined && point.longitude !== undefined) {
              return [point.latitude, point.longitude];
            }
            return null;
          }).filter(p => p !== null);
          
          if (formattedPath.length > 0) {
            pathsWithColors[animal.id] = {
              path: formattedPath,
              color: animal.pathColor || animal.markerColor || '#10B981',
              animalName: animal.name,
              animalId: animal.id
            };
          }
        }
      });
      
      setHistoricalPaths(pathsWithColors);
      console.log('📊 Converted', Object.keys(pathsWithColors).length, 'animal paths with colors');
    }
  }, [wsAnimalPaths, animals]);

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


  // Calculate real-time stats from animals data
  const totalTracked = animals.length;
  const activeNow = animals.filter(a => {
    const status = a.status || a.activityType || '';
    return status === 'Moving' || status === 'Feeding' || status === 'Active' || status === 'moving' || status === 'feeding';
  }).length;
  const highRisk = animals.filter(a => {
    const risk = a.riskStatus || a.risk || a.riskLevel || '';
    return risk === 'high' || risk === 'High' || risk === 'critical' || risk === 'Critical';
  }).length;
  const healthAlerts = animals.filter(a => {
    const health = a.health || a.health_status || '';
    return health === 'Monitoring' || health === 'Poor' || health === 'monitoring' || health === 'poor';
  }).length;

  const visibleAnimals = animals.filter(a => isAllowedSpecies(a.species));

  const filteredAnimals = filterSpecies === 'all' 
    ? visibleAnimals 
    : animals.filter(a => a.species.toLowerCase().includes(filterSpecies.toLowerCase()));

  // Filtered animals (search removed - no search feature currently)
  const searchFilteredAnimals = filteredAnimals;

  // eslint-disable-next-line no-unused-vars
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

      <div className="responsive-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <section style={{ background: COLORS.forestGreen, padding: '20px 16px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '12px' }} className="md:flex-nowrap md:p-7 md:px-10">
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
            
            {/* WebSocket Connection Status - Web app always shows Online */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: COLORS.success, 
                animation: 'pulse 2s ease-in-out infinite' 
              }}></div>
              Live: {activeNow} Active
            </div>
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

        <section style={{ display: 'flex', position: 'relative', height: 'calc(100vh - 200px)', marginBottom: '0', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            <MapComponent
              markers={[
                ...searchFilteredAnimals.map(animal => {
                // Use stored riskStatus if available, otherwise calculate
                const dangerInfo = animal.riskStatus ? {
                  risk: animal.riskStatus,
                  threatZone: animal.threatZone,
                  threatType: animal.threatType
                } : checkAnimalDanger(animal);
                
                // Map risk status to display text matching legend
                let riskDisplayText = 'Unknown';
                if (dangerInfo.risk === 'safe') {
                  riskDisplayText = 'Safe - Within Protected Corridor';
                } else if (dangerInfo.risk === 'medium') {
                  riskDisplayText = 'Caution - Outside Corridor';
                } else if (dangerInfo.risk === 'high') {
                  riskDisplayText = 'Danger - In High-Risk Zone';
                }
                
                const details = [
                  { label: 'Species', value: animal.species },
                  { label: 'Location', value: animal.location },
                  { label: 'Status', value: animal.status },
                  { label: 'Activity', value: animal.activityType || 'Unknown' },
                  { label: 'Speed', value: `${animal.speed?.toFixed(1) || '0.0'} km/h` },
                  { label: 'Risk Status', value: riskDisplayText },
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
                
                console.log(`${animal.name} (${animal.species}) - type: "${markerType}"`);
                
                // Ensure predictedPosition is different from current position for animation
                const currentPos = animal.coordinates;
                const predictedPos = animal.predictedCoordinates || animal.coordinates;
                const positionsAreSame = Math.abs(predictedPos[0] - currentPos[0]) < 0.00001 && 
                                       Math.abs(predictedPos[1] - currentPos[1]) < 0.00001;
                
                // If positions are the same but animal is moving, create a small offset for animation
                let finalPredictedPos = predictedPos;
                if (positionsAreSame && animal.speed > 2 && animal.activityType === 'moving') {
                  // Create a predicted position 100m ahead in the direction of movement
                  const heading = animal.heading || animal.direction || 0;
                  const headingRad = heading * (Math.PI / 180);
                  const offsetKm = 0.1; // 100 meters
                  const offsetDeg = offsetKm / 111;
                  finalPredictedPos = [
                    currentPos[0] + (offsetDeg * Math.cos(headingRad)),
                    currentPos[1] + (offsetDeg * Math.sin(headingRad))
                  ];
                }
                
                return {
                  id: animal.id,
                  title: animal.name,
                  position: currentPos,
                  predictedPosition: finalPredictedPos,
                  type: markerType,
                  color: getAnimalMarkerColor(animal),
                  activityType: animal.activityType || animal.movement?.activity_type,
                  speed: animal.speed || animal.movement?.speed_kmh || 0,
                  hasAlert: animal.alerts?.active_count > 0 || animal.hasAlert,
                  hasCriticalAlert: animal.alerts?.has_critical,
                  behaviorState: animal.behaviorState,
                  behaviorSource: animal.behaviorSource,
                  // Activity-based movement flags - ensure they're set correctly
                  shouldAnimate: (animal.speed > 2 && animal.activityType === 'moving') || animal.willAnimate,
                  shouldWobble: animal.activityType === 'feeding' && animal.speed > 0.5 && animal.speed <= 2,
                  isResting: animal.activityType === 'resting' || animal.speed < 0.5,
                  // Conflict risk data
                  conflict_risk: animal.conflict_risk,
                  risk_level: animal.risk_level || animal.conflict_risk?.risk_level || 'low',
                  popupContent: {
                    title: animal.name,
                    details: details
                  }
                };
              }),
                ...alertMarkers
              ]}
              showCorridors={true}
              showRiskZones={showRiskZones}
              showPredictions={showPredictions}
              showBehaviorStates={showBehavior}
              showEnvironment={showEnvLayers}
              showRangerPatrols={true}
              showAnimalMovement={true}
              riskZones={showRiskZones ? riskZones : []}
              predictedPaths={showPredictions ? (() => {
                console.log('🔵 Movement Paths toggle ON - Processing predictions...', { 
                  predictionsCount: predictions ? Object.keys(predictions).length : 0,
                  animalsCount: animals.length 
                });
                // Use predictions if available
                if (predictions && Object.keys(predictions).length > 0) {
                  const paths = Object.values(predictions)
                    .map(p => {
                      // Handle different path formats
                      let path = [];
                      if (p.combinedPath && Array.isArray(p.combinedPath) && p.combinedPath.length > 0) {
                        path = p.combinedPath;
                      } else if (p.movementPath && Array.isArray(p.movementPath) && p.movementPath.length > 0) {
                        path = p.movementPath;
                      } else if (p.path && Array.isArray(p.path) && p.path.length > 0) {
                        path = p.path;
                      }
                      
                      // Ensure path is in [lat, lng] format
                      if (path.length > 0) {
                        path = path.map(point => {
                          if (Array.isArray(point)) {
                            // Check if [lat, lng] or [lng, lat]
                            if (Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180) {
                              return point; // Already [lat, lng]
                            }
                            return [point[1], point[0]]; // Swap [lng, lat] to [lat, lng]
                          }
                          return point;
                        });
                      }
                      
                      return {
                        path: path,
                        animal_id: p.animal_id || p.id,
                        model: p.model || (p.lstmPredictions && p.lstmPredictions.length > 0 ? 'LSTM+BBMM' : 'BBMM'),
                        confidence: p.confidence || 0.85
                      };
                    })
                    .filter(p => p.path && p.path.length >= 2);
                  console.log('✅ Predicted paths from predictions:', paths.length, 'paths ready');
                  return paths;
                }
                // Fallback: create paths from animal predictedCoordinates
                const fallbackPaths = animals
                  .filter(animal => animal.predictedCoordinates && animal.coordinates && 
                    (Math.abs(animal.predictedCoordinates[0] - animal.coordinates[0]) > 0.00001 || 
                     Math.abs(animal.predictedCoordinates[1] - animal.coordinates[1]) > 0.00001))
                  .map(animal => ({
                    path: [animal.coordinates, animal.predictedCoordinates],
                    animal_id: animal.id,
                    model: 'BBMM',
                    confidence: 0.75
                  }))
                  .filter(p => p.path && p.path.length >= 2);
                console.log('✅ Predicted paths from animals (fallback):', fallbackPaths.length, 'paths ready');
                return fallbackPaths;
              })() : (() => {
                console.log('⚪ Movement Paths toggle OFF');
                return [];
              })()}
              behavioralStates={showBehavior ? (() => {
                const states = animals.reduce((acc, animal) => {
                  if (animal && animal.id && (animal.behaviorState || animal.activityType)) {
                    acc[animal.id] = {
                      state: animal.behaviorState || animal.activityType || 'unknown',
                      confidence: animal.behavior_confidence || 0.7
                    };
                  }
                  return acc;
                }, {});
                console.log('🧠 Behavioral states:', Object.keys(states).length, 'animals');
                return states;
              })() : {}}
              riskHeatmap={showEnvLayers ? (() => {
                if (!environmentData || Object.keys(environmentData).length === 0) {
                  console.log('⚠️ Environment data is empty');
                  return [];
                }
                // Convert environmentData to riskHeatmap format
                let heatmapData = [];
                if (Array.isArray(environmentData)) {
                  heatmapData = environmentData.map(item => ({
                    position: item.position || item.coordinates || [item.lat || 0, item.lon || 0],
                    intensity: item.intensity || item.habitat_score || item.risk_level || 0.5,
                    type: item.type || 'habitat',
                    suitability: item.suitability,
                    status: item.status
                  })).filter(h => h.position && h.position[0] !== 0 && h.position[1] !== 0);
                } else if (typeof environmentData === 'object') {
                  heatmapData = Object.entries(environmentData).map(([key, value]) => ({
                    position: value.position || value.coordinates || [value.lat || 0, value.lon || 0],
                    intensity: value.intensity || value.habitat_score || value.risk_level || 0.5,
                    type: value.type || 'habitat',
                    suitability: value.suitability,
                    status: value.status,
                    message: value.message
                  })).filter(h => h.position && h.position[0] !== 0 && h.position[1] !== 0);
                }
                console.log('🌍 Risk heatmap data:', heatmapData.length, 'points', heatmapData.map(h => ({ 
                  suitability: h.suitability, 
                  status: h.status,
                  intensity: h.intensity 
                })));
                return heatmapData;
              })() : []}
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
              historicalPaths={(() => {
                // Show paths for all animals with movement, or just selected animal
                if (selectedAnimal && historicalPaths[selectedAnimal.id]) {
                  return [{
                    animalId: selectedAnimal.id,
                    animalName: selectedAnimal.name,
                    path: historicalPaths[selectedAnimal.id].path || historicalPaths[selectedAnimal.id],
                    color: historicalPaths[selectedAnimal.id].color || selectedAnimal.pathColor || selectedAnimal.markerColor || '#8b5cf6'
                  }];
                }
                // Show paths for all animals with movement data
                return Object.values(historicalPaths).filter(p => p && p.path && p.path.length > 0).map(pathData => ({
                  animalId: pathData.animalId || pathData.id,
                  animalName: pathData.animalName || 'Animal',
                  path: pathData.path,
                  color: pathData.color || '#10B981'
                }));
              })()}
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
              padding: '12px', 
              boxShadow: '0 4px 16px rgba(46, 93, 69, 0.2)',
              zIndex: 1000,
              pointerEvents: 'auto',
              width: '220px'
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
                    <Layers className="w-3.5 h-3.5" color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary }}>Map Legend</div>
                    <div style={{ fontSize: '9px', color: COLORS.textSecondary, fontWeight: 600 }}>Map Elements</div>
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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', fontSize: '10px' }}>
                {/* Animal Risk Status - Compact */}
                <div style={{ padding: '6px', background: COLORS.secondaryBg, borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: '6px', fontSize: '10px' }}>Animal Risk Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield className="w-3 h-3" color="#059669" />
                      <span style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Safe - Within corridor</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle className="w-3 h-3" color="#F59E0B" />
                      <span style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Caution - Outside corridor</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle className="w-3 h-3" color="#DC2626" />
                      <span style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Danger - High risk zone</span>
                    </div>
                  </div>
                </div>

                {/* Alert Types - Compact */}
                <div style={{ padding: '6px', background: COLORS.secondaryBg, borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: '6px', fontSize: '10px' }}>Alert Types</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle className="w-3 h-3" color="#DC2626" />
                      <span style={{ color: COLORS.textSecondary }}>High Risk Zone Entry</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield className="w-3 h-3" color="#EA580C" />
                      <span style={{ color: COLORS.textSecondary }}>Poaching Risk</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin className="w-3 h-3" color="#F59E0B" />
                      <span style={{ color: COLORS.textSecondary }}>Corridor Exit</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity className="w-3 h-3" color="#EA580C" />
                      <span style={{ color: COLORS.textSecondary }}>Rapid Movement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Battery className="w-3 h-3" color="#F59E0B" />
                      <span style={{ color: COLORS.textSecondary }}>Low Battery</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Signal className="w-3 h-3" color="#3B82F6" />
                      <span style={{ color: COLORS.textSecondary }}>Weak Signal</span>
                    </div>
                  </div>
                </div>

                {/* Map Layers - Compact */}
                <div style={{ padding: '6px', background: COLORS.secondaryBg, borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: '6px', fontSize: '10px' }}>Map Layers</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}>
                      <span style={{ fontSize: '10px', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp className="w-3 h-3" color={COLORS.info} />
                        Movement Paths
                      </span>
                      <input type="checkbox" checked={showPredictions} onChange={(e) => setShowPredictions(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}>
                      <span style={{ fontSize: '10px', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity className="w-3 h-3" color={COLORS.success} />
                        Behavior States
                      </span>
                      <input type="checkbox" checked={showBehavior} onChange={(e) => setShowBehavior(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}>
                      <span style={{ fontSize: '10px', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle className="w-3 h-3" color={COLORS.error} />
                        Risk Zones
                      </span>
                      <input type="checkbox" checked={showRiskZones} onChange={(e) => setShowRiskZones(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}>
                      <span style={{ fontSize: '10px', color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers className="w-3 h-3" color={COLORS.success} />
                        Environment
                      </span>
                      <input type="checkbox" checked={showEnvLayers} onChange={(e) => setShowEnvLayers(e.target.checked)} style={{ width: '12px', height: '12px', cursor: 'pointer' }} />
                    </label>
                  </div>
                </div>
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
                <Layers className="w-3.5 h-3.5" />
                Legend
              </button>
            )}
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
