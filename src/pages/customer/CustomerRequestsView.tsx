import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi, referenceApi } from '../../api';
import type { ServiceRequest, IssueType } from '../../types';
import { IconPlus } from '@tabler/icons-react';

export function CustomerRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState<number>(1);
  const [customerUrgency, setCustomerUrgency] = useState<string>('can_wait');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cancel Request Modal
  const [cancellingReq, setCancellingReq] = useState<ServiceRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Inspect Request Modal
  const [inspectingReq, setInspectingReq] = useState<ServiceRequest | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, typeRes] = await Promise.all([
        requestsApi.list({ per_page: 50 }),
        referenceApi.getIssueTypes().catch(() => []),
      ]);
      setRequests(reqRes.data);
      setIssueTypes(typeRes);
      if (typeRes.length > 0) {
        setIssueTypeId(typeRes[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setCreateError('Please describe the water problem.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      await requestsApi.create({
        issue_type_id: issueTypeId,
        customer_urgency: customerUrgency,
        description: description.trim(),
      });
      setShowCreateModal(false);
      setDescription('');
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setCreateError(apiErr.response?.data?.message || 'Could not submit service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingReq) return;

    setIsCancelling(true);
    try {
      await requestsApi.cancel(cancellingReq.id, cancelReason);
      setCancellingReq(null);
      setCancelReason('');
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      alert(apiErr.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel = (status: string) => {
    return status === 'submitted' || status === 'assigned';
  };

  return (
    <CustomerLayout currentPath="/customer/requests" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
            Water Service Requests & Maintenance
          </h1>
          <p className="text-[10px] text-black/60">
            Submit repair requests, report pipeline leaks, and monitor municipal technician dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <IconPlus size={12} className="inline mr-1" />
            Report New Issue
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-[#1E6FD9] border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Total Requests</div>
          <div className="text-[10px] font-bold text-black mt-1">{requests.length}</div>
          <div className="text-[10px] text-black/50 mt-0.5">Logged service history</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Active / In Progress</div>
          <div className="text-[10px] font-bold text-[#1E6FD9] mt-1">
            {requests.filter((r) => ['submitted', 'assigned', 'in_progress'].includes(r.status)).length}
          </div>
          <div className="text-[10px] text-black/50 mt-0.5">Under technician review</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Resolved Requests</div>
          <div className="text-[10px] font-bold text-black mt-1">
            {requests.filter((r) => r.status === 'resolved').length}
          </div>
          <div className="text-[10px] text-black/50 mt-0.5">Completed by municipal staff</div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="p-0 overflow-hidden border border-black/15">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
              <tr>
                <th className="px-4 py-2.5 font-bold uppercase">Reference</th>
                <th className="px-4 py-2.5 font-bold uppercase">Issue Type</th>
                <th className="px-4 py-2.5 font-bold uppercase">Description</th>
                <th className="px-4 py-2.5 font-bold uppercase">Urgency</th>
                <th className="px-4 py-2.5 font-bold uppercase">Status</th>
                <th className="px-4 py-2.5 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                    Loading service requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                    <EmptyState
                      title="No Service Requests"
                      description="You do not have any open or past service requests logged for your account."
                      actionLabel="Report an Issue"
                      onAction={() => setShowCreateModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F0F6FD]/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1E6FD9]">
                      {req.reference_no || req.reference}
                    </td>
                    <td className="px-4 py-3 font-bold text-black">
                      {req.issue_type?.name || 'General Leak'}
                    </td>
                    <td className="px-4 py-3 text-black max-w-xs truncate">
                      {req.description}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={req.urgency === 'high' ? 'blue' : 'black'}>
                        {req.urgency ? req.urgency.toUpperCase() : 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          req.status === 'resolved'
                            ? 'blue'
                            : req.status === 'cancelled'
                            ? 'black'
                            : 'blue'
                        }
                      >
                        {req.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <Button
                        variant="secondary"
                        onClick={() => setInspectingReq(req)}
                      >
                        Details
                      </Button>
                      {canCancel(req.status) && (
                        <Button
                          variant="secondary"
                          onClick={() => setCancellingReq(req)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <div className="flex items-center gap-2">
                <IconPlus size={14} className="text-[#1E6FD9]" />
                <span className="font-bold text-black uppercase tracking-wider">
                  Report Water Service Issue
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-black hover:text-[#1E6FD9] p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-2 bg-[#F0F6FD] border border-black text-black rounded text-[10px]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-black uppercase mb-1">
                  Issue Classification
                </label>
                <select
                  className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={issueTypeId}
                  onChange={(e) => setIssueTypeId(Number(e.target.value))}
                >
                  {issueTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Base Urgency: {t.default_urgency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-black uppercase mb-1">
                  How urgent is this for your home?
                </label>
                <select
                  className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={customerUrgency}
                  onChange={(e) => setCustomerUrgency(e.target.value)}
                >
                  <option value="can_wait">Can wait (Low)</option>
                  <option value="needs_attention_soon">Needs attention soon (Medium)</option>
                  <option value="urgent">Urgent, affecting household now (High)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-black uppercase mb-1">
                  Description of Issue
                </label>
                <textarea
                  className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] h-20"
                  placeholder="e.g. Major pipe leaking beside water meter, low pressure since morning..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {cancellingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <span className="font-bold text-black uppercase tracking-wider">
                Cancel Request {cancellingReq.reference_no || cancellingReq.reference}
              </span>
              <button
                onClick={() => setCancellingReq(null)}
                className="text-black hover:text-[#1E6FD9] p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-black/70">
              Are you sure you want to cancel this service request? This action cannot be undone once confirmed.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-black uppercase mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                type="text"
                className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                placeholder="e.g. Problem resolved itself, entered by mistake..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
              <Button
                variant="secondary"
                onClick={() => setCancellingReq(null)}
              >
                Keep Request
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Request Modal */}
      {inspectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <span className="font-bold text-black uppercase tracking-wider">
                Request Details ({inspectingReq.reference_no || inspectingReq.reference})
              </span>
              <button
                onClick={() => setInspectingReq(null)}
                className="text-black hover:text-[#1E6FD9] p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-[#F0F6FD] p-3 rounded border border-black/10 text-[10px]">
              <div>
                <span className="text-black/60 block uppercase font-bold">Issue Type</span>
                <span className="font-bold text-black">{inspectingReq.issue_type?.name}</span>
              </div>
              <div>
                <span className="text-black/60 block uppercase font-bold">Status</span>
                <Badge variant={inspectingReq.status === 'resolved' ? 'blue' : 'black'}>
                  {inspectingReq.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-black/60 block uppercase font-bold">Calculated Urgency</span>
                <Badge variant="blue">
                  {inspectingReq.urgency?.toUpperCase() || 'MEDIUM'}
                </Badge>
              </div>
              <div>
                <span className="text-black/60 block uppercase font-bold">Full Description</span>
                <p className="text-black bg-white p-2 rounded border border-black/15 mt-1">
                  {inspectingReq.description}
                </p>
              </div>
              {inspectingReq.resolution_remarks && (
                <div className="border-t border-black/10 pt-2">
                  <span className="text-black/60 block uppercase font-bold">
                    Technician Resolution Remarks
                  </span>
                  <p className="text-black bg-white p-2 rounded border border-black/15 mt-1 font-medium">
                    {inspectingReq.resolution_remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-black/15">
              <Button
                variant="primary"
                onClick={() => setInspectingReq(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </CustomerLayout>
  );
}
