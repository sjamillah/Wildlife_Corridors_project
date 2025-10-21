import React from 'react';
import { TrendingUp, AlertTriangle, Shield, Eye, Users, CheckCircle, Clock } from '../shared/Icons';

const WebMiniMapOverview = ({ className }) => {
  const corridorData = {
    activeMonitoring: 12,
    securedAreas: 8,
    recentAlerts: 3,
    patrolsToday: 6,
    weeklyTrend: '+8.5%'
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
  <div className="px-6 py-4 bg-brand-secondary border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Wildlife Corridors Status</h3>
            <p className="text-sm text-gray-600">East Africa conservation overview</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-brand-secondary rounded-full">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-brand-text">Live</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-brand-secondary rounded-lg p-4 border border-brand-accent">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-6 h-6 text-brand-primary" />
              <span className="text-2xl font-bold text-brand-primary">{corridorData.securedAreas}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Secured Areas</div>
            <div className="text-xs text-brand-primary">Protected zones</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{corridorData.activeMonitoring}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Monitoring</div>
            <div className="text-xs text-blue-600">Live surveillance</div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">{corridorData.recentAlerts}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Recent Alerts</div>
            <div className="text-xs text-amber-600">Needs attention</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{corridorData.patrolsToday}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Patrols Today</div>
            <div className="text-xs text-purple-600">Active teams</div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Weekly Performance</span>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-semibold text-brand-primary">{corridorData.weeklyTrend}</span>
            </div>
          </div>
          
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-brand-primary h-2 rounded-full" style={{ width: '78%' }}></div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Conservation Effectiveness</span>
            <span>78% Optimal</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium text-gray-700">System Status</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="mt-1">
            <span className="text-xs text-brand-primary font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebMiniMapOverview;
