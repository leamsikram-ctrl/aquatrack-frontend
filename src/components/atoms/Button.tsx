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
    // Uniform font-size (10px), clean borders, 3-color palette (Blue, White, Black)
    const baseStyles =
      'inline-flex items-center justify-center text-[10px] font-bold px-4 py-2 rounded-md transition-colors cursor-pointer select-none border disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9]';

    const variantStyles = {
      primary:
        'bg-[#1E6FD9] text-white border-[#1E6FD9] hover:bg-[#1557AB] active:bg-[#104382]',
      secondary:
        'bg-white text-black border-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] hover:border-[#1E6FD9]',
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
          leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
