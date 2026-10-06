import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { InterruptionCalendar } from '../../components/organisms/InterruptionCalendar';
import { interruptionsApi, referenceApi } from '../../api';
import type { WaterInterruption, Barangay } from '../../types';
import { IconAlertTriangle, IconCalendarTime, IconMapPin, IconCalendar, IconList } from '@tabler/icons-react';

export function CustomerAdvisoriesView() {
  const navigate = useNavigate();
  const [advisories, setAdvisories] = useState<WaterInterruption[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    Promise.all([
      interruptionsApi.list().catch(() => ({ data: [] })),
      referenceApi.getBarangays().catch(() => []),
    ]).then(([interruptionRes, barangayRes]) => {
      setAdvisories(interruptionRes.data);
      setBarangays(barangayRes);
      setIsLoading(false);
    });
  }, []);

  const filteredAdvisories = advisories.filter((advisory) => {
    if (selectedBarangayId === 'all') return true;
    return advisory.barangays?.some((b) => b.id === selectedBarangayId);
  });

  return (
    <CustomerLayout currentPath="/customer/advisories" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
          <div>
            <h1 className="text-[10px] font-bold uppercase tracking-wider text-black">
              Water Service Interruption Advisories
            </h1>
            <p className="text-[10px] text-black/60">
              Real-time emergency repairs and scheduled maintenance schedules for Sinacaban
            </p>
          </div>

          {/* Barangay Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-black uppercase">Filter Zone:</label>
            <select
              className="px-2.5 py-1 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
              value={selectedBarangayId}
              onChange={(e) => setSelectedBarangayId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All Barangays ({advisories.length})</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      {/* View Switcher Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 border border-black rounded p-0.5 bg-white">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold transition-colors ${
              viewMode === 'list'
                ? 'bg-[#1E6FD9] text-white'
                : 'text-black hover:bg-[#F0F6FD]'
            }`}
          >
            <IconList size={12} />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#1E6FD9] text-white'
                : 'text-black hover:bg-[#F0F6FD]'
            }`}
          >
            <IconCalendar size={12} />
            <span>Calendar View</span>
          </button>
        </div>

        <span className="text-[10px] text-black/60 hidden sm:inline">
          Showing {filteredAdvisories.length} scheduled disruptions in Sinacaban
        </span>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <InterruptionCalendar interruptions={filteredAdvisories} />
      ) : isLoading ? (
        <Card className="p-8 text-center text-black/60 border border-black/15">
          Loading service interruption notices...
        </Card>
      ) : filteredAdvisories.length === 0 ? (
        <EmptyState
          title="No Active Water Interruptions"
          description={
            selectedBarangayId === 'all'
              ? 'All municipal pipelines in Sinacaban are currently operating normally.'
              : 'There are no active or scheduled service advisories for the selected barangay.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdvisories.map((advisory) => (
              <Card
                key={advisory.id}
                className="p-4 space-y-3 border-l-4 border-l-[#1E6FD9] border border-black/15"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <IconAlertTriangle size={14} className="text-[#1E6FD9] shrink-0" />
                    <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                      Advisory Notice #{advisory.id}
                    </span>
                  </div>
                  <Badge variant={advisory.is_published ? 'blue' : 'black'}>
                    {advisory.is_published ? 'Live Broadcast' : 'Draft'}
                  </Badge>
                </div>

                <p className="text-black leading-relaxed font-normal bg-[#F0F6FD] p-2.5 rounded border border-black/10 text-[10px]">
                  {advisory.message}
                </p>

                <div className="space-y-1.5 text-black/70 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <IconCalendarTime size={12} className="text-black/50 shrink-0" />
                    <span>
                      <strong>Starts:</strong> {new Date(advisory.starts_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconCalendarTime size={12} className="text-black/50 shrink-0" />
                    <span>
                      <strong>Expected End:</strong> {new Date(advisory.ends_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1 border-t border-black/10">
                    <IconMapPin size={12} className="text-black/50 shrink-0 mt-0.5" />
                    <div>
                      <strong>Affected Barangays:</strong>{' '}
                      {advisory.barangays && advisory.barangays.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {advisory.barangays.map((b) => (
                            <span
                              key={b.id}
                              className="inline-block bg-white border border-black/20 text-black px-1.5 py-0.5 rounded text-[10px]"
                            >
                              {b.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>All Sinacaban Service Zones</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
