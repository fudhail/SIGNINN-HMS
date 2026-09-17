import React from 'react';
import { cn } from '../../utils/formatters';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-gray-300 rounded-xl',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
