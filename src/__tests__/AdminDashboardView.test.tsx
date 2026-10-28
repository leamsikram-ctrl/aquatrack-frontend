import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardView } from '../pages/admin/AdminDashboardView';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { adminApi } from '../api';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

// Mock APIs
vi.mock('../api', () => ({
  requestsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          reference: 'AT-2026-0001',
          reference_number: 'AT-2026-0001',
          description: 'Main pipe leakage near public market',
          urgency: 'high',
          status: 'in_progress',
          barangay: { name: 'Poblacion' },
          assigned_staff: { name: 'Juan Dela Cruz' },
        },
      ],
      pagination: { total: 24 },
    }),
  },
  billingApi: {
    list: vi.fn().mockResolvedValue({
      data: [{ id: 1, amount_due: 450, payment_status: 'unpaid' }],
      pagination: { total: 42 },
    }),
  },
  interruptionsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Scheduled pipeline maintenance',
          starts_at: '2026-10-10 08:00',
          ends_at: '2026-10-10 17:00',
          barangays: [{ name: 'San Isidro' }],
        },
      ],
      pagination: { total: 2 },
    }),
  },
  adminApi: {
    dashboard: vi.fn(),
    pendingRegistrations: vi.fn().mockResolvedValue({
      data: [],
      pagination: { total: 3 },
    }),
    customersList: vi.fn().mockResolvedValue({
      data: [],
      pagination: { total: 1280 },
    }),
  },
}));

const mockDashboardData = {
  summary: {
    total_requests: 24,
    resolved_requests: 19,
    active_requests: 5,
    unassigned_requests: 2,
    overall_resolution_rate: 79,
    total_users: 1280,
    users_by_role: { consumers: 1277, staff: 2, admins: 1 },
    users_by_status: { active: 1275, pending: 3, declined: 2 },
    total_consumers: 1280,
    active_consumers: 1277,
    pending_verifications: 3,
    active_advisories: 2,
    ongoing_advisories: 2,
    total_advisories: 3,
    total_billed_amount: 485200,
    payments_this_month: 485200,
    customers_with_balance: 42,
    open_billing_period: 'October 2026',
    unpaid_bills_count: 42,
    paid_bills_count: 180,
    collection_rate: 86,
    coverage_rate: 90,
    active_meter_rate: 95,
  },
  monthly_trends: [
    { month: 'May', year_month: '2026-05', logged: 22, resolved: 20, rate: 91, collected: 8548 },
    { month: 'Jun', year_month: '2026-06', logged: 31, resolved: 28, rate: 90, collected: 8392 },
    { month: 'Jul', year_month: '2026-07', logged: 25, resolved: 24, rate: 96, collected: 8617 },
    { month: 'Aug', year_month: '2026-08', logged: 38, resolved: 34, rate: 89, collected: 8658 },
    { month: 'Sep', year_month: '2026-09', logged: 29, resolved: 27, rate: 93, collected: 7852 },
    { month: 'Oct', year_month: '2026-10', logged: 24, resolved: 19, rate: 79, collected: 5200 },
  ],
  categories: [
    { category: 'Mainline Leaks & Pipe Bursts', count: 32, resolved: 28, percentage: 88 },
    { category: 'Low Pressure & Flow Interruptions', count: 22, resolved: 20, percentage: 91 },
    { category: 'Meter Replacement & Calibration', count: 16, resolved: 15, percentage: 94 },
  ],
  barangay_coverage: [
    { id: 1, name: 'Poblacion', connections: 342, open_requests: 1, status: 'Normal' },
    { id: 2, name: 'San Isidro', connections: 218, open_requests: 2, status: 'Advisory' },
    { id: 3, name: 'Cagab-an', connections: 185, open_requests: 0, status: 'Normal' },
  ],
  recent_requests: [],
  upcoming_interruptions: [],
};

const renderDashboard = () => {
  return render(
    <AdminUIProvider>
      <BrowserRouter>
        <AdminDashboardView />
      </BrowserRouter>
    </AdminUIProvider>
  );
};

