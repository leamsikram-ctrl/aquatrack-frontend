import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import type { Urgency } from '../../types';

/**
 * Derives final urgency based on Workflow Section 5.2:
 * final urgency = min(max(Default, Choice), Default + 1)
 * The customer can raise urgency by at most one level and can never lower it.
 * No hours or deadlines apply.
 */
export const deriveUrgency = (
  defaultUrgency: Urgency,
  customerChoice?: Urgency
): Urgency => {
  if (!customerChoice) return defaultUrgency;

  const rankMap: Record<Urgency, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  const fromRank = (r: number): Urgency => {
    if (r >= 3) return 'high';
    if (r === 2) return 'medium';
    return 'low';
  };

  const defaultRank = rankMap[defaultUrgency] ?? 1;
  const choiceRank = rankMap[customerChoice] ?? 1;

  // Formula: min(max(Default, Choice), Default + 1)
  const finalRank = Math.min(Math.max(defaultRank, choiceRank), defaultRank + 1);

  return fromRank(finalRank);
};

export interface UrgencyDerivationProps {
  defaultUrgency: Urgency;
  customerUrgency?: Urgency;
  finalUrgency?: Urgency;
  adjustedByAdmin?: boolean;
  adjustmentReason?: string;
}

export const UrgencyDerivation: React.FC<UrgencyDerivationProps> = ({
  defaultUrgency,
  customerUrgency,
  finalUrgency: propFinalUrgency,
  adjustedByAdmin = false,
  adjustmentReason,
}) => {
  const calculatedUrgency = deriveUrgency(defaultUrgency, customerUrgency);
  const finalUrgency = propFinalUrgency ?? calculatedUrgency;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <h3 className="text-[14px] font-bold text-black uppercase tracking-wider">
          Urgency Calculation
        </h3>
        <Badge variant={finalUrgency === 'high' ? 'black' : 'blue'}>
          {finalUrgency.toUpperCase()} Urgency
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[14px]">
        <div className="border border-black/20 p-3 rounded-md">
          <div className="text-[14px] font-normal text-black/70">Issue Default:</div>
          <div className="text-[14px] font-medium text-black capitalize mt-1">
            {defaultUrgency}
          </div>
        </div>

        <div className="border border-black/20 p-3 rounded-md">
          <div className="text-[14px] font-normal text-black/70">Customer Request:</div>
          <div className="text-[14px] font-medium text-black capitalize mt-1">
            {customerUrgency ?? defaultUrgency}
          </div>
        </div>
      </div>

      <div className="border border-black/10 bg-black/[0.02] p-2.5 rounded text-[12px] text-black/70">
        <span className="font-semibold text-black">Rule:</span> min(max(Default, Choice), Default + 1)
      </div>

      {adjustedByAdmin && (
        <div className="border border-black/15 bg-white p-3 text-[14px] text-black rounded-md">
          <div className="font-medium">Adjusted by Administrator</div>
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
