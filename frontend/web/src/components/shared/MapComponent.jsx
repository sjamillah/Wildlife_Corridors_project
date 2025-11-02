import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COLORS } from '../../constants/Colors';
import ReactDOMServer from 'react-dom/server';
import { MapPin, Shield, AlertTriangle, Activity, Heart, Navigation } from './Icons';

// Map-specific colors using CSS variables
const MAP_COLORS = {
  WILDLIFE_NORMAL: 'var(--forest-green)',
  ALERT_CRITICAL: 'var(--status-error)',
  ALERT_WARNING: 'var(--status-warning)',
  PATROL: 'var(--status-info)',
  MIGRATION: 'var(--ochre)',
  BREEDING: 'var(--burnt-orange)',
  ROUTE: 'var(--burnt-orange)',
  LOCATION: 'var(--status-info)',
  GRAY_DEFAULT: '#6B7280',
};

// ML Model Helper Functions
const getBehaviorColor = (state) => {
  switch (state) {
    case 'Foraging':
      return COLORS.success;
    case 'Resting':
      return COLORS.info;
    case 'Migrating':
      return COLORS.ochre;
    default:
      return COLORS.textSecondary;
  }
};

const getBehaviorIcon = (state) => {
  switch (state) {
    case 'Foraging':
      return <Heart size={16} color="white" />;
    case 'Resting':
      return <Activity size={16} color="white" />;
    case 'Migrating':
      return <Navigation size={16} color="white" />;
    default:
      return <MapPin size={16} color="white" />;
  }
};

// ML Visualization Components
const PredictedPath = ({ path, confidence, model, color }) => {
  if (!path || path.length < 2) return null;
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
  const glowColor = getBehaviorColor(state);
  
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

const ConfidenceBadge = ({ confidence }) => {
  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return { label: 'High', color: COLORS.success };
    if (conf >= 0.5) return { label: 'Medium', color: COLORS.warning };
    return { label: 'Low', color: COLORS.error };
  };
  
  const { label, color } = getConfidenceLevel(confidence);
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 6px',
      background: `${color}20`,
      borderRadius: '4px',
      border: `1px solid ${color}40`,
      fontSize: '10px',
      fontWeight: 600
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color
      }}></div>
      <span style={{ color: color }}>{label}</span>
      <span style={{ color: COLORS.textSecondary, marginLeft: '2px' }}>
        ({(confidence * 100).toFixed(0)}%)
      </span>
    </div>
  );
};

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.webp',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.webp',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.webp',
});

