import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const SINACABAN_CENTER: [number, number] = [8.2950, 123.7800];

// Geographic bounding box locking the map view strictly to Sinacaban municipality
export const SINACABAN_BOUNDS: [[number, number], [number, number]] = [
  [8.2000, 123.6300],
  [8.3900, 123.9300],
];

// Official PhilAtlas GIS coordinates for all 17 Sinacaban barangays
export const SINACABAN_BARANGAY_COORDS: Record<string, [number, number]> = {
  'poblacion': [8.2855, 123.8429],
  'cagay-anon': [8.3152, 123.8487],
  'cagayanon': [8.3152, 123.8487],
  'camanse': [8.3008, 123.8244],
  'sinonoc': [8.3034, 123.8474],
  'katipunan': [8.2834, 123.7285],
  'libertad': [8.2747, 123.8081],
  'libertad alto': [8.2747, 123.8081],
  'libertad bajo': [8.2801, 123.8433],
  'señor': [8.2812, 123.8034],
  'senor': [8.2812, 123.8034],
  'colupan': [8.2945, 123.8169],
  'colupan alto': [8.2945, 123.8169],
  'colupan bajo': [8.2989, 123.8463],
  'estrella': [8.2982, 123.7438],
  'san isidro': [8.2760, 123.7504],
  'san isidro alto': [8.2760, 123.7504],
  'san isidro bajo': [8.2818, 123.7744],
  'tipan': [8.2968, 123.7817],
  'dinas': [8.3018, 123.7740],
  'san vicente': [8.3134, 123.8307],
  'san lorenzo ruiz': [8.2856, 123.6998],
};

export function getSinacabanBarangayCoords(barangayName?: string | null): [number, number] {
  if (!barangayName) return SINACABAN_BARANGAY_COORDS['poblacion'];
  const key = barangayName.replace(/^barangay\s+/i, '').trim().toLowerCase();
  if (SINACABAN_BARANGAY_COORDS[key]) return SINACABAN_BARANGAY_COORDS[key];
  for (const [bName, coords] of Object.entries(SINACABAN_BARANGAY_COORDS)) {
    if (key.includes(bName) || bName.includes(key)) {
      return coords;
    }
  }
  return SINACABAN_BARANGAY_COORDS['poblacion'];
}

export function isWithinSinacabanBounds(lat: number, lng: number): boolean {
  return (
    lat >= SINACABAN_BOUNDS[0][0] &&
    lat <= SINACABAN_BOUNDS[1][0] &&
    lng >= SINACABAN_BOUNDS[0][1] &&
    lng <= SINACABAN_BOUNDS[1][1]
  );
}

// Fix Leaflet container resize rendering issues in dynamic tabs/modals
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Map view updater for dynamic pan and zoom transitions when barangay, current location, or target changes
function MapUpdater({
  center,
  zoom,
  resetKey,
}: {
  center: [number, number];
  zoom: number;
  resetKey?: number | string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      map.invalidateSize();
      if (typeof map.flyTo === 'function') {
        map.flyTo(center, zoom, { duration: 0.65 });
      } else if (typeof map.setView === 'function') {
        map.setView(center, zoom);
      }
    } catch {
      // Safe fallback
    }
  }, [center[0], center[1], zoom, resetKey, map]);
  return null;
}

// Map click listener for interactive location picking
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Zoom watcher to dynamically track map zoom level and scale pins proportionally
function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  useMapEvents({
    zoom() {
      onZoomChange(map.getZoom());
    },
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  return null;
}

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  markerType?: 'request' | 'customer';
  title: string;
  subtitle?: string;
  label?: string;
  color?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: string;
  dateLabel?: string;
  imageUrl?: string;
  isHighlighted?: boolean;
  // Customer home marker fields (Step 5a)
  customerName?: string;
  meterNumber?: string;
  address?: string;
  barangay?: string;
  accountNumber?: string;
  onOpenDetails?: () => void;
  onAssignStaff?: () => void;
  onOpenRecord?: () => void;
  onClick?: () => void;
}

export interface MapHotspot {
  id: string | number;
  lat: number;
  lng: number;
  radius?: number;
  polygon?: [number, number][];
  label: string;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  maintenanceCount?: number;
  resolvedCount?: number;
  activeCount?: number;
  intensityLevel?: string;
  details?: string;
}

