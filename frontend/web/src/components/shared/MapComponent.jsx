import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.webp',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.webp',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.webp',
});

// Custom icons for different marker types using React Icons
const createCustomIcon = (color, type) => {
  // Get appropriate SVG path for each type
  let iconSvg;
  let iconSize = 16;
  
  switch (type) {
    case 'elephant':
      iconSvg = `<path d="M7 14h10v1H7v-1zm0-1h1v1H7v-1zm9 0h1v1h-1v-1zm-8-1h7v1H8v-1zm-1-1h1v1H7v-1zm8 0h1v1h-1v-1zm-7-1h6v1H8v-1zm-1-1h1v1H7v-1zm7 0h1v1h-1v-1zm-6-1h5v1H8v-1zm-1-1h1v1H7v-1zm6 0h1v1h-1v-1zm-5-1h4v1H8v-1z" fill="${color}" stroke="white" stroke-width="0.5"/>`;
      break;
    case 'wildebeest':
      iconSvg = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="${color}" stroke="white" stroke-width="1"/>`;
      break;
    case 'wildlife':
      iconSvg = `<circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
    case 'alert':
      iconSvg = `<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="${color}" stroke="white" stroke-width="1"/>`;
      break;
    case 'patrol':
      iconSvg = `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${color}" stroke="white" stroke-width="1"/>`;
      break;
    default:
      iconSvg = `<circle cx="12" cy="12" r="6" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
  }

  const svgIcon = `
    <div class="custom-marker" style="
      width: 32px; 
      height: 32px; 
      background-color: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white">
        ${iconSvg}
      </svg>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
      "></div>
    </div>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-wildlife-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
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

// Component to center map on specific location
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
};

const MapComponent = ({
  center = [-3.0, 35.0], // Center on East Africa (Kenya-Tanzania border)
  zoom = 6, // Wider view to show both countries
  height = '400px',
  markers = [],
  showGeofence = false,
  geofenceRadius = 50000, // Larger radius for regional view
  patrolRoutes = [],
  onMapClick,
  showCoordinates = false,
  className = '',
  hideControls = false,
  hideLegend = false,
  hideMapInfo = false
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef(null);

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
      color: '#f59e0b'
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
      color: '#8b5cf6'
    },
    {
      id: 5,
      position: [-3.2167, 35.7500], // Ngorongoro Crater
      type: 'wildlife',
      title: 'Ngorongoro Crater - Rhino Sanctuary',
      description: 'Black rhino population thriving in crater',
      color: '#6366f1'
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
      color: '#ef4444'
    },
    {
      id: 8,
      position: [-1.0000, 36.0000], // Central Kenya
      type: 'patrol',
      title: 'KWS Ranger Station',
      description: 'Kenya Wildlife Service patrol base',
      color: '#3b82f6'
    },
    {
      id: 9,
      position: [-4.0000, 35.0000], // Central Tanzania
      type: 'patrol',
      title: 'TANAPA Headquarters',
      description: 'Tanzania National Parks Authority',
      color: '#3b82f6'
    }
  ];

  const displayMarkers = markers.length > 0 ? markers : defaultMarkers;

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
            onClick={() => { setMapCenter([-3.0, 35.0]); setMapZoom(6); }}
            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            🌍 East Africa View
          </button>
        </div>
      )}

      {/* Legend */}
      {!hideLegend && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
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
      <div style={{ height }} className="border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          {/* Base Layer - Satellite imagery */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
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

          {/* Map Controller */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Event Handler */}
          <MapEventHandler onMapClick={onMapClick} showCoordinates={showCoordinates} />

          {/* Markers */}
          {displayMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={createCustomIcon(marker.color, marker.type)}
              eventHandlers={{
                click: () => handleMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="max-w-xs">
                  <h3 className="font-bold text-lg mb-2">{marker.title}</h3>
                  <p className="text-gray-700 mb-2">{marker.description}</p>
                  <div className="text-sm text-gray-500">
                    <strong>Type:</strong> {marker.type}<br />
                    <strong>Coordinates:</strong> {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                  </div>
                  {marker.timestamp && (
                    <div className="text-xs text-gray-400 mt-2">
                      Last updated: {marker.timestamp}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

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
            <Polyline
              key={index}
              positions={route}
              pathOptions={{
                color: '#8b5cf6',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 5'
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Map Info */}
      {!hideMapInfo && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
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