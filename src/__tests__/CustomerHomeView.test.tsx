import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CustomerHomeView } from '../pages/customer/CustomerHomeView';

const { mockCustomerUser } = vi.hoisted(() => {
  return {
    mockCustomerUser: {
      id: 101,
      name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'customer' as const,
      customer_profile: {
        account_number: 'ACC-2026-0001',
        meter: { meter_number: 'MTR-SIN-0001' },
        barangay: { name: 'Poblacion' },
        address: 'Purok 1, Poblacion',
      },
    },
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCustomerUser,
    logout: vi.fn(),
  }),
}));

vi.mock('../api', () => ({
  authApi: {
    me: vi.fn().mockResolvedValue(mockCustomerUser),
  },
  requestsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 12,
          reference_no: 'AT-2026-0012',
          status: 'in_progress',
          issue_type: { id: 4, name: 'Low pressure / weak flow', default_urgency: 'medium' },
          description: 'Water pressure dropped significantly since 6am.',
          created_at: '2026-10-25T08:00:00Z',
        },
      ],
    }),
    create: vi.fn().mockImplementation((payload) =>
      Promise.resolve({
        id: 13,
        reference_no: 'AT-2026-0013',
        status: 'submitted',
        issue_type: { id: payload.issue_type_id, name: 'Pipe leak or burst' },
        description: payload.description,
        created_at: new Date().toISOString(),
      })
    ),
  },
  billingApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          billing_period: 'October 2026',
          period_label: 'October 2026',
          amount_due: 350.0,
          current_balance: 0.0,
          previous_balance: 350.0,
          total_balance: 350.0,
          payment_status: 'unpaid',
          due_date: '2026-10-25',
        },
      ],
    }),
  },
  interruptionsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          message: 'Scheduled pipeline pressure checks across Poblacion.',
          starts_at: '2026-10-26T08:00:00Z',
          ends_at: '2026-10-26T17:00:00Z',
          barangays: [{ id: 1, name: 'Poblacion' }],
        },
      ],
    }),
  },
}));

describe('CustomerHomeView (Modern Customer Dashboard UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders modern customer dashboard with welcome header and account snapshot', async () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    // Welcome and account header
    expect(screen.getAllByText(/Home/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Maria Santos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ACC-2026-0001/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MTR-SIN-0001/i).length).toBeGreaterThan(0);
  });

  it('renders billing card with total amount due, due date, and payment status', async () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Current Bill/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/₱350.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Unpaid/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/View Bill/i).length).toBeGreaterThan(0);
    });
  });

  it('renders one balance card with total, due-date chip, split bar, and single office payment line matching Task 10', async () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Total Balance Due matching Task 10 after payment (Total: 350.00)
      expect(screen.getByText('Total Balance Due')).toBeInTheDocument();
      expect(screen.getAllByText('₱350.00').length).toBe(2); // Total balance and Previous in split bar

      // Due-date chip
      expect(screen.getByText('Due Oct 25, 2026')).toBeInTheDocument();

      // Proportional bar split into Current (₱0.00) and Previous (₱350.00)
      expect(screen.getByText('Current:')).toBeInTheDocument();
      expect(screen.getByText('₱0.00')).toBeInTheDocument();
      expect(screen.getByText('Previous:')).toBeInTheDocument();

      // Exactly one short line about paying at the office
      expect(
        screen.getByText('Pay at the Sinacaban Municipal Treasury Office (Mon–Fri, 8 AM–5 PM).')
      ).toBeInTheDocument();

      // Unpaid badge derived from total balance
      expect(screen.getAllByText('Unpaid').length).toBeGreaterThan(0);
    });
  });

  it('verifies that no water consumption data, cubic meters, or readings appear on the page', async () => {
    const { container } = render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Balance Due')).toBeInTheDocument();
    });

    const pageText = container.textContent || '';
    expect(pageText).not.toMatch(/consumption/i);
    expect(pageText).not.toMatch(/cubic meter/i);
    expect(pageText).not.toMatch(/m³/i);
    expect(pageText).not.toMatch(/meter reading/i);
  });

  it('renders active request tracker with 4-step progress bar', async () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Active Request/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/AT-2026-0012/i)).toBeInTheDocument();
      expect(screen.getByText(/Low pressure \/ weak flow/i)).toBeInTheDocument();
      expect(screen.getByText(/Submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/Assigned/i)).toBeInTheDocument();
      expect(screen.getAllByText(/In progress/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Resolved/i)).toBeInTheDocument();
    });
  });

  it('opens report issue modal, fills form, and submits new request', async () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    const reportBtns = screen.getAllByRole('button', { name: /Report an Issue/i });
    fireEvent.click(reportBtns[0]);

    expect(screen.getByText(/Report a Water Service Issue/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Describe the issue/i);
    fireEvent.change(textarea, { target: { value: 'Water leak detected near our main valve.' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Report a Water Service Issue/i)).not.toBeInTheDocument();
    });
  });

  it('renders municipal support helpdesk information and emergency hotline', () => {
    render(
      <BrowserRouter>
        <CustomerHomeView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Municipal Support/i)).toBeInTheDocument();
    expect(screen.getByText(/\(088\) 564-1234/i)).toBeInTheDocument();
    expect(screen.getByText(/Mon – Fri, 8:00 AM – 5:00 PM/i)).toBeInTheDocument();
  });
});
