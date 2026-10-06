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
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);
  const [unassignedRequests, setUnassignedRequests] = useState<ServiceRequest[]>([]);
  const [upcomingInterruptions, setUpcomingInterruptions] = useState<WaterInterruption[]>([]);
  const [unprintedBillsCount, setUnprintedBillsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [reqData, billData, intData, pendingRegs] = await Promise.all([
          requestsApi.list({ per_page: 10 }),
          billingApi.list(),
          interruptionsApi.list(),
          adminApi.pendingRegistrations().catch(() => ({ data: [], pagination: { total: 0 } })),
        ]);

        setRequests(reqData.data);
        setOpenCount(reqData.pagination.total);
        const unassigned = reqData.data.filter((r) => !r.assigned_staff);
        setUnassignedRequests(unassigned);
        setUnassignedCount(unassigned.length);

        const unpaid = billData.data.filter((b) => b.payment_status === 'unpaid');
        setUnpaidBillsCount(unpaid.length);
        const unpublished = billData.data.filter((b) => !b.is_published);
        setUnprintedBillsCount(unpublished.length);

        setUpcomingInterruptions(intData.data.slice(0, 3));
        setActiveInterruptionCount(intData.pagination.total);
        setPendingVerificationCount(pendingRegs.pagination.total);
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
      title="Dashboard"
      subtitle="Sinacaban Municipal System"
      currentPath="/admin/dashboard"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Top 4 StatCards - Matches Wireframe A1 Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Open requests"
            value={isLoading ? '...' : openCount.toString().padStart(2, '0')}
            subtext="Logged citizen tickets"
          />
          <StatCard
            label="Unassigned requests"
            value={isLoading ? '...' : unassignedCount.toString().padStart(2, '0')}
            subtext="Pending staff dispatch"
          />
          <StatCard
            label="Unpaid bills"
            value={isLoading ? '...' : unpaidBillsCount.toString().padStart(2, '0')}
            subtext="Current billing cycle"
          />
          <StatCard
            label="Active interruptions"
            value={isLoading ? '...' : activeInterruptionCount.toString().padStart(2, '0')}
            subtext="Published municipal notices"
          />
        </div>

        {/* Middle Two-Column Grid: "Needs attention" + "Upcoming interruptions" */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Needs Attention Panel (Span 2 cols on lg) */}
          <Card className="lg:col-span-2 p-4 border border-black/15 space-y-3">
            <div className="border-b border-black/10 pb-2">
              <h2 className="text-[10px] font-bold text-black uppercase tracking-wider">
                Needs attention
              </h2>
              <p className="text-[10px] text-black/60">
                Critical tasks awaiting administrative action or dispatch
              </p>
            </div>

            <div className="space-y-2">
              {/* Unassigned Service Requests items */}
              {unassignedRequests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 rounded bg-[#F0F6FD] border border-black/10 text-[10px]"
                >
                  <div className="space-x-1.5 truncate">
                    <span className="font-bold text-[#1E6FD9]">
                      {req.reference_no || req.reference}
                    </span>
                    <span className="text-black/40">·</span>
                    <span className="text-black">
                      Submitted, not yet assigned ({req.barangay?.name || req.customer?.barangay || 'Poblacion'})
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    className="shrink-0 py-1 px-3"
                    onClick={() => navigate('/admin/requests')}
                  >
                    Assign
                  </Button>
                </div>
              ))}

              {unassignedRequests.length === 0 && (
                <div className="p-2 rounded bg-white text-[10px] text-black/50 border border-dashed border-black/20 text-center">
                  All submitted service requests have been assigned to technicians.
                </div>
              )}

              {/* Pending Account Verifications Row */}
              <div className="flex items-center justify-between p-2 rounded bg-white border border-black/15 text-[10px]">
                <div className="space-x-1.5">
                  <span className="font-bold text-black">Pending account verifications</span>
                  <span className="text-black/50">
                    ({pendingVerificationCount} applicant{pendingVerificationCount !== 1 ? 's' : ''} awaiting meter link)
                  </span>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 py-1 px-3"
                  onClick={() => navigate('/admin/verification')}
                >
                  Review
                </Button>
              </div>

              {/* Imported Bills Awaiting Publish Row */}
              <div className="flex items-center justify-between p-2 rounded bg-white border border-black/15 text-[10px]">
                <div className="space-x-1.5">
                  <span className="font-bold text-black">Imported bills awaiting publish</span>
                  <span className="text-black/50">
                    ({unprintedBillsCount} statement{unprintedBillsCount !== 1 ? 's' : ''} in draft)
                  </span>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 py-1 px-3"
                  onClick={() => navigate('/admin/billing')}
                >
                  Review
                </Button>
              </div>
            </div>
          </Card>

          {/* Upcoming Interruptions Panel (Span 1 col on lg) */}
          <Card className="p-4 border border-black/15 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="border-b border-black/10 pb-2 flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-black uppercase tracking-wider">
                  Upcoming interruptions
                </h2>
                <Badge variant="blue">Advisories</Badge>
              </div>

              <div className="space-y-2">
                {upcomingInterruptions.length === 0 ? (
                  <div className="p-4 text-center text-black/50 text-[10px] italic">
                    No upcoming scheduled water interruptions.
                  </div>
                ) : (
                  upcomingInterruptions.map((advisory) => (
                    <div
                      key={advisory.id}
                      className="p-2 rounded bg-[#F0F6FD] border border-black/10 text-[10px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-black">
                          {advisory.barangays && advisory.barangays.length > 0
                            ? advisory.barangays.map((b) => b.name).join(', ')
                            : 'All Sinacaban Zones'}
                        </strong>
                        <span className="text-black/60 text-[10px]">
                          {new Date(advisory.starts_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-black/70 truncate">{advisory.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-black/10">
              <button
                onClick={() => navigate('/admin/interruptions')}
                className="text-[10px] font-bold text-[#1E6FD9] hover:underline flex items-center justify-between w-full"
              >
                <span>View schedule</span>
                <IconArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>

        {/* Bottom Section: Recent Service Requests Feed - Matches Wireframe A1 Bottom Table */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="px-4 py-2.5 border-b border-black/15 flex items-center justify-between bg-white">
            <h2 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Recent service requests
            </h2>
            <button
              onClick={() => navigate('/admin/requests')}
              className="text-[10px] font-bold text-[#1E6FD9] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <IconArrowRight size={10} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 font-bold uppercase">Reference</th>
                  <th className="px-4 py-2 font-bold uppercase">Issue</th>
                  <th className="px-4 py-2 font-bold uppercase">Barangay</th>
                  <th className="px-4 py-2 font-bold uppercase">Urgency</th>
                  <th className="px-4 py-2 font-bold uppercase">Status</th>
                  <th className="px-4 py-2 font-bold uppercase">Assigned to</th>
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
                        {req.reference_no || req.reference}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-black">
                        {req.issue_type?.name || 'General Leak'}
                      </td>
                      <td className="px-4 py-2.5 text-black">
                        {req.customer?.barangay || req.barangay?.name || 'Poblacion'}
                      </td>
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
                      <td className="px-4 py-2.5 text-black">
                        {req.assigned_staff ? (
                          req.assigned_staff.name
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
