
import React from 'react';
import {
  TrailBadgeOnTheWayIcon,
  TrailBadge10Icon,
  TrailBadge50Icon,
  TrailBadge100Icon,
  TrailBadge500Icon,
} from './Icons';

interface TrailBadgesProps {
  totalTrails: number;
}

const TrailBadges: React.FC<TrailBadgesProps> = ({ totalTrails }) => {
  // Für neue Kunden mit weniger als 10 Trails wird das "On the Way"-Abzeichen angezeigt.
  if (totalTrails < 10) {
    return (
      <div className="flex justify-center items-center py-4 min-h-[140px]">
        <TrailBadgeOnTheWayIcon
          className="h-32 w-32 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
        />
      </div>
    );
  }

  const badgeGroups = [];
  let remainingTrails = totalTrails;

  // --- Rendern der 500er-Abzeichen ---
  const num500 = Math.floor(remainingTrails / 500);
  if (num500 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num500; i++) {
      currentGroup.push(
        <div key={`500-${i}`} className="relative first:ml-0 -ml-14">
          <TrailBadge500Icon
            className="h-44 w-44 [filter:drop-shadow(0_5px_4px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-500" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 500;
  }

  // --- Rendern der 100er-Abzeichen ---
  const num100 = Math.floor(remainingTrails / 100);
  if (num100 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num100; i++) {
      currentGroup.push(
        <div key={`100-${i}`} className="relative first:ml-0 -ml-12">
          <TrailBadge100Icon
            className="h-40 w-40 [filter:drop-shadow(0_4px_3px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-100" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 100;
  }

  // --- Rendern der 50er-Abzeichen ---
  const num50 = Math.floor(remainingTrails / 50);
  if (num50 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num50; i++) {
      currentGroup.push(
        <div key={`50-${i}`} className="relative first:ml-0 -ml-12">
          <TrailBadge50Icon
            className="h-36 w-36 [filter:drop-shadow(0_3px_2px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-50" className="flex items-center">{currentGroup}</div>);
    remainingTrails %= 50;
  }
  
  // --- Rendern der 10er-Abzeichen ---
  const num10 = Math.floor(remainingTrails / 10);
  if (num10 > 0) {
    const currentGroup = [];
    for (let i = 0; i < num10; i++) {
       currentGroup.push(
        <div key={`10-${i}`} className="relative first:ml-0 -ml-11">
          <TrailBadge10Icon
            className="h-32 w-32 [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
          />
        </div>
      );
    }
    badgeGroups.push(<div key="group-10" className="flex items-center">{currentGroup}</div>);
  }

  return (
    <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-4 py-4 min-h-[140px]">
      {badgeGroups}
    </div>
  );
};

export default TrailBadges;
