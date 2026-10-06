import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import type { WaterInterruption } from '../../types';
import { IconChevronLeft, IconChevronRight, IconAlertTriangle, IconClock, IconMapPin } from '@tabler/icons-react';

export interface InterruptionCalendarProps {
  interruptions: WaterInterruption[];
  onSelectInterruption?: (interruption: WaterInterruption) => void;
  className?: string;
}

export const InterruptionCalendar: React.FC<InterruptionCalendarProps> = ({
  interruptions,
  onSelectInterruption,
  className = '',
}) => {
  // Current view date
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Helper to parse dates safely
  const isInterruptionOnDate = (item: WaterInterruption, checkDate: Date) => {
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth();
    const checkDay = checkDate.getDate();

    const start = new Date(item.starts_at);
    const end = new Date(item.ends_at);

    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    const currentDay = new Date(checkYear, checkMonth, checkDay).getTime();

    return currentDay >= startDay && currentDay <= endDay;
  };

  // Get interruptions for a specific day
  const getInterruptionsForDate = (date: Date) => {
    return interruptions.filter((item) => isInterruptionOnDate(item, date));
  };

  const selectedDayInterruptions = getInterruptionsForDate(selectedDate);

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    );
  };

  const isSelected = (d: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    );
  };

  return (
    <div className={`space-y-4 text-[10px] ${className}`}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-black/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black uppercase tracking-wider text-[10px]">
            {monthNames[month]} {year}
          </span>
          <span className="text-black/60 text-[10px]">
            ({interruptions.length} total municipal schedules)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="secondary" onClick={handleToday} className="py-1 px-2.5">
            Today
          </Button>
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="p-1 rounded border border-black hover:bg-[#F0F6FD] text-black transition-colors"
          >
            <IconChevronLeft size={14} />
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="p-1 rounded border border-black hover:bg-[#F0F6FD] text-black transition-colors"
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid (2 Cols on large screens) */}
        <Card className="lg:col-span-2 p-0 overflow-hidden border border-black/15">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-[#F0F6FD] border-b border-black/15 text-center py-2 font-bold text-black uppercase">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-[10px]">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-black/10 bg-white">
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`blank-${index}`} className="min-h-16 p-1.5 bg-black/5 opacity-40" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateObj = new Date(year, month, day);
              const dayEvents = getInterruptionsForDate(dateObj);
              const hasEvents = dayEvents.length > 0;
              const active = isSelected(day);
              const todayFlag = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`min-h-16 p-1.5 flex flex-col justify-between text-left transition-colors relative outline-none ${
                    active
                      ? 'bg-[#F0F6FD] ring-2 ring-inset ring-[#1E6FD9]'
                      : 'hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[10px] ${
                        todayFlag
                          ? 'bg-[#1E6FD9] text-white'
                          : active
                          ? 'text-[#1E6FD9]'
                          : 'text-black'
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-[#1E6FD9] ring-2 ring-white" />
                    )}
                  </div>

                  {/* Day Events preview */}
                  <div className="space-y-1 w-full mt-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate px-1 py-0.5 rounded bg-[#1E6FD9] text-white text-[9px] font-medium leading-tight"
                        title={ev.message || ev.title || 'Water Interruption'}
                      >
                        {ev.title || 'Interruption'}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-black/60 font-bold px-0.5">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Interruption Detail Panel */}
        <Card className="p-4 border border-black/15 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <div>
                <span className="font-bold text-black uppercase tracking-wider block">
                  Schedule Details
                </span>
                <span className="text-black/60">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <Badge variant={selectedDayInterruptions.length > 0 ? 'black' : 'outline'}>
                {selectedDayInterruptions.length} Advisories
              </Badge>
            </div>

            {selectedDayInterruptions.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#F0F6FD] text-[#1E6FD9] flex items-center justify-center mx-auto">
                  ✓
                </div>
                <div className="font-bold text-black uppercase">Normal Water Supply</div>
                <p className="text-black/60 leading-relaxed">
                  No maintenance shutdowns or emergency service interruptions are scheduled for this day in Sinacaban.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDayInterruptions.map((item) => {
                  const startTime = new Date(item.starts_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endTime = new Date(item.ends_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectInterruption?.(item)}
                      className="p-3 rounded border border-black/20 bg-[#F0F6FD] space-y-2 cursor-pointer hover:border-[#1E6FD9] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-black">
                          <IconAlertTriangle size={12} className="text-[#1E6FD9]" />
                          <span>{item.title || 'Water Service Advisory'}</span>
                        </div>
                        <Badge variant="blue">
                          {item.status ? item.status.toUpperCase() : 'SCHEDULED'}
                        </Badge>
                      </div>

                      <p className="text-black leading-snug">
                        {item.message || item.description || 'Routine pipeline system maintenance.'}
                      </p>

                      <div className="space-y-1 text-black/70 pt-1 border-t border-black/10">
                        <div className="flex items-center gap-1.5">
                          <IconClock size={11} className="text-black/50" />
                          <span>
                            {startTime} – {endTime}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <IconMapPin size={11} className="text-black/50 mt-0.5 shrink-0" />
                          <span>
                            Areas: {item.barangays && item.barangays.length > 0
                              ? item.barangays.map((b) => b.name).join(', ')
                              : 'All Sinacaban Barangays'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/15 text-black/60 text-[9px] italic">
            Schedule updates are broadcast in real-time via the Sinacaban Municipal SMS Gateway.
          </div>
        </Card>
      </div>
    </div>
  );
};
