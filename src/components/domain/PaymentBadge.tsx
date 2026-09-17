import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RotateCcw, Ban } from 'lucide-react';
import { PaymentStatus } from '../../types';

export interface PaymentBadgeProps {
  status: PaymentStatus;
  amount?: number;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({
  status,
  amount,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const getStyle = (st: PaymentStatus) => {
    switch (st) {
      case 'Paid':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
          label: 'Paid in Full',
        };
      case 'Partially Paid':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
          label: 'Partially Paid',
        };
      case 'Unpaid':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />,
          label: 'Unpaid Folio',
        };
      case 'Refunded':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <RotateCcw className="w-3 h-3 text-indigo-600 shrink-0" />,
          label: 'Refunded',
        };
      case 'Void':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <Ban className="w-3 h-3 text-slate-500 shrink-0" />,
          label: 'Void',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <AlertCircle className="w-3 h-3 text-gray-500 shrink-0" />,
          label: st,
        };
    }
  };

  const style = getStyle(status);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border shadow-2xs whitespace-nowrap ${
        sizeClasses[size]
      } ${style.bg} ${className}`}
    >
      {showIcon && style.icon}
      <span>{style.label}</span>
      {amount !== undefined && amount > 0 && status !== 'Paid' && (
        <span className="font-mono text-[10px] ml-0.5 opacity-90">
          (₹{amount.toLocaleString('en-IN')})
        </span>
      )}
    </span>
  );
};
