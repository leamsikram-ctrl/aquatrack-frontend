import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { authApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';
import { IconUser, IconLock, IconCheck } from '@tabler/icons-react';

export function StaffProfileView() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setShowPasswordModal(false);
      }, 1500);
    }, 600);
  };

  const staffName = user?.name || user?.staff_profile?.name || 'Field Technician';
  const assignedArea = user?.staff_profile?.assigned_barangay?.name
    ? `Sinacaban - ${user.staff_profile.assigned_barangay.name}`
    : 'Sinacaban Municipal Sector 1';
  const mobileNumber = user?.mobile_number || '0917 555 1234';
  const barangaysList = 'Poblacion, San Isidro, Cagposan, Colupan';

  return (
    <StaffLayout currentPath="/staff/profile" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 max-w-xl">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            Profile
          </h1>
        </div>

        {/* Card */}
        <Card className="p-5 border border-black/15 shadow-sm space-y-4 bg-white text-[14px]">
          {isLoading ? (
            <div className="py-8 text-center text-black/50 text-[14px] font-normal">
              Loading staff credentials...
            </div>
          ) : (
            <>
              {/* Avatar + Name + Assigned Area */}
              <div className="flex items-center gap-3 border-b border-black/15 pb-4">
                <div className="w-10 h-10 rounded-full bg-[#F0F6FD] border border-black/20 flex items-center justify-center text-[#1E6FD9] shrink-0 font-bold text-[14px]">
                  <IconUser size={20} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-black uppercase tracking-wider">
                    {staffName}
                  </h2>
                  <p className="text-[14px] text-black/60 font-normal">
                    {assignedArea}
                  </p>
                </div>
              </div>

              {/* Data rows */}
              <div className="space-y-3 py-1 text-[14px]">
                <div className="flex justify-between items-center border-b border-black/10 pb-2.5">
                  <span className="font-bold text-black">
                    Mobile
                  </span>
                  <span className="text-black font-normal">
                    {mobileNumber}
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-black/10 pb-2.5">
                  <span className="font-bold text-black">
                    Barangays
                  </span>
                  <span className="text-black text-right max-w-[200px] font-normal">
                    {barangaysList}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-center py-2 text-[14px]"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change password
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center py-2 text-[14px]"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconLock size={16} className="text-[#1E6FD9]" />
                  <span className="font-bold text-[14px] text-black uppercase tracking-wider">
                    Change Password
                  </span>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[14px]"
                >
                  ✕
                </button>
              </div>

              {passwordSuccess && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[14px] text-black flex items-center gap-2">
                  <IconCheck size={16} className="text-[#1E6FD9] shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black text-[14px] text-black font-normal">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none font-normal"
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
      </div>
    </StaffLayout>
  );
}
