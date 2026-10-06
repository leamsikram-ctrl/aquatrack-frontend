import React from 'react';
import type { RequestStatus } from '../../types';
import { IconCheck, IconClock, IconTool, IconCircleCheck } from '@tabler/icons-react';

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
    { key: 'in_progress', label: 'In Progress', timestamp: startedAt, icon: IconTool },
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
    <div className="w-full text-sm">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div
                  className={`h-0.5 flex-1 ${
                    idx === 0
                      ? 'invisible'
                      : state === 'completed' || state === 'current'
                      ? 'bg-[#1E6FD9]'
                      : 'bg-black/10'
                  }`}
                />
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-xs transition-all ${
                    state === 'completed'
                      ? 'border-[#1E6FD9] bg-[#1E6FD9] text-white'
                      : state === 'current'
                      ? 'border-[#1E6FD9] bg-white text-[#1E6FD9] ring-2 ring-[#1E6FD9]/20'
                      : 'border-black/20 bg-white text-black/40'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div
                  className={`h-0.5 flex-1 ${
                    idx === steps.length - 1
                      ? 'invisible'
                      : state === 'completed'
                      ? 'bg-[#1E6FD9]'
                      : 'bg-black/10'
                  }`}
                />
              </div>

              <div className="mt-2 text-center w-full">
                <div
                  className={`text-sm ${
                    state === 'current'
                      ? 'font-bold text-[#1E6FD9]'
                      : state === 'completed'
                      ? 'font-bold text-black'
                      : 'font-normal text-black/50'
                  }`}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-sm text-black/60 mt-0.5">{step.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
