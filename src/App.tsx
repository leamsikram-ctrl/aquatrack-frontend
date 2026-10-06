import { useState } from 'react';
import { AdminLayout } from './components/templates/AdminLayout';
import { CustomerLayout } from './components/templates/CustomerLayout';
import { StaffLayout } from './components/templates/StaffLayout';
import { StatCard } from './components/molecules/StatCard';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import { Button } from './components/atoms/Button';
import { Input } from './components/atoms/Input';
import { Badge } from './components/atoms/Badge';
import { Card } from './components/atoms/Card';
import { EmptyState } from './components/molecules/EmptyState';
import {
  IconAlertCircle,
  IconUsers,
  IconDroplet,
  IconReceipt2,
  IconSearch,
  IconPlus,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="text-black bg-white min-h-screen text-sm">
      {/* Top Portal Switcher Bar */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-sm shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold">Portal:</span>
          <div className="inline-flex gap-1 bg-white/10 p-0.5 rounded-lg">
            {(['admin', 'customer', 'staff'] as const).map((portal) => (
              <button
                key={portal}
                onClick={() => {
                  setActivePortal(portal);
                  if (portal === 'admin') setCurrentPath('/admin/dashboard');
                  if (portal === 'customer') setCurrentPath('/home');
                  if (portal === 'staff') setCurrentPath('/staff/tasks');
                }}
                className={`px-3 py-1 rounded-md capitalize font-medium text-sm transition-all ${
                  activePortal === portal
                    ? 'bg-[#1E6FD9] text-white font-bold shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>
        </div>
        <span className="text-sm hidden sm:inline text-white/60">
          SIWASS
        </span>
      </div>

      {/* Render Active Shell */}
      {activePortal === 'admin' && (
        <AdminLayout
          title="Dashboard"
          currentPath={currentPath}
          onNavigate={setCurrentPath}
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
              <div>
                <h1 className="text-sm font-bold text-black">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" leftIcon={<IconSearch size={15} />}>
                  Search
                </Button>
                <Button variant="primary" leftIcon={<IconPlus size={15} />}>
                  New Advisory
                </Button>
              </div>
            </div>

            {/* Dashboard Stat Cards with Icons & Shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Open Requests"
                value="18"
                subtext="4 pending assignment"
                icon={<IconAlertCircle size={20} />}
              />
              <StatCard
                label="Unassigned"
                value="06"
                subtext="Requires technician"
                icon={<IconUsers size={20} />}
              />
              <StatCard
                label="Interruptions"
                value="01"
                subtext="Barangay Poblacion"
                icon={<IconDroplet size={20} />}
              />
              <StatCard
                label="Published Bills"
                value="₱142,500.00"
                subtext="October 2026"
                icon={<IconReceipt2 size={20} />}
              />
            </div>

            {/* Inputs Showcase */}
            <Card className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <Input
                  label="Search Account or Meter"
                  placeholder="e.g. 2026-0042"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  leftIcon={<IconSearch size={16} />}
                />
                <Input
                  label="Mobile Number"
                  placeholder="09170000000"
                  error={inputVal.length > 0 && inputVal.length < 5 ? "Number too short" : undefined}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/5">
                <Button variant="primary" leftIcon={<IconCheck size={15} />}>Save</Button>
                <Button variant="secondary">Cancel</Button>
                <Badge variant="blue" icon={<IconClock size={12} />}>In Progress</Badge>
                <Badge variant="black">High Urgency</Badge>
                <Badge variant="outline">Unassigned</Badge>
              </div>
            </Card>

            {/* Table */}
            <Card className="p-0 overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-black/10 flex items-center justify-between">
                <div className="text-sm font-bold text-black">Service Requests</div>
                <Badge variant="blue">3 Records</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F0F6FD] text-black border-b border-black/10">
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
                    <tr className="hover:bg-[#F0F6FD]/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-[#1E6FD9]">AT-0018</td>
                      <td className="px-5 py-3 text-black">Main Pipe Leak</td>
                      <td className="px-5 py-3 text-black">Poblacion</td>
                      <td className="px-5 py-3">
                        <Badge variant="black">High</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="blue">In Progress</Badge>
                      </td>
                      <td className="px-5 py-3 text-black font-medium">Technician Cruz</td>
                    </tr>
                    <tr className="hover:bg-[#F0F6FD]/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-[#1E6FD9]">AT-0017</td>
                      <td className="px-5 py-3 text-black">Low Water Pressure</td>
                      <td className="px-5 py-3 text-black">San Isidro</td>
                      <td className="px-5 py-3">
                        <Badge variant="blue">Medium</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline">Submitted</Badge>
                      </td>
                      <td className="px-5 py-3 text-black/40">Unassigned</td>
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
            <div className="border-b border-black/10 pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-bold text-black">Maria Santos</h1>
                <p className="text-sm text-black/60">Barangay Poblacion</p>
              </div>
              <Badge variant="outline">Account #2026-0182</Badge>
            </div>

            {/* Bill Card */}
            <Card className="border-l-4 border-l-[#1E6FD9] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-black/60">Statement · October 2026</div>
                  <div className="text-sm font-bold text-black mt-1">₱385.00</div>
                  <div className="text-sm text-black/60 mt-0.5">Due Oct 25, 2026</div>
                </div>
                <Badge variant="black">Unpaid</Badge>
              </div>
            </Card>

            {/* Active Request Progress */}
            <Card className="space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-black">AT-0018 · Pipe Leak</div>
                </div>
                <Badge variant="blue">In Progress</Badge>
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
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h1 className="text-sm font-bold text-black">Assigned Tasks</h1>
              <Badge variant="blue">1 Pending</Badge>
            </div>

            {/* Task Card */}
            <Card className="space-y-3 border-l-4 border-l-[#1E6FD9] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black">AT-0018 · Main Pipe Leak</span>
                <Badge variant="black">High Urgency</Badge>
              </div>

              <p className="text-sm text-black/80">
                Barangay Poblacion, near pump station. Strong water outflow reported.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <span className="text-sm text-black/50">Assigned 2h ago</span>
                <Button variant="primary">
                  Get Started
                </Button>
              </div>
            </Card>

            <EmptyState
              title="No more pending tasks"
              description="All assigned work orders are completed."
            />
          </div>
        </StaffLayout>
      )}
    </div>
  );
}

export default App;
