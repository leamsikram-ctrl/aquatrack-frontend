import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import type { Urgency } from '../../types';

/**
 * Derives final urgency based on Workflow Section 5.2:
 * final urgency = min(max(Default, Choice), Default + 1)
 * The customer can raise urgency by at most one level and can never lower it.
 * No hours or SLA countdowns apply.
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
  onCustomerUrgencyChange?: (urgency: Urgency) => void;
  className?: string;
}

export const UrgencyDerivation: React.FC<UrgencyDerivationProps> = ({
  defaultUrgency,
  customerUrgency,
  finalUrgency: propFinalUrgency,
  adjustedByAdmin = false,
  adjustmentReason,
  onCustomerUrgencyChange,
  className = '',
}) => {
  const currentChoice = customerUrgency ?? defaultUrgency;
  const calculatedUrgency = deriveUrgency(defaultUrgency, currentChoice);
  const finalUrgency = propFinalUrgency ?? calculatedUrgency;

  // Permitted options: default urgency, and at most default + 1 (never lower)
  const availableOptions: { value: Urgency; label: string; isRaised: boolean }[] = [];
  if (defaultUrgency === 'low') {
    availableOptions.push({ value: 'low', label: 'Low (Default)', isRaised: false });
    availableOptions.push({ value: 'medium', label: 'Medium (+1 Level)', isRaised: true });
  } else if (defaultUrgency === 'medium') {
    availableOptions.push({ value: 'medium', label: 'Medium (Default)', isRaised: false });
    availableOptions.push({ value: 'high', label: 'High (+1 Level)', isRaised: true });
  } else {
    availableOptions.push({ value: 'high', label: 'High (Maximum)', isRaised: false });
  }

  const isInteractive = Boolean(onCustomerUrgencyChange);

  return (
    <Card className={`space-y-3 bg-white border border-black/10 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)] p-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
        <div>
          <span className="text-xs font-bold text-black uppercase tracking-wider block">
            Urgency Level
          </span>
          <span className="text-[11px] text-black/60 font-normal">
            Default set by issue type; customer may raise by 1 level
          </span>
        </div>
        <Badge variant={finalUrgency === 'high' ? 'high' : finalUrgency === 'medium' ? 'medium' : 'low'}>
          {finalUrgency.toUpperCase()}
        </Badge>
      </div>

      {isInteractive ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-blue-tint/50 border border-black/10">
              <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider block">
                Issue Default
              </span>
              <span className="text-xs font-bold text-black capitalize mt-0.5 block">
                {defaultUrgency}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-tint/50 border border-black/10">
              <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider block">
                Final Urgency
              </span>
              <span className="text-xs font-bold text-brand-blue capitalize mt-0.5 block">
                {finalUrgency}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] font-bold text-black/70 mb-1.5 block">
              Urgency Adjustment Option:
            </span>
            <div className="flex flex-wrap gap-2">
              {availableOptions.map((opt) => {
                const isSelected = currentChoice === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onCustomerUrgencyChange && onCustomerUrgencyChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-blue text-white border-brand-blue shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                        : 'bg-white text-black/80 border-black/20 hover:border-brand-blue hover:text-brand-blue'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-black/[0.02] border border-black/10">
            <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider block">
              Issue Default
            </span>
            <span className="text-xs font-semibold text-black capitalize mt-0.5 block">
              {defaultUrgency}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/[0.02] border border-black/10">
            <span className="text-[10px] font-bold text-black/60 uppercase tracking-wider block">
              Customer Choice
            </span>
            <span className="text-xs font-semibold text-black capitalize mt-0.5 block">
              {customerUrgency ?? defaultUrgency}
            </span>
          </div>
        </div>
      )}

      {adjustedByAdmin && (
        <div className="p-2.5 bg-blue-tint/40 border border-brand-blue/30 rounded-lg text-xs">
          <span className="font-bold text-brand-blue block">Adjusted by Administrator</span>
          {adjustmentReason && (
            <span className="text-black/80 italic mt-0.5 block">"{adjustmentReason}"</span>
          )}
        </div>
      )}
    </Card>
  );
};
