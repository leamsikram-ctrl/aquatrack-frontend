import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { Badge } from '../../components/atoms/Badge';
import { authApi, referenceApi } from '../../api';
import type { Barangay } from '../../types';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import { IconCheck, IconMapPin, IconShieldLock } from '@tabler/icons-react';

interface Props {
  onBackToPortal?: () => void;
}

export function CustomerRegistrationView({ onBackToPortal }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [barangayId, setBarangayId] = useState<number | ''>('');
  const [address, setAddress] = useState('');

  // Step 2 Fields
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [latitude, setLatitude] = useState('8.2833'); // Default Sinacaban coordinates
  const [longitude, setLongitude] = useState('123.8333');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);

  useEffect(() => {
    referenceApi.getBarangays().then(setBarangays).catch(() => {});
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!firstName.trim() || !lastName.trim() || !mobileNumber.trim() || !barangayId || !address.trim()) {
      setErrorMessage('Please complete all required fields before proceeding.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!consentTerms || !consentPrivacy) {
      setErrorMessage('You must agree to both Terms of Use and Privacy Notice.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim() || null,
        barangay_id: Number(barangayId),
        address: address.trim(),
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        password,
        password_confirmation: passwordConfirmation,
        consent_terms: true,
        consent_privacy: true,
        terms_version: 'v1.0',
        privacy_version: 'v1.0',
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Registration failed. Check if phone number is already registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <Card className="p-6 text-center space-y-4 border border-black/20">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#1E6FD9] text-white flex items-center justify-center">
            <IconCheck size={18} />
          </div>
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold text-black uppercase tracking-wider">Registration Received</h2>
            <p className="text-[10px] text-black/70">
              Your account has been placed into the SIWASS Admin verification queue.
            </p>
          </div>
          <div className="p-4 bg-[#F0F6FD] border border-black/10 rounded-lg text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black">Status:</span>
              <Badge variant="blue">PENDING VERIFICATION</Badge>
            </div>
            <div className="text-[10px] text-black/80">
              An administrator will inspect your application, assign an unassigned Sinacaban water meter, and activate your account. You will receive an SMS notification once verified.
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => (onBackToPortal ? onBackToPortal() : navigate('/login'))}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header and Step Indicator */}
      <div className="border-b border-black/10 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[10px] font-bold uppercase tracking-wider text-black">
            Customer Self-Registration
          </h1>
          <p className="text-[10px] text-black/60">
            SIWASS Sinacaban Municipal Water Service System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-[10px] text-black hover:text-[#1E6FD9] font-bold underline"
          >
            ← Back to Sign In
          </Link>
          <Badge variant={step === 1 ? 'blue' : 'outline'}>Step 1: Details</Badge>
          <Badge variant={step === 2 ? 'blue' : 'outline'}>Step 2: Consent</Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-white border-2 border-black rounded-lg text-[10px] font-bold text-black">
          {errorMessage}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleNextStep}>
          <Card className="p-5 space-y-4 border border-black/20">
            <div className="font-bold text-black border-b border-black/10 pb-2">
              Step 1 · Customer Profile & Service Address
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="e.g. Maria"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="e.g. Santos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Mobile Number (09XXXXXXXXX)"
                placeholder="09171234567"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="maria@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-black">
                Barangay (Sinacaban) <span className="text-black">*</span>
              </label>
              <select
                className="w-full px-3 py-2 text-[10px] font-sans bg-white text-black border border-black/20 rounded-lg outline-none focus:border-[#1E6FD9]"
                value={barangayId}
                onChange={(e) => setBarangayId(Number(e.target.value) || '')}
                required
              >
                <option value="">Select your barangay...</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Purok / Sitio / House Number"
              placeholder="e.g. Purok 3, Near Elementary School"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <div className="flex justify-between items-center pt-2 border-t border-black/10">
              {onBackToPortal ? (
                <Button type="button" variant="ghost" onClick={onBackToPortal}>
                  Cancel
                </Button>
              ) : <div />}
              <Button type="submit" variant="primary">
                Continue to Step 2
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="p-5 space-y-4 border border-black/20">
            <div className="font-bold text-black border-b border-black/10 pb-2">
              Step 2 · Security Pin & Legal Consent
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Create Password (Min 8 chars)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
            </div>

            {/* Interactive Municipal Geolocation Pin Picker */}
            <div className="p-3.5 bg-[#F0F6FD] border border-black/10 rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-bold text-black">
                <IconMapPin size={16} className="text-[#1E6FD9]" />
                <span>Household Water Service Location Pin</span>
              </div>
              <LocationPickerMap
                latitude={latitude || 8.2835}
                longitude={longitude || 123.834}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>

            {/* Legal Consent Checkboxes */}
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
                <span className="text-[10px] text-black">
                  I accept the <strong>SIWASS Terms of Use (v1.0)</strong> for municipal water utility access and billing administration.
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
                <span className="text-[10px] text-black">
                  I consent to the <strong>SIWASS Privacy Notice (v1.0)</strong> and agree to receive utility SMS notifications regarding my water service account.
                </span>
              </label>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-black/10">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back to Step 1
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Registration...' : 'Complete Registration'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
