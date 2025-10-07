import React from 'react';

const TrackingMap = ({ animals, onAnimalSelect }) => {
  const mapBounds = {
    minLng: 34.75,
    maxLng: 34.92,
    minLat: -2.15,
    maxLat: -2.05
  };

  const mapWidth = 1000;
  const mapHeight = 600;

  const latLngToXY = (lng, lat) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * mapWidth;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * mapHeight;
    return { x, y };
  };

  const animalColors = {
    'African Elephant': '#10b981',
    'Leopard': '#f59e0b',
    'Black Rhino': '#8b5cf6',
    'Giraffe': '#ec4899',
    'Zebra': '#3b82f6',
    'Pangolin': '#14b8a6'
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Live Asset Tracking Map</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600 font-medium">Live Tracking Active</span>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl overflow-hidden border border-emerald-200">
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-auto">
          <defs>
            <pattern id="wildlifeGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.15" />
            </pattern>
          </defs>
          
          <rect width={mapWidth} height={mapHeight} fill="url(#wildlifeGrid)" />

          {/* Protected zones */}
          <ellipse cx="300" cy="300" rx="180" ry="150" fill="#10b981" opacity="0.08" />
          <text x="300" y="305" textAnchor="middle" fill="#059669" fontSize="18" fontWeight="600" opacity="0.6">
            Serengeti
          </text>
          
          <ellipse cx="700" cy="350" rx="200" ry="160" fill="#10b981" opacity="0.08" />
          <text x="700" y="355" textAnchor="middle" fill="#059669" fontSize="18" fontWeight="600" opacity="0.6">
            Masai Mara
          </text>

          {/* Wildlife corridors */}
          <path
            d="M 480 300 Q 500 280, 520 300"
            stroke="#10b981"
            strokeWidth="8"
            fill="none"
            opacity="0.3"
            strokeDasharray="15,10"
          />

          {/* Animal markers with trails */}
          {animals.map((animal) => {
            const { x, y } = latLngToXY(animal.coordinates[0], animal.coordinates[1]);
            const color = animalColors[animal.species] || '#10b981';

            return (
              <g key={animal.id}>
                {/* Movement trail */}
                {animal.movementHistory.length > 1 && (
                  <polyline
                    points={animal.movementHistory
                      .map(([lng, lat]) => {
                        const point = latLngToXY(lng, lat);
                        return `${point.x},${point.y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    opacity="0.3"
                    strokeDasharray="8,4"
                  />
                )}

                {/* Pulse animation for moving animals */}
                {animal.status === 'Moving' && (
                  <circle cx={x} cy={y} r="18" fill={color} opacity="0.3">
                    <animate attributeName="r" from="18" to="28" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Animal marker */}
                <g onClick={() => onAnimalSelect(animal)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r="14" fill={color} stroke="white" strokeWidth="3" />
                  <circle cx={x} cy={y} r="6" fill="white" />
                </g>

                {/* Animal label */}
                <text
                  x={x}
                  y={y - 25}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="12"
                  fontWeight="600"
                >
                  {animal.name}
                </text>
              </g>
            );
          })}

          {/* Compass */}
          <g transform="translate(950, 50)">
            <circle cx="0" cy="0" r="30" fill="white" fillOpacity="0.95" stroke="#d1d5db" strokeWidth="2" />
            <text x="0" y="-12" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">N</text>
            <line x1="0" y1="-22" x2="0" y2="22" stroke="#d1d5db" strokeWidth="2" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="#d1d5db" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#10b981" />
          </g>

          {/* Scale bar */}
          <g transform="translate(50, 550)">
            <line x1="0" y1="0" x2="100" y2="0" stroke="#374151" strokeWidth="2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#374151" strokeWidth="2" />
            <line x1="100" y1="-5" x2="100" y2="5" stroke="#374151" strokeWidth="2" />
            <text x="50" y="20" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="500">
              ~10 km
            </text>
          </g>
        </svg>
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          {Object.entries(animalColors).slice(0, 4).map(([species, color]) => (
            <div key={species} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-xs text-gray-600 font-medium">{species.split(' ')[1] || species}</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          Showing {animals.length} of {animals.length} assets
        </span>
      </div>
    </div>
  );
};

export default TrackingMap;