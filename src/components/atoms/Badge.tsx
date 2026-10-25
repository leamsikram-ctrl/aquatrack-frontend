import React from 'react';

export type BadgeVariant =
  | 'blue'
  | 'outline'
  | 'black'
  // Urgency variants
  | 'high'
  | 'medium'
  | 'low'
  // Request status variants
  | 'submitted'
  | 'assigned'
  | 'in-progress'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'
  // Account status variants
  | 'pending'
  | 'active'
  | 'declined'
  | 'inactive';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    // Base Design System variants
    blue: 'bg-brand-blue text-white border border-brand-blue shadow-[0_2px_0_0_var(--color-brand-blue-shadow)]',
    outline: 'bg-white text-black border border-black/15 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]',
    black: 'bg-white text-black border border-black/15 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]',

    // Urgency variants
    high: 'bg-red-50 text-urgency-high border border-red-200',
    medium: 'bg-amber-50 text-urgency-medium border border-amber-200',
    low: 'bg-emerald-50 text-urgency-low border border-emerald-200',

    // Request status variants
    submitted: 'bg-blue-50 text-brand-blue border border-blue-200',
    assigned: 'bg-slate-100 text-assigned border border-slate-300',
    'in-progress': 'bg-brand-blue text-white border border-brand-blue',
    in_progress: 'bg-brand-blue text-white border border-brand-blue',
    resolved: 'bg-emerald-50 text-urgency-low border border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border border-slate-300',

    // Account status variants
    pending: 'bg-amber-50 text-amber-800 border border-amber-300 font-bold',
    active: 'bg-emerald-600 text-white border border-emerald-600 font-bold',
    declined: 'bg-red-50 text-urgency-high border border-red-200',
    inactive: 'bg-slate-100 text-slate-700 border border-slate-300',
  };

  const selectedStyle = variantStyles[variant] || variantStyles.outline;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${selectedStyle} ${className}`}
    >
      {children}
    </span>
  );
};
