
import React from 'react';

interface AvatarProps {
  initials: string;
  color: string; // Tailwind color class, e.g., 'bg-blue-500'
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ initials, color, className = '', size = 'md' }) => {
  const currentSizeClass = sizeClasses[size];
  return (
    <div
      className={`${color} ${currentSizeClass} flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
