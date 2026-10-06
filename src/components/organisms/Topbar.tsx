import React from 'react';
import { IconDroplet, IconBell, IconMenu2, IconX } from '@tabler/icons-react';

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  notificationCount?: number;
  userName?: string;
  userRole?: string;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  notificationCount = 0,
  userName = 'Admin User',
  userRole = 'System Admin',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  return (
    <header
      className={`h-14 border-b border-slate-200 bg-white/95 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B192C] text-white">
            <IconDroplet size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#0B192C]">AquaTrack</span>
              {title && (
                <>
                  <span className="text-slate-300 font-light">/</span>
                  <span className="text-xs font-semibold text-slate-700">{title}</span>
                </>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0B192C] transition-colors"
          aria-label="Notifications"
        >
          <IconBell size={16} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1E6FD9] px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* User Badge */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#0B192C] border border-slate-200">
            {userName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-[#0B192C] leading-none">{userName}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
