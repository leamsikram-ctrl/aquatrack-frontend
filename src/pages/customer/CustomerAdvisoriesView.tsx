import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import {
  EmptyAdvisoriesIllustration,
  NoMatchesIllustration,
} from '../../components/illustrations';
import { authApi, interruptionsApi } from '../../api';
import type { User } from '../../types';
import {
  advisoriesStore,
  SINACABAN_BARANGAY_LIST,
  computeAdvisoryStatus,
  formatReadableDateTime,
  type AdvisoryRecord,
  type AdvisoryStatus,
} from '../../services/advisoriesStore';
import {
  IconX,
} from '@tabler/icons-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CustomerAdvisoriesView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryRecord[]>(() =>
    advisoriesStore.getAdvisories()
  );
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedBarangayId, setSelectedBarangayId] = useState<number>(10); // Default: Poblacion (id 10 in Sinacaban)
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryRecord | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        if (u) {
          setUser(u);
          if (u.customer_profile?.barangay_id) {
            setSelectedBarangayId(u.customer_profile.barangay_id);
          }
        }
      })
      .catch(() => null);

    interruptionsApi
      .list()
      .then((res) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const mappedAdvs: AdvisoryRecord[] = res.data.map((item: any) => {
            const parts = (item.message || '').split(' — ');
            const title = item.title || parts[0] || 'Water Advisory';
            const reason = item.description || parts[1] || item.message || '';
            const brgyIds = item.barangays?.map((b: any) => b.id) || [];
            const brgyNames = item.barangays?.map((b: any) => b.name) || [];
            return {
              id: item.id,
              title,
              reason,
              barangay_ids: brgyIds,
              barangay_names: brgyNames,
              starts_at: item.starts_at,
              ends_at: item.ends_at,
              is_cancelled: item.status === 'cancelled',
              is_restored: item.status === 'ended',
              affected_customers_count: 0,
              sms_sent_count: 0,
              in_app_only_count: 0,
              sms_text: item.message || '',
              created_at: item.starts_at,
              updated_at: item.ends_at,
            };
          });
          setAdvisories(mappedAdvs);
        } else {
          setAdvisories(advisoriesStore.getAdvisories());
        }
      })
      .catch(() => {
        setAdvisories(advisoriesStore.getAdvisories());
      });
  }, []);

  const currentBarangayName = useMemo(() => {
    return (
      SINACABAN_BARANGAY_LIST.find((b) => b.id === selectedBarangayId)?.name || 'Poblacion'
    );
  }, [selectedBarangayId]);

  // Section 5 & Section 7 Rule: Customer sees advisories matched to their own barangay
  const barangayAdvisories = useMemo(() => {
    const now = new Date();
    return advisories
      .filter((a) => a.barangay_ids.includes(selectedBarangayId))
      .map((a) => ({
        ...a,
        status: computeAdvisoryStatus(a, now),
      }));
  }, [advisories, selectedBarangayId]);

  const activeAdvisories = useMemo(
    () =>
      barangayAdvisories.filter(
        (a) => a.status === 'ongoing' || a.status === 'scheduled'
      ),
    [barangayAdvisories]
  );

  const historyAdvisories = useMemo(
    () =>
      barangayAdvisories.filter(
        (a) => a.status === 'completed' || a.status === 'cancelled'
      ),
    [barangayAdvisories]
  );

  // Calendar grid cells
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const daysInCurrMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const cells: {
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const dObj = new Date(calYear, calMonth - 1, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: false,
        dateKey: `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(
          dNum
        ).padStart(2, '0')}`,
      });
    }

    for (let dNum = 1; dNum <= daysInCurrMonth; dNum++) {
      const dObj = new Date(calYear, calMonth, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: true,
        dateKey: `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dNum).padStart(
          2,
          '0'
        )}`,
      });
    }

    const totalSlots = cells.length <= 35 ? 35 : 42;
    const remaining = totalSlots - cells.length;
    for (let dNum = 1; dNum <= remaining; dNum++) {
      const dObj = new Date(calYear, calMonth + 1, dNum);
      cells.push({
        date: dObj,
        dayNumber: dNum,
        isCurrentMonth: false,
        dateKey: `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(
          dNum
        ).padStart(2, '0')}`,
      });
    }

    return cells;
  }, [calYear, calMonth]);

  const getAdvisoriesForDateKey = (dateKey: string) => {
    return barangayAdvisories.filter((adv) => {
      const startDay = adv.starts_at.slice(0, 10);
      const endDay = (adv.actual_restored_at || adv.ends_at).slice(0, 10);
      return dateKey >= startDay && dateKey <= endDay;
    });
  };

  const selectedDateKey = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const getStatusPillClass = (status: AdvisoryStatus) => {
    switch (status) {
      case 'ongoing':
        return 'bg-black text-white';
      case 'scheduled':
        return 'bg-brand-blue text-white';
      case 'completed':
        return 'bg-blue-tint text-brand-blue border border-brand-blue/20';
      case 'cancelled':
        return 'bg-white border border-black/20 text-black/50 line-through';
    }
  };

  const computeProgressPct = (adv: AdvisoryRecord) => {
    if (adv.is_cancelled || adv.status === 'cancelled') return 100;
    if (adv.is_restored || adv.status === 'completed') return 100;
    const startMs = new Date(adv.starts_at).getTime();
    const endMs = new Date(adv.actual_restored_at || adv.ends_at).getTime();
    const nowMs = Date.now();
    if (nowMs < startMs) return 0;
    if (nowMs >= endMs) return 100;
    return Math.round(((nowMs - startMs) / (endMs - startMs)) * 100);
  };

  return (
    <CustomerLayout
      currentPath="/customer/advisories"
      onNavigate={(path) => navigate(path)}
      userName={user?.name || 'Maria Santos'}
    >
      <div
        className={`space-y-4 transition-all duration-200 ${
          selectedAdvisory ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Water Advisories
            </h1>
            <div className="text-black/60 text-[14px]">
              Scheduled maintenance, pipe repairs, and municipal outage announcements
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scoped to Customer's Own Barangay */}
            <div className="px-3 py-1.5 bg-blue-tint border border-brand-blue/30 rounded-lg text-xs font-bold text-brand-blue flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
              <span>Brgy. {currentBarangayName}</span>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-black/15 shadow-sm">
              {(['calendar', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'bg-brand-blue text-white'
                      : 'text-black/60 hover:text-black'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming & Ongoing Advisories for Customer's Barangay */}
        {activeAdvisories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeAdvisories.map((adv) => (
              <Card
                key={adv.id}
                onClick={() => setSelectedAdvisory(adv)}
                className="p-4 sm:p-5 bg-white border border-black/10 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-2.5 cursor-pointer hover:border-brand-blue hover:shadow-[3px_3px_0px_0px_var(--color-brand-blue)] transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[14px] text-black truncate">{adv.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                      adv.status
                    )}`}
                  >
                    {adv.status}
                  </span>
                </div>

                {/* Exactly one helper line */}
                <div className="text-xs text-black/70 truncate">{adv.reason}</div>

                {/* Barangay chips */}
                {adv.barangay_names && adv.barangay_names.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {adv.barangay_names.map((name) => (
                      <span
                        key={name}
                        className="px-2 py-0.5 rounded-full bg-blue-tint text-brand-blue border border-brand-blue/20 text-[11px] font-semibold"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Time Bar */}
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-black/60">
                    <span>Start: {formatReadableDateTime(adv.starts_at)}</span>
                    <span>{adv.is_restored ? 'Restored: ' : 'Expected: '}{formatReadableDateTime(adv.actual_restored_at || adv.ends_at)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden" role="progressbar">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        adv.status === 'ongoing'
                          ? 'bg-amber-500'
                          : adv.status === 'completed'
                          ? 'bg-assigned'
                          : adv.status === 'cancelled'
                          ? 'bg-black/30'
                          : 'bg-brand-blue'
                      }`}
                      style={{ width: `${Math.max(5, computeProgressPct(adv))}%` }}
                    />
                  </div>
                </div>

                {adv.remarks && (
                  <div className="text-[11px] text-black/60 pt-1 border-t border-black/10 truncate">
                    {adv.remarks}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <div className="flex flex-col space-y-2">
            {/* Part 1: Standalone Top White Date Bar */}
            <div className="px-5 py-3.5 rounded-xl bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] border border-black/10 flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-bold text-black">
                {MONTH_NAMES[calMonth]} {selectedDate.getDate()}, {calYear} · Brgy. {currentBarangayName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-1.5 rounded hover:bg-black/5 text-black/60 hover:text-black cursor-pointer"
                  aria-label="Previous month"
                >
                  <svg width="7" height="9" viewBox="0 0 6 8" fill="none">
                    <path d="M5 1L1 4L5 7V1Z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-1.5 rounded hover:bg-black/5 text-black/60 hover:text-black cursor-pointer"
                  aria-label="Next month"
                >
                  <svg width="7" height="9" viewBox="0 0 6 8" fill="none">
                    <path d="M1 1L5 4L1 7V1Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Part 2: Weekday Strip Between Date Bar and Grid */}
            <div className="grid grid-cols-7 text-center py-2">
              {WEEKDAYS_SHORT.map((dayName) => (
                <div key={dayName} className="text-xs font-bold text-black/60 uppercase tracking-wider">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Part 3: 7-Column Calendar Grid Card */}
            <div className="grid grid-cols-7 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden divide-x divide-y divide-black/10">
              {calendarCells.map((cell) => {
                const cellAdvs = getAdvisoriesForDateKey(cell.dateKey);
                const isSelected = cell.dateKey === selectedDateKey;
                const formattedDay = String(cell.dayNumber).padStart(2, '0');
                const hasMultiple = cellAdvs.length > 1;

                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[96px] sm:min-h-[104px] px-1.5 sm:px-2 py-2 flex flex-col items-center transition-colors cursor-pointer ${
                      isSelected || hasMultiple ? 'justify-start' : 'justify-center'
                    } ${
                      isSelected
                        ? 'border-t-[3px] border-t-brand-blue bg-blue-tint/40'
                        : 'hover:bg-blue-tint/20'
                    }`}
                  >
                    <div
                      className={`text-xs sm:text-sm font-semibold ${
                        cellAdvs.length > 0 ? 'mb-1.5' : ''
                      } ${
                        isSelected
                          ? 'text-brand-blue font-bold'
                          : cell.isCurrentMonth
                          ? 'text-black'
                          : 'text-black/25'
                      }`}
                    >
                      {formattedDay}
                    </div>

                    {cellAdvs.length > 0 && (
                      <div className="w-full space-y-1">
                        {cellAdvs.slice(0, 2).map((adv) => (
                          <button
                            key={`${cell.dateKey}-${adv.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdvisory(adv);
                            }}
                            className={`w-full px-1.5 py-0.5 rounded text-[10px] font-semibold truncate text-center cursor-pointer ${getStatusPillClass(
                              adv.status
                            )}`}
                          >
                            {adv.title}
                          </button>
                        ))}
                        {cellAdvs.length > 2 && (
                          <div className="w-full py-0.5 rounded border border-black/10 bg-blue-tint text-[9px] font-bold text-brand-blue text-center">
                            More
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <Card className="p-0 bg-white border border-black/10 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] overflow-hidden">
            {advisories.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  illustration={<EmptyAdvisoriesIllustration />}
                  title="No advisories"
                  description="No maintenance advisories scheduled at this time."
                />
              </div>
            ) : barangayAdvisories.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  illustration={<NoMatchesIllustration />}
                  title="No matches"
                  description={`No advisories match Barangay ${currentBarangayName}.`}
                  actionLabel="Clear filters"
                  onAction={() => {
                    if (user?.customer_profile?.barangay_id) {
                      setSelectedBarangayId(user.customer_profile.barangay_id);
                    } else {
                      setSelectedBarangayId(10);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {barangayAdvisories.map((adv) => (
                  <div
                    key={adv.id}
                    onClick={() => setSelectedAdvisory(adv)}
                    className="p-4 space-y-2 hover:bg-blue-tint/40 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-black">{adv.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                            adv.status
                          )}`}
                        >
                          {adv.status}
                        </span>
                      </div>

                      <div className="text-xs text-black/60 shrink-0">
                        <span>Start: {formatReadableDateTime(adv.starts_at)} · {adv.is_restored ? 'Restored: ' : 'End: '}{formatReadableDateTime(adv.actual_restored_at || adv.ends_at)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-black/70 truncate">{adv.reason}</div>

                    {/* Barangay chips */}
                    {adv.barangay_names && adv.barangay_names.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {adv.barangay_names.map((name) => (
                          <span
                            key={name}
                            className="px-2 py-0.5 rounded-full bg-blue-tint text-brand-blue border border-brand-blue/20 text-[11px] font-semibold"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Time Bar */}
                    <div className="pt-1 space-y-1">
                      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden" role="progressbar">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            adv.status === 'ongoing'
                              ? 'bg-amber-500'
                              : adv.status === 'completed'
                              ? 'bg-assigned'
                              : adv.status === 'cancelled'
                              ? 'bg-black/30'
                              : 'bg-brand-blue'
                          }`}
                          style={{ width: `${Math.max(5, computeProgressPct(adv))}%` }}
                        />
                      </div>
                    </div>

                    {adv.remarks && (
                      <div className="text-[11px] text-black/50 truncate pt-0.5">{adv.remarks}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Advisory History Section (Completed & Cancelled) */}
        {historyAdvisories.length > 0 && viewMode === 'calendar' && (
          <Card className="p-4 sm:p-5 bg-white border border-black/10 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-black/60 border-b border-black/10 pb-2">
              Advisory History (Completed & Cancelled)
            </div>
            <div className="divide-y divide-black/10">
              {historyAdvisories.map((adv) => (
                <div
                  key={adv.id}
                  onClick={() => setSelectedAdvisory(adv)}
                  className="py-3 flex items-center justify-between gap-2 hover:bg-blue-tint/40 cursor-pointer rounded-lg px-2 transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-black">{adv.title}</div>
                    <div className="text-[11px] text-black/60">
                      {formatReadableDateTime(adv.starts_at)} –{' '}
                      {formatReadableDateTime(adv.actual_restored_at || adv.ends_at)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                      adv.status
                    )}`}
                  >
                    {adv.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Advisory Detail Modal */}
      {selectedAdvisory &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedAdvisory(null)}
          >
            {(() => {
              const st = computeAdvisoryStatus(selectedAdvisory);
              return (
                <Card
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white p-5 rounded-xl border border-black/15 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] space-y-4 text-[14px]"
                >
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-black">
                        {selectedAdvisory.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusPillClass(
                          st
                        )}`}
                      >
                        {st}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAdvisory(null)}
                      className="p-1 text-black/50 hover:text-black rounded-md hover:bg-black/5 transition-colors"
                    >
                      <IconX size={18} />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-black/50 block">
                        Reason
                      </span>
                      <span className="font-semibold text-black text-[13px]">
                        {selectedAdvisory.reason}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase text-black/50 block mb-1">
                        Affected Barangays
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedAdvisory.barangay_names.map((name) => (
                          <span
                            key={name}
                            className="px-2.5 py-0.5 rounded-full bg-blue-tint text-brand-blue border border-brand-blue/20 text-xs font-semibold"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Time Bar */}
                    <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-black/70">
                        <span>Start: {formatReadableDateTime(selectedAdvisory.starts_at)}</span>
                        <span>{selectedAdvisory.is_restored ? 'Restored: ' : 'Expected End: '}{formatReadableDateTime(selectedAdvisory.actual_restored_at || selectedAdvisory.ends_at)}</span>
                      </div>
                      <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden" role="progressbar">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            st === 'ongoing'
                              ? 'bg-amber-500'
                              : st === 'completed'
                              ? 'bg-assigned'
                              : st === 'cancelled'
                              ? 'bg-black/30'
                              : 'bg-brand-blue'
                          }`}
                          style={{ width: `${Math.max(5, computeProgressPct(selectedAdvisory))}%` }}
                        />
                      </div>
                    </div>

                    {selectedAdvisory.remarks && (
                      <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10">
                        <span className="text-[10px] font-bold uppercase text-black/50 block">
                          Remarks
                        </span>
                        <span className="text-black">{selectedAdvisory.remarks}</span>
                      </div>
                    )}

                    {selectedAdvisory.restoration_remark && (
                      <div className="p-3 rounded-lg bg-blue-tint border border-brand-blue/20">
                        <span className="text-[10px] font-bold uppercase text-brand-blue block">
                          Restoration Note
                        </span>
                        <span className="text-black font-medium">
                          {selectedAdvisory.restoration_remark}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-black/10">
                    <Button variant="primary" onClick={() => setSelectedAdvisory(null)}>
                      Close
                    </Button>
                  </div>
                </Card>
              );
            })()}
          </div>,
          document.body
        )}
    </CustomerLayout>
  );
}
