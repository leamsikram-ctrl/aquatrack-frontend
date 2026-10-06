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
    <div className="min-h-screen bg-white flex flex-col text-black text-sm pb-16 md:pb-6">
      <Topbar
        title="Field Staff Portal"
        subtitle={assignedArea}
        userName={staffName}
        userRole="Field Technician"
      />

      <div className="flex flex-1 max-w-4xl w-full mx-auto">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className="hidden md:flex w-56 flex-col border-r border-black/15 bg-white p-4">
          <div className="mb-4 px-2 text-sm font-bold text-black border-b border-black/10 pb-1">
            Field Operations
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
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1E6FD9] text-white font-bold'
                      : 'text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9]'
                  }`}
                >
                  {item.name}
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
        variant="staff"
      />
    </div>
  );
};
