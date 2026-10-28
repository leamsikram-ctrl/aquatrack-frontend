import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { UrgencyDerivation, deriveUrgency } from '../../components/molecules/UrgencyDerivation';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import { getSinacabanBarangayCoords } from '../../components/organisms/MunicipalMap';
import { requestsApi } from '../../api';
import type { ServiceRequest, IssueType, Urgency } from '../../types';
import {
  FIXED_ISSUE_TYPES,
  maintenanceStore,
  formatTimelineDateTime,
} from '../../services/maintenanceStore';
import { SINACABAN_BARANGAY_LIST } from '../../services/advisoriesStore';
import {
  EmptyRequestsIllustration,
  NoMatchesIllustration,
} from '../../components/illustrations';
import { validatePhotoFile, resizeImage } from '../../utils/imageResize';
import {
  IconCamera,
  IconCrosshair,
  IconCheck,
  IconX,
  IconSearch,
  IconDropletOff,
  IconTool,
  IconDropletFilled,
  IconGauge,
  IconDashboard,
  IconHelpCircle,
  IconAlertCircle,
} from '@tabler/icons-react';

const ISSUE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'No water supply': <IconDropletOff size={22} className="shrink-0" />,
  'Pipe leak or burst': <IconTool size={22} className="shrink-0" />,
  'Water quality problem': <IconDropletFilled size={22} className="shrink-0" />,
  'Low water pressure': <IconGauge size={22} className="shrink-0" />,
  'Meter problem': <IconDashboard size={22} className="shrink-0" />,
  'Other concern': <IconHelpCircle size={22} className="shrink-0" />,
};

