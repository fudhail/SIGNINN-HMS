import React from 'react';
import { cn } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'alert' | 'success' | 'highlight';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  variant = 'default',
  onClick,
  className,
}) => {
  const isClickable = !!onClick;

  const variantStyles = {
    default: 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5',
    alert: 'bg-gradient-to-br from-rose-50/70 via-white to-white border-rose-200/80 hover:border-rose-300 shadow-xs hover:shadow-md hover:-translate-y-0.5',
    success: 'bg-gradient-to-br from-emerald-50/70 via-white to-white border-emerald-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md hover:-translate-y-0.5',
    highlight: 'bg-gradient-to-br from-blue-50/70 via-white to-white border-blue-200/80 hover:border-blue-300 shadow-xs hover:shadow-md hover:-translate-y-0.5',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative group',
        variantStyles[variant],
        isClickable && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-tight">{title}</span>
        {icon && <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 group-hover:text-slate-800 transition-colors">{icon}</div>}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">{value}</span>
        {change && (
          <span
            className={cn(
              'inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md gap-0.5',
              change.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            )}
          >
            {change.isPositive ? (
              <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-3 h-3 stroke-[2.5]" />
            )}
            {change.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium leading-tight">{subtitle}</p>}
    </div>
  );
};
