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
    { name: 'Dashboard', path: '/customer/home', icon: IconHome, hint: 'Overview' },
    { name: 'My Bills', path: '/customer/bills', icon: IconReceipt, hint: 'Statement & history' },
    { name: 'Requests', path: '/customer/requests', icon: IconTool, hint: 'Service tickets' },
    { name: 'Advisories', path: '/customer/advisories', icon: IconVolume, hint: 'Water schedules' },
    { name: 'Profile', path: '/customer/profile', icon: IconUser, hint: 'Account settings' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-black pb-20 md:pb-6 text-[14px]">
      <Topbar
        title="Consumer"
        subtitle={accountNumber}
        userName={userName}
        userRole="Consumer"
      />

      <div className="flex flex-1 max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar (>= 768px) */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-black/10 bg-white p-4 justify-between">
          <div className="space-y-4">
            {/* Consumer Account Pill */}
            <div className="p-3 rounded-lg border border-black/10 bg-[#F0F6FD] space-y-1">
              <div className="text-[11px] font-semibold tracking-wider text-black/60 uppercase">
                Active Consumer
              </div>
              <div className="text-[14px] font-bold text-black truncate" title={userName}>
                {userName}
              </div>
              <div className="text-[12px] font-medium text-[#1E6FD9] truncate">
                {accountNumber}
              </div>
            </div>

            <nav className="space-y-1.5" aria-label="Customer Navigation">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate?.(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] transition-all text-left ${
                      isActive
                        ? 'bg-[#1E6FD9] text-white font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                        : 'text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] font-medium border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={18} className={isActive ? 'text-white' : 'text-black/60'} />
                      <span>{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Utility Notice */}
          <div className="pt-4 border-t border-black/10 text-center text-xs text-black/60 space-y-1">
            <div className="font-semibold text-black">Sinacaban Water Supply</div>
            <div>SIWASS Municipal Utility</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 overflow-y-auto">
          {children}
        </main>
      </div>

      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="customer"
      />
    </div>
  );
};
