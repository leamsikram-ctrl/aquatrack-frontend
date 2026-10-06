import React from 'react';
import { Topbar } from '../organisms/Topbar';
import { BottomNav } from '../organisms/BottomNav';
import {
  IconHome,
  IconReceipt2,
  IconTool,
  IconBroadcast,
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
  currentPath = '/home',
  onNavigate,
  userName = 'Juan Dela Cruz',
  accountNumber = '2026-0042',
}) => {
  const navItems = [
    { name: 'Home', path: '/home', icon: IconHome },
    { name: 'My Bills', path: '/bills', icon: IconReceipt2 },
    { name: 'Service Requests', path: '/requests', icon: IconTool },
    { name: 'Advisories', path: '/advisories', icon: IconBroadcast },
    { name: 'Account Profile', path: '/profile', icon: IconUser },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col text-black text-sm pb-16 md:pb-6">
      <Topbar
        title="Consumer Portal"
        subtitle={`Account: ${accountNumber}`}
        userName={userName}
        userRole="Consumer"
      />

      <div className="flex flex-1 max-w-4xl w-full mx-auto">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className="hidden md:flex w-56 flex-col border-r border-black/10 bg-white p-4 select-none">
          <div className="mb-3 px-3 text-sm font-bold uppercase tracking-wider text-black/40 border-b border-black/5 pb-1">
            Menu
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left group
                    ${
                      isActive
                        ? 'bg-[#1E6FD9] text-white font-bold shadow-xs'
                        : 'text-black/80 font-normal hover:bg-[#F0F6FD] hover:text-[#1E6FD9] hover:font-medium'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={17}
                      className={`transition-colors shrink-0 ${
                        isActive ? 'text-white' : 'text-black/50 group-hover:text-[#1E6FD9]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Sticky Bottom Nav */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="customer"
      />
    </div>
  );
};
