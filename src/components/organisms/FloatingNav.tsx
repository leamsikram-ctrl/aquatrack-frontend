import React, { useState } from 'react';
import { NotificationCenter } from './NotificationCenter';
import { useNotificationBadge } from '../../services/notificationService';
import {
  IconDroplet,
  IconSearch,
  IconBell,
  IconCommand,
  IconLayoutDashboard,
  IconTool,
  IconReceipt2,
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
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotificationBadge('admin');

  const mainNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
    { name: 'Maintenance', path: '/admin/maintenance', icon: IconTool },
    { name: 'Billing', path: '/admin/billing', icon: IconReceipt2 },
    { name: 'Users', path: '/admin/users', icon: IconUsers },
    { name: 'Advisories', path: '/admin/interruptions', icon: IconAlertTriangle },
    { name: 'Reports', path: '/admin/reports', icon: IconFileReport },
  ];

  return (
    <div className={`sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/90 ${className}`}>
      {/* Primary Floating Header Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Brand & Workspace Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white shadow-xs">
            <IconDroplet size={15} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wider text-black">AquaTrack</span>
            <span className="text-black/30">/</span>
            <span className="text-xs font-normal text-black/60 bg-white px-1.5 py-0.5 rounded border border-black/10">
              Sinacaban
            </span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-lg border border-black/10">
          {mainNavItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              currentPath?.startsWith(item.path + '/') ||
              currentPath?.startsWith(item.path + '?') ||
              (item.path === '/admin/maintenance' && (currentPath?.startsWith('/admin/requests') || currentPath?.startsWith('/admin/map'))) ||
              (item.path === '/admin/users' && (currentPath?.startsWith('/admin/customers') || currentPath?.startsWith('/admin/staff')));
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-normal transition-all
                  ${
                    isActive
                      ? 'bg-black/5 text-black shadow-xs font-medium'
                      : 'text-black/60 hover:text-black hover:bg-black/5'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'text-brand-blue' : 'text-black/50'} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Search & Profile Utilities */}
        <div className="flex items-center gap-2">
          {/* Quick Command Palette Button */}
          <button
            className="hidden sm:flex items-center gap-2 h-7 px-2.5 rounded border border-black/15 bg-white text-[14px] font-normal text-black/60 hover:bg-black/5 transition-colors"
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search"], input[type="text"]') as HTMLInputElement | null;
              searchInput?.focus();
            }}
          >
            <IconSearch size={13} className="text-black/50" />
            <span className="text-[14px] font-normal">Quick search...</span>
            <kbd className="flex items-center gap-0.5 rounded bg-white px-1 py-0.5 text-xs font-normal text-black/60 border border-black/15">
              <IconCommand size={10} /> K
            </kbd>
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="flex h-7 w-7 items-center justify-center rounded border border-black/15 text-black hover:bg-black/5 relative"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            title={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Open Notifications'}
          >
            <IconBell size={14} />
            {unreadCount > 0 && (
              <span
                data-testid="notification-badge"
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-blue"
              />
            )}
          </button>

          <div className="h-4 w-px bg-black/15 mx-0.5" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-normal text-white">
              AD
            </div>
            <span className="hidden lg:inline text-sm font-normal text-black">Admin</span>
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
              className={`whitespace-nowrap px-2.5 py-1 rounded text-sm font-normal ${
                isActive ? 'bg-brand-blue text-white font-medium' : 'text-black/70 hover:bg-black/5'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        role="admin"
      />
    </div>
  );
};

