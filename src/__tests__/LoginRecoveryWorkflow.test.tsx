import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginView } from '../pages/auth/LoginView';
import { AuthProvider } from '../contexts/AuthContext';
import { authApi } from '../api';

vi.mock('../api', async () => {
  const actual = await vi.importActual<any>('../api');
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      requestPasswordReset: vi.fn(),
      completePasswordReset: vi.fn(),
      changePassword: vi.fn(),
      acceptTerms: vi.fn(),
      me: vi.fn(),
      logout: vi.fn(),
    },
  };
});

describe('Login and Recovery Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders status-specific guidance for Pending, Declined, and Inactive accounts on login', async () => {
    // 1. Pending account error
    (authApi.login as any).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message:
            'Your account is waiting for verification. AquaTrack administration will verify your details before access is granted.',
        },
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginInput = screen.getByLabelText(/email or mobile number/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(loginInput, { target: { value: 'clara@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/your account is waiting for verification/i)
      ).toBeInTheDocument();
    });

    // 2. Declined account error
    (authApi.login as any).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message:
            'Your registration was declined. Please contact or visit the Sinacaban Water District office for assistance.',
        },
      },
    });

    fireEvent.change(loginInput, { target: { value: 'carlos.mendoza@example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/your registration was declined/i)
      ).toBeInTheDocument();
    });

    // 3. Inactive account error
    (authApi.login as any).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message:
            'Your account has been deactivated. Please contact or visit the Sinacaban Water District office for assistance.',
        },
      },
    });

    fireEvent.change(loginInput, { target: { value: 'rosa.v@example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/your account has been deactivated/i)
      ).toBeInTheDocument();
    });
  });

  it('resets password via SMS PIN and OtpInput without clearing pin on error', async () => {
    (authApi.requestPasswordReset as any).mockResolvedValue({
      message: 'If the account is registered, instructions have been sent.',
      debug_token_or_pin: '837261',
    });

    // First attempt fails with invalid pin error
    (authApi.completePasswordReset as any).mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Incorrect PIN. You have 4 attempt(s) remaining.',
        },
      },
    });

    // Second attempt succeeds
    (authApi.completePasswordReset as any).mockResolvedValueOnce({
      message:
        'Your password has been reset successfully. Please log in with your new password.',
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open forgot password
    fireEvent.click(screen.getByText(/forgot password\?/i));

    // Fill identifier and select SMS method (default)
    fireEvent.change(
      screen.getByLabelText(/registered email or mobile number/i),
      { target: { value: '09171234567' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /send reset instructions/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/if the account is registered, instructions have been sent/i)
      ).toBeInTheDocument();
    });

    // OtpInput boxes should be visible
    expect(screen.getByTestId('otp-box-0')).toBeInTheDocument();

    // Enter wrong PIN via input
    const otpNativeInput = screen.getByLabelText('6-digit verification code');
    fireEvent.change(otpNativeInput, { target: { value: '000000' } });

    // Enter new password
    const newPassInput = screen.getByPlaceholderText('Minimum 8 characters');
    const confirmPassInput = screen.getByPlaceholderText('Re-enter new password');
    fireEvent.change(newPassInput, { target: { value: 'NewSecretPass123!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewSecretPass123!' } });

    // Click submit
    fireEvent.click(
      screen.getByRole('button', { name: /save password & sign in/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/incorrect pin\. you have 4 attempt\(s\) remaining\./i)
      ).toBeInTheDocument();
    });

    // Crucial check: OTP value is NOT cleared after error
    expect(screen.getByTestId('otp-box-0')).toHaveTextContent('0');

    // Change to correct PIN
    fireEvent.change(otpNativeInput, { target: { value: '837261' } });
    fireEvent.click(
      screen.getByRole('button', { name: /save password & sign in/i })
    );

    await waitFor(() => {
      expect(authApi.completePasswordReset).toHaveBeenCalledTimes(2);
    });

    expect(authApi.completePasswordReset).toHaveBeenLastCalledWith({
      identifier: '09171234567',
      method: 'sms',
      token_or_pin: '837261',
      password: 'NewSecretPass123!',
      password_confirmation: 'NewSecretPass123!',
    });
  });

  it('resets password via Email Link', async () => {
    (authApi.requestPasswordReset as any).mockResolvedValue({
      message: 'If the account is registered, instructions have been sent.',
      debug_token_or_pin: 'email_reset_token_abc123',
    });

    (authApi.completePasswordReset as any).mockResolvedValue({
      message:
        'Your password has been reset successfully. Please log in with your new password.',
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/forgot password\?/i));

    fireEvent.change(
      screen.getByLabelText(/registered email or mobile number/i),
      { target: { value: 'user@example.com' } }
    );

    // Select email method
    fireEvent.click(screen.getByRole('button', { name: /reset link by email/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /send reset instructions/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/if the account is registered, instructions have been sent/i)
      ).toBeInTheDocument();
    });

    // Simulate clicking open single-use reset link
    const openLinkBtn = screen.getByRole('button', {
      name: /open single-use reset link/i,
    });
    fireEvent.click(openLinkBtn);

    // Enter passwords
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), {
      target: { value: 'EmailResetPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'EmailResetPass123!' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /save password & sign in/i })
    );

    await waitFor(() => {
      expect(authApi.completePasswordReset).toHaveBeenCalledWith({
        identifier: 'user@example.com',
        method: 'email',
        token_or_pin: 'email_reset_token_abc123',
        password: 'EmailResetPass123!',
        password_confirmation: 'EmailResetPass123!',
      });
    });
  });

  it('fails when using a used pin or link', async () => {
    (authApi.requestPasswordReset as any).mockResolvedValue({
      message: 'If the account is registered, instructions have been sent.',
      debug_token_or_pin: '654321',
    });

    (authApi.completePasswordReset as any).mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message:
            'The 6-digit SMS PIN has expired or was not requested. Please request a new one.',
        },
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/forgot password\?/i));
    fireEvent.change(
      screen.getByLabelText(/registered email or mobile number/i),
      { target: { value: '09171234567' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /send reset instructions/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId('otp-box-0')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /save password & sign in/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /the 6-digit sms pin has expired or was not requested/i
        )
      ).toBeInTheDocument();
    });
  });

  it('refuses the fourth request within an hour with 429 rate limit error', async () => {
    (authApi.requestPasswordReset as any).mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          message:
            'Too many password reset requests. Please wait an hour before requesting again.',
        },
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(/forgot password\?/i));
    fireEvent.change(
      screen.getByLabelText(/registered email or mobile number/i),
      { target: { value: 'spammer@example.com' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /send reset instructions/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/too many password reset requests\. please wait an hour/i)
      ).toBeInTheDocument();
    });
  });

  it('requires first-login terms acceptance and calls authApi.acceptTerms for admin/staff', async () => {
    const mockAdminUser = {
      id: 1,
      role: 'admin' as const,
      status: 'active' as const,
      name: 'System Admin',
      email: 'admin@siwass.gov',
      terms_accepted: false,
      must_change_password: false,
    };

    (authApi.login as any).mockResolvedValue({
      token: 'admin-token',
      user: mockAdminUser,
    });

    (authApi.acceptTerms as any).mockResolvedValue({
      message: 'Terms of Use accepted successfully.',
      user: { ...mockAdminUser, terms_accepted: true },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email or mobile number/i), {
      target: { value: 'admin@siwass.gov' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/terms of use \(first login acceptance\)/i)).toBeInTheDocument();
    });

    // Check terms checkbox
    const checkbox = screen.getByLabelText(/i accept the aquatrack terms of use/i);
    fireEvent.click(checkbox);

    // Save and continue
    fireEvent.click(screen.getByRole('button', { name: /save & continue to dashboard/i }));

    await waitFor(() => {
      expect(authApi.acceptTerms).toHaveBeenCalledWith({
        terms_version: '1.0.0',
        privacy_version: '1.0.0',
      });
    });
  });
});
