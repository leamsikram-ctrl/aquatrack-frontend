import React from 'react';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-lg bg-white border border-black/10 shadow-[0_4px_0_0_rgba(0,0,0,0.08)] text-[14px] ${className}`}
    >
      {illustration ? (
        <div className="h-32 w-auto flex items-center justify-center mb-3">
          {illustration}
        </div>
      ) : icon ? (
        <div className="text-brand-blue mb-2">{icon}</div>
      ) : null}
      <div className="font-bold text-black text-[14px] uppercase tracking-wider">{title}</div>
      {description && <div className="mt-1 max-w-sm text-[14px] font-normal text-black/70">{description}</div>}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
