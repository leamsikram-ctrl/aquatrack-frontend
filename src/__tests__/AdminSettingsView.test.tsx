import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminSettingsView } from '../pages/admin/AdminSettingsView';
import { AdminUIProvider } from '../contexts/AdminUIContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'SIWASS Administrator', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

// Mock referenceApi, authApi, and profileApi
vi.mock('../api', () => ({
  referenceApi: {
    getIssueTypes: vi.fn().mockImplementation(() =>
      Promise.resolve([
        { id: 1, name: 'No water supply', default_urgency: 'high' },
        { id: 2, name: 'Pipe leak or burst', default_urgency: 'high' },
        { id: 3, name: 'Water quality problem', default_urgency: 'high' },
        { id: 4, name: 'Low water pressure', default_urgency: 'medium' },
        { id: 5, name: 'Meter problem', default_urgency: 'medium' },
        { id: 6, name: 'Other concern', default_urgency: 'low' },
      ])
    ),
  },
  authApi: {
    me: vi.fn().mockImplementation(() =>
      Promise.resolve({
        id: 1,
        name: 'SIWASS Administrator',
        email: 'admin@sinacaban.gov.ph',
        role: 'admin',
        mobile_number: '09170000001',
      })
    ),
    changePassword: vi.fn().mockImplementation(() => Promise.resolve({ message: 'Password updated' })),
  },
  profileApi: {
    updateProfile: vi.fn(),
    uploadPhoto: vi.fn(),
    removePhoto: vi.fn(),
    requestMobilePin: vi.fn(),
    verifyMobilePin: vi.fn(),
    requestEmailLink: vi.fn(),
    verifyEmailLink: vi.fn(),
  },
}));

describe('AdminSettingsView (Workflow Parameters & System Configuration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <BrowserRouter>
          <AdminUIProvider>
            <AdminSettingsView />
          </AdminUIProvider>
        </BrowserRouter>
      );
    });
    return result;
  };

  it('renders settings view with Utility Profile tab by default', async () => {
    await renderComponent();

    expect(screen.getByText(/System Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Municipal Water System Identity/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Sinacaban Water Supply System/i)).toBeInTheDocument();
  });

  it('switches to Issue Types & Urgency tab and displays Section 5.2 derivation engine', async () => {
    await renderComponent();

    const issueTab = screen.getByRole('button', { name: /Issue Types & Urgency/i });
    await act(async () => {
      fireEvent.click(issueTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Section 5.2 Urgency Derivation Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Configured Issue Types/i)).toBeInTheDocument();
      expect(screen.getAllByText(/No water supply/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pipe leak or burst/i).length).toBeGreaterThan(0);
    });
  });

  it('switches to SMS & Notifications tab and toggles automated dispatch settings', async () => {
    await renderComponent();

    const smsTab = screen.getByRole('button', { name: /SMS & Notifications/i });
    await act(async () => {
      fireEvent.click(smsTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/SMS Gateway & Automatic Dispatch Triggers/i)).toBeInTheDocument();
      expect(screen.getByText(/Customer Account Activation/i)).toBeInTheDocument();
      expect(screen.getByText(/Technician Dispatch & Assignment/i)).toBeInTheDocument();
      expect(screen.getByText(/Water Interruption Advisory Broadcast/i)).toBeInTheDocument();
    });
  });

  it('switches to GIS & Boundaries tab and displays Sinacaban municipal coordinates', async () => {
    await renderComponent();

    const gisTab = screen.getByRole('button', { name: /GIS & Boundaries/i });
    await act(async () => {
      fireEvent.click(gisTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Sinacaban Municipal Geographic Bounds/i)).toBeInTheDocument();
      expect(screen.getByText(/Official 17 Sinacaban Barangays & Coordinates/i)).toBeInTheDocument();
      expect(screen.getByText(/8.2855° N, 123.8429° E/i)).toBeInTheDocument();
    });
  });

  it('switches to Account & Security tab and validates master password fields', async () => {
    await renderComponent();

    const secTab = screen.getByRole('button', { name: /Account & Security/i });
    await act(async () => {
      fireEvent.click(secTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Institutional Security & Access Credentials/i)).toBeInTheDocument();
      expect(screen.getByText(/Master Administrator Email/i)).toBeInTheDocument();
    });
  });

  it('displays read-only issue types and system managed indicator without add controls', async () => {
    await renderComponent();

    const issueTab = screen.getByRole('button', { name: /Issue Types & Urgency/i });
    await act(async () => {
      fireEvent.click(issueTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Configured Issue Types \(Read-only\)/i)).toBeInTheDocument();
      expect(screen.getByText(/System Managed/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add Issue Type/i })).not.toBeInTheDocument();
    });
  });
});
