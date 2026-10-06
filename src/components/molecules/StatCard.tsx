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
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
          {label}
        </span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 border border-slate-200/60 text-slate-700">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#090A0F] font-mono">
          {value}
        </div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {trend && (
              <span
                className={`font-medium ${
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
