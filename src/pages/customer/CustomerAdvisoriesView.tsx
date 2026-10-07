import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { InterruptionCalendar } from '../../components/organisms/InterruptionCalendar';
import { interruptionsApi } from '../../api';
import type { WaterInterruption } from '../../types';
import { IconAlertTriangle, IconCalendarTime, IconMapPin } from '@tabler/icons-react';

export function CustomerAdvisoriesView() {
  const navigate = useNavigate();
  const [advisories, setAdvisories] = useState<WaterInterruption[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDayAdvisories, setSelectedDayAdvisories] = useState<WaterInterruption[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 12));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    interruptionsApi
      .list()
      .then((res) => {
        setAdvisories(res.data);
        if (res.data.length > 0) {
          setSelectedDayAdvisories([res.data[0]]);
        }
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSelectDate = (date: Date, ints: WaterInterruption[]) => {
    setSelectedDate(date);
    setSelectedDayAdvisories(ints);
  };

  return (
    <CustomerLayout currentPath="/customer/advisories" onNavigate={(path) => navigate(path)}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header with Switcher [ Calendar ] [ List ] */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
            Advisories
          </h1>
          <div className="flex border border-black/20 rounded p-0.5 bg-[#F0F6FD]">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-[10px] transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9] font-normal'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-[10px] transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9] font-normal'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="space-y-3">
            <Card className="p-4 border border-black/15 bg-white">
              <InterruptionCalendar
                interruptions={advisories}
                onSelectDate={handleSelectDate}
              />
            </Card>

            {/* Selected Day Advisory Card */}
            <Card className="p-4 border border-black/15 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black text-[10px]">
                  {selectedDayAdvisories.length > 0 && selectedDayAdvisories[0].barangays?.[0]?.name
                    ? selectedDayAdvisories[0].barangays.map((b) => b.name).join(', ')
                    : 'Barangay Poblacion'}
                </span>
                <Badge variant="blue">Selected day</Badge>
              </div>

              <div className="text-[10px] text-black/60 font-normal">
                {selectedDayAdvisories.length > 0 && selectedDayAdvisories[0].starts_at ? (
                  <>
                    {new Date(selectedDayAdvisories[0].starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {selectedDayAdvisories[0].ends_at
                      ? new Date(selectedDayAdvisories[0].ends_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '5:00 PM'}
                  </>
                ) : (
                  '8:00 AM – 5:00 PM'
                )}
              </div>

              <p className="text-[10px] text-black font-normal leading-relaxed">
                {selectedDayAdvisories.length > 0
                  ? selectedDayAdvisories[0].message
                  : `Scheduled routine valve maintenance and mainline pipe inspection on ${selectedDate.toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}. Please store sufficient water ahead of time.`}
              </p>
            </Card>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {isLoading ? (
              <Card className="p-4 border border-black/15 text-center text-black/60 text-[10px] font-normal">
                Loading advisories...
              </Card>
            ) : advisories.length === 0 ? (
              <Card className="p-4 border border-black/15">
                <EmptyState
                  title="No Active Water Interruptions"
                  description="All municipal pipelines in Sinacaban are currently operating normally."
                />
              </Card>
            ) : (
              advisories.map((advisory) => (
                <Card
                  key={advisory.id}
                  className="p-4 border border-black/15 bg-white space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <IconAlertTriangle size={15} className="text-[#1E6FD9] shrink-0" />
                      <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                        Advisory #{advisory.id}
                      </span>
                    </div>
                    <Badge variant={advisory.is_published ? 'blue' : 'black'}>
                      {advisory.is_published ? 'Live' : 'Draft'}
                    </Badge>
                  </div>

                  <p className="text-black text-[10px] font-normal leading-relaxed bg-[#F0F6FD] p-2.5 rounded border border-black/10">
                    {advisory.message}
                  </p>

                  <div className="space-y-1 text-black/70 text-[10px] font-normal">
                    <div className="flex items-center gap-1.5">
                      <IconCalendarTime size={13} className="text-black/50" />
                      <span>
                        Starts: {new Date(advisory.starts_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconMapPin size={13} className="text-black/50" />
                      <span>
                        Affected:{' '}
                        {advisory.barangays && advisory.barangays.length > 0
                          ? advisory.barangays.map((b) => b.name).join(', ')
                          : 'All Sinacaban Zones'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
