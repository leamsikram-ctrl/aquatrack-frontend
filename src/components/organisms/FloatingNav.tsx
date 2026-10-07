import React from 'react';
import {
  IconDroplet,
  IconSearch,
  IconBell,
  IconCommand,
  IconLayoutDashboard,
  IconTool,
  IconReceipt2,
  IconMapPin,
  IconUsers,
  IconAlertTriangle,
  IconFileReport,
} from '@tabler/icons-react';

export interface FloatingNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  activeGroup?: string;
  className?: string;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  currentPath = '/admin/dashboard',
  onNavigate,
  className = '',
}) => {
  const mainNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
    { name: 'Requests', path: '/admin/requests', icon: IconTool },
    { name: 'Billing', path: '/admin/billing', icon: IconReceipt2 },
    { name: 'Map', path: '/admin/map', icon: IconMapPin },
    { name: 'Customers', path: '/admin/customers', icon: IconUsers },
    { name: 'Advisories', path: '/admin/interruptions', icon: IconAlertTriangle },
    { name: 'Reports', path: '/admin/reports', icon: IconFileReport },
  ];

  return (
    <div className={`sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/90 ${className}`}>
      {/* Primary Floating Header Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Brand & Workspace Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#090A0F] text-white shadow-xs">
            <IconDroplet size={15} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[14px] tracking-wider uppercase text-black">AquaTrack</span>
            <span className="text-black/30">/</span>
            <span className="text-[14px] font-bold text-black/60 bg-[#F0F6FD] px-1.5 py-0.5 rounded border border-black/10">
              Sinacaban
            </span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F0F6FD] p-1 rounded-lg border border-black/10">
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[14px] font-bold transition-all
                  ${
                    isActive
                      ? 'bg-white text-black shadow-xs'
                      : 'text-black/60 hover:text-black hover:bg-white/60'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'text-[#1E6FD9]' : 'text-black/50'} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Search & Profile Utilities */}
        <div className="flex items-center gap-2">
          {/* Quick Command Palette Button */}
          <button
            className="hidden sm:flex items-center gap-2 h-7 px-2.5 rounded border border-black/15 bg-white text-[14px] font-normal text-black/60 hover:bg-[#F0F6FD] transition-colors"
            onClick={() => alert('Command palette (Ctrl+K)')}
          >
            <IconSearch size={13} className="text-black/50" />
            <span className="text-[14px] font-normal">Quick search...</span>
            <kbd className="flex items-center gap-0.5 rounded bg-white px-1 py-0.5 text-[14px] font-bold text-black/60 border border-black/15">
              <IconCommand size={10} /> K
            </kbd>
          </button>

          <button
            className="flex h-7 w-7 items-center justify-center rounded border border-black/15 text-black hover:bg-[#F0F6FD] relative"
            aria-label="Notifications"
          >
            <IconBell size={14} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#1E6FD9]" />
          </button>

          <div className="h-4 w-px bg-black/15 mx-0.5" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[14px] font-bold text-white">
              AD
            </div>
            <span className="hidden lg:inline text-[14px] font-bold text-black">Admin</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 gap-1 border-t border-black/10 bg-white">
        {mainNavItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`whitespace-nowrap px-2.5 py-1 rounded text-[14px] font-bold ${
                isActive ? 'bg-[#1E6FD9] text-white' : 'text-black/70 hover:bg-[#F0F6FD]'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

