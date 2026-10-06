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
            <span className="font-semibold text-xs tracking-tight text-[#090A0F]">AquaTrack</span>
            <span className="text-slate-300">/</span>
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60">
              SIWASS
            </span>
          </div>
        </div>

        {/* Linear-style Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg border border-slate-200/60">
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all
                  ${
                    isActive
                      ? 'bg-white text-[#090A0F] shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'text-[#2563EB]' : 'text-slate-400'} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Search & Profile Utilities */}
        <div className="flex items-center gap-2">
          {/* Quick Command Palette Button */}
          <button
            className="hidden sm:flex items-center gap-2 h-7.5 px-2.5 rounded-md border border-slate-200/80 bg-slate-50/80 text-xs text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            onClick={() => alert('Command palette (Ctrl+K)')}
          >
            <IconSearch size={13} className="text-slate-400" />
            <span className="text-[11px]">Quick search...</span>
            <kbd className="flex items-center gap-0.5 rounded bg-white px-1 py-0.5 text-[9px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
              <IconCommand size={10} /> K
            </kbd>
          </button>

          <button
            className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200/80 text-slate-600 hover:bg-slate-50 relative"
            aria-label="Notifications"
          >
            <IconBell size={15} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#090A0F] text-[10px] font-mono font-bold text-white">
              AD
            </div>
            <span className="hidden lg:inline text-xs font-medium text-slate-700">Admin</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 gap-1 border-t border-slate-100 bg-white/70">
        {mainNavItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium ${
                isActive ? 'bg-[#090A0F] text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
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

