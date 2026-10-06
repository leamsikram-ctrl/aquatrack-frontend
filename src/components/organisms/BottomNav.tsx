import React from 'react';
import {
  IconHome,
  IconReceipt2,
  IconTool,
  IconBroadcast,
  IconUser,
  IconQrcode,
} from '@tabler/icons-react';

export interface BottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  variant?: 'customer' | 'staff';
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath = '/home',
  onNavigate,
  variant = 'customer',
  className = '',
}) => {
  const customerItems = [
    { name: 'Home', path: '/home', icon: IconHome },
    { name: 'Bills', path: '/bills', icon: IconReceipt2 },
    { name: 'Requests', path: '/requests', icon: IconTool },
    { name: 'Advisories', path: '/advisories', icon: IconBroadcast },
    { name: 'Profile', path: '/profile', icon: IconUser },
  ];

  const staffItems = [
    { name: 'Tasks', path: '/staff/tasks', icon: IconTool },
    { name: 'Scan', path: '/staff/scan', icon: IconQrcode },
    { name: 'Profile', path: '/staff/profile', icon: IconUser },
  ];

  const items = variant === 'customer' ? customerItems : staffItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-black/10 bg-white/95 backdrop-blur-xs px-2 flex items-center justify-around select-none md:hidden text-sm shadow-md ${className}`}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate?.(item.path)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors text-sm
              ${isActive ? 'text-[#1E6FD9] font-bold' : 'text-black/60 hover:text-black'}
            `}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                isActive ? 'bg-[#F0F6FD] text-[#1E6FD9] shadow-2xs' : 'text-black/60'
              }`}
            >
              <Icon size={18} stroke={isActive ? 2.2 : 1.7} />
            </div>
            <span className="text-sm mt-0.5">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
};
