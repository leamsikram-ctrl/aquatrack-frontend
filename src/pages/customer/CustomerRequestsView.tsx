import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi, referenceApi } from '../../api';
import type { ServiceRequest, IssueType } from '../../types';
import {
  IconCamera,
  IconCrosshair,
  IconCheck,
  IconClock,
  IconTool,
  IconCircleCheck,
} from '@tabler/icons-react';

export function CustomerRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report issue Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState<number>(1);
  const [customerUrgency, setCustomerUrgency] = useState<string>('needs_attention_soon');
  const [description, setDescription] = useState('');
  const [hasLocationPin, setHasLocationPin] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Request details Modal
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);

  // Cancel Confirmation Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

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
      setCreateError('Please describe the problem.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      await requestsApi.create({
        issue_type_id: issueTypeId,
        customer_urgency: customerUrgency,
        description: description.trim(),
        latitude: 8.2981,
        longitude: 123.8374,
      });
      setShowCreateModal(false);
      setDescription('');
      setPhotoAdded(false);
      setHasLocationPin(false);
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setCreateError(apiErr.response?.data?.message || 'Could not submit service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedReq) return;

    setIsCancelling(true);
    try {
      await requestsApi.cancel(selectedReq.id, cancelReason);
      setShowCancelModal(false);
      setSelectedReq(null);
      setCancelReason('');
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      alert(apiErr.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getProgressStepIndex = (status: string) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'assigned':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const canCancel = (status: string) => {
    return status === 'submitted' || status === 'assigned';
  };

  return (
    <CustomerLayout currentPath="/customer/requests" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            My requests
          </h1>
        </div>

        {/* Button: Report an issue */}
        <Button
          variant="primary"
          className="w-full justify-center py-2.5 text-[14px]"
          onClick={() => setShowCreateModal(true)}
        >
          Report an issue
        </Button>

        {/* Requests List */}
        {isLoading ? (
          <Card className="p-4 border border-black/15 text-center text-black/60 text-[14px] font-normal">
            Loading service requests...
          </Card>
        ) : requests.length === 0 ? (
          <Card className="p-4 border border-black/15">
            <EmptyState
              title="No Requests Logged"
              description="You do not have any open or previous service requests."
              actionLabel="Report an issue"
              onAction={() => setShowCreateModal(true)}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const stepIdx = getProgressStepIndex(req.status);
              const refNo = req.reference_no || req.reference || `AT-2026-${req.id.toString().padStart(4, '0')}`;
              const formattedDate = req.created_at
                ? new Date(req.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Oct 7, 2026';

              return (
                <Card
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className="p-4 border border-black/15 bg-white space-y-2.5 cursor-pointer hover:border-[#1E6FD9] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-[14px]">
                      {refNo}
                    </span>
                    <Badge
                      variant={
                        req.status === 'resolved'
                          ? 'blue'
                          : req.status === 'cancelled'
                          ? 'black'
                          : req.status === 'in_progress'
                          ? 'blue'
                          : 'black'
                      }
                    >
                      {req.status === 'in_progress'
                        ? 'IN PROGRESS'
                        : req.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-[14px] text-black/60 font-normal">
                    {req.issue_type?.name || 'Water Service'} · {formattedDate}
                  </div>

                  {req.status !== 'cancelled' ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-2 rounded-full ${
                              step <= stepIdx ? 'bg-[#1E6FD9]' : 'bg-black/15'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-4 text-center text-[14px] font-bold text-black/70">
                        <span className={stepIdx >= 0 ? 'text-[#1E6FD9]' : ''}>
                          Submitted
                        </span>
                        <span className={stepIdx >= 1 ? 'text-[#1E6FD9]' : ''}>
                          Assigned
                        </span>
                        <span className={stepIdx >= 2 ? 'text-[#1E6FD9]' : ''}>
                          In progress
                        </span>
                        <span className={stepIdx >= 3 ? 'text-[#1E6FD9]' : ''}>
                          Resolved
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[14px] text-black/50 font-normal italic">
                      Request was cancelled.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Report an issue Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-lg border border-black p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-[14px] text-black uppercase tracking-wider">
                  Report an issue
                </span>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[14px]"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-2 bg-[#F0F6FD] border border-black text-black rounded text-[14px] font-normal">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateRequest} className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                    Issue type
                  </label>
                  <select
                    className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={issueTypeId}
                    onChange={(e) => setIssueTypeId(Number(e.target.value))}
                  >
                    {issueTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black/70 uppercase mb-1.5">
                    Urgency level
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { value: 'can_wait', label: 'Can wait' },
                      { value: 'needs_attention_soon', label: 'Needs attention soon' },
                      { value: 'urgent', label: 'Urgent, affecting household now' },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="customerUrgency"
                          value={opt.value}
                          checked={customerUrgency === opt.value}
                          onChange={(e) => setCustomerUrgency(e.target.value)}
                          className="accent-[#1E6FD9]"
                        />
                        <span className="text-[14px] text-black font-normal">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the problem..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-bold text-black/70 uppercase">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasLocationPin(true)}
                    className="w-full py-2 px-2 border border-black rounded text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#F0F6FD]"
                  >
                    <IconCrosshair size={14} className="text-[#1E6FD9]" />
                    {hasLocationPin ? 'GPS pin recorded' : 'Use my location'}
                  </button>
                  <div className="h-14 border border-dashed border-black/40 rounded flex items-center justify-center text-black/50 text-[14px] font-normal bg-[#F0F6FD]">
                    {hasLocationPin
                      ? '📍 Lat 8.2981, Lng 123.8374 (Poblacion)'
                      : 'Map pin will use your device location'}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setPhotoAdded(!photoAdded)}
                    className={`w-full py-2 px-2 border border-black rounded text-[14px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      photoAdded ? 'bg-[#1E6FD9] text-white' : 'hover:bg-[#F0F6FD] text-black'
                    }`}
                  >
                    <IconCamera size={14} />
                    {photoAdded ? '📷 Evidence Photo Attached' : 'Add photo'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="justify-center"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    className="justify-center"
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Request details Modal */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-lg border border-black p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <button
                  onClick={() => setSelectedReq(null)}
                  className="font-bold text-[14px] text-black hover:text-[#1E6FD9] flex items-center gap-1"
                >
                  ←{' '}
                  <span className="font-bold">
                    {selectedReq.reference_no || selectedReq.reference || `AT-2026-${selectedReq.id}`}
                  </span>
                </button>
                <Badge
                  variant={
                    selectedReq.status === 'resolved'
                      ? 'blue'
                      : selectedReq.status === 'cancelled'
                      ? 'black'
                      : 'blue'
                  }
                >
                  {selectedReq.status === 'in_progress'
                    ? 'In progress'
                    : selectedReq.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* 4-stage Vertical Timeline */}
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    <IconCircleCheck size={16} className="text-[#1E6FD9]" />
                    <span className="font-bold text-black">Submitted</span>
                  </div>
                  <span className="text-black/50 font-normal">
                    {selectedReq.created_at
                      ? new Date(selectedReq.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Date'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    {['assigned', 'in_progress', 'resolved'].includes(selectedReq.status) ? (
                      <IconCircleCheck size={16} className="text-[#1E6FD9]" />
                    ) : (
                      <IconClock size={16} className="text-black/30" />
                    )}
                    <span
                      className={`font-bold ${
                        ['assigned', 'in_progress', 'resolved'].includes(selectedReq.status)
                          ? 'text-black'
                          : 'text-black/40'
                      }`}
                    >
                      Assigned
                    </span>
                  </div>
                  <span className="text-black/50 font-normal">
                    {['assigned', 'in_progress', 'resolved'].includes(selectedReq.status)
                      ? selectedReq.updated_at
                        ? new Date(selectedReq.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Date'
                      : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    {selectedReq.status === 'in_progress' ? (
                      <IconTool size={16} className="text-[#1E6FD9]" />
                    ) : selectedReq.status === 'resolved' ? (
                      <IconCircleCheck size={16} className="text-[#1E6FD9]" />
                    ) : (
                      <IconClock size={16} className="text-black/30" />
                    )}
                    <span
                      className={`font-bold ${
                        ['in_progress', 'resolved'].includes(selectedReq.status)
                          ? 'text-black'
                          : 'text-black/40'
                      }`}
                    >
                      In progress
                    </span>
                  </div>
                  <span className="text-black/50 font-normal">
                    {selectedReq.status === 'in_progress' || selectedReq.status === 'resolved'
                      ? 'Active'
                      : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    {selectedReq.status === 'resolved' ? (
                      <IconCheck size={16} className="text-[#1E6FD9]" />
                    ) : (
                      <IconClock size={16} className="text-black/30" />
                    )}
                    <span
                      className={`font-bold ${
                        selectedReq.status === 'resolved' ? 'text-black' : 'text-black/40'
                      }`}
                    >
                      Resolved
                    </span>
                  </div>
                  <span className="text-black/50 font-normal">
                    {selectedReq.status === 'resolved' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Details Card */}
              <Card className="p-3.5 border border-black/15 bg-[#F0F6FD] space-y-1">
                <div className="text-[14px] uppercase tracking-wider font-bold text-black/50">
                  Details
                </div>
                <div className="text-[14px] font-bold text-black">
                  {selectedReq.issue_type?.name || 'Water Service'} · Barangay Poblacion
                </div>
                <div className="text-[14px] text-black/70 font-normal">
                  {selectedReq.description}
                </div>
              </Card>

              {/* Action Buttons */}
              {canCancel(selectedReq.status) ? (
                <div className="pt-2">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2 border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] rounded font-bold text-[14px] transition-colors"
                  >
                    Cancel request
                  </button>
                </div>
              ) : selectedReq.status === 'in_progress' ? (
                <div className="p-2.5 border border-black/20 rounded bg-white text-[14px] font-normal text-black/80 text-center">
                  This repair has already started. Contact SIWASS if anything has changed.
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => setSelectedReq(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs bg-white rounded-lg border border-black p-5 space-y-3.5 shadow-2xl">
              <div className="text-left space-y-1">
                <h3 className="font-bold text-[14px] text-black">
                  Cancel {selectedReq.reference_no || selectedReq.reference || `AT-2026-${selectedReq.id}`}?
                </h3>
                <p className="text-[14px] text-black/70 font-normal leading-relaxed">
                  The assigned technician will be notified and the request will be closed.
                </p>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  placeholder="Tell us why..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15">
                <Button
                  variant="secondary"
                  onClick={() => setShowCancelModal(false)}
                  className="justify-center"
                >
                  Keep request
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmCancel}
                  isLoading={isCancelling}
                  className="justify-center"
                >
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
