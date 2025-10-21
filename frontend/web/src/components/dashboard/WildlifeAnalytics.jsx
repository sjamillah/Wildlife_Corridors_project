import React, { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Eye, Activity } from '@/components/shared/Icons';

const WildlifeAnalytics = () => {
  // Sample analytics data
  const analytics = useMemo(() => ({
    totalSightings: 347,
    sightingsChange: 12.5,
    threatLevel: 'Medium',
    speciesTracked: 2,
    patrolsToday: 8,
    incidentsToday: 2,
    weeklyTrend: [45, 52, 38, 61, 47, 55, 62]
  }), []);

  const speciesData = useMemo(() => ([
    { name: 'Elephants', count: 89, status: 'stable', change: 2.1 },
    { name: 'Wildebeests', count: 258, status: 'increasing', change: 8.5 }
  ]), []);

  const getStatusColor = (status) => {
    switch (status) {
  case 'stable': return 'text-brand-primary bg-brand-secondary';
      case 'increasing': return 'text-blue-600 bg-blue-50';
      case 'critical': return 'text-red-600 bg-red-50';
      case 'decreasing': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (change) => {
  if (change > 0) return <TrendingUp className="w-3 h-3 text-brand-primary" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Activity className="w-3 h-3 text-gray-600" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Wildlife Analytics</h3>
          <p className="text-xs text-gray-500">Population trends & conservation metrics</p>
        </div>
  <div className="flex items-center space-x-2 bg-brand-secondary px-3 py-2 rounded-full border border-brand-accent">
          <Eye className="w-3 h-3 text-brand-primary" />
          <span className="text-xs font-medium text-brand-text">Monitoring</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sightings */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {getTrendIcon(analytics.sightingsChange)}
              <span className={analytics.sightingsChange > 0 ? 'text-brand-primary' : 'text-red-600'}>
                {Math.abs(analytics.sightingsChange)}%
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.totalSightings}</div>
          <div className="text-xs text-gray-600">Weekly Sightings</div>
        </div>

        {/* Threat Level */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xs text-amber-600 font-medium">{analytics.incidentsToday} today</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.threatLevel}</div>
          <div className="text-xs text-gray-600">Threat Level</div>
        </div>

        {/* Active Patrols */}
  <div className="bg-brand-secondary rounded-xl p-4 border border-brand-accent">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-brand-secondary rounded-lg">
              <Shield className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.patrolsToday}</div>
          <div className="text-xs text-gray-600">Active Patrols</div>
        </div>

        {/* Species Count */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs text-purple-600 font-medium">Tracked</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.speciesTracked}</div>
          <div className="text-xs text-gray-600">Species Types</div>
        </div>
      </div>

      {/* Species Population Breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Population Status</h4>
        <div className="space-y-3">
          {speciesData.map((species, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{species.name}</div>
                  <div className="text-xs text-gray-500">{species.count} individuals</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(species.status)}`}>
                  {species.status}
                </span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(species.change)}
                  <span className="text-xs text-gray-600">{Math.abs(species.change)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Chart (Simple Visual) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Weekly Activity Trend</h4>
        <div className="flex items-end justify-between h-16 space-x-1">
          {analytics.weeklyTrend.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-brand-primary rounded-t"
                style={{ height: `${(value / Math.max(...analytics.weeklyTrend)) * 100}%` }}
              ></div>
              <div className="text-xs text-gray-500 mt-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(WildlifeAnalytics);