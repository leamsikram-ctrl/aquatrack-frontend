import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
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
    const baseStyles =
      'inline-flex items-center justify-center text-sm font-medium px-3.5 py-2 rounded-lg transition-all cursor-pointer select-none border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9]';

    const variantStyles = {
      primary:
        'bg-[#1E6FD9] text-white border-[#1E6FD9] hover:bg-[#1557AB] shadow-xs active:shadow-none',
      secondary:
        'bg-white text-black border-black/15 hover:border-black/30 hover:bg-[#F0F6FD] hover:text-[#1E6FD9] shadow-xs active:shadow-none',
      ghost:
        'bg-transparent text-black border-transparent hover:bg-[#F0F6FD] hover:text-[#1E6FD9]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon && <span className="mr-1.5 inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="ml-1.5 inline-flex items-center shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
