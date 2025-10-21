import React from 'react';

const Input = ({ 
  type = 'text', 
  placeholder = '', 
  label = '', 
  icon: Icon, 
  rightIcon: RightIcon,
  onRightIconClick,
  value,
  onChange,
  required = false,
  className = '' 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${RightIcon ? 'pr-12' : 'pr-4'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent ${className}`}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <RightIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;