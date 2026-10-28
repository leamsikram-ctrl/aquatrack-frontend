import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { formatReadableDateTime, type AdvisoryRecord } from '../../services/advisoriesStore';
import type { WaterInterruption } from '../../types';
import { IconAlertTriangle, IconClock, IconChevronRight } from '@tabler/icons-react';

export interface AdvisoryBannerProps {
  advisory: AdvisoryRecord | WaterInterruption | null;
  onViewDetails?: () => void;
  className?: string;
}

export const AdvisoryBanner: React.FC<AdvisoryBannerProps> = ({
  advisory,
  onViewDetails,
  className = '',
}) => {
  const navigate = useNavigate();

  if (!advisory) return null;

  // Extract properties safely across AdvisoryRecord or WaterInterruption
  const title = advisory.title || 'Water Interruption';
  const reason = (advisory as any).reason || (advisory as any).description || advisory.message || 'Service interruption ongoing';
  const startsAt = advisory.starts_at;
  const endsAt = (advisory as any).actual_restored_at || advisory.ends_at;

  const barangayNames: string[] = Array.isArray((advisory as any).barangay_names)
    ? (advisory as any).barangay_names
    : Array.isArray(advisory.barangays)
    ? advisory.barangays.map((b: any) => b.name)
    : [];

  // Calculate elapsed progress percentage for the time bar
  const startMs = startsAt ? new Date(startsAt).getTime() : 0;
  const endMs = endsAt ? new Date(endsAt).getTime() : 0;
  const nowMs = Date.now();

  let progressPct = 50;
  if (startMs && endMs && endMs > startMs) {
    const elapsed = Math.max(0, Math.min(nowMs - startMs, endMs - startMs));
    progressPct = Math.round((elapsed / (endMs - startMs)) * 100);
  }

  const handleAction = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate('/customer/advisories');
    }
  };

  return (
    <Card
      className={`p-4 bg-amber-50/90 border border-amber-300 rounded-xl shadow-[3px_3px_0px_0px_rgba(217,119,6,0.15)] ${className}`}
      data-testid="customer-advisory-banner"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left column: Header, title, chips */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <IconAlertTriangle size={15} />
            </span>
            <Badge variant="medium" className="uppercase text-[10px] font-bold">
              Ongoing Advisory
            </Badge>
            <h3 className="font-bold text-[14px] text-black truncate">{title}</h3>
          </div>

          {/* Exactly one helper line description */}
          <p className="text-xs text-black/70 truncate">{reason}</p>

          {/* Barangay chips */}
          {barangayNames.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold uppercase text-black/50">Affected:</span>
              {barangayNames.map((name) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-full bg-white text-brand-blue border border-brand-blue/30 text-[11px] font-semibold"
                >
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Time Bar */}
          <div className="pt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-black/60">
              <span className="flex items-center gap-1">
                <IconClock size={12} className="text-amber-800" />
                <span>Start: {formatReadableDateTime(startsAt)}</span>
              </span>
              <span>Expected End: {formatReadableDateTime(endsAt)}</span>
            </div>
            <div
              className="h-2 w-full bg-amber-200/60 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, Math.min(100, progressPct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="sm:self-center shrink-0">
          <Button
            variant="secondary"
            onClick={handleAction}
            className="w-full sm:w-auto min-h-[44px] text-xs font-bold border-amber-300 hover:bg-amber-100 flex items-center justify-center gap-1"
          >
            <span>View details</span>
            <IconChevronRight size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
