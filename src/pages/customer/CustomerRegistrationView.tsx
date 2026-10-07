import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';
import { authApi, type OfficeAccountDetails } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import {
  IconCheck,
  IconMapPin,
  IconShieldLock,
  IconSearch,
  IconDeviceMobile,
  IconArrowLeft,
  IconUserCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

interface Props {
  onBackToPortal?: () => void;
}

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

  const [mobileNumber, setMobileNumber] = useState('09179876543');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Step 2: Service Location Pin & Statutory Consents
  const [latitude, setLatitude] = useState('8.2850');
  const [longitude, setLongitude] = useState('123.8315');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Step 3: SMS One-Time PIN (OTP) & Auto-Login
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 3 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Handler: Step 1 Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accountNumber.trim() || !meterNumber.trim()) {
      setErrorMessage('Please enter both your Account Number and Meter Number.');
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        errorObj?.response?.data?.message ||
          'No matching water utility account found with the provided details. Please check your official receipt.'
      );
      setVerifiedAccount(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handler: Advance from Step 1 to Step 2
  const handleStep1Proceed = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verifiedAccount) {
      setErrorMessage('Please verify your water utility account before continuing.');
      return;
    }

    if (!mobileNumber.trim()) {
      setErrorMessage('A valid mobile number is required to receive your SMS verification code.');
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

    setStep(2);
  };

  // Handler: Step 2 Send SMS OTP and advance to Step 3
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentTerms || !consentPrivacy) {
      setErrorMessage('You must accept both the Terms of Use and Privacy Notice.');
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
        setOtp(res.debug_otp); // Pre-fill in development for fast testing
      }
      setResendCooldown(60);
      setStep(3);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Failed to dispatch SMS verification code. Please retry.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handler: Resend OTP in Step 3
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

  // Handler: Step 3 Verify OTP & Immediate Auto-Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your phone.');
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

      // Update AuthContext session for instant seamless login
      setSession(res.token, res.user);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string; errors?: { otp?: string[] } } } };
      const apiMsg = errorObj?.response?.data?.errors?.otp?.[0] || errorObj?.response?.data?.message;
      setErrorMessage(apiMsg || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Success Screen: Account Activated
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col text-black text-[14px]">
        <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 py-8">
          <div className="max-w-xl mx-auto space-y-4">
            <Card className="p-6 text-center space-y-4 border border-black/20">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#1E6FD9] text-white flex items-center justify-center">
                <IconCheck size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                  Account Verified & Activated!
                </h2>
                <p className="text-[14px] text-black/70">
                  Welcome to AquaTrack Online Portal. Your water account has been successfully linked.
                </p>
              </div>

              <div className="p-4 bg-[#F0F6FD] border border-black/10 rounded-lg text-left space-y-2">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="font-bold text-black">Account Status:</span>
                  <Badge variant="blue">ONLINE ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[14px]">
                  <div>
                    <span className="text-black/60 block">Customer Name:</span>
                    <span className="font-bold text-black">{verifiedAccount?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-black/60 block">Account Number:</span>
                    <span className="font-mono font-bold text-black">{accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-black/60 block">Assigned Meter:</span>
                    <span className="font-mono font-bold text-black">{meterNumber}</span>
                  </div>
                  <div>
                    <span className="text-black/60 block">Service Area:</span>
                    <span className="font-bold text-black">{verifiedAccount?.barangay_name}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => (onBackToPortal ? onBackToPortal() : navigate('/customer/home'))}
                className="w-full"
              >
                Go to Customer Dashboard →
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-black text-[14px]">
      <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 py-6 space-y-6">
        {/* Header and Step Indicators */}
        <div className="border-b border-black/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[14px] font-bold uppercase tracking-wider text-black">
              Water Utility Account Registration
            </h1>
            <p className="text-[14px] text-black/60">
              Link your existing municipal water account & physical meter for online billing and services.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/login"
              className="text-[14px] text-black hover:text-[#1E6FD9] font-bold underline mr-2"
            >
              ← Back to Sign In
            </Link>
            <Badge variant={step === 1 ? 'blue' : 'outline'}>1. Account Lookup</Badge>
            <Badge variant={step === 2 ? 'blue' : 'outline'}>2. Service Pin</Badge>
            <Badge variant={step === 3 ? 'blue' : 'outline'}>3. SMS Verification</Badge>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-[#FFF2F2] border border-black/30 rounded-lg text-[14px] font-bold text-black flex items-center gap-2">
            <IconAlertCircle size={18} className="text-black shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Account Lookup & Credentials */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Step 1A: Office Lookup Form */}
            <form onSubmit={handleLookup}>
              <Card className="p-5 space-y-4 border border-black/20">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <div className="font-bold text-black flex items-center gap-2">
                    <IconSearch size={16} className="text-[#1E6FD9]" />
                    <span>Step 1A · Verify Existing Municipal Water Account</span>
                  </div>
                  <span className="text-[12px] text-black/60">From your paper bill or official receipt</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Account Number"
                    placeholder="e.g. ACC-2026-0002"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setVerifiedAccount(null);
                    }}
                    required
                  />
                  <Input
                    label="Assigned Meter Number"
                    placeholder="e.g. MTR-SIN-0002"
                    value={meterNumber}
                    onChange={(e) => {
                      setMeterNumber(e.target.value);
                      setVerifiedAccount(null);
                    }}
                    required
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[12px] text-black/60">
                    💡 Demo accounts available: <strong>ACC-2026-0002</strong> (Meter <strong>MTR-SIN-0002</strong>) or <strong>ACC-2026-0003</strong> (Meter <strong>MTR-SIN-0003</strong>)
                  </div>
                  <Button type="submit" variant="secondary" disabled={isLookingUp}>
                    {isLookingUp ? 'Verifying...' : 'Verify Office Record'}
                  </Button>
                </div>
              </Card>
            </form>

            {/* Step 1B: If verified, show customer details and credentials input */}
            {verifiedAccount && (
              <form onSubmit={handleStep1Proceed}>
                <Card className="p-5 space-y-4 border border-black/20">
                  <div className="flex items-center justify-between border-b border-black/10 pb-2">
                    <div className="font-bold text-black flex items-center gap-2">
                      <IconUserCheck size={16} className="text-[#1E6FD9]" />
                      <span>Step 1B · Confirm Customer Information & Create Password</span>
                    </div>
                    <Badge variant="blue">RECORD MATCHED</Badge>
                  </div>

                  {/* Confirmed Office Record Box */}
                  <div className="p-3.5 bg-[#F0F6FD] border border-black/10 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[12px] text-black/60 block">Customer Name</span>
                      <span className="font-bold text-black">{verifiedAccount.full_name}</span>
                    </div>
                    <div>
                      <span className="text-[12px] text-black/60 block">Barangay</span>
                      <span className="font-bold text-black">{verifiedAccount.barangay_name}</span>
                    </div>
                    <div>
                      <span className="text-[12px] text-black/60 block">Registered Address</span>
                      <span className="font-bold text-black">{verifiedAccount.address}</span>
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Input
                      label="Mobile Number (09XXXXXXXXX) *"
                      placeholder="09179876543"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                    <Input
                      label="Email Address (Optional)"
                      type="email"
                      placeholder="juan@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Create Password (Min 8 chars) *"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm Password *"
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-black/10">
                    {onBackToPortal ? (
                      <Button type="button" variant="ghost" onClick={onBackToPortal}>
                        Cancel
                      </Button>
                    ) : <div />}
                    <Button type="submit" variant="primary">
                      Proceed to Step 2: Location & Consent →
                    </Button>
                  </div>
                </Card>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: Location Pin & Consents */}
        {step === 2 && (
          <form onSubmit={handleSendOtp}>
            <Card className="p-5 space-y-4 border border-black/20">
              <div className="font-bold text-black border-b border-black/10 pb-2">
                Step 2 · Household Location Pin & Statutory Legal Consent
              </div>

              {/* Location Picker Map */}
              <div className="p-3.5 bg-[#F0F6FD] border border-black/10 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-bold text-black">
                  <IconMapPin size={16} className="text-[#1E6FD9]" />
                  <span>Confirm Water Service Connection Geolocation Pin</span>
                </div>
                <div className="text-[12px] text-black/70">
                  Click or drag on the map below to pinpoint your exact household location in Sinacaban.
                </div>
                <LocationPickerMap
                  latitude={parseFloat(latitude) || 8.2835}
                  longitude={parseFloat(longitude) || 123.834}
                  onChange={(lat, lng) => {
                    setLatitude(lat.toString());
                    setLongitude(lng.toString());
                  }}
                />
              </div>

              {/* Statutory Legal Consents */}
              <div className="space-y-3 pt-2 border-t border-black/10">
                <div className="flex items-center gap-2 font-bold text-black">
                  <IconShieldLock size={16} className="text-black" />
                  <span>Statutory Legal Consent</span>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[#1E6FD9]"
                    checked={consentTerms}
                    onChange={(e) => setConsentTerms(e.target.checked)}
                    required
                  />
                  <span className="text-[14px] text-black">
                    I accept the <strong>AquaTrack Terms of Use (v1.0)</strong> for municipal water utility access and billing administration.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[#1E6FD9]"
                    checked={consentPrivacy}
                    onChange={(e) => setConsentPrivacy(e.target.checked)}
                    required
                  />
                  <span className="text-[14px] text-black">
                    I consent to the <strong>AquaTrack Privacy Notice (v1.0)</strong> and agree to receive utility SMS notifications regarding my water service account.
                  </span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-black/10">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isSendingOtp}>
                  <IconArrowLeft size={16} className="mr-1 inline" /> Back to Step 1
                </Button>
                <Button type="submit" variant="primary" disabled={isSendingOtp}>
                  {isSendingOtp ? 'Sending SMS Code...' : 'Send Verification Code (SMS) →'}
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* STEP 3: SMS One-Time PIN (OTP) Verification */}
        {step === 3 && (
          <form onSubmit={handleVerifyOtp}>
            <Card className="p-5 space-y-4 border border-black/20 max-w-xl mx-auto">
              <div className="text-center space-y-2 border-b border-black/10 pb-4">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#1E6FD9] text-white flex items-center justify-center">
                  <IconDeviceMobile size={20} />
                </div>
                <h2 className="font-bold text-black uppercase tracking-wider text-[14px]">
                  Step 3 · SMS Verification Code
                </h2>
                <p className="text-[14px] text-black/70">
                  We sent a 6-digit verification code to <strong>{mobileNumber}</strong>. Please enter the code below to complete your registration.
                </p>
                {debugOtp && (
                  <div className="inline-block px-3 py-1 bg-[#F0F6FD] border border-black/20 rounded font-mono text-[12px] text-black">
                    Demo Mode OTP: <strong>{debugOtp}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-bold uppercase tracking-wider text-black text-center">
                  Enter 6-Digit One-Time PIN (OTP)
                </label>
                <div className="max-w-[240px] mx-auto">
                  <Input
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center items-center gap-2 pt-2 text-[14px]">
                <span className="text-black/60">Didn't receive the SMS?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSendingOtp}
                  className={`font-bold underline ${
                    resendCooldown > 0 ? 'text-black/40 cursor-not-allowed' : 'text-[#1E6FD9] hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-black/10">
                <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={isVerifying}>
                  <IconArrowLeft size={16} className="mr-1 inline" /> Back to Step 2
                </Button>
                <Button type="submit" variant="primary" disabled={isVerifying || otp.length !== 6}>
                  {isVerifying ? 'Activating Account...' : 'Verify & Log In →'}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
