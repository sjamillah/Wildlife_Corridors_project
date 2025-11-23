import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, Tooltip, Rectangle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../../constants/Colors';
import ReactDOMServer from 'react-dom/server';
import { MapPin, Shield, AlertTriangle, Battery, Signal, Activity, Clock, Users, AlertCircle, AlertOctagon, Siren, Flame, ANIMAL_ICONS } from './Icons';

const MovementTrailLayer = ({ trail, isPlaying, onComplete }) => {
  const map = useMap();
  const [animatedMarker, setAnimatedMarker] = useState(null);
  const animationRef = useRef(null);

  const calculateAnimationDelay = (activityType, timeSinceLast) => {
    if (timeSinceLast?.is_large_gap) {
      return 100;
    }

    const baseDelays = {
      'resting': 1500,
      'feeding': 800,
      'moving': 400
    };

    return baseDelays[activityType] || 800;
  };

  const animateTrail = React.useCallback(() => {
    if (!trail?.segments) return;
    
    const segments = trail.segments;
    let segmentIndex = 0;
    let pointIndex = 0;

    const animateNextPoint = () => {
      if (segmentIndex >= segments.length) {
        console.log('Trail animation complete');
        if (onComplete) onComplete();
        return;
      }

      const segment = segments[segmentIndex];
      if (!segment.points || segment.points.length === 0) {
        segmentIndex++;
        animateNextPoint();
        return;
      }

      const point = segment.points[pointIndex];
      if (!point) {
        segmentIndex++;
        pointIndex = 0;
        animateNextPoint();
        return;
      }

      setAnimatedMarker({
        position: [point.lat, point.lon],
        activity: segment.activity_type,
        speed: point.speed_kmh,
        timestamp: point.timestamp
      });

      map.panTo([point.lat, point.lon], { animate: true, duration: 0.5 });

      const delay = calculateAnimationDelay(segment.activity_type, point.time_since_last);

      pointIndex++;
      if (pointIndex >= segment.points.length) {
        segmentIndex++;
        pointIndex = 0;
      }

      animationRef.current = setTimeout(animateNextPoint, delay);
    };

    animateNextPoint();
  }, [trail, map, onComplete]);

  useEffect(() => {
    if (!trail || !trail.trail || trail.trail.length === 0 || !isPlaying) {
      return;
    }

    animateTrail();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [trail, isPlaying, animateTrail]);

  const getActivityColor = (activity) => {
    const colors = {
      'resting': '#ef4444',
      'feeding': '#f59e0b',
      'moving': '#10b981'
    };
    return colors[activity] || '#6b7280';
  };

  const getActivityIcon = (activity, speed) => {
    const color = getActivityColor(activity);
    const isPulsing = activity === 'moving';
    
    return L.divIcon({
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ${isPulsing ? 'animation: pulse 1s infinite;' : ''}
        "></div>
      `,
      className: 'animated-trail-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  if (!trail) return null;

  return (
    <>
      {trail.segments && trail.segments.map((segment, idx) => {
        const positions = segment.points?.map(p => [p.lat, p.lon]) || [];
        if (positions.length < 2) return null;
        
        const color = getActivityColor(segment.activity_type);

        return (
          <Polyline
            key={`trail-segment-${idx}`}
            positions={positions}
            pathOptions={{
              color: color,
              weight: 3,
              opacity: 0.7,
              dashArray: segment.activity_type === 'resting' ? '5, 10' : undefined
            }}
          >
            <Tooltip>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>
                {segment.activity_type.toUpperCase()}<br/>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>
                  {segment.point_count} points • {segment.total_duration_hours?.toFixed(1)}h
                </span>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {animatedMarker && (
        <Marker
          position={animatedMarker.position}
          icon={getActivityIcon(animatedMarker.activity, animatedMarker.speed)}
        >
          <Popup>
            <div style={{ fontSize: '12px' }}>
              <strong>{animatedMarker.activity.toUpperCase()}</strong><br/>
              Speed: {animatedMarker.speed?.toFixed(1)} km/h<br/>
              <span style={{ fontSize: '10px', color: '#6B5E4F' }}>
                {new Date(animatedMarker.timestamp).toLocaleString()}
              </span>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

const AnimatedMarker = ({ marker, icon, children }) => {
  const [currentPosition, setCurrentPosition] = useState(marker.position);
  const animationRef = useRef(null);
  const wobbleRef = useRef(null);
  const lastPositionRef = useRef(marker.position);

  useEffect(() => {
    const activityType = marker.activityType || marker.movement?.activity_type || 'unknown';
    const speed = marker.speed || marker.movement?.speed_kmh || 0;
    const predictedPosition = marker.predictedPosition;
    const showAnimalMovement = marker.showAnimalMovement !== false;
    const isResting = marker.isResting || activityType === 'resting';
    const shouldAnimate = marker.shouldAnimate || (activityType === 'moving' && speed > 2);
    const shouldWobble = marker.shouldWobble || activityType === 'feeding';

    if (animationRef.current) clearInterval(animationRef.current);
    if (wobbleRef.current) clearInterval(wobbleRef.current);

    // RESTING: No animation, only update if position changed significantly (>100m)
    if (isResting) {
      const distance = Math.sqrt(
        Math.pow(marker.position[0] - lastPositionRef.current[0], 2) + 
        Math.pow(marker.position[1] - lastPositionRef.current[1], 2)
      ) * 111; // Convert to km
      
      if (distance > 0.1) { // >100m
        // Position changed significantly - snap to new position (no animation)
        setCurrentPosition(marker.position);
        lastPositionRef.current = marker.position;
        console.log(`⏸️ [RESTING] ${marker.title} - Position updated (no animation):`, marker.position);
      }
      // Otherwise, keep static position
      return;
    }

    const isDifferentPosition = predictedPosition && 
      (Math.abs(predictedPosition[0] - marker.position[0]) > 0.00001 || 
       Math.abs(predictedPosition[1] - marker.position[1]) > 0.00001);

    // MOVING: Smooth animation (if speed > 2 km/h and positions are different)
    // Also check if marker explicitly says it should animate
    const shouldActuallyAnimate = showAnimalMovement && 
                                  (shouldAnimate || (activityType === 'moving' && speed > 2)) && 
                                  isDifferentPosition &&
                                  !isResting;
    
    if (shouldActuallyAnimate) {
      console.log(`🏃 [ANIMATION] ${marker.title} - MOVING animation started:`, {
        current: marker.position,
        predicted: predictedPosition,
        speed: speed,
        distance: Math.sqrt(
          Math.pow(predictedPosition[0] - marker.position[0], 2) + 
          Math.pow(predictedPosition[1] - marker.position[1], 2)
        ) * 111
      });
      const steps = 50;
      const duration = 3000; // 3 seconds (matches backend update interval)
      const interval = duration / steps;
      
      const startLat = marker.position[0];
      const startLon = marker.position[1];
      const endLat = predictedPosition[0];
      const endLon = predictedPosition[1];
      
      let step = 0;
      animationRef.current = setInterval(() => {
        step++;
        if (step >= steps) {
          setCurrentPosition(predictedPosition);
          lastPositionRef.current = predictedPosition;
          clearInterval(animationRef.current);
          console.log(`✅ [ANIMATION] ${marker.title} - COMPLETED movement to [${predictedPosition[0].toFixed(4)}, ${predictedPosition[1].toFixed(4)}]`);
          return;
        }
        
        const progress = step / steps;
        const newLat = startLat + (endLat - startLat) * progress;
        const newLon = startLon + (endLon - startLon) * progress;
        setCurrentPosition([newLat, newLon]);
      }, interval);
      
    } else if (shouldWobble && activityType === 'feeding') {
      // FEEDING: Slight random movement (~50-100m radius)
      console.log(`🌿 [ANIMATION] ${marker.title} - FEEDING wobble started`);
      const baseLat = marker.position[0];
      const baseLon = marker.position[1];
      const wobbleRadius = 0.0008; // ~50-100m radius
      
      wobbleRef.current = setInterval(() => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * wobbleRadius;
        const newLat = baseLat + distance * Math.cos(angle);
        const newLon = baseLon + distance * Math.sin(angle);
        setCurrentPosition([newLat, newLon]);
      }, 2000); // Update every 2 seconds for feeding
      
    } else {
      // No animation - just update position (for low speed moving or unknown)
      setCurrentPosition(marker.position);
      lastPositionRef.current = marker.position;
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
      if (wobbleRef.current) clearInterval(wobbleRef.current);
    };
  }, [marker.position, marker.predictedPosition, marker.activityType, marker.speed, marker.title, marker.showAnimalMovement, marker.isResting, marker.shouldAnimate, marker.shouldWobble, marker.movement?.activity_type, marker.movement?.speed_kmh]);

  const isMoving = marker.activityType === 'moving' && marker.speed > 2;
  const showMovement = marker.showAnimalMovement !== false;

  return (
    <>
      {showMovement && isMoving && (
        <Circle
          center={currentPosition}
          radius={100}
          pathOptions={{
            color: '#9333ea',
            fillColor: '#9333ea',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.6
          }}
        />
      )}
      
    <Marker position={currentPosition} icon={icon} zIndexOffset={200}>
      {children}
    </Marker>
    </>
  );
};

const MAP_COLORS = {
  SAFE: '#059669',
  CAUTION: '#ea580c',
  DANGER: '#dc2626',
  
  CORRIDOR: '#2563eb',
  CORRIDOR_BUFFER: '#60a5fa',
  RISK_ZONE: '#f87171',
  RISK_ZONE_BORDER: '#991b1b',
  
  PREDICTED_PATH: '#7c3aed',
  LSTM_PATH: '#9333ea',
  BBMM_PATH: '#a855f7',
  
  RANGER_PATROL: '#0891b2',
  RANGER_ACTIVE: '#06b6d4',
  CAMERA_TRAP: '#f59e0b',
  
  FORAGING: '#65a30d',
  RESTING: '#4f46e5',
  MIGRATING: '#d97706',
  ALERT_STATE: '#ef4444',
  
  GRAY_DEFAULT: '#6B7280',
};

const isValidCoordinate = (coord) => {
  return Array.isArray(coord) && 
         coord.length === 2 && 
         typeof coord[0] === 'number' && 
         typeof coord[1] === 'number' &&
         !isNaN(coord[0]) && 
         !isNaN(coord[1]) &&
         isFinite(coord[0]) &&
         isFinite(coord[1]);
};

const isValidPath = (path) => {
  return Array.isArray(path) && 
         path.length >= 2 && 
         path.every(isValidCoordinate);
};

// Zoom-aware predicted path component
const ZoomAwarePredictedPath = ({ path, confidence, model, color }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  
  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoomend', updateZoom);
    return () => map.off('zoomend', updateZoom);
  }, [map]);
  
  if (!path || path.length < 2 || !isValidPath(path)) return null;
  
  // Enhanced visibility: higher opacity for movement paths
  const opacity = Math.max(0.8, confidence || 0.8);
  const dashArray = model === 'BBMM' ? '10, 10' : '5, 15';
  
  // Enhanced visibility: thicker lines for movement paths
  const backgroundWeight = zoom < 7 ? 14 : zoom < 9 ? 12 : 8;
  const foregroundWeight = zoom < 7 ? 8 : zoom < 9 ? 7 : 5;
  
  // Arrow marker at the end for direction indication
  const endPoint = path[path.length - 1];
  const secondLastPoint = path[path.length - 2];
  
  return (
    <>
      {/* Background shadow line */}
      <Polyline
        positions={path}
        pathOptions={{
          color: color,
          weight: backgroundWeight,
          opacity: opacity * 0.4,
          dashArray: dashArray
        }}
      />
      {/* Main foreground line */}
      <Polyline
        positions={path}
        pathOptions={{
          color: color,
          weight: foregroundWeight,
          opacity: opacity,
          dashArray: dashArray
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
          <div style={{ fontSize: '11px', fontWeight: 600 }}>
            <div>{model} Prediction</div>
            <div style={{ fontSize: '10px', color: '#6B5E4F', marginTop: '2px' }}>
              Confidence: {((confidence || 0) * 100).toFixed(0)}%
            </div>
          </div>
        </Tooltip>
      </Polyline>
      
      {/* Direction indicator at end point (visible at low zoom) */}
      {zoom < 9 && endPoint && secondLastPoint && (
        <Marker
          position={endPoint}
          icon={L.divIcon({
            html: `
              <div style="
                width: ${zoom < 7 ? 16 : 12}px;
                height: ${zoom < 7 ? 16 : 12}px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              "></div>
            `,
            className: 'prediction-end-marker',
            iconSize: [zoom < 7 ? 16 : 12, zoom < 7 ? 16 : 12],
            iconAnchor: [(zoom < 7 ? 16 : 12) / 2, (zoom < 7 ? 16 : 12) / 2]
          })}
        />
      )}
    </>
  );
};

const PredictedPath = ({ path, confidence, model, color }) => {
  return (
    <ZoomAwarePredictedPath
      path={path}
      confidence={confidence}
      model={model}
      color={color}
    />
  );
};

// Component to get current zoom level for dynamic sizing
const ZoomAwareRiskHeatmapPoint = ({ position, intensity, type, suitability, status, message }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  
  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoomend', updateZoom);
    return () => map.off('zoomend', updateZoom);
  }, [map]);
  
  // Color based on type and suitability
  let color = COLORS.warning;
  let iconSymbol = '⚠';
  let labelText = '';
  
  if (type === 'habitat') {
    // Habitat suitability colors
    if (suitability === 'high') {
      color = COLORS.success; // Green for high suitability
      iconSymbol = '✓';
      labelText = 'HIGH';
    } else if (suitability === 'medium') {
      color = COLORS.ochre; // Yellow/Orange for medium
      iconSymbol = '⚠';
      labelText = 'MED';
    } else if (suitability === 'low') {
      color = COLORS.error; // Red for low
      iconSymbol = '✗';
      labelText = 'LOW';
    } else {
      color = '#6B7280'; // Gray for unknown/fallback
      iconSymbol = '?';
      labelText = 'UNK';
    }
  } else if (type === 'poaching') {
    color = COLORS.error; // Red for poaching risk
    iconSymbol = '⚠';
    labelText = 'RISK';
  }
  
  // Zoom-based sizing: larger at lower zoom levels for better visibility
  const baseRadius = 2000 + (intensity * 8000);
  const zoomMultiplier = zoom < 7 ? 1.5 : zoom < 9 ? 1.2 : 1.0; // Larger at low zoom
  const radius = baseRadius * zoomMultiplier;
  
  const isFallback = status === 'fallback' || status === 'error';
  
  // Increased opacity for better visibility
  const fillOpacity = Math.max(0.7, Math.min(0.95, 0.6 + (intensity * 0.35)));
  const strokeOpacity = Math.max(0.9, Math.min(1.0, 0.8 + (intensity * 0.2)));
  
  // Thicker borders at lower zoom levels
  const borderWeight = zoom < 7 ? 5 : zoom < 9 ? 4 : (isFallback ? 3 : 2);
  
  // Icon size based on zoom
  const iconSize = zoom < 7 ? 32 : zoom < 9 ? 24 : 20;
  
  return (
    <>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: fillOpacity,
          weight: borderWeight,
          opacity: strokeOpacity,
          dashArray: isFallback ? '8, 8' : undefined
        }}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
          <div style={{ fontSize: '11px', fontWeight: 600 }}>
            <div style={{ textTransform: 'capitalize' }}>
              {type === 'habitat' ? 'Habitat Suitability' : `${type} Risk Zone`}
            </div>
            {type === 'habitat' && suitability && (
              <div style={{ fontSize: '10px', color: color, marginTop: '2px', fontWeight: 700 }}>
                Suitability: {suitability.toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#6B5E4F', marginTop: '2px' }}>
              Score: {(intensity * 100).toFixed(0)}%
            </div>
            {isFallback && (
              <div style={{ fontSize: '9px', color: '#DC2626', marginTop: '2px', fontStyle: 'italic' }}>
                ⚠️ Fallback (ML unavailable)
              </div>
            )}
            {!isFallback && (
              <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '1px' }}>
                XGBoost Model
              </div>
            )}
          </div>
        </Tooltip>
      </Circle>
      
      {/* Center icon marker for instant recognition - simplified, no permanent labels */}
      <Marker
        position={position}
        icon={L.divIcon({
          html: `
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              background: ${color};
              border: 4px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${iconSize * 0.7}px;
              font-weight: 900;
              color: white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.6);
              text-shadow: 0 2px 3px rgba(0,0,0,0.4);
            ">${iconSymbol}</div>
          `,
          className: 'risk-heatmap-icon',
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2]
        })}
      >
        <Tooltip direction="top" offset={[0, -iconSize / 2 - 5]} opacity={1} permanent={false}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 700,
            color: color,
            textAlign: 'center',
            padding: '4px 8px',
            background: 'white',
            borderRadius: '6px',
            border: `2px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {type === 'habitat' ? `Habitat: ${labelText}` : `${labelText} Zone`}
            <div style={{ fontSize: '10px', color: '#6B5E4F', marginTop: '2px', fontWeight: 500 }}>
              Score: {(intensity * 100).toFixed(0)}%
            </div>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

const RiskHeatmapPoint = ({ position, intensity, type, suitability, status, message }) => {
  return (
    <ZoomAwareRiskHeatmapPoint
      position={position}
      intensity={intensity}
      type={type}
      suitability={suitability}
      status={status}
      message={message}
    />
  );
};

const BehaviorGlow = ({ position, state, confidence }) => {
  const glowColor = '#059669';
  
  return (
    <Circle
      center={position}
      radius={500}
      pathOptions={{
        color: glowColor,
        fillColor: glowColor,
        fillOpacity: (confidence || 0.7) * 0.25,
        weight: 2,
        opacity: (confidence || 0.7) * 0.5
      }}
    />
  );
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.webp',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.webp',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.webp',
});

const createCustomIcon = (color, type, alertType = null) => {
  let iconContent;
  
    switch (type) {
      case 'elephant':
      iconContent = ANIMAL_ICONS.ELEPHANT;
        break;
      case 'wildebeest':
      iconContent = ANIMAL_ICONS.WILDEBEEST;
        break;
      case 'wildlife':
      iconContent = ANIMAL_ICONS.WILDLIFE;
        break;
      case 'alert':
        // Use different icons based on alert_type
        const IconComponent = (() => {
          if (!alertType) return AlertTriangle;
          
          const alertTypeLower = String(alertType).toLowerCase().replace(/-/g, '_').trim();
          
          // Exact matches first (most specific)
          if (alertTypeLower === 'high_risk_zone' || alertTypeLower === 'risk_zone_entry' || alertTypeLower === 'high_risk_zone_entry') {
            return AlertTriangle; // High Risk Zone Entry
          } else if (alertTypeLower === 'poaching_risk' || alertTypeLower === 'poaching' || alertTypeLower === 'potential_poaching_activity') {
            return Shield; // Poaching Risk
          } else if (alertTypeLower === 'corridor_exit' || alertTypeLower === 'left_wildlife_corridor' || alertTypeLower === 'left_corridor') {
            return MapPin; // Corridor Exit
          } else if (alertTypeLower === 'rapid_movement' || alertTypeLower === 'unusual_movement' || alertTypeLower === 'rapid') {
            return Activity; // Rapid Movement
          } else if (alertTypeLower === 'low_battery' || alertTypeLower === 'battery') {
            return Battery; // Low Battery
          } else if (alertTypeLower === 'weak_signal' || alertTypeLower === 'signal' || alertTypeLower === 'weak_signal_strength') {
            return Signal; // Weak Signal
          } else if (alertTypeLower === 'stationary_too_long' || alertTypeLower === 'stationary') {
            return Clock; // Stationary Too Long
          } else if (alertTypeLower === 'unusual_behavior' || alertTypeLower === 'unusual_behavior_detected' || alertTypeLower === 'behavior') {
            return Activity; // Unusual Behavior
          }
          
          // Partial matches as fallback
          if (alertTypeLower.includes('risk_zone') || alertTypeLower.includes('high_risk')) {
            return AlertTriangle;
          } else if (alertTypeLower.includes('poaching')) {
            return Shield;
          } else if (alertTypeLower.includes('corridor') || alertTypeLower.includes('exit')) {
            return MapPin;
          } else if (alertTypeLower.includes('movement') || alertTypeLower.includes('rapid')) {
            return Activity;
          } else if (alertTypeLower.includes('battery')) {
            return Battery;
          } else if (alertTypeLower.includes('signal') || alertTypeLower.includes('weak')) {
            return Signal;
          } else if (alertTypeLower.includes('stationary')) {
            return Clock;
          } else if (alertTypeLower.includes('behavior')) {
            return Activity;
          }
          
          return AlertTriangle; // Default
        })();
        
        iconContent = ReactDOMServer.renderToString(
          React.createElement(IconComponent, {
            size: 20,
            color: 'white',
            strokeWidth: 2.5
          })
        );
        break;
      case 'patrol':
      case 'ranger':
        iconContent = ReactDOMServer.renderToString(
          React.createElement(Users, {
            size: 20,
            color: 'white',
            strokeWidth: 2.5
          })
        );
        break;
      default:
      iconContent = ANIMAL_ICONS.DEFAULT;
        break;
  }

  const isEmoji = !iconContent.startsWith('<');
  
  // Enhanced visibility for alert markers
  const isAlert = type === 'alert';
  const borderWidth = isAlert ? '4px' : '3px';
  const shadowIntensity = isAlert ? '0 4px 15px rgba(0,0,0,0.6)' : '0 3px 10px rgba(0,0,0,0.4)';
  const markerSize = isAlert ? '45px' : '40px';
  
  const iconHtml = `
    <div class="custom-wildlife-marker" style="
      width: ${markerSize}; 
      height: ${markerSize}; 
      background-color: ${color}; 
      border: ${borderWidth} solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: ${shadowIntensity};
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
      ${isEmoji ? 'font-size: 22px;' : ''}
      ${isAlert ? 'animation: pulse-alert 2s infinite;' : ''}
    ">
        ${iconContent}
      <div style="
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${color};
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      "></div>
    </div>
    ${isAlert ? `
    <style>
      @keyframes pulse-alert {
        0%, 100% { transform: scale(1); box-shadow: ${shadowIntensity}; }
        50% { transform: scale(1.1); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.8); }
      }
    </style>
    ` : ''}
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-wrapper',
    iconSize: isAlert ? [45, 55] : [40, 50],
    iconAnchor: isAlert ? [22.5, 45] : [20, 40],
    popupAnchor: [0, isAlert ? -45 : -40]
  });
};

// Component to handle map events and display coordinates
const MapEventHandler = ({ onMapClick, showCoordinates }) => {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });

  return position && showCoordinates ? (
    <Popup position={position}>
      <div>
        <strong>Coordinates:</strong><br />
        Latitude: {position.lat.toFixed(6)}<br />
        Longitude: {position.lng.toFixed(6)}
      </div>
    </Popup>
  ) : null;
};

// Kenya-Tanzania Wildlife Corridor bounding box
const KENYA_TANZANIA_BBOX = {
  min_lon: 29.0,
  max_lon: 42.0,
  min_lat: -12.0,
  max_lat: 5.5,
  name: 'Kenya-Tanzania Wildlife Corridor'
};

// Helper functions removed - using only backend data

// Default center for Kenya-Tanzania region
const DEFAULT_CENTER = [-3.25, 35.5]; // Center of Kenya-Tanzania corridor
const DEFAULT_ZOOM = 6;

const MapComponent = ({
  center,
  zoom,
  height = '500px',
  markers = [],
  showGeofence = false,
  geofenceRadius = 50000,
  patrolRoutes = [],
  onMapClick,
  showCoordinates = false,
  className = '',
  hideControls = false,
  hideLegend = false,
  hideMapInfo = false,
  showLegendBox = false,
  // ML Model Integration Props
  predictedPaths = [],
  behavioralStates = {},
  riskHeatmap = [],
  // Enhanced features
  riskZones = [],
  rangerPatrols = [],
  corridors = [], // Dynamic corridors from backend
  showCorridors = false,
  showRiskZones = false,
  showPredictions = false,
  showBehaviorStates = true, // Control behavior state glows
  showEnvironment = false, // Control environment/risk heatmap
  showRangerPatrols = false,
  showAnimalMovement = true,
  season = null,
  onModeChange,
  movementTrail = null,
  isPlayingTrail = false,
  onTrailComplete = null,
  historicalPaths = []
}) => {
  const validCenter = (center && Array.isArray(center) && center.length === 2) ? center : DEFAULT_CENTER;
  const validZoom = zoom || DEFAULT_ZOOM;
  
  const [mapCenter] = useState(validCenter);
  const [mapZoom] = useState(validZoom);
  const mapRef = useRef(null);
  const [visibleSpecies] = useState({ elephant: true, zebra: true, wildebeest: true, wildlife: true });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize();
        } catch (e) {
          console.log('Map resize delayed');
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [height]);

  const defaultMarkers = [];

  const rawMarkers = markers.length > 0 ? markers : defaultMarkers;
  
  // Separate alerts from animals and STRICTLY deduplicate by ID
  const animalMarkers = rawMarkers.filter(m => m.type !== 'alert');
  const allAlertMarkers = rawMarkers.filter(m => m.type === 'alert');
  
  // STRICT deduplication: Use alert ID, or create unique ID from position + timestamp
  const alertMap = new Map();
  const seenPositions = new Set();
  
  allAlertMarkers.forEach(alert => {
    // Create unique ID: prefer alert.id, fallback to position + timestamp
    let alertId = alert.id;
    if (!alertId && alert.position && Array.isArray(alert.position) && alert.position.length === 2) {
      const posKey = `${alert.position[0].toFixed(6)}-${alert.position[1].toFixed(6)}`;
      const timestamp = alert.timestamp || alert.created_at || alert.detected_at || Date.now();
      alertId = `${posKey}-${timestamp}`;
    }
    
    // Only add if we haven't seen this exact alert before
    if (alertId && !alertMap.has(alertId)) {
      alertMap.set(alertId, { ...alert, _uniqueId: alertId });
    } else if (!alertId) {
      // Fallback: use position only if no ID available
      const posKey = alert.position && Array.isArray(alert.position) && alert.position.length === 2
        ? `${alert.position[0].toFixed(6)}-${alert.position[1].toFixed(6)}`
        : `alert-${Math.random()}`;
      if (!seenPositions.has(posKey)) {
        seenPositions.add(posKey);
        alertMap.set(posKey, { ...alert, _uniqueId: posKey });
      }
    }
  });
  
  const alertMarkers = Array.from(alertMap.values());
  
  // Check which alerts are at the same position as animals (within 100m - more accurate)
  const getAlertsForAnimal = (animalPos, alertPos) => {
    if (!animalPos || !Array.isArray(animalPos) || animalPos.length !== 2) return false;
    if (!alertPos || !Array.isArray(alertPos) || alertPos.length !== 2) return false;
    
    // Calculate distance in meters using Haversine formula approximation
    const latDiff = alertPos[0] - animalPos[0];
    const lonDiff = alertPos[1] - animalPos[1];
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Convert to meters
    return distance < 100; // Within 100 meters
  };
  
  // Helper function to calculate offset position for alerts around animals
  const calculateAlertOffset = (centerPos, index, totalAlerts) => {
    if (!centerPos || !Array.isArray(centerPos) || centerPos.length !== 2) {
      return centerPos;
    }
    
    // Small offset to avoid overlap (about 30-50 meters)
    const baseOffset = 0.0005; // ~55 meters at equator
    const radius = baseOffset * (1 + Math.floor(index / 4) * 0.3);
    const angleStep = (2 * Math.PI) / Math.max(4, totalAlerts);
    const angle = index * angleStep;
    
    return [
      centerPos[0] + radius * Math.cos(angle),
      centerPos[1] + radius * Math.sin(angle)
    ];
  };
  
  // Separate alerts into: attached to animals vs standalone (NO DUPLICATES)
  const attachedAlertIds = new Set(); // Track which alert IDs are attached
  const standaloneAlerts = [];
  const offsetAlertMarkers = [];
  
  // Process alerts: attach to animals OR standalone (NEVER BOTH)
  // Use consistent ID calculation throughout
  alertMarkers.forEach(alert => {
    if (!alert.position || !Array.isArray(alert.position) || alert.position.length !== 2) return;
    
    // Get consistent unique ID (use the one we set during deduplication)
    const alertId = alert._uniqueId || alert.id || `${alert.position[0].toFixed(6)}-${alert.position[1].toFixed(6)}`;
    
    // Check if this alert is near any animal
    let isNearAnimal = false;
    let nearestAnimal = null;
    let minDistance = Infinity;
    
    animalMarkers.forEach(animal => {
      if (!animal.position || !Array.isArray(animal.position) || animal.position.length !== 2) return;
      
      if (getAlertsForAnimal(animal.position, alert.position)) {
        const distance = Math.sqrt(
          Math.pow(alert.position[0] - animal.position[0], 2) + 
          Math.pow(alert.position[1] - animal.position[1], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestAnimal = animal;
          isNearAnimal = true;
        }
      }
    });
    
    // If near an animal, add as offset marker (ONLY ONCE)
    if (isNearAnimal && nearestAnimal && !attachedAlertIds.has(alertId)) {
      attachedAlertIds.add(alertId);
      
      // Count existing alerts for this animal
      const existingAlerts = offsetAlertMarkers.filter(m => m.animalId === nearestAnimal.id);
      const offsetPos = calculateAlertOffset(nearestAnimal.position, existingAlerts.length, existingAlerts.length + 1);
      
      offsetAlertMarkers.push({
        ...alert,
        _uniqueId: alertId,
        position: offsetPos,
        animalPosition: nearestAnimal.position,
        animalId: nearestAnimal.id,
        animalName: nearestAnimal.title || nearestAnimal.name
      });
    } else if (!isNearAnimal && !attachedAlertIds.has(alertId)) {
      // Not near any animal, add as standalone (ONLY if not already attached)
      standaloneAlerts.push({ ...alert, _uniqueId: alertId });
    }
  });
  
  const displayMarkers = animalMarkers.filter(m => {
    const type = (m.type || 'wildlife').toLowerCase();
    if (type.includes('elephant')) return visibleSpecies.elephant;
    if (type.includes('zebra')) return visibleSpecies.zebra;
    if (type.includes('wildebeest')) return visibleSpecies.wildebeest;
    return visibleSpecies.wildlife;
  });

  // No demo patrol routes - using only real backend data
  const defaultPatrolRoutes = [];

  const displayRoutes = patrolRoutes.length > 0 ? patrolRoutes : defaultPatrolRoutes;

  try {
    return (
      <div className={`map-container ${className}`}>

      {/* Map Container */}
      <div style={{ 
        height: height === '100%' ? '500px' : height,
        width: '100%',
        position: 'relative',
        background: '#e5e7eb'
      }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          maxBounds={[
            [KENYA_TANZANIA_BBOX.min_lat, KENYA_TANZANIA_BBOX.min_lon],
            [KENYA_TANZANIA_BBOX.max_lat, KENYA_TANZANIA_BBOX.max_lon]
          ]}
          maxBoundsViscosity={0.5}
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          ref={mapRef}
          zoomControl={hideControls ? false : true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          zoomAnimation={true}
          zoomAnimationThreshold={8}
          fadeAnimation={true}
          whenCreated={(map) => {
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
          }}
        >
          {/* Base Layer - Satellite imagery */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          />

          {/* Subtle terrain hillshade */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            opacity={0.25}
          />

          {/* Subtle ocean base tint */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            opacity={0.15}
          />

          {/* Optional Street Layer */}
          {/* Uncomment to add street overlay */}
          {/* 
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.webp"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            opacity={0.3}
          />
          */}

          {/* Map Controller - Removed to prevent re-render issues */}

          {/* Event Handler */}
          <MapEventHandler onMapClick={onMapClick} showCoordinates={showCoordinates} />

          {/* Predicted Movement Paths - BBMM/LSTM Models */}
          {showPredictions && predictedPaths && Array.isArray(predictedPaths) && predictedPaths.length > 0 && (() => {
            return predictedPaths.map((prediction, idx) => {
              if (!prediction.path || prediction.path.length < 2) {
                return null;
              }
              return (
                <PredictedPath
                  key={`prediction-${idx}`}
                  path={prediction.path}
                  confidence={prediction.confidence}
                  model={prediction.model}
                  color={COLORS.info}
                />
              );
            }).filter(Boolean);
          })()}

          {/* Risk Heatmap - XGBoost Model (Environment) */}
          {showEnvironment && riskHeatmap && Array.isArray(riskHeatmap) && riskHeatmap.length > 0 && (() => {
            return riskHeatmap.filter(risk => {
              const isValid = risk.position && isValidCoordinate(risk.position);
              return isValid;
            }).map((risk, idx) => (
              <RiskHeatmapPoint
                key={`risk-${idx}`}
                position={risk.position}
                intensity={risk.intensity}
                type={risk.type}
                suitability={risk.suitability}
                status={risk.status}
                message={risk.message}
              />
            ));
          })()}

          {/* Behavioral State Glows - HMM Model */}
          {showBehaviorStates && behavioralStates && Object.keys(behavioralStates).length > 0 && displayMarkers.filter(marker => {
            const hasPosition = marker.position && isValidCoordinate(marker.position);
            const hasBehaviorState = behavioralStates[marker.id];
            return hasPosition && hasBehaviorState;
          }).map((marker) => {
            const behaviorState = behavioralStates[marker.id];
            if (!behaviorState) return null;
            
            return (
              <BehaviorGlow
                key={`behavior-${marker.id}`}
                position={marker.position}
                state={behaviorState.state}
                confidence={behaviorState.confidence}
              />
            );
          })}

          {/* Movement Arrows - Show predicted movement for moving animals */}
          {showPredictions && displayMarkers.filter(marker => 
            marker.position && 
            isValidCoordinate(marker.position) && 
            marker.predictedPosition && 
            isValidCoordinate(marker.predictedPosition) &&
            marker.speed > 0.5 && // Only show for moving animals
            (marker.position[0] !== marker.predictedPosition[0] || marker.position[1] !== marker.predictedPosition[1])
          ).map((marker) => {
            // Determine arrow color based on activity type
            const arrowColor = marker.activityType === 'moving' ? '#9333ea' : marker.activityType === 'feeding' ? '#65a30d' : '#7c3aed';
            
            return (
              <React.Fragment key={`movement-${marker.id}`}>
                {/* Solid line from current to predicted position */}
                <Polyline
                  positions={[marker.position, marker.predictedPosition]}
                  pathOptions={{
                    color: arrowColor,
                    weight: 3,
                    opacity: 0.7,
                    dashArray: marker.activityType === 'feeding' ? '5, 5' : undefined
                  }}
                />
                {/* Small circle at predicted position */}
                <Circle
                  center={marker.predictedPosition}
                  radius={50}
                  pathOptions={{
                    color: arrowColor,
                    fillColor: arrowColor,
                    fillOpacity: 0.3,
                    weight: 2,
                    opacity: 0.6
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>
                      Predicted Position<br/>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{marker.activityType || 'Moving'}</span>
                    </div>
                  </Tooltip>
                </Circle>
              </React.Fragment>
            );
          })}

          {/* Markers with pulse and optional heading arrow */}
          {displayMarkers.filter(marker => marker.position && isValidCoordinate(marker.position)).map((marker) => {
            // Handle color - convert CSS variables to actual colors if needed
            let markerColor = marker.color || '#2E5D45';
            if (typeof markerColor === 'string' && markerColor.includes('var(--')) {
              // Convert CSS variables to actual hex colors
              if (markerColor.includes('--brand-primary') || markerColor.includes('--forest-green')) {
                markerColor = '#2E5D45';
              } else if (markerColor.includes('--status-error')) {
                markerColor = '#EF4444';
              } else if (markerColor.includes('--status-warning')) {
                markerColor = '#F59E0B';
              } else if (markerColor.includes('--status-info')) {
                markerColor = '#3B82F6';
              } else if (markerColor.includes('--ochre')) {
                markerColor = '#E8961C';
              } else if (markerColor.includes('--burnt-orange')) {
                markerColor = '#D84315';
              }
            }
            
            return (
              <AnimatedMarker
                key={marker.id}
                marker={{ ...marker, showAnimalMovement }}
                icon={createCustomIcon(markerColor, marker.type || 'wildlife')}
              >
                <Popup maxWidth={300} maxHeight={400}>
                  <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif' }}>
                    {/* Animal Name */}
                    <h3 style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: '#1F2937',
                      margin: '0 0 12px 0',
                      borderBottom: '2px solid #e5e7eb',
                      paddingBottom: '8px'
                    }}>
                      {marker.popupContent?.title || marker.title || 'Animal'}
                    </h3>
                    
                    {/* Quick Info Grid */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '75px 1fr', 
                        gap: '8px',
                        fontSize: '13px'
                      }}>
                        <strong>Species:</strong>
                        <span>{marker.type || 'Unknown'}</span>
                        
                        <strong>Activity:</strong>
                        <span style={{ 
                          color: marker.activityType === 'moving' ? '#9333ea' : 
                                 marker.activityType === 'feeding' ? '#65a30d' : '#6b7280',
                          fontWeight: 600
                        }}>
                          {marker.activityType || 'Unknown'}
                        </span>
                        
                        <strong>Latitude:</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {marker.position[0].toFixed(6)}°
                        </span>
                        
                        <strong>Longitude:</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {marker.position[1].toFixed(6)}°
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </AnimatedMarker>
            );
          })}

          {/* Alert Markers with Offset Positions (attached to animals) - Icon-based, human-friendly */}
          {offsetAlertMarkers.filter(alert => alert.position && isValidCoordinate(alert.position)).map((alert) => {
            const severity = alert.severity || 'medium';
            const alertType = alert.alert_type || alert.type || 'general';
            
            // Color based on severity
            let alertColor = '#F59E0B'; // Orange for medium
            if (severity === 'critical') {
              alertColor = '#DC2626'; // Red for critical
            } else if (severity === 'high') {
              alertColor = '#EA580C'; // Orange-red for high
            } else if (severity === 'low') {
              alertColor = '#3B82F6'; // Blue for low
            }
            
            // Choose icon based on alert type - more human and intuitive
            let AlertIcon = AlertTriangle;
            let iconSize = 18;
            
            if (alertType.includes('emergency') || alertType.includes('emergency_report')) {
              AlertIcon = Siren;
              iconSize = 20;
            } else if (alertType.includes('conflict') || alertType.includes('danger_zone')) {
              AlertIcon = Flame;
              iconSize = 19;
            } else if (alertType.includes('exit') || alertType.includes('corridor')) {
              AlertIcon = MapPin;
              iconSize = 18;
            } else if (alertType.includes('health') || alertType.includes('injury')) {
              AlertIcon = Activity;
              iconSize = 18;
            } else if (alertType.includes('poacher') || alertType.includes('security')) {
              AlertIcon = Shield;
              iconSize = 19;
            } else if (alertType.includes('battery') || alertType.includes('signal')) {
              AlertIcon = Battery;
              iconSize = 17;
            } else if (severity === 'critical') {
              AlertIcon = AlertOctagon;
              iconSize = 20;
            } else if (severity === 'high') {
              AlertIcon = AlertCircle;
              iconSize = 19;
            }
            
            // Create simple, clean alert marker - no flickering, minimal design
            const alertIconHtml = `
              <div style="display: flex; align-items: center; justify-content: center;">
                <div style="
                  width: 28px; 
                  height: 28px; 
                  background: ${alertColor}; 
                  border: 2px solid white; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  box-shadow: 0 2px 6px ${alertColor}80;
                  cursor: pointer;
                ">
                  ${ReactDOMServer.renderToString(
                    React.createElement(AlertIcon, {
                      size: iconSize,
                      color: 'white',
                      strokeWidth: 2,
                      fill: 'none'
                    })
                  )}
                </div>
              </div>
            `;
            
            const alertId = alert._uniqueId || alert.id || `${alert.position?.[0]?.toFixed(6)}-${alert.position?.[1]?.toFixed(6)}`;
            return (
              <Marker
                key={`alert-offset-${alertId}`}
                position={alert.position}
                icon={L.divIcon({
                  html: alertIconHtml,
                  className: 'alert-marker-icon-only',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                  popupAnchor: [0, -14]
                })}
                zIndexOffset={100}
              >
                <Popup maxWidth={300} maxHeight={400}>
                  <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif' }}>
                    <h3 style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: alertColor,
                      margin: '0 0 12px 0',
                      borderBottom: `2px solid ${alertColor}`,
                      paddingBottom: '8px'
                    }}>
                      {alert.title || 'Alert'}
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '90px 1fr', 
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <strong>Severity:</strong>
                      <span style={{ color: alertColor, fontWeight: 700, textTransform: 'uppercase' }}>
                        {severity}
                      </span>
                      <strong>Type:</strong>
                      <span style={{ fontSize: '12px', textTransform: 'capitalize', fontWeight: 600 }}>
                        {alert.alert_type ? alert.alert_type.replace(/_/g, ' ') : 'Alert'}
                      </span>
                      {alert.animalName && (
                        <>
                          <strong>Animal:</strong>
                          <span>{alert.animalName}</span>
                        </>
                      )}
                      {alert.conflictZoneName && (
                        <>
                          <strong>Conflict Zone:</strong>
                          <span style={{ fontWeight: 600, color: alertColor }}>{alert.conflictZoneName}</span>
                        </>
                      )}
                      <strong>Location:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {alert.position[0].toFixed(4)}, {alert.position[1].toFixed(4)}
                      </span>
                      {alert.timestamp && (
                        <>
                          <strong>Time:</strong>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    {(alert.description || alert.message) && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px',
                        background: '#F9FAFB',
                        borderRadius: '6px',
                        fontSize: '12px', 
                        color: '#374151',
                        borderLeft: `3px solid ${alertColor}`
                      }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: alertColor }}>
                          Description:
                        </strong>
                        {alert.description || alert.message}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Standalone Alert Markers (not attached to animals) - Icon-based, human-friendly */}
          {standaloneAlerts.filter(alert => alert.position && isValidCoordinate(alert.position)).map((alert) => {
            const severity = alert.severity || 'medium';
            const alertType = alert.alert_type || alert.type || 'general';
            
            // Color based on severity
            let alertColor = '#F59E0B'; // Orange for medium
            if (severity === 'critical') {
              alertColor = '#DC2626'; // Red for critical
            } else if (severity === 'high') {
              alertColor = '#EA580C'; // Orange-red for high
            } else if (severity === 'low') {
              alertColor = '#3B82F6'; // Blue for low
            }
            
            // Choose icon based on alert type - more human and intuitive
            let AlertIcon = AlertTriangle;
            let iconSize = 20;
            
            if (alertType.includes('emergency') || alertType.includes('emergency_report')) {
              AlertIcon = Siren;
              iconSize = 22;
            } else if (alertType.includes('conflict') || alertType.includes('danger_zone')) {
              AlertIcon = Flame;
              iconSize = 21;
            } else if (alertType.includes('exit') || alertType.includes('corridor')) {
              AlertIcon = MapPin;
              iconSize = 20;
            } else if (alertType.includes('health') || alertType.includes('injury')) {
              AlertIcon = Activity;
              iconSize = 20;
            } else if (alertType.includes('poacher') || alertType.includes('security')) {
              AlertIcon = Shield;
              iconSize = 21;
            } else if (alertType.includes('battery') || alertType.includes('signal')) {
              AlertIcon = Battery;
              iconSize = 19;
            } else if (severity === 'critical') {
              AlertIcon = AlertOctagon;
              iconSize = 22;
            } else if (severity === 'high') {
              AlertIcon = AlertCircle;
              iconSize = 21;
            }
            
            // Create simple, clean alert marker - no flickering, minimal design
            const alertIconHtml = `
              <div style="display: flex; align-items: center; justify-content: center;">
                <div style="
                  width: 30px; 
                  height: 30px; 
                  background: ${alertColor}; 
                  border: 2px solid white; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  box-shadow: 0 2px 6px ${alertColor}80;
                  cursor: pointer;
                ">
                  ${ReactDOMServer.renderToString(
                    React.createElement(AlertIcon, {
                      size: iconSize,
                      color: 'white',
                      strokeWidth: 2,
                      fill: 'none'
                    })
                  )}
                </div>
              </div>
            `;
            
            const alertId = alert._uniqueId || alert.id || `${alert.position?.[0]?.toFixed(6)}-${alert.position?.[1]?.toFixed(6)}`;
            return (
              <Marker
                key={`alert-standalone-${alertId}`}
                position={alert.position}
                icon={L.divIcon({
                  html: alertIconHtml,
                  className: 'alert-marker-icon-only',
                  iconSize: [30, 30],
                  iconAnchor: [15, 15],
                  popupAnchor: [0, -15]
                })}
                zIndexOffset={100}
              >
                <Popup maxWidth={300} maxHeight={400}>
                  <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif' }}>
                    <h3 style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: alertColor,
                      margin: '0 0 12px 0',
                      borderBottom: `2px solid ${alertColor}`,
                      paddingBottom: '8px'
                    }}>
                      {alert.title || 'Alert'}
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '90px 1fr', 
                      gap: '8px',
                      fontSize: '13px'
                    }}>
                      <strong>Severity:</strong>
                      <span style={{ color: alertColor, fontWeight: 700, textTransform: 'uppercase' }}>
                        {severity}
                      </span>
                      <strong>Type:</strong>
                      <span style={{ fontSize: '12px', textTransform: 'capitalize', fontWeight: 600 }}>
                        {alert.alert_type ? alert.alert_type.replace(/_/g, ' ') : 'Alert'}
                      </span>
                      {alert.animalName && (
                        <>
                          <strong>Animal:</strong>
                          <span>{alert.animalName}</span>
                        </>
                      )}
                      {alert.conflictZoneName && (
                        <>
                          <strong>Conflict Zone:</strong>
                          <span style={{ fontWeight: 600, color: alertColor }}>{alert.conflictZoneName}</span>
                        </>
                      )}
                      <strong>Location:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {alert.position[0].toFixed(4)}, {alert.position[1].toFixed(4)}
                      </span>
                      {alert.timestamp && (
                        <>
                          <strong>Time:</strong>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                    {(alert.description || alert.message) && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px',
                        background: '#F9FAFB',
                        borderRadius: '6px',
                        fontSize: '12px', 
                        color: '#374151',
                        borderLeft: `3px solid ${alertColor}`
                      }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: alertColor }}>
                          Description:
                        </strong>
                        {alert.description || alert.message}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Geofence (Protected Area) */}
          {showGeofence && (
            <Circle
              center={mapCenter}
              radius={geofenceRadius}
              pathOptions={{
                color: 'var(--brand-primary)',
                fillColor: 'var(--brand-primary)',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 10'
              }}
            />
          )}

          {/* Patrol Routes */}
          {displayRoutes.filter(route => isValidPath(route)).map((route, index) => (
            <React.Fragment key={`route-fragment-${index}`}>
              <Polyline
                positions={route}
                pathOptions={{ color: 'rgba(232,150,28,0.3)', weight: 10, opacity: 0.6 }}
              />
            <Polyline
              positions={route}
              pathOptions={{
                color: MAP_COLORS.ROUTE,
                weight: 3,
                  opacity: 0.9,
                  dashArray: '10, 5',
                  className: 'corridor-glow'
              }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false} className="!rounded-md !bg-white !px-2 !py-1 !text-xs !shadow">
                  Patrol route
                </Tooltip>
              </Polyline>
            </React.Fragment>
          ))}

          {/* Wildlife Corridors - Layer 1: Corridor Boundaries (Polygons) */}
          {/* Show as polygons with semi-transparent fill and dashed borders */}
          {showCorridors && corridors && Array.isArray(corridors) && corridors.map((corridor, idx) => {
            // Try to get polygon coordinates from geometry or boundary
            let polygonCoords = null;
            
            if (corridor.geometry && corridor.geometry.coordinates) {
              // GeoJSON Polygon format: [[[lng, lat], [lng, lat], ...]]
              const coords = corridor.geometry.coordinates;
              if (Array.isArray(coords) && coords.length > 0) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                  // Polygon: [[[lng, lat], ...]]
                  polygonCoords = coords[0].map(coord => {
                    // Swap if needed: GeoJSON is [lng, lat], Leaflet needs [lat, lng]
                    if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
                      return [coord[0], coord[1]]; // Already [lat, lng]
                    }
                    return [coord[1], coord[0]]; // Swap [lng, lat] to [lat, lng]
                  });
                }
              }
            } else if (corridor.boundary && Array.isArray(corridor.boundary)) {
              // Direct boundary array
              polygonCoords = corridor.boundary.map(p => {
                if (Array.isArray(p)) {
                  return [p[0] || p.lat, p[1] || p.lon];
                }
                return [p.lat, p.lon];
              });
            } else if (corridor.path && corridor.path.length >= 3) {
              // Create a buffer polygon around the path
              const path = corridor.path.map(p => [p.lat || p[0], p.lon || p[1]]);
              // Create a simple buffer by offsetting points perpendicular to the path
              const bufferDistance = 0.01; // ~1.1km buffer
              const bufferedCoords = [];
              
              // Add buffer to each segment
              for (let i = 0; i < path.length; i++) {
                const point = path[i];
                const nextPoint = path[i + 1] || point;
                const prevPoint = path[i - 1] || point;
                
                // Calculate perpendicular direction
                const dx = nextPoint[1] - prevPoint[1];
                const dy = nextPoint[0] - prevPoint[0];
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                  const perpX = -dy / length;
                  const perpY = dx / length;
                  bufferedCoords.push([
                    point[0] + perpX * bufferDistance,
                    point[1] + perpY * bufferDistance
                  ]);
                } else {
                  bufferedCoords.push([point[0], point[1]]);
                }
              }
              
              // Add reverse side
              for (let i = path.length - 1; i >= 0; i--) {
                const point = path[i];
                const nextPoint = path[i + 1] || point;
                const prevPoint = path[i - 1] || point;
                
                const dx = nextPoint[1] - prevPoint[1];
                const dy = nextPoint[0] - prevPoint[0];
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                  const perpX = dy / length;
                  const perpY = -dx / length;
                  bufferedCoords.push([
                    point[0] + perpX * bufferDistance,
                    point[1] + perpY * bufferDistance
                  ]);
                } else {
                  bufferedCoords.push([point[0], point[1]]);
                }
              }
              
              // Close the polygon
              if (bufferedCoords.length > 0) {
                bufferedCoords.push(bufferedCoords[0]);
              }
              
              polygonCoords = bufferedCoords;
            }
            
            // Determine color based on species
            const fillColor = corridor.species === 'elephant' ? '#3b82f6' : '#8b5cf6';
            const borderColor = corridor.species === 'elephant' ? '#2563eb' : '#7c3aed';
            
            // Calculate center point for label
            let centerPoint = null;
            if (polygonCoords && polygonCoords.length >= 3) {
              // Calculate centroid of polygon
              let sumLat = 0, sumLon = 0;
              polygonCoords.forEach(coord => {
                sumLat += coord[0];
                sumLon += coord[1];
              });
              centerPoint = [sumLat / polygonCoords.length, sumLon / polygonCoords.length];
            } else if (corridor.path && corridor.path.length > 0) {
              // Use midpoint of path
              const midIdx = Math.floor(corridor.path.length / 2);
              const midPoint = corridor.path[midIdx];
              centerPoint = [midPoint.lat || midPoint[0], midPoint.lon || midPoint[1]];
            } else if (corridor.start_point && corridor.end_point) {
              // Use midpoint between start and end
              const startLat = corridor.start_point.lat || corridor.start_point[0] || 0;
              const startLon = corridor.start_point.lon || corridor.start_point[1] || 0;
              const endLat = corridor.end_point.lat || corridor.end_point[0] || 0;
              const endLon = corridor.end_point.lon || corridor.end_point[1] || 0;
              centerPoint = [(startLat + endLat) / 2, (startLon + endLon) / 2];
            }
            
            // Render as polygon if we have coordinates
            if (polygonCoords && polygonCoords.length >= 3) {
              return (
                <React.Fragment key={`corridor-${corridor.id || idx}`}>
                  <Polygon
                    positions={polygonCoords}
                    pathOptions={{
                      color: borderColor,
                      fillColor: fillColor,
                      fillOpacity: 0.2, // 20% opacity as requested
                      weight: 2,
                      opacity: 0.7,
                      dashArray: '10, 5' // Dashed border
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '10px', minWidth: '200px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: borderColor }}>
                          {corridor.name}
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Species: {corridor.species}
                        </div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                          Score: {corridor.optimization_score?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                  {/* Corridor Name Label - Truncated */}
                  {centerPoint && (() => {
                    const maxLength = 20; // Max characters before truncation
                    const corridorName = corridor.name || 'Corridor';
                    const truncatedName = corridorName.length > maxLength 
                      ? corridorName.substring(0, maxLength - 3) + '...' 
                      : corridorName;
                    
                    // Calculate width based on text length (approx 7px per character)
                    const textWidth = Math.min(corridorName.length * 7 + 16, maxLength * 7 + 16);
                    
                    return (
                      <Marker
                        position={centerPoint}
                        icon={L.divIcon({
                          html: `<div style="
                            background: ${fillColor};
                            color: white;
                            padding: 6px 10px;
                            border-radius: 6px;
                            font-size: 11px;
                            font-weight: 700;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            max-width: ${textWidth}px;
                            border: 2px solid ${borderColor};
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            text-align: center;
                            cursor: pointer;
                          " title="${corridorName}">${truncatedName}</div>`,
                          className: 'corridor-label',
                          iconSize: [textWidth, 30],
                          iconAnchor: [textWidth / 2, 15]
                        })}
                        zIndexOffset={100}
                      >
                        <Tooltip permanent={false}>
                          <div style={{ fontWeight: 700, fontSize: '12px' }}>{corridorName}</div>
                        </Tooltip>
                      </Marker>
                    );
                  })()}
                </React.Fragment>
              );
            }
            
            // Fallback to polyline if no polygon data available
            const path = corridor.path?.map(p => [p.lat || p[0], p.lon || p[1]]) || [];
            if (path.length < 2) return null;
            
            // Calculate center for label if not already set
            if (!centerPoint && path.length > 0) {
              const midIdx = Math.floor(path.length / 2);
              centerPoint = path[midIdx];
            }
            
            return (
              <React.Fragment key={`corridor-${corridor.id || idx}`}>
                <Polyline
                  positions={path}
                  pathOptions={{
                    color: borderColor,
                    weight: 3,
                    opacity: 0.6,
                    dashArray: '10, 10'
                  }}
                >
                  <Popup>
                    <div style={{ padding: '10px', minWidth: '200px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: borderColor }}>
                        {corridor.name} (Path Only)
                      </div>
                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        Species: {corridor.species}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontStyle: 'italic' }}>
                        Note: Polygon boundary not available
                      </div>
                    </div>
                  </Popup>
                </Polyline>
                {/* Corridor Name Label - Truncated */}
                {centerPoint && (() => {
                  const maxLength = 20;
                  const corridorName = corridor.name || 'Corridor';
                  const truncatedName = corridorName.length > maxLength 
                    ? corridorName.substring(0, maxLength - 3) + '...' 
                    : corridorName;
                  
                  const textWidth = Math.min(corridorName.length * 7 + 16, maxLength * 7 + 16);
                  
                  return (
                    <Marker
                      position={centerPoint}
                      icon={L.divIcon({
                        html: `<div style="
                          background: ${fillColor};
                          color: white;
                          padding: 6px 10px;
                          border-radius: 6px;
                          font-size: 11px;
                          font-weight: 700;
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          max-width: ${textWidth}px;
                          border: 2px solid ${borderColor};
                          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                          text-align: center;
                          cursor: pointer;
                        " title="${corridorName}">${truncatedName}</div>`,
                        className: 'corridor-label',
                        iconSize: [textWidth, 30],
                        iconAnchor: [textWidth / 2, 15]
                      })}
                      zIndexOffset={100}
                    >
                      <Tooltip permanent={false}>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{corridorName}</div>
                      </Tooltip>
                    </Marker>
                  );
                })()}
              </React.Fragment>
            );
          })}

          {/* Static Corridor Zones (Backup - shown if no backend corridors) */}
          {showCorridors && (!corridors || corridors.length === 0) && (
          <>
          <Rectangle
            bounds={[[-2.96, 37.25], [-2.65, 38.02]]}
            pathOptions={{
              color: '#2563eb',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              dashArray: '5, 3'
            }}
              >
            <Popup>
              <div style={{ padding: '14px', minWidth: '320px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#2563eb', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#2563eb" />
                  Kimana-Kuku Corridor
      </div>
                <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px', lineHeight: '1.6' }}>
                  Critical elephant dispersal corridor within the Amboseli-Tsavo ecosystem. This corridor enables seasonal movement between protected areas and is vital for maintaining genetic diversity and access to water resources.
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>Start</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Amboseli NP</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>2.65°S, 37.25°E</div>
              </div>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>End</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Tsavo West NP</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>2.96°S, 38.02°E</div>
              </div>
              </div>
                <div style={{ fontSize: '11px', padding: '6px 8px', background: '#f9fafb', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' }}>Species:</div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: '1.5' }}>African Elephants (critical), Lions, Cheetahs, Leopards, Wildebeest, Zebras, Elands, African Wild Dogs</div>
            </div>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, padding: '8px', background: '#2563eb10', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#2563eb" />
                  Protected Dispersal Area - Kenya
          </div>
              </div>
            </Popup>
          </Rectangle>
          
          {/* 2. Great Migration Route / Mara-Serengeti Trans-boundary (Kenya-Tanzania) - Real Coordinates */}
          <Rectangle
            bounds={[[-2.3, 34.8], [-1.5, 35.2]]}
            pathOptions={{
              color: '#2563eb',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              dashArray: '5, 3'
            }}
          >
            <Popup>
              <div style={{ padding: '14px', minWidth: '340px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#2563eb', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#2563eb" />
                  Great Migration Route (Mara River Area)
            </div>
                <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px', lineHeight: '1.6' }}>
                  The world-famous Great Migration trans-boundary corridor connecting Serengeti National Park (Tanzania) to Maasai Mara National Reserve (Kenya). Key crossing point at the Mara River.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>Start</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Serengeti NP (TZ)</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>2.3°S, 34.8°E</div>
              </div>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>End</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Maasai Mara NR (KE)</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>1.5°S, 35.2°E</div>
                </div>
              </div>
                <div style={{ fontSize: '11px', padding: '6px 8px', background: '#f9fafb', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' }}>Species:</div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: '1.5' }}>Wildebeest & Zebra (millions during migration), Lions, Cheetahs, Leopards, African Elephants, various plains game</div>
                </div>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, padding: '8px', background: '#2563eb10', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#2563eb" />
                  Trans-boundary Protected Corridor - Kenya & Tanzania
              </div>
            </div>
            </Popup>
          </Rectangle>

          {/* 3. Kwakuchinja Corridor / Tarangire-Manyara (Tanzania) - Real Coordinates */}
          <Rectangle
            bounds={[[-3.83, 35.8], [-3.6, 36.0]]}
            pathOptions={{
              color: '#2563eb',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 0.08,
              dashArray: '5, 3'
            }}
          >
            <Popup>
              <div style={{ padding: '14px', minWidth: '330px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#2563eb', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#2563eb" />
                  Kwakuchinja Corridor
            </div>
                <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px', lineHeight: '1.6' }}>
                  Primary wildlife corridor connecting Tarangire National Park to Lake Manyara National Park. Critical for seasonal elephant migrations and supports globally significant populations. Part of the Manyara Ranch dispersal area.
              </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>Start</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Tarangire NP</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>3.83°S, 36.0°E</div>
                </div>
                  <div style={{ fontSize: '11px', padding: '6px 8px', background: '#05966915', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: '2px' }}>End</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '10px' }}>Lake Manyara NP</div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '9px', fontFamily: 'monospace' }}>3.6°S, 35.8°E</div>
              </div>
                </div>
                <div style={{ fontSize: '11px', padding: '6px 8px', background: '#f9fafb', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' }}>Species:</div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: '1.5' }}>African Elephants (globally significant population), Wildebeest, Zebras, Lions, Cheetahs, Leopards, African Wild Dogs, Impala</div>
                </div>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, padding: '8px', background: '#2563eb10', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#2563eb" />
                  Seasonal Migration Route - Tanzania
                </div>
              </div>
            </Popup>
          </Rectangle>
          </>
          )}

          {/* Historical Movement Paths (Last 24 hours) */}
          {historicalPaths && Array.isArray(historicalPaths) && historicalPaths.map((pathData, idx) => {
            if (!pathData.path || pathData.path.length < 2) return null;
            
            return (
              <Polyline
                key={`historical-path-${pathData.animalId || idx}`}
                positions={pathData.path}
                pathOptions={{
                  color: pathData.color || '#8b5cf6',
                  weight: 3,
                  opacity: 0.6,
                  dashArray: '5, 5'
                }}
              >
                <Tooltip>
                  <div style={{ fontSize: '11px', fontWeight: 600 }}>
                    {pathData.animalName || 'Animal'} - Historical Path
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      Last 24 hours ({pathData.path.length} points)
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Layer 2: Conflict Zones (Polygons or Circles) - High-risk areas */}
          {showRiskZones && riskZones && Array.isArray(riskZones) && riskZones.length > 0 && (() => {
            return riskZones.map((zone, idx) => {
              // Check if zone has polygon geometry
              let polygonCoords = null;
              
              if (zone.geometry && zone.geometry.coordinates) {
                const coords = zone.geometry.coordinates;
                // GeoJSON Polygon: [[[lng, lat], [lng, lat], ...]]
                if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                  polygonCoords = coords[0].map(coord => {
                    // Swap [lng, lat] to [lat, lng] for Leaflet
                    if (Math.abs(coord[0]) <= 90 && Math.abs(coord[1]) > 90) {
                      return [coord[0], coord[1]]; // Already [lat, lng]
                    }
                    return [coord[1], coord[0]]; // Swap
                  });
                }
              }
              
              // If we have polygon coordinates, render as polygon
              if (polygonCoords && polygonCoords.length >= 3) {
                return (
                  <Polygon
                    key={`conflict-polygon-${zone.id || idx}`}
                    positions={polygonCoords}
                    pathOptions={{
                      color: '#991b1b', // Dark red border
                      fillColor: '#DC2626', // Red fill
                      fillOpacity: 0.4, // 40% opacity - highly visible
                      weight: 3,
                      opacity: 0.8,
                      dashArray: '8, 4'
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '12px', minWidth: '200px' }}>
                        <div style={{
                          fontWeight: 700, 
                          fontSize: '14px', 
                          marginBottom: '8px', 
                          color: MAP_COLORS.DANGER,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertTriangle size={16} />
                          {zone.name || `High-Risk Zone ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          <strong>Type:</strong> {zone.zone_type || 'Poaching Activity'}
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          <strong>Threat Level:</strong> {zone.risk_level || 'High'}
                        </div>
                        {zone.description && (
                          <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '8px', fontStyle: 'italic' }}>
                            {zone.description}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Polygon>
                );
              }
              
              // Fallback to Circle if no polygon data
              let position = null;
              
              if (zone.geometry && zone.geometry.coordinates) {
                const coords = zone.geometry.coordinates;
                if (Array.isArray(coords)) {
                  // Point: [lng, lat]
                  if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
                    if (Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) > 90) {
                      position = [coords[0], coords[1]];
                    } else {
                      position = [coords[1], coords[0]];
                    }
                  } else if (coords.length > 0 && Array.isArray(coords[0])) {
                    const firstCoord = coords[0];
                    if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
                      if (Math.abs(firstCoord[0]) <= 90 && Math.abs(firstCoord[1]) > 90) {
                        position = [firstCoord[0], firstCoord[1]];
                      } else {
                        position = [firstCoord[1], firstCoord[0]];
                      }
                    }
                  }
                }
              }
              
              if (!position) {
                position = zone.position || zone.coordinates || [0, 0];
                if (position[0] && Math.abs(position[0]) > 90) {
                  position = [position[1], position[0]];
                }
              }
              
              if (!position || (position[0] === 0 && position[1] === 0)) {
                return null;
              }
              
              if (!isValidCoordinate(position)) {
                return null;
              }
              
              const bufferKm = zone.buffer_distance_km || 5;
              const radius = bufferKm * 1000;
              
              return (
                <Circle
                  key={`conflict-circle-${zone.id || idx}`}
                  center={position}
                  radius={radius}
                  pathOptions={{
                    color: '#991b1b', // Dark red border
                    fillColor: '#DC2626', // Red fill
                    fillOpacity: 0.4, // 40% opacity - highly visible
                    weight: 3,
                    opacity: 0.8
                  }}
                >
                <Popup>
                  <div style={{ padding: '12px', minWidth: '200px' }}>
                <div style={{
                      fontWeight: 700, 
                      fontSize: '14px', 
                      marginBottom: '8px', 
                      color: MAP_COLORS.DANGER,
                  display: 'flex',
                  alignItems: 'center',
                      gap: '6px'
                }}>
                      <AlertTriangle size={16} />
                      {zone.name || `High-Risk Zone ${idx + 1}`}
                </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>Type:</strong> {zone.type || 'Poaching Activity'}
              </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>Threat Level:</strong> {zone.threat_level || 'High'}
            </div>
                    {zone.description && (
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '8px', fontStyle: 'italic' }}>
                        {zone.description}
          </div>
      )}
      </div>
                </Popup>
              </Circle>
            );
          }).filter(Boolean);
          })()}

          {/* Ranger Patrol Routes and Markers */}
          {showRangerPatrols && rangerPatrols && Array.isArray(rangerPatrols) && rangerPatrols.map((patrol, idx) => {
            // Check if this is a route with polyline or just a position marker
            const hasRoute = patrol.route && isValidPath(patrol.route);
            const hasPosition = patrol.current_position && isValidCoordinate(patrol.current_position);
            
            if (!hasRoute && !hasPosition) return null;
            
            return (
              <React.Fragment key={`patrol-${patrol.id || idx}`}>
                {/* Draw route polyline if available */}
                {hasRoute && (
                  <Polyline
                    positions={patrol.route}
                    pathOptions={{
                      color: MAP_COLORS.RANGER_PATROL,
                      weight: 6,
                      opacity: 0.9,
                      dashArray: '15, 8'
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Shield size={16} color={MAP_COLORS.RANGER_PATROL} />
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>
                            {patrol.team_name || `Patrol Team ${idx + 1}`}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Status: {patrol.status || 'Active'}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          Rangers: {patrol.ranger_count || 1}
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                )}
                
                {/* Ranger current position marker (always show if position exists) */}
                {hasPosition && (() => {
                  // Handle both array and object position formats
                  const position = Array.isArray(patrol.current_position) 
                    ? patrol.current_position 
                    : [patrol.current_position.lat, patrol.current_position.lon];
                  
                  return (
                    <React.Fragment key={`ranger-${patrol.id}`}>
                      <Marker
                    position={position}
                    icon={createCustomIcon(MAP_COLORS.RANGER_ACTIVE, 'patrol')}
                  >
                    <Popup maxWidth={300}>
                      <div style={{ padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
                        <h3 style={{ 
                          fontSize: '15px', 
                          fontWeight: 600, 
                          color: '#1F2937',
                          margin: '0 0 10px 0',
                          borderBottom: '2px solid #e5e7eb',
                          paddingBottom: '8px'
                        }}>
                          {patrol.name || patrol.team_name || 'Ranger'}
                        </h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '90px 1fr', 
                          gap: '8px',
                          fontSize: '13px',
                          marginBottom: '10px'
                        }}>
                          <strong>Badge:</strong>
                          <span>{patrol.badge || 'N/A'}</span>
                          
                          <strong>Team:</strong>
                          <span>{patrol.team_name || 'Unassigned'}</span>
                          
                          <strong>Status:</strong>
                          <span style={{ 
                            color: patrol.status === 'on_duty' ? '#10b981' : '#6b7280',
                            fontWeight: 600
                          }}>
                            {patrol.status === 'on_duty' ? 'ON DUTY' : 'OFF DUTY'}
                          </span>
                          
                          <strong>Activity:</strong>
                          <span>{patrol.activity || 'Patrolling'}</span>
                        </div>
                        
                        {/* Location Status Badge */}
                        {patrol.locationStatus && (
                          <div style={{ 
                            marginTop: '10px',
                            padding: '8px',
                            borderRadius: '6px',
                            backgroundColor: 
                              patrol.locationStatus === 'live' ? '#d1fae5' :
                              patrol.locationStatus === 'stale' ? '#fef3c7' :
                              patrol.locationStatus === 'checkpoint' ? '#dbeafe' :
                              '#fee2e2',
                            border: `2px solid ${
                              patrol.locationStatus === 'live' ? '#10b981' :
                              patrol.locationStatus === 'stale' ? '#f59e0b' :
                              patrol.locationStatus === 'checkpoint' ? '#3b82f6' :
                              '#ef4444'
                            }`
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 
                                patrol.locationStatus === 'live' ? '#059669' :
                                patrol.locationStatus === 'stale' ? '#d97706' :
                                patrol.locationStatus === 'checkpoint' ? '#2563eb' :
                                '#dc2626'
                            }}>
                              {patrol.locationSource === 'automatic_tracking' ? '📍' : '✅'}
                              <span>{patrol.locationStatus.toUpperCase()}</span>
                              {patrol.minutesSinceUpdate !== undefined && (
                                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>
                                  ({patrol.minutesSinceUpdate.toFixed(1)} min ago)
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#6b7280',
                              marginTop: '4px'
                            }}>
                              Source: {patrol.locationSource === 'automatic_tracking' ? 'GPS Tracking' : 'Manual Checkpoint'}
                            </div>
                            {patrol.isStale && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#dc2626',
                                fontWeight: 600,
                                marginTop: '4px'
                              }}>
                                ⚠️ Location may be outdated
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Recent Checkpoints */}
                        {patrol.recentLogs && patrol.recentLogs.length > 0 && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                            <strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Recent Checkpoints:</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: '#6b7280' }}>
                              {patrol.recentLogs
                                .filter(log => log.type === 'checkpoint')
                                .slice(0, 3)
                                .map((log, idx) => (
                                  <li key={idx}>
                                    {log.title} - {new Date(log.timestamp).toLocaleTimeString()}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })()}
              </React.Fragment>
            );
          })}

          {/* Movement Trail Animation */}
          {movementTrail && (
            <MovementTrailLayer 
              trail={movementTrail} 
              isPlaying={isPlayingTrail}
              onComplete={onTrailComplete}
            />
          )}
        </MapContainer>

        {/* Seasonal tone overlay */}
        {season && (
          <div className={`pointer-events-none absolute inset-0 season-overlay ${season === 'wet' ? 'wet' : 'dry'}`}></div>
        )}
      </div>

      {/* Map Legend removed - All legend information now shown in bottom panel of WildlifeTracking screen */}

      {/* Map Info */}
      {!hideMapInfo && mapCenter && Array.isArray(mapCenter) && mapCenter.length === 2 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Center:</strong> {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
            </div>
            <div>
              <strong>Zoom Level:</strong> {mapZoom}
            </div>
            <div>
              <strong>Markers:</strong> {displayMarkers.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('MapComponent rendering error:', error);
    return (
      <div style={{
        height: height || '500px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.secondaryBg,
        border: `2px solid ${COLORS.borderLight}`,
        borderRadius: '12px',
        flexDirection: 'column',
        gap: '16px',
        padding: '40px'
      }}>
        <MapPin style={{ width: 64, height: 64 }} color={COLORS.error} />
        <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.error }}>Map Error</div>
        <div style={{ fontSize: '13px', color: COLORS.textSecondary, textAlign: 'center', maxWidth: '400px' }}>
          Unable to render map. Check console for details.
        </div>
        <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontFamily: 'monospace', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
          {error.message}
        </div>
      </div>
    );
  }
};

export default MapComponent;