export function CustomerRequestsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>(() =>
    maintenanceStore.getRequests()
  );
  const [issueTypes] = useState<IssueType[]>(FIXED_ISSUE_TYPES);

  // Report an Issue Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState<number>(FIXED_ISSUE_TYPES[3].id);
  const [customerUrgency, setCustomerUrgency] = useState<Urgency>(
    FIXED_ISSUE_TYPES[3].default_urgency
  );
  const [description, setDescription] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('Poblacion');
  const [pinCoords, setPinCoords] = useState<[number, number]>(() =>
    getSinacabanBarangayCoords('Poblacion')
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Request Details Modal
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);

  // Filters for requests
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter === 'active' && (req.status === 'resolved' || req.status === 'cancelled')) return false;
      if (statusFilter === 'resolved' && req.status !== 'resolved') return false;
      if (statusFilter === 'cancelled' && req.status !== 'cancelled') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (req.reference_no || req.reference || '').toLowerCase();
        const issue = (req.issue_type?.name || '').toLowerCase();
        const desc = (req.description || '').toLowerCase();
        if (!ref.includes(q) && !issue.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

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

  // Selected Issue Type object
  const currentIssueType = useMemo(() => {
    return issueTypes.find((t) => t.id === issueTypeId) || FIXED_ISSUE_TYPES[0];
  }, [issueTypes, issueTypeId]);

  const handleOpenCreateModal = (typeId?: number) => {
    const id = typeId ?? FIXED_ISSUE_TYPES[3].id;
    const found = FIXED_ISSUE_TYPES.find((t) => t.id === id) || FIXED_ISSUE_TYPES[0];
    setIssueTypeId(id);
    setCustomerUrgency(found.default_urgency);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleSelectIssueType = (id: number) => {
    const found = FIXED_ISSUE_TYPES.find((t) => t.id === id) || FIXED_ISSUE_TYPES[0];
    setIssueTypeId(id);
    setCustomerUrgency(found.default_urgency);
  };

  const handleBarangayChange = (barangayName: string) => {
    setSelectedBarangay(barangayName);
    const coords = getSinacabanBarangayCoords(barangayName);
    setPinCoords(coords);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setCreateError(validation.error || 'Invalid photo file.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    setCreateError(null);
    setPhotoFileName(file.name);
    try {
      const resized = await resizeImage(file);
      setPhotoPreview(resized);
    } catch {
      setCreateError('Could not process photo. Please try another image.');
    }
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

    // Urgency derivation: customer can raise by at most 1 level and never lower
    const finalUrgency = deriveUrgency(currentIssueType.default_urgency, customerUrgency);

    const customerChoiceMap: Record<Urgency, string> = {
      low: 'can_wait',
      medium: 'needs_attention_soon',
      high: 'urgent',
    };

    try {
      const apiReq = await requestsApi.create({
        issue_type_id: issueTypeId,
        customer_urgency: customerChoiceMap[customerUrgency],
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
        customerUrgency: finalUrgency,
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
      const nextSelected = { ...selectedReq, status: 'cancelled' as const, cancellation_reason: cancelReason };
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
            onClick={() => handleOpenCreateModal()}
            className="shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] self-start sm:self-auto"
          >
            Report an Issue
          </Button>
        </div>

        {/* Filter bar when requests exist */}
        {requests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-black/10 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            <div className="relative flex-1">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, issue, description..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-black/10 rounded-lg outline-none focus:border-brand-blue"
              />
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs font-semibold text-black/60 mr-1">Status:</span>
              {(['all', 'active', 'resolved', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors capitalize ${
                    statusFilter === st
                      ? 'bg-brand-blue text-white shadow-xs'
                      : 'bg-slate-100 text-black/70 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="p-8 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            <EmptyState
              illustration={<EmptyRequestsIllustration />}
              title="No requests yet"
              description="No maintenance requests submitted yet."
              actionLabel="Report an issue"
              onAction={() => handleOpenCreateModal()}
            />
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-8 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            <EmptyState
              illustration={<NoMatchesIllustration />}
              title="No matches"
              description="No requests match the selected filters."
              actionLabel="Clear filters"
              onAction={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
            />
          </Card>
        ) : (
          <div className="space-y-3.5">
            {filteredRequests.map((req) => {
              const refNo =
                req.reference_no ||
                req.reference ||
                `AT-2026-${req.id.toString().padStart(4, '0')}`;

              return (
                <Card
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-3.5 cursor-pointer hover:border-brand-blue hover:shadow-[3px_3px_0px_0px_var(--color-brand-blue)] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-black text-[14px]">{refNo}</span>
                      <span className="text-black/40">·</span>
                      <span className="font-bold text-brand-blue text-[14px]">
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
                    cancelledReason={req.cancellation_reason}
                  />
                </Card>
              );
            })}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-black text-white px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_var(--color-brand-blue)] flex items-center gap-2.5 text-xs font-semibold">
            <IconCheck size={16} className="text-brand-blue" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white cursor-pointer">
              <IconX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Report an Issue Modal */}
      {showCreateModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-xl border border-black/15 p-4 sm:p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] my-auto text-[14px]"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconCrosshair size={16} />
                  </div>
                  <h2 className="text-[14px] font-bold text-black">Report a Water Service Issue</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              {createError && (
                <div className="p-2.5 bg-black/5 border border-black/20 text-black rounded-lg text-xs font-semibold">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateRequest} className="space-y-4">
                {/* 1. Fixed Issue Type Cards (icon + title only) */}
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-2 uppercase tracking-wider">
                    Issue Category *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {issueTypes.map((t) => {
                      const isSelected = t.id === issueTypeId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectIssueType(t.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-blue bg-blue-tint text-brand-blue ring-2 ring-brand-blue/30 font-bold shadow-xs'
                              : 'border-black/15 bg-white text-black hover:border-black/30 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className={isSelected ? 'text-brand-blue' : 'text-black/60'}>
                            {ISSUE_TYPE_ICONS[t.name] || <IconAlertCircle size={22} />}
                          </div>
                          <span className="text-xs leading-tight">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Urgency Derivation (default, customer choice, min(max(def, choice), def + 1), no hours) */}
                <UrgencyDerivation
                  defaultUrgency={currentIssueType.default_urgency}
                  customerUrgency={customerUrgency}
                  onCustomerUrgencyChange={(newUrgency) => setCustomerUrgency(newUrgency)}
                />

                {/* 3. Description */}
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Problem Description *
                  </label>
                  <textarea
                    placeholder="Describe the problem (leaks, low pressure, broken pipe, etc.)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-white text-black text-[14px] font-normal border border-black/20 rounded-lg outline-none focus:border-brand-blue resize-none"
                    required
                  />
                </div>

                {/* 4. Incident Location: Barangay + LocationPickerMap with pin marker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-black/70 uppercase tracking-wider">
                    Incident Location (Pin on Map) *
                  </label>

                  <select
                    value={selectedBarangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    className="w-full p-2.5 bg-white text-black text-[14px] font-medium border border-black/20 rounded-lg outline-none focus:border-brand-blue mb-1"
                  >
                    {SINACABAN_BARANGAY_LIST.map((b) => (
                      <option key={b.id} value={b.name}>
                        Barangay {b.name}
                      </option>
                    ))}
                  </select>

                  <LocationPickerMap
                    latitude={pinCoords[0]}
                    longitude={pinCoords[1]}
                    barangay={selectedBarangay}
                    onChange={(lat, lng) => setPinCoords([parseFloat(lat), parseFloat(lng)])}
                    pickerType="pin"
                    showCoordinates={true}
                  />
                </div>

                {/* 5. Optional Photo Upload (max 5 MB, JPG/PNG, resized) */}
                <div className="space-y-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="p-2.5 border border-black/20 rounded-lg bg-blue-tint/50 flex items-center justify-between gap-2">
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
                            className="text-[11px] text-brand-blue font-semibold hover:underline cursor-pointer"
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
                      className="w-full py-2.5 px-3 border border-black/20 hover:bg-blue-tint hover:text-brand-blue text-black rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                    >
                      <IconCamera size={16} />
                      <span>Upload Issue Photo (Optional, JPG/PNG up to 5 MB)</span>
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
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedReq(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-xl border border-black/15 p-4 sm:p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] my-auto text-[14px]"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconCrosshair size={16} />
                  </div>
                  <span className="text-[14px] font-extrabold text-black">
                    {selectedReq.reference_no || selectedReq.reference}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1 text-black/50 hover:text-black rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Status Timeline with Droplet marker and Vertical Mobile Support */}
              <div className="py-1">
                <StatusTimeline
                  status={selectedReq.status}
                  submittedAt={selectedReq.created_at}
                  assignedAt={selectedReq.assigned_at}
                  startedAt={selectedReq.started_at}
                  resolvedAt={selectedReq.resolved_at}
                  cancelledAt={selectedReq.cancelled_at}
                  cancelledReason={selectedReq.cancellation_reason}
                />
              </div>

              {/* Urgency Derivation in display mode (shows default, final urgency, no SLA/hours) */}
              <UrgencyDerivation
                defaultUrgency={selectedReq.issue_type?.default_urgency || 'medium'}
                customerUrgency={selectedReq.customer_urgency as Urgency || undefined}
                finalUrgency={selectedReq.urgency as Urgency}
                adjustedByAdmin={Boolean(selectedReq.urgency_adjustment_reason) || selectedReq.urgency !== selectedReq.customer_urgency}
                adjustmentReason={selectedReq.urgency_adjustment_reason}
              />

              {/* Request Record Details */}
              <div className="p-3.5 border border-black/10 rounded-xl bg-blue-tint/50 space-y-2.5 text-xs">
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
                    <span className="text-[11px] font-bold uppercase text-brand-blue block">
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
                  className="w-full p-2.5 text-xs bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
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
