
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  none: 'p-0',
};

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md' }) => {
  return (
    <div className={`bg-white rounded-lg shadow ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
