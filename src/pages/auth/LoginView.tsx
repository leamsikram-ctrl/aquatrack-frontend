import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import { IconAlertCircle, IconLock, IconMail, IconArrowLeft, IconPhone, IconCheck, IconKey } from '@tabler/icons-react';

export function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wireframe C5 Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotMobile.trim()) return;

    setIsSendingCode(true);
    setForgotError(null);

    // Simulate SMS gateway sending reset code
    setTimeout(() => {
      setIsSendingCode(false);
      setResetSent(true);
      setResetCode('123456'); // Simulated verification code for demo
    }, 600);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotSuccess('Your password has been reset successfully! You can now sign in.');
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetSent(false);
      setPassword(newPassword);
      setForgotSuccess(null);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ login: loginInput.trim(), password });

      // Determine redirection based on login email/account
      const val = loginInput.toLowerCase();
      if (val.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (val.includes('staff')) {
        navigate('/staff/tasks');
      } else {
        navigate('/customer/home');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(apiErr.response?.data?.message || 'Invalid credentials. Please verify your email/password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (role: 'admin' | 'staff' | 'customer') => {
    if (role === 'admin') {
      setLoginInput('admin@siwass.gov');
      setPassword('password123');
    } else if (role === 'staff') {
      setLoginInput('staff@siwass.gov');
      setPassword('password123');
    } else {
      setLoginInput('maria@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6 text-black text-[10px]">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b border-black/15 pb-3">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90">
          <AquaTrackLogo size={24} variant="mark" />
          <span className="font-bold text-black uppercase tracking-wider text-[10px]">
            Sinacaban Water District (SIWASS)
          </span>
        </Link>
        <div className="text-black/60 hidden sm:block text-[10px]">
          Official Municipal Public Utility Gateway
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-sm mx-auto my-8">
        <Card className="p-6 border border-black/15 shadow-sm space-y-4">
          {showForgotPassword ? (
            /* Wireframe C5: Forgot Password */
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-black/15 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setForgotError(null);
                    setForgotSuccess(null);
                  }}
                  className="p-1 hover:bg-[#F0F6FD] rounded text-black flex items-center gap-1 font-bold text-[10px]"
                >
                  <IconArrowLeft size={14} />
                  <span>Forgot password</span>
                </button>
              </div>

              {forgotSuccess && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[10px] text-black flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[10px] text-black flex items-center gap-2">
                  <IconAlertCircle size={14} className="text-[#1E6FD9] shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {!resetSent ? (
                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <p className="text-[10px] text-black leading-relaxed">
                    Enter the mobile number on your account. A reset code will be sent by SMS.
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1">
                      Mobile number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="0917 123 4567"
                        className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] font-mono"
                        value={forgotMobile}
                        onChange={(e) => setForgotMobile(e.target.value)}
                        required
                      />
                      <IconPhone size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full py-2"
                    isLoading={isSendingCode}
                  >
                    Send reset code
                  </Button>

                  <p className="text-[10px] text-black/60 italic text-center pt-1">
                    Next: enter the code, then set a new password.
                  </p>

                  <div className="text-center pt-2 border-t border-black/10">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-[#1E6FD9] font-bold hover:underline"
                    >
                      Return to log in
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-3">
                  <div className="p-2 bg-[#F0F6FD] border border-black/15 rounded text-[10px]">
                    <span className="font-bold text-black block mb-0.5">SMS Reset Dispatched:</span>
                    <span>A 6-digit verification code has been sent to <strong>{forgotMobile}</strong>.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1">
                      6-Digit SMS Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] font-mono tracking-widest font-bold"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                      />
                      <IconKey size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <IconLock size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <IconLock size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full py-2"
                  >
                    Confirm & Save New Password
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* Wireframe C4: Standard Sign In */
            <>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center mx-auto mb-1">
                  <AquaTrackLogo size={42} variant="mark" />
                </div>
                <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
                  Institutional Account Sign In
                </h1>
                <p className="text-[10px] text-black/60">
                  Access your administrative, field technician, or consumer portal.
                </p>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[10px] text-black flex items-center gap-2">
                  <IconAlertCircle size={14} className="text-[#1E6FD9] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Email or Account Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="admin@siwass.gov or account number"
                      className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      required
                    />
                    <IconMail size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <IconLock size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetSent(false);
                        setForgotError(null);
                        setForgotSuccess(null);
                      }}
                      className="text-[10px] text-[#1E6FD9] hover:underline"
                    >
                      Forgot password
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full py-2"
                  isLoading={isLoading}
                >
                  Sign In to Portal
                </Button>
              </form>

              {/* Quick Demo Pre-fills */}
              <div className="border-t border-black/15 pt-3 space-y-1.5">
                <span className="text-[10px] font-bold text-black uppercase block text-center">
                  Quick Live Demonstrations:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect('admin')}
                    className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect('staff')}
                    className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect('customer')}
                    className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
                  >
                    Customer
                  </button>
                </div>
              </div>

              {/* Registration link */}
              <div className="text-center pt-2 border-t border-black/10">
                <span className="text-black/60">New water consumer? </span>
                <Link
                  to="/register"
                  className="text-[#1E6FD9] font-bold underline"
                >
                  Register Household
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/15 pt-3 text-center text-black/50 text-[10px]">
        Sinacaban Water Works System (SIWASS) · Municipality of Sinacaban, Misamis Occidental
      </footer>
    </div>
  );
}
