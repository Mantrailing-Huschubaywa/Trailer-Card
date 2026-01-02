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
    <Card className={`${cardBgClass.replace('bg-', 'bg-opacity-')} border ${cardBgClass.replace('bg-', 'border-').replace('-100', '-200')} `}>
      <div className="grid grid-cols-[auto,1fr] gap-4 items-center">
        {/* Column 1: Icon (auto width) */}
        <div className={`p-3 rounded-full ${iconBgClass}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {/* Column 2: Text (takes remaining space) */}
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500 break-words">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
    </Card>
  );
};

export default StatCard;