export interface MunicipalMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  hotspots?: MapHotspot[];
  selectedMarkerId?: string | number | null;
  selectedCoords?: [number, number] | null;
  onSelectCoords?: (lat: number, lng: number) => void;
  interactivePicker?: boolean;
  pickerType?: 'pin' | 'home';
  className?: string;
  style?: React.CSSProperties;
  lockToSinacaban?: boolean;
  maxBounds?: [[number, number], [number, number]];
  maxBoundsViscosity?: number;
  minZoom?: number;
  maxZoom?: number;
  viewResetKey?: number | string;
}

export interface CreatePinIconOptions {
  color?: string;
  urgency?: 'low' | 'medium' | 'high' | string;
  status?: string;
  imageUrl?: string;
  id?: string | number;
  label?: string;
  isHighlighted?: boolean;
  scale?: number;
}

export function getProgressInfo(status?: string): { label: string; dotBg: string } {
  const s = (status || 'submitted').toLowerCase();
  switch (s) {
    case 'in_progress':
      return { label: 'In progress', dotBg: 'var(--color-brand-blue)' };
    case 'assigned':
      return { label: 'Assigned', dotBg: 'var(--color-urgency-medium)' };
    case 'resolved':
      return { label: 'Resolved', dotBg: 'var(--color-urgency-low)' };
    case 'cancelled':
      return { label: 'Cancelled', dotBg: 'var(--color-assigned)' };
    case 'submitted':
    default:
      return { label: 'Submitted', dotBg: 'var(--color-brand-blue)' };
  }
}

export function getPinScaleForZoom(zoomLevel: number): number {
  if (zoomLevel <= 11) return 0.78;
  if (zoomLevel <= 12) return 0.88;
  if (zoomLevel <= 14) return 0.96;
  return 1.05;
}

