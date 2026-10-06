import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  kbdShortcut?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      kbdShortcut,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Linear style: tighter line-height, subtle rounded geometry, razor-thin borders
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45';

    const sizeStyles = {
      xs: 'text-[11px] px-2 py-1 h-7 gap-1.5',
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-3.5 py-2 h-9 gap-2',
      lg: 'text-sm px-4.5 py-2.5 h-10 gap-2 font-semibold',
    }[size];

    const variantStyles = {
      primary:
        'bg-[#090A0F] text-white hover:bg-[#1E222B] active:bg-[#000000] shadow-xs border border-transparent',
      secondary:
        'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-950 active:bg-slate-100 shadow-2xs',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/70',
      destructive:
        'bg-white text-rose-600 border border-rose-200/80 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="inline-flex shrink-0 opacity-80">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0 opacity-80">{rightIcon}</span>}
        {kbdShortcut && (
          <kbd className="ml-1.5 hidden sm:inline-block rounded px-1 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200/60 leading-none">
            {kbdShortcut}
          </kbd>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
