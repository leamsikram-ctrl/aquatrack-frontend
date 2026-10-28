import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { authApi, profileApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { OtpInput } from '../../components/molecules/OtpInput';
import { TermsPrivacyModal } from '../../components/molecules/TermsPrivacyModal';
import { DownloadMobileAppCard } from '../../components/molecules/DownloadMobileAppCard';
import {
  accountsStore,
  validateProfilePhotoFile,
} from '../../services/accountsStore';
import type { User } from '../../types';
import {
  IconLock,
  IconCheck,
  IconCamera,
  IconTrash,
  IconPhone,
  IconMail,
  IconAlertCircle,
  IconX,
  IconLink,
} from '@tabler/icons-react';

export function StaffProfileView() {
  const navigate = useNavigate();
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(() => {
    const local = authUser?.email
      ? accountsStore.getUserByEmail(authUser.email)
      : (authUser?.id ? accountsStore.getUserById(authUser.id) : accountsStore.getUserByEmail('staff@siwass.gov'));
    return (local && local.role === 'staff' ? local : null) || authUser;
  });
  const [isLoading, setIsLoading] = useState(true);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Change Mobile Number (Section 5.2)
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobileInput, setNewMobileInput] = useState('');
  const [mobilePinSent, setMobilePinSent] = useState(false);
  const [mobilePinInput, setMobilePinInput] = useState('');
  const [debugMobilePin, setDebugMobilePin] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Change Email Address (Section 5.3)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [pendingEmailToken, setPendingEmailToken] = useState<string | null>(null);
  const [pendingEmailLinkUrl, setPendingEmailLinkUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Modal: Terms of Use & Privacy Notice Viewer
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const localAccount = authUser?.email
      ? accountsStore.getUserByEmail(authUser.email)
      : (authUser?.id ? accountsStore.getUserById(authUser.id) : accountsStore.getUserByEmail('staff@siwass.gov'));
    if (localAccount && localAccount.role === 'staff') {
      setUser(localAccount);
    }

    authApi
      .me()
      .then((u) => {
        if (u.role === 'staff') {
          const stored = u.email ? accountsStore.getUserByEmail(u.email) : accountsStore.getUserById(u.id);
          setUser((stored && stored.role === 'staff') ? { ...stored, ...u } : u);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [authUser?.id, authUser?.email]);

  const syncUpdatedUser = (updated: User, message: string) => {
    setUser(updated);
    setAuthUser(updated);
    setFeedbackNotice(message);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  // Section 5.1: Upload / Change / Remove Profile Photo
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

  // Section 5.2 & 12.B.2: Request 6-digit SMS Pin
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

  // Section 5.3 & 12.B.2: Request Single-Use Email Confirmation Link
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

  const handleOpenEmailConfirmationLink = async () => {
    if (!user || !pendingEmailToken) return;
    setEmailError(null);

    try {
      const apiRes = await profileApi.verifyEmailLink({ token: pendingEmailToken });
      if (apiRes?.user) {
        accountsStore.confirmEmailChangeLink(user.id, pendingEmailToken);
        syncUpdatedUser(
          apiRes.user,
          `Email address changed to ${apiRes.user.email}. In-app notification sent, notice sent to old email, and logged in Activity Log.`
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
      `Email address changed to ${res.user.email}. In-app notification sent, notice sent to old email, and logged in Activity Log.`
    );
    setShowEmailModal(false);
    setEmailLinkSent(false);
    setNewEmailInput('');
    setPendingEmailToken(null);
  };

  // Section 4 & 12.B.2: Change Password (signs out other sessions)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError(null);

    setIsChangingPassword(true);
    try {
      const apiRes = await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setIsChangingPassword(false);
      setPasswordSuccess('Password successfully updated! Your other active sessions have been signed out.');
      if (apiRes?.user) {
        syncUpdatedUser(apiRes.user, 'Password changed and saved in Activity Log.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordModal(false);
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
      setIsChangingPassword(false);

      if (!res.success || !res.user) {
        setPasswordError(err?.response?.data?.message || res.error || 'Failed to change password.');
        return;
      }

      setPasswordSuccess('Password successfully updated! Your other active sessions have been signed out.');
      syncUpdatedUser(res.user, 'Password changed and saved in Activity Log.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordModal(false);
      }, 1400);
    }
  };

  const staffName = user?.name || user?.staff_profile?.name || 'Pedro Cruz';
  const assignedArea = user?.staff_profile?.assigned_barangay?.name
    ? `Sinacaban - ${user.staff_profile.assigned_barangay.name}`
    : 'Sinacaban Municipal Sector 1';
  const mobileNumber = user?.mobile_number || '09175550101';
  const emailAddress = user?.email || 'staff@siwass.gov';
  const hasCustomAvatar = Boolean(user?.avatar && user.avatar !== '/default-avatar.svg');
  const avatarUrl = user?.avatar || '/default-avatar.svg';

  return (
    <StaffLayout
      currentPath="/staff/profile"
      onNavigate={(path) => navigate(path)}
      staffName={staffName}
      assignedArea={assignedArea}
    >
      <div className="space-y-4 max-w-xl">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Profile & Account Settings
          </h1>
        </div>

        {feedbackNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-[13px] text-emerald-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconCheck size={16} className="text-urgency-low shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="p-1 text-emerald-800 hover:text-black cursor-pointer"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        <Card className="p-5 border border-black/15 shadow-sm space-y-4 bg-white text-[14px]">
          {isLoading ? (
            <div className="py-8 text-center text-black/50 text-[14px] font-normal">
              Loading staff credentials...
            </div>
          ) : (
            <>
              {/* Section 5.1: Avatar + Name + Upload/Remove Photo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={avatarUrl}
                    alt={staffName}
                    className="w-14 h-14 rounded-full object-cover border border-black/20 shrink-0 bg-slate-100"
                  />
                  <div>
                    <h2 className="text-base font-bold text-black">{staffName}</h2>
                    <p className="text-xs text-black/60 font-normal">{assignedArea}</p>
                    <p className="text-[11px] text-black/50 mt-0.5">
                      Accepted photo formats: JPG, PNG (Max 5 MB)
                    </p>
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
                    className="text-xs min-h-[44px]"
                  >
                    {hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {hasCustomAvatar && (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleRemovePhoto}
                      leftIcon={<IconTrash size={14} />}
                      className="text-xs text-urgency-high min-h-[44px]"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {photoError && (
                <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 rounded text-xs font-medium text-urgency-high flex items-center gap-2">
                  <IconAlertCircle size={15} className="shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Locked Verified Details (Workflow Part C.2: full name, role, and assigned barangays) */}
              <div className="p-3 bg-slate-50 border border-black/10 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                    Verified Staff Assignment
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    <IconLock size={11} className="inline mr-1" />
                    Locked (Office Record)
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-black/60 text-[11px] block">Full Name</span>
                    <span className="font-semibold text-black">{staffName}</span>
                  </div>
                  <div>
                    <span className="text-black/60 text-[11px] block">System Role</span>
                    <span className="font-semibold text-black">Field Technician / Staff</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-black/60 text-[11px] block">Assigned Barangays</span>
                    <span className="font-semibold text-brand-blue">{assignedArea}</span>
                  </div>
                </div>
                <p className="text-[10px] text-black/50 pt-1 border-t border-black/10 leading-relaxed">
                  Full name, role, and assigned barangays are set by the SIWASS administrator and can only be modified through User Management.
                </p>
              </div>

              {/* Editable Mobile Number & Email Address (Section 5.2 & 5.3) */}
              <div className="divide-y divide-black/10 text-[14px]">
                <div className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-black/60 block">
                      Mobile Number
                    </span>
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
                    className="text-xs shrink-0 min-h-[44px]"
                  >
                    Change mobile number
                  </Button>
                </div>

                <div className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-black/60 block">
                      Email Address
                    </span>
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
                    className="text-xs shrink-0 min-h-[44px]"
                  >
                    Change email
                  </Button>
                </div>
              </div>

              {/* Section 4: Account Settings (Change Password & Log Out) */}
              <div className="pt-3 border-t border-black/15 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-black/60 pb-1">
                  Account Settings
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-center min-h-[44px]"
                    onClick={() => {
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      setShowPasswordModal(true);
                    }}
                  >
                    Change password
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full justify-center min-h-[44px]"
                    onClick={handleLogout}
                  >
                    Log out
                  </Button>
                </div>
              </div>

              {/* Legal Consent Info (Workflow Part A.5) */}
              <div className="p-3 bg-slate-50 border border-black/10 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-black block">Terms of Use & Privacy Notice</span>
                  <span className="text-[11px] text-black/60">Accepted on first login (Version 1.0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue">Accepted</Badge>
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
            </>
          )}
        </Card>

        {/* Mobile App Download Card (no sync controls here) */}
        <DownloadMobileAppCard downloadUrl="/downloads/aquatrack-scanner.apk" />

        {/* Modal: Change Mobile Number (Section 5.2) */}
        {showMobileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/20 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2.5">
                <h2 className="font-bold text-sm text-black">Change Mobile Number</h2>
                <button
                  onClick={() => setShowMobileModal(false)}
                  className="text-black/60 hover:text-black p-1 cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {mobileError && (
                <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 rounded text-xs text-urgency-high font-medium">
                  {mobileError}
                </div>
              )}

              {!mobilePinSent ? (
                <form onSubmit={handleRequestMobilePin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">
                      New Philippine Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={newMobileInput}
                      onChange={(e) => setNewMobileInput(e.target.value)}
                      placeholder="09175559988"
                      className="w-full p-2 text-[14px] bg-white text-black border border-black/30 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
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
                  <div className="p-2.5 bg-blue-50 border border-brand-blue/30 rounded text-xs text-black space-y-1">
                    <div>
                      A 6-digit pin was sent by SMS to <strong>{newMobileInput}</strong> (valid 10 mins, max 5 wrong attempts).
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

                  <div className="flex justify-between gap-2 pt-2 border-t border-black/15">
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

        {/* Modal: Change Email Address (Section 5.3) */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/20 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2.5">
                <h2 className="font-bold text-sm text-black">Change Email Address</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-black/60 hover:text-black p-1 cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              {emailError && (
                <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 rounded text-xs text-urgency-high font-medium">
                  {emailError}
                </div>
              )}

              {!emailLinkSent ? (
                <form onSubmit={handleRequestEmailLink} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="staff.new@sinacaban.gov.ph"
                      className="w-full p-2 text-[14px] bg-white text-black border border-black/30 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
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
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 border border-brand-blue/30 rounded-lg space-y-1.5 text-black">
                    <div className="font-bold text-brand-blue">
                      Confirmation Link Sent to {newEmailInput}
                    </div>
                    <p className="text-black/70">
                      Open the single-use confirmation link within 60 minutes to confirm your new email address.
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

        {/* Modal: Change Password (Section 4) */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/20 p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconLock size={16} className="text-brand-blue" />
                  <h2 className="text-sm font-bold text-black">Change Password</h2>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-black hover:text-brand-blue p-1 text-[14px]"
                >
                  ✕
                </button>
              </div>

              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center gap-2">
                  <IconCheck size={16} className="text-urgency-low shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 text-xs text-urgency-high font-medium rounded">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black/30 rounded-lg text-[14px] outline-none"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">
                    New Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black/30 rounded-lg text-[14px] outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black/70 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black/30 rounded-lg text-[14px] outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isChangingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal: Terms of Use & Privacy Notice Viewer */}
        <TermsPrivacyModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          version="v1.0.0"
          acceptedAt="First Login"
        />
      </div>
    </StaffLayout>
  );
}
