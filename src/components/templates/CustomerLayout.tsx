import React from 'react';
import { Topbar } from '../organisms/Topbar';
import { BottomNav } from '../organisms/BottomNav';

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
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A] pb-18 md:pb-6">
      {/* Top Header */}
      <Topbar
        title="Consumer Portal"
        subtitle={`Account: ${accountNumber}`}
        userName={userName}
        userRole="Consumer"
        notificationCount={1}
      />

      <div className="flex flex-1 max-w-4xl w-full mx-auto">
        {/* Desktop Sidebar (Permanent >= 1024px) */}
        <aside className="hidden md:flex w-56 flex-col border-r border-slate-200 bg-white p-4">
          <div className="mb-4 px-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </h4>
          </div>
          <nav className="space-y-1">
            {[
              { name: 'Home', path: '/home' },
              { name: 'My Bills', path: '/bills' },
              { name: 'Service Requests', path: '/requests' },
              { name: 'Advisories', path: '/advisories' },
              { name: 'Account Profile', path: '/profile' },
            ].map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EBF3FC] text-[#1E6FD9] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B192C]'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Sticky Bottom Navigation (< 1024px / md) */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="customer"
      />
    </div>
  );
};

