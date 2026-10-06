import React from 'react';
import {
  IconLayoutDashboard,
  IconTool,
  IconReceipt2,
  IconMapPin,
  IconUsers,
  IconUserCheck,
  IconAlertTriangle,
  IconFileReport,
  IconHistory,
  IconSettings,
} from '@tabler/icons-react';

export interface AdminSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
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
        { name: 'Service requests', path: '/admin/requests', icon: IconTool },
        { name: 'Billing', path: '/admin/billing', icon: IconReceipt2 },
        { name: 'Map', path: '/admin/map', icon: IconMapPin },
      ],
    },
    {
      title: 'People',
      items: [
        { name: 'Customers', path: '/admin/customers', icon: IconUsers },
        { name: 'Staff', path: '/admin/staff', icon: IconUserCheck },
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
        { name: 'Reports', path: '/admin/reports', icon: IconFileReport },
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
      className={`w-60 shrink-0 border-r border-black/10 bg-white flex flex-col justify-between text-sm select-none ${className}`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto p-3.5 space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {/* Clear Section Header Hierarchy: uppercase, subtle, tracked, 14px font */}
            {section.title && (
              <div className="px-3 pt-2 pb-1 text-sm font-bold uppercase tracking-wider text-black/40 border-b border-black/5">
                {section.title}
              </div>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left group
                      ${
                        isActive
                          ? 'bg-[#1E6FD9] text-white font-bold shadow-xs'
                          : 'text-black/80 font-normal hover:bg-[#F0F6FD] hover:text-[#1E6FD9] hover:font-medium'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={17}
                        className={`transition-colors shrink-0 ${
                          isActive
                            ? 'text-white'
                            : 'text-black/50 group-hover:text-[#1E6FD9]'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {/* Active indicator dot for enhanced hierarchy */}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};
