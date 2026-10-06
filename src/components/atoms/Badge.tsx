import React from 'react';

export type BadgeVariant = 'blue' | 'black' | 'outline';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  icon,
  className = '',
}) => {
  const variantStyles = {
    blue: 'bg-[#1E6FD9] text-white border-[#1E6FD9]',
    black: 'bg-black text-white border-black',
    outline: 'bg-white text-black border-black/15 shadow-2xs',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-0.5 rounded-full border ${variantStyles} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
