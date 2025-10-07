import React from 'react';

const Card = ({ children, className = '', size = 'md', variant = 'flat', ...props }) => {
  const sizeClass = size === 'sm' ? 'card-sm' : size === 'lg' ? 'card-lg' : 'card-md';
  const variantClass = `card-variant-${variant}`;
  return (
    <div className={`card-base ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;