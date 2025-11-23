import React from 'react';
import { Activity, Navigation, AlertTriangle, Battery, Heart } from '@/components/shared/Icons';

const StatsBar = ({ animals = [] }) => {
  // Filter to only active animals (matching mobile app behavior)
  const activeAnimals = animals.filter(a => {
    const status = a.status || '';
    return status === 'active' || status === 'Active' || status === 'Moving' || 
           (a.activityType === 'moving' && (a.speed || 0) > 0.5);
  });
  
  const stats = [
    { 
      label: 'Total Tracked', 
      value: animals.length, 
      icon: Activity 
    },
    { 
      label: 'Active Now', 
      value: activeAnimals.length, 
      icon: Navigation 
    },
    { 
      label: 'High Risk', 
      value: animals.filter(a => {
        const risk = a.risk || a.riskLevel || a.riskStatus || 'low';
        const riskStr = String(risk).toLowerCase();
        return riskStr === 'high' || riskStr === 'critical' || 
               a.riskLevel === 'high' || a.riskLevel === 'critical' ||
               a.riskStatus === 'high';
      }).length, 
      icon: AlertTriangle 
    },
    { 
      label: 'Low Battery', 
      value: animals.filter(a => {
        const battery = a.battery || a.batteryLevel || 100;
        return battery < 30;
      }).length, 
      icon: Battery 
    },
    { 
      label: 'Health Alerts', 
      value: animals.filter(a => {
        const health = a.health || a.health_status || 'Good';
        return health === 'Monitoring' || health === 'Warning' || health === 'Critical';
      }).length, 
      icon: Heart 
    }
  ];

  return (
    <div className="bg-gradient-to-r from-brand-primary to-brand-secondary px-8 py-6">
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-brand-primary rounded-xl p-6 border border-brand-primary h-28 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-brand-accent" />
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-sm text-brand-accent font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsBar;