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

const mockSave = vi.fn();

// Mock jsPDF and jspdf-autotable
vi.mock('jspdf', () => {
  class MockJsPDF {
    internal: any;
    setFillColor = vi.fn();
    rect = vi.fn();
    circle = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    line = vi.fn();
    setPage = vi.fn();
    save = (...args: any[]) => mockSave(...args);

    constructor(options?: any) {
      this.internal = {
        pageSize: {
          getWidth: () => (options?.orientation === 'landscape' ? 297 : 210),
          getHeight: () => (options?.orientation === 'landscape' ? 210 : 297),
        },
        getNumberOfPages: () => 1,
      };
    }
  }

  return { jsPDF: MockJsPDF, default: MockJsPDF };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc: any) => {
    doc.lastAutoTable = { finalY: 60 };
  }),
}));

describe('AdminReportsView (Section 10 & Revised PDF Output Workflow)', () => {
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

    expect(screen.getByText(/Maintenance Reports/i)).toBeInTheDocument();

    const reportSelect = screen.getByLabelText(/Report Type/i) as HTMLSelectElement;
    expect(reportSelect).toBeInTheDocument();
    expect(reportSelect.value).toBe('maintenance_summary');

    expect(screen.getByText(/Maintenance summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance request log/i)).toBeInTheDocument();
    expect(screen.getByText(/Requests by barangay/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff task report/i)).toBeInTheDocument();
    expect(screen.getByText(/Water advisory report/i)).toBeInTheDocument();

    const fromInput = screen.getByLabelText(/From/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/To/i) as HTMLInputElement;
    const todayStr = getPhilippineToday();
    const expectedFrom = `${todayStr.slice(0, 7)}-01`;

    expect(fromInput.value).toBe(expectedFrom);
    expect(toInput.value).toBe(todayStr);
    expect(fromInput.max).toBe(todayStr);
    expect(toInput.max).toBe(todayStr);

    // Rule change verification: printable page and "Print or Save as PDF" button are removed
    expect(screen.queryByRole('button', { name: /Print or Save as PDF/i })).not.toBeInTheDocument();
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

  it('builds PDF and saves to Activity Log with Report ready confirmation', async () => {
    const auditSpy = vi.spyOn(advisoriesStore, 'appendAuditLog');

    await renderComponent();

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    expect(generateBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/^aquatrack-maintenance-summary-.*\.pdf$/));
      expect(auditSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated PDF: Maintenance Summary Report'),
        'SIWASS Administrator'
      );
      expect(screen.getByText(/Report ready/i)).toBeInTheDocument();
    });
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

  it('generates Landscape PDF for Type 2: Maintenance Request Log', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'request_log' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^aquatrack-maintenance-request-log-.*\.pdf$/)
      );
      expect(screen.getByText(/Report ready/i)).toBeInTheDocument();
    });
  });

  it('generates Portrait PDF for Type 3: Requests by Barangay', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'by_barangay' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^aquatrack-requests-by-barangay-.*\.pdf$/)
      );
      expect(screen.getByText(/Report ready/i)).toBeInTheDocument();
    });
  });

  it('generates Landscape PDF for Type 4: Staff Task Report', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'staff_tasks' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^aquatrack-staff-task-report-.*\.pdf$/)
      );
      expect(screen.getByText(/Report ready/i)).toBeInTheDocument();
    });
  });

  it('generates Portrait PDF for Type 5: Water Advisory Report', async () => {
    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'water_advisories' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^aquatrack-water-advisory-report-.*\.pdf$/)
      );
      expect(screen.getByText(/Report ready/i)).toBeInTheDocument();
    });
  });

  it('displays size limit warning and disables Generate report when Request Log exceeds 500 rows', async () => {
    // Generate over 500 mock requests
    const largeMockRequests = Array.from({ length: 505 }, (_, i) => ({
      id: i + 1,
      reference_number: `REQ-2026-${String(i + 1).padStart(4, '0')}`,
      issue_type: 'Pipe Leak',
      urgency: 'low',
      status: 'submitted',
      customer: { name: `Customer ${i + 1}`, barangay: 'Poblacion' },
      created_at: new Date().toISOString(),
    }));

    const { requestsApi } = await import('../api');
    vi.mocked(requestsApi.list).mockResolvedValueOnce({ data: largeMockRequests } as any);

    await renderComponent();

    const reportSelect = screen.getByLabelText(/Report Type/i);
    await act(async () => {
      fireEvent.change(reportSelect, { target: { value: 'request_log' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Request Log PDF Limit Exceeded/i)).toBeInTheDocument();
      expect(screen.getByText(/The request log PDF holds up to 500 rows/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate report/i })).toBeDisabled();
      // Export CSV must remain enabled!
      expect(screen.getByRole('button', { name: /Export CSV/i })).not.toBeDisabled();
    });
  });

  it('displays error message with Try again when PDF building throws an exception', async () => {
    mockSave.mockImplementationOnce(() => {
      throw new Error('Simulated PDF disk failure');
    });

    await renderComponent();

    const generateBtn = screen.getByRole('button', { name: /Generate report/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to build PDF report\. Please try again\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
    });
  });
});
