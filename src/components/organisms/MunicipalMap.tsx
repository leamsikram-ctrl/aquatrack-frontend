import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet container resize rendering issues in dynamic tabs/modals
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
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

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  label?: string;
  color?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: string;
  onClick?: () => void;
}

export interface MapHotspot {
  id: string | number;
  lat: number;
  lng: number;
  radius: number;
  label: string;
  color?: string;
}

export interface MunicipalMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  hotspots?: MapHotspot[];
  selectedCoords?: [number, number] | null;
  onSelectCoords?: (lat: number, lng: number) => void;
  interactivePicker?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SINACABAN_CENTER: [number, number] = [8.2835, 123.834];

function createPinIcon(color: string = '#1E6FD9', label?: string) {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 1.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: white;"></span>
          ${label ? `<span>${label}</span>` : ''}
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createPickerIcon() {
  return L.divIcon({
    className: 'custom-picker-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
        <div style="background-color: #1E6FD9; color: white; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(30,111,217,0.45); display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Selected Pin</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #1E6FD9;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function MunicipalMap({
  center = SINACABAN_CENTER,
  zoom = 14,
  markers = [],
  hotspots = [],
  selectedCoords,
  onSelectCoords,
  interactivePicker = false,
  className = 'h-96 w-full rounded overflow-hidden',
  style,
}: MunicipalMapProps) {
  const pickerIcon = useMemo(() => createPickerIcon(), []);

  return (
    <div className={`relative ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <MapResizer />
        {interactivePicker && <MapClickHandler onClick={onSelectCoords} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspots / Pressure Zones */}
        {hotspots.map((h) => (
          <Circle
            key={h.id}
            center={[h.lat, h.lng]}
            radius={h.radius}
            pathOptions={{
              color: h.color || '#1E6FD9',
              fillColor: h.color || '#1E6FD9',
              fillOpacity: 0.18,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-[14px] p-1 font-sans">
                <strong className="block text-black font-bold">{h.label}</strong>
                <span className="text-black/60 font-normal">Radius: {h.radius}m · Municipal Sector</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Regular Pins */}
        {markers.map((m) => {
          const color = m.color || (m.urgency === 'high' ? '#DC2626' : m.urgency === 'medium' ? '#EA580C' : '#1E6FD9');
          const icon = createPinIcon(color, m.label);

          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (m.onClick) m.onClick();
                },
              }}
            >
              <Popup>
                <div className="text-[14px] p-1 font-sans space-y-1">
                  <div className="font-bold text-black">{m.title}</div>
                  {m.subtitle && <div className="text-black/70 text-[14px] font-normal">{m.subtitle}</div>}
                  {m.status && (
                    <div className="inline-block px-1.5 py-0.5 rounded text-[14px] font-bold bg-[#F0F6FD] text-[#1E6FD9] border border-[#1E6FD9]/30">
                      {m.status.toUpperCase()}
                    </div>
                  )}
                </div>
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
              <div className="text-[14px] font-sans p-1">
                <strong className="text-[#1E6FD9] block font-bold">Your Location Pin</strong>
                <span className="text-black/80 font-normal text-[14px]">
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
