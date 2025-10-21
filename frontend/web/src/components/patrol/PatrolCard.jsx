import React from 'react';
import { MapPin, Clock, Users, Navigation } from '@/components/shared/Icons';
import Card from '../shared/Card';

const PatrolCard = ({ patrol, onView, onManage }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-brand-primary/10 text-brand-primary';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-brand-primary';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <Card className={`p-6 border-l-4 ${getPriorityColor(patrol.priority)} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white text-lg">
            {patrol.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{patrol.name}</h4>
            <p className="text-sm text-gray-600">{patrol.team} • {patrol.leader}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patrol.status)}`}>
          {patrol.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{patrol.currentLocation}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{patrol.startTime} ({patrol.expectedDuration})</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{patrol.members.length} members</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Navigation className="w-4 h-4" />
          <span>Progress: {patrol.progress}%</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Mission Progress</span>
          <span className="text-sm font-semibold text-brand-primary">{patrol.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full transition-all"
            style={{ width: `${patrol.progress}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        <p><strong>Route:</strong> {patrol.route}</p>
        <p><strong>Last Update:</strong> {patrol.lastUpdate}</p>
        <p><strong>Incidents:</strong> {patrol.incidents}</p>
      </div>

      {(onView || onManage) && (
        <div className="flex space-x-2">
          {onView && (
            <button 
              onClick={() => onView(patrol)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              View Details
            </button>
          )}
          {onManage && (
            <button 
              onClick={() => onManage(patrol)}
              className="flex-1 px-3 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
            >
              Manage
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default PatrolCard;