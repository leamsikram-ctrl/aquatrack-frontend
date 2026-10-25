import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminActivityLogView } from '../pages/admin/AdminActivityLogView';
import { AdminUIProvider } from '../contexts/AdminUIContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'SIWASS Administrator', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

// Mock adminApi
vi.mock('../api', () => ({
  adminApi: {
    activityLogs: vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            id: 101,
            user_id: 1,
            action: 'assigned_service_request',
            subject_type: 'App\\Models\\ServiceRequest',
            subject_id: 1,
            old_values: null,
            new_values: { assigned_to: 'Pedro Cruz' },
            ip_address: '192.168.1.15',
            created_at: '2026-10-25T08:30:00Z',
            user: { id: 1, name: 'SIWASS Administrator', role: 'admin' },
          },
        ],
        pagination: { current_page: 1, per_page: 50, total: 1, last_page: 1 },
      })
    ),
  },
}));

describe('AdminActivityLogView (Audit Trail & Workflow Operations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders Activity Log header, metric compartments, and audit records', async () => {
    await renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /Activity Log/i })).toBeInTheDocument();
    expect(screen.getAllByText('Total Events').length).toBeGreaterThan(0);
    expect(screen.getByText('Repairs & Dispatch')).toBeInTheDocument();
  });

  it('filters audit records by search query', async () => {
    await renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search user, action/i);
    expect(searchInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Pedro Cruz' } });
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Pedro Cruz/i).length).toBeGreaterThan(0);
    });
  });

  it('opens Activity Detail Modal when clicking on View button', async () => {
    await renderComponent();

    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Audit Event Inspection/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified Network Session/i)).toBeInTheDocument();
    });
  });

  it('triggers Export CSV without error', async () => {
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-audit-url');
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    await renderComponent();

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
  });
});

