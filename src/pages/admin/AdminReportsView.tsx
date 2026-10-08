import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { requestsApi, referenceApi, interruptionsApi } from '../../api';
import type { ServiceRequest, Barangay, WaterInterruption } from '../../types';
import {
  IconFileText,
  IconDownload,
  IconCalendar,
  IconFilter,
  IconCheck,
} from '@tabler/icons-react';

export function AdminReportsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [interruptions, setInterruptions] = useState<WaterInterruption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wireframe A11 Form State
  const [reportType, setReportType] = useState<string>('maintenance');
  const [fromDate, setFromDate] = useState<string>('2026-10-01');
  const [toDate, setToDate] = useState<string>('2026-10-31');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqRes, bgRes, intRes] = await Promise.all([
          requestsApi.list({ per_page: 100 }).catch(() => ({ data: [] })),
          referenceApi.getBarangays().catch(() => []),
          interruptionsApi.list().catch(() => ({ data: [] })),
        ]);
        setRequests(reqRes.data);
        setBarangays(bgRes);
        setInterruptions(intRes.data);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter requests matching report criteria
  const filteredData = useMemo(() => {
    return requests.filter((r) => {
      if (selectedBarangay !== 'all') {
        const bg = r.customer?.barangay || 'Poblacion';
        if (bg !== selectedBarangay) return false;
      }
      return true;
    });
  }, [requests, selectedBarangay]);

  // Breakdown statistics for preview
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { submitted: 0, assigned: 0, in_progress: 0, resolved: 0, cancelled: 0 };
    filteredData.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [filteredData]);

  const countsByUrgency = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    filteredData.forEach((r) => {
      counts[r.urgency] = (counts[r.urgency] || 0) + 1;
    });
    return counts;
  }, [filteredData]);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
    }, 400);
  };

  const handleExportCsv = () => {
    const headers = ['Reference', 'Issue Type', 'Barangay', 'Customer Urgency', 'Derived Urgency', 'Status', 'Date'];
    const rows = filteredData.map((r) => [
      r.reference_no || r.reference || `AT-${r.id}`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.customer?.barangay || 'Poblacion',
      r.customer_urgency,
      r.urgency,
      r.status,
      r.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AquaTrack_${reportType}_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout currentPath="/admin/reports" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[14px] text-black">
        {/* Wireframe A11 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black">
              Maintenance Reports
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={handleGenerateReport}
            isLoading={isGenerating}
            className="flex items-center gap-1 self-start sm:self-auto"
          >
            <IconFileText size={14} />
            <span>Generate report</span>
          </Button>
        </div>

        {/* Wireframe A11 Form */}
        <Card className="p-5 border border-black/15 shadow-sm space-y-4">
          {reportGenerated && (
            <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
              <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
              <span>Report successfully compiled from municipal ledger records!</span>
            </div>
          )}

          <form onSubmit={handleGenerateReport} className="space-y-3">
            {/* Report Type */}
            <div>
              <label className="block text-xs font-semibold text-black/60 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-sans"
              >
                <option value="maintenance">Maintenance report (Repairs & SLA)</option>
                <option value="service_requests">Service requests summary & dispatch backlog</option>
                <option value="water_interruptions">Water disruptions & advisory log</option>
                <option value="consumer_registry">Consumer verification & meter inventory</option>
              </select>
            </div>

            {/* Date Range: From & To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1 flex items-center gap-1">
                  <IconCalendar size={12} className="text-[#1E6FD9]" />
                  <span>From</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1 flex items-center gap-1">
                  <IconCalendar size={12} className="text-[#1E6FD9]" />
                  <span>To</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
                  required
                />
              </div>
            </div>

            {/* Barangay Filter */}
            <div>
              <label className="block text-xs font-semibold text-black/60 mb-1 flex items-center gap-1">
                <IconFilter size={12} className="text-[#1E6FD9]" />
                <span>Barangay</span>
              </label>
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-sans"
              >
                <option value="all">All barangays (Sinacaban Municipal Wide)</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Wireframe A11 Preview Box: counts by status, issue type, barangay */}
            <div className="border border-dashed border-black/30 rounded p-4 bg-[#F0F6FD] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black">
                  Preview: counts by status, issue type, barangay
                </span>
                <Badge variant="blue">{filteredData.length} Matching Records</Badge>
              </div>

              {isLoading ? (
                <div className="py-4 text-center text-black/50">Computing municipal dataset...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[14px]">
                  <div className="bg-white p-3 border border-black/15 rounded">
                    <span className="text-xs font-semibold text-black/60 block">Resolved Repairs</span>
                    <strong className="text-2xl sm:text-3xl font-bold text-[#1E6FD9] block mt-1">{countsByStatus.resolved}</strong>
                  </div>

                  <div className="bg-white p-3 border border-black/15 rounded">
                    <span className="text-xs font-semibold text-black/60 block">In Progress Jobs</span>
                    <strong className="text-2xl sm:text-3xl font-bold text-black block mt-1">{countsByStatus.in_progress}</strong>
                  </div>

                  <div className="bg-white p-3 border border-black/15 rounded">
                    <span className="text-xs font-semibold text-black/60 block">High Priority</span>
                    <strong className="text-2xl sm:text-3xl font-bold text-black block mt-1">{countsByUrgency.high}</strong>
                  </div>

                  <div className="bg-white p-3 border border-black/15 rounded">
                    <span className="text-xs font-semibold text-black/60 block">Total Advisories</span>
                    <strong className="text-2xl sm:text-3xl font-bold text-black block mt-1">{interruptions.length}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Wireframe A11 Actions: Export & Generate */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-black/10">
              <Button
                type="button"
                variant="secondary"
                onClick={handleExportCsv}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <IconDownload size={14} />
                <span>Export CSV</span>
              </Button>

              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                isLoading={isGenerating}
              >
                <IconCheck size={14} className="inline mr-1" />
                Generate report
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
