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
    default: 'bg-white border-gray-200 hover:border-gray-300',
    alert: 'bg-red-50/50 border-red-200 hover:border-red-300',
    success: 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300',
    highlight: 'bg-blue-50/40 border-blue-200 hover:border-blue-300',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border transition-all duration-150 relative group',
        variantStyles[variant],
        isClickable && 'cursor-pointer hover:shadow-xs active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-gray-500 tracking-tight">{title}</span>
        {icon && <div className="text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-gray-950 font-sans">{value}</span>
        {change && (
          <span
            className={cn(
              'inline-flex items-center text-[11px] font-semibold gap-0.5',
              change.isPositive ? 'text-emerald-700' : 'text-red-600'
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

      {subtitle && <p className="mt-1 text-[11px] text-gray-500 font-normal leading-tight">{subtitle}</p>}
    </div>
  );
};
