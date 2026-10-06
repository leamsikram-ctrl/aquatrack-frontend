import React from 'react';
import {
  IconDroplet,
  IconLayoutDashboard,
  IconTool,
  IconReceipt2,
  IconMapPin,
  IconUsers,
  IconAlertTriangle,
  IconFileReport,
  IconHistory,
  IconSettings,
  IconPlus,
  IconChevronRight,
} from '@tabler/icons-react';

export interface FastoSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const FastoSidebar: React.FC<FastoSidebarProps> = ({
  currentPath = '/admin/dashboard',
  onNavigate,
  className = '',
}) => {
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard, hasSubmenu: true },
    { name: 'Service Requests', path: '/admin/requests', icon: IconTool, hasSubmenu: true },
    { name: 'Billing', path: '/admin/billing', icon: IconReceipt2, hasSubmenu: true },
    { name: 'Live Map', path: '/admin/map', icon: IconMapPin, hasSubmenu: false },
    { name: 'Customers', path: '/admin/customers', icon: IconUsers, hasSubmenu: true },
    { name: 'Interruptions', path: '/admin/interruptions', icon: IconAlertTriangle, hasSubmenu: false },
    { name: 'Reports', path: '/admin/reports', icon: IconFileReport, hasSubmenu: true },
    { name: 'Activity Log', path: '/admin/activity-log', icon: IconHistory, hasSubmenu: false },
    { name: 'Settings', path: '/admin/settings', icon: IconSettings, hasSubmenu: false },
  ];

  return (
    <aside
      className={`w-64 shrink-0 bg-[#4F46E5] text-white flex flex-col justify-between p-5 select-none ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#4F46E5] font-black text-xl shadow-md">
            <IconDroplet size={24} className="fill-[#4F46E5]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">AquaTrack</span>
            <p className="text-[10px] text-indigo-200 tracking-wider uppercase font-semibold">
              Water Utility SaaS
            </p>
          </div>
        </div>

        {/* Fasto Pill "+ New Request" Action Button */}
        <div>
          <button
            onClick={() => onNavigate?.('/admin/requests/new')}
            className="w-full h-11 rounded-full bg-white text-[#4F46E5] hover:bg-indigo-50 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <IconPlus size={16} stroke={2.5} />
            <span>+ New Work Order</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => onNavigate?.(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group
                  ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold shadow-xs backdrop-blur-xs'
                      : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center p-1 rounded-lg ${
                      isActive ? 'text-white' : 'text-indigo-200 group-hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span>{item.name}</span>
                </div>
                {item.hasSubmenu && (
                  <IconChevronRight
                    size={14}
                    className={`transition-transform opacity-60 group-hover:opacity-100 ${
                      isActive ? 'opacity-100 translate-x-0.5' : ''
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Copyright */}
      <div className="pt-6 border-t border-indigo-400/30 text-[11px] text-indigo-200 px-1 space-y-1">
        <p className="font-semibold text-white">AquaTrack SaaS Platform</p>
        <p className="text-[10px] text-indigo-300">© 2026 SIWASS Sinacaban</p>
      </div>
    </aside>
  );
};
