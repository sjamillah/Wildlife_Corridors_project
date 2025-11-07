import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, Rectangle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../../constants/Colors';
import ReactDOMServer from 'react-dom/server';
import { MapPin, Shield, AlertTriangle, ANIMAL_ICONS } from './Icons';

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

  useEffect(() => {
    const activityType = marker.activityType;
    const speed = marker.speed || 0;
    const predictedPosition = marker.predictedPosition;
    const showAnimalMovement = marker.showAnimalMovement !== false;

    if (animationRef.current) clearInterval(animationRef.current);
    if (wobbleRef.current) clearInterval(wobbleRef.current);

    const isDifferentPosition = predictedPosition && 
      (Math.abs(predictedPosition[0] - marker.position[0]) > 0.00001 || 
       Math.abs(predictedPosition[1] - marker.position[1]) > 0.00001);

    console.log(`🔍 [MAP ANIMATION CHECK] ${marker.title}:`, {
      activityType,
      speed,
      isDifferentPosition,
      showAnimalMovement,
      willTriggerAnimation: showAnimalMovement && activityType === 'moving' && speed > 2 && isDifferentPosition
    });

    if (showAnimalMovement && activityType === 'moving' && speed > 2 && isDifferentPosition) {
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
      const duration = 5000;
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
          clearInterval(animationRef.current);
          console.log(`✅ [ANIMATION] ${marker.title} - COMPLETED movement to [${predictedPosition[0].toFixed(4)}, ${predictedPosition[1].toFixed(4)}]`);
          return;
        }
        
        const progress = step / steps;
        const newLat = startLat + (endLat - startLat) * progress;
        const newLon = startLon + (endLon - startLon) * progress;
        setCurrentPosition([newLat, newLon]);
      }, interval);
      
    } else if (activityType === 'feeding' && speed > 0.5 && speed <= 2) {
      console.log(`🌿 [ANIMATION] ${marker.title} - FEEDING wobble started`);
      const baseLat = marker.position[0];
      const baseLon = marker.position[1];
      const wobbleRadius = 0.0005;
      
      wobbleRef.current = setInterval(() => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * wobbleRadius;
        const newLat = baseLat + distance * Math.cos(angle);
        const newLon = baseLon + distance * Math.sin(angle);
        setCurrentPosition([newLat, newLon]);
      }, 2000);
      
    } else {
      if (speed > 2 && activityType === 'moving') {
        console.log(`⚠️ [ANIMATION] ${marker.title} - NOT animating:`, {
          current: marker.position,
          predicted: predictedPosition,
          isDifferent: isDifferentPosition,
          reason: !isDifferentPosition ? 'Predicted position same as current' : 'Unknown'
        });
      }
      setCurrentPosition(marker.position);
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
      if (wobbleRef.current) clearInterval(wobbleRef.current);
    };
  }, [marker.position, marker.predictedPosition, marker.activityType, marker.speed, marker.title, marker.showAnimalMovement]);

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
    <Marker position={currentPosition} icon={icon}>
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

