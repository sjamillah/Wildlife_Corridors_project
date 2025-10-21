import React from 'react';

// Responsive container component for consistent spacing and layout
export const ResponsiveContainer = ({ children, className = '', padding = 'default' }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    default: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
    xl: 'p-8 sm:p-12 lg:p-16'
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'default',
  className = '' 
}) => {
  const gapClasses = {
    none: '',
    sm: 'gap-2 sm:gap-4',
    default: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12'
  };

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  const colClass = typeof cols === 'number' 
    ? gridClasses[cols] || gridClasses[4]
    : `grid-cols-${cols.default || 1} ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''} ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''} ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}`;

  return (
    <div className={`grid ${colClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children, 
  variant = 'default',
  hover = true,
  className = '',
  padding = 'default'
}) => {
  const variants = {
    default: 'bg-brand-surface border border-brand-border',
    elevated: 'bg-brand-surface border border-brand-border shadow-lg',
    flat: 'bg-brand-surface',
    outline: 'bg-brand-surface/50 border-2 border-brand-border',
    ghost: 'bg-transparent'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-12'
  };

  const hoverClass = hover ? 'hover:shadow-xl transition-all duration-300' : '';

  return (
    <div className={`rounded-xl ${variants[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

// Responsive text component
export const ResponsiveText = ({ 
  children, 
  size = 'base',
  weight = 'normal',
  color = 'default',
  className = ''
}) => {
  const sizes = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl'
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const colors = {
    default: 'text-brand-text',
    secondary: 'text-brand-text-secondary',
    primary: 'text-brand-primary',
    accent: 'text-brand-accent',
    success: 'text-status-success',
    warning: 'text-status-warning',
    error: 'text-status-error',
    info: 'text-status-info'
  };

  return (
    <span className={`${sizes[size]} ${weights[weight]} ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

// Responsive button component
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-brand-primary hover:bg-brand-highlight text-white',
    secondary: 'bg-brand-secondary hover:bg-brand-accent text-brand-text',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white',
    ghost: 'text-brand-primary hover:bg-brand-primary/10',
    success: 'bg-status-success hover:bg-green-600 text-white',
    warning: 'bg-status-warning hover:bg-yellow-600 text-white',
    error: 'bg-status-error hover:bg-red-600 text-white',
    info: 'bg-status-info hover:bg-blue-600 text-white'
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    default: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${disabledClass}
        rounded-lg font-medium transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Responsive spacing component
export const ResponsiveSpacing = ({ 
  children, 
  direction = 'vertical',
  size = 'default',
  className = ''
}) => {
  const directions = {
    vertical: 'space-y',
    horizontal: 'space-x'
  };

  const sizes = {
    none: '0',
    xs: '1',
    sm: '2',
    default: '4',
    lg: '6',
    xl: '8'
  };

  return (
    <div className={`${directions[direction]}-${sizes[size]} ${className}`}>
      {children}
    </div>
  );
};
