import React from 'react';
import { Card } from '../atoms/Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
}) => {
  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black/70">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F6FD] text-[#1E6FD9]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-sm font-bold text-black border-l-2 border-[#1E6FD9] pl-2.5">
          {value}
        </div>
        {subtext && (
          <div className="mt-1 text-sm text-black/60 pl-2.5">
            {subtext}
          </div>
        )}
      </div>
    </Card>
  );
};
