import { useState } from 'react';
import { Button } from './components/atoms/Button';
import { Input } from './components/atoms/Input';
import { Badge } from './components/atoms/Badge';
import { Card } from './components/atoms/Card';
import { StatCard } from './components/molecules/StatCard';
import { UrgencyDerivation } from './components/molecules/UrgencyDerivation';
import { EmptyState } from './components/molecules/EmptyState';
import { StatusTimeline } from './components/organisms/StatusTimeline';
import {
  IconDroplet,
  IconSearch,
  IconAlertCircle,
  IconFileText,
  IconUsers,
} from '@tabler/icons-react';

export function App() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B192C] text-white">
            <IconDroplet size={18} />
          </div>
          <span className="font-semibold text-base tracking-tight text-[#0B192C]">
            AquaTrack
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            Design System Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1200);
            }}
          >
            Simulate Loading
          </Button>
          <Button size="sm" variant="primary">
            Admin Portal
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl p-6 sm:p-8 space-y-8">
        {/* Section: Atomic UI Foundations */}
        <div>
          <h2 className="text-lg font-semibold text-[#0B192C]">
            Clean SaaS 2-Color Design Foundation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict palette: Deep Obsidian/Navy (<code className="text-[#0B192C] font-semibold">#0B192C</code>) & Precision Azure (<code className="text-[#1E6FD9] font-semibold">#1E6FD9</code>) with subtle slate surfaces.
          </p>
        </div>

        {/* Stat Cards Demo (Organism/Molecule) */}
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

        {/* Atoms Showcase */}
        <Card padding="lg" className="space-y-6">
          <h3 className="text-sm font-semibold text-[#0B192C] border-b border-slate-100 pb-3">
            Atoms: Buttons, Badges, and Form Controls
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" isLoading={isLoading}>
              Primary Button
            </Button>
            <Button variant="secondary" leftIcon={<IconSearch size={15} />}>
              Secondary Action
            </Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Action</Button>
            <Button size="sm" variant="primary">
              Small Button
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">Default</Badge>
            <Badge variant="accent" dot>
              In Progress
            </Badge>
            <Badge variant="success" dot>
              Resolved
            </Badge>
            <Badge variant="warning" dot>
              Needs Attention
            </Badge>
            <Badge variant="danger" dot>
              High Urgency
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Input
              label="Account Number"
              placeholder="e.g. 2026-0042"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Enter the official account number linked to the meter."
              leftIcon={<IconSearch size={16} />}
            />
            <Input
              label="Contact Number"
              placeholder="0917xxxxxxx"
              error={inputValue.length > 0 && inputValue.length < 5 ? "Input is too short" : undefined}
              required
            />
          </div>
        </Card>

        {/* Molecules & Domain Logic Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UrgencyDerivation
            defaultUrgency="medium"
            customerUrgency="high"
            finalUrgency="high"
            adjustedByAdmin={true}
            adjustmentReason="Active leak reported near school perimeter."
          />

          <Card padding="md" className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Request Lifecycle (AT-0018)
            </h4>
            <StatusTimeline
              status="in_progress"
              submittedAt="Oct 06, 9:00 AM"
              assignedAt="Oct 06, 10:15 AM"
              startedAt="Oct 06, 1:30 PM"
            />
          </Card>
        </div>

        {/* Empty State Showcase */}
        <EmptyState
          title="No pending verifications"
          description="All customer self-registrations in Sinacaban have been verified and linked with active meters."
          actionLabel="View Active Accounts"
          onAction={() => alert('View active clicked')}
        />
      </main>
    </div>
  );
}

export default App;
