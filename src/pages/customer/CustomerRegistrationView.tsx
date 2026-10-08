import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import { authApi, type OfficeAccountDetails } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import {
  IconCheck,
  IconMapPin,
  IconSearch,
  IconDeviceMobile,
  IconArrowLeft,
  IconAlertCircle,
  IconLock,
  IconEye,
  IconEyeOff,
  IconQrcode,
  IconFileInvoice,
  IconArrowRight,
  IconPhone,
  IconMail,
  IconX,
  IconShieldCheck,
} from '@tabler/icons-react';

interface Props {
  onBackToPortal?: () => void;
}

export interface DemoAccountOption {
  name: string;
  barangay: string;
  accountNumber: string;
  meterNumber: string;
}

export const DEMO_REGISTRATION_ACCOUNTS: DemoAccountOption[] = [
  {
    name: 'Juan Dela Cruz',
    barangay: 'San Isidro',
    accountNumber: 'ACC-2026-0002',
    meterNumber: 'MTR-SIN-0002',
  },
  {
    name: 'Elena Ramos',
    barangay: 'Poblacion',
    accountNumber: 'ACC-2026-0003',
    meterNumber: 'MTR-SIN-0003',
  },
  {
    name: 'Roberto Tan',
    barangay: 'San Jose',
    accountNumber: 'ACC-2026-0004',
    meterNumber: 'MTR-SIN-0005',
  },
];

