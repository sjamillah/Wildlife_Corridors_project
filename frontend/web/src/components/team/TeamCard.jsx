import React from 'react';
import Card from '../shared/Card';

const TeamCard = ({ team, onManage, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-brand-primary/10 text-brand-primary';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'deployed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
          {team.status}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Team Leader:</span>
          <span className="font-medium">{team.leader}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Members:</span>
          <span className="font-medium">{team.members}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Department:</span>
          <span className="font-medium">{team.department}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Current Mission:</span>
          <span className="font-medium">{team.currentMission}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Efficiency</span>
          <span className="text-sm font-semibold text-brand-primary">{team.efficiency}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full"
            style={{ width: `${team.efficiency}%` }}
          />
        </div>
      </div>

      {(onManage || onView) && (
        <div className="flex space-x-2">
          {onView && (
            <button 
              onClick={() => onView(team)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              View Details
            </button>
          )}
          {onManage && (
            <button 
              onClick={() => onManage(team)}
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

export default TeamCard;