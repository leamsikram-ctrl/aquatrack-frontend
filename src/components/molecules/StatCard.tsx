import React from 'react';
import { Card } from '../atoms/Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  onClick,
}) => {
  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      className="flex flex-col justify-between"
      padding="md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider select-none">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-[#0B192C]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-[#0B192C]">{value}</div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
