import { useState } from 'react';
import { CleanAdminLayout } from './components/templates/CleanAdminLayout';
import { CustomerLayout } from './components/templates/CustomerLayout';
import { StaffLayout } from './components/templates/StaffLayout';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import { Button } from './components/atoms/Button';
import { Badge } from './components/atoms/Badge';
import {
  IconTool,
  IconUsers,
  IconDroplet,
  IconReceipt2,
  IconFilter,
  IconArrowUpRight,
  IconDotsVertical,
  IconCalendar,
} from '@tabler/icons-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');

  return (
    <div>
      {/* Top Preview Switcher Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Layout View:</span>
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {(['admin', 'customer', 'staff'] as const).map((portal) => (
              <button
                key={portal}
                onClick={() => {
                  setActivePortal(portal);
                  if (portal === 'admin') setCurrentPath('/admin/dashboard');
                  if (portal === 'customer') setCurrentPath('/home');
                  if (portal === 'staff') setCurrentPath('/staff/tasks');
                }}
                className={`px-3 py-1 rounded-md text-xs capitalize transition-all font-medium ${
                  activePortal === portal
                    ? 'bg-[#4F46E5] text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">SIWASS Utility Management</span>
        </div>
      </div>

      {/* Admin Portal View */}
      {activePortal === 'admin' && (
        <CleanAdminLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          pageTitle="Operations Dashboard"
          pageSubtitle="Sinacaban Water District Real-Time Status"
        >
          {/* Subtle 4-Card Overview Row (Clean cards with subtle top accents) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Open Requests */}
            <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-[#4F46E5]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Open Requests
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#4F46E5]">
                  <IconTool size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">18</div>
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 font-medium">
                  <span>4 unassigned</span>
                  <span className="text-slate-400 font-normal">· needs action</span>
                </p>
              </div>
            </div>

            {/* Card 2: Consumer Accounts */}
            <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-slate-900" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Active Consumers
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <IconUsers size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">1,248</div>
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <IconArrowUpRight size={13} />
                  <span>12 new</span>
                  <span className="text-slate-400 font-normal">this month</span>
                </p>
              </div>
            </div>

            {/* Card 3: Disruptions */}
            <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-amber-500" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Active Outages
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <IconDroplet size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">01</div>
                <p className="mt-1 text-xs text-slate-500">
                  Poblacion feeder line repair
                </p>
              </div>
            </div>

            {/* Card 4: Billing Cycle */}
            <div className="relative overflow-hidden rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-emerald-600" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Published Bills
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <IconReceipt2 size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">₱142,500</div>
                <p className="mt-1 text-xs text-slate-500">
                  Cycle: October 2026
                </p>
              </div>
            </div>
          </div>

          {/* Clean 2-Column Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Service Requests Table */}
            <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Service Requests</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time issues reported across Sinacaban barangays</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" leftIcon={<IconFilter size={13} />}>
                    Filter
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-100 font-semibold text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Issue Type</th>
                      <th className="px-5 py-3">Barangay</th>
                      <th className="px-5 py-3">Urgency</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Assigned Staff</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">AT-0018</td>
                      <td className="px-5 py-3.5 text-slate-800">Main Pipe Burst</td>
                      <td className="px-5 py-3.5 text-slate-600">Poblacion</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="danger" dot size="sm">High</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="accent" size="sm">In Progress</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">R. Cruz (Tech)</td>
                      <td className="px-5 py-3.5 text-right">
                        <Button size="xs" variant="secondary">
                          Details
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">AT-0017</td>
                      <td className="px-5 py-3.5 text-slate-800">Low Water Pressure</td>
                      <td className="px-5 py-3.5 text-slate-600">San Isidro</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="warning" dot size="sm">Medium</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="neutral" size="sm">Submitted</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 italic">Unassigned</td>
                      <td className="px-5 py-3.5 text-right">
                        <Button size="xs" variant="primary">
                          Assign
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">AT-0016</td>
                      <td className="px-5 py-3.5 text-slate-800">Meter Reading Discrepancy</td>
                      <td className="px-5 py-3.5 text-slate-600">Sinabacan</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="neutral" size="sm">Low</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="success" size="sm">Resolved</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">M. Gomez (Tech)</td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="text-slate-400 hover:text-slate-700 p-1">
                          <IconDotsVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Needs Attention & Upcoming Advisory */}
            <div className="space-y-4">
              {/* Needs Attention Card */}
              <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Needs Attention
                  </h4>
                  <span className="text-[11px] font-semibold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full">
                    3 items
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-800">AT-0017 Unassigned</div>
                      <div className="text-[11px] text-slate-500">San Isidro · Submitted 2h ago</div>
                    </div>
                    <Button size="xs" variant="primary">
                      Assign
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-semibold text-slate-800">5 Registrations Pending</div>
                      <div className="text-[11px] text-slate-500">Awaiting meter linkage</div>
                    </div>
                    <Button size="xs" variant="secondary">
                      Review
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upcoming Advisory Card */}
              <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <IconCalendar size={14} className="text-indigo-600" />
                    <span>Upcoming Interruption</span>
                  </div>
                  <Badge variant="warning" size="xs">Scheduled</Badge>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-800">Poblacion & San Isidro Sector</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Main distribution valve replacement. Estimated disruption 8:00 AM – 1:00 PM tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Logic Transparency Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UrgencyDerivation
              defaultUrgency="medium"
              customerUrgency="high"
              finalUrgency="high"
              adjustedByAdmin={true}
              adjustmentReason="Reported near Sinacaban central public market."
            />

            <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Request Progress (AT-0018)
                </span>
                <span className="text-xs text-[#4F46E5] font-semibold">Active Work Order</span>
              </div>
              <StatusTimeline
                status="in_progress"
                submittedAt="08:30 AM"
                assignedAt="09:15 AM"
                startedAt="11:00 AM"
              />
            </div>
          </div>
        </CleanAdminLayout>
      )}

      {/* Customer Portal View */}
      {activePortal === 'customer' && (
        <CustomerLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          userName="Maria Santos"
          accountNumber="2026-0182"
        >
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Consumer Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Barangay Poblacion, Sinacaban</p>
            </div>

            <div className="rounded-xl bg-white p-6 border border-slate-200/80 shadow-2xs border-l-4 border-l-[#4F46E5]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current Statement (October 2026)
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-1">₱385.00</div>
                  <p className="text-xs text-slate-500 mt-1">Due date: October 25, 2026</p>
                </div>
                <Badge variant="danger" dot size="md">Unpaid</Badge>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Active Request: AT-0018
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pipe Leak near front garden</p>
                </div>
                <Badge variant="accent">In Progress</Badge>
              </div>

              <StatusTimeline
                status="in_progress"
                submittedAt="Oct 06, 8:30 AM"
                assignedAt="Oct 06, 9:15 AM"
                startedAt="Oct 06, 11:00 AM"
              />
            </div>
          </div>
        </CustomerLayout>
      )}

      {/* Staff Portal View */}
      {activePortal === 'staff' && (
        <StaffLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          staffName="R. Cruz (Tech-01)"
          assignedArea="Sinacaban Sector 1"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Field Tasks</h1>
                <p className="text-xs text-slate-500 mt-0.5">2 work orders requiring technician action</p>
              </div>
              <Badge variant="accent">Active Dispatch</Badge>
            </div>

            <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-2xs border-l-4 border-l-[#4F46E5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">AT-0018 · Main Pipe Fracture</span>
                <Badge variant="danger" dot size="sm">High Urgency</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Poblacion perimeter. High pressure line discharging onto municipal road.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Assigned 2 hours ago</span>
                <Button size="xs" variant="primary">
                  Begin Work
                </Button>
              </div>
            </div>
          </div>
        </StaffLayout>
      )}
    </div>
  );
}

export default App;
