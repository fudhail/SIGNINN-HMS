import React from 'react';
import { Globe, UserCheck, Briefcase } from 'lucide-react';
import { BookingSource } from '../../types';

export interface OTABadgeProps {
  source: BookingSource | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const OTABadge: React.FC<OTABadgeProps> = ({
  source,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const getStyle = (src: string) => {
    switch (src) {
      case 'Booking.com':
        return {
          bg: 'bg-[#003580] text-white border-[#00224f]',
          label: 'Booking.com',
          icon: 'B',
        };
      case 'MakeMyTrip':
        return {
          bg: 'bg-[#e41d24] text-white border-[#b71218]',
          label: 'MakeMyTrip',
          icon: 'MMT',
        };
      case 'Goibibo':
        return {
          bg: 'bg-[#ec5b24] text-white border-[#c24312]',
          label: 'Goibibo',
          icon: 'go',
        };
      case 'Airbnb':
        return {
          bg: 'bg-[#FF385C] text-white border-[#d92244]',
          label: 'Airbnb',
          icon: 'air',
        };
      case 'Agoda':
        return {
          bg: 'bg-[#1864ab] text-white border-[#0f4980]',
          label: 'Agoda',
          icon: 'ag',
        };
      case 'Expedia':
        return {
          bg: 'bg-[#00355f] text-[#ffcc00] border-[#002244]',
          label: 'Expedia',
          icon: 'Exp',
        };
      case 'Direct Website':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-300 font-semibold',
          label: 'Direct Engine',
          customIcon: <Globe className="w-3 h-3 text-teal-600" />,
        };
      case 'Walk-in':
      case 'Direct Walk-in':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold',
          label: 'Direct Walk-in',
          customIcon: <UserCheck className="w-3 h-3 text-indigo-600" />,
        };
      case 'Corporate':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
          label: 'Corporate B2B',
          customIcon: <Briefcase className="w-3 h-3 text-slate-600" />,
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-300',
          label: src,
          icon: 'OTA',
        };
    }
  };

  const style = getStyle(source);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border shadow-2xs leading-none select-none tracking-tight whitespace-nowrap ${
        sizeClasses[size]
      } ${style.bg} ${className}`}
    >
      {showIcon && (
        <>
          {style.customIcon ? (
            style.customIcon
          ) : (
            <span className="font-black text-[9px] uppercase tracking-tighter opacity-90">
              {style.icon}
            </span>
          )}
        </>
      )}
      <span>{style.label}</span>
    </span>
  );
};
