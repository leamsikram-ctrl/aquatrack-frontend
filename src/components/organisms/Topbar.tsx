import React from 'react';
import { IconDroplet, IconBell, IconMenu2, IconX } from '@tabler/icons-react';

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
  userName = 'Admin User',
  userRole = 'System Admin',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  return (
    <header
      className={`h-14 border-b border-black/10 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-sm shadow-2xs ${className}`}
    >
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 text-black hover:bg-[#F0F6FD] md:hidden shadow-2xs"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <IconX size={16} /> : <IconMenu2 size={16} />}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E6FD9] text-white shadow-xs">
            <IconDroplet size={18} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-black">AquaTrack</span>
            {title && (
              <>
                <span className="text-black/30">/</span>
                <span className="font-medium text-sm text-black">{title}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] transition-colors shadow-2xs"
          aria-label="Notifications"
        >
          <IconBell size={16} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1E6FD9] text-[10px] font-bold text-white shadow-xs">
            2
          </span>
        </button>

        <div className="h-4 w-px bg-black/10" />

        {/* User initials & info */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0F6FD] border border-[#1E6FD9]/30 text-sm font-bold text-[#1E6FD9] shadow-2xs">
            {userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="font-bold text-black text-sm">{userName}</div>
            <div className="text-black/50 text-sm">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
