import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerRegistrationView } from '../pages/customer/CustomerRegistrationView';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../api';

vi.mock('../components/organisms/LocationPickerMap', () => ({
  LocationPickerMap: () => <div data-testid="mock-location-picker">Location Picker Map</div>,
}));

describe('CustomerRegistrationView', () => {
  it('renders Step 1 with Account Number and Meter Number inputs', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Water Utility Account Registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Assigned Meter Number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Office Record/i })).toBeInTheDocument();
  });

  it('displays matched office customer details after successful lookup', async () => {
    vi.spyOn(authApi, 'lookupAccount').mockResolvedValueOnce({
      message: 'Account verified',
      account: {
        account_number: 'ACC-2026-0002',
        meter_number: 'MTR-SIN-0002',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        full_name: 'Juan Dela Cruz',
        barangay_id: 2,
        barangay_name: 'San Isidro',
        address: 'Sitio Riverside, Purok 4',
        latitude: 8.285,
        longitude: 123.8315,
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const verifyBtn = screen.getByRole('button', { name: /Verify Office Record/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('RECORD MATCHED')).toBeInTheDocument();
      expect(screen.getAllByText('Juan Dela Cruz').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('San Isidro').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Create Password/i)).toBeInTheDocument();
  });

  it('opens and closes the sample receipt diagram pop-up modal', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const openModalBtn = screen.getByRole('button', { name: /View Sample Receipt Diagram/i });
    fireEvent.click(openModalBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sample Water Receipt Diagram')).toBeInTheDocument();
    expect(screen.getByText('Official Statement of Account / Official Water Receipt')).toBeInTheDocument();

    const closeModalBtn = screen.getByRole('button', { name: /Close Diagram/i });
    fireEvent.click(closeModalBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('proceeds to Step 2 and opens the larger map pop-up modal', async () => {
    vi.spyOn(authApi, 'lookupAccount').mockResolvedValueOnce({
      message: 'Account verified',
      account: {
        account_number: 'ACC-2026-0002',
        meter_number: 'MTR-SIN-0002',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        full_name: 'Juan Dela Cruz',
        barangay_id: 2,
        barangay_name: 'San Isidro',
        address: 'Sitio Riverside, Purok 4',
        latitude: 8.285,
        longitude: 123.8315,
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const verifyBtn = screen.getByRole('button', { name: /Verify Office Record/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('RECORD MATCHED')).toBeInTheDocument();
    });

    // Fill in password
    fireEvent.change(screen.getByLabelText(/^Create Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'password123' } });

    // Click Continue to Step 2
    const continueBtn = screen.getByRole('button', { name: /Continue to Step 2/i });
    fireEvent.click(continueBtn);

    // Now in Step 2: verify Pin Service Location
    await waitFor(() => {
      expect(screen.getByText('Pin Service Location')).toBeInTheDocument();
    });

    // Open map modal via icon-only pin button
    const pinBtn = screen.getByRole('button', { name: /Pin location on map/i });
    fireEvent.click(pinBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mock-location-picker')).toBeInTheDocument();

    // Verify Confirm button is present and functional
    const confirmBtn = screen.getByRole('button', { name: /^Confirm$/i });
    expect(confirmBtn).toBeInTheDocument();

    const closeMapBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeMapBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Re-open map modal and click Confirm
    fireEvent.click(pinBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens and closes terms and privacy policy modals', async () => {
    vi.spyOn(authApi, 'lookupAccount').mockResolvedValueOnce({
      message: 'Account verified',
      account: {
        account_number: 'ACC-2026-0002',
        meter_number: 'MTR-SIN-0002',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        full_name: 'Juan Dela Cruz',
        barangay_id: 2,
        barangay_name: 'San Isidro',
        address: 'Sitio Riverside, Purok 4',
        latitude: 8.285,
        longitude: 123.8315,
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const verifyBtn = screen.getByRole('button', { name: /Verify Office Record/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('RECORD MATCHED')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^Create Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Step 2/i }));

    await waitFor(() => {
      expect(screen.getByText('Pin Service Location')).toBeInTheDocument();
    });

    // Terms checkbox cannot be checked before reading
    const termsCheckbox = screen.getByLabelText(/I accept the Terms of Use/i);
    expect(termsCheckbox).toBeDisabled();

    // Click Terms of Use modal trigger
    const termsLink = screen.getByRole('button', { name: /Terms of Use \(v1\.0\)/i });
    fireEvent.click(termsLink);
    expect(screen.getByText(/Sinacaban Water Supply System \(SIWASS\) Utility Terms of Service/i)).toBeInTheDocument();

    const closeTermsBtn = screen.getByRole('button', { name: /I Understand & Close/i });
    fireEvent.click(closeTermsBtn);
    expect(screen.queryByText(/Sinacaban Water Supply System \(SIWASS\) Utility Terms of Service/i)).not.toBeInTheDocument();
    expect(termsCheckbox).toBeEnabled();
    expect(termsCheckbox).toBeChecked();

    // Privacy Notice checkbox cannot be checked before reading
    const privacyCheckbox = screen.getByLabelText(/I accept the Privacy Notice/i);
    expect(privacyCheckbox).toBeDisabled();

    // Click Privacy Notice modal trigger
    const privacyLink = screen.getByRole('button', { name: /Privacy Notice \(v1\.0\)/i });
    fireEvent.click(privacyLink);
    expect(screen.getByText(/Sinacaban Water Supply System \(SIWASS\) Privacy Notice/i)).toBeInTheDocument();

    const closePrivacyBtn = screen.getByRole('button', { name: /I Understand & Close/i });
    fireEvent.click(closePrivacyBtn);
    expect(screen.queryByText(/Sinacaban Water Supply System \(SIWASS\) Privacy Notice/i)).not.toBeInTheDocument();
    expect(privacyCheckbox).toBeEnabled();
    expect(privacyCheckbox).toBeChecked();
  });

  it('switches to Elena Ramos demo sample when clicked', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const elenaBtn = screen.getByRole('button', { name: /Elena Ramos/i });
    fireEvent.click(elenaBtn);

    expect(screen.getByDisplayValue('ACC-2026-0003')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MTR-SIN-0003')).toBeInTheDocument();
  });
});
