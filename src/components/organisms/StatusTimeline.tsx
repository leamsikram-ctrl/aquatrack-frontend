import React from 'react';
import type { RequestStatus } from '../../types';

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
    { key: 'submitted', label: 'Submitted', timestamp: submittedAt },
    { key: 'assigned', label: 'Assigned', timestamp: assignedAt },
    { key: 'in_progress', label: 'In Progress', timestamp: startedAt },
    { key: 'resolved', label: 'Resolved', timestamp: resolvedAt },
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
    <div className="w-full text-[14px]">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);

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
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[14px] font-bold ${
                    state === 'completed'
                      ? 'border-[#1E6FD9] bg-[#1E6FD9] text-white'
                      : state === 'current'
                      ? 'border-[#1E6FD9] bg-white text-[#1E6FD9] ring-2 ring-[#1E6FD9]'
                      : 'border-black/30 bg-white text-black/40'
                  }`}
                >
                  {idx + 1}
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
                  className={`text-[14px] ${
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
                  <div className="text-[14px] font-normal text-black/70 mt-0.5">{step.timestamp}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
