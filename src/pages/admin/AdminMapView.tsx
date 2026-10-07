import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { requestsApi, referenceApi, adminApi } from '../../api';
import type { ServiceRequest, Barangay, User } from '../../types';
import { MunicipalMap, type MapMarker, type MapHotspot } from '../../components/organisms/MunicipalMap';
import { IconMapPin, IconUsers, IconAlertTriangle, IconFlame, IconCheck } from '@tabler/icons-react';

export function AdminMapView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wireframe A6 Layer Toggles: Customers, Requests, Hotspots
  const [showCustomers, setShowCustomers] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [showHotspots, setShowHotspots] = useState(false);

  // Wireframe A6 Filters: Barangay, Status, Staff
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Selected Pin / Item for Bottom Card
  const [selectedItem, setSelectedItem] = useState<{
    type: 'request' | 'customer';
    id: number;
    reference: string;
    name: string;
    barangay: string;
    status?: string;
    urgency?: string;
    details?: string;
  } | null>(null);

  // Quick Assign Staff Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqRes, custRes, staffRes, bgRes] = await Promise.all([
          requestsApi.list({ per_page: 100 }),
          adminApi.customersList({ per_page: 50 }).catch(() => ({ data: [] })),
          adminApi.staffList().catch(() => []),
          referenceApi.getBarangays().catch(() => []),
        ]);
        setRequests(reqRes.data);
        setCustomers(custRes.data);
        setStaffList(staffRes);
        setBarangays(bgRes);

        // Pre-select first request if available
        if (reqRes.data.length > 0) {
          const first = reqRes.data[0];
          setSelectedItem({
            type: 'request',
            id: first.id,
            reference: first.reference_no || first.reference || `AT-${first.id}`,
            name: first.description,
            barangay: first.customer?.barangay || 'Poblacion',
            status: first.status,
            urgency: first.urgency,
            details: first.customer?.full_name || 'Customer Residence',
          });
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered requests and customers
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedBarangay !== 'all' && (r.customer?.barangay || 'Poblacion') !== selectedBarangay) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (selectedStaff !== 'all' && String(r.assigned_staff_id) !== selectedStaff) return false;
      return true;
    });
  }, [requests, selectedBarangay, selectedStatus, selectedStaff]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedBarangay !== 'all') {
        const bg = c.customer_profile?.barangay?.name || 'Poblacion';
        if (bg !== selectedBarangay) return false;
      }
      return true;
    });
  }, [customers, selectedBarangay]);

  const mapMarkers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];

    if (showRequests) {
      filteredRequests.forEach((req, idx) => {
        const lat = req.latitude ? Number(req.latitude) : 8.2835 + ((idx % 7) - 3) * 0.0035;
        const lng = req.longitude ? Number(req.longitude) : 123.8340 + (((idx * 2) % 7) - 3) * 0.0035;

        list.push({
          id: `req-${req.id}`,
          lat,
          lng,
          title: req.reference_no || req.reference || `AT-${req.id}`,
          subtitle: `${req.description} · ${req.customer?.barangay || 'Poblacion'}`,
          label: req.reference_no || req.reference || `AT-${req.id}`,
          urgency: req.urgency,
          status: req.status,
          onClick: () => {
            setSelectedItem({
              type: 'request',
              id: req.id,
              reference: req.reference_no || req.reference || `AT-${req.id}`,
              name: req.description,
              barangay: req.customer?.barangay || 'Poblacion',
              status: req.status,
              urgency: req.urgency,
              details: req.customer?.full_name || 'Consumer Residence',
            });
          },
        });
      });
    }

    if (showCustomers) {
      filteredCustomers.forEach((cust, idx) => {
        const lat = cust.customer_profile?.latitude
          ? Number(cust.customer_profile.latitude)
          : 8.2835 + (((idx * 3) % 9) - 4) * 0.003;
        const lng = cust.customer_profile?.longitude
          ? Number(cust.customer_profile.longitude)
          : 123.8340 + (((idx * 4) % 9) - 4) * 0.003;

        list.push({
          id: `cust-${cust.id}`,
          lat,
          lng,
          title: cust.name || 'Consumer Account',
          subtitle: `${cust.customer_profile?.account_number || 'Pending'} · ${cust.customer_profile?.barangay?.name || 'Poblacion'}`,
          label: cust.customer_profile?.account_number || `ACC-${cust.id}`,
          color: '#000000',
          status: cust.is_verified ? 'Active' : 'Pending',
          onClick: () => {
            setSelectedItem({
              type: 'customer',
              id: cust.id,
              reference: cust.customer_profile?.account_number || `ACC-${cust.id}`,
              name: cust.name || 'Verified Consumer',
              barangay: cust.customer_profile?.barangay?.name || 'Poblacion',
              status: cust.is_verified ? 'Active' : 'Pending',
              details: cust.customer_profile?.address || 'Household Connection',
            });
          },
        });
      });
    }

    return list;
  }, [showRequests, showCustomers, filteredRequests, filteredCustomers]);

  const mapHotspots = useMemo<MapHotspot[]>(() => {
    if (!showHotspots) return [];
    return [
      {
        id: 'hs-1',
        lat: 8.2842,
        lng: 123.8351,
        radius: 280,
        label: 'Sector 1: High Pressure Main Junction',
        color: '#1E6FD9',
      },
      {
        id: 'hs-2',
        lat: 8.2755,
        lng: 123.8295,
        radius: 350,
        label: 'Sector 2: Cagayanan Low-Pressure Risk Area',
        color: '#EA580C',
      },
    ];
  }, [showHotspots]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || selectedItem.type !== 'request' || !assignStaffId) return;

    setIsAssigning(true);
    try {
      await requestsApi.assign(selectedItem.id, Number(assignStaffId), assignNotes);
      setShowAssignModal(false);
      setAssignNotes('');
      // Refresh requests list
      const updated = await requestsApi.list({ per_page: 100 });
      setRequests(updated.data);
      if (selectedItem) {
        setSelectedItem((prev) => prev ? { ...prev, status: 'assigned' } : null);
      }
    } catch {
      alert('Failed to assign staff.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <AdminLayout currentPath="/admin/map" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[10px] text-black">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Municipal Map
            </h1>
            <p className="text-[10px] text-black/60">
              Sinacaban GIS service map, customer pins, work order coordinates, and failure hotspots.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-black/60 bg-[#F0F6FD] px-2 py-1 border border-black/15 rounded">
              {filteredRequests.length} Active Incidents · {filteredCustomers.length} Consumers Mapped
            </span>
          </div>
        </div>

        {/* Wireframe A6 Controls Row: Layer Toggles & Dropdown Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 border border-black/15 rounded">
          {/* Layer Toggles (Pills) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-black uppercase tracking-wider text-[9px] mr-1">
              Layers:
            </span>
            <button
              onClick={() => setShowCustomers(!showCustomers)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                showCustomers
                  ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                  : 'bg-white text-black border-black/20 hover:bg-[#F0F6FD]'
              }`}
            >
              <IconUsers size={12} />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setShowRequests(!showRequests)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                showRequests
                  ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                  : 'bg-white text-black border-black/20 hover:bg-[#F0F6FD]'
              }`}
            >
              <IconAlertTriangle size={12} />
              <span>Requests</span>
            </button>

            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                showHotspots
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black/20 hover:bg-[#F0F6FD]'
              }`}
            >
              <IconFlame size={12} />
              <span>Hotspots</span>
            </button>
          </div>

          {/* Filters: Barangay, Status, Staff */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="px-2 py-1 bg-white border border-black/20 rounded text-[10px] outline-none font-sans"
            >
              <option value="all">Barangay ∨ (All)</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-1 bg-white border border-black/20 rounded text-[10px] outline-none font-sans"
            >
              <option value="all">Status ∨ (All)</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-2 py-1 bg-white border border-black/20 rounded text-[10px] outline-none font-sans"
            >
              <option value="all">Staff ∨ (All)</option>
              {staffList.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name || `Staff #${s.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Wireframe A6 Map Canvas & Hotspot Layer */}
        <Card className="p-0 border border-black/15 overflow-hidden relative shadow-sm">
          {/* Top Status Bar over Map */}
          <div className="flex justify-between items-center px-3 py-2 bg-white/95 border-b border-black/10 z-10">
            <div className="text-[10px] font-bold text-black flex items-center gap-1.5">
              <IconMapPin size={13} className="text-[#1E6FD9]" />
              <span>Sinacaban Municipal GIS · Misamis Occidental (8.2835° N, 123.8340° E)</span>
            </div>
            {showHotspots && (
              <div className="bg-black text-white px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                <IconFlame size={12} className="text-[#1E6FD9]" />
                <span>Pipe Failure Pressure Sectors Active</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="h-96 w-full bg-[#F0F6FD] flex items-center justify-center font-bold text-[10px] text-black">
              Loading Sinacaban municipal GIS data...
            </div>
          ) : (
            <div className="h-[420px] w-full relative">
              <MunicipalMap
                center={[8.2835, 123.8340]}
                zoom={14}
                markers={mapMarkers}
                hotspots={mapHotspots}
                className="h-full w-full"
              />
            </div>
          )}

          {/* Wireframe A6 Bottom Card: Selected Pin Inspector */}
          {selectedItem && (
            <div className="bg-white border-t border-black/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="font-bold text-black text-[11px]">
                    {selectedItem.reference}
                  </strong>
                  <span className="text-black/50">·</span>
                  <span className="text-black font-bold">{selectedItem.barangay}</span>
                  <span className="text-black/50">·</span>
                  <Badge variant={selectedItem.status === 'assigned' ? 'blue' : 'black'}>
                    {(selectedItem.status || 'ACTIVE').toUpperCase()}
                  </Badge>
                  {selectedItem.urgency && (
                    <Badge variant={selectedItem.urgency === 'high' ? 'outline' : 'blue'}>
                      {selectedItem.urgency.toUpperCase()} URGENCY
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-black/70">
                  {selectedItem.name} — <span className="italic">{selectedItem.details}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedItem.type === 'request' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setShowAssignModal(true)}
                    >
                      Assign staff
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/admin/requests')}
                    >
                      View in dispatch queue
                    </Button>
                  </>
                )}
                {selectedItem.type === 'customer' && (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/admin/customers')}
                  >
                    View customer record
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Quick Assign Modal (Wireframe A4 format) */}
        {showAssignModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Assign Staff to {selectedItem.reference}
                </span>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[10px]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Field Technician
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none"
                    value={assignStaffId}
                    onChange={(e) => setAssignStaffId(Number(e.target.value) || '')}
                    required
                  >
                    <option value="">Select field technician...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Staff #${s.id}`} ({s.staff_profile?.assigned_barangay?.name || 'All Sectors'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Assignment Instructions / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bring 1-inch pipe clamps and check main valve."
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isAssigning}
                  >
                    <IconCheck size={12} className="inline mr-1" />
                    Assign Technician
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
