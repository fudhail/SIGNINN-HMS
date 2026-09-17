import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  accentColor?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  sparkline?: number[];
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = 'indigo',
  sparkline,
  onClick,
  className,
  badge,
}) => {
  const isClickable = !!onClick;

  const iconBgMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/80',
    blue: 'bg-blue-50 text-blue-600 border-blue-100/80',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/80',
    amber: 'bg-amber-50 text-amber-600 border-amber-100/80',
    rose: 'bg-rose-50 text-rose-600 border-rose-100/80',
    slate: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  // Generate SVG sparkline path if points provided
  let sparklinePath = '';
  if (sparkline && sparkline.length > 1) {
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const step = width / (sparkline.length - 1);
    const points = sparkline.map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    sparklinePath = `M ${points.join(' L ')}`;
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-5 bg-white rounded-2xl border border-gray-200/85 shadow-xs transition-all duration-200',
        isClickable && 'hover:border-indigo-300 hover:shadow-md cursor-pointer active:scale-[0.995]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-md">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-gray-950 font-sans">
              {value}
            </span>
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 duration-200',
              iconBgMap[accentColor]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px]',
                trend.isPositive
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-rose-700 bg-rose-50'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-3 h-3 stroke-[2.5]" />
              )}
              {trend.value}
            </span>
          )}
          {trend?.label ? (
            <span className="text-gray-400 text-[11px]">{trend.label}</span>
          ) : subtitle ? (
            <span className="text-gray-500 text-[11px] truncate">{subtitle}</span>
          ) : null}
        </div>

        {sparklinePath && (
          <svg className="w-20 h-6 overflow-visible shrink-0" viewBox="0 0 80 24">
            <path
              d={sparklinePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                trend?.isPositive
                  ? 'text-emerald-500'
                  : trend?.isPositive === false
                  ? 'text-rose-500'
                  : 'text-indigo-500'
              }
            />
          </svg>
        )}
      </div>
    </div>
  );
};
