import React from 'react';
import { cn } from '../../utils/formatters';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('animate-pulse bg-gray-200/80 rounded', className)} />;
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
};
