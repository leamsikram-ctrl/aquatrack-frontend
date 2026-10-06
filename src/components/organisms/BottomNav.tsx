import React from 'react';
import {
  IconHome,
  IconReceipt2,
  IconAlertCircle,
  IconBroadcast,
  IconUser,
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
    { name: 'Requests', path: '/requests', icon: IconAlertCircle },
    { name: 'Advisories', path: '/advisories', icon: IconBroadcast },
    { name: 'Profile', path: '/profile', icon: IconUser },
  ];

  const staffItems = [
    { name: 'My tasks', path: '/staff/tasks', icon: IconAlertCircle },
    { name: 'Scan meter', path: '/staff/scan', icon: IconReceipt2 },
    { name: 'Profile', path: '/staff/profile', icon: IconUser },
  ];

  const items = variant === 'customer' ? customerItems : staffItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 flex items-center justify-around select-none md:hidden ${className}`}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate?.(item.path)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors
              ${isActive ? 'text-[#1E6FD9]' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                isActive ? 'bg-[#EBF3FC] text-[#1E6FD9]' : 'text-slate-400'
              }`}
            >
              <Icon size={18} stroke={isActive ? 2.3 : 1.7} />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight ${
                isActive ? 'font-semibold text-[#0B192C]' : 'font-normal text-slate-500'
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