const PredictedPath = ({ path, confidence, model, color }) => {
  if (!path || path.length < 2 || !isValidPath(path)) return null;
  const opacity = Math.max(0.3, confidence || 0.5);
  const dashArray = model === 'BBMM' ? '10, 10' : '5, 15';
  
  return (
    <>
      <Polyline
        positions={path}
        pathOptions={{
          color: color,
          weight: 6,
          opacity: opacity * 0.3,
          dashArray: dashArray
        }}
      />
      <Polyline
        positions={path}
        pathOptions={{
          color: color,
          weight: 3,
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
    </>
  );
};

const RiskHeatmapPoint = ({ position, intensity, type }) => {
  const color = type === 'poaching' ? COLORS.error : COLORS.warning;
  const radius = 2000 + (intensity * 8000);
  
  return (
    <Circle
      center={position}
      radius={radius}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: intensity * 0.4,
        weight: 1,
        opacity: intensity * 0.6
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
        <div style={{ fontSize: '11px', fontWeight: 600 }}>
          <div style={{ textTransform: 'capitalize' }}>{type} Risk Zone</div>
          <div style={{ fontSize: '10px', color: '#6B5E4F', marginTop: '2px' }}>
            Intensity: {(intensity * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '1px' }}>
            XGBoost Model
          </div>
        </div>
      </Tooltip>
    </Circle>
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

const createCustomIcon = (color, type) => {
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
        iconContent = ReactDOMServer.renderToString(
          React.createElement(AlertTriangle, {
            size: 20,
            color: 'white',
            strokeWidth: 2.5
          })
        );
        break;
      case 'patrol':
        iconContent = ReactDOMServer.renderToString(
          React.createElement(Shield, {
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
  
  const iconHtml = `
    <div class="custom-wildlife-marker" style="
      width: 40px; 
      height: 40px; 
      background-color: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
      ${isEmoji ? 'font-size: 22px;' : ''}
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
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-wrapper',
    iconSize: [40, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
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
  const displayMarkers = rawMarkers.filter(m => {
    const type = (m.type || 'wildlife').toLowerCase();
    if (type.includes('elephant')) return visibleSpecies.elephant;
    if (type.includes('zebra')) return visibleSpecies.zebra;
    if (type.includes('wildebeest')) return visibleSpecies.wildebeest;
    return visibleSpecies.wildlife;
  });

  // No demo patrol routes - using only real backend data
  const defaultPatrolRoutes = [];

  const displayRoutes = patrolRoutes.length > 0 ? patrolRoutes : defaultPatrolRoutes;

  console.log('[MAP] MapComponent rendering:', {
    markers: displayMarkers.length,
    showCorridors: showCorridors,
    riskZones: riskZones?.length || 0,
    predictedPaths: predictedPaths?.length || 0,
    center: mapCenter,
    zoom: mapZoom
  });

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
          {showPredictions && predictedPaths && Array.isArray(predictedPaths) && predictedPaths.map((prediction, idx) => (
            <PredictedPath
              key={`prediction-${idx}`}
              path={prediction.path}
              confidence={prediction.confidence}
              model={prediction.model}
              color={COLORS.info}
            />
          ))}

          {/* Risk Heatmap - XGBoost Model */}
          {riskHeatmap && Array.isArray(riskHeatmap) && riskHeatmap.length > 0 && riskHeatmap.filter(risk => risk.position && isValidCoordinate(risk.position)).map((risk, idx) => (
            <RiskHeatmapPoint
              key={`risk-${idx}`}
              position={risk.position}
              intensity={risk.intensity}
              type={risk.type}
            />
          ))}

          {/* Behavioral State Glows - HMM Model */}
          {behavioralStates && Object.keys(behavioralStates).length > 0 && displayMarkers.filter(marker => marker.position && isValidCoordinate(marker.position)).map((marker) => {
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

          {/* Wildlife Corridors - Single Surrounding Boxes (Real East African Corridors) */}
          {/* Only show when corridors toggle is enabled */}
          {/* Dynamic Backend Corridors */}
          {showCorridors && corridors && Array.isArray(corridors) && corridors.map((corridor, idx) => {
            const path = corridor.path?.map(p => [p.lat || p[0], p.lon || p[1]]) || [];
            if (path.length < 2) return null;

            return (
              <Polyline
                key={`corridor-${corridor.id || idx}`}
                positions={path}
                pathOptions={{
                  color: corridor.species === 'elephant' ? '#3b82f6' : '#8b5cf6',
                  weight: 6,
                  opacity: 0.7,
                  dashArray: '10, 10'
                }}
              >
                <Popup>
                  <div style={{ padding: '10px', minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#2563eb' }}>
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
              </Polyline>
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

          {/* Risk/Poaching Zones (Red circles) */}
          {showRiskZones && riskZones && Array.isArray(riskZones) && riskZones.map((zone, idx) => {
            const position = zone.geometry?.coordinates || zone.position || [0, 0];
            if (position[0] === 0 && position[1] === 0) return null;
            
            return (
              <Circle
                key={`risk-${zone.id || idx}`}
                center={[position[0], position[1]]}
                radius={zone.radius || 5000}
                pathOptions={{
                  color: MAP_COLORS.RISK_ZONE_BORDER,
                  fillColor: MAP_COLORS.DANGER,
                  fillOpacity: 0.45,
                  weight: 4,
                  opacity: 0.9,
                  dashArray: '10, 5'
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
          })}

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
                {hasPosition && (
                  <Marker
                    position={[patrol.current_position[0], patrol.current_position[1]]}
                    icon={createCustomIcon(MAP_COLORS.RANGER_ACTIVE, 'patrol')}
                  >
                    <Popup maxWidth={280}>
                      <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif' }}>
                        <h3 style={{ 
                          fontSize: '15px', 
                          fontWeight: 600, 
                          color: '#1F2937',
                          margin: '0 0 8px 0',
                          borderBottom: '2px solid #e5e7eb',
                          paddingBottom: '8px'
                        }}>
                          {patrol.team_name || 'Ranger'}
                        </h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '75px 1fr', 
                          gap: '6px',
                          fontSize: '13px'
                        }}>
                          <strong>Badge:</strong>
                          <span>{patrol.badge || 'N/A'}</span>
                          
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
                      </div>
                    </Popup>
                  </Marker>
                )}
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