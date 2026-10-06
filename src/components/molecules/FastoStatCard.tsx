import React from 'react';

export interface FastoStatCardProps {
  number: string | number;
  label: string;
  topColor: 'purple' | 'amber' | 'indigo' | 'emerald';
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const FastoStatCard: React.FC<FastoStatCardProps> = ({
  number,
  label,
  topColor = 'purple',
  icon,
  iconBgColor = 'text-indigo-600 bg-indigo-50',
  className = '',
}) => {
  const topColorBars = {
    purple: 'bg-[#6366F1]',
    amber: 'bg-[#F59E0B]',
    indigo: 'bg-[#4338CA]',
    emerald: 'bg-[#10B981]',
  }[topColor];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-[0_8px_25px_-4px_rgba(100,116,139,0.1)] hover:-translate-y-0.5 ${className}`}
    >
      {/* Top 3px Colored Border Stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${topColorBars}`} />

      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {number}
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
        </div>

        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgColor} shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

