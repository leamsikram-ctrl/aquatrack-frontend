import React from 'react';
import {
  IconLayoutDashboard,
  IconClipboardList,
  IconReceipt,
  IconMapPin,
  IconUsers,
  IconUserCheck,
  IconAlertTriangle,
  IconFileText,
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
        { name: 'Service requests', path: '/admin/requests', icon: IconClipboardList },
        { name: 'Billing', path: '/admin/billing', icon: IconReceipt },
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
      className={`w-56 shrink-0 border-r border-black/15 bg-white flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto p-3 space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-2 text-[14px] font-bold text-black/50 border-b border-black/10 pb-1 mb-1">
                {section.title}
              </div>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPath === item.path;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[14px] font-bold transition-colors text-left
                      ${
                        isActive
                          ? 'bg-[#1E6FD9] text-white'
                          : 'text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9]'
                      }
                    `}
                  >
                    <IconComponent size={15} className={isActive ? 'text-white' : 'text-black/70'} />
                    <span>{item.name}</span>
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
