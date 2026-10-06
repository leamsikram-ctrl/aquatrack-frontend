import React from 'react';

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
  userName = 'Admin User',
  userRole = 'System Admin',
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  className = '',
}) => {
  return (
    <header
      className={`h-14 border-b border-black/15 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none text-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="flex h-8 px-2.5 items-center justify-center rounded-md border border-black text-black hover:bg-[#F0F6FD] md:hidden text-sm font-medium"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '[Close]' : '[Menu]'}
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex h-7 px-2.5 items-center justify-center rounded-md bg-[#1E6FD9] text-white font-bold text-sm">
            AquaTrack
          </div>
          {title && (
            <div className="flex items-center gap-1.5 text-black">
              <span className="text-black/40">/</span>
              <span className="font-bold text-sm">{title}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-black/60 text-sm hidden sm:inline">
              ({subtitle})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-bold text-black text-sm">{userName}</div>
          <div className="text-black/60 text-sm">{userRole}</div>
        </div>
      </div>
    </header>
  );
};
