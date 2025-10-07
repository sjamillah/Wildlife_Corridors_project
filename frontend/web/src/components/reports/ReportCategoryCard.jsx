import React from 'react';

const ReportCategoryCard = ({ 
  category, 
  isSelected, 
  onClick 
}) => {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`w-full p-6 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-200 bg-white hover:border-emerald-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-emerald-500' : 'bg-gray-100'
        }`}>
          <category.icon className={`w-6 h-6 ${
            isSelected ? 'text-white' : 'text-gray-600'
          }`} />
        </div>
        <span className={`text-2xl font-bold ${
          isSelected ? 'text-emerald-600' : 'text-gray-900'
        }`}>
          {category.count}
        </span>
      </div>
      <h3 className={`font-semibold ${
        isSelected ? 'text-emerald-900' : 'text-gray-900'
      }`}>
        {category.label}
      </h3>
    </button>
  );
};

export default ReportCategoryCard;