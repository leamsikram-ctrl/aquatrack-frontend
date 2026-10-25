import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';
import { AquaTrackLogo } from '../../components/atoms/AquaTrackLogo';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import {
  SINACABAN_CENTER,
  getSinacabanBarangayCoords,
  isWithinSinacabanBounds,
} from '../../components/organisms/MunicipalMap';
import { SINACABAN_BARANGAY_LIST } from '../../services/advisoriesStore';
import { accountsStore } from '../../services/accountsStore';
import { authApi, referenceApi } from '../../api';
import type { User } from '../../types';
import {
  IconCheck,
  IconMapPin,
  IconArrowLeft,
  IconAlertCircle,
  IconLock,
  IconEye,
  IconEyeOff,
  IconFileInvoice,
  IconArrowRight,
  IconPhone,
  IconMail,
  IconX,
  IconShieldCheck,
  IconUser,
  IconHome,
  IconGauge,
} from '@tabler/icons-react';

interface Props {
  onBackToPortal?: () => void;
}

export interface DemoAccountOption {
  name: string;
  barangay: string;
  address: string;
  email: string;
  mobileNumber: string;
  meterNumber: string;
}

export const DEMO_REGISTRATION_ACCOUNTS: DemoAccountOption[] = [
  {
    name: 'Elena Ramos',
    barangay: 'Poblacion',
    address: 'Purok 3, National Highway',
    email: 'elena.ramos@example.com',
    mobileNumber: '09178889900',
    meterNumber: 'MTR-SIN-0004',
  },
  {
    name: 'Roberto Tan',
    barangay: 'San Isidro Alto',
    address: 'Sitio Hillside, Purok 2',
    email: 'roberto.tan@example.com',
    mobileNumber: '09187776655',
    meterNumber: 'MTR-SIN-0005',
  },
  {
    name: 'Lorna Bautista',
    barangay: 'Libertad Bajo',
    address: 'Purok 1, Coastal Road',
    email: 'lorna.bautista@example.com',
    mobileNumber: '09193334455',
    meterNumber: 'MTR-SIN-0006',
  },
];

