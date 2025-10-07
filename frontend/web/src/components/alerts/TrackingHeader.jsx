import React from 'react';
import { Plus } from 'lucide-react';

const TrackingHeader = ({ animals }) => {
  return (
    <div className="bg-warm border-b border-gray-200 px-8 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Live Tracking Intelligence</h1>
            <span className="px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-full">
              {animals.length} Tracked
            </span>
          </div>
          <p className="text-sm text-gray-500">Real-time monitoring and intelligent alert system</p>
        </div>
        <button className="px-5 py-2.5 bg-brand-primary hover:bg-brand-earth text-white font-semibold rounded-xl transition flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Asset</span>
        </button>
      </div>
    </div>
  );
};

export default TrackingHeader;