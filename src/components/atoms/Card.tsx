import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  active = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border bg-white p-5 text-black text-sm transition-all shadow-xs ${
        active
          ? 'border-[#1E6FD9] ring-2 ring-[#1E6FD9]/20 shadow-sm'
          : 'border-black/10 hover:border-black/25 hover:shadow-sm'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
