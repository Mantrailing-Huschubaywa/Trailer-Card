
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  error?: string;
  icon?: React.ElementType;
  onIconClick?: () => void;
}

const Input: React.FC<InputProps> = ({ label, id, error, icon: Icon, onIconClick, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white text-gray-900 ${
            Icon ? 'pr-10' : ''
          } ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {Icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            aria-label="Toggle password visibility"
          >
            <Icon className="h-5 w-5" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
