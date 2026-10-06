import React from 'react';
import type { RequestStatus } from '../../types';
import { IconCheck, IconClock, IconTools, IconCircleCheck } from '@tabler/icons-react';

export interface StatusTimelineProps {
  status: RequestStatus;
  submittedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  submittedAt,
  assignedAt,
  startedAt,
  resolvedAt,
}) => {
  const steps = [
    { key: 'submitted', label: 'Submitted', timestamp: submittedAt, icon: IconClock },
    { key: 'assigned', label: 'Assigned', timestamp: assignedAt, icon: IconCheck },
    { key: 'in_progress', label: 'In Progress', timestamp: startedAt, icon: IconTools },
    { key: 'resolved', label: 'Resolved', timestamp: resolvedAt, icon: IconCircleCheck },
  ];

  const getStepState = (stepKey: string) => {
    if (status === 'cancelled') return 'cancelled';

    const order = ['submitted', 'assigned', 'in_progress', 'resolved'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* Desktop 4-Step horizontal progress */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    idx === 0
                      ? 'invisible'
                      : state === 'completed' || state === 'current'
                      ? 'bg-[#0B192C]'
                      : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                    state === 'completed'
                      ? 'border-[#0B192C] bg-[#0B192C] text-white'
                      : state === 'current'
                      ? 'border-[#1E6FD9] bg-[#EBF3FC] text-[#1E6FD9] ring-4 ring-[#1E6FD9]/15'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    idx === steps.length - 1
                      ? 'invisible'
                      : state === 'completed'
                      ? 'bg-[#0B192C]'
                      : 'bg-slate-200'
                  }`}
                />
              </div>

              <div className="mt-2 text-left w-full pl-2">
                <div
                  className={`text-xs font-medium ${
                    state === 'current'
                      ? 'text-[#1E6FD9] font-semibold'
                      : state === 'completed'
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-[11px] text-slate-500 mt-0.5">{step.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
