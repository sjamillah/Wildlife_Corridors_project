import React from 'react';

const ThreatRadar = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Threat Distribution</h3>
      <div className="relative w-full aspect-square">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Radar circles */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="#d1fae5" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#a7f3d0" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#6ee7b7" strokeWidth="1" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="#34d399" strokeWidth="1" />
          
          {/* Grid lines */}
          <line x1="100" y1="20" x2="100" y2="180" stroke="#d1fae5" strokeWidth="1" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#d1fae5" strokeWidth="1" />
          
          {/* Threat points */}
          {[
            { angle: 30, distance: 68, color: '#ef4444', size: 6 },
            { angle: 120, distance: 48, color: '#f59e0b', size: 5 },
            { angle: 200, distance: 32, color: '#eab308', size: 4 },
            { angle: 280, distance: 56, color: '#ef4444', size: 6 },
            { angle: 340, distance: 40, color: '#f59e0b', size: 5 },
          ].map((point, idx) => {
            const rad = (point.angle * Math.PI) / 180;
            const x = 100 + point.distance * Math.cos(rad);
            const y = 100 + point.distance * Math.sin(rad);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={point.size}
                fill={point.color}
              />
            );
          })}

          {/* Center point */}
          <circle cx="100" cy="100" r="8" fill="#10b981" />
          <circle cx="100" cy="100" r="4" fill="white" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
          <div className="text-lg font-bold text-red-600">5</div>
          <div className="text-xs text-gray-600">Critical</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
          <div className="text-lg font-bold text-amber-600">3</div>
          <div className="text-xs text-gray-600">High</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="text-lg font-bold text-yellow-600">2</div>
          <div className="text-xs text-gray-600">Medium</div>
        </div>
      </div>
    </div>
  );
};

export default ThreatRadar;