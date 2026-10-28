import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { NoMatchesIllustration } from '../../components/illustrations';
import { SystemModal } from '../../components/molecules/SystemModal';
import { useAuth } from '../../contexts/AuthContext';
import { requestsApi, referenceApi, interruptionsApi, adminApi, reportsApi } from '../../api';
import type { ServiceRequest, Barangay, WaterInterruption, User } from '../../types';
import { DEFAULT_ACTIVE_STAFF } from '../../services/maintenanceStore';
import { SINACABAN_BARANGAY_LIST, advisoriesStore } from '../../services/advisoriesStore';
import {
  IconDownload,
  IconCalendar,
  IconFilter,
  IconFileSpreadsheet,
  IconTools,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconFileText,
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

  // Output Status States (Part D Revised: Short "Report ready" confirmation and error with "Try again")
  const [reportReadyMessage, setReportReadyMessage] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
    setReportReadyMessage(null);
    setPdfError(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqRes, bgRes, staffRes, intRes] = await Promise.all([
          requestsApi.list({ per_page: 500 }).catch(() => ({ data: [] })),
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

  // Type 3: Requests by Barangay (Sorted by highest total first)
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

  // Type 4: Staff Task Report
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
    return filteredAdvisories.map((a: any) => {
      const parts = (a.message || '').split(' — ');
      const rawTitle = a.title || parts[0] || 'Water Service Interruption';
      const rawType = a.type || (a.is_emergency ? 'Emergency' : 'Scheduled');
      const titleWithType = `${rawType}: ${rawTitle}`;

      const brgyNames =
        a.barangays?.map((b: any) => b.name).join(', ') ||
        a.barangay_names?.join(', ') ||
        'Poblacion';

      const actualEnd = a.actual_restored_at
        ? formatPhilippineDateTime(a.actual_restored_at)
        : a.status === 'ended' || a.status === 'completed' || a.is_restored
        ? formatPhilippineDateTime(a.ends_at)
        : '—';

      const notifiedCount =
        a.affected_customers_count ??
        a.recipient_count ??
        advisoriesStore.computeRecipientPreview(
          a.barangays?.map((b: any) => b.id) || a.barangay_ids || []
        ).totalAffected;

      const liveStatus = a.status || (a.is_published ? 'ongoing' : 'scheduled');

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

  // D. Size limit: the request log PDF holds up to 500 rows.
  const isRequestLogOverLimit = useMemo(() => {
    return reportType === 'request_log' && filteredRequests.length > 500;
  }, [reportType, filteredRequests.length]);

  // -------------------------------------------------------------
  // D. Revised Output: Build PDF in the browser with jsPDF + autoTable
  // -------------------------------------------------------------
  const handleGeneratePdf = async () => {
    if (activeRecordsCount === 0 || dateError) return;
    if (isRequestLogOverLimit) {
      setModalState({
        isOpen: true,
        type: 'warning',
        title: 'Request Log Limit Exceeded',
        message: `The request log PDF holds up to 500 rows (currently ${filteredRequests.length} matching records). Please narrow the date range or use Export CSV to download the complete ledger.`,
      });
      return;
    }

    setIsGenerating(true);
    setPdfError(null);
    setReportReadyMessage(null);

    try {
      // Determine orientation per Section D specifications:
      // Portrait for Maintenance summary, Requests by barangay, and Water advisory report.
      // Landscape for Maintenance request log and Staff task report.
      const isLandscape = reportType === 'request_log' || reportType === 'staff_tasks';
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const scopeText =
        selectedBarangay === 'all'
          ? 'All barangays (Sinacaban Municipal Wide)'
          : `Barangay ${selectedBarangay}`;
      const generatedDateTime = `${formatPhilippineDateTime(new Date().toISOString())} (PHT)`;

      // 1. Header (AquaTrack logo, “SIWASS, Sinacaban”, report name, period, barangay, who generated it, date and time)
      doc.setFillColor(30, 111, 217); // brand-blue
      doc.rect(0, 0, pageWidth, 4, 'F');

      const logoX = 14;
      const logoY = 11;

      // Stylized AquaTrack Logo Mark
      doc.setFillColor(30, 111, 217);
      doc.circle(logoX + 3.5, logoY + 3.5, 3.5, 'F');
      doc.setFillColor(255, 255, 255);
      doc.circle(logoX + 4.5, logoY + 2.5, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 111, 217);
      doc.text('AquaTrack', logoX + 10, logoY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text('SIWASS, Sinacaban', logoX + 10, logoY + 9.5);

      // Report Header Metadata on Top-Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(`${REPORT_TITLES[reportType]} Report`, pageWidth - 14, logoY + 4, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Period: ${fromDate} to ${toDate}  |  Scope: ${scopeText}`, pageWidth - 14, logoY + 8.5, { align: 'right' });
      doc.text(`Generated by: ${generatedByName}  |  ${generatedDateTime}`, pageWidth - 14, logoY + 12.5, { align: 'right' });

      // Divider line
      doc.setDrawColor(215, 215, 215);
      doc.setLineWidth(0.4);
      doc.line(14, logoY + 16, pageWidth - 14, logoY + 16);

      let currentY = logoY + 22;

      // 2. Body: Summary Figures First, Then Table
      if (reportType === 'maintenance_summary') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 111, 217);
        doc.text('Executive Summary Figures & Metrics', 14, currentY);
        currentY += 3;

        autoTable(doc, {
          startY: currentY,
          head: [['Maintenance Metric', 'Count / Value', 'Category Scope']],
          body: [
            ['Total Service Requests', String(filteredRequests.length), 'Overall Requests'],
            ['Submitted (Unassigned)', String(countsByStatus.submitted), 'Status Breakdown'],
            ['Assigned to Field Technician', String(countsByStatus.assigned), 'Status Breakdown'],
            ['In Progress Jobs', String(countsByStatus.in_progress), 'Status Breakdown'],
            ['Resolved Repairs', String(countsByStatus.resolved), 'Status Breakdown'],
            ['Cancelled Requests', String(countsByStatus.cancelled), 'Status Breakdown'],
            ['High Urgency Repairs', String(countsByUrgency.high), 'Urgency Breakdown'],
            ['Medium Urgency Repairs', String(countsByUrgency.medium), 'Urgency Breakdown'],
            ['Low Urgency Repairs', String(countsByUrgency.low), 'Urgency Breakdown'],
            ['Average Resolution Time (Submitted to Resolved)', averageResolutionTime, 'Resolution Performance'],
          ],
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14, bottom: 16 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 111, 217);
        doc.text('Requests by Issue Category', 14, currentY);
        currentY += 3;

        autoTable(doc, {
          startY: currentY,
          head: [['Issue Type', 'Reported Incidents']],
          body:
            issueTypesDistribution.length > 0
              ? issueTypesDistribution.map(([type, cnt]) => [type, String(cnt)])
              : [['No issues recorded', '0']],
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14, bottom: 16 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 111, 217);
        doc.text('Requests by Barangay Distribution', 14, currentY);
        currentY += 3;

        autoTable(doc, {
          startY: currentY,
          head: [['Barangay', 'Total Requests', 'Resolved', 'Still Open', 'Most Common Issue']],
          body: barangayReportData.map((b) => [
            b.barangay,
            String(b.total),
            String(b.resolved),
            String(b.stillOpen),
            b.topIssue,
          ]),
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14, bottom: 16 },
        });
      } else if (reportType === 'request_log') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(
          `Summary: Total Requests: ${filteredRequests.length}  |  Submitted: ${countsByStatus.submitted}  |  Assigned: ${countsByStatus.assigned}  |  In Progress: ${countsByStatus.in_progress}  |  Resolved: ${countsByStatus.resolved}  |  Cancelled: ${countsByStatus.cancelled}`,
          14,
          currentY
        );
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [[
            'Request ID',
            'Date Submitted',
            'Customer',
            'Barangay',
            'Issue Type',
            'Urgency',
            'Status',
            'Assigned Staff',
            'Date Resolved',
          ]],
          body: filteredRequests.map((r) => {
            const custName =
              (r.customer as any)?.name ||
              r.customer?.full_name ||
              (r.customer_profile
                ? `${r.customer_profile.first_name || ''} ${r.customer_profile.last_name || ''}`.trim()
                : '') ||
              (r as any).customer_name ||
              'Resident Customer';
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
          }),
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14, right: 14, bottom: 16 },
        });
      } else if (reportType === 'by_barangay') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(
          `Summary: Total Barangays: ${barangayReportData.filter((b) => b.total > 0).length}  |  Total Requests: ${filteredRequests.length}  |  Overall Resolved: ${countsByStatus.resolved} (${filteredRequests.length > 0 ? Math.round((countsByStatus.resolved / filteredRequests.length) * 100) : 0}%)`,
          14,
          currentY
        );
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [['Barangay', 'Total Requests', 'Resolved', 'Still Open', 'Most Common Issue Type']],
          body: barangayReportData.map((b) => [
            b.barangay,
            String(b.total),
            String(b.resolved),
            String(b.stillOpen),
            b.topIssue,
          ]),
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7.5 },
          margin: { left: 14, right: 14, bottom: 16 },
        });
      } else if (reportType === 'staff_tasks') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(
          `Summary: Active Field Staff: ${staffTaskReportData.length}  |  Tasks Assigned in Period: ${staffPeriodRequests.length}  |  In Progress: ${staffTaskReportData.reduce((acc, s) => acc + s.inProgressCount, 0)}  |  Resolved: ${staffTaskReportData.reduce((acc, s) => acc + s.resolvedCount, 0)}`,
          14,
          currentY
        );
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [['Staff Member', 'Assigned Sector', 'Tasks Assigned in Period', 'In Progress', 'Resolved', 'Avg Time (Assigned to Resolved)']],
          body: staffTaskReportData.map((s) => [
            s.name,
            s.assignedBarangay,
            String(s.assignedCount),
            String(s.inProgressCount),
            String(s.resolvedCount),
            s.avgTime,
          ]),
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14, right: 14, bottom: 16 },
        });
      } else if (reportType === 'water_advisories') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        doc.text(
          `Summary: Total Advisories: ${filteredAdvisories.length}  |  Ongoing: ${filteredAdvisories.filter((a) => a.status === 'ongoing' || (!a.status && a.is_published)).length}  |  Scheduled: ${filteredAdvisories.filter((a) => a.status === 'scheduled').length}  |  Completed: ${filteredAdvisories.filter((a) => a.status === 'ended' || (a as any).status === 'completed' || (a as any).is_restored).length}`,
          14,
          currentY
        );
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [['Advisory Type and Title', 'Affected Barangays', 'Start (PHT)', 'Expected End (PHT)', 'Actual End (PHT)', 'Status', 'Customers Notified']],
          body: advisoryReportData.map((a) => [
            a.title,
            a.affectedBarangays,
            a.startsAt,
            a.expectedEndsAt,
            a.actualEndsAt,
            a.status,
            String(a.customersNotified),
          ]),
          showHead: 'everyPage',
          theme: 'striped',
          headStyles: { fillColor: [30, 111, 217], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14, right: 14, bottom: 16 },
        });
      }

      // 3. Footer: "Page x of y" and "Generated by AquaTrack" repeating on every page
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);

        const pWidth = doc.internal.pageSize.getWidth();
        const pHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.3);
        doc.line(14, pHeight - 11, pWidth - 14, pHeight - 11);

        doc.text('Generated by AquaTrack · SIWASS, Sinacaban', 14, pHeight - 6);
        doc.text(`Page ${i} of ${pageCount}`, pWidth - 14, pHeight - 6, { align: 'right' });
      }

      // 4. Download PDF with standardized name: aquatrack-<type>-<from>-<to>.pdf
      const fileName = `aquatrack-${REPORT_CSV_SLUGS[reportType]}-${fromDate}-${toDate}.pdf`;
      doc.save(fileName);

      // 5. Activity Log recording (admin, type, period, barangay, and format: PDF)
      const actionMsg = `Generated PDF: ${REPORT_TITLES[reportType]} Report | Period: ${fromDate} to ${toDate} | Barangay: ${scopeText} | Format: PDF`;
      advisoriesStore.appendAuditLog(actionMsg, generatedByName);
      reportsApi.logExport({
        report_type: reportType,
        from: fromDate,
        to: toDate,
        barangay: scopeText,
        format: 'pdf',
      }).catch(() => {});

      // 6. Confirmation message
      setReportReadyMessage(`Report ready: "${fileName}" has been generated and downloaded.`);
    } catch {
      setPdfError('Failed to build PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
          (r.customer as any)?.name ||
          r.customer?.full_name ||
          (r.customer_profile
            ? `${r.customer_profile.first_name || ''} ${r.customer_profile.last_name || ''}`.trim()
            : '') ||
          (r as any).customer_name ||
          'Resident Customer';
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
    reportsApi.logExport({
      report_type: reportType,
      from: fromDate,
      to: toDate,
      barangay: scopeText,
      format: 'csv',
    }).catch(() => {});

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

  return (
    <AdminLayout currentPath="/admin/reports" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[14px] text-black">
        {/* Header - Direct & Clean, Minimal Text */}
        <div className="border-b border-black/10 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Maintenance Reports
          </h1>
        </div>

        {/* Configuration Card */}
        <Card className="p-5 border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white rounded-md">
          {/* Feedback: Short "Report ready" message */}
          {reportReadyMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">{reportReadyMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportReadyMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Feedback: Error message with Try again */}
          {pdfError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconAlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{pdfError}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGeneratePdf}
                className="text-xs px-2.5 py-1"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Size Limit Warning: Request log holds up to 500 rows */}
          {isRequestLogOverLimit && (
            <div className="p-3 rounded-lg bg-urgency-medium/10 border border-urgency-medium/30 text-xs text-black flex items-start gap-2.5">
              <IconAlertTriangle size={17} className="text-urgency-medium shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-black">Request Log PDF Limit Exceeded</span>
                <span className="text-black/80">
                  The request log PDF holds up to 500 rows (currently {filteredRequests.length} matching records).
                  Please narrow the date range or use <strong>Export CSV</strong> to download the complete ledger.
                </span>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGeneratePdf();
            }}
            className="space-y-4"
          >
            {/* 1. Report Type Selector */}
            <div>
              <label
                htmlFor="report-type-select"
                className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1.5"
              >
                <IconTools size={14} className="text-brand-blue" />
                <span>Report Type</span>
              </label>
              <select
                id="report-type-select"
                aria-label="Report Type"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as ReportType);
                  setReportReadyMessage(null);
                  setPdfError(null);
                }}
                className="w-full p-2.5 bg-white text-black border border-black/15 rounded-lg text-xs outline-none focus:border-brand-blue"
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
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last_month')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors cursor-pointer"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('last_30_days')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors cursor-pointer"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyDatePreset('year_to_date')}
                className="px-2.5 py-1 text-xs rounded border border-black/15 bg-slate-50 hover:bg-black/5 text-black font-medium transition-colors cursor-pointer"
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
                  <IconCalendar size={13} className="text-brand-blue" />
                  <span>From</span>
                </label>
                <input
                  id="from-date-input"
                  type="date"
                  max={today}
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setReportReadyMessage(null);
                    setPdfError(null);
                  }}
                  className={`w-full p-2 bg-white text-black border rounded text-xs outline-none font-normal ${
                    dateError ? 'border-urgency-high focus:border-urgency-high' : 'border-black/20 focus:border-brand-blue'
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="to-date-input"
                  className="block text-xs font-semibold text-black/70 mb-1 flex items-center gap-1"
                >
                  <IconCalendar size={13} className="text-brand-blue" />
                  <span>To</span>
                </label>
                <input
                  id="to-date-input"
                  type="date"
                  max={today}
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setReportReadyMessage(null);
                    setPdfError(null);
                  }}
                  className={`w-full p-2 bg-white text-black border rounded text-xs outline-none font-normal ${
                    dateError ? 'border-urgency-high focus:border-urgency-high' : 'border-black/20 focus:border-brand-blue'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Date Validation Alert Banner */}
            {dateError && (
              <div className="p-2.5 rounded-md bg-urgency-high/10 border border-urgency-high/30 text-xs text-urgency-high font-semibold flex items-center gap-2">
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
                <IconFilter size={13} className="text-brand-blue" />
                <span>Barangay</span>
              </label>
              <select
                id="barangay-filter-select"
                value={selectedBarangay}
                onChange={(e) => {
                  setSelectedBarangay(e.target.value);
                  setReportReadyMessage(null);
                  setPdfError(null);
                }}
                className="w-full p-2 bg-white text-black border border-black/20 rounded text-xs outline-none focus:border-brand-blue"
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
                  <IconFileSpreadsheet size={16} className="text-brand-blue" />
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
                    illustration={<NoMatchesIllustration />}
                    title="No matches"
                    description="No records match the selected date range and barangay filter."
                    actionLabel="Clear filters"
                    onAction={() => {
                      setSelectedBarangay('all');
                    }}
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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
                        <strong className="text-2xl font-bold text-brand-blue block mt-1">
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

            {/* 5. Actions: Export CSV & Generate Report (PDF) */}
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
                disabled={activeRecordsCount === 0 || !!dateError || isRequestLogOverLimit}
                isLoading={isGenerating}
                leftIcon={<IconFileText size={15} />}
                className="w-full sm:w-auto"
              >
                Generate report
              </Button>
            </div>
          </form>
        </Card>

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
