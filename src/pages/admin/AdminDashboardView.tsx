import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { StatCard } from '../../components/molecules/StatCard';
import { Badge } from '../../components/atoms/Badge';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { requestsApi, billingApi, interruptionsApi, adminApi } from '../../api';
import type { ServiceRequest, WaterInterruption } from '../../types';
import { IconArrowRight } from '@tabler/icons-react';

export function AdminDashboardView() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [activeInterruptionCount, setActiveInterruptionCount] = useState<number>(0);
  const [unpaidBillsCount, setUnpaidBillsCount] = useState<number>(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);
  const [upcomingInterruptions, setUpcomingInterruptions] = useState<WaterInterruption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [reqData, billData, intData, pendingData] = await Promise.all([
          requestsApi.list({ per_page: 10 }),
          billingApi.list({ payment_status: 'unpaid' }),
          interruptionsApi.list(),
          adminApi.pendingRegistrations().catch(() => ({ data: [], pagination: { total: 0 } })),
        ]);

        setRequests(reqData.data);
        setOpenCount(reqData.pagination.total);
        setUnassignedCount(reqData.data.filter((r) => !r.assigned_staff).length);
        setUnpaidBillsCount(billData.pagination.total);
        setActiveInterruptionCount(intData.pagination.total);
        setUpcomingInterruptions(intData.data.slice(0, 3));
        setPendingVerificationsCount(pendingData.pagination?.total || pendingData.data?.length || 0);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout
      title="Operations Dashboard"
      subtitle="Sinacaban Municipal System"
      currentPath="/admin/dashboard"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Administrator Operations Overview
            </h1>
            <p className="text-[10px] text-black/60">
              Real-time operations, service requests, and utility statistics for Sinacaban (SIWASS).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/verification')}>
              Verification Queue
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/requests')}>
              Dispatch Technicians
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/billing')}>
              Billing CSV Import
            </Button>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Open Requests"
            value={isLoading ? '...' : openCount}
            subtext="Customer submitted issues"
          />
          <StatCard
            label="Unassigned"
            value={isLoading ? '...' : unassignedCount}
            subtext="Pending staff assignment"
          />
          <StatCard
            label="Unpaid Bills"
            value={isLoading ? '...' : unpaidBillsCount}
            subtext="Current billing cycle"
          />
          <StatCard
            label="Active Interruptions"
            value={isLoading ? '...' : activeInterruptionCount}
            subtext="Published advisories"
          />
        </div>

        {/* Wireframe A1: Middle Row - Needs Attention & Upcoming Interruptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Needs attention card */}
          <Card className="p-4 border border-black/15 space-y-3">
            <div className="border-b border-black/10 pb-1.5 flex items-center justify-between">
              <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                Needs attention
              </span>
              <Badge variant="black">Action Required</Badge>
            </div>

            <div className="space-y-2">
              {/* Unassigned requests */}
              {requests.filter((r) => !r.assigned_staff && r.status !== 'resolved' && r.status !== 'cancelled').slice(0, 2).map((req) => (
                <div key={req.id} className="p-2 bg-[#F0F6FD] border border-black/10 rounded flex items-center justify-between">
                  <div>
                    <strong className="text-black font-bold">
                      {req.reference_number || req.reference || `AT-${req.id}`}
                    </strong>
                    <span className="text-black/60 ml-1.5 font-normal">Submitted, not yet assigned</span>
                  </div>
                  <Button
                    variant="primary"
                    className="py-0.5 px-2 text-[9px]"
                    onClick={() => navigate('/admin/requests')}
                  >
                    Assign
                  </Button>
                </div>
              ))}

              {/* Pending account verifications */}
              <div className="p-2 bg-[#F0F6FD] border border-black/10 rounded flex items-center justify-between">
                <div>
                  <strong className="text-black font-bold">Pending account verifications</strong>
                  <span className="text-black/60 ml-1.5 font-bold">({pendingVerificationsCount})</span>
                </div>
                <Button
                  variant="secondary"
                  className="py-0.5 px-2 text-[9px]"
                  onClick={() => navigate('/admin/verification')}
                >
                  Review
                </Button>
              </div>

              {/* Imported bills awaiting publish */}
              <div className="p-2 bg-[#F0F6FD] border border-black/10 rounded flex items-center justify-between">
                <div>
                  <strong className="text-black font-bold">Imported bills awaiting publish</strong>
                  <span className="text-black/60 ml-1.5 font-bold">({unpaidBillsCount})</span>
                </div>
                <Button
                  variant="secondary"
                  className="py-0.5 px-2 text-[9px]"
                  onClick={() => navigate('/admin/billing')}
                >
                  Review
                </Button>
              </div>
            </div>
          </Card>

          {/* Upcoming interruptions card */}
          <Card className="p-4 border border-black/15 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-black/10 pb-1.5 flex items-center justify-between">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Upcoming interruptions
                </span>
                <Badge variant="blue">Advisories</Badge>
              </div>

              <div className="space-y-2">
                {upcomingInterruptions.length === 0 ? (
                  <div className="py-4 text-center text-black/50 italic">
                    No scheduled interruptions recorded.
                  </div>
                ) : (
                  upcomingInterruptions.map((item) => (
                    <div key={item.id} className="p-2 bg-white border border-black/15 rounded flex items-center justify-between text-[10px]">
                      <div>
                        <strong className="text-black block">
                          {item.barangays?.map((b) => b.name).join(', ') || 'Sinacaban Sector'}
                        </strong>
                        <span className="text-black/60 text-[9px]">
                          {item.starts_at} - {item.ends_at}
                        </span>
                      </div>
                      <Badge variant="black">Scheduled</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-black/10 flex justify-end">
              <button
                onClick={() => navigate('/admin/interruptions')}
                className="text-[#1E6FD9] font-bold text-[10px] hover:underline flex items-center gap-1"
              >
                <span>View schedule</span>
                <IconArrowRight size={11} />
              </button>
            </div>
          </Card>
        </div>

        {/* Live Service Requests Table */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="px-4 py-2.5 border-b border-black/15 flex items-center justify-between bg-[#F0F6FD]">
            <div>
              <div className="text-[10px] font-bold text-black uppercase tracking-wider">
                Recent Service Requests Feed
              </div>
              <div className="text-[10px] text-black/60">Live feed from consumer submissions</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="blue">{requests.length} Listed</Badge>
              <button
                onClick={() => navigate('/admin/requests')}
                className="text-[10px] font-bold text-[#1E6FD9] hover:underline flex items-center gap-0.5"
              >
                View Full Dispatcher <IconArrowRight size={10} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#FFFFFF] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 font-bold uppercase">Reference</th>
                  <th className="px-4 py-2 font-bold uppercase">Issue Description</th>
                  <th className="px-4 py-2 font-bold uppercase">Barangay Zone</th>
                  <th className="px-4 py-2 font-bold uppercase">Urgency</th>
                  <th className="px-4 py-2 font-bold uppercase">Status</th>
                  <th className="px-4 py-2 font-bold uppercase">Assigned Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                      {isLoading ? 'Loading records...' : 'No service requests found.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F0F6FD]/50 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-[#1E6FD9]">
                        {req.reference_number || req.reference}
                      </td>
                      <td className="px-4 py-2.5 text-black max-w-xs truncate">{req.description}</td>
                      <td className="px-4 py-2.5 text-black">{req.barangay?.name || 'Poblacion'}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={req.urgency === 'high' ? 'blue' : 'black'}>
                          {req.urgency ? req.urgency.toUpperCase() : 'MEDIUM'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={req.status === 'resolved' ? 'blue' : 'black'}>
                          {req.status ? req.status.replace('_', ' ').toUpperCase() : 'SUBMITTED'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-black font-normal">
                        {req.assigned_staff ? (
                          <span className="font-bold">{req.assigned_staff.name}</span>
                        ) : (
                          <span className="text-black/40 italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
