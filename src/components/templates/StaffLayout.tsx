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
  staffName = 'Field Technician',
  assignedArea = 'Sinacaban Municipal Service',
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col text-black text-[10px] pb-14 md:pb-4">
      <Topbar
        title="Field Staff Portal"
        subtitle={assignedArea}
        userName={staffName}
        userRole="Field Technician"
      />

      <div className="flex flex-1 max-w-5xl w-full mx-auto">
        {/* Desktop Sidebar (>= 768px) */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-black/15 bg-white p-3">
          <div className="mb-3 px-2 text-[10px] font-bold text-black border-b border-black/10 pb-1 uppercase tracking-wider">
            Field Operations
          </div>
          <nav className="space-y-1">
            {[
              { name: 'Assigned Tasks', path: '/staff/tasks' },
              { name: 'Scan / Inspect Meter', path: '/staff/scan' },
              { name: 'Resolution History', path: '/staff/history' },
              { name: 'Staff Profile', path: '/staff/profile' },
            ].map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-medium transition-colors ${
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

      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        variant="staff"
      />
    </div>
  );
};
