import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { referenceApi } from '../../api';
import type { IssueType, Urgency } from '../../types';
import { IconCheck, IconPlus, IconBuilding, IconList, IconMessage, IconLock } from '@tabler/icons-react';

export function AdminSettingsView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'issue_types' | 'sms' | 'security'>('profile');

  // Wireframe A13: Utility Profile Form State
  const [utilityName, setUtilityName] = useState('Sinacaban Water Supply System');
  const [utilityAddress, setUtilityAddress] = useState('Municipal Hall, Poblacion, Sinacaban, Misamis Occidental');
  const [contactNumber, setContactNumber] = useState('0917 555 0199');
  const [profileSaved, setProfileSaved] = useState(false);

  // Wireframe A14: Issue Types State
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([
    { id: 1, name: 'Main Line Pipe Burst', default_urgency: 'high' },
    { id: 2, name: 'Low Pressure / Disruption', default_urgency: 'high' },
    { id: 3, name: 'Meter Leakage or Defect', default_urgency: 'medium' },
    { id: 4, name: 'Water Quality / Discoloration', default_urgency: 'medium' },
    { id: 5, name: 'Billing Inquiry & General Concern', default_urgency: 'low' },
  ]);
  const [issuesSaved, setIssuesSaved] = useState(false);

  // Add issue type modal
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [newIssueName, setNewIssueName] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState<Urgency>('medium');

  // SMS & Notifications Tab
  const [smsSenderId, setSmsSenderId] = useState('AquaTrack');
  const [notifyOnAssign, setNotifyOnAssign] = useState(true);
  const [notifyOnAdvisory, setNotifyOnAdvisory] = useState(true);
  const [smsSaved, setSmsSaved] = useState(false);

  // Security Tab
  const [adminEmail, setAdminEmail] = useState('admin@sinacaban.gov.ph');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securitySaved, setSecuritySaved] = useState(false);

  useEffect(() => {
    referenceApi.getIssueTypes().then((types) => {
      if (types && types.length > 0) {
        setIssueTypes(types);
      }
    }).catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSaveIssueTypes = (e: React.FormEvent) => {
    e.preventDefault();
    setIssuesSaved(true);
    setTimeout(() => setIssuesSaved(false), 2500);
  };

  const handleAddIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueName.trim()) return;

    const newType: IssueType = {
      id: Date.now(),
      name: newIssueName.trim(),
      default_urgency: newIssueUrgency,
    };

    setIssueTypes((prev) => [...prev, newType]);
    setNewIssueName('');
    setShowAddIssueModal(false);
  };

  const handleUrgencyChange = (id: number, urgency: Urgency) => {
    setIssueTypes((prev) =>
      prev.map((it) => (it.id === id ? { ...it, default_urgency: urgency } : it))
    );
  };

  return (
    <AdminLayout currentPath="/admin/settings" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[14px] text-black">
        {/* Header */}
        <div className="border-b border-black/15 pb-3">
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            System Settings
          </h1>
        </div>

        {/* Wireframe A13 / A14 Tabs */}
        <div className="flex border border-black/20 rounded p-0.5 bg-[#F0F6FD] max-w-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 text-[14px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#1E6FD9] text-white font-bold'
                : 'text-black hover:text-[#1E6FD9]'
            }`}
          >
            <IconBuilding size={12} />
            <span>Utility profile</span>
          </button>

          <button
            onClick={() => setActiveTab('issue_types')}
            className={`px-3 py-1.5 text-[14px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'issue_types'
                ? 'bg-[#1E6FD9] text-white font-bold'
                : 'text-black hover:text-[#1E6FD9]'
            }`}
          >
            <IconList size={12} />
            <span>Issue types</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`px-3 py-1.5 text-[14px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sms'
                ? 'bg-[#1E6FD9] text-white font-bold'
                : 'text-black hover:text-[#1E6FD9]'
            }`}
          >
            <IconMessage size={12} />
            <span>SMS and notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 text-[14px] rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-[#1E6FD9] text-white font-bold'
                : 'text-black hover:text-[#1E6FD9]'
            }`}
          >
            <IconLock size={12} />
            <span>Account and security</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Wireframe A13: Utility Profile Tab */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <Card className="p-5 border border-black/15 shadow-sm space-y-4 max-w-xl">
            <div className="border-b border-black/10 pb-2">
              <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                Utility Profile
              </h2>
              <p className="text-[14px] text-black/60">
                Municipal identity appearing on consumer billing statements and public advisories.
              </p>
            </div>

            {profileSaved && (
              <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
                <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                <span>Utility profile settings successfully saved!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  Utility name
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                  value={utilityName}
                  onChange={(e) => setUtilityName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                  value={utilityAddress}
                  onChange={(e) => setUtilityAddress(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  Contact number
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal focus:border-[#1E6FD9]"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 border-t border-black/10 flex justify-end">
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Wireframe A14: Issue Types Tab */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'issue_types' && (
          <div className="space-y-4 max-w-2xl">
            <Card className="p-5 border border-black/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                    Configured Issue Categories & Priority Weights
                  </h2>
                  <p className="text-[14px] text-black/60">
                    Defines the base urgency for incoming customer reports prior to priority engine evaluation.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddIssueModal(true)}
                  className="flex items-center gap-1"
                >
                  <IconPlus size={12} />
                  <span>Add issue type</span>
                </Button>
              </div>

              {issuesSaved && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                  <span>Issue type priority rules successfully updated!</span>
                </div>
              )}

              {/* Wireframe A14 Table: Issue type | Default urgency */}
              <div className="border border-black/15 rounded overflow-hidden">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                    <tr>
                      <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Issue type</th>
                      <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-right">Default urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {issueTypes.map((it) => (
                      <tr key={it.id} className="hover:bg-[#F0F6FD]/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-black">
                          {it.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={it.default_urgency}
                            onChange={(e) => handleUrgencyChange(it.id, e.target.value as Urgency)}
                            className="p-1 text-[14px] bg-white border border-black/20 rounded font-bold uppercase outline-none"
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

              <div className="flex justify-between items-center pt-2 border-t border-black/10">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddIssueModal(true)}
                >
                  Add issue type
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveIssueTypes}
                >
                  Save changes
                </Button>
              </div>
            </Card>

            <p className="text-[9px] text-black/50 italic">
              Admin sets the default urgency per issue type. Customer bump adds at most 1 level per manuscript capping rule.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SMS and Notifications Tab */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'sms' && (
          <Card className="p-5 border border-black/15 shadow-sm space-y-4 max-w-xl">
            <div className="border-b border-black/10 pb-2">
              <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                SMS Gateway & Dispatch Triggers
              </h2>
              <p className="text-[14px] text-black/60">
                Configures the municipal SMS broadcasting gateway for customer alerts.
              </p>
            </div>

            {smsSaved && (
              <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
                <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                <span>SMS notification triggers saved!</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  SMS Sender ID
                </label>
                <input
                  type="text"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnAssign}
                    onChange={(e) => setNotifyOnAssign(e.target.checked)}
                    className="accent-[#1E6FD9]"
                  />
                  <span>Send SMS to customer when request is assigned to technician</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnAdvisory}
                    onChange={(e) => setNotifyOnAdvisory(e.target.checked)}
                    className="accent-[#1E6FD9]"
                  />
                  <span>Send SMS broadcast to barangay when water interruption advisory is published</span>
                </label>
              </div>

              <div className="pt-2 border-t border-black/10 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSmsSaved(true);
                    setTimeout(() => setSmsSaved(false), 2500);
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Account and Security Tab */}
        {activeTab === 'security' && (
          <Card className="p-5 border border-black/15 shadow-sm space-y-4 max-w-xl">
            <div className="border-b border-black/10 pb-2">
              <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                Institutional Security & Access
              </h2>
              <p className="text-[14px] text-black/60">
                Administrative session settings and credentials.
              </p>
            </div>

            {securitySaved && (
              <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
                <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                <span>Security configuration saved!</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  Master Admin Email
                </label>
                <input
                  type="email"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-black uppercase mb-1">
                  New Master Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-black/10 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSecuritySaved(true);
                    setCurrentPassword('');
                    setNewPassword('');
                    setTimeout(() => setSecuritySaved(false), 2500);
                  }}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Add Issue Type Modal */}
        {showAddIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider text-[14px]">
                  Add Issue Category
                </span>
                <button
                  onClick={() => setShowAddIssueModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[14px]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddIssueType} className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Issue Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pump Station Pressure Surge"
                    className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                    value={newIssueName}
                    onChange={(e) => setNewIssueName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Default Urgency
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none uppercase font-bold"
                    value={newIssueUrgency}
                    onChange={(e) => setNewIssueUrgency(e.target.value as Urgency)}
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
                    onClick={() => setShowAddIssueModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Add Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
