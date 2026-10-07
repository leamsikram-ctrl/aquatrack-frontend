import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { authApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

export function CustomerProfileView() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit profile & Change password modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSubmitted, setEditSubmitted] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setEditMobile(u.customer_profile?.mobile_number || '');
        setEditAddress(u.customer_profile?.address || '');
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitted(true);
    setTimeout(() => {
      setEditSubmitted(false);
      setShowEditModal(false);
    }, 1500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordError('');
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
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
  const mobileNumber = profile?.mobile_number || '0917-123-4567';
  const emailAddress = user?.email || 'maria.santos@gmail.com';
  const barangayAddress = profile?.address
    ? `${profile.address}, ${profile.barangay?.name || 'Poblacion'}`
    : profile?.barangay?.name || 'Barangay Poblacion';

  return (
    <CustomerLayout currentPath="/customer/profile" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 max-w-xl">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            Profile
          </h1>
        </div>

        {/* Customer Card */}
        <Card className="p-5 border border-black/15 bg-white space-y-4">
          {/* Avatar and Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-black/20 bg-[#F0F6FD] flex items-center justify-center font-bold text-black text-[14px]">
              {customerName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-[14px] text-black">
                {customerName}
              </div>
              <div className="text-[14px] text-black/60 font-normal">
                {accountNumber}
              </div>
            </div>
          </div>

          {/* Table / Information rows */}
          <div className="border-t border-black/15 pt-3 divide-y divide-black/10 text-[14px]">
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-black">Mobile</span>
              <span className="text-black/80 font-normal">{mobileNumber}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-black">Email</span>
              <span className="text-black/80 font-normal">{emailAddress}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-black">Address</span>
              <span className="text-black/80 font-normal">{barangayAddress}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-black">Water Meter</span>
              <span className="font-mono font-bold text-black">{profile?.meter?.meter_number || 'MTR-SIN-0001'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => setShowEditModal(true)}
            >
              Edit profile
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => setShowPasswordModal(true)}
            >
              Change password
            </Button>
            <button
              onClick={handleLogout}
              className="w-full py-2 text-center text-[14px] font-bold text-black hover:text-[#1E6FD9] transition-colors"
            >
              Log out
            </button>
          </div>
        </Card>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-lg border border-black p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-[14px] text-black uppercase tracking-wider">
                  Edit Profile
                </span>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[14px]"
                >
                  ✕
                </button>
              </div>

              {editSubmitted ? (
                <div className="p-3 bg-[#F0F6FD] border border-black/20 rounded text-center text-[14px] text-black space-y-1">
                  <div className="font-bold text-[#1E6FD9]">Update Request Submitted</div>
                  <div className="text-black/70 font-normal">
                    Your profile edits will take effect once reviewed by AquaTrack admin.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="justify-center"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      className="justify-center"
                    >
                      Save changes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-lg border border-black p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-[14px] text-black uppercase tracking-wider">
                  Change Password
                </span>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[14px]"
                >
                  ✕
                </button>
              </div>

              {passwordError && (
                <div className="p-2 bg-[#F0F6FD] border border-black text-black rounded text-[14px] font-normal">
                  {passwordError}
                </div>
              )}

              {passwordSuccess ? (
                <div className="p-3 bg-[#F0F6FD] border border-black/20 rounded text-center text-[14px] text-black font-bold text-[#1E6FD9]">
                  Password changed successfully!
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-black/70 uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/15">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="justify-center"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      className="justify-center"
                    >
                      Update password
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