export function getUrgencyPinColor(urgency?: string, customColor?: string, status?: string): string {
  if (customColor) return customColor;
  const st = (status || '').toLowerCase();
  if (st === 'resolved' || st === 'cancelled') {
    return 'var(--color-assigned)'; // Assigned/Resolved tone for inactive requests
  }
  switch ((urgency || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'var(--color-urgency-high)'; // Red for High/Critical
    case 'medium':
      return 'var(--color-urgency-medium)'; // Orange for Medium
    case 'low':
      return 'var(--color-urgency-low)'; // Low urgency token
    default:
      return 'var(--color-brand-blue)'; // Municipal Blue default
  }
}

export function formatSubtleId(id?: string | number, label?: string): string {
  if (!id && !label) return '';
  const raw = String(id || label).trim();
  if (raw.startsWith('REQ-2026-')) {
    const num = raw.replace('REQ-2026-', '').replace(/^0+/, '');
    return '#' + (num || '1');
  }
  if (raw.startsWith('AT-')) {
    const num = raw.replace('AT-', '').replace(/^0+/, '');
    return '#' + (num || '1');
  }
  if (raw.startsWith('req-')) {
    const num = raw.replace('req-', '').replace(/^0+/, '');
    return '#' + (num || '1');
  }
  if (raw.startsWith('#')) {
    return raw;
  }
  return '#' + raw;
}

// Simplified, compact map pin design for Requests (22x30px teardrop with clean white border and center dot)
export function createPinIcon(options: CreatePinIconOptions | string = 'var(--color-brand-blue)', legacyLabel?: string) {
  const opts: CreatePinIconOptions =
    typeof options === 'string'
      ? { color: options, label: legacyLabel }
      : options;

  const pinColor = getUrgencyPinColor(opts.urgency, opts.color, opts.status);
  const isHighlighted = !!opts.isHighlighted;
  const isSubmittedStatus = (opts.status || '').toLowerCase() === 'submitted';
  const rawScale = opts.scale !== undefined && opts.scale > 0 ? opts.scale : 1.0;
  const scale = Number((rawScale * (isHighlighted ? 1.15 : 1.0)).toFixed(2));

  const baseWidth = 22;
  const baseHeight = 30;
  const anchorX = 11;
  const anchorY = 28;

  const scaledWidth = Math.round(baseWidth * scale);
  const scaledHeight = Math.round(baseHeight * scale);
  const scaledAnchorX = Math.round(anchorX * scale);
  const scaledAnchorY = Math.round(anchorY * scale);

  return L.divIcon({
    className: `custom-leaflet-marker ${isHighlighted ? 'marker-highlighted' : ''} ${
      isSubmittedStatus ? 'marker-submitted-pulse' : 'marker-steady'
    }`,
    html: `
      <div style="width: ${baseWidth}px; height: ${baseHeight}px; transform: scale(${scale}); transform-origin: 0 0; position: relative; cursor: pointer; user-select: none;">
        ${
          isSubmittedStatus
            ? `<div class="pin-radar-pulse" style="position: absolute; top: -2px; left: -1px; width: 24px; height: 24px; border-radius: 50%; background: ${pinColor}; opacity: 0.35; pointer-events: none; z-index: 1;"></div>`
            : ''
        }
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; position: relative; z-index: 2; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.28));">
          <path
            d="M11 28C11 28 20 18.2 20 10.5C20 5.52944 15.9706 1.5 11 1.5C6.02944 1.5 2 5.52944 2 10.5C2 18.2 11 28 11 28Z"
            fill="${pinColor}"
            stroke="${isHighlighted ? 'var(--color-brand-black)' : 'var(--color-brand-white)'}"
            stroke-width="${isHighlighted ? '2' : '1.75'}"
            stroke-linejoin="round"
          />
          <circle cx="11" cy="10.5" r="3.5" fill="var(--color-brand-white)" />
        </svg>
      </div>
    `,
    iconSize: [scaledWidth, scaledHeight],
    iconAnchor: [scaledAnchorX, scaledAnchorY],
    popupAnchor: [0, -scaledAnchorY],
  });
}

// Step 5a: Compact Home icon for Active Customers on the Customers layer (24x24px)
export function createCustomerHomeIcon(isHighlighted = false, rawScale = 1.0) {
  const scale = Number((rawScale * (isHighlighted ? 1.15 : 1.0)).toFixed(2));
  const size = Math.round(24 * scale);
  const anchor = Math.round(12 * scale);

  return L.divIcon({
    className: `custom-leaflet-marker customer-home-marker ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `
      <div style="width: 24px; height: 24px; transform: scale(${scale}); transform-origin: 0 0; border-radius: 50%; background: var(--color-brand-blue); border: ${
        isHighlighted ? '2px solid var(--color-brand-black)' : '1.75px solid var(--color-brand-white)'
      }; box-shadow: 0 2px 5px rgba(0,0,0,0.28); display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-white)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
}

// Step 5c: Grouped marker icon with a count when multiple requests/customers share the same or nearly same location
export function createGroupMarkerIcon(items: MapMarker[], isHighlighted = false, rawScale = 1.0) {
  const scale = Number((rawScale * (isHighlighted ? 1.12 : 1.0)).toFixed(2));
  const size = Math.round(28 * scale);
  const anchor = Math.round(14 * scale);

  // Determine badge accent color: if group contains requests, use highest urgency color; otherwise customer blue
  const reqItems = items.filter((i) => i.markerType !== 'customer');
  let bgColor = 'var(--color-brand-blue)';
  if (reqItems.length > 0) {
    if (reqItems.some((r) => r.urgency === 'high' && r.status !== 'resolved' && r.status !== 'cancelled')) {
      bgColor = 'var(--color-urgency-high)';
    } else if (reqItems.some((r) => r.urgency === 'medium' && r.status !== 'resolved' && r.status !== 'cancelled')) {
      bgColor = 'var(--color-urgency-medium)';
    } else if (reqItems.some((r) => r.urgency === 'low' && r.status !== 'resolved' && r.status !== 'cancelled')) {
      bgColor = 'var(--color-urgency-low)';
    } else {
      bgColor = 'var(--color-assigned)';
    }
  }

  return L.divIcon({
    className: `custom-leaflet-marker grouped-marker ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `
      <div style="width: 28px; height: 28px; transform: scale(${scale}); transform-origin: 0 0; border-radius: 50%; background: ${bgColor}; border: 2px solid var(--color-brand-white); box-shadow: 0 0 0 2px rgba(15,23,42,0.22), 0 3px 8px rgba(0,0,0,0.32); display: flex; align-items: center; justify-content: center; color: var(--color-brand-white); font-size: 11px; font-weight: 800; font-family: sans-serif; cursor: pointer;">
        ${items.length}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
}

export function createHomeIcon(options?: { isHighlighted?: boolean; scale?: number }) {
  return createCustomerHomeIcon(options?.isHighlighted ?? false, options?.scale ?? 1.0);
}

function createPickerIcon() {
  return createPinIcon({
    color: 'var(--color-brand-blue)',
    scale: 1.0,
  });
}

export interface MarkerGroup {
  groupId: string;
  lat: number;
  lng: number;
  items: MapMarker[];
}

// Step 5c: Group markers at the same or nearly the same location (~35m threshold) into one marker with a count
export function groupNearbyMarkers(markers: MapMarker[], threshold = 0.00035): MarkerGroup[] {
  const groups: MarkerGroup[] = [];

  markers.forEach((m) => {
    const existing = groups.find(
      (g) => Math.abs(g.lat - m.lat) <= threshold && Math.abs(g.lng - m.lng) <= threshold
    );
    if (existing) {
      existing.items.push(m);
    } else {
      groups.push({
        groupId: `grp-${m.id}`,
        lat: m.lat,
        lng: m.lng,
        items: [m],
      });
    }
  });

  return groups;
}

export function MunicipalMap({
  center = SINACABAN_CENTER,
  zoom = 12,
  markers = [],
  hotspots = [],
  selectedMarkerId,
  selectedCoords,
  onSelectCoords,
  interactivePicker = false,
  pickerType = 'pin',
  className = 'h-96 w-full rounded overflow-hidden',
  style,
  lockToSinacaban = true,
  maxBounds,
  maxBoundsViscosity = 0.85,
  minZoom = 11,
  maxZoom = 18,
  viewResetKey,
}: MunicipalMapProps) {
  const pickerIcon = useMemo(
    () => (pickerType === 'home' ? createHomeIcon({ isHighlighted: true }) : createPickerIcon()),
    [pickerType]
  );
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(zoom);
  const [activeGroupItemMap, setActiveGroupItemMap] = useState<Record<string, MapMarker | null>>({});

  useEffect(() => {
    setMapZoomLevel(zoom);
  }, [zoom]);

  const markerGroups = useMemo(() => groupNearbyMarkers(markers), [markers]);

  const renderMarkerSummary = (m: MapMarker, onBackToGroup?: () => void) => {
    if (m.markerType === 'customer') {
      return (
        <div className="text-[12px] p-1 font-sans space-y-1.5 min-w-[195px]">
          {onBackToGroup && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBackToGroup();
              }}
              className="text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer block mb-1"
            >
              ← Back to group list
            </button>
          )}
          <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt={m.customerName || m.title}
                  className="w-7 h-7 rounded-full object-cover border border-black/15 shrink-0"
                />
              )}
              <span className="font-bold text-black truncate">{m.customerName || m.title}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-brand-blue border border-blue-200 shrink-0">
              HOME
            </span>
          </div>
          <div className="space-y-0.5 text-black/75 text-[11px]">
            <div>
              <span className="text-black/50">Meter: </span>
              <span className="font-mono font-semibold text-black">{m.meterNumber || 'MTR-SIN-0001'}</span>
            </div>
            <div>
              <span className="text-black/50">Address: </span>
              <span className="text-black">{m.address || 'Sinacaban'}</span>
            </div>
            <div>
              <span className="text-black/50">Barangay: </span>
              <span className="text-black">{m.barangay || 'Poblacion'}</span>
            </div>
          </div>
          {m.onOpenRecord && (
            <div className="pt-1 border-t border-black/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.onOpenRecord) m.onOpenRecord();
                }}
                className="w-full py-1 px-2.5 rounded bg-brand-blue hover:bg-brand-blue-hover text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Open Customer Record
              </button>
            </div>
          )}
        </div>
      );
    }

    const progress = getProgressInfo(m.status);
    return (
      <div className="text-[12px] p-1 font-sans space-y-1.5 min-w-[195px]">
        {onBackToGroup && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBackToGroup();
            }}
            className="text-[11px] font-semibold text-brand-blue hover:underline cursor-pointer block mb-1"
          >
            ← Back to group list
          </button>
        )}
        <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1">
          <span className="font-bold text-black">{m.title}</span>
          {m.urgency && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                m.urgency.toLowerCase() === 'high' || m.urgency.toLowerCase() === 'critical'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : m.urgency.toLowerCase() === 'medium'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-blue-50 text-brand-blue border border-blue-200'
              }`}
            >
              {m.urgency}
            </span>
          )}
        </div>
        {m.subtitle && <div className="text-black/80 text-[11px] font-medium">{m.subtitle}</div>}
        <div className="text-[10px] text-black/55 font-mono">
          GPS: {m.lat.toFixed(4)}°, {m.lng.toFixed(4)}°
        </div>
        <div className="flex items-center justify-between gap-1.5 text-[11px]">
          {m.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 text-black/80 border border-black/10">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: progress.dotBg }} />
              {progress.label}
            </span>
          )}
          {m.dateLabel && <span className="text-[10px] text-black/55">{m.dateLabel}</span>}
        </div>
        {(m.onOpenDetails || m.onAssignStaff) && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-black/10">
            {m.onOpenDetails && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.onOpenDetails) m.onOpenDetails();
                }}
                className="flex-1 py-1 px-2 rounded bg-black/5 hover:bg-black/10 text-black text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Full Details
              </button>
            )}
            {m.onAssignStaff && m.status !== 'resolved' && m.status !== 'cancelled' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (m.onAssignStaff) m.onAssignStaff();
                }}
                className="flex-1 py-1 px-2 rounded bg-brand-blue hover:bg-brand-blue-hover text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Assign Staff
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={lockToSinacaban ? (maxBounds || SINACABAN_BOUNDS) : maxBounds}
        maxBoundsViscosity={maxBoundsViscosity}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <MapResizer />
        <MapUpdater center={center} zoom={zoom} resetKey={viewResetKey} />
        <ZoomWatcher onZoomChange={setMapZoomLevel} />
        {interactivePicker && <MapClickHandler onClick={onSelectCoords} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspots / Maintenance Intensity Zones */}
        {hotspots.map((h) => {
          const zoneColor = h.color || h.fillColor || 'var(--color-brand-blue)';
          const fillOpacity = h.fillOpacity ?? 0.28;

          const content = (
            <Popup>
              <div className="text-[13px] p-1 font-sans space-y-1.5 min-w-[190px]">
                <div className="flex items-center justify-between gap-1.5 border-b border-black/10 pb-1">
                  <strong className="block text-black font-medium">{h.label}</strong>
                  {h.intensityLevel && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shadow-2xs"
                      style={{ backgroundColor: zoneColor }}
                    >
                      {h.intensityLevel.toUpperCase()}
                    </span>
                  )}
                </div>
                {h.maintenanceCount !== undefined && (
                  <div className="text-xs font-normal text-black/80 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Maintenance Activity:</span>
                      <span className="font-medium text-black">{h.maintenanceCount} requests</span>
                    </div>
                    {h.resolvedCount !== undefined && h.activeCount !== undefined && (
                      <div className="flex items-center justify-between text-[11px] text-black/60">
                        <span>{h.resolvedCount} Resolved</span>
                        <span>{h.activeCount} Ongoing</span>
                      </div>
                    )}
                  </div>
                )}
                {h.details && (
                  <div className="text-[11px] text-black/60 pt-0.5 border-t border-black/5">
                    {h.details}
                  </div>
                )}
              </div>
            </Popup>
          );

          if (h.polygon && h.polygon.length > 2) {
            return (
              <Polygon
                key={h.id}
                positions={h.polygon}
                pathOptions={{
                  color: zoneColor,
                  fillColor: zoneColor,
                  fillOpacity: fillOpacity,
                  weight: 1.5,
                  dashArray: '3, 3',
                }}
              >
                {content}
              </Polygon>
            );
          }

          return (
            <Circle
              key={h.id}
              center={[h.lat, h.lng]}
              radius={h.radius || 300}
              pathOptions={{
                color: zoneColor,
                fillColor: zoneColor,
                fillOpacity: fillOpacity,
                weight: 1.5,
                dashArray: '3, 3',
              }}
            >
              {content}
            </Circle>
          );
        })}

        {/* Single & Grouped Markers (Requests pins + Customer home icons + Co-located groups) */}
        {markerGroups.map((group) => {
          const pinScale = getPinScaleForZoom(mapZoomLevel);

          // Single Marker
          if (group.items.length === 1) {
            const m = group.items[0];
            const isHighlighted =
              !!m.isHighlighted ||
              (selectedMarkerId !== undefined &&
                selectedMarkerId !== null &&
                String(m.id) === String(selectedMarkerId));

            const icon =
              m.markerType === 'customer'
                ? createCustomerHomeIcon(isHighlighted, pinScale)
                : createPinIcon({
                    color: m.color,
                    urgency: m.urgency,
                    status: m.status,
                    imageUrl: m.imageUrl,
                    id: m.id,
                    label: m.label,
                    isHighlighted,
                    scale: pinScale,
                  });

            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={icon}
                zIndexOffset={isHighlighted ? 2000 : m.markerType === 'customer' ? 100 : 500}
                eventHandlers={{
                  click: () => {
                    if (m.onClick) m.onClick();
                  },
                }}
              >
                <Popup>{renderMarkerSummary(m)}</Popup>
              </Marker>
            );
          }

          // Grouped Marker (Step 5c: multiple markers at the same or nearly the same location)
          const isGroupHighlighted = group.items.some(
            (m) =>
              !!m.isHighlighted ||
              (selectedMarkerId !== undefined &&
                selectedMarkerId !== null &&
                String(m.id) === String(selectedMarkerId))
          );

          const groupIcon = createGroupMarkerIcon(group.items, isGroupHighlighted, pinScale);
          const selectedSubItem = activeGroupItemMap[group.groupId] || null;

          return (
            <Marker
              key={group.groupId}
              position={[group.lat, group.lng]}
              icon={groupIcon}
              zIndexOffset={isGroupHighlighted ? 2200 : 1000}
              eventHandlers={{
                click: () => {
                  setActiveGroupItemMap((prev) => ({ ...prev, [group.groupId]: null }));
                },
              }}
            >
              <Popup>
                {selectedSubItem ? (
                  renderMarkerSummary(selectedSubItem, () =>
                    setActiveGroupItemMap((prev) => ({ ...prev, [group.groupId]: null }))
                  )
                ) : (
                  <div className="text-[12px] p-1 font-sans space-y-1.5 min-w-[210px]">
                    <div className="font-bold text-black border-b border-black/10 pb-1 flex items-center justify-between">
                      <span>Location Group</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-black text-[10px] font-bold">
                        {group.items.length} items
                      </span>
                    </div>
                    <div className="max-h-44 overflow-y-auto divide-y divide-black/10">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroupItemMap((prev) => ({ ...prev, [group.groupId]: item }));
                            if (item.onClick) item.onClick();
                          }}
                          className="w-full py-1.5 px-1 text-left hover:bg-black/5 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-black truncate">
                              {item.markerType === 'customer'
                                ? item.customerName || item.title
                                : item.title}
                            </div>
                            <div className="text-[10px] text-black/60 truncate">
                              {item.markerType === 'customer'
                                ? `${item.meterNumber || 'Meter'} · ${item.barangay || 'Poblacion'}`
                                : item.subtitle || item.barangay || 'Service Request'}
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 uppercase ${
                              item.markerType === 'customer'
                                ? 'bg-blue-50 text-brand-blue'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.markerType === 'customer' ? 'Home' : item.urgency || 'Req'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}

        {/* Interactive Location Picker Marker */}
        {selectedCoords && (
          <Marker
            position={selectedCoords}
            icon={pickerIcon}
            draggable={interactivePicker}
            eventHandlers={{
              dragend: (e) => {
                if (onSelectCoords) {
                  const latlng = e.target.getLatLng();
                  onSelectCoords(latlng.lat, latlng.lng);
                }
              },
            }}
          >
            <Popup>
              <div className="text-[13px] font-sans p-1">
                <strong className="text-brand-blue block font-medium">Selected Location</strong>
                <span className="text-black/80 font-normal text-xs">
                  {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
