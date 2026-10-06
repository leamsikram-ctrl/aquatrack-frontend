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
      className={`w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <h4 className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {section.title}
              </h4>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left
                      ${
                        isActive
                          ? 'bg-[#EBF3FC] text-[#1E6FD9] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B192C]'
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      className={isActive ? 'text-[#1E6FD9]' : 'text-slate-400 group-hover:text-slate-600'}
                    />
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
