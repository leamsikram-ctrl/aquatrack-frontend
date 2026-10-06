import React from 'react';

export interface AdminSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

interface NavItem {
  name: string;
  path: string;
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
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Customer Verifications', path: '/admin/verification' },
        { name: 'Billing Imports', path: '/admin/billing' },
        { name: 'Water Interruptions', path: '/admin/interruptions' },
      ],
    },
    {
      title: 'Records & Audits',
      items: [
        { name: 'All Customers', path: '/admin/customers' },
        { name: 'Activity Log', path: '/admin/activity-log' },
      ],
    },
    {
      title: 'Records',
      items: [
        { name: 'Reports', path: '/admin/reports' },
        { name: 'Activity log', path: '/admin/activity-log' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Settings', path: '/admin/settings' },
      ],
    },
  ];

  return (
    <aside
      className={`w-60 shrink-0 border-r border-black/15 bg-white flex flex-col justify-between text-sm select-none ${className}`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-3 text-sm font-bold text-black border-b border-black/10 pb-1 mb-1">
                {section.title}
              </div>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentPath === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-left
                      ${
                        isActive
                          ? 'bg-[#1E6FD9] text-white font-bold'
                          : 'text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9]'
                      }
                    `}
                  >
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
