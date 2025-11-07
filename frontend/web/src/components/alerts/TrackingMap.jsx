import React from 'react';
import MapComponent from '@/components/shared/MapComponent';

const MAP_COLORS = {
  WILDLIFE_NORMAL: '#2E5D45',
  ALERT_CRITICAL: '#EF4444',
  ALERT_WARNING: '#F59E0B',
};

const TrackingMap = ({ animals, onAnimalSelect }) => {
  const markers = animals ? animals.map(animal => {
    let color;
    switch (animal.risk) {
      case 'High':
      case 'Critical':
        color = MAP_COLORS.ALERT_CRITICAL;
        break;
      case 'Medium':
        color = MAP_COLORS.ALERT_WARNING;
        break;
      case 'Low':
      default:
        color = MAP_COLORS.WILDLIFE_NORMAL;
        break;
    }

    let markerType;
    if (animal.species.includes('Elephant')) {
      markerType = 'elephant';
    } else if (animal.species.includes('Wildebeest')) {
      markerType = 'wildebeest';
    } else {
      markerType = 'wildlife';
    }

    return {
      id: animal.id,
      position: [animal.coordinates[1], animal.coordinates[0]],
      title: animal.name,
      description: `${animal.species} - Status: ${animal.status} - Coordinates: ${animal.coordinates[0].toFixed(4)}°, ${animal.coordinates[1].toFixed(4)}°`,
      type: markerType,
      color: color,
      risk: animal.risk,
      species: animal.species
    };
  }) : [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-12 mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900">Live Wildlife Tracking Map</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium">Live Tracking Active</span>
          </div>
          <span className="text-xs text-gray-500">
            {animals.length} Animals Monitored
          </span>
        </div>
      </div>

      {/* Map using existing MapComponent with increased padding */}
      <div className="w-full rounded-xl border border-gray-200 overflow-hidden" style={{ height: '500px', margin: '0 16px' }}>
        <MapComponent
          markers={markers}
          center={[-2.10, 34.83]} // East Africa
          zoom={10}
          onMarkerClick={(marker) => {
            // Find the original animal data
            const animal = animals.find(a => a.id === marker.id);
            if (animal && onAnimalSelect) {
              onAnimalSelect(animal);
            }
          }}
        />
      </div>

      {/* Enhanced Legend with Proper Colors for Elephants & Wildebeests */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Wildlife Tracking Legend</h4>
          <div className="grid grid-cols-2 gap-6">
            {/* Risk Levels */}
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk Levels</h5>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-brand-primary shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">Low Risk</span>
                <span className="text-xs text-gray-500">Protected corridors</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">Medium Risk</span>
                <span className="text-xs text-gray-500">Human activity nearby</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">High Risk</span>
                <span className="text-xs text-gray-500">Immediate threat</span>
              </div>
            </div>
            
            {/* Species Types */}
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Species</h5>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gray-600 shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">Elephants</span>
                <span className="text-xs text-gray-500">Family groups</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-blue-600 shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">Wildebeests</span>
                <span className="text-xs text-gray-500">Migration herds</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-purple-600 shadow-md"></div>
                <span className="text-sm text-gray-700 font-medium">Mixed Groups</span>
                <span className="text-xs text-gray-500">Multi-species</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Total Tracked: <span className="text-gray-900 font-medium">{animals.length} Animals</span>
            </div>
            <div className="text-xs text-gray-500">
              Last Updated: <span className="text-brand-primary font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;