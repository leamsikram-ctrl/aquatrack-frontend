import React from 'react';

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
    { name: 'Home', path: '/customer/home' },
    { name: 'Bills', path: '/customer/bills' },
    { name: 'Requests', path: '/customer/requests' },
    { name: 'Advisories', path: '/customer/advisories' },
    { name: 'Profile', path: '/customer/profile' },
  ];

  const staffItems = [
    { name: 'Tasks', path: '/staff/tasks' },
    { name: 'Scan Meter', path: '/staff/scan' },
    { name: 'Profile', path: '/staff/profile' },
  ];

  const items = variant === 'customer' ? customerItems : staffItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 h-12 border-t border-black/15 bg-white px-2 flex items-center justify-around select-none md:hidden text-[10px] ${className}`}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate?.(item.path)}
            className={`flex items-center justify-center flex-1 h-full transition-colors text-[10px] font-medium
              ${
                isActive
                  ? 'text-[#1E6FD9] border-t-2 border-[#1E6FD9] font-bold bg-[#F0F6FD]'
                  : 'text-black hover:text-[#1E6FD9]'
              }
            `}
          >
            {item.name}
          </button>
        );
      })}
    </nav>
  );
};
