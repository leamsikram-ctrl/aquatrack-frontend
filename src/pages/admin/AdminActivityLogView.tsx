import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import {
  NothingPendingIllustration,
  NoMatchesIllustration,
} from '../../components/illustrations';
import { SystemModal } from '../../components/molecules/SystemModal';
import { adminApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
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
  | 'Accounts'
  | 'Security'
  | 'Consent'
  | 'Requests'
  | 'Advisories'
  | 'Billing'
  | 'Meters'
  | 'Reports'
  | 'Log'
  | 'accounts'
  | 'security'
  | 'consent'
  | 'requests'
  | 'advisories'
  | 'billing'
  | 'meters'
  | 'reports'
  | 'log';

export interface AuditLogEntry {
  id: string | number;
  time: string;
  rawDate: string;
  user: string;
  role: 'Admin' | 'Staff' | 'Customer' | 'System';
  action: string;
  category: ActivityCategory;
  target?: string | null;
  detail?: string | null;
  ipAddress?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  subjectType?: string | null;
  subjectId?: number | string | null;
}

export function maskPii(text: string): string {
  if (!text) return text;
  let masked = text.replace(/(09\d{2})\d{3}(\d{4})/g, '$1***$2');
  masked = masked.replace(/(\+639\d{2})\d{3}(\d{4})/g, '$1***$2');
  masked = masked.replace(/([a-zA-Z0-9_\-.])[a-zA-Z0-9_\-.]*@([a-zA-Z0-9\-.]+\.[a-zA-Z]{2,})/g, '$1***@$2');
  return masked;
}

export function sanitizeLogPayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLogPayload);
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (k.includes('password') || k.includes('pin') || k.includes('token') || k.includes('link')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'string') {
      sanitized[key] = maskPii(val);
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeLogPayload(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function AdminActivityLogView() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogEntry | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Live Backend Logs & Loading
  const [backendLogs, setBackendLogs] = useState<AuditLogEntry[]>([]);
  const [localExportLogs, setLocalExportLogs] = useState<AuditLogEntry[]>([]);
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

  // Access Control: Only admin can open this page (Section 13 C.1)
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate(user.role === 'staff' ? '/staff/tasks' : '/customer/home', { replace: true });
    }
  }, [user, navigate]);

  const fetchBackendLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.activityLogs({
        from: startDate,
        to: endDate,
        per_page: 200,
      });

      if (res && Array.isArray(res.data)) {
        const mapped: AuditLogEntry[] = res.data.map((log) => {
          let cat: ActivityCategory = 'Requests';
          const rawCat = (log.category || '').toLowerCase();
          const act = (log.action || '').toLowerCase();

          if (rawCat === 'billing' || act.includes('billing') || act.includes('payment')) {
            cat = 'Billing';
          } else if (rawCat === 'consent' || act.includes('consent') || act.includes('terms') || act.includes('privacy')) {
            cat = 'Consent';
          } else if (rawCat === 'security' || act.includes('password') || act.includes('pin') || act.includes('mobile') || act.includes('email')) {
            cat = 'Security';
          } else if (rawCat === 'accounts' || act.includes('verify') || act.includes('register') || act.includes('user') || act.includes('staff') || act.includes('deactivate')) {
            cat = 'Accounts';
          } else if (rawCat === 'advisories' || act.includes('advisory') || act.includes('interruption')) {
            cat = 'Advisories';
          } else if (rawCat === 'meters' || act.includes('meter') || act.includes('qr')) {
            cat = 'Meters';
          } else if (rawCat === 'reports' || act.includes('report') || act.includes('pdf') || act.includes('csv')) {
            cat = 'Reports';
          } else if (rawCat === 'log' || act.includes('export') || act.includes('activity log')) {
            cat = 'Log';
          } else if (rawCat === 'requests' || act.includes('req-') || act.includes('maintenance')) {
            cat = 'Requests';
          }

          let role: 'Admin' | 'Staff' | 'Customer' | 'System' = 'Admin';
          const r = String(log.user_role || log.user?.role || '').toLowerCase();
          if (r.includes('staff') || r.includes('technician')) role = 'Staff';
          else if (r.includes('customer') || r.includes('consumer')) role = 'Customer';
          else if (r.includes('system')) role = 'System';
          else if (r.includes('admin')) role = 'Admin';

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

          let target = log.target || log.subject_type || null;
          if (log.subject_id && !target) {
            target = `${log.subject_type?.split('\\').pop() || 'Item'} #${log.subject_id}`;
          }

          const userName = log.user_name || log.user?.name || log.user?.email || (role === 'System' ? 'System' : 'Administrator');

          return {
            id: `api-${log.id}`,
            time: formattedTime,
            rawDate: log.created_at.slice(0, 10),
            user: userName,
            role,
            action: log.action.replace(/_/g, ' '),
            category: cat,
            target,
            detail: log.detail,
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

  // Combined Logs: Newest first (Section 13 C.2)
  const allLogs: AuditLogEntry[] = useMemo(() => {
    const rawBillingLogs = billingStore.getAuditLogs();
    const rawAdvisoryLogs = advisoriesStore.getAuditLogs();

    const mappedBillingLogs: AuditLogEntry[] = rawBillingLogs.map((b) => ({
      ...b,
      rawDate: b.time.slice(0, 10),
      role: (b.role as any) || 'Admin',
      category: 'Billing',
      target: 'Billing Ledger',
      detail: b.action,
      ipAddress: '192.168.1.10',
    }));

    const mappedAdvisoryLogs: AuditLogEntry[] = rawAdvisoryLogs.map((a) => ({
      ...a,
      rawDate: a.time.slice(0, 10),
      role: (a.role as any) || 'Admin',
      category: 'Advisories',
      target: 'Advisory Notice',
      detail: a.action,
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
        category: 'Requests',
        target: 'REQ-2026-0001',
        detail: 'Assigned Poblacion mainline pipe burst to Pedro Cruz',
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
        category: 'Requests',
        target: 'REQ-2026-0001',
        detail: 'Hospital main feeder pipe leakage requires urgent repair',
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
        category: 'Requests',
        target: 'REQ-2026-0002',
        detail: 'Replaced defective gate valve with brass fitting',
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
        category: 'Accounts',
        target: 'Elena Ramos (ACC-2026-0003)',
        detail: 'Approved registration and assigned meter MTR-SIN-0003',
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
        category: 'Accounts',
        target: 'Juan Reyes',
        detail: 'New technician account created with temporary credentials',
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
        category: 'Requests',
        target: 'REQ-2026-0003',
        detail: 'Initial on-site assessment at San Isidro',
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
        category: 'Advisories',
        target: 'Advisory #104',
        detail: 'Emergency mainline shutoff advisory broadcasted to customers',
        ipAddress: '192.168.1.5',
        newValues: { affected_barangays: ['Poblacion', 'San Isidro'], starts_at: '2026-10-22 08:00' },
      },
      {
        id: 'log-8',
        time: '2026-10-20 01:15 PM',
        rawDate: '2026-10-20',
        user: 'Maria Santos (Customer)',
        role: 'Customer',
        action: 'Accepted Terms of Use v1.0 and Privacy Notice v1.0 during registration',
        category: 'Consent',
        target: 'Terms of Use & Privacy Notice v1.0',
        detail: 'Customer accepted terms version 1.0',
        ipAddress: '112.198.40.12',
        newValues: { terms_version: '1.0', privacy_version: '1.0', accepted_at: '2026-10-20T05:15:00Z' },
      },
      {
        id: 'log-9',
        time: '2026-10-19 10:00 AM',
        rawDate: '2026-10-19',
        user: 'Administrator (Admin User)',
        role: 'Admin',
        action: 'Generated Maintenance summary PDF report for October 2026 (Sinacaban Municipal Wide)',
        category: 'Reports',
        target: 'Maintenance Summary Report',
        detail: 'Monthly maintenance summary generated and downloaded',
        ipAddress: '192.168.1.5',
        newValues: { report_type: 'maintenance_summary', format: 'pdf', period: '2026-10-01 to 2026-10-31' },
      },
    ];

    const liveLogs = [...localExportLogs, ...backendLogs];
    const sourceLogs = liveLogs.length > 0
      ? liveLogs
      : [...mappedBillingLogs, ...mappedAdvisoryLogs, ...baseOperationalLogs];

    const seen = new Set<string>();
    const deduplicated = sourceLogs.filter((item) => {
      const key = `${item.id}-${item.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Newest first sorting (Section 13 C.2)
    return deduplicated.sort((a, b) => {
      if (a.rawDate !== b.rawDate) {
        return b.rawDate.localeCompare(a.rawDate);
      }
      return String(b.id).localeCompare(String(a.id));
    });
  }, [backendLogs, localExportLogs]);

  // Filtered Logs matching active filters (Section 13 C.3)
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // 1. Category Filter (canonical 9 categories)
      if (selectedCategory !== 'all') {
        const catLower = String(log.category).toLowerCase();
        const selLower = selectedCategory.toLowerCase();
        if (catLower !== selLower) {
          return false;
        }
      }

      // 2. Role Filter
      if (selectedRole !== 'all') {
        const roleLower = String(log.role).toLowerCase();
        const selRoleLower = selectedRole.toLowerCase();
        if (roleLower !== selRoleLower) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (startDate && log.rawDate && log.rawDate < startDate) return false;
      if (endDate && log.rawDate && log.rawDate > endDate) return false;

      // 4. Target Search Filter (searches target, action, detail, user)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${log.target || ''} ${log.action || ''} ${log.detail || ''} ${log.user || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [allLogs, selectedCategory, selectedRole, startDate, endDate, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedRole, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Metric Totals
  const categoryCounts = useMemo(() => {
    return {
      all: allLogs.length,
      maintenance: allLogs.filter((l) => String(l.category).toLowerCase() === 'requests').length,
      users: allLogs.filter((l) => ['accounts', 'security', 'consent'].includes(String(l.category).toLowerCase())).length,
      billing: allLogs.filter((l) => String(l.category).toLowerCase() === 'billing').length,
      advisories: allLogs.filter((l) => String(l.category).toLowerCase() === 'advisories').length,
    };
  }, [allLogs]);

  // Clear filters handler (Section 13 C.6)
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedRole('all');
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setCurrentPage(1);
  };

  // Export CSV of the filtered entries and log the export (Section 13 C.5)
  const handleExportCsv = async () => {
    const sanitize = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const headers = ['Event ID', 'Date & Time', 'User / Actor', 'Role', 'Category', 'Target', 'Action Description', 'Detail', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      String(l.id),
      l.time,
      l.user,
      l.role,
      l.category,
      l.target || '—',
      maskPii(l.action),
      l.detail ? maskPii(l.detail) : '—',
      l.ipAddress || '—',
    ]);

    const csvContent = [headers.map(sanitize).join(','), ...rows.map((r) => r.map(sanitize).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aquatrack-activity-log-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record the export via backend API per Section 13 Part C Step 5
    try {
      await adminApi.logActivityExport({
        count: filteredLogs.length,
        from: startDate,
        to: endDate,
        filters: {
          category: selectedCategory,
          role: selectedRole,
          search: searchQuery,
        },
      });
      fetchBackendLogs();
    } catch {
      // Local fallback in state
      const exportEvent: AuditLogEntry = {
        id: `log-export-${Date.now()}`,
        time: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        rawDate: new Date().toISOString().slice(0, 10),
        user: user?.name || 'Administrator',
        role: 'Admin',
        action: 'Exported Activity Log CSV',
        category: 'Log',
        target: 'Activity Log',
        detail: `Exported ${filteredLogs.length} filtered activity log records (${startDate} to ${endDate})`,
        ipAddress: '127.0.0.1',
      };
      setLocalExportLogs((prev) => [exportEvent, ...prev]);
    }

    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Activity Log Exported',
      message: `The official activity log has been exported as CSV with ${filteredLogs.length} records matching the selected filters.`,
    });
  };

  const getRelatedItemLink = (log: AuditLogEntry): string | null => {
    const cat = String(log.category).toLowerCase();
    const act = log.action.toLowerCase();
    const target = (log.target || '').toLowerCase();

    if (cat === 'requests' || act.includes('req-') || target.includes('req-')) {
      return '/admin/maintenance';
    }
    if (cat === 'billing' || act.includes('billing') || act.includes('payment')) {
      return '/admin/billing';
    }
    if (cat === 'advisories' || act.includes('advisory') || target.includes('advisory')) {
      return '/admin/interruptions';
    }
    if (cat === 'accounts' || cat === 'security' || cat === 'consent' || act.includes('user') || act.includes('staff') || act.includes('customer')) {
      return '/admin/users';
    }
    if (cat === 'meters' || act.includes('meter') || act.includes('qr')) {
      return '/admin/users';
    }
    if (cat === 'reports' || act.includes('report')) {
      return '/admin/reports';
    }
    return null;
  };

  const getCategoryBadge = (cat: ActivityCategory) => {
    const c = String(cat).toLowerCase();
    switch (c) {
      case 'requests':
        return <Badge variant="blue">Requests</Badge>;
      case 'accounts':
        return <Badge variant="outline">Accounts</Badge>;
      case 'security':
        return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Security</Badge>;
      case 'consent':
        return <Badge variant="outline" className="text-teal-700 border-teal-300 bg-teal-50">Consent</Badge>;
      case 'advisories':
        return <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50">Advisories</Badge>;
      case 'billing':
        return <Badge variant="blue">Billing</Badge>;
      case 'meters':
        return <Badge variant="outline">Meters</Badge>;
      case 'reports':
        return <Badge variant="blue">Reports</Badge>;
      case 'log':
        return <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">Log</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  // If customer or staff, deny access
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <EmptyState
          title="Access restricted"
          description="Only administrators can view the audit trail."
          actionLabel="Go back"
          onAction={() => navigate(user.role === 'staff' ? '/staff/tasks' : '/customer/home')}
        />
      </div>
    );
  }

  return (
    <AdminLayout currentPath="/admin/activity-log" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[14px] text-black">
        {/* Header - Titles: Maximum 3 words. Subtitles: Exactly one helper line */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Activity Log
            </h1>
            <p className="text-xs text-black/60 mt-1">
              Audit trail of actions across accounts, billing, and requests.
            </p>
          </div>

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

        {/* 4 Metric Compartments */}
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

          {/* Card 2: Requests & Dispatch (Orange urgency-medium) */}
          <div
            onClick={() => setSelectedCategory('Requests')}
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
                Requests & Dispatch
              </div>
            </div>
          </div>

          {/* Card 3: Accounts & Security (Purple) */}
          <div
            onClick={() => setSelectedCategory('Accounts')}
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
                Accounts & Security
              </div>
            </div>
          </div>

          {/* Card 4: Billing & Notices (Green urgency-low) */}
          <div
            onClick={() => setSelectedCategory('Billing')}
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
                Billing & Notices
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar Card (Section 13 C.3) */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input for target, action, user */}
            <div className="relative flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Search target reference, request ID, user, or action..."
                className="w-full pl-9 pr-3 py-2 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <IconSearch size={16} className="absolute left-3 top-2.5 text-black/40" />
            </div>

            {/* Right Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 bg-white border border-black/20 rounded-lg text-xs font-semibold text-black outline-none focus:border-brand-blue"
              >
                <option value="all">Category ∨ (All)</option>
                <option value="Accounts">Accounts (Users & Staff)</option>
                <option value="Security">Security (Credentials)</option>
                <option value="Consent">Consent (Terms & Privacy)</option>
                <option value="Requests">Requests (Maintenance)</option>
                <option value="Advisories">Advisories (Notices)</option>
                <option value="Billing">Billing & Payments</option>
                <option value="Meters">Meters & QR Tags</option>
                <option value="Reports">Reports (PDF & CSV)</option>
                <option value="Log">Log (Audit Exports)</option>
              </select>

              <select
                aria-label="Filter by role"
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
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue cursor-pointer"
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
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue cursor-pointer"
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
                className="px-2 py-0.5 rounded hover:bg-black/5 font-medium text-brand-blue cursor-pointer"
              >
                Last 30 Days
              </button>
            </div>

            <Badge variant="blue">{filteredLogs.length} Events Matching</Badge>
          </div>
        </Card>

        {/* Audit Log Table (Section 13 C.2) */}
        <Card className="p-0 border border-black/10 rounded-md overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 text-black border-b border-black/15 font-bold text-xs">
                <tr>
                  <th className="px-4 py-3 w-44">Time & Date</th>
                  <th className="px-4 py-3 w-48">Actor & Role</th>
                  <th className="px-4 py-3 w-32">Category</th>
                  <th className="px-4 py-3">Action & Target</th>
                  <th className="px-4 py-3 text-right w-24">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {allLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-black/50">
                      <EmptyState
                        illustration={<NothingPendingIllustration />}
                        title="No logs recorded"
                        description="No audit ledger records recorded in the system."
                      />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-black/50">
                      <EmptyState
                        illustration={<NoMatchesIllustration />}
                        title="No matches found"
                        description="No audit log records match the selected filters."
                        actionLabel="Clear filters"
                        onAction={handleClearFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((log) => (
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
                                : log.role === 'System'
                                ? 'bg-slate-600 text-white'
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
                        {log.target && (
                          <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-slate-100 border border-black/10 rounded text-[11px] font-semibold text-black/80 font-mono">
                            {log.target}
                          </span>
                        )}
                        <span>{maskPii(log.action)}</span>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-black/10 text-xs">
              <span className="text-black/60 font-medium">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="text-xs px-2.5 py-1"
                >
                  Previous
                </Button>
                <span className="text-black font-semibold px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs px-2.5 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Date Range Modal */}
        {showDateRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="text-sm font-bold text-black flex items-center gap-2">
                  <IconCalendar size={16} className="text-brand-blue" />
                  <span>Filter Date Range</span>
                </span>
                <button
                  onClick={() => setShowDateRangeModal(false)}
                  className="text-black hover:text-brand-blue p-1 text-[14px] cursor-pointer"
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

        {/* Activity Details Slide-Over Drawer (Per Workflow Section C.4) */}
        {selectedLogDetail && (
          <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedLogDetail(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md bg-white border-l border-black/10 shadow-2xl flex flex-col justify-between">
                {/* Drawer Header */}
                <div className="p-5 border-b border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                      <IconShieldLock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black">Event Inspection</h3>
                      <p className="text-[11px] text-black/50 font-mono">
                        Event ID: {selectedLogDetail.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLogDetail(null)}
                    className="text-black/60 hover:text-black p-1 rounded-md cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <IconX size={18} />
                  </button>
                </div>

                {/* Drawer Body - all fields */}
                <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
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
                      <span className="text-[10px] text-black/50 block mt-0.5">Verified Session</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-black/10 rounded-lg">
                    <div>
                      <span className="text-[11px] font-semibold text-black/60 block">Category</span>
                      <div className="mt-1">{getCategoryBadge(selectedLogDetail.category)}</div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-black/60 block">Timestamp</span>
                      <span className="font-mono text-black font-medium">{selectedLogDetail.time}</span>
                    </div>
                  </div>

                  {selectedLogDetail.target && (
                    <div>
                      <span className="text-[11px] font-semibold text-black/60 block mb-1">
                        Target Reference
                      </span>
                      <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg text-black font-semibold font-mono text-xs">
                        {selectedLogDetail.target}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-semibold text-black/60 block mb-1">
                      Event Action
                    </span>
                    <div className="p-2.5 bg-white border border-black/20 rounded-lg text-black font-medium leading-relaxed">
                      {maskPii(selectedLogDetail.action)}
                    </div>
                  </div>

                  {selectedLogDetail.detail && (
                    <div>
                      <span className="text-[11px] font-semibold text-black/60 block mb-1">
                        Details
                      </span>
                      <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg text-black font-normal leading-relaxed">
                        {maskPii(selectedLogDetail.detail)}
                      </div>
                    </div>
                  )}

                  {/* State changes & payload */}
                  {(selectedLogDetail.oldValues || selectedLogDetail.newValues) && (
                    <div className="space-y-2 pt-2 border-t border-black/10">
                      <span className="text-[11px] font-bold text-black uppercase tracking-wider block">
                        State Changes
                      </span>
                      <div className="space-y-2 font-mono text-[11px]">
                        {selectedLogDetail.oldValues && (
                          <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg">
                            <span className="text-[10px] font-bold text-black/70 block mb-1">Previous Values:</span>
                            <pre className="whitespace-pre-wrap text-black/80 font-mono text-[10px]">
                              {JSON.stringify(sanitizeLogPayload(selectedLogDetail.oldValues), null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedLogDetail.newValues && (
                          <div className="p-2.5 bg-slate-50 border border-black/15 rounded-lg">
                            <span className="text-[10px] font-bold text-brand-blue block mb-1">Updated Values:</span>
                            <pre className="whitespace-pre-wrap text-black font-mono text-[10px]">
                              {JSON.stringify(sanitizeLogPayload(selectedLogDetail.newValues), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer with Link to Related Item per Workflow C.4 */}
                <div className="p-4 border-t border-black/10 bg-slate-50 flex items-center justify-between gap-3">
                  {getRelatedItemLink(selectedLogDetail) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<IconEye size={14} />}
                      onClick={() => {
                        const link = getRelatedItemLink(selectedLogDetail);
                        if (link) {
                          setSelectedLogDetail(null);
                          navigate(link);
                        }
                      }}
                      className="text-xs font-semibold"
                    >
                      View Related Item
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button variant="primary" size="sm" onClick={() => setSelectedLogDetail(null)}>
                    Close
                  </Button>
                </div>
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
