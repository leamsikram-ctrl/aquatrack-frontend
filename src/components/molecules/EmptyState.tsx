import React from 'react';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-black/20 bg-white text-[14px] ${className}`}
    >
      {icon && <div className="text-[#1E6FD9] mb-2">{icon}</div>}
      <div className="font-bold text-black text-[14px] uppercase tracking-wider">{title}</div>
      <div className="mt-1 max-w-sm text-[14px] font-normal text-black/70">{description}</div>
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
