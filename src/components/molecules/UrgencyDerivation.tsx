import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import type { Urgency } from '../../types';
import { IconFlame, IconInfoCircle, IconUser } from '@tabler/icons-react';

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
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
        <span className="text-sm font-bold text-black flex items-center gap-2">
          <IconFlame size={16} className="text-[#1E6FD9]" />
          Urgency Calculation
        </span>
        <Badge
          variant={finalUrgency === 'high' ? 'black' : 'blue'}
          icon={<IconFlame size={13} />}
        >
          {finalUrgency.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="border border-black/10 p-3 rounded-lg bg-white shadow-2xs">
          <div className="text-sm text-black/60 flex items-center gap-1.5">
            <IconInfoCircle size={14} className="text-black/40" />
            Issue Default:
          </div>
          <div className="text-sm font-bold text-black capitalize mt-1 pl-5">
            {defaultUrgency}
          </div>
        </div>

        <div className="border border-black/10 p-3 rounded-lg bg-white shadow-2xs">
          <div className="text-sm text-black/60 flex items-center gap-1.5">
            <IconUser size={14} className="text-black/40" />
            Customer Request:
          </div>
          <div className="text-sm font-bold text-black capitalize mt-1 pl-5">
            {customerUrgency}
          </div>
        </div>
      </div>

      {adjustedByAdmin && (
        <div className="border-l-2 border-[#1E6FD9] bg-[#F0F6FD] p-3 text-sm text-black rounded-r-lg">
          <div className="font-bold">Adjusted by Administrator</div>
          {adjustmentReason && (
            <div className="mt-0.5 text-black/75">
              "{adjustmentReason}"
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
