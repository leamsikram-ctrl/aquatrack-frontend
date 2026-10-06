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
} from '@tabler/icons-react';

export interface ModernSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentPath = '/admin/dashboard',
  onNavigate,
  className = '',
}) => {
  const sections = [
    {
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Service Requests', path: '/admin/requests', icon: IconTool },
        { name: 'Billing Records', path: '/admin/billing', icon: IconReceipt2 },
        { name: 'Geographic Map', path: '/admin/map', icon: IconMapPin },
      ],
    },
    {
      title: 'Directory',
      items: [
        { name: 'Consumers', path: '/admin/customers', icon: IconUsers },
        { name: 'Staff & Technicians', path: '/admin/staff', icon: IconUsers },
      ],
    },
    {
      title: 'Communications',
      items: [
        { name: 'Water Interruptions', path: '/admin/interruptions', icon: IconAlertTriangle },
      ],
    },
    {
      title: 'System & Audit',
      items: [
        { name: 'Reports', path: '/admin/reports', icon: IconFileReport },
        { name: 'Activity Log', path: '/admin/activity-log', icon: IconHistory },
        { name: 'Settings', path: '/admin/settings', icon: IconSettings },
      ],
    },
  ];

  return (
    <aside
      className={`w-60 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 select-none ${className}`}
    >
      <div className="space-y-5">
        {/* Crisp Brand Logo */}
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-white shadow-xs">
            <IconDroplet size={17} />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900 leading-none">AquaTrack</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1 leading-none">SIWASS Utility</div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="px-1">
          <button
            onClick={() => onNavigate?.('/admin/requests/new')}
            className="w-full h-9 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 font-medium text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-2xs transition-all"
          >
            <IconPlus size={15} stroke={2.5} />
            <span>New Work Order</span>
          </button>
        </div>

        {/* Clean Navigation Links */}
        <nav className="space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.title && (
                <div className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  {section.title}
                </div>
              )}
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
                          ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      className={isActive ? 'text-[#4F46E5]' : 'text-slate-400'}
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="pt-3 border-t border-slate-100 px-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Sinacaban, Mis. Occ.</span>
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Online
        </span>
      </div>
    </aside>
  );
};
