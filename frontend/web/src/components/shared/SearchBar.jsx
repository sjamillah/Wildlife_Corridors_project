import React from 'react';

const SearchBar = ({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  icon: Icon,
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400`}
      />
    </div>
  );
};

export default SearchBar;