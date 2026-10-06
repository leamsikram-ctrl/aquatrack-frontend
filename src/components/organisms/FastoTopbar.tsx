import React from 'react';
import {
  IconSearch,
  IconBell,
  IconMail,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';

export interface FastoTopbarProps {
  title?: string;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
  className?: string;
}

export const FastoTopbar: React.FC<FastoTopbarProps> = ({
  title = 'Dashboard',
  onToggleMobileSidebar,
  isMobileSidebarOpen = false,
  className = '',
}) => {
  return (
    <header
      className={`h-20 bg-transparent px-6 sm:px-8 flex items-center justify-between select-none ${className}`}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs md:hidden hover:bg-slate-50"
            aria-label="Toggle Navigation"
          >
            {isMobileSidebarOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
        )}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
      </div>

      {/* Right: Fasto Pill Search Bar & Profile Bar */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Rounded Pill Search Input */}
        <div className="relative hidden md:flex items-center">
          <input
            type="text"
            placeholder="Search work orders, meters, accounts..."
            className="w-72 lg:w-80 h-11 pl-11 pr-4 rounded-full bg-white border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] shadow-xs"
          />
          <IconSearch size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Circular Action Icons with Badges */}
        <div className="flex items-center gap-2.5">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-xs hover:text-[#4F46E5] hover:bg-indigo-50/50 transition-colors">
            <IconMail size={18} />
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#4F46E5] px-1 text-[10px] font-bold text-white shadow-xs">
              6
            </span>
          </button>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-xs hover:text-[#4F46E5] hover:bg-indigo-50/50 transition-colors">
            <IconBell size={18} />
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#4F46E5] px-1 text-[10px] font-bold text-white shadow-xs">
              4
            </span>
          </button>
        </div>

        {/* User Profile Capsule */}
        <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-[#4F46E5] ring-2 ring-white shadow-xs">
              AD
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">Admin User</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
