import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import {
  EmptyAdvisoriesIllustration,
  NoMatchesIllustration,
} from '../../components/illustrations';
import { adminApi, interruptionsApi, referenceApi } from '../../api';
import type { Barangay, User } from '../../types';
import {
  advisoriesStore,
  SINACABAN_BARANGAY_LIST,
  DEFAULT_ADVISORY_CONSUMERS,
  PREMADE_ADVISORY_TYPES,
  computeAdvisoryStatus,
  buildUniformAdvisorySms,
  formatTimestampNow,
  formatReadableDateTime,
  type AdvisoryRecord,
  type AdvisoryStatus,
  type AdvisoryConsumer,
} from '../../services/advisoriesStore';
import {
  IconPlus,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconPencil,
  IconBan,
  IconDropletFilled,
  IconEye,
} from '@tabler/icons-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_MINI = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AdminInterruptionsView() {
  const navigate = useNavigate();

  // Top-right view mode: only 'month' | 'list' (Day and Week removed)
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  // Core Advisory State
  const [advisories, setAdvisories] = useState<AdvisoryRecord[]>(() =>
    advisoriesStore.getAdvisories()
  );
  const [barangays, setBarangays] = useState<Barangay[]>(SINACABAN_BARANGAY_LIST);
  const [consumers, setConsumers] = useState<AdvisoryConsumer[]>(DEFAULT_ADVISORY_CONSUMERS);

  // Calendar Navigation & Selection State
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Sidebar Barangay Search & Selection + Status Filter
  const [barangaySearch, setBarangaySearch] = useState<string>('');
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdvisoryStatus>('all');

  // Toast Notification
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Modal 1: Add / Edit Advisory (Step 1: Form -> Step 2: Preview)
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formStep, setFormStep] = useState<'form' | 'preview'>('form');
  const [editingAdvisory, setEditingAdvisory] = useState<AdvisoryRecord | null>(null);
  const [advisoryTypeInput, setAdvisoryTypeInput] = useState<string>('scheduled_maintenance');
  const [titleInput, setTitleInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [startsAtInput, setStartsAtInput] = useState<string>('');
  const [endsAtInput, setEndsAtInput] = useState<string>('');
  const [remarksInput, setRemarksInput] = useState<string>('');
  const [selectedBarangayIds, setSelectedBarangayIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal 2: Advisory Detail View
  const [selectedAdvisoryDetail, setSelectedAdvisoryDetail] = useState<AdvisoryRecord | null>(null);

  // Modal 3: Mark as Restored (Only for Ongoing advisories)
  const [advisoryToRestore, setAdvisoryToRestore] = useState<AdvisoryRecord | null>(null);
  const [restorationRemarkInput, setRestorationRemarkInput] = useState<string>('');

  // Modal 4: Cancel Advisory (For Scheduled or Ongoing advisories)
  const [advisoryToCancel, setAdvisoryToCancel] = useState<AdvisoryRecord | null>(null);

  // Sync barangays, active customers, and advisories from API on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      referenceApi.getBarangays().catch(() => [] as Barangay[]),
      adminApi.customersList({ per_page: 100 }).catch(() => ({ data: [] as User[] })),
      interruptionsApi.list().catch(() => ({ data: [] as any[] })),
    ]).then(([bgRes, custRes, intRes]) => {
      if (!isMounted) return;
      if (bgRes && bgRes.length > 0) {
        setBarangays(bgRes);
      }
      if (custRes && Array.isArray(custRes.data)) {
        const mapped: AdvisoryConsumer[] = custRes.data
          .filter((u) => u.customer_profile?.barangay_id)
          .map((u) => ({
            id: u.id,
            name:
              u.name ||
              `${u.customer_profile?.first_name || ''} ${u.customer_profile?.last_name || ''}`.trim() ||
              'Customer',
            barangay_id: u.customer_profile!.barangay_id,
            barangay_name: u.customer_profile?.barangay?.name || 'Poblacion',
            mobile_number: u.mobile_number || u.customer_profile?.mobile_number || '',
            is_active: Boolean(u.is_verified ?? u.status === 'active'),
          }));
        setConsumers(mapped);
      }
      if (intRes && Array.isArray(intRes.data) && intRes.data.length > 0) {
        const mappedAdvs: AdvisoryRecord[] = intRes.data.map((item: any) => {
          const parts = (item.message || '').split(' — ');
          const title = item.title || parts[0] || 'Water Advisory';
          const reason = item.description || parts[1] || item.message || '';
          const brgyIds = item.barangays?.map((b: any) => b.id) || [];
          const brgyNames = item.barangays?.map((b: any) => b.name) || [];
          return {
            id: item.id,
            title,
            reason,
            barangay_ids: brgyIds,
            barangay_names: brgyNames,
            starts_at: item.starts_at,
            ends_at: item.ends_at,
            is_cancelled: item.status === 'cancelled',
            is_restored: item.status === 'ended',
            affected_customers_count: 0,
            sms_sent_count: 0,
            in_app_only_count: 0,
            sms_text: item.message || '',
            created_at: item.starts_at,
            updated_at: item.ends_at,
          };
        });
        setAdvisories(mappedAdvs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateAdvisories = (next: AdvisoryRecord[]) => {
    setAdvisories(next);
    advisoriesStore.saveAdvisories(next);
  };

  const showToast = (title: string, message: string) => {
    setToast({ title, message });
  };

  // Enrich advisories with computed live status
  const advisoriesWithStatus = useMemo(() => {
    const now = new Date();
    return advisories.map((adv) => ({
      ...adv,
      status: computeAdvisoryStatus(adv, now),
    }));
  }, [advisories]);

  // Filtered advisories by barangay & status
  const filteredAdvisories = useMemo(() => {
    return advisoriesWithStatus.filter((adv) => {
      if (
        selectedBarangayFilter !== 'all' &&
        !adv.barangay_ids.includes(selectedBarangayFilter)
      ) {
        return false;
      }
      if (statusFilter !== 'all' && adv.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [advisoriesWithStatus, selectedBarangayFilter, statusFilter]);

  // Calendar grid generation (35 or 42 cells, including overflow days like reference image)
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const daysInCurrMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const cells: {
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }[] = [];

    // Previous month overflow days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const dObj = new Date(calYear, calMonth - 1, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: false,
        dateKey: `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(
          dNum
        ).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInCurrMonth; dNum++) {
      const dObj = new Date(calYear, calMonth, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: true,
        dateKey: `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dNum).padStart(
          2,
          '0'
        )}`,
      });
    }

    // Next month overflow days to complete 35 or 42 cells
    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remaining = totalSlots - cells.length;
    for (let dNum = 1; dNum <= remaining; dNum++) {
      const dObj = new Date(calYear, calMonth + 1, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: false,
        dateKey: `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(
          dNum
        ).padStart(2, '0')}`,
      });
    }

    return cells;
  }, [calYear, calMonth]);

  const getAdvisoriesForDateKey = (dateKey: string) => {
    return filteredAdvisories.filter((adv) => {
      const startDay = adv.starts_at.slice(0, 10);
      const endDay = (adv.actual_restored_at || adv.ends_at).slice(0, 10);
      return dateKey >= startDay && dateKey <= endDay;
    });
  };

  const selectedDateKey = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  // Filtered Barangays in Sidebar
  const sidebarBarangays = useMemo(() => {
    return barangays.filter((b) =>
      b.name.toLowerCase().includes(barangaySearch.trim().toLowerCase())
    );
  }, [barangays, barangaySearch]);

  // Navigation Handlers
  const handlePrevMonth = () => {
    const next = new Date(calYear, calMonth - 1, 1);
    setCalendarDate(next);
    setSelectedDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(calYear, calMonth + 1, 1);
    setCalendarDate(next);
    setSelectedDate(next);
  };

  // Open Add Advisory Modal (Section 7.2 & 7.5: Premade advisory types prefill title & reason)
  const handleOpenAddModal = () => {
    setEditingAdvisory(null);
    setFormError(null);
    setFormStep('form');
    const defaultType = PREMADE_ADVISORY_TYPES[0];
    setAdvisoryTypeInput(defaultType.id);
    setTitleInput(defaultType.defaultTitle);
    setReasonInput(defaultType.defaultReason);

    // Default start: tomorrow 08:00, end: tomorrow 17:00 (ensures start is not in the past)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setStartsAtInput(`${yyyy}-${mm}-${dd}T08:00`);
    setEndsAtInput(`${yyyy}-${mm}-${dd}T17:00`);
    setRemarksInput('');
    setSelectedBarangayIds([]);
    setShowFormModal(true);
  };

  const handleTypeChange = (typeId: string) => {
    setAdvisoryTypeInput(typeId);
    const selected = PREMADE_ADVISORY_TYPES.find((t) => t.id === typeId);
    if (selected) {
      if (typeId === 'other') {
        setTitleInput(selected.defaultTitle);
        setReasonInput('');
      } else {
        setTitleInput(selected.defaultTitle);
        setReasonInput(selected.defaultReason);
      }
    }
  };

  // Open Edit Advisory Modal (Section 7.3: Only while Scheduled or Ongoing)
  const handleOpenEditModal = (adv: AdvisoryRecord) => {
    setSelectedAdvisoryDetail(null);
    setEditingAdvisory(adv);
    setFormError(null);
    setFormStep('form');
    setAdvisoryTypeInput(adv.advisory_type || 'other');
    setTitleInput(adv.title);
    setReasonInput(adv.reason);
    setStartsAtInput(adv.starts_at.slice(0, 16));
    setEndsAtInput(adv.ends_at.slice(0, 16));
    setRemarksInput(adv.remarks || '');
    setSelectedBarangayIds([...adv.barangay_ids]);
    setShowFormModal(true);
  };

  const handleToggleBarangaySelection = (id: number) => {
    setSelectedBarangayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBarangays = () => {
    if (selectedBarangayIds.length === barangays.length) {
      setSelectedBarangayIds([]);
    } else {
      setSelectedBarangayIds(barangays.map((b) => b.id));
    }
  };

  // Step 1 -> Step 2 Validation & Preview (Section 3.4 & 3.5)
  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!titleInput.trim() || !reasonInput.trim()) {
      setFormError('Title and reason are required.');
      return;
    }
    if (!startsAtInput || !endsAtInput) {
      setFormError('Start and expected end times are required.');
      return;
    }
    if (selectedBarangayIds.length === 0) {
      setFormError('Select at least one affected barangay.');
      return;
    }

    const startMs = new Date(startsAtInput).getTime();
    const endMs = new Date(endsAtInput).getTime();
    const nowMs = Date.now() - 60 * 1000; // 1 min grace

    // Section 3.4: Check that start is not in the past (when creating or rescheduling a scheduled advisory) and end is later than start
    if (!editingAdvisory && startMs < nowMs) {
      setFormError('Start time cannot be in the past.');
      return;
    }
    if (endMs <= startMs) {
      setFormError('Expected end time must be later than the start time.');
      return;
    }

    setFormStep('preview');
  };

  // Recipient Preview Calculation (Section 3.5)
  const recipientPreview = useMemo(() => {
    const selectedNames = barangays
      .filter((b) => selectedBarangayIds.includes(b.id))
      .map((b) => b.name);

    return advisoriesStore.computeRecipientPreview(selectedBarangayIds, consumers, {
      title: titleInput.trim(),
      reason: reasonInput.trim(),
      barangayNames: selectedNames,
      startsAt: startsAtInput,
      endsAt: endsAtInput,
      remarks: remarksInput.trim() || undefined,
    });
  }, [
    selectedBarangayIds,
    barangays,
    consumers,
    titleInput,
    reasonInput,
    startsAtInput,
    endsAtInput,
    remarksInput,
  ]);

  // Added / Removed barangays when editing (Section 4.2)
  const editBarangayDiff = useMemo(() => {
    if (!editingAdvisory) return { addedNames: [] as string[], removedNames: [] as string[] };
    const addedIds = selectedBarangayIds.filter(
      (id) => !editingAdvisory.barangay_ids.includes(id)
    );
    const removedIds = editingAdvisory.barangay_ids.filter(
      (id) => !selectedBarangayIds.includes(id)
    );
    const addedNames = barangays.filter((b) => addedIds.includes(b.id)).map((b) => b.name);
    const removedNames = barangays.filter((b) => removedIds.includes(b.id)).map((b) => b.name);
    return { addedNames, removedNames };
  }, [editingAdvisory, selectedBarangayIds, barangays]);

  // Step 2: Confirm & Publish / Update Advisory (Section 3.6 - 3.10 & Section 4.1 - 4.2)
  const handleConfirmPublishOrUpdate = async () => {
    setIsSubmitting(true);
    const selectedNames = barangays
      .filter((b) => selectedBarangayIds.includes(b.id))
      .map((b) => b.name);
    const nowStr = formatTimestampNow();

    try {
      if (!editingAdvisory) {
        await interruptionsApi
          .create({
            title: titleInput.trim(),
            reason: reasonInput.trim(),
            advisory_type: advisoryTypeInput,
            remarks: remarksInput.trim() || undefined,
            starts_at: startsAtInput,
            ends_at: endsAtInput,
            barangay_ids: selectedBarangayIds,
            publish_immediately: true,
          })
          .catch(() => null);
      } else {
        await interruptionsApi
          .update(editingAdvisory.id, {
            title: titleInput.trim(),
            reason: reasonInput.trim(),
            advisory_type: advisoryTypeInput,
            remarks: remarksInput.trim() || undefined,
            starts_at: startsAtInput,
            ends_at: endsAtInput,
            barangay_ids: selectedBarangayIds,
          })
          .catch(() => null);
      }
    } finally {
      if (!editingAdvisory) {
        const newAdvisory: AdvisoryRecord = {
          id: Date.now(),
          advisory_type: advisoryTypeInput,
          title: titleInput.trim(),
          reason: reasonInput.trim(),
          barangay_ids: [...selectedBarangayIds],
          barangay_names: selectedNames,
          starts_at: startsAtInput,
          ends_at: endsAtInput,
          remarks: remarksInput.trim() || undefined,
          is_cancelled: false,
          is_restored: false,
          affected_customers_count: recipientPreview.totalAffected,
          sms_sent_count: recipientPreview.smsCount,
          in_app_only_count: recipientPreview.inAppOnlyCount,
          sms_text: recipientPreview.smsText,
          created_at: nowStr,
          updated_at: nowStr,
        };

        updateAdvisories([newAdvisory, ...advisories]);
        advisoriesStore.appendAuditLog(
          `Published Water Advisory "${newAdvisory.title}" for ${selectedNames.join(', ')} (${recipientPreview.totalAffected} notified: ${recipientPreview.smsCount} SMS + in-app, ${recipientPreview.inAppOnlyCount} in-app only)`
        );
        showToast(
          newAdvisory.title,
          `Published · ${recipientPreview.smsCount} SMS & ${recipientPreview.totalAffected} in-app notices sent`
        );
      } else {
        const updatedSmsText = buildUniformAdvisorySms({
          type: 'update',
          title: titleInput.trim(),
          reason: reasonInput.trim(),
          barangayNames: selectedNames,
          startsAt: startsAtInput,
          endsAt: endsAtInput,
          remarks: remarksInput.trim() || undefined,
        });

        const updatedAdvisory: AdvisoryRecord = {
          ...editingAdvisory,
          title: titleInput.trim(),
          reason: reasonInput.trim(),
          barangay_ids: [...selectedBarangayIds],
          barangay_names: selectedNames,
          starts_at: startsAtInput,
          ends_at: endsAtInput,
          remarks: remarksInput.trim() || undefined,
          affected_customers_count: recipientPreview.totalAffected,
          sms_sent_count: recipientPreview.smsCount,
          in_app_only_count: recipientPreview.inAppOnlyCount,
          sms_text: updatedSmsText,
          updated_at: nowStr,
        };

        updateAdvisories(
          advisories.map((a) => (a.id === editingAdvisory.id ? updatedAdvisory : a))
        );

        const diffNotes: string[] = [];
        if (editBarangayDiff.addedNames.length > 0) {
          diffNotes.push(`added: ${editBarangayDiff.addedNames.join(', ')}`);
        }
        if (editBarangayDiff.removedNames.length > 0) {
          diffNotes.push(`removed & notified no longer affected: ${editBarangayDiff.removedNames.join(', ')}`);
        }

        advisoriesStore.appendAuditLog(
          `Updated Water Advisory "${updatedAdvisory.title}" (${selectedNames.join(', ')})${
            diffNotes.length > 0 ? ` [${diffNotes.join('; ')}]` : ''
          }`
        );
        showToast(updatedAdvisory.title, 'Updated & sent revised notices');
      }

      setIsSubmitting(false);
      setShowFormModal(false);
      setEditingAdvisory(null);
    }
  };

  // Section 4.4 - 4.7: Mark as Restored (Only for Ongoing advisories)
  const handleConfirmRestore = () => {
    if (!advisoryToRestore) return;
    const status = computeAdvisoryStatus(advisoryToRestore);
    if (status !== 'ongoing') {
      setAdvisoryToRestore(null);
      return;
    }

    const now = new Date();
    const isoNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nowStr = formatTimestampNow();

    const restoredSms = buildUniformAdvisorySms({
      type: 'restore',
      title: advisoryToRestore.title,
      reason: advisoryToRestore.reason,
      barangayNames: advisoryToRestore.barangay_names,
      startsAt: advisoryToRestore.starts_at,
      endsAt: isoNow,
      remarks: restorationRemarkInput.trim() || undefined,
    });

    const updated: AdvisoryRecord = {
      ...advisoryToRestore,
      ends_at: isoNow,
      actual_restored_at: isoNow,
      restoration_remark: restorationRemarkInput.trim() || undefined,
      is_restored: true,
      sms_text: restoredSms,
      updated_at: nowStr,
    };

    updateAdvisories(advisories.map((a) => (a.id === advisoryToRestore.id ? updated : a)));

    if (selectedAdvisoryDetail?.id === advisoryToRestore.id) {
      setSelectedAdvisoryDetail(updated);
    }

    interruptionsApi
      .restore(advisoryToRestore.id, { remark: restorationRemarkInput.trim() || undefined })
      .catch(() => null);

    advisoriesStore.appendAuditLog(
      `Marked Water Advisory "${advisoryToRestore.title}" as Restored at ${nowStr} (${advisoryToRestore.barangay_names.join(', ')})`
    );
    showToast(advisoryToRestore.title, 'Marked as Restored · Restoration notices sent');
    setAdvisoryToRestore(null);
    setRestorationRemarkInput('');
  };

  // Section 4.3: Cancel Advisory (Only for Scheduled or Ongoing; never deleted)
  const handleConfirmCancelAdvisory = () => {
    if (!advisoryToCancel) return;
    const nowStr = formatTimestampNow();

    const cancelSms = buildUniformAdvisorySms({
      type: 'cancel',
      title: advisoryToCancel.title,
      reason: advisoryToCancel.reason,
      barangayNames: advisoryToCancel.barangay_names,
      startsAt: advisoryToCancel.starts_at,
      endsAt: advisoryToCancel.ends_at,
    });

    const updated: AdvisoryRecord = {
      ...advisoryToCancel,
      is_cancelled: true,
      sms_text: cancelSms,
      updated_at: nowStr,
    };

    updateAdvisories(advisories.map((a) => (a.id === advisoryToCancel.id ? updated : a)));

    interruptionsApi
      .cancel(advisoryToCancel.id, { reason: 'Cancelled by administrator' })
      .catch(() => null);

    if (selectedAdvisoryDetail?.id === advisoryToCancel.id) {
      setSelectedAdvisoryDetail(updated);
    }

    advisoriesStore.appendAuditLog(
      `Cancelled Water Advisory "${advisoryToCancel.title}" (${advisoryToCancel.barangay_names.join(', ')})`
    );
    showToast(advisoryToCancel.title, 'Cancelled · Cancellation notices sent');
    setAdvisoryToCancel(null);
  };

  const getStatusPillClass = (status: AdvisoryStatus) => {
    switch (status) {
      case 'ongoing':
        return 'bg-urgency-high text-white';
      case 'scheduled':
        return 'bg-brand-blue text-white';
      case 'completed':
        return 'bg-urgency-low text-white';
      case 'cancelled':
        return 'bg-slate-400 text-white line-through';
    }
  };

  const getStatusLabel = (status: AdvisoryStatus) => {
    switch (status) {
      case 'ongoing':
        return 'Ongoing';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const isAnyModalOpen = Boolean(
    showFormModal || selectedAdvisoryDetail || advisoryToRestore || advisoryToCancel
  );

  return (
    <AdminLayout currentPath="/admin/interruptions" onNavigate={(path) => navigate(path)}>
      <div
        className={`space-y-5 text-[14px] transition-all duration-300 ${
          isAnyModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Page Header + View Switcher Pills (Only Month & List — Day and Week Removed) */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Water Advisories
          </h1>

          <div className="flex items-center gap-2">
            {(['month', 'list'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-5 py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Main Split Calendar Layout (Matching Uploaded Calendar Reference Photo 1:1) */}
        <div className="flex flex-col lg:flex-row items-stretch gap-5">
          {/* LEFT SIDEBAR CARD */}
          <Card className="w-full lg:w-[270px] shrink-0 bg-white p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* 1. Primary Action Button (+ Add Advisory, matching "+ Create Schedule") */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="w-full py-3 px-4 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <IconPlus size={15} stroke={2.5} />
                <span>Add Advisory</span>
              </button>

              {/* 2. Mini Month Calendar */}
              <div className="space-y-2.5 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {MONTH_NAMES[calMonth]} {selectedDate.getDate()}, {calYear}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="Previous Month"
                      className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                    >
                      <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
                        <path d="M5 1L1 4L5 7V1Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Next Month"
                      className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                    >
                      <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
                        <path d="M1 1L5 4L1 7V1Z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Weekday initials S M T W T F S */}
                <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400 pt-1">
                  {WEEKDAYS_MINI.map((w, idx) => (
                    <div key={idx} className="py-1">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Mini Calendar Numbers */}
                <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
                  {calendarCells.slice(0, 35).map((cell) => {
                    const isSelected = cell.dateKey === selectedDateKey;
                    const dayAdvs = getAdvisoriesForDateKey(cell.dateKey);

                    return (
                      <button
                        key={`mini-${cell.dateKey}`}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cell.date);
                          if (!cell.isCurrentMonth) {
                            setCalendarDate(
                              new Date(cell.date.getFullYear(), cell.date.getMonth(), 1)
                            );
                          }
                        }}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition-colors relative cursor-pointer ${
                          isSelected
                            ? 'bg-brand-blue text-white font-bold shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-700 hover:bg-slate-100 font-medium'
                            : 'text-slate-300 hover:bg-slate-50 font-normal'
                        }`}
                      >
                        <span>{cell.dayNumber}</span>
                        {dayAdvs.length > 0 && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-brand-blue absolute -bottom-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Barangays Filter Section (Matching "People" section in Reference Photo) */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-900">Barangays</div>

                <input
                  type="text"
                  placeholder="Search for Barangay"
                  value={barangaySearch}
                  onChange={(e) => setBarangaySearch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-700 placeholder:text-slate-400 text-center focus:text-left outline-none focus:ring-1 focus:ring-brand-blue/40"
                />

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
                  {sidebarBarangays.map((bg, idx) => {
                    const isSelected = selectedBarangayFilter === bg.id;
                    const bgAdvisoryCount = advisoriesWithStatus.filter(
                      (a) =>
                        a.barangay_ids.includes(bg.id) &&
                        (a.status === 'ongoing' || a.status === 'scheduled')
                    ).length;
                    const avatarColors = [
                      'bg-brand-blue/15 text-brand-blue',
                      'bg-purple-600/15 text-purple-600',
                      'bg-urgency-high/15 text-urgency-high',
                      'bg-urgency-low/15 text-urgency-low',
                    ];

                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() =>
                          setSelectedBarangayFilter(isSelected ? 'all' : bg.id)
                        }
                        className={`w-full flex items-center gap-3 p-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-brand-blue/10' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full font-extrabold text-[11px] flex items-center justify-center shrink-0 ${
                            avatarColors[idx % avatarColors.length]
                          }`}
                        >
                          {bg.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-brand-blue' : 'text-slate-800'
                            }`}
                          >
                            {bg.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {bgAdvisoryCount > 0
                              ? `${bgAdvisoryCount} active`
                              : 'Normal supply'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Bottom Reset / All Schedule Button (Matching "My Schedule" in Reference Photo) */}
            <button
              type="button"
              onClick={() => {
                setSelectedBarangayFilter('all');
                setStatusFilter('all');
                setViewMode('month');
              }}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-100 hover:border-brand-blue/30 text-xs font-semibold text-brand-blue bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              All Schedule
            </button>
          </Card>

          {/* RIGHT MAIN CALENDAR / SCHEDULE COLUMN (Exact 3-Part Structure from Reference Photo) */}
          <div className="flex-1 flex flex-col">
            {/* Part 1: Standalone Top White Date Bar */}
            <div className="px-5 py-3.5 rounded-md bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] border border-black/10 flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-semibold text-slate-700">
                {MONTH_NAMES[calMonth]} {selectedDate.getDate()}, {calYear}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous Calendar Month"
                  className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <svg width="7" height="9" viewBox="0 0 6 8" fill="none">
                    <path d="M5 1L1 4L5 7V1Z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next Calendar Month"
                  className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <svg width="7" height="9" viewBox="0 0 6 8" fill="none">
                    <path d="M1 1L5 4L1 7V1Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {/* VIEW 1: MONTH CALENDAR GRID (Exact Visual Match to Reference Photo) */}
            {viewMode === 'month' ? (
              <div className="flex-1 flex flex-col">
                {/* Part 2: Weekday Strip Between Date Bar and Grid */}
                <div className="grid grid-cols-7 text-center py-3.5">
                  {WEEKDAYS_SHORT.map((dayName) => (
                    <div
                      key={dayName}
                      className="text-xs font-bold text-slate-800 tracking-wide"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Part 3: 7-Column Calendar Grid Card */}
                <div className="grid grid-cols-7 flex-1 bg-white rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] border border-black/10 overflow-hidden divide-x divide-y divide-black/10">
                  {calendarCells.map((cell) => {
                    const cellAdvisories = getAdvisoriesForDateKey(cell.dateKey);
                    const isSelected = cell.dateKey === selectedDateKey;
                    const formattedDay = String(cell.dayNumber).padStart(2, '0');
                    const hasMultipleAdvisories = cellAdvisories.length > 1;

                    return (
                      <div
                        key={cell.dateKey}
                        onClick={() => setSelectedDate(cell.date)}
                        className={`min-h-[115px] px-2.5 py-2.5 flex flex-col items-center transition-colors cursor-pointer ${
                          isSelected || hasMultipleAdvisories ? 'justify-start' : 'justify-center'
                        } ${
                          isSelected
                            ? 'border-t-[3px] border-t-brand-blue bg-white'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Two-Digit Day Number */}
                        <div
                          className={`text-[15px] font-semibold ${
                            cellAdvisories.length > 0 ? 'mb-1.5' : ''
                          } ${
                            isSelected
                              ? 'text-brand-blue font-bold'
                              : cell.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {formattedDay}
                        </div>

                        {/* Advisory Event Pills inside Cell (Matching Reference Photo Pills + "More") */}
                        {cellAdvisories.length > 0 && (
                          <div className="w-full space-y-1">
                            {cellAdvisories.slice(0, 2).map((adv) => (
                              <button
                                key={`${cell.dateKey}-${adv.id}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAdvisoryDetail(adv);
                                }}
                                className={`w-full px-2 py-1 rounded-md text-[10px] font-medium truncate text-center shadow-2xs transition-opacity hover:opacity-90 cursor-pointer ${getStatusPillClass(
                                  adv.status
                                )}`}
                              >
                                {adv.title}
                              </button>
                            ))}

                            {cellAdvisories.length > 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(cell.date);
                                  setViewMode('list');
                                }}
                                className="w-full py-0.5 rounded border border-slate-100 bg-slate-50/70 text-center text-[9px] font-semibold text-brand-blue hover:bg-slate-100 cursor-pointer"
                              >
                                More
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VIEW 2: LIST SCHEDULE TABLE */
              <div className="mt-3 flex-1 bg-white rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] border border-black/10 overflow-x-auto">
                {advisories.length === 0 ? (
                  <div className="py-16">
                    <EmptyState
                      illustration={<EmptyAdvisoriesIllustration />}
                      title="No advisories"
                      description="No water interruption advisories scheduled yet."
                      actionLabel="Add Advisory"
                      onAction={handleOpenAddModal}
                    />
                  </div>
                ) : filteredAdvisories.length === 0 ? (
                  <div className="py-16">
                    <EmptyState
                      illustration={<NoMatchesIllustration />}
                      title="No matches"
                      description="No advisories match the current filter."
                      actionLabel="Clear filters"
                      onAction={() => {
                        setSelectedBarangayFilter('all');
                        setStatusFilter('all');
                      }}
                    />
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/5 text-black/70 uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-4">Advisory</th>
                        <th className="py-2.5 px-3">Affected Barangays</th>
                        <th className="py-2.5 px-3">Schedule</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {filteredAdvisories.map((adv) => {
                        const canEditOrCancel =
                          adv.status === 'scheduled' || adv.status === 'ongoing';
                        const canMarkRestored = adv.status === 'ongoing';

                        return (
                          <tr
                            key={adv.id}
                            onClick={() => setSelectedAdvisoryDetail(adv)}
                            className="hover:bg-black/5 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-black">{adv.title}</div>
                              <div className="text-[11px] text-black/60 truncate max-w-xs">
                                {adv.reason}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {adv.barangay_names.map((name) => (
                                  <span
                                    key={name}
                                    className="px-2 py-0.5 rounded bg-black/5 border border-black/10 text-[11px] font-semibold text-black"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-[11px] text-black/75">
                              <div>Start: {formatReadableDateTime(adv.starts_at)}</div>
                              <div>
                                {adv.is_restored ? 'Restored: ' : 'End: '}
                                {formatReadableDateTime(adv.actual_restored_at || adv.ends_at)}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                                  adv.status
                                )}`}
                              >
                                {getStatusLabel(adv.status)}
                              </span>
                            </td>

                            <td
                              className="py-3 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                {canMarkRestored && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdvisoryToRestore(adv);
                                      setRestorationRemarkInput('');
                                    }}
                                    className="px-2.5 py-1 rounded bg-urgency-low hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <IconDropletFilled size={12} />
                                    <span>Mark as Restored</span>
                                  </button>
                                )}

                                {canEditOrCancel && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(adv)}
                                      className="px-2 py-1 rounded border border-black/20 hover:bg-black/5 text-black font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <IconPencil size={12} className="text-brand-blue" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setAdvisoryToCancel(adv)}
                                      className="px-2 py-1 rounded border border-urgency-high/40 text-urgency-high hover:bg-red-50 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <IconBan size={12} />
                                      <span>Cancel</span>
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedAdvisoryDetail(adv)}
                                  className="px-2 py-1 rounded border border-black/20 hover:bg-black/5 text-black font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <IconEye size={12} className="text-brand-blue" />
                                  <span>View</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white px-4 py-3 rounded-md shadow-2xl border border-black/30 flex items-center gap-3 animate-in slide-in-from-bottom-5 text-xs max-w-md">
            <span className="w-5 h-5 rounded-full border border-emerald-400 bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
              <IconCheck size={12} stroke={3} />
            </span>
            <span className="font-normal text-slate-200">
              <span className="font-bold text-white">“{toast.title}”</span> {toast.message}
            </span>
            <button
              onClick={() => setToast(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-auto"
            >
              <IconX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT ADVISORY MODAL (Step 1 Form -> Step 2 Recipient Preview) */}
      {showFormModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowFormModal(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 my-auto text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-base font-bold text-black">
                  {editingAdvisory ? 'Edit Advisory' : 'Add Advisory'}
                </h3>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded bg-red-50 border border-urgency-high/40 text-urgency-high font-semibold flex items-center gap-2">
                  <IconAlertTriangle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formStep === 'form' ? (
                <form onSubmit={handleProceedToPreview} className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-black mb-1">Advisory Type *</label>
                    <select
                      value={advisoryTypeInput}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                      aria-label="Advisory Type"
                    >
                      {PREMADE_ADVISORY_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Feeder Pipe Repair"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Reason *</label>
                    <input
                      type="text"
                      placeholder="e.g. Gate valve replacement along National Highway"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-black mb-1">Start *</label>
                      <input
                        type="datetime-local"
                        value={startsAtInput}
                        onChange={(e) => setStartsAtInput(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-black mb-1">Expected End *</label>
                      <input
                        type="datetime-local"
                        value={endsAtInput}
                        onChange={(e) => setEndsAtInput(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-black">
                        Affected Barangays ({selectedBarangayIds.length}) *
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllBarangays}
                        className="text-brand-blue font-bold hover:underline cursor-pointer"
                      >
                        {selectedBarangayIds.length === barangays.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 border border-black/15 rounded bg-slate-50/50">
                      {barangays.map((b) => {
                        const isChecked = selectedBarangayIds.includes(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleToggleBarangaySelection(b.id)}
                            className={`px-2.5 py-1.5 rounded text-left text-xs border transition-colors cursor-pointer truncate ${
                              isChecked
                                ? 'bg-brand-blue text-white border-brand-blue font-bold'
                                : 'bg-white text-black border-black/15 hover:border-black/40'
                            }`}
                          >
                            {isChecked ? '✓ ' : ''}
                            {b.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Remarks (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Water tanker stationed at Barangay Hall"
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowFormModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Preview Recipients
                    </Button>
                  </div>
                </form>
              ) : (
                /* STEP 2: RECIPIENT PREVIEW & CONFIRM (Section 3.5 & 3.6) */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded border border-black/15 bg-slate-50">
                      <div className="text-[10px] font-bold uppercase text-black/55">
                        Affected Customers
                      </div>
                      <div className="text-xl font-extrabold text-black mt-1">
                        {recipientPreview.totalAffected}
                      </div>
                    </div>

                    <div className="p-3 rounded border border-brand-blue/30 bg-brand-blue/5">
                      <div className="text-[10px] font-bold uppercase text-brand-blue">
                        SMS + In-App
                      </div>
                      <div className="text-xl font-extrabold text-brand-blue mt-1">
                        {recipientPreview.smsCount}
                      </div>
                    </div>

                    <div className="p-3 rounded border border-black/15 bg-slate-50">
                      <div className="text-[10px] font-bold uppercase text-black/55">
                        In-App Only
                      </div>
                      <div className="text-xl font-extrabold text-black mt-1">
                        {recipientPreview.inAppOnlyCount}
                      </div>
                    </div>
                  </div>

                  {editingAdvisory &&
                    (editBarangayDiff.addedNames.length > 0 ||
                      editBarangayDiff.removedNames.length > 0) && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-300 space-y-1 text-[11px]">
                        {editBarangayDiff.addedNames.length > 0 && (
                          <div>
                            <strong>Added:</strong> {editBarangayDiff.addedNames.join(', ')}
                          </div>
                        )}
                        {editBarangayDiff.removedNames.length > 0 && (
                          <div>
                            <strong>Removed (notified no longer affected):</strong>{' '}
                            {editBarangayDiff.removedNames.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                  <div className="p-3 rounded bg-black/5 border border-black/10 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-black/55">
                      Uniform SMS & In-App Notice
                    </div>
                    <div className="font-mono text-[11px] text-black leading-relaxed">
                      {recipientPreview.smsText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/10">
                    <Button variant="secondary" onClick={() => setFormStep('form')}>
                      Back
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => setShowFormModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleConfirmPublishOrUpdate}
                        isLoading={isSubmitting}
                        leftIcon={<IconCheck size={15} />}
                      >
                        {editingAdvisory ? 'Confirm Update' : 'Confirm & Publish'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 2: ADVISORY DETAILS & ACTIONS MODAL */}
      {selectedAdvisoryDetail &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setSelectedAdvisoryDetail(null)}
          >
            {(() => {
              const liveStatus = computeAdvisoryStatus(selectedAdvisoryDetail);
              const canEditOrCancel =
                liveStatus === 'scheduled' || liveStatus === 'ongoing';
              const canMarkRestored = liveStatus === 'ongoing';

              return (
                <Card
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-black">
                        {selectedAdvisoryDetail.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                          liveStatus
                        )}`}
                      >
                        {getStatusLabel(liveStatus)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAdvisoryDetail(null)}
                      className="p-1 text-black/50 hover:text-black cursor-pointer"
                    >
                      <IconX size={18} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-black/50 block">
                        Reason
                      </span>
                      <span className="font-semibold text-black">
                        {selectedAdvisoryDetail.reason}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-black/50 block mb-1">
                        Affected Barangays
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedAdvisoryDetail.barangay_names.map((bName) => (
                          <span
                            key={bName}
                            className="px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-bold text-[11px]"
                          >
                            {bName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded bg-black/5 border border-black/10">
                        <span className="text-[10px] font-bold uppercase text-black/50 block">
                          Start
                        </span>
                        <span className="font-bold text-black">
                          {formatReadableDateTime(selectedAdvisoryDetail.starts_at)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/5 border border-black/10">
                        <span className="text-[10px] font-bold uppercase text-black/50 block">
                          {selectedAdvisoryDetail.is_restored ? 'Restored At' : 'Expected End'}
                        </span>
                        <span className="font-bold text-black">
                          {formatReadableDateTime(
                            selectedAdvisoryDetail.actual_restored_at ||
                              selectedAdvisoryDetail.ends_at
                          )}
                        </span>
                      </div>
                    </div>

                    {selectedAdvisoryDetail.remarks && (
                      <div className="p-2.5 rounded bg-slate-50 border border-black/10">
                        <span className="text-[10px] font-bold uppercase text-black/50 block">
                          Remarks
                        </span>
                        <span className="text-black">{selectedAdvisoryDetail.remarks}</span>
                      </div>
                    )}

                    {selectedAdvisoryDetail.restoration_remark && (
                      <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                          Restoration Remark
                        </span>
                        <span className="text-black">
                          {selectedAdvisoryDetail.restoration_remark}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded border border-black/10">
                        <div className="text-[10px] text-black/50 font-bold">Affected</div>
                        <div className="font-extrabold text-black">
                          {selectedAdvisoryDetail.affected_customers_count}
                        </div>
                      </div>
                      <div className="p-2 rounded border border-black/10">
                        <div className="text-[10px] text-black/50 font-bold">SMS Sent</div>
                        <div className="font-extrabold text-brand-blue">
                          {selectedAdvisoryDetail.sms_sent_count}
                        </div>
                      </div>
                      <div className="p-2 rounded border border-black/10">
                        <div className="text-[10px] text-black/50 font-bold">In-App Only</div>
                        <div className="font-extrabold text-black">
                          {selectedAdvisoryDetail.in_app_only_count}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/10">
                    <div className="flex items-center gap-1.5">
                      {canMarkRestored && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdvisoryToRestore(selectedAdvisoryDetail);
                            setRestorationRemarkInput('');
                          }}
                          className="px-3 py-1.5 rounded bg-urgency-low hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <IconDropletFilled size={13} />
                          <span>Mark as Restored</span>
                        </button>
                      )}
                      {canEditOrCancel && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(selectedAdvisoryDetail)}
                            className="px-2.5 py-1.5 rounded border border-black/20 hover:bg-black/5 text-black font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <IconPencil size={13} className="text-brand-blue" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvisoryToCancel(selectedAdvisoryDetail)}
                            className="px-2.5 py-1.5 rounded border border-urgency-high/40 text-urgency-high hover:bg-red-50 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <IconBan size={13} />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => setSelectedAdvisoryDetail(null)}
                    >
                      Close
                    </Button>
                  </div>
                </Card>
              );
            })()}
          </div>,
          document.body
        )}

      {/* MODAL 3: MARK AS RESTORED MODAL (Section 4.4 - 4.7) */}
      {advisoryToRestore &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setAdvisoryToRestore(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2 text-urgency-low">
                  <IconDropletFilled size={18} />
                  <h3 className="text-base font-bold text-black">Mark as Restored</h3>
                </div>
                <button
                  onClick={() => setAdvisoryToRestore(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-black">
                  {advisoryToRestore.title} ({advisoryToRestore.barangay_names.join(', ')})
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">
                    Remark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Normal water pressure restored"
                    value={restorationRemarkInput}
                    onChange={(e) => setRestorationRemarkInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <Button variant="secondary" onClick={() => setAdvisoryToRestore(null)}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-2 rounded bg-urgency-low hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Confirm Restored
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 4: CANCEL ADVISORY MODAL (Section 4.3) */}
      {advisoryToCancel &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setAdvisoryToCancel(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2 text-urgency-high">
                  <IconBan size={18} />
                  <h3 className="text-base font-bold text-black">Cancel Advisory</h3>
                </div>
                <button
                  onClick={() => setAdvisoryToCancel(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <p className="text-black/80">
                Cancel <strong>{advisoryToCancel.title}</strong> for{' '}
                <strong>{advisoryToCancel.barangay_names.join(', ')}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <Button variant="secondary" onClick={() => setAdvisoryToCancel(null)}>
                  Back
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmCancelAdvisory}
                  className="px-4 py-2 rounded bg-urgency-high hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel Advisory
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}
    </AdminLayout>
  );
}
