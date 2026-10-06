import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import type { Urgency } from '../../types';
import { IconAlertTriangle, IconClock, IconInfoCircle } from '@tabler/icons-react';

export interface UrgencyDerivationProps {
  defaultUrgency: Urgency;
  customerUrgency: Urgency;
  finalUrgency: Urgency;
  adjustedByAdmin?: boolean;
  adjustmentReason?: string;
}

export const UrgencyDerivation: React.FC<UrgencyDerivationProps> = ({
  defaultUrgency,
  customerUrgency,
  finalUrgency,
  adjustedByAdmin = false,
  adjustmentReason,
}) => {
  const urgencyBadgeVariant = (urgency: Urgency) => {
    switch (urgency) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
    }
  };

  return (
    <Card padding="md" className="space-y-3 bg-slate-50/50 border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Urgency Calculation
        </span>
        <Badge variant={urgencyBadgeVariant(finalUrgency)} size="md" dot>
          {finalUrgency.toUpperCase()} PRIORITY
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col gap-0.5 rounded-md bg-white p-2.5 border border-slate-200/60">
          <span className="text-slate-500 flex items-center gap-1">
            <IconInfoCircle size={13} className="text-slate-400" />
            Issue Default
          </span>
          <span className="font-semibold text-slate-800 capitalize mt-0.5">
            {defaultUrgency}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 rounded-md bg-white p-2.5 border border-slate-200/60">
          <span className="text-slate-500 flex items-center gap-1">
            <IconClock size={13} className="text-slate-400" />
            Customer Chose
          </span>
          <span className="font-semibold text-slate-800 capitalize mt-0.5">
            {customerUrgency}
          </span>
        </div>
      </div>

      {adjustedByAdmin && (
        <div className="rounded-md bg-amber-50/70 p-2.5 border border-amber-200/80 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-medium">
            <IconAlertTriangle size={14} className="text-amber-700 shrink-0" />
            <span>Manually adjusted by Administrator</span>
          </div>
          {adjustmentReason && (
            <p className="mt-1 text-slate-600 pl-5 text-[11px] italic">
              "{adjustmentReason}"
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
