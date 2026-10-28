import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CustomerProfileView } from '../pages/customer/CustomerProfileView';
import { StaffProfileView } from '../pages/staff/StaffProfileView';
import { AdminSettingsView } from '../pages/admin/AdminSettingsView';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { authApi, profileApi } from '../api';

// Mock Leaflet & LocationPickerMap
vi.mock('../components/organisms/LocationPickerMap', () => ({
  LocationPickerMap: ({ onChange }: any) => (
    <div data-testid="mock-location-picker">
      <button
        type="button"
        onClick={() => onChange?.('8.2860', '123.8435')}
      >
        Move Pin
      </button>
    </div>
  ),
}));

// Mock api
vi.mock('../api', () => ({
  authApi: {
    me: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
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
  referenceApi: {
    getIssueTypes: vi.fn().mockResolvedValue([
      { id: 1, name: 'No water supply', default_urgency: 'high' },
      { id: 2, name: 'Pipe leak or burst', default_urgency: 'high' },
      { id: 3, name: 'Water quality problem', default_urgency: 'high' },
      { id: 4, name: 'Low water pressure', default_urgency: 'medium' },
      { id: 5, name: 'Meter problem', default_urgency: 'medium' },
      { id: 6, name: 'Other concern', default_urgency: 'low' },
    ]),
  },
}));

// Mock AuthContext
let currentMockUser: any = null;
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentMockUser,
    setUser: (u: any) => {
      currentMockUser = u;
    },
    logout: vi.fn(),
  }),
}));

