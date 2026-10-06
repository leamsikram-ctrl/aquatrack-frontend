import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle = false, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-100 ${
        circle ? 'rounded-full' : 'rounded-md'
      } ${className}`}
      {...props}
    />
  );
};

