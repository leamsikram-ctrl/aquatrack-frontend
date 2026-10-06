import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { requestsApi, referenceApi } from '../../api';
import type { ServiceRequest, Barangay } from '../../types';
import { IconDownload, IconPrinter } from '@tabler/icons-react';

export function AdminReportsView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [reportType, setReportType] = useState('Maintenance report');
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | 'all'>('all');
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-31');

  useEffect(() => {
    Promise.all([
      requestsApi.list({ per_page: 50 }),
      referenceApi.getBarangays().catch(() => []),
    ]).then(([reqRes, bgRes]) => {
      setRequests(reqRes.data);
      setBarangays(bgRes);
    });
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (selectedBarangayId === 'all') return true;
    return r.barangay?.id === selectedBarangayId || r.customer_profile?.barangay_id === selectedBarangayId;
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Reference,Issue,Barangay,Urgency,Status,Assigned Staff']
        .concat(
          filteredRequests.map(
            (r) =>
              `"${r.reference_no || r.reference}","${r.issue_type?.name || 'General'}","${
                r.customer?.barangay || r.barangay?.name || 'Poblacion'
              }","${r.urgency}","${r.status}","${r.assigned_staff?.name || 'Unassigned'}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIWASS_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout
      title="Reports & Analytics"
      subtitle="Municipal Utility Audits"
      currentPath="/admin/reports"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Header - Matches Wireframe A11 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Generate Maintenance & Utility Reports
            </h1>
            <p className="text-[10px] text-black/60">
              Export comprehensive counts by status, repair categories, and barangay distributions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <IconPrinter size={12} className="inline mr-1" />
              Print Preview
            </Button>
            <Button variant="primary" onClick={handleExportCsv}>
              <IconDownload size={12} className="inline mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Form Card - Matches Wireframe A11 */}
        <Card className="p-4 border border-black/15 space-y-3 bg-[#F0F6FD]">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px]">
            <div>
              <label className="block font-bold text-black uppercase mb-1">Report type</label>
              <select
                className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="Maintenance report">Maintenance report</option>
                <option value="Billing compliance report">Billing compliance report</option>
                <option value="Interruption frequency report">Interruption frequency report</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-black uppercase mb-1">From Date</label>
              <input
                type="date"
                className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-black uppercase mb-1">To Date</label>
              <input
                type="date"
                className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-black uppercase mb-1">Barangay Zone</label>
              <select
                className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                value={selectedBarangayId}
                onChange={(e) => setSelectedBarangayId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All barangays</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Summary Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3 border border-black/15">
            <span className="text-[10px] text-black/60 uppercase font-bold block">Filtered Records</span>
            <strong className="text-[12px] text-black mt-1 block">{filteredRequests.length}</strong>
            <span className="text-[10px] text-black/50">Total incidents in range</span>
          </Card>
          <Card className="p-3 border border-black/15">
            <span className="text-[10px] text-black/60 uppercase font-bold block">Resolved Ratio</span>
            <strong className="text-[12px] text-[#1E6FD9] mt-1 block">
              {filteredRequests.filter((r) => r.status === 'resolved').length} Resolved
            </strong>
            <span className="text-[10px] text-black/50">Completed repairs</span>
          </Card>
          <Card className="p-3 border border-black/15">
            <span className="text-[10px] text-black/60 uppercase font-bold block">Active Pipeline Tickets</span>
            <strong className="text-[12px] text-black mt-1 block">
              {filteredRequests.filter((r) => r.status !== 'resolved' && r.status !== 'cancelled').length} Pending
            </strong>
            <span className="text-[10px] text-black/50">Field tasks undergoing work</span>
          </Card>
        </div>

        {/* Preview Table - Matches Wireframe A11 */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="px-4 py-2 border-b border-black/15 flex items-center justify-between bg-white text-[10px]">
            <span className="font-bold text-black uppercase tracking-wider">
              Preview: counts by status, issue type, barangay
            </span>
            <Badge variant="blue">{filteredRequests.length} Results</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 font-bold uppercase">Reference</th>
                  <th className="px-4 py-2 font-bold uppercase">Issue Category</th>
                  <th className="px-4 py-2 font-bold uppercase">Barangay Zone</th>
                  <th className="px-4 py-2 font-bold uppercase">Urgency</th>
                  <th className="px-4 py-2 font-bold uppercase">Status</th>
                  <th className="px-4 py-2 font-bold uppercase">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F0F6FD]/50">
                    <td className="px-4 py-2 font-bold text-[#1E6FD9]">
                      {r.reference_no || r.reference}
                    </td>
                    <td className="px-4 py-2 text-black">{r.issue_type?.name || 'General Leak'}</td>
                    <td className="px-4 py-2 text-black">{r.customer?.barangay || r.barangay?.name || 'Poblacion'}</td>
                    <td className="px-4 py-2">
                      <Badge variant={r.urgency === 'high' ? 'blue' : 'black'}>
                        {r.urgency ? r.urgency.toUpperCase() : 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={r.status === 'resolved' ? 'blue' : 'black'}>
                        {r.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-black">{r.assigned_staff?.name || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
