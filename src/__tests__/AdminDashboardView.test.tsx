import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardView } from '../pages/admin/AdminDashboardView';
import { AdminUIProvider } from '../contexts/AdminUIContext';

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
    dashboard: vi.fn().mockResolvedValue({
      summary: {
        total_requests: 24,
        resolved_requests: 19,
        active_requests: 5,
        unassigned_requests: 2,
        overall_resolution_rate: 79,
        total_consumers: 1280,
        active_consumers: 1277,
        pending_verifications: 3,
        active_advisories: 2,
        total_advisories: 3,
        total_billed_amount: 485200,
        unpaid_bills_count: 42,
        paid_bills_count: 180,
        unpublished_bills_count: 5,
        overdue_bills_count: 2,
        collection_rate: 86,
      },
      monthly_trends: [
        { month: 'May', year_month: '2026-05', logged: 22, resolved: 20, rate: 91 },
        { month: 'Jun', year_month: '2026-06', logged: 31, resolved: 28, rate: 90 },
        { month: 'Jul', year_month: '2026-07', logged: 25, resolved: 24, rate: 96 },
        { month: 'Aug', year_month: '2026-08', logged: 38, resolved: 34, rate: 89 },
        { month: 'Sep', year_month: '2026-09', logged: 29, resolved: 27, rate: 93 },
        { month: 'Oct', year_month: '2026-10', logged: 24, resolved: 19, rate: 79 },
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
      recent_requests: [
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
      upcoming_interruptions: [
        {
          id: 1,
          title: 'Scheduled pipeline maintenance',
          starts_at: '2026-10-10 08:00',
          ends_at: '2026-10-10 17:00',
          barangays: [{ name: 'San Isidro' }],
        },
      ],
    }),
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

const renderDashboard = () => {
  return render(
    <AdminUIProvider>
      <BrowserRouter>
        <AdminDashboardView />
      </BrowserRouter>
    </AdminUIProvider>
  );
};

describe('AdminDashboardView - Totality Summaries & Diagrams', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
  });

  it('renders totality summary domain cards without redundant fragmentation', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('System Operations & Utility Dashboard')).toBeInTheDocument();
    });

    // Verify domain cards exist with both semantic accessibility and uppercase labels
    expect(screen.getAllByText('Service Requests').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Consumers')).toBeInTheDocument();
    expect(screen.getByText('Network Advisories')).toBeInTheDocument();
    expect(screen.getByText('Billing & Revenue')).toBeInTheDocument();

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getAllByText('Requests').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Users').length).toBeGreaterThan(0);
    expect(screen.getByText('Advisories')).toBeInTheDocument();
  });

  it('renders Maintenance Summary and Collection Summary line graphs', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Maintenance Summary')).toBeInTheDocument();
    });

    expect(screen.getByText('Collection Summary')).toBeInTheDocument();
    expect(screen.getAllByText('May').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jun').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jul').length).toBeGreaterThan(0);
  });

  it('renders the Requests donut chart with resolved, ongoing, and total counts', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Requests').length).toBeGreaterThan(0);
    });

    // Verify breakdown in legend
    expect(screen.getByText(/Resolved/i)).toBeInTheDocument();
    expect(screen.getByText(/Ongoing/i)).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    // Verify floating action button to manage requests
    const requestsBtn = screen.getByRole('button', { name: /view all requests/i });
    expect(requestsBtn).toBeInTheDocument();
  });

  it('renders operational action cards for Unassigned, Verifications, and Unpublished', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    expect(screen.getByText('Verifications')).toBeInTheDocument();
    expect(screen.getByText('Unpublished')).toBeInTheDocument();
    expect(screen.getByText('Unassigned Service Requests')).toBeInTheDocument();
    expect(screen.getByText('Pending Customer Verifications')).toBeInTheDocument();
    expect(screen.getByText('Unpublished Billing Records')).toBeInTheDocument();
  });
});

