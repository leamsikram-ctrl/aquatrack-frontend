import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { SystemModal } from '../../components/molecules/SystemModal';
import { useAuth } from '../../contexts/AuthContext';
import { requestsApi, referenceApi, interruptionsApi, adminApi } from '../../api';
import type { ServiceRequest, Barangay, WaterInterruption, User } from '../../types';
import { DEFAULT_ACTIVE_STAFF } from '../../services/maintenanceStore';
import { SINACABAN_BARANGAY_LIST, advisoriesStore } from '../../services/advisoriesStore';
import {
  IconDownload,
  IconCalendar,
  IconFilter,
  IconCheck,
  IconPrinter,
  IconFileSpreadsheet,
  IconTools,
  IconAlertCircle,
  IconBuildingCommunity,
} from '@tabler/icons-react';

export type ReportType =
  | 'maintenance_summary'
  | 'request_log'
  | 'by_barangay'
  | 'staff_tasks'
  | 'water_advisories';

export const REPORT_TITLES: Record<ReportType, string> = {
  maintenance_summary: 'Maintenance Summary',
  request_log: 'Maintenance Request Log',
  by_barangay: 'Requests by Barangay',
  staff_tasks: 'Staff Task Report',
  water_advisories: 'Water Advisory Report',
};

export const REPORT_CSV_SLUGS: Record<ReportType, string> = {
  maintenance_summary: 'maintenance-summary',
  request_log: 'maintenance-request-log',
  by_barangay: 'requests-by-barangay',
  staff_tasks: 'staff-task-report',
  water_advisories: 'water-advisory-report',
};

/**
 * Philippine Time Zone (Asia/Manila, UTC+8) Utility Functions
 */
