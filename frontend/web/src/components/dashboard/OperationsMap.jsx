import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from '@/components/shared/Icons';

// Map-specific colors using CSS variables
const MAP_COLORS = {
  WILDLIFE_NORMAL: '#2E5D45',
  PATROL: '#3B82F6',
  MIGRATION: '#E8961C',
  BREEDING: '#D84315',
  LOCATION: '#3B82F6',
  GRAY_DEFAULT: '#6B7280',
};

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.webp',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.webp',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.webp',
});

// Custom marker icons for different conservation status levels
const createCustomIcon = (status) => {
  const colors = {
    'Normal': MAP_COLORS.WILDLIFE_NORMAL,
    'High Activity': MAP_COLORS.PATROL,
    'Migration Season': MAP_COLORS.MIGRATION,
    'Breeding Season': MAP_COLORS.BREEDING
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; 
      height: 24px; 
      background-color: ${colors[status] || MAP_COLORS.GRAY_DEFAULT}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Current location marker
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="
    width: 20px; 
    height: 20px; 
    background-color: ${MAP_COLORS.LOCATION}; 
    border: 4px solid white; 
    border-radius: 50%; 
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const OperationsMap = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);

  // Wildlife locations data with conservation focus (not threat focus)
  const wildlifeLocations = useMemo(() => ([
    { id: 1, name: 'Serengeti National Park', latitude: -2.3333, longitude: 34.8333, status: 'Normal', animals: 127, species: 'Wildebeest, Zebra', lastCount: '2 days ago' },
    { id: 2, name: 'Ngorongoro Crater', latitude: -3.2167, longitude: 35.5833, status: 'High Activity', animals: 89, species: 'Rhino, Elephant', lastCount: '1 day ago' },
    { id: 3, name: 'Masai Mara Reserve', latitude: -1.4061, longitude: 35.0117, status: 'Migration Season', animals: 203, species: 'Lion, Wildebeest', lastCount: '6 hours ago' },
    { id: 4, name: 'Amboseli National Park', latitude: -2.6527, longitude: 37.2606, status: 'Normal', animals: 156, species: 'Elephant', lastCount: '1 day ago' },
    { id: 5, name: 'Lake Nakuru', latitude: -0.3031, longitude: 36.0800, status: 'Breeding Season', animals: 78, species: 'Flamingo, Pelican', lastCount: '3 days ago' },
    { id: 6, name: 'Tarangire National Park', latitude: -3.8333, longitude: 36.0000, status: 'Normal', animals: 134, species: 'Elephant, Buffalo', lastCount: '2 days ago' }
  ]), []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Fallback to Nairobi, Kenya coordinates
          setCurrentLocation({
            latitude: -1.2921,
            longitude: 36.8219
          });
        }
      );
    } else {
      // Fallback to Nairobi, Kenya coordinates
      setCurrentLocation({
        latitude: -1.2921,
        longitude: 36.8219
      });
    }
  }, []);

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const handleLocationClick = (location) => {
    console.log('Location clicked:', location);
  };

  // Center the map on East Africa region
  const mapCenter = useMemo(() => [-2.0, 36.0], []);
  const mapZoom = 6;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
            <MapPin className="w-5 h-5 text-brand-primary mr-2" />
            Location & Corridor Overview
          </h3>
          <p className="text-xs text-gray-500">Wildlife corridors with threat assessment</p>
        </div>
        <button 
          onClick={handleViewAnalytics}
          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-secondary text-brand-text hover:opacity-90 transition"
        >
          <span>View Analytics</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Interactive Map */}
      <div className="relative h-80">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="h-full w-full"
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Wildlife Location Markers */}
          {wildlifeLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location.status)}
              eventHandlers={{
                click: () => handleLocationClick(location)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-semibold text-gray-900 mb-2">{location.name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        location.status === 'Normal' ? 'text-brand-primary' :
                        location.status === 'High Activity' ? 'text-blue-600' :
                        location.status === 'Migration Season' ? 'text-amber-600' : 'text-purple-600'
                      }`}>
                        {location.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Animals:</span>
                      <span className="font-medium text-gray-900">{location.animals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Species:</span>
                      <span className="font-medium text-gray-900 text-xs">{location.species}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Count:</span>
                      <span className="font-medium text-gray-900">{location.lastCount}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={[currentLocation.latitude, currentLocation.longitude]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-blue-600 mb-1 flex items-center">
                    <Navigation className="w-4 h-4 mr-1" />
                    Current Location
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Conservation Status</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-brand-primary rounded-full border border-white"></div>
              <span className="text-xs text-gray-600">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
              <span className="text-xs text-gray-600">High Activity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
              <span className="text-xs text-gray-600">Migration Season</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full border border-white"></div>
              <span className="text-xs text-gray-600">Breeding Season</span>
            </div>
            <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
              <span className="text-xs text-gray-600">Your Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conservation Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-brand-primary">
              {wildlifeLocations.filter(l => l.status === 'Normal').length}
            </div>
            <div className="text-xs text-gray-600">Normal Status</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {wildlifeLocations.filter(l => l.status === 'High Activity').length}
            </div>
            <div className="text-xs text-gray-600">High Activity</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">
              {wildlifeLocations.filter(l => l.status.includes('Season')).length}
            </div>
            <div className="text-xs text-gray-600">Seasonal Events</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {wildlifeLocations.reduce((sum, l) => sum + l.animals, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Animals</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OperationsMap);