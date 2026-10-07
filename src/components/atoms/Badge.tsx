import React from 'react';

export type BadgeVariant = 'blue' | 'black' | 'outline';

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
    black: 'bg-black text-white border-black',
    outline: 'bg-white text-black border-black',
  }[variant];

  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
