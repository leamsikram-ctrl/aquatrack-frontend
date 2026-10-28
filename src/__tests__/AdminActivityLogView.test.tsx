import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminActivityLogView } from '../pages/admin/AdminActivityLogView';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { adminApi } from '../api';

// Configurable Mock AuthContext
let mockCurrentUser = {
  name: 'SIWASS Administrator',
  email: 'admin@sinacaban.gov.ph',
  role: 'admin',
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    setUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock adminApi
vi.mock('../api', () => ({
  adminApi: {
    activityLogs: vi.fn(),
    logActivityExport: vi.fn().mockResolvedValue({ message: 'Logged' }),
  },
}));

describe('AdminActivityLogView (Section 13 Audit Trail)', () => {
  const sampleLogs = [
    {
      id: 101,
      user_id: 1,
      user_name: 'SIWASS Administrator',
      user_role: 'admin',
      category: 'Requests',
      action: 'Assigned request REQ-2026-0001 to Technician Pedro Cruz',
      target: 'REQ-2026-0001',
      detail: 'Poblacion mainline repair dispatch',
      subject_type: 'App\\Models\\ServiceRequest',
      subject_id: 1,
      old_values: null,
      new_values: { assigned_to: 'Pedro Cruz' },
      ip_address: '192.168.1.15',
      created_at: '2026-10-25T08:30:00Z',
      user: { id: 1, name: 'SIWASS Administrator', role: 'admin' },
    },
    {
      id: 102,
      user_id: 2,
      user_name: 'Maria Santos',
      user_role: 'customer',
      category: 'Billing',
      action: 'Payment recorded for Billing Period October 2026',
      target: 'ACC-2026-0001',
      detail: 'Payment of 500 pesos applied',
      subject_type: 'App\\Models\\Billing',
      subject_id: 42,
      old_values: { total_balance: 500 },
      new_values: { total_balance: 0 },
      ip_address: '192.168.1.20',
      created_at: '2026-10-24T10:00:00Z',
      user: { id: 2, name: 'Maria Santos', role: 'customer' },
    },
    {
      id: 103,
      user_id: 3,
      user_name: 'Pedro Cruz',
      user_role: 'staff',
      category: 'Requests',
      action: 'Resolved request REQ-2026-0002 gate valve repair',
      target: 'REQ-2026-0002',
      detail: 'Replaced brass gate valve',
      subject_type: 'App\\Models\\ServiceRequest',
      subject_id: 2,
      old_values: null,
      new_values: { status: 'resolved' },
      ip_address: '172.16.0.42',
      created_at: '2026-10-23T14:00:00Z',
      user: { id: 3, name: 'Pedro Cruz', role: 'staff' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      name: 'SIWASS Administrator',
      email: 'admin@sinacaban.gov.ph',
      role: 'admin',
    };
    vi.mocked(adminApi.activityLogs).mockResolvedValue({
      data: sampleLogs,
      pagination: { current_page: 1, per_page: 50, total: sampleLogs.length, last_page: 1 },
    } as any);
  });

  const renderComponent = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <BrowserRouter>
          <AdminUIProvider>
            <AdminActivityLogView />
          </AdminUIProvider>
        </BrowserRouter>
      );
    });
    return result;
  };

  it('denies access to customers and staff', async () => {
    // 1. Customer user
    mockCurrentUser = {
      name: 'Maria Customer',
      email: 'customer@example.com',
      role: 'customer',
    };
    const { unmount } = await renderComponent();
    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/Only administrators can view the audit trail/i)).toBeInTheDocument();
    unmount();

    // 2. Staff user
    mockCurrentUser = {
      name: 'Pedro Staff',
      email: 'staff@example.com',
      role: 'staff',
    };
    await renderComponent();
    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
  });

  it('renders Activity Log header, metric compartments, and audit records with category badges for admin', async () => {
    await renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /Activity Log/i })).toBeInTheDocument();
    expect(screen.getAllByText('Total Events').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Requests & Dispatch').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing & Notices').length).toBeGreaterThan(0);

    // Verify category badges rendered
    expect(screen.getAllByText('Requests').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing').length).toBeGreaterThan(0);
  });

  it('filters audit records by category dropdown', async () => {
    await renderComponent();

    const categorySelect = screen.getByLabelText(/filter by category/i);
    expect(categorySelect).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'Billing' } });
    });

    await waitFor(() => {
      // Billing record should remain
      expect(screen.getByText(/ACC-2026-0001/i)).toBeInTheDocument();
      // Requests records should be filtered out
      expect(screen.queryByText('REQ-2026-0001')).toBeNull();
      expect(screen.queryByText('REQ-2026-0002')).toBeNull();
    });
  });

  it('filters audit records by role dropdown', async () => {
    await renderComponent();

    const roleSelect = screen.getByLabelText(/filter by role/i);
    expect(roleSelect).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(roleSelect, { target: { value: 'staff' } });
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Pedro Cruz/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Maria Santos/i)).toBeNull();
    });
  });

  it('filters audit records by text search on target', async () => {
    await renderComponent();

    const searchInput = screen.getByPlaceholderText(/search target reference/i);
    expect(searchInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'REQ-2026-0002' } });
    });

    await waitFor(() => {
      expect(screen.getAllByText(/REQ-2026-0002/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/REQ-2026-0001/)).toBeNull();
      expect(screen.queryByText(/ACC-2026-0001/)).toBeNull();
    });
  });

  it('opens drawer with all fields and a link to the related item when clicking a row', async () => {
    await renderComponent();

    // Click on the first row's View button
    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Event Inspection')).toBeInTheDocument();
      expect(screen.getByText('Actor')).toBeInTheDocument();
      expect(screen.getAllByText(/IP Address/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Target Reference')).toBeInTheDocument();
      expect(screen.getByText('Event Action')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Related Item/i })).toBeInTheDocument();
    });
  });

  it('exports CSV of filtered entries and logs the export', async () => {
    let capturedCsv = '';
    const origCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = vi.fn();
      }
      return el;
    });

    const createObjectURLSpy = vi.fn().mockImplementation((blob: Blob) => {
      blob.text().then((text) => {
        capturedCsv = text;
      });
      return 'blob:mock-audit-csv-url';
    });
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    try {
      await renderComponent();

      // Apply category filter to Billing only
      const categorySelect = screen.getByLabelText(/filter by category/i);
      await act(async () => {
        fireEvent.change(categorySelect, { target: { value: 'Billing' } });
      });

      // Click Export CSV
      const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
      await act(async () => {
        fireEvent.click(exportBtn);
      });

      expect(createObjectURLSpy).toHaveBeenCalled();

      // Verify backend audit log API was called to record the export
      await waitFor(() => {
        expect(adminApi.logActivityExport).toHaveBeenCalledWith(
          expect.objectContaining({
            count: 1, // Only 1 Billing record was filtered
            filters: expect.objectContaining({
              category: 'Billing',
            }),
          })
        );
      });

      // Verify CSV content contains filtered billing target and does NOT contain other targets
      expect(capturedCsv).toContain('ACC-2026-0001');
      expect(capturedCsv).not.toContain('REQ-2026-0001');
    } finally {
      createSpy.mockRestore();
    }
  });

  it('displays empty state with Clear filters when nothing matches', async () => {
    await renderComponent();

    const searchInput = screen.getByPlaceholderText(/search target reference/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_TARGET_XYZ_999' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No matches found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear filters/i })).toBeInTheDocument();
    });

    // Clicking Clear filters resets
    const clearBtn = screen.getByRole('button', { name: /Clear filters/i });
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText(/No matches found/i)).toBeNull();
      expect(screen.getAllByText(/REQ-2026-0001/).length).toBeGreaterThan(0);
    });
  });
});
