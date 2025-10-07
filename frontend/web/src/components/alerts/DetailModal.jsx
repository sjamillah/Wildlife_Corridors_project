import React from 'react';
import { X, Activity, Zap, Battery, Heart, Navigation, CheckCircle, AlertTriangle, Eye, Edit } from 'lucide-react';

const DetailModal = ({ animal, onClose }) => {
  if (!animal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {React.createElement(animal.icon, { className: "w-16 h-16 text-white" })}
              <div>
                <h2 className="text-3xl font-bold mb-2">{animal.name}</h2>
                <p className="text-white/90 text-lg">{animal.species}</p>
                <p className="text-white/80 text-sm font-mono mt-1">ID: {animal.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition bg-white/10 rounded-xl p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs text-brand-primary font-medium">Status</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{animal.status}</p>
                </div>
                <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                  <div className="flex items-center space-x-2 mb-1">
                    <Zap className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs text-brand-primary font-medium">Speed</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{animal.speed} km/h</p>
                </div>
                <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                  <div className="flex items-center space-x-2 mb-1">
                    <Battery className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs text-brand-primary font-medium">Battery</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{animal.battery}%</p>
                </div>
                <div className="bg-brand-accent rounded-lg p-3 border border-brand-moss">
                  <div className="flex items-center space-x-2 mb-1">
                    <Heart className="w-4 h-4 text-brand-moss" />
                    <span className="text-xs text-brand-primary font-medium">Health</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{animal.health}</p>
                </div>
              </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-brand-accent border border-brand-moss rounded-2xl p-6">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wide mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Species:</span>
                    <span className="font-semibold text-gray-900">{animal.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-semibold text-gray-900">{animal.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-semibold text-gray-900">{animal.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collar Date:</span>
                    <span className="font-semibold text-gray-900">{animal.collarDate}</span>
                  </div>
                </div>
              </div>

            {/* Location Data */}
              <div className="bg-brand-accent border border-brand-moss rounded-2xl p-6">
                <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wide mb-4">Location Data</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Location:</span>
                    <span className="font-semibold text-gray-900">{animal.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {animal.coordinates[0].toFixed(4)}°, {animal.coordinates[1].toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-semibold text-gray-900">{animal.lastSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Movement Speed:</span>
                    <span className="font-semibold text-gray-900">{animal.speed} km/h</span>
                  </div>
                </div>
              </div>
          </div>

          {/* Movement Map Visualization */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 mb-6 border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4">Movement Pattern (Last 24h)</h3>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <svg viewBox="0 0 400 200" className="w-full h-48">
                <defs>
                  <pattern id="movementGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c7d2fe" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                
                <rect width="400" height="200" fill="url(#movementGrid)" />
                
                {/* Movement trail */}
                <polyline
                  points="50,160 100,140 150,150 200,130 250,145 300,125 350,140"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8,4"
                  opacity="0.6"
                />

                {/* Historical points */}
                {[
                  { x: 50, y: 160 },
                  { x: 100, y: 140 },
                  { x: 150, y: 150 },
                  { x: 200, y: 130 },
                  { x: 250, y: 145 },
                  { x: 300, y: 125 }
                ].map((point, idx) => (
                  <circle
                    key={idx}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#10b981"
                    opacity="0.4"
                  />
                ))}

                {/* Current position with pulse */}
                <circle cx="350" cy="140" r="12" fill="#10b981" opacity="0.2">
                  <animate attributeName="r" from="12" to="20" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.2" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="350" cy="140" r="8" fill="#10b981" stroke="white" strokeWidth="2" />
                <circle cx="350" cy="140" r="4" fill="white" />
              </svg>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Health Status</p>
                  <p className="text-lg font-bold text-green-900">{animal.health}</p>
                </div>
              </div>
            </div>
            <div className={`border rounded-2xl p-4 ${
              animal.risk === 'Critical' ? 'bg-red-50 border-red-200' :
              animal.risk === 'High' ? 'bg-orange-50 border-orange-200' :
              animal.risk === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  animal.risk === 'Critical' ? 'bg-red-500' :
                  animal.risk === 'High' ? 'bg-orange-500' :
                  animal.risk === 'Medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${
                    animal.risk === 'Critical' ? 'text-red-700' :
                    animal.risk === 'High' ? 'text-orange-700' :
                    animal.risk === 'Medium' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>Risk Level</p>
                  <p className={`text-lg font-bold ${
                    animal.risk === 'Critical' ? 'text-red-900' :
                    animal.risk === 'High' ? 'text-orange-900' :
                    animal.risk === 'Medium' ? 'text-yellow-900' :
                    'text-blue-900'
                  }`}>{animal.risk}</p>
                </div>
              </div>
            </div>
            <div className={`border rounded-2xl p-4 ${
              animal.battery > 50 ? 'bg-green-50 border-green-200' :
              animal.battery > 20 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  animal.battery > 50 ? 'bg-green-500' :
                  animal.battery > 20 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  <Battery className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${
                    animal.battery > 50 ? 'text-green-700' :
                    animal.battery > 20 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>Battery Level</p>
                  <p className={`text-lg font-bold ${
                    animal.battery > 50 ? 'text-green-900' :
                    animal.battery > 20 ? 'text-yellow-900' :
                    'text-red-900'
                  }`}>{animal.battery}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Live Track</span>
            </button>
            <button className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>View History</span>
            </button>
            <button className="px-6 py-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-xl transition flex items-center justify-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Recent Activity Log */}
          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { time: '2 hours ago', activity: 'Moved from Sector A to current location', icon: Navigation },
                { time: '5 hours ago', activity: 'Feeding activity detected', icon: Activity },
                { time: '8 hours ago', activity: 'GPS collar check - all systems normal', icon: CheckCircle }
              ].map((log, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <log.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.activity}</p>
                    <p className="text-xs text-gray-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;