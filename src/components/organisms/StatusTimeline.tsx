import React from 'react';
import type { RequestStatus } from '../../types';
import { formatTimelineDateTime } from '../../services/maintenanceStore';
import { IconCheck, IconX } from '@tabler/icons-react';

export interface StatusTimelineProps {
  status: RequestStatus;
  submittedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  className?: string;
}

/**
 * AquaTrack hydro droplet marker representing the current active step in the workflow.
 */
export const LogoDroplet: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    data-testid="logo-droplet-marker"
  >
    <path
      d="M12 3C12 3 17 9.5 17 14C17 16.7614 14.7614 19 12 19C9.23858 19 7 16.7614 7 14C7 9.5 12 3 12 3Z"
      fill="currentColor"
    />
    <path
      d="M10 12C10 10.5 11 9 11 9"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  submittedAt,
  assignedAt,
  startedAt,
  resolvedAt,
  cancelledAt,
  cancelledReason,
  className = '',
}) => {
  const steps = [
    { key: 'submitted', label: 'Submitted', timestamp: formatTimelineDateTime(submittedAt) },
    { key: 'assigned', label: 'Assigned', timestamp: formatTimelineDateTime(assignedAt) },
    { key: 'in_progress', label: 'In progress', timestamp: formatTimelineDateTime(startedAt) },
    { key: 'resolved', label: 'Resolved', timestamp: formatTimelineDateTime(resolvedAt) },
  ];

  const getStepState = (stepKey: string): 'completed' | 'current' | 'upcoming' | 'cancelled' => {
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
    <div className={`w-full text-xs space-y-3 ${className}`}>
      {/* 1. Mobile Vertical Timeline (viewport < 640px, e.g. 414px) */}
      <div className="block sm:hidden space-y-0 relative pl-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const isLast = idx === steps.length - 1;

          return (
            <div key={`m-${step.key}`} className="relative flex items-start gap-3 pb-3.5">
              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className={`absolute left-[13px] top-6 bottom-0 w-0.5 ${
                    state === 'completed' ? 'bg-brand-blue' : 'bg-black/10'
                  }`}
                />
              )}

              {/* Step Marker */}
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                  state === 'completed'
                    ? 'border-brand-blue bg-brand-blue text-white shadow-xs'
                    : state === 'current'
                    ? 'border-brand-blue bg-white text-brand-blue ring-2 ring-brand-blue/30 shadow-xs'
                    : state === 'cancelled'
                    ? 'border-slate-300 bg-slate-100 text-slate-400'
                    : 'border-black/20 bg-white text-black/40'
                }`}
              >
                {state === 'completed' ? (
                  <IconCheck size={14} className="stroke-[3]" />
                ) : state === 'current' ? (
                  <LogoDroplet className="w-4 h-4 text-brand-blue" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Text & Timestamp */}
              <div className="min-w-0 pt-0.5">
                <div
                  className={`text-[13px] leading-tight ${
                    state === 'current'
                      ? 'font-bold text-brand-blue'
                      : state === 'completed'
                      ? 'font-bold text-black'
                      : 'font-normal text-black/50'
                  }`}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-[11px] font-normal text-black/60 mt-0.5">
                    {step.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Horizontal Timeline (viewport >= 640px) */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);

          return (
            <div key={`d-${step.key}`} className="flex flex-col items-center text-center">
              <div className="flex items-center w-full">
                <div
                  className={`h-0.5 flex-1 ${
                    idx === 0
                      ? 'invisible'
                      : state === 'completed' || state === 'current'
                      ? 'bg-brand-blue'
                      : 'bg-black/10'
                  }`}
                />
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                    state === 'completed'
                      ? 'border-brand-blue bg-brand-blue text-white shadow-xs'
                      : state === 'current'
                      ? 'border-brand-blue bg-white text-brand-blue ring-2 ring-brand-blue/30 shadow-xs'
                      : state === 'cancelled'
                      ? 'border-slate-300 bg-slate-100 text-slate-400'
                      : 'border-black/25 bg-white text-black/40'
                  }`}
                >
                  {state === 'completed' ? (
                    <IconCheck size={14} className="stroke-[3]" />
                  ) : state === 'current' ? (
                    <LogoDroplet className="w-4 h-4 text-brand-blue" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div
                  className={`h-0.5 flex-1 ${
                    idx === steps.length - 1
                      ? 'invisible'
                      : state === 'completed'
                      ? 'bg-brand-blue'
                      : 'bg-black/10'
                  }`}
                />
              </div>

              <div className="mt-1.5 text-center w-full">
                <div
                  className={`text-xs ${
                    state === 'current'
                      ? 'font-bold text-brand-blue'
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

      {/* 3. Cancelled Banner */}
      {status === 'cancelled' && (
        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold min-w-0">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <IconX size={12} className="stroke-[3]" />
            </div>
            <div className="min-w-0 truncate">
              <span>Cancelled</span>
              {cancelledReason && (
                <span className="font-normal text-slate-600 block sm:inline sm:ml-1 truncate">
                  · {cancelledReason}
                </span>
              )}
            </div>
          </div>
          {cancelledAt && (
            <span className="text-[11px] text-slate-500 font-normal shrink-0">
              {formatTimelineDateTime(cancelledAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
