import { useState } from 'react';
import { AdminLayout } from './components/templates/AdminLayout';
import { CustomerLayout } from './components/templates/CustomerLayout';
import { StaffLayout } from './components/templates/StaffLayout';
import { StatCard } from './components/molecules/StatCard';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import { Button } from './components/atoms/Button';
import { Badge } from './components/atoms/Badge';
import { Card } from './components/atoms/Card';
import { EmptyState } from './components/molecules/EmptyState';
import {
  IconAlertCircle,
  IconUsers,
  IconDroplet,
  IconFileText,
  IconSearch,
  IconPlus,
} from '@tabler/icons-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');

  return (
    <div>
      {/* Top Portal Switcher Bar */}
      <div className="bg-[#0B192C] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Layout Shell Preview:</span>
          <div className="inline-flex rounded-lg bg-slate-900/60 p-0.5 border border-slate-700">
            {(['admin', 'customer', 'staff'] as const).map((portal) => (
              <button
                key={portal}
                onClick={() => {
                  setActivePortal(portal);
                  if (portal === 'admin') setCurrentPath('/admin/dashboard');
                  if (portal === 'customer') setCurrentPath('/home');
                  if (portal === 'staff') setCurrentPath('/staff/tasks');
                }}
                className={`px-3 py-1 rounded-md capitalize transition-colors font-medium ${
                  activePortal === portal
                    ? 'bg-[#1E6FD9] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {portal} Portal
              </button>
            ))}
          </div>
        </div>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          Sinacaban Water System (SIWASS)
        </span>
      </div>

      {/* Render Active Shell */}
      {activePortal === 'admin' && (
        <AdminLayout
          title="Dashboard"
          subtitle="Operational Overview"
          currentPath={currentPath}
          onNavigate={setCurrentPath}
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#0B192C] tracking-tight">Admin Overview</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status for consumers, service requests, and active disruptions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" leftIcon={<IconSearch size={14} />}>
                  Search
                </Button>
                <Button size="sm" variant="primary" leftIcon={<IconPlus size={14} />}>
                  New Advisory
                </Button>
              </div>
            </div>

            {/* Dashboard Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Open Requests"
                value="18"
                trend={{ value: "4 pending assignment" }}
                icon={<IconAlertCircle size={18} className="text-rose-600" />}
              />
              <StatCard
                label="Unassigned"
                value="06"
                trend={{ value: "Needs review" }}
                icon={<IconUsers size={18} />}
              />
              <StatCard
                label="Active Interruptions"
                value="01"
                subtext="Poblacion area"
                icon={<IconDroplet size={18} />}
              />
              <StatCard
                label="Published Bills"
                value="₱142,500"
                trend={{ value: "October 2026", isPositive: true }}
                icon={<IconFileText size={18} />}
              />
            </div>

            {/* Recent Requests Table Demo */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#0B192C]">Recent Service Requests</h3>
                  <p className="text-xs text-slate-400">Latest issues logged by Sinacaban residents</p>
                </div>
                <Badge variant="accent">3 Active</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Issue</th>
                      <th className="px-5 py-3 font-semibold">Barangay</th>
                      <th className="px-5 py-3 font-semibold">Urgency</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#0B192C]">AT-0018</td>
                      <td className="px-5 py-3 text-slate-700">Main Pipe Fracture</td>
                      <td className="px-5 py-3 text-slate-600">Poblacion</td>
                      <td className="px-5 py-3">
                        <Badge variant="danger" dot size="sm">High</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="accent" size="sm">In Progress</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">Technician Cruz</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#0B192C]">AT-0017</td>
                      <td className="px-5 py-3 text-slate-700">Low Water Pressure</td>
                      <td className="px-5 py-3 text-slate-600">San Isidro</td>
                      <td className="px-5 py-3">
                        <Badge variant="warning" dot size="sm">Medium</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="neutral" size="sm">Submitted</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-400 italic">Unassigned</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </AdminLayout>
      )}

      {activePortal === 'customer' && (
        <CustomerLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          userName="Maria Santos"
          accountNumber="2026-0182"
        >
          <div className="space-y-6">
            <div>
              <h1 className="text-lg font-bold text-[#0B192C]">Consumer Dashboard</h1>
              <p className="text-xs text-slate-500">Barangay Poblacion, Sinacaban</p>
            </div>

            {/* Current Bill Card */}
            <Card padding="md" className="border-l-4 border-l-[#1E6FD9]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Current Statement (October 2026)
                  </span>
                  <div className="text-2xl font-bold text-[#0B192C] mt-1">₱385.00</div>
                  <p className="text-xs text-slate-500 mt-0.5">Due date: October 25, 2026</p>
                </div>
                <Badge variant="danger" dot>Unpaid</Badge>
              </div>
            </Card>

            {/* Active Request Progress */}
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Active Request: AT-0018
                  </h3>
                  <p className="text-xs text-slate-500">Pipe Leak near front garden</p>
                </div>
                <Badge variant="accent">In Progress</Badge>
              </div>

              <StatusTimeline
                status="in_progress"
                submittedAt="Oct 06, 8:30 AM"
                assignedAt="Oct 06, 9:15 AM"
                startedAt="Oct 06, 11:00 AM"
              />
            </Card>

            {/* Urgency Derivation Proof */}
            <UrgencyDerivation
              defaultUrgency="low"
              customerUrgency="high"
              finalUrgency="medium"
              adjustedByAdmin={false}
            />
          </div>
        </CustomerLayout>
      )}

      {activePortal === 'staff' && (
        <StaffLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          staffName="Technician Cruz"
          assignedArea="Sinacaban Area 1"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-[#0B192C]">Assigned Tasks</h1>
                <p className="text-xs text-slate-500">Tasks requiring field action today</p>
              </div>
              <Badge variant="accent">2 Pending</Badge>
            </div>

            {/* Task Card */}
            <Card padding="md" className="space-y-3 border-l-4 border-l-[#1E6FD9]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B192C]">AT-0018 · Main Pipe Fracture</span>
                <Badge variant="danger" dot size="sm">High Urgency</Badge>
              </div>

              <p className="text-xs text-slate-600">
                Poblacion, near water pump station. Strong water outflow reported by resident.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Assigned 2 hours ago</span>
                <Button size="sm" variant="primary">
                  Get Started
                </Button>
              </div>
            </Card>

            <EmptyState
              title="No more pending tasks"
              description="You have completed all assigned work orders for Sinacaban Area 1."
            />
          </div>
        </StaffLayout>
      )}
    </div>
  );
}

export default App;
