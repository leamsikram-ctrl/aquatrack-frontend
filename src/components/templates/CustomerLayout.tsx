import React from 'react';
import { Topbar } from '../organisms/Topbar';
import { BottomNav } from '../organisms/BottomNav';
import {
  IconHome,
  IconReceipt,
  IconTool,
  IconVolume,
  IconUser,
} from '@tabler/icons-react';

export interface CustomerLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  userName?: string;
  accountNumber?: string;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  currentPath = '/customer/home',
  onNavigate,
  userName = 'Maria Santos',
  accountNumber = 'ACC-2026-0001',
}) => {
  const navItems = [
    { name: 'Dashboard', path: '/customer/home', icon: IconHome },
    { name: 'My Bills', path: '/customer/bills', icon: IconReceipt },
    { name: 'Requests', path: '/customer/requests', icon: IconTool },
    { name: 'Advisories', path: '/customer/advisories', icon: IconVolume },
    { name: 'Profile', path: '/customer/profile', icon: IconUser },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col text-black pb-16 md:pb-4 text-[14px]">
      <Topbar
        title="Consumer"
        subtitle={accountNumber}
        userName={userName}
        userRole="Consumer"
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar (>= 768px) */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-black/15 bg-white p-3">
          <div className="mb-2 px-2 text-[14px] font-bold text-black/50 border-b border-black/10 pb-1 uppercase tracking-wider">
            Consumer Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-[14px] font-bold transition-colors text-left ${
                    isActive
                      ? 'bg-[#1E6FD9] text-white'
                      : 'text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9]'
                  }`}
                >
                  <IconComponent size={16} className={isActive ? 'text-white' : 'text-black/70'} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 px-6 sm:px-10 lg:px-14 py-6 overflow-y-auto">{children}</main>
      </div>

      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="customer"
      />
    </div>
  );
};
