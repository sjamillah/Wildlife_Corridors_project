import React from 'react';

const ThreatTimeline = () => {
  const alerts = [
    { time: '10:30', type: 'GEOFENCE', message: 'Elephant Herd #12 - Village X perimeter breach', severity: 'CRITICAL', color: 'red' },
    { time: '12:05', type: 'HEALTH', message: 'Elephant calf #3 - Distress signals detected', severity: 'HIGH', color: 'amber' },
    { time: '14:20', type: 'PREDICTIVE', message: 'AI Alert - Elevated predator activity Waterhole Y', severity: 'MEDIUM', color: 'yellow' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900">Active Threat Timeline</h3>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition">
          View All Alerts
        </button>
      </div>

      <div className="relative">
        {/* SVG Timeline */}
        <svg viewBox="0 0 100 300" className="absolute left-0 top-0 w-16 h-full">
          <defs>
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <line x1="50" y1="0" x2="50" y2="300" stroke="url(#timelineGradient)" strokeWidth="2" />
          
          {[0, 100, 200].map((y, idx) => (
            <circle
              key={idx}
              cx="50"
              cy={y + 20}
              r="6"
              fill={idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#eab308'}
              stroke="white"
              strokeWidth="3"
            />
          ))}
        </svg>

        <div className="space-y-6 pl-16">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2.5 py-1 bg-${alert.color}-50 text-${alert.color}-700 text-xs font-semibold rounded-lg border border-${alert.color}-200`}>
                      {alert.type}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{alert.time}</span>
                    <span className={`px-2.5 py-1 bg-${alert.color}-500 text-white text-xs font-semibold rounded-lg`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{alert.message}</p>
                </div>
                <button className="ml-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition border border-emerald-200">
                  Respond
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreatTimeline;