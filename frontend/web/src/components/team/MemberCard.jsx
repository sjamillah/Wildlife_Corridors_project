import React from 'react';
import { Mail, Phone, MapPin } from '@/components/shared/Icons';
import Card from '../shared/Card';

const MemberCard = ({ member, onEdit, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-brand-primary/10 text-brand-primary';
      case 'on-patrol': return 'bg-blue-100 text-blue-700';
      case 'leave': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white font-semibold">
            {member.avatar}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{member.name}</h4>
            <p className="text-sm text-gray-600">{member.role}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
          {member.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{member.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{member.phone}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{member.location}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Performance</span>
          <span className="text-sm font-semibold text-brand-primary">{member.performance}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full transition-all"
            style={{ width: `${member.performance}%` }}
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        <p><strong>Assignment:</strong> {member.currentAssignment}</p>
        <p><strong>Joined:</strong> {member.joinDate}</p>
      </div>

      {(onEdit || onView) && (
        <div className="flex space-x-2 mt-4">
          {onView && (
            <button 
              onClick={() => onView(member)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              View
            </button>
          )}
          {onEdit && (
            <button 
              onClick={() => onEdit(member)}
              className="flex-1 px-3 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default MemberCard;