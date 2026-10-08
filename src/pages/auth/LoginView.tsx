import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconArrowLeft,
  IconPhone,
  IconCheck,
  IconKey,
  IconEye,
  IconEyeOff,
  IconArrowRight,
} from '@tabler/icons-react';

export function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotMobile.trim()) return;

    setIsSendingCode(true);
    setForgotError(null);

    setTimeout(() => {
      setIsSendingCode(false);
      setResetSent(true);
      setResetCode('123456');
    }, 600);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setForgotError('Enter the 6-digit code.');
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

    setForgotSuccess('Password reset successfully. Sign in with your new password.');
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
      setErrorMessage(apiErr.response?.data?.message || 'Invalid credentials. Please verify your details.');
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

  const selectedRole =
    loginInput === 'admin@siwass.gov'
      ? 'admin'
      : loginInput === 'staff@siwass.gov'
      ? 'staff'
      : loginInput === 'maria@example.com'
      ? 'customer'
      : null;

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-white text-black text-[14px]">
      {/* Abstract Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] bg-cover bg-center"
        style={{
          backgroundImage: "url('/illustrations/bg-option-5-fluid.png')",
        }}
        aria-hidden="true"
      />

      {/* Clean Top Header (No extra nav links or duplicate action buttons) */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/20 shadow-[0_3px_0px_0px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 text-black hover:opacity-90">
            <AquaTrackLogo size={32} variant="mark" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-[15px] tracking-tight text-black">
                AquaTrack
              </span>
              <span className="text-black/60 font-normal text-[12px] sm:text-[13px] hidden min-[380px]:inline">
                Sinacaban Water Supply System
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="text-[14px] font-medium text-black/70 hover:text-[#1E6FD9] flex items-center gap-1.5 transition-colors"
          >
            <IconArrowLeft size={16} />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content: Perfectly vertically centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md mx-auto my-auto space-y-6 animate-hero-entrance">
          {/* Consistent Page Header prominently placed at the top */}
          <div className="text-center">
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-black">
              Water Utility Portal Sign In
            </h1>
          </div>

          <Card className="p-5 sm:p-8 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] space-y-6">
            {showForgotPassword ? (
              /* Forgot Password */
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setForgotError(null);
                      setForgotSuccess(null);
                    }}
                    className="hover:text-[#1E6FD9] text-black flex items-center gap-1.5 font-bold text-[14px] cursor-pointer"
                  >
                    <IconArrowLeft size={16} />
                    <span>Back to Sign In</span>
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-[18px] font-bold text-black tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-[13px] text-black/60 font-normal">
                    Verify your registered mobile number to receive a reset code.
                  </p>
                </div>

                {forgotSuccess && (
                  <div className="p-3 bg-[#F0F6FD] border border-black/20 rounded-lg text-[13px] text-black flex items-center gap-2.5">
                    <IconCheck size={16} className="text-[#1E6FD9] shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {forgotError && (
                  <div className="p-3 bg-[#FFF2F2] border border-black/30 rounded-lg text-[13px] font-medium text-black flex items-center gap-2.5">
                    <IconAlertCircle size={16} className="text-black shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {!resetSent ? (
                  <form onSubmit={handleSendResetCode} className="space-y-4">
                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="0917 123 4567"
                      value={forgotMobile}
                      onChange={(e) => setForgotMobile(e.target.value)}
                      leftIcon={<IconPhone size={16} className="text-black/60" />}
                      required
                    />

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-full h-9 text-[14px] font-semibold"
                      isLoading={isSendingCode}
                    >
                      Send Code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    <Input
                      label="6-Digit SMS Code"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      leftIcon={<IconKey size={16} className="text-black/60" />}
                      className="font-mono tracking-widest font-bold"
                      required
                    />

                    <Input
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      leftIcon={<IconLock size={16} className="text-black/60" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-black/50 hover:text-black focus:outline-none cursor-pointer"
                          tabIndex={-1}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      }
                      required
                    />

                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      leftIcon={<IconLock size={16} className="text-black/60" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-black/50 hover:text-black focus:outline-none cursor-pointer"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      }
                      required
                    />

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-full h-9 text-[14px] font-semibold"
                    >
                      Save Password & Sign In
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Sign In */
              <>
                <div className="border-b border-black/10 pb-3">
                  <h2 className="font-bold text-[16px] text-black">
                    Account Credentials
                  </h2>
                  <p className="text-[13px] text-black/60 font-normal pt-0.5">
                    Enter your registered email or water account number.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-[#FFF2F2] border border-black/30 rounded-lg text-[13px] font-medium text-black flex items-center gap-2.5">
                    <IconAlertCircle size={16} className="text-black shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email or Account Number"
                    type="text"
                    placeholder="ACC-2026-0002 or email"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    leftIcon={<IconMail size={16} className="text-black/60" />}
                    required
                  />

                  <div>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<IconLock size={16} className="text-black/60" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-black/50 hover:text-black focus:outline-none cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      }
                      required
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetSent(false);
                          setForgotError(null);
                          setForgotSuccess(null);
                        }}
                        className="text-[13px] text-[#1E6FD9] hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full h-9 text-[14px] font-semibold"
                    isLoading={isLoading}
                    rightIcon={<IconArrowRight size={16} />}
                  >
                    Sign In
                  </Button>
                </form>

                {/* Quick Demo Pre-fill Chips */}
                <div className="border-t border-black/10 pt-4 space-y-2">
                  <span className="text-[13px] font-medium text-black/60 block">
                    Demo Accounts:
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('customer')}
                      className={`h-9 border rounded-lg text-[13px] font-semibold transition-all text-center cursor-pointer ${
                        selectedRole === 'customer'
                          ? 'bg-[#1E6FD9] text-white border-[#1E6FD9] shadow-[2px_2px_0px_0px_#000000]'
                          : 'bg-white text-black border-black/20 hover:border-[#1E6FD9] hover:text-[#1E6FD9]'
                      }`}
                    >
                      Consumer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('staff')}
                      className={`h-9 border rounded-lg text-[13px] font-semibold transition-all text-center cursor-pointer ${
                        selectedRole === 'staff'
                          ? 'bg-[#1E6FD9] text-white border-[#1E6FD9] shadow-[2px_2px_0px_0px_#000000]'
                          : 'bg-white text-black border-black/20 hover:border-[#1E6FD9] hover:text-[#1E6FD9]'
                      }`}
                    >
                      Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('admin')}
                      className={`h-9 border rounded-lg text-[13px] font-semibold transition-all text-center cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-[#1E6FD9] text-white border-[#1E6FD9] shadow-[2px_2px_0px_0px_#000000]'
                          : 'bg-white text-black border-black/20 hover:border-[#1E6FD9] hover:text-[#1E6FD9]'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {/* Register Link */}
                <div className="text-center pt-3 border-t border-black/10 text-[13px]">
                  <span className="text-black/60">New water account? </span>
                  <Link
                    to="/register"
                    className="text-[#1E6FD9] font-semibold hover:underline"
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-black/20 py-2.5 text-center text-black/50 text-[14px]">
        AquaTrack — Sinacaban Water Supply System
      </footer>
    </div>
  );
}
