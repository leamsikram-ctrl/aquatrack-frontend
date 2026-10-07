import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import type { Urgency } from '../../types';

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
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <span className="text-[10px] font-bold text-black uppercase tracking-wider">
          Urgency Calculation
        </span>
        <Badge variant={finalUrgency === 'high' ? 'black' : 'blue'}>
          {finalUrgency.toUpperCase()} Urgency
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div className="border border-black/20 p-3 rounded-md">
          <div className="text-[10px] font-normal text-black/70">Issue Default:</div>
          <div className="text-[10px] font-bold text-black capitalize mt-1">
            {defaultUrgency}
          </div>
        </div>

        <div className="border border-black/20 p-3 rounded-md">
          <div className="text-[10px] font-normal text-black/70">Customer Request:</div>
          <div className="text-[10px] font-bold text-black capitalize mt-1">
            {customerUrgency}
          </div>
        </div>
      </div>

      {adjustedByAdmin && (
        <div className="border-l-2 border-[#1E6FD9] bg-[#F0F6FD] p-3 text-[10px] text-black rounded-r-md">
          <div className="font-bold">Adjusted by Administrator</div>
          {adjustmentReason && (
            <div className="mt-1 font-normal text-black/80">
              "{adjustmentReason}"
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
