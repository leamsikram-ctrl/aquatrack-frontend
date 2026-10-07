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
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
      expect(screen.getByText('San Isidro')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Create Password/i)).toBeInTheDocument();
  });
});
