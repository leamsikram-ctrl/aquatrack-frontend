import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [activeMode, setActiveMode] = useState<'placeholder' | 'simulator'>('placeholder');
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

    // Simulate reading logging
    setReadingLogged(true);
    setTimeout(() => {
      alert(`Meter reading of ${currentReading} m³ logged successfully for ${meterData?.meter_number}!`);
      setCurrentReading('');
    }, 300);
  };

  return (
    <StaffLayout currentPath="/staff/scan" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            {activeMode === 'placeholder' ? 'Scan meter' : 'Meter Scanner & Inspection'}
          </h1>
          <p className="text-[14px] text-black/60 font-normal">
            {activeMode === 'placeholder'
              ? 'Meter scanning is managed via the mobile app.'
              : 'Scan meter QR codes or enter meter serial numbers for instant lookup.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex border border-black/20 rounded p-0.5 bg-[#F0F6FD]">
            <button
              onClick={() => setActiveMode('placeholder')}
              className={`px-3 py-1 text-[14px] rounded transition-colors ${
                activeMode === 'placeholder'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9] font-normal'
              }`}
            >
              Scan meter
            </button>
            <button
              onClick={() => setActiveMode('simulator')}
              className={`px-3 py-1 text-[14px] rounded transition-colors ${
                activeMode === 'simulator'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9] font-normal'
              }`}
            >
              Interactive Simulator
            </button>
          </div>
        </div>
      </div>

      {activeMode === 'placeholder' ? (
        /* Wireframe S4: Exact Web Placeholder Layout */
        <div className="max-w-md mx-auto py-8">
          <Card className="p-8 border border-black/15 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#F0F6FD] border border-black/20 flex items-center justify-center mx-auto text-[#1E6FD9]">
              <IconDeviceMobile size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                Scan meters in the mobile app
              </h2>
              <p className="text-[14px] text-black/70 leading-relaxed px-4">
                Meter QR scanning is done in the AquaTrack Android app. Sign in with your staff account.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                disabled
                className="w-full py-2 bg-black/5 text-black/40 border border-black/20 rounded font-bold text-[14px] cursor-not-allowed select-none"
              >
                Download the app (coming soon)
              </button>
              <div className="text-[14px] text-black/50 italic">
                The installable file is not yet available.
              </div>
            </div>

            <div className="border-t border-black/10 pt-3 text-[14px] text-black/60">
              Need to test meter lookups in this web demo?{' '}
              <button
                onClick={() => setActiveMode('simulator')}
                className="text-[#1E6FD9] font-bold underline ml-1"
              >
                Switch to Interactive Simulator
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
              <span className="font-bold text-black uppercase tracking-wider text-[14px]">
                Scan QR Token / Barcode
              </span>
            </div>
            <p className="text-[14px] text-black/70">
              Input the token encoded in the consumer's physical meter badge:
            </p>

            <form onSubmit={handleLookupByQr} className="flex gap-2">
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
              <span className="font-bold text-black uppercase tracking-wider text-[14px]">
                Manual Meter Number Lookup
              </span>
            </div>
            <p className="text-[14px] text-black/70 font-normal">
              Enter the stamped serial number printed on the meter casing:
            </p>

            <form onSubmit={handleLookupByNumber} className="flex gap-2">
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
          <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-1 text-[14px]">
            <span className="font-bold text-black uppercase block">Field Quick Test Codes:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['MTR-SIN-0001', 'MTR-SIN-0002', 'MTR-SIN-0003'].map((sn) => (
                <button
                  key={sn}
                  onClick={() => {
                    setMeterInput(sn);
                    metersApi.lookupByNumber(sn).then(setMeterData).catch(() => {});
                  }}
                  className="px-2 py-0.5 bg-white border border-black rounded text-[14px] font-bold hover:bg-[#1E6FD9] hover:text-white"
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
            <Card className="p-6 border border-black text-center space-y-2 bg-[#F0F6FD]">
              <IconAlertCircle size={24} className="text-black mx-auto" />
              <div className="font-bold text-black text-[14px] uppercase">Lookup Failed</div>
              <p className="text-[14px] text-black/70">{searchError}</p>
            </Card>
          )}

          {!meterData && !searchError && (
            <Card className="p-8 border border-black/15 text-center text-black/50 space-y-2">
              <IconGauge size={32} className="text-black/30 mx-auto" />
              <div className="font-bold text-[14px] uppercase text-black/60">
                Ready to Inspect Meter
              </div>
              <p className="text-[14px] text-black/50">
                Scan a meter QR or enter a serial number on the left to verify active registration, customer connection, and log monthly consumption.
              </p>
            </Card>
          )}

          {meterData && (
            <Card className="p-5 border-l-4 border-l-[#1E6FD9] border border-black/15 space-y-4">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <IconGauge size={14} className="text-[#1E6FD9]" />
                  <span className="font-bold text-black uppercase tracking-wider text-[14px]">
                    Verified Meter Specs
                  </span>
                </div>
                <Badge variant="blue">{meterData.status.toUpperCase()}</Badge>
              </div>

              <div className="space-y-2 bg-[#F0F6FD] p-3 rounded border border-black/10 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-black/60 uppercase font-bold">Serial Number:</span>
                  <strong className="text-black font-bold">{meterData.meter_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 uppercase font-bold">QR Token:</span>
                  <span className="text-black font-normal">{meterData.qr_token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 uppercase font-bold">Barangay Zone:</span>
                  <span className="text-black font-normal">{meterData.barangay || 'Poblacion'}</span>
                </div>
              </div>

              {/* Connected Customer Info */}
              <div className="border border-black/15 p-3 rounded space-y-2 text-[14px]">
                <div className="flex items-center gap-1.5 font-bold text-black uppercase">
                  <IconUser size={12} className="text-[#1E6FD9]" />
                  Connected Household
                </div>
                {meterData.customer ? (
                  <div className="space-y-1 text-black font-normal">
                    <div>
                      <strong className="font-bold">Consumer:</strong> {meterData.customer.name}
                    </div>
                    <div>
                      <strong className="font-bold">Account:</strong>{' '}
                      <span className="text-[#1E6FD9] font-bold">
                        {meterData.customer.account_number}
                      </span>
                    </div>
                    <div>
                      <strong>Address:</strong> {meterData.customer.address || 'Sinacaban'}
                    </div>
                  </div>
                ) : (
                  <div className="text-black/60 italic">
                    Unassigned meter in municipal storage inventory.
                  </div>
                )}
              </div>

              {/* Log Field Reading */}
              <div className="border-t border-black/15 pt-3 space-y-2">
                <span className="font-bold text-black uppercase tracking-wider text-[14px] block">
                  Log Current Reading (Cubic Meters)
                </span>
                <form onSubmit={handleLogReading} className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 142.50"
                    className="flex-1 p-2 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    required
                  />
                  <Button variant="primary" type="submit">
                    <IconCheck size={12} className="inline mr-1" />
                    Record Reading
                  </Button>
                </form>
                {readingLogged && (
                  <div className="text-[14px] text-[#1E6FD9] font-bold">
                    ✓ Reading recorded successfully to municipal ledger.
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
