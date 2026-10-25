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
    <Card className="flex flex-col justify-between p-4 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-black/60">
          {label}
        </span>
        {icon && (
          <div className="text-brand-blue">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl sm:text-4xl font-bold text-black leading-none">
          {value}
        </div>
        {subtext && (
          <div className="mt-2 text-[14px] font-normal text-black/70">
            {subtext}
          </div>
        )}
      </div>
    </Card>
  );
};
