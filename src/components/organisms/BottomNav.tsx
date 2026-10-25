import React from 'react';
import {
  IconHome,
  IconReceipt,
  IconTool,
  IconVolume,
  IconUser,
  IconClipboardList,
  IconQrcode,
} from '@tabler/icons-react';

export interface BottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  variant?: 'customer' | 'staff';
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath = '/customer/home',
  onNavigate,
  variant = 'customer',
  className = '',
}) => {
  const customerItems = [
    { title: 'Home', path: '/customer/home', icon: IconHome },
    { title: 'Bills', path: '/customer/bills', icon: IconReceipt },
    { title: 'Requests', path: '/customer/requests', icon: IconTool },
    { title: 'Advisories', path: '/customer/advisories', icon: IconVolume },
    { title: 'Profile', path: '/customer/profile', icon: IconUser },
  ];

  const staffItems = [
    { title: 'Tasks', path: '/staff/tasks', icon: IconClipboardList },
    { title: 'Scan Meter', path: '/staff/scan', icon: IconQrcode },
    { title: 'Profile', path: '/staff/profile', icon: IconUser },
  ];

  const items = variant === 'customer' ? customerItems : staffItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-black/10 bg-white/95 backdrop-blur-md px-2 flex items-center justify-around select-none md:hidden shadow-[0_-2px_0px_0px_rgba(0,0,0,0.04)] ${className}`}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const IconComponent = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate?.(item.path)}
            title={item.title}
            aria-label={item.title}
            className={`flex flex-row items-center justify-center gap-1.5 flex-1 h-full py-1 px-1 transition-all ${
              isActive
                ? 'text-[#1E6FD9] font-bold'
                : 'text-black/60 hover:text-black font-medium'
            }`}
          >
            <div className={`p-0.5 rounded-lg transition-transform shrink-0 ${isActive ? 'scale-110' : ''}`}>
              <IconComponent size={18} stroke={isActive ? 2.2 : 1.7} />
            </div>
            <span className="text-[11px] sm:text-[12px] tracking-tight leading-none whitespace-nowrap">
              {item.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
