import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { DownloadMobileAppCard } from '../../components/molecules/DownloadMobileAppCard';

export function StaffScannerView() {
  const navigate = useNavigate();

  return (
    <StaffLayout currentPath="/staff/scan" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 max-w-lg mx-auto py-4 w-full max-w-full overflow-x-hidden min-w-0">
        <div className="pb-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Meter Scanner
          </h1>
          <p className="text-xs text-black/60 mt-1">
            Physical meter QR scanning has moved to the dedicated Android mobile app.
          </p>
        </div>

        <DownloadMobileAppCard />
      </div>
    </StaffLayout>
  );
}
