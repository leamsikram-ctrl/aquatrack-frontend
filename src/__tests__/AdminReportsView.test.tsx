import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminReportsView, getPhilippineToday } from '../pages/admin/AdminReportsView';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { advisoriesStore } from '../services/advisoriesStore';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'SIWASS Administrator', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

const mockRequests = [
  {
    id: 1,
    reference_number: 'REQ-2026-0001',
    issue_type: 'Pipe Leak',
    urgency: 'high',
    status: 'resolved',
    customer: { name: 'Juan Dela Cruz', barangay: 'Poblacion' },
    assigned_staff: { id: 10, name: 'Pedro Penduko' },
    created_at: new Date().toISOString(),
    assigned_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved_at: new Date().toISOString(),
  },
  {
    id: 2,
    reference_number: 'REQ-2026-0002',
    issue_type: 'Low Pressure',
    urgency: 'medium',
    status: 'in_progress',
    customer: { name: 'Maria Santos', barangay: 'San Vicente' },
    assigned_staff: { id: 10, name: 'Pedro Penduko' },
    created_at: new Date().toISOString(),
    assigned_at: new Date().toISOString(),
  },
  {
    id: 3,
    reference_number: 'REQ-2026-0003',
    issue_type: 'Defective Valve',
    urgency: 'low',
    status: 'cancelled',
    customer: { name: 'Elena Ramos', barangay: 'Poblacion' },
    created_at: new Date().toISOString(),
  },
];

const mockBarangays = [
  { id: 1, name: 'Poblacion' },
  { id: 2, name: 'San Vicente' },
  { id: 3, name: 'Katipunan' },
];

const mockStaff = [
  { id: 10, name: 'Pedro Penduko', role: 'field_staff', email: 'pedro@sinacaban.gov.ph' },
];

const mockAdvisories = [
  {
    id: 1,
    title: 'Emergency Main Pipe Repair',
    type: 'emergency',
    status: 'ongoing',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    barangays: [{ id: 1, name: 'Poblacion' }],
    affected_customers_count: 42,
  },
];

// Mock APIs
vi.mock('../api', () => ({
  requestsApi: {
    list: vi.fn().mockImplementation(() => Promise.resolve({ data: mockRequests })),
  },
  referenceApi: {
    getBarangays: vi.fn().mockImplementation(() => Promise.resolve(mockBarangays)),
  },
  adminApi: {
    staffList: vi.fn().mockImplementation(() => Promise.resolve(mockStaff)),
  },
  interruptionsApi: {
    list: vi.fn().mockImplementation(() => Promise.resolve({ data: mockAdvisories })),
  },
}));

