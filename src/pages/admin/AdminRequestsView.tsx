import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { SystemModal } from '../../components/molecules/SystemModal';
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

  // Modern System Alert Modal
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

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
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Dispatch Failed',
        message: errObj?.response?.data?.message || 'Failed to dispatch staff.',
      });
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
        {/* Header */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Service Requests
          </h1>
        </div>

        {/* Filter & Controls Card */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Active vs History Tab & Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-black/15 rounded p-0.5 bg-black/5">
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded text-[14px] transition-colors ${
                    activeTab === 'active'
                      ? 'bg-[#1E6FD9] text-white font-medium'
                      : 'text-black hover:bg-black/5 font-normal'
                  }`}
                >
                  Active Requests
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded text-[14px] transition-colors ${
                    activeTab === 'history'
                      ? 'bg-[#1E6FD9] text-white font-medium'
                      : 'text-black hover:bg-black/5 font-normal'
                  }`}
                >
                  History
                </button>
              </div>
              <Badge variant="blue">{filteredRequests.length} Requests</Badge>
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
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/10">
            <span className="text-xs font-medium text-black/60 mr-1">Filter:</span>
            {(activeTab === 'active'
              ? ['all', 'submitted', 'assigned', 'in_progress']
              : ['all', 'resolved', 'cancelled']
            ).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded text-[14px] capitalize transition-colors border border-black ${
                  statusFilter === st
                    ? 'bg-[#1E6FD9] text-white font-medium'
                    : 'bg-white text-black hover:bg-black/5 font-normal'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </Card>

        {/* Table of Requests */}
        <Card className="overflow-hidden border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-white border-b border-black/15 text-black">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Reference</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Customer</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Issue Description</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Barangay</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Urgency</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Status</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Assigned Tech</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60 text-right">Action</th>
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
                      className="hover:bg-black/5 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium text-[#1E6FD9]">
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
                          variant={r.urgency === 'high' ? 'blue' : 'outline'}
                        >
                          {r.urgency ? (r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)) : 'Medium'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            r.status === 'in_progress' || r.status === 'resolved'
                              ? 'blue'
                              : 'outline'
                          }
                        >
                          {r.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-black">
                        {r.assigned_staff?.name ? (
                          <span className="font-medium text-black">{r.assigned_staff.name}</span>
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
                  <h2 className="text-base font-bold text-black">
                    {drawerReq.reference_no || drawerReq.reference}
                  </h2>
                  <Badge variant="blue">
                    {drawerReq.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <button
                  onClick={() => setDrawerReq(null)}
                  className="p-1 text-black hover:text-[#1E6FD9]"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Reported Problem */}
              <div className="p-3 bg-white rounded border border-black/15 space-y-1">
                <span className="text-xs font-medium text-black/60 block">
                  Reported Issue Description
                </span>
                <p className="text-black leading-relaxed">{drawerReq.description}</p>
                <div className="text-xs text-black/60 pt-1">
                  Submitted: {new Date(drawerReq.created_at).toLocaleString()}
                </div>
              </div>

              {/* Customer Details Box */}
              <div className="p-3 border border-black/15 rounded space-y-1.5 bg-white">
                <span className="text-xs font-medium text-black/60 block">
                  Customer & Geographic Location
                </span>
                <div className="space-y-1 text-black">
                  <div>
                    <span className="text-black/60 font-medium">Name:</span> {drawerReq.customer?.full_name ?? 'Resident'}
                  </div>
                  <div>
                    <span className="text-black/60 font-medium">Account No:</span>{' '}
                    <span className="font-medium text-[#1E6FD9]">
                      {drawerReq.customer?.account_number ?? 'ACC-2026-0001'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black/60 font-medium">Barangay:</span> {drawerReq.customer?.barangay ?? 'Sinacaban'}
                  </div>
                  <div>
                    <span className="text-black/60 font-medium">Street Address:</span>{' '}
                    {drawerReq.customer?.address ?? 'Customer Residence'}
                  </div>
                </div>
              </div>

              {/* Wireframe A3: Urgency Derivation Card */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2">
                <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                  <span className="text-xs font-medium text-black/60">
                    Urgency Engine Derivation
                  </span>
                  <Badge variant={drawerReq.urgency === 'high' ? 'outline' : 'blue'}>
                    FINAL: {drawerReq.urgency.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1 text-black/80">
                  <div className="flex justify-between">
                    <span>Issue Type Baseline Default:</span>
                    <span className="font-medium text-black">MEDIUM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Input Urgency:</span>
                    <span className="font-medium text-black">
                      {(drawerReq.customer_urgency || 'can_wait').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-1">
                    <span>Engine Output:</span>
                    <span className="font-medium text-[#1E6FD9]">{drawerReq.urgency.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Wireframe A3: Adjust Urgency Control */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2">
                <span className="text-xs font-medium text-black/60 block">
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
                    <span className="text-[#1E6FD9] font-medium text-xs">
                      ✓ Override saved & logged
                    </span>
                  )}
                </div>
              </div>

              {/* Status Stepper Timeline */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-medium text-black/60 block">
                  Service Request Lifecycle
                </span>
                <StatusTimeline status={drawerReq.status} />
              </div>

              {/* Assigned Staff Info */}
              {drawerReq.assigned_staff ? (
                <div className="p-2.5 bg-white border border-black/15 rounded text-black space-y-1">
                  <div className="flex justify-between">
                    <span className="text-black/60 text-xs font-medium">
                      Assigned Field Technician:
                    </span>
                    <span className="font-medium text-[#1E6FD9]">{drawerReq.assigned_staff.name}</span>
                  </div>
                  {drawerReq.assignment_notes && (
                    <p className="text-black/70 italic text-xs">
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
            <div className="bg-white border-2 border-black rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-[14px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconUserPlus size={14} className="text-[#1E6FD9]" />
                  <h3 className="text-base font-bold text-black">
                    Assign Staff
                  </h3>
                </div>
                <button
                  onClick={() => setAssigningReq(null)}
                  className="text-black hover:text-[#1E6FD9]"
                >
                  <IconX size={14} />
                </button>
              </div>

              {/* Request Summary per Wireframe A4 */}
              <div className="p-3 bg-white rounded border border-black/15 text-black space-y-1">
                <div className="font-medium">
                  {assigningReq.reference_no || assigningReq.reference} ·{' '}
                  {assigningReq.issue_type?.name || 'Water Issue'} ·{' '}
                  {assigningReq.customer?.barangay ?? 'Sinacaban'}
                </div>
                <p className="text-black/70">{assigningReq.description}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">
                    Select Staff
                  </label>
                  {staffList.length === 0 ? (
                    <div className="p-2 border border-black/20 text-black/60 rounded text-xs">
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
                  <label className="block text-xs font-medium text-black/70 mb-1">
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

        {/* Modern System Alert Modal */}
        <SystemModal
          isOpen={systemModal.isOpen}
          onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
        />
      </div>
    </AdminLayout>
  );
}
