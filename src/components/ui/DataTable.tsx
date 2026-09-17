import React from 'react';
import { cn } from '../../utils/formatters';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  compact?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No records found',
  emptyDescription = 'There are no entries to display for this view.',
  compact = false,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden p-6 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-1/4 animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn('w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'text-[11px] font-semibold text-gray-500 uppercase tracking-wider',
                    compact ? 'px-3 py-2' : 'px-4 py-3',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-800">{emptyMessage}</p>
                  <p className="text-xs text-gray-500 mt-1">{emptyDescription}</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowKey = keyExtractor(item);
                const isClickable = !!onRowClick;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'transition-colors duration-100',
                      isClickable ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gray-50/50'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${rowKey}-${col.key}`}
                        className={cn(
                          'text-xs text-gray-800 font-sans align-middle',
                          compact ? 'px-3 py-2' : 'px-4 py-3',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item, idx)
                          : ((item as Record<string, unknown>)[col.key] as React.ReactNode) ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