describe('AdminDashboardView - Workflow Metrics & Tiles', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    vi.mocked(adminApi.dashboard).mockReset();
  });

  it('renders all 8 workflow metric tiles with correct values and titles', async () => {
    vi.mocked(adminApi.dashboard).mockResolvedValue(mockDashboardData as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
    });

    // Row 1 Tiles
    expect(screen.getAllByText('Payments this month').length).toBeGreaterThan(0);
    expect(screen.getByText('₱485.2k')).toBeInTheDocument();

    expect(screen.getAllByText('Active Requests').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Users').length).toBeGreaterThan(0);
    expect(screen.getByText('1280')).toBeInTheDocument();

    expect(screen.getAllByText('Ongoing Advisories').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    // Row 2 Tiles
    expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Verifications').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Customers with Balance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('42').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Open Billing Period').length).toBeGreaterThan(0);
    expect(screen.getByText('October 2026')).toBeInTheDocument();
  });

  it('strictly verifies no SLA, Water Quality, Unpublished, or Overdue tile remains', async () => {
    vi.mocked(adminApi.dashboard).mockResolvedValue(mockDashboardData as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText(/^SLA$/i)).toBeNull();
    expect(screen.queryByText(/Water Quality/i)).toBeNull();
    expect(screen.queryByText(/Unpublished/i)).toBeNull();
    expect(screen.queryByText(/Overdue/i)).toBeNull();
  });

  it('renders the Needs-action strip with action items for Unassigned, Pending, and Ongoing advisories', async () => {
    vi.mocked(adminApi.dashboard).mockResolvedValue(mockDashboardData as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Needs Action')).toBeInTheDocument();
    });

    expect(screen.getByText('Immediate operational items requiring administrative action.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unassigned/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ongoing advisories/i })).toBeInTheDocument();
  });

  it('renders Maintenance Summary, Collection Summary, and Requests Breakdown charts with data', async () => {
    vi.mocked(adminApi.dashboard).mockResolvedValue(mockDashboardData as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Maintenance Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('Collection Summary')).toBeInTheDocument();
    expect(screen.getByText('Requests Breakdown')).toBeInTheDocument();

    // Verify month labels on charts
    expect(screen.getAllByText('May').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jun').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jul').length).toBeGreaterThan(0);

    // Verify Requests donut breakdown in legend
    expect(screen.getByText(/Resolved \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Ongoing \(/i)).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    // Verify View All Requests button exists in card header (no legend overlap)
    const requestsBtn = screen.getByRole('button', { name: /view all requests/i });
    expect(requestsBtn).toBeInTheDocument();
  });

  it('renders empty states on zero data and avoids "Ongoing 100%" on zero requests', async () => {
    const zeroData = {
      summary: {
        total_requests: 0,
        resolved_requests: 0,
        active_requests: 0,
        unassigned_requests: 0,
        overall_resolution_rate: 0,
        total_users: 0,
        users_by_role: { consumers: 0, staff: 0, admins: 0 },
        users_by_status: { active: 0, pending: 0, declined: 0 },
        total_consumers: 0,
        active_consumers: 0,
        pending_verifications: 0,
        active_advisories: 0,
        ongoing_advisories: 0,
        total_advisories: 0,
        total_billed_amount: 0,
        payments_this_month: 0,
        customers_with_balance: 0,
        open_billing_period: null,
        unpaid_bills_count: 0,
        paid_bills_count: 0,
        collection_rate: 0,
        coverage_rate: 100,
        active_meter_rate: 0,
      },
      monthly_trends: [],
      categories: [],
      barangay_coverage: [],
      recent_requests: [],
      upcoming_interruptions: [],
    };

    vi.mocked(adminApi.dashboard).mockResolvedValue(zeroData as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
    });

    // Verify empty states rendered in the charts
    expect(screen.getAllByText('No activity recorded').length).toBeGreaterThan(0);
    expect(screen.getByText('No requests logged')).toBeInTheDocument();

    // Crucial: verify that "Ongoing (100%)" is NOT present when totalRequests is 0
    expect(screen.queryByText(/Ongoing \(100%\)/i)).toBeNull();
  });
});
