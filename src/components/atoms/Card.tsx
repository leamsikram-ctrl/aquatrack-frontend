import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  return (
    <div
      className={`rounded-lg border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all ${
        hoverable ? 'hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] cursor-pointer' : ''
      } ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
