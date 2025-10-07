import React from 'react';
import { Activity, Navigation, AlertTriangle, Battery, Heart } from 'lucide-react';

const StatsBar = ({ animals }) => {
  const stats = [
    { 
      label: 'Total Tracked', 
      value: animals.length, 
      icon: Activity 
    },
    { 
      label: 'Active Now', 
      value: animals.filter(a => a.status === 'Moving').length, 
      icon: Navigation 
    },
    { 
      label: 'High Risk', 
      value: animals.filter(a => a.risk === 'High' || a.risk === 'Critical').length, 
      icon: AlertTriangle 
    },
    { 
      label: 'Low Battery', 
      value: animals.filter(a => a.battery < 30).length, 
      icon: Battery 
    },
    { 
      label: 'Health Alerts', 
      value: animals.filter(a => a.health === 'Monitoring').length, 
      icon: Heart 
    }
  ];

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-6">
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-warm rounded-xl p-6 border border-gray-100 h-28 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-brand-primary" />
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBar;