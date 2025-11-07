import React, { memo, useMemo } from 'react';
import { AlertTriangle, Shield, Radio, Users } from '@/components/shared/Icons';

const ThreatRadar = () => {
  const securityIncidents = useMemo(() => ([
    { 
      id: 1, 
      type: 'Poaching Alert', 
      description: 'Suspicious vehicle spotted near elephant herd',
      severity: 'Critical', 
      time: '23 minutes ago', 
      rangers: 3,
      status: 'Responding',
      coordinates: 'Grid C4-7'
    },
    { 
      id: 2, 
      type: 'Fence Breach', 
      description: 'Perimeter fence damaged - possible entry point',
      severity: 'High', 
      time: '1 hour ago', 
      rangers: 2,
      status: 'Investigating',
      coordinates: 'Grid A2-3'
    },
    { 
      id: 3, 
      type: 'Vehicle Intrusion', 
      description: 'Unauthorized vehicle in restricted zone',
      severity: 'Medium', 
      time: '3 hours ago', 
      rangers: 1,
      status: 'Monitoring',
      coordinates: 'Grid B5-8'
    },
  ]), []);

  const rangerOperations = useMemo(() => ([
    { id: 1, operation: 'Patrol Alpha', rangers: 4, status: 'Active', area: 'Northern Sector', nextCheckIn: '30 min' },
    { id: 2, operation: 'Patrol Bravo', rangers: 3, status: 'Active', area: 'Eastern Corridor', nextCheckIn: '45 min' },
    { id: 3, operation: 'Response Team', rangers: 5, status: 'Standby', area: 'Command Center', nextCheckIn: 'On call' },
  ]), []);

  const getSeverityColor = (severity) => {
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getSeverityIcon = (severity) => {
    return <Shield className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    return 'bg-white text-gray-700 border border-gray-300';
  };

  const criticalIncidents = useMemo(() => securityIncidents.filter(i => i.severity === 'Critical').length, [securityIncidents]);
  const highIncidents = useMemo(() => securityIncidents.filter(i => i.severity === 'High').length, [securityIncidents]);
  const totalIncidents = useMemo(() => securityIncidents.length, [securityIncidents]);
  const activeRangers = useMemo(() => rangerOperations.reduce((total, op) => total + op.rangers, 0), [rangerOperations]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
              <Radio className="w-5 h-5 text-blue-600 mr-2" />
              Security Operations
            </h3>
            <p className="text-sm text-gray-600">Real-time incident management & ranger operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-red-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-700">{criticalIncidents} Critical</span>
            </div>
            <div className="flex items-center space-x-2 bg-brand-secondary px-3 py-1 rounded-full">
              <Users className="w-3 h-3 text-brand-primary" />
              <span className="text-xs font-medium text-brand-text">{activeRangers} Rangers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalIncidents}</div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{highIncidents}</div>
            <div className="text-xs text-gray-600">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {securityIncidents.filter(i => i.severity === 'Medium').length}
            </div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalIncidents}</div>
            <div className="text-xs text-gray-600">Total Active</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
          Active Security Incidents
        </h4>
        <div className="space-y-3">
          {securityIncidents.map((incident) => (
            <div key={incident.id} className={`p-3 rounded-lg border ${getSeverityColor(incident.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(incident.severity)}
                  <div>
                    <div className="font-medium text-sm">{incident.type}</div>
                    <div className="text-xs text-gray-600 mt-1">{incident.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Location: {incident.coordinates}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{incident.time}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{incident.rangers} Rangers Deployed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Shield className="w-4 h-4 text-brand-primary mr-2" />
          Ranger Operations
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {rangerOperations.map((operation) => (
            <div key={operation.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${operation.status === 'Active' ? 'bg-brand-primary' : 'bg-gray-400'}`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{operation.operation}</div>
                  <div className="text-xs text-gray-600">{operation.area}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{operation.rangers} Rangers</div>
                <div className="text-xs text-gray-500">Next check: {operation.nextCheckIn}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Command Center • Last updated: {new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">
              Emergency Response
            </button>
            <button className="px-3 py-1 bg-brand-primary text-white rounded-lg text-xs font-medium hover:bg-brand-highlight transition-colors">
              Deploy Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ThreatRadar);