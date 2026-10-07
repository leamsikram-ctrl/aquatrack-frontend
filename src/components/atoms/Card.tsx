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
      className={`rounded-lg border bg-white p-5 text-black text-[14px] transition-colors ${
        active ? 'border-[#1E6FD9] ring-1 ring-[#1E6FD9]' : 'border-black/20 hover:border-black'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
