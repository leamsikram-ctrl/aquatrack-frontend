import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Global button styling matching the Untitled UI design system with strict horizontal icon placement
    const baseStyles =
      'inline-flex flex-row items-center justify-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer select-none border whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1',
      md: 'text-[13px] px-3.5 py-1.5',
      lg: 'text-[14px] px-4 py-2',
    }[size];

    const variantStyles = {
      primary:
        'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-sm active:translate-y-0.5',
      secondary:
        'bg-white text-black border-slate-300 shadow-2xs hover:bg-slate-50 hover:border-slate-400 active:translate-y-0.5',
      ghost:
        'bg-transparent text-black hover:bg-black/5 border-transparent shadow-none active:translate-y-0.5',
      destructive:
        'bg-urgency-high hover:bg-red-700 text-white border-transparent shadow-sm active:translate-y-0.5',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span className="inline-flex flex-row items-center gap-1.5">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
