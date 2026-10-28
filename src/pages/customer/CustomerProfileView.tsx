import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { LocationPickerMap } from '../../components/organisms/LocationPickerMap';
import { getSinacabanBarangayCoords } from '../../components/organisms/MunicipalMap';
import { OtpInput } from '../../components/molecules/OtpInput';
import { TermsPrivacyModal } from '../../components/molecules/TermsPrivacyModal';
import { authApi, profileApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  accountsStore,
  validateProfilePhotoFile,
} from '../../services/accountsStore';
import type { User } from '../../types';
import {
  IconCamera,
  IconTrash,
  IconLock,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconX,
  IconLink,
} from '@tabler/icons-react';

export function CustomerProfileView() {
  const navigate = useNavigate();
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(() => {
    const local = authUser?.email
      ? accountsStore.getUserByEmail(authUser.email)
      : (authUser?.id ? accountsStore.getUserById(authUser.id) : accountsStore.getUserByEmail('maria@example.com'));
    return (local && local.role === 'customer' ? local : null) || authUser;
  });
  const [isLoading, setIsLoading] = useState(true);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Toast / Feedback Banner
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Modal 1: Edit Address & Home Location on Map (Section 5)
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState('8.2985');
  const [editLongitude, setEditLongitude] = useState('123.8340');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Modal 2: Change Mobile Number (Section 5.2: 6-digit SMS PIN, 10 mins, 5 attempts)
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobileInput, setNewMobileInput] = useState('');
  const [mobilePinSent, setMobilePinSent] = useState(false);
  const [mobilePinInput, setMobilePinInput] = useState('');
  const [debugMobilePin, setDebugMobilePin] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Modal 3: Change Email Address (Section 5.3: Single-use link, 60 mins)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [pendingEmailToken, setPendingEmailToken] = useState<string | null>(null);
  const [pendingEmailLinkUrl, setPendingEmailLinkUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Modal 4: Account Settings — Change Password (Section 4)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Modal 5: Terms of Use & Privacy Notice Viewer (Section 12.A.5)
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const localAccount = authUser?.email
      ? accountsStore.getUserByEmail(authUser.email)
      : (authUser?.id ? accountsStore.getUserById(authUser.id) : accountsStore.getUserByEmail('maria@example.com'));
    if (localAccount && localAccount.role === 'customer') {
      setUser(localAccount);
      setEditAddress(localAccount.customer_profile?.address || 'Purok 1, Poblacion');
      const [bLat, bLng] = getSinacabanBarangayCoords(
        localAccount.customer_profile?.barangay?.name || 'Poblacion'
      );
      setEditLatitude(String(localAccount.customer_profile?.latitude ?? bLat));
      setEditLongitude(String(localAccount.customer_profile?.longitude ?? bLng));
    }

    authApi
      .me()
      .then((u) => {
        if (u.role === 'customer') {
          const stored = u.email ? accountsStore.getUserByEmail(u.email) : accountsStore.getUserById(u.id);
          const merged = (stored && stored.role === 'customer') ? { ...stored, ...u } : u;
          setUser(merged);
        }
      })
      .catch(() => {
        // Use local store account
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authUser?.id, authUser?.email]);

  const syncUpdatedUser = (updated: User, message: string) => {
    setUser(updated);
    setAuthUser(updated);
    setFeedbackNotice(message);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Section 5.1: Upload / Change Profile Photo (JPG and PNG, max 2 MB)
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoError(null);

    const validation = validateProfilePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid profile photo.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const photoData = reader.result;
        profileApi
          .uploadPhoto({ photo_data: photoData })
          .then((res) => {
            if (res?.user) {
              syncUpdatedUser(res.user, 'Profile photo updated and saved in Activity Log.');
            }
          })
          .catch(() => {
            const res = accountsStore.updateProfilePhoto(user.id, photoData);
            if (res.success && res.user) {
              syncUpdatedUser(res.user, 'Profile photo updated and saved in Activity Log.');
            }
          });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    if (!user) return;
    setPhotoError(null);
    profileApi
      .removePhoto()
      .then((res) => {
        if (res?.user) {
          syncUpdatedUser(res.user, 'Profile photo removed.');
        }
      })
      .catch(() => {
        const res = accountsStore.updateProfilePhoto(user.id, null);
        if (res.success && res.user) {
          syncUpdatedUser(res.user, 'Profile photo removed.');
        }
      });
  };

  // Section 5: Save Address & Home Location on Map
  const handleSaveAddressAndLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddressError(null);

    if (!editAddress.trim()) {
      setAddressError('Please enter your address (purok or street).');
      return;
    }

    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);

    profileApi
      .updateProfile({
        address: editAddress.trim(),
        latitude: lat,
        longitude: lng,
      })
      .then((res) => {
        if (res?.user) {
          syncUpdatedUser(
            res.user,
            'Address and home location updated on the map and saved in Activity Log.'
          );
          setShowEditAddressModal(false);
        }
      })
      .catch(() => {
        const res = accountsStore.updateOwnProfile(user.id, {
          address: editAddress.trim(),
          latitude: lat,
          longitude: lng,
        });

        if (!res.success || !res.user) {
          setAddressError(res.error || 'Failed to update address and home location.');
          return;
        }

        syncUpdatedUser(
          res.user,
          'Address and home location updated on the map and saved in Activity Log.'
        );
        setShowEditAddressModal(false);
      });
  };

  // Section 5.2 & 12.A.3: Request 6-digit SMS PIN for Mobile Number Change
  const handleRequestMobilePin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setMobileError(null);

    try {
      const apiRes = await profileApi.requestMobilePin({ mobile_number: newMobileInput.trim() });
      setMobilePinSent(true);
      setDebugMobilePin(apiRes.debug_pin || null);
      setMobilePinInput(apiRes.debug_pin || '');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setMobileError(err.response?.data?.message || 'Pin and link requests are limited to 3 per hour.');
        return;
      }
      const res = accountsStore.requestMobileChangePin(user.id, newMobileInput);
      if (!res.success) {
        setMobileError(res.error || 'Failed to send SMS pin.');
        return;
      }
      setMobilePinSent(true);
      setDebugMobilePin(res.debugPin || null);
      setMobilePinInput(res.debugPin || '');
    }
  };

  // Section 5.2 & 12.A.3: Confirm 6-digit SMS PIN
  const handleConfirmMobilePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMobileError(null);

    try {
      const apiRes = await profileApi.verifyMobilePin({ pin: mobilePinInput.trim() });
      if (apiRes?.user) {
        accountsStore.confirmMobileChangePin(user.id, mobilePinInput.trim());
        syncUpdatedUser(
          apiRes.user,
          `Mobile number changed to ${apiRes.user.mobile_number}. In-app notification sent & logged in Activity Log.`
        );
        setShowMobileModal(false);
        setMobilePinSent(false);
        setNewMobileInput('');
        setMobilePinInput('');
        return;
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message;
      if (errMsg) {
        setMobileError(errMsg);
        if (err?.response?.data?.cancelled) {
          setDebugMobilePin(null);
        }
        return;
      }
    }

    const res = accountsStore.confirmMobileChangePin(user.id, mobilePinInput);
    if (!res.success || !res.user) {
      setMobileError(res.error || 'Invalid pin.');
      if (res.cancelled) {
        setDebugMobilePin(null);
      }
      return;
    }

    syncUpdatedUser(
      res.user,
      `Mobile number changed to ${res.user.mobile_number}. In-app notification sent & logged in Activity Log.`
    );
    setShowMobileModal(false);
    setMobilePinSent(false);
    setNewMobileInput('');
    setMobilePinInput('');
  };

  // Section 5.3 & 12.A.3: Request Single-Use Confirmation Link for Email Change
  const handleRequestEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailError(null);

    try {
      const apiRes = await profileApi.requestEmailLink({ email: newEmailInput.trim() });
      setEmailLinkSent(true);
      setPendingEmailToken(apiRes.debug_token || null);
      setPendingEmailLinkUrl(apiRes.link_url || null);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setEmailError(err.response?.data?.message || 'Pin and link requests are limited to 3 per hour.');
        return;
      }
      const res = accountsStore.requestEmailChangeLink(user.id, newEmailInput);
      if (!res.success) {
        setEmailError(res.error || 'Failed to send confirmation link.');
        return;
      }
      setEmailLinkSent(true);
      setPendingEmailToken(res.token || null);
      setPendingEmailLinkUrl(res.linkUrl || null);
    }
  };

  // Section 5.3 & 12.A.3: Open Single-Use Confirmation Link
  const handleOpenEmailConfirmationLink = async () => {
    if (!user || !pendingEmailToken) return;
    setEmailError(null);

    try {
      const apiRes = await profileApi.verifyEmailLink({ token: pendingEmailToken });
      if (apiRes?.user) {
        accountsStore.confirmEmailChangeLink(user.id, pendingEmailToken);
        syncUpdatedUser(
          apiRes.user,
          `Email address changed to ${apiRes.user.email}. In-app notification sent, notice sent to old email address, and logged in Activity Log.`
        );
        setShowEmailModal(false);
        setEmailLinkSent(false);
        setNewEmailInput('');
        setPendingEmailToken(null);
        return;
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message;
      if (errMsg) {
        setEmailError(errMsg);
        return;
      }
    }

    const res = accountsStore.confirmEmailChangeLink(user.id, pendingEmailToken);
    if (!res.success || !res.user) {
      setEmailError(res.error || 'Failed to confirm email link.');
      return;
    }

    syncUpdatedUser(
      res.user,
      `Email address changed to ${res.user.email}. In-app notification sent, notice sent to old email address, and logged in Activity Log.`
    );
    setShowEmailModal(false);
    setEmailLinkSent(false);
    setNewEmailInput('');
    setPendingEmailToken(null);
  };

  // Section 4 & 12.A.4: Change Password in Settings (signs out other sessions)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError('');

    try {
      const apiRes = await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPasswordSuccess(true);
      if (apiRes?.user) {
        syncUpdatedUser(
          apiRes.user,
          'Password changed successfully. Your other signed-in sessions have been signed out.'
        );
      }
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1400);
    } catch (err: any) {
      const res = accountsStore.changePassword(
        user.id,
        currentPassword,
        newPassword,
        confirmPassword,
        false,
        user
      );
      if (!res.success || !res.user) {
        setPasswordError(err?.response?.data?.message || res.error || 'Failed to change password.');
        return;
      }

      setPasswordSuccess(true);
      syncUpdatedUser(
        res.user,
        'Password changed successfully. Your other signed-in sessions have been signed out.'
      );
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1400);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 text-center text-black/60 border border-black/15 text-[14px] font-normal">
        Loading customer profile...
      </Card>
    );
  }

  const profile = user?.customer_profile;
  const customerName = user?.name || 'Maria Santos';
  const accountNumber = profile?.account_number || 'ACC-2026-0001';
  const meterNumber = profile?.meter?.meter_number || 'MTR-SIN-0001';
  const barangayName = profile?.barangay?.name || 'Poblacion';
  const addressStreet = profile?.address || 'Purok 1, Poblacion';
  const mobileNumber = user?.mobile_number || profile?.mobile_number || '09171234567';
  const emailAddress = user?.email || 'maria@example.com';
  const hasCustomAvatar = Boolean(user?.avatar && user.avatar !== '/default-avatar.svg');
  const avatarUrl = user?.avatar || '/default-avatar.svg';

  return (
    <CustomerLayout
      currentPath="/customer/profile"
      onNavigate={(path) => navigate(path)}
      userName={customerName}
      accountNumber={accountNumber}
    >
      <div className="space-y-4 max-w-2xl">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Profile & Account Settings
          </h1>
        </div>

        {feedbackNotice && (
          <div className="p-3.5 bg-blue-tint border border-brand-blue/20 rounded-xl text-[13px] text-black flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2.5">
              <IconCheck size={16} className="text-brand-blue shrink-0" />
              <span className="font-medium">{feedbackNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="p-1 text-black/50 hover:text-black rounded hover:bg-black/5 cursor-pointer"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* Section 5.1: Profile Photo & Identity Card */}
        <Card className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
            <div className="flex items-center gap-3.5">
              <img
                src={avatarUrl}
                alt={customerName}
                className="w-14 h-14 rounded-full object-cover border border-black/20 shrink-0 bg-blue-tint"
              />
              <div>
                <div className="font-bold text-base text-black">{customerName}</div>
                <div className="text-xs text-brand-blue font-mono font-bold">{accountNumber}</div>
                <div className="text-[11px] text-black/50 mt-0.5">
                  Accepted photo formats: JPG, PNG (Max 5 MB)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handlePhotoFileChange}
                className="hidden"
              />
              <Button
                variant="secondary"
                type="button"
                onClick={() => photoInputRef.current?.click()}
                leftIcon={<IconCamera size={14} />}
                className="text-xs"
              >
                {hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {hasCustomAvatar && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleRemovePhoto}
                  leftIcon={<IconTrash size={14} />}
                  className="text-xs text-black hover:text-brand-blue"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {photoError && (
            <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs font-semibold text-black flex items-center gap-2">
              <IconAlertCircle size={15} className="text-brand-blue shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Section 5: Locked Verified Records (Full Name, Meter Number, Barangay) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                Verified Customer Record (Locked)
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold">
                <IconLock size={11} className="inline mr-1 text-brand-blue" />
                Verified by Office
              </Badge>
            </div>
            <div className="p-3.5 bg-blue-tint/50 border border-black/10 rounded-xl divide-y divide-black/10 text-[13px]">
              <div className="flex justify-between py-2">
                <span className="text-black/60">Full Name</span>
                <span className="font-semibold text-black">{customerName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-black/60">Meter Number</span>
                <span className="font-mono font-bold text-brand-blue">{meterNumber}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-black/60">Barangay</span>
                <span className="font-semibold text-black">{barangayName}</span>
              </div>
            </div>
            <p className="text-[11px] text-black/55 leading-relaxed">
              Your name, meter number, and barangay are locked because they were verified against the office&apos;s records, and the barangay decides which advisories you receive. Corrections are made through the SIWASS office.
            </p>
          </div>

          {/* Section 5: Editable Fields (Address & Home Location, Mobile Number, Email Address) */}
          <div className="border-t border-black/10 pt-3 divide-y divide-black/10 text-[14px]">
            {/* Address & Home Location on Map */}
            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <span className="text-xs font-semibold text-black/60 block">
                  Address (Purok or Street) & Home Location
                </span>
                <span className="text-black font-medium block">{addressStreet}</span>
                <span className="text-[11px] text-black/50 font-mono">
                  Home Coordinates: {Number(profile?.latitude ?? 8.2985).toFixed(5)},{' '}
                  {Number(profile?.longitude ?? 123.834).toFixed(5)}
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditAddress(addressStreet);
                  setEditLatitude(String(profile?.latitude ?? 8.2985));
                  setEditLongitude(String(profile?.longitude ?? 123.834));
                  setAddressError(null);
                  setShowEditAddressModal(true);
                }}
                leftIcon={<IconMapPin size={14} />}
                className="text-xs shrink-0"
              >
                Edit Address & Map
              </Button>
            </div>

            {/* Mobile Number (Section 5.2) */}
            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <span className="text-xs font-semibold text-black/60 block">Mobile Number</span>
                <span className="text-black font-medium font-mono">{mobileNumber}</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setNewMobileInput('');
                  setMobilePinSent(false);
                  setMobilePinInput('');
                  setMobileError(null);
                  setShowMobileModal(true);
                }}
                leftIcon={<IconPhone size={14} />}
                className="text-xs shrink-0"
              >
                Change mobile number
              </Button>
            </div>

            {/* Email Address (Section 5.3) */}
            <div className="flex items-center justify-between py-3 gap-3">
              <div>
                <span className="text-xs font-semibold text-black/60 block">Email Address</span>
                <span className="text-black font-medium">{emailAddress}</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setNewEmailInput('');
                  setEmailLinkSent(false);
                  setPendingEmailToken(null);
                  setEmailError(null);
                  setShowEmailModal(true);
                }}
                leftIcon={<IconMail size={14} />}
                className="text-xs shrink-0"
              >
                Change email
              </Button>
            </div>
          </div>

          {/* Section 4: Account Settings (Change Password & Log Out) */}
          <div className="border-t border-black/10 pt-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-black/60 pb-1">
              Account Settings
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setPasswordError('');
                  setPasswordSuccess(false);
                  setShowPasswordModal(true);
                }}
              >
                Change password
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-center text-xs"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
          </div>

          {/* Legal Consent & Account Status (Workflow Part A.5 & B.5) */}
          <div className="border-t border-black/10 pt-3 text-xs space-y-2">
            <span className="font-bold uppercase tracking-wider text-black/60 block text-[11px]">
              Terms, Privacy & Account Status
            </span>
            <div className="p-3 bg-blue-tint/30 border border-black/10 rounded-xl space-y-2 text-[12px] text-black">
              <div className="flex justify-between items-center">
                <span className="text-black/70 font-semibold">Terms of Use & Privacy Notice</span>
                <div className="flex items-center gap-2">
                  <Badge variant="blue">Version 1.0 (Accepted)</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs"
                  >
                    View
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-black/60">
                <span>Consent Date</span>
                <span>October 2026 (Registration)</span>
              </div>
              <p className="text-[11px] text-black/55 pt-1.5 border-t border-black/10 leading-relaxed">
                The customer cannot deactivate or delete the account online. Account cancellations and closures are handled in person at the SIWASS office.
              </p>
            </div>
          </div>
        </Card>

        {/* Modal 1: Edit Address (Purok/Street) & Home Location on Map (Section 5) */}
        {showEditAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h2 className="font-bold text-[14px] text-black">
                  Edit Address & Home Location
                </h2>
                <button
                  onClick={() => setShowEditAddressModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {addressError && (
                <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs text-black font-semibold">
                  {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddressAndLocation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                    Address (Purok or Street) *
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Purok 1, National Highway"
                    className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                    required
                  />
                  <span className="text-[11px] text-black/55 mt-1 block">
                    Several customers may share the same address. Move the home icon below to update your house location.
                  </span>
                </div>

                <LocationPickerMap
                  latitude={editLatitude}
                  longitude={editLongitude}
                  barangay={barangayName}
                  onChange={(lat, lng) => {
                    setEditLatitude(lat);
                    setEditLongitude(lng);
                  }}
                  showCoordinates={true}
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-black/10">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowEditAddressModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Save changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Change Mobile Number (Section 5.2: 6-digit SMS PIN, valid 10 mins, max 5 wrong attempts) */}
        {showMobileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h2 className="font-bold text-[14px] text-black">Change Mobile Number</h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {mobileError && (
                <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs text-black font-semibold">
                  {mobileError}
                </div>
              )}

              {!mobilePinSent ? (
                <form onSubmit={handleRequestMobilePin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                      New Philippine Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={newMobileInput}
                      onChange={(e) => setNewMobileInput(e.target.value)}
                      placeholder="09171234567"
                      className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                    <span className="text-[11px] text-black/55 mt-1 block">
                      We will send a 6-digit pin by SMS to the new number (valid for 10 minutes). Your old number stays in use until confirmed.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowMobileModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Send 6-Digit Pin
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmMobilePin} className="space-y-3.5">
                  <div className="p-3 bg-blue-tint border border-brand-blue/20 rounded-lg text-xs text-black space-y-1">
                    <div>
                      A 6-digit pin was sent by SMS to <strong>{newMobileInput}</strong> (valid for 10 minutes, cancelled after 5 wrong attempts).
                    </div>
                    {debugMobilePin && (
                      <div className="font-mono text-[11px] text-brand-blue font-bold">
                        Simulated SMS Pin: {debugMobilePin}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider text-center">
                      Enter 6-Digit SMS PIN
                    </label>
                    <OtpInput
                      value={mobilePinInput}
                      onChange={(val) => {
                        setMobilePinInput(val);
                        if (mobileError) setMobileError(null);
                      }}
                      error={mobileError}
                      onResend={() => handleRequestMobilePin()}
                      resendCooldown={30}
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-between gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setMobilePinSent(false);
                        setMobileError(null);
                      }}
                    >
                      Request New Pin
                    </Button>
                    <Button variant="primary" type="submit">
                      Confirm Pin
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal 3: Change Email Address (Section 5.3: Single-use confirmation link, valid 60 mins) */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h2 className="font-bold text-[14px] text-black">Change Email Address</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {emailError && (
                <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs text-black font-semibold">
                  {emailError}
                </div>
              )}

              {!emailLinkSent ? (
                <form onSubmit={handleRequestEmailLink} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="new.email@example.com"
                      className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                    <span className="text-[11px] text-black/55 mt-1 block">
                      We will send a single-use confirmation link to the new email address (valid for 60 minutes). Only one email change can be pending at a time.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Send Confirmation Link
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-blue-tint border border-brand-blue/20 rounded-lg space-y-1.5 text-black">
                    <div className="font-bold text-brand-blue">
                      Confirmation Link Sent to {newEmailInput}
                    </div>
                    <p className="text-black/70">
                      Open the single-use confirmation link within 60 minutes to save your new email address. Until opened, <strong>{emailAddress}</strong> stays in use.
                    </p>
                    {pendingEmailLinkUrl && (
                      <div className="font-mono text-[10px] text-black/60 break-all pt-1 border-t border-brand-blue/20">
                        {pendingEmailLinkUrl}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleOpenEmailConfirmationLink}
                    leftIcon={<IconLink size={14} />}
                    className="w-full justify-center"
                  >
                    Open Confirmation Link Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal 4: Change Password (Section 4) */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h2 className="font-bold text-[14px] text-black">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {passwordError && (
                <div className="p-2.5 bg-black/5 border border-black/20 text-black rounded-lg text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess ? (
                <div className="p-3 bg-blue-tint border border-brand-blue/30 rounded-lg text-center text-xs text-brand-blue font-bold">
                  Password changed successfully!
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                      New Password (min. 8 characters) *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-wider">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 text-[14px] bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <p className="text-[11px] text-black/55 leading-normal">
                    Changing your password will sign out your other signed-in sessions across all devices.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="justify-center text-xs"
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" className="justify-center text-xs">
                      Update Password
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal 5: Terms of Use & Privacy Notice Viewer (Section 12.A.5) */}
        <TermsPrivacyModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          version="v1.0.0"
          acceptedAt="October 2026 (Registration)"
        />
      </div>
    </CustomerLayout>
  );
}
