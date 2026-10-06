import React from 'react';
import { Topbar } from '../organisms/Topbar';
import { BottomNav } from '../organisms/BottomNav';

export interface StaffLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  staffName?: string;
  assignedArea?: string;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  children,
  currentPath = '/staff/tasks',
  onNavigate,
  staffName = 'Technician Cruz',
  assignedArea = 'Sinacaban - Zone 1',
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A] pb-18 md:pb-6">
      <Topbar
        title="Field Staff Portal"
        subtitle={assignedArea}
        userName={staffName}
        userRole="Field Technician"
        notificationCount={2}
      />

      <div className="flex flex-1 max-w-5xl w-full mx-auto">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className="hidden md:flex w-56 flex-col border-r border-slate-200 bg-white p-4">
          <div className="mb-4 px-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Field Operations
            </h4>
          </div>
          <nav className="space-y-1">
            {[
              { name: 'Assigned Tasks', path: '/staff/tasks' },
              { name: 'Scan Meter', path: '/staff/scan' },
              { name: 'Profile & Area', path: '/staff/profile' },
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

        {/* Operational Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="staff"
      />
    </div>
  );
};
