import { useState } from 'react';
import { FastoAdminLayout } from './components/templates/FastoAdminLayout';
import { CustomerLayout } from './components/templates/CustomerLayout';
import { StaffLayout } from './components/templates/StaffLayout';
import { FastoStatCard } from './components/molecules/FastoStatCard';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import { Button } from './components/atoms/Button';
import { Badge } from './components/atoms/Badge';
import {
  IconStar,
  IconUser,
  IconBriefcase,
  IconMessageCircle,
  IconDotsVertical,
  IconPlus,
} from '@tabler/icons-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');

  return (
    <div>
      {/* Top Preview Switcher Bar */}
      <div className="bg-[#1E1B4B] text-white px-4 py-1.5 flex items-center justify-between text-xs border-b border-indigo-950">
        <div className="flex items-center gap-2">
          <span className="text-indigo-300 font-medium">Layout View:</span>
          <div className="inline-flex rounded-lg bg-indigo-950/80 p-0.5 border border-indigo-800">
            {(['admin', 'customer', 'staff'] as const).map((portal) => (
              <button
                key={portal}
                onClick={() => {
                  setActivePortal(portal);
                  if (portal === 'admin') setCurrentPath('/admin/dashboard');
                  if (portal === 'customer') setCurrentPath('/home');
                  if (portal === 'staff') setCurrentPath('/staff/tasks');
                }}
                className={`px-3 py-0.5 rounded-md text-xs capitalize transition-all font-semibold ${
                  activePortal === portal
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-indigo-300">Inspired by Fasto Modern SaaS Design</span>
        </div>
      </div>

      {/* Admin Fasto Dashboard */}
      {activePortal === 'admin' && (
        <FastoAdminLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          pageTitle="Dashboard"
        >
          {/* Top 4 Stat Cards Row with Colored Stripes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FastoStatCard
              number="78"
              label="Total Work Orders Handled"
              topColor="purple"
              icon={<IconStar size={20} className="fill-[#6366F1] text-[#6366F1]" />}
              iconBgColor="bg-indigo-50 text-indigo-600"
            />
            <FastoStatCard
              number="214"
              label="Registered Consumer Accounts"
              topColor="amber"
              icon={<IconUser size={20} className="fill-[#F59E0B] text-[#F59E0B]" />}
              iconBgColor="bg-amber-50 text-amber-600"
            />
            <FastoStatCard
              number="18"
              label="Pending Dispatch Tasks"
              topColor="indigo"
              icon={<IconBriefcase size={20} className="fill-[#4338CA] text-[#4338CA]" />}
              iconBgColor="bg-slate-100 text-[#4338CA]"
            />
            <FastoStatCard
              number="12"
              label="Unread Resident Inquiries"
              topColor="emerald"
              icon={<IconMessageCircle size={20} className="fill-[#10B981] text-[#10B981]" />}
              iconBgColor="bg-emerald-50 text-emerald-600"
            />
          </div>

          {/* Main Visual Panels Grid (Matching Fasto's 3-column charts & progress) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel 1: Bar Visual for Work Orders */}
            <div className="lg:col-span-1 rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Service Requests Volume</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">25%</span>
                    <span className="text-xs font-semibold text-emerald-600">▲ last month ₱583,443</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <IconDotsVertical size={16} />
                </button>
              </div>

              {/* Stylized Bar Chart Representation */}
              <div className="h-44 pt-6 flex items-end justify-between gap-1.5 px-2">
                {[30, 45, 60, 40, 55, 35, 48, 65, 80, 50, 75, 90, 85].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-[#4F46E5] rounded-full transition-all duration-300 hover:bg-indigo-400"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium">{`0${i + 6}`.slice(-2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Water Interruption Schedule & Active Advisory */}
            <div className="lg:col-span-1 rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Interruption Trend</h3>
                  <button className="text-slate-400 hover:text-slate-600">
                    <IconDotsVertical size={16} />
                  </button>
                </div>

                <div className="h-32 flex items-center justify-center">
                  <svg className="w-full h-full text-[#4F46E5]" viewBox="0 0 300 100" fill="none">
                    <path
                      d="M 10,80 Q 50,20 100,60 T 200,30 T 290,50"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
              </div>
            </div>

            {/* Panel 3: Monthly Billing Progress Radial */}
            <div className="lg:col-span-1 rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Monthly Billing Target</h3>
                <button className="text-slate-400 hover:text-slate-600">
                  <IconDotsVertical size={16} />
                </button>
              </div>

              {/* Fasto Circular Gauge */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      stroke="#EEF2F6"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="50"
                      stroke="#4F46E5"
                      strokeWidth="10"
                      strokeDasharray="314"
                      strokeDashoffset="125"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute text-xl font-black text-slate-900">60%</div>
                </div>
                <p className="mt-3 text-xs text-slate-500 font-medium">100 Projects / monthly</p>
              </div>

              {/* Fasto Purple Quick To-Do Box */}
              <div className="rounded-xl bg-[#4F46E5] text-white p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-xs">Quick To-Do List</h4>
                  <p className="text-[10px] text-indigo-100 mt-0.5">Assign AT-0018 to Cruz</p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30">
                  <IconPlus size={16} stroke={3} />
                </button>
              </div>
            </div>
          </div>

          {/* Operational Dispatch Table */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Service Requests</h3>
                <p className="text-xs text-slate-400">Incoming tickets from Sinacaban consumers</p>
              </div>
              <Button size="sm" variant="secondary">
                View All Records
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-5 py-3 rounded-l-xl">Ref ID</th>
                    <th className="px-5 py-3">Issue Type</th>
                    <th className="px-5 py-3">Barangay</th>
                    <th className="px-5 py-3">Urgency</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned Staff</th>
                    <th className="px-5 py-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#4F46E5]">AT-0018</td>
                    <td className="px-5 py-4 text-slate-800">Main Pipe Burst</td>
                    <td className="px-5 py-4 text-slate-600">Poblacion</td>
                    <td className="px-5 py-4">
                      <Badge variant="danger" dot size="sm">High</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="accent" size="sm">In Progress</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-700">R. Cruz (Tech)</td>
                    <td className="px-5 py-4 text-right">
                      <Button size="xs" variant="primary">
                        Review
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#4F46E5]">AT-0017</td>
                    <td className="px-5 py-4 text-slate-800">Low Water Pressure</td>
                    <td className="px-5 py-4 text-slate-600">San Isidro</td>
                    <td className="px-5 py-4">
                      <Badge variant="warning" dot size="sm">Medium</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral" size="sm">Submitted</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-400 italic">Unassigned</td>
                    <td className="px-5 py-4 text-right">
                      <Button size="xs" variant="secondary">
                        Assign
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Domain Logic Showcase in Fasto Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UrgencyDerivation
              defaultUrgency="medium"
              customerUrgency="high"
              finalUrgency="high"
              adjustedByAdmin={true}
              adjustmentReason="Reported near main distribution pump in Poblacion."
            />

            <div className="rounded-2xl bg-white p-6 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.06)] border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ticket Lifecycle Progress (AT-0018)
                </span>
                <span className="text-xs text-[#4F46E5] font-semibold">Active</span>
              </div>
              <StatusTimeline
                status="in_progress"
                submittedAt="08:30 AM"
                assignedAt="09:15 AM"
                startedAt="11:00 AM"
              />
            </div>
          </div>
        </FastoAdminLayout>
      )}

      {/* Customer Portal */}
      {activePortal === 'customer' && (
        <CustomerLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          userName="Maria Santos"
          accountNumber="2026-0182"
        >
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-900">Consumer Portal</h1>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 border-l-4 border-l-[#4F46E5]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Current Statement (October 2026)
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-1">₱385.00</div>
                  <p className="text-xs text-slate-500 mt-1">Due date: Oct 25, 2026</p>
                </div>
                <Badge variant="danger" dot size="md">Unpaid</Badge>
              </div>
            </div>
          </div>
        </CustomerLayout>
      )}

      {/* Staff Portal */}
      {activePortal === 'staff' && (
        <StaffLayout
          currentPath={currentPath}
          onNavigate={setCurrentPath}
          staffName="R. Cruz (Tech-01)"
          assignedArea="Sinacaban Sector 1"
        >
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-900">Assigned Field Tasks</h1>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 border-l-4 border-l-[#4F46E5]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">AT-0018 · Main Pipe Fracture</span>
                <Badge variant="danger" dot size="sm">High Urgency</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Poblacion perimeter. High pressure line discharging onto municipal road.
              </p>
            </div>
          </div>
        </StaffLayout>
      )}
    </div>
  );
}

export default App;
