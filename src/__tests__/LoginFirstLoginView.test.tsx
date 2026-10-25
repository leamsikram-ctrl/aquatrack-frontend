import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginView } from '../pages/auth/LoginView';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../api';
import { accountsStore } from '../services/accountsStore';

vi.mock('../api', async () => {
  const actual = await vi.importActual<any>('../api');
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      changePassword: vi.fn(),
      me: vi.fn(),
      logout: vi.fn(),
    },
  };
});

describe('LoginView - Staff First-Login Password Change', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('allows staff to log in with temporary password, change to a new permanent password without "account not found", and proceed', async () => {
    const mockStaffUser = {
      id: 99,
      role: 'staff' as const,
      status: 'active' as const,
      name: 'Ramon Field',
      email: 'ramon.field@sinacaban.gov.ph',
      mobile_number: '09179998888',
      must_change_password: true,
      terms_accepted: true,
    };

    (authApi.login as any).mockResolvedValue({
      token: 'mock-token-99',
      user: mockStaffUser,
    });

    (authApi.changePassword as any).mockResolvedValue({
      message: 'Password updated successfully.',
      user: {
        ...mockStaffUser,
        must_change_password: false,
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    // 1. Enter staff credentials
    const loginInput = screen.getByLabelText(/email or mobile number/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(loginInput, { target: { value: '09179998888' } });
    fireEvent.change(passwordInput, { target: { value: 'StaffTemp123!' } });

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // 2. Expect First-Login setup modal to appear
    await waitFor(() => {
      expect(screen.getByText(/account security setup/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/you signed in with a temporary password/i)).toBeInTheDocument();

    // 3. Enter new permanent password
    const newPassInput = screen.getByPlaceholderText(/minimum 8 characters/i);
    const confirmPassInput = screen.getByPlaceholderText(/re-enter new password/i);

    fireEvent.change(newPassInput, { target: { value: 'PermanentPass2026!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'PermanentPass2026!' } });

    const completeBtn = screen.getByRole('button', { name: /save & continue to dashboard/i });
    fireEvent.click(completeBtn);

    // 4. Verify authApi.changePassword was called with current password and new password
    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        current_password: 'StaffTemp123!',
        password: 'PermanentPass2026!',
        password_confirmation: 'PermanentPass2026!',
      });
    });

    // 5. Ensure "account not found" was NEVER shown
    expect(screen.queryByText(/account not found/i)).not.toBeInTheDocument();

    // 6. Verify user in accountsStore now exists and must_change_password is false
    const syncedUser = accountsStore.getUserById(99);
    expect(syncedUser).not.toBeNull();
    expect(syncedUser?.must_change_password).toBe(false);
  });
});
