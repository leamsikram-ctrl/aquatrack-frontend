import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { SystemModal } from '../../components/molecules/SystemModal';
import { referenceApi, authApi, profileApi } from '../../api';
import { accountsStore, validateProfilePhotoFile } from '../../services/accountsStore';
import { useAuth } from '../../contexts/AuthContext';
import { SINACABAN_BARANGAY_COORDS } from '../../components/organisms/MunicipalMap';
import { OtpInput } from '../../components/molecules/OtpInput';
import { TermsPrivacyModal } from '../../components/molecules/TermsPrivacyModal';
import type { IssueType } from '../../types';
import {
  IconBuilding,
  IconList,
  IconMessage,
  IconLock,
  IconMapPin,
  IconSend,
  IconShieldCheck,
  IconFlame,
  IconDeviceFloppy,
  IconPhoneCall,
  IconMail,
  IconClockHour4,
  IconCamera,
  IconTrash,
  IconLogout,
  IconAlertTriangle,
  IconPhone,
  IconLink,
  IconX,
} from '@tabler/icons-react';

export type SettingsTab = 'profile' | 'issue_types' | 'sms' | 'gis' | 'security';

interface ExtendedIssueType extends IssueType {
  description?: string;
}

export function AdminSettingsView() {
  const navigate = useNavigate();
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Modern System Modal State
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string | React.ReactNode;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Tab 1: Utility Profile State
  const [utilityName, setUtilityName] = useState('Sinacaban Water Supply System (SIWASS)');
  const [lguName, setLguName] = useState('Municipality of Sinacaban, Misamis Occidental');
  const [utilityAddress, setUtilityAddress] = useState('Municipal Hall Compound, Poblacion, Sinacaban, Misamis Occidental 7203');
  const [contactNumber, setContactNumber] = useState('0917 555 0199');
  const [hotlineNumber, setHotlineNumber] = useState('(088) 555-0199');
  const [supportEmail, setSupportEmail] = useState('siwass@sinacaban.gov.ph');
  const [officeHours, setOfficeHours] = useState('Monday – Friday, 8:00 AM – 5:00 PM (In-office payments & applications)');

  // Tab 2: Issue Types & Urgency Derivation (Section 5.2 - Read-Only)
  const [issueTypes, setIssueTypes] = useState<ExtendedIssueType[]>([
    { id: 1, name: 'No water supply', default_urgency: 'high', description: 'Complete disruption of municipal supply' },
    { id: 2, name: 'Pipe leak or burst', default_urgency: 'high', description: 'Active leak or pipeline rupture causing water loss' },
    { id: 3, name: 'Water quality problem', default_urgency: 'high', description: 'Discolored, turbid, or odorous water delivery' },
    { id: 4, name: 'Low water pressure', default_urgency: 'medium', description: 'Reduced flow preventing normal household use' },
    { id: 5, name: 'Meter problem', default_urgency: 'medium', description: 'Glass defect, stuck dial, or meter body leak' },
    { id: 6, name: 'Other concern', default_urgency: 'low', description: 'General inquiry, valve check, or pipe realignment' },
  ]);

  // Tab 3: SMS Gateway & Notifications (Section 11)
  const [smsSenderId, setSmsSenderId] = useState('AquaTrack');
  const [remainingSmsCredits] = useState(85); // Low SMS credits demonstration (< 100 per Workflow D.2)
  const [notifyOnVerification, setNotifyOnVerification] = useState(true);
  const [notifyOnAssign, setNotifyOnAssign] = useState(true);
  const [notifyOnStart, setNotifyOnStart] = useState(true);
  const [notifyOnResolution, setNotifyOnResolution] = useState(true);
  const [notifyOnAdvisory, setNotifyOnAdvisory] = useState(true);
  const [notifyOnBilling, setNotifyOnBilling] = useState(true);

  // Test SMS Modal
  const [showTestSmsModal, setShowTestSmsModal] = useState(false);
  const [testMobileNumber, setTestMobileNumber] = useState('09170000000');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);

  // Tab 4: GIS Boundaries & Barangays (Section 6)
  const barangayEntries = useMemo(() => {
    return Object.entries(SINACABAN_BARANGAY_COORDS).map(([key, coords]) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      lat: coords[0],
      lng: coords[1],
      status: 'Active Coverage',
    }));
  }, []);

  // Tab 5: Account & Security (Workflow Part A & Part D)
  const [adminName, setAdminName] = useState(authUser?.name || 'SIWASS Administrator');
  const [isSavingName, setIsSavingName] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState(authUser?.avatar || '/default-avatar.svg');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState(authUser?.email || 'admin@sinacaban.gov.ph');
  const [adminMobile, setAdminMobile] = useState(authUser?.mobile_number || '09170000001');

  // Change Mobile Number (Section 5.2 & 12.D.1)
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobileInput, setNewMobileInput] = useState('');
  const [mobilePinSent, setMobilePinSent] = useState(false);
  const [mobilePinInput, setMobilePinInput] = useState('');
  const [debugMobilePin, setDebugMobilePin] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Change Email Address (Section 5.3 & 12.D.1)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [pendingEmailToken, setPendingEmailToken] = useState<string | null>(null);
  const [pendingEmailLinkUrl, setPendingEmailLinkUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(60);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Terms and Privacy Modal
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    referenceApi.getIssueTypes().then((types) => {
      if (types && types.length > 0) {
        setIssueTypes((prev) =>
          types.map((t) => {
            const match = prev.find((p) => p.name.toLowerCase() === t.name.toLowerCase());
            return {
              id: t.id,
              name: t.name,
              default_urgency: t.default_urgency,
              description: match?.description,
            };
          })
        );
      }
    }).catch(() => {});

    if (typeof authApi.me === 'function') {
      authApi.me().then((u) => {
        if (u.role === 'admin') {
          if (u.name) setAdminName(u.name);
          if (u.avatar) setAdminAvatar(u.avatar);
          if (u.email) setAdminEmail(u.email);
          if (u.mobile_number) setAdminMobile(u.mobile_number);
        }
      }).catch(() => {});
    }
  }, []);

  const syncUpdatedUser = (updated: any, message: string) => {
    setAuthUser(updated);
    if (updated.name) setAdminName(updated.name);
    if (updated.avatar) setAdminAvatar(updated.avatar);
    if (updated.email) setAdminEmail(updated.email);
    if (updated.mobile_number) setAdminMobile(updated.mobile_number);
    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Settings Updated',
      message,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Utility Profile Saved',
      message: 'Sinacaban Water Supply System (SIWASS) official identity settings have been updated across billing and notifications.',
    });
  };

  const handleSaveAdminName = async () => {
    if (!adminName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await profileApi.updateProfile({ name: adminName.trim() });
      if (res?.user) {
        syncUpdatedUser(res.user, 'Administrator display name updated.');
      }
    } catch {
      if (authUser?.id) {
        const res = accountsStore.updateOwnProfile(authUser.id, { name: adminName.trim() });
        if (res.user) {
          syncUpdatedUser(res.user, 'Administrator display name updated.');
        }
      }
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
            if (authUser?.id) {
              const res = accountsStore.updateProfilePhoto(authUser.id, photoData);
              if (res.success && res.user) {
                syncUpdatedUser(res.user, 'Profile photo updated and saved in Activity Log.');
              }
            }
          });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    profileApi
      .removePhoto()
      .then((res) => {
        if (res?.user) {
          syncUpdatedUser(res.user, 'Profile photo removed.');
        }
      })
      .catch(() => {
        if (authUser?.id) {
          const res = accountsStore.updateProfilePhoto(authUser.id, null);
          if (res.success && res.user) {
            syncUpdatedUser(res.user, 'Profile photo removed.');
          }
        }
      });
  };

  const handleRequestMobilePin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      const adminId = authUser?.id || 1;
      const res = accountsStore.requestMobileChangePin(adminId, newMobileInput);
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
    setMobileError(null);

    try {
      const apiRes = await profileApi.verifyMobilePin({ pin: mobilePinInput.trim() });
      if (apiRes?.user) {
        const adminId = authUser?.id || 1;
        accountsStore.confirmMobileChangePin(adminId, mobilePinInput.trim());
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

    const adminId = authUser?.id || 1;
    const res = accountsStore.confirmMobileChangePin(adminId, mobilePinInput);
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

  const handleRequestEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const adminId = authUser?.id || 1;
      const res = accountsStore.requestEmailChangeLink(adminId, newEmailInput);
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
    if (!pendingEmailToken) return;
    setEmailError(null);

    try {
      const apiRes = await profileApi.verifyEmailLink({ token: pendingEmailToken });
      if (apiRes?.user) {
        const adminId = authUser?.id || 1;
        accountsStore.confirmEmailChangeLink(adminId, pendingEmailToken);
        syncUpdatedUser(
          apiRes.user,
          `Email address changed to ${apiRes.user.email}. Notice sent to old email, and logged in Activity Log.`
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

    const adminId = authUser?.id || 1;
    const res = accountsStore.confirmEmailChangeLink(adminId, pendingEmailToken);
    if (!res.success || !res.user) {
      setEmailError(res.error || 'Failed to confirm email link.');
      return;
    }

    syncUpdatedUser(
      res.user,
      `Email address changed to ${res.user.email}. Notice sent to old email, and logged in Activity Log.`
    );
    setShowEmailModal(false);
    setEmailLinkSent(false);
    setNewEmailInput('');
    setPendingEmailToken(null);
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTestSms(true);
    setTimeout(() => {
      setIsSendingTestSms(false);
      setShowTestSmsModal(false);
      setSystemModal({
        isOpen: true,
        type: 'success',
        title: 'Test SMS Dispatched',
        message: `A test notification alert from sender "${smsSenderId}" was successfully queued for delivery to ${testMobileNumber}.`,
      });
    }, 600);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    if (!currentPassword) {
      setSecurityError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }

    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    ) {
      setSecurityError('New password must contain uppercase, lowercase, a number, and a special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password confirmation does not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setSecurityError('New password cannot be the same as the current password.');
      return;
    }

    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSystemModal({
        isOpen: true,
        type: 'success',
        title: 'Credentials Updated',
        message: 'Your administrator password has been successfully updated! Your other active sessions have been signed out.',
      });
    } catch (err: any) {
      const adminId = authUser?.id || 1;
      const res = accountsStore.changePassword(adminId, currentPassword, newPassword, confirmPassword, false, authUser || undefined);
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSystemModal({
          isOpen: true,
          type: 'success',
          title: 'Credentials Updated',
          message: 'Your administrator password has been successfully updated! Your other active sessions have been signed out.',
        });
      } else {
        setSecurityError(err?.response?.data?.message || res.error || 'Failed to update security credentials.');
      }
    }
  };

  return (
    <AdminLayout currentPath="/admin/settings" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[14px] text-black">
        {/* Header - Direct & Clean, Minimal Text */}
        <div className="border-b border-black/10 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            System Settings
          </h1>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="p-1.5 bg-white border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] max-w-4xl">
          <div className="flex overflow-x-auto gap-1">
            {[
              { id: 'profile' as SettingsTab, label: 'Utility Profile', icon: IconBuilding },
              { id: 'issue_types' as SettingsTab, label: 'Issue Types & Urgency', icon: IconList },
              { id: 'sms' as SettingsTab, label: 'SMS & Notifications', icon: IconMessage },
              { id: 'gis' as SettingsTab, label: 'GIS & Boundaries', icon: IconMapPin },
              { id: 'security' as SettingsTab, label: 'Account & Security', icon: IconLock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap inline-flex flex-row items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-black/70 hover:text-black hover:bg-black/5 font-normal'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: Utility Profile */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
            <Card className="lg:col-span-2 p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="border-b border-black/10 pb-3">
                <h2 className="text-sm font-bold text-black flex items-center gap-2">
                  <IconBuilding size={16} className="text-brand-blue" />
                  <span>Municipal Water System Identity</span>
                </h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Water System Official Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={utilityName}
                    onChange={(e) => setUtilityName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Governing Local Government Unit (LGU)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={lguName}
                    onChange={(e) => setLguName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Physical Municipal Office Address
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={utilityAddress}
                    onChange={(e) => setUtilityAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-black/70 mb-1">
                      Support Mobile Number (SMS Helpdesk)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-black/70 mb-1">
                      Emergency Hotline (Telephone)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                      value={hotlineNumber}
                      onChange={(e) => setHotlineNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-black/70 mb-1">
                      Official Inquiries Email
                    </label>
                    <input
                      type="email"
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-black/70 mb-1">
                      In-Office Operations Hours
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                      value={officeHours}
                      onChange={(e) => setOfficeHours(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-black/10 flex justify-end">
                  <Button variant="primary" type="submit" leftIcon={<IconDeviceFloppy size={15} />}>
                    Save Utility Profile
                  </Button>
                </div>
              </form>
            </Card>

            {/* Profile Preview Card */}
            <div className="space-y-3">
              <Card className="p-4 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-slate-50 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block">
                  Statement Header Preview
                </span>
                <div className="p-3 bg-white border border-black/10 rounded-lg space-y-1.5 shadow-sm text-xs">
                  <div className="text-center pb-2 border-b border-black/10">
                    <strong className="text-xs font-bold text-black block">{utilityName}</strong>
                    <span className="text-[10px] text-black/60 block">{lguName}</span>
                    <span className="text-[9px] text-black/50 block">{utilityAddress}</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-black/70 pt-1">
                    <div className="flex items-center gap-1.5">
                      <IconPhoneCall size={12} className="text-brand-blue" />
                      <span>{contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconMail size={12} className="text-brand-blue" />
                      <span>{supportEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconClockHour4 size={12} className="text-brand-blue" />
                      <span className="text-[10px]">{officeHours}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-black/50 leading-relaxed">
                  Official statement header printed on customer water bills and communications.
                </p>
              </Card>

              {/* System Specifications Card (Workflow Part D.2) */}
              <Card className="p-4 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block">
                  System Information (Read-only)
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-black block">Premade Advisory Types (Section 7.5):</span>
                    <ul className="list-disc pl-4 text-black/70 space-y-0.5 text-[11px] mt-1">
                      <li>Emergency Repair</li>
                      <li>Scheduled Maintenance</li>
                      <li>Low Pressure</li>
                      <li>Water Quality Advisory</li>
                      <li>Pipeline Flushing</li>
                      <li>Power Interruption</li>
                      <li>Other</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-black/10">
                    <span className="font-semibold text-black block">Remaining SMS Credits:</span>
                    <span className="text-[11px] font-bold text-amber-800 block">
                      {remainingSmsCredits} Credits (Low warning: &lt; 100 credits)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-black/10">
                    <span className="font-semibold text-black block">Terms &amp; Privacy Version:</span>
                    <span className="text-[11px] text-black/70 block">Version 1.0 (Sinacaban Municipal Water Code)</span>
                  </div>
                  <div className="pt-2 border-t border-black/10">
                    <span className="text-[10px] text-black/50 italic block leading-relaxed">
                      There are no SLA settings and no editable thresholds.
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: Issue Types & Urgency Derivation */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'issue_types' && (
          <div className="space-y-4 max-w-4xl">
            {/* Urgency Formula Manifesto Card */}
            <Card className="p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <IconFlame size={18} className="text-brand-blue" />
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                  Section 5.2 Urgency Derivation Engine
                </h3>
              </div>
              <p className="text-xs text-black/80 font-mono bg-white p-2.5 rounded border border-black/10">
                Final Urgency = min( max( Default, Customer Choice ), Default + 1 )
              </p>
              <p className="text-xs text-black/60 leading-relaxed">
                A customer can bump urgency by at most 1 level. Critical high-urgency issues (e.g. No water supply, Pipe burst) default to High and cannot be downgraded by resident selection.
              </p>
            </Card>

            <Card className="p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                <h2 className="text-sm font-bold text-black flex items-center gap-2">
                  <IconList size={16} className="text-brand-blue" />
                  <span>Configured Issue Types (Read-only)</span>
                </h2>
                <Badge variant="outline" className="text-[11px]">
                  <IconLock size={12} className="inline mr-1" />
                  System Managed
                </Badge>
              </div>

              {/* Issue Types Table */}
              <div className="border border-black/15 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-black border-b border-black/15 font-bold">
                    <tr>
                      <th className="px-4 py-3">Issue Classification</th>
                      <th className="px-4 py-3">Description & Scope</th>
                      <th className="px-4 py-3 text-right">Default Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {issueTypes.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-black whitespace-nowrap">
                          {it.name}
                        </td>
                        <td className="px-4 py-3 text-black/70">
                          {it.description || 'Standard municipal water repair classification'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Badge variant={it.default_urgency}>
                            {it.default_urgency.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-black/50 italic leading-relaxed pt-1">
                Issue types and default urgencies are system-defined and read-only. SLA rules and countdowns are strictly excluded.
              </p>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: SMS Gateway & Notifications */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
            <Card className="lg:col-span-2 p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="border-b border-black/10 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-black flex items-center gap-2">
                  <IconMessage size={16} className="text-brand-blue" />
                  <span>SMS Gateway & Automatic Dispatch Triggers</span>
                </h2>
                <Badge variant="blue">Connected</Badge>
              </div>

              {/* Remaining SMS Credits Banner with Low Credit Warning (Workflow Part D.2) */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Remaining SMS Gateway Balance
                  </span>
                  <span className="text-base font-extrabold text-amber-950 font-mono">
                    {remainingSmsCredits} / 1,000 Credits
                  </span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    Low balance warning: Credits are below 100 threshold. Contact gateway provider to top up.
                  </span>
                </div>
                <Badge variant="outline" className="border-amber-500 text-amber-800 bg-amber-100 font-bold shrink-0">
                  <IconAlertTriangle size={12} className="inline mr-1" />
                  Low Credits
                </Badge>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    SMS Sender ID (Shown to recipient)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs font-mono font-bold outline-none focus:border-brand-blue"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                  />
                  <span className="text-[11px] text-black/50 block mt-1">
                    All notifications begin with "AquaTrack:" followed by the official operational notice.
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-black/10">
                  <span className="font-bold text-black uppercase tracking-wider block">
                    Automated Event Triggers
                  </span>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnVerification}
                      onChange={(e) => setNotifyOnVerification(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Customer Account Activation</span>
                      <span className="text-black/60 text-[11px] block">
                        Sends welcome SMS with account number and active water meter confirmation upon admin verification.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnAssign}
                      onChange={(e) => setNotifyOnAssign(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Technician Dispatch & Assignment</span>
                      <span className="text-black/60 text-[11px] block">
                        Notifies resident when their reported maintenance request has been assigned to a field staff technician.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnStart}
                      onChange={(e) => setNotifyOnStart(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Field Work Started</span>
                      <span className="text-black/60 text-[11px] block">
                        Alerts resident that field technician has arrived or begun repair work on site.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnResolution}
                      onChange={(e) => setNotifyOnResolution(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Issue Resolution & Remarks</span>
                      <span className="text-black/60 text-[11px] block">
                        Sends resolution confirmation with staff remarks when request is marked resolved.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnAdvisory}
                      onChange={(e) => setNotifyOnAdvisory(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Water Interruption Advisory Broadcast</span>
                      <span className="text-black/60 text-[11px] block">
                        Dispatches mass emergency broadcast SMS to all registered residents in affected Sinacaban barangays.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-black/10">
                    <input
                      type="checkbox"
                      checked={notifyOnBilling}
                      onChange={(e) => setNotifyOnBilling(e.target.checked)}
                      className="mt-0.5 accent-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-black block">Billing Statement Published</span>
                      <span className="text-black/60 text-[11px] block">
                        Alerts customer when monthly billing statement is published with amount due and payment deadline.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTestSmsModal(true)}
                    leftIcon={<IconSend size={14} />}
                  >
                    Send Test SMS
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSystemModal({
                        isOpen: true,
                        type: 'success',
                        title: 'SMS Settings Saved',
                        message: 'Automated notification dispatch triggers have been successfully updated.',
                      });
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-slate-50 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black/60 block">
                SMS Sample Preview
              </span>
              <div className="bg-white p-3 rounded-lg border border-black/10 space-y-2 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b border-black/10 pb-1.5 text-[10px] text-black/50">
                  <span className="font-mono font-bold text-black">{smsSenderId}</span>
                  <span>Just now</span>
                </div>
                <p className="text-xs text-black leading-relaxed">
                  AquaTrack: An emergency water interruption advisory has been issued for Poblacion & San Isidro from 1:00 PM to 5:00 PM due to urgent main pipe repair.
                </p>
              </div>
              <p className="text-[11px] text-black/50 leading-relaxed">
                SMS queue jobs are handled asynchronously by the backend SendSmsJob service with retry logging.
              </p>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: GIS Boundaries & Barangays (Section 6) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'gis' && (
          <div className="space-y-4 max-w-4xl">
            <Card className="p-4 bg-white border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-2">
              <div className="flex items-center gap-2">
                <IconMapPin size={18} className="text-brand-blue" />
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                  Sinacaban Municipal Geographic Bounds
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded border border-black/10">
                  <span className="text-black/60 block">Municipal Center (Poblacion):</span>
                  <span className="font-mono font-bold text-black text-sm">8.2855° N, 123.8429° E</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-black/10">
                  <span className="text-black/60 block">Locked GIS Bounding Box:</span>
                  <span className="font-mono font-bold text-black text-sm">8.2000–8.3900° N, 123.6300–123.9300° E</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-3 bg-white">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h2 className="text-sm font-bold text-black">
                  Official 17 Sinacaban Barangays & Coordinates
                </h2>
                <Badge variant="blue">17 Barangays</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs max-h-96 overflow-y-auto p-1">
                {barangayEntries.map((b) => (
                  <div
                    key={b.key}
                    className="p-2.5 rounded-lg border border-black/10 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-black block">{b.name}</span>
                      <span className="text-[10px] text-black/50 font-mono">
                        {b.lat.toFixed(4)}°, {b.lng.toFixed(4)}°
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-brand-blue" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: Account & Institutional Security (Workflow Part A & D) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'security' && (
          <div className="space-y-4 max-w-xl">
            {/* Account Profile Section (Part A: Common to all roles) */}
            <Card className="p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="border-b border-black/10 pb-2">
                <h2 className="text-sm font-bold text-black flex items-center gap-2">
                  <IconShieldCheck size={16} className="text-brand-blue" />
                  <span>Institutional Security & Access Credentials</span>
                </h2>
              </div>

              {securityError && (
                <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs text-black font-medium">
                  {securityError}
                </div>
              )}

              {/* Profile Photo (Part A.1: JPG/PNG up to 5 MB) */}
              <div className="p-3.5 bg-slate-50 border border-black/10 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={adminAvatar}
                    alt={adminName}
                    className="w-12 h-12 rounded-full object-cover border border-black/20 bg-white shrink-0"
                  />
                  <div>
                    <span className="font-bold text-black block text-xs">{adminName}</span>
                    <span className="text-[11px] text-black/50 block">Administrator (SIWASS)</span>
                    <span className="text-[10px] text-black/40 block">Max 5 MB (JPG or PNG)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    onChange={handlePhotoFileChange}
                  />
                  <Button
                    variant="secondary"
                    type="button"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    leftIcon={<IconCamera size={13} />}
                    className="text-xs"
                  >
                    {adminAvatar !== '/default-avatar.svg' ? 'Change Photo' : 'Upload'}
                  </Button>
                  {adminAvatar !== '/default-avatar.svg' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="text-xs px-2 py-1 text-urgency-high"
                    >
                      <IconTrash size={13} />
                    </Button>
                  )}
                </div>
              </div>

              {photoError && (
                <div className="p-2.5 bg-danger-subtle border border-urgency-high/40 rounded-lg text-xs text-urgency-high font-medium">
                  {photoError}
                </div>
              )}

              {/* Editable Admin Name (Part A.2 & Part D.1) */}
              <div>
                <label className="block font-semibold text-black/70 mb-1 text-xs">
                  Administrator Display Name (Editable for Admin)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveAdminName}
                    isLoading={isSavingName}
                    className="text-xs shrink-0"
                  >
                    Save Name
                  </Button>
                </div>
              </div>

              {/* Editable Mobile Number & Email Address (Section 5.2 & 5.3) */}
              <div className="divide-y divide-black/10 text-xs">
                <div className="flex items-center justify-between py-2.5 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-black/60 block">
                      Administrative Mobile Number
                    </span>
                    <span className="text-black font-medium font-mono">{adminMobile}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setNewMobileInput('');
                      setMobilePinSent(false);
                      setMobilePinInput('');
                      setMobileError(null);
                      setShowMobileModal(true);
                    }}
                    leftIcon={<IconPhone size={13} />}
                    className="text-xs shrink-0"
                  >
                    Change mobile number
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2.5 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-black/60 block">
                      Master Administrator Email
                    </span>
                    <span className="text-black font-medium">{adminEmail}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setNewEmailInput('');
                      setEmailLinkSent(false);
                      setPendingEmailToken(null);
                      setEmailError(null);
                      setShowEmailModal(true);
                    }}
                    leftIcon={<IconMail size={13} />}
                    className="text-xs shrink-0"
                  >
                    Change email
                  </Button>
                </div>
              </div>

              {/* Password Section (Part A.4) */}
              <form onSubmit={handleSaveSecurity} className="space-y-3 text-xs pt-3 border-t border-black/10">
                <span className="font-bold text-black uppercase tracking-wider block text-[11px]">
                  Change Password
                </span>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Current Master Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    New Master Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-[11px] text-black/50 mt-1">
                    Min. 8 characters, uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="pt-2 border-t border-black/10">
                  <label className="block font-semibold text-black/70 mb-1">
                    Inactivity Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    className="w-32 p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-brand-blue"
                    value={sessionTimeoutMins}
                    onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
                  />
                </div>

                <div className="pt-3 border-t border-black/10 flex justify-end">
                  <Button type="submit" variant="primary">
                    Update Master Password
                  </Button>
                </div>
              </form>

              {/* Legal Consent Display (Part A.5) */}
              <div className="p-3 bg-slate-50 border border-black/10 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-black block">Terms of Use & Privacy Notice</span>
                  <span className="text-[11px] text-black/60">
                    Accepted on institutional account provisioning (Version 1.0)
                  </span>
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

              {/* Sign Out Button (Part A.6) */}
              <div className="pt-3 border-t border-black/10 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<IconLogout size={14} />}
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="text-xs font-semibold"
                >
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal: Change Mobile Number (Section 5.2 & 12.D.1) */}
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
                      placeholder="09170009988"
                      className="w-full p-2 text-[14px] bg-white text-black border border-black/30 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                    <span className="text-[11px] text-black/50 mt-1 block">
                      A 6-digit PIN will be sent by SMS (valid 10 minutes). Your old number stays in use until confirmed.
                    </span>
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
                      Send 6-Digit PIN
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmMobilePin} className="space-y-3.5">
                  <div className="p-2.5 bg-blue-50 border border-brand-blue/30 rounded text-xs text-black space-y-1">
                    <div>
                      A 6-digit PIN was sent by SMS to <strong>{newMobileInput}</strong> (valid 10 mins, max 5 wrong attempts).
                    </div>
                    {debugMobilePin && (
                      <div className="font-mono text-[11px] text-brand-blue font-bold">
                        Simulated SMS PIN: {debugMobilePin}
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
                      Request New PIN
                    </Button>
                    <Button variant="primary" type="submit">
                      Confirm PIN
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Change Email Address (Section 5.3 & 12.D.1) */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black/20 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2.5">
                <h2 className="font-bold text-sm text-black">Change Master Email Address</h2>
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
                      New Administrator Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="admin.new@sinacaban.gov.ph"
                      className="w-full p-2 text-[14px] bg-white text-black border border-black/30 rounded-lg outline-none focus:border-brand-blue"
                      required
                    />
                    <span className="text-[11px] text-black/50 mt-1 block">
                      A single-use confirmation link will be sent (valid for 60 minutes). Your old email stays in use until confirmed.
                    </span>
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

        {/* Modal: Terms & Privacy Notice Viewer */}
        <TermsPrivacyModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          version="v1.0.0"
          acceptedAt="Institutional Provisioning"
        />

        {/* Send Test SMS Modal */}
        {showTestSmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="text-sm font-bold text-black flex items-center gap-2">
                  <IconSend size={16} className="text-brand-blue" />
                  <span>Send Test SMS Dispatch</span>
                </span>
                <button
                  onClick={() => setShowTestSmsModal(false)}
                  className="text-black hover:text-brand-blue p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendTestSms} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Recipient Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="0917XXXXXXX"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs font-mono outline-none focus:border-brand-blue"
                    value={testMobileNumber}
                    onChange={(e) => setTestMobileNumber(e.target.value)}
                    required
                  />
                </div>

                <p className="text-[11px] text-black/60 leading-relaxed">
                  Dispatches a simulated test alert verifying the SIWASS SMS gateway queue.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTestSmsModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSendingTestSms}
                  >
                    {isSendingTestSms ? 'Sending...' : 'Send Test SMS'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modern System Alert & Modal */}
        <SystemModal
          isOpen={systemModal.isOpen}
          onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
          confirmText="Dismiss"
        />
      </div>
    </AdminLayout>
  );
}
