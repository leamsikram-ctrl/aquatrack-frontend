import { useState, useEffect } from 'react';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { interruptionsApi, referenceApi } from '../../api';
import type { WaterInterruption, Barangay } from '../../types';
import { IconAlertTriangle, IconCalendarTime, IconMapPin } from '@tabler/icons-react';

export function CustomerAdvisoriesView() {
  const [advisories, setAdvisories] = useState<WaterInterruption[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
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
          <label className="text-[10px] font-bold text-black uppercase">Area:</label>
          <select
            className="px-3 py-1.5 text-[10px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9]"
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

      {isLoading ? (
        <Card className="p-8 text-center text-black/60 border border-black/10">
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
              className="p-4 space-y-3 border-l-4 border-l-[#1E6FD9] border border-black/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle size={16} className="text-[#1E6FD9] shrink-0" />
                  <span className="font-bold text-black uppercase tracking-wide">
                    {advisory.title}
                  </span>
                </div>
                <Badge variant={advisory.status === 'ongoing' ? 'blue' : 'outline'}>
                  {advisory.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-[10px] text-black/80 leading-relaxed">
                {advisory.description}
              </p>

              {/* Timing */}
              <div className="p-2.5 bg-[#F0F6FD] border border-black/10 rounded-lg space-y-1">
                <div className="flex items-center gap-2 font-medium text-black">
                  <IconCalendarTime size={14} className="text-black" />
                  <span>Duration Window:</span>
                </div>
                <div className="text-[10px] text-black/70 pl-5">
                  From: <strong>{new Date(advisory.starts_at).toLocaleString()}</strong>
                  <br />
                  Until: <strong>{new Date(advisory.ends_at).toLocaleString()}</strong>
                </div>
              </div>

              {/* Affected Barangays */}
              {advisory.barangays && advisory.barangays.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1 font-bold text-black text-[10px]">
                    <IconMapPin size={12} className="text-[#1E6FD9]" />
                    <span>Affected Barangays:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {advisory.barangays.map((b) => (
                      <Badge key={b.id} variant="outline">
                        {b.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
