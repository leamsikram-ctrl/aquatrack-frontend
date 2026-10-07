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
      className={`rounded-lg border bg-white p-5 text-black text-[14px] transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] ${
        active
          ? 'border-[#1E6FD9] shadow-[3px_3px_0px_0px_#1E6FD9]'
          : 'border-black/20 hover:border-[#1E6FD9] hover:shadow-[3px_3px_0px_0px_#1E6FD9]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
