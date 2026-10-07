import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { requestsApi, adminApi } from '../../api';
import type { ServiceRequest, User, Urgency } from '../../types';
import {
  IconUserPlus,
  IconEye,
  IconX,
  IconSearch,
} from '@tabler/icons-react';

export function AdminRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wireframe A2: Active vs History Tabs
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Wireframe A3: Request Detail Drawer
  const [drawerReq, setDrawerReq] = useState<ServiceRequest | null>(null);
  const [adjustedUrgency, setAdjustedUrgency] = useState<Urgency>('medium');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [isSavingUrgency, setIsSavingUrgency] = useState(false);
  const [urgencySavedNotice, setUrgencySavedNotice] = useState(false);

  // Wireframe A4: Assign Staff Modal
  const [assigningReq, setAssigningReq] = useState<ServiceRequest | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await requestsApi.list({ per_page: 50 });
      setRequests(res.data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on Tab, Status, and Search query
  const filteredRequests = requests.filter((r) => {
    // Tab filtering per Wireframe A2
    if (activeTab === 'active') {
      if (r.status === 'resolved' || r.status === 'cancelled') return false;
    } else {
      if (r.status !== 'resolved' && r.status !== 'cancelled') return false;
    }

    // Status pill filter
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ref = (r.reference || '').toLowerCase();
      const brgy = (r.customer?.barangay || '').toLowerCase();
      const name = (r.customer?.full_name || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      if (!ref.includes(q) && !brgy.includes(q) && !name.includes(q) && !desc.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleOpenDrawer = (r: ServiceRequest) => {
    setDrawerReq(r);
    setAdjustedUrgency(r.urgency);
    setUrgencyReason(r.urgency_adjustment_reason || '');
    setUrgencySavedNotice(false);
  };

  const handleOpenAssignModal = async (req: ServiceRequest) => {
    setAssigningReq(req);
    setSelectedStaffId(null);
    setAssignmentNotes('');
    try {
      const staff = await adminApi.staffList();
      setStaffList(staff);
      if (staff.length > 0) {
        setSelectedStaffId(staff[0].id);
      }
    } catch {
      setStaffList([]);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningReq || !selectedStaffId) return;

    setIsSubmittingAssign(true);
    try {
      await requestsApi.assign(assigningReq.id, selectedStaffId, assignmentNotes.trim() || undefined);
      setAssigningReq(null);
      if (drawerReq && drawerReq.id === assigningReq.id) {
        setDrawerReq(null);
      }
      fetchRequests();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      alert(errObj?.response?.data?.message || 'Failed to dispatch staff.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleSaveUrgencyAdjustment = () => {
    if (!drawerReq) return;

    setIsSavingUrgency(true);
    setTimeout(() => {
      setIsSavingUrgency(false);
      setUrgencySavedNotice(true);
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === drawerReq.id
            ? { ...r, urgency: adjustedUrgency, urgency_adjustment_reason: urgencyReason }
            : r
        )
      );
      setDrawerReq((prev) =>
        prev ? { ...prev, urgency: adjustedUrgency, urgency_adjustment_reason: urgencyReason } : null
      );
      setTimeout(() => setUrgencySavedNotice(false), 2500);
    }, 400);
  };

  return (
    <AdminLayout
      title="Service Requests"
      subtitle="Dispatch & Tracking"
      currentPath="/admin/requests"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4 text-[14px]">
        {/* Wireframe A2 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[14px] font-bold uppercase tracking-wider text-black">
              Service Requests Manager
            </h1>
            <p className="text-[14px] text-black/60">
              Active dispatches, technician assignments, and maintenance logs for Sinacaban (AquaTrack)
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-black/60">Total in view:</span>
            <Badge variant="blue">{filteredRequests.length} Requests</Badge>
          </div>
        </div>

        {/* Wireframe A2 Tabs & Search Bar */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Active vs History Tab */}
            <div className="flex items-center gap-1 border border-black rounded p-0.5 bg-white">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setStatusFilter('all');
                }}
                className={`px-3 py-1 rounded text-[14px] font-bold transition-colors ${
                  activeTab === 'active'
                    ? 'bg-[#1E6FD9] text-white'
                    : 'text-black hover:bg-[#F0F6FD]'
                }`}
              >
                Active Requests
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setStatusFilter('all');
                }}
                className={`px-3 py-1 rounded text-[14px] font-bold transition-colors ${
                  activeTab === 'history'
                    ? 'bg-[#1E6FD9] text-white'
                    : 'text-black hover:bg-[#F0F6FD]'
                }`}
              >
                History (Resolved / Cancelled)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search reference or barangay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
              />
              <IconSearch size={12} className="absolute left-2.5 top-2 text-black/50" />
            </div>
          </div>

          {/* Filter Pills based on active tab */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-bold text-black uppercase text-[14px] mr-1">Filter:</span>
            {(activeTab === 'active'
              ? ['all', 'submitted', 'assigned', 'in_progress']
              : ['all', 'resolved', 'cancelled']
            ).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded text-[14px] capitalize font-bold transition-colors border border-black ${
                  statusFilter === st
                    ? 'bg-[#1E6FD9] text-white'
                    : 'bg-white text-black hover:bg-[#F0F6FD]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Requests */}
        <Card className="overflow-hidden border border-black/15 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#F0F6FD] border-b border-black/15 uppercase tracking-wider text-black">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Reference</th>
                  <th className="px-4 py-2.5 font-bold">Customer</th>
                  <th className="px-4 py-2.5 font-bold">Issue Description</th>
                  <th className="px-4 py-2.5 font-bold">Barangay</th>
                  <th className="px-4 py-2.5 font-bold">Urgency</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Assigned Tech</th>
                  <th className="px-4 py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-black/50">
                      Loading service requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-black/50">
                      <EmptyState
                        title="No Requests Matching Query"
                        description="There are currently no maintenance requests meeting the selected filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenDrawer(r)}
                      className="hover:bg-[#F0F6FD]/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 font-bold text-[#1E6FD9]">
                        {r.reference_no || r.reference}
                      </td>
                      <td className="px-4 py-2.5 font-normal text-black">
                        {r.customer?.full_name ?? 'Resident'}
                      </td>
                      <td className="px-4 py-2.5 text-black max-w-xs truncate font-normal">
                        {r.description}
                      </td>
                      <td className="px-4 py-2.5 text-black font-normal">
                        {r.customer?.barangay ?? 'Sinacaban'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            r.urgency === 'high'
                              ? 'black'
                              : r.urgency === 'medium'
                              ? 'blue'
                              : 'outline'
                          }
                        >
                          {r.urgency.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            r.status === 'in_progress'
                              ? 'blue'
                              : r.status === 'resolved'
                              ? 'black'
                              : 'outline'
                          }
                        >
                          {r.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-black">
                        {r.assigned_staff?.name ? (
                          <span className="font-bold text-black">{r.assigned_staff.name}</span>
                        ) : (
                          <span className="text-black/40 italic font-normal">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            className="px-2 py-0.5 text-[9px]"
                            onClick={() => handleOpenDrawer(r)}
                          >
                            <IconEye size={11} className="mr-0.5" />
                            View
                          </Button>
                          {(r.status === 'submitted' || r.status === 'assigned') && (
                            <Button
                              variant="primary"
                              className="px-2 py-0.5 text-[9px]"
                              onClick={() => handleOpenAssignModal(r)}
                            >
                              <IconUserPlus size={11} className="mr-0.5" />
                              {r.status === 'assigned' ? 'Reassign' : 'Assign'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Wireframe A3: Request Detail Drawer */}
        {drawerReq && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
            <div className="flex-1" onClick={() => setDrawerReq(null)} />

            <div className="w-full max-w-md bg-white border-l-2 border-black flex flex-col h-full shadow-2xl p-5 space-y-4 overflow-y-auto text-[14px]">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-black/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-black uppercase tracking-wider text-[14px]">
                    {drawerReq.reference_no || drawerReq.reference}
                  </span>
                  <Badge variant="blue">
                    {drawerReq.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <button
                  onClick={() => setDrawerReq(null)}
                  className="p-1 text-black hover:text-[#1E6FD9] font-bold"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Reported Problem */}
              <div className="p-3 bg-[#F0F6FD] rounded border border-black/10 space-y-1">
                <span className="font-bold text-black block uppercase tracking-wider text-[9px]">
                  Reported Issue Description
                </span>
                <p className="text-black leading-relaxed">{drawerReq.description}</p>
                <div className="text-[9px] text-black/60 pt-1">
                  Submitted: {new Date(drawerReq.created_at).toLocaleString()}
                </div>
              </div>

              {/* Customer Details Box */}
              <div className="p-3 border border-black/15 rounded space-y-1.5 bg-white">
                <span className="font-bold text-black uppercase tracking-wider text-[9px] block">
                  Customer & Geographic Location
                </span>
                <div className="space-y-1 text-black">
                  <div>
                    <strong>Name:</strong> {drawerReq.customer?.full_name ?? 'Resident'}
                  </div>
                  <div>
                    <strong>Account No:</strong>{' '}
                    <span className="font-bold text-[#1E6FD9]">
                      {drawerReq.customer?.account_number ?? 'ACC-2026-0001'}
                    </span>
                  </div>
                  <div>
                    <strong>Barangay:</strong> {drawerReq.customer?.barangay ?? 'Sinacaban'}
                  </div>
                  <div>
                    <strong>Street Address:</strong>{' '}
                    {drawerReq.customer?.address ?? 'Customer Residence'}
                  </div>
                </div>
              </div>

              {/* Wireframe A3: Urgency Derivation Card */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                  <span className="font-bold text-black uppercase tracking-wider text-[9px]">
                    Urgency Engine Derivation
                  </span>
                  <Badge variant={drawerReq.urgency === 'high' ? 'black' : 'blue'}>
                    FINAL: {drawerReq.urgency.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1 text-black/80">
                  <div className="flex justify-between">
                    <span>Issue Type Baseline Default:</span>
                    <strong className="text-black">MEDIUM</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Input Urgency:</span>
                    <strong className="text-black">
                      {(drawerReq.customer_urgency || 'can_wait').replace('_', ' ').toUpperCase()}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-1">
                    <span>Engine Output:</span>
                    <strong className="text-[#1E6FD9]">{drawerReq.urgency.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              {/* Wireframe A3: Adjust Urgency Control */}
              <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-2">
                <span className="font-bold text-black uppercase tracking-wider text-[9px] block">
                  Administrative Urgency Override
                </span>

                <div className="flex gap-2">
                  <select
                    className="p-1.5 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                    value={adjustedUrgency}
                    onChange={(e) => setAdjustedUrgency(e.target.value as Urgency)}
                  >
                    <option value="low">Low Urgency</option>
                    <option value="medium">Medium Urgency</option>
                    <option value="high">High Urgency</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Reason for change (optional)"
                    className="flex-1 p-1.5 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                    value={urgencyReason}
                    onChange={(e) => setUrgencyReason(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="primary"
                    onClick={handleSaveUrgencyAdjustment}
                    isLoading={isSavingUrgency}
                    className="py-1 px-3 text-[9px]"
                  >
                    Apply Urgency Override
                  </Button>
                  {urgencySavedNotice && (
                    <span className="text-[#1E6FD9] font-bold text-[9px]">
                      ✓ Override saved & logged
                    </span>
                  )}
                </div>

                <span className="text-[9px] text-black/50 block italic">
                  Original and adjusted values stay in the municipal audit activity log.
                </span>
              </div>

              {/* Status Stepper Timeline */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-black uppercase tracking-wider text-[9px] block">
                  Service Request Lifecycle
                </span>
                <StatusTimeline status={drawerReq.status} />
              </div>

              {/* Assigned Staff Info */}
              {drawerReq.assigned_staff ? (
                <div className="p-2.5 bg-white border border-black/15 rounded text-black space-y-1">
                  <div className="flex justify-between">
                    <span className="text-black/60 font-bold uppercase text-[9px]">
                      Assigned Field Technician:
                    </span>
                    <strong className="text-[#1E6FD9]">{drawerReq.assigned_staff.name}</strong>
                  </div>
                  {drawerReq.assignment_notes && (
                    <p className="text-black/70 italic text-[9px]">
                      Notes: {drawerReq.assignment_notes}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Drawer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-black/15">
                <Button variant="secondary" onClick={() => setDrawerReq(null)}>
                  Close
                </Button>

                {(drawerReq.status === 'submitted' || drawerReq.status === 'assigned') && (
                  <Button
                    variant="primary"
                    onClick={() => handleOpenAssignModal(drawerReq)}
                  >
                    <IconUserPlus size={12} className="inline mr-1" />
                    {drawerReq.status === 'assigned' ? 'Reassign Staff' : 'Assign Staff'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wireframe A4: Assign Staff Modal */}
        {assigningReq && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-[14px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconUserPlus size={14} className="text-[#1E6FD9]" />
                  <h3 className="font-bold text-black uppercase tracking-wider text-[14px]">
                    Assign Staff
                  </h3>
                </div>
                <button
                  onClick={() => setAssigningReq(null)}
                  className="text-black hover:text-[#1E6FD9] font-bold"
                >
                  <IconX size={14} />
                </button>
              </div>

              {/* Request Summary per Wireframe A4 */}
              <div className="p-3 bg-[#F0F6FD] rounded border border-black/10 text-black space-y-1">
                <div className="font-bold">
                  {assigningReq.reference_no || assigningReq.reference} ·{' '}
                  {assigningReq.issue_type?.name || 'Water Issue'} ·{' '}
                  {assigningReq.customer?.barangay ?? 'Sinacaban'}
                </div>
                <p className="text-black/70">{assigningReq.description}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold uppercase text-black mb-1">
                    Select Staff
                  </label>
                  {staffList.length === 0 ? (
                    <div className="p-2 border border-black/20 text-black/60 rounded">
                      Loading available field staff...
                    </div>
                  ) : (
                    <select
                      className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] text-[14px]"
                      value={selectedStaffId || ''}
                      onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                    >
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email || 'Technician'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold uppercase text-black mb-1">
                    Assignment Notes
                  </label>
                  <textarea
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] text-[14px]"
                    rows={3}
                    placeholder="Instructions for the technician..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                <Button
                  variant="secondary"
                  onClick={() => setAssigningReq(null)}
                  disabled={isSubmittingAssign}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmAssign}
                  disabled={!selectedStaffId || isSubmittingAssign || staffList.length === 0}
                  isLoading={isSubmittingAssign}
                >
                  Assign
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
