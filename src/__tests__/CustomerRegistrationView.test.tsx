import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerRegistrationView } from '../pages/customer/CustomerRegistrationView';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../components/organisms/LocationPickerMap', () => ({
  LocationPickerMap: () => <div data-testid="mock-location-picker">Location Picker Map</div>,
}));

vi.mock('../api', () => ({
  authApi: {
    register: vi.fn().mockResolvedValue({
      message: 'Registration submitted successfully. AquaTrack administration will verify your details.',
      status: 'pending',
      user: { id: 999, name: 'Elena Ramos', role: 'customer', status: 'pending' },
    }),
  },
  referenceApi: {
    getBarangays: vi.fn().mockResolvedValue([
      { id: 10, name: 'Poblacion' },
      { id: 11, name: 'San Isidro Alto' },
      { id: 6, name: 'Libertad Bajo' },
    ]),
  },
}));

describe('CustomerRegistrationView (Section 2.1 Single-Page Registration)', () => {
  it('renders single-page registration form with all Section 2.1 required fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Water Utility Account Registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meter Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Barangay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address \(Purok or Street\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Create Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Registration/i })).toBeInTheDocument();
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

    expect(screen.getByDisplayValue('Elena Ramos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MTR-SIN-0004')).toBeInTheDocument();
    expect(screen.getByDisplayValue('elena.ramos@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09178889900')).toBeInTheDocument();
  });

  it('opens and closes terms and privacy policy modals', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const termsBtn = screen.getByRole('button', { name: /Terms of Use \(v1\.0\)/i });
    fireEvent.click(termsBtn);

    expect(screen.getByText(/Sinacaban Water Supply System \(SIWASS\) Utility Terms of Service/i)).toBeInTheDocument();
    const closeTermsBtn = screen.getByRole('button', { name: /I Understand & Close/i });
    fireEvent.click(closeTermsBtn);
    expect(screen.queryByText(/Sinacaban Water Supply System \(SIWASS\) Utility Terms of Service/i)).not.toBeInTheDocument();

    const privacyBtn = screen.getByRole('button', { name: /Privacy Notice \(v1\.0\)/i });
    fireEvent.click(privacyBtn);

    expect(screen.getByText(/Sinacaban Water Supply System \(SIWASS\) Privacy Notice/i)).toBeInTheDocument();
    const closePrivacyBtn = screen.getByRole('button', { name: /I Understand & Close/i });
    fireEvent.click(closePrivacyBtn);
    expect(screen.queryByText(/Sinacaban Water Supply System \(SIWASS\) Privacy Notice/i)).not.toBeInTheDocument();
  });

  it('opens the map picker modal for home location selection', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    const pinBtn = screen.getByRole('button', { name: /Pin location on map/i });
    fireEvent.click(pinBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-location-picker').length).toBe(2);

    const confirmBtn = screen.getByRole('button', { name: /^Confirm$/i });
    fireEvent.click(confirmBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits registration and shows Section 2.1 Pending confirmation message', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CustomerRegistrationView />
        </AuthProvider>
      </BrowserRouter>
    );

    // Quick fill sample
    fireEvent.click(screen.getByRole('button', { name: /Elena Ramos/i }));

    // Set passwords
    fireEvent.change(screen.getByLabelText(/Create Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

    // Accept terms & privacy checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Registration/i });
    fireEvent.click(submitBtn);

    // Section 2.1 Pending confirmation view
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Waiting for Verification/i })).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText(/Return to Sign In/i)).toBeInTheDocument();
    });
  });
});
