import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconLogout, IconBell } from '@tabler/icons-react';
import { NotificationCenter } from './NotificationCenter';
import { AquaTrackLogo } from '../atoms/AquaTrackLogo';
import { accountsStore } from '../../services/accountsStore';
import { useNotificationBadge } from '../../services/notificationService';

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  userName: propUserName,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const roleKey = (user?.role as 'customer' | 'staff' | 'admin') || 'customer';
  const currentMeterNo =
    user?.customer_profile?.meter?.meter_number ||
    (user as any)?.meter_number ||
    (user as any)?.meter?.meter_number;

  const { unreadCount } = useNotificationBadge(roleKey, user?.id, currentMeterNo);
  const storedUser = user?.email
    ? accountsStore.getUserByEmail(user.email)
    : (user?.id ? accountsStore.getUserById(user.id) : null);
  const matchedStoredUser = storedUser && storedUser.role === roleKey ? storedUser : null;
  const displayName =
    user?.name ||
    matchedStoredUser?.name ||
    propUserName ||
    (roleKey === 'admin' ? 'SIWASS Administrator' : roleKey === 'staff' ? 'Pedro Cruz' : 'Maria Santos');
  const avatarUrl = matchedStoredUser?.avatar || user?.avatar;
  const firstLetter = displayName.trim().charAt(0).toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    navigate(roleKey === 'staff' ? '/staff/profile' : '/customer/profile');
  };

  return (
    <>
      <header
        className={`h-16 border-b border-black/20 bg-white shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] sticky top-0 z-30 select-none text-[14px] ${className}`}
      >
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full">
          {/* Left side: Mobile toggle + AquaTrack Logo & Text */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="flex h-8 px-2.5 items-center justify-center rounded border border-black text-black hover:bg-black/5 md:hidden text-[14px] font-medium"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 text-black">
              <AquaTrackLogo size={32} variant="mark" />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-black text-[14px]">
                  AquaTrack
                </span>
                <span className="text-black/60 font-normal text-[12px] sm:text-[14px] hidden min-[380px]:inline">
                  Sinacaban Water Supply System
                </span>
              </div>
            </div>
          </div>

          {/* Right side: User Profile Photo + Name, Notification bell, and Sign Out button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleOpenProfile}
              title="Open Profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded border border-black/20 hover:bg-black/5 text-black transition-colors cursor-pointer"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover border border-black/20 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#1E6FD9] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {firstLetter}
                </div>
              )}
              <span className="text-[13px] font-medium text-black hidden sm:inline max-w-[140px] truncate">
                {displayName}
              </span>
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              title={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              className="relative p-2 rounded border border-black text-black hover:bg-black/5 hover:text-black transition-colors cursor-pointer"
            >
              <IconBell size={16} />
              {unreadCount > 0 && (
                <span
                  data-testid="notification-badge"
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E6FD9] rounded-full border border-white"
                />
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black text-black hover:bg-black/5 hover:text-black text-[14px] font-medium transition-colors cursor-pointer"
            >
              <IconLogout size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        role={roleKey as 'customer' | 'staff' | 'admin'}
      />
    </>
  );
};
