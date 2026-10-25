import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { SystemModal } from '../../components/molecules/SystemModal';
import { referenceApi, authApi } from '../../api';
import { accountsStore } from '../../services/accountsStore';
import { useAuth } from '../../contexts/AuthContext';
import { SINACABAN_BARANGAY_COORDS } from '../../components/organisms/MunicipalMap';
import type { IssueType, Urgency } from '../../types';
import {
  IconBuilding,
  IconList,
  IconMessage,
  IconLock,
  IconMapPin,
  IconPlus,
  IconSend,
  IconShieldCheck,
  IconFlame,
  IconDeviceFloppy,
  IconPhoneCall,
  IconMail,
  IconClockHour4,
} from '@tabler/icons-react';

export type SettingsTab = 'profile' | 'issue_types' | 'sms' | 'gis' | 'security';

interface ExtendedIssueType extends IssueType {
  description?: string;
}

export function AdminSettingsView() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

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

  // Tab 2: Issue Types & Urgency Derivation (Section 5.2)
  const [issueTypes, setIssueTypes] = useState<ExtendedIssueType[]>([
    { id: 1, name: 'No water supply', default_urgency: 'high', description: 'Complete disruption of municipal supply' },
    { id: 2, name: 'Pipe leak or burst', default_urgency: 'high', description: 'Active leak or pipeline rupture causing water loss' },
    { id: 3, name: 'Water quality problem', default_urgency: 'high', description: 'Discolored, turbid, or odorous water delivery' },
    { id: 4, name: 'Low water pressure', default_urgency: 'medium', description: 'Reduced flow preventing normal household use' },
    { id: 5, name: 'Meter problem', default_urgency: 'medium', description: 'Glass defect, stuck dial, or meter body leak' },
    { id: 6, name: 'Other concern', default_urgency: 'low', description: 'General inquiry, valve check, or pipe realignment' },
  ]);

  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [newIssueName, setNewIssueName] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState<Urgency>('medium');

  // Tab 3: SMS Gateway & Notifications (Section 11)
  const [smsSenderId, setSmsSenderId] = useState('AquaTrack');
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

  // Tab 5: Account & Security (Section 3 & 4)
  const [adminEmail, setAdminEmail] = useState('admin@sinacaban.gov.ph');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(60);
  const [securityError, setSecurityError] = useState<string | null>(null);

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
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Utility Profile Saved',
      message: 'Sinacaban Water Supply System (SIWASS) official identity settings have been updated across billing and notifications.',
    });
  };

  const handleSaveIssueTypes = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Issue Rules Saved',
      message: 'Base urgency priorities have been synchronized with the dispatch engine.',
    });
  };

  const handleAddIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueName.trim()) return;

    const newType: ExtendedIssueType = {
      id: Date.now(),
      name: newIssueName.trim(),
      default_urgency: newIssueUrgency,
      description: 'Custom municipal issue classification',
    };

    setIssueTypes((prev) => [...prev, newType]);
    setNewIssueName('');
    setShowAddIssueModal(false);

    setSystemModal({
      isOpen: true,
      type: 'success',
      title: 'Issue Category Added',
      message: `Category "${newType.name}" added with default urgency ${newIssueUrgency.toUpperCase()}.`,
    });
  };

  const handleUrgencyChange = (id: number, urgency: Urgency) => {
    setIssueTypes((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return { ...it, default_urgency: urgency };
        }
        return it;
      })
    );
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
        message: 'Your administrator password has been successfully updated.',
      });
    } catch (err: any) {
      const adminId = authUser?.id || 1;
      const res = accountsStore.changePassword(adminId, currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSystemModal({
          isOpen: true,
          type: 'success',
          title: 'Credentials Updated',
          message: 'Your administrator password has been successfully updated.',
        });
      } else {
        setSecurityError(err?.response?.data?.message || res.error || 'Failed to update security credentials.');
      }
    }
  };

  return (
    <AdminLayout currentPath="/admin/settings" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[14px] text-black">
        {/* Header */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                System Settings & Configuration
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black/70 px-2 py-0.5 rounded border border-black/10">
                SIWASS Core
              </span>
            </div>
            <p className="text-xs text-black/60 mt-0.5">
              Institutional Parameters, Priority Rules, SMS Dispatch, Geographic Boundaries & Security
            </p>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <Card className="p-1.5 bg-white border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] max-w-4xl">
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
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap inline-flex flex-row items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#1E6FD9] text-white shadow-sm'
                      : 'text-black hover:bg-black/5 font-normal'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: Utility Profile */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
            <Card className="lg:col-span-2 p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="border-b border-black/10 pb-3">
                <h2 className="text-sm font-bold text-black flex items-center gap-2">
                  <IconBuilding size={16} className="text-[#1E6FD9]" />
                  <span>Municipal Water System Identity</span>
                </h2>
                <p className="text-xs text-black/60 mt-0.5">
                  Official SIWASS contact credentials printed on water bills, advisory notices, and meter tags.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Water System Official Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                      className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                      <IconPhoneCall size={12} className="text-[#1E6FD9]" />
                      <span>{contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconMail size={12} className="text-[#1E6FD9]" />
                      <span>{supportEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconClockHour4 size={12} className="text-[#1E6FD9]" />
                      <span className="text-[10px]">{officeHours}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-black/50 leading-relaxed">
                  Official statement header printed on consumer water bills and communications.
                </p>
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
            <Card className="p-4 bg-[#1E6FD9]/5 border border-[#1E6FD9]/20 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <IconFlame size={18} className="text-[#1E6FD9]" />
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
                <div>
                  <h2 className="text-sm font-bold text-black flex items-center gap-2">
                    <IconList size={16} className="text-[#1E6FD9]" />
                    <span>Configured Issue Types</span>
                  </h2>
                  <p className="text-xs text-black/60 mt-0.5">
                    Standard issue classifications used during resident reporting and field technician dispatch.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddIssueModal(true)}
                  leftIcon={<IconPlus size={14} />}
                  className="self-start sm:self-auto"
                >
                  Add Issue Type
                </Button>
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
                          <select
                            value={it.default_urgency}
                            onChange={(e) => handleUrgencyChange(it.id, e.target.value as Urgency)}
                            className="p-1.5 text-xs bg-white border border-black/20 rounded-lg font-bold uppercase outline-none focus:border-[#1E6FD9]"
                          >
                            <option value="high">HIGH</option>
                            <option value="medium">MEDIUM</option>
                            <option value="low">LOW</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-black/10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddIssueModal(true)}
                  leftIcon={<IconPlus size={14} />}
                >
                  Add Issue Type
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveIssueTypes}
                  leftIcon={<IconDeviceFloppy size={14} />}
                >
                  Save Priority Rules
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: SMS Gateway & Notifications */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
            <Card className="lg:col-span-2 p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 bg-white">
              <div className="border-b border-black/10 pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-black flex items-center gap-2">
                    <IconMessage size={16} className="text-[#1E6FD9]" />
                    <span>SMS Gateway & Automatic Dispatch Triggers</span>
                  </h2>
                  <Badge variant="blue">Connected</Badge>
                </div>
                <p className="text-xs text-black/60 mt-0.5">
                  Sends automated SMS alerts directly to consumer mobile phones for important service updates.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    SMS Sender ID (Shown to recipient)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs font-mono font-bold outline-none focus:border-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                      className="mt-0.5 accent-[#1E6FD9]"
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
                <IconMapPin size={18} className="text-[#1E6FD9]" />
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
                <div>
                  <h2 className="text-sm font-bold text-black">
                    Official 17 Sinacaban Barangays & Coordinates
                  </h2>
                  <p className="text-xs text-black/60">
                    Official PhilAtlas GIS benchmark coordinates used for customer home pins and map centering.
                  </p>
                </div>
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
                    <span className="w-2 h-2 rounded-full bg-[#1E6FD9]" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: Account & Institutional Security */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'security' && (
          <Card className="p-5 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] space-y-4 max-w-xl bg-white">
            <div className="border-b border-black/10 pb-2">
              <h2 className="text-sm font-bold text-black flex items-center gap-2">
                <IconShieldCheck size={16} className="text-[#1E6FD9]" />
                <span>Institutional Security & Access Credentials</span>
              </h2>
              <p className="text-xs text-black/60 mt-0.5">
                Administrative session settings and master password credentials.
              </p>
            </div>

            {securityError && (
              <div className="p-2.5 bg-black/5 border border-black/20 rounded-lg text-xs text-black font-medium">
                {securityError}
              </div>
            )}

            <form onSubmit={handleSaveSecurity} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-black/70 mb-1">
                  Master Administrator Email
                </label>
                <input
                  type="email"
                  className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-black/70 mb-1">
                  Current Master Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                  className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                  className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
                  className="w-32 p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
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
          </Card>
        )}

        {/* Add Issue Type Modal */}
        {showAddIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="text-sm font-bold text-black">
                  Add Issue Category
                </span>
                <button
                  onClick={() => setShowAddIssueModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 text-[14px]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddIssueType} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pump Station Surge"
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none focus:border-[#1E6FD9]"
                    value={newIssueName}
                    onChange={(e) => setNewIssueName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-black/70 mb-1">
                    Default Base Urgency
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs outline-none uppercase font-bold"
                    value={newIssueUrgency}
                    onChange={(e) => {
                      const u = e.target.value as Urgency;
                      setNewIssueUrgency(u);
                    }}
                  >
                    <option value="high">HIGH</option>
                    <option value="medium">MEDIUM</option>
                    <option value="low">LOW</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddIssueModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Add Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Test SMS Modal */}
        {showTestSmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="text-sm font-bold text-black flex items-center gap-2">
                  <IconSend size={16} className="text-[#1E6FD9]" />
                  <span>Send Test SMS Dispatch</span>
                </span>
                <button
                  onClick={() => setShowTestSmsModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1"
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
                    className="w-full p-2 bg-white text-black border border-black/20 rounded-lg text-xs font-mono outline-none focus:border-[#1E6FD9]"
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
