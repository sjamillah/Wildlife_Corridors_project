import React from 'react';
import { AlertTriangle, Activity, Brain, ChevronRight, MapPin, Clock } from '@/components/shared/Icons';

const ThreatTimeline = () => {
  const alerts = [
    { 
      id: 1,
      time: '10:30 AM', 
      type: 'GEOFENCE', 
      message: 'Elephant Herd #12 approaching Village X perimeter', 
      severity: 'CRITICAL', 
      icon: AlertTriangle,
      location: 'Grid C4-7',
      timeAgo: '23m ago'
    },
    { 
      id: 2,
      time: '12:05 PM', 
      type: 'HEALTH', 
      message: 'Elephant calf #3 showing distress signals', 
      severity: 'HIGH', 
      icon: Activity,
      location: 'Grid B2-5',
      timeAgo: '1h ago'
    },
    { 
      id: 3,
      time: '2:20 PM', 
      type: 'PREDICTIVE', 
      message: 'AI detected elevated predator activity near Waterhole Y', 
      severity: 'MEDIUM', 
      icon: Brain,
      location: 'Grid A3-8',
      timeAgo: '3h ago'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Simple Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Threats</h3>
          <button className="text-brand-primary hover:text-brand-primary text-sm font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile-style Alert Cards */}
      <div className="p-4 space-y-3">
        {alerts.map((alert) => {
          const IconComponent = alert.icon;
          return (
            <div key={alert.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
              {/* Alert Header */}
              <div className="flex items-start gap-3 mb-3">
                {/* Icon Circle */}
                <div className={`w-10 h-10 ${getSeverityColor(alert.severity)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                
                {/* Alert Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{alert.type}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                </div>
                
                {/* Time Badge */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-500 font-medium">{alert.timeAgo}</div>
                </div>
              </div>

              {/* Alert Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{alert.location}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3" />
                  <span>{alert.time}</span>
                </div>
                <button className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-medium rounded-lg transition-colors">
                  Respond
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{alerts.length} active alerts</span>
          <span>Last updated: just now</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatTimeline;