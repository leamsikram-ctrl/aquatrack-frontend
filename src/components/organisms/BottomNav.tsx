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
    { name: 'Home', path: '/home' },
    { name: 'Bills', path: '/bills' },
    { name: 'Requests', path: '/requests' },
    { name: 'Advisories', path: '/advisories' },
    { name: 'Profile', path: '/profile' },
  ];

  const staffItems = [
    { name: 'My tasks', path: '/staff/tasks' },
    { name: 'Scan meter', path: '/staff/scan' },
    { name: 'Profile', path: '/staff/profile' },
  ];

  const items = variant === 'customer' ? customerItems : staffItems;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-black/15 bg-white px-2 flex items-center justify-around select-none md:hidden text-sm ${className}`}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate?.(item.path)}
            className={`flex items-center justify-center flex-1 h-full transition-colors text-sm font-medium
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