export function CustomerRegistrationView({ onBackToPortal }: Props) {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Office Account Lookup & Credentials
  const [accountNumber, setAccountNumber] = useState('ACC-2026-0002');
  const [meterNumber, setMeterNumber] = useState('MTR-SIN-0002');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<OfficeAccountDetails | null>(null);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [mobileNumber, setMobileNumber] = useState('09179876543');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Service Location Pin & Statutory Consents
  const [latitude, setLatitude] = useState('8.2850');
  const [longitude, setLongitude] = useState('123.8315');
  const [isLocationPinned, setIsLocationPinned] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Step 3: SMS One-Time PIN (OTP) & Auto-Login
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 3 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleLookup = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!accountNumber.trim() || !meterNumber.trim()) {
      setErrorMessage('Enter both Account Number and Meter Number.');
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await authApi.lookupAccount({
        account_number: accountNumber.trim(),
        meter_number: meterNumber.trim(),
      });
      setVerifiedAccount(res.account);
      if (res.account.latitude) setLatitude(res.account.latitude.toString());
      if (res.account.longitude) setLongitude(res.account.longitude.toString());
      setShowVerifiedModal(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        errorObj?.response?.data?.message || 'No matching water record found. Check your bill receipt.'
      );
      setVerifiedAccount(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleStep1Proceed = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verifiedAccount) {
      setErrorMessage('Verify your water account first.');
      return;
    }

    if (!mobileNumber.trim()) {
      setErrorMessage('Mobile number is required for SMS code.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setShowVerifiedModal(false);
    setStep(2);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentTerms || !consentPrivacy) {
      setErrorMessage('Please accept the terms and privacy notice.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await authApi.sendRegistrationOtp({
        account_number: accountNumber.trim(),
        meter_number: meterNumber.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim() || null,
      });

      if (res.debug_otp) {
        setDebugOtp(res.debug_otp);
        setOtp(res.debug_otp);
      }
      setResendCooldown(60);
      setStep(3);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Failed to send SMS code. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setIsSendingOtp(true);
    try {
      const res = await authApi.sendRegistrationOtp({
        account_number: accountNumber.trim(),
        meter_number: meterNumber.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim() || null,
      });
      if (res.debug_otp) {
        setDebugOtp(res.debug_otp);
        setOtp(res.debug_otp);
      }
      setResendCooldown(60);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Failed to resend SMS code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otp.trim().length !== 6) {
      setErrorMessage('Enter the 6-digit code.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authApi.verifyRegistrationOtp({
        account_number: accountNumber.trim(),
        meter_number: meterNumber.trim(),
        otp: otp.trim(),
        email: email.trim() || null,
        password,
        password_confirmation: passwordConfirmation,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        consent_terms: true,
        consent_privacy: true,
        terms_version: 'v1.0',
        privacy_version: 'v1.0',
      });

      setSession(res.token, res.user);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; errors?: { otp?: string[] } } } };
      const apiMsg = errorObj?.response?.data?.errors?.otp?.[0] || errorObj?.response?.data?.message;
      setErrorMessage(apiMsg || 'Invalid code. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloseLegalModal = () => {
    if (legalModalType === 'terms') {
      setHasReadTerms(true);
    } else if (legalModalType === 'privacy') {
      setHasReadPrivacy(true);
    }
    setLegalModalType(null);
  };

  const handleAgreeLegalModal = () => {
    if (legalModalType === 'terms') {
      setHasReadTerms(true);
      setConsentTerms(true);
    } else if (legalModalType === 'privacy') {
      setHasReadPrivacy(true);
      setConsentPrivacy(true);
    }
    setLegalModalType(null);
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between bg-white text-black text-[14px]">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] bg-cover bg-center"
          style={{
            backgroundImage: "url('/illustrations/bg-option-5-fluid.png')",
          }}
          aria-hidden="true"
        />

        <header className="sticky top-0 z-40 bg-white border-b border-black/20 shadow-[0_3px_0px_0px_rgba(0,0,0,0.08)]">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 text-black hover:opacity-90">
              <AquaTrackLogo size={34} variant="mark" />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-[15px] tracking-tight text-black">
                  AquaTrack
                </span>
                <span className="text-black/60 font-normal text-[13px]">
                  Sinacaban Water Supply System
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
          <div className="max-w-sm w-full mx-auto my-auto animate-hero-entrance">
            <Card className="p-6 text-center space-y-4 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#1E6FD9] text-white flex items-center justify-center">
                <IconCheck size={24} />
              </div>

              <h1 className="text-[18px] font-bold text-black tracking-tight">
                Account Activated
              </h1>

              <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded-lg text-left space-y-1.5 text-[14px]">
                <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                  <span className="font-semibold text-black">Status:</span>
                  <Badge variant="blue">ACTIVE</Badge>
                </div>
                <div>
                  <span className="text-black/60 text-[13px] block">Customer:</span>
                  <span className="font-bold text-black">{verifiedAccount?.full_name}</span>
                </div>
                <div>
                  <span className="text-black/60 text-[13px] block">Account / Meter:</span>
                  <span className="font-mono font-bold text-black">{accountNumber} · {meterNumber}</span>
                </div>
                <div>
                  <span className="text-black/60 text-[13px] block">Barangay:</span>
                  <span className="font-bold text-black">{verifiedAccount?.barangay_name}</span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => (onBackToPortal ? onBackToPortal() : navigate('/customer/home'))}
                className="w-full h-9 text-[14px] font-semibold"
                rightIcon={<IconArrowRight size={16} />}
              >
                Go to Dashboard
              </Button>
            </Card>
          </div>
        </main>

        <footer className="border-t border-black/20 py-2.5 text-center text-black/50 text-[14px]">
          AquaTrack — Sinacaban Water Supply System
        </footer>
      </div>
    );
  }

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
            to="/login"
            className="text-[14px] font-medium text-black/70 hover:text-[#1E6FD9] flex items-center gap-1.5 transition-colors"
          >
            <IconArrowLeft size={16} />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Content: Perfectly vertically centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-xl mx-auto my-auto space-y-6 sm:space-y-8 animate-hero-entrance">
          {/* Consistent Page Header prominently placed at the top */}
          <div className="text-center space-y-2">
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-black">
              Water Utility Account Registration
            </h1>
            <p className="text-[13px] sm:text-[14px] text-black/60 font-normal">
              Connect your municipal water account to your online portal
            </p>

            {/* Wizard Steps */}
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <span
                className={`px-3.5 py-1 rounded-full border text-[13px] font-semibold ${
                  step === 1
                    ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                    : verifiedAccount
                    ? 'bg-[#F0F6FD] text-[#1E6FD9] border-[#1E6FD9]'
                    : 'bg-white text-black/60 border-black/20'
                }`}
              >
                1. Account
              </span>
              <span
                className={`px-3.5 py-1 rounded-full border text-[13px] font-semibold ${
                  step === 2
                    ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                    : step > 2
                    ? 'bg-[#F0F6FD] text-[#1E6FD9] border-[#1E6FD9]'
                    : 'bg-white text-black/60 border-black/20'
                }`}
              >
                2. Location
              </span>
              <span
                className={`px-3.5 py-1 rounded-full border text-[13px] font-semibold ${
                  step === 3
                    ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                    : 'bg-white text-black/60 border-black/20'
                }`}
              >
                3. Verify
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#FFF2F2] border border-black/30 rounded-lg text-[14px] font-bold text-black flex items-center gap-2.5">
              <IconAlertCircle size={17} className="text-black shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Account Lookup & Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <form onSubmit={handleLookup}>
                <Card className="p-6 sm:p-8 space-y-6 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
                  <div className="flex items-center justify-between border-b border-black/10 pb-4 flex-wrap gap-2">
                    <div>
                      <h2 className="font-bold text-[16px] text-black flex items-center gap-2">
                        <IconSearch size={18} className="text-[#1E6FD9]" />
                        Look Up Account
                      </h2>
                      <p className="text-[13px] text-black/60 font-normal pt-0.5">
                        Enter your account and assigned meter number from your bill.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(true)}
                      className="text-[13px] font-medium text-[#1E6FD9] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <IconFileInvoice size={16} />
                      <span>View Sample Receipt Diagram</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <Input
                      label="Account Number"
                      placeholder="ACC-2026-0002"
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value);
                        setVerifiedAccount(null);
                      }}
                      leftIcon={<IconSearch size={16} className="text-black/60" />}
                      required
                    />
                    <Input
                      label="Assigned Meter Number"
                      placeholder="MTR-SIN-0002"
                      value={meterNumber}
                      onChange={(e) => {
                        setMeterNumber(e.target.value);
                        setVerifiedAccount(null);
                      }}
                      leftIcon={<IconQrcode size={16} className="text-black/60" />}
                      required
                    />
                  </div>

                  {/* Testing Demo Samples */}
                  <div className="space-y-2 pt-2 border-t border-black/10">
                    <span className="text-[13px] text-black/60 font-medium block">
                      Quick Demo Samples for Testing:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {DEMO_REGISTRATION_ACCOUNTS.map((demo) => {
                        const isSelected = accountNumber === demo.accountNumber;
                        return (
                          <button
                            key={demo.accountNumber}
                            type="button"
                            onClick={() => {
                              setAccountNumber(demo.accountNumber);
                              setMeterNumber(demo.meterNumber);
                              setVerifiedAccount(null);
                            }}
                            className={`px-3 py-1.5 rounded-md border text-[13px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E6FD9] text-white border-[#1E6FD9] shadow-[2px_2px_0px_0px_#000000]'
                                : 'bg-white text-black border-black/20 hover:border-[#1E6FD9] hover:text-[#1E6FD9]'
                            }`}
                          >
                            {demo.name} ({demo.accountNumber})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/10 flex-wrap gap-3">
                    <span className="text-[13px] text-black/60">
                      Active sample: <strong className="text-black font-semibold">{accountNumber}</strong>
                    </span>
                    <Button
                      type="submit"
                      onClick={handleLookup}
                      variant={verifiedAccount ? 'secondary' : 'primary'}
                      disabled={isLookingUp}
                      className="h-9 px-5 text-[14px] font-semibold"
                    >
                      {isLookingUp ? 'Verifying...' : 'Verify Office Record'}
                    </Button>
                  </div>

                  {verifiedAccount && (
                    <div className="p-4 sm:p-5 bg-[#F0F6FD] border border-black/15 rounded-lg flex items-center justify-between gap-3 flex-wrap text-[13px] mt-4">
                      <div>
                        <span className="font-bold text-black text-[14px]">{verifiedAccount.full_name}</span>
                        <span className="text-black/70 ml-1.5">
                          (<span>{verifiedAccount.barangay_name}</span>)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowVerifiedModal(true)}
                        className="h-8 px-3.5 text-[13px] font-semibold"
                      >
                        Review Record / Set Password →
                      </Button>
                    </div>
                  )}
                </Card>
              </form>
            </div>
          )}

          {/* STEP 2: Location Pin & Consents */}
          {step === 2 && (
            <form onSubmit={handleSendOtp}>
              <Card className="p-6 sm:p-8 space-y-6 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] animate-hero-entrance">
                <div className="border-b border-black/10 pb-4">
                  <h2 className="font-bold text-[16px] text-black">
                    Pin Service Location
                  </h2>
                </div>

                {/* Location Action: Light up colored indicator, icon-only pin button, no extra text */}
                <div
                  className={`p-4 sm:p-5 rounded-lg border transition-all flex items-center justify-between gap-4 ${
                    isLocationPinned
                      ? 'bg-[#F0F6FD] border-[#1E6FD9]/40 shadow-[inset_0_0_0_1px_rgba(30,111,217,0.15)]'
                      : 'bg-white border-black/15'
                  }`}
                >
                  <p className="text-[14px] font-medium text-black">
                    Pin your service location on the municipal map.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    aria-label="Pin location on map"
                    className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isLocationPinned
                        ? 'bg-[#1E6FD9] text-white border-[#1E6FD9] shadow-[0_0_12px_rgba(30,111,217,0.45)] ring-2 ring-[#1E6FD9]/20'
                        : 'bg-white text-black/40 border-black/20 hover:border-[#1E6FD9] hover:text-[#1E6FD9]'
                    }`}
                  >
                    <IconMapPin size={18} />
                  </button>
                </div>

                {/* Legal Consents: User must read before checking, no check icon with read */}
                <div className="space-y-3 pt-4 border-t border-black/10 text-[13px]">
                  <div
                    className={`flex items-start gap-2.5 ${!hasReadTerms ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!hasReadTerms) setLegalModalType('terms');
                    }}
                  >
                    <input
                      type="checkbox"
                      id="consent-terms-checkbox"
                      aria-label="I accept the Terms of Use (v1.0)"
                      className={`mt-0.5 accent-[#1E6FD9] ${!hasReadTerms ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      checked={consentTerms}
                      disabled={!hasReadTerms}
                      onChange={(e) => {
                        if (hasReadTerms) setConsentTerms(e.target.checked);
                      }}
                      required
                    />
                    <div className="text-black/85 select-none text-[13px]">
                      <span>I accept the </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLegalModalType('terms');
                        }}
                        className="text-[#1E6FD9] underline font-semibold hover:text-[#1E6FD9]/80 cursor-pointer"
                      >
                        Terms of Use (v1.0)
                      </button>
                      <span>. </span>
                      {!hasReadTerms && (
                        <span className="text-[12px] text-black/50 italic">
                          (Click to read first)
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-2.5 ${!hasReadPrivacy ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!hasReadPrivacy) setLegalModalType('privacy');
                    }}
                  >
                    <input
                      type="checkbox"
                      id="consent-privacy-checkbox"
                      aria-label="I accept the Privacy Notice (v1.0)"
                      className={`mt-0.5 accent-[#1E6FD9] ${!hasReadPrivacy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      checked={consentPrivacy}
                      disabled={!hasReadPrivacy}
                      onChange={(e) => {
                        if (hasReadPrivacy) setConsentPrivacy(e.target.checked);
                      }}
                      required
                    />
                    <div className="text-black/85 select-none text-[13px]">
                      <span>I accept the </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLegalModalType('privacy');
                        }}
                        className="text-[#1E6FD9] underline font-semibold hover:text-[#1E6FD9]/80 cursor-pointer"
                      >
                        Privacy Notice (v1.0)
                      </button>
                      <span>. </span>
                      {!hasReadPrivacy && (
                        <span className="text-[12px] text-black/50 italic">
                          (Click to read first)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-black/10">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    disabled={isSendingOtp}
                    className="h-9 px-4 text-[14px] font-semibold"
                  >
                    <IconArrowLeft size={16} className="mr-1 inline" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSendingOtp}
                    className="h-9 px-5 text-[14px] font-semibold"
                  >
                    {isSendingOtp ? 'Sending...' : 'Send SMS Code →'}
                  </Button>
                </div>
              </Card>
            </form>
          )}

          {/* STEP 3: SMS OTP Verification */}
          {step === 3 && (
            <form onSubmit={handleVerifyOtp}>
              <Card className="p-6 sm:p-8 space-y-6 border border-black/20 rounded-xl bg-white max-w-md mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] animate-hero-entrance">
                <div className="text-center space-y-2 border-b border-black/10 pb-4">
                  <div className="w-11 h-11 mx-auto rounded-full bg-[#1E6FD9] text-white flex items-center justify-center">
                    <IconDeviceMobile size={22} />
                  </div>
                  <h2 className="font-bold text-black text-[18px]">
                    SMS Verification
                  </h2>
                  <p className="text-[13px] text-black/70">
                    Code sent to <strong>{mobileNumber}</strong>.
                  </p>
                  {debugOtp && (
                    <div className="inline-block px-2.5 py-0.5 bg-[#F0F6FD] border border-black/20 rounded font-mono text-[13px] text-black">
                      Demo OTP: <strong>{debugOtp}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center">
                  <label className="block text-[13px] font-medium text-black/85">
                    6-Digit Verification Code
                  </label>
                  <div className="max-w-[190px] mx-auto">
                    <Input
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center font-mono text-xl tracking-widest font-bold h-10 border-2"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center items-center gap-2 text-[13px] pt-1">
                  <span className="text-black/60">No SMS?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isSendingOtp}
                    className={`font-semibold underline cursor-pointer ${
                      resendCooldown > 0 ? 'text-black/40 cursor-not-allowed' : 'text-[#1E6FD9] hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-black/10">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    disabled={isVerifying}
                    className="h-9 px-4 text-[14px] font-semibold"
                  >
                    <IconArrowLeft size={16} className="mr-1 inline" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isVerifying || otp.length !== 6}
                    className="h-9 px-5 text-[14px] font-semibold"
                  >
                    {isVerifying ? 'Activating...' : 'Verify & Finish'}
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>
      </main>

      {/* Pop-Up Modal: Sample Water Receipt Diagram */}
      {showReceiptModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-hero-entrance"
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            className="w-full max-w-xl bg-white border border-black/20 rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] space-y-5 text-black relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2.5">
                <IconFileInvoice size={20} className="text-[#1E6FD9]" />
                <h3 className="font-bold text-[18px] text-black">
                  Sample Water Receipt Diagram
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded border border-black/20 flex items-center justify-center hover:bg-[#F0F6FD] text-black hover:text-[#1E6FD9] cursor-pointer"
                aria-label="Close modal"
              >
                <IconX size={17} />
              </button>
            </div>

            <p className="text-[13px] text-black/70">
              Your numbers are printed on your official receipt or stamped on your brass meter casing:
            </p>

            <div className="border border-black/20 rounded-lg p-4 sm:p-5 bg-white space-y-4 text-[13px]">
              <div className="border-b border-black/10 pb-2.5 text-center space-y-0.5">
                <span className="font-bold text-[15px] text-black block">
                  Sinacaban Water Supply System
                </span>
                <span className="text-[13px] text-black/60 block">
                  Official Statement of Account / Official Water Receipt
                </span>
              </div>

              {/* Sample 1 */}
              <div className="border-2 border-[#1E6FD9] bg-[#F0F6FD] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black text-[13px]">Sample 1: Juan Dela Cruz (San Isidro)</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#1E6FD9] text-white rounded">Active Sample</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">① Account Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">ACC-2026-0002</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">② Meter Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">MTR-SIN-0002</span>
                  </div>
                </div>
              </div>

              {/* Sample 2 */}
              <div className="border border-black/20 bg-white rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black text-[13px]">Sample 2: Elena Ramos (Poblacion)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountNumber('ACC-2026-0003');
                      setMeterNumber('MTR-SIN-0003');
                      setShowReceiptModal(false);
                    }}
                    className="text-[12px] font-semibold text-[#1E6FD9] hover:underline cursor-pointer"
                  >
                    Select Elena →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">① Account Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">ACC-2026-0003</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">② Meter Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">MTR-SIN-0003</span>
                  </div>
                </div>
              </div>

              {/* Sample 3 */}
              <div className="border border-black/20 bg-white rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black text-[13px]">Sample 3: Roberto Tan (San Jose)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountNumber('ACC-2026-0004');
                      setMeterNumber('MTR-SIN-0005');
                      setShowReceiptModal(false);
                    }}
                    className="text-[12px] font-semibold text-[#1E6FD9] hover:underline cursor-pointer"
                  >
                    Select Roberto →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">① Account Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">ACC-2026-0004</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-black/60 block font-medium">② Meter Number:</span>
                    <span className="font-mono font-bold text-black text-[14px]">MTR-SIN-0005</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-black/10 flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAccountNumber('ACC-2026-0002');
                  setMeterNumber('MTR-SIN-0002');
                  setShowReceiptModal(false);
                }}
                className="h-9 px-4 text-[14px] font-semibold"
              >
                Use Sample Demo
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowReceiptModal(false)}
                className="h-9 px-5 text-[14px] font-semibold"
              >
                Close Diagram
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-Up Modal: Verified Office Record & Set Credentials */}
      {showVerifiedModal && verifiedAccount && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-hero-entrance"
          onClick={() => setShowVerifiedModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-black/20 rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] space-y-6 text-black relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2.5">
                <IconShieldCheck size={22} className="text-[#1E6FD9]" />
                <h3 className="font-bold text-[18px] text-black">
                  Verified Water Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifiedModal(false)}
                className="w-8 h-8 rounded border border-black/20 flex items-center justify-center hover:bg-[#F0F6FD] text-black hover:text-[#1E6FD9] cursor-pointer"
                aria-label="Close modal"
              >
                <IconX size={17} />
              </button>
            </div>

            {/* Matched consumer details */}
            <div className="p-4 sm:p-5 bg-[#F0F6FD] border border-black/15 rounded-lg flex items-center justify-between flex-wrap gap-3 text-[14px]">
              <div>
                <div className="font-bold text-black text-[16px]">{verifiedAccount.full_name}</div>
                <div className="text-[13px] text-black/70 pt-0.5">
                  <span>{verifiedAccount.barangay_name}</span> · {verifiedAccount.address}
                </div>
                <div className="text-[12px] font-mono text-black/60 pt-1">
                  {accountNumber} · {meterNumber}
                </div>
              </div>
              <Badge variant="blue">RECORD MATCHED</Badge>
            </div>

            {/* Credentials form inside modal */}
            <form onSubmit={handleStep1Proceed} className="space-y-5">
              <div className="border-b border-black/10 pb-3">
                <h4 className="font-bold text-[15px] text-black">
                  Create Account Credentials
                </h4>
                <p className="text-[13px] text-black/60 font-normal pt-0.5">
                  Set your contact number and password for online portal access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="09179876543"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  leftIcon={<IconPhone size={16} className="text-black/60" />}
                  required
                />
                <Input
                  label="Email (Optional)"
                  type="email"
                  placeholder="juan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<IconMail size={16} className="text-black/60" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <Input
                  label="Create Password"
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
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
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
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-black/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowVerifiedModal(false)}
                  className="h-9 px-4 text-[14px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-9 px-5 text-[14px] font-semibold"
                  rightIcon={<IconArrowRight size={16} />}
                >
                  Continue to Step 2
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-Up Modal: Map Modal with Close & Confirm Button */}
      {showMapModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-hero-entrance"
          onClick={() => setShowMapModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-black/20 rounded-xl p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000000] space-y-3 text-black relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-8 h-8 rounded-lg border border-black/20 flex items-center justify-center hover:bg-[#F0F6FD] text-black hover:text-[#1E6FD9] cursor-pointer"
                aria-label="Close modal"
              >
                <IconX size={17} />
              </button>
            </div>

            <LocationPickerMap
              latitude={parseFloat(latitude) || 8.2835}
              longitude={parseFloat(longitude) || 123.834}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
                setIsLocationPinned(true);
              }}
              showCoordinates={false}
            />

            <div className="flex items-center justify-end pt-2 border-t border-black/10">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setIsLocationPinned(true);
                  setShowMapModal(false);
                }}
                className="h-9 px-5 text-[14px] font-semibold"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-Up Modal: Terms of Use & Privacy Notice */}
      {legalModalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-hero-entrance"
          onClick={handleCloseLegalModal}
        >
          <div
            className="w-full max-w-lg bg-white border border-black/20 rounded-xl p-5 sm:p-8 shadow-[6px_6px_0px_0px_#000000] space-y-5 text-black relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2.5">
                <IconShieldCheck size={20} className="text-[#1E6FD9]" />
                <h3 className="font-bold text-[18px] text-black">
                  {legalModalType === 'terms' ? 'Terms of Use (v1.0)' : 'Privacy Notice (v1.0)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseLegalModal}
                className="w-8 h-8 rounded border border-black/20 flex items-center justify-center hover:bg-[#F0F6FD] text-black hover:text-[#1E6FD9] cursor-pointer"
                aria-label="Close modal"
              >
                <IconX size={17} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 text-[13px] text-black/80 pr-1">
              {legalModalType === 'terms' ? (
                <>
                  <p className="font-semibold text-black">
                    Sinacaban Water Supply System (SIWASS) Utility Terms of Service
                  </p>
                  <p>
                    1. <strong>Utility Connection:</strong> Access to the AquaTrack portal is granted to registered account holders and authorized household representatives for water billing and consumption monitoring.
                  </p>
                  <p>
                    2. <strong>Meter Custody:</strong> The registered consumer is responsible for safeguarding the municipal brass water meter against tampering, unauthorized bypasses, or physical damage.
                  </p>
                  <p>
                    3. <strong>Payment & Billing:</strong> Monthly statements are generated based on meter readings. Consumers must settle dues within the specified grace period to prevent disconnection notices.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-black">
                    Sinacaban Water Supply System (SIWASS) Privacy Notice
                  </p>
                  <p>
                    1. <strong>Statutory Compliance:</strong> In accordance with Republic Act No. 10173 (Data Privacy Act of 2012), SIWASS collects contact information solely for utility service administration.
                  </p>
                  <p>
                    2. <strong>SMS & Communication:</strong> Your registered mobile number is used exclusively for one-time PIN (OTP) verification, electronic billing notices, and emergency water interruption alerts.
                  </p>
                  <p>
                    3. <strong>Data Confidentiality:</strong> Your personal information and location coordinates are protected and will never be shared with third parties without your explicit statutory consent.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-black/10">
              <Button
                type="button"
                variant="primary"
                onClick={handleAgreeLegalModal}
                className="h-9 px-5 text-[14px] font-semibold"
              >
                I Understand & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-black/20 py-2.5 text-center text-black/50 text-[14px]">
        AquaTrack — Sinacaban Water Supply System
      </footer>
    </div>
  );
}
