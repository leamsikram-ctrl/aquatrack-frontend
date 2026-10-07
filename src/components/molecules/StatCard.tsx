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
    <Card className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-black uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="text-[#1E6FD9]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-[14px] font-bold text-black border-l-2 border-[#1E6FD9] pl-2">
          {value}
        </div>
        {subtext && (
          <div className="mt-1 text-[14px] font-normal text-black/70">
            {subtext}
          </div>
        )}
      </div>
    </Card>
  );
};
