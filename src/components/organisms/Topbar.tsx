import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconLogout, IconBell } from '@tabler/icons-react';
import { NotificationCenter } from './NotificationCenter';

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
        className={`h-12 border-b border-black/15 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-[10px] ${className}`}
      >
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="flex h-7 px-2 items-center justify-center rounded border border-black text-black hover:bg-[#F0F6FD] md:hidden text-[10px] font-bold"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="flex h-6 px-2 items-center justify-center rounded bg-[#1E6FD9] text-white font-bold text-[10px] uppercase tracking-wider">
              AquaTrack
            </div>
            {title && (
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-black/40">/</span>
                <span className="font-bold text-[10px]">{title}</span>
              </div>
            )}
            {subtitle && (
              <span className="text-black/60 text-[10px] hidden sm:inline">
                ({subtitle})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-black text-[10px]">{displayName}</div>
            <div className="text-black/60 text-[10px]">{displayRole}</div>
          </div>

          {/* Wireframe C7, C15, S2, S7 Bell Icon */}
          <button
            onClick={() => setShowNotifications(true)}
            title="Notifications"
            className="relative p-1.5 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] transition-colors"
          >
            <IconBell size={13} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1E6FD9] rounded-full border border-white" />
          </button>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1 px-2 py-1 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] text-[10px] font-bold transition-colors"
          >
            <IconLogout size={12} />
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
