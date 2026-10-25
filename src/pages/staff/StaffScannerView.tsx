import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { metersApi } from '../../api';
import { IconQrcode, IconSearch, IconCheck, IconAlertCircle, IconGauge, IconUser, IconDeviceMobile } from '@tabler/icons-react';

interface MeterData {
  meter_id: number;
  meter_number: string;
  qr_token: string;
  status: string;
  barangay?: string;
  customer?: {
    id: number;
    account_number?: string;
    name: string;
    address?: string;
    barangay?: string;
    mobile_number?: string;
  };
}

export function StaffScannerView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeMode, setActiveMode] = useState<'placeholder' | 'simulator'>(() => {
    const m = searchParams.get('mode');
    return m === 'placeholder' ? 'placeholder' : 'simulator';
  });
  const [meterInput, setMeterInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meterData, setMeterData] = useState<MeterData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Quick reading logging state
  const [currentReading, setCurrentReading] = useState('');
  const [readingLogged, setReadingLogged] = useState(false);

  const handleLookupByNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterInput.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    setMeterData(null);
    setReadingLogged(false);

    try {
      const data = await metersApi.lookupByNumber(meterInput.trim());
      setMeterData(data);
    } catch {
      setSearchError(`Meter "${meterInput}" not found in Sinacaban registry.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookupByQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    setMeterData(null);
    setReadingLogged(false);

    try {
      const data = await metersApi.lookupByQr(tokenInput.trim());
      setMeterData(data);
    } catch {
      setSearchError(`No meter found matching QR token "${tokenInput}".`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReading) return;

    setReadingLogged(true);
    setTimeout(() => {
      setReadingLogged(false);
      setCurrentReading('');
    }, 3000);
  };

  return (
    <StaffLayout currentPath="/staff/scan" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl sm:text-2xl font-bold text-black">
          {activeMode === 'placeholder' ? 'Scan Meter' : 'Meter Scanner'}
        </h1>
      </div>

      {/* Scanner Mode Card */}
      <Card className="p-3 bg-white flex items-center justify-between">
        <span className="text-xs font-semibold text-black/60">Scanner mode</span>
        <div className="flex border border-black/15 rounded p-0.5 bg-black/5">
          <button
            onClick={() => setActiveMode('placeholder')}
            className={`px-3 py-1 text-[14px] rounded transition-colors ${
              activeMode === 'placeholder'
                ? 'bg-[#1E6FD9] text-white font-medium'
                : 'text-black hover:text-[#1E6FD9] font-normal'
            }`}
          >
            Scan Meter
          </button>
          <button
            onClick={() => setActiveMode('simulator')}
            className={`px-3 py-1 text-[14px] rounded transition-colors ${
              activeMode === 'simulator'
                ? 'bg-[#1E6FD9] text-white font-medium'
                : 'text-black hover:text-[#1E6FD9] font-normal'
            }`}
          >
            Interactive Simulator
          </button>
        </div>
      </Card>

      {activeMode === 'placeholder' ? (
        /* Wireframe S4: Exact Web Placeholder Layout */
        <div className="max-w-md mx-auto py-8">
          <Card className="p-8 border border-black/15 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-white border border-black/15 flex items-center justify-center mx-auto text-[#1E6FD9]">
              <IconDeviceMobile size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-bold text-black">
                Scan meters in the mobile app
              </h2>
              <p className="text-[14px] text-black/70 leading-relaxed px-4">
                Available in the AquaTrack Android app.
              </p>
            </div>

            <div className="pt-2">
              <button
                disabled
                className="w-full py-2 bg-black/5 text-black/40 border border-black/20 rounded font-medium text-[14px] cursor-not-allowed select-none"
              >
                Download app (coming soon)
              </button>
            </div>

            <div className="border-t border-black/10 pt-3 text-[14px] text-black/60">
              Need web testing?{' '}
              <button
                onClick={() => setActiveMode('simulator')}
                className="text-[#1E6FD9] font-medium underline ml-1"
              >
                Switch to Simulator
              </button>
            </div>
          </Card>
        </div>
      ) : (

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lookup Methods */}
        <div className="space-y-4">
          {/* Method 1: QR Code Token Scanner */}
          <Card className="p-4 border border-black/15 space-y-3">
            <div className="flex items-center gap-2 border-b border-black/15 pb-2">
              <IconQrcode size={14} className="text-[#1E6FD9]" />
              <h2 className="text-sm font-bold text-black">
                QR Token Scanner
              </h2>
            </div>

            <form onSubmit={handleLookupByQr} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. MTR-TOKEN-0001"
                className="flex-1 p-2 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] font-normal"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
              />
              <Button variant="primary" type="submit" isLoading={isLoading}>
                Scan Token
              </Button>
            </form>
          </Card>

          {/* Method 2: Manual Serial Number */}
          <Card className="p-4 border border-black/15 space-y-3">
            <div className="flex items-center gap-2 border-b border-black/15 pb-2">
              <IconSearch size={14} className="text-[#1E6FD9]" />
              <h2 className="text-sm font-bold text-black">
                Meter Number Lookup
              </h2>
            </div>

            <form onSubmit={handleLookupByNumber} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. MTR-SIN-0001"
                className="flex-1 p-2 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] font-normal"
                value={meterInput}
                onChange={(e) => setMeterInput(e.target.value)}
                required
              />
              <Button variant="secondary" type="submit" isLoading={isLoading}>
                Find Meter
              </Button>
            </form>
          </Card>

          {/* Quick Demo Shortcuts */}
          <div className="p-3 bg-white border border-black/15 rounded space-y-1 text-[14px]">
            <span className="text-xs font-medium text-black/60 block">Field Quick Test Codes:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['MTR-SIN-0001', 'MTR-SIN-0002', 'MTR-SIN-0003'].map((sn) => (
                <button
                  key={sn}
                  onClick={() => {
                    setMeterInput(sn);
                    metersApi.lookupByNumber(sn).then(setMeterData).catch(() => {});
                  }}
                  className="px-2 py-0.5 bg-white border border-black rounded text-[14px] font-normal hover:bg-[#1E6FD9] hover:text-white"
                >
                  {sn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meter Details / Lookup Result */}
        <div>
          {searchError && (
            <Card className="p-6 border border-black/15 text-center space-y-2 bg-white">
              <IconAlertCircle size={24} className="text-black mx-auto" />
              <div className="font-medium text-black text-sm">Lookup Failed</div>
              <p className="text-[14px] text-black/70">{searchError}</p>
            </Card>
          )}

          {!meterData && !searchError && (
            <Card className="p-8 border border-black/15 text-center text-black/50 space-y-2">
              <IconGauge size={32} className="text-black/30 mx-auto" />
              <div className="text-sm font-medium text-black/60">
                Ready to Inspect Meter
              </div>
              <p className="text-[14px] text-black/50">
                Scan a QR token or enter a serial number.
              </p>
            </Card>
          )}

          {meterData && (
            <Card className="p-5 border border-black/15 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <IconGauge size={14} className="text-[#1E6FD9]" />
                  <h2 className="text-sm font-bold text-black">
                    Verified Meter Specs
                  </h2>
                </div>
                <Badge variant="blue">{meterData.status.toUpperCase()}</Badge>
              </div>

              <div className="space-y-2 bg-white p-3 rounded border border-black/15 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-black/60 text-xs font-medium">Serial Number:</span>
                  <span className="text-black font-medium">{meterData.meter_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 text-xs font-medium">QR Token:</span>
                  <span className="text-black font-normal">{meterData.qr_token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 text-xs font-medium">Barangay Zone:</span>
                  <span className="text-black font-normal">{meterData.barangay || 'Poblacion'}</span>
                </div>
              </div>

              {/* Connected Customer Info */}
              <div className="border border-black/15 p-3 rounded space-y-2 text-[14px]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-black/60">
                  <IconUser size={12} className="text-[#1E6FD9]" />
                  Connected Household
                </div>
                {meterData.customer ? (
                  <div className="space-y-1 text-black font-normal">
                    <div>
                      <span className="text-black/60 font-medium">Consumer:</span> {meterData.customer.name}
                    </div>
                    <div>
                      <span className="text-black/60 font-medium">Account:</span>{' '}
                      <span className="text-[#1E6FD9] font-medium">
                        {meterData.customer.account_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-black/60 font-medium">Address:</span> {meterData.customer.address || 'Sinacaban'}
                    </div>
                  </div>
                ) : (
                  <div className="text-black/60 italic">
                    Unassigned meter.
                  </div>
                )}
              </div>

              {/* On-Site Field Verification Audit Note */}
              <div className="border-t border-black/15 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-black block">
                    On-Site Field Verification Note
                  </h3>
                  <span className="text-xs text-black/60">Field Audit</span>
                </div>
                <p className="text-xs text-black/60 font-normal">
                  Record on-site meter dial number for maintenance inspection. Note: Monthly customer bills are calculated and imported via municipal batch records.
                </p>
                <form onSubmit={handleLogReading} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Physical dial reading (m³)"
                    className="flex-1 p-2 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    required
                  />
                  <Button variant="secondary" type="submit">
                    <IconCheck size={12} className="inline mr-1" />
                    Save Audit Note
                  </Button>
                </form>
                {readingLogged && (
                  <div className="p-2 bg-[#F0F6FD] border border-black/10 rounded text-xs text-black font-medium">
                    ✓ Field dial inspection noted for maintenance audit. Official billing remains governed by municipal CSV records.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      )}
      </div>
    </StaffLayout>
  );
}
