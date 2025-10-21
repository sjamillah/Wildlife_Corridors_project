import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-brand-primary hover:bg-brand-highlight text-white';
      case 'secondary':
        return 'bg-brand-secondary hover:bg-brand-accent text-brand-text';
      case 'outline':
        return 'border border-brand-accent hover:bg-brand-secondary text-brand-text';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-brand-primary hover:bg-brand-highlight text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  return (
    <button
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        font-medium rounded-xl transition-colors
        flex items-center space-x-2
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;