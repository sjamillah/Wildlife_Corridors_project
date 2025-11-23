import React, { useRef, useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity, Animated } from 'react-native';
import MapView, { Marker, Polyline, Circle, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';

const DEFAULT_CENTER = { latitude: -3.25, longitude: 35.5 }; // Kenya-Tanzania corridor center
const DEFAULT_ZOOM = 6;

// Animated Alert Marker Component with bounce animation
const AnimatedAlertMarker = ({ alert, alertColor, iconName, severity, coords }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Pulse animation for critical/high alerts
    if (severity === 'critical' || severity === 'high') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      // Bounce animation for all alerts
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      bounce.start();
      
      return () => {
        pulse.stop();
        bounce.stop();
      };
    } else {
      // Bounce animation for medium/low alerts (less intense)
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      bounce.start();
      return () => bounce.stop();
    }
  }, [severity, pulseAnim, bounceAnim]);
  
  return (
    <Marker
      key={`alert-${alert._uniqueId || alert.id || `alert-${coords.latitude}-${coords.longitude}`}`}
      coordinate={coords}
      title={alert.title || alert.message || 'Alert'}
      zIndex={1000}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.alertMarkerContainer}>
        {/* Pulsing ring effect for critical/high alerts */}
        {(severity === 'critical' || severity === 'high') && (
          <Animated.View 
            style={[styles.alertPulseRing, { 
              borderColor: alertColor,
              width: severity === 'critical' ? 56 : 52,
              height: severity === 'critical' ? 56 : 52,
              borderRadius: severity === 'critical' ? 28 : 26,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [0.6, 0],
              }),
            }]} 
          />
        )}
        {/* Main alert marker with bounce animation */}
        <Animated.View style={[styles.alertMarker, { 
          backgroundColor: alertColor,
          width: severity === 'critical' ? 44 : severity === 'high' ? 40 : 36,
          height: severity === 'critical' ? 44 : severity === 'high' ? 40 : 36,
          borderRadius: severity === 'critical' ? 22 : severity === 'high' ? 20 : 18,
          transform: [{ translateY: bounceAnim }],
        }]}>
          <MaterialCommunityIcons 
            name={iconName} 
            size={severity === 'critical' ? 24 : severity === 'high' ? 22 : 20} 
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
      {Platform.OS !== 'ios' && (
        <Callout tooltip={false}>
          <View style={styles.alertCallout}>
            <Text style={[styles.alertCalloutTitle, { color: alertColor }]}>
              {alert.title || 'Alert'}
            </Text>
            <Text style={styles.alertCalloutText}>
              Type: {String(alert.alert_type || alert.type || 'general').replace(/_/g, ' ')}
            </Text>
            <Text style={styles.alertCalloutText}>
              Severity: {String(severity).toUpperCase()}
            </Text>
            {alert.message && (
              <Text style={styles.alertCalloutDescription}>{alert.message}</Text>
            )}
          </View>
        </Callout>
      )}
    </Marker>
  );
};

