import React, { useState, useMemo } from 'react';
import type { WaterInterruption } from '../../types';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export interface InterruptionCalendarProps {
  interruptions: WaterInterruption[];
  onSelectDate?: (date: Date, interruptionsOnDate: WaterInterruption[]) => void;
  className?: string;
  customerBarangayId?: number;
  role?: 'customer' | 'staff' | 'admin';
}

export const InterruptionCalendar: React.FC<InterruptionCalendarProps> = ({
  interruptions,
  onSelectDate,
  className = '',
  customerBarangayId,
  role = 'staff',
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // October 2026 default based on manuscript
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Section 7.4 Rule: Customers see their barangay, staff and admin see all barangays
  const scopedInterruptions = useMemo(() => {
    if (role === 'customer' && customerBarangayId) {
      return interruptions.filter((item) => {
        const bIds = item.barangays?.map((b) => b.id) || [];
        return bIds.includes(customerBarangayId);
      });
    }
    return interruptions;
  }, [interruptions, customerBarangayId, role]);

  // Helper to check if a day has interruptions
  const getInterruptionsForDay = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scopedInterruptions.filter((item) => {
      if (!item.starts_at) return false;
      const startStr = item.starts_at.slice(0, 10);
      const endStr = item.ends_at ? item.ends_at.slice(0, 10) : startStr;
      return dayStr >= startStr && dayStr <= endStr;
    });
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const date = new Date(year, month, day);
    const dayInts = getInterruptionsForDay(day);
    onSelectDate?.(date, dayInts);
  };

  return (
    <div className={`space-y-3 text-[14px] text-black ${className}`}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-black/15 pb-2">
        <div>
          <span className="font-bold uppercase tracking-wider text-[14px]">
            {monthNames[month]} {year}
          </span>
          {role === 'customer' ? (
            <span className="block text-[10px] text-brand-blue font-semibold">
              My Barangay Schedule
            </span>
          ) : (
            <span className="block text-[10px] text-black/50 font-semibold">
              All Municipal Barangays
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-black/5 rounded text-black transition-colors"
            title="Previous month"
            type="button"
          >
            <IconChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-black/5 rounded text-black transition-colors"
            title="Next month"
            type="button"
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center font-medium text-black/60 uppercase text-[9px]">
        {daysOfWeek.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading empty days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayInterruptions = getInterruptionsForDay(day);
          const hasDisruption = dayInterruptions.length > 0;
          const isSelected = selectedDay === day;

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDayClick(day)}
              type="button"
              className={`h-7 rounded flex flex-col items-center justify-center relative transition-colors border ${
                isSelected
                  ? 'bg-brand-blue text-white font-medium border-brand-blue'
                  : 'hover:bg-black/5 text-black border-transparent'
              }`}
            >
              <span>{day}</span>
              {hasDisruption && (
                <span
                  className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                    isSelected ? 'bg-white' : 'bg-brand-blue'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Disruption Summary */}
      {selectedDay !== null && (
        <div className="pt-2 border-t border-black/10">
          <span className="font-medium text-black block mb-1">
            {monthNames[month]} {selectedDay}, {year}:
          </span>
          {getInterruptionsForDay(selectedDay).length > 0 ? (
            <div className="space-y-1.5">
              {getInterruptionsForDay(selectedDay).map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-white border border-black/15 rounded-lg text-[10px] text-black space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-black font-bold truncate">
                      {item.title || 'Water Advisory'}
                    </strong>
                    <span className="text-[9px] font-bold text-brand-blue uppercase shrink-0">
                      {item.status}
                    </span>
                  </div>

                  {/* Barangay chips */}
                  {item.barangays && item.barangays.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.barangays.map((b) => (
                        <span
                          key={b.id}
                          className="px-1.5 py-0.2 rounded bg-blue-tint text-brand-blue border border-brand-blue/20 text-[9px] font-semibold"
                        >
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-black/70 truncate">{item.reason || item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-black/50 italic text-[9px]">
              No water service interruptions scheduled for this date.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
