import React from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { IconDeviceMobile, IconDownload } from '@tabler/icons-react';

export interface DownloadMobileAppCardProps {
  className?: string;
  downloadUrl?: string;
}

export const DownloadMobileAppCard: React.FC<DownloadMobileAppCardProps> = ({
  className = '',
  downloadUrl,
}) => {
  const isHosted = Boolean(downloadUrl);

  return (
    <Card className={`p-5 border border-black/15 bg-white text-center space-y-3.5 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-blue-tint border border-black/15 flex items-center justify-center mx-auto text-brand-blue">
        <IconDeviceMobile size={28} />
      </div>

      <div className="space-y-1">
        <h2 className="text-base font-bold text-black">
          Download Mobile App
        </h2>
        <p className="text-xs text-black/60 leading-normal max-w-sm mx-auto">
          Identify meters and scan QR tags on-site with the Android scanner app.
        </p>
      </div>

      <div className="pt-1 flex flex-col items-center gap-1.5">
        {isHosted ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            <IconDownload size={16} />
            <span>Download APK</span>
          </a>
        ) : (
          <Button
            variant="secondary"
            disabled
            aria-disabled="true"
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 cursor-not-allowed opacity-60 font-semibold"
            leftIcon={<IconDownload size={16} />}
          >
            Coming soon
          </Button>
        )}
        <span className="text-[11px] text-black/50">
          For field staff on Android 10 or later
        </span>
      </div>
    </Card>
  );
};

