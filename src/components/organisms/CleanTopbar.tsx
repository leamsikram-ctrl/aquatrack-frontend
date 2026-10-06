import React from 'react';
import {
  IconSearch,
  IconBell,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';

export interface CleanTopbarProps {
  title?: string;
  subtitle?: string;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
  className?: string;
}

export const CleanTopbar: React.FC<CleanTopbarProps> = ({
  title = 'Dashboard',
  subtitle,
  onToggleMobileSidebar,
  isMobileSidebarOpen = false,
  className = '',
}) => {
  return (
    <header
      className={`h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between select-none ${className}`}
    >
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden hover:bg-slate-50"
            aria-label="Toggle Navigation"
          >
            {isMobileSidebarOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 mt-1 leading-none">{subtitle}</p>}
        </div>
      </div>

      {/* Pill Search & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Clean Pill Search */}
        <div className="relative hidden sm:flex items-center">
          <input
            type="text"
            placeholder="Search accounts, meters, requests..."
            className="w-64 lg:w-72 h-8.5 pl-9 pr-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15 focus:border-[#4F46E5] focus:bg-white transition-all shadow-2xs"
          />
          <IconSearch size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Notifications Button */}
        <button
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          aria-label="Notifications"
        >
          <IconBell size={16} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#4F46E5]" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-2xs">
            AD
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-none">Admin User</div>
            <div className="text-[10px] text-slate-400 mt-1 leading-none">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
};
