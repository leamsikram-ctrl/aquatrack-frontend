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
        { name: 'Service Requests Dispatch', path: '/admin/requests' },
        { name: 'Billing Imports', path: '/admin/billing' },
        { name: 'Water Advisories', path: '/admin/interruptions' },
      ],
    },
    {
      title: 'Records & Directory',
      items: [
        { name: 'All Customers', path: '/admin/customers' },
      ],
    },
  ];

  return (
    <aside
      className={`w-60 shrink-0 border-r border-black/15 bg-white flex flex-col justify-between text-[10px] select-none ${className}`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto p-3 space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-2 text-[10px] font-bold text-black border-b border-black/10 pb-1 mb-1 uppercase tracking-wider">
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
                    className={`w-full flex items-center px-2.5 py-1.5 rounded text-[10px] font-medium transition-colors text-left
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