describe('AdminReportsView (Section 10 & Updated Reports Workflow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <BrowserRouter>
          <AdminUIProvider>
            <AdminReportsView />
          </AdminUIProvider>
        </BrowserRouter>
      );
    });
    return result;
  };

  it('renders reports view with all 5 workflow report types and default current month date range', async () => {
    await renderComponent();

    // Check header
    expect(screen.getByText(/Maintenance Reports/i)).toBeInTheDocument();

    // Check report type select options
    const reportSelect = screen.getByLabelText(/Report Type/i) as HTMLSelectElement;
    expect(reportSelect).toBeInTheDocument();
    expect(reportSelect.value).toBe('maintenance_summary');

    // Verify all 5 workflow options exist
    expect(screen.getByText(/Maintenance summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance request log/i)).toBeInTheDocument();
    expect(screen.getByText(/Requests by barangay/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff task report/i)).toBeInTheDocument();
    expect(screen.getByText(/Water advisory report/i)).toBeInTheDocument();

    // Verify default date range is current month in Philippine Time
    const fromInput = screen.getByLabelText(/From/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/To/i) as HTMLInputElement;
    const todayStr = getPhilippineToday();
    const expectedFrom = `${todayStr.slice(0, 7)}-01`;

    expect(fromInput.value).toBe(expectedFrom);
    expect(toInput.value).toBe(todayStr);
    expect(fromInput.max).toBe(todayStr);
    expect(toInput.max).toBe(todayStr);
  });

  it('displays Maintenance summary preview metrics with High Urgency and Avg Resolution time', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/High Urgency/i)).toBeInTheDocument();
      expect(screen.getByText('Avg Resolution Time')).toBeInTheDocument();
    });

    expect(screen.queryByText('Total Advisories')).not.toBeInTheDocument();
  });

  it('enforces date constraints: From cannot be later than To, and dates cannot be in future', async () => {
    await renderComponent();

    const fromInput = screen.getByLabelText(/From/i);
    const toInput = screen.getByLabelText(/To/i);
    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });

    // Set From later than To
    await act(async () => {
      fireEvent.change(fromInput, { target: { value: '2026-10-25' } });
      fireEvent.change(toInput, { target: { value: '2026-10-20' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/The "From" date must not be later than "To" date/i)).toBeInTheDocument();
      expect(generateBtn).toBeDisabled();
      expect(exportBtn).toBeDisabled();
    });

    // Set future date
    await act(async () => {
      fireEvent.change(toInput, { target: { value: '2099-12-31' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Neither date can be set in the future/i)).toBeInTheDocument();
      expect(generateBtn).toBeDisabled();
      expect(exportBtn).toBeDisabled();
    });
  });

  it('shows empty state preview and disables actions when no records match filter', async () => {
    await renderComponent();

    const barangaySelect = screen.getByLabelText(/Barangay/i);
    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });

    // Katipunan has 0 requests in mock data
    await act(async () => {
      fireEvent.change(barangaySelect, { target: { value: 'Katipunan' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No matching records found/i)).toBeInTheDocument();
      expect(generateBtn).toBeDisabled();
      expect(exportBtn).toBeDisabled();
    });
  });

  it('records Activity Log when generating report on screen', async () => {
    const auditSpy = vi.spyOn(advisoriesStore, 'appendAuditLog');
    await renderComponent();

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    expect(generateBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(generateBtn);
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(auditSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generated Maintenance Summary Report on screen'),
      'SIWASS Administrator'
    );
  });

  it('records Activity Log and downloads formatted CSV when clicking Export CSV', async () => {
    const auditSpy = vi.spyOn(advisoriesStore, 'appendAuditLog');
    let downloadedFileName = '';
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
        const origSetAttribute = el.setAttribute.bind(el);
        el.setAttribute = (name: string, value: string) => {
          if (name === 'download') downloadedFileName = value;
          origSetAttribute(name, value);
        };
      }
      return el;
    });

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    await renderComponent();

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(auditSpy).toHaveBeenCalledWith(
      expect.stringContaining('Exported CSV for Maintenance Summary'),
      'SIWASS Administrator'
    );
    expect(downloadedFileName).toMatch(/^aquatrack-maintenance-summary-.*\.csv$/);
  });

  it('renders Type 2: Maintenance Request Log with Customer name and marked Cancelled requests', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'request_log' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(screen.getByText(/Maintenance Request Log Report/i)).toBeInTheDocument();
      // Check customer names are rendered
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
      expect(screen.getByText('Elena Ramos')).toBeInTheDocument();
      // Check cancelled status is rendered and marked
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  it('renders Type 3: Requests by Barangay sorted by highest total first with still open count', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'by_barangay' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(screen.getByText(/Requests by Barangay Report/i)).toBeInTheDocument();
      expect(screen.getByText('Still Open')).toBeInTheDocument();
      expect(screen.getByText('Most Common Issue Type')).toBeInTheDocument();
    });
  });

  it('renders Type 4: Staff Task Report with tasks assigned in period and average resolution time', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'staff_tasks' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(screen.getByText(/Staff Task Report Report/i)).toBeInTheDocument();
      expect(screen.getByText('Tasks Assigned in Period')).toBeInTheDocument();
      expect(screen.getByText('Avg Time (Assigned to Resolved)')).toBeInTheDocument();
      expect(screen.getByText('Pedro Penduko')).toBeInTheDocument();
    });
  });

  it('renders Type 5: Water Advisory Report with affected barangays and customers notified count', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'water_advisories' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(screen.getByText(/Water Advisory Report Report/i)).toBeInTheDocument();
      expect(screen.getByText('Customers Notified')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
