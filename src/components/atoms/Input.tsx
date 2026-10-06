import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, id, className = '', disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-slate-700 select-none"
          >
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center justify-center text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full h-9 rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all outline-none
              ${leftIcon ? 'pl-9' : ''}
              ${rightIcon ? 'pr-9' : ''}
              ${
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300 focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/20'
              }
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-rose-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
