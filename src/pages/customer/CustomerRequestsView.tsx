import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import {
  MunicipalMap,
  getSinacabanBarangayCoords,
  isWithinSinacabanBounds,
} from '../../components/organisms/MunicipalMap';
import { requestsApi } from '../../api';
import type { ServiceRequest, IssueType, Urgency } from '../../types';
import {
  FIXED_ISSUE_TYPES,
  maintenanceStore,
  formatTimelineDateTime,
} from '../../services/maintenanceStore';
import { SINACABAN_BARANGAY_LIST } from '../../services/advisoriesStore';
import {
  IconCamera,
  IconCrosshair,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

export function CustomerRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>(() =>
    maintenanceStore.getRequests()
  );
  const [issueTypes] = useState<IssueType[]>(FIXED_ISSUE_TYPES);

  // Report an Issue Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState<number>(FIXED_ISSUE_TYPES[3].id);
  const [description, setDescription] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('Poblacion');
  const [pinCoords, setPinCoords] = useState<[number, number]>(() =>
    getSinacabanBarangayCoords('Poblacion')
  );
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [mapResetKey, setMapResetKey] = useState<number>(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Request Details Modal
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);

  // Cancel Confirmation Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await requestsApi.list({ per_page: 50 });
      if (res && Array.isArray(res.data)) {
        setRequests(res.data);
        maintenanceStore.saveRequests(res.data);
        return;
      }
    } catch {
      // offline fallback
    }
    setRequests(maintenanceStore.getRequests());
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Selected Issue Type object (automatically determines default urgency internally for Admin/Staff)
  const currentIssueType = useMemo(() => {
    return issueTypes.find((t) => t.id === issueTypeId) || FIXED_ISSUE_TYPES[0];
  }, [issueTypes, issueTypeId]);

  const handleSelectIssueType = (id: number) => {
    setIssueTypeId(id);
  };

  // Automatically adjust map center, zoom, and pin when Barangay changes
  const handleBarangayChange = (barangayName: string) => {
    setSelectedBarangay(barangayName);
    const coords = getSinacabanBarangayCoords(barangayName);
    setPinCoords(coords);
    setMapZoom(15);
    setMapResetKey((k) => k + 1);
  };

  // Automatically adjust map center, zoom, and pin when Current Location is added
  const handleUseCurrentLocation = () => {
    const fallbackCoords = getSinacabanBarangayCoords(selectedBarangay);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const target: [number, number] = isWithinSinacabanBounds(latitude, longitude)
            ? [latitude, longitude]
            : fallbackCoords;
          setPinCoords(target);
          setMapZoom(16);
          setMapResetKey((k) => k + 1);
        },
        () => {
          setPinCoords(fallbackCoords);
          setMapZoom(16);
          setMapResetKey((k) => k + 1);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setPinCoords(fallbackCoords);
      setMapZoom(16);
      setMapResetKey((k) => k + 1);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setCreateError('Please enter a description.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    // Urgency is assigned automatically from the selected Issue Type (not shown to customer)
    const autoUrgency: Urgency = currentIssueType.default_urgency;

    const customerChoiceMap: Record<Urgency, string> = {
      low: 'can_wait',
      medium: 'needs_attention_soon',
      high: 'urgent',
    };

    try {
      const apiReq = await requestsApi.create({
        issue_type_id: issueTypeId,
        customer_urgency: customerChoiceMap[autoUrgency],
        description: description.trim(),
        latitude: pinCoords[0],
        longitude: pinCoords[1],
      });
      await fetchRequests();
      setShowCreateModal(false);
      setDescription('');
      setPhotoPreview(null);
      setPhotoFileName(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      setToast(`Submitted ${apiReq?.reference_no || 'Request'} · Admin notified`);
    } catch {
      const created = maintenanceStore.createRequest({
        issueTypeId,
        customerUrgency: autoUrgency,
        description: description.trim(),
        latitude: pinCoords[0],
        longitude: pinCoords[1],
        barangay: selectedBarangay,
        photoPath: photoPreview || undefined,
      });

      setRequests(maintenanceStore.getRequests());
      setShowCreateModal(false);
      setDescription('');
      setPhotoPreview(null);
      setPhotoFileName(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      setToast(`Submitted ${created.reference} · Admin notified`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer can cancel only while Submitted or Assigned
  const handleConfirmCancel = async () => {
    if (!selectedReq) return;

    setIsCancelling(true);
    try {
      await requestsApi.cancel(selectedReq.id, cancelReason);
      await fetchRequests();
      const nextSelected = { ...selectedReq, status: 'cancelled' as const, cancelled_reason: cancelReason };
      setSelectedReq(nextSelected);
      setShowCancelModal(false);
      setCancelReason('');
      setToast(`Cancelled ${selectedReq.reference_no || selectedReq.reference || 'Request'} · Admin & staff notified`);
    } catch {
      const updated = maintenanceStore.cancelRequest(selectedReq.id, 'customer', cancelReason);
      setRequests(maintenanceStore.getRequests());
      setSelectedReq(updated);
      setShowCancelModal(false);
      setCancelReason('');
      setToast(`Cancelled ${updated.reference} · Admin & staff notified`);
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel = (status: string) => {
    return status === 'submitted' || status === 'assigned';
  };

  const isAnyModalOpen = Boolean(showCreateModal || selectedReq || showCancelModal);

  return (
    <CustomerLayout currentPath="/customer/requests" onNavigate={(path) => navigate(path)}>
      <div
        className={`space-y-4 transition-all duration-200 ${
          isAnyModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Header + Report an Issue Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              My Requests
            </h1>
            <div className="text-black/60 text-[14px]">
              Water service reports, pipeline repairs, and dispatch timeline
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<IconCrosshair size={15} />}
            onClick={() => {
              handleSelectIssueType(FIXED_ISSUE_TYPES[3].id);
              setShowCreateModal(true);
            }}
            className="shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] self-start sm:self-auto"
          >
            Report an Issue
          </Button>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="p-8 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            <EmptyState
              title="No Requests"
              description="No maintenance requests submitted yet."
              actionLabel="Report an Issue"
              onAction={() => setShowCreateModal(true)}
            />
          </Card>
        ) : (
          <div className="space-y-3.5">
            {requests.map((req) => {
              const refNo =
                req.reference_no ||
                req.reference ||
                `AT-2026-${req.id.toString().padStart(4, '0')}`;

              return (
                <Card
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-3.5 cursor-pointer hover:border-[#1E6FD9] hover:shadow-[3px_3px_0px_0px_#1E6FD9] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-black text-[14px]">{refNo}</span>
                      <span className="text-black/40">·</span>
                      <span className="font-bold text-[#1E6FD9] text-[14px]">
                        {req.issue_type?.name || 'Pipe leak or burst'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        req.status === 'resolved' || req.status === 'in_progress'
                          ? 'blue'
                          : 'outline'
                      }
                    >
                      {req.status === 'in_progress'
                        ? 'In progress'
                        : req.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-black/70 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-black">
                      Brgy. {req.customer?.barangay || 'Poblacion'}
                    </span>
                    <span className="text-black/30">•</span>
                    <span>Logged: {formatTimelineDateTime(req.created_at)}</span>
                    {req.assigned_staff && (
                      <>
                        <span className="text-black/30">•</span>
                        <span className="text-black/90 font-medium">
                          Technician: <strong>{req.assigned_staff.name}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  <StatusTimeline
                    status={req.status}
                    submittedAt={req.created_at}
                    assignedAt={req.assigned_at}
                    startedAt={req.started_at}
                    resolvedAt={req.resolved_at}
                    cancelledAt={req.cancelled_at}
                  />
                </Card>
              );
            })}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-black text-white px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_#1E6FD9] flex items-center gap-2.5 text-xs font-semibold">
            <IconCheck size={16} className="text-[#1E6FD9]" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
              <IconX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Report an Issue Modal (Urgency is hidden from customer and set automatically by issue type) */}
      {showCreateModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] my-auto text-[14px]"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#F0F6FD] text-[#1E6FD9] flex items-center justify-center">
                    <IconCrosshair size={16} />
                  </div>
                  <h2 className="text-[14px] font-bold text-black">Report a Water Service Issue</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                  <IconX size={18} />
                </button>
              </div>

              {createError && (
                <div className="p-2.5 bg-black/5 border border-black/20 text-black rounded-lg text-xs font-semibold">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateRequest} className="space-y-3.5">
                {/* 1. Fixed Issue Type List */}
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Issue Category *
                  </label>
                  <select
                    className="w-full p-2.5 bg-white text-black text-[14px] font-medium border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9]"
                    value={issueTypeId}
                    onChange={(e) => handleSelectIssueType(Number(e.target.value))}
                  >
                    {issueTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Description */}
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Problem Description *
                  </label>
                  <textarea
                    placeholder="Describe the problem (leaks, low pressure, broken pipe, etc.)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-white text-black text-[14px] font-normal border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9] resize-none"
                    required
                  />
                </div>

                {/* 3. Location: Barangay + Map Pin or Current Location */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-black/70 uppercase tracking-wider">
                      Incident Location (Pin on Map)
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[#1E6FD9] text-xs font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <IconCrosshair size={13} />
                      <span>Use Current Location</span>
                    </button>
                  </div>

                  <select
                    value={selectedBarangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    className="w-full p-2.5 bg-white text-black text-[14px] font-medium border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9]"
                  >
                    {SINACABAN_BARANGAY_LIST.map((b) => (
                      <option key={b.id} value={b.name}>
                        Barangay {b.name}
                      </option>
                    ))}
                  </select>

                  <div className="h-40 w-full rounded-lg border border-black/15 overflow-hidden shadow-inner">
                    <MunicipalMap
                      center={pinCoords}
                      zoom={mapZoom}
                      selectedCoords={pinCoords}
                      interactivePicker={true}
                      viewResetKey={mapResetKey}
                      onSelectCoords={(lat, lng) => setPinCoords([lat, lng])}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* 4. Optional Photo */}
                <div className="space-y-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="p-2.5 border border-black/20 rounded-lg bg-[#F0F6FD]/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={photoPreview}
                          alt="Uploaded preview"
                          className="w-12 h-12 rounded-lg object-cover border border-black/15 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-black text-xs truncate">
                            {photoFileName || 'Attached photo'}
                          </div>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="text-[11px] text-[#1E6FD9] font-semibold hover:underline cursor-pointer"
                          >
                            Change photo
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 text-black/50 hover:text-black rounded hover:bg-black/5 cursor-pointer shrink-0"
                        aria-label="Remove photo"
                      >
                        <IconX size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-2.5 px-3 border border-black/20 hover:bg-[#F0F6FD] hover:text-[#1E6FD9] text-black rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                    >
                      <IconCamera size={16} />
                      <span>Upload Issue Photo (Optional)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}

      {/* Request Details & Status Timeline Modal */}
      {selectedReq &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelectedReq(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] my-auto text-[14px]"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#F0F6FD] text-[#1E6FD9] flex items-center justify-center">
                    <IconCrosshair size={16} />
                  </div>
                  <span className="text-[14px] font-extrabold text-black">
                    {selectedReq.reference_no || selectedReq.reference}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1 text-black/50 hover:text-black rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Status Timeline with Date & Time */}
              <div className="py-1">
                <StatusTimeline
                  status={selectedReq.status}
                  submittedAt={selectedReq.created_at}
                  assignedAt={selectedReq.assigned_at}
                  startedAt={selectedReq.started_at}
                  resolvedAt={selectedReq.resolved_at}
                  cancelledAt={selectedReq.cancelled_at}
                />
              </div>

              {/* Request Record Details */}
              <div className="p-3.5 border border-black/10 rounded-xl bg-[#F0F6FD]/50 space-y-2.5 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase text-black/50 block">
                    Issue Type & Barangay
                  </span>
                  <span className="font-bold text-black text-[13px]">
                    {selectedReq.issue_type?.name || 'Pipe leak or burst'} · Brgy.{' '}
                    {selectedReq.customer?.barangay || 'Poblacion'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-black/50 block">
                    Description
                  </span>
                  <span className="text-black text-[13px]">{selectedReq.description}</span>
                </div>
                {selectedReq.photo_path && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold uppercase text-black/50 block mb-1">
                      Submitted Photo
                    </span>
                    <img
                      src={
                        selectedReq.photo_path.startsWith('http') ||
                        selectedReq.photo_path.startsWith('/') ||
                        selectedReq.photo_path.startsWith('data:')
                          ? selectedReq.photo_path
                          : `/storage/${selectedReq.photo_path}`
                      }
                      alt="Submitted issue"
                      className="w-full h-40 object-cover rounded-lg border border-black/15 shadow-sm"
                    />
                  </div>
                )}
                {selectedReq.assigned_staff && (
                  <div>
                    <span className="text-[11px] font-bold uppercase text-black/50 block">
                      Assigned Staff
                    </span>
                    <span className="font-semibold text-black text-[13px]">
                      {selectedReq.assigned_staff.name}
                    </span>
                  </div>
                )}
                {selectedReq.resolution_remarks && (
                  <div className="pt-1.5 border-t border-black/10">
                    <span className="text-[11px] font-bold uppercase text-[#1E6FD9] block">
                      Resolution Remarks
                    </span>
                    <span className="text-black text-[13px]">{selectedReq.resolution_remarks}</span>
                  </div>
                )}
              </div>

              {/* Customer can cancel ONLY while Submitted or Assigned */}
              <div className="flex items-center justify-between pt-3 border-t border-black/10">
                {canCancel(selectedReq.status) ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-black/20 text-black hover:bg-black/5 font-semibold text-xs cursor-pointer"
                  >
                    Cancel Request
                  </button>
                ) : (
                  <span className="text-[11px] text-black/50 font-medium">
                    {selectedReq.status === 'in_progress'
                      ? 'In progress — dispatch active'
                      : selectedReq.status === 'resolved'
                      ? 'Resolved'
                      : ''}
                  </span>
                )}

                <Button variant="secondary" onClick={() => setSelectedReq(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal &&
        selectedReq &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-xl border border-black/15 p-5 space-y-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-[14px]"
            >
              <h3 className="font-bold text-[14px] text-black">
                Cancel {selectedReq.reference_no || selectedReq.reference}?
              </h3>

              <div className="text-xs text-black/70">
                Are you sure you want to cancel this maintenance request? The field team will be notified immediately.
              </div>

              <div>
                <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                  Cancellation Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issue resolved on its own..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white text-black border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Request
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleConfirmCancel}
                  isLoading={isCancelling}
                >
                  Confirm Cancel
                </Button>
              </div>
            </Card>
          </div>,
          document.body
        )}
    </CustomerLayout>
  );
}
