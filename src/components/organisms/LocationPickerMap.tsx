import { useState, useCallback } from 'react';
import { MunicipalMap, SINACABAN_CENTER } from './MunicipalMap';
import { IconCurrentLocation, IconRotateDot } from '@tabler/icons-react';

interface LocationPickerMapProps {
  latitude: string | number;
  longitude: string | number;
  onChange: (lat: string, lng: string) => void;
  className?: string;
  showCoordinates?: boolean;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  className = '',
  showCoordinates = false,
}: LocationPickerMapProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const currentLat = parseFloat(String(latitude)) || SINACABAN_CENTER[0];
  const currentLng = parseFloat(String(longitude)) || SINACABAN_CENTER[1];

  const handleSelectCoords = useCallback(
    (lat: number, lng: number) => {
      onChange(lat.toFixed(6), lng.toFixed(6));
    },
    [onChange]
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        handleSelectCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || 'Unable to retrieve your location. Please tap directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleResetToCenter = () => {
    handleSelectCoords(SINACABAN_CENTER[0], SINACABAN_CENTER[1]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quick map actions: icons strictly side-by-side with smaller lowercase labels */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="h-6 px-2 text-[9px] font-medium lowercase inline-flex items-center gap-1 border border-black/20 bg-white hover:bg-[#F0F6FD] text-black rounded transition-colors cursor-pointer disabled:opacity-50"
        >
          <IconCurrentLocation size={15} className="text-[#1E6FD9] shrink-0" />
          <span className="leading-none whitespace-nowrap">{gpsLoading ? 'detecting...' : 'my gps'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetToCenter}
          className="h-6 px-2 text-[9px] font-medium lowercase inline-flex items-center gap-1 border border-black/20 bg-white hover:bg-[#F0F6FD] text-black rounded transition-colors cursor-pointer"
        >
          <IconRotateDot size={15} className="shrink-0" />
          <span className="leading-none whitespace-nowrap">reset</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-2 bg-[#FFF2F2] border border-black/20 rounded text-[13px] text-black">
          {gpsError}
        </div>
      )}

      {/* Interactive Map */}
      <div className="border border-black/20 rounded-lg overflow-hidden shadow-sm">
        <MunicipalMap
          center={[currentLat, currentLng]}
          zoom={15}
          selectedCoords={[currentLat, currentLng]}
          onSelectCoords={handleSelectCoords}
          interactivePicker={true}
          className="h-72 sm:h-80 w-full"
        />
      </div>

      {/* Coordinate Readout (Hidden by default) */}
      {showCoordinates && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#F0F6FD] border border-black/10 rounded text-[13px]">
          <span className="text-black/70 font-normal">Selected Coordinates:</span>
          <span className="font-bold text-black font-mono">
            {currentLat.toFixed(6)}° N, {currentLng.toFixed(6)}° E
          </span>
        </div>
      )}
    </div>
  );
}
