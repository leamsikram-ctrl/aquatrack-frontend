import { useState, useCallback } from 'react';
import {
  MunicipalMap,
  SINACABAN_CENTER,
  getSinacabanBarangayCoords,
  isWithinSinacabanBounds,
} from './MunicipalMap';
import { IconCurrentLocation, IconRotateDot, IconAlertCircle } from '@tabler/icons-react';

interface LocationPickerMapProps {
  latitude: string | number;
  longitude: string | number;
  barangay?: string | null;
  onChange: (lat: string, lng: string) => void;
  className?: string;
  showCoordinates?: boolean;
  pickerType?: 'pin' | 'home';
}

export function LocationPickerMap({
  latitude,
  longitude,
  barangay,
  onChange,
  className = '',
  showCoordinates = false,
  pickerType = 'pin',
}: LocationPickerMapProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [resetKey, setResetKey] = useState<number>(0);

  const fallbackCoords = barangay ? getSinacabanBarangayCoords(barangay) : SINACABAN_CENTER;
  const currentLat = parseFloat(String(latitude)) || fallbackCoords[0];
  const currentLng = parseFloat(String(longitude)) || fallbackCoords[1];

  const isOutsideMunicipality = !isWithinSinacabanBounds(currentLat, currentLng);

  const markerNoun = pickerType === 'home' ? 'home icon' : 'pin';

  const handleSelectCoords = useCallback(
    (lat: number, lng: number) => {
      if (!isWithinSinacabanBounds(lat, lng)) {
        setGpsError(
          `Warning: The ${markerNoun} is placed outside Sinacaban municipality. Please place the ${markerNoun} within Sinacaban.`
        );
      } else {
        setGpsError(null);
      }
      onChange(lat.toFixed(6), lng.toFixed(6));
    },
    [onChange, markerNoun]
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      handleSelectCoords(fallbackCoords[0], fallbackCoords[1]);
      setMapZoom(16);
      setResetKey((k) => k + 1);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        if (isWithinSinacabanBounds(lat, lng)) {
          handleSelectCoords(lat, lng);
        } else {
          setGpsError(
            `Current GPS location is outside Sinacaban municipality. Centered on barangay instead.`
          );
          onChange(fallbackCoords[0].toFixed(6), fallbackCoords[1].toFixed(6));
        }
        setMapZoom(16);
        setResetKey((k) => k + 1);
      },
      () => {
        setGpsLoading(false);
        handleSelectCoords(fallbackCoords[0], fallbackCoords[1]);
        setMapZoom(16);
        setResetKey((k) => k + 1);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleResetToCenter = () => {
    setGpsError(null);
    onChange(fallbackCoords[0].toFixed(6), fallbackCoords[1].toFixed(6));
    setMapZoom(15);
    setResetKey((k) => k + 1);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quick map actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-black/60 font-medium">
          {pickerType === 'home'
            ? 'Click on the map or drag the home icon to mark your house'
            : 'Click on the map or drag the pin to mark the issue location'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gpsLoading}
            className="h-6 px-2 text-[10px] font-medium inline-flex items-center gap-1 border border-black/20 bg-white hover:bg-black/5 text-black rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <IconCurrentLocation size={13} className="text-brand-blue shrink-0" />
            <span className="leading-none whitespace-nowrap">
              {gpsLoading ? 'Detecting...' : 'Use Current Location'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetToCenter}
            className="h-6 px-2 text-[10px] font-medium inline-flex items-center gap-1 border border-black/20 bg-white hover:bg-black/5 text-black rounded transition-colors cursor-pointer"
          >
            <IconRotateDot size={13} className="shrink-0" />
            <span className="leading-none whitespace-nowrap">Reset</span>
          </button>
        </div>
      </div>

      {(gpsError || isOutsideMunicipality) && (
        <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 rounded-lg text-[12px] font-medium text-urgency-high flex items-center gap-2">
          <IconAlertCircle size={15} className="shrink-0" />
          <span>
            {gpsError ||
              `Warning: The ${markerNoun} is placed outside Sinacaban municipality. Please place the ${markerNoun} inside Sinacaban.`}
          </span>
        </div>
      )}

      {/* Interactive Map */}
      <div className="border border-black/20 rounded-lg overflow-hidden shadow-sm">
        <MunicipalMap
          center={[currentLat, currentLng]}
          zoom={mapZoom}
          selectedCoords={[currentLat, currentLng]}
          onSelectCoords={handleSelectCoords}
          interactivePicker={true}
          pickerType={pickerType}
          lockToSinacaban={false}
          viewResetKey={resetKey}
          className="h-64 sm:h-72 w-full"
        />
      </div>

      {/* Coordinate Readout */}
      {showCoordinates && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-black/15 rounded text-[13px]">
          <span className="text-black/70 font-normal">
            {pickerType === 'home' ? 'Home Location Coordinates:' : 'Issue Location Coordinates:'}
          </span>
          <span className="font-bold text-black font-mono">
            {currentLat.toFixed(6)}° N, {currentLng.toFixed(6)}° E
          </span>
        </div>
      )}
    </div>
  );
}
