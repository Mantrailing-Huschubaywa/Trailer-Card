
import React from 'react';
import Card from './Card';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  // `color` example: "bg-green-100 text-green-700"
  const [cardBgClass, cardTextClass] = color.split(' '); // e.g., ["bg-green-100", "text-green-700"]

  // Determine the icon circle's background color.
  // We'll use the color family from cardTextClass (e.g., text-green-700 -> bg-green-700)
  const iconBgClass = cardTextClass.replace('text-', 'bg-'); // e.g., "bg-green-700"

  return (
    <Card className={`flex-1 min-w-[200px] ${cardBgClass.replace('bg-', 'bg-opacity-')} border ${cardBgClass.replace('bg-', 'border-').replace('-100', '-200')} `}>
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${iconBgClass}`}> {/* Use the stronger iconBgClass */}
          <Icon className="h-6 w-6 text-white" /> {/* Icon remains white */}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
    </Card>
  );
};

export default StatCard;