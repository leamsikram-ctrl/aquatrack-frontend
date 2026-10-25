import React from 'react';

export type BadgeVariant = 'blue' | 'outline' | 'black';

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
  const variantStyles = {
    blue: 'bg-[#1E6FD9] text-white border border-[#1E6FD9] shadow-[0_2px_0_0_#104382]',
    outline: 'bg-white text-black border border-black/15 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]',
    black: 'bg-white text-black border border-black/15 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]', // Aliased to outline to strictly enforce 2 component variants
  }[variant] || 'bg-white text-black border border-black/15 shadow-[0_2px_0_0_rgba(0,0,0,0.08)]';

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
