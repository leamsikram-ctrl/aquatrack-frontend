import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import { OtpInput } from '../../components/molecules/OtpInput';
import { authApi } from '../../api';
import { accountsStore } from '../../services/accountsStore';
import type { User } from '../../types';
import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconArrowLeft,
  IconPhone,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconShieldCheck,
  IconLink,
} from '@tabler/icons-react';

export function LoginView() {
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // First-Login Setup (Section 3.3: Admin & Staff accept Terms of Use once; Section 7.2/7.5: Temporary password change)
  const [firstLoginUser, setFirstLoginUser] = useState<User | null>(null);
  const [acceptFirstLoginTerms, setAcceptFirstLoginTerms] = useState(false);
  const [tempNewPassword, setTempNewPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  const [firstLoginError, setFirstLoginError] = useState<string | null>(null);

  // Section 6: Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMethod, setForgotMethod] = useState<'sms' | 'email'>('sms');
  const [isSendingInstructions, setIsSendingInstructions] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [uniformNotice, setUniformNotice] = useState<string | null>(null);
  const [debugResetCredential, setDebugResetCredential] = useState<string | null>(null);
  const [linkOpened, setLinkOpened] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const navigateByRole = (role: string) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'staff') {
      navigate('/staff/tasks');
    } else {
      navigate('/customer/home');
    }
  };

  const handleSendResetInstructions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setIsSendingInstructions(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const apiRes = await authApi.requestPasswordReset({
        identifier: forgotIdentifier.trim(),
        method: forgotMethod,
      });

      setUniformNotice(
        apiRes.message || 'If the account is registered, instructions have been sent.'
      );
      setDebugResetCredential(apiRes.debug_token_or_pin || null);
      setResetSent(true);
      setLinkOpened(false);
      setResetCode(forgotMethod === 'sms' && apiRes.debug_token_or_pin ? apiRes.debug_token_or_pin : '');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setIsSendingInstructions(false);
        setForgotError(
          err.response?.data?.message ||
            'Too many password reset requests. Please wait an hour before requesting again.'
        );
        return;
      }

      // Offline / fallback to accountsStore
      const res = accountsStore.requestPasswordReset(forgotIdentifier.trim(), forgotMethod);
      if (!res.success) {
        setIsSendingInstructions(false);
        setForgotError(res.error || 'Unable to process password reset request.');
        return;
      }

      // Section 6 Step 2: Shows the exact same message whether or not the account exists
      setUniformNotice(res.message);
      setDebugResetCredential(res.debugCodeOrLink || null);
      setResetSent(true);
      setLinkOpened(false);
      setResetCode(forgotMethod === 'sms' && res.debugCodeOrLink ? res.debugCodeOrLink : '');
    } finally {
      setIsSendingInstructions(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const tokenOrPin =
      forgotMethod === 'email' ? debugResetCredential || resetCode : resetCode;

    if (!tokenOrPin.trim()) {
      setForgotError(
        forgotMethod === 'sms'
          ? 'Please enter the 6-digit SMS pin.'
          : 'Please open the single-use email reset link first.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const apiRes = await authApi.completePasswordReset({
        identifier: forgotIdentifier.trim(),
        method: forgotMethod,
        token_or_pin: tokenOrPin.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      // Synchronize to accountsStore
      accountsStore.completePasswordReset(
        forgotIdentifier,
        forgotMethod,
        tokenOrPin,
        newPassword,
        confirmPassword
      );

      setForgotSuccess(
        apiRes?.message ||
          'Password reset successfully. Your old password has stopped working — please sign in with your new password.'
      );
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setLoginInput(forgotIdentifier.trim());
        setPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess(null);
        setUniformNotice(null);
      }, 1500);
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.password?.[0] ||
        err?.response?.data?.errors?.token_or_pin?.[0];

      if (apiMsg) {
        setForgotError(apiMsg);
        if (err?.response?.data?.cancelled) {
          setDebugResetCredential(null);
        }
        setIsLoading(false);
        return;
      }

      // Offline / fallback to accountsStore
      const res = accountsStore.completePasswordReset(
        forgotIdentifier,
        forgotMethod,
        tokenOrPin,
        newPassword,
        confirmPassword
      );

      if (!res.success) {
        setForgotError(res.error || 'Failed to reset password.');
        if (res.cancelled) {
          setDebugResetCredential(null);
        }
        setIsLoading(false);
        return;
      }

      setForgotSuccess(
        'Password reset successfully. Your old password has stopped working — please sign in with your new password.'
      );
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setLoginInput(forgotIdentifier.trim());
        setPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess(null);
        setUniformNotice(null);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authenticatedUser = await login({ login: loginInput.trim(), password });

      const needsTermsAcceptance =
        (authenticatedUser.role === 'admin' || authenticatedUser.role === 'staff') &&
        authenticatedUser.terms_accepted === false;
      const needsPasswordChange = Boolean(authenticatedUser.must_change_password);

      if (needsTermsAcceptance || needsPasswordChange) {
        setFirstLoginUser(authenticatedUser);
        setAcceptFirstLoginTerms(!needsTermsAcceptance);
        setTempNewPassword('');
        setTempConfirmPassword('');
        setFirstLoginError(null);
        return;
      }

      navigateByRole(authenticatedUser.role);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        apiErr.response?.data?.message || 'Invalid credentials. Please verify your details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteFirstLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstLoginUser) return;
    setFirstLoginError(null);

    const needsTerms =
      (firstLoginUser.role === 'admin' || firstLoginUser.role === 'staff') &&
      firstLoginUser.terms_accepted === false;

    if (needsTerms && !acceptFirstLoginTerms) {
      setFirstLoginError('Please accept the Terms of Use to continue.');
      return;
    }

    if (firstLoginUser.must_change_password) {
      if (tempNewPassword.length < 8) {
        setFirstLoginError('New password must be at least 8 characters long.');
        return;
      }
      if (tempNewPassword !== tempConfirmPassword) {
        setFirstLoginError('New password and confirmation do not match.');
        return;
      }
    }

    setIsLoading(true);
    let updatedUser: User = { ...firstLoginUser };

    if (firstLoginUser.must_change_password) {
      // 1. Update on backend API
      try {
        const apiRes = await authApi.changePassword({
          current_password: password,
          password: tempNewPassword,
          password_confirmation: tempConfirmPassword,
        });
        if (apiRes?.user) {
          updatedUser = { ...updatedUser, ...apiRes.user, must_change_password: false };
        }
      } catch (err: any) {
        // If backend returned a specific validation error (e.g. 422), surface it to user
        if (err?.response?.status === 422) {
          const errMsg =
            err.response?.data?.errors?.password?.[0] ||
            err.response?.data?.errors?.current_password?.[0] ||
            err.response?.data?.message ||
            'Failed to update password. Please check your inputs.';
          setIsLoading(false);
          setFirstLoginError(errMsg);
          return;
        }
      }

      // 2. Synchronize to accountsStore with userContext fallback
      const passRes = accountsStore.changePassword(
        firstLoginUser.id,
        password || '',
        tempNewPassword,
        tempConfirmPassword,
        true,
        firstLoginUser
      );
      if (passRes.user) {
        updatedUser = { ...updatedUser, ...passRes.user, must_change_password: false };
      }
    }

    if (needsTerms) {
      try {
        await authApi.acceptTerms({
          terms_version: '1.0.0',
          privacy_version: '1.0.0',
        });
      } catch {
        // Fallback to local store if offline
      }
      const afterTerms = accountsStore.acceptFirstLoginTerms(updatedUser.id, updatedUser);
      if (afterTerms) {
        updatedUser = afterTerms;
      } else {
        updatedUser = { ...updatedUser, terms_accepted: true };
      }
    }

    setIsLoading(false);
    setUser(updatedUser);
    setFirstLoginUser(null);
    navigateByRole(updatedUser.role);
  };

  const handleQuickDemoSelect = (
    preset: 'admin' | 'staff' | 'customer' | 'pending' | 'declined' | 'inactive'
  ) => {
    setErrorMessage(null);
    if (preset === 'admin') {
      setLoginInput('admin@siwass.gov');
      setPassword('password123');
    } else if (preset === 'staff') {
      setLoginInput('staff@siwass.gov');
      setPassword('password123');
    } else if (preset === 'customer') {
      setLoginInput('maria@example.com');
      setPassword('password123');
    } else if (preset === 'pending') {
      setLoginInput('clara@example.com');
      setPassword('password123');
    } else if (preset === 'declined') {
      setLoginInput('carlos.mendoza@example.com');
      setPassword('password123');
    } else if (preset === 'inactive') {
      setLoginInput('rosa.v@example.com');
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
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] bg-cover bg-center"
        style={{
          backgroundImage: "url('/illustrations/bg-option-5-fluid.png')",
        }}
        aria-hidden="true"
      />

      {/* Top Header */}
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
            className="text-[14px] font-medium text-black/70 hover:text-brand-blue flex items-center gap-1.5 transition-colors"
          >
            <IconArrowLeft size={16} />
            <span>Home</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md mx-auto my-auto space-y-6 animate-hero-entrance">
          <div className="text-center">
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-black">
              Water Utility Portal Sign In
            </h1>
          </div>

          <Card className="p-5 sm:p-8 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] space-y-6">
            {firstLoginUser ? (
              /* Section 3.3 & Section 7.2/7.5: First-Login Terms Acceptance & Temporary Password Change */
              <form onSubmit={handleCompleteFirstLogin} className="space-y-4">
                <div className="border-b border-black/10 pb-3 space-y-1">
                  <div className="flex items-center gap-2 text-brand-blue">
                    <IconShieldCheck size={18} />
                    <h2 className="text-[16px] font-bold text-black">
                      Account Security Setup
                    </h2>
                  </div>
                  <p className="text-[13px] text-black/65">
                    Welcome, <strong>{firstLoginUser.name}</strong>. Please complete your required login setup below.
                  </p>
                </div>

                {firstLoginError && (
                  <div className="p-3 bg-danger-subtle border border-urgency-high/40 rounded-lg text-[13px] font-medium text-urgency-high flex items-center gap-2">
                    <IconAlertCircle size={16} className="shrink-0" />
                    <span>{firstLoginError}</span>
                  </div>
                )}

                {firstLoginUser.must_change_password && (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-medium">
                      You signed in with a temporary password issued by the administrator. You must set a new password before continuing.
                    </div>
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={tempNewPassword}
                      onChange={(e) => setTempNewPassword(e.target.value)}
                      leftIcon={<IconLock size={16} className="text-black/60" />}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={tempConfirmPassword}
                      onChange={(e) => setTempConfirmPassword(e.target.value)}
                      leftIcon={<IconLock size={16} className="text-black/60" />}
                      required
                    />
                  </div>
                )}

                {(firstLoginUser.role === 'admin' || firstLoginUser.role === 'staff') &&
                  firstLoginUser.terms_accepted === false && (
                    <div className="p-3 bg-slate-50 border border-black/15 rounded-lg space-y-2">
                      <div className="text-xs font-bold text-black">
                        Terms of Use (First Login Acceptance)
                      </div>
                      <p className="text-xs text-black/70 leading-relaxed">
                        As an authorized {firstLoginUser.role} member of the Sinacaban Water Supply System, you agree to handle customer records, service dispatches, and system credentials in accordance with municipal policies and the Data Privacy Act of 2012.
                      </p>
                      <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-semibold text-black">
                        <input
                          type="checkbox"
                          checked={acceptFirstLoginTerms}
                          onChange={(e) => setAcceptFirstLoginTerms(e.target.checked)}
                          className="w-4 h-4 rounded border-black/30 text-brand-blue cursor-pointer"
                        />
                        <span>I accept the AquaTrack Terms of Use</span>
                      </label>
                    </div>
                  )}

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full h-9 text-[14px] font-semibold"
                  rightIcon={<IconArrowRight size={16} />}
                >
                  Save & Continue to Dashboard
                </Button>
              </form>
            ) : showForgotPassword ? (
              /* Section 6: Forgot Password (Option 1: SMS Pin | Option 2: Email Reset Link) */
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setUniformNotice(null);
                    }}
                    className="hover:text-brand-blue text-black flex items-center gap-1.5 font-medium text-[14px] cursor-pointer"
                  >
                    <IconArrowLeft size={16} />
                    <span>Back to Sign In</span>
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-[18px] font-bold text-black tracking-tight">
                    Forgot Password
                  </h2>
                  <p className="text-[13px] text-black/60 font-normal">
                    Enter your registered email or mobile number and choose your reset method.
                  </p>
                </div>

                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-[13px] text-emerald-900 flex items-center gap-2.5">
                    <IconCheck size={16} className="text-urgency-low shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {forgotError && (!resetSent || forgotMethod === 'email') && (
                  <div className="p-3 bg-danger-subtle border border-urgency-high/40 rounded-lg text-[13px] font-medium text-urgency-high flex items-center gap-2.5">
                    <IconAlertCircle size={16} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {!resetSent ? (
                  <form onSubmit={handleSendResetInstructions} className="space-y-4">
                    <Input
                      label="Registered Email or Mobile Number"
                      type="text"
                      placeholder="maria@example.com or 09171234567"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      leftIcon={<IconMail size={16} className="text-black/60" />}
                      required
                    />

                    {/* Section 6 Step 3: User chooses the method */}
                    <div className="space-y-1.5">
                      <span className="block text-[13px] font-semibold text-black">
                        Choose Reset Method
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForgotMethod('sms')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            forgotMethod === 'sms'
                              ? 'bg-brand-blue text-white border-brand-blue'
                              : 'bg-white text-black border-black/20 hover:bg-black/5'
                          }`}
                        >
                          <IconPhone size={15} />
                          <span>One-time pin by SMS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotMethod('email')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            forgotMethod === 'email'
                              ? 'bg-brand-blue text-white border-brand-blue'
                              : 'bg-white text-black border-black/20 hover:bg-black/5'
                          }`}
                        >
                          <IconLink size={15} />
                          <span>Reset link by email</span>
                        </button>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-full h-9 text-[14px] font-medium"
                      isLoading={isSendingInstructions}
                    >
                      Send Reset Instructions
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    {/* Section 6 Step 2: Uniform privacy-preserving message */}
                    {uniformNotice && (
                      <div className="p-3 bg-blue-50 border border-brand-blue/30 rounded-lg text-xs text-black space-y-1.5">
                        <div className="font-bold text-brand-blue">{uniformNotice}</div>
                        <div className="text-black/65">
                          {forgotMethod === 'sms'
                            ? 'A 6-digit pin sent by SMS is valid for 10 minutes and can be used once (cancelled after 5 wrong attempts).'
                            : 'A single-use reset link sent by email is valid for 60 minutes.'}
                        </div>
                        {debugResetCredential && (
                          <div className="pt-1.5 border-t border-brand-blue/20 font-mono text-[11px] text-black/80">
                            {forgotMethod === 'sms' ? (
                              <span>Simulated SMS Pin: <strong>{debugResetCredential}</strong></span>
                            ) : (
                              <div className="space-y-1">
                                <div className="truncate">Link: {debugResetCredential}</div>
                                {!linkOpened && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLinkOpened(true);
                                      setResetCode(debugResetCredential);
                                    }}
                                    className="px-2.5 py-1 rounded bg-brand-blue text-white font-sans font-bold text-xs cursor-pointer"
                                  >
                                    Open Single-Use Reset Link
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {forgotMethod === 'sms' ? (
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-black text-center">
                          6-Digit SMS PIN
                        </label>
                        <OtpInput
                          value={resetCode}
                          onChange={(val) => {
                            setResetCode(val);
                            if (forgotError) setForgotError(null);
                          }}
                          error={forgotError}
                          onResend={() => handleSendResetInstructions()}
                          resendCooldown={30}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <Input
                        label="Reset Link Token"
                        type="text"
                        placeholder="Click 'Open Single-Use Reset Link' or paste token"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        leftIcon={<IconLink size={16} className="text-black/60" />}
                        className="font-mono text-xs"
                        required
                      />
                    )}

                    <Input
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
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
                      label="Confirm New Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
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

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setResetSent(false);
                          setForgotError(null);
                        }}
                        className="h-9 text-xs"
                      >
                        Request New
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        className="flex-1 h-9 text-[14px] font-medium"
                      >
                        Save Password & Sign In
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Sign In (Section 3) */
              <>
                <div className="border-b border-black/10 pb-3">
                  <h2 className="font-bold text-[16px] text-black">
                    Account Credentials
                  </h2>
                  <p className="text-[13px] text-black/60 font-normal pt-0.5">
                    Enter your registered email address or mobile number and password.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-danger-subtle border border-urgency-high/40 rounded-lg text-[13px] font-medium text-urgency-high flex items-center gap-2.5">
                    <IconAlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email or Mobile Number"
                    type="text"
                    placeholder="maria@example.com or 09171234567"
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
                          setForgotIdentifier(loginInput);
                          setResetSent(false);
                          setForgotError(null);
                          setForgotSuccess(null);
                        }}
                        className="text-[13px] text-brand-blue hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full h-9 text-[14px] font-medium"
                    isLoading={isLoading}
                    rightIcon={<IconArrowRight size={16} />}
                  >
                    Sign In
                  </Button>
                </form>

                {/* Quick Demo Pre-fill Chips */}
                <div className="border-t border-black/10 pt-4 space-y-2.5">
                  <span className="text-[12px] font-medium text-black/60 block">
                    Demo Active Accounts:
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('customer')}
                      className={`h-9 border rounded-lg text-[13px] font-medium transition-all text-center cursor-pointer ${
                        selectedRole === 'customer'
                          ? 'bg-brand-blue text-white border-brand-blue shadow-[2px_2px_0px_0px_black]'
                          : 'bg-white text-black border-black/20 hover:border-brand-blue hover:text-brand-blue'
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('staff')}
                      className={`h-9 border rounded-lg text-[13px] font-medium transition-all text-center cursor-pointer ${
                        selectedRole === 'staff'
                          ? 'bg-brand-blue text-white border-brand-blue shadow-[2px_2px_0px_0px_black]'
                          : 'bg-white text-black border-black/20 hover:border-brand-blue hover:text-brand-blue'
                      }`}
                    >
                      Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('admin')}
                      className={`h-9 border rounded-lg text-[13px] font-medium transition-all text-center cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-brand-blue text-white border-brand-blue shadow-[2px_2px_0px_0px_black]'
                          : 'bg-white text-black border-black/20 hover:border-brand-blue hover:text-brand-blue'
                      }`}
                    >
                      Admin
                    </button>
                  </div>

                  {/* Status Test Presets (Pending, Declined, Inactive per Section 3.2) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-black/50 mr-1">Test Status Rules:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('pending')}
                      className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold hover:bg-amber-100 cursor-pointer"
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('declined')}
                      className="px-2 py-0.5 rounded border border-red-300 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 cursor-pointer"
                    >
                      Declined
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoSelect('inactive')}
                      className="px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      Inactive
                    </button>
                  </div>
                </div>

                {/* Register Link */}
                <div className="text-center pt-3 border-t border-black/10 text-[13px]">
                  <span className="text-black/60">Existing customer without an online account? </span>
                  <Link
                    to="/register"
                    className="text-brand-blue font-medium hover:underline"
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>

      <footer className="border-t border-black/20 py-2.5 text-center text-black/50 text-[14px]">
        AquaTrack — Sinacaban Water Supply System
      </footer>
    </div>
  );
}
