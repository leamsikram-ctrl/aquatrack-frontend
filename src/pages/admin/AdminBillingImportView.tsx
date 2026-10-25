import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi, referenceApi } from '../../api';
import type { Barangay, User } from '../../types';
import {
  billingStore,
  MONTH_NAMES,
  formatPeriodLabel,
  formatNowTimestamp,
  DEFAULT_SINACABAN_CUSTOMERS,
  type BillingPeriod,
  type CustomerBalanceRecord,
  type BillingPaymentEntry,
  type CsvPreviewValidRow,
  type CsvPreviewInvalidRow,
  type RegisteredDirectoryCustomer,
} from '../../services/billingStore';
import {
  IconReceipt,
  IconUpload,
  IconSearch,
  IconCalendar,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconAlertTriangle,
  IconPencil,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconCash,
  IconRotate2,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconFileSpreadsheet,
  IconBellRinging,
} from '@tabler/icons-react';

export function AdminBillingImportView() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'records' | 'periods' | 'payments'>('records');

  const [periods, setPeriods] = useState<BillingPeriod[]>(() => billingStore.getPeriods());
  const [records, setRecords] = useState<CustomerBalanceRecord[]>(() => billingStore.getRecords());
  const [payments, setPayments] = useState<BillingPaymentEntry[]>(() => billingStore.getPayments());
  const [directoryCustomers, setDirectoryCustomers] = useState<RegisteredDirectoryCustomer[]>(
    DEFAULT_SINACABAN_CUSTOMERS
  );
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const openPeriod = useMemo(() => periods.find((p) => p.status === 'open') || null, [periods]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const initPeriods = billingStore.getPeriods();
    const open = initPeriods.find((p) => p.status === 'open');
    return open ? open.id : initPeriods[0]?.id || 'all';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'unpaid' | 'settled'>('all');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [toast, setToast] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Modal 1: Upload CSV
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<'dropzone' | 'uploading' | 'preview'>('dropzone');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedCsvFileName, setSelectedCsvFileName] = useState<string>('');
  const [csvUrlInput, setCsvUrlInput] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSource, setUploadSource] = useState<'file' | 'url'>('file');
  const [previewValidRows, setPreviewValidRows] = useState<CsvPreviewValidRow[]>([]);
  const [previewInvalidRows, setPreviewInvalidRows] = useState<CsvPreviewInvalidRow[]>([]);
  const [isConfirmingImport, setIsConfirmingImport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTimerRef = useRef<number | null>(null);

  // Modal 2: Add / Edit Billing Period
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<BillingPeriod | null>(null);
  const [periodMonth, setPeriodMonth] = useState<number>(11);
  const [periodYear, setPeriodYear] = useState<number>(2026);
  const [periodDueDate, setPeriodDueDate] = useState<string>('2026-11-25');
  const [periodFormError, setPeriodFormError] = useState<string | null>(null);

  // Modal 3: Delete Period
  const [periodToDelete, setPeriodToDelete] = useState<BillingPeriod | null>(null);

  // Modal 4: Customer Balance Detail
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<CustomerBalanceRecord | null>(null);

  // Modal 5: Record Payment
  const [recordForPayment, setRecordForPayment] = useState<CustomerBalanceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentOrNumber, setPaymentOrNumber] = useState<string>('');
  const [paymentRemark, setPaymentRemark] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Modal 6: Reverse Payment
  const [paymentToReverse, setPaymentToReverse] = useState<BillingPaymentEntry | null>(null);

  useEffect(() => {
    let isMounted = true;
    const syncBackendDirectory = async () => {
      setIsLoading(true);
      try {
        const [custRes, bgRes] = await Promise.all([
          adminApi.customersList({ per_page: 100 }).catch(() => ({ data: [] as User[] })),
          referenceApi.getBarangays().catch(() => [] as Barangay[]),
        ]);
        if (!isMounted) return;

        if (bgRes.length > 0) {
          setBarangays(bgRes);
        }

        if (custRes.data && Array.isArray(custRes.data)) {
          const mappedApiCustomers: RegisteredDirectoryCustomer[] = custRes.data
            .filter((u) => u.customer_profile?.meter?.meter_number)
            .map((u) => {
              const cp = u.customer_profile!;
              const fullName =
                u.name && u.name.toLowerCase() !== 'account user'
                  ? u.name
                  : `${cp.first_name || ''} ${cp.last_name || ''}`.trim() || 'Resident';
              return {
                id: u.id,
                name: fullName,
                account_number: cp.account_number || `ACC-2026-${String(u.id).padStart(4, '0')}`,
                meter_number: cp.meter!.meter_number,
                barangay: cp.barangay?.name || 'Poblacion',
                address: cp.address || 'Sinacaban',
                mobile_number: u.mobile_number || cp.mobile_number || '09170000000',
                is_active: Boolean(u.is_verified ?? u.status === 'active'),
              };
            });

          setDirectoryCustomers(mappedApiCustomers);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    syncBackendDirectory();
    return () => {
      isMounted = false;
    };
  }, []);

  const updatePeriods = (next: BillingPeriod[]) => {
    setPeriods(next);
    billingStore.savePeriods(next);
  };

  const updateRecords = (next: CustomerBalanceRecord[]) => {
    setRecords(next);
    billingStore.saveRecords(next);
  };

  const updatePayments = (next: BillingPaymentEntry[]) => {
    setPayments(next);
    billingStore.savePayments(next);
  };

  const showToastNotification = (title: string, message: string) => {
    setToast({ title, message });
  };

  const mostRecentRecordIdByCustomer = useMemo(() => {
    const map = new Map<number, string>();
    const periodOrder = new Map<string, number>();
    periods.forEach((p) => {
      periodOrder.set(p.id, p.year * 100 + p.month);
    });

    const sortedRecords = [...records].sort((a, b) => {
      const rankA = periodOrder.get(a.period_id) || 0;
      const rankB = periodOrder.get(b.period_id) || 0;
      return rankB - rankA;
    });

    sortedRecords.forEach((r) => {
      if (!map.has(r.customer_id)) {
        map.set(r.customer_id, r.id);
      }
    });
    return map;
  }, [records, periods]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (selectedPeriodId !== 'all' && rec.period_id !== selectedPeriodId) {
        return false;
      }
      if (balanceFilter === 'unpaid' && rec.total_balance <= 0) {
        return false;
      }
      if (balanceFilter === 'settled' && rec.total_balance > 0) {
        return false;
      }
      if (selectedBarangay !== 'all' && rec.barangay !== selectedBarangay) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.customer_name.toLowerCase().includes(q);
        const matchAcc = rec.account_number.toLowerCase().includes(q);
        const matchMeter = rec.meter_number.toLowerCase().includes(q);
        const matchBrgy = rec.barangay.toLowerCase().includes(q);
        const matchPeriod = rec.period_label.toLowerCase().includes(q);
        if (!matchName && !matchAcc && !matchMeter && !matchBrgy && !matchPeriod) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedPeriodId, balanceFilter, selectedBarangay, searchQuery]);

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      if (selectedPeriodId !== 'all' && pay.period_id !== selectedPeriodId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = pay.customer_name.toLowerCase().includes(q);
        const matchAcc = pay.account_number.toLowerCase().includes(q);
        const matchMeter = pay.meter_number.toLowerCase().includes(q);
        const matchOr = (pay.or_number || '').toLowerCase().includes(q);
        if (!matchName && !matchAcc && !matchMeter && !matchOr) {
          return false;
        }
      }
      return true;
    });
  }, [payments, selectedPeriodId, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedPeriodId, balanceFilter, selectedBarangay, searchQuery]);

  const metrics = useMemo(() => {
    const activePeriodRecords =
      selectedPeriodId === 'all'
        ? records
        : records.filter((r) => r.period_id === selectedPeriodId);

    const totalReceivable = activePeriodRecords.reduce((sum, r) => sum + r.total_balance, 0);
    const totalCollected = payments
      .filter((p) => p.type === 'payment' && !p.is_reversed)
      .reduce((sum, p) => sum + p.amount, 0);
    const totalNoticesSent = periods.reduce((sum, p) => sum + p.notices_sent, 0);

    return {
      openPeriodLabel: openPeriod ? openPeriod.label : 'None Open',
      totalReceivable,
      totalCollected,
      totalNoticesSent,
    };
  }, [records, payments, periods, selectedPeriodId, openPeriod]);

  const handleOpenAddPeriodModal = () => {
    setEditingPeriod(null);
    setPeriodFormError(null);
    const latest = periods[0];
    if (latest) {
      const nextMonth = latest.month === 12 ? 1 : latest.month + 1;
      const nextYear = latest.month === 12 ? latest.year + 1 : latest.year;
      setPeriodMonth(nextMonth);
      setPeriodYear(nextYear);
      setPeriodDueDate(`${nextYear}-${String(nextMonth).padStart(2, '0')}-25`);
    } else {
      setPeriodMonth(10);
      setPeriodYear(2026);
      setPeriodDueDate('2026-10-25');
    }
    setShowPeriodModal(true);
  };

  const handleOpenEditPeriodModal = (period: BillingPeriod) => {
    setEditingPeriod(period);
    setPeriodFormError(null);
    setPeriodMonth(period.month);
    setPeriodYear(period.year);
    setPeriodDueDate(period.due_date);
    setShowPeriodModal(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodFormError(null);

    if (!periodDueDate) {
      setPeriodFormError('Due date is required.');
      return;
    }

    const label = formatPeriodLabel(periodMonth, periodYear);

    if (!editingPeriod) {
      const existingOpen = periods.find((p) => p.status === 'open');
      if (existingOpen) {
        setPeriodFormError(`Close "${existingOpen.label}" first before adding a new open period.`);
        return;
      }

      const duplicate = periods.find((p) => p.month === periodMonth && p.year === periodYear);
      if (duplicate) {
        setPeriodFormError(`Period "${label}" already exists.`);
        return;
      }

      const newPeriod: BillingPeriod = {
        id: `period-${periodYear}-${String(periodMonth).padStart(2, '0')}`,
        month: periodMonth,
        year: periodYear,
        label,
        due_date: periodDueDate,
        status: 'open',
        records_count: 0,
        notices_sent: 0,
        created_at: formatNowTimestamp(),
        updated_at: formatNowTimestamp(),
      };

      const nextPeriods = [newPeriod, ...periods].sort(
        (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month)
      );
      updatePeriods(nextPeriods);
      setSelectedPeriodId(newPeriod.id);
      billingStore.appendAuditLog(`Added Billing Period "${label}" (Due: ${periodDueDate})`);
      showToastNotification(label, 'added as Open Period');
      setShowPeriodModal(false);
    } else {
      const hasRecords = editingPeriod.records_count > 0;
      const targetMonth = hasRecords ? editingPeriod.month : periodMonth;
      const targetYear = hasRecords ? editingPeriod.year : periodYear;
      const targetLabel = formatPeriodLabel(targetMonth, targetYear);

      const duplicate = periods.find(
        (p) => p.id !== editingPeriod.id && p.month === targetMonth && p.year === targetYear
      );
      if (duplicate) {
        setPeriodFormError(`Period "${targetLabel}" already exists.`);
        return;
      }

      const nextPeriods = periods.map((p) =>
        p.id === editingPeriod.id
          ? {
              ...p,
              month: targetMonth,
              year: targetYear,
              label: targetLabel,
              due_date: periodDueDate,
              updated_at: formatNowTimestamp(),
            }
          : p
      );
      updatePeriods(nextPeriods);

      if (targetLabel !== editingPeriod.label) {
        updateRecords(
          records.map((r) =>
            r.period_id === editingPeriod.id ? { ...r, period_label: targetLabel } : r
          )
        );
      }

      billingStore.appendAuditLog(`Updated Billing Period "${targetLabel}" (Due: ${periodDueDate})`);
      showToastNotification(targetLabel, 'updated');
      setShowPeriodModal(false);
      setEditingPeriod(null);
    }
  };

  const handleTogglePeriodStatus = (period: BillingPeriod) => {
    if (period.status === 'open') {
      const next = periods.map((p) =>
        p.id === period.id ? { ...p, status: 'closed' as const, updated_at: formatNowTimestamp() } : p
      );
      updatePeriods(next);
      billingStore.appendAuditLog(`Closed Billing Period "${period.label}"`);
      showToastNotification(period.label, 'closed');
    } else {
      const anotherOpen = periods.find((p) => p.status === 'open' && p.id !== period.id);
      if (anotherOpen) {
        showToastNotification('Cannot Reopen', `Close "${anotherOpen.label}" first.`);
        return;
      }
      const next = periods.map((p) =>
        p.id === period.id ? { ...p, status: 'open' as const, updated_at: formatNowTimestamp() } : p
      );
      updatePeriods(next);
      setSelectedPeriodId(period.id);
      billingStore.appendAuditLog(`Reopened Billing Period "${period.label}"`);
      showToastNotification(period.label, 'reopened');
    }
  };

  const handleConfirmDeletePeriod = () => {
    if (!periodToDelete || periodToDelete.records_count > 0) {
      setPeriodToDelete(null);
      return;
    }
    const deletedLabel = periodToDelete.label;
    const next = periods.filter((p) => p.id !== periodToDelete.id);
    updatePeriods(next);
    if (selectedPeriodId === periodToDelete.id) {
      setSelectedPeriodId(next[0]?.id || 'all');
    }
    billingStore.appendAuditLog(`Deleted Billing Period "${deletedLabel}"`);
    showToastNotification(deletedLabel, 'deleted');
    setPeriodToDelete(null);
  };

  const handleOpenUploadModal = () => {
    setUploadStep('dropzone');
    setSelectedCsvFileName('');
    setCsvUrlInput('');
    setUploadProgress(0);
    setPreviewValidRows([]);
    setPreviewInvalidRows([]);
    setShowUploadModal(true);
  };

  const handleCancelUploadProgress = () => {
    if (uploadTimerRef.current) {
      window.clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }
    setUploadStep('dropzone');
    setUploadProgress(0);
    setSelectedCsvFileName('');
  };

  const startSimulatedUploadAndParse = (csvText: string, fileName: string, source: 'file' | 'url') => {
    if (!openPeriod) return;

    setSelectedCsvFileName(fileName);
    setUploadSource(source);
    setUploadStep('uploading');
    setUploadProgress(15);

    if (uploadTimerRef.current) {
      window.clearInterval(uploadTimerRef.current);
    }

    let currentProg = 15;
    uploadTimerRef.current = window.setInterval(() => {
      currentProg += 30;
      if (currentProg >= 100) {
        if (uploadTimerRef.current) {
          window.clearInterval(uploadTimerRef.current);
          uploadTimerRef.current = null;
        }
        setUploadProgress(100);
        const { validRows, invalidRows } = billingStore.parseAndValidateCsv(
          csvText,
          openPeriod,
          directoryCustomers,
          records
        );
        setPreviewValidRows(validRows);
        setPreviewInvalidRows(invalidRows);
        setUploadStep('preview');
      } else {
        setUploadProgress(Math.min(75, currentProg));
      }
    }, 220);
  };

  const processCsvFileObject = (file: File) => {
    if (!openPeriod) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      startSimulatedUploadAndParse(content, file.name, 'file');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCsvFileObject(file);
    }
    e.target.value = '';
  };

  const handleDropCsv = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!openPeriod) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCsvFileObject(file);
    }
  };

  const generateSampleCsvText = (): string => {
    const due = openPeriod?.due_date || '2026-10-25';
    const unbilledActive = directoryCustomers.filter(
      (c) =>
        c.is_active &&
        !records.some((r) => r.period_id === openPeriod?.id && r.customer_id === c.id)
    );

    const rows: string[] = ['meter_number,current_balance,previous_balance,due_date'];

    if (unbilledActive.length > 0) {
      unbilledActive.forEach((c, idx) => {
        const curr = 350 + idx * 75;
        const prev = idx % 2 === 0 ? 150 : 0;
        rows.push(`${c.meter_number},${curr.toFixed(2)},${prev.toFixed(2)},${due}`);
      });
    } else {
      rows.push(`MTR-SIN-0006,400.00,450.00,${due}`);
      rows.push(`MTR-SIN-0007,380.00,120.00,${due}`);
    }

    rows.push(`MTR-SIN-0008,320.00,0.00,${due}`);
    rows.push(`MTR-SIN-9999,250.00,100.00,${due}`);
    return rows.join('\n');
  };

  const handleUploadFromUrl = () => {
    if (!openPeriod || !csvUrlInput.trim()) return;
    const urlParts = csvUrlInput.trim().split('/');
    const fileName = urlParts[urlParts.length - 1] || 'remote_billing_batch.csv';
    const sampleCsv = generateSampleCsvText();
    startSimulatedUploadAndParse(sampleCsv, fileName, 'url');
  };

  const handleLoadSampleCsv = () => {
    if (!openPeriod) return;
    const fileName = `siwass_${openPeriod.label.toLowerCase().replace(/\s+/g, '_')}_bills.csv`;
    const sampleCsv = generateSampleCsvText();
    startSimulatedUploadAndParse(sampleCsv, fileName, 'file');
  };

  const handleConfirmCsvImport = () => {
    if (!openPeriod || previewValidRows.length === 0) return;

    setIsConfirmingImport(true);
    setTimeout(() => {
      const nowStr = formatNowTimestamp();
      const newRecords: CustomerBalanceRecord[] = previewValidRows.map((row) => {
        const smsText = `SIWASS Billing Notice (${openPeriod.label}): Current: PHP ${row.current_balance.toFixed(
          2
        )}, Previous: PHP ${row.previous_balance.toFixed(
          2
        )}, Total: PHP ${row.total_balance.toFixed(2)}. Due: ${row.due_date}.`;

        return {
          id: `rec-${openPeriod.id}-${row.customer_id}-${Date.now()}`,
          period_id: openPeriod.id,
          period_label: openPeriod.label,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          account_number: row.account_number,
          meter_number: row.meter_number,
          barangay: row.barangay,
          address: row.address,
          mobile_number: row.mobile_number,
          is_active_customer: true,
          original_current_balance: row.current_balance,
          original_previous_balance: row.previous_balance,
          current_balance: row.current_balance,
          previous_balance: row.previous_balance,
          total_balance: row.total_balance,
          due_date: row.due_date,
          notice_sent: Boolean(row.mobile_number),
          sms_notice_preview: smsText,
          last_updated: nowStr,
        };
      });

      const smsCount = newRecords.filter((r) => r.notice_sent).length;
      const updatedRecords = [...newRecords, ...records];
      updateRecords(updatedRecords);

      const updatedPeriods = periods.map((p) => {
        if (p.id !== openPeriod.id) return p;
        const periodRecs = updatedRecords.filter((r) => r.period_id === p.id);
        const periodNotices = periodRecs.filter((r) => r.notice_sent).length;
        return {
          ...p,
          records_count: periodRecs.length,
          notices_sent: periodNotices,
          updated_at: nowStr,
        };
      });
      updatePeriods(updatedPeriods);

      setSelectedPeriodId(openPeriod.id);
      setActiveTab('records');

      billingStore.appendAuditLog(
        `Imported ${newRecords.length} record(s) into "${openPeriod.label}" and sent ${smsCount} notices`
      );

      showToastNotification(`${newRecords.length} Records Imported`, `Saved to ${openPeriod.label}`);

      setIsConfirmingImport(false);
      setShowUploadModal(false);
    }, 300);
  };

  const handleOpenRecordPaymentModal = (rec: CustomerBalanceRecord) => {
    setRecordForPayment(rec);
    setPaymentAmount(rec.total_balance > 0 ? String(rec.total_balance) : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentOrNumber(`OR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentRemark('');
    setPaymentError(null);
  };

  const paymentAllocationPreview = useMemo(() => {
    if (!recordForPayment) return null;
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      return {
        isValid: false,
        appliedToCurrent: 0,
        appliedToPrevious: 0,
        newCurrent: recordForPayment.current_balance,
        newPrevious: recordForPayment.previous_balance,
        newTotal: recordForPayment.total_balance,
      };
    }

    const appliedToCurrent = Math.min(amt, recordForPayment.current_balance);
    const remainder = Number((amt - appliedToCurrent).toFixed(2));
    const appliedToPrevious = Math.min(remainder, recordForPayment.previous_balance);

    const newCurrent = Number((recordForPayment.current_balance - appliedToCurrent).toFixed(2));
    const newPrevious = Number((recordForPayment.previous_balance - appliedToPrevious).toFixed(2));
    const newTotal = Number((newCurrent + newPrevious).toFixed(2));

    return {
      isValid: amt > 0 && amt <= recordForPayment.total_balance,
      appliedToCurrent,
      appliedToPrevious,
      newCurrent,
      newPrevious,
      newTotal,
    };
  }, [recordForPayment, paymentAmount]);

  const handleConfirmRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForPayment) return;

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Amount must be greater than zero.');
      return;
    }
    if (amt > recordForPayment.total_balance) {
      setPaymentError(
        `Amount cannot exceed total balance (₱${recordForPayment.total_balance.toFixed(2)}).`
      );
      return;
    }
    if (!paymentDate) {
      setPaymentError('Payment date is required.');
      return;
    }

    const appliedToCurrent = Number(Math.min(amt, recordForPayment.current_balance).toFixed(2));
    const remainder = Number((amt - appliedToCurrent).toFixed(2));
    const appliedToPrevious = Number(Math.min(remainder, recordForPayment.previous_balance).toFixed(2));

    const newCurrent = Number((recordForPayment.current_balance - appliedToCurrent).toFixed(2));
    const newPrevious = Number((recordForPayment.previous_balance - appliedToPrevious).toFixed(2));
    const newTotal = Number((newCurrent + newPrevious).toFixed(2));
    const nowStr = formatNowTimestamp();

    const updatedRecord: CustomerBalanceRecord = {
      ...recordForPayment,
      current_balance: newCurrent,
      previous_balance: newPrevious,
      total_balance: newTotal,
      last_updated: nowStr,
    };

    const nextRecords = records.map((r) => (r.id === recordForPayment.id ? updatedRecord : r));
    updateRecords(nextRecords);

    if (selectedRecordDetail?.id === recordForPayment.id) {
      setSelectedRecordDetail(updatedRecord);
    }

    const newPaymentEntry: BillingPaymentEntry = {
      id: `pay-${Date.now()}`,
      record_id: recordForPayment.id,
      period_id: recordForPayment.period_id,
      period_label: recordForPayment.period_label,
      customer_id: recordForPayment.customer_id,
      customer_name: recordForPayment.customer_name,
      account_number: recordForPayment.account_number,
      meter_number: recordForPayment.meter_number,
      type: 'payment',
      amount: Number(amt.toFixed(2)),
      applied_to_current: appliedToCurrent,
      applied_to_previous: appliedToPrevious,
      payment_date: paymentDate,
      or_number: paymentOrNumber.trim() || undefined,
      remark: paymentRemark.trim() || undefined,
      recorded_by: 'Sinacaban Water Administrator',
      created_at: nowStr,
      is_reversed: false,
    };

    updatePayments([newPaymentEntry, ...payments]);

    billingStore.appendAuditLog(
      `Recorded payment of ₱${amt.toFixed(2)} for ${recordForPayment.customer_name} (${recordForPayment.account_number}) on ${paymentDate}`
    );

    showToastNotification(
      `Payment ₱${amt.toFixed(2)}`,
      `Recorded for ${recordForPayment.customer_name}`
    );

    setRecordForPayment(null);
  };

  const handleConfirmReversePayment = () => {
    if (!paymentToReverse || paymentToReverse.is_reversed || paymentToReverse.type === 'reversal') {
      setPaymentToReverse(null);
      return;
    }

    const targetRecord = records.find((r) => r.id === paymentToReverse.record_id);
    const nowStr = formatNowTimestamp();
    const reversalId = `rev-${Date.now()}`;

    if (targetRecord) {
      const restoredCurrent = Number(
        (targetRecord.current_balance + paymentToReverse.applied_to_current).toFixed(2)
      );
      const restoredPrevious = Number(
        (targetRecord.previous_balance + paymentToReverse.applied_to_previous).toFixed(2)
      );
      const restoredTotal = Number((restoredCurrent + restoredPrevious).toFixed(2));

      const updatedRecord: CustomerBalanceRecord = {
        ...targetRecord,
        current_balance: restoredCurrent,
        previous_balance: restoredPrevious,
        total_balance: restoredTotal,
        last_updated: nowStr,
      };

      const nextRecords = records.map((r) => (r.id === targetRecord.id ? updatedRecord : r));
      updateRecords(nextRecords);

      if (selectedRecordDetail?.id === targetRecord.id) {
        setSelectedRecordDetail(updatedRecord);
      }
    }

    const reversalEntry: BillingPaymentEntry = {
      id: reversalId,
      record_id: paymentToReverse.record_id,
      period_id: paymentToReverse.period_id,
      period_label: paymentToReverse.period_label,
      customer_id: paymentToReverse.customer_id,
      customer_name: paymentToReverse.customer_name,
      account_number: paymentToReverse.account_number,
      meter_number: paymentToReverse.meter_number,
      type: 'reversal',
      amount: paymentToReverse.amount,
      applied_to_current: paymentToReverse.applied_to_current,
      applied_to_previous: paymentToReverse.applied_to_previous,
      payment_date: new Date().toISOString().slice(0, 10),
      or_number: paymentToReverse.or_number ? `REV-${paymentToReverse.or_number}` : undefined,
      remark: `Reversal of ${paymentToReverse.or_number || paymentToReverse.id}`,
      recorded_by: 'Sinacaban Water Administrator',
      created_at: nowStr,
      reverses_entry_id: paymentToReverse.id,
    };

    const nextPayments = [
      reversalEntry,
      ...payments.map((p) =>
        p.id === paymentToReverse.id
          ? { ...p, is_reversed: true, reversed_by_entry_id: reversalId }
          : p
      ),
    ];
    updatePayments(nextPayments);

    billingStore.appendAuditLog(
      `Reversed payment of ₱${paymentToReverse.amount.toFixed(2)} for ${paymentToReverse.customer_name}`
    );

    showToastNotification(
      `Payment Reversed`,
      `Restored ₱${paymentToReverse.amount.toFixed(2)} for ${paymentToReverse.customer_name}`
    );

    setPaymentToReverse(null);
  };

  const getAvatarInitials = (name?: string) => {
    if (!name) return 'AQ';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const totalItemsCount =
    activeTab === 'records'
      ? filteredRecords.length
      : activeTab === 'periods'
      ? periods.length
      : filteredPayments.length;

  const totalPages = Math.max(1, Math.ceil(totalItemsCount / ITEMS_PER_PAGE));

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const paginatedPeriods = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return periods.slice(start, start + ITEMS_PER_PAGE);
  }, [periods, currentPage]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const isModalOpen = Boolean(
    showUploadModal ||
      showPeriodModal ||
      periodToDelete ||
      selectedRecordDetail ||
      recordForPayment ||
      paymentToReverse
  );

  const ringSize = 84;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (uploadProgress / 100) * ringCircumference;

  return (
    <AdminLayout currentPath="/admin/billing" onNavigate={(path) => navigate(path)}>
      <div
        className={`space-y-5 text-[14px] transition-all duration-300 ${
          isModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Header */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Billing
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleOpenAddPeriodModal}
              leftIcon={<IconCalendar size={15} />}
              className="shrink-0"
            >
              Add Period
            </Button>

            <Button
              variant="primary"
              onClick={handleOpenUploadModal}
              leftIcon={<IconUpload size={15} />}
              className="shrink-0"
            >
              Upload CSV
            </Button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div
            onClick={() => {
              if (openPeriod) {
                setSelectedPeriodId(openPeriod.id);
                setActiveTab('records');
              } else {
                setActiveTab('periods');
              }
            }}
            className="bg-brand-blue rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconCalendar size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                {metrics.openPeriodLabel}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Open Period
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('records');
              setBalanceFilter('unpaid');
            }}
            className="bg-urgency-high rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconReceipt size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                ₱{metrics.totalReceivable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Total Receivable
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('payments')}
            className="bg-urgency-low rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconCash size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                ₱{metrics.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Payments Recorded
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('periods')}
            className="bg-purple-600 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconBellRinging size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {metrics.totalNoticesSent}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Notices Sent
              </div>
            </div>
          </div>
        </div>

        {/* Control & Filter Card */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-md border border-black/10">
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'records'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Customer Balances</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'records' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'
                  }`}
                >
                  {filteredRecords.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('periods')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'periods'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Billing Periods</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'periods' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'
                  }`}
                >
                  {periods.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Payment History</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'
                  }`}
                >
                  {payments.length}
                </span>
              </button>
            </div>

            {activeTab === 'records' && (
              <div className="flex items-center gap-1.5 text-xs">
                {(['all', 'unpaid', 'settled'] as const).map((bf) => (
                  <button
                    key={bf}
                    onClick={() => setBalanceFilter(bf)}
                    className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition-all cursor-pointer ${
                      balanceFilter === bf
                        ? bf === 'settled'
                          ? 'bg-urgency-low text-white shadow-xs'
                          : bf === 'unpaid'
                          ? 'bg-urgency-medium text-white shadow-xs'
                          : 'bg-brand-blue text-white shadow-xs'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    {bf === 'all' ? 'All' : bf === 'unpaid' ? 'Unpaid' : 'Settled'}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'periods' && (
              <div className="flex items-center gap-2 text-xs">
                {openPeriod ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-urgency-low/15 text-urgency-low font-bold">
                    <IconLockOpen size={13} />
                    <span>Open: {openPeriod.label}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">
                    <IconLock size={13} />
                    <span>No Open Period</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {activeTab !== 'periods' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search customer, meter #, or account #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                />
                <IconSearch size={14} className="absolute left-2.5 top-2.5 text-black/40" />
              </div>

              <div>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  aria-label="Filter by Billing Period"
                  className="w-full px-2.5 py-1.5 text-xs bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue font-semibold"
                >
                  <option value="all">All Periods</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.status === 'open' ? 'Open' : 'Closed'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  aria-label="Filter by Barangay"
                  className="w-full px-2.5 py-1.5 text-xs bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                >
                  <option value="all">All Barangays</option>
                  {(barangays.length > 0
                    ? barangays.map((b) => b.name)
                    : [
                        'Poblacion',
                        'San Isidro Alto',
                        'Cagay-anon',
                        'Colupan Bajo',
                        'Sinonoc',
                        'Libertad Bajo',
                        'Camanse',
                        'Tipan',
                      ]
                  ).map((bgName) => (
                    <option key={bgName} value={bgName}>
                      {bgName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* TAB 1: CUSTOMER BALANCES */}
        {activeTab === 'records' && (
          <Card className="p-0 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-black/40 text-xs">Loading...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<IconReceipt size={36} className="text-black/30" />}
                  title="No records found"
                  description="No billing records match the selected filter."
                  actionLabel={openPeriod ? 'Upload CSV' : 'Billing Periods'}
                  onAction={() => (openPeriod ? handleOpenUploadModal() : setActiveTab('periods'))}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/5 text-black/70 uppercase tracking-wider font-bold select-none">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Current</th>
                      <th className="py-2.5 px-3">Previous</th>
                      <th className="py-2.5 px-3">Total Balance</th>
                      <th className="py-2.5 px-3">Updated</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {paginatedRecords.map((rec) => {
                      const isMostRecent =
                        mostRecentRecordIdByCustomer.get(rec.customer_id) === rec.id;
                      const isSettled = rec.total_balance <= 0;

                      return (
                        <tr
                          key={rec.id}
                          onClick={() => setSelectedRecordDetail(rec)}
                          className="hover:bg-black/5 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-brand-blue/15 text-brand-blue border border-brand-blue/30 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {getAvatarInitials(rec.customer_name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-black group-hover:text-brand-blue transition-colors truncate flex items-center gap-1.5">
                                  <span>{rec.customer_name}</span>
                                  <span className="font-mono text-[11px] font-bold text-brand-blue bg-brand-blue/10 px-1.5 py-0.2 rounded border border-brand-blue/20">
                                    {rec.meter_number}
                                  </span>
                                </div>
                                <div className="text-[11px] text-black/50 truncate">
                                  {rec.account_number} · {rec.barangay}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-black">{rec.period_label}</div>
                            <div className="text-[11px] text-black/50">Due {rec.due_date}</div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-black">
                            ₱{rec.current_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3 font-semibold text-black/75">
                            ₱{rec.previous_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-extrabold text-sm ${
                                  isSettled ? 'text-urgency-low' : 'text-urgency-high'
                                }`}
                              >
                                ₱{rec.total_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </span>
                              <Badge
                                variant={isSettled ? 'blue' : 'outline'}
                                className={
                                  isSettled
                                    ? 'bg-urgency-low text-white border-urgency-low font-bold'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                }
                              >
                                {isSettled ? 'SETTLED' : 'UNPAID'}
                              </Badge>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-black/60 font-medium">
                            {rec.last_updated}
                          </td>

                          <td
                            className="py-3 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              {isMostRecent && rec.total_balance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPaymentModal(rec)}
                                  className="px-2.5 py-1 text-xs font-bold rounded bg-urgency-low hover:bg-emerald-700 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <IconCash size={13} />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedRecordDetail(rec)}
                                className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-black/40 text-black hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <IconEye size={13} className="text-brand-blue" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredRecords.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-black/10 bg-white">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/20 text-xs font-bold text-black/70 hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <IconChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-black/70 hover:bg-black/5 hover:text-black'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/20 text-xs font-bold text-black/70 hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <IconChevronRight size={14} />
                </button>
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: BILLING PERIODS */}
        {activeTab === 'periods' && (
          <Card className="p-0 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/10 bg-black/5 text-black/70 uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Records</th>
                    <th className="py-2.5 px-3">Notices</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {paginatedPeriods.map((period) => {
                    const isOpen = period.status === 'open';
                    const liveRecCount = records.filter((r) => r.period_id === period.id).length;
                    const liveNoticesCount = records.filter(
                      (r) => r.period_id === period.id && r.notice_sent
                    ).length;
                    const canReopen = !isOpen && !openPeriod;
                    const canDelete = liveRecCount === 0;

                    return (
                      <tr
                        key={period.id}
                        onClick={() => {
                          setSelectedPeriodId(period.id);
                          setActiveTab('records');
                        }}
                        className="hover:bg-black/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded flex items-center justify-center font-bold shrink-0 ${
                                isOpen
                                  ? 'bg-urgency-low/15 text-urgency-low border border-urgency-low/30'
                                  : 'bg-black/5 text-black/60 border border-black/15'
                              }`}
                            >
                              <IconCalendar size={16} />
                            </div>
                            <span className="font-extrabold text-black group-hover:text-brand-blue transition-colors">
                              {period.label}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-black">{period.due_date}</td>

                        <td className="py-3 px-3">
                          <Badge
                            variant={isOpen ? 'blue' : 'outline'}
                            className={
                              isOpen
                                ? 'bg-urgency-low text-white border-urgency-low font-bold'
                                : 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                            }
                          >
                            {isOpen ? 'OPEN' : 'CLOSED'}
                          </Badge>
                        </td>

                        <td className="py-3 px-3 font-bold text-black">{liveRecCount}</td>

                        <td className="py-3 px-3 font-bold text-brand-blue">{liveNoticesCount}</td>

                        <td
                          className="py-3 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPeriodId(period.id);
                                setActiveTab('records');
                              }}
                              className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-black/40 text-black hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <IconEye size={13} className="text-brand-blue" />
                              <span>Records</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEditPeriodModal({ ...period, records_count: liveRecCount })
                              }
                              className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-black/40 text-black hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <IconPencil size={13} className="text-brand-blue" />
                              <span>Edit</span>
                            </button>

                            {isOpen ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePeriodStatus(period)}
                                className="px-2.5 py-1 text-xs font-bold rounded bg-urgency-medium hover:bg-amber-600 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <IconLock size={13} />
                                <span>Close</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePeriodStatus(period)}
                                disabled={!canReopen}
                                className="px-2.5 py-1 text-xs font-bold rounded border border-black/20 text-black hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <IconLockOpen size={13} className="text-urgency-low" />
                                <span>Reopen</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setPeriodToDelete({ ...period, records_count: liveRecCount })
                              }
                              disabled={!canDelete}
                              className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-urgency-high text-urgency-high hover:bg-red-50 disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <IconTrash size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: PAYMENT HISTORY */}
        {activeTab === 'payments' && (
          <Card className="p-0 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<IconCash size={36} className="text-black/30" />}
                  title="No payments found"
                  description="No payment records match the selected filter."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/5 text-black/70 uppercase tracking-wider font-bold select-none">
                      <th className="py-2.5 px-3">Date / OR #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Applied</th>
                      <th className="py-2.5 px-3">Remark</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {paginatedPayments.map((pay) => {
                      const isReversal = pay.type === 'reversal';

                      return (
                        <tr
                          key={pay.id}
                          className={`hover:bg-black/5 transition-colors ${
                            isReversal ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-black">{pay.payment_date}</div>
                            <div className="font-mono text-[11px] text-brand-blue">
                              {pay.or_number || pay.id}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-extrabold text-black">{pay.customer_name}</div>
                            <div className="text-[11px] text-black/50">{pay.meter_number}</div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-black">{pay.period_label}</td>

                          <td className="py-3 px-3">
                            {isReversal ? (
                              <Badge
                                variant="outline"
                                className="bg-urgency-high text-white border-urgency-high font-bold"
                              >
                                REVERSAL
                              </Badge>
                            ) : pay.is_reversed ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-900 border-amber-300 font-bold"
                              >
                                REVERSED
                              </Badge>
                            ) : (
                              <Badge
                                variant="blue"
                                className="bg-urgency-low text-white border-urgency-low font-bold"
                              >
                                PAYMENT
                              </Badge>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`font-extrabold text-sm ${
                                isReversal
                                  ? 'text-urgency-high'
                                  : pay.is_reversed
                                  ? 'text-black/45 line-through'
                                  : 'text-urgency-low'
                              }`}
                            >
                              {isReversal ? '+' : '₱'}
                              {pay.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-[11px] text-black/75">
                            Curr: <strong>₱{pay.applied_to_current.toFixed(2)}</strong> · Prev:{' '}
                            <strong>₱{pay.applied_to_previous.toFixed(2)}</strong>
                          </td>

                          <td className="py-3 px-3 text-black/70 max-w-[200px] truncate">
                            {pay.remark || '—'}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {!isReversal && !pay.is_reversed ? (
                              <button
                                type="button"
                                onClick={() => setPaymentToReverse(pay)}
                                className="px-2.5 py-1 text-xs font-bold rounded border border-urgency-high/40 text-urgency-high hover:bg-red-50 transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <IconRotate2 size={13} />
                                <span>Reverse</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-black/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

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

      {/* MODAL 1: UPLOAD CSV MODAL (Exact Match to Reference Photo) */}
      {showUploadModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => {
              if (uploadStep !== 'uploading') setShowUploadModal(false);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full ${
                uploadStep === 'preview' ? 'max-w-3xl' : 'max-w-[440px]'
              } bg-white rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-black/15 overflow-hidden my-auto transition-all duration-200`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white">
                <h3 className="text-base font-bold text-black tracking-tight">Upload CSV</h3>
                <button
                  onClick={() => {
                    handleCancelUploadProgress();
                    setShowUploadModal(false);
                  }}
                  aria-label="Close Upload CSV Modal"
                  className="p-1 text-black/60 hover:text-black transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {!openPeriod ? (
                <div className="p-6 space-y-4 text-xs">
                  <div className="p-3.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-2.5">
                    <IconAlertTriangle size={18} className="text-urgency-medium shrink-0" />
                    <span className="font-bold text-black">
                      No open billing period. Add or reopen a period first.
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-black/15 rounded-md p-8 text-center bg-slate-50/50 opacity-50 select-none pointer-events-none">
                    <div className="w-12 h-14 mx-auto mb-3 relative flex items-center justify-center">
                      <svg viewBox="0 0 48 56" className="w-11 h-13 fill-slate-300">
                        <path d="M6 0h24l14 14v36a6 6 0 01-6 6H6a6 6 0 01-6-6V6a6 6 0 016-6z" />
                        <path d="M30 0v14h14L30 0z" className="fill-slate-400/50" />
                        <rect x="10" y="22" width="16" height="3" rx="1.5" fill="white" />
                        <rect x="10" y="29" width="22" height="3" rx="1.5" fill="white" />
                        <rect x="10" y="36" width="14" height="3" rx="1.5" fill="white" />
                      </svg>
                      <span className="w-5 h-5 rounded-full bg-slate-400 text-white flex items-center justify-center absolute -bottom-0.5 -right-0.5 text-xs font-bold shadow-xs">
                        +
                      </span>
                    </div>
                    <div className="text-sm font-bold text-black/50">
                      Select a CSV file to upload
                    </div>
                    <div className="text-xs text-black/35 mt-0.5">
                      or drag and drop it here
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowUploadModal(false);
                        handleOpenAddPeriodModal();
                      }}
                    >
                      Add Period
                    </Button>
                  </div>
                </div>
              ) : uploadStep !== 'preview' ? (
                <div className="p-6 space-y-5 text-xs">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="modalCsvInput"
                  />

                  {uploadStep === 'uploading' && uploadSource === 'file' ? (
                    <div className="border-2 border-dashed border-black/15 rounded-md py-10 px-6 text-center bg-slate-50/40 flex flex-col items-center justify-center space-y-3">
                      <div className="relative w-[84px] h-[84px] flex items-center justify-center">
                        <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={ringRadius}
                            stroke="rgba(0,0,0,0.08)"
                            strokeWidth={ringStroke}
                            fill="transparent"
                          />
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={ringRadius}
                            stroke="var(--color-brand-blue)"
                            strokeWidth={ringStroke}
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringDashOffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-200"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-black">
                          {uploadProgress}%
                        </span>
                      </div>

                      <div className="text-sm font-bold text-black">Uploading file...</div>

                      <button
                        type="button"
                        onClick={handleCancelUploadProgress}
                        className="px-4 py-1.5 bg-white border border-black/20 rounded text-xs font-semibold text-black/75 hover:text-black hover:border-black/40 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDropCsv}
                      onClick={() => {
                        if (uploadStep !== 'uploading') {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`border-2 border-dashed rounded-md py-10 px-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        uploadStep === 'uploading'
                          ? 'border-black/15 bg-slate-50/40 opacity-50 pointer-events-none'
                          : isDragOver
                          ? 'border-brand-blue bg-brand-blue/5'
                          : 'border-black/20 hover:border-brand-blue bg-slate-50/40 hover:bg-brand-blue/5'
                      }`}
                    >
                      <div className="w-12 h-14 mx-auto mb-3 relative flex items-center justify-center">
                        <svg
                          viewBox="0 0 48 56"
                          className={`w-11 h-13 transition-colors ${
                            isDragOver ? 'fill-brand-blue/30' : 'fill-slate-300/80'
                          }`}
                        >
                          <path d="M6 0h24l14 14v36a6 6 0 01-6 6H6a6 6 0 01-6-6V6a6 6 0 016-6z" />
                          <path
                            d="M30 0v14h14L30 0z"
                            className={isDragOver ? 'fill-brand-blue/50' : 'fill-slate-400/60'}
                          />
                          <rect x="10" y="22" width="16" height="3" rx="1.5" fill="white" />
                          <rect x="10" y="29" width="22" height="3" rx="1.5" fill="white" />
                          <rect x="10" y="36" width="14" height="3" rx="1.5" fill="white" />
                        </svg>
                        <span
                          className={`w-5 h-5 rounded-full text-white flex items-center justify-center absolute -bottom-0.5 -right-0.5 text-xs font-bold shadow-xs transition-colors ${
                            isDragOver ? 'bg-brand-blue' : 'bg-slate-900'
                          }`}
                        >
                          +
                        </span>
                      </div>

                      <div
                        className={`text-sm font-bold transition-colors ${
                          isDragOver ? 'text-brand-blue' : 'text-black hover:text-brand-blue'
                        }`}
                      >
                        Select a CSV file to upload
                      </div>
                      <div className="text-xs text-black/45 mt-1">or drag and drop it here</div>
                    </div>
                  )}

                  {/* "Or upload from a URL" Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-black">
                      Or upload from a URL
                    </label>
                    <div className="flex items-stretch border border-black/20 rounded-md overflow-hidden bg-slate-50/50 focus-within:border-brand-blue focus-within:bg-white transition-colors">
                      <input
                        type="text"
                        placeholder="Add file URL"
                        value={csvUrlInput}
                        disabled={uploadStep === 'uploading'}
                        onChange={(e) => setCsvUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs text-black bg-transparent outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        disabled={!csvUrlInput.trim() || uploadStep === 'uploading'}
                        onClick={handleUploadFromUrl}
                        className={`px-4 py-1.5 m-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                          csvUrlInput.trim() && uploadStep !== 'uploading'
                            ? 'border-brand-blue text-brand-blue bg-white hover:bg-brand-blue hover:text-white'
                            : 'border-black/15 text-black/40 bg-black/5 cursor-not-allowed'
                        }`}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  {uploadStep === 'uploading' && uploadSource === 'url' && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-bold text-black w-9">{uploadProgress}%</span>
                      <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelUploadProgress}
                        className="px-3 py-1 bg-white border border-black/20 rounded text-xs font-semibold text-black/75 hover:text-black cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-black/10 text-[11px] text-black/50">
                    <span>Period: {openPeriod.label}</span>
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="text-brand-blue font-bold hover:underline cursor-pointer"
                    >
                      Load sample CSV
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: VALIDATION PREVIEW */
                <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                  <div className="p-3 rounded-md bg-black/5 border border-black/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-extrabold text-black flex items-center gap-2">
                      <IconFileSpreadsheet size={16} className="text-brand-blue" />
                      <span>
                        {openPeriod.label} · {selectedCsvFileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="blue"
                        className="bg-urgency-low text-white border-urgency-low font-bold"
                      >
                        {previewValidRows.length} Valid
                      </Badge>
                      {previewInvalidRows.length > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-urgency-high text-white border-urgency-high font-bold"
                        >
                          {previewInvalidRows.length} Skipped
                        </Badge>
                      )}
                    </div>
                  </div>

                  {previewValidRows.length === 0 ? (
                    <div className="p-4 border border-black/15 rounded text-center text-black/50">
                      No valid rows found.
                    </div>
                  ) : (
                    <div className="border border-black/15 rounded overflow-x-auto max-h-52 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-black/5 border-b border-black/10 text-black/70 font-bold">
                          <tr>
                            <th className="py-2 px-2.5">Row</th>
                            <th className="py-2 px-2.5">Meter #</th>
                            <th className="py-2 px-2.5">Customer</th>
                            <th className="py-2 px-2.5">Current</th>
                            <th className="py-2 px-2.5">Previous</th>
                            <th className="py-2 px-2.5">Total</th>
                            <th className="py-2 px-2.5">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10">
                          {previewValidRows.map((r) => (
                            <tr key={r.row_number} className="hover:bg-black/5">
                              <td className="py-2 px-2.5 text-black/50">#{r.row_number}</td>
                              <td className="py-2 px-2.5 font-mono font-bold text-brand-blue">
                                {r.meter_number}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-black">
                                {r.customer_name}
                              </td>
                              <td className="py-2 px-2.5 font-semibold text-black">
                                ₱{r.current_balance.toFixed(2)}
                              </td>
                              <td className="py-2 px-2.5 font-semibold text-black/70">
                                ₱{r.previous_balance.toFixed(2)}
                              </td>
                              <td className="py-2 px-2.5 font-extrabold text-brand-blue">
                                ₱{r.total_balance.toFixed(2)}
                              </td>
                              <td className="py-2 px-2.5 text-black">{r.due_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {previewInvalidRows.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-urgency-high uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <IconAlertCircle size={14} />
                        <span>Skipped Rows ({previewInvalidRows.length})</span>
                      </div>
                      <div className="border border-urgency-high/30 bg-red-50/40 rounded p-3 space-y-1.5 max-h-32 overflow-y-auto">
                        {previewInvalidRows.map((inv, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-black">
                            <span className="font-mono font-bold text-urgency-high shrink-0">
                              Row {inv.row_number} ({inv.raw_meter_number}):
                            </span>
                            <span className="text-black/80">{inv.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-black/10">
                    <Button variant="secondary" onClick={() => setUploadStep('dropzone')}>
                      Back
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        disabled={previewValidRows.length === 0 || isConfirmingImport}
                        onClick={handleConfirmCsvImport}
                        leftIcon={<IconCheck size={15} />}
                      >
                        {isConfirmingImport
                          ? 'Importing...'
                          : `Confirm Import (${previewValidRows.length})`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: ADD / EDIT BILLING PERIOD */}
      {showPeriodModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowPeriodModal(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <IconCalendar size={18} className="text-brand-blue" />
                  <h3 className="text-base font-bold text-black">
                    {editingPeriod ? `Edit ${editingPeriod.label}` : 'Add Billing Period'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPeriodModal(false)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {periodFormError && (
                <div className="p-2.5 rounded bg-red-50 border border-urgency-high/40 text-xs text-urgency-high font-semibold flex items-center gap-2">
                  <IconAlertCircle size={15} className="shrink-0" />
                  <span>{periodFormError}</span>
                </div>
              )}

              <form onSubmit={handleSavePeriod} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">Month</label>
                    <select
                      value={periodMonth}
                      disabled={Boolean(editingPeriod && editingPeriod.records_count > 0)}
                      onChange={(e) => setPeriodMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue disabled:bg-black/5 disabled:text-black/45"
                    >
                      {MONTH_NAMES.map((mName, idx) => (
                        <option key={mName} value={idx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Year</label>
                    <input
                      type="number"
                      min={2020}
                      max={2035}
                      required
                      disabled={Boolean(editingPeriod && editingPeriod.records_count > 0)}
                      value={periodYear}
                      onChange={(e) => setPeriodYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue disabled:bg-black/5 disabled:text-black/45"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={periodDueDate}
                    onChange={(e) => setPeriodDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowPeriodModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {editingPeriod ? 'Save' : 'Add Period'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 3: DELETE BILLING PERIOD */}
      {periodToDelete &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setPeriodToDelete(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2 text-urgency-high">
                  <IconTrash size={18} />
                  <h3 className="text-base font-bold text-black">Delete Period</h3>
                </div>
                <button
                  onClick={() => setPeriodToDelete(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <p className="text-black/80">
                Delete empty billing period <strong>{periodToDelete.label}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <Button variant="secondary" onClick={() => setPeriodToDelete(null)}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePeriod}
                  className="px-4 py-2 rounded bg-urgency-high hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 4: CUSTOMER BALANCE RECORD DETAILS */}
      {selectedRecordDetail &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedRecordDetail(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white rounded-md shadow-2xl border border-black/15 overflow-hidden my-auto max-h-[90vh] flex flex-col text-xs"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/10 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2">
                  <IconReceipt size={18} className="text-brand-blue" />
                  <h3 className="text-base font-extrabold text-black tracking-tight">
                    {selectedRecordDetail.customer_name} · {selectedRecordDetail.period_label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRecordDetail(null)}
                  className="p-1 rounded-md hover:bg-black/5 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="p-3.5 bg-black/5 rounded-md border border-black/10 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-black">
                      {selectedRecordDetail.address}, {selectedRecordDetail.barangay}
                    </div>
                    <div className="text-[11px] text-black/50 mt-0.5">
                      Updated: {selectedRecordDetail.last_updated}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded border border-brand-blue/20">
                      {selectedRecordDetail.meter_number}
                    </span>
                    <span className="font-mono text-xs font-semibold text-black/60">
                      {selectedRecordDetail.account_number}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-md border border-black/15 bg-white">
                    <div className="text-[10px] font-bold text-black/55 uppercase">
                      Current Balance
                    </div>
                    <div className="text-lg font-extrabold text-black mt-1">
                      ₱{selectedRecordDetail.current_balance.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-black/50 mt-0.5">
                      Due {selectedRecordDetail.due_date}
                    </div>
                  </div>

                  <div className="p-3 rounded-md border border-black/15 bg-white">
                    <div className="text-[10px] font-bold text-black/55 uppercase">
                      Previous Balance
                    </div>
                    <div className="text-lg font-extrabold text-black mt-1">
                      ₱{selectedRecordDetail.previous_balance.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-md border-2 border-brand-blue bg-brand-blue/5">
                    <div className="text-[10px] font-bold text-brand-blue uppercase">
                      Total Balance
                    </div>
                    <div className="text-xl font-black text-brand-blue mt-1">
                      ₱{selectedRecordDetail.total_balance.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-black/60">
                    Payment History
                  </div>
                  {(() => {
                    const recPayments = payments.filter(
                      (p) => p.record_id === selectedRecordDetail.id
                    );
                    if (recPayments.length === 0) {
                      return (
                        <div className="p-3 border border-black/10 rounded text-center text-black/45">
                          No payments recorded.
                        </div>
                      );
                    }
                    return (
                      <div className="border border-black/15 rounded overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-black/5 border-b border-black/10 text-black/70 font-bold">
                            <tr>
                              <th className="py-2 px-2.5">Date / OR #</th>
                              <th className="py-2 px-2.5">Type</th>
                              <th className="py-2 px-2.5">Amount</th>
                              <th className="py-2 px-2.5">Applied</th>
                              <th className="py-2 px-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10">
                            {recPayments.map((p) => (
                              <tr key={p.id}>
                                <td className="py-2 px-2.5">
                                  <div className="font-bold text-black">{p.payment_date}</div>
                                  <div className="text-[10px] font-mono text-black/50">
                                    {p.or_number || p.id}
                                  </div>
                                </td>
                                <td className="py-2 px-2.5">
                                  {p.type === 'reversal' ? (
                                    <span className="font-bold text-urgency-high">Reversal</span>
                                  ) : p.is_reversed ? (
                                    <span className="font-bold text-amber-700">Reversed</span>
                                  ) : (
                                    <span className="font-bold text-urgency-low">Payment</span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 font-bold">₱{p.amount.toFixed(2)}</td>
                                <td className="py-2 px-2.5 text-[11px] text-black/70">
                                  Curr: ₱{p.applied_to_current.toFixed(2)} · Prev: ₱
                                  {p.applied_to_previous.toFixed(2)}
                                </td>
                                <td className="py-2 px-2.5 text-right">
                                  {p.type === 'payment' && !p.is_reversed ? (
                                    <button
                                      type="button"
                                      onClick={() => setPaymentToReverse(p)}
                                      className="px-2 py-0.5 text-[11px] font-bold rounded border border-urgency-high/40 text-urgency-high hover:bg-red-50 cursor-pointer"
                                    >
                                      Reverse
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-black/40">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="border-t border-black/10 p-3.5 bg-slate-50/70 flex items-center justify-end gap-2 shrink-0">
                <Button variant="secondary" onClick={() => setSelectedRecordDetail(null)}>
                  Close
                </Button>
                {mostRecentRecordIdByCustomer.get(selectedRecordDetail.customer_id) ===
                  selectedRecordDetail.id &&
                  selectedRecordDetail.total_balance > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => handleOpenRecordPaymentModal(selectedRecordDetail)}
                      leftIcon={<IconCash size={15} />}
                    >
                      Record Payment
                    </Button>
                  )}
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 5: RECORD PAYMENT */}
      {recordForPayment &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setRecordForPayment(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <IconCash size={18} className="text-urgency-low" />
                  <h3 className="text-base font-bold text-black">
                    Record Payment · {recordForPayment.customer_name}
                  </h3>
                </div>
                <button
                  onClick={() => setRecordForPayment(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-black/5 border border-black/10 text-center">
                <div>
                  <div className="text-[10px] font-bold text-black/55 uppercase">Current</div>
                  <div className="font-extrabold text-black text-sm">
                    ₱{recordForPayment.current_balance.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-black/55 uppercase">Previous</div>
                  <div className="font-extrabold text-black text-sm">
                    ₱{recordForPayment.previous_balance.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-brand-blue uppercase">Total Due</div>
                  <div className="font-black text-brand-blue text-sm">
                    ₱{recordForPayment.total_balance.toFixed(2)}
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="p-2.5 rounded bg-red-50 border border-urgency-high/40 text-urgency-high font-semibold flex items-center gap-2">
                  <IconAlertCircle size={15} className="shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmRecordPayment} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">Amount (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={recordForPayment.total_balance}
                      required
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setPaymentError(null);
                      }}
                      className="w-full px-3 py-2 bg-white text-black font-bold border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-black mb-1">OR #</label>
                    <input
                      type="text"
                      placeholder="OR-2026-0001"
                      value={paymentOrNumber}
                      onChange={(e) => setPaymentOrNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Remark</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={paymentRemark}
                      onChange={(e) => setPaymentRemark(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {paymentAllocationPreview && Number(paymentAmount) > 0 && (
                  <div className="p-2.5 rounded bg-urgency-low/10 border border-urgency-low/30 flex items-center justify-between text-[11px]">
                    <span>
                      Current: <strong>-₱{paymentAllocationPreview.appliedToCurrent.toFixed(2)}</strong> · Prev:{' '}
                      <strong>-₱{paymentAllocationPreview.appliedToPrevious.toFixed(2)}</strong>
                    </span>
                    <span className="font-extrabold text-brand-blue">
                      Remaining: ₱{paymentAllocationPreview.newTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setRecordForPayment(null)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" leftIcon={<IconCheck size={15} />}>
                    Confirm Payment
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}

      {/* MODAL 6: REVERSE PAYMENT */}
      {paymentToReverse &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={() => setPaymentToReverse(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2 text-urgency-high">
                  <IconRotate2 size={18} />
                  <h3 className="text-base font-bold text-black">Reverse Payment</h3>
                </div>
                <button
                  onClick={() => setPaymentToReverse(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-2 text-black/80">
                <p>
                  Reverse <strong>{paymentToReverse.or_number || paymentToReverse.id}</strong> (
                  <strong>₱{paymentToReverse.amount.toFixed(2)}</strong>) for{' '}
                  <strong>{paymentToReverse.customer_name}</strong>?
                </p>
                <div className="p-2.5 rounded bg-black/5 border border-black/10 flex justify-between">
                  <span>
                    Current: <strong>+₱{paymentToReverse.applied_to_current.toFixed(2)}</strong>
                  </span>
                  <span>
                    Previous: <strong>+₱{paymentToReverse.applied_to_previous.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <Button variant="secondary" onClick={() => setPaymentToReverse(null)}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmReversePayment}
                  className="px-4 py-2 rounded bg-urgency-high hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Confirm Reversal
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}
    </AdminLayout>
  );
}