// Custom icons for different marker types using emoji (from animal data)
const createCustomIcon = (color, type, emoji) => {
  // Use emoji if provided (from animal list), otherwise use defaults
  let iconContent = emoji || '📍';
  
  // Default emojis for different types if not provided
  if (!emoji) {
    switch (type) {
      case 'elephant':
        iconContent = '🐘';
        break;
      case 'wildebeest':
        iconContent = '🦌';
        break;
      case 'wildlife':
        iconContent = '🦁';
        break;
      case 'alert':
        // Use Lucide icon for alerts
        iconContent = ReactDOMServer.renderToString(
          React.createElement(AlertTriangle, {
            size: 20,
            color: 'white',
            strokeWidth: 2.5
          })
        );
        break;
      case 'patrol':
        // Use Lucide icon for patrols
        iconContent = ReactDOMServer.renderToString(
          React.createElement(Shield, {
            size: 20,
            color: 'white',
            strokeWidth: 2.5
          })
        );
        break;
      default:
        iconContent = '📍';
        break;
    }
  }

  // Check if it's an emoji or SVG
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

// Calculate center point from bounding box
const calculateCenter = (bbox) => [
  (bbox.min_lat + bbox.max_lat) / 2,
  (bbox.min_lon + bbox.max_lon) / 2
];

// Default center for Kenya-Tanzania region
const DEFAULT_CENTER = [-3.25, 35.5]; // Center of Kenya-Tanzania corridor
const DEFAULT_ZOOM = 6;

const MapComponent = ({
  center,
  zoom,
  height = '500px',
  markers = [],
  showGeofence = false,
  geofenceRadius = 50000, // Larger radius for regional view
  patrolRoutes = [],
  onMapClick,
  showCoordinates = false,
  className = '',
  hideControls = false,
  hideLegend = false,
  hideMapInfo = false,
  showLegendBox = false, // New prop to show the detailed legend box
  // ML Model Integration Props
  predictedPaths = [], // Array of {animalId, path: [[lat,lng]...], confidence, model: 'BBMM'|'LSTM'}
  behavioralStates = {}, // Object {animalId: {state: 'Foraging'|'Resting'|'Migrating', confidence}}
  riskHeatmap = [], // Array of {position: [lat,lng], intensity: 0-1, type: 'conflict'|'poaching'}
  // Optional props for seasonal tone and overlays (non-breaking, default off)
  season = null, // 'wet' | 'dry' | null
  showPredictedPaths = false,
  onModeChange,
  corridors = [] // optional: [{ name, status, path: [[lat,lng], ...] }]
}) => {
  // Use default center if not provided or invalid
  const validCenter = (center && Array.isArray(center) && center.length === 2) ? center : DEFAULT_CENTER;
  const validZoom = zoom || DEFAULT_ZOOM;
  
  const [mapCenter, setMapCenter] = useState(validCenter);
  const [mapZoom, setMapZoom] = useState(validZoom);
  const mapRef = useRef(null);
  const [mode, setMode] = useState('live'); // 'live' | 'historical'
  const [visibleSpecies, setVisibleSpecies] = useState({ elephant: true, zebra: true, wildebeest: true, wildlife: true });

  // Ensure map initializes properly after mount
  useEffect(() => {
    // Delay to ensure container is rendered and sized
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

  // Sample data for East Africa demonstration
  const defaultMarkers = [
    // Kenya locations
    {
      id: 1,
      position: [-1.4100, 35.0200], // Maasai Mara
      type: 'wildlife',
      title: 'Maasai Mara - Elephant Herd',
      description: 'Family of 12 elephants spotted near Mara River',
  color: 'var(--brand-primary)'
    },
    {
      id: 2,
      position: [-0.0236, 37.9062], // Nairobi National Park
      type: 'wildlife',
      title: 'Nairobi National Park - Lions',
      description: 'Urban wildlife pride spotted near city skyline',
      color: MAP_COLORS.MIGRATION
    },
    {
      id: 3,
      position: [-2.1540, 36.7073], // Amboseli
      type: 'wildlife',
      title: 'Amboseli - Elephant Migration',
      description: 'Large herd crossing towards Kilimanjaro',
  color: 'var(--brand-primary)'
    },
    // Tanzania locations
    {
      id: 4,
      position: [-2.3333, 34.8333], // Serengeti
      type: 'wildlife',
      title: 'Serengeti - Great Migration',
      description: 'Wildebeest migration in full swing',
      color: MAP_COLORS.BREEDING
    },
    {
      id: 5,
      position: [-3.2167, 35.7500], // Ngorongoro Crater
      type: 'wildlife',
      title: 'Ngorongoro Crater - Rhino Sanctuary',
      description: 'Black rhino population thriving in crater',
      color: MAP_COLORS.PATROL
    },
    {
      id: 6,
      position: [-6.3690, 34.8917], // Ruaha National Park
      type: 'wildlife',
      title: 'Ruaha - Elephant Corridor',
      description: 'Critical elephant migration route',
  color: 'var(--brand-primary)'
    },
    // Alert locations
    {
      id: 7,
      position: [-2.0000, 35.5000], // Kenya-Tanzania border
      type: 'alert',
      title: 'Cross-Border Poaching Alert',
      description: 'Coordinated anti-poaching operation needed',
      color: MAP_COLORS.ALERT_CRITICAL
    },
    {
      id: 8,
      position: [-1.0000, 36.0000], // Central Kenya
      type: 'patrol',
      title: 'KWS Ranger Station',
      description: 'Kenya Wildlife Service patrol base',
      color: MAP_COLORS.PATROL
    },
    {
      id: 9,
      position: [-4.0000, 35.0000], // Central Tanzania
      type: 'patrol',
      title: 'TANAPA Headquarters',
      description: 'Tanzania National Parks Authority',
      color: MAP_COLORS.PATROL
    }
  ];

  const rawMarkers = markers.length > 0 ? markers : defaultMarkers;
  const displayMarkers = rawMarkers.filter(m => {
    const type = (m.type || 'wildlife').toLowerCase();
    if (type.includes('elephant')) return visibleSpecies.elephant;
    if (type.includes('zebra')) return visibleSpecies.zebra;
    if (type.includes('wildebeest')) return visibleSpecies.wildebeest;
    return visibleSpecies.wildlife;
  });

  // East Africa wildlife corridors and patrol routes
  const defaultPatrolRoutes = [
    // Maasai Mara - Serengeti corridor
    [
      [-1.4061, 35.0117], // Maasai Mara
      [-2.0000, 35.0000], // Border crossing
      [-2.3333, 34.8333], // Serengeti
    ],
    // Kenya internal corridor
    [
      [-0.0236, 37.9062], // Nairobi
      [-1.4061, 35.0117], // Maasai Mara
      [-2.1540, 36.7073], // Amboseli
    ],
    // Tanzania coastal to interior
    [
      [-6.3690, 34.8917], // Ruaha
      [-3.2167, 35.7500], // Ngorongoro
      [-2.3333, 34.8333], // Serengeti
    ]
  ];

  const displayRoutes = patrolRoutes.length > 0 ? patrolRoutes : defaultPatrolRoutes;

  const handleMarkerClick = (marker) => {
    console.log('Marker clicked:', marker);
  };

  const recenterMap = (lat, lng) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
  };

  const toggleSpecies = (key) => {
    setVisibleSpecies(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    if (onModeChange) onModeChange(nextMode);
  };

  return (
    <div className={`map-container ${className}`}>
      {/* Map Controls */}
      {!hideControls && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => recenterMap(-1.4061, 35.0117)}
            className="px-3 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-highlight transition-colors"
          >
            🇰🇪 Maasai Mara
          </button>
          <button
            onClick={() => recenterMap(-2.3333, 34.8333)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🇹🇿 Serengeti
          </button>
          <button
            onClick={() => recenterMap(-0.0236, 37.9062)}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            🇰🇪 Nairobi NP
          </button>
          <button
            onClick={() => recenterMap(-3.2167, 35.7500)}
            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            🇹🇿 Ngorongoro
          </button>
          <button
            onClick={() => recenterMap(-2.1540, 36.7073)}
            className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            🇰🇪 Amboseli
          </button>
          <button
            onClick={() => recenterMap(-6.3690, 34.8917)}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            🇹🇿 Ruaha
          </button>
          <button
            onClick={() => setMapZoom(mapZoom + 1)}
            className="px-2 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🔍+
          </button>
          <button
            onClick={() => setMapZoom(mapZoom - 1)}
            className="px-2 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🔍-
          </button>
          <button
            onClick={() => { setMapCenter(calculateCenter(KENYA_TANZANIA_BBOX)); setMapZoom(6); }}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            🌍 Kenya-Tanzania View
          </button>
          {/* View mode */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleModeSwitch('live')}
              className={`px-3 py-2 rounded-md transition-colors ${mode === 'live' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Live
            </button>
            <button
              onClick={() => handleModeSwitch('historical')}
              className={`px-3 py-2 rounded-md transition-colors ${mode === 'historical' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Historical
            </button>
          </div>
        </div>
      )}

      {/* Floating Toolbar - species filters and predicted paths */}
      {!hideControls && (
        <div className="pointer-events-auto absolute z-[400] m-3">
          <div className="rounded-xl bg-white/90 backdrop-blur border border-brand-border shadow-md p-3 flex flex-col gap-2 w-[220px]">
            <div className="text-sm font-semibold text-text-primary">Filters</div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-forest-green"></span>Elephants</span>
              <button onClick={() => toggleSpecies('elephant')} className={`w-10 h-6 rounded-full transition-colors ${visibleSpecies.elephant ? 'bg-forest-green' : 'bg-gray-300'}`}> 
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${visibleSpecies.elephant ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-amber-600"></span>Zebras</span>
              <button onClick={() => toggleSpecies('zebra')} className={`w-10 h-6 rounded-full transition-colors ${visibleSpecies.zebra ? 'bg-amber-600' : 'bg-gray-300'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${visibleSpecies.zebra ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-orange-600"></span>Wildebeest</span>
              <button onClick={() => toggleSpecies('wildebeest')} className={`w-10 h-6 rounded-full transition-colors ${visibleSpecies.wildebeest ? 'bg-orange-600' : 'bg-gray-300'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${visibleSpecies.wildebeest ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-gray-700"></span>Other Wildlife</span>
              <button onClick={() => toggleSpecies('wildlife')} className={`w-10 h-6 rounded-full transition-colors ${visibleSpecies.wildlife ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${visibleSpecies.wildlife ? 'translate-x-5' : 'translate-x-0'}`}></span>
          </button>
            </div>
            <div className="pt-1 border-t border-brand-border"></div>
            <label className="flex items-center justify-between text-sm">
              <span>Show predicted paths</span>
              <input type="checkbox" defaultChecked={showPredictedPaths} className="h-4 w-4" readOnly />
            </label>
          </div>
        </div>
      )}

      {/* Legend */}
      {!hideLegend && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-2">Map Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-brand-primary rounded-full"></div>
              <span>Wildlife</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Patrol Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-purple-500"></div>
              <span>Patrol Routes</span>
            </div>
          </div>
        </div>
      )}

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
          {showPredictedPaths && predictedPaths.map((prediction, idx) => (
            <PredictedPath
              key={`prediction-${idx}`}
              path={prediction.path}
              confidence={prediction.confidence}
              model={prediction.model}
              color={COLORS.info}
            />
          ))}

          {/* Risk Heatmap - XGBoost Model */}
          {riskHeatmap && riskHeatmap.length > 0 && riskHeatmap.map((risk, idx) => (
            <RiskHeatmapPoint
              key={`risk-${idx}`}
              position={risk.position}
              intensity={risk.intensity}
              type={risk.type}
            />
          ))}

          {/* Behavioral State Glows - HMM Model */}
          {behavioralStates && Object.keys(behavioralStates).length > 0 && displayMarkers.map((marker) => {
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

          {/* Markers with pulse and optional heading arrow */}
          {displayMarkers.map((marker) => {
            // Get behavioral state for this animal
            const behaviorState = behavioralStates[marker.id];
            
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
              <Marker
                key={marker.id}
                position={marker.position}
                icon={createCustomIcon(markerColor, marker.type || 'wildlife', marker.emoji)}
                eventHandlers={{ click: () => handleMarkerClick(marker) }}
              >
                <Popup>
                  <div style={{ maxWidth: '280px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#2C2416' }}>{marker.title}</h3>
                      {marker?.timestamp && <span style={{ fontSize: '11px', color: '#6B5E4F' }}>{marker.timestamp}</span>}
                    </div>
                    
                    {/* Behavioral State - HMM Model */}
                    {behaviorState && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '6px 8px', 
                        background: `${getBehaviorColor(behaviorState.state)}15`,
                        borderRadius: '6px', 
                        marginBottom: '8px',
                        border: `1px solid ${getBehaviorColor(behaviorState.state)}30`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
                          {getBehaviorIcon(behaviorState.state)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: getBehaviorColor(behaviorState.state) }}>
                            {behaviorState.state}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6B5E4F' }}>
                            HMM Model • {(behaviorState.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '12px', color: '#4A4235', marginBottom: '8px' }}>{marker.description}</div>
                    
                    {/* Model Confidence Indicators */}
                    {behaviorState && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#6B5E4F', marginBottom: '4px' }}>
                          Prediction Confidence:
                        </div>
                        <ConfidenceBadge 
                          confidence={behaviorState.confidence} 
                          modelType="HMM"
                        />
                      </div>
                    )}
                    
                    <div style={{ fontSize: '11px', color: '#6B5E4F', borderTop: '1px solid #E8E3D6', paddingTop: '8px' }}>
                      {marker.type && <span style={{ marginRight: '8px', textTransform: 'capitalize' }}>{marker.type}</span>}
                      <span>Lat: {marker.position[0].toFixed(4)}, Lng: {marker.position[1].toFixed(4)}</span>
                    </div>
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
          {displayRoutes.map((route, index) => (
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

          {/* Optional corridors overlay (semi-transparent with glow) */}
          {corridors && corridors.map((c, idx) => (
            <React.Fragment key={`corridor-fragment-${idx}`}>
              <Polyline
                positions={c.path}
                pathOptions={{ color: 'rgba(46,93,69,0.25)', weight: 12, opacity: 0.6 }}
              />
              <Polyline
                positions={c.path}
                pathOptions={{ color: 'var(--forest-green)', weight: 4, opacity: 0.9, className: 'corridor-glow' }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false} className="!rounded-md !bg-white !px-2 !py-1 !text-xs !shadow">
                  {c.name || 'Corridor'}{c.status ? ` • ${c.status}` : ''}
                </Tooltip>
              </Polyline>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Seasonal tone overlay */}
        {season && (
          <div className={`pointer-events-none absolute inset-0 season-overlay ${season === 'wet' ? 'wet' : 'dry'}`}></div>
        )}
      </div>

      {/* Map Legend - Only show on Wildlife Tracking */}
      {showLegendBox && (
      <div style={{
        marginTop: '16px',
        background: COLORS.whiteCard,
        border: `2px solid ${COLORS.borderLight}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: COLORS.textPrimary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Map Legend
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Risk Levels */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Risk Levels
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.error,
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>High Risk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.ochre,
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Medium Risk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.forestGreen,
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Normal / Safe</span>
              </div>
            </div>
          </div>

          {/* Animal Types */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Animal Types
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.burntOrange,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <Heart size={14} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>African Elephant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.ochre,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <Heart size={14} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Wildebeest</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.forestGreen,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <Heart size={14} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Other Wildlife</span>
              </div>
            </div>
          </div>

          {/* Map Elements */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Map Elements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '3px',
                  background: COLORS.burntOrange,
                  borderRadius: '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}></div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Patrol Routes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.info,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <Shield size={14} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Ranger Stations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: COLORS.error,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.white}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <AlertTriangle size={14} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500 }}>Alert Locations</span>
              </div>
            </div>
          </div>
      </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${COLORS.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: COLORS.textSecondary
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span style={{ fontWeight: 500 }}>
            Click on any marker to view detailed information • Use filters to show/hide species
          </span>
        </div>
      </div>
      )}

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
};

export default MapComponent;