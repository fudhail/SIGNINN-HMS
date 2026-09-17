import React from 'react';
import { cn } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'h-7 px-2.5 text-xs font-medium gap-1.5 rounded-md',
      sm: 'h-8 px-3 text-xs font-medium gap-1.5 rounded-md',
      md: 'h-9 px-4 text-sm font-medium gap-2 rounded-md',
      lg: 'h-10 px-5 text-sm font-semibold gap-2 rounded-lg',
    };

    const variantClasses = {
      primary: 'bg-[#172033] hover:bg-[#232F48] text-white shadow-xs focus-visible:ring-2 focus-visible:ring-[#172033]/30',
      secondary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500/30',
      outline: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-xs focus-visible:ring-2 focus-visible:ring-gray-300',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-red-500/30',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500/30',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none active:scale-[0.98]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : leftIcon}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
