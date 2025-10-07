import React from 'react';

const OperationsMap = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Field Operations Map</h3>
        <div className="flex space-x-2">
          {['Satellite', 'Terrain', '3D'].map((mode, idx) => (
            <button key={idx} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              idx === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-64 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl border border-gray-200 overflow-hidden">
        <svg viewBox="0 0 800 400" className="w-full h-full">
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)" />

          {/* Protected zones */}
          <ellipse cx="150" cy="120" rx="80" ry="70" fill="#10b981" opacity="0.1" />
          <text x="150" y="125" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="600">
            Serengeti
          </text>
          
          <ellipse cx="550" cy="150" rx="100" ry="80" fill="#10b981" opacity="0.1" />
          <text x="550" y="155" textAnchor="middle" fill="#059669" fontSize="12" fontWeight="600">
            Masai Mara
          </text>

          {/* Wildlife corridors */}
          <path
            d="M 230 120 Q 350 100, 450 150"
            stroke="#10b981"
            strokeWidth="6"
            fill="none"
            opacity="0.4"
            strokeDasharray="10,5"
          />

          {/* Alert zones */}
          <circle cx="400" cy="200" r="50" fill="#ef4444" opacity="0.1" stroke="#ef4444" strokeWidth="2" />
          
          {/* Ranger positions with animation */}
          {[
            { x: 150, y: 120, status: 'active' },
            { x: 400, y: 200, status: 'alert' },
            { x: 550, y: 150, status: 'active' },
            { x: 300, y: 250, status: 'moving' },
            { x: 600, y: 300, status: 'active' },
            { x: 200, y: 280, status: 'active' }
          ].map((ranger, idx) => (
            <g key={idx}>
              {ranger.status === 'alert' && (
                <circle cx={ranger.x} cy={ranger.y} r="8" fill="#ef4444" opacity="0.5">
                  <animate attributeName="r" from="8" to="16" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={ranger.x}
                cy={ranger.y}
                r="6"
                fill={ranger.status === 'alert' ? '#ef4444' : ranger.status === 'moving' ? '#3b82f6' : '#10b981'}
                stroke="white"
                strokeWidth="2"
              />
            </g>
          ))}

          {/* Compass */}
          <g transform="translate(750, 30)">
            <circle cx="0" cy="0" r="20" fill="white" fillOpacity="0.9" stroke="#d1d5db" strokeWidth="1" />
            <text x="0" y="-8" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">N</text>
            <line x1="0" y1="-15" x2="0" y2="15" stroke="#d1d5db" strokeWidth="1" />
            <line x1="-15" y1="0" x2="15" y2="0" stroke="#d1d5db" strokeWidth="1" />
          </g>
        </svg>

        {/* Live tracking indicator */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-700 font-medium">Live Tracking</span>
          </div>
        </div>
      </div>

      {/* Map legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-gray-600 font-medium">Active Patrols</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600 font-medium">Alert Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600 font-medium">In Transit</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Coverage: <span className="text-emerald-600 font-semibold">87%</span>
        </div>
      </div>
    </div>
  );
};

export default OperationsMap;