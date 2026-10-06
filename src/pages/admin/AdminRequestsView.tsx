import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi, adminApi } from '../../api';
import type { ServiceRequest, User } from '../../types';
import { IconUserPlus, IconEye, IconX, IconCheck } from '@tabler/icons-react';

export function AdminRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Assign Modal
  const [assigningReq, setAssigningReq] = useState<ServiceRequest | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Inspect Modal
  const [inspectingReq, setInspectingReq] = useState<ServiceRequest | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await requestsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        per_page: 50,
      });
      setRequests(res.data);
    } catch {
      // Empty fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

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
      fetchRequests();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      alert(errObj?.response?.data?.message || 'Failed to dispatch staff.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  return (
    <AdminLayout
      title="Service Requests"
      subtitle="Dispatch & Tracking"
      currentPath="/admin/requests"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <h1 className="text-[10px] font-bold uppercase tracking-wider text-black">
            Municipal Service Requests Manager
          </h1>
          <p className="text-[10px] text-black/60">
            Dispatch technicians, monitor repair statuses, and audit customer reported issues
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1">
          {['all', 'submitted', 'assigned', 'in_progress', 'resolved', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium text-[10px] transition-colors ${
                statusFilter === st
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'bg-white text-black border border-black/15 hover:bg-[#F0F6FD]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <Card className="overflow-hidden border border-black/20">
        {isLoading ? (
          <div className="p-8 text-center text-black/60">Loading service requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Requests Matching Filter"
              description={`There are currently no service requests with status "${statusFilter}".`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] border-b border-black/10 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 font-bold text-black">Ref #</th>
                  <th className="px-4 py-2.5 font-bold text-black">Customer</th>
                  <th className="px-4 py-2.5 font-bold text-black">Issue Category</th>
                  <th className="px-4 py-2.5 font-bold text-black">Barangay</th>
                  <th className="px-4 py-2.5 font-bold text-black">Urgency</th>
                  <th className="px-4 py-2.5 font-bold text-black">Status</th>
                  <th className="px-4 py-2.5 font-bold text-black">Assigned Tech</th>
                  <th className="px-4 py-2.5 font-bold text-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F0F6FD]/50 transition-colors">
                    <td className="px-4 py-2 font-bold text-[#1E6FD9]">{r.reference}</td>
                    <td className="px-4 py-2 text-black font-medium">
                      {r.customer?.full_name ?? 'Resident'}
                    </td>
                    <td className="px-4 py-2 text-black max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-2 text-black">{r.customer?.barangay ?? 'Sinacaban'}</td>
                    <td className="px-4 py-2">
                      <Badge variant={r.urgency === 'high' ? 'black' : 'blue'}>
                        {r.urgency.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={r.status === 'in_progress' ? 'blue' : 'outline'}>
                        {r.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-black">
                      {r.assigned_staff ? (
                        <span className="font-medium text-black">{r.assigned_staff.name}</span>
                      ) : (
                        <span className="text-black/40 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-[9px]"
                          onClick={() => setInspectingReq(r)}
                        >
                          <IconEye size={12} className="mr-0.5" />
                          View
                        </Button>

                        {(r.status === 'submitted' || r.status === 'assigned') && (
                          <Button
                            variant="primary"
                            className="px-2 py-1 text-[9px]"
                            onClick={() => handleOpenAssignModal(r)}
                          >
                            <IconUserPlus size={12} className="mr-0.5" />
                            {r.status === 'assigned' ? 'Reassign' : 'Assign'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Technician Modal */}
      {assigningReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Dispatch Field Technician
                </h3>
                <p className="text-[10px] text-black/60">
                  Request {assigningReq.reference} · {assigningReq.customer?.barangay ?? 'Sinacaban'}
                </p>
              </div>
              <button onClick={() => setAssigningReq(null)} className="text-black hover:opacity-70 p-1">
                <IconX size={16} />
              </button>
            </div>

            {staffList.length === 0 ? (
              <div className="p-4 bg-white border border-black/20 rounded-lg text-black/70 text-[10px]">
                No active staff technicians found in database.
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block font-bold text-black text-[10px]">
                  Select Available Technician:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {staffList.map((s) => {
                    const isSelected = selectedStaffId === s.id;
                    const name = s.staff_profile ? `${s.staff_profile.first_name} ${s.staff_profile.last_name}` : s.email;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStaffId(s.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#1E6FD9] text-white border-black font-bold'
                            : 'bg-white text-black border-black/10 hover:bg-[#F0F6FD]'
                        }`}
                      >
                        <div>
                          <span>{name}</span>
                          <span className={`block text-[9px] ${isSelected ? 'text-white/80' : 'text-black/60'}`}>
                            {s.mobile_number} · Sector: {s.staff_profile?.assigned_barangay?.name ?? 'General'}
                          </span>
                        </div>
                        {isSelected && <IconCheck size={14} />}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-black text-[10px]">Dispatch Notes (Optional):</label>
                  <textarea
                    className="w-full p-2 text-[10px] text-black bg-white border border-black/20 rounded-lg outline-none"
                    rows={2}
                    placeholder="e.g. Prioritize valve check before noon..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
              <Button variant="ghost" onClick={() => setAssigningReq(null)} disabled={isSubmittingAssign}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAssign}
                disabled={!selectedStaffId || isSubmittingAssign || staffList.length === 0}
              >
                {isSubmittingAssign ? 'Dispatching...' : 'Confirm Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Request Modal */}
      {inspectingReq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Request Details · {inspectingReq.reference}
                </h3>
                <span className="text-[10px] text-black/60">
                  Submitted: {new Date(inspectingReq.created_at).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setInspectingReq(null)} className="text-black hover:opacity-70 p-1">
                <IconX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-[10px]">
              <div className="p-3 bg-[#F0F6FD] rounded-lg border border-black/10 space-y-1">
                <span className="font-bold text-black block">Reported Description:</span>
                <p className="text-black/80">{inspectingReq.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 border border-black/10 rounded-lg space-y-0.5">
                  <span className="font-bold text-black/60 block">Customer Name:</span>
                  <span className="font-bold text-black">{inspectingReq.customer?.full_name ?? 'Resident'}</span>
                  <span className="text-black/70 block">Acct: {inspectingReq.customer?.account_number ?? 'Pending'}</span>
                </div>
                <div className="p-2.5 border border-black/10 rounded-lg space-y-0.5">
                  <span className="font-bold text-black/60 block">Location:</span>
                  <span className="font-bold text-black">{inspectingReq.customer?.barangay ?? 'Sinacaban'}</span>
                  <span className="text-black/70 block">{inspectingReq.customer?.address}</span>
                </div>
              </div>

              <div className="p-2.5 border border-black/10 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black">Priority Engine Derivation:</span>
                  <Badge variant={inspectingReq.urgency === 'high' ? 'black' : 'blue'}>
                    FINAL: {inspectingReq.urgency.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-black/70 block">
                  Customer input: <strong>{inspectingReq.customer_urgency.toUpperCase()}</strong> · Issue default: <strong>MEDIUM</strong>
                </span>
              </div>

              {inspectingReq.resolution_remarks && (
                <div className="p-3 bg-white border border-black rounded-lg space-y-1">
                  <span className="font-bold text-black block">Technician Resolution Remarks:</span>
                  <p className="text-black/80">{inspectingReq.resolution_remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-black/10">
              <Button variant="primary" onClick={() => setInspectingReq(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
