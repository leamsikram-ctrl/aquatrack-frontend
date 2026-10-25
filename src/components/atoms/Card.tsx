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
      className={`rounded-lg bg-white p-5 text-black text-[14px] transition-all border border-black/10 shadow-[0_4px_0_0_rgba(0,0,0,0.08)] ${
        active
          ? 'border-[#1E6FD9] shadow-[0_4px_0_0_#1E6FD9]'
          : 'hover:border-black/20 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.12)]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