const MapComponent = ({
  animals = [],
  corridors = [],
  predictions = {},
  riskZones = [],
  rangerPatrols = [],
  alerts = [],
  userLocation = null,
  behavioralStates = {},
  riskHeatmap = [],
  showBehavior = true,
  showCorridors = true,
  showRiskZones = true,
  showPredictions = true,
  showEnvironment = false,
  showRangerPatrols = true,
  showAnimalMovement = true,
  onAnimalPress = () => {},
  style = {},
  height = 400,
}) => {
  const mapRef = useRef(null);
  const hasInitialized = useRef(false);
  const userHasPanned = useRef(false);

  // Default center - memoized to prevent unnecessary re-renders
  const defaultCenter = useMemo(() => {
    return userLocation 
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : DEFAULT_CENTER;
  }, [userLocation]);

  // Center camera on user location or first animal - ONLY on initial load
  // Don't bounce back when data is fetched after user has panned
  useEffect(() => {
    // Skip if user has manually panned the map
    if (userHasPanned.current) {
      return;
    }

    // Only center on initial load
    if (hasInitialized.current) {
      return;
    }

    try {
      if (mapRef.current) {
        let center = defaultCenter;
        let zoom = DEFAULT_ZOOM;

        try {
          if (userLocation && userLocation.latitude && userLocation.longitude) {
            const lat = Number(userLocation.latitude);
            const lng = Number(userLocation.longitude);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              center = { latitude: lat, longitude: lng };
              zoom = 12;
            }
          } else if (animals.length > 0) {
            const firstAnimal = animals.find(a => {
              try {
                return a && a.coordinates && isValidCoord(a.coordinates);
              } catch {
                return false;
              }
            });
            if (firstAnimal && isValidCoord(firstAnimal.coordinates)) {
              const lat = Number(firstAnimal.coordinates.lat);
              const lng = Number(firstAnimal.coordinates.lng);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                center = { latitude: lat, longitude: lng };
                zoom = 11;
              }
            }
          }
        } catch (error) {
          console.warn('Error calculating map center:', error);
        }

        // Only animate if we have a valid center and haven't initialized yet
        if (center && center.latitude && center.longitude && 
            !isNaN(center.latitude) && !isNaN(center.longitude) &&
            Math.abs(center.latitude) <= 90 && Math.abs(center.longitude) <= 180) {
          try {
            mapRef.current.animateToRegion({
              ...center,
              latitudeDelta: 360 / Math.pow(2, zoom),
              longitudeDelta: 360 / Math.pow(2, zoom),
            }, 1000);
            hasInitialized.current = true;
          } catch (error) {
            console.warn('Map animation error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in map center effect:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, animals.length]);

  // Track when user manually pans the map
  const handleRegionChangeComplete = () => {
    if (hasInitialized.current) {
      userHasPanned.current = true;
    }
  };

  // Helper: Get risk color (matches web)r
  const getRiskColor = (risk, activity, speed) => {
    const riskLevel = risk?.toLowerCase() || 'low';
    
    // Red for critical/high risk
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return STATUS_COLORS.ERROR; // Crimson red
    }
    
    // Yellow for resting/feeding
    if (activity === 'resting' || activity === 'feeding' || speed < 1) {
      return STATUS_COLORS.WARNING; // Amber yellow
    }
    
    // Green for active/moving
    if (activity === 'moving' || activity === 'active') {
      return STATUS_COLORS.SUCCESS; // Emerald green
    }
    
    return STATUS_COLORS.SUCCESS; // Default green
  };

  // Helper: Get path color based on activity (matches web)
  const getPathColor = (activity, riskLevel) => {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return STATUS_COLORS.ERROR; // Crimson red
    }
    if (activity === 'resting' || activity === 'inactive' || activity === 'feeding') {
      return STATUS_COLORS.WARNING; // Amber yellow
    }
    if (activity === 'moving' || activity === 'active') {
      return STATUS_COLORS.SUCCESS; // Emerald green
    }
    return '#6B7280'; // Gray for unknown
  };

  // Helper: Validate coordinate (exclude 0,0 as invalid)
  const isValidCoord = (coord) => {
    if (!coord) return false;
    if (Array.isArray(coord)) {
      const isValid = coord.length === 2 && 
             typeof coord[0] === 'number' && 
             typeof coord[1] === 'number' &&
             !isNaN(coord[0]) && !isNaN(coord[1]) &&
             Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) <= 180;
      // Exclude 0,0 coordinates (likely invalid/default)
      return isValid && !(coord[0] === 0 && coord[1] === 0);
    }
    const isValid = coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && 
           !isNaN(coord.lng) &&
           Math.abs(coord.lat) <= 90 &&
           Math.abs(coord.lng) <= 180;
    // Exclude 0,0 coordinates (likely invalid/default)
    return isValid && !(coord.lat === 0 && coord.lng === 0);
  };

  // Animated marker component for moving animals
  const AnimatedAnimalMarker = React.memo(({ animal, onPress }) => {
    // Component implementation
    // Validate coordinates before using them - with extra safety
    let safeLat = DEFAULT_CENTER.latitude;
    let safeLng = DEFAULT_CENTER.longitude;
    
    try {
      if (isValidCoord(animal.coordinates)) {
        safeLat = animal.coordinates.lat;
        safeLng = animal.coordinates.lng;
      }
    } catch (_e) {
      // Use defaults if validation fails
    }
    
    const [currentPosition, setCurrentPosition] = useState({
      latitude: safeLat,
      longitude: safeLng,
    });
    const positionRef = useRef(currentPosition);

    // Update ref when position changes
    useEffect(() => {
      positionRef.current = currentPosition;
    }, [currentPosition]);

    const activity = animal.behavior || animal.activityType || 'unknown';
    const speed = typeof animal.speed === 'number' ? animal.speed : 0;
    const conflictRisk = animal.conflict_risk || {};
    const riskLevel = conflictRisk.risk_level || animal.risk || 'low';
    
    // Determine marker color based on conflict risk (priority) or activity
    let markerColor = getRiskColor(riskLevel, activity, speed);
    
    // Override color based on conflict risk
    if (conflictRisk.risk_level === 'high' || conflictRisk.risk_level === 'critical') {
      markerColor = '#DC2626'; // Red for danger
    } else if (conflictRisk.risk_level === 'medium') {
      markerColor = '#EA580C'; // Orange for warning
    }
    
    // Check if animal should animate (moving with speed > 2)
    const shouldAnimate = showAnimalMovement && 
                         (animal.shouldAnimate || (activity === 'moving' && speed > 2)) &&
                         animal.predictedCoordinates &&
                         isValidCoord(animal.predictedCoordinates);
    
    const shouldWobble = animal.shouldWobble || activity === 'feeding';
    const isResting = animal.isResting || activity === 'resting';

    // Activity-based movement animation
    useEffect(() => {
      // Safety check - exit early if coordinates are invalid
      if (!isValidCoord(animal.coordinates)) {
        return () => {}; // Return empty cleanup
      }

      let lastPos;
      try {
        lastPos = { latitude: animal.coordinates.lat, longitude: animal.coordinates.lng };
      } catch (_e) {
        return () => {}; // Return empty cleanup if accessing coordinates fails
      }
      
      let animationTimeout = null;
      let wobbleInterval = null;
      
      // RESTING: No animation, only update if position changed significantly (>100m)
      if (isResting) {
        const currentPos = positionRef.current;
        const distance = Math.sqrt(
          Math.pow(animal.coordinates.lat - currentPos.latitude, 2) + 
          Math.pow(animal.coordinates.lng - currentPos.longitude, 2)
        ) * 111; // Convert to km
        
        if (distance > 0.1) { // >100m
          // Position changed significantly - snap to new position (no animation)
          setCurrentPosition(lastPos);
        }
        // Otherwise, keep static position
        return () => {
          if (animationTimeout) clearTimeout(animationTimeout);
          if (wobbleInterval) clearInterval(wobbleInterval);
        };
      }

      // MOVING: Smooth animation (if speed > 2 km/h)
      if (shouldAnimate && animal.predictedCoordinates && isValidCoord(animal.predictedCoordinates)) {
        let startLat, startLng, endLat, endLng;
        try {
          startLat = animal.coordinates.lat;
          startLng = animal.coordinates.lng;
          endLat = animal.predictedCoordinates.lat || animal.predictedCoordinates[0];
          endLng = animal.predictedCoordinates.lng || animal.predictedCoordinates[1];
          
          // Validate the extracted coordinates
          if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
            setCurrentPosition(lastPos);
            return () => {
              if (animationTimeout) clearTimeout(animationTimeout);
              if (wobbleInterval) clearInterval(wobbleInterval);
            };
          }
        } catch (_e) {
          setCurrentPosition(lastPos);
          return () => {
            if (animationTimeout) clearTimeout(animationTimeout);
            if (wobbleInterval) clearInterval(wobbleInterval);
          };
        }

        if (Math.abs(endLat - startLat) > 0.00001 || Math.abs(endLng - startLng) > 0.00001) {
          const steps = 50;
          const duration = 3000; // 3 seconds (matches backend update interval)
          const interval = duration / steps;
          let step = 0;
          let cancelled = false;

          const animate = () => {
            if (cancelled) return;
            
            step++;
            if (step >= steps) {
              setCurrentPosition({ latitude: endLat, longitude: endLng });
              return;
            }

            const progress = step / steps;
            const newLat = startLat + (endLat - startLat) * progress;
            const newLng = startLng + (endLng - startLng) * progress;
            setCurrentPosition({ latitude: newLat, longitude: newLng });

            animationTimeout = setTimeout(animate, interval);
          };

          animate();
          
          return () => {
            cancelled = true;
            if (animationTimeout) clearTimeout(animationTimeout);
            if (wobbleInterval) clearInterval(wobbleInterval);
          };
        }
      } else if (shouldWobble && activity === 'feeding') {
        // FEEDING: Slight random movement (~50-100m radius)
        const baseLat = animal.coordinates.lat;
        const baseLng = animal.coordinates.lng;
        const wobbleRadius = 0.0008; // ~50-100m radius
        
        wobbleInterval = setInterval(() => {
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * wobbleRadius;
          const newLat = baseLat + distance * Math.cos(angle);
          const newLng = baseLng + distance * Math.sin(angle);
          setCurrentPosition({ latitude: newLat, longitude: newLng });
        }, 2000); // Update every 2 seconds
        
        return () => {
          if (animationTimeout) clearTimeout(animationTimeout);
          if (wobbleInterval) clearInterval(wobbleInterval);
        };
      } else {
        // Update position when coordinates change (non-animated)
        setCurrentPosition(lastPos);
        return () => {
          if (animationTimeout) clearTimeout(animationTimeout);
          if (wobbleInterval) clearInterval(wobbleInterval);
        };
      }
    }, [animal.coordinates, animal.predictedCoordinates, shouldAnimate, shouldWobble, isResting, activity]);

    return (
      <Marker
        coordinate={currentPosition}
        onPress={() => onPress(animal)}
        tracksViewChanges={false}
      >
        <View style={styles.animalMarkerContainer}>
          {/* Pulse effect for active animals */}
          {animal.status === 'Active' && (
            <View style={[styles.pulse, { backgroundColor: markerColor }]} />
          )}
          
          {/* Main marker - simple colored circle */}
          <View style={[styles.animalMarker, { backgroundColor: markerColor }]} />
          
          {/* Alert indicator - red ring */}
          {animal.hasAlert && (
            <View style={[styles.alertBadge, { borderColor: '#DC2626' }]} />
          )}
        </View>
        
        {/* Temporarily disabled Callout on iOS to prevent crashes - will use onPress handler instead */}
        {Platform.OS !== 'ios' && (
          <Callout tooltip={false}>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{String(animal.name || 'Unknown Animal')}</Text>
              <Text style={styles.calloutText}>{String(animal.species || 'Unknown Species')}</Text>
              <Text style={styles.calloutText}>Status: {String(animal.status || 'Unknown')}</Text>
              <Text style={styles.calloutText}>Activity: {String(activity || 'Unknown')}</Text>
              <Text style={styles.calloutText}>Speed: {typeof speed === 'number' ? speed.toFixed(1) : '0.0'} km/h</Text>
              <Text style={styles.calloutText}>Risk: {String(riskLevel || 'Low')}</Text>
              {conflictRisk?.zone_name ? (
                <Text style={[styles.calloutText, { color: markerColor, fontWeight: '700' }]}>
                  Zone: {String(conflictRisk.zone_name)}
                </Text>
              ) : null}
              {animal.battery != null ? (
                <Text style={styles.calloutText}>Battery: {String(animal.battery)}%</Text>
              ) : null}
            </View>
          </Callout>
        )}
      </Marker>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return prevProps.animal.id === nextProps.animal.id &&
           prevProps.animal.coordinates?.lat === nextProps.animal.coordinates?.lat &&
           prevProps.animal.coordinates?.lng === nextProps.animal.coordinates?.lng;
  });
  
  AnimatedAnimalMarker.displayName = 'AnimatedAnimalMarker';

  // Debug logging (reduced to prevent performance issues)
  const validAnimals = animals.filter(a => isValidCoord(a.coordinates));
  
  // Only log in development and limit frequency
  if (__DEV__) {
    try {
      console.log('🗺️ MapComponent rendering:', {
        totalAnimals: animals.length,
        validAnimals: validAnimals.length,
        corridors: corridors.length,
        riskZones: riskZones.length,
        platform: Platform.OS,
      });
    } catch (_e) {
      // Silently fail logging
    }
  }

  // Calculate safe initial region
  const safeInitialRegion = useMemo(() => {
    try {
      const latDelta = 360 / Math.pow(2, DEFAULT_ZOOM);
      const lngDelta = 360 / Math.pow(2, DEFAULT_ZOOM);
      return {
        ...defaultCenter,
        latitudeDelta: isNaN(latDelta) ? 10 : latDelta,
        longitudeDelta: isNaN(lngDelta) ? 10 : lngDelta,
      };
    } catch (_e) {
      return {
        latitude: DEFAULT_CENTER.latitude,
        longitude: DEFAULT_CENTER.longitude,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
    }
  }, [defaultCenter]);

  // Helper to get alert icon name based on alert type - more human-friendly icons
  const getAlertIconName = (alertType) => {
    if (!alertType) return 'alert';
    const type = String(alertType).toLowerCase();
    // Emergency/urgent alerts
    if (type.includes('emergency') || type.includes('emergency_report')) return 'alarm-light';
    // Conflict/danger zones
    if (type.includes('conflict') || type.includes('danger_zone')) return 'fire';
    // Poaching/security
    if (type.includes('poaching') || type.includes('security')) return 'shield-alert';
    // Corridor exit/location
    if (type.includes('corridor') || type.includes('exit')) return 'map-marker-alert';
    // Health/injury
    if (type.includes('health') || type.includes('injury')) return 'medical-bag';
    // Movement/rapid
    if (type.includes('movement') || type.includes('rapid')) return 'run-fast';
    // Battery/signal issues
    if (type.includes('battery')) return 'battery-alert';
    if (type.includes('signal')) return 'signal-off';
    // Risk zones
    if (type.includes('risk_zone') || type.includes('high_risk')) return 'alert';
    // Default
    return 'alert';
  };

  // Helper to get alert color based on severity
  const getAlertColor = (severity) => {
    if (severity === 'critical') return '#DC2626';
    if (severity === 'high') return '#EA580C';
    if (severity === 'low') return '#3B82F6';
    return '#F59E0B'; // medium/default
  };

  return (
    <View style={[styles.container, style, height ? { height } : { flex: 1 }]}>
      {/* Debug indicator - remove in production */}
      {__DEV__ && (
        <View style={styles.debugBadge}>
          <Text style={styles.debugText}>🗺️ Satellite Map</Text>
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        onRegionChangeComplete={handleRegionChangeComplete}
        mapType={Platform.OS === 'ios' ? 'satellite' : 'standard'}
        initialRegion={safeInitialRegion}
        showsUserLocation={!!userLocation && userLocation.latitude && userLocation.longitude}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor={BRAND_COLORS.PRIMARY}
        loadingBackgroundColor="#f0f0f0"
        moveOnMarkerPress={false}
        cacheEnabled={true}
        maxZoomLevel={20}
        minZoomLevel={3}
      >
        {/* Note: Using built-in satellite mapType for better compatibility
            Esri custom tiles can be added later if needed, but may require
            different URL format or authentication */}
        {/* User Location (Ranger Position) */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor={STATUS_COLORS.INFO}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerPulse} />
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}

        {/* Wildlife Corridors (Blue - matches web exactly) */}
        {showCorridors && corridors && corridors.length > 0 && corridors.map((corridor, idx) => {
          if (!corridor.path || !Array.isArray(corridor.path) || corridor.path.length < 2) return null;
          
          // Convert path to coordinates array [{lat, lng}]
          // Handle both [lat, lng] and [lng, lat] formats from backend
          const coordinates = corridor.path.map(p => {
            if (Array.isArray(p)) {
              // Check if first value is latitude (between -90 and 90) or longitude
              const first = p[0];
              const second = p[1];
              
              // If first value is clearly a latitude
              if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
                return { latitude: first, longitude: second };
              }
              // If first value is clearly a longitude (swap)
              if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
                return { latitude: second, longitude: first };
              }
              // Default: assume [lat, lng]
              return { latitude: first, longitude: second };
            }
            // Handle object format
            return { 
              latitude: p.lat || p.latitude || (Array.isArray(p.coordinates) ? p.coordinates[1] : null), 
              longitude: p.lng || p.lon || p.longitude || (Array.isArray(p.coordinates) ? p.coordinates[0] : null)
            };
          }).filter(coord => 
            coord.latitude != null && 
            coord.longitude != null && 
            !isNaN(coord.latitude) && 
            !isNaN(coord.longitude) &&
            Math.abs(coord.latitude) <= 90 &&
            Math.abs(coord.longitude) <= 180
          );
          
          if (coordinates.length < 2) return null;
          
          // Use species-specific color (matches web)
          const corridorColor = corridor.species === 'elephant' ? '#3b82f6' : '#8b5cf6';
          
          return (
            <Polyline
              key={`corridor-${corridor.id || idx}`}
              coordinates={coordinates}
              strokeColor={corridorColor} // Blue/Purple based on species (matches web)
              strokeWidth={6} // Matches web weight
              lineDashPattern={[10, 10]} // Matches web dashArray
              zIndex={1}
            />
          );
        })}

        {/* Risk Zones (Red circles - matches web exactly) */}
        {showRiskZones && riskZones && riskZones.length > 0 && riskZones.map((zone, idx) => {
          let position;
          
          // Handle different coordinate formats (matches web logic)
          if (zone.geometry?.coordinates) {
            const coords = zone.geometry.coordinates;
            // GeoJSON format: [lng, lat] for Point
            if (Array.isArray(coords) && coords.length >= 2) {
              position = { latitude: coords[1], longitude: coords[0] };
            } else {
              return null;
            }
          } else if (zone.position) {
            if (Array.isArray(zone.position)) {
              // Check if [lat, lng] or [lng, lat]
              if (Math.abs(zone.position[0]) <= 90) {
                position = { latitude: zone.position[0], longitude: zone.position[1] };
              } else {
                position = { latitude: zone.position[1], longitude: zone.position[0] };
              }
            } else {
              position = { 
                latitude: zone.position.lat || zone.position.latitude, 
                longitude: zone.position.lng || zone.position.longitude || zone.position.lon
              };
            }
          } else {
            return null;
          }
          
          if (!position || !isValidCoord(position)) return null;
          
          // Calculate radius (matches web: 2000 + intensity * 8000 meters)
          const baseRadius = 2000;
          const intensity = zone.intensity || (zone.severity === 'high' ? 0.8 : zone.severity === 'medium' ? 0.5 : 0.3);
          const radius = baseRadius + (intensity * 8000);
          
          // Opacity calculation (matches web: intensity * 0.4)
          const fillOpacity = intensity * 0.4;
          
          return (
            <Circle
              key={`risk-${zone.id || idx}`}
              center={position}
              radius={radius}
              fillColor={`rgba(220, 38, 38, ${fillOpacity})`} // #DC2626 with opacity (matches web)
              strokeColor="#991b1b" // Darker red border (matches web MAP_COLORS.RISK_ZONE_BORDER)
              strokeWidth={4} // Matches web weight
              zIndex={2}
            />
          );
        })}

        {/* Predicted Paths (Purple - matches web exactly) */}
        {showPredictions && predictions && Object.keys(predictions).length > 0 && 
          Object.entries(predictions).map(([animalId, prediction]) => {
            if (!prediction.path || !Array.isArray(prediction.path) || prediction.path.length < 2) return null;
            
            // Convert path coordinates (handle both [lat, lng] and [lng, lat])
            const coordinates = prediction.path.map(p => {
              if (Array.isArray(p)) {
                // Check if first value is latitude
                if (Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180) {
                  return { latitude: p[0], longitude: p[1] };
                }
                // Otherwise assume [lng, lat] and swap
                if (Math.abs(p[1]) <= 90 && Math.abs(p[0]) <= 180) {
                  return { latitude: p[1], longitude: p[0] };
                }
                // Default: assume [lat, lng]
                return { latitude: p[0], longitude: p[1] };
              }
              return { 
                latitude: p.lat || p.latitude, 
                longitude: p.lng || p.lon || p.longitude 
              };
            }).filter(coord => 
              coord.latitude != null && 
              coord.longitude != null && 
              !isNaN(coord.latitude) && 
              !isNaN(coord.longitude) &&
              Math.abs(coord.latitude) <= 90 &&
              Math.abs(coord.longitude) <= 180
            );
            
            if (coordinates.length < 2) return null;
            
            // Get confidence and model (matches web)
            const confidence = prediction.confidence || 0.5;
            const model = prediction.model || 'LSTM';
            const opacity = Math.max(0.3, confidence);
            const dashArray = model === 'BBMM' ? [10, 10] : [5, 15];
            
            // Use purple color (matches web MAP_COLORS)
            const baseColor = model === 'BBMM' ? '#a855f7' : model === 'LSTM' ? '#9333ea' : '#7c3aed';
            
            // Convert hex to rgba for opacity (react-native-maps doesn't support opacity prop)
            const hexToRgba = (hex, alpha) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            return (
              <React.Fragment key={`prediction-${animalId}`}>
                {/* Background path with lower opacity (matches web) */}
                <Polyline
                  coordinates={coordinates}
                  strokeColor={hexToRgba(baseColor, opacity * 0.3)}
                  strokeWidth={6}
                  lineDashPattern={dashArray}
                  zIndex={3}
                />
                {/* Main path (matches web) */}
                <Polyline
                  coordinates={coordinates}
                  strokeColor={hexToRgba(baseColor, opacity)}
                  strokeWidth={3}
                  lineDashPattern={dashArray}
                  zIndex={3}
                />
              </React.Fragment>
            );
          })
        }

        {/* Animal Movement Paths (Color-coded by activity) - VISIBLE LINES */}
        {showAnimalMovement && animals.filter(animal => 
          animal.path && 
          Array.isArray(animal.path) && 
          animal.path.length >= 2
        ).map((animal) => {
          const activity = animal.behavior || animal.activityType || 'unknown';
          const riskLevel = animal.risk || animal.risk_level || 'low';
          const pathColor = getPathColor(activity, riskLevel);
          
          const coordinates = animal.path.map(p => {
            if (Array.isArray(p)) {
              // Handle [lng, lat] or [lat, lng] format
              const lat = Math.abs(p[0]) <= 90 ? p[0] : p[1];
              const lng = Math.abs(p[1]) <= 180 ? p[1] : p[0];
              return { latitude: lat, longitude: lng };
            }
            return { 
              latitude: p.lat || p.latitude, 
              longitude: p.lng || p.lon || p.longitude 
            };
          }).filter(coord => 
            coord.latitude && 
            coord.longitude && 
            !isNaN(coord.latitude) && 
            !isNaN(coord.longitude) &&
            Math.abs(coord.latitude) <= 90 &&
            Math.abs(coord.longitude) <= 180
          );
          
          if (coordinates.length < 2) return null;
          
          return (
            <Polyline
              key={`path-${animal.id}`}
              coordinates={coordinates}
              strokeColor={pathColor}
              strokeWidth={4}
              lineDashPattern={activity === 'resting' ? [5, 10] : undefined}
              zIndex={5}
              lineCap="round"
              lineJoin="round"
            />
          );
        })}

        {/* Ranger Patrols (Cyan - matches web) */}
        {showRangerPatrols && rangerPatrols && rangerPatrols.length > 0 && rangerPatrols.map((ranger, idx) => {
          if (!ranger.current_position || !isValidCoord(ranger.current_position)) return null;
          
          const coords = Array.isArray(ranger.current_position)
            ? { latitude: ranger.current_position[0], longitude: ranger.current_position[1] }
            : { latitude: ranger.current_position.lat, longitude: ranger.current_position.lng };
          
          return (
            <Marker
              key={`ranger-${ranger.id || idx}`}
              coordinate={coords}
              title={ranger.team_name || ranger.name || 'Ranger'}
            >
              <View style={styles.rangerMarker}>
                <View style={styles.rangerMarkerPulse} />
                <View style={styles.rangerMarkerDot} />
              </View>
              {Platform.OS !== 'ios' && (
                <Callout tooltip={false}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{String(ranger.team_name || ranger.name || 'Ranger')}</Text>
                    <Text style={styles.calloutText}>Status: {String(ranger.status || 'Active')}</Text>
                    <Text style={styles.calloutText}>Activity: {String(ranger.activity || 'Patrolling')}</Text>
                  </View>
                </Callout>
              )}
            </Marker>
          );
        })}

        {/* Behavior State Glows (Green circles around animals - matches web) */}
        {showBehavior && behavioralStates && Object.keys(behavioralStates).length > 0 && animals
          .filter(animal => {
            const hasPosition = animal.coordinates && isValidCoord(animal.coordinates);
            const hasBehaviorState = behavioralStates[animal.id];
            return hasPosition && hasBehaviorState;
          })
          .map((animal) => {
            const behaviorState = behavioralStates[animal.id];
            if (!behaviorState) return null;
            
            const position = {
              latitude: animal.coordinates.lat,
              longitude: animal.coordinates.lng
            };
            
            // Confidence-based opacity (matches web)
            const confidence = behaviorState.confidence || 0.5;
            const opacity = Math.max(0.3, Math.min(0.6, confidence * 0.6));
            
            return (
              <Circle
                key={`behavior-${animal.id}`}
                center={position}
                radius={1500} // ~1.5km radius (matches web)
                fillColor={`rgba(5, 150, 105, ${opacity})`} // #059669 (green) with opacity
                strokeColor="#059669"
                strokeWidth={2}
                zIndex={5}
              />
            );
          })}

        {/* Risk Heatmap (Environment/Habitat Suitability - matches web) */}
        {showEnvironment && riskHeatmap && riskHeatmap.length > 0 && riskHeatmap.map((risk, idx) => {
          if (!risk.position || !Array.isArray(risk.position) || risk.position.length < 2) return null;
          
          const position = {
            latitude: risk.position[0],
            longitude: risk.position[1]
          };
          
          if (!isValidCoord(position)) return null;
          
          // Color based on suitability (matches web)
          let color = '#6B7280'; // Gray default
          if (risk.type === 'habitat') {
            if (risk.suitability === 'high') {
              color = STATUS_COLORS.SUCCESS; // Green
            } else if (risk.suitability === 'medium') {
              color = STATUS_COLORS.WARNING; // Yellow/Orange
            } else if (risk.suitability === 'low') {
              color = STATUS_COLORS.ERROR; // Red
            }
          }
          
          // Radius calculation (matches web: 2000 + intensity * 8000 meters)
          const baseRadius = 2000;
          const intensity = risk.intensity || 0.5;
          const radius = baseRadius + (intensity * 8000);
          
          // Opacity calculation (matches web)
          const fillOpacity = Math.max(0.7, Math.min(0.95, 0.6 + (intensity * 0.35)));
          const strokeOpacity = Math.max(0.9, Math.min(1.0, 0.8 + (intensity * 0.2)));
          
          // Convert hex to rgba
          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          
          const isFallback = risk.status === 'fallback' || risk.status === 'error';
          
          return (
            <React.Fragment key={`heatmap-${idx}`}>
              <Circle
                center={position}
                radius={radius}
                fillColor={hexToRgba(color, fillOpacity)}
                strokeColor={hexToRgba(color, strokeOpacity)}
                strokeWidth={isFallback ? 3 : 2}
                lineDashPattern={isFallback ? [8, 8] : undefined}
                zIndex={6}
              />
              {/* Center marker */}
              <Marker
                coordinate={position}
                title={risk.type === 'habitat' ? `Habitat: ${risk.suitability?.toUpperCase() || 'UNKNOWN'}` : 'Risk Zone'}
                description={`Score: ${((risk.intensity || 0) * 100).toFixed(0)}%`}
              >
                <View style={[styles.heatmapMarker, { backgroundColor: color }]}>
                  <Text style={styles.heatmapMarkerText}>
                    {risk.type === 'habitat' 
                      ? (risk.suitability === 'high' ? '✓' : risk.suitability === 'medium' ? '⚠' : '✗')
                      : '⚠'}
                  </Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Behavior Glow (legacy - for backward compatibility) */}
        {showBehavior && (!behavioralStates || Object.keys(behavioralStates).length === 0) && animals.filter(animal => isValidCoord(animal.coordinates)).map((animal) => {
          const activity = animal.behavior || animal.activityType || 'unknown';
          const confidence = animal.behavior_confidence || 0.7;
          
          // Match web MAP_COLORS for behavior
          const behaviorColor = activity === 'foraging' ? '#65a30d' : // FORAGING
                               activity === 'resting' ? '#4f46e5' : // RESTING
                               activity === 'migrating' ? '#d97706' : // MIGRATING
                               null;
          
          if (!behaviorColor) return null;
          
          // Convert hex color to rgba for opacity (matches web: confidence * 0.25)
          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          
          const fillOpacity = confidence * 0.25; // Matches web
          
          return (
            <Circle
              key={`behavior-${animal.id}`}
              center={{
                latitude: animal.coordinates.lat,
                longitude: animal.coordinates.lng,
              }}
              radius={500} // 500 meters (matches web)
              fillColor={hexToRgba(behaviorColor, fillOpacity)}
              strokeColor={behaviorColor}
              strokeWidth={2} // Matches web
              zIndex={0}
            />
          );
        })}

        {/* Alert Markers - Icon-based, human-friendly (no text labels) - Rendered with high z-index */}
        {alerts && alerts.length > 0 && (() => {
          // Deduplicate alerts by ID to prevent exact duplicates
          // Allow same animal alerts at different times (different timestamps)
          const alertMap = new Map();
          
          alerts.forEach(alert => {
            // Use alert.id if available, otherwise create a unique ID from animal + timestamp + type
            let alertId = alert.id;
            if (!alertId) {
              const animalId = alert.animal_id || alert.animal || 'unknown';
              const timestamp = alert.timestamp || alert.created_at || alert.detected_at || Date.now();
              const alertType = alert.alert_type || alert.type || 'general';
              const lat = alert.latitude || alert.coordinates?.[0] || alert.position?.[0] || 0;
              const lon = alert.longitude || alert.coordinates?.[1] || alert.position?.[1] || 0;
              // Include coordinates to handle same animal at different locations
              alertId = `alert-${animalId}-${timestamp}-${alertType}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
            }
            
            // Only add if we haven't seen this exact ID before
            if (!alertMap.has(alertId)) {
              alertMap.set(alertId, { ...alert, _uniqueId: alertId });
            }
          });
          
          return Array.from(alertMap.values());
        })().filter(alert => {
            try {
              const coords = alert.coordinates || alert.position || alert.latitude !== undefined 
                ? { lat: alert.latitude || alert.coordinates?.[0] || alert.position?.[0], 
                    lng: alert.longitude || alert.coordinates?.[1] || alert.position?.[1] }
                : null;
              return coords && isValidCoord(coords);
            } catch (_e) {
              return false;
            }
          })
          .map((alert) => {
            try {
              const alertType = alert.alert_type || alert.type || 'general';
              const severity = alert.severity || 'medium';
              const alertColor = getAlertColor(severity);
              const iconName = getAlertIconName(alertType);
              
              // Get coordinates
              let coords;
              if (alert.coordinates && Array.isArray(alert.coordinates)) {
                coords = { latitude: alert.coordinates[0], longitude: alert.coordinates[1] };
              } else if (alert.position && Array.isArray(alert.position)) {
                coords = { latitude: alert.position[0], longitude: alert.position[1] };
              } else if (alert.latitude !== undefined && alert.longitude !== undefined) {
                coords = { latitude: alert.latitude, longitude: alert.longitude };
              } else {
                return null;
              }
              
              if (!isValidCoord(coords)) return null;
              
              return (
                <AnimatedAlertMarker
                  key={`alert-${alert._uniqueId || alert.id || `alert-${coords.latitude}-${coords.longitude}`}`}
                  alert={alert}
                  alertColor={alertColor}
                  iconName={iconName}
                  severity={severity}
                  coords={coords}
                />
              );
            } catch (_e) {
              if (__DEV__) {
                console.warn('Error rendering alert marker:', alert?.id, _e);
              }
              return null;
            }
          }).filter(Boolean)}

        {/* Animal Markers - with comprehensive error handling */}
        {(() => {
          try {
            const validAnimals = animals
              .filter(animal => {
                try {
                  return animal && 
                         animal.id && 
                         animal.coordinates && 
                         isValidCoord(animal.coordinates);
                } catch (_e) {
                  return false;
                }
              })
              .slice(0, 100); // Limit to prevent performance issues
            
            return validAnimals.map((animal) => {
              try {
                return (
                  <AnimatedAnimalMarker
                    key={`animal-${animal.id}`}
                    animal={animal}
                    onPress={onAnimalPress}
                  />
                );
              } catch (_e) {
                if (__DEV__) {
                  console.warn('Error rendering animal marker:', animal?.id, _e);
                }
                return null;
              }
            }).filter(Boolean);
          } catch (_e) {
            if (__DEV__) {
              console.error('Error in animal markers section:', _e);
            }
            return null;
          }
        })()}
      </MapView>
      
      {/* Compact Legend Panel */}
      <View style={styles.legendPanel}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>Legend</Text>
        </View>
        
        {/* Compact Animal Risk Status */}
        <View style={styles.legendSection}>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: '#059669' }]} />
            <Text style={styles.legendTextCompact}>Safe</Text>
            <View style={[styles.legendIcon, { backgroundColor: '#F59E0B', marginLeft: 8 }]} />
            <Text style={styles.legendTextCompact}>Caution</Text>
            <View style={[styles.legendIcon, { backgroundColor: '#DC2626', marginLeft: 8 }]} />
            <Text style={styles.legendTextCompact}>Danger</Text>
          </View>
        </View>
        
        {/* Compact Alert Types - Show only key ones */}
        <View style={styles.legendSection}>
          <View style={styles.legendRow}>
            <MaterialCommunityIcons name="alert" size={12} color="#DC2626" />
            <Text style={styles.legendTextCompact}>Risk</Text>
            <MaterialCommunityIcons name="shield-alert" size={12} color="#EA580C" style={{ marginLeft: 8 }} />
            <Text style={styles.legendTextCompact}>Poaching</Text>
            <MaterialCommunityIcons name="map-marker-alert" size={12} color="#F59E0B" style={{ marginLeft: 8 }} />
            <Text style={styles.legendTextCompact}>Exit</Text>
          </View>
        </View>
        
        {/* Compact Map Layers */}
        <View style={styles.legendSection}>
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: '#2563eb', width: 12, height: 2 }]} />
            <Text style={styles.legendTextCompact}>Corridors</Text>
            <View style={[styles.legendIcon, { backgroundColor: '#7c3aed', width: 12, height: 2, marginLeft: 8 }]} />
            <Text style={styles.legendTextCompact}>Predictions</Text>
            <View style={[styles.legendIcon, { backgroundColor: '#0891b2', width: 10, height: 10, marginLeft: 8 }]} />
            <Text style={styles.legendTextCompact}>Rangers</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0', // Light background while loading (less jarring)
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  userMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: STATUS_COLORS.INFO,
    opacity: 0.3,
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: STATUS_COLORS.INFO,
    borderWidth: 3,
    borderColor: '#fff',
  },
  animalMarkerContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.3,
  },
  animalMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  alertBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    backgroundColor: 'transparent',
    elevation: 6,
  },
  rangerMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rangerMarkerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2', // Cyan (matches web)
    opacity: 0.3,
  },
  rangerMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0891b2', // Cyan
    borderWidth: 2,
    borderColor: '#fff',
  },
  callout: {
    padding: 8,
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  debugBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heatmapMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: STATUS_COLORS.SUCCESS,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  heatmapMarkerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  alertMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertPulseRing: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'solid',
    opacity: 0.6,
  },
  alertMarker: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10, // Higher elevation to appear above other elements
    zIndex: 1000,
  },
  alertCallout: {
    padding: 12,
    minWidth: 200,
    maxWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
  },
  alertCalloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  alertCalloutText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  alertCalloutDescription: {
    fontSize: 11,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginTop: 6,
    fontStyle: 'italic',
  },
  legendPanel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 160,
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  legendSection: {
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legendSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 10,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  legendTextCompact: {
    fontSize: 9,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
});

export default MapComponent;

