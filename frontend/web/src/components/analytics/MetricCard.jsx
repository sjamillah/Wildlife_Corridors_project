import React from 'react';
import Card from '../shared/Card';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'brand' 
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change && (
          <span className={`text-sm font-semibold ${
            change.startsWith('+') ? 'text-brand-primary' : 
            change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </Card>
  );
};

export default MetricCard;