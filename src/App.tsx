import { useState } from 'react';
import { FloatingNav } from './components/organisms/FloatingNav';
import { StatCard } from './components/molecules/StatCard';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import { Button } from './components/atoms/Button';
import { Badge } from './components/atoms/Badge';
import { Card } from './components/atoms/Card';
import {
  IconAlertCircle,
  IconUsers,
  IconDroplet,
  IconReceipt2,
  IconPlus,
  IconDownload,
  IconFilter,
  IconDotsVertical,
  IconClock,
  IconHome,
  IconAlertTriangle,
  IconUser,
} from '@tabler/icons-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#090A0F]">
      {/* Top Portal Switcher (Preview Mode Bar) */}
      <div className="bg-[#090A0F] text-white px-4 py-1.5 flex items-center justify-between text-xs border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-400">Portal:</span>
          <div className="inline-flex rounded-md bg-zinc-900 p-0.5 border border-zinc-800">
            {(['admin', 'customer', 'staff'] as const).map((portal) => (
              <button
                key={portal}
                onClick={() => {
                  setActivePortal(portal);
                  if (portal === 'admin') setCurrentPath('/admin/dashboard');
                  if (portal === 'customer') setCurrentPath('/home');
                  if (portal === 'staff') setCurrentPath('/staff/tasks');
                }}
                className={`px-2.5 py-0.5 rounded text-xs capitalize transition-colors font-medium ${
                  activePortal === portal
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono">Modern SaaS Architecture</span>
        </div>
      </div>

      {/* Floating Top Navigation */}
      <FloatingNav currentPath={currentPath} onNavigate={setCurrentPath} />

      {/* Admin Portal Page View */}
      {activePortal === 'admin' && (
        <div className="flex-1 flex flex-col">
          {/* Contextual Sub-bar */}
          <section className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xs py-2.5 px-4 sm:px-6">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <span>Sinacaban Water District</span>
                <span className="text-slate-300">/</span>
                <span>Operations</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-[#090A0F]">Live Center</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="secondary" leftIcon={<IconDownload size={13} />}>
                  Export CSV
                </Button>
                <Button size="xs" variant="primary" leftIcon={<IconPlus size={13} />} kbdShortcut="C">
                  New Advisory
                </Button>
              </div>
            </div>
          </section>

          {/* Main Operational Canvas */}
          <main className="mx-auto max-w-7xl w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                label="Pending Work Orders"
                value="18"
                trend={{ value: "+3 past 24h" }}
                icon={<IconAlertCircle size={16} className="text-rose-600" />}
              />
              <StatCard
                label="Unassigned Queued"
                value="06"
                trend={{ value: "2 high priority" }}
                icon={<IconUsers size={16} />}
              />
              <StatCard
                label="Active Outages"
                value="01"
                subtext="Poblacion main feeder"
                icon={<IconDroplet size={16} />}
              />
              <StatCard
                label="Billed This Cycle"
                value="₱142,500"
                trend={{ value: "October 2026", isPositive: true }}
                icon={<IconReceipt2 size={16} />}
              />
            </div>

            {/* High-Precision Dispatch Table */}
            <Card padding="none">
              <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xs font-bold text-[#090A0F] uppercase tracking-wider font-mono">
                    Service Request Dispatch
                  </h3>
                  <Badge variant="neutral" mono size="xs">
                    8 records
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" leftIcon={<IconFilter size={13} />}>
                    Filter
                  </Button>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[11px] font-mono text-slate-400">Sort: Urgency</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 text-slate-500 border-b border-slate-100 font-mono text-[11px]">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Ref No.</th>
                      <th className="px-5 py-2.5 font-medium">Issue Description</th>
                      <th className="px-5 py-2.5 font-medium">Barangay</th>
                      <th className="px-5 py-2.5 font-medium">Urgency</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 font-medium">Assigned Field Tech</th>
                      <th className="px-5 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-5 py-3 font-mono font-semibold text-[#090A0F]">AT-0018</td>
                      <td className="px-5 py-3 text-slate-800 font-medium">Main Distribution Pipe Fracture</td>
                      <td className="px-5 py-3 text-slate-600">Poblacion</td>
                      <td className="px-5 py-3">
                        <Badge variant="danger" dot mono size="xs">HIGH</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="accent" mono size="xs">IN PROGRESS</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">R. Cruz (Tech-01)</td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100">
                          <IconDotsVertical size={14} />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-5 py-3 font-mono font-semibold text-[#090A0F]">AT-0017</td>
                      <td className="px-5 py-3 text-slate-800 font-medium">Low Pressure / Aerated Flow</td>
                      <td className="px-5 py-3 text-slate-600">San Isidro</td>
                      <td className="px-5 py-3">
                        <Badge variant="warning" dot mono size="xs">MEDIUM</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="neutral" mono size="xs">SUBMITTED</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-400 italic">Unassigned</td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100">
                          <IconDotsVertical size={14} />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-5 py-3 font-mono font-semibold text-[#090A0F]">AT-0016</td>
                      <td className="px-5 py-3 text-slate-800 font-medium">Residential Meter Dial Stalled</td>
                      <td className="px-5 py-3 text-slate-600">Sinabacan</td>
                      <td className="px-5 py-3">
                        <Badge variant="neutral" mono size="xs">LOW</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="success" mono size="xs">RESOLVED</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">M. Gomez (Tech-02)</td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100">
                          <IconDotsVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UrgencyDerivation
                defaultUrgency="medium"
                customerUrgency="high"
                finalUrgency="high"
                adjustedByAdmin={true}
                adjustmentReason="High pressure line affected near elementary school boundary."
              />

              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono">
                    Lifecycle Audit (AT-0018)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <IconClock size={12} />
                    Duration: 2h 45m
                  </span>
                </div>
                <StatusTimeline
                  status="in_progress"
                  submittedAt="08:30"
                  assignedAt="09:15"
                  startedAt="11:00"
                />
              </Card>
            </div>
          </main>
        </div>
      )}

      {/* Customer Portal Page View */}
      {activePortal === 'customer' && (
        <main className="mx-auto max-w-4xl w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-5 pb-20">
          <div>
            <h1 className="text-lg font-bold text-[#090A0F] tracking-tight">Customer Portal</h1>
            <p className="text-xs text-slate-500 font-mono">Account #2026-0182 · Barangay Poblacion</p>
          </div>

          <Card padding="md" className="border-l-2 border-l-[#2563EB]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Current Statement (October 2026)
                </span>
                <div className="text-2xl font-bold font-mono text-[#090A0F] mt-1">₱385.00</div>
                <p className="text-xs text-slate-500 mt-0.5">Due date: Oct 25, 2026</p>
              </div>
              <Badge variant="danger" dot mono size="sm">UNPAID</Badge>
            </div>
          </Card>

          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                  Active Ticket: AT-0018
                </h3>
                <p className="text-xs text-slate-500">Service Line Leakage</p>
              </div>
              <Badge variant="accent" mono size="xs">IN PROGRESS</Badge>
            </div>

            <StatusTimeline
              status="in_progress"
              submittedAt="08:30"
              assignedAt="09:15"
              startedAt="11:00"
            />
          </Card>
        </main>
      )}

      {/* Staff Portal Page View */}
      {activePortal === 'staff' && (
        <main className="mx-auto max-w-4xl w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-5 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#090A0F] tracking-tight">Assigned Field Tasks</h1>
              <p className="text-xs text-slate-500 font-mono">Technician R. Cruz · Sinacaban Sector 1</p>
            </div>
            <Badge variant="accent" mono size="xs">ACTIVE DISPATCH</Badge>
          </div>

          <Card padding="md" className="space-y-3 border-l-2 border-l-[#2563EB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#090A0F]">AT-0018 · Main Pipe Fracture</span>
              <Badge variant="danger" dot mono size="xs">HIGH</Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Poblacion perimeter. High pressure line discharging onto municipal road.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-400">Assigned: 09:15 AM</span>
              <Button size="xs" variant="primary">
                Begin Inspection
              </Button>
            </div>
          </Card>
        </main>
      )}

      {/* Mobile Sticky Bar for Customer/Staff */}
      {activePortal !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-around md:hidden">
          <button className="flex flex-col items-center text-xs text-[#2563EB] font-medium">
            <IconHome size={18} />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>
          <button className="flex flex-col items-center text-xs text-slate-400">
            <IconReceipt2 size={18} />
            <span className="text-[10px] mt-0.5">Bills</span>
          </button>
          <button className="flex flex-col items-center text-xs text-slate-400">
            <IconAlertTriangle size={18} />
            <span className="text-[10px] mt-0.5">Requests</span>
          </button>
          <button className="flex flex-col items-center text-xs text-slate-400">
            <IconUser size={18} />
            <span className="text-[10px] mt-0.5">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
