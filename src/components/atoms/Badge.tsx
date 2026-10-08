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
    blue: 'bg-[#1E6FD9] text-white border-[#1E6FD9]',
    outline: 'bg-white text-black border-black',
    black: 'bg-white text-black border-black', // Aliased to outline to strictly enforce 2 component variants
  }[variant] || 'bg-white text-black border-black';

  return (
    <span
      className={`inline-flex items-center text-[14px] font-bold px-2.5 py-0.5 rounded-full border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
