import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconLogout, IconBell } from '@tabler/icons-react';
import { NotificationCenter } from './NotificationCenter';
import { AquaTrackLogo } from '../atoms/AquaTrackLogo';

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
  title,
  subtitle,
  userName,
  userRole,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = userName || user?.name || 'Authorized User';
  const displayRole =
    userRole ||
    (user?.role === 'admin'
      ? 'System Administrator'
      : user?.role === 'staff'
      ? 'Field Technician'
      : 'Water Consumer');

  const roleKey = user?.role || 'customer';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className={`h-14 border-b border-black/15 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-xs ${className}`}
      >
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="flex h-8 px-2.5 items-center justify-center rounded border border-black text-black hover:bg-[#F0F6FD] md:hidden text-xs font-bold"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          )}

          <div className="flex items-center gap-2">
            <AquaTrackLogo size={24} variant="mark" />
            <span className="font-bold text-xs uppercase tracking-wider text-black">
              AquaTrack
            </span>
            {title && (
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-black/30">/</span>
                <span className="font-bold text-xs">{title}</span>
              </div>
            )}
            {subtitle && (
              <span className="text-black/50 text-xs hidden sm:inline">
                ({subtitle})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-black text-xs">{displayName}</div>
            <div className="text-black/50 text-[11px]">{displayRole}</div>
          </div>

          {/* Bell Icon */}
          <button
            onClick={() => setShowNotifications(true)}
            title="Notifications"
            className="relative p-2 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] transition-colors"
          >
            <IconBell size={16} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E6FD9] rounded-full border border-white" />
          </button>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] text-xs font-bold transition-colors"
          >
            <IconLogout size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
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
