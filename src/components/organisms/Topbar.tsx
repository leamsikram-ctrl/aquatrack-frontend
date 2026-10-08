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
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const roleKey = user?.role || 'customer';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className={`h-16 border-b border-black/20 bg-white shadow-[0_2px_0px_0px_rgba(0,0,0,0.06)] sticky top-0 z-30 select-none text-[14px] ${className}`}
      >
        <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full">
          {/* Nearest left side: Mobile toggle + AquaTrack Logo & Text just like landing page */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="flex h-8 px-2.5 items-center justify-center rounded border border-black text-black hover:bg-[#F0F6FD] md:hidden text-[14px] font-bold"
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

          {/* Nearest right side: Notification bell and Logout button */}
          <div className="flex items-center gap-2 sm:gap-3">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] text-[14px] font-bold transition-colors"
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
