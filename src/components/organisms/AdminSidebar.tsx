import React from 'react';
import {
  IconLayoutDashboard,
  IconClipboardList,
  IconReceipt,
  IconUsers,
  IconAlertTriangle,
  IconFileText,
  IconHistory,
  IconSettings,
} from '@tabler/icons-react';
import { AquaTrackLogo } from '../atoms/AquaTrackLogo';

export interface AdminSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
  isCollapsed?: boolean;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath = '/admin/dashboard',
  onNavigate,
  className = '',
  isCollapsed = false,
}) => {
  const sections: NavSection[] = [
    {
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Maintenance', path: '/admin/maintenance', icon: IconClipboardList },
        { name: 'Billing', path: '/admin/billing', icon: IconReceipt },
      ],
    },
    {
      title: 'People',
      items: [
        { name: 'Users', path: '/admin/users', icon: IconUsers },
      ],
    },
    {
      title: 'Communication',
      items: [
        { name: 'Interruptions', path: '/admin/interruptions', icon: IconAlertTriangle },
      ],
    },
    {
      title: 'Records',
      items: [
        { name: 'Reports', path: '/admin/reports', icon: IconFileText },
        { name: 'Activity log', path: '/admin/activity-log', icon: IconHistory },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', path: '/admin/settings', icon: IconSettings },
      ],
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-56'
      } shrink-0 bg-white flex flex-col justify-between select-none transition-[width] duration-200 ease-in-out ${className}`}
    >
      {/* Brand Header (Height 64px matching AdminTopbar) */}
      <div className="h-16 shrink-0 flex items-center px-3.5">
        <button
          onClick={() => onNavigate?.('/admin/dashboard')}
          className={`flex items-center gap-2.5 focus:outline-none text-left w-full cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="AquaTrack Admin Portal"
        >
          <AquaTrackLogo size={28} variant="mark" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-black tracking-tight text-[14px] leading-tight">
                AquaTrack
              </span>
              <span className="text-[11px] text-black/50 font-normal leading-tight">
                Sinacaban Water
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={`flex flex-col flex-1 overflow-y-auto ${isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-3'}`}>
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              isCollapsed ? (
                <div className="my-1.5" />
              ) : (
                <div className="px-2 text-xs font-medium text-black/40 pb-0.5 mb-1">
                  {section.title}
                </div>
              )
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  currentPath === item.path ||
                  currentPath?.startsWith(item.path + '/') ||
                  currentPath?.startsWith(item.path + '?') ||
                  (item.path === '/admin/maintenance' && (currentPath?.startsWith('/admin/requests') || currentPath?.startsWith('/admin/map'))) ||
                  (item.path === '/admin/users' && (currentPath?.startsWith('/admin/customers') || currentPath?.startsWith('/admin/staff')));
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    title={isCollapsed ? item.name : undefined}
                    aria-label={item.name}
                    className={`w-full flex items-center rounded text-[14px] transition-all text-left font-normal cursor-pointer
                      ${
                        isCollapsed
                          ? 'justify-center p-2.5'
                          : 'gap-2.5 px-2.5 py-1.5'
                      }
                      ${
                        isActive
                          ? 'bg-[#1E6FD9] text-white font-medium shadow-[0_2px_0_0_#104382]'
                          : 'text-black hover:bg-black/5 hover:text-black'
                      }
                    `}
                  >
                    <IconComponent
                      size={isCollapsed ? 18 : 16}
                      className={isActive ? 'text-white' : 'text-black/70'}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Subtle Tag */}
      <div className={`text-black/40 text-center select-none ${isCollapsed ? 'py-2 text-[10px]' : 'p-2.5 text-[11px]'}`}>
        {isCollapsed ? 'SWWS' : 'Sinacaban Water'}
      </div>
    </aside>
  );
};
