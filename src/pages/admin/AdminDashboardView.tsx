import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { StatCard } from '../../components/molecules/StatCard';
import { Badge } from '../../components/atoms/Badge';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { requestsApi, billingApi, interruptionsApi } from '../../api';
import type { ServiceRequest } from '../../types';

import { AdminVerificationView } from './AdminVerificationView';
import { AdminBillingImportView } from './AdminBillingImportView';
import { CustomerAdvisoriesView } from '../customer/CustomerAdvisoriesView';

export function AdminDashboardView() {
  const [currentTab, setCurrentTab] = useState<string>('/admin/dashboard');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [activeInterruptionCount, setActiveInterruptionCount] = useState<number>(0);
  const [unpaidBillsCount, setUnpaidBillsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [reqData, billData, intData] = await Promise.all([
          requestsApi.list({ per_page: 10 }),
          billingApi.list({ payment_status: 'unpaid' }),
          interruptionsApi.list(),
        ]);

        setRequests(reqData.data);
        setOpenCount(reqData.pagination.total);
        setUnassignedCount(reqData.data.filter((r) => !r.assigned_staff).length);
        setUnpaidBillsCount(billData.pagination.total);
        setActiveInterruptionCount(intData.pagination.total);
      } catch {
        // Fallback or offline state
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout
      title={
        currentTab === '/admin/verification'
          ? 'Customer Verification'
          : currentTab === '/admin/billing'
          ? 'Billing & CSV Imports'
          : currentTab === '/admin/interruptions'
          ? 'Water Interruptions'
          : 'Operations Dashboard'
      }
      subtitle="Sinacaban Municipal System"
      currentPath={currentTab}
      onNavigate={setCurrentTab}
    >
      {currentTab === '/admin/verification' && <AdminVerificationView />}
      {currentTab === '/admin/billing' && <AdminBillingImportView />}
      {currentTab === '/admin/interruptions' && <CustomerAdvisoriesView />}

      {currentTab === '/admin/dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
            <div>
              <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">Administrator Operations Overview</h1>
              <p className="text-[10px] text-black/70">
                Real-time operations, service requests, and utility statistics for Sinacaban (SIWASS).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setCurrentTab('/admin/verification')}>
                Verification Queue
              </Button>
              <Button variant="secondary" onClick={() => setCurrentTab('/admin/billing')}>
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

        {/* Live Service Requests Table */}
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-black/15 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-black">Recent Service Requests</div>
              <div className="text-sm text-black/60">Live feed from customer submissions</div>
            </div>
            <Badge variant="blue">{requests.length} Listed</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-5 py-3 font-bold">Reference</th>
                  <th className="px-5 py-3 font-bold">Issue</th>
                  <th className="px-5 py-3 font-bold">Barangay</th>
                  <th className="px-5 py-3 font-bold">Urgency</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Assigned Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-black/50">
                      {isLoading ? 'Loading records...' : 'No service requests found.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F0F6FD]/60 transition-colors">
                      <td className="px-5 py-3 font-bold text-[#1E6FD9]">{req.reference}</td>
                      <td className="px-5 py-3 text-black">{req.description}</td>
                      <td className="px-5 py-3 text-black">{req.customer?.barangay ?? 'Sinacaban'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={req.urgency === 'high' ? 'black' : 'blue'}>
                          {req.urgency ? req.urgency.toUpperCase() : 'MEDIUM'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={req.status === 'in_progress' ? 'blue' : 'outline'}>
                          {req.status ? req.status.replace('_', ' ') : 'submitted'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-black">
                        {req.assigned_staff ? req.assigned_staff.name : <span className="text-black/50 italic">Unassigned</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}
    </AdminLayout>
  );
}

