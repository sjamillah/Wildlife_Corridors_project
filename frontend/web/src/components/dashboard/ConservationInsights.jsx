import React from 'react';
import { TrendingUp, AlertTriangle, Shield, Activity, Users, Clock, Zap, Eye, CheckCircle } from '@/components/shared/Icons';

const ConservationInsights = ({ className }) => {
  const conservationData = {
    speciesStats: {
      elephants: { count: 89, trend: '+5.2%', status: 'stable' },
      wildebeests: { count: 258, trend: '+12.8%', status: 'growing' }
    },
    threatLevels: {
      critical: 2,
      high: 5,
      medium: 8,
      low: 12
    },
    recentActivity: [
      { id: 1, type: 'patrol', message: 'Anti-poaching patrol completed in Sector 7', time: '2 hours ago', priority: 'high' },
      { id: 2, type: 'sighting', message: 'Elephant herd spotted near watering hole', time: '4 hours ago', priority: 'normal' },
      { id: 3, type: 'alert', message: 'Motion detected in restricted corridor zone', time: '6 hours ago', priority: 'critical' },
      { id: 4, type: 'maintenance', message: 'Camera trap maintenance completed', time: '8 hours ago', priority: 'low' }
    ],
    corridorStatus: {
      active: 6,
      monitored: 12,
      secured: 18
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-amber-600 bg-amber-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'patrol': return <Users className="w-4 h-4" />;
      case 'sighting': return <Eye className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`} style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
      <div className="px-6 py-4 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conservation Overview</h3>
            <p className="text-sm text-gray-600">Real-time wildlife corridor insights</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-brand-primary/20 rounded-full">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-brand-primary">Live Data</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Species Population</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-primary/10 rounded-lg p-4 border border-brand-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">🐘</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-primary">{conservationData.speciesStats.elephants.count}</div>
                  <div className="flex items-center text-sm text-brand-primary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{conservationData.speciesStats.elephants.trend}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">African Elephants</div>
              <div className="text-xs text-brand-primary capitalize">{conservationData.speciesStats.elephants.status}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">🦌</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{conservationData.speciesStats.wildebeests.count}</div>
                  <div className="flex items-center text-sm text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{conservationData.speciesStats.wildebeests.trend}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">Blue Wildebeests</div>
              <div className="text-xs text-blue-600 capitalize">{conservationData.speciesStats.wildebeests.status}</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Threat Assessment</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xl font-bold text-red-600">{conservationData.threatLevels.critical}</div>
              <div className="text-xs text-red-600 font-medium">Critical</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-xl font-bold text-amber-600">{conservationData.threatLevels.high}</div>
              <div className="text-xs text-amber-600 font-medium">High</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-xl font-bold text-blue-600">{conservationData.threatLevels.medium}</div>
              <div className="text-xs text-blue-600 font-medium">Medium</div>
            </div>
            <div className="text-center p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
              <div className="text-xl font-bold text-brand-primary">{conservationData.threatLevels.low}</div>
              <div className="text-xs text-brand-primary font-medium">Low</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Corridor Network</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-brand-primary/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-brand-primary" />
                <span className="font-medium text-gray-700">Secured Corridors</span>
              </div>
              <span className="text-2xl font-bold text-brand-primary">{conservationData.corridorStatus.secured}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Under Monitoring</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{conservationData.corridorStatus.monitored}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Active Patrols</span>
              </div>
              <span className="text-2xl font-bold text-gray-600">{conservationData.corridorStatus.active}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Activity</h4>
          <div className="space-y-3">
            {conservationData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-lg ${getPriorityColor(activity.priority)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-brand-primary" />
            <span className="text-brand-primary">Systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConservationInsights;