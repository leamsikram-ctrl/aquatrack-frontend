import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { adminApi } from '../../api';
import {
  IconTool,
  IconUsers,
  IconReceipt,
  IconBell,
  IconMenu2,
  IconClipboardList,
  IconUserCheck,
  IconFileSpreadsheet,
  IconCalendar,
} from '@tabler/icons-react';
import { EmptyState } from '../../components/molecules/EmptyState';

interface CurvedLineGraphProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  yFormat?: (val: number) => string;
  unitPrefix?: string;
}

function CurvedLineGraph({
  title,
  data,
  yFormat,
  unitPrefix = '',
}: CurvedLineGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  const width = 460;
  const height = 220;
  const padLeft = 52;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 34;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const rawMax = Math.max(...data.map((d) => d.value), 10);
  const yMax = rawMax <= 50 ? Math.ceil(rawMax / 10) * 10 : Math.ceil(rawMax / 1000) * 1000;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const points = data.map((d, i) => {
    const x = padLeft + (i / Math.max(1, data.length - 1)) * plotWidth;
    const y = padTop + plotHeight - (d.value / yMax) * plotHeight;
    return { x, y, ...d };
  });

  // Smooth Bézier Curve matching user photo sample
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
    : '';

  const gradientId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="bg-white rounded-md border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.18),0_8px_14px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 p-5 h-[370px] flex flex-col justify-between hover:border-black/20 transition-all duration-200">
      <div className="flex items-center justify-between border-b border-black/10 pb-3 h-10">
        <h2 className="text-base font-bold text-brand-blue tracking-tight">
          {title}
        </h2>
        {hasData && hoveredIndex !== null && data[hoveredIndex] && (
          <span className="text-xs font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded">
            {data[hoveredIndex].label}: {yFormat ? yFormat(data[hoveredIndex].value) : `${unitPrefix}${data[hoveredIndex].value}`}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No activity recorded"
            description="No monthly records for this period."
            className="border-0 shadow-none p-2 bg-transparent"
          />
        </div>
      ) : (
        <div className="relative w-full flex-1 flex items-center justify-center pt-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible select-none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Faint Horizontal Dashed Gridlines & Y-Axis Labels */}
            {yTicks.map((tickVal) => {
              const y = padTop + plotHeight - (tickVal / yMax) * plotHeight;
              const formatted = yFormat ? yFormat(tickVal) : `${unitPrefix}${tickVal}`;
              return (
                <g key={tickVal}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="rgba(0, 0, 0, 0.07)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[11px] fill-black/45 font-medium"
                  >
                    {formatted}
                  </text>
                </g>
              );
            })}

            {/* Area Gradient Fill under curve */}
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
              />
            )}

            {/* Smooth Curved Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-brand-blue)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Dots & X-Axis Month Labels */}
            {points.map((pt, idx) => (
              <g
                key={pt.label}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer group"
              >
                {/* Invisible larger hover hit area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill="transparent"
                />
                {/* Visible Data Point Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === idx ? '5.5' : '4'}
                  fill="var(--color-brand-blue)"
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                {/* X-Axis Month Label */}
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] transition-colors font-medium ${
                    hoveredIndex === idx ? 'fill-brand-blue font-bold' : 'fill-black/60'
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

interface RequestsDonutCardProps {
  totalRequests: number;
  resolvedRequests: number;
  ongoingRequests: number;
  onNavigate: (path: string) => void;
}

function RequestsDonutCard({
  totalRequests,
  resolvedRequests,
  ongoingRequests,
  onNavigate,
}: RequestsDonutCardProps) {
  const size = 230;
  const radius = 84;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;

  const resolvedPct = totalRequests > 0 ? Math.round((resolvedRequests / totalRequests) * 100) : 0;
  const ongoingPct = totalRequests > 0 ? Math.max(0, 100 - resolvedPct) : 0;

  const resolvedDash = (resolvedPct / 100) * circumference;
  const ongoingDash = (ongoingPct / 100) * circumference;
  const ongoingOffset = -(resolvedPct / 100) * circumference;

  return (
    <div className="bg-white rounded-md border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.18),0_8px_14px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 p-5 h-[370px] flex flex-col justify-between hover:border-black/20 transition-all duration-200">
      {/* Header bar with title and View All Requests button */}
      <div className="flex items-center justify-between border-b border-black/10 pb-3 h-10">
        <h2 className="text-base font-bold text-brand-blue tracking-tight">
          Requests Breakdown
        </h2>
        <button
          onClick={() => onNavigate('/admin/maintenance')}
          title="View All Requests"
          aria-label="View All Requests"
          className="w-7 h-7 rounded bg-brand-blue/10 text-brand-blue flex items-center justify-center hover:bg-brand-blue hover:text-white transition-colors cursor-pointer"
        >
          <IconMenu2 size={16} />
        </button>
      </div>

      {totalRequests === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No requests logged"
            description="No maintenance requests in the system."
            className="border-0 shadow-none p-2 bg-transparent"
          />
        </div>
      ) : (
        <>
          <div className="relative flex-1 flex items-center justify-center my-1">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Base track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(0, 0, 0, 0.05)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Resolved Slice (Municipal Blue) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-brand-blue)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${resolvedDash} ${circumference}`}
                strokeDashoffset="0"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
              {/* Ongoing Slice (Dark Slate) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="var(--color-assigned)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${ongoingDash} ${circumference}`}
                strokeDashoffset={ongoingOffset}
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Center Text: "Requests" on top, Total count on bottom */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider leading-none">
                Requests
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-black leading-tight mt-1.5">
                {totalRequests}
              </span>
            </div>
          </div>

          {/* Clean Legend: Resolved, Ongoing, Total */}
          <div className="border-t border-black/10 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-black">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
                <span>{resolvedRequests}</span>
              </div>
              <span className="text-[11px] text-black/60 font-medium">
                Resolved ({resolvedPct}%)
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-black">
                <span className="w-2.5 h-2.5 rounded-full bg-assigned" />
                <span>{ongoingRequests}</span>
              </div>
              <span className="text-[11px] text-black/60 font-medium">
                Ongoing ({ongoingPct}%)
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-black">
                <span className="w-2.5 h-2.5 rounded-full bg-black/25" />
                <span>{totalRequests}</span>
              </div>
              <span className="text-[11px] text-black/60 font-medium">
                Total
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminDashboardView() {
  const navigate = useNavigate();

  // 8 Specific Workflow Metrics (Sections 1 & 8)
  const [paymentsThisMonth, setPaymentsThisMonth] = useState<number>(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [ongoingAdvisoriesCount, setOngoingAdvisoriesCount] = useState<number>(0);
  const [unassignedRequestsCount, setUnassignedRequestsCount] = useState<number>(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);
  const [customersWithBalanceCount, setCustomersWithBalanceCount] = useState<number>(0);
  const [openBillingPeriodLabel, setOpenBillingPeriodLabel] = useState<string | null>(null);

  // Breakdown & Graph data
  const [totalRequestsCount, setTotalRequestsCount] = useState<number>(0);
  const [resolvedRequestsCount, setResolvedRequestsCount] = useState<number>(0);
  const [monthlyTrends, setMonthlyTrends] = useState<Array<{
    month: string;
    year_month?: string;
    logged: number;
    resolved: number;
    rate: number;
    collected?: number;
    billed?: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.dashboard();

        setPaymentsThisMonth(data.summary.payments_this_month ?? data.summary.total_billed_amount ?? 0);
        setActiveRequestsCount(data.summary.active_requests ?? 0);
        setTotalUsersCount(data.summary.total_users ?? data.summary.total_consumers ?? 0);
        setOngoingAdvisoriesCount(data.summary.ongoing_advisories ?? data.summary.active_advisories ?? 0);
        setUnassignedRequestsCount(data.summary.unassigned_requests ?? 0);
        setPendingVerificationsCount(data.summary.pending_verifications ?? 0);
        setCustomersWithBalanceCount(data.summary.customers_with_balance ?? 0);
        setOpenBillingPeriodLabel(data.summary.open_billing_period ?? null);

        setTotalRequestsCount(data.summary.total_requests ?? 0);
        setResolvedRequestsCount(data.summary.resolved_requests ?? 0);
        setMonthlyTrends(data.monthly_trends || []);
      } catch {
        // Fallback defaults on network failure
        setPaymentsThisMonth(0);
        setActiveRequestsCount(0);
        setTotalUsersCount(0);
        setOngoingAdvisoriesCount(0);
        setUnassignedRequestsCount(0);
        setPendingVerificationsCount(0);
        setCustomersWithBalanceCount(0);
        setOpenBillingPeriodLabel(null);
        setTotalRequestsCount(0);
        setResolvedRequestsCount(0);
        setMonthlyTrends([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const ongoingRequestsCount = Math.max(0, totalRequestsCount - resolvedRequestsCount);

  // Maintenance Summary line graph data from real database monthly records
  const maintenanceData = useMemo(() => {
    if (monthlyTrends.length > 0) {
      return monthlyTrends.map((t) => ({
        label: t.month,
        value: t.logged,
      }));
    }
    return [];
  }, [monthlyTrends]);

  // Collection Summary line graph data from real database monthly records
  const collectionData = useMemo(() => {
    if (monthlyTrends.length > 0 && monthlyTrends.some((t) => t.collected !== undefined)) {
      return monthlyTrends.map((t) => ({
        label: t.month,
        value: t.collected || 0,
      }));
    }
    return [];
  }, [monthlyTrends]);

  return (
    <AdminLayout
      currentPath="/admin/dashboard"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6 text-[14px]">
        {/* Header - Titles: Maximum 3 words. Subtitles: Exactly one helper line */}
        <div className="border-b border-black/10 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Operations Dashboard
          </h1>
          <p className="text-xs text-black/60 mt-1">
            Live utility operations, maintenance metrics, and network status.
          </p>
        </div>

        {/* 1. Top Row: 4 Metric Cards (Tiles 1 to 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Tile 1: Payments this month (replaces Revenue) - bg-urgency-high */}
          <div
            onClick={() => navigate('/admin/billing')}
            className="bg-urgency-high rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconReceipt size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : (paymentsThisMonth >= 1000 ? `₱${(paymentsThisMonth / 1000).toFixed(1)}k` : `₱${paymentsThisMonth.toLocaleString()}`)}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Payments this month
              </div>
              <span className="sr-only">Payments this month</span>
            </div>
          </div>

          {/* Tile 2: Active Requests (replaces Requests) - bg-urgency-medium */}
          <div
            onClick={() => navigate('/admin/maintenance')}
            className="bg-urgency-medium rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconTool size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : activeRequestsCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Active Requests
              </div>
              <span className="sr-only">Active Requests</span>
            </div>
          </div>

          {/* Tile 3: Users - bg-brand-blue */}
          <div
            onClick={() => navigate('/admin/users')}
            className="bg-brand-blue rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconUsers size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : totalUsersCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Users
              </div>
              <span className="sr-only">Total Users</span>
            </div>
          </div>

          {/* Tile 4: Ongoing Advisories (replaces Advisories) - bg-urgency-low */}
          <div
            onClick={() => navigate('/admin/interruptions')}
            className="bg-urgency-low rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconBell size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : ongoingAdvisoriesCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Ongoing Advisories
              </div>
              <span className="sr-only">Ongoing Advisories</span>
            </div>
          </div>
        </div>

        {/* 2. Operational Action Cards (Tiles 5 to 8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Tile 5: Unassigned - bg-amber-600 */}
          <div
            onClick={() => navigate('/admin/maintenance?staff=unassigned')}
            className="bg-amber-600 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconClipboardList size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : unassignedRequestsCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Unassigned
              </div>
              <span className="sr-only">Unassigned Requests</span>
            </div>
          </div>

          {/* Tile 6: Pending Verifications - bg-purple-600 */}
          <div
            onClick={() => navigate('/admin/users?role=consumer&verification=pending')}
            className="bg-purple-600 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconUserCheck size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : pendingVerificationsCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Pending Verifications
              </div>
              <span className="sr-only">Pending Verifications</span>
            </div>
          </div>

          {/* Tile 7: Customers with Balance (replaces Unpublished) - bg-slate-600 */}
          <div
            onClick={() => navigate('/admin/billing')}
            className="bg-slate-600 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconFileSpreadsheet size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : customersWithBalanceCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Customers with Balance
              </div>
              <span className="sr-only">Customers with Balance</span>
            </div>
          </div>

          {/* Tile 8: Open Billing Period (replaces Overdue) - bg-teal-700 */}
          <div
            onClick={() => navigate('/admin/billing')}
            className="bg-teal-700 rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconCalendar size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                {isLoading ? '...' : (openBillingPeriodLabel || 'None')}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Open Billing Period
              </div>
              <span className="sr-only">Open Billing Period</span>
            </div>
          </div>
        </div>

        {/* Needs-action strip directly above the charts */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Needs Action
              </h2>
              <p className="text-xs text-amber-900/80">
                Immediate operational items requiring administrative action.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/admin/maintenance?staff=unassigned')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-amber-300 hover:border-amber-400 text-xs font-semibold text-amber-950 shadow-sm hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-600 text-white text-[11px] font-bold">
                {unassignedRequestsCount}
              </span>
              <span>Unassigned</span>
            </button>

            <button
              onClick={() => navigate('/admin/users?role=consumer&verification=pending')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-purple-300 hover:border-purple-400 text-xs font-semibold text-purple-950 shadow-sm hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">
                {pendingVerificationsCount}
              </span>
              <span>Pending</span>
            </button>

            <button
              onClick={() => navigate('/admin/interruptions')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-sky-300 hover:border-sky-400 text-xs font-semibold text-sky-950 shadow-sm hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sky-600 text-white text-[11px] font-bold">
                {ongoingAdvisoriesCount}
              </span>
              <span>Ongoing advisories</span>
            </button>
          </div>
        </div>

        {/* 3. Middle Section: Maintenance Summary, Collection Summary & Requests Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Chart 1: Maintenance Summary Line Graph */}
          <div className="lg:col-span-1">
            <CurvedLineGraph
              title="Maintenance Summary"
              data={maintenanceData}
              unitPrefix=""
              yFormat={(val) => Math.round(val).toString()}
            />
          </div>

          {/* Chart 2: Collection Summary Line Graph */}
          <div className="lg:col-span-1">
            <CurvedLineGraph
              title="Collection Summary"
              data={collectionData}
              unitPrefix="₱"
              yFormat={(val) => `₱${(val / 1000).toFixed(0)}k`}
            />
          </div>

          {/* Chart 3: Requests Donut Chart (Resolved vs Ongoing vs Total) */}
          <div className="lg:col-span-1">
            <RequestsDonutCard
              totalRequests={totalRequestsCount}
              resolvedRequests={resolvedRequestsCount}
              ongoingRequests={ongoingRequestsCount}
              onNavigate={(path) => navigate(path)}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
