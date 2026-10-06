import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, id, className = '', disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-black">
            {label}
            {props.required && <span className="text-[#1E6FD9] ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center text-black">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-10 px-3 text-sm text-black bg-white border rounded-md transition-colors placeholder:text-black/40 outline-none
              ${leftIcon ? 'pl-9' : ''}
              ${
                error
                  ? 'border-black ring-2 ring-black'
                  : 'border-black hover:border-[#1E6FD9] focus:border-[#1E6FD9] focus:ring-1 focus:ring-[#1E6FD9]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-sm font-medium text-black">
            [!] {error}
          </p>
        ) : helperText ? (
          <p className="text-sm text-black/70">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
