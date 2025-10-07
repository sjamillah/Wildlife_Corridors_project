import React from 'react';

const StatCard = ({ label, value, change, color, icon: Icon }) => {
  return (
    <div className="bg-warm border border-gray-100 rounded-2xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div className={`${color} w-14 h-14 rounded-xl flex items-center justify-center`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-600 mb-3 tracking-wide uppercase">{label}</h3>
      <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{change}</p>
    </div>
  );
};

export default StatCard;