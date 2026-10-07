import { useState, useCallback } from 'react';
import { MunicipalMap, SINACABAN_CENTER } from './MunicipalMap';
import { Button } from '../atoms/Button';
import { IconMapPin, IconCurrentLocation, IconRotateDot } from '@tabler/icons-react';

interface LocationPickerMapProps {
  latitude: string | number;
  longitude: string | number;
  onChange: (lat: string, lng: string) => void;
  className?: string;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  className = '',
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
      {/* Helper header & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-black font-semibold">
          <IconMapPin size={14} className="text-[#1E6FD9]" />
          <span>Click on the map or drag the pin to position your water service line:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            className="py-1 px-2 text-[9px] flex items-center gap-1 border border-black/15 bg-white hover:bg-[#F0F6FD]"
            onClick={handleGetCurrentLocation}
            disabled={gpsLoading}
          >
            <IconCurrentLocation size={12} className="text-[#1E6FD9]" />
            <span>{gpsLoading ? 'Detecting GPS...' : 'My GPS Location'}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="py-1 px-2 text-[9px] flex items-center gap-1 border border-black/15 bg-white hover:bg-[#F0F6FD]"
            onClick={handleResetToCenter}
          >
            <IconRotateDot size={12} />
            <span>Reset Center</span>
          </Button>
        </div>
      </div>

      {gpsError && (
        <div className="p-2 bg-[#F0F6FD] border border-black/15 rounded text-[9px] text-black">
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
          className="h-64 sm:h-72 w-full"
        />
      </div>

      {/* Coordinate Readout */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#F0F6FD] border border-black/10 rounded text-[10px]">
        <span className="text-black/70">Selected Coordinates:</span>
        <span className="font-mono font-bold text-black">
          {currentLat.toFixed(6)}° N, {currentLng.toFixed(6)}° E
        </span>
      </div>
    </div>
  );
}
