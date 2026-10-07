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
      className={`fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-black/15 bg-white px-3 flex items-center justify-around select-none md:hidden ${className}`}
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
            className={`flex items-center justify-center flex-1 h-full transition-colors relative
              ${
                isActive
                  ? 'text-[#1E6FD9]'
                  : 'text-black/60 hover:text-[#1E6FD9]'
              }
            `}
          >
            <div className={`p-1.5 rounded ${isActive ? 'bg-[#F0F6FD]' : ''}`}>
              <IconComponent size={22} stroke={isActive ? 2.2 : 1.7} />
            </div>
            {isActive && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#1E6FD9]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
