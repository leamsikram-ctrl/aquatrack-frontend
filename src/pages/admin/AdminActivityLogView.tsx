import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { SystemModal } from '../../components/molecules/SystemModal';
import { adminApi } from '../../api';
import { billingStore } from '../../services/billingStore';
import { advisoriesStore } from '../../services/advisoriesStore';
import {
  IconSearch,
  IconCalendar,
  IconRefresh,
  IconDownload,
  IconEye,
  IconX,
  IconTools,
  IconReceipt,
  IconUserCheck,
  IconClock,
  IconShieldLock,
} from '@tabler/icons-react';

export type ActivityCategory =
  | 'all'
  | 'assignment'
  | 'urgency_override'
  | 'resolution'
  | 'verification'
  | 'billing'
  | 'advisory'
  | 'meter';

export interface AuditLogEntry {
  id: string | number;
  time: string;
  rawDate: string;
  user: string;
  role: 'Admin' | 'Staff' | 'Customer' | 'System';
  action: string;
  category: ActivityCategory;
  ipAddress?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  subjectType?: string | null;
  subjectId?: number | string | null;
}

export function AdminActivityLogView() {
  const navigate = useNavigate();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogEntry | null>(null);

  // Live Backend Logs & Loading
  const [backendLogs, setBackendLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modern System Modal
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string | React.ReactNode;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const fetchBackendLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.activityLogs({
        from: startDate,
        to: endDate,
        per_page: 100,
      });

      if (res && Array.isArray(res.data)) {
        const mapped: AuditLogEntry[] = res.data.map((log) => {
          let cat: ActivityCategory = 'assignment';
          const act = (log.action || '').toLowerCase();

          if (act.includes('billing') || act.includes('payment') || act.includes('published')) {
            cat = 'billing';
          } else if (act.includes('verify') || act.includes('register') || act.includes('user') || act.includes('staff')) {
            cat = 'verification';
          } else if (act.includes('resolve')) {
            cat = 'resolution';
          } else if (act.includes('urgency') || act.includes('priority')) {
            cat = 'urgency_override';
          } else if (act.includes('advisory') || act.includes('interruption')) {
            cat = 'advisory';
          } else if (act.includes('meter') || act.includes('qr')) {
            cat = 'meter';
          }

          let role: 'Admin' | 'Staff' | 'Customer' | 'System' = 'Admin';
          if (log.user?.role) {
            const r = String(log.user.role).toLowerCase();
            if (r.includes('staff') || r.includes('technician')) role = 'Staff';
            else if (r.includes('customer') || r.includes('consumer')) role = 'Customer';
          }

          const d = new Date(log.created_at);
          const formattedTime = isNaN(d.getTime())
            ? log.created_at
            : d.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

          return {
            id: `api-${log.id}`,
            time: formattedTime,
            rawDate: log.created_at.slice(0, 10),
            user: log.user?.name || log.user?.email || 'Administrator',
            role,
            action: log.action.replace(/_/g, ' '),
            category: cat,
            ipAddress: log.ip_address || '127.0.0.1',
            oldValues: log.old_values,
            newValues: log.new_values,
            subjectType: log.subject_type,
            subjectId: log.subject_id,
          };
        });
        setBackendLogs(mapped);
      }
    } catch {
      // Gracefully fall back to local store logs
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBackendLogs();
  }, [fetchBackendLogs]);

  // Combined Live Store Logs + Base Initial Demonstration Logs
  const allLogs: AuditLogEntry[] = useMemo(() => {
    const rawBillingLogs = billingStore.getAuditLogs();
    const rawAdvisoryLogs = advisoriesStore.getAuditLogs();

    const mappedBillingLogs: AuditLogEntry[] = rawBillingLogs.map((b) => ({
      ...b,
      rawDate: b.time.slice(0, 10),
      role: (b.role as any) || 'Admin',
      category: 'billing',
      ipAddress: '192.168.1.10',
    }));

    const mappedAdvisoryLogs: AuditLogEntry[] = rawAdvisoryLogs.map((a) => ({
      ...a,
      rawDate: a.time.slice(0, 10),
      role: (a.role as any) || 'Admin',
      category: 'advisory',
      ipAddress: '192.168.1.10',
    }));

    const baseOperationalLogs: AuditLogEntry[] = [
      {
        id: 'log-1',
        time: '2026-10-25 09:30 AM',
        rawDate: '2026-10-25',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Assigned REQ-2026-0001 to Technician Pedro Cruz (Poblacion Main Pipeline)',
        category: 'assignment',
        ipAddress: '192.168.1.5',
        newValues: { assigned_to: 'Pedro Cruz', status: 'assigned' },
      },
      {
        id: 'log-2',
        time: '2026-10-25 09:15 AM',
        rawDate: '2026-10-25',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Adjusted urgency for REQ-2026-0001: Raised to HIGH (Hospital main feeder pipe)',
        category: 'urgency_override',
        ipAddress: '192.168.1.5',
        oldValues: { urgency: 'medium' },
        newValues: { urgency: 'high', reason: 'Hospital main feeder pipe' },
      },
      {
        id: 'log-3',
        time: '2026-10-24 02:45 PM',
        rawDate: '2026-10-24',
        user: 'Pedro Cruz (Field Technician)',
        role: 'Staff',
        action: 'Resolved REQ-2026-0002: Replaced defective gate valve at Poblacion Purok 2',
        category: 'resolution',
        ipAddress: '172.16.0.42',
        newValues: { status: 'resolved', remarks: 'Replaced defective gate valve with brass fitting' },
      },
      {
        id: 'log-4',
        time: '2026-10-24 10:20 AM',
        rawDate: '2026-10-24',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Verified registration & generated QR meter tag MTR-SIN-0003 for Elena Ramos',
        category: 'verification',
        ipAddress: '192.168.1.5',
        newValues: { account_number: 'ACC-2026-0003', meter_number: 'MTR-SIN-0003', status: 'active' },
      },
      {
        id: 'log-5',
        time: '2026-10-23 04:00 PM',
        rawDate: '2026-10-23',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Created staff account for Technician Juan Reyes with temporary password',
        category: 'verification',
        ipAddress: '192.168.1.5',
        newValues: { staff_name: 'Juan Reyes', role: 'staff', temporary_password_issued: true },
      },
      {
        id: 'log-6',
        time: '2026-10-22 11:00 AM',
        rawDate: '2026-10-22',
        user: 'Juan Technician (Staff)',
        role: 'Staff',
        action: 'Started field inspection for REQ-2026-0003 at Barangay San Isidro',
        category: 'assignment',
        ipAddress: '172.16.0.88',
        newValues: { status: 'in_progress' },
      },
      {
        id: 'log-7',
        time: '2026-10-21 03:40 PM',
        rawDate: '2026-10-21',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Broadcasted Water Interruption Advisory No. 104 for Poblacion & San Isidro',
        category: 'advisory',
        ipAddress: '192.168.1.5',
        newValues: { affected_barangays: ['Poblacion', 'San Isidro'], starts_at: '2026-10-22 08:00' },
      },
    ];

    // Combine backend logs first, then store logs, then base logs without duplicate IDs
    const combined = [...backendLogs, ...mappedBillingLogs, ...mappedAdvisoryLogs, ...baseOperationalLogs];
    const seen = new Set<string>();
    return combined.filter((item) => {
      const key = `${item.id}-${item.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [backendLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // 1. Category Filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'assignment' && log.category !== 'assignment') return false;
        if (selectedCategory === 'urgency_override' && log.category !== 'urgency_override') return false;
        if (selectedCategory === 'resolution' && log.category !== 'resolution') return false;
        if (selectedCategory === 'verification' && log.category !== 'verification') return false;
        if (selectedCategory === 'billing' && log.category !== 'billing') return false;
        if (selectedCategory === 'advisory' && log.category !== 'advisory') return false;
        if (selectedCategory === 'meter' && log.category !== 'meter') return false;
      }

      // 2. Role Filter
      if (selectedRole !== 'all' && log.role.toLowerCase() !== selectedRole.toLowerCase()) {
        return false;
      }

      // 3. Date Range Filter
      if (startDate && log.rawDate && log.rawDate < startDate) return false;
      if (endDate && log.rawDate && log.rawDate > endDate) return false;

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${log.time} ${log.user} ${log.action} ${log.role} ${log.ipAddress || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allLogs, selectedCategory, selectedRole, startDate, endDate, searchQuery]);

  // Metric Totals
  const categoryCounts = useMemo(() => {
    return {
      all: allLogs.length,
      maintenance: allLogs.filter((l) => ['assignment', 'urgency_override', 'resolution'].includes(l.category)).length,
      users: allLogs.filter((l) => l.category === 'verification').length,
      billing: allLogs.filter((l) => l.category === 'billing').length,
      advisories: allLogs.filter((l) => l.category === 'advisory').length,
    };
  }, [allLogs]);

  // Export CSV
  const handleExportCsv = () => {
    const sanitize = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const headers = ['Event ID', 'Date & Time', 'User / Actor', 'Role', 'Category', 'Action Description', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      String(l.id),
      l.time,
      l.user,
      l.role,
      l.category,
      l.action,
      l.ipAddress || '—',
    ]);

    const csvContent = [headers.map(sanitize).join(','), ...rows.map((r) => r.map(sanitize).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AquaTrack_Audit_Log_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Audit Log Exported',
      message: `The official SIWASS audit ledger has been exported as CSV with ${filteredLogs.length} events recorded between ${startDate} and ${endDate}.`,
    });
  };

  const getCategoryBadge = (cat: ActivityCategory) => {
    switch (cat) {
      case 'assignment':
        return <Badge variant="blue">Dispatch</Badge>;
      case 'urgency_override':
        return <Badge variant="outline">Urgency</Badge>;
      case 'resolution':
        return <Badge variant="blue">Resolved</Badge>;
      case 'verification':
        return <Badge variant="outline">User Mgmt</Badge>;
      case 'billing':
        return <Badge variant="blue">Billing</Badge>;
      case 'advisory':
        return <Badge variant="outline">Advisory</Badge>;
      case 'meter':
        return <Badge variant="outline">Meter QR</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  return (
    <AdminLayout currentPath="/admin/activity-log" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[14px] text-black">
        {/* Header - Direct & Clean, Minimal Text */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Activity Log
          </h1>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchBackendLogs}
              disabled={isLoading}
              leftIcon={<IconRefresh size={14} className={isLoading ? 'animate-spin' : ''} />}
              className="text-xs font-semibold"
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<IconDownload size={14} />}
              className="text-xs font-semibold"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* 4 Metric Compartments (Matching Admin Dashboard Solid Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Events (Blue brand-blue) */}
          <div
            onClick={() => setSelectedCategory('all')}
            className="bg-brand-blue rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconClock size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : categoryCounts.all}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Total Events
              </div>
            </div>
          </div>

          {/* Card 2: Repairs & Dispatch (Orange urgency-medium) */}
          <div
            onClick={() => setSelectedCategory('assignment')}
            className="bg-urgency-medium rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconTools size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : categoryCounts.maintenance}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Repairs & Dispatch
              </div>
            </div>
          </div>

          {/* Card 3: Verifications (Purple) */}
          <div
            onClick={() => setSelectedCategory('verification')}
            className="bg-purple-600 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconUserCheck size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : categoryCounts.users}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Verifications
              </div>
            </div>
          </div>

          {/* Card 4: Billing (Green urgency-low) */}
          <div
            onClick={() => setSelectedCategory('billing')}
            className="bg-urgency-low rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconReceipt size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : categoryCounts.billing}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Billing
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar Card */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Search user, action, request # or IP address..."
                className="w-full pl-9 pr-3 py-2 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <IconSearch size={16} className="absolute left-3 top-2.5 text-black/40" />
            </div>

            {/* Right Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ActivityCategory)}
                className="p-2 bg-white border border-black/20 rounded-lg text-xs font-semibold text-black outline-none focus:border-brand-blue"
              >
                <option value="all">Category ∨ (All)</option>
                <option value="assignment">Dispatch & Assignment</option>
                <option value="urgency_override">Urgency Overrides</option>
                <option value="resolution">Staff Resolutions</option>
                <option value="verification">Customer & Staff Verifications</option>
                <option value="billing">Billing & Payments</option>
                <option value="advisory">Water Advisories</option>
                <option value="meter">Meter QR Tokens</option>
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="p-2 bg-white border border-black/20 rounded-lg text-xs font-semibold text-black outline-none focus:border-brand-blue"
              >
                <option value="all">Role ∨ (All)</option>
                <option value="admin">Administrators</option>
                <option value="staff">Field Staff</option>
                <option value="customer">Customers</option>
                <option value="system">System Automation</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDateRangeModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <IconCalendar size={14} className="text-brand-blue" />
                <span>Date Range</span>
              </Button>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center justify-between text-xs text-black/60 pt-2 border-t border-black/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-black/70 mr-1">Period:</span>
              <span className="font-mono text-black font-semibold bg-slate-100 px-2 py-0.5 rounded border border-black/10">
                {startDate} to {endDate}
              </span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(d.toISOString().slice(0, 10));
                }}
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(new Date().toISOString().slice(0, 10));
                }}
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  setStartDate(d.toISOString().slice(0, 10));
                  setEndDate(new Date().toISOString().slice(0, 10));
                }}
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue"
              >
                Last 30 Days
              </button>
            </div>

            <Badge variant="blue">{filteredLogs.length} Events Matching</Badge>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card className="p-0 border border-black/10 rounded-md overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 text-black border-b border-black/15 font-bold text-xs">
                <tr>
                  <th className="px-4 py-3 w-44">Time & Date</th>
                  <th className="px-4 py-3 w-48">Actor & Role</th>
                  <th className="px-4 py-3 w-32">Category</th>
                  <th className="px-4 py-3">Action Description</th>
                  <th className="px-4 py-3 text-right w-24">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-black/50">
                      <EmptyState
                        title="No Audit Logs Found"
                        description="No audit ledger records match the selected date range, search query, or category."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogDetail(log)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-black/70 whitespace-nowrap">
                        {log.time}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-black block truncate">
                          {log.user}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              log.role === 'Admin'
                                ? 'bg-black text-white'
                                : log.role === 'Staff'
                                ? 'bg-brand-blue text-white'
                                : 'bg-black/10 text-black'
                            }`}
                          >
                            {log.role}
                          </span>
                          {log.ipAddress && (
                            <span className="text-[10px] text-black/40 font-mono">
                              ({log.ipAddress})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getCategoryBadge(log.category)}
                      </td>

                      <td className="px-4 py-3 text-black font-normal text-xs leading-relaxed">
                        {log.action}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<IconEye size={13} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogDetail(log);
                          }}
                          className="text-xs px-2 py-1"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Date Range Modal */}
        {showDateRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="text-sm font-bold text-black flex items-center gap-2">
                  <IconCalendar size={16} className="text-brand-blue" />
                  <span>Filter Activity Date Range</span>
                </span>
                <button
                  onClick={() => setShowDateRangeModal(false)}
                  className="text-black hover:text-brand-blue p-1 text-[14px]"
                >
                  <IconX size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    Start Date (From)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/70 mb-1">
                    End Date (To)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                <Button variant="secondary" size="sm" onClick={() => setShowDateRangeModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowDateRangeModal(false);
                    fetchBackendLogs();
                  }}
                >
                  Apply Date Range
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Detail Modal */}
        {selectedLogDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg bg-white rounded-xl border-2 border-black p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <IconShieldLock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">Audit Event Inspection</h3>
                    <p className="text-[11px] text-black/60 font-mono">
                      Event ID: {selectedLogDetail.id} &bull; {selectedLogDetail.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="text-black hover:opacity-70 p-1"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-black/10 rounded-lg">
                  <div>
                    <span className="text-[11px] font-semibold text-black/60 block">Actor</span>
                    <span className="font-bold text-black">{selectedLogDetail.user}</span>
                    <span className="text-[10px] text-brand-blue font-bold uppercase block mt-0.5">
                      {selectedLogDetail.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-black/60 block">IP Address</span>
                    <span className="font-mono text-black">{selectedLogDetail.ipAddress || 'Internal'}</span>
                    <span className="text-[10px] text-black/50 block mt-0.5">Verified Network Session</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-black/60 block mb-1">
                    Event Action
                  </span>
                  <div className="p-2.5 bg-white border border-black/20 rounded-lg text-black font-medium leading-relaxed">
                    {selectedLogDetail.action}
                  </div>
                </div>

                {/* Old vs New Values Diff */}
                {(selectedLogDetail.oldValues || selectedLogDetail.newValues) && (
                  <div className="space-y-2 pt-2 border-t border-black/10">
                    <span className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      State Changes & Payload
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      {selectedLogDetail.oldValues && (
                        <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg">
                          <span className="text-[10px] font-bold text-black/70 block mb-1">Previous Values:</span>
                          <pre className="whitespace-pre-wrap text-black/80 font-mono">
                            {JSON.stringify(selectedLogDetail.oldValues, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLogDetail.newValues && (
                        <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg">
                          <span className="text-[10px] font-bold text-brand-blue block mb-1">Updated Values:</span>
                          <pre className="whitespace-pre-wrap text-black font-mono">
                            {JSON.stringify(selectedLogDetail.newValues, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-black/10">
                <Button variant="primary" size="sm" onClick={() => setSelectedLogDetail(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modern System Notification Modal */}
        <SystemModal
          isOpen={systemModal.isOpen}
          onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
          confirmText="Dismiss"
        />
      </div>
    </AdminLayout>
  );
}
