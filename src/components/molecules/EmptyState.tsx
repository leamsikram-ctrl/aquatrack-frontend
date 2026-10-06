import React from 'react';
import { Button } from '../atoms/Button';
import { IconInbox } from '@tabler/icons-react';

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
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white/50 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
        {icon || <IconInbox size={24} />}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
