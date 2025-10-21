import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  const baseClasses = 'font-semibold rounded-lg transition duration-200 flex items-center justify-center';
  
  const variants = {
    primary: 'bg-brand-primary hover:bg-brand-highlight text-white',
    secondary: 'bg-brand-secondary hover:bg-brand-accent text-brand-text',
    outline: 'border-2 border-brand-accent text-brand-text hover:bg-brand-secondary'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4 text-lg'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;