import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { referenceApi } from '../../api';
import type { IssueType } from '../../types';
export function AdminSettingsView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'utility' | 'issues' | 'sms' | 'security'>('utility');

  // Utility Profile Settings (Wireframe A13)
  const [utilityName, setUtilityName] = useState('Sinacaban Water Works System (SIWASS)');
  const [address, setAddress] = useState('Municipal Hall, Poblacion, Sinacaban, Misamis Occidental');
  const [contactNumber, setContactNumber] = useState('(088) 545-0000 / 0917-123-4567');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Issue Types and Default Urgency (Wireframe A14)
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  // New issue modal state
  const [newIssueName, setNewIssueName] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    referenceApi.getIssueTypes().then((types) => {
      setIssueTypes(types);
    }).catch(() => {
      // fallback to initial
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueName.trim()) return;

    const newType: IssueType = {
      id: Date.now(),
      name: newIssueName.trim(),
      default_urgency: newIssueUrgency,
    };

    setIssueTypes([...issueTypes, newType]);
    setNewIssueName('');
    alert(`Issue category "${newType.name}" added successfully!`);
  };

  return (
    <AdminLayout
      title="Settings"
      subtitle="System & Utility Configuration"
      currentPath="/admin/settings"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              System Settings & Service Parameters
            </h1>
            <p className="text-[10px] text-black/60">
              Configure municipal utility profile, baseline urgency policies, and automated SMS templates.
            </p>
          </div>
          {savedSuccess && (
            <Badge variant="blue">✓ Configuration Saved</Badge>
          )}
        </div>

        {/* Tab Navigation - Matches Wireframes A13 & A14 Tabs */}
        <div className="flex border-b border-black/15 gap-2 text-[10px]">
          {[
            { id: 'utility', label: 'Utility profile' },
            { id: 'issues', label: 'Issue types & urgencies' },
            { id: 'sms', label: 'SMS and notifications' },
            { id: 'security', label: 'Account and security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 font-bold uppercase transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#1E6FD9] text-[#1E6FD9] bg-[#F0F6FD]'
                  : 'border-transparent text-black/70 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Utility Profile (Wireframe A13) */}
        {activeTab === 'utility' && (
          <Card className="p-5 border border-black/15 max-w-xl space-y-4">
            <div className="border-b border-black/10 pb-2">
              <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                Sinacaban Municipal Profile
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-[10px]">
              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Utility name
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={utilityName}
                  onChange={(e) => setUtilityName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Physical Office Address
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-black uppercase mb-1">
                  Official Contact Number
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Tab 2: Issue Types & Urgencies (Wireframe A14) */}
        {activeTab === 'issues' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 p-0 overflow-hidden border border-black/15">
              <div className="p-3 border-b border-black/15 bg-white flex items-center justify-between text-[10px]">
                <span className="font-bold text-black uppercase tracking-wider">
                  Configured Service Issue Categories
                </span>
                <span className="text-black/60">Automated baseline urgencies</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                    <tr>
                      <th className="px-4 py-2 font-bold uppercase">Issue type</th>
                      <th className="px-4 py-2 font-bold uppercase">Default urgency</th>
                      <th className="px-4 py-2 font-bold uppercase text-right">Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {issueTypes.map((t) => (
                      <tr key={t.id} className="hover:bg-[#F0F6FD]/40">
                        <td className="px-4 py-2.5 font-bold text-black">{t.name}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={t.default_urgency === 'high' ? 'blue' : 'black'}>
                            {t.default_urgency.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right text-black/60">
                          Baseline Capped (+1 Max)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Add Issue Type Card */}
            <Card className="p-4 border border-black/15 space-y-3">
              <span className="font-bold text-black uppercase tracking-wider text-[10px] block border-b border-black/10 pb-2">
                Add Issue Type
              </span>

              <form onSubmit={handleAddIssueType} className="space-y-3 text-[10px]">
                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Major Mainline Rupture"
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={newIssueName}
                    onChange={(e) => setNewIssueName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Default Base Urgency
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={newIssueUrgency}
                    onChange={(e) => setNewIssueUrgency(e.target.value as 'low' | 'medium' | 'high')}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <Button variant="primary" type="submit" className="w-full">
                  Add issue type
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Tab 3: SMS and Notifications */}
        {activeTab === 'sms' && (
          <Card className="p-5 border border-black/15 max-w-xl space-y-3 text-[10px]">
            <span className="font-bold text-black uppercase tracking-wider block border-b border-black/10 pb-2">
              SMS Gateway Integration (SIWASS Alerts)
            </span>
            <p className="text-black/70">
              Automated SMS notifications are dispatched on registration verification, technician assignment, statement publication, and water advisory broadcasts.
            </p>
            <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-1">
              <strong>Sample Dispatch Template:</strong>
              <div className="font-mono text-black/80">
                [SIWASS] Your water issue ticket AT-0001 has been assigned to Technician Cruz. Expected site inspection within 4 hours.
              </div>
            </div>
            <Button variant="secondary" onClick={() => alert('SMS Gateway test ping sent successfully.')}>
              Test SMS Gateway Ping
            </Button>
          </Card>
        )}

        {/* Tab 4: Account and Security */}
        {activeTab === 'security' && (
          <Card className="p-5 border border-black/15 max-w-xl space-y-3 text-[10px]">
            <span className="font-bold text-black uppercase tracking-wider block border-b border-black/10 pb-2">
              Administrator Security Settings
            </span>
            <div className="space-y-2">
              <div>
                <label className="block font-bold text-black uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-black uppercase mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none"
                />
              </div>
              <Button variant="primary" onClick={() => alert('Administrator security credentials updated.')}>
                Update Password
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
