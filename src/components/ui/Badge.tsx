import React from 'react';
import { cn, getStatusColor, getChannelBadgeStyle } from '../../utils/formatters';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'status' | 'channel' | 'default' | 'outline';
  status?: string;
  channel?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  channel,
  dot = false,
  size = 'md',
  children,
  ...props
}) => {
  let styleClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotColor = 'bg-gray-400';

  if (variant === 'status' && status) {
    const sc = getStatusColor(status);
    styleClasses = `${sc.bg} ${sc.text} ${sc.border}`;
    dotColor = sc.dot;
  } else if (variant === 'channel' && channel) {
    const cc = getChannelBadgeStyle(channel);
    styleClasses = `${cc.bg} ${cc.text} ${cc.border}`;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight font-medium rounded',
    md: 'px-2.5 py-1 text-xs leading-none font-medium rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border whitespace-nowrap tracking-normal font-sans',
        sizeClasses[size],
        styleClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />}
      <span>{children || status || channel}</span>
    </span>
  );
};
