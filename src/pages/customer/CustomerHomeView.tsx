import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { AdvisoryBanner } from '../../components/molecules/AdvisoryBanner';
import { requestsApi, billingApi, authApi, interruptionsApi } from '../../api';
import type { ServiceRequest, Billing, User, WaterInterruption } from '../../types';
import { FIXED_ISSUE_TYPES, maintenanceStore } from '../../services/maintenanceStore';
import { advisoriesStore } from '../../services/advisoriesStore';
import {
  billingStore,
  type CustomerBalanceRecord,
} from '../../services/billingStore';
import {
  IconReceipt,
  IconTool,
  IconVolume,
  IconChevronRight,
  IconCalendar,
  IconGauge,
  IconMapPin,
  IconCheck,
  IconClock,
  IconBuildingCommunity,
  IconAlertCircle,
  IconPlus,
  IconX,
  IconPhone,
} from '@tabler/icons-react';

function formatDueDate(dateStr?: string): string {
  if (!dateStr) return 'Due Oct 25, 2026';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1];
    if (monthName) {
      return `Due ${monthName} ${parseInt(d, 10)}, ${y}`;
    }
  }
  return `Due ${dateStr}`;
}

export function CustomerHomeView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [currentBill, setCurrentBill] = useState<Billing | null>(null);
  const [balanceRecord, setBalanceRecord] = useState<CustomerBalanceRecord | null>(() => {
    const all = billingStore.getRecords();
    return all.find((r) => r.meter_number === 'MTR-SIN-0001') || all[0] || null;
  });
  const [latestAdvisory, setLatestAdvisory] = useState<WaterInterruption | null>(null);
  const [ongoingAdvisory, setOngoingAdvisory] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueTypeId, setIssueTypeId] = useState<number>(FIXED_ISSUE_TYPES[3].id);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomerData = async () => {
    try {
      const [userData, reqData, billData, intData] = await Promise.all([
        authApi.me().catch(() => null),
        requestsApi.list({ per_page: 5 }).catch(() => ({ data: [] })),
        billingApi.list().catch(() => ({ data: [] })),
        interruptionsApi.list().catch(() => ({ data: [] })),
      ]);

      if (userData) setUser(userData);

      if (reqData?.data && reqData.data.length > 0) {
        const active = reqData.data.find(
          (r) => ['submitted', 'assigned', 'in_progress'].includes(r.status)
        );
        setActiveRequest(active || reqData.data[0]);
      } else {
        const localRequests = maintenanceStore.getRequests();
        const active = localRequests.find(
          (r) => ['submitted', 'assigned', 'in_progress'].includes(r.status)
        );
        if (active) setActiveRequest(active);
      }

      const userMeter = userData?.customer_profile?.meter?.meter_number || 'MTR-SIN-0001';
      const storeRecords = billingStore.getRecords();
      const matchedStoreRecord =
        storeRecords.find((r) => r.meter_number.toLowerCase() === userMeter.toLowerCase()) ||
        storeRecords[0] ||
        null;

      if (billData?.data && billData.data.length > 0) {
        const b: any = billData.data[0];
        setCurrentBill(b);

        if (b.current_balance !== undefined && b.total_balance !== undefined) {
          setBalanceRecord({
            id: `bill-${b.id}`,
            period_id: b.billing_period_id ? `period-${b.billing_period_id}` : 'period-current',
            period_label: b.period_label || b.billing_period || 'October 2026',
            customer_id: b.customer?.id || userData?.id || 101,
            customer_name: b.customer?.full_name || userData?.name || 'Customer',
            account_number:
              b.customer?.account_number ||
              userData?.customer_profile?.account_number ||
              'ACC-2026-0001',
            meter_number: userMeter,
            barangay:
              b.customer?.barangay || userData?.customer_profile?.barangay?.name || 'Poblacion',
            address: userData?.customer_profile?.address || 'Sinacaban',
            mobile_number: userData?.mobile_number || '',
            is_active_customer: true,
            original_current_balance: Number(b.original_current_balance ?? b.current_balance),
            original_previous_balance: Number(b.original_previous_balance ?? b.previous_balance ?? 0),
            current_balance: Number(b.current_balance),
            previous_balance: Number(b.previous_balance ?? 0),
            total_balance: Number(b.total_balance),
            due_date: b.due_date || '2026-10-25',
            notice_sent: true,
            last_updated: b.last_updated_at || b.created_at || new Date().toISOString(),
          });
        } else if (matchedStoreRecord) {
          setBalanceRecord(matchedStoreRecord);
        } else {
          const curBal = Number(b.amount_due ?? 350);
          setBalanceRecord({
            id: `bill-${b.id}`,
            period_id: 'period-current',
            period_label: b.billing_period || 'October 2026',
            customer_id: userData?.id || 101,
            customer_name: userData?.name || 'Customer',
            account_number: userData?.customer_profile?.account_number || 'ACC-2026-0001',
            meter_number: userMeter,
            barangay: userData?.customer_profile?.barangay?.name || 'Poblacion',
            address: userData?.customer_profile?.address || 'Sinacaban',
            mobile_number: userData?.mobile_number || '',
            is_active_customer: true,
            original_current_balance: curBal,
            original_previous_balance: 0,
            current_balance: curBal,
            previous_balance: 0,
            total_balance: curBal,
            due_date: b.due_date || '2026-10-25',
            notice_sent: true,
            last_updated: b.created_at || new Date().toISOString(),
          });
        }
      } else if (matchedStoreRecord) {
        setBalanceRecord(matchedStoreRecord);
      }

      const userBrgyId = userData?.customer_profile?.barangay_id;
      const allAdvs =
        intData?.data && intData.data.length > 0
          ? intData.data
          : advisoriesStore.getAdvisories();

      if (intData?.data && intData.data.length > 0) {
        setLatestAdvisory(intData.data[0]);
      } else if (allAdvs.length > 0) {
        setLatestAdvisory(allAdvs[0] as any);
      }

      // Detect active ongoing advisory for customer's own barangay (Section 7)
      const ongoing = allAdvs.find((adv: any) => {
        const isCancelled = adv.is_cancelled || adv.status === 'cancelled';
        const isRestored =
          adv.is_restored || adv.actual_restored_at || adv.status === 'completed';
        if (isCancelled || isRestored) return false;

        const brgyIds = Array.isArray(adv.barangay_ids)
          ? adv.barangay_ids
          : adv.barangays?.map((b: any) => b.id) || [];

        if (userBrgyId && brgyIds.length > 0 && !brgyIds.includes(userBrgyId)) {
          return false;
        }

        const startMs = new Date(adv.starts_at).getTime();
        const endMs = new Date(adv.ends_at).getTime();
        const nowMs = Date.now();
        return nowMs >= startMs && nowMs < endMs;
      });

      setOngoingAdvisory(ongoing || null);
    } catch {
      // Offline fallback
      const localRequests = maintenanceStore.getRequests();
      const active = localRequests.find((r) =>
        ['submitted', 'assigned', 'in_progress'].includes(r.status)
      );
      if (active) setActiveRequest(active);

      const storeRecords = billingStore.getRecords();
      if (storeRecords.length > 0) {
        setBalanceRecord(storeRecords[0]);
      }
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const selectedType =
      FIXED_ISSUE_TYPES.find((t) => t.id === issueTypeId) || FIXED_ISSUE_TYPES[0];
    const autoUrgency = selectedType.default_urgency;
    const customerChoiceMap = {
      low: 'can_wait',
      medium: 'needs_attention_soon',
      high: 'urgent',
    } as const;

    try {
      const apiReq = await requestsApi.create({
        issue_type_id: issueTypeId,
        customer_urgency: customerChoiceMap[autoUrgency],
        description: description.trim(),
      });
      await fetchCustomerData();
      if (apiReq) {
        setActiveRequest(apiReq);
      }
      setShowReportModal(false);
      setDescription('');
    } catch {
      const created = maintenanceStore.createRequest({
        issueTypeId,
        customerUrgency: autoUrgency,
        description: description.trim(),
        latitude: 8.2855,
        longitude: 123.8429,
        barangay: user?.customer_profile?.barangay?.name || 'Poblacion',
      });
      setActiveRequest(created);
      setShowReportModal(false);
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profile = user?.customer_profile;
  const accountNumber = profile?.account_number || 'ACC-2026-0001';
  const meterNumber = profile?.meter?.meter_number || 'MTR-SIN-0001';
  const barangayName = profile?.barangay?.name || 'Poblacion';
  const customerName = user?.name || 'Maria Santos';

  const getProgressStepIndex = (status?: string) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'assigned':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = activeRequest ? getProgressStepIndex(activeRequest.status) : 0;

  const currentBalance = Number(balanceRecord?.current_balance ?? 0);
  const previousBalance = Number(balanceRecord?.previous_balance ?? 0);
  const totalBalance = Number(
    balanceRecord?.total_balance ??
      (currentBill?.amount_due !== undefined ? currentBill.amount_due : currentBalance + previousBalance)
  );
  const dueDate = balanceRecord?.due_date || currentBill?.due_date || '2026-10-25';
  const periodLabel = balanceRecord?.period_label || currentBill?.billing_period || 'October 2026 Statement';
  const isSettled = totalBalance <= 0;

  const currentPercent = totalBalance > 0 ? (Math.max(0, currentBalance) / totalBalance) * 100 : 0;
  const previousPercent = totalBalance > 0 ? (Math.max(0, previousBalance) / totalBalance) * 100 : 0;

  return (
    <CustomerLayout
      currentPath="/customer/home"
      onNavigate={(path) => navigate(path)}
      userName={customerName}
      accountNumber={accountNumber}
    >
      <div className="space-y-5 text-[14px]">
        {/* Modern Welcome & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Home
            </h1>
            <div className="text-black/60 text-[14px]">
              Welcome back, <span className="font-semibold text-black">{customerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              leftIcon={<IconPlus size={16} />}
              onClick={() => setShowReportModal(true)}
              className="shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
            >
              Report an Issue
            </Button>
          </div>
        </div>

        {/* Section 7: Ongoing Advisory Banner for Customer's Barangay */}
        {ongoingAdvisory && (
          <AdvisoryBanner advisory={ongoingAdvisory} />
        )}

        {/* Card 1: Account Snapshot (Clean encapsulated banner) */}
        <Card className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center shrink-0 border border-brand-blue/20">
                <IconGauge size={22} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-black/50 uppercase tracking-wider">
                    Account & Meter
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-tint text-brand-blue border border-brand-blue/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                    Active Supply
                  </span>
                </div>
                <h2 className="text-[14px] sm:text-base font-bold text-black">
                  {accountNumber} · <span className="text-brand-blue font-bold">{meterNumber}</span>
                </h2>
                <div className="text-[14px] text-black/70 flex items-center gap-1">
                  <IconMapPin size={14} className="text-brand-blue" />
                  <span>{barangayName}, Sinacaban, Misamis Occidental</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-black/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/customer/profile')}
                className="text-xs"
              >
                Account Details
              </Button>
            </div>
          </div>
        </Card>

        {/* 2-Column Grid: Billing (Col 1) and Active Request (Col 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 2: Balance Card */}
          <Card className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconReceipt size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                      Current Bill
                    </span>
                    <span className="text-[14px] font-semibold text-black">
                      {periodLabel.includes('Statement') ? periodLabel : `${periodLabel} Statement`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-tint text-brand-blue border border-brand-blue/20">
                    <IconCalendar size={13} />
                    {formatDueDate(dueDate)}
                  </span>
                  <Badge variant={isSettled ? 'blue' : 'outline'}>
                    {isSettled ? 'Settled' : 'Unpaid'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="text-xs text-black/60 font-medium">Total Balance Due</div>
                  <div className="text-3xl font-extrabold text-black tracking-tight">
                    ₱{totalBalance.toFixed(2)}
                  </div>
                </div>

                {/* Proportional Split Bar (Current vs Previous) */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-2.5 w-full rounded-full bg-black/10 overflow-hidden flex">
                    {currentPercent > 0 && (
                      <div
                        className="bg-brand-blue transition-all"
                        style={{ width: `${currentPercent}%` }}
                        title={`Current: ₱${currentBalance.toFixed(2)}`}
                      />
                    )}
                    {previousPercent > 0 && (
                      <div
                        className="bg-slate-400 transition-all"
                        style={{ width: `${previousPercent}%` }}
                        title={`Previous: ₱${previousBalance.toFixed(2)}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-black/70">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-blue inline-block" />
                      <span>Current:</span>
                      <strong className="text-black">₱{currentBalance.toFixed(2)}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                      <span>Previous:</span>
                      <strong className="text-black">₱{previousBalance.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 bg-blue-tint border border-brand-blue/20 rounded-lg text-xs text-black/80 flex items-center gap-2">
                <IconBuildingCommunity size={16} className="text-brand-blue shrink-0" />
                <span>
                  Pay at the Sinacaban Municipal Treasury Office (Mon–Fri, 8 AM–5 PM).
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <span className="text-xs text-black/50 font-medium">SIWASS Billing</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/customer/bills')}
                >
                  View Bill
                </Button>
              </div>
            </div>
          </Card>

          {/* Card 3: Active Service Request */}
          <Card
            className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] hover:border-brand-blue transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconTool size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                      Active Request
                    </span>
                    <span className="text-[14px] font-semibold text-black">
                      Maintenance & Repairs
                    </span>
                  </div>
                </div>

                {activeRequest && (
                  <Badge variant={activeRequest.status === 'resolved' ? 'blue' : 'outline'}>
                    {activeRequest.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>

              {activeRequest ? (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-[14px] font-bold text-black flex items-center gap-2">
                      <span>{activeRequest.reference_no || activeRequest.reference || 'AT-2026-0012'}</span>
                      <span className="text-black/40">·</span>
                      <span className="text-brand-blue">{activeRequest.issue_type?.name || 'Water Service Issue'}</span>
                    </h2>
                    <p className="text-xs text-black/70 line-clamp-1 mt-0.5">
                      {activeRequest.description || 'Reported maintenance ticket for residential water line.'}
                    </p>
                  </div>

                  {/* 4-Step Progress Flow */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((step) => {
                        const isPassed = step <= currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`h-2 rounded-full transition-colors ${
                              isPassed ? 'bg-brand-blue' : 'bg-black/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-4 text-center text-[11px] font-medium text-black/70">
                      <span className={currentStepIdx >= 0 ? 'text-brand-blue font-bold' : ''}>
                        Submitted
                      </span>
                      <span className={currentStepIdx >= 1 ? 'text-brand-blue font-bold' : ''}>
                        Assigned
                      </span>
                      <span className={currentStepIdx >= 2 ? 'text-brand-blue font-bold' : ''}>
                        In progress
                      </span>
                      <span className={currentStepIdx >= 3 ? 'text-brand-blue font-bold' : ''}>
                        Resolved
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2 text-black/60">
                  <div className="w-10 h-10 rounded-full bg-blue-tint text-brand-blue flex items-center justify-center mx-auto">
                    <IconCheck size={20} />
                  </div>
                  <div className="text-[14px] font-semibold text-black">
                    No active service request logged.
                  </div>
                  <p className="text-xs text-black/60">
                    Your water connection is currently operating under normal pressure.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <span className="text-xs text-black/50 font-medium">SIWASS Field Dispatch</span>
              {activeRequest ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/customer/requests')}
                >
                  Track Request
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReportModal(true)}
                >
                  Report an Issue
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* 2-Column Grid: Latest Advisory (Col 1) and Municipal Directory (Col 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 4: Latest Water Advisory */}
          <Card
            className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] hover:border-brand-blue transition-all flex flex-col justify-between space-y-3 cursor-pointer"
            onClick={() => navigate('/customer/advisories')}
          >
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconVolume size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                      Latest Advisory
                    </span>
                    <span className="text-[14px] font-semibold text-black">
                      Water Service Announcement
                    </span>
                  </div>
                </div>
                <IconChevronRight size={18} className="text-black/40" />
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-bold text-black">
                  {latestAdvisory?.barangays?.[0]?.name || barangayName} ·{' '}
                  {latestAdvisory?.starts_at
                    ? new Date(latestAdvisory.starts_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Oct 12, 2026'}
                </div>
                <p className="text-[13px] text-black/70 line-clamp-2 leading-relaxed">
                  {latestAdvisory?.message ||
                    'Scheduled maintenance and pipeline pressure checks across municipal distribution zones.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <span className="text-xs text-black/50 font-medium">Public Information Unit</span>
              <span className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
                All Advisories <IconChevronRight size={12} />
              </span>
            </div>
          </Card>

          {/* Card 5: Municipal Quick Access & Support */}
          <Card className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconBuildingCommunity size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                      Municipal Support
                    </span>
                    <span className="text-[14px] font-semibold text-black">
                      SIWASS Help Desk
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-black/50">Sinacaban LGU</span>
              </div>

              <div className="space-y-2 text-xs text-black/80">
                <div className="flex items-center gap-2">
                  <IconPhone size={15} className="text-brand-blue" />
                  <span>Municipal Emergency Hotline: <strong className="text-black">(088) 564-1234</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock size={15} className="text-brand-blue" />
                  <span>Office Hours: <strong className="text-black">Mon – Fri, 8:00 AM – 5:00 PM</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <IconMapPin size={15} className="text-brand-blue" />
                  <span>Location: <strong className="text-black">Municipal Hall, Sinacaban, Misamis Occ.</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/10">
              <button
                onClick={() => navigate('/customer/bills')}
                className="px-2.5 py-1 rounded bg-blue-tint text-brand-blue text-xs font-semibold hover:bg-brand-blue hover:text-white transition-colors"
              >
                My Bills
              </button>
              <button
                onClick={() => navigate('/customer/requests')}
                className="px-2.5 py-1 rounded bg-blue-tint text-brand-blue text-xs font-semibold hover:bg-brand-blue hover:text-white transition-colors"
              >
                Service Requests
              </button>
              <button
                onClick={() => navigate('/customer/advisories')}
                className="px-2.5 py-1 rounded bg-blue-tint text-brand-blue text-xs font-semibold hover:bg-brand-blue hover:text-white transition-colors"
              >
                Advisories
              </button>
              <button
                onClick={() => navigate('/customer/profile')}
                className="px-2.5 py-1 rounded bg-blue-tint text-brand-blue text-xs font-semibold hover:bg-brand-blue hover:text-white transition-colors"
              >
                Profile
              </button>
            </div>
          </Card>
        </div>

        {/* Report Issue Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-[14px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconTool size={16} />
                  </div>
                  <h2 className="text-[14px] font-bold text-black">
                    Report a Water Service Issue
                  </h2>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors"
                  aria-label="Close modal"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Issue Category *
                  </label>
                  <select
                    className="w-full p-2.5 text-[14px] font-medium text-black bg-white border border-black/20 rounded-lg outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    value={issueTypeId}
                    onChange={(e) => setIssueTypeId(Number(e.target.value))}
                  >
                    {FIXED_ISSUE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Problem Description *
                  </label>
                  <textarea
                    placeholder="Describe the issue (location, water pressure, leaks, etc.)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-[14px] font-normal bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue h-28 resize-none"
                    required
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-blue-tint border border-brand-blue/20 text-xs text-black/70 flex items-start gap-2">
                  <IconAlertCircle size={16} className="text-brand-blue shrink-0 mt-0.5" />
                  <span>
                    Your meter number (<strong>{meterNumber}</strong>) and registered barangay (<strong>{barangayName}</strong>) are automatically attached to this dispatch ticket.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-black/10">
                  <Button variant="secondary" type="button" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
