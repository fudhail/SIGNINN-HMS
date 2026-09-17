import React from 'react';
import { Bed, Sparkles, AlertTriangle, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { RoomOccupancyStatus, HousekeepingStatus } from '../../types';

export interface RoomStatusIndicatorProps {
  occupancy: RoomOccupancyStatus;
  housekeeping: HousekeepingStatus;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'split' | 'compact' | 'stacked';
  className?: string;
}

export const RoomStatusIndicator: React.FC<RoomStatusIndicatorProps> = ({
  occupancy,
  housekeeping,
  size = 'sm',
  variant = 'split',
  className = '',
}) => {
  // Occupancy style
  const getOccupancyConfig = (occ: RoomOccupancyStatus) => {
    switch (occ) {
      case 'Occupied':
        return {
          label: 'Occupied',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'Reserved':
        return {
          label: 'Reserved',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'Vacant':
      default:
        return {
          label: 'Vacant',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
    }
  };

  // Housekeeping style
  const getHkConfig = (hk: HousekeepingStatus) => {
    switch (hk) {
      case 'Clean':
      case 'Ready':
        return {
          label: hk === 'Ready' ? 'Ready' : 'Clean',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />,
        };
      case 'Inspected':
        return {
          label: 'Inspected',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <ShieldCheck className="w-3 h-3 text-teal-600 shrink-0" />,
        };
      case 'Dirty':
        return {
          label: 'Dirty',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />,
        };
      case 'Cleaning':
      case 'Assigned':
        return {
          label: hk === 'Cleaning' ? 'In Progress' : 'Assigned',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3 h-3 text-blue-600 shrink-0" />,
        };
      default:
        return {
          label: hk,
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <Bed className="w-3 h-3 text-gray-500 shrink-0" />,
        };
    }
  };

  const occ = getOccupancyConfig(occupancy);
  const hk = getHkConfig(housekeeping);

  const textSize = size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-[11px]';
  const pad = size === 'xs' ? 'px-1.5 py-0.5' : size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${textSize} font-medium ${className}`}>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${occ.dot}`} />
          <span>{occ.label}</span>
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1 text-gray-600">
          {hk.icon}
          <span>{hk.label}</span>
        </span>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <span
          className={`inline-flex items-center gap-1 rounded font-medium border ${pad} ${textSize} ${occ.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${occ.dot}`} />
          {occ.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded font-medium border ${pad} ${textSize} ${hk.bg}`}
        >
          {hk.icon}
          {hk.label}
        </span>
      </div>
    );
  }

  // Default 'split' dual badge
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-md font-semibold border shadow-2xs ${pad} ${textSize} ${occ.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${occ.dot}`} />
        {occ.label}
      </span>
      <span
        className={`inline-flex items-center gap-1 rounded-md font-semibold border shadow-2xs ${pad} ${textSize} ${hk.bg}`}
      >
        {hk.icon}
        {hk.label}
      </span>
    </div>
  );
};