export function CustomerRegistrationView({ onBackToPortal }: Props) {
  const navigate = useNavigate();

  // Reference data for Sinacaban barangays
  const [barangayList, setBarangayList] = useState<{ id: number; name: string }[]>(SINACABAN_BARANGAY_LIST);

  useEffect(() => {
    referenceApi
      .getBarangays()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBarangayList(data);
        }
      })
      .catch(() => {});
  }, []);

  // Single-form fields per Section 2.1
  const [fullName, setFullName] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Home location on map (opens centered on Sinacaban)
  const [latitude, setLatitude] = useState<string>(String(SINACABAN_CENTER[0]));
  const [longitude, setLongitude] = useState<string>(String(SINACABAN_CENTER[1]));
  const [showMapModal, setShowMapModal] = useState(false);

  // Terms of Use & Privacy Notice acceptance
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Submission & Pending Confirmation State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedPending, setIsSubmittedPending] = useState(false);

  const currentLat = parseFloat(latitude) || SINACABAN_CENTER[0];
  const currentLng = parseFloat(longitude) || SINACABAN_CENTER[1];
  const isOutsideSinacaban = !isWithinSinacabanBounds(currentLat, currentLng);

  const handleBarangayChange = (newBarangay: string) => {
    setBarangay(newBarangay);
    const [bLat, bLng] = getSinacabanBarangayCoords(newBarangay);
    setLatitude(bLat.toFixed(6));
    setLongitude(bLng.toFixed(6));
  };

  const handleQuickFillDemo = (sample: DemoAccountOption) => {
    setFullName(sample.name);
    setMeterNumber(sample.meterNumber);
    setBarangay(sample.barangay);
    setAddress(sample.address);
    setEmail(sample.email);
    setMobileNumber(sample.mobileNumber);
    setPassword('password123');
    setPasswordConfirmation('password123');
    const [bLat, bLng] = getSinacabanBarangayCoords(sample.barangay);
    setLatitude(bLat.toFixed(6));
    setLongitude(bLng.toFixed(6));
    setErrorMessage(null);
  };

  const handleAgreeLegalModal = () => {
    if (legalModalType === 'terms') {
      setConsentTerms(true);
    } else if (legalModalType === 'privacy') {
      setConsentPrivacy(true);
    }
    setLegalModalType(null);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentTerms || !consentPrivacy) {
      setErrorMessage('You must accept the Terms of Use and the Privacy Notice to register.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || fullName.trim();
      const lastName = nameParts.slice(1).join(' ') || 'Consumer';
      const matchedBg = barangayList.find(
        (b) => b.name.toLowerCase() === barangay.toLowerCase()
      );

      let backendUser: User | null = null;
      let backendFailed = false;

      // 1. Register with backend REST API first (source of truth)
      try {
        const apiRes = await authApi.register({
          first_name: firstName,
          last_name: lastName,
          meter_number: meterNumber.trim(),
          mobile_number: mobileNumber,
          email: email || undefined,
          barangay_id: matchedBg?.id || 10,
          address: address,
          latitude: currentLat,
          longitude: currentLng,
          password: password,
          password_confirmation: passwordConfirmation,
          consent_terms: consentTerms,
          consent_privacy: consentPrivacy,
          terms_version: 'v1.0',
          privacy_version: 'v1.0',
        });
        backendUser = apiRes.user;
      } catch (apiErr: any) {
        // If server responded with validation error, display it directly and abort
        if (apiErr?.response) {
          const resData = apiErr.response.data;
          const msg =
            resData?.errors?.meter_number?.[0] ||
            resData?.errors?.email?.[0] ||
            resData?.errors?.mobile_number?.[0] ||
            resData?.message ||
            'Registration failed. Please check your inputs.';
          setErrorMessage(msg);
          setIsSubmitting(false);
          return;
        }
        // If server is completely offline (network error), proceed with offline fallback
        backendFailed = true;
      }

      // 2. Also save to accountsStore with the synced backend ID
      const result = accountsStore.registerCustomer({
        id: backendUser?.id,
        fullName,
        meterNumber,
        address,
        barangay,
        email,
        mobileNumber,
        password,
        passwordConfirmation,
        latitude: currentLat,
        longitude: currentLng,
        consentTerms,
        consentPrivacy,
      });

      if (!result.success && backendFailed) {
        setErrorMessage(result.error || 'Failed to submit registration.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmittedPending(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Failed to submit registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section 2.1 Step 6: Confirmation screen showing Pending status and email/SMS notice
  if (isSubmittedPending) {
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
          <div className="max-w-md w-full mx-auto my-auto animate-hero-entrance">
            <Card className="p-6 text-center space-y-4 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FB8C00] text-white flex items-center justify-center">
                <IconCheck size={24} />
              </div>

              <div className="space-y-1">
                <h1 className="text-[19px] font-bold text-black tracking-tight">
                  Waiting for Verification
                </h1>
                <p className="text-[13px] text-black/75 leading-relaxed">
                  Your account has been saved with the status <strong>Pending</strong> and is waiting for verification against the Water District&apos;s consumer records. An <strong>email and SMS</strong> will be sent once your account is approved or declined.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-black/15 rounded-lg text-left space-y-2 text-[13px]">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="font-medium text-black/70">Account Status:</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold">
                    PENDING
                  </Badge>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/60">Full Name:</span>
                  <span className="font-semibold text-black text-right">{fullName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/60">Meter Number:</span>
                  <span className="font-mono font-bold text-[#1E6FD9] text-right">
                    {meterNumber.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/60">Address & Barangay:</span>
                  <span className="font-medium text-black text-right">
                    {address}, {barangay}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-black/60">Email & Mobile:</span>
                  <span className="font-medium text-black text-right">
                    {email} · {mobileNumber}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => (onBackToPortal ? onBackToPortal() : navigate('/login'))}
                className="w-full h-9 text-[14px] font-semibold"
                rightIcon={<IconArrowRight size={16} />}
              >
                Return to Sign In
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
            to="/login"
            className="text-[14px] font-medium text-black/70 hover:text-[#1E6FD9] flex items-center gap-1.5 transition-colors"
          >
            <IconArrowLeft size={16} />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Content: One Unified Registration Form (Section 2.1) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-2xl mx-auto my-auto space-y-5 animate-hero-entrance">
          <div className="text-center space-y-1">
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-black">
              Water Utility Account Registration
            </h1>
            <p className="text-[13px] text-black/60">
              Existing consumers of the Sinacaban Water District may register their online account below.
            </p>
          </div>

          <Card className="p-5 sm:p-7 border border-black/20 rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] space-y-5">
            {/* Quick Fill Demo Samples */}
            <div className="p-3 bg-slate-50 border border-black/15 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black/60">
                  Quick Fill Existing Consumer Sample
                </span>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="text-[12px] font-semibold text-[#1E6FD9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <IconFileInvoice size={14} />
                  <span>View Sample Receipt Diagram</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_REGISTRATION_ACCOUNTS.map((sample) => (
                  <button
                    key={sample.meterNumber}
                    type="button"
                    onClick={() => handleQuickFillDemo(sample)}
                    className="px-2.5 py-1 rounded border border-black/20 bg-white hover:border-[#1E6FD9] hover:text-[#1E6FD9] text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    {sample.name} ({sample.meterNumber})
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FFF2F2] border border-[#E53935]/40 rounded-lg text-[13px] font-medium text-[#E53935] flex items-center gap-2.5">
                <IconAlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              {/* Row 1: Full Name & Meter Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<IconUser size={16} className="text-black/60" />}
                  required
                />

                <Input
                  label="Meter Number"
                  type="text"
                  placeholder="MTR-SIN-0004"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  leftIcon={<IconGauge size={16} className="text-black/60" />}
                  className="font-mono"
                  required
                />
              </div>

              {/* Row 2: Barangay & Address (Purok or Street) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-barangay-select"
                    className="block text-[13px] font-semibold text-black mb-1"
                  >
                    Barangay
                  </label>
                  <select
                    id="reg-barangay-select"
                    value={barangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-black/25 bg-white text-[14px] text-black outline-none focus:border-[#1E6FD9]"
                    required
                  >
                    {barangayList.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Address (Purok or Street)"
                  type="text"
                  placeholder="Purok 2, Sitio Riverside"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  leftIcon={<IconHome size={16} className="text-black/60" />}
                  required
                />
              </div>

              {/* Row 3: Email Address & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="consumer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<IconMail size={16} className="text-black/60" />}
                  required
                />

                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="09171234567"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  leftIcon={<IconPhone size={16} className="text-black/60" />}
                  required
                />
              </div>

              {/* Row 4: Password & Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Create Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
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
                  placeholder="Re-enter password"
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

              {/* Section 2.1 Step 3: Mark Home Location on the Map */}
              <div className="pt-2 border-t border-black/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[13px] font-semibold text-black block">
                      Mark Home Location on the Map <span className="text-[#E53935]">*</span>
                    </span>
                    <span className="text-[12px] text-black/60">
                      Place the home icon on your house, drag it to adjust, or use your current location.
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Pin location on map"
                    onClick={() => setShowMapModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-black/20 bg-white hover:bg-black/5 text-xs font-semibold text-[#1E6FD9] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <IconMapPin size={14} />
                    <span>Expand Map</span>
                  </button>
                </div>

                <LocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  barangay={barangay}
                  onChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  showCoordinates={true}
                />
              </div>

              {/* Section 2.1 Step 2: Acceptance of Terms of Use and Privacy Notice */}
              <div className="pt-2 border-t border-black/10 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(e) => setConsentTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-black/30 text-[#1E6FD9] focus:ring-[#1E6FD9] cursor-pointer"
                  />
                  <span className="text-black/80">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setLegalModalType('terms')}
                      className="text-[#1E6FD9] font-semibold hover:underline cursor-pointer"
                    >
                      Terms of Use (v1.0)
                    </button>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={(e) => setConsentPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-black/30 text-[#1E6FD9] focus:ring-[#1E6FD9] cursor-pointer"
                  />
                  <span className="text-black/80">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setLegalModalType('privacy')}
                      className="text-[#1E6FD9] font-semibold hover:underline cursor-pointer"
                    >
                      Privacy Notice (v1.0)
                    </button>
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full h-10 text-[14px] font-semibold"
                  isLoading={isSubmitting}
                  disabled={isOutsideSinacaban}
                  rightIcon={<IconArrowRight size={16} />}
                >
                  Submit Registration
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      {/* Expanded Map Modal */}
      {showMapModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <Card className="w-full max-w-2xl bg-white p-5 rounded-xl border border-black/20 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div className="flex items-center gap-2">
                <IconMapPin size={18} className="text-[#1E6FD9]" />
                <h2 className="text-base font-bold text-black">Mark Home Location on Map</h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowMapModal(false)}
                className="p-1 text-black/60 hover:text-black cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              barangay={barangay}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              showCoordinates={true}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
              <Button variant="primary" type="button" onClick={() => setShowMapModal(false)}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Sample Receipt Diagram Modal */}
      {showReceiptModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <Card className="w-full max-w-md bg-white p-5 rounded-xl border border-black/20 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-3">
              <div>
                <h2 className="text-base font-bold text-black">Sample Water Receipt Diagram</h2>
                <p className="text-xs text-black/60">
                  Official Statement of Account / Official Water Receipt
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Diagram"
                onClick={() => setShowReceiptModal(false)}
                className="p-1 text-black/60 hover:text-black cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-black/25 rounded-lg space-y-2 text-xs font-mono">
              <div className="text-center font-bold border-b border-black/15 pb-2">
                SINACABAN WATER SUPPLY SYSTEM
              </div>
              <div className="flex justify-between">
                <span>CONSUMER NAME:</span>
                <span className="font-bold">ELENA RAMOS</span>
              </div>
              <div className="flex justify-between bg-[#1E6FD9]/10 p-1.5 rounded border border-[#1E6FD9]/30">
                <span className="font-bold text-[#1E6FD9]">METER NO.:</span>
                <span className="font-bold text-[#1E6FD9]">MTR-SIN-0004</span>
              </div>
              <div className="flex justify-between">
                <span>BARANGAY:</span>
                <span>POBLACION</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowReceiptModal(false)}>
                Close Diagram
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Terms of Use & Privacy Notice Modal */}
      {legalModalType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <Card className="w-full max-w-lg bg-white p-5 rounded-xl border border-black/20 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black/15 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <IconShieldCheck size={18} className="text-[#1E6FD9]" />
                <h2 className="text-base font-bold text-black">
                  {legalModalType === 'terms'
                    ? 'Sinacaban Water Supply System (SIWASS) Utility Terms of Service'
                    : 'Sinacaban Water Supply System (SIWASS) Privacy Notice'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="p-1 text-black/60 hover:text-black cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="text-[13px] text-black/80 space-y-3 overflow-y-auto pr-1 leading-relaxed">
              {legalModalType === 'terms' ? (
                <>
                  <p>
                    1. <strong>Existing Consumers Only:</strong> Only existing consumers of the Sinacaban Water District may register an online AquaTrack account. New water service connections are processed at the municipal waterworks office.
                  </p>
                  <p>
                    2. <strong>Account Verification:</strong> Your submitted name, meter number, address, barangay, and home location are verified by the administrator against official consumer records before activation.
                  </p>
                  <p>
                    3. <strong>Accurate Reporting:</strong> Maintenance requests and home location pins must accurately reflect service conditions within Sinacaban municipality.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    1. <strong>Data Collection:</strong> AquaTrack collects your full name, meter number, barangay, address, home map coordinates, email address, and mobile number in compliance with the Data Privacy Act of 2012 (RA 10173).
                  </p>
                  <p>
                    2. <strong>Purpose of Use:</strong> Your contact information and barangay location are used strictly for billing notices, maintenance dispatches, and water interruption advisories.
                  </p>
                  <p>
                    3. <strong>Location Privacy:</strong> Customer home locations on the GIS map are visible to the municipal administrator only.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-black/10 shrink-0">
              <Button variant="primary" type="button" onClick={handleAgreeLegalModal}>
                I Understand & Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <footer className="border-t border-black/20 py-2.5 text-center text-black/50 text-[14px]">
        AquaTrack — Sinacaban Water Supply System
      </footer>
    </div>
  );
}
