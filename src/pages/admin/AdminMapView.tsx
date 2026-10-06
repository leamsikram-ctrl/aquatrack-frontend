import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { requestsApi, referenceApi } from '../../api';
import type { ServiceRequest, Barangay } from '../../types';
import { IconTool } from '@tabler/icons-react';

export function AdminMapView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<'requests' | 'customers' | 'hotspots'>('requests');
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | 'all'>('all');
  const [selectedPin, setSelectedPin] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    Promise.all([
      requestsApi.list({ per_page: 50 }),
      referenceApi.getBarangays().catch(() => []),
    ]).then(([reqRes, bgRes]) => {
      setRequests(reqRes.data);
      setBarangays(bgRes);
      if (reqRes.data.length > 0) {
        setSelectedPin(reqRes.data[0]);
      }
    });
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (selectedBarangayId === 'all') return true;
    return r.barangay?.id === selectedBarangayId || r.customer_profile?.barangay_id === selectedBarangayId;
  });

  return (
    <AdminLayout
      title="Municipal Map"
      subtitle="Geographic Operations & Hotspots"
      currentPath="/admin/map"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Header - Matches Wireframe A6 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Sinacaban Infrastructure & Incident Map
            </h1>
            <p className="text-[10px] text-black/60">
              Interactive location overview of customer households, active repair pins, and pipeline incidents.
            </p>
          </div>

          {/* Layer toggles: Customers, Requests, Hotspots */}
          <div className="flex items-center gap-1.5">
            {(['requests', 'customers', 'hotspots'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-3 py-1 rounded text-[10px] font-bold capitalize transition-colors border border-black ${
                  selectedLayer === layer
                    ? 'bg-[#1E6FD9] text-white'
                    : 'bg-white text-black hover:bg-[#F0F6FD]'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar: Barangay, Status, Staff */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-[#F0F6FD] border border-black/15 rounded text-[10px]">
          <span className="font-bold text-black uppercase">Area Zone:</span>
          <select
            className="p-1 bg-white text-black border border-black rounded outline-none"
            value={selectedBarangayId}
            onChange={(e) => setSelectedBarangayId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Sinacaban Barangays</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="text-black/40">|</span>
          <span className="text-black/70">
            Showing <strong>{filteredRequests.length} geo-referenced items</strong>
          </span>
        </div>

        {/* Map Canvas & Selected Pin Detail - Matches Wireframe A6 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Schematic Geographic Grid / Map View */}
          <Card className="lg:col-span-2 p-4 border border-black/15 space-y-3 min-h-[360px] flex flex-col justify-between bg-white relative">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="font-bold text-black text-[10px] uppercase tracking-wider">
                Sinacaban Municipal Grid (Leaflet Map Vector)
              </span>
              <Badge variant="blue">{selectedLayer.toUpperCase()} LAYER ACTIVE</Badge>
            </div>

            {/* Visual Schematic Map Representation with Interactive Pins */}
            <div className="flex-1 bg-[#F0F6FD] border border-dashed border-black/30 rounded p-6 relative flex flex-wrap items-center justify-around gap-4 min-h-[260px]">
              {filteredRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedPin(req)}
                  className={`p-2 rounded border text-left shadow-sm transition-transform hover:scale-105 text-[10px] ${
                    selectedPin?.id === req.id
                      ? 'bg-[#1E6FD9] text-white border-black font-bold scale-105'
                      : 'bg-white text-black border-black/30'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <IconTool size={10} />
                    <span>{req.reference_no || req.reference}</span>
                  </div>
                  <div className="text-[9px] opacity-80 truncate max-w-[120px]">
                    {req.barangay?.name || 'Poblacion'}
                  </div>
                </button>
              ))}

              <div className="absolute bottom-2 left-2 text-[9px] text-black/50 bg-white/90 px-2 py-0.5 rounded border border-black/10">
                Lat: 8.2833° N, Long: 123.8333° E · Sinacaban, Misamis Occidental
              </div>
            </div>
          </Card>

          {/* Selected Pin Details & Dispatch Action */}
          <Card className="p-4 border border-black/15 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-black/10 pb-2 flex items-center justify-between">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Selected Marker Info
                </span>
                {selectedPin && (
                  <Badge variant={selectedPin.status === 'resolved' ? 'blue' : 'black'}>
                    {selectedPin.status.toUpperCase()}
                  </Badge>
                )}
              </div>

              {selectedPin ? (
                <div className="space-y-2 text-[10px]">
                  <div>
                    <span className="text-black/60 font-bold uppercase block">Reference:</span>
                    <strong className="text-[#1E6FD9] font-mono text-[11px]">
                      {selectedPin.reference_no || selectedPin.reference}
                    </strong>
                  </div>
                  <div>
                    <span className="text-black/60 font-bold uppercase block">Barangay Location:</span>
                    <span className="text-black">{selectedPin.customer?.barangay || selectedPin.barangay?.name || 'Poblacion'}</span>
                  </div>
                  <div>
                    <span className="text-black/60 font-bold uppercase block">Issue Description:</span>
                    <p className="text-black bg-[#F0F6FD] p-2 rounded border border-black/10">
                      {selectedPin.description}
                    </p>
                  </div>
                  <div>
                    <span className="text-black/60 font-bold uppercase block">Assigned Technician:</span>
                    <strong className="text-black">
                      {selectedPin.assigned_staff?.name || 'Unassigned'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-black/50 text-[10px] italic">
                  Click any marker on the map to inspect details.
                </div>
              )}
            </div>

            {selectedPin && (
              <div className="pt-2 border-t border-black/10">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/admin/requests')}
                >
                  Open in Service Dispatcher
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