export function getPhilippineToday(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function formatPhilippineDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function formatPhilippineDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatDurationFromMinutes(avgMins: number): string {
  if (avgMins < 60) return `${avgMins} mins`;
  const hours = (avgMins / 60).toFixed(1);
  if (Number(hours) < 24) return `${hours} hrs`;
  const days = (avgMins / (60 * 24)).toFixed(1);
  return `${days} days`;
}

function calculateStaffAvgTime(requestsList: ServiceRequest[]): string {
  let totalMinutes = 0;
  let resolvedCount = 0;

  requestsList.forEach((r) => {
    if (r.status === 'resolved') {
      const assignTime = r.assigned_at
        ? new Date(r.assigned_at).getTime()
        : r.created_at
        ? new Date(r.created_at).getTime()
        : 0;
      const resolveTime = r.resolved_at
        ? new Date(r.resolved_at).getTime()
        : r.updated_at
        ? new Date(r.updated_at).getTime()
        : 0;
      if (assignTime > 0 && resolveTime > assignTime) {
        totalMinutes += (resolveTime - assignTime) / (1000 * 60);
        resolvedCount++;
      }
    }
  });

  if (resolvedCount === 0) return 'N/A';
  return formatDurationFromMinutes(Math.round(totalMinutes / resolvedCount));
}

export function AdminReportsView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const generatedByName = user?.name || 'Administrator (Admin User)';

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>(SINACABAN_BARANGAY_LIST);
  const [staffList, setStaffList] = useState<User[]>(DEFAULT_ACTIVE_STAFF);
  const [interruptions, setInterruptions] = useState<WaterInterruption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Workflow Section 10 & Proposals: Default Date Range to Current Month (Philippine Time)
  const today = useMemo(() => getPhilippineToday(), []);
  const defaultDates = useMemo(() => {
    const firstDay = `${today.slice(0, 7)}-01`;
    return { from: firstDay, to: today };
  }, [today]);

  // Filter and Configuration State
  const [reportType, setReportType] = useState<ReportType>('maintenance_summary');
  const [fromDate, setFromDate] = useState<string>(defaultDates.from);
  const [toDate, setToDate] = useState<string>(defaultDates.to);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Modern System Modal State
  const [modalState, setModalState] = useState<{
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

  // Date Range Validation (The "From" date must not be later than "To", and neither can be in the future)
  const dateError = useMemo(() => {
    if (!fromDate || !toDate) {
      return 'Please set both From and To dates.';
    }
    if (fromDate > toDate) {
      return 'The "From" date must not be later than "To" date.';
    }
    if (fromDate > today || toDate > today) {
      return 'Neither date can be set in the future.';
    }
    return null;
  }, [fromDate, toDate, today]);

  const handleApplyDatePreset = (preset: 'this_month' | 'last_month' | 'last_30_days' | 'year_to_date') => {
    const yyyy = Number(today.slice(0, 4));
    const mm = Number(today.slice(5, 7)); // 1-12

    if (preset === 'this_month') {
      const from = `${yyyy}-${String(mm).padStart(2, '0')}-01`;
      setFromDate(from);
      setToDate(today);
    } else if (preset === 'last_month') {
      const lastMonthYear = mm === 1 ? yyyy - 1 : yyyy;
      const lastMonthIdx = mm === 1 ? 12 : mm - 1;
      const from = `${lastMonthYear}-${String(lastMonthIdx).padStart(2, '0')}-01`;
      const lastDayObj = new Date(lastMonthYear, lastMonthIdx, 0);
      const to = `${lastMonthYear}-${String(lastMonthIdx).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
      setFromDate(from);
      setToDate(to);
    } else if (preset === 'last_30_days') {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(past.toISOString().slice(0, 10));
      setToDate(today);
    } else if (preset === 'year_to_date') {
      setFromDate(`${yyyy}-01-01`);
      setToDate(today);
    }
    setReportGenerated(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqRes, bgRes, staffRes, intRes] = await Promise.all([
          requestsApi.list({ per_page: 250 }).catch(() => ({ data: [] })),
          referenceApi.getBarangays().catch(() => []),
          adminApi.staffList().catch(() => []),
          interruptionsApi.list().catch(() => ({ data: [] })),
        ]);

        if (reqRes && Array.isArray(reqRes.data)) {
          setRequests(reqRes.data);
        }
        if (Array.isArray(bgRes) && bgRes.length > 0) {
          setBarangays(bgRes);
        }
        if (Array.isArray(staffRes) && staffRes.length > 0) {
          setStaffList(staffRes);
        }
        if (intRes && Array.isArray(intRes.data)) {
          setInterruptions(intRes.data);
        }
      } catch {
        // Fallback to initial state
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // B. Which Date Is Used:
  // - Request reports (types 1 to 3) use the date the request was submitted (created_at).
  // - Staff task report (type 4) uses the date the request was assigned (assigned_at).
  // - Advisory report (type 5) uses the advisory's start date (starts_at).
  // -------------------------------------------------------------

  // Filtered requests for Types 1, 2, and 3 (Date submitted = created_at)
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // 1. Barangay filter
      if (selectedBarangay !== 'all') {
        const bName =
          r.customer?.barangay ||
          r.customer_profile?.barangay?.name ||
          (r as any).barangay ||
          '';
        if (bName.toLowerCase().trim() !== selectedBarangay.toLowerCase().trim()) {
          return false;
        }
      }
      // 2. Date submitted filter on created_at
      const createdDate = (r.created_at || '').slice(0, 10);
      if (fromDate && createdDate && createdDate < fromDate) return false;
      if (toDate && createdDate && createdDate > toDate) return false;
      return true;
    });
  }, [requests, selectedBarangay, fromDate, toDate]);

  // Filtered requests for Type 4 (Date assigned = assigned_at)
  const staffPeriodRequests = useMemo(() => {
    return requests.filter((r) => {
      const staffId = r.assigned_staff_id || r.assigned_staff?.id;
      if (!staffId) return false;

      // 1. Barangay filter
      if (selectedBarangay !== 'all') {
        const bName =
          r.customer?.barangay ||
          r.customer_profile?.barangay?.name ||
          (r as any).barangay ||
          '';
        if (bName.toLowerCase().trim() !== selectedBarangay.toLowerCase().trim()) {
          return false;
        }
      }

      // 2. Date assigned filter on assigned_at (fallback to created_at if assigned_at omitted)
      const assignedDate = (r.assigned_at || r.created_at || '').slice(0, 10);
      if (fromDate && assignedDate && assignedDate < fromDate) return false;
      if (toDate && assignedDate && assignedDate > toDate) return false;
      return true;
    });
  }, [requests, selectedBarangay, fromDate, toDate]);

  // Filtered advisories for Type 5 (Date start = starts_at)
  const filteredAdvisories = useMemo(() => {
    return interruptions.filter((a) => {
      // 1. Barangay filter
      if (selectedBarangay !== 'all') {
        const matchBg =
          a.barangays?.some(
            (b) => b.name?.toLowerCase().trim() === selectedBarangay.toLowerCase().trim()
          ) ||
          (a as any).barangay_names?.some(
            (n: string) => n.toLowerCase().trim() === selectedBarangay.toLowerCase().trim()
          );
        if (!matchBg) return false;
      }
      // 2. Date range filter on starts_at
      const startDate = (a.starts_at || '').slice(0, 10);
      if (fromDate && startDate && startDate < fromDate) return false;
      if (toDate && startDate && startDate > toDate) return false;
      return true;
    });
  }, [interruptions, selectedBarangay, fromDate, toDate]);

  // -------------------------------------------------------------
  // C. Contents of Each Report Type Calculations
  // -------------------------------------------------------------

  // Breakdown statistics: Status (Submitted, Assigned, In progress, Resolved, Cancelled)
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      submitted: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      cancelled: 0,
    };
    filteredRequests.forEach((r) => {
      const s = (r.status || 'submitted').toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [filteredRequests]);

  // Breakdown statistics: Urgency ("High", "Medium", "Low")
  const countsByUrgency = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    filteredRequests.forEach((r) => {
      const u = (r.urgency || 'low').toLowerCase();
      counts[u] = (counts[u] || 0) + 1;
    });
    return counts;
  }, [filteredRequests]);

  // Average time from Submitted to Resolved, for resolved requests only
  const averageResolutionTime = useMemo(() => {
    let totalMinutes = 0;
    let resolvedCount = 0;

    filteredRequests.forEach((r) => {
      if (r.status === 'resolved' && r.created_at) {
        const start = new Date(r.created_at).getTime();
        const end = r.resolved_at
          ? new Date(r.resolved_at).getTime()
          : r.updated_at
          ? new Date(r.updated_at).getTime()
          : 0;

        if (end > start) {
          totalMinutes += (end - start) / (1000 * 60);
          resolvedCount++;
        }
      }
    });

    if (resolvedCount === 0) return 'N/A';
    return formatDurationFromMinutes(Math.round(totalMinutes / resolvedCount));
  }, [filteredRequests]);

  // Issue Types distribution
  const issueTypesDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRequests.forEach((r) => {
      const name =
        r.issue_type?.name ||
        (typeof r.issue_type === 'string' ? r.issue_type : null) ||
        (r.description && r.description.length > 30
          ? r.description.slice(0, 30) + '...'
          : r.description) ||
        'General Repair';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredRequests]);

  // Type 3: Requests by Barangay (Total, Resolved, Still Open, Most Common Issue Type - Sorted highest total first)
  const barangayReportData = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        resolved: number;
        stillOpen: number;
        issueCounts: Record<string, number>;
      }
    > = {};

    barangays.forEach((b) => {
      if (selectedBarangay === 'all' || selectedBarangay.toLowerCase() === b.name.toLowerCase()) {
        map[b.name] = { total: 0, resolved: 0, stillOpen: 0, issueCounts: {} };
      }
    });

    filteredRequests.forEach((r) => {
      const bName =
        r.customer?.barangay ||
        r.customer_profile?.barangay?.name ||
        (r as any).barangay ||
        'Poblacion';

      if (!map[bName]) {
        map[bName] = { total: 0, resolved: 0, stillOpen: 0, issueCounts: {} };
      }
      map[bName].total += 1;
      if (r.status === 'resolved') {
        map[bName].resolved += 1;
      } else if (r.status !== 'cancelled') {
        map[bName].stillOpen += 1;
      }

      const issueName =
        r.issue_type?.name ||
        (typeof r.issue_type === 'string' ? r.issue_type : 'General Leak / Repair');
      map[bName].issueCounts[issueName] = (map[bName].issueCounts[issueName] || 0) + 1;
    });

    return Object.entries(map)
      .map(([bName, data]) => {
        let topIssue = 'None';
        let topCount = 0;
        Object.entries(data.issueCounts).forEach(([issue, cnt]) => {
          if (cnt > topCount) {
            topCount = cnt;
            topIssue = issue;
          }
        });

        return {
          barangay: bName,
          total: data.total,
          resolved: data.resolved,
          stillOpen: data.stillOpen,
          topIssue: topCount > 0 ? `${topIssue} (${topCount})` : '—',
          resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredRequests, barangays, selectedBarangay]);

  // Type 4: Staff Task Report (Tasks assigned in period, in progress, resolved, avg time from Assigned to Resolved)
  const staffTaskReportData = useMemo(() => {
    const map: Record<
      number,
      {
        id: number;
        name: string;
        mobile: string;
        assignedBarangay: string;
        assignedCount: number;
        inProgressCount: number;
        resolvedCount: number;
        requests: ServiceRequest[];
      }
    > = {};

    staffList.forEach((s) => {
      const displayName =
        s.name ||
        `${s.staff_profile?.first_name || ''} ${s.staff_profile?.last_name || ''}`.trim() ||
        'Field Staff';

      map[s.id] = {
        id: s.id,
        name: displayName,
        mobile: s.mobile_number || '09170000002',
        assignedBarangay:
          s.staff_profile?.assigned_barangay?.name ||
          (s.staff_profile as any)?.assigned_barangay_name ||
          'Sinacaban Wide',
        assignedCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        requests: [],
      };
    });

    staffPeriodRequests.forEach((r) => {
      const staffId = r.assigned_staff_id || r.assigned_staff?.id;
      if (staffId && map[staffId]) {
        map[staffId].assignedCount += 1;
        map[staffId].requests.push(r);
        if (r.status === 'in_progress') map[staffId].inProgressCount += 1;
        if (r.status === 'resolved') map[staffId].resolvedCount += 1;
      }
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        avgTime: calculateStaffAvgTime(s.requests),
      }))
      .sort((a, b) => b.assignedCount - a.assignedCount);
  }, [staffPeriodRequests, staffList]);

  // Type 5: Water Advisory Report
  const advisoryReportData = useMemo(() => {
    return filteredAdvisories.map((a) => {
      const parts = (a.message || '').split(' — ');
      const rawTitle = a.title || parts[0] || 'Water Service Interruption';
      const rawType = (a as any).type || (a.is_emergency ? 'Emergency' : 'Scheduled');
      const titleWithType = `${rawType}: ${rawTitle}`;

      const brgyNames =
        a.barangays?.map((b) => b.name).join(', ') ||
        (a as any).barangay_names?.join(', ') ||
        'Poblacion';

      const actualEnd = (a as any).actual_restored_at
        ? formatPhilippineDateTime((a as any).actual_restored_at)
        : a.status === 'ended' || (a as any).status === 'completed' || (a as any).is_restored
        ? formatPhilippineDateTime(a.ends_at)
        : '—';

      const notifiedCount =
        a.affected_customers_count ??
        (a as any).recipient_count ??
        advisoriesStore.computeRecipientPreview(
          a.barangays?.map((b) => b.id) || (a as any).barangay_ids || []
        ).totalAffected;

      const liveStatus = (a as any).status || (a.is_published ? 'ongoing' : 'scheduled');

      return {
        id: a.id,
        title: titleWithType,
        rawTitle,
        type: rawType,
        affectedBarangays: brgyNames,
        startsAt: formatPhilippineDateTime(a.starts_at),
        expectedEndsAt: formatPhilippineDateTime(a.ends_at),
        actualEndsAt: actualEnd,
        status: liveStatus,
        customersNotified: notifiedCount,
      };
    });
  }, [filteredAdvisories]);

  // Active Matching Records Count for Selected Report Type
  const activeRecordsCount = useMemo(() => {
    if (reportType === 'water_advisories') {
      return filteredAdvisories.length;
    }
    if (reportType === 'staff_tasks') {
      return staffPeriodRequests.length;
    }
    return filteredRequests.length;
  }, [reportType, filteredAdvisories.length, staffPeriodRequests.length, filteredRequests.length]);

  // Handle Generate Report action
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRecordsCount === 0 || dateError) return;
    setIsGenerating(true);

    const scopeText =
      selectedBarangay === 'all'
        ? 'All barangays (Sinacaban Municipal Wide)'
        : selectedBarangay;
    const actionMsg = `Generated ${REPORT_TITLES[reportType]} Report on screen (Period: ${fromDate} to ${toDate}, Barangay: ${scopeText}, Format: On-screen)`;
    advisoriesStore.appendAuditLog(actionMsg, generatedByName);

    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
    }, 300);
  };

  // Handle Export CSV action tailored to Section C columns and naming convention
  const handleExportCsv = () => {
    if (activeRecordsCount === 0 || dateError) return;

    let headers: string[] = [];
    let rows: string[][] = [];
    const sanitize = (val: string | number | undefined | null) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    if (reportType === 'maintenance_summary') {
      headers = ['Category', 'Metric', 'Count / Value'];
      rows = [
        ['Overall Requests', 'Total Requests', String(filteredRequests.length)],
        ['Status Breakdown', 'Submitted', String(countsByStatus.submitted)],
        ['Status Breakdown', 'Assigned', String(countsByStatus.assigned)],
        ['Status Breakdown', 'In progress', String(countsByStatus.in_progress)],
        ['Status Breakdown', 'Resolved', String(countsByStatus.resolved)],
        ['Status Breakdown', 'Cancelled', String(countsByStatus.cancelled)],
        ['Urgency Breakdown', 'High Urgency', String(countsByUrgency.high)],
        ['Urgency Breakdown', 'Medium Urgency', String(countsByUrgency.medium)],
        ['Urgency Breakdown', 'Low Urgency', String(countsByUrgency.low)],
        ['Resolution Performance', 'Average Resolution Time (Submitted to Resolved)', averageResolutionTime],
        ...issueTypesDistribution.map(([type, cnt]) => ['Top Issue Types', type, String(cnt)]),
        ...barangayReportData.map((b) => ['Requests by Barangay', b.barangay, String(b.total)]),
      ];
    } else if (reportType === 'request_log') {
      headers = [
        'Request ID',
        'Date Submitted',
        'Customer',
        'Barangay',
        'Issue Type',
        'Urgency',
        'Status',
        'Assigned Staff',
        'Date Resolved',
      ];
      rows = filteredRequests.map((r) => {
        const custName =
          r.customer?.name ||
          r.customer?.full_name ||
          (r.customer_profile
            ? `${r.customer_profile.first_name || ''} ${r.customer_profile.last_name || ''}`.trim()
            : '') ||
          (r as any).customer_name ||
          'Resident Consumer';
        const dateSub = formatPhilippineDate(r.created_at);
        const dateRes =
          r.status === 'resolved'
            ? formatPhilippineDate(r.resolved_at || r.updated_at)
            : '—';
        const staffName = r.assigned_staff?.name || 'Unassigned';

        return [
          r.reference_number || r.reference_no || r.reference || `AT-${r.id}`,
          dateSub,
          custName,
          r.customer?.barangay || r.customer_profile?.barangay?.name || 'Poblacion',
          r.issue_type?.name || (typeof r.issue_type === 'string' ? r.issue_type : 'General Leak'),
          r.urgency || 'low',
          r.status === 'cancelled' ? 'Cancelled' : r.status,
          staffName,
          dateRes,
        ];
      });
    } else if (reportType === 'by_barangay') {
      headers = [
        'Barangay',
        'Total Requests',
        'Resolved',
        'Still Open',
        'Most Common Issue Type',
      ];
      rows = barangayReportData.map((b) => [
        b.barangay,
        String(b.total),
        String(b.resolved),
        String(b.stillOpen),
        b.topIssue,
      ]);
    } else if (reportType === 'staff_tasks') {
      headers = [
        'Staff Member',
        'Tasks Assigned',
        'In Progress',
        'Resolved',
        'Avg Time (Assigned to Resolved)',
      ];
      rows = staffTaskReportData.map((s) => [
        s.name,
        String(s.assignedCount),
        String(s.inProgressCount),
        String(s.resolvedCount),
        s.avgTime,
      ]);
    } else if (reportType === 'water_advisories') {
      headers = [
        'Advisory Type and Title',
        'Affected Barangays',
        'Start',
        'Expected End',
        'Actual End',
        'Status',
        'Customers Notified',
      ];
      rows = advisoryReportData.map((a) => [
        a.title,
        a.affectedBarangays,
        a.startsAt,
        a.expectedEndsAt,
        a.actualEndsAt,
        a.status,
        String(a.customersNotified),
      ]);
    }

    const csvContent = [
      headers.map(sanitize).join(','),
      ...rows.map((row) => row.map(sanitize).join(',')),
    ].join('\n');

    // Section D: Output file naming convention: aquatrack-<type>-<from>-<to>.csv
    const fileName = `aquatrack-${REPORT_CSV_SLUGS[reportType]}-${fromDate}-${toDate}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const scopeText =
      selectedBarangay === 'all'
        ? 'All barangays (Sinacaban Municipal Wide)'
        : selectedBarangay;
    const actionMsg = `Exported CSV for ${REPORT_TITLES[reportType]} (Period: ${fromDate} to ${toDate}, Barangay: ${scopeText}, Format: CSV)`;
    advisoriesStore.appendAuditLog(actionMsg, generatedByName);

    setModalState({
      isOpen: true,
      type: 'success',
      title: 'CSV Export Generated',
      message: `The official export file "${fileName}" with ${rows.length} records was downloaded and logged in the Activity Log.`,
    });
  };

  // Preview Title helper
  const previewHeaderTitle = useMemo(() => {
    switch (reportType) {
      case 'maintenance_summary':
        return 'Preview: counts by status, issue type, urgency, barangay';
      case 'request_log':
        return 'Preview: itemized maintenance requests log';
      case 'by_barangay':
        return 'Preview: geographic request distribution by barangay';
      case 'staff_tasks':
        return 'Preview: staff task workload distribution';
      case 'water_advisories':
        return 'Preview: water service interruptions & advisories';
    }
  }, [reportType]);

  const generatedAtFormatted = useMemo(() => {
    return new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  return (
    <AdminLayout currentPath="/admin/reports" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[14px] text-black">
        {/* Header */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Maintenance Reports
            </h1>
            <p className="text-xs text-black/50 mt-0.5">
              SIWASS Municipal Utility · Operations, maintenance resolution, and ledger exports
            </p>
          </div>
          {reportGenerated && (
            <Button
              type="button"
              variant="secondary"
              leftIcon={<IconPrinter size={14} />}
              onClick={() => window.print()}
              className="text-xs font-semibold self-start sm:self-auto"
            >
              Print or Save as PDF
            </Button>
          )}
        </div>

        {/* Configuration Card */}
        <Card className="p-5 border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white rounded-md print:hidden">
          {reportGenerated && (
            <div className="p-3 bg-[#F0F6FD] border border-[#1E6FD9]/20 rounded-lg text-xs text-black flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconCheck size={16} className="text-[#1E6FD9] shrink-0" />
                <span className="font-semibold text-black">
                  Report compiled successfully from municipal records
                </span>
              </div>
              <Badge variant="blue" className="text-[11px]">
                {activeRecordsCount} records
              </Badge>
            </div>
          )}

          <form onSubmit={handleGenerateReport} className="space-y-4">
            {/* 1. Report Type Selector */}
            <div>
              <label
                htmlFor="report-type-select"
                className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1.5"
              >
                <IconTools size={14} className="text-[#1E6FD9]" />
                <span>Report Type</span>
              </label>
              <select
                id="report-type-select"
                aria-label="Report Type"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as ReportType);
                  setReportGenerated(false);
                }}
                className="w-full p-2.5 bg-white text-black border border-black/15 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
              >
                <option value="maintenance_summary">Maintenance summary</option>
                <option value="request_log">Maintenance request log</option>
                <option value="by_barangay">Requests by barangay</option>
                <option value="staff_tasks">Staff task report</option>
                <option value="water_advisories">Water advisory report</option>
              </select>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs font-semibold text-black/60 mr-1">Date Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('this_month')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last_month')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last_30_days')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('year_to_date')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors"
              >
                Year to Date
              </button>
            </div>

            {/* 2. Date Range: From & To (Workflow Section 10 & Proposals: Cannot be later, and neither can be in future) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="from-date-input"
                  className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1"
                >
                  <IconCalendar size={13} className="text-[#1E6FD9]" />
                  <span>From</span>
                </label>
                <input
                  id="from-date-input"
                  type="date"
                  max={today}
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setReportGenerated(false);
                  }}
                  className={`w-full p-2 bg-white text-black border rounded text-xs outline-none font-normal ${
                    dateError ? 'border-[#E53935] focus:border-[#E53935]' : 'border-black/20 focus:border-[#1E6FD9]'
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="to-date-input"
                  className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1"
                >
                  <IconCalendar size={13} className="text-[#1E6FD9]" />
                  <span>To</span>
                </label>
                <input
                  id="to-date-input"
                  type="date"
                  max={today}
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setReportGenerated(false);
                  }}
                  className={`w-full p-2 bg-white text-black border rounded text-xs outline-none font-normal ${
                    dateError ? 'border-[#E53935] focus:border-[#E53935]' : 'border-black/20 focus:border-[#1E6FD9]'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Date Validation Alert Banner */}
            {dateError && (
              <div className="p-2.5 rounded-md bg-[#E53935]/10 border border-[#E53935]/30 text-xs text-[#E53935] font-semibold flex items-center gap-2">
                <IconAlertCircle size={15} className="shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            {/* 3. Barangay Filter */}
            <div>
              <label
                htmlFor="barangay-filter-select"
                className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1"
              >
                <IconFilter size={13} className="text-[#1E6FD9]" />
                <span>Barangay</span>
              </label>
              <select
                id="barangay-filter-select"
                value={selectedBarangay}
                onChange={(e) => {
                  setSelectedBarangay(e.target.value);
                  setReportGenerated(false);
                }}
                className="w-full p-2 bg-white text-black border border-black/20 rounded text-xs outline-none focus:border-[#1E6FD9]"
              >
                <option value="all">All barangays (Sinacaban Municipal Wide)</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Preview Box (Shows figures for selected type or empty state if no records match) */}
            <div className="border border-black/15 rounded p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black flex items-center gap-1.5">
                  <IconFileSpreadsheet size={16} className="text-[#1E6FD9]" />
                  <span>{previewHeaderTitle}</span>
                </span>
                <Badge variant={activeRecordsCount > 0 ? 'blue' : 'outline'}>
                  {activeRecordsCount} Matching Records
                </Badge>
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-black/50 text-xs">Computing municipal dataset...</div>
              ) : activeRecordsCount === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={<IconFileSpreadsheet size={36} className="text-black/30" />}
                    title="No matching records found"
                    description="No records match the selected date range and barangay filter. Adjust your filters to preview and generate reports."
                  />
                </div>
              ) : (
                <>
                  {/* PREVIEW: Maintenance Summary */}
                  {reportType === 'maintenance_summary' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[14px]">
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Total Requests</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {filteredRequests.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Resolved</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {countsByStatus.resolved}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">In Progress</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {countsByStatus.in_progress}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">High Urgency</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {countsByUrgency.high}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded col-span-2 sm:col-span-1">
                        <span className="text-xs font-semibold text-black/60 block">Avg Resolution Time</span>
                        <strong className="text-xl font-bold text-black block mt-1">
                          {averageResolutionTime}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW: Maintenance Request Log */}
                  {reportType === 'request_log' && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[14px]">
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Total Requests</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {filteredRequests.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Submitted</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {countsByStatus.submitted}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Assigned</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {countsByStatus.assigned}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">In Progress</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {countsByStatus.in_progress}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Resolved</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {countsByStatus.resolved}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW: Requests by Barangay */}
                  {reportType === 'by_barangay' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[14px]">
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Barangays with Requests</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {barangayReportData.filter((b) => b.total > 0).length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Total Requests</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {filteredRequests.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Highest Volume Barangay</span>
                        <strong className="text-lg font-bold text-black block mt-1 truncate">
                          {barangayReportData[0]?.total > 0 ? barangayReportData[0].barangay : 'None'}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Overall Resolved Rate</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {filteredRequests.length > 0
                            ? Math.round((countsByStatus.resolved / filteredRequests.length) * 100)
                            : 0}
                          %
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW: Staff Task Report */}
                  {reportType === 'staff_tasks' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[14px]">
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Active Field Staff</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {staffTaskReportData.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Tasks Assigned</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {staffPeriodRequests.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">In Progress</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {staffTaskReportData.reduce((acc, s) => acc + s.inProgressCount, 0)}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Resolved</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {staffTaskReportData.reduce((acc, s) => acc + s.resolvedCount, 0)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW: Water Advisory Report */}
                  {reportType === 'water_advisories' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[14px]">
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Total Advisories</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {filteredAdvisories.length}
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Ongoing Disruptions</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {
                            filteredAdvisories.filter(
                              (a) =>
                                a.status === 'ongoing' ||
                                (!a.status &&
                                  a.is_published &&
                                  new Date(a.starts_at) <= new Date() &&
                                  new Date(a.ends_at) > new Date())
                            ).length
                          }
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Scheduled Disruptions</span>
                        <strong className="text-2xl font-bold text-black block mt-1">
                          {
                            filteredAdvisories.filter(
                              (a) =>
                                a.status === 'scheduled' ||
                                (!a.status && new Date(a.starts_at) > new Date())
                            ).length
                          }
                        </strong>
                      </div>
                      <div className="bg-white p-3 border border-black/15 rounded">
                        <span className="text-xs font-semibold text-black/60 block">Completed / Restored</span>
                        <strong className="text-2xl font-bold text-[#1E6FD9] block mt-1">
                          {
                            filteredAdvisories.filter(
                              (a) =>
                                a.status === 'ended' ||
                                (a as any).status === 'completed' ||
                                (a as any).is_restored
                            ).length
                          }
                        </strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 5. Actions: Export CSV & Generate Report */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-black/10">
              <Button
                type="button"
                variant="secondary"
                onClick={handleExportCsv}
                disabled={activeRecordsCount === 0 || !!dateError}
                leftIcon={<IconDownload size={15} />}
                className="w-full sm:w-auto"
              >
                Export CSV
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={activeRecordsCount === 0 || !!dateError}
                isLoading={isGenerating}
                leftIcon={<IconCheck size={15} />}
                className="w-full sm:w-auto"
              >
                Generate report
              </Button>
            </div>
          </form>
        </Card>

        {/* 6. COMPILED REPORT VIEW (Printable page rendered when Generate Report is clicked) */}
        {reportGenerated && (
          <div
            id="aquatrack-report-print-area"
            className="p-6 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-6 bg-white animate-hero-entrance print:border-none print:shadow-none print:p-0"
          >
            {/* Report Document Header */}
            <div className="border-b border-black/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IconBuildingCommunity size={16} className="text-[#1E6FD9]" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#1E6FD9] block">
                    Official Municipal Ledger Report · SIWASS Water District
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-black mt-0.5">
                  {REPORT_TITLES[reportType]} Report
                </h2>
                <div className="text-xs text-black/65 mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span>
                    <strong>Period:</strong> {fromDate} to {toDate}
                  </span>
                  <span>
                    <strong>Barangay Scope:</strong>{' '}
                    {selectedBarangay === 'all'
                      ? 'All barangays (Sinacaban Municipal Wide)'
                      : `Barangay ${selectedBarangay}`}
                  </span>
                  <span>
                    <strong>Generated By:</strong> {generatedByName}
                  </span>
                  <span>
                    <strong>Date Generated:</strong> {generatedAtFormatted} (PHT)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Badge variant="blue" className="text-xs shrink-0">
                  {activeRecordsCount} records included
                </Badge>
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<IconPrinter size={14} />}
                  onClick={() => window.print()}
                  className="text-xs font-semibold"
                >
                  Print or Save as PDF
                </Button>
              </div>
            </div>

            {/* REPORT 1: MAINTENANCE SUMMARY */}
            {reportType === 'maintenance_summary' && (
              <div className="space-y-6">
                {/* Executive Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">Total Requests</span>
                    <strong className="text-xl font-bold text-black block mt-1">
                      {filteredRequests.length}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">Submitted</span>
                    <strong className="text-xl font-bold text-black block mt-1">
                      {countsByStatus.submitted}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">Assigned</span>
                    <strong className="text-xl font-bold text-[#1E6FD9] block mt-1">
                      {countsByStatus.assigned}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">In Progress</span>
                    <strong className="text-xl font-bold text-black block mt-1">
                      {countsByStatus.in_progress}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">Resolved</span>
                    <strong className="text-xl font-bold text-[#1E6FD9] block mt-1">
                      {countsByStatus.resolved}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 border border-black/10 rounded">
                    <span className="text-xs text-black/60 font-semibold block">Cancelled</span>
                    <strong className="text-xl font-bold text-black/60 block mt-1">
                      {countsByStatus.cancelled}
                    </strong>
                  </div>
                </div>

                {/* Status & Urgency Breakdown Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* By Status */}
                  <div className="border border-black/15 rounded overflow-hidden">
                    <div className="bg-black/5 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-black border-b border-black/15">
                      Status Distribution
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium">Submitted</td>
                          <td className="px-3.5 py-2 text-right font-bold text-black">
                            {countsByStatus.submitted}
                          </td>
                        </tr>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium">Assigned</td>
                          <td className="px-3.5 py-2 text-right font-bold text-[#1E6FD9]">
                            {countsByStatus.assigned}
                          </td>
                        </tr>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium">In Progress</td>
                          <td className="px-3.5 py-2 text-right font-bold text-black">
                            {countsByStatus.in_progress}
                          </td>
                        </tr>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium">Resolved</td>
                          <td className="px-3.5 py-2 text-right font-bold text-[#1E6FD9]">
                            {countsByStatus.resolved}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 font-medium">Cancelled</td>
                          <td className="px-3.5 py-2 text-right font-bold text-black/50">
                            {countsByStatus.cancelled}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* By Urgency */}
                  <div className="border border-black/15 rounded overflow-hidden">
                    <div className="bg-black/5 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-black border-b border-black/15">
                      Urgency Distribution
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium text-black flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#E53935]" />
                            <span>High Urgency</span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-bold text-black">
                            {countsByUrgency.high}
                          </td>
                        </tr>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium text-black flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FB8C00]" />
                            <span>Medium Urgency</span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-bold text-black">
                            {countsByUrgency.medium}
                          </td>
                        </tr>
                        <tr className="border-b border-black/5">
                          <td className="px-3.5 py-2 font-medium text-black flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                            <span>Low Urgency</span>
                          </td>
                          <td className="px-3.5 py-2 text-right font-bold text-black/60">
                            {countsByUrgency.low}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 font-medium text-black/70">
                            Avg Resolution Time (Submitted to Resolved)
                          </td>
                          <td className="px-3.5 py-2 text-right font-bold text-[#1E6FD9]">
                            {averageResolutionTime}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Issue Type Frequency & Barangay Distribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-black/15 rounded overflow-hidden">
                    <div className="bg-black/5 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-black border-b border-black/15">
                      Requests by Issue Type
                    </div>
                    {issueTypesDistribution.length === 0 ? (
                      <div className="p-4 text-center text-xs text-black/50">No issues recorded in period.</div>
                    ) : (
                      <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
                        {issueTypesDistribution.map(([type, cnt]) => (
                          <div key={type} className="px-3.5 py-2 text-xs flex items-center justify-between">
                            <span className="font-medium text-black">{type}</span>
                            <span className="font-bold text-black bg-black/5 px-2 py-0.5 rounded">
                              {cnt} {cnt === 1 ? 'request' : 'requests'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-black/15 rounded overflow-hidden">
                    <div className="bg-black/5 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-black border-b border-black/15">
                      Requests by Barangay
                    </div>
                    {barangayReportData.filter((b) => b.total > 0).length === 0 ? (
                      <div className="p-4 text-center text-xs text-black/50">No barangay requests recorded.</div>
                    ) : (
                      <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
                        {barangayReportData.map((b) => (
                          <div key={b.barangay} className="px-3.5 py-2 text-xs flex items-center justify-between">
                            <span className="font-medium text-black">{b.barangay}</span>
                            <span className="font-bold text-black bg-black/5 px-2 py-0.5 rounded">
                              {b.total} {b.total === 1 ? 'request' : 'requests'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REPORT 2: MAINTENANCE REQUEST LOG */}
            {reportType === 'request_log' && (
              <div className="space-y-3">
                <div className="overflow-x-auto border border-black/15 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 text-black font-bold">
                        <th className="p-2.5">Request ID</th>
                        <th className="p-2.5">Date Submitted</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Barangay</th>
                        <th className="p-2.5">Issue Type</th>
                        <th className="p-2.5">Urgency</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Assigned Staff</th>
                        <th className="p-2.5">Date Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-black/50">
                            No requests found matching the period and barangay filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((r) => {
                          const custName =
                            r.customer?.name ||
                            r.customer?.full_name ||
                            (r.customer_profile
                              ? `${r.customer_profile.first_name || ''} ${r.customer_profile.last_name || ''}`.trim()
                              : '') ||
                            (r as any).customer_name ||
                            'Resident Consumer';
                          const isCancelled = r.status === 'cancelled';

                          return (
                            <tr
                              key={r.id}
                              className={`transition-colors ${
                                isCancelled ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-black/[0.02]'
                              }`}
                            >
                              <td className="p-2.5 font-bold font-mono text-black">
                                {r.reference_number || r.reference_no || r.reference || `AT-${r.id}`}
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-black/75">
                                {formatPhilippineDate(r.created_at)}
                              </td>
                              <td className="p-2.5 font-medium text-black">{custName}</td>
                              <td className="p-2.5 text-black/80">
                                {r.customer?.barangay || r.customer_profile?.barangay?.name || 'Poblacion'}
                              </td>
                              <td className="p-2.5 font-medium text-black">
                                {r.issue_type?.name ||
                                  (typeof r.issue_type === 'string' ? r.issue_type : 'General Leak')}
                              </td>
                              <td className="p-2.5">
                                <Badge
                                  variant={r.urgency === 'high' ? 'blue' : 'outline'}
                                  className="text-[10px] capitalize font-bold"
                                >
                                  {r.urgency}
                                </Badge>
                              </td>
                              <td className="p-2.5">
                                {isCancelled ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                                    Cancelled
                                  </span>
                                ) : (
                                  <Badge
                                    variant={
                                      r.status === 'resolved' || r.status === 'in_progress'
                                        ? 'blue'
                                        : 'outline'
                                    }
                                    className="text-[10px] uppercase font-bold"
                                  >
                                    {r.status}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2.5 font-medium text-black/80">
                                {r.assigned_staff?.name || 'Unassigned'}
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-black/70">
                                {r.status === 'resolved'
                                  ? formatPhilippineDate(r.resolved_at || r.updated_at)
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 3: REQUESTS BY BARANGAY */}
            {reportType === 'by_barangay' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-black/15 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 text-black font-bold">
                        <th className="p-2.5">Barangay</th>
                        <th className="p-2.5 text-center">Total Requests</th>
                        <th className="p-2.5 text-center">Resolved</th>
                        <th className="p-2.5 text-center">Still Open</th>
                        <th className="p-2.5">Most Common Issue Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {barangayReportData.map((b) => (
                        <tr key={b.barangay} className="hover:bg-black/[0.02] transition-colors">
                          <td className="p-2.5 font-bold text-black">{b.barangay}</td>
                          <td className="p-2.5 text-center font-bold text-black">{b.total}</td>
                          <td className="p-2.5 text-center font-semibold text-[#1E6FD9]">{b.resolved}</td>
                          <td className="p-2.5 text-center font-semibold text-black">{b.stillOpen}</td>
                          <td className="p-2.5 text-black/85 font-medium">{b.topIssue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 4: STAFF TASK REPORT */}
            {reportType === 'staff_tasks' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-black/15 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 text-black font-bold">
                        <th className="p-2.5">Staff Member</th>
                        <th className="p-2.5 text-center">Tasks Assigned in Period</th>
                        <th className="p-2.5 text-center">In Progress</th>
                        <th className="p-2.5 text-center">Resolved</th>
                        <th className="p-2.5 text-right">Avg Time (Assigned to Resolved)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {staffTaskReportData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-black/50">
                            No field technicians recorded.
                          </td>
                        </tr>
                      ) : (
                        staffTaskReportData.map((s) => (
                          <tr key={s.id} className="hover:bg-black/[0.02] transition-colors">
                            <td className="p-2.5 font-bold text-black">
                              <div>{s.name}</div>
                              <div className="text-[10px] text-black/50 font-normal">{s.assignedBarangay}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold text-[#1E6FD9]">
                              {s.assignedCount}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-black">
                              {s.inProgressCount}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-[#1E6FD9]">
                              {s.resolvedCount}
                            </td>
                            <td className="p-2.5 text-right font-bold text-black">
                              {s.avgTime}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 5: WATER ADVISORY REPORT */}
            {reportType === 'water_advisories' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-black/15 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 text-black font-bold">
                        <th className="p-2.5">Advisory Type and Title</th>
                        <th className="p-2.5">Affected Barangays</th>
                        <th className="p-2.5">Start</th>
                        <th className="p-2.5">Expected End</th>
                        <th className="p-2.5">Actual End</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Customers Notified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {advisoryReportData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-black/50">
                            No water advisories recorded within this period and barangay filter.
                          </td>
                        </tr>
                      ) : (
                        advisoryReportData.map((a) => (
                          <tr key={a.id} className="hover:bg-black/[0.02] transition-colors">
                            <td className="p-2.5 font-bold text-black">{a.title}</td>
                            <td className="p-2.5 text-black/75 font-medium">{a.affectedBarangays}</td>
                            <td className="p-2.5 whitespace-nowrap font-mono text-black/80">
                              {a.startsAt}
                            </td>
                            <td className="p-2.5 whitespace-nowrap font-mono text-black/80">
                              {a.expectedEndsAt}
                            </td>
                            <td className="p-2.5 whitespace-nowrap font-mono text-black/80">
                              {a.actualEndsAt}
                            </td>
                            <td className="p-2.5 text-center">
                              <Badge
                                variant={
                                  a.status === 'ongoing' || (!a.status && (a as any).is_published)
                                    ? 'blue'
                                    : 'outline'
                                }
                                className="text-[10px] uppercase font-bold"
                              >
                                {a.status}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-right font-bold text-[#1E6FD9]">
                              {a.customersNotified}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modern System Notification & Confirmation Modal */}
        <SystemModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState((m) => ({ ...m, isOpen: false }))}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          confirmText="Dismiss"
        />
      </div>
    </AdminLayout>
  );
}
