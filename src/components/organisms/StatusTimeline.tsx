import React from 'react';
import type { RequestStatus } from '../../types';
import { formatTimelineDateTime } from '../../services/maintenanceStore';

export interface StatusTimelineProps {
  status: RequestStatus;
  submittedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  submittedAt,
  assignedAt,
  startedAt,
  resolvedAt,
  cancelledAt,
}) => {
  const steps = [
    { key: 'submitted', label: 'Submitted', timestamp: formatTimelineDateTime(submittedAt) },
    { key: 'assigned', label: 'Assigned', timestamp: formatTimelineDateTime(assignedAt) },
    { key: 'in_progress', label: 'In progress', timestamp: formatTimelineDateTime(startedAt) },
    { key: 'resolved', label: 'Resolved', timestamp: formatTimelineDateTime(resolvedAt) },
  ];

  const getStepState = (stepKey: string) => {
    if (status === 'cancelled') {
      if (stepKey === 'submitted' && submittedAt) return 'completed';
      if (stepKey === 'assigned' && assignedAt) return 'completed';
      if (stepKey === 'in_progress' && startedAt) return 'completed';
      return 'cancelled';
    }

    const order = ['submitted', 'assigned', 'in_progress', 'resolved'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full text-xs space-y-2">
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
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    state === 'completed'
                      ? 'border-[#1E6FD9] bg-[#1E6FD9] text-white'
                      : state === 'current'
                      ? 'border-[#1E6FD9] bg-white text-[#1E6FD9] ring-2 ring-[#1E6FD9]'
                      : 'border-black/25 bg-white text-black/40'
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

              <div className="mt-1.5 text-center w-full">
                <div
                  className={`text-xs ${
                    state === 'current'
                      ? 'font-bold text-[#1E6FD9]'
                      : state === 'completed'
                      ? 'font-bold text-black'
                      : 'font-normal text-black/45'
                  }`}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-[10px] font-normal text-black/60 mt-0.5 leading-tight">
                    {step.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status === 'cancelled' && (
        <div className="p-2 rounded bg-slate-100 border border-slate-300 text-center text-[11px] font-semibold text-slate-700">
          Cancelled {cancelledAt ? `· ${formatTimelineDateTime(cancelledAt)}` : ''}
        </div>
      )}
    </div>
  );
};