describe('Settings Pages Workflow (docs sections 3.2 to 3.6 and 12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Customer Settings (CustomerProfileView)', () => {
    beforeEach(() => {
      currentMockUser = {
        id: 10,
        name: 'Maria Santos',
        email: 'maria@example.com',
        mobile_number: '09171234567',
        role: 'customer',
        customer_profile: {
          account_number: 'ACC-2026-0001',
          meter: { meter_number: 'MTR-SIN-0001' },
          barangay: { id: 1, name: 'Poblacion' },
          address: 'Purok 1, Poblacion',
          latitude: 8.2985,
          longitude: 123.8340,
        },
      };
      (authApi.me as any).mockResolvedValue(currentMockUser);
    });

    it('renders locked customer fields (name, meter, barangay) with office record note and strictly no deactivate option', async () => {
      render(
        <BrowserRouter>
          <CustomerProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
        expect(screen.getAllByText('MTR-SIN-0001').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Poblacion').length).toBeGreaterThan(0);
      });

      // Locked note
      expect(
        screen.getByText(/Corrections are made through the SIWASS office/i)
      ).toBeInTheDocument();

      // No deactivate / delete option
      expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
      expect(
        screen.getByText(/The customer cannot deactivate or delete the account online/i)
      ).toBeInTheDocument();
    });

    it('allows editing address and moving home location pin on the map', async () => {
      (profileApi.updateProfile as any).mockResolvedValue({
        user: {
          ...currentMockUser,
          customer_profile: {
            ...currentMockUser.customer_profile,
            address: 'Purok 2, Coastal Road',
            latitude: 8.2860,
            longitude: 123.8435,
          },
        },
      });

      render(
        <BrowserRouter>
          <CustomerProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Purok 1, Poblacion')).toBeInTheDocument();
      });

      // Click "Edit address & map"
      const editButton = screen.getByRole('button', { name: /Edit address & map/i });
      fireEvent.click(editButton);

      expect(screen.getByText(/Edit Address & Home Location/i)).toBeInTheDocument();

      // Change address text
      const addressInput = screen.getByPlaceholderText(/Purok 1, National Highway/i);
      fireEvent.change(addressInput, { target: { value: 'Purok 2, Coastal Road' } });

      // Move pin
      const movePinButton = screen.getByText('Move Pin');
      fireEvent.click(movePinButton);

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(profileApi.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            address: 'Purok 2, Coastal Road',
            latitude: 8.286,
            longitude: 123.8435,
          })
        );
      });
    });

    it('retains old mobile number in use until new one is confirmed via OtpInput', async () => {
      (profileApi.requestMobilePin as any).mockResolvedValue({
        message: 'A 6-digit pin was sent by SMS.',
        debug_pin: '849201',
      });
      (profileApi.verifyMobilePin as any).mockResolvedValue({
        user: {
          ...currentMockUser,
          mobile_number: '09179998877',
        },
      });

      render(
        <BrowserRouter>
          <CustomerProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('09171234567')).toBeInTheDocument();
      });

      // Click "Change mobile number"
      const changeMobileBtn = screen.getByRole('button', { name: /Change mobile number/i });
      fireEvent.click(changeMobileBtn);

      // Enter new mobile number
      const mobileInput = screen.getByPlaceholderText('09171234567');
      fireEvent.change(mobileInput, { target: { value: '09179998877' } });

      // Request 6-digit PIN
      const sendPinBtn = screen.getByRole('button', { name: /Send 6-Digit Pin/i });
      fireEvent.click(sendPinBtn);

      await waitFor(() => {
        expect(profileApi.requestMobilePin).toHaveBeenCalledWith({ mobile_number: '09179998877' });
        expect(screen.getByText(/Enter 6-Digit SMS PIN/i)).toBeInTheDocument();
      });

      // Old mobile number remains displayed in background view until confirmed
      expect(screen.getByText('09171234567')).toBeInTheDocument();

      // Submit confirmation
      const confirmBtn = screen.getByRole('button', { name: /Confirm Pin/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(profileApi.verifyMobilePin).toHaveBeenCalledWith({ pin: '849201' });
      });
    });

    it('opens Terms of Use and Privacy Notice modal displaying accepted version', async () => {
      render(
        <BrowserRouter>
          <CustomerProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Version 1.0 \(Accepted\)/i)).toBeInTheDocument();
      });

      // Click View
      const viewBtn = screen.getByRole('button', { name: /^View$/i });
      fireEvent.click(viewBtn);

      await waitFor(() => {
        expect(screen.getByText(/AquaTrack Legal Documents/i)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to AquaTrack/i)).toBeInTheDocument();
      });
    });
  });

  describe('Staff Settings (StaffProfileView)', () => {
    beforeEach(() => {
      currentMockUser = {
        id: 20,
        name: 'Pedro Cruz',
        email: 'staff@siwass.gov',
        mobile_number: '09175550101',
        role: 'staff',
        staff_profile: {
          name: 'Pedro Cruz',
          assigned_barangay: { id: 1, name: 'Poblacion' },
        },
      };
      (authApi.me as any).mockResolvedValue(currentMockUser);
    });

    it('renders read-only assigned barangays and download mobile app card with no sync controls', async () => {
      render(
        <BrowserRouter>
          <StaffProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Pedro Cruz/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Sinacaban - Poblacion/i).length).toBeGreaterThan(0);
      });

      // Locked note
      expect(
        screen.getByText(/Full name, role, and assigned barangays are set by the SIWASS administrator/i)
      ).toBeInTheDocument();

      // Download mobile app card
      expect(screen.getByText(/Download Mobile App/i)).toBeInTheDocument();
      expect(screen.getByText(/Download APK/i)).toBeInTheDocument();

      // No sync controls on this settings card
      expect(screen.queryByText(/Sync Now/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Offline Queue/i)).not.toBeInTheDocument();
    });

    it('changing password notifies that other active sessions have been signed out', async () => {
      (authApi.changePassword as any).mockResolvedValue({
        message: 'Password changed successfully.',
        user: currentMockUser,
      });

      const { container } = render(
        <BrowserRouter>
          <StaffProfileView />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Change password$/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^Change password$/i }));

      // Fill in password inputs
      const passwordInputs = container.querySelectorAll<HTMLInputElement>('input[type="password"]');

      fireEvent.change(passwordInputs[0], { target: { value: 'CurrentPass123!' } });
      fireEvent.change(passwordInputs[1], { target: { value: 'NewPass123!@' } });
      fireEvent.change(passwordInputs[2], { target: { value: 'NewPass123!@' } });

      const updateBtn = screen.getByRole('button', { name: /Update Password/i });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(authApi.changePassword).toHaveBeenCalledWith({
          current_password: 'CurrentPass123!',
          password: 'NewPass123!@',
          password_confirmation: 'NewPass123!@',
        });
        expect(
          screen.getByText(/Your other active sessions have been signed out/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Admin Settings (AdminSettingsView)', () => {
    beforeEach(() => {
      currentMockUser = {
        id: 1,
        name: 'SIWASS Administrator',
        email: 'admin@sinacaban.gov.ph',
        mobile_number: '09170000001',
        role: 'admin',
      };
      (authApi.me as any).mockResolvedValue(currentMockUser);
    });

    it('allows administrator to edit display name', async () => {
      (profileApi.updateProfile as any).mockResolvedValue({
        user: {
          ...currentMockUser,
          name: 'Lead Admin Sinacaban',
        },
      });

      render(
        <BrowserRouter>
          <AdminUIProvider>
            <AdminSettingsView />
          </AdminUIProvider>
        </BrowserRouter>
      );

      // Switch to Account & Security tab
      const secTab = screen.getByRole('button', { name: /Account & Security/i });
      fireEvent.click(secTab);

      await waitFor(() => {
        expect(screen.getByDisplayValue('SIWASS Administrator')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('SIWASS Administrator');
      fireEvent.change(nameInput, { target: { value: 'Lead Admin Sinacaban' } });

      const saveNameBtn = screen.getByRole('button', { name: /Save Name/i });
      fireEvent.click(saveNameBtn);

      await waitFor(() => {
        expect(profileApi.updateProfile).toHaveBeenCalledWith({ name: 'Lead Admin Sinacaban' });
      });
    });

    it('displays read-only system specifications including all 7 premade advisory types and low SMS credit warning with zero SLA settings', async () => {
      render(
        <BrowserRouter>
          <AdminUIProvider>
            <AdminSettingsView />
          </AdminUIProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/System Information \(Read-only\)/i)).toBeInTheDocument();
      });

      // Verify all 7 premade advisory types from Section 7.5 are displayed
      expect(screen.getByText('Emergency Repair')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Low Pressure')).toBeInTheDocument();
      expect(screen.getByText('Water Quality Advisory')).toBeInTheDocument();
      expect(screen.getByText('Pipeline Flushing')).toBeInTheDocument();
      expect(screen.getByText('Power Interruption')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();

      // Low SMS credits warning
      expect(screen.getByText(/85 Credits \(Low warning: < 100 credits\)/i)).toBeInTheDocument();

      // No SLA settings
      expect(screen.getByText(/There are no SLA settings and no editable thresholds/i)).toBeInTheDocument();
      expect(screen.queryByText(/SLA Rules/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Response Hours/i)).not.toBeInTheDocument();
    });
  });
});
