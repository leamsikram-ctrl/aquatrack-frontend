import React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  mono?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  mono = false,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantStyles = {
    neutral: 'bg-slate-100/80 text-slate-700 border-slate-200/80',
    accent: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
    success: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60',
    warning: 'bg-amber-50/80 text-amber-900 border-amber-200/60',
    danger: 'bg-rose-50/80 text-rose-800 border-rose-200/60',
  }[variant];

  const dotColors = {
    neutral: 'bg-slate-400',
    accent: 'bg-[#2563EB]',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border select-none leading-none ${
        mono ? 'font-mono' : ''
      } ${sizeStyles} ${variantStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      <span>{children}</span>
    </span>
  );
